using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EmbyCast.Plugin.Configuration;
using EmbyCast.Plugin.Models;
using EmbyCast.Plugin.Storage;
using MediaBrowser.Controller;
using MediaBrowser.Controller.Entities;
using MediaBrowser.Controller.Library;
using MediaBrowser.Controller.Session;
using MediaBrowser.Model.Logging;
using MediaBrowser.Model.Session;

namespace EmbyCast.Plugin.Services
{
    public class SendOutcome
    {
        public string HistoryEntryId { get; set; }
        public int Delivered { get; set; }
        public int Pending { get; set; }
        public int Failed { get; set; }
        /// <summary>SendPersonalizedAsync only: targeted users who got nothing because there was
        /// nothing for them (e.g. Media News with no new media in any library they can access).</summary>
        public int NoContent { get; set; }
        public string Error { get; set; }
    }

    /// <summary>
    /// Central place that actually talks to <see cref="ISessionManager"/>. Every message type
    /// (instant, scheduled, timer, media news, welcome) funnels through <see cref="SendAsync"/>
    /// so recipient resolution, offline queueing and history logging behave identically
    /// everywhere.
    ///
    /// Recipient resolution rules:
    ///  - Active:   only currently active sessions get the message; nothing is queued for
    ///              anyone else (that's the point of "active users only").
    ///  - All:      every known user is targeted. Users with an active session get the
    ///              message immediately; users without one get it queued as an offline
    ///              message (delivered by SessionEventListener on their next login), unless
    ///              offline delivery is disabled in the configuration.
    ///  - Specific: same as All, but restricted to the given list of user ids.
    ///
    /// IMPORTANT: this class always resolves ISessionManager/IUserManager fresh via
    /// IServerApplicationHost.Resolve&lt;T&gt;() on every call instead of caching them in the
    /// constructor. That is what guarantees timer/countdown messages always see users who
    /// logged in after the timer was started (see TimerService).
    /// </summary>
    public class DeliveryService
    {
        private readonly IServerApplicationHost _appHost;
        private readonly MessageStore _store;
        private readonly ILogger _logger;
        private readonly Func<PluginConfiguration> _getConfig;

        public DeliveryService(
            IServerApplicationHost appHost,
            MessageStore store,
            ILogManager logManager,
            Func<PluginConfiguration> getConfig)
        {
            _appHost = appHost;
            _store = store;
            _logger = logManager.GetLogger(nameof(DeliveryService));
            _getConfig = getConfig;
        }

        /// <summary>Client-name check backing the "Nur an Web-Browser-Sitzungen senden" option
        /// (currently offered only for Media News - see webOnly below). Emby's own web client
        /// reports SessionInfo.Client as "Emby Web" regardless of the device it's running on, so
        /// this also matches a narrow mobile-browser window, and does NOT match the separate
        /// desktop "Emby Theater" app - it's an approximation of "has room to show a long
        /// message", not a true screen-size check.</summary>
        internal static bool IsWebSession(SessionInfo session) =>
            session != null && !string.IsNullOrEmpty(session.Client) &&
            session.Client.IndexOf("Web", StringComparison.OrdinalIgnoreCase) >= 0;

