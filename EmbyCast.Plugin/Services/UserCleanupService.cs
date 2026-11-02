using System;
using System.Collections.Generic;
using System.Linq;
using EmbyCast.Plugin.Configuration;
using EmbyCast.Plugin.Storage;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// Keeps EmbyCast's stored user references in sync with the users that actually exist in
    /// Emby. Without this, a user deleted in Emby stayed in every group, in "Specific" recipient
    /// lists of scheduled messages / the timer / Media News auto-send, and in the welcomed list -
    /// and every send to such a group queued an offline message that could never be delivered
    /// (shown as "Pending" with a bare user id until offline expiry).
    ///
    /// Two entry points, both called from EmbyCastEntryPoint:
    ///  - <see cref="OnUserDeleted"/>: Emby's IUserManager.UserDeleted event, for deletions while
    ///    the server runs;
    ///  - <see cref="ReconcileWithExistingUsers"/>: once at startup, for deletions that happened
    ///    while EmbyCast wasn't running, or before it handled deletions at all.
    /// </summary>
    public class UserCleanupService
    {
        private readonly IServerApplicationHost _appHost;
        private readonly MessageStore _store;
        private readonly Func<PluginConfiguration> _getConfig;
        private readonly Action<Action<PluginConfiguration>> _mutateConfig;
        private readonly EmbyCastLogger _logger;

        public UserCleanupService(
            IServerApplicationHost appHost,
            MessageStore store,
            Func<PluginConfiguration> getConfig,
            Action<Action<PluginConfiguration>> mutateConfig,
            ILogManager logManager)
        {
            _appHost = appHost;
            _store = store;
            _getConfig = getConfig;
            _mutateConfig = mutateConfig;
            _logger = new EmbyCastLogger(logManager.GetLogger(nameof(UserCleanupService)));
        }

        /// <summary>Removes all references to one user. <paramref name="username"/> is optional
        /// (known for live deletions, unknown during startup reconciliation).</summary>
        public void RemoveUser(string userId, string username)
        {
            var id = IdNormalization.Normalize(userId);
            if (string.IsNullOrEmpty(id)) return;

            var report = _store.RemoveUserReferences(id, username);
            var removedFromMediaNews = RemoveFromMediaNewsRecipients(id);

            if (report.Any || removedFromMediaNews)
            {
                _logger.Info("EmbyCast: removed deleted user {0} ({1}) - {2}, Media News recipients: {3}.",
                    string.IsNullOrEmpty(username) ? "?" : username, id, report, removedFromMediaNews ? "yes" : "no");
            }
        }

        public void OnUserDeleted(User user)
        {
            if (user == null) return;
            try
            {
                RemoveUser(IdNormalization.Normalize(user.Id), user.Name);
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: cleanup after deletion of user {0} failed.", ex, user.Name);
            }
        }

        /// <summary>Removes references to every user id EmbyCast still stores but Emby no longer
        /// knows. Refuses to run on an empty user list: Emby always has at least one
        /// (administrator) account, so an empty list can only mean the lookup failed - acting on
        /// it would wipe every group and recipient list.</summary>
        public void ReconcileWithExistingUsers()
        {
            try
            {
                var userManager = _appHost.Resolve<IUserManager>();
                if (userManager == null)
                {
                    _logger.Warn("EmbyCast: user reconciliation skipped - IUserManager not available.");
                    return;
                }

                var existing = new HashSet<string>(
                    UserLookup.GetAllUsers(userManager).Select(u => IdNormalization.Normalize(u.Id)).Where(id => !string.IsNullOrEmpty(id)),
                    StringComparer.OrdinalIgnoreCase);
                if (existing.Count == 0)
                {
                    _logger.Warn("EmbyCast: user reconciliation skipped - Emby returned no users at all.");
                    return;
                }

                var referenced = _store.GetReferencedUserIds().Concat(GetMediaNewsRecipientIds())
                    .Distinct(StringComparer.OrdinalIgnoreCase);
                var orphaned = referenced.Where(id => !existing.Contains(id)).ToList();
                if (orphaned.Count == 0) return;

                _logger.Info("EmbyCast: found {0} reference(s) to user(s) that no longer exist in Emby - cleaning up.", orphaned.Count);
                foreach (var id in orphaned) RemoveUser(id, null);
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: user reconciliation failed.", ex);
            }
        }

        private IEnumerable<string> GetMediaNewsRecipientIds() =>
            SplitCsv(_getConfig().MediaNewsSpecificUserIdsCsv).Select(IdNormalization.Normalize);

        private bool RemoveFromMediaNewsRecipients(string normalizedId)
        {
            bool IsTarget(string x) => string.Equals(IdNormalization.Normalize(x), normalizedId, StringComparison.OrdinalIgnoreCase);

            // Cheap unlocked pre-check, so the common case (user not a Media News recipient)
            // doesn't rewrite the config file; the actual filter runs inside the serialized
            // mutation so a concurrent dashboard save can't be lost.
            if (!SplitCsv(_getConfig().MediaNewsSpecificUserIdsCsv).Any(IsTarget)) return false;

            var removed = false;
            _mutateConfig(c =>
            {
                var before = SplitCsv(c.MediaNewsSpecificUserIdsCsv);
                var after = before.Where(x => !IsTarget(x)).ToList();
                if (after.Count == before.Count) return;
                c.MediaNewsSpecificUserIdsCsv = string.Join(",", after);
                removed = true;
            });
            return removed;
        }

        private static List<string> SplitCsv(string csv) =>
            string.IsNullOrWhiteSpace(csv)
                ? new List<string>()
                : csv.Split(',').Select(s => s.Trim()).Where(s => s.Length > 0).ToList();
    }
}
