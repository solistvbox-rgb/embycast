using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using EmbyCast.Plugin.Models;
using EmbyCast.Plugin.Services;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Net;
using MediaBrowser.Controller.Session;
using MediaBrowser.Model.Services;

namespace EmbyCast.Plugin.Api
{
    // =====================================================================
    // Request / response DTOs
    // =====================================================================

    public class SendResultDto
    {
        public int Delivered { get; set; }
        public int Pending { get; set; }
        public int Failed { get; set; }
        public string HistoryEntryId { get; set; }
        public string Error { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Send", "POST", Summary = "Send an instant message")]
    public class SendInstant : IReturn<SendResultDto>
    {
        public string Header { get; set; }
        public string Text { get; set; }
        public int TimeoutMs { get; set; }
        /// <summary>"Active" | "All" | "Specific"</summary>
        public string RecipientMode { get; set; } = "Active";
        public List<string> UserIds { get; set; } = new List<string>();
        /// <summary>Selected user-group ids (see Models.UserGroup) - only meaningful when
        /// RecipientMode is "Specific". Resolved to member user ids at send time.</summary>
        public List<string> GroupIds { get; set; } = new List<string>();
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Schedule", "POST", Summary = "Schedule a message for a future date/time")]
    public class CreateScheduled : IReturn<ScheduledMessageRecord>
    {
        public string Header { get; set; }
        public string Text { get; set; }
        public int TimeoutMs { get; set; }
        public DateTime SendAtUtc { get; set; }
        public string RecipientMode { get; set; } = "All";
        public List<string> UserIds { get; set; } = new List<string>();
        public List<string> GroupIds { get; set; } = new List<string>();
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Schedule", "GET", Summary = "List pending scheduled messages")]
    public class GetScheduled : IReturn<List<ScheduledMessageRecord>> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Schedule/{Id}", "DELETE", Summary = "Cancel a pending scheduled message")]
    public class CancelScheduled : IReturn<object>
    {
        public string Id { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Timer/Start", "POST", Summary = "Start a countdown/timer broadcast")]
    public class StartTimer : IReturn<TimerStatusDto>
    {
        public string Header { get; set; }
        public string TextTemplate { get; set; }
        public int TotalMinutes { get; set; }
        public List<int> PresetMinutes { get; set; } = new List<int>();
        /// <summary>"None" | "RestartServer" | "ShutdownServer"</summary>
        public string PostAction { get; set; } = "None";
        public string RecipientMode { get; set; } = "Active";
        public List<string> UserIds { get; set; } = new List<string>();
        public List<string> GroupIds { get; set; } = new List<string>();
        public int TimeoutMs { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Timer/Cancel", "POST", Summary = "Cancel the active countdown/timer")]
    public class CancelTimer : IReturn<object> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Timer/Status", "GET", Summary = "Get the active countdown/timer status")]
    public class GetTimerStatus : IReturn<TimerStatusDto> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/MediaNews/Send", "POST", Summary = "Build and send the media news broadcast now")]
    public class SendMediaNews : IReturn<MediaNewsSendResult>
    {
        public int LookbackDays { get; set; } = 7;
        public List<string> LibraryIds { get; set; } = new List<string>();
        public string RecipientMode { get; set; } = "All";
        public List<string> UserIds { get; set; } = new List<string>();
        public List<string> GroupIds { get; set; } = new List<string>();
        public string Header { get; set; }
        public string Language { get; set; } = "en";
        /// <summary>Independent flags - see PluginConfiguration.MediaNewsIncludeNewSeries
        /// / MediaNewsIncludeNewEpisodes. Both, either, or neither may be true.</summary>
        public bool IncludeNewSeries { get; set; } = true;
        public bool IncludeNewEpisodes { get; set; } = false;
        public string EpisodeTemplate { get; set; }
        /// <summary>"Nur an Web-Browser-Sitzungen senden" - see DeliveryService.IsWebSession.
        /// Offered only for Media News (the message type long enough that non-web clients often
        /// can't display it well). A user reachable only via a non-web active session falls
        /// through to the offline queue instead of being skipped, so the message still arrives
        /// once they open a browser - see DeliveryService.SendAsync.</summary>
        public bool WebOnly { get; set; } = false;
    }

    public class MediaNewsPreviewDto
    {
        public string Text { get; set; }
        public bool Empty { get; set; }
        public int MovieCount { get; set; }
        public int SeriesCount { get; set; }
        public int EpisodeCount { get; set; }
        public string Error { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/MediaNews/Preview", "POST", Summary = "Build the media news message text without sending it")]
    public class PreviewMediaNews : IReturn<MediaNewsPreviewDto>
    {
        public int LookbackDays { get; set; } = 7;
        public List<string> LibraryIds { get; set; } = new List<string>();
        public string Header { get; set; }
        public string Language { get; set; } = "en";
        public bool IncludeNewSeries { get; set; } = true;
        public bool IncludeNewEpisodes { get; set; } = false;
        public string EpisodeTemplate { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/MediaNews/PreviewSaved", "POST", Summary = "Build the media news message text from the currently SAVED settings, ignoring any unsaved changes in the form above")]
    public class PreviewSavedMediaNews : IReturn<MediaNewsPreviewDto>
    {
        public string Language { get; set; } = "en";
    }

    public class MediaNewsAutoStatusDto
    {
        public bool Enabled { get; set; }
        /// <summary>Day/Hour/Minute here are UTC, same as PluginConfiguration.MediaNewsAutoSendDay
        /// /Hour/Minute - the dashboard converts to/from the admin's local wall-clock time
        /// client-side (see config.js's localDayTimeToUtc/utcDayTimeToLocal) purely for display
        /// and input; nothing server-side ever deals in local time.</summary>
        public DayOfWeek Day { get; set; }
        public int Hour { get; set; }
        public int Minute { get; set; }
        public DateTime? LastSentUtc { get; set; }
        public DateTime NextRunUtc { get; set; }
        /// <summary>Echoes the currently-saved MediaNewsHeader/MediaNewsRecipientMode/
        /// MediaNewsLookbackDays, purely so the dashboard's "upcoming auto-send" card can show
        /// them without relying on possibly-stale/unsaved values from the form fields above -
        /// those are shared, single instances of Header/Days/etc. used by both the manual send
        /// and the auto-send sections, so what's currently in them may not match what's actually
        /// saved and about to run.</summary>
        public string Header { get; set; }
        /// <summary>"Active" | "All" | "Specific" - see PluginConfiguration.MediaNewsRecipientMode.</summary>
        public string RecipientMode { get; set; }
        public int LookbackDays { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/MediaNews/AutoStatus", "GET", Summary = "Get auto-send status and next scheduled run")]
    public class GetMediaNewsAutoStatus : IReturn<MediaNewsAutoStatusDto> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/MediaNews/AutoConfig", "POST", Summary = "Save automatic media-news send settings")]
    public class SaveMediaNewsAutoConfig : IReturn<MediaNewsAutoStatusDto>
    {
        public bool Enabled { get; set; }
        /// <summary>UTC, already converted client-side from the admin's local wall-clock
        /// weekday/time - see PluginConfiguration.MediaNewsAutoSendDay.</summary>
        public DayOfWeek Day { get; set; } = DayOfWeek.Friday;
        public int Hour { get; set; } = 18;
        public int Minute { get; set; }
        public int LookbackDays { get; set; } = 7;
        public string LibraryIdsCsv { get; set; } = "";
        public string RecipientMode { get; set; } = "All";
        public string SpecificUserIdsCsv { get; set; } = "";
        public string SpecificGroupIdsCsv { get; set; } = "";
        public bool SkipWhenEmpty { get; set; } = true;
        public string Header { get; set; } = "What's New";
        public bool IncludeNewSeries { get; set; } = true;
        public bool IncludeNewEpisodes { get; set; } = false;
        public string EpisodeTemplate { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Libraries", "GET", Summary = "List libraries (virtual folders) for the media-news filter")]
    public class GetLibraries : IReturn<List<LibraryOption>> { }

    public class ActiveSessionDto
    {
        public string SessionId { get; set; }
        public string UserId { get; set; }
        public string UserName { get; set; }
        public string Client { get; set; }
        public string DeviceName { get; set; }
        public string NowPlaying { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Sessions/Active", "GET", Summary = "List active sessions, including now-playing title")]
    public class GetActiveSessions : IReturn<List<ActiveSessionDto>> { }

    public class UserOptionDto
    {
        public string Id { get; set; }
        public string Name { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Users/All", "GET", Summary = "List all users for the recipient checkbox list")]
    public class GetAllUsers : IReturn<List<UserOptionDto>> { }

    // ---- User groups ---------------------------------------------------

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Groups", "GET", Summary = "List all user groups")]
    public class GetGroups : IReturn<List<UserGroup>> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Groups", "POST", Summary = "Create a new user group")]
    public class CreateGroup : IReturn<UserGroup>
    {
        public string Name { get; set; }
        public List<string> UserIds { get; set; } = new List<string>();
    }

    // POST rather than PUT: every other write endpoint in this plugin already uses POST
    // (there's no prior PUT usage anywhere in this codebase to follow), and this sandbox has no
    // compiler to verify a first-time verb against this Emby SDK version - staying with a
    // proven-working verb removes that risk for no real cost.
    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Groups/{Id}", "POST", Summary = "Rename a user group and/or replace its member list")]
    public class UpdateGroup : IReturn<UserGroup>
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public List<string> UserIds { get; set; } = new List<string>();
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Groups/{Id}", "DELETE", Summary = "Delete a user group")]
    public class DeleteGroup : IReturn<object>
    {
        public string Id { get; set; }
    }

    // ---- Welcome message: bulk-mark existing users -----------------------

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Welcome/MarkExisting", "POST", Summary = "Marks every current user as already welcomed, without sending them the welcome message - so only users created from now on receive it automatically")]
    public class MarkExistingUsersWelcomed : IReturn<object> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/History", "GET", Summary = "List sent-message history with delivery status")]
    public class GetHistory : IReturn<List<HistoryEntry>> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/History/{Id}", "DELETE", Summary = "Dismiss a history entry")]
    public class DismissHistory : IReturn<object>
    {
        public string Id { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/History/ClearAll", "POST", Summary = "Clear the entire message history")]
    public class ClearAllHistory : IReturn<object> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Stats", "GET", Summary = "Small summary counters for the dashboard header")]
    public class GetStats : IReturn<StatsDto> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/CheckUpdate", "POST", Summary = "Force a fresh GitHub check for the latest plugin release, bypassing the cache - used by the manual \"Check for Updates\" button, which should always reflect the current state when explicitly clicked")]
    public class CheckUpdate : IReturn<UpdateCheckResult> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/CheckUpdate/Cached", "GET", Summary = "Read-only update check for the dashboard's silent per-page-load badge - reads UpdateChecker's existing cache (see CacheTtl) and never invalidates it, unlike POST CheckUpdate")]
    public class GetCachedUpdateCheck : IReturn<UpdateCheckResult> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/InstallUpdate", "POST", Summary = "Download and atomically install the latest plugin release")]
    public class InstallUpdate : IReturn<InstallUpdateResult> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/PluginVersion", "GET", Summary = "The plugin version actually running on the server right now - lightweight, no GitHub call (unlike CheckUpdate). Used by the dashboard to detect a stale cached copy of config.html/config.js and force a fresh reload.")]
    public class GetPluginVersion : IReturn<PluginVersionDto> { }

    public class PluginVersionDto
    {
        public string Version { get; set; }
    }

    public class StatsDto
    {
        public int PendingOfflineMessages { get; set; }
        public int PendingScheduledMessages { get; set; }
        public bool TimerActive { get; set; }
    }

    // ---- "Geplante Reinigung" ----------------------------------------------

    public class CleanupStatsDto
    {
        public long TotalFileBytes { get; set; }
        public int HistoryCount { get; set; }
        public long HistoryBytes { get; set; }
        public int OfflineQueueCount { get; set; }
        public long OfflineQueueBytes { get; set; }
    }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Cleanup/Stats", "GET", Summary = "Storage size breakdown for the 'Geplante Reinigung' card")]
    public class GetCleanupStats : IReturn<CleanupStatsDto> { }

    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Cleanup/PurgeOffline", "POST", Summary = "'Alle nicht zugestellten Nachrichten löschen' - immediately expire every currently queued offline message")]
    public class PurgeOfflineNow : IReturn<object> { }

    /// <summary>Which MessageOrigin categories "History sofort löschen" (and the automatic
    /// Feld-2 purge) should affect - mirrors PluginConfiguration.HistoryCleanupInclude*.</summary>
    [Authenticated(Roles = "Admin")]
    [Route("/EmbyCast/Cleanup/PurgeHistory", "POST", Summary = "'History sofort löschen' - immediately delete history entries of the given message types")]
    public class PurgeHistoryNow : IReturn<object>
    {
        public bool IncludeInstant { get; set; } = true;
        public bool IncludeScheduled { get; set; } = true;
        public bool IncludeTimer { get; set; } = true;
        public bool IncludeMediaNews { get; set; } = true;
        public bool IncludeWelcome { get; set; } = true;
        public bool IncludeOffline { get; set; } = true;
    }

    // =====================================================================
    // Service implementation
    //
    // Note on authorization: every route above is decorated with
    // [Authenticated(Roles = "Admin")], which is Emby's built-in, SDK-supported way of
    // requiring an authenticated session whose user has the Administrator flag before the
    // method below is even invoked - unauthorized/non-admin calls never reach this class.
    // No extra manual permission check is required inside the methods themselves.
    // =====================================================================

    public class EmbyCastApi : IService, IRequiresRequest
    {
        public IRequest Request { get; set; }

        // Bare "Plugin" resolves to EmbyCast.Plugin.Plugin here (same pattern
        // used by the EmbyNotify/EmbyWeeklyDigest reference plugins, whose Api classes live in
        // an "...Api" sub-namespace of the "...Plugin" namespace that declares the Plugin class).
        private static Plugin P => Plugin.Instance;

        public async Task<object> Post(SendInstant request)
        {
            var mode = ParseMode(request.RecipientMode);
            var outcome = await P.Delivery.SendAsync(
                request.Header, request.Text, request.TimeoutMs, mode, request.UserIds, MessageOrigin.Instant,
                specificGroupIds: request.GroupIds
            ).ConfigureAwait(false);
            return ToDto(outcome);
        }

        public object Post(CreateScheduled request)
        {
            var record = new ScheduledMessageRecord
            {
                Header = request.Header,
                Text = request.Text,
                TimeoutMs = request.TimeoutMs,
                SendAtUtc = request.SendAtUtc,
                RecipientMode = request.RecipientMode,
                SpecificUserIds = request.UserIds ?? new List<string>(),
                SpecificGroupIds = request.GroupIds ?? new List<string>()
            };
            return P.Store.AddScheduled(record);
        }

        public object Get(GetScheduled request) => P.Store.GetScheduled();

        public object Delete(CancelScheduled request)
        {
            var ok = P.Store.CancelScheduled(request.Id);
            return new { Success = ok };
        }

        public object Post(StartTimer request)
        {
            var postAction = Enum.TryParse<PostTimerAction>(request.PostAction, out var pa) ? pa : PostTimerAction.None;
            var mode = ParseMode(request.RecipientMode);
            return P.Timer.StartTimer(
                request.Header, request.TextTemplate, request.TotalMinutes,
                request.PresetMinutes, postAction, mode, request.UserIds, request.TimeoutMs, request.GroupIds);
        }

        public object Post(CancelTimer request)
        {
            var ok = P.Timer.CancelTimer();
            return new { Success = ok };
        }

        public object Get(GetTimerStatus request) => P.Timer.GetStatus();

        public async Task<object> Post(SendMediaNews request)
        {
            var libraryManager = P.ApplicationHost.Resolve<ILibraryManager>();
            if (libraryManager == null)
                return new MediaNewsSendResult { Error = "ILibraryManager not available" };

            // Deliberately does NOT touch/persist P.Configuration here. A manual "Send Media News
            // Now" is a one-off send with whatever is
            // currently in the form and must never silently change what the recurring weekly job
            // (saved only via the separate "Save Auto-send Settings" button below) will send next.
            // If the admin wants the weekly job to use different settings, the intended workflow
            // is to change the fields and explicitly click "Save Auto-send Settings" - not to
            // have a manual send do it as a side effect.
            var digest = P.MediaNews.BuildSinceDays(
                libraryManager, request.LookbackDays, request.LibraryIds,
                request.IncludeNewSeries, request.IncludeNewEpisodes, request.EpisodeTemplate);
            var result = new MediaNewsSendResult
            {
                MovieCount = digest.Movies.Count,
                SeriesCount = digest.Series.Count,
                EpisodeCount = digest.Episodes.Count
            };

            if (digest.IsEmpty)
            {
                result.Skipped = true;
                // No library checked at all is a distinct, more common cause of an empty digest
                // than "nothing new was added" - give a clearer message for it instead of the
                // generic one, same idea as the "select at least one user" guard used for
                // RecipientMode.Specific elsewhere in this plugin. NoLibrarySelected additionally
                // lets the dashboard show this specific case as an error (red, actionable mistake)
                // while the "nothing new" case stays informational (green) - see config.js's
                // ".medianews-send" click handler.
                result.NoLibrarySelected = request.LibraryIds == null || request.LibraryIds.Count == 0;
                result.Message = result.NoLibrarySelected
                    ? (request.Language == "de"
                        ? "Bitte mindestens eine Bibliothek auswählen, bevor die Nachricht versendet werden kann."
                        : "Please select at least one library before the message can be sent.")
                    : (request.Language == "de"
                        ? "Keine neuen Medien im gewählten Zeitraum - nichts gesendet."
                        : "No new media in the selected period; nothing sent.");
                return result;
            }

            var text = P.MediaNews.ToMessageText(digest, request.Language);
            var header = string.IsNullOrWhiteSpace(request.Header) ? "What's New" : request.Header;
            var mode = ParseMode(request.RecipientMode);

            var outcome = await P.Delivery.SendAsync(
                header, text, 0, mode, request.UserIds, MessageOrigin.MediaNews,
                webOnly: request.WebOnly, specificGroupIds: request.GroupIds
            ).ConfigureAwait(false);

            result.SendOutcome = outcome;
            // Series and Episodes are independent (both, either, or neither can be requested),
            // so only mention the parts that were actually requested - showing
            // "0 episode(s)" on every normal send when "New episodes" isn't even checked would
            // just be noise.
            var summaryParts = new List<string> { $"{digest.Movies.Count} movie(s)" };
            if (request.IncludeNewSeries) summaryParts.Add($"{digest.Series.Count} show(s)");
            if (request.IncludeNewEpisodes) summaryParts.Add($"{digest.Episodes.Count} episode(s)");
            var contentSummary = string.Join(", ", summaryParts);
            result.Message = $"Sent ({contentSummary}) - " +
                              $"{outcome.Delivered} delivered, {outcome.Pending} pending, {outcome.Failed} failed.";
            return result;
        }

        /// <summary>Builds the exact message text a "Send Media News Now" click would produce,
        /// without calling DeliveryService - no history entry, no config persistence, no message
        /// actually sent anywhere. Always reflects whatever is currently in the dashboard's form
        /// fields (passed in the request), same as the real send.</summary>
        public object Post(PreviewMediaNews request)
        {
            var libraryManager = P.ApplicationHost.Resolve<ILibraryManager>();
            if (libraryManager == null)
                return new MediaNewsPreviewDto { Error = "ILibraryManager not available" };

            var digest = P.MediaNews.BuildSinceDays(
                libraryManager, request.LookbackDays, request.LibraryIds,
                request.IncludeNewSeries, request.IncludeNewEpisodes, request.EpisodeTemplate);

            var dto = new MediaNewsPreviewDto
            {
                Empty = digest.IsEmpty,
                MovieCount = digest.Movies.Count,
                SeriesCount = digest.Series.Count,
                EpisodeCount = digest.Episodes.Count
            };

            if (digest.IsEmpty)
            {
                dto.Text = "";
                return dto;
            }

            var header = string.IsNullOrWhiteSpace(request.Header) ? "What's New" : request.Header;
            dto.Text = "[" + header + "]\n" + P.MediaNews.ToMessageText(digest, request.Language);
            return dto;
        }

        /// <summary>Same idea as Post(PreviewMediaNews) above, but built entirely from the
        /// currently SAVED PluginConfiguration instead of request fields - used by the "upcoming
        /// auto-send" card's own Preview button, which must show what the automatic weekly send
        /// would actually produce right now, not whatever the admin currently has typed/checked
        /// in the (shared, unsaved) form fields above. Read-only, same as PreviewMediaNews - no
        /// config persistence, no history entry, no message sent.</summary>
        public object Post(PreviewSavedMediaNews request)
        {
            var libraryManager = P.ApplicationHost.Resolve<ILibraryManager>();
            if (libraryManager == null)
                return new MediaNewsPreviewDto { Error = "ILibraryManager not available" };

            var config = P.Configuration;
            var libraryIds = string.IsNullOrWhiteSpace(config.MediaNewsLibraryIdsCsv)
                ? new List<string>()
                : config.MediaNewsLibraryIdsCsv.Split(',').Select(s => s.Trim()).Where(s => s.Length > 0).ToList();

            var digest = P.MediaNews.BuildSinceDays(
                libraryManager, config.MediaNewsLookbackDays, libraryIds,
                config.MediaNewsIncludeNewSeries, config.MediaNewsIncludeNewEpisodes, config.MediaNewsEpisodeTemplate);

            var dto = new MediaNewsPreviewDto
            {
                Empty = digest.IsEmpty,
                MovieCount = digest.Movies.Count,
                SeriesCount = digest.Series.Count,
                EpisodeCount = digest.Episodes.Count
            };

            if (digest.IsEmpty)
            {
                dto.Text = "";
                return dto;
            }

            var header = string.IsNullOrWhiteSpace(config.MediaNewsHeader) ? "What's New" : config.MediaNewsHeader;
            dto.Text = "[" + header + "]\n" + P.MediaNews.ToMessageText(digest, request.Language);
            return dto;
        }

        public object Get(GetMediaNewsAutoStatus request)
        {
            var config = P.Configuration;
            return new MediaNewsAutoStatusDto
            {
                Enabled = config.MediaNewsAutoSendEnabled,
                Day = config.MediaNewsAutoSendDay,
                Hour = config.MediaNewsAutoSendHour,
                Minute = config.MediaNewsAutoSendMinute,
                LastSentUtc = config.MediaNewsLastAutoSentUtc,
                NextRunUtc = MediaNewsAutoScheduler.GetNextOccurrence(
                    DateTime.UtcNow, config.MediaNewsAutoSendDay, config.MediaNewsAutoSendHour, config.MediaNewsAutoSendMinute),
                Header = config.MediaNewsHeader,
                RecipientMode = config.MediaNewsRecipientMode,
                LookbackDays = config.MediaNewsLookbackDays
            };
        }

        public object Post(SaveMediaNewsAutoConfig request)
        {
            var config = P.Configuration;
            config.MediaNewsAutoSendEnabled = request.Enabled;
            config.MediaNewsAutoSendDay = request.Day;
            config.MediaNewsAutoSendHour = request.Hour;
            config.MediaNewsAutoSendMinute = request.Minute;
            config.MediaNewsLookbackDays = request.LookbackDays;
            config.MediaNewsLibraryIdsCsv = request.LibraryIdsCsv ?? "";
            config.MediaNewsRecipientMode = request.RecipientMode;
            config.MediaNewsSpecificUserIdsCsv = request.SpecificUserIdsCsv ?? "";
            config.MediaNewsSpecificGroupIdsCsv = request.SpecificGroupIdsCsv ?? "";
            config.MediaNewsSkipWhenEmpty = request.SkipWhenEmpty;
            config.MediaNewsHeader = string.IsNullOrWhiteSpace(request.Header) ? "What's New" : request.Header;
            config.MediaNewsIncludeNewSeries = request.IncludeNewSeries;
            config.MediaNewsIncludeNewEpisodes = request.IncludeNewEpisodes;
            config.MediaNewsEpisodeTemplate = request.EpisodeTemplate;
            P.PersistConfiguration(config);

            return new MediaNewsAutoStatusDto
            {
                Enabled = config.MediaNewsAutoSendEnabled,
                Day = config.MediaNewsAutoSendDay,
                Hour = config.MediaNewsAutoSendHour,
                Minute = config.MediaNewsAutoSendMinute,
                LastSentUtc = config.MediaNewsLastAutoSentUtc,
                NextRunUtc = MediaNewsAutoScheduler.GetNextOccurrence(
                    DateTime.UtcNow, config.MediaNewsAutoSendDay, config.MediaNewsAutoSendHour, config.MediaNewsAutoSendMinute),
                Header = config.MediaNewsHeader,
                RecipientMode = config.MediaNewsRecipientMode,
                LookbackDays = config.MediaNewsLookbackDays
            };
        }

        public object Get(GetLibraries request)
        {
            var libraryManager = P.ApplicationHost.Resolve<ILibraryManager>();
            return libraryManager == null ? new List<LibraryOption>() : P.MediaNews.GetLibraries(libraryManager);
        }

        public object Get(GetActiveSessions request)
        {
            var sessionManager = P.ApplicationHost.Resolve<ISessionManager>();
            var sessions = sessionManager?.Sessions ?? Enumerable.Empty<SessionInfo>();

            return sessions.Where(s => s.IsActive).Select(s => new ActiveSessionDto
            {
                SessionId = s.Id,
                // Normalized so the dashboard's "now playing" annotation reliably matches the
                // user ids returned by GetAllUsers - see IdNormalization.cs.
                UserId = IdNormalization.Normalize(s.UserId),
                UserName = s.UserName,
                Client = s.Client,
                DeviceName = s.DeviceName,
                NowPlaying = FormatNowPlaying(s)
            }).ToList();
        }

        private static string FormatNowPlaying(SessionInfo session)
        {
            var item = session.NowPlayingItem;
            if (item == null) return null;

            // SeriesName + episode numbering is only populated for TV episodes; for movies
            // (and anything else) we just fall back to the plain item name.
            if (!string.IsNullOrEmpty(item.SeriesName))
            {
                var season = item.ParentIndexNumber;
                var episode = item.IndexNumber;
                if (season.HasValue && episode.HasValue)
                    return $"{item.SeriesName} - S{season.Value:00}E{episode.Value:00} - {item.Name}";
                return $"{item.SeriesName} - {item.Name}";
            }

            return item.Name;
        }

        public object Get(GetAllUsers request)
        {
            var userManager = P.ApplicationHost.Resolve<IUserManager>();
            var users = UserLookup.GetAllUsers(userManager);
            return users.Select(u => new UserOptionDto { Id = IdNormalization.Normalize(u.Id), Name = u.Name })
                        .OrderBy(u => u.Name)
                        .ToList();
        }

        // ---- User groups ---------------------------------------------------

        public object Get(GetGroups request) => P.Store.GetGroups();

        public object Post(CreateGroup request) => P.Store.CreateGroup(request.Name, request.UserIds);

        public object Post(UpdateGroup request) => P.Store.UpdateGroup(request.Id, request.Name, request.UserIds);

        public object Delete(DeleteGroup request)
        {
            var ok = P.Store.DeleteGroup(request.Id);
            return new { Success = ok };
        }

        // ---- Welcome message: bulk-mark existing users -----------------------

        public object Post(MarkExistingUsersWelcomed request)
        {
            var userManager = P.ApplicationHost.Resolve<IUserManager>();
            var ids = UserLookup.GetAllUsers(userManager).Select(u => IdNormalization.Normalize(u.Id));
            var count = P.Store.MarkWelcomedBulk(ids);
            return new { Success = true, Count = count };
        }

        public object Get(GetHistory request) => P.Store.GetHistory();

        public object Delete(DismissHistory request)
        {
            var cancelled = P.Store.DismissHistory(request.Id);
            return new { Success = true, CancelledOfflineCount = cancelled };
        }

        public object Post(ClearAllHistory request)
        {
            var cancelled = P.Store.ClearHistory();
            return new { Success = true, CancelledOfflineCount = cancelled };
        }

        public object Get(GetStats request)
        {
            return new StatsDto
            {
                PendingOfflineMessages = P.Store.CountPendingOffline(),
                PendingScheduledMessages = P.Store.GetScheduled().Count,
                TimerActive = P.Timer.GetStatus().Active
            };
        }

        public object Get(GetCleanupStats request)
        {
            var stats = P.Store.GetStorageStats();
            return new CleanupStatsDto
            {
                TotalFileBytes = stats.TotalFileBytes,
                HistoryCount = stats.HistoryCount,
                HistoryBytes = stats.HistoryBytes,
                OfflineQueueCount = stats.OfflineQueueCount,
                OfflineQueueBytes = stats.OfflineQueueBytes
            };
        }

        public object Post(PurgeOfflineNow request)
        {
            var count = P.Store.PurgeAllOffline();
            return new { Success = true, Count = count };
        }

        public object Post(PurgeHistoryNow request)
        {
            var includedTypes = ToIncludedTypes(request);
            var count = P.Store.PurgeHistoryNow(includedTypes);
            return new { Success = true, Count = count };
        }

        private static HashSet<MessageOrigin> ToIncludedTypes(PurgeHistoryNow request)
        {
            var includedTypes = new HashSet<MessageOrigin>();
            if (request.IncludeInstant) includedTypes.Add(MessageOrigin.Instant);
            if (request.IncludeScheduled) includedTypes.Add(MessageOrigin.Scheduled);
            if (request.IncludeTimer) includedTypes.Add(MessageOrigin.Timer);
            if (request.IncludeMediaNews) includedTypes.Add(MessageOrigin.MediaNews);
            if (request.IncludeWelcome) includedTypes.Add(MessageOrigin.Welcome);
            if (request.IncludeOffline) includedTypes.Add(MessageOrigin.Offline);
            return includedTypes;
        }

        public async Task<object> Post(CheckUpdate request)
        {
            UpdateChecker.InvalidateCache();
            return await UpdateChecker.CheckAsync().ConfigureAwait(false);
        }

        // Deliberately does NOT call InvalidateCache() - unlike Post(CheckUpdate) above, this is
        // hit unprompted on every single dashboard page load (silentCheckForUpdateBadge() in
        // config.js) purely to drive the "Plugin Updates" tile's dot badge. Before this route
        // existed, that silent check reused POST CheckUpdate and busted the cache on every page
        // load, which meant UpdateChecker.CacheTtl never actually reduced GitHub API traffic no
        // matter how high it was set - defeating the point of raising it from 1 hour to 7 days.
        public async Task<object> Get(GetCachedUpdateCheck request)
        {
            return await UpdateChecker.CheckAsync().ConfigureAwait(false);
        }

        // Deliberately does NOT go through UpdateChecker.CheckAsync()/its cache - this must
        // always reflect the assembly actually loaded right now, with no GitHub round-trip and no
        // 1-hour cache, since it's polled on every dashboard page load to detect browser-side
        // staleness (see GetPluginVersion above and checkForStaleClientAndReload() in config.js).
        public object Get(GetPluginVersion request) => new PluginVersionDto { Version = UpdateChecker.GetCurrentVersion() };

        public async Task<object> Post(InstallUpdate request)
        {
            return await P.InstallUpdateAsync().ConfigureAwait(false);
        }

        private static RecipientMode ParseMode(string mode) =>
            Enum.TryParse<RecipientMode>(mode, out var m) ? m : RecipientMode.Active;

        private static SendResultDto ToDto(SendOutcome outcome) => new SendResultDto
        {
            Delivered = outcome.Delivered,
            Pending = outcome.Pending,
            Failed = outcome.Failed,
            HistoryEntryId = outcome.HistoryEntryId,
            Error = outcome.Error
        };
    }
}
