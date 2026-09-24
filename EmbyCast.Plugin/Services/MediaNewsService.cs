using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using EmbyCast.Plugin.Models;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Entities;
using MediaBrowser.Model.Logging;
using MediaBrowser.Model.Querying;

namespace EmbyCast.Plugin.Services
{
    public class LibraryOption
    {
        public string Id { get; set; }
        public string Name { get; set; }
        /// <summary>Emby's configured content type for this library folder
        /// (VirtualFolderInfo.CollectionType) - e.g. "movies", "tvshows", "music",
        /// "audiobooks", "boxsets", "mixed", or null/empty for an unset/"mixed content"
        /// folder. Surfaced to the dashboard so admins can tell which libraries actually
        /// feed Media News (only "movies"/"tvshows"/mixed/unset ever can - Media News only
        /// ever queries for Movie and Series items, so a library Emby itself scans purely
        /// as e.g. music or audiobooks can never contribute, no matter what's selected).</summary>
        public string ContentType { get; set; }
    }

    public class MediaNewsResult
    {
        public List<string> Movies { get; } = new List<string>();
        /// <summary>Newly added series (name + year only). Populated when includeNewSeries was
        /// true; independent of Episodes below - both can be populated at once.</summary>
        public List<string> Series { get; } = new List<string>();
        /// <summary>Individual newly added episodes, each already formatted per the admin's
        /// template. Populated when includeNewEpisodes was true; independent of Series above.</summary>
        public List<string> Episodes { get; } = new List<string>();
        public bool IsEmpty => Movies.Count == 0 && Series.Count == 0 && Episodes.Count == 0;

        // The library items behind each line above, index-aligned with Movies/Series/Episodes,
        // so the digest can be narrowed per recipient (see FilterForUser). Not serialized - the
        // API only ever returns counts/text built from this, never the result object itself.
        private readonly List<BaseItem> _movieItems = new List<BaseItem>();
        private readonly List<BaseItem> _seriesItems = new List<BaseItem>();
        private readonly List<BaseItem> _episodeItems = new List<BaseItem>();

        internal void AddMovie(string line, BaseItem item) { Movies.Add(line); _movieItems.Add(item); }
        internal void AddSeries(string line, BaseItem item) { Series.Add(line); _seriesItems.Add(item); }
        internal void AddEpisode(string line, BaseItem item) { Episodes.Add(line); _episodeItems.Add(item); }

        /// <summary>Returns a copy containing only the entries this user may actually see -
        /// library access and parental rating, via BaseItem.IsVisibleStandalone (which also
        /// checks the item's parent folders, i.e. whether the user has access to its library).
        /// The digest itself is built without any user context, so without this a broadcast to
        /// "All" would reveal titles from restricted libraries to every recipient. Fails closed:
        /// an item whose visibility check throws is left out.</summary>
        public MediaNewsResult FilterForUser(User user)
        {
            var filtered = new MediaNewsResult();
            if (user == null) return filtered;
            for (var i = 0; i < Movies.Count; i++)
                if (IsVisible(_movieItems[i], user)) filtered.AddMovie(Movies[i], _movieItems[i]);
            for (var i = 0; i < Series.Count; i++)
                if (IsVisible(_seriesItems[i], user)) filtered.AddSeries(Series[i], _seriesItems[i]);
            for (var i = 0; i < Episodes.Count; i++)
                if (IsVisible(_episodeItems[i], user)) filtered.AddEpisode(Episodes[i], _episodeItems[i]);
            return filtered;
        }

        private static bool IsVisible(BaseItem item, User user)
        {
            try { return item != null && item.IsVisibleStandalone(user); }
            catch { return false; }
        }
    }

    public class MediaNewsSendResult
    {
        public bool Skipped { get; set; }
        /// <summary>True only when Skipped is also true AND the specific reason was "no library
        /// selected" (as opposed to "no new media found in the selected period, in an otherwise
        /// valid library selection"). Lets the dashboard show this particular case as an error
        /// (red) while still showing the "nothing new" case as informational (green) - see
        /// config.js's ".medianews-send" click handler.</summary>
        public bool NoLibrarySelected { get; set; }
        public int MovieCount { get; set; }
        public int SeriesCount { get; set; }
        public int EpisodeCount { get; set; }
        public string Message { get; set; }
        public string Error { get; set; }
        public SendOutcome SendOutcome { get; set; }
    }

