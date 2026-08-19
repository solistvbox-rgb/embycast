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

        /// <summary>Removes the scheduled-message record outright once it has fired, rather than
        /// just flagging Sent=true and leaving it in the list forever. The full audit trail
        /// (header/text/recipients/outcome) already lives independently in the HistoryEntry
        /// DeliveryService.SendAsync created for this send, so nothing is lost - and nothing in
        /// the UI ever reads back already-sent scheduled records (GetScheduled's
        /// includeSentOrCancelled=true path is unused).</summary>
        public void MarkScheduledSent(string id)
        {
            lock (_lock)
            {
                var record = _data.ScheduledMessages.FirstOrDefault(s => s.Id == id);
                if (record == null) return;
                _data.ScheduledMessages.Remove(record);
                Save();
            }
        }

        /// <summary>Removes the scheduled-message record outright on cancellation, for the same
        /// reason as MarkScheduledSent above.</summary>
        public bool CancelScheduled(string id)
        {
            lock (_lock)
            {
                var record = _data.ScheduledMessages.FirstOrDefault(s => s.Id == id);
                if (record == null || record.Sent) return false;
                _data.ScheduledMessages.Remove(record);
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

        /// <summary>Takes (removes and returns) every queued message for this user that this
        /// login is actually allowed to deliver: everything not flagged WebOnly, plus - only if
        /// isWebSession is true - the WebOnly ones too. A WebOnly message left un-matched here
        /// (e.g. the user logged in via a phone/TV app) simply stays in the queue for a future,
        /// more suitable login, rather than being consumed and lost.</summary>
        public List<OfflineMessageRecord> TakePendingForUser(string userId, bool isWebSession)
        {
            lock (_lock)
            {
                var pending = _data.OfflineQueue
                    .Where(o => string.Equals(o.UserId, userId, StringComparison.OrdinalIgnoreCase)
                                && (!o.WebOnly || isWebSession))
                    .ToList();
                if (pending.Count > 0)
                {
                    var takenIds = new HashSet<string>(pending.Select(o => o.Id));
                    _data.OfflineQueue.RemoveAll(o => takenIds.Contains(o.Id));
                    Save();
                }
                return pending;
            }
        }

        /// <summary>"Geplante Reinigung" Feld 1, automatic: removes offline messages older than
        /// maxAgeDays and marks each one's delivery record (on its originating HistoryEntry, if
        /// still present) as Expired, so "Status & History" reflects that it will never be
        /// delivered now instead of showing "Pending" forever. Returns the number expired.</summary>
        public int ExpireStaleOffline(int maxAgeDays)
        {
            lock (_lock)
            {
                var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, maxAgeDays));
                var stale = _data.OfflineQueue.Where(o => o.QueuedAtUtc < cutoff).ToList();
                return ExpireOfflineRecordsLocked(stale);
            }
        }

        /// <summary>"Geplante Reinigung" Feld 1, manual "Alle nicht zugestellten Nachrichten
        /// löschen" button: expires every currently queued offline message right now,
        /// regardless of age. Returns the number expired.</summary>
        public int PurgeAllOffline()
        {
            lock (_lock)
            {
                var all = _data.OfflineQueue.ToList();
                return ExpireOfflineRecordsLocked(all);
            }
        }

        /// <summary>Shared by ExpireStaleOffline/PurgeAllOffline. Must be called while already
        /// holding _lock. Marks each record's history delivery as Expired (reusing the
        /// previously-recorded Username if there is one, so the badge doesn't regress to showing
        /// a bare user id) before removing it from the queue, and saves once at the end.</summary>
        private int ExpireOfflineRecordsLocked(List<OfflineMessageRecord> records)
        {
            if (records.Count == 0) return 0;

            foreach (var record in records)
            {
                if (string.IsNullOrEmpty(record.HistoryEntryId)) continue;
                var entry = _data.History.FirstOrDefault(h => h.Id == record.HistoryEntryId);
                if (entry == null) continue;

                string username = record.UserId;
                if (entry.Deliveries.TryGetValue(record.UserId, out var existing) && !string.IsNullOrEmpty(existing.Username))
                    username = existing.Username;

                entry.Deliveries[record.UserId] = new DeliveryRecord
                {
                    UserId = record.UserId,
                    Username = username,
                    Status = DeliveryStatus.Expired.ToString()
                };
            }

            var removedIds = new HashSet<string>(records.Select(r => r.Id));
            var removed = _data.OfflineQueue.RemoveAll(o => removedIds.Contains(o.Id));
            if (removed > 0) Save();
            return removed;
        }

        public int CountPendingOffline()
        {
            lock (_lock) return _data.OfflineQueue.Count;
        }

        // ---------------------------------------------------------------
        // "Geplante Reinigung" Feld 2 - aged/on-demand history cleanup
        // ---------------------------------------------------------------

        /// <summary>"Geplante Reinigung" Feld 2, automatic: deletes history entries older than
        /// maxAgeDays whose MessageType is in includedTypes. Also cancels any offline deliveries
        /// still tied to a deleted entry (same as DismissHistory/ClearHistory), so a deleted
        /// history row can never leave an orphaned queue entry pointing at it. Returns the number
        /// of history entries removed.</summary>
        public int PurgeOldHistory(int maxAgeDays, HashSet<MessageOrigin> includedTypes)
        {
            var cutoff = DateTime.UtcNow.AddDays(-Math.Max(1, maxAgeDays));
            return RemoveHistoryWhereLocked(h => h.CreatedAtUtc < cutoff && MatchesType(h, includedTypes));
        }

        /// <summary>"Geplante Reinigung" Feld 2, manual "History sofort löschen" button: deletes
        /// every history entry whose MessageType is in includedTypes right now, regardless of
        /// age. Returns the number removed.</summary>
        public int PurgeHistoryNow(HashSet<MessageOrigin> includedTypes)
        {
            return RemoveHistoryWhereLocked(h => MatchesType(h, includedTypes));
        }

        private static bool MatchesType(HistoryEntry h, HashSet<MessageOrigin> includedTypes) =>
            Enum.TryParse<MessageOrigin>(h.MessageType, out var type) && includedTypes.Contains(type);

        private int RemoveHistoryWhereLocked(Func<HistoryEntry, bool> predicate)
        {
            lock (_lock)
            {
                var matches = _data.History.Where(predicate).ToList();
                if (matches.Count == 0) return 0;
                var ids = matches.Select(h => h.Id).ToList();
                _data.History.RemoveAll(h => ids.Contains(h.Id));
                RemoveOfflineFor(ids);
                Save();
                return ids.Count;
            }
        }

        // ---------------------------------------------------------------
        // Storage stats (file-size breakdown for the "Geplante Reinigung" card)
        // ---------------------------------------------------------------

        public StorageStats GetStorageStats()
        {
            lock (_lock)
            {
                long fileBytes = 0;
                try { if (File.Exists(_filePath)) fileBytes = new FileInfo(_filePath).Length; }
                catch { /* best-effort only, stats are informational */ }

                return new StorageStats
                {
                    TotalFileBytes = fileBytes,
                    HistoryCount = _data.History.Count,
                    HistoryBytes = JsonSerializer.SerializeToUtf8Bytes(_data.History, JsonOpts).LongLength,
                    OfflineQueueCount = _data.OfflineQueue.Count,
                    OfflineQueueBytes = JsonSerializer.SerializeToUtf8Bytes(_data.OfflineQueue, JsonOpts).LongLength
                };
            }
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
