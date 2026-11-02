using System.Net;
using System.Text.RegularExpressions;

namespace EmbyCast.Plugin
{
    /// <summary>
    /// Shared helpers for preparing text that goes into a MediaBrowser.Model.Session.MessageCommand.
    /// Emby's web client can HTML-encode Header/Text fields more than once as they pass through
    /// the request pipeline and then renders the (still-encoded) result as plain text in the
    /// popup. Work-around: fully decode any nested entities and swap the characters that would
    /// otherwise round-trip as literal "&amp;amp;" etc. for visually equivalent Unicode
    /// look-alikes, so all message types render correctly in the client.
    /// </summary>
    public static class TextFormatting
    {
        private static readonly Regex TrailingYearPattern = new Regex(@"\((\d{4})\)\s*$");
        private static readonly Regex DuplicateYearPattern = new Regex(@"(\(\d{4}\))\s*\1");

        public static string NormalizeMessageText(string value)
        {
            var current = value ?? "";
            for (var i = 0; i < 8; i++)
            {
                var decoded = WebUtility.HtmlDecode(current);
                if (decoded == current) break;
                current = decoded;
            }
            return current;
        }

        /// <summary>Decode + swap characters that Emby's client would otherwise re-encode and
        /// display literally (e.g. "&amp;amp;" instead of "&amp;").</summary>
        public static string PrepareForEmbyDisplay(string value)
        {
            return NormalizeMessageText(value)
                .Replace("->", "→")
                .Replace("<-", "←")
                .Replace("&", "＆")
                .Replace("<", "＜")
                .Replace(">", "＞");
        }

        /// <summary>Collapses a duplicated "(2024) (2024)" year suffix that can occur when a
        /// title already contains the year and we append it again.</summary>
        public static string CollapseDuplicateYear(string title)
        {
            return DuplicateYearPattern.Replace(title ?? "", "$1");
        }

        public static bool HasTrailingYear(string title) => TrailingYearPattern.IsMatch(title ?? "");

        /// <summary>Separator for <see cref="JoinLinesForToast"/>. Must match TOAST_LINE_SEPARATOR
        /// in Configuration/Web/app.js (dashboard preview).</summary>
        public const string ToastLineSeparator = " · ";

        private static readonly Regex LineBreaks = new Regex(@"\r\n|\r|\n");

        /// <summary>Short pop-ups ("toasts", any TimeoutMs &gt; 0) show their text on one line -
        /// Emby's clients render it as HTML without preserving line breaks, so separate lines
        /// would run together ("Line one Line two"). Joins non-empty, trimmed lines with
        /// <see cref="ToastLineSeparator"/> instead.</summary>
        public static string JoinLinesForToast(string text)
        {
            if (string.IsNullOrEmpty(text)) return text ?? "";
            var parts = LineBreaks.Split(text);
            var kept = new System.Collections.Generic.List<string>(parts.Length);
            foreach (var p in parts)
            {
                var trimmed = p.Trim();
                if (trimmed.Length > 0) kept.Add(trimmed);
            }
            return string.Join(ToastLineSeparator, kept);
        }
    }
}
