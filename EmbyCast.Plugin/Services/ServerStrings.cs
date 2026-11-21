using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text.Json;

namespace EmbyCast.Plugin.Services
{
    /// <summary>Texts the server writes itself (Media News section labels, the "nothing new"
    /// notes, the timer's end text, the System Message test). They come from the same
    /// strings.&lt;lang&gt;.json files the dashboard uses (Configuration/Web/strings), so both
    /// always say the same; English is built in here as the fallback.</summary>
    internal static class ServerStrings
    {
        /// <summary>Must match LANGUAGES in Configuration/Web/app.js.</summary>
        internal static readonly string[] Languages = { "en", "de", "fr", "es", "pt-BR", "it", "nl", "pl", "ru", "zh-CN" };

        private static readonly Dictionary<string, string> English = new Dictionary<string, string>(StringComparer.Ordinal)
        {
            ["mediaNewsStructureMovies"] = "New Movies:",
            ["mediaNewsStructureSeries"] = "New TV Shows:",
            ["mediaNewsStructureEpisodes"] = "New Episodes:",
            ["defaultTimerText"] = "The server will restart in {minutes} minute(s).",
            ["defaultTimerTextShutdown"] = "The server will shut down in {minutes} minute(s).",
            ["defaultTimerTextNone"] = "Countdown: {minutes} minute(s) remaining",
            ["timerFinalRestart"] = "The server will restart now.",
            ["timerFinalShutdown"] = "The server will shut down now.",
            ["timerFinalNone"] = "Countdown: finished",
            ["serverNoLibrary"] = "Please select at least one library before the message can be sent.",
            ["serverNothingNew"] = "No new media in the selected period; nothing sent.",
            ["serverNoNewsWeek"] = "No new movies or TV shows this week.",
            ["systemTestTitle"] = "EmbyCast test",
            ["systemTestText"] = "Test of the System Message \"{0}\" - this is how it looks."
        };

        private static readonly ConcurrentDictionary<string, Dictionary<string, string>> Loaded =
            new ConcurrentDictionary<string, Dictionary<string, string>>(StringComparer.Ordinal);

        /// <summary>Maps any culture code ("de-CH", "pt", "zh-Hans", ...) to one of Languages,
        /// or "en". Must stay in sync with normalizeLanguage() in app.js.</summary>
        internal static string Normalize(string code)
        {
            var c = (code ?? "").Trim().ToLowerInvariant().Replace('_', '-');
            if (c.Length == 0) return "en";
            if (c.StartsWith("pt", StringComparison.Ordinal)) return "pt-BR";
            if (c.StartsWith("zh", StringComparison.Ordinal)) return "zh-CN";
            var dash = c.IndexOf('-');
            var baseCode = dash < 0 ? c : c.Substring(0, dash);
            return Array.IndexOf(Languages, baseCode) >= 0 ? baseCode : "en";
        }

        internal static string Get(string language, string key)
        {
            var lang = Normalize(language);
            if (lang != "en" && Dictionary(lang).TryGetValue(key, out var text) && !string.IsNullOrEmpty(text))
                return text;
            return English.TryGetValue(key, out var en) ? en : key;
        }

        /// <summary>Get with "{0}", "{1}", ... replaced (no string.Format, so braces in the
        /// inserted values or in other placeholders like {minutes} are left alone).</summary>
        internal static string Format(string language, string key, params string[] values)
        {
            var text = Get(language, key);
            for (var i = 0; i < values.Length; i++)
                text = text.Replace("{" + i + "}", values[i] ?? "");
            return text;
        }

        /// <summary>The timer text for the moment the countdown ends, if the template is one of
        /// the shipped default texts (in any language) - otherwise null.</summary>
        internal static string FinalTimerText(string template)
        {
            var text = (template ?? "").Trim();
            if (text.Length == 0) return null;
            foreach (var lang in Languages)
            {
                if (Matches(lang, "defaultTimerText", text)) return Get(lang, "timerFinalRestart");
                if (Matches(lang, "defaultTimerTextShutdown", text)) return Get(lang, "timerFinalShutdown");
                if (Matches(lang, "defaultTimerTextNone", text)) return Get(lang, "timerFinalNone");
            }
            return null;
        }

        private static bool Matches(string lang, string key, string text)
        {
            var dict = lang == "en" ? English : Dictionary(lang);
            return dict.TryGetValue(key, out var value) && string.Equals(value, text, StringComparison.Ordinal);
        }

        private static Dictionary<string, string> Dictionary(string lang) => Loaded.GetOrAdd(lang, LoadDictionary);

        private static Dictionary<string, string> LoadDictionary(string lang)
        {
            try
            {
                var bytes = EmbeddedWebFiles.Load("strings." + lang + ".json");
                return JsonSerializer.Deserialize<Dictionary<string, string>>(bytes)
                    ?? new Dictionary<string, string>();
            }
            catch (Exception)
            {
                // Missing or broken language file: English is used instead.
                return new Dictionary<string, string>();
            }
        }
    }

    /// <summary>Reads files of Configuration/Web embedded in the plugin assembly. The build
    /// embeds app.html, app.js and strings/*.json gzip-compressed as "&lt;name&gt;.gz" (see the
    /// EmbedCompressedDashboard target in EmbyCast.Plugin.csproj); a plain resource is used as
    /// fallback if a build ever embeds them uncompressed.</summary>
    internal static class EmbeddedWebFiles
    {
        internal static byte[] Load(string fileName)
        {
            var assembly = typeof(Plugin).Assembly;
            var resourceName = typeof(Plugin).Namespace + ".Configuration.Web." + fileName;

            using (var compressed = assembly.GetManifestResourceStream(resourceName + ".gz"))
            {
                if (compressed != null)
                {
                    using (var gzip = new GZipStream(compressed, CompressionMode.Decompress))
                    using (var buffer = new MemoryStream())
                    {
                        gzip.CopyTo(buffer);
                        return buffer.ToArray();
                    }
                }
            }

            using (var plain = assembly.GetManifestResourceStream(resourceName))
            {
                if (plain == null)
                    throw new FileNotFoundException("Embedded dashboard resource not found: " + resourceName + "(.gz)");
                using (var buffer = new MemoryStream())
                {
                    plain.CopyTo(buffer);
                    return buffer.ToArray();
                }
            }
        }
    }
}
