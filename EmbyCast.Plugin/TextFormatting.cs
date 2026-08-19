using System.Net;
using System.Text.RegularExpressions;

namespace EmbyCast.Plugin
{
    /// <summary>
    /// Shared helpers for preparing text that goes into a MediaBrowser.Model.Session.MessageCommand.
    /// Emby's web client can HTML-encode Header/Text fields more than once as they pass through
    /// the request pipeline and then renders the (still-encoded) result as plain text in the
    /// popup. The reference EmbyNotify / EmbyWeeklyDigest plugins work around this by fully
    /// decoding any nested entities and swapping the characters that would otherwise round-trip
    /// as literal "&amp;amp;" etc. for visually equivalent Unicode look-alikes. We reuse the same
    /// approach here so all message types (instant, scheduled, timer, media news, welcome,
    /// offline) render identically and correctly in the client.
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
    }
}
