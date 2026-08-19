using System;
using System.Threading;
using System.Threading.Tasks;
using EmbyCast.Plugin.Models;
using EmbyCast.Plugin.Services;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Plugins;
using MediaBrowser.Controller.Session;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin
{
    /// <summary>
    /// Server-lifecycle hook (start/stop) for everything this plugin does in the background:
    ///  - listens for ISessionManager.SessionStarted to (a) flush any offline-queued messages
    ///    for that user and (b) send the one-time welcome message to first-time users;
    ///  - runs the scheduled-message polling loop;
    ///  - runs the weekly media-news auto-send polling loop.
    ///
    /// Constructor parameters (ISessionManager, ILogManager) are supplied by Emby's own DI
    /// container when it instantiates every IServerEntryPoint implementation - the same
    /// pattern used by the reference EmbyNotify / EmbyWeeklyDigest plugins - rather than
    /// resolved manually, which keeps this class testable and avoids relying on
    /// IServerApplicationHost.Resolve&lt;T&gt;() for services that are already available as
    /// constructor dependencies.
    ///
    /// Only administrators can trigger sends via the API (see Api/EmbyCastApi.cs,
    /// [Authenticated(Roles = "Admin")]); this entry point only reacts to server-side events,
    /// so no additional permission check is needed here.
    /// </summary>
    public class EmbyCastEntryPoint : IServerEntryPoint
    {
        private readonly IServerApplicationHost _appHost;
        private readonly ISessionManager _sessionManager;
        private readonly ILogManager _logManager;
        private readonly ILogger _logger;

        private CancellationTokenSource _scheduledCts;
        private CancellationTokenSource _mediaNewsCts;

        public EmbyCastEntryPoint(IServerApplicationHost appHost, ISessionManager sessionManager, ILogManager logManager)
        {
            _appHost = appHost;
            _sessionManager = sessionManager;
            _logManager = logManager;
            _logger = logManager.GetLogger(nameof(EmbyCastEntryPoint));
        }

        public void Run()
        {
            var plugin = Plugin.Instance;
            if (plugin == null)
            {
                _logger.Error("EmbyCast: Plugin.Instance was null during entry point Run(); background services not started.");
                return;
            }

            if (_sessionManager != null)
            {
                _sessionManager.SessionStarted += OnSessionStarted;
            }
            else
            {
                _logger.Warn("EmbyCast: ISessionManager not available; offline delivery and welcome messages are disabled.");
            }

            // Purge any offline messages that have been waiting too long for a user who never
            // logged back in, so the queue doesn't grow forever.
            try
            {
                var purged = plugin.Store.PurgeStaleOffline(plugin.Configuration.OfflineMessageMaxAgeDays);
                if (purged > 0) _logger.Info("EmbyCast: purged {0} stale offline message(s).", purged);
            }
            catch (Exception ex)
            {
                _logger.Warn("EmbyCast: offline queue purge failed: {0}", ex.Message);
            }

            _scheduledCts = new CancellationTokenSource();
            var scheduledService = new ScheduledMessageBackgroundService(plugin.Delivery, plugin.Store, _logManager);
            _ = Task.Run(() => scheduledService.RunLoopAsync(_scheduledCts.Token), _scheduledCts.Token);

            _mediaNewsCts = new CancellationTokenSource();
            var mediaNewsScheduler = new MediaNewsAutoScheduler(
                () => plugin.Configuration,
                cfg => plugin.PersistConfiguration(cfg),
                plugin.MediaNews,
                plugin.Delivery,
                _appHost,
                _logManager);
            _ = Task.Run(() => mediaNewsScheduler.RunLoopAsync(_mediaNewsCts.Token), _mediaNewsCts.Token);

            _logger.Info("EmbyCast: entry point started.");
        }

        private async void OnSessionStarted(object sender, SessionEventArgs e)
        {
            var plugin = Plugin.Instance;
            var session = e?.SessionInfo;
            if (plugin == null || session == null) return;

            // Normalized to the same canonical form DeliveryService uses everywhere else, so
            // offline-queue lookups and welcome-message tracking reliably match regardless of
            // how this Emby build formats SessionInfo.UserId - see IdNormalization.cs.
            var userId = IdNormalization.Normalize(session.UserId);
            if (string.IsNullOrEmpty(userId)) return;

            try
            {
                // Give the client UI a moment to finish initializing before pushing a popup.
                await Task.Delay(8000).ConfigureAwait(false);

                await plugin.Delivery.DeliverOfflineQueueForUserAsync(userId, session.UserName, session.Id).ConfigureAwait(false);

                var config = plugin.Configuration;
                if (config.WelcomeMessageEnabled && !plugin.Store.HasWelcomed(userId))
                {
                    await plugin.Delivery.SendAsync(
                        config.WelcomeMessageHeader,
                        config.WelcomeMessageText,
                        config.WelcomeMessageTimeoutMs,
                        RecipientMode.Specific,
                        new[] { userId },
                        MessageOrigin.Welcome
                    ).ConfigureAwait(false);

                    plugin.Store.MarkWelcomed(userId);
                }
            }
            catch (Exception ex)
            {
                _logger.Warn("EmbyCast: OnSessionStarted handling failed for {0}: {1}", session.UserName, ex.Message);
            }
        }

        public void Dispose()
        {
            if (_sessionManager != null)
            {
                _sessionManager.SessionStarted -= OnSessionStarted;
            }

            try { _scheduledCts?.Cancel(); } catch { /* ignore */ }
            try { _mediaNewsCts?.Cancel(); } catch { /* ignore */ }

            Plugin.Instance?.Timer.StopForShutdown();
        }
    }
}
