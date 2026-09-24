using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using EmbyCast.Plugin.Configuration;
using EmbyCast.Plugin.Models;
using EmbyCast.Plugin.Storage;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// Polls the scheduled-message queue and sends any message whose SendAtUtc has passed, and
    /// runs the "Geplante Reinigung" cleanup pass (offline-queue expiry + history purge) on the
    /// same loop. A simple poll loop (rather than one Task.Delay-until-due per message) keeps
    /// this robust against messages being added/cancelled while the loop sleeps, and against
    /// server clock changes - at the cost of at most ~20s of scheduling jitter, which is fine
    /// for this use case (broadcast announcements, not real-time alerts) and for a cleanup task
    /// that only needs to run roughly once in a while.
    /// </summary>
    public class ScheduledMessageBackgroundService
    {
        private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(20);
        /// <summary>Cleanup doesn't need to run every 20s poll tick - the retention fields are
        /// day-granularity anyway, so once a day is plenty and avoids needless store-file
        /// rewrites/CPU wake-ups. Still runs once immediately on startup (see _lastCleanupUtc's
        /// DateTime.MinValue initializer below), so a freshly (re)started server doesn't wait a
        /// full day before its first pass.</summary>
        private static readonly TimeSpan CleanupInterval = TimeSpan.FromDays(1);

        private readonly DeliveryService _delivery;
        private readonly MessageStore _store;
        private readonly TimerService _timer;
        private readonly ILogger _logger;
        private readonly Func<PluginConfiguration> _getConfig;
        private DateTime _lastCleanupUtc = DateTime.MinValue;

        public ScheduledMessageBackgroundService(
            DeliveryService delivery,
            MessageStore store,
            TimerService timer,
            ILogManager logManager,
            Func<PluginConfiguration> getConfig)
        {
            _delivery = delivery;
            _store = store;
            _timer = timer;
            _logger = logManager.GetLogger(nameof(ScheduledMessageBackgroundService));
            _getConfig = getConfig;
        }

        public async Task RunLoopAsync(CancellationToken token)
        {
            _logger.Info("EmbyCast: scheduled-message background loop started.");
            while (!token.IsCancellationRequested)
            {
                try
                {
                    await ProcessDueAsync().ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.ErrorException("EmbyCast: scheduled-message loop iteration failed.", ex);
                }

                // Piggybacks on this same 20s poll rather than running its own separate loop -
                // checking whether a pending/scheduled Timer job (see TimerService.ScheduleTimer)
                // has reached its start time is cheap enough not to need its own thread, and this
                // loop already exists and ticks at a fine enough granularity for a "start a
                // countdown" feature (not a hard real-time requirement).
                try
                {
                    _timer?.CheckPendingStart();
                }
                catch (Exception ex)
                {
                    _logger.ErrorException("EmbyCast: pending-timer check failed.", ex);
                }

                try
                {
                    if (DateTime.UtcNow - _lastCleanupUtc >= CleanupInterval)
                    {
                        _lastCleanupUtc = DateTime.UtcNow;
                        ProcessCleanup();
                    }
                }
                catch (Exception ex)
                {
                    _logger.ErrorException("EmbyCast: cleanup loop iteration failed.", ex);
                }

                try { await Task.Delay(PollInterval, token).ConfigureAwait(false); }
                catch (TaskCanceledException) { break; }
            }
            _logger.Info("EmbyCast: scheduled-message background loop stopped.");
        }

        /// <summary>"Geplante Reinigung": expires stale offline-queued messages and purges old
        /// history entries per the admin's configured retention. Runs on its own timer inside
        /// this same loop rather than a separate background service, since neither task is
        /// expensive enough to warrant its own thread/loop.</summary>
        private void ProcessCleanup()
        {
            var config = _getConfig();

            // Dashboard's "Automatic cleanup active" toggle (PluginConfiguration.CleanupEnabled) -
            // deliberately does NOT affect the two manual "Delete now" buttons, which call
            // MessageStore.ExpireStaleOffline/PurgeOldHistory directly from EmbyCastApi and never
            // go through this method at all.
            if (!config.CleanupEnabled) return;

            var expired = _store.ExpireStaleOffline(config.OfflineMessageMaxAgeDays);
            if (expired > 0)
            {
                _logger.Info("EmbyCast: expired {0} stale offline message(s).", expired);
            }

            // Defensive clamp: the dashboard already enforces HistoryMaxAgeDays >=
            // OfflineMessageMaxAgeDays, but clamp again here in case that's ever bypassed (e.g.
            // an old config file edited by hand) - a history entry must never be purged while
            // its offline delivery task could still be pending.
            var historyMaxAgeDays = Math.Max(config.HistoryMaxAgeDays, config.OfflineMessageMaxAgeDays);

            var includedTypes = new HashSet<MessageOrigin>();
            if (config.HistoryCleanupIncludeInstant) includedTypes.Add(MessageOrigin.Instant);
            if (config.HistoryCleanupIncludeScheduled) includedTypes.Add(MessageOrigin.Scheduled);
            if (config.HistoryCleanupIncludeTimer) includedTypes.Add(MessageOrigin.Timer);
            if (config.HistoryCleanupIncludeMediaNews) includedTypes.Add(MessageOrigin.MediaNews);
            if (config.HistoryCleanupIncludeWelcome) includedTypes.Add(MessageOrigin.Welcome);
            if (config.HistoryCleanupIncludeOffline) includedTypes.Add(MessageOrigin.Offline);

            if (includedTypes.Count == 0) return;

            var purgedHistory = _store.PurgeOldHistory(historyMaxAgeDays, includedTypes);
            if (purgedHistory > 0)
            {
                _logger.Info("EmbyCast: purged {0} old history entr(y/ies).", purgedHistory);
            }
        }

        /// <summary>A scheduled message more overdue than this (typically: the server was not
        /// running at its send time) is not sent any more - an announcement like "server
        /// maintenance tonight at 22:00" arriving the next morning does more harm than good, and
        /// after a long downtime every overdue message would otherwise fire at once on startup.
        /// Same window MediaNewsAutoScheduler uses for its weekly slot.</summary>
        private static readonly TimeSpan MaxOverdue = TimeSpan.FromHours(6);

        /// <summary>Sends every due message at most once: each is taken out of the store
        /// (TryTakeScheduled) BEFORE sending, so a crash/restart mid-send can't send it again.
        /// If the send fails before anything reached anyone (no history entry was created, e.g.
        /// the session manager wasn't available yet during startup) it is put back and retried
        /// on the next poll - until it becomes too overdue, see MaxOverdue.</summary>
        private async Task ProcessDueAsync()
        {
            var now = DateTime.UtcNow;
            var due = _store.GetDueScheduled(now);
            foreach (var candidate in due)
            {
                // Re-read under the store lock: it may have been cancelled or edited since.
                var scheduled = _store.TryTakeScheduled(candidate.Id);
                if (scheduled == null) continue;

                if (now - scheduled.SendAtUtc > MaxOverdue)
                {
                    RecordMissed(scheduled);
                    continue;
                }

                SendOutcome outcome = null;
                try
                {
                    var mode = Enum.TryParse<RecipientMode>(scheduled.RecipientMode, out var m) ? m : RecipientMode.All;
                    outcome = await _delivery.SendAsync(
                        scheduled.Header,
                        scheduled.Text,
                        scheduled.TimeoutMs,
                        mode,
                        scheduled.SpecificUserIds,
                        MessageOrigin.Scheduled,
                        scheduled.SendAtUtc,
                        specificGroupIds: scheduled.SpecificGroupIds
                    ).ConfigureAwait(false);
                }
                catch (Exception ex)
                {
                    _logger.ErrorException("EmbyCast: failed to send scheduled message {0}.", ex, scheduled.Id);
                }

                if (outcome == null || (outcome.HistoryEntryId == null && outcome.Error != null))
                {
                    // Nothing was sent to anyone - safe to retry without risking duplicates.
                    _store.ReturnScheduled(scheduled);
                    _logger.Warn("EmbyCast: scheduled message '{0}' could not be sent ({1}); will retry.",
                        scheduled.Header, outcome?.Error ?? "exception, see above");
                    continue;
                }

                if (outcome.Error != null)
                {
                    _logger.Warn("EmbyCast: scheduled message '{0}' was only partly sent ({1} delivered, {2} pending, {3} failed): {4}",
                        scheduled.Header, outcome.Delivered, outcome.Pending, outcome.Failed, outcome.Error);
                }
                else
                {
                    _logger.Info("EmbyCast: sent scheduled message '{0}' ({1} delivered, {2} pending, {3} failed)",
                        scheduled.Header, outcome.Delivered, outcome.Pending, outcome.Failed);
                }
            }
        }

        /// <summary>Leaves a visible trace in "Status &amp; History" for a message skipped as too
        /// overdue, instead of it silently vanishing from the scheduled list.</summary>
        private void RecordMissed(ScheduledMessageRecord scheduled)
        {
            _logger.Warn("EmbyCast: scheduled message '{0}' (due {1:u}) was not sent - more than {2} hours overdue, probably because the server was not running at that time.",
                scheduled.Header, scheduled.SendAtUtc, MaxOverdue.TotalHours);

            _store.AddHistory(new HistoryEntry
            {
                MessageType = MessageOrigin.Scheduled.ToString(),
                Header = TextFormatting.NormalizeMessageText(string.IsNullOrWhiteSpace(scheduled.Header) ? "Announcement" : scheduled.Header),
                Text = $"⚠ NOT SENT - more than {MaxOverdue.TotalHours:0} hours overdue (the server was probably not running at the scheduled time).\n\n"
                       + TextFormatting.NormalizeMessageText(scheduled.Text),
                RecipientMode = scheduled.RecipientMode,
                ScheduledForUtc = scheduled.SendAtUtc,
                RequestedUserIds = scheduled.SpecificUserIds ?? new List<string>()
            }, _getConfig().HistoryMaxEntries);
        }
    }
}
