using System;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin
{
    /// <summary>Values of the "Logging" setting (PluginConfiguration.LogLevel).</summary>
    public static class EmbyCastLogLevels
    {
        public const string Nothing = "Nothing";
        public const string ErrorsOnly = "ErrorsOnly";
        public const string ErrorsAndWarnings = "ErrorsAndWarnings";
        public const string Verbose = "Verbose";

        public const string Default = ErrorsAndWarnings;

        private static readonly string[] All = { Nothing, ErrorsOnly, ErrorsAndWarnings, Verbose };

        /// <summary>True for one of the four known names (case-insensitive).</summary>
        public static bool IsValid(string value)
        {
            foreach (var level in All)
                if (string.Equals(value, level, StringComparison.OrdinalIgnoreCase)) return true;
            return false;
        }

        /// <summary>The canonical spelling of a known level; unknown or empty values become
        /// <see cref="Default"/>.</summary>
        public static string Normalize(string value)
        {
            foreach (var level in All)
                if (string.Equals(value, level, StringComparison.OrdinalIgnoreCase)) return level;
            return Default;
        }
    }

    /// <summary>
    /// Wraps Emby's ILogger and checks every entry against the admin's "Logging" setting
    /// (Settings tile) - takes effect immediately, no restart needed:
    ///   Nothing           - nothing at all
    ///   ErrorsOnly        - Error
    ///   ErrorsAndWarnings - Error + Warn (default)
    ///   Verbose           - everything, incl. Info (start/stop, every message sent, Media News
    ///                       queries with library paths, user cleanup) and Debug
    /// Deliberately not an ILogger implementation: that interface differs between Emby versions.
    /// </summary>
    public class EmbyCastLogger
    {
        private readonly ILogger _inner;

        public EmbyCastLogger(ILogger inner)
        {
            _inner = inner;
        }

        private static int CurrentLevel
        {
            get
            {
                string configured;
                try
                {
                    configured = Plugin.Instance?.Configuration?.LogLevel;
                }
                catch
                {
                    // While Emby is still constructing the plugin, Configuration can't be read yet
                    // (see Plugin's constructor) - use the default for that short phase.
                    configured = null;
                }
                switch (EmbyCastLogLevels.Normalize(configured))
                {
                    case EmbyCastLogLevels.Nothing: return 0;
                    case EmbyCastLogLevels.ErrorsOnly: return 1;
                    case EmbyCastLogLevels.Verbose: return 3;
                    default: return 2;
                }
            }
        }

        public void Debug(string message, params object[] args)
        {
            if (CurrentLevel >= 3) _inner.Debug(message, args);
        }

        public void Info(string message, params object[] args)
        {
            if (CurrentLevel >= 3) _inner.Info(message, args);
        }

        public void Warn(string message, params object[] args)
        {
            if (CurrentLevel >= 2) _inner.Warn(message, args);
        }

        public void Error(string message, params object[] args)
        {
            if (CurrentLevel >= 1) _inner.Error(message, args);
        }

        public void ErrorException(string message, Exception exception, params object[] args)
        {
            if (CurrentLevel >= 1) _inner.ErrorException(message, exception, args);
        }
    }
}
