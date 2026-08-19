using System.Collections.Generic;
using System.Linq;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// Small shared helper so every place that needs "every user on the server" (recipient
    /// resolution for "All users" broadcasts, the dashboard's user checkbox list, username
    /// lookups for history entries) goes through one spot.
    ///
    /// NOTE on the CS0618 warning: newer Emby SDK builds mark the plain IUserManager.Users
    /// property obsolete in favor of filtered query methods (GetUsers/GetUserList/GetUserIds/
    /// GetUserIdList/GetUserCount). An earlier version of this file tried to call
    /// GetUserList(new UserQuery()) directly, but the exact query-object type/namespace for
    /// that overload is not stable across Emby SDK versions (it failed to compile as
    /// "UserQuery" not found). Rather than keep guessing at a signature we can't verify without
    /// the actual SDK reference in hand - and risk another failed build - we deliberately use
    /// the obsolete-but-guaranteed-to-work .Users property here and suppress the warning. This
    /// plugin's user counts are small (broadcast messaging on a home/family/community server),
    /// so the performance concern behind the deprecation doesn't apply in practice. If you want
    /// to silence this "properly" for your exact SDK version, replace the body below with
    /// whichever GetUserList/GetUsers overload your installed mediabrowser.server.core exposes.
    /// </summary>
    public static class UserLookup
    {
        public static List<User> GetAllUsers(IUserManager userManager)
        {
            if (userManager == null) return new List<User>();

#pragma warning disable CS0618
            return userManager.Users?.ToList() ?? new List<User>();
#pragma warning restore CS0618
        }
    }
}
