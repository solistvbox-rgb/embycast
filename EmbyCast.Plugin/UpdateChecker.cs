using System;
using System.Collections.Generic;
using System.Linq;
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
        /// <summary>Download URL of the "EmbyCast.Plugin.dll.sig" release asset, if the release
        /// has one - see ReleaseSignature.</summary>
        public string SignatureUrl { get; set; }
        public string ReleaseNotes { get; set; }
        /// <summary>True when the found release is marked as pre-release (beta) on GitHub - only
        /// possible with the "Offer beta versions" setting on.</summary>
        public bool IsPreRelease { get; set; }
        public string Error { get; set; }
    }

    public class InstallUpdateResult
    {
        public bool Success { get; set; }
        public string Message { get; set; }
    }

    /// <summary>
    /// Self-update mechanism via the GitHub Releases API. Polls
    /// GET /repos/{owner}/{repo}/releases/latest - or, with the "Offer beta versions" setting
    /// (PluginConfiguration.IncludePreReleases), the release list including pre-releases, picking
    /// the highest version (unauthenticated - only works because the repo
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
        /// <summary>Release list incl. pre-releases (newest first) - used with the beta setting on.</summary>
        private const string ReleasesUrl = "https://api.github.com/repos/solistvbox-rgb/embycast/releases?per_page=20";
        private const string DllAssetName = "EmbyCast.Plugin.dll";
        // 7 days: releases are rare, so the silent check doesn't need to ask GitHub more often.
        // The manual "Check for Updates" button calls InvalidateCache() first and always asks
        // GitHub fresh.
        private static readonly TimeSpan CacheTtl = TimeSpan.FromDays(7);
        /// <summary>A FAILED check (network down, GitHub rate limit, ...) is only cached this long
        /// - otherwise one transient failure would pin the dashboard's update badge to the error
        /// for a whole week. Still long enough that repeated page loads during an outage don't
        /// hammer the API.</summary>
        private static readonly TimeSpan ErrorCacheTtl = TimeSpan.FromMinutes(15);

        private static UpdateCheckResult _cached;
        private static bool _cachedIncludePreReleases;
        private static DateTime _cacheTime = DateTime.MinValue;
        private static readonly object _lock = new object();

        public static void InvalidateCache()
        {
            lock (_lock) { _cached = null; _cacheTime = DateTime.MinValue; }
        }

        /// <summary>The version of the plugin assembly actually loaded and running on the server
        /// right now - same source used for the "current version" shown by the self-update check
        /// below, and also exposed via EmbyCastApi's GetPluginVersion route, which the dashboard
        /// shell (config.js) uses to load the matching app.html/app.js.</summary>
        public static string GetCurrentVersion() =>
            typeof(Plugin).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?.InformationalVersion
                ?? typeof(Plugin).Assembly.GetName().Version?.ToString()
                ?? "0.0.0";

        private static bool IncludePreReleases()
        {
            try { return Plugin.Instance?.Configuration?.IncludePreReleases == true; }
            catch { return false; }
        }

        public static async Task<UpdateCheckResult> CheckAsync()
        {
            var includePreReleases = IncludePreReleases();
            lock (_lock)
            {
                // A cached result for the other channel (setting just switched) doesn't count.
                if (_cached != null && _cachedIncludePreReleases == includePreReleases)
                {
                    var ttl = string.IsNullOrEmpty(_cached.Error) ? CacheTtl : ErrorCacheTtl;
                    if ((DateTime.UtcNow - _cacheTime) < ttl) return _cached;
                }
            }

            var currentVersion = GetCurrentVersion();

            UpdateCheckResult result;
            try
            {
                using (var http = new HttpClient())
                {
                    http.DefaultRequestHeaders.UserAgent.ParseAdd("EmbyCast-Plugin/1.0");
                    http.Timeout = TimeSpan.FromSeconds(10);
                    var json = await http.GetStringAsync(includePreReleases ? ReleasesUrl : ApiUrl).ConfigureAwait(false);
                    result = includePreReleases ? ParseListAndCompare(currentVersion, json) : ParseAndCompare(currentVersion, json);
                }
            }
            catch (Exception ex)
            {
                result = new UpdateCheckResult { CurrentVersion = currentVersion, Error = ex.Message };
            }

            lock (_lock) { _cached = result; _cacheTime = DateTime.UtcNow; _cachedIncludePreReleases = includePreReleases; }
            return result;
        }

        /// <summary>Beta channel: picks the highest-versioned published release (stable or
        /// pre-release, drafts skipped) from GitHub's release list.</summary>
        internal static UpdateCheckResult ParseListAndCompare(string currentVersion, string json)
        {
            try
            {
                using (var doc = JsonDocument.Parse(json))
                {
                    JsonElement best = default(JsonElement);
                    string bestVersion = null;
                    foreach (var release in doc.RootElement.EnumerateArray())
                    {
                        JsonElement el;
                        if (release.TryGetProperty("draft", out el) && el.ValueKind == JsonValueKind.True) continue;
                        if (!release.TryGetProperty("tag_name", out el) || el.ValueKind != JsonValueKind.String) continue;
                        var version = el.GetString().TrimStart('v');
                        if (bestVersion == null || CompareVersions(version, bestVersion) > 0)
                        {
                            bestVersion = version;
                            best = release;
                        }
                    }
                    if (bestVersion == null)
                        return new UpdateCheckResult { CurrentVersion = currentVersion, Error = "No release found" };
                    return ParseRelease(currentVersion, best);
                }
            }
            catch (Exception ex)
            {
                return new UpdateCheckResult { CurrentVersion = currentVersion, Error = ex.Message };
            }
        }

        internal static UpdateCheckResult ParseAndCompare(string currentVersion, string json)
        {
            try
            {
                using (var doc = JsonDocument.Parse(json))
                    return ParseRelease(currentVersion, doc.RootElement);
            }
            catch (Exception ex)
            {
                return new UpdateCheckResult { CurrentVersion = currentVersion, Error = ex.Message };
            }
        }

        private static UpdateCheckResult ParseRelease(string currentVersion, JsonElement root)
        {
            var result = new UpdateCheckResult { CurrentVersion = currentVersion };
            try
            {
                JsonElement el;
                string tagName = null;
                if (root.TryGetProperty("tag_name", out el)) tagName = el.GetString();
                if (root.TryGetProperty("body", out el)) result.ReleaseNotes = el.GetString();
                if (root.TryGetProperty("prerelease", out el)) result.IsPreRelease = el.ValueKind == JsonValueKind.True;

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

                        if (string.Equals(assetName, ReleaseSignature.SignatureAssetName, StringComparison.OrdinalIgnoreCase))
                        {
                            result.SignatureUrl = urlEl.GetString();
                            continue;
                        }

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

                result.UpdateAvailable = CompareVersions(versionStr, currentVersion) > 0;
            }
            catch (Exception ex) { result.Error = ex.Message; }
            return result;
        }

        /// <summary>Compares "1.3.0", "1.3.0-beta.2" etc. like semantic versioning: numbers first,
        /// then a version without pre-release suffix is higher than one with
        /// (1.3.0-beta.1 &lt; 1.3.0-beta.2 &lt; 1.3.0 &lt; 1.3.1). Pre-release parts are compared
        /// dot by dot, numbers numerically. Build metadata ("+...") is ignored.</summary>
        internal static int CompareVersions(string a, string b)
        {
            string preA, preB;
            var numA = ParseNumbers(a, out preA);
            var numB = ParseNumbers(b, out preB);
            for (var i = 0; i < Math.Max(numA.Count, numB.Count); i++)
            {
                var x = i < numA.Count ? numA[i] : 0;
                var y = i < numB.Count ? numB[i] : 0;
                if (x != y) return x.CompareTo(y);
            }
            if (preA.Length == 0 || preB.Length == 0)
                return preA.Length == 0 ? (preB.Length == 0 ? 0 : 1) : -1;

            var partsA = preA.Split('.');
            var partsB = preB.Split('.');
            for (var i = 0; i < Math.Min(partsA.Length, partsB.Length); i++)
            {
                long na, nb;
                var isNumA = long.TryParse(partsA[i], out na);
                var isNumB = long.TryParse(partsB[i], out nb);
                int c;
                if (isNumA && isNumB) c = na.CompareTo(nb);
                else if (isNumA != isNumB) c = isNumA ? -1 : 1;
                else c = string.CompareOrdinal(partsA[i].ToLowerInvariant(), partsB[i].ToLowerInvariant());
                if (c != 0) return c;
            }
            return partsA.Length.CompareTo(partsB.Length);
        }

        private static List<long> ParseNumbers(string version, out string preRelease)
        {
            var v = (version ?? "").Trim().TrimStart('v', 'V');
            var plus = v.IndexOf('+');
            if (plus >= 0) v = v.Substring(0, plus);
            var dash = v.IndexOf('-');
            preRelease = dash >= 0 ? v.Substring(dash + 1) : "";
            if (dash >= 0) v = v.Substring(0, dash);
            return v.Split('.').Select(p => { long n; return long.TryParse(p, out n) ? n : 0; }).ToList();
        }
    }
}
