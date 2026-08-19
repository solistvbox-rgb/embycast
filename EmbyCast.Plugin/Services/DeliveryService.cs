using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EmbyCast.Plugin.Configuration;
using EmbyCast.Plugin.Models;
using EmbyCast.Plugin.Storage;
using MediaBrowser.Controller;
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

        public async Task<SendOutcome> SendAsync(
            string header,
            string text,
            int timeoutMs,
            RecipientMode mode,
            IEnumerable<string> specificUserIds,
            MessageOrigin origin,
            DateTime? scheduledForUtc = null)
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

                if (mode == RecipientMode.Active)
                {
                    foreach (var session in liveSessions.Where(s => s.IsActive))
                    {
                        await SendToSessionAsync(sessionManager, session, command, entry, outcome).ConfigureAwait(false);
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
                    // Normalize here too: ids arriving from the dashboard's checkbox list are
                    // already GUID strings, but normalizing keeps this list in the exact same
                    // canonical form as the session/user ids it gets compared against below -
                    // see IdNormalization.cs for why that matters.
                    targetUserIds = (specificUserIds ?? Enumerable.Empty<string>())
                        .Select(IdNormalization.Normalize)
                        .Where(id => !string.IsNullOrWhiteSpace(id)).Distinct().ToList();
                }

                foreach (var userId in targetUserIds)
                {
                    var activeSessionsForUser = liveSessions
                        .Where(s => s.IsActive && string.Equals(IdNormalization.Normalize(s.UserId), userId, StringComparison.OrdinalIgnoreCase))
                        .ToList();

                    if (activeSessionsForUser.Count > 0)
                    {
                        foreach (var session in activeSessionsForUser)
                            await SendToSessionAsync(sessionManager, session, command, entry, outcome).ConfigureAwait(false);
                    }
                    else if (config.OfflineDeliveryEnabled)
                    {
                        var username = ResolveUsername(userManager, userId);
                        _store.QueueOffline(new OfflineMessageRecord
                        {
                            HistoryEntryId = entry.Id,
                            UserId = userId,
                            Header = normalizedHeader,
                            Text = normalizedText,
                            TimeoutMs = timeoutMs
                        });
                        _store.UpdateHistoryDelivery(entry.Id, userId, new DeliveryRecord
                        {
                            UserId = userId,
                            Username = username,
                            Status = DeliveryStatus.Pending.ToString()
                        });
                        outcome.Pending++;
                    }
                    else
                    {
                        var username = ResolveUsername(userManager, userId);
                        _store.UpdateHistoryDelivery(entry.Id, userId, new DeliveryRecord
                        {
                            UserId = userId,
                            Username = username,
                            Status = DeliveryStatus.Failed.ToString()
                        });
                        outcome.Failed++;
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.Error("EmbyCast: SendAsync failed: {0}", ex.Message);
                outcome.Error = ex.Message;
            }

            return outcome;
        }

        private async Task SendToSessionAsync(
            ISessionManager sessionManager,
            SessionInfo session,
            MessageCommand command,
            HistoryEntry entry,
            SendOutcome outcome)
        {
            try
            {
                await sessionManager.SendMessageCommand(session.Id, session.Id, command, CancellationToken.None)
                    .ConfigureAwait(false);
                outcome.Delivered++;

                var normalizedUserId = IdNormalization.Normalize(session.UserId);
                if (!string.IsNullOrEmpty(normalizedUserId))
                {
                    _store.UpdateHistoryDelivery(entry.Id, normalizedUserId, new DeliveryRecord
                    {
                        UserId = normalizedUserId,
                        Username = session.UserName ?? normalizedUserId,
                        Status = DeliveryStatus.Delivered.ToString()
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.Debug("EmbyCast: failed to message session {0}: {1}", session.Id, ex.Message);
                outcome.Failed++;
            }
        }

        private static string ResolveUsername(IUserManager userManager, string userId)
        {
            try
            {
                var user = UserLookup.GetAllUsers(userManager)
                    .FirstOrDefault(u => string.Equals(IdNormalization.Normalize(u.Id), userId, StringComparison.OrdinalIgnoreCase));
                return user?.Name ?? userId;
            }
            catch
            {
                return userId;
            }
        }

        /// <summary>Delivers any queued offline messages for a user whose session just started,
        /// and updates the originating history entry's delivery status. Called from
        /// SessionEventListener. <paramref name="userId"/> must already be normalized via
        /// IdNormalization.Normalize() - the offline queue is keyed by that canonical form.</summary>
        public async Task DeliverOfflineQueueForUserAsync(string userId, string username, string sessionId)
        {
            var pending = _store.TakePendingForUser(userId);
            if (pending.Count == 0) return;

            var sessionManager = _appHost.Resolve<ISessionManager>();
            if (sessionManager == null) return;

            foreach (var message in pending)
            {
                try
                {
                    var command = new MessageCommand
                    {
                        Header = message.Header,
                        Text = message.Text,
                        TimeoutMs = message.TimeoutMs
                    };
                    await sessionManager.SendMessageCommand(sessionId, sessionId, command, CancellationToken.None)
                        .ConfigureAwait(false);

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
}
