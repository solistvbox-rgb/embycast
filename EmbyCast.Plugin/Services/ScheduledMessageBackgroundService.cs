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
        private readonly ILogger _logger;
        private readonly Func<PluginConfiguration> _getConfig;
        private DateTime _lastCleanupUtc = DateTime.MinValue;

        public ScheduledMessageBackgroundService(
            DeliveryService delivery,
            MessageStore store,
            ILogManager logManager,
            Func<PluginConfiguration> getConfig)
        {
            _delivery = delivery;
            _store = store;
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
                    _logger.Error("EmbyCast: scheduled-message loop iteration failed: {0}", ex.Message);
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
                    _logger.Error("EmbyCast: cleanup loop iteration failed: {0}", ex.Message);
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

        private async Task ProcessDueAsync()
        {
            var due = _store.GetDueScheduled(DateTime.UtcNow);
            foreach (var scheduled in due)
            {
                try
                {
                    var mode = Enum.TryParse<RecipientMode>(scheduled.RecipientMode, out var m) ? m : RecipientMode.All;
                    var outcome = await _delivery.SendAsync(
                        scheduled.Header,
                        scheduled.Text,
                        scheduled.TimeoutMs,
                        mode,
                        scheduled.SpecificUserIds,
                        MessageOrigin.Scheduled,
                        scheduled.SendAtUtc
                    ).ConfigureAwait(false);

                    _store.MarkScheduledSent(scheduled.Id);
                    _logger.Info("EmbyCast: sent scheduled message '{0}' ({1} delivered, {2} pending, {3} failed)",
                        scheduled.Header, outcome.Delivered, outcome.Pending, outcome.Failed);
                }
                catch (Exception ex)
                {
                    _logger.Error("EmbyCast: failed to send scheduled message {0}: {1}", scheduled.Id, ex.Message);
                }
            }
        }
    }
}
