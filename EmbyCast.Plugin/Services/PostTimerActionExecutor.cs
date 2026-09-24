using System;
using System.Threading.Tasks;
using MediaBrowser.Controller;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// Executes the optional action a countdown timer performs once it reaches zero.
    ///
    /// Calls IApplicationHost.Restart() / Shutdown() (inherited by IServerApplicationHost)
    /// directly. An earlier version looked these up by name via reflection on the concrete host
    /// type, out of concern that the member names vary between Emby builds - but that could
    /// silently find nothing (e.g. an explicit interface implementation isn't a public method
    /// of the concrete type) and do nothing at runtime. Both members are part of the SDK this
    /// plugin compiles against (verified against mediabrowser.server.core 4.8.0.80), so a
    /// missing/renamed member in a future SDK now shows up as a compile error instead.
    ///
    /// A "MaintenanceMode" action existed here through v1.2.0 and was removed (2026-08-20): it
    /// was never actually wired to Emby's real Dashboard > General maintenance-mode toggle (it
    /// only sent a notice-only message and logged a warning), which a user found misleading. A
    /// real implementation isn't reliably possible either: "maintenance mode" is NOT a concept
    /// the plugin SDK (mediabrowser.server.core 4.8.0.80) exposes at all. If Emby ever documents
    /// a stable API for this, re-add it as a new PostTimerAction case.
    /// </summary>
    public static class PostTimerActionExecutor
    {
        public static Task<string> ExecuteAsync(string action, IServerApplicationHost appHost, ILogger logger)
        {
            switch (action)
            {
                case "None":
                    return Task.FromResult("No post-timer action configured.");

                case "RestartServer":
                    return Task.FromResult(Restart(appHost, logger));

                case "ShutdownServer":
                    return Task.FromResult(Shutdown(appHost, logger));

                default:
                    logger.Warn("EmbyCast: unknown post-timer action '{0}'", action);
                    return Task.FromResult("Unknown post-timer action; nothing was executed.");
            }
        }

        private static string Restart(IServerApplicationHost appHost, ILogger logger)
        {
            // Same condition Emby's own dashboard uses to offer "Restart": e.g. a server running
            // as a Windows service or in some container setups can't restart itself.
            if (!appHost.CanSelfRestart)
            {
                const string msg = "This Emby Server installation cannot restart itself (CanSelfRestart=false) - no restart was performed. Restart it manually.";
                logger.Error("EmbyCast: {0}", msg);
                return msg;
            }

            try
            {
                appHost.Restart();
                const string ok = "Server restart requested.";
                logger.Warn("EmbyCast: {0}", ok);
                return ok;
            }
            catch (Exception ex)
            {
                logger.ErrorException("EmbyCast: server restart failed.", ex);
                return "Server restart failed - see the Emby server log.";
            }
        }

        private static string Shutdown(IServerApplicationHost appHost, ILogger logger)
        {
            try
            {
                var task = appHost.Shutdown();
                // Not awaited on purpose: once shutdown actually runs, this plugin's own
                // background task may be torn down mid-await. Faults are still logged.
                task?.ContinueWith(t =>
                {
                    if (t.IsFaulted) logger.ErrorException("EmbyCast: server shutdown failed.", t.Exception);
                }, TaskContinuationOptions.OnlyOnFaulted);

                const string ok = "Server shutdown requested.";
                logger.Warn("EmbyCast: {0}", ok);
                return ok;
            }
            catch (Exception ex)
            {
                logger.ErrorException("EmbyCast: server shutdown failed.", ex);
                return "Server shutdown failed - see the Emby server log.";
            }
        }
    }
}