    /// <summary>
    /// Scans the library for items added in the last N days and formats/sends a "what's new"
    /// broadcast. Built on the same InternalItemsQuery approach the reference
    /// EmbyWeeklyDigest plugin uses (MinDateCreated + Recursive + IsVirtualItem=false).
    ///
    /// Library scoping: an earlier version of this class tried to filter server-side via
    /// InternalItemsQuery.TopParentIds, resolving each selected library's Guid (as exposed by
    /// VirtualFolderInfo.ItemId) to a BaseItem via GetItemById() and reading its InternalId.
    /// That resolution turned out to silently fail against a real server (GetItemById either
    /// didn't resolve the id or threw), which made ResolveLibraryInternalIds() return an empty
    /// set every time - and an empty/null TopParentIds was (by design, to fail open rather than
    /// send nothing) treated as "no library filter", so library selection had no effect at all
    /// regardless of what was checked or unchecked. Confirmed by user report: selecting only one
    /// library still showed items from others, and selecting several had no visible effect.
    ///
    /// Fixed by dropping TopParentIds entirely and instead filtering in-memory by filesystem
    /// path: VirtualFolderInfo.Locations gives each library's real folder path(s), and every
    /// BaseItem has a Path under one of its library's Locations - so after running the same
    /// unscoped query the reference plugin uses, results are kept only if their Path starts with
    /// one of the selected libraries' folder paths. No internal id / Guid resolution involved,
    /// so there is nothing here that depends on unverified SDK internals.
    /// </summary>
    public class MediaNewsService
    {
        private readonly ILogger _logger;

        public MediaNewsService(ILogManager logManager)
        {
            _logger = logManager.GetLogger(nameof(MediaNewsService));
        }

        public List<LibraryOption> GetLibraries(ILibraryManager libraryManager)
        {
            try
            {
                return libraryManager.GetVirtualFolders()
                    .Select(f => new LibraryOption { Id = f.ItemId, Name = f.Name, ContentType = f.CollectionType })
                    .OrderBy(f => f.Name)
                    .ToList();
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: failed to enumerate libraries.", ex);
                return new List<LibraryOption>();
            }
        }

        /// <summary>Default per-episode line format, used whenever the admin's saved template
        /// is empty (e.g. never configured). Placeholders: see MediaNewsEpisodeTemplate on
        /// PluginConfiguration.</summary>
        public const string DefaultEpisodeTemplate = "{Series name (year)} - {SxxExx} - {Episode title}";

        /// <summary>Upper bound for the lookback window, shared with EmbyCastApi's request
        /// validation.</summary>
        public const int MaxLookbackDays = 365;

        /// <summary>
        /// includeNewSeries and includeNewEpisodes are independent - either, both, or
        /// neither can be true. With both true, the digest gets separate "New TV Shows:" and
        /// "New Episodes:" sections (see ToMessageText), which can legitimately double-list the
        /// same show once as "Series Name (Year)" and again per newly added episode - that's the
        /// intended behavior for admins who explicitly opt into both, not a bug.
        /// </summary>
        public MediaNewsResult BuildSinceDays(
            ILibraryManager libraryManager, int days, IReadOnlyCollection<string> libraryIds,
            bool includeNewSeries, bool includeNewEpisodes, string episodeTemplate)
        {
            var result = new MediaNewsResult();
            // Clamped on both ends: the API validates LookbackDays, but a hand-edited config (or
            // any future caller) must never be able to push AddDays() out of DateTimeOffset's
            // range, which throws instead of just returning an empty digest.
            var cutoff = DateTimeOffset.UtcNow.AddDays(-Math.Min(Math.Max(1, days), MaxLookbackDays));
            var libraryPaths = ResolveLibraryPaths(libraryManager, libraryIds);

            var movies = SafeQuery(libraryManager, "Movie", cutoff, libraryPaths);
            foreach (var item in movies)
                result.AddMovie(FormatTitle(item.Name, item.ProductionYear), item);

            if (includeNewSeries)
            {
                var series = SafeQuery(libraryManager, "Series", cutoff, libraryPaths);
                foreach (var item in series)
                    result.AddSeries(FormatTitle(item.Name, item.ProductionYear), item);
            }

            if (includeNewEpisodes)
            {
                var episodes = SafeQuery(libraryManager, "Episode", cutoff, libraryPaths);
                var tpl = string.IsNullOrWhiteSpace(episodeTemplate) ? DefaultEpisodeTemplate : episodeTemplate;
                foreach (var item in episodes)
                    result.AddEpisode(FormatEpisodeLine(item, tpl), item);
            }

            return result;
        }

