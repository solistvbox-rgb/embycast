using System;

namespace EmbyCast.Plugin
{
    /// <summary>
    /// Normalizes user ids to one canonical string form before they're ever compared or used
    /// as a dictionary/lookup key.
    ///
    /// Why this exists: this plugin derives "who is this user" from two different sources -
    /// <c>IUserManager</c> user objects (<c>User.Id</c>, a <c>Guid</c>) and
    /// <c>ISessionManager</c> session objects (<c>SessionInfo.UserId</c>). Depending on the
    /// exact Emby SDK build, these can end up as slightly different textual representations of
    /// the same GUID (different casing, with/without dashes, etc.) even though they identify
    /// the same user. A naive `string.Equals` between "the id the admin picked in the checkbox
    /// list" and "the id on the live session" can then silently fail to match - the user looks
    /// offline even though they have an active session, so the message gets queued instead of
    /// delivered live (and never actually flips to "Delivered" once the mismatch also breaks
    /// offline-queue lookups on next login). Routing every user id through this helper before
    /// comparing/storing removes that class of bug entirely: two ids that represent the same
    /// GUID always normalize to the exact same string, regardless of source format.
    /// </summary>
    public static class IdNormalization
    {
        /// <summary>Returns the canonical (lowercase, no-dashes) form of a GUID-shaped id, or
        /// the original string unchanged if it isn't a GUID (defensive fallback for SDK builds
        /// that use a non-GUID user id format).</summary>
        public static string Normalize(object rawId)
        {
            if (rawId == null) return null;
            var text = rawId as string ?? rawId.ToString();
            if (string.IsNullOrEmpty(text)) return text;
            return Guid.TryParse(text, out var guid) ? guid.ToString("N") : text;
        }
    }
}
