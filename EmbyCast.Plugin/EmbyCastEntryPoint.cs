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

            // A timer that was actively counting down when the server last stopped needs its
            // background run-loop task relaunched explicitly - see TimerService.
            // ResumeAfterRestart's doc comment for why (the in-memory task that drives preset
            // reminders/the final message/post-action only ever existed in the previous
            // process). A pending/scheduled-for-later timer doesn't need this: it's picked up
            // automatically by ScheduledMessageBackgroundService's periodic CheckPendingStart()
            // poll below once its start time arrives, same as if the server hadn't restarted.
            plugin.Timer.ResumeAfterRestart();

            // Offline-queue expiry and history cleanup ("Geplante Reinigung") now run
            // periodically from within ScheduledMessageBackgroundService's own loop instead of
            // once here at startup, so a long-running server without a restart still gets
            // cleaned up on schedule. That same loop also drives TimerService.CheckPendingStart()
            // (see ScheduledMessageBackgroundService.RunLoopAsync) - passed in here rather than
            // given its own polling loop, since a 20s-granularity check is more than fine for
            // "has this scheduled timer's start time arrived yet".
            _scheduledCts = new CancellationTokenSource();
            var scheduledService = new ScheduledMessageBackgroundService(
                plugin.Delivery, plugin.Store, plugin.Timer, _logManager, () => plugin.Configuration);
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

                var isWebSession = DeliveryService.IsWebSession(session);
                await plugin.Delivery.DeliverOfflineQueueForUserAsync(userId, session.UserName, session.Id, isWebSession).ConfigureAwait(false);

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
