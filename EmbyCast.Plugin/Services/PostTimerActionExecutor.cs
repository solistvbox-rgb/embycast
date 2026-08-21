using System;
using System.Reflection;
using System.Threading.Tasks;
using MediaBrowser.Controller;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// Executes the optional action a countdown timer performs once it reaches zero.
    ///
    /// EXPERIMENTAL / HOST-DEPENDENT: Emby's plugin SDK (mediabrowser.server.core) does not
    /// publish a single, version-stable, documented "restart the server" / "shut the server
    /// down" method on IServerApplicationHost across all builds - the exact member name has
    /// moved around between Emby releases (the dashboard's own Restart/Shutdown buttons call
    /// into the server's private System controller, not a stable plugin-facing API). Rather
    /// than hard-coding a method name that may not compile - or worse, compiles against your
    /// SDK version but silently does nothing on a different server build - this executor uses
    /// reflection to look for a small set of known-plausible method names at runtime and logs
    /// exactly what it did (or didn't) find. If it can't find a matching method it fails safely
    /// (logs an error, does nothing destructive) instead of guessing.
    ///
    /// If you know the exact signature for your target Emby Server version, the safest and
    /// most reliable approach is to replace the reflection call below with a direct call, e.g.
    /// "_appHost.Restart();" - that also gives you a compile-time error immediately if the SDK
    /// doesn't have it, instead of a silent runtime no-op.
    ///
    /// A "MaintenanceMode" action existed here through v1.2.0 and was removed (2026-08-20): it
    /// was never actually wired to Emby's real Dashboard > General maintenance-mode toggle (it
    /// only sent a notice-only message and logged a warning), which a user found misleading. A
    /// real implementation isn't reliably possible either: "maintenance mode" is NOT a concept
    /// the plugin SDK (mediabrowser.server.core 4.8.0.80) exposes at all - Emby's actual
    /// Dashboard toggle is a very recent (~August 2025) beta server feature with no documented,
    /// verifiable plugin-facing property to set. Unlike Restart/Shutdown above, there's no
    /// well-established method-name guess to fall back on via reflection here, so guessing would
    /// risk a silent no-op. If Emby ever documents a stable API for this, re-add it as a new
    /// PostTimerAction case following the same reflection pattern used for Restart/Shutdown.
    /// </summary>
    public static class PostTimerActionExecutor
    {
        public static async Task<string> ExecuteAsync(string action, IServerApplicationHost appHost, ILogger logger)
        {
            switch (action)
            {
                case "None":
                    return "No post-timer action configured.";

                case "RestartServer":
                    return TryInvokeHostMethod(appHost, logger, new[] { "Restart", "RestartAsync" },
                        "Server restart requested via reflection.");

                case "ShutdownServer":
                    return TryInvokeHostMethod(appHost, logger, new[] { "Shutdown", "ShutdownAsync" },
                        "Server shutdown requested via reflection.");

                default:
                    logger.Warn("EmbyCast: unknown post-timer action '{0}'", action);
                    return "Unknown post-timer action; nothing was executed.";
            }
        }

        private static string TryInvokeHostMethod(IServerApplicationHost appHost, ILogger logger, string[] candidateNames, string successMessage)
        {
            foreach (var name in candidateNames)
            {
                try
                {
                    var method = appHost.GetType().GetMethod(name, BindingFlags.Public | BindingFlags.Instance, null, Type.EmptyTypes, null);
                    if (method == null) continue;

                    var result = method.Invoke(appHost, null);
                    if (result is Task task)
                    {
                        // Fire-and-forget is intentional: once Restart/Shutdown actually runs,
                        // this plugin's own process/AppDomain may be torn down mid-await.
                        _ = task.ContinueWith(t =>
                        {
                            if (t.IsFaulted) logger.Error("EmbyCast: {0} task faulted: {1}", name, t.Exception?.Message);
                        });
                    }

                    logger.Warn("EmbyCast: {0}", successMessage);
                    return successMessage;
                }
                catch (Exception ex)
                {
                    logger.Error("EmbyCast: invoking IServerApplicationHost.{0}() failed: {1}", name, ex.Message);
                }
            }

            var failMessage = "Could not find a matching restart/shutdown method on IServerApplicationHost " +
                               "for this Emby Server build. No action was taken - see PostTimerActionExecutor.cs.";
            logger.Error("EmbyCast: {0}", failMessage);
            return failMessage;
        }
    }
}
