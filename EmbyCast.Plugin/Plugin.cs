using System;
using System.Collections.Generic;
using System.IO;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading;
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

            // NOTE: Configuration must NOT be touched in this constructor. Emby assigns the
            // plugin's file path (which BasePlugin needs to locate the config XML) only AFTER
            // constructing it, so reading Configuration here throws ArgumentNullException
            // ("path2") inside BasePlugin.LoadConfiguration - confirmed on Emby 4.11.0.3, and the
            // reason the series-mode migration below silently never ran from here. One-time
            // migrations therefore run from RunStartupMigrations(), called by
            // EmbyCastEntryPoint.Run().
        }

        private int _migrationsRan;

        /// <summary>One-time data migrations that need Configuration. Called from
        /// EmbyCastEntryPoint.Run() - after Emby has fully initialized the plugin, and before the
        /// background loops start, so e.g. the media-news scheduler already sees the migrated
        /// last-sent timestamp on its first tick. Safe to call more than once (runs only the
        /// first time); each migration is individually non-fatal.</summary>
        internal void RunStartupMigrations()
        {
            if (Interlocked.Exchange(ref _migrationsRan, 1) == 1) return;

            MigrateLegacySeriesMode();

            try
            {
                Store.MigrateMediaNewsLastAutoSentUtc(Configuration.MediaNewsLastAutoSentUtc);
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: media-news last-sent migration failed (non-fatal).", ex);
            }
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
        /// Runs from RunStartupMigrations() (see the constructor's note for why not from the
        /// constructor) - wrapped in try/catch regardless, since a failed migration should never
        /// prevent the plugin from loading.
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
                _logger.ErrorException("EmbyCast: legacy series-mode migration failed (non-fatal).", ex);
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

        /// <summary>
        /// Called by Emby's InstallationManager right before it removes the plugin (Dashboard ->
        /// Plugins -> Uninstall) - part of the standard IPlugin contract (BasePlugin&lt;T&gt;
        /// declares it virtual specifically for this). Emby's own uninstall flow only ever
        /// deletes the plugin's own DLL file - it does NOT touch anything else the plugin created
        /// (see MediaBrowser/Emby's InstallationManager.UninstallPlugin), so without this override
        /// both embycast-store.json (message history, scheduled messages, groups, welcomed-user
        /// tracking) and the plugin's configuration XML would silently survive an uninstall,
        /// ready to be picked up again by a future reinstall. That's Emby's deliberate default
        /// (most plugins want settings preserved across a reinstall) but not what's wanted here -
        /// added 2026-08 at the user's explicit request for a clean "everything gone" uninstall.
        /// Each half is wrapped in its own try/catch so one failing (e.g. a locked file) never
        /// blocks the other, and neither is allowed to throw out of this method - a plugin
        /// misbehaving here should never be able to prevent Emby from completing the uninstall.
        /// </summary>
        public override void OnUninstalling()
        {
            base.OnUninstalling();

            // Background loops keep running until the server restarts; from here on neither the
            // store (see MessageStore.DeleteStoreFile) nor MutateConfiguration may write again,
            // or they'd recreate the files deleted below.
            _uninstalling = true;
            Store.DeleteStoreFile();

            try
            {
                // "EmbyCast.Plugin.xml" is the actual, confirmed-on-a-real-installation filename
                // Emby saves this plugin's configuration under in plugins/configurations/ (matches
                // the assembly name, EmbyCast.Plugin.dll) - hardcoded rather than derived via
                // reflection since the SDK version pinned here (mediabrowser.server.core 4.8.0.80)
                // doesn't expose a ConfigurationFilePath member on IPlugin/BasePlugin to read it
                // back from directly.
                var configXmlPath = Path.Combine(ApplicationPaths.PluginConfigurationsPath, "EmbyCast.Plugin.xml");
                if (File.Exists(configXmlPath)) File.Delete(configXmlPath);
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: failed to delete configuration XML during uninstall.", ex);
            }
        }

        /// <summary>IServerApplicationHost is protected-ish elsewhere; services that need to
        /// resolve managers on demand (fresh, not cached) receive it directly in their
        /// constructors instead of going through this property, but EmbyCastEntryPoint needs
        /// it too to build the background services, so it's exposed here.</summary>
        public IServerApplicationHost ApplicationHost => _applicationHost;

        public ILogger Logger => _logger;

        private readonly object _configLock = new object();
        private volatile bool _uninstalling;

        /// <summary>Applies a targeted change to the live configuration and saves it, serialized
        /// with every other change made through here - so two dashboard requests can't
        /// interleave their mutate/save steps. Every write in this plugin changes only the
        /// fields it owns; the dashboard deliberately no longer uses Emby's generic
        /// updatePluginConfiguration(), which posted back the WHOLE configuration as loaded when
        /// the page was opened and thereby reverted anything changed since (by another tab or
        /// another endpoint). BasePlugin.SaveConfiguration() is protected, which is also why
        /// plain service classes go through this method.</summary>
        public void MutateConfiguration(Action<PluginConfiguration> mutate)
        {
            lock (_configLock)
            {
                mutate(Configuration);
                if (!_uninstalling) SaveConfiguration();
            }
        }

        /// <summary>
        /// Self-update: downloads the latest GitHub release's DLL asset (see UpdateChecker.cs)
        /// and atomically swaps it in for the currently-loaded plugin DLL on disk. Mirrors the
        /// EmbyNotify/EmbyWeeklyDigest reference plugins' approach exactly, including the
        /// .bak-then-swap sequence (so a failed write can't leave the plugin folder without a
        /// working DLL) and the best-effort call to IApplicationHost.NotifyPendingRestart(); if
        /// that fails, the update is still installed, the admin just won't see Emby's built-in
        /// "restart pending" banner and should restart manually to load the new DLL (the
        /// InstallUpdateResult.Message returned below says so either way).
        ///
        /// Integrity check: HTTPS protects the download in transit but not against the release
        /// asset itself being wrong at the source, so before anything is written to disk this
        /// compares a freshly computed SHA-256 of the downloaded bytes against the expected hash
        /// in UpdateChecker.ExpectedSha256 (read straight from GitHub's own automatic asset
        /// digest, no extra request needed). A release with no digest available, or one that
        /// doesn't match, is refused rather than silently installed.
        ///
        /// Concurrency: guarded by _installLock - two overlapping installs (double-click, two admin
        /// tabs) shared the same .temp/.bak paths, and the second could delete the first one's
        /// .bak (the only copy of the original DLL) mid-swap. A second request while one is
        /// running is refused immediately rather than queued.
        ///
        /// Signature: if ReleaseSignature has a public key configured, the release must also
        /// carry a valid "EmbyCast.Plugin.dll.sig" - unlike the checksum, that can't be forged
        /// by someone who only controls the GitHub account/repo. See ReleaseSignature.cs.
        /// </summary>
        internal async Task<InstallUpdateResult> InstallUpdateAsync()
        {
            if (!await _installLock.WaitAsync(0).ConfigureAwait(false))
                return new InstallUpdateResult { Message = "An update is already being installed - please wait for it to finish." };
            try
            {
                return await InstallUpdateCoreAsync().ConfigureAwait(false);
            }
            finally
            {
                _installLock.Release();
            }
        }

        private static readonly SemaphoreSlim _installLock = new SemaphoreSlim(1, 1);

        private static bool IsGitHubUrl(string url, out Uri uri) =>
            Uri.TryCreate(url, UriKind.Absolute, out uri) &&
            uri.Scheme == Uri.UriSchemeHttps &&
            string.Equals(uri.Host, "github.com", StringComparison.OrdinalIgnoreCase);

        private async Task<InstallUpdateResult> InstallUpdateCoreAsync()
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
                if (!IsGitHubUrl(check.DownloadUrl, out _))
                {
                    result.Message = "Download URL did not point to https://github.com - refusing to install for safety.";
                    return result;
                }

                if (ReleaseSignature.IsConfigured)
                {
                    if (string.IsNullOrEmpty(check.SignatureUrl))
                    {
                        result.Message = $"This release has no signature ({ReleaseSignature.SignatureAssetName}) - refusing to install an unsigned update. Install the DLL manually if you trust it.";
                        return result;
                    }
                    if (!IsGitHubUrl(check.SignatureUrl, out _))
                    {
                        result.Message = "Signature URL did not point to https://github.com - refusing to install for safety.";
                        return result;
                    }
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
                string signatureText = null;
                string expectedChecksum = check.ExpectedSha256; // straight from GitHub's asset digest
                using (var http = new HttpClient())
                {
                    http.DefaultRequestHeaders.UserAgent.ParseAdd("EmbyCast-Plugin/1.0");
                    http.Timeout = TimeSpan.FromSeconds(60);
                    dllBytes = await http.GetByteArrayAsync(check.DownloadUrl).ConfigureAwait(false);
                    if (ReleaseSignature.IsConfigured)
                        signatureText = await http.GetStringAsync(check.SignatureUrl).ConfigureAwait(false);
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

                if (ReleaseSignature.IsConfigured && !ReleaseSignature.Verify(dllBytes, signatureText))
                {
                    _logger.Error("EmbyCast InstallUpdate: release signature is invalid for v{0} - update refused.", check.LatestVersion);
                    result.Message = "Signature check failed - the downloaded DLL was not signed with the EmbyCast release key, so it was NOT installed. Do not install this release manually either until you know why.";
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
                    // Shows Emby's own "restart pending" banner in the dashboard. Part of
                    // IApplicationHost in the SDK this compiles against, so called directly
                    // rather than looked up via reflection.
                    _applicationHost.NotifyPendingRestart();
                }
                catch (Exception ex)
                {
                    _logger.ErrorException("EmbyCast: NotifyPendingRestart failed (update is installed anyway).", ex);
                }

                result.Success = true;
                result.Message = $"Updated to v{check.LatestVersion} ({dllBytes.Length:N0} bytes). Restart Emby to apply.";
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast InstallUpdate failed.", ex);
                result.Message = "Install failed - see the Emby server log for details. The previously installed version was kept.";
            }
            return result;
        }
    }
}
