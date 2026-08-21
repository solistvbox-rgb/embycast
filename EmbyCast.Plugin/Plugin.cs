using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Reflection;
using System.Security.Cryptography;
using System.Threading.Tasks;
using EmbyCast.Plugin.Configuration;
using EmbyCast.Plugin.Services;
using EmbyCast.Plugin.Storage;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Common.Plugins;
using MediaBrowser.Controller;
using MediaBrowser.Model.Drawing;
using MediaBrowser.Model.Logging;
using MediaBrowser.Model.Plugins;
using MediaBrowser.Model.Serialization;

namespace EmbyCast.Plugin
{
    /// <summary>
    /// Plugin entry point / DI root. Owns the long-lived service instances (store, delivery,
    /// timer, media news) and exposes the dashboard config pages. Background task lifecycle
    /// (subscribing to session events, starting/stopping the scheduled-message and media-news
    /// polling loops) lives in <see cref="EmbyCastEntryPoint"/> (IServerEntryPoint), which is
    /// the correct place for start/stop hooks per the Emby plugin architecture - Plugin itself
    /// has no Run()/Dispose() lifecycle hook for background work.
    /// </summary>
    public class Plugin : BasePlugin<PluginConfiguration>, IHasWebPages, IHasThumbImage
    {
        private readonly IServerApplicationHost _applicationHost;
        private readonly ILogger _logger;

        public static Plugin Instance { get; private set; }

        public MessageStore Store { get; }
        public DeliveryService Delivery { get; }
        public TimerService Timer { get; }
        public MediaNewsService MediaNews { get; }

        public Plugin(
            IApplicationPaths appPaths,
            IXmlSerializer xmlSerializer,
            IServerApplicationHost applicationHost,
            ILogManager logManager)
            : base(appPaths, xmlSerializer)
        {
            Instance = this;
            _applicationHost = applicationHost;
            _logger = logManager.GetLogger(nameof(Plugin));

            Store = new MessageStore(appPaths, logManager);
            Delivery = new DeliveryService(applicationHost, Store, logManager, () => Configuration);
            Timer = new TimerService(Delivery, Store, applicationHost, logManager);
            MediaNews = new MediaNewsService(logManager);

            MigrateLegacySeriesMode();
        }

        /// <summary>
        /// One-time migration: "Series entries" used to be a single either/or choice
        /// (PluginConfiguration.MediaNewsSeriesMode, "NewSeries"|"NewEpisodes") and is now two
        /// independent checkboxes (MediaNewsIncludeNewSeries/MediaNewsIncludeNewEpisodes), so
        /// both can be selected together. An admin who explicitly saved "NewEpisodes" under the
        /// old radio-button UI would otherwise silently lose that choice, since the new bool
        /// fields aren't present in an already-saved, pre-split config file and would just come
        /// back as their own defaults (true/false) on first load post-update - this reproduces
        /// their old selection once, then blanks the legacy field so it only ever runs once
        /// (an admin unchecking "New episodes" afterward stays unchecked across restarts).
        /// BasePlugin&lt;T&gt; loads Configuration from disk before the derived constructor body
        /// runs, same assumption other Emby plugins in this codebase's lineage (EmbyNotify /
        /// EmbyWeeklyDigest) already rely on for constructor-time config access - wrapped in
        /// try/catch regardless, since a failed migration should never prevent the plugin from
        /// loading.
        /// </summary>
        private void MigrateLegacySeriesMode()
        {
            try
            {
                var config = Configuration;
                if (string.IsNullOrEmpty(config.MediaNewsSeriesMode)) return;

                if (string.Equals(config.MediaNewsSeriesMode, "NewEpisodes", StringComparison.OrdinalIgnoreCase))
                {
                    config.MediaNewsIncludeNewSeries = false;
                    config.MediaNewsIncludeNewEpisodes = true;
                }
                // else "NewSeries" (or anything unrecognized): matches the new fields' own
                // defaults already, nothing to change.

                config.MediaNewsSeriesMode = null;
                SaveConfiguration();
            }
            catch (Exception ex)
            {
                _logger.Warn("EmbyCast: legacy series-mode migration failed (non-fatal): {0}", ex.Message);
            }
        }

        public override string Name => "EmbyCast";
        public override Guid Id => new Guid("0245cf9a-831e-41cf-b49c-1d5c5705f572");
        public override string Description =>
            "Send instant, scheduled, countdown/timer, media-news, welcome and offline messages to your Emby users from one dashboard page.";

