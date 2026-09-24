using System;
using System.Collections.Generic;
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

        /// <summary>One token for everything this entry point starts - both polling loops and
        /// the delayed per-login work in OnSessionStarted - cancelled in Dispose().</summary>
        private readonly CancellationTokenSource _lifetimeCts = new CancellationTokenSource();
        private readonly List<Task> _backgroundTasks = new List<Task>();

        /// <summary>How long Dispose() waits for the polling loops to notice cancellation and
        /// exit (each only has to finish its current iteration) before giving up on them.</summary>
        private static readonly TimeSpan ShutdownWait = TimeSpan.FromSeconds(5);

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

            // First, before anything below can read the migrated values (the media-news
            // scheduler in particular) - see Plugin.RunStartupMigrations.
            plugin.RunStartupMigrations();

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
            var token = _lifetimeCts.Token;
            var scheduledService = new ScheduledMessageBackgroundService(
                plugin.Delivery, plugin.Store, plugin.Timer, _logManager, () => plugin.Configuration);
            _backgroundTasks.Add(Task.Run(() => scheduledService.RunLoopAsync(token), token));

            var mediaNewsScheduler = new MediaNewsAutoScheduler(
                () => plugin.Configuration,
                plugin.Store,
                plugin.MediaNews,
                plugin.Delivery,
                _appHost,
                _logManager);
            _backgroundTasks.Add(Task.Run(() => mediaNewsScheduler.RunLoopAsync(token), token));

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
                // Give the client UI a moment to finish initializing before pushing a popup -
                // cancellable, so a server shutdown doesn't leave this pending (and then acting
                // on a half-disposed plugin).
                await Task.Delay(8000, _lifetimeCts.Token).ConfigureAwait(false);

                var isWebSession = DeliveryService.IsWebSession(session);
                await plugin.Delivery.DeliverOfflineQueueForUserAsync(userId, session.UserName, session.Id, isWebSession).ConfigureAwait(false);

                var config = plugin.Configuration;
                // Claimed atomically BEFORE sending (see MessageStore.TryMarkWelcomed), so two
                // sessions of the same user starting at once can't both send it - and released
                // again if the send didn't reach the user (neither delivered live nor queued for
                // offline delivery), so they get it on a later login instead of never.
                if (config.WelcomeMessageEnabled && plugin.Store.TryMarkWelcomed(userId))
                {
                    var welcomed = false;
                    try
                    {
                        var outcome = await plugin.Delivery.SendAsync(
                            config.WelcomeMessageHeader,
                            config.WelcomeMessageText,
                            config.WelcomeMessageTimeoutMs,
                            RecipientMode.Specific,
                            new[] { userId },
                            MessageOrigin.Welcome
                        ).ConfigureAwait(false);

                        welcomed = outcome.Error == null && outcome.Delivered + outcome.Pending > 0;
                        if (!welcomed)
                            _logger.Warn("EmbyCast: welcome message for {0} was not delivered ({1}); will retry on the next login.",
                                session.UserName, outcome.Error ?? "no session reached");
                    }
                    finally
                    {
                        if (!welcomed) plugin.Store.UnmarkWelcomed(userId);
                    }
                }
            }
            catch (OperationCanceledException)
            {
                // Server shutting down (or CTS already disposed) - nothing left to do.
            }
            catch (ObjectDisposedException)
            {
                // Same - the entry point was disposed while this login was still being handled.
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: OnSessionStarted handling failed for {0}.", ex, session.UserName);
            }
        }

        public void Dispose()
        {
            if (_sessionManager != null)
            {
                _sessionManager.SessionStarted -= OnSessionStarted;
            }

            try { _lifetimeCts.Cancel(); } catch { /* ignore */ }

            Plugin.Instance?.Timer.StopForShutdown();

            // Give the loops a moment to finish their current iteration (e.g. a store write in
            // progress) instead of abandoning them mid-way, but never block shutdown for long.
            try
            {
                if (_backgroundTasks.Count > 0 && !Task.WaitAll(_backgroundTasks.ToArray(), ShutdownWait))
                    _logger.Warn("EmbyCast: background loops did not stop within {0}s; continuing shutdown.", ShutdownWait.TotalSeconds);
            }
            catch (AggregateException)
            {
                // Cancelled/faulted loops - expected during shutdown, already logged by the loops.
            }

            _lifetimeCts.Dispose();
        }
    }
}
