using System.Collections.Generic;
using System.Linq;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Querying;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// Small shared helper so every place that needs "every user on the server" (recipient
    /// resolution for "All users" broadcasts, the dashboard's user checkbox list, username
    /// lookups for history entries) goes through one spot.
    ///
    /// Uses IUserManager.GetUserList(UserQuery) - the replacement the SDK itself names for the
    /// obsolete IUserManager.Users property. An empty UserQuery sets no filter, so this returns
    /// every user (including disabled/hidden ones), exactly like Users did. An earlier attempt
    /// at this failed to compile only because UserQuery was looked for in the wrong namespace;
    /// it lives in MediaBrowser.Model.Querying (verified against mediabrowser.server.core
    /// 4.8.0.80).
    /// </summary>
    public static class UserLookup
    {
        public static List<User> GetAllUsers(IUserManager userManager)
        {
            if (userManager == null) return new List<User>();
            return userManager.GetUserList(new UserQuery())?.ToList() ?? new List<User>();
        }
    }
}