        /// <summary>Logo shown on Dashboard -> Plugins, embedded directly as thumb.png (same
        /// embedded-resource pattern as the EmbyNotify / EmbyWeeklyDigest reference plugins) so
        /// this can reuse their confirmed-working ImageFormat.Png value rather than guessing at
        /// an unverified enum member for JPEG.</summary>
        public Stream GetThumbImage() =>
            GetType().Assembly.GetManifestResourceStream("EmbyCast.Plugin.thumb.png");

        public ImageFormat ThumbImageFormat => ImageFormat.Png;

        public IEnumerable<PluginPageInfo> GetPages()
        {
            return new[]
            {
                new PluginPageInfo
                {
                    Name = "EmbyCast",
                    EmbeddedResourcePath = $"{GetType().Namespace}.Configuration.Web.config.html",
                    IsMainConfigPage = true,
                    // Pins the page directly into the dashboard's left-hand "Advanced" menu
                    // (instead of only being reachable via Advanced -> Plugins -> pick this
                    // plugin -> Settings). EnableInMainMenu/MenuIcon/DisplayName are the
                    // properties other Emby plugins (e.g. notification/sync plugins) commonly
                    // use for this; if your installed SDK version names/exposes them
                    // differently you'll get a compile error here naming the exact property -
                    // just adjust or drop the offending one.
                    EnableInMainMenu = true,
                    MenuIcon = "notifications",
                    DisplayName = "EmbyCast"
                },
                new PluginPageInfo
                {
                    Name = "embycastconfig",
                    EmbeddedResourcePath = $"{GetType().Namespace}.Configuration.Web.config.js"
                }
            };
        }

        /// <summary>IServerApplicationHost is protected-ish elsewhere; services that need to
        /// resolve managers on demand (fresh, not cached) receive it directly in their
        /// constructors instead of going through this property, but EmbyCastEntryPoint needs
        /// it too to build the background services, so it's exposed here.</summary>
        public IServerApplicationHost ApplicationHost => _applicationHost;

        public ILogger Logger => _logger;

        /// <summary>BasePlugin.SaveConfiguration() is protected; this wraps it so services
        /// (which are plain classes, not subclasses of Plugin) can persist configuration
        /// changes such as MediaNewsLastAutoSentUtc.</summary>
        public void PersistConfiguration(PluginConfiguration config)
        {
            SaveConfiguration();
        }