        /// <summary>
        /// Resolves the selected library ids (VirtualFolderInfo.ItemId strings, exactly as
        /// handed out by GetLibraries() above and echoed back by the dashboard's checkboxes) to
        /// their real filesystem folder path(s), by matching against a fresh
        /// GetVirtualFolders() call - the same source both sides ultimately come from, so this
        /// is a plain string comparison with nothing SDK-version-sensitive in it. Ids that don't
        /// match any current library are skipped (logged), not treated as a hard error.
        ///
        /// No libraries selected (libraryIds null/empty) deliberately resolves to an empty path
        /// list, not "no filter" - per explicit user decision, an empty checkbox selection means
        /// "nothing chosen", consistent with how "Specific users" recipient mode elsewhere in
        /// this plugin already refuses to send to nobody rather than silently defaulting to
        /// everyone. SafeQuery() below then correctly produces an empty (skipped) digest for
        /// that case instead of announcing every library.
        /// </summary>
        private List<string> ResolveLibraryPaths(ILibraryManager libraryManager, IReadOnlyCollection<string> libraryIds)
        {
            var paths = new List<string>();
            if (libraryIds == null || libraryIds.Count == 0) return paths;

            var wanted = new HashSet<string>(libraryIds, StringComparer.OrdinalIgnoreCase);
            var matchedIds = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            try
            {
                foreach (var folder in libraryManager.GetVirtualFolders())
                {
                    if (folder == null || string.IsNullOrEmpty(folder.ItemId) || !wanted.Contains(folder.ItemId))
                        continue;

                    matchedIds.Add(folder.ItemId);
                    // ".Any()" (LINQ, works on any IEnumerable<string> - array or List<string>
                    // alike) rather than ".Length"/".Count", since this project has no compiler
                    // available to verify VirtualFolderInfo.Locations' exact declared type.
                    if (folder.Locations != null && folder.Locations.Any(p => !string.IsNullOrEmpty(p)))
                    {
                        paths.AddRange(folder.Locations.Where(p => !string.IsNullOrEmpty(p)));
                    }
                    else
                    {
                        // Diagnostic-only: a selected library that resolved (its ItemId matched)
                        // but has no folder Locations can never contribute anything, since
                        // filtering is entirely path-based - this would show up as "library
                        // checked, nothing from it ever appears" for that one library only.
                        _logger.Warn("EmbyCast: selected library '{0}' (id {1}) has no folder Locations - it can never contribute to media news.", folder.Name, folder.ItemId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: failed to resolve selected libraries to folder paths.", ex);
            }

            foreach (var id in wanted)
            {
                if (!matchedIds.Contains(id))
                    _logger.Warn("EmbyCast: selected library id '{0}' did not match any current library (GetVirtualFolders); it may have been deleted/recreated since the checklist was last loaded.", id);
            }

            if (paths.Count == 0)
            {
                _logger.Warn("EmbyCast: {0} library id(s) were selected for media news but none resolved to a folder path; check they still exist.", libraryIds.Count);
            }

            return paths;
        }

        private List<BaseItem> SafeQuery(ILibraryManager libraryManager, string itemType, DateTimeOffset cutoff, List<string> libraryPaths)
        {
            // No selected library resolved to a real path -> nothing to include for this type,
            // no need to even hit the database. Covers both "nothing checked" and "checked
            // libraries that no longer exist".
            if (libraryPaths == null || libraryPaths.Count == 0) return new List<BaseItem>();

            // Scoped to the selected libraries' folders server-side (PathStartsWithAny), so a
            // long lookback on a big server no longer loads every recently added item of every
            // library into memory just to throw most of them away. If the scoped query finds
            // nothing - or the server rejects it - the old unscoped query runs as a fallback:
            // how the server compares paths (separators, trailing slashes, network shares) can't
            // be verified from here, and a silently empty digest is exactly the failure an
            // earlier server-side filter attempt (TopParentIds, see class doc) produced. The
            // in-memory IsUnderPath filter below stays authoritative either way.
            List<BaseItem> items = null;
            var usedFallback = false;
            try
            {
                items = RunQuery(libraryManager, itemType, cutoff, libraryPaths.ToArray());
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: path-scoped media-news query for {0} failed; retrying unscoped.", ex, itemType);
            }

            if (items == null || items.Count == 0)
            {
                try
                {
                    items = RunQuery(libraryManager, itemType, cutoff, null);
                    usedFallback = true;
                }
                catch (Exception ex)
                {
                    _logger.ErrorException("EmbyCast: media-news query for {0} failed.", ex, itemType);
                    return new List<BaseItem>();
                }
            }

            if (items.Count >= MaxQueryItems)
                _logger.Warn("EmbyCast: media-news {0} query hit the limit of {1} items - the oldest additions in the lookback window may be missing. Consider a shorter lookback.", itemType, MaxQueryItems);

            var filtered = items.Where(item => !string.IsNullOrEmpty(item.Path) &&
                libraryPaths.Any(root => IsUnderPath(item.Path, root))).ToList();

            if (usedFallback && filtered.Count > 0)
                _logger.Warn("EmbyCast: media-news {0}: the server-side path filter matched nothing but the unscoped query found {1} item(s) in the selected libraries - using the unscoped query (slower on large libraries).", itemType, filtered.Count);

            // Diagnostic-only logging: helps tell apart "the server has no recently-added items
            // of this type at all" (matchedByDate low/zero) from "items exist but none matched a
            // selected library's folder path" (filtered count much lower than matchedByDate) -
            // the latter would point at a path-normalization mismatch (e.g. the library's
            // configured Location differs from the actual item.Path prefix, which can happen
            // with certain network-share/container path setups) rather than a plugin logic bug,
            // since both cases run through the exact same code for every item type.
            _logger.Info("EmbyCast: media-news {0} query: {1} matched by date/type, {2} kept after library-path filter (roots: {3}).",
                itemType, items.Count, filtered.Count, string.Join(" | ", libraryPaths));

            return filtered;
        }

        /// <summary>Upper bound per item type and query. Newest first (DateCreated descending), so
        /// if it's ever hit, only the oldest additions in the lookback window are cut - and a
        /// digest with thousands of lines wouldn't be readable as a notification anyway.</summary>
        private const int MaxQueryItems = 5000;

        private static List<BaseItem> RunQuery(ILibraryManager libraryManager, string itemType, DateTimeOffset cutoff, string[] pathPrefixes)
        {
            var query = new InternalItemsQuery
            {
                IncludeItemTypes = new[] { itemType },
                Recursive = true,
                IsVirtualItem = false,
                MinDateCreated = cutoff,
                OrderBy = new[] { (ItemSortBy.DateCreated, SortOrder.Descending) },
                Limit = MaxQueryItems
            };
            if (pathPrefixes != null) query.PathStartsWithAny = pathPrefixes;
            return libraryManager.GetItemList(query).ToList();
        }

        private static bool IsUnderPath(string itemPath, string libraryRootPath)
        {
            if (string.IsNullOrEmpty(libraryRootPath)) return false;
            var normalizedItem = itemPath.Replace('\\', '/').TrimEnd('/');
            var normalizedRoot = libraryRootPath.Replace('\\', '/').TrimEnd('/');
            return normalizedItem.Equals(normalizedRoot, StringComparison.OrdinalIgnoreCase)
                || normalizedItem.StartsWith(normalizedRoot + "/", StringComparison.OrdinalIgnoreCase);
        }

        private static string FormatTitle(string rawName, int? year)
        {
            var name = TextFormatting.CollapseDuplicateYear(TextFormatting.NormalizeMessageText(rawName));
            return year.HasValue && year.Value > 0 && !TextFormatting.HasTrailingYear(name)
                ? $"{name} ({year.Value})"
                : name;
        }

        /// <summary>
        /// Formats one "new episode" line per the admin's template. Deliberately avoids any
        /// Episode/Series-specific SDK type (e.g. MediaBrowser.Controller.Entities.TV.Episode) in
        /// favor of the plain, well-established BaseItem.Parent chain - Episode -> Season ->
        /// Series is Emby/Jellyfin's standard hierarchy, and BaseItem.Parent/.Name/.ProductionYear
        /// are the same properties already relied on elsewhere in this file, rather than a
        /// narrower Episode-specific member (like a hypothetical "SeriesId"/"SeriesName") this
        /// project has no way to verify against a real compiler in the environment it was built
        /// in - see the TopParentIds lesson in this class's history for why that caution exists.
        /// BaseItem.IndexNumber / ParentIndexNumber (episode/season number) are the same fields
        /// Emby's own public REST API model (BaseItemDto) exposes under those exact names, so
        /// they're relied on directly.
        /// </summary>
        private static string FormatEpisodeLine(BaseItem item, string template)
        {
            var seriesItem = item.Parent?.Parent ?? item.Parent;
            var seriesName = TextFormatting.CollapseDuplicateYear(
                TextFormatting.NormalizeMessageText(seriesItem?.Name ?? item.Name));
            var seriesYear = seriesItem?.ProductionYear;
            var seriesLabel = seriesYear.HasValue && seriesYear.Value > 0 && !TextFormatting.HasTrailingYear(seriesName)
                ? $"{seriesName} ({seriesYear.Value})"
                : seriesName;

            var season = item.ParentIndexNumber;
            var episodeNum = item.IndexNumber;
            string sxxexx;
            if (season.HasValue && episodeNum.HasValue)
                sxxexx = $"S{season.Value:00}E{episodeNum.Value:00}";
            else if (episodeNum.HasValue)
                sxxexx = $"E{episodeNum.Value:00}";
            else
                sxxexx = "";

            var episodeTitle = TextFormatting.NormalizeMessageText(item.Name);

            // The English placeholder tokens ({Series name (year)}, {Episode title}, {SxxExx})
            // superseded an older set of German-language tokens. The old German tokens
            // ({Serienname (Jahr)}/{Episodentitel}) are still replaced here too, purely so any
            // template an admin already saved under the old tokens keeps working unchanged - both
            // chains are safe to run unconditionally since Replace() on a token that isn't present
            // is a no-op.
            return template
                .Replace("{Series name (year)}", seriesLabel)
                .Replace("{SxxExx}", sxxexx)
                .Replace("{Episode title}", episodeTitle)
                .Replace("{Serienname (Jahr)}", seriesLabel)
                .Replace("{Episodentitel}", episodeTitle);
        }

        public string ToMessageText(MediaNewsResult digest, string language)
        {
            var sb = new StringBuilder();
            var moviesLabel = language == "de" ? "Neue Filme:" : "New Movies:";
            var seriesLabel = language == "de" ? "Neue Serien:" : "New TV Shows:";
            var episodesLabel = language == "de" ? "Neue Episoden:" : "New Episodes:";

            if (digest.Movies.Count > 0)
            {
                sb.AppendLine(moviesLabel);
                foreach (var m in digest.Movies) sb.AppendLine(" - " + m);
            }
            if (digest.Series.Count > 0)
            {
                if (sb.Length > 0) sb.AppendLine();
                sb.AppendLine(seriesLabel);
                foreach (var s in digest.Series) sb.AppendLine(" - " + s);
            }
            if (digest.Episodes.Count > 0)
            {
                if (sb.Length > 0) sb.AppendLine();
                sb.AppendLine(episodesLabel);
                foreach (var e in digest.Episodes) sb.AppendLine(" - " + e);
            }
            return sb.ToString().TrimEnd();
        }
    }
}
