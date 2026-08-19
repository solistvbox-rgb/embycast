using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.Json.Serialization;
using EmbyCast.Plugin.Models;
using MediaBrowser.Common.Configuration;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Storage
{
    /// <summary>
    /// Thread-safe JSON-backed store for everything that changes at runtime: sent-message
    /// history, the offline delivery queue, pending scheduled messages, the (single) active
    /// countdown timer, and the set of users who already received a welcome message.
    ///
    /// Design note: this plugin expects modest volumes (a home/family/small-community Emby
    /// server sending at most a handful of broadcasts a day), so a single JSON file guarded by
    /// one lock is simple, robust and easy to back up/inspect - a database would be overkill.
    /// All public methods are synchronous and safe to call from any thread; each mutation is
    /// persisted to disk immediately (write-through) so plugin/server restarts never lose state.
    /// </summary>
    public class MessageStore
    {
        private readonly string _filePath;
        private readonly ILogger _logger;
        private readonly object _lock = new object();
        private StoreData _data;

        private static readonly JsonSerializerOptions JsonOpts = new JsonSerializerOptions
        {
            WriteIndented = true,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        public MessageStore(IApplicationPaths appPaths, ILogManager logManager)
        {
            _filePath = Path.Combine(appPaths.DataPath, "embycast-store.json");
            _logger = logManager.GetLogger(nameof(MessageStore));
            _data = Load();
        }

        private StoreData Load()
        {
            try
            {
                if (File.Exists(_filePath))
                {
                    var json = File.ReadAllText(_filePath);
                    var loaded = JsonSerializer.Deserialize<StoreData>(json, JsonOpts);
                    if (loaded != null) return loaded;
                }
            }
            catch (Exception ex)
            {
                _logger.Error("EmbyCast: failed to load store, starting fresh: {0}", ex.Message);
            }
            return new StoreData();
        }

        private void Save()
        {
            try
            {
                var json = JsonSerializer.Serialize(_data, JsonOpts);
                var tmp = _filePath + ".tmp";
                File.WriteAllText(tmp, json);
                // Best-effort atomic replace so a crash mid-write can't corrupt the store.
                if (File.Exists(_filePath)) File.Delete(_filePath);
                File.Move(tmp, _filePath);
            }
            catch (Exception ex)
            {
                _logger.Error("EmbyCast: failed to save store: {0}", ex.Message);
            }
        }

        // ---------------------------------------------------------------
        // History
        // ---------------------------------------------------------------

        public HistoryEntry AddHistory(HistoryEntry entry, int maxEntries)
        {
            lock (_lock)
            {
                var cap = Math.Max(20, maxEntries);
                _data.History.Insert(0, entry);
                if (_data.History.Count > cap)
                    _data.History.RemoveRange(cap, _data.History.Count - cap);
                Save();
                return entry;
            }
        }

        public void UpdateHistoryDelivery(string historyEntryId, string userId, DeliveryRecord record)
        {
            lock (_lock)
            {
                var entry = _data.History.FirstOrDefault(h => h.Id == historyEntryId);
                if (entry == null) return;
                entry.Deliveries[userId] = record;
                Save();
            }
        }

        public List<HistoryEntry> GetHistory()
        {
            lock (_lock) return _data.History.ToList();
        }

        /// <summary>Removes any still-queued offline deliveries tied to the given history entry
        /// id(s) - called from DismissHistory/ClearHistory below so that dismissing/clearing a
        /// history entry actually cancels a still-pending delivery to an offline user, instead of
        /// just hiding/removing the dashboard row while the message quietly still goes out once
        /// that user next logs in. Must be called while already holding _lock. Returns the number
        /// of offline records removed.</summary>
        private int RemoveOfflineFor(IEnumerable<string> historyEntryIds)
        {
            var idSet = new HashSet<string>(historyEntryIds, StringComparer.OrdinalIgnoreCase);
            return _data.OfflineQueue.RemoveAll(o => o.HistoryEntryId != null && idSet.Contains(o.HistoryEntryId));
        }

        /// <summary>Dismisses a single history entry and cancels any of its deliveries that were
        /// still pending (queued for an offline user). Returns the number of pending deliveries
        /// that were cancelled, so the caller can tell the admin what actually happened.</summary>
        public int DismissHistory(string id)
        {
            lock (_lock)
            {
                var entry = _data.History.FirstOrDefault(h => h.Id == id);
                if (entry == null) return 0;
                entry.Active = false;
                var cancelled = RemoveOfflineFor(new[] { id });
                Save();
                return cancelled;
            }
        }

        /// <summary>Empties the entire history list ("Alles verwerfen" / "Discard all" in the
        /// dashboard) - unlike DismissHistory this removes the entries outright rather than
        /// just flagging them inactive. Also cancels any deliveries still pending for any of the
        /// cleared entries, for the same reason as DismissHistory above. Returns the number of
        /// pending deliveries that were cancelled.</summary>
        public int ClearHistory()
        {
            lock (_lock)
            {
                var ids = _data.History.Select(h => h.Id).ToList();
                _data.History.Clear();
                var cancelled = RemoveOfflineFor(ids);
                Save();
                return cancelled;
            }
        }

        // ---------------------------------------------------------------
        // Scheduled messages
        // ---------------------------------------------------------------

        public ScheduledMessageRecord AddScheduled(ScheduledMessageRecord record)
        {
            lock (_lock)
            {
                _data.ScheduledMessages.Add(record);
                Save();
                return record;
            }
        }

        public List<ScheduledMessageRecord> GetScheduled(bool includeSentOrCancelled = false)
        {
            lock (_lock)
            {
                return _data.ScheduledMessages
                    .Where(s => includeSentOrCancelled || (!s.Sent && !s.Cancelled))
                    .OrderBy(s => s.SendAtUtc)
                    .ToList();
            }
        }

        public List<ScheduledMessageRecord> GetDueScheduled(DateTime nowUtc)
        {
            lock (_lock)
            {
                return _data.ScheduledMessages
                    .Where(s => !s.Sent && !s.Cancelled && s.SendAtUtc <= nowUtc)
                    .ToList();
            }
        }

        public void MarkScheduledSent(string id, string historyEntryId)
        {
            lock (_lock)
            {
                var record = _data.ScheduledMessages.FirstOrDefault(s => s.Id == id);
                if (record == null) return;
                record.Sent = true;
                record.HistoryEntryId = historyEntryId;
                Save();
            }
        }

        public bool CancelScheduled(string id)
        {
            lock (_lock)
            {
                var record = _data.ScheduledMessages.FirstOrDefault(s => s.Id == id);
                if (record == null || record.Sent) return false;
                record.Cancelled = true;
                Save();
                return true;
            }
        }

        // ---------------------------------------------------------------
        // Offline queue
        // ---------------------------------------------------------------

        public void QueueOffline(OfflineMessageRecord record)
        {
            lock (_lock)
            {
                _data.OfflineQueue.Add(record);
                Save();
            }
        }

        public List<OfflineMessageRecord> TakePendingForUser(string userId)
        {
            lock (_lock)
            {
                var pending = _data.OfflineQueue
                    .Where(o => string.Equals(o.UserId, userId, StringComparison.OrdinalIgnoreCase))
                    .ToList();
                if (pending.Count > 0)
                {
                    _data.OfflineQueue.RemoveAll(o =>
                        string.Equals(o.UserId, userId, StringComparison.OrdinalIgnoreCase));
                    Save();
                }
                return pending;
            }
        }

        public int PurgeStaleOffline(int maxAgeDays)
        {
            lock (_lock)
            {
                var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, maxAgeDays));
                var removed = _data.OfflineQueue.RemoveAll(o => o.QueuedAtUtc < cutoff);
                if (removed > 0) Save();
                return removed;
            }
        }

        public int CountPendingOffline()
        {
            lock (_lock) return _data.OfflineQueue.Count;
        }

        // ---------------------------------------------------------------
        // Active timer
        // ---------------------------------------------------------------

        public void SetActiveTimer(TimerJobState state)
        {
            lock (_lock)
            {
                _data.ActiveTimer = state;
                Save();
            }
        }

        public TimerJobState GetActiveTimer()
        {
            lock (_lock) return _data.ActiveTimer;
        }

        public void UpdateActiveTimer(Action<TimerJobState> mutate)
        {
            lock (_lock)
            {
                if (_data.ActiveTimer == null) return;
                mutate(_data.ActiveTimer);
                Save();
            }
        }

        public void ClearActiveTimer()
        {
            lock (_lock)
            {
                _data.ActiveTimer = null;
                Save();
            }
        }

        // ---------------------------------------------------------------
        // Welcome message tracking
        // ---------------------------------------------------------------

        public bool HasWelcomed(string userId)
        {
            lock (_lock) return _data.WelcomedUserIds.Contains(userId);
        }

        public void MarkWelcomed(string userId)
        {
            lock (_lock)
            {
                if (_data.WelcomedUserIds.Add(userId)) Save();
            }
        }
    }
}
