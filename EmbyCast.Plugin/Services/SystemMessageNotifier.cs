using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using EmbyCast.Plugin.Models;
using Emby.Notifications;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Services
{
    /// <summary>
    /// "System Message": EmbyCast as a SYSTEM-level notification service, like Emby's own
    /// Activity Log. Emby asks it for its entries (GetConfiguredNotifications - the ones set up in
    /// the dashboard tile) and calls SendNotification for every event matching one of them, with
    /// its own localized title and description. EmbyCast delivers that text to the entry's
    /// administrators as a dialog or short pop-up (see SystemMessageService).
    ///
    /// Deliberately NOT an IUserNotifier (the first version was): Emby lists every IUserNotifier
    /// under Settings -> Notifications -> Add Notification for EVERY user, with no way to limit it
    /// to admins. A system-level INotifier is not listed anywhere, so normal users don't see
    /// EmbyCast at all. Verified on 4.11 with a probe: Emby registers it at startup ("Registering
    /// event nofitier ..."), asks for the entries right before each event and passes the entry id
    /// back in request.Configuration.Id - but no owner, user or session. Emby finds this class by
    /// itself (it scans plugin assemblies for INotifier implementations).
    /// </summary>
    public class SystemMessageNotifier : INotifier
    {
        public SystemMessageNotifier(ILogManager logManager)
        {
        }

        public string Name => "EmbyCast";

        public NotificationInfo[] GetConfiguredNotifications()
        {
            var store = Plugin.Instance?.Store;
            if (store == null) return new NotificationInfo[0];

            return store.GetSystemNotifications()
                .Select(n => new { Entry = n, Events = n.EventIds.Where(id => !SystemMessageService.HiddenEventIds.Contains(id)).ToArray() })
                .Where(x => x.Entry.Enabled && x.Events.Length > 0 && x.Entry.RecipientUserIds.Count > 0)
                .Select(x => new NotificationInfo
                {
                    Id = x.Entry.Id,
                    FriendlyName = x.Entry.Name,
                    Enabled = true,
                    EventIds = x.Events,
                    UserIds = new string[0],
                    DeviceIds = new string[0],
                    LibraryIds = new string[0],
                    Options = new Dictionary<string, string>()
                })
                .ToArray();
        }

        public Task SendNotification(InternalNotificationRequest request, CancellationToken cancellationToken)
        {
            var service = Plugin.Instance?.SystemMessages;
            if (service == null || request == null) return Task.CompletedTask;
            return service.HandleEventAsync(request);
        }
    }

    /// <summary>Delivery side of System Message - used for Emby's events (via
    /// SystemMessageNotifier) and for the tile's "Test" button.
    ///
    /// Rules: only administrators, only their currently active sessions,
    /// nothing kept for later (RecipientMode.Active never queues offline). An event that carries
    /// a session (e.g. playback) is not sent to that session itself.</summary>
    public class SystemMessageService
    {
        public const string DisplayDialog = "Dialog";
        public const string DisplayToast = "Toast";

        /// <summary>Server events left out of System Message: startup and
        /// "updated" fire before any session is active, so they would reach nobody; restart
        /// required / update available are already shown in Emby's dashboard; maintenance mode is
        /// switched by an admin, who isn't told about their own actions. Hidden in the tile and
        /// ignored here too, so an entry saved earlier with them is not affected.</summary>
        public static readonly HashSet<string> HiddenEventIds = new HashSet<string>(new[]
        {
            "system.serverstartup", "system.serverrestartrequired", "system.updateavailable",
            "system.updated", "system.entermaintenancemode", "system.exitmaintenancemode"
        }, StringComparer.OrdinalIgnoreCase);

        /// <summary>Same value the dashboard uses for "Short pop-up" (TOAST_TIMEOUT_MS in app.js).</summary>
        private const int ToastTimeoutMs = 4000;
        private const string FallbackHeader = "System Message";

        /// <summary>Emby sends some events several times within a fraction of a second with the
        /// very same text (e.g. "User Policy Updated" 3x for one save, seen on 4.11). The same
        /// entry/event/text within this window is shown only once.</summary>
        private static readonly TimeSpan DuplicateWindow = TimeSpan.FromSeconds(10);
        private readonly Dictionary<string, DateTime> _recentEvents = new Dictionary<string, DateTime>();
        private readonly object _recentLock = new object();

        private readonly MediaBrowser.Controller.IServerApplicationHost _appHost;
        private readonly Storage.MessageStore _store;
        private readonly DeliveryService _delivery;
        private readonly EmbyCastLogger _logger;

        public SystemMessageService(MediaBrowser.Controller.IServerApplicationHost appHost, Storage.MessageStore store,
            DeliveryService delivery, ILogManager logManager)
        {
            _appHost = appHost;
            _store = store;
            _delivery = delivery;
            _logger = new EmbyCastLogger(logManager.GetLogger(nameof(SystemMessageService)));
        }

        public async Task HandleEventAsync(InternalNotificationRequest request)
        {
            try
            {
                var entry = _store.GetSystemNotification(request.Configuration?.Id);
                _logger.Info("EmbyCast: System Message event '{0}' for entry '{1}' - user '{2}' ({3}), session '{4}'.",
                    request.Event, entry?.Name ?? request.Configuration?.Id, request.User?.Name, request.User?.Id, request.Session?.Id);
                if (entry == null || !entry.Enabled) return;

                var eventUserId = ResolveUserId(request.User?.Id);
                if (entry.LimitUsers && eventUserId != null && !IsInUserFilter(entry, eventUserId))
                {
                    _logger.Info("EmbyCast: System Message '{0}' for event '{1}' skipped - user '{2}' is not in the entry's user filter.", entry.Name, request.Event, request.User?.Name);
                    return;
                }

                if (IsDuplicate(string.Join("\n", entry.Id, request.Event, request.Title, request.Description)))
                {
                    _logger.Info("EmbyCast: System Message '{0}' for event '{1}' skipped - same event already shown a moment ago.", entry.Name, request.Event);
                    return;
                }

                // An admin is not told about what they did themselves (own playback, own login,
                // own settings changes...). Failed logins and lock-outs on an admin's account are
                // still shown to that admin - those may well be someone else trying.
                var excludeUserId = AlwaysShowOwnEvents.Contains(request.Event ?? "") ? null : eventUserId;

                var outcome = await DeliverAsync(entry, AreaHeader(request.Event), request.Title, request.Description,
                    request.Session?.Id, excludeUserId).ConfigureAwait(false);
                if (outcome.Error != null)
                    _logger.Warn("EmbyCast: System Message '{0}' for event '{1}' failed: {2}", entry.Name, request.Event, outcome.Error);
                else
                    _logger.Info("EmbyCast: System Message '{0}' for event '{1}' delivered to {2} administrator(s).", entry.Name, request.Event, outcome.Delivered);
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: System Message failed.", ex);
            }
        }

        /// <summary>The entry's chosen users plus the CURRENT members of its chosen groups.</summary>
        private bool IsInUserFilter(SystemNotificationEntry entry, string userId) =>
            entry.UserFilterIds
                .Concat(_store.ExpandGroupsToUserIds(entry.UserFilterGroupIds))
                .Any(id => string.Equals(IdNormalization.Normalize(id), userId, StringComparison.OrdinalIgnoreCase));

        private bool IsDuplicate(string key)
        {
            var now = DateTime.UtcNow;
            lock (_recentLock)
            {
                foreach (var old in _recentEvents.Where(kv => now - kv.Value > DuplicateWindow).Select(kv => kv.Key).ToList())
                    _recentEvents.Remove(old);
                if (_recentEvents.ContainsKey(key)) return true;
                _recentEvents[key] = now;
                return false;
            }
        }

        /// <summary>Emby's descriptions come with runs of empty lines (e.g. "::1", five empty
        /// lines, "Time", an empty line, the date) - trimmed lines without the empty ones.</summary>
        private static string RemoveEmptyLines(string text) =>
            string.Join("\n", (text ?? "").Split(new[] { "\r\n", "\r", "\n" }, StringSplitOptions.None)
                .Select(line => line.Trim())
                .Where(line => line.Length > 0));

        private static readonly HashSet<string> AlwaysShowOwnEvents = new HashSet<string>(
            new[] { "user.authenticationfailed", "user.lockedout" }, StringComparer.OrdinalIgnoreCase);

        /// <summary>The event's user id in the GUID form sessions use - Emby may pass the
        /// internal id instead (it does for the notification owner).</summary>
        private string ResolveUserId(string id)
        {
            if (string.IsNullOrEmpty(id)) return null;
            var normalized = IdNormalization.Normalize(id);
            var user = UserLookup.GetAllUsers(_appHost.Resolve<MediaBrowser.Controller.Library.IUserManager>())
                .FirstOrDefault(u => string.Equals(u.InternalId.ToString(), id, StringComparison.Ordinal)
                                     || string.Equals(IdNormalization.Normalize(u.Id), normalized, StringComparison.OrdinalIgnoreCase));
            return user != null ? IdNormalization.Normalize(user.Id) : normalized;
        }

        /// <summary>Dialog header naming the area an event comes from (the categories of the
        /// tile's event list), always in English by request - like "Toast-Message". The area is
        /// the event id's prefix; "item." events (favourites, played) are listed under Users.</summary>
        private static readonly Dictionary<string, string> AreaHeaders = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "system", "Server Message" },
            { "user", "User Message" },
            { "item", "User Message" },
            { "livetv", "Live TV Message" },
            { "playback", "Playback Message" },
            { "plugins", "Plugin Message" },
            { "library", "Library Message" },
            { "scheduledtasks", "Scheduled Task Message" },
            { "devices", "Device Message" },
            { "external", "External Message" }
        };

        public static string AreaHeader(string eventId)
        {
            var dot = (eventId ?? "").IndexOf('.');
            var area = dot > 0 ? eventId.Substring(0, dot) : eventId ?? "";
            return AreaHeaders.TryGetValue(area, out var header) ? header : FallbackHeader;
        }

        /// <summary>Sends one event to the entry's administrators, except
        /// <paramref name="excludeUserId"/> (the admin who caused the event). The dialog header
        /// is <paramref name="header"/>; Emby's title becomes the first line of the text.</summary>
        public async Task<SendOutcome> DeliverAsync(SystemNotificationEntry entry, string header, string title, string description,
            string excludeSessionId, string excludeUserId = null)
        {
            var admins = new HashSet<string>(GetAdministratorIds(), StringComparer.OrdinalIgnoreCase);
            var recipients = entry.RecipientUserIds
                .Select(IdNormalization.Normalize)
                .Where(id => !string.IsNullOrEmpty(id) && admins.Contains(id))
                .Where(id => !string.Equals(id, excludeUserId, StringComparison.OrdinalIgnoreCase))
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();
            if (recipients.Count == 0) return new SendOutcome();

            title = (title ?? "").Trim();
            description = RemoveEmptyLines(description);
            if (title.Length == 0 && description.Length == 0) return new SendOutcome();

            if (string.IsNullOrWhiteSpace(header)) header = FallbackHeader;
            var text = string.Join("\n", new[] { title, description }.Where(part => part.Length > 0));

            var isToast = !string.Equals(entry.DisplayMode, DisplayDialog, StringComparison.OrdinalIgnoreCase);

            return await _delivery.SendAsync(
                header,
                Api.EmbyCastApi.TruncateText(text, Api.EmbyCastApi.MaxMessageTextLength),
                isToast ? ToastTimeoutMs : 0,
                RecipientMode.Active,
                null,
                MessageOrigin.System,
                activeUserFilter: recipients,
                excludeSessionIds: string.IsNullOrEmpty(excludeSessionId) ? null : new[] { excludeSessionId }).ConfigureAwait(false);
        }

        public List<string> GetAdministratorIds() =>
            UserLookup.GetAllUsers(_appHost.Resolve<MediaBrowser.Controller.Library.IUserManager>())
                .Where(u => u.Policy != null && u.Policy.IsAdministrator)
                .Select(u => IdNormalization.Normalize(u.Id))
                .ToList();
    }
}