        public async Task<SendOutcome> SendAsync(
            string header,
            string text,
            int timeoutMs,
            RecipientMode mode,
            IEnumerable<string> specificUserIds,
            MessageOrigin origin,
            DateTime? scheduledForUtc = null,
            bool webOnly = false,
            // Only used when mode == RecipientMode.Specific - selected user-group ids (see
            // UserGroup), expanded to member user ids and unioned with specificUserIds below.
            // Optional/nullable so every pre-existing positional call site (e.g. the Welcome
            // message send, which never offers group selection) keeps compiling unchanged.
            IEnumerable<string> specificGroupIds = null,
            // Only used when mode == RecipientMode.Active: if set, only active sessions of these
            // (normalized) user ids are messaged - lets SendPersonalizedAsync send different text
            // to different active users while keeping Active's "never queue offline" semantics.
            IEnumerable<string> activeUserFilter = null)
        {
            var outcome = new SendOutcome();
            try
            {
                var sessionManager = _appHost.Resolve<ISessionManager>();
                var userManager = _appHost.Resolve<IUserManager>();
                if (sessionManager == null)
                {
                    outcome.Error = "ISessionManager not available";
                    return outcome;
                }

                var normalizedHeader = TextFormatting.PrepareForEmbyDisplay(
                    string.IsNullOrWhiteSpace(header) ? "Announcement" : header);
                var normalizedText = TextFormatting.PrepareForEmbyDisplay(text);

                var config = _getConfig();

                var entry = new HistoryEntry
                {
                    MessageType = origin.ToString(),
                    // Use the same "Announcement" fallback as the actual MessageCommand so the
                    // history/status view never shows a blank header for a message users saw
                    // titled "Announcement".
                    Header = TextFormatting.NormalizeMessageText(
                        string.IsNullOrWhiteSpace(header) ? "Announcement" : header),
                    Text = TextFormatting.NormalizeMessageText(text),
                    RecipientMode = mode.ToString(),
                    ScheduledForUtc = scheduledForUtc,
                    RequestedUserIds = (specificUserIds ?? Enumerable.Empty<string>()).ToList()
                };
                _store.AddHistory(entry, config.HistoryMaxEntries);
                outcome.HistoryEntryId = entry.Id;

                var command = new MessageCommand
                {
                    Header = normalizedHeader,
                    Text = normalizedText,
                    TimeoutMs = timeoutMs
                };

                var liveSessions = (sessionManager.Sessions ?? Enumerable.Empty<SessionInfo>()).ToList();

                // Everything this send decides is collected here and written to the store ONCE at
                // the end (MessageStore.RecordSendResults) instead of one full store-file rewrite
                // per recipient.
                var deliveries = new List<DeliveryRecord>();
                var offline = new List<OfflineMessageRecord>();
                try
                {
                    if (mode == RecipientMode.Active)
                    {
                        // webOnly here just narrows which currently-active sessions get it - "Active"
                        // never queues for anyone regardless (that's the whole point of choosing
                        // Active), so a non-web-active user is simply skipped, exactly like an
                        // inactive user already is.
                        var userFilter = activeUserFilter == null
                            ? null
                            : new HashSet<string>(activeUserFilter, StringComparer.OrdinalIgnoreCase);
                        var sessions = liveSessions.Where(s => s.IsActive && (!webOnly || IsWebSession(s))
                            && (userFilter == null || userFilter.Contains(IdNormalization.Normalize(s.UserId) ?? "")));

                        // Counted per USER (like All/Specific), not per session: a user with two
                        // active sessions is one "delivered", not two. Sessions without a user
                        // (e.g. some DLNA/device sessions) count individually.
                        foreach (var group in sessions.GroupBy(s => IdNormalization.Normalize(s.UserId) ?? "", StringComparer.OrdinalIgnoreCase))
                        {
                            if (group.Key.Length == 0)
                            {
                                foreach (var session in group)
                                {
                                    if (await TrySendToSessionAsync(sessionManager, session.Id, command).ConfigureAwait(false)) outcome.Delivered++;
                                    else outcome.Failed++;
                                }
                                continue;
                            }
                            await SendToUserSessionsAsync(sessionManager, group.Key, group.ToList(), command, deliveries, outcome).ConfigureAwait(false);
                        }
                        return outcome;
                    }

                    // All / Specific: resolve the target user id set.
                    List<string> targetUserIds;
                    if (mode == RecipientMode.All)
                    {
                        if (userManager == null)
                        {
                            outcome.Error = "IUserManager not available";
                            return outcome;
                        }
                        targetUserIds = UserLookup.GetAllUsers(userManager).Select(u => IdNormalization.Normalize(u.Id)).ToList();
                    }
                    else
                    {
                        targetUserIds = ResolveSpecificUserIds(specificUserIds, specificGroupIds);
                    }

                    // Built once per send - ResolveUsername used to enumerate every user again for
                    // each offline/failed recipient (O(n^2) for an "All users" broadcast).
                    var usernames = BuildUsernameLookup(userManager);

                    foreach (var userId in targetUserIds)
                    {
                        var activeSessionsForUser = liveSessions
                            .Where(s => s.IsActive && string.Equals(IdNormalization.Normalize(s.UserId), userId, StringComparison.OrdinalIgnoreCase))
                            .ToList();

                        // IMPORTANT: the webOnly filter is applied here, BEFORE deciding whether this
                        // user counts as "has an active session" - not just at send time. A user whose
                        // only active session is a phone/TV app must fall through to the offline-queue
                        // branch below (so the message waits for them to open a web browser instead),
                        // not be silently dropped by filtering it out only when actually sending.
                        var matchingSessionsForUser = webOnly
                            ? activeSessionsForUser.Where(IsWebSession).ToList()
                            : activeSessionsForUser;

                        if (matchingSessionsForUser.Count > 0)
                        {
                            await SendToUserSessionsAsync(sessionManager, userId, matchingSessionsForUser, command, deliveries, outcome).ConfigureAwait(false);
                        }
                        else if (config.OfflineDeliveryEnabled)
                        {
                            offline.Add(new OfflineMessageRecord
                            {
                                HistoryEntryId = entry.Id,
                                UserId = userId,
                                Header = normalizedHeader,
                                Text = normalizedText,
                                TimeoutMs = timeoutMs,
                                WebOnly = webOnly
                            });
                            deliveries.Add(new DeliveryRecord
                            {
                                UserId = userId,
                                Username = LookupUsername(usernames, userId),
                                Status = DeliveryStatus.Pending.ToString()
                            });
                            outcome.Pending++;
                        }
                        else
                        {
                            deliveries.Add(new DeliveryRecord
                            {
                                UserId = userId,
                                Username = LookupUsername(usernames, userId),
                                Status = DeliveryStatus.Failed.ToString()
                            });
                            outcome.Failed++;
                        }
                    }
                }
                finally
                {
                    // In finally so that whatever was already sent/queued is still recorded if
                    // the loop above is interrupted by an unexpected exception.
                    if (deliveries.Count > 0 || offline.Count > 0)
                        _store.RecordSendResults(entry.Id, deliveries, offline);
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: SendAsync failed.", ex);
                outcome.Error = "Internal error while sending - see the Emby server log for details.";
            }

            return outcome;
        }

        private List<string> ResolveSpecificUserIds(IEnumerable<string> specificUserIds, IEnumerable<string> specificGroupIds)
        {
            // Groups are expanded to their current member ids here, at send time - not when the
            // message/schedule/timer was created - so editing a group's membership later still
            // affects any future send that references it. Unknown group ids (e.g. a group deleted
            // since) simply resolve to nothing extra.
            var fromGroups = _store.ExpandGroupsToUserIds(specificGroupIds ?? Enumerable.Empty<string>());

            // Normalize here too: ids arriving from the dashboard's checkbox list are already GUID
            // strings, but normalizing keeps this list in the exact same canonical form as the
            // session/user ids it gets compared against - see IdNormalization.cs for why that
            // matters. A user picked both directly and via a group is naturally de-duplicated by
            // the trailing Distinct().
            return (specificUserIds ?? Enumerable.Empty<string>())
                .Concat(fromGroups)
                .Select(IdNormalization.Normalize)
                .Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToList();
        }

        /// <summary>Like SendAsync, but every recipient gets text built for them specifically by
        /// <paramref name="textForUser"/> - used by Media News so each user is only told about
        /// titles they can actually access (see MediaNewsResult.FilterForUser). A null/empty text
        /// means "nothing for this user": they're skipped and counted in SendOutcome.NoContent.
        ///
        /// Recipients are resolved exactly like SendAsync (Active = users with an active - and,
        /// if webOnly, web - session; All = every user; Specific = users + expanded groups), then
        /// grouped by identical text, and each group is sent through the normal SendAsync path -
        /// so offline queueing, webOnly and history behave as usual. Users with the same access
        /// get one shared history entry; users with different access get separate entries, each
        /// showing exactly the text those users received. Users that can't be resolved to an
        /// Emby user (e.g. deleted since being picked) are skipped, since there is no way to
        /// check what they may see.</summary>
        public async Task<SendOutcome> SendPersonalizedAsync(
            string header,
            RecipientMode mode,
            IEnumerable<string> specificUserIds,
            IEnumerable<string> specificGroupIds,
            bool webOnly,
            MessageOrigin origin,
            Func<User, string> textForUser)
        {
            var total = new SendOutcome();
            try
            {
                var userManager = _appHost.Resolve<IUserManager>();
                if (userManager == null)
                {
                    total.Error = "IUserManager not available";
                    return total;
                }

                var usersById = new Dictionary<string, User>(StringComparer.OrdinalIgnoreCase);
                foreach (var u in UserLookup.GetAllUsers(userManager))
                {
                    var id = IdNormalization.Normalize(u.Id);
                    if (!string.IsNullOrEmpty(id) && !usersById.ContainsKey(id)) usersById[id] = u;
                }

                List<string> targetUserIds;
                if (mode == RecipientMode.Active)
                {
                    var sessionManager = _appHost.Resolve<ISessionManager>();
                    if (sessionManager == null)
                    {
                        total.Error = "ISessionManager not available";
                        return total;
                    }
                    targetUserIds = (sessionManager.Sessions ?? Enumerable.Empty<SessionInfo>())
                        .Where(s => s.IsActive && (!webOnly || IsWebSession(s)))
                        .Select(s => IdNormalization.Normalize(s.UserId))
                        .Where(id => !string.IsNullOrEmpty(id))
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();
                }
                else if (mode == RecipientMode.All)
                {
                    targetUserIds = usersById.Keys.ToList();
                }
                else
                {
                    targetUserIds = ResolveSpecificUserIds(specificUserIds, specificGroupIds);
                }

                // Ordinal key: two users get the same history entry only if their text is
                // byte-for-byte identical.
                var byText = new Dictionary<string, List<string>>(StringComparer.Ordinal);
                foreach (var userId in targetUserIds)
                {
                    if (!usersById.TryGetValue(userId, out var user))
                    {
                        total.NoContent++;
                        continue;
                    }
                    var text = textForUser(user);
                    if (string.IsNullOrEmpty(text))
                    {
                        total.NoContent++;
                        continue;
                    }
                    if (!byText.TryGetValue(text, out var ids)) byText[text] = ids = new List<string>();
                    ids.Add(userId);
                }

                foreach (var group in byText)
                {
                    var outcome = mode == RecipientMode.Active
                        ? await SendAsync(header, group.Key, 0, RecipientMode.Active, null, origin,
                            webOnly: webOnly, activeUserFilter: group.Value).ConfigureAwait(false)
                        : await SendAsync(header, group.Key, 0, RecipientMode.Specific, group.Value, origin,
                            webOnly: webOnly).ConfigureAwait(false);

                    total.Delivered += outcome.Delivered;
                    total.Pending += outcome.Pending;
                    total.Failed += outcome.Failed;
                    if (total.HistoryEntryId == null) total.HistoryEntryId = outcome.HistoryEntryId;
                    if (outcome.Error != null)
                        total.Error = total.Error == null ? outcome.Error : total.Error + "; " + outcome.Error;
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: SendPersonalizedAsync failed.", ex);
                total.Error = "Internal error while sending - see the Emby server log for details.";
            }
            return total;
        }

        /// <summary>Sends to all of one user's matching sessions and records ONE outcome for the
        /// user: Delivered if at least one session got it, otherwise Failed (the old code counted
        /// every session separately and never recorded a failed live send in the history).</summary>
        private async Task SendToUserSessionsAsync(
            ISessionManager sessionManager,
            string userId,
            List<SessionInfo> sessions,
            MessageCommand command,
            List<DeliveryRecord> deliveries,
            SendOutcome outcome)
        {
            var anyDelivered = false;
            foreach (var session in sessions)
            {
                if (await TrySendToSessionAsync(sessionManager, session.Id, command).ConfigureAwait(false))
                    anyDelivered = true;
            }

            if (anyDelivered) outcome.Delivered++;
            else outcome.Failed++;

            deliveries.Add(new DeliveryRecord
            {
                UserId = userId,
                Username = sessions.Select(s => s.UserName).FirstOrDefault(n => !string.IsNullOrEmpty(n)) ?? userId,
                Status = (anyDelivered ? DeliveryStatus.Delivered : DeliveryStatus.Failed).ToString()
            });
        }

        private async Task<bool> TrySendToSessionAsync(ISessionManager sessionManager, string sessionId, MessageCommand command)
        {
            try
            {
                await SendMessageToSessionAsync(sessionManager, sessionId, command).ConfigureAwait(false);
                return true;
            }
            catch (Exception ex)
            {
                _logger.Debug("EmbyCast: failed to message session {0}: {1}", sessionId, ex.Message);
                return false;
            }
        }

        /// <summary>The first argument of SendMessageCommand is the CONTROLLING session - the
        /// session on whose behalf a command is sent, which the server checks remote-control
        /// permission for. A server-originated message has no controlling session, so null is
        /// passed (the server skips that check when it's empty); the old code passed the target
        /// session as its own controller. Should a server build ever reject a null controller,
        /// this falls back to that previous, known-working call once.</summary>
        internal static async Task SendMessageToSessionAsync(ISessionManager sessionManager, string sessionId, MessageCommand command)
        {
            try
            {
                await sessionManager.SendMessageCommand(null, sessionId, command, CancellationToken.None).ConfigureAwait(false);
            }
            catch (Exception ex) when (ex is ArgumentException || ex is NullReferenceException)
            {
                await sessionManager.SendMessageCommand(sessionId, sessionId, command, CancellationToken.None).ConfigureAwait(false);
            }
        }

        private static Dictionary<string, string> BuildUsernameLookup(IUserManager userManager)
        {
            var map = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            try
            {
                foreach (var u in UserLookup.GetAllUsers(userManager))
                {
                    var id = IdNormalization.Normalize(u.Id);
                    if (!string.IsNullOrEmpty(id) && !map.ContainsKey(id)) map[id] = u.Name;
                }
            }
            catch
            {
                // Best-effort only - names are cosmetic; LookupUsername falls back to the id.
            }
            return map;
        }

        private static string LookupUsername(Dictionary<string, string> usernames, string userId) =>
            usernames.TryGetValue(userId, out var name) && !string.IsNullOrEmpty(name) ? name : userId;

        /// <summary>Delivers any queued offline messages for a user whose session just started,
        /// and updates the originating history entry's delivery status. Called from
        /// SessionEventListener. <paramref name="userId"/> must already be normalized via
        /// IdNormalization.Normalize() - the offline queue is keyed by that canonical form.
        /// <paramref name="isWebSession"/> must reflect the CLIENT of THIS specific newly-started
        /// session (see IsWebSession) - a WebOnly-flagged message only gets taken/delivered when
        /// this is true; otherwise it's left queued for a future, more suitable login.
        ///
        /// Messages are taken from the queue up front (atomically, so two sessions of the same
        /// user starting at once can't both deliver them), and every message that then fails to
        /// send - or is never attempted because of an unexpected error - is put back via
        /// MessageStore.RequeueOffline for the next login instead of being lost.</summary>
        public async Task DeliverOfflineQueueForUserAsync(string userId, string username, string sessionId, bool isWebSession)
        {
            var pending = _store.TakePendingForUser(userId, isWebSession);
            if (pending.Count == 0) return;

            var undelivered = new List<OfflineMessageRecord>(pending);
            try
            {
                var sessionManager = _appHost.Resolve<ISessionManager>();
                if (sessionManager == null) return;

                foreach (var message in pending)
                {
                    await TryDeliverOfflineMessageAsync(sessionManager, message, userId, username, sessionId, undelivered)
                        .ConfigureAwait(false);
                }
            }
            finally
            {
                if (undelivered.Count > 0)
                {
                    var requeued = _store.RequeueOffline(undelivered);
                    _logger.Warn("EmbyCast: {0} offline message(s) for {1} could not be delivered to session {2}; {3} re-queued for the next login.",
                        undelivered.Count, username ?? userId, sessionId, requeued);
                }
            }
        }

        private async Task TryDeliverOfflineMessageAsync(
            ISessionManager sessionManager, OfflineMessageRecord message, string userId, string username,
            string sessionId, List<OfflineMessageRecord> undelivered)
        {
            try
            {
                var command = new MessageCommand
                {
                    Header = message.Header,
                    Text = message.Text,
                    TimeoutMs = message.TimeoutMs
                };
                await SendMessageToSessionAsync(sessionManager, sessionId, command).ConfigureAwait(false);
                // Counted as delivered as soon as the send itself succeeded - before the
                // history update below, so a problem there can never cause a re-queue (and a
                // duplicate delivery on the next login).
                undelivered.Remove(message);

                if (!string.IsNullOrEmpty(message.HistoryEntryId))
                {
                    _store.UpdateHistoryDelivery(message.HistoryEntryId, userId, new DeliveryRecord
                    {
                        UserId = userId,
                        Username = username ?? userId,
                        Status = DeliveryStatus.Delivered.ToString()
                    });
                }

                _logger.Info("EmbyCast: delivered queued offline message '{0}' to {1}", message.Header, username);
            }
            catch (Exception ex)
            {
                _logger.Warn("EmbyCast: failed to deliver offline message to {0}: {1}", username, ex.Message);
            }
        }
    }
}
