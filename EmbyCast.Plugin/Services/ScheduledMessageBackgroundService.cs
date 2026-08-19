using System;
using System.Threading;
using System.Threading.Tasks;
using EmbyCast.Plugin.Models;
using EmbyCast.Plugin.Storage;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// Polls the scheduled-message queue and sends any message whose SendAtUtc has passed.
    /// A simple poll loop (rather than one Task.Delay-until-due per message) keeps this robust
    /// against messages being added/cancelled while the loop sleeps, and against server clock
    /// changes - at the cost of at most ~20s of scheduling jitter, which is fine for this use
    /// case (broadcast announcements, not real-time alerts).
    /// </summary>
    public class ScheduledMessageBackgroundService
    {
        private static readonly TimeSpan PollInterval = TimeSpan.FromSeconds(20);

        private readonly DeliveryService _delivery;
        private readonly MessageStore _store;
        private readonly ILogger _logger;

        public ScheduledMessageBackgroundService(DeliveryService delivery, MessageStore store, ILogManager logManager)
        {
            _delivery = delivery;
            _store = store;
            _logger = logManager.GetLogger(nameof(ScheduledMessageBackgroundService));
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

                try { await Task.Delay(PollInterval, token).ConfigureAwait(false); }
                catch (TaskCanceledException) { break; }
            }
            _logger.Info("EmbyCast: scheduled-message background loop stopped.");
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

                    _store.MarkScheduledSent(scheduled.Id, outcome.HistoryEntryId);
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
