using System;
using System.Net.Http;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;

namespace EmbyCast.Plugin
{
    public class UpdateCheckResult
    {
        public bool UpdateAvailable { get; set; }
        public string CurrentVersion { get; set; }
        public string LatestVersion { get; set; }
        public string DownloadUrl { get; set; }
        /// <summary>SHA-256 hex digest read straight off the DLL asset's own "digest" field in
        /// the GitHub API response (GitHub computes and exposes this automatically for every
        /// uploaded release asset). Null if the API response has no digest for this asset (e.g. a
        /// GitHub Enterprise instance that doesn't support it).</summary>
        public string ExpectedSha256 { get; set; }
        public bool ChecksumAvailable => !string.IsNullOrEmpty(ExpectedSha256);
        public string ReleaseNotes { get; set; }
        public string Error { get; set; }
    }

    public class InstallUpdateResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
    }

    /// <summary>
    /// Self-update mechanism via the GitHub Releases API - same approach as the EmbyNotify /
    /// EmbyWeeklyDigest reference plugins by SFTech13. Polls
    /// GET /repos/{owner}/{repo}/releases/latest (unauthenticated - only works because the repo
    /// is public; a private repo would need a token on every request, which this deliberately
    /// does not support to avoid storing a GitHub credential in plugin config), compares the
    /// release's tag_name against the running assembly's version, and - if the release has an
    /// asset literally named "EmbyCast.Plugin.dll" - exposes its direct download
    /// URL so Plugin.InstallUpdateAsync() can fetch and install it.
    ///
    /// Integrity: HTTPS/TLS (the hard-coded API URL and every GitHub-provided download URL are
    /// always https://) protects the download in transit, but doesn't protect against the
    /// release asset itself being wrong or tampered with at the source (e.g. a compromised
    /// GitHub account - a checksum published in the same release as the asset can't defend
    /// against that either way, since an attacker with write access could fake both together;
    /// see README for that discussion). To at least catch corrupted/incomplete downloads and
    /// keep an explicit fail-closed check in place, a release is only considered installable if
    /// a SHA-256 digest is available for the DLL asset - read straight from the asset's own
    /// "digest" field in the GitHub API response (GitHub computes this automatically for every
    /// uploaded release asset, no extra upload needed). Plugin.InstallUpdateAsync() re-hashes the
    /// downloaded DLL and refuses to install it if the hashes don't match.
    /// </summary>
    public static class UpdateChecker
    {
        private const string ApiUrl = "https://api.github.com/repos/solistvbox-rgb/embycast/releases/latest";
        private const string DllAssetName = "EmbyCast.Plugin.dll";
        // Raised from 1 hour to 7 days at the user's request (2026-08-20) - they don't
        // change/update the plugin often enough for an hourly re-check to be worth the extra
        // GitHub API calls. The manual "Check for Updates" button is unaffected: it calls
        // InvalidateCache() first (see Plugin.InstallUpdateAsync/EmbyCastApi's manual-check
        // route), so it always hits the API fresh regardless of this value.
        private static readonly TimeSpan CacheTtl = TimeSpan.FromDays(7);

        private static UpdateCheckResult _cached;
        private static DateTime _cacheTime = DateTime.MinValue;
        private static readonly object _lock = new object();

        public static void InvalidateCache()
        {
            lock (_lock) { _cached = null; _cacheTime = DateTime.MinValue; }
        }

        /// <summary>The version of the plugin assembly actually loaded and running on the server
        /// right now - same source used for the "current version" shown by the self-update check
        /// below, and also exposed standalone via EmbyCastApi's GetPluginVersion route so the
        /// dashboard can detect when the browser is serving a stale cached copy of
        /// config.html/config.js from an older version and force a fresh reload (see
        /// checkForStaleClientAndReload() in config.js).</summary>
        public static string GetCurrentVersion() =>
            typeof(Plugin).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                ?? typeof(Plugin).Assembly.GetName().Version?.ToString()
                ?? "0.0.0";

        public static async Task<UpdateCheckResult> CheckAsync()
        {
            lock (_lock)
            {
                if (_cached != null && (DateTime.UtcNow - _cacheTime) < CacheTtl)
                    return _cached;
            }

            var currentVersion = GetCurrentVersion();

            UpdateCheckResult result;
            try
            {
                using (var http = new HttpClient())
                {
                    http.DefaultRequestHeaders.UserAgent.ParseAdd("EmbyCast-Plugin/1.0");
                    http.Timeout = TimeSpan.FromSeconds(10);
                    var json = await http.GetStringAsync(ApiUrl).ConfigureAwait(false);
                    result = ParseAndCompare(currentVersion, json);
                }
            }
            catch (Exception ex)
            {
                result = new UpdateCheckResult { CurrentVersion = currentVersion, Error = ex.Message };
            }

            lock (_lock) { _cached = result; _cacheTime = DateTime.UtcNow; }
            return result;
        }

        private static UpdateCheckResult ParseAndCompare(string currentVersion, string json)
        {
            var result = new UpdateCheckResult { CurrentVersion = currentVersion };
            try
            {
                using (var doc = JsonDocument.Parse(json))
                {
                    var root = doc.RootElement;
                    JsonElement el;
                    string tagName = null;
                    if (root.TryGetProperty("tag_name", out el)) tagName = el.GetString();
                    if (root.TryGetProperty("body", out el)) result.ReleaseNotes = el.GetString();

                    if (string.IsNullOrEmpty(tagName)) { result.Error = "No tag in release data"; return result; }

                    var versionStr = tagName.TrimStart('v');
                    result.LatestVersion = versionStr;

                    JsonElement assets;
                    if (root.TryGetProperty("assets", out assets))
                    {
                        foreach (var asset in assets.EnumerateArray())
                        {
                            JsonElement nameEl, urlEl;
                            if (!asset.TryGetProperty("name", out nameEl)) continue;
                            var assetName = nameEl.GetString();
                            if (!asset.TryGetProperty("browser_download_url", out urlEl)) continue;

                            if (string.Equals(assetName, DllAssetName, StringComparison.OrdinalIgnoreCase))
                            {
                                result.DownloadUrl = urlEl.GetString();

                                // GitHub exposes a SHA-256 digest for every release asset
                                // automatically (format "sha256:<hex>") - no separate uploaded
                                // checksum file needed.
                                JsonElement digestEl;
                                if (asset.TryGetProperty("digest", out digestEl) && digestEl.ValueKind == JsonValueKind.String)
                                {
                                    var digest = digestEl.GetString();
                                    const string prefix = "sha256:";
                                    if (!string.IsNullOrEmpty(digest) && digest.StartsWith(prefix, StringComparison.OrdinalIgnoreCase))
                                    {
                                        result.ExpectedSha256 = digest.Substring(prefix.Length);
                                    }
                                }
                            }
                        }
                    }

                    Version current, latest;
                    if (Version.TryParse(Normalize(currentVersion), out current) &&
                        Version.TryParse(Normalize(versionStr), out latest))
                    {
                        result.UpdateAvailable = latest > current;
                    }
                }
            }
            catch (Exception ex) { result.Error = ex.Message; }
            return result;
        }

        private static string Normalize(string v)
        {
            if (v == null) return "0.0";
            var dash = v.IndexOf('-');
            if (dash >= 0) v = v.Substring(0, dash);
            return v.Split('.').Length < 2 ? v + ".0" : v;
        }
    }
}