        /// <summary>
        /// Self-update: downloads the latest GitHub release's DLL asset (see UpdateChecker.cs)
        /// and atomically swaps it in for the currently-loaded plugin DLL on disk. Mirrors the
        /// EmbyNotify/EmbyWeeklyDigest reference plugins' approach exactly, including the
        /// .bak-then-swap sequence (so a failed write can't leave the plugin folder without a
        /// working DLL) and the best-effort, reflection-based call to the host's
        /// "NotifyPendingRestart" method - that method isn't part of the stable public SDK
        /// surface used elsewhere in this plugin, so reflection avoids a hard compile-time
        /// dependency on an exact signature/availability that can vary by Emby Server build; if
        /// it's missing or fails, the update still installs correctly, the admin just won't see
        /// Emby's built-in "restart pending" banner and should restart manually to load the new
        /// DLL (the InstallUpdateResult.Message returned below says so either way).
        ///
        /// Integrity check: HTTPS protects the download in transit but not against the release
        /// asset itself being wrong at the source, so before anything is written to disk this
        /// compares a freshly computed SHA-256 of the downloaded bytes against the expected hash
        /// in UpdateChecker.ExpectedSha256 (read straight from GitHub's own automatic asset
        /// digest, no extra request needed). A release with no digest available, or one that
        /// doesn't match, is refused rather than silently installed.
        /// </summary>
        internal async Task<InstallUpdateResult> InstallUpdateAsync()
        {
            var result = new InstallUpdateResult();
            try
            {
                UpdateChecker.InvalidateCache();
                var check = await UpdateChecker.CheckAsync().ConfigureAwait(false);

                if (!check.UpdateAvailable)
                {
                    result.Message = "No update available.";
                    return result;
                }

                if (string.IsNullOrEmpty(check.DownloadUrl))
                {
                    result.Message = "No download URL found in release.";
                    return result;
                }

                if (!check.ChecksumAvailable)
                {
                    result.Message = "No checksum available for this release (GitHub's own asset digest is missing) - refusing to install an unverified update. Install the DLL manually instead.";
                    return result;
                }

                // Defense-in-depth domain check (added 2026-08-20): check.DownloadUrl comes
                // straight from GitHub's own API response (UpdateChecker's "browser_download_url"
                // field), so this doesn't protect against a compromised GitHub account - the
                // SHA-256 checksum verified below comes from that same API response, so an
                // attacker with write access to the repo could tamper with both together anyway
                // (see UpdateChecker.cs's class doc for that discussion). What this DOES catch is
                // a download URL that ends up pointing somewhere unexpected due to a future bug
                // elsewhere in the parsing/plumbing. Only the pre-redirect host is checked here -
                // GitHub's browser_download_url itself resolves on github.com, but actually
                // fetching it 302-redirects to a signed, rotating CDN URL (a
                // *.githubusercontent.com-style domain) for the real file bytes; HttpClient
                // follows that redirect automatically and correctly, so it must NOT also be
                // whitelisted here - locking down that redirect target would break every future
                // update the moment GitHub rotates its CDN domain.
                if (!Uri.TryCreate(check.DownloadUrl, UriKind.Absolute, out var downloadUri) ||
                    !string.Equals(downloadUri.Host, "github.com", StringComparison.OrdinalIgnoreCase))
                {
                    result.Message = "Download URL did not point to github.com - refusing to install for safety.";
                    return result;
                }

                var currentDll = typeof(Plugin).Assembly.Location;
                if (string.IsNullOrEmpty(currentDll) || !File.Exists(currentDll))
                    currentDll = Path.Combine(ApplicationPaths.PluginsPath, "EmbyCast.Plugin.dll");

                if (!File.Exists(currentDll))
                {
                    result.Message = "Could not locate plugin DLL.";
                    return result;
                }

                var tempPath = currentDll + ".temp";
                var bakPath = currentDll + ".bak";

                byte[] dllBytes;
                string expectedChecksum = check.ExpectedSha256; // straight from GitHub's asset digest
                using (var http = new HttpClient())
                {
                    http.DefaultRequestHeaders.UserAgent.ParseAdd("EmbyCast-Plugin/1.0");
                    http.Timeout = TimeSpan.FromSeconds(60);
                    dllBytes = await http.GetByteArrayAsync(check.DownloadUrl).ConfigureAwait(false);
                }

                if (dllBytes.Length < 1024)
                {
                    result.Message = $"Downloaded file too small ({dllBytes.Length} bytes). Aborting.";
                    return result;
                }

                if (string.IsNullOrEmpty(expectedChecksum))
                {
                    result.Message = "Checksum was empty or unreadable - refusing to install an unverified update.";
                    return result;
                }

                string actualChecksum;
                using (var sha256 = SHA256.Create())
                {
                    actualChecksum = BitConverter.ToString(sha256.ComputeHash(dllBytes)).Replace("-", "");
                }

                if (!string.Equals(expectedChecksum, actualChecksum, StringComparison.OrdinalIgnoreCase))
                {
                    _logger.Error("EmbyCast InstallUpdate: checksum mismatch (expected {0}, got {1}).", expectedChecksum, actualChecksum);
                    result.Message = "Checksum mismatch - the downloaded file does not match the expected SHA-256, so it was NOT installed. This could mean a corrupted download; try again, and if it keeps failing, check the release assets on GitHub.";
                    return result;
                }

                File.WriteAllBytes(tempPath, dllBytes);
                try
                {
                    if (File.Exists(bakPath)) File.Delete(bakPath);
                    File.Move(currentDll, bakPath);
                    File.Move(tempPath, currentDll);
                    try { File.Delete(bakPath); } catch { }
                }
                catch
                {
                    try { if (File.Exists(bakPath) && !File.Exists(currentDll)) File.Move(bakPath, currentDll); } catch { }
                    try { File.Delete(tempPath); } catch { }
                    throw;
                }

                UpdateChecker.InvalidateCache();

                try
                {
                    var notifyMethod = _applicationHost.GetType().GetMethod(
                        "NotifyPendingRestart",
                        BindingFlags.Public | BindingFlags.Instance);
                    notifyMethod?.Invoke(_applicationHost, null);
                }
                catch (Exception ex)
                {
                    _logger.Warn("EmbyCast: NotifyPendingRestart failed: {0}", ex.Message);
                }

                result.Success = true;
                result.Message = $"Updated to v{check.LatestVersion} ({dllBytes.Length:N0} bytes). Restart Emby to apply.";
            }
            catch (Exception ex)
            {
                _logger.Error("EmbyCast InstallUpdate failed: {0}", ex.Message);
                result.Message = "Install failed: " + ex.Message;
            }
            return result;
        }
    }
}
