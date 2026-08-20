using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EmbyCast.Plugin.Configuration;
using EmbyCast.Plugin.Models;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// Background loop that checks, once a minute, whether it's time to automatically send the
    /// weekly "media news" broadcast, based on the configured weekday + time-of-day.
    ///
    /// Implemented as our own polling loop (rather than Emby's IScheduledTask trigger system)
    /// specifically so the admin can change weekday/time/enabled from the dashboard and see the
    /// effect (including "next scheduled send") immediately, without needing to go through
    /// Emby's separate Scheduled Tasks dashboard page. IScheduledTask triggers are configured
    /// once via GetDefaultTriggers() and are not trivially rewritable at runtime from a plugin
    /// config page across all Emby SDK versions, which is why we avoid relying on it here.
    /// </summary>
    public class MediaNewsAutoScheduler
    {
        private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(60);

        private readonly Func<PluginConfiguration> _getConfig;
        private readonly Action<PluginConfiguration> _saveConfig;
        private readonly MediaNewsService _mediaNews;
        private readonly DeliveryService _delivery;
        private readonly IServerApplicationHost _appHost;
        private readonly ILogger _logger;

        public MediaNewsAutoScheduler(
            Func<PluginConfiguration> getConfig,
            Action<PluginConfiguration> saveConfig,
            MediaNewsService mediaNews,
            DeliveryService delivery,
            IServerApplicationHost appHost,
            ILogManager logManager)
        {
            _getConfig = getConfig;
            _saveConfig = saveConfig;
            _mediaNews = mediaNews;
            _delivery = delivery;
            _appHost = appHost;
            _logger = logManager.GetLogger(nameof(MediaNewsAutoScheduler));
        }

        public async Task RunLoopAsync(CancellationToken token)
        {
            _logger.Info("EmbyCast: media-news auto-scheduler started.");
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await CheckAndSendIfDueAsync().ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.Error("EmbyCast: media-news auto-scheduler iteration failed: {0}", ex.Message);
                }

                try { await Task.Delay(PollInterval, token).ConfigureAwait(false); }
                catch (TaskCanceledException) { break; }
            }
            _logger.Info("EmbyCast: media-news auto-scheduler stopped.");
        }

        /// <summary>Most recent occurrence of the configured weekday/time that is &lt;= now.</summary>
        public static DateTime GetLastOccurrence(DateTime nowUtc, DayOfWeek day, int hour, int minute)
        {
            for (var i = 0; i < 8; i++)
            {
                var candidateDate = nowUtc.Date.AddDays(-i);
                if (candidateDate.DayOfWeek != day) continue;
                var candidate = candidateDate.AddHours(hour).AddMinutes(minute);
                if (candidate <= nowUtc) return candidate;
            }
            // Should not happen (a matching weekday exists within 7 days), but keep a safe fallback.
            return nowUtc.AddDays(-7);
        }

        /// <summary>Next future occurrence of the configured weekday/time, used purely for the
        /// "next scheduled send" display in the dashboard.</summary>
        public static DateTime GetNextOccurrence(DateTime nowUtc, DayOfWeek day, int hour, int minute)
        {
            for (var i = 0; i < 8; i++)
            {
                var candidateDate = nowUtc.Date.AddDays(i);
                if (candidateDate.DayOfWeek != day) continue;
                var candidate = candidateDate.AddHours(hour).AddMinutes(minute);
                if (candidate > nowUtc) return candidate;
            }
            return nowUtc.AddDays(7);
        }

        private async Task CheckAndSendIfDueAsync()
        {
            var config = _getConfig();
            if (!config.MediaNewsAutoSendEnabled) return;

            var now = DateTime.UtcNow;
            var lastOccurrence = GetLastOccurrence(now, config.MediaNewsAutoSendDay, config.MediaNewsAutoSendHour, config.MediaNewsAutoSendMinute);
            var alreadySent = config.MediaNewsLastAutoSentUtc.HasValue && config.MediaNewsLastAutoSentUtc.Value >= lastOccurrence;

            if (alreadySent) return;
            // Only fire within a short window after the due time so a server that was offline
            // for a long time doesn't immediately blast a stale digest days later.
            if (now - lastOccurrence > TimeSpan.FromHours(6)) return;

            var libraryManager = _appHost.Resolve<ILibraryManager>();
            if (libraryManager == null) return;

            var libraryIds = string.IsNullOrWhiteSpace(config.MediaNewsLibraryIdsCsv)
                ? Array.Empty<string>()
                : config.MediaNewsLibraryIdsCsv.Split(',').Select(s => s.Trim()).Where(s => s.Length > 0).ToArray();

            // Mark this week's slot as handled regardless of outcome below, same as every other
            // return path past this point - otherwise, since this whole method is polled every
            // 60 seconds and stays inside the 6-hour "due" window, an admin who enabled
            // auto-send without checking any library would get this warning logged up to ~360
            // times before the window closes, instead of once.
            config.MediaNewsLastAutoSentUtc = now;
            _saveConfig(config);

            if (libraryIds.Length == 0)
            {
                // Distinct from the generic "nothing new" case below: this configuration can
                // never produce anything to send, no matter how long it keeps running, which the
                // dashboard's Save button now also blocks up front (see EmbyCastApi's
                // SaveMediaNewsAutoConfig / config.js's "select at least one library" check) -
                // this is a server-side backstop for configs saved before that check existed, or
                // for direct API use. Skips unconditionally, ignoring MediaNewsSkipWhenEmpty,
                // since sending "no news this week" weekly for a library selection that was never
                // configured would be actively misleading.
                _logger.Warn("EmbyCast: auto media-news is enabled but no library is selected in Media News settings - nothing will ever be sent until at least one library is checked. Skipping this run.");
                return;
            }

            var digest = _mediaNews.BuildSinceDays(
                libraryManager, config.MediaNewsLookbackDays, libraryIds,
                config.MediaNewsIncludeNewSeries, config.MediaNewsIncludeNewEpisodes, config.MediaNewsEpisodeTemplate);

            if (digest.IsEmpty && config.MediaNewsSkipWhenEmpty)
            {
                _logger.Info("EmbyCast: auto media-news skipped, nothing new in the last {0} day(s).", config.MediaNewsLookbackDays);
                return;
            }

            var text = digest.IsEmpty
                ? (config.Language == "de" ? "Keine Neuheiten in dieser Woche." : "No new movies or TV shows this week.")
                : _mediaNews.ToMessageText(digest, config.Language);

            var mode = Enum.TryParse<RecipientMode>(config.MediaNewsRecipientMode, out var m) ? m : RecipientMode.All;
            var specificIds = string.IsNullOrWhiteSpace(config.MediaNewsSpecificUserIdsCsv)
                ? Array.Empty<string>()
                : config.MediaNewsSpecificUserIdsCsv.Split(',').Select(s => s.Trim()).Where(s => s.Length > 0).ToArray();
            var specificGroupIds = string.IsNullOrWhiteSpace(config.MediaNewsSpecificGroupIdsCsv)
                ? Array.Empty<string>()
                : config.MediaNewsSpecificGroupIdsCsv.Split(',').Select(s => s.Trim()).Where(s => s.Length > 0).ToArray();

            var outcome = await _delivery.SendAsync(
                config.MediaNewsHeader, text, 0, mode, specificIds, MessageOrigin.MediaNews,
                specificGroupIds: specificGroupIds
            ).ConfigureAwait(false);

            _logger.Info("EmbyCast: auto media-news sent ({0} movie(s), {1} show(s), {2} episode(s)) - {3} delivered, {4} pending, {5} failed.",
                digest.Movies.Count, digest.Series.Count, digest.Episodes.Count, outcome.Delivered, outcome.Pending, outcome.Failed);
        }
    }
}
