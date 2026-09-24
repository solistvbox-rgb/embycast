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
        /// <summary>Set by DeleteStoreFile() (uninstall). From then on Save() is a no-op, so the
        /// background loops that keep running until the server restarts can't recreate the file
        /// the admin just asked to have removed.</summary>
        private bool _deleted;

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

        /// <summary>Deep copy via a JSON round-trip. Every public getter hands out copies made
        /// under _lock rather than the live objects in _data: callers (notably the API layer,
        /// whose responses Emby serializes after the call returns - outside the lock) would
        /// otherwise read collections such as HistoryEntry.Deliveries or
        /// TimerJobState.FiredPresets while a background send mutates them, which can throw
        /// "Collection was modified" or produce torn data. Volumes are small (see the class
        /// doc), so the extra serialization is negligible.</summary>
        private static T Clone<T>(T value) where T : class =>
            value == null ? null : JsonSerializer.Deserialize<T>(JsonSerializer.SerializeToUtf8Bytes(value, JsonOpts), JsonOpts);

        private string TmpPath => _filePath + ".tmp";
        private string BakPath => _filePath + ".bak";

        /// <summary>Loads the store, falling back through the files Save() leaves behind: the
        /// main file first, then ".tmp" (a complete write whose final swap was interrupted -
        /// newer than ".bak"), then ".bak" (the previous good version, kept by Save()'s
        /// File.Replace). A main file that exists but can't be parsed is renamed to
        /// ".corrupt-&lt;timestamp&gt;" rather than left for the next Save() to overwrite, so it
        /// can still be inspected/recovered by hand. Starting completely fresh is only the last
        /// resort - it would also wipe WelcomedUserIds, making every user receive the welcome
        /// message again on their next login, so it is logged as an error.</summary>
        private StoreData Load()
        {
            var mainExists = File.Exists(_filePath);
            var loaded = TryLoadFile(_filePath);
            if (loaded != null) return Normalize(loaded);

            if (mainExists) PreserveCorruptFile();

            foreach (var fallback in new[] { TmpPath, BakPath })
            {
                loaded = TryLoadFile(fallback);
                if (loaded == null) continue;

                _logger.Warn("EmbyCast: store file {0}, recovered from {1}.",
                    mainExists ? "was unreadable" : "was missing", Path.GetFileName(fallback));
                _data = Normalize(loaded);
                lock (_lock) Save(); // restore the main file right away
                return _data;
            }

            if (mainExists || File.Exists(TmpPath) || File.Exists(BakPath))
                _logger.Error("EmbyCast: store file and its backups could not be loaded - starting with an empty store (history, groups, scheduled messages and welcomed-user tracking are reset).");
            return new StoreData();
        }

        /// <summary>Repairs what System.Text.Json can't restore on its own: settable collection
        /// properties are replaced by freshly constructed instances on deserialization, which
        /// silently drops the StringComparer.OrdinalIgnoreCase the property initializers set up
        /// (WelcomedUserIds, HistoryEntry.Deliveries) - lookups would turn case-sensitive after
        /// the first reload. Also replaces any collection that came back null (e.g. an explicit
        /// "null" in a hand-edited file) with an empty one, so no caller has to null-check.</summary>
        private static StoreData Normalize(StoreData data)
        {
            data.History = data.History ?? new List<HistoryEntry>();
            data.ScheduledMessages = data.ScheduledMessages ?? new List<ScheduledMessageRecord>();
            data.OfflineQueue = data.OfflineQueue ?? new List<OfflineMessageRecord>();
            data.Groups = data.Groups ?? new List<UserGroup>();
            data.WelcomedUserIds = new HashSet<string>(
                (data.WelcomedUserIds ?? Enumerable.Empty<string>()).Where(id => id != null),
                StringComparer.OrdinalIgnoreCase);

            data.History.RemoveAll(h => h == null);
            foreach (var entry in data.History)
            {
                var deliveries = new Dictionary<string, DeliveryRecord>(StringComparer.OrdinalIgnoreCase);
                if (entry.Deliveries != null)
                {
                    // Indexer, not Add: keys differing only by case collapse into one instead of
                    // throwing.
                    foreach (var kv in entry.Deliveries)
                        if (kv.Key != null) deliveries[kv.Key] = kv.Value;
                }
                entry.Deliveries = deliveries;
                entry.RequestedUserIds = entry.RequestedUserIds ?? new List<string>();
            }
            foreach (var s in data.ScheduledMessages)
            {
                s.SpecificUserIds = s.SpecificUserIds ?? new List<string>();
                s.SpecificGroupIds = s.SpecificGroupIds ?? new List<string>();
            }
            foreach (var g in data.Groups)
                g.UserIds = g.UserIds ?? new List<string>();
            if (data.ActiveTimer != null)
            {
                data.ActiveTimer.PresetMinutes = data.ActiveTimer.PresetMinutes ?? new List<int>();
                data.ActiveTimer.FiredPresets = data.ActiveTimer.FiredPresets ?? new List<int>();
                data.ActiveTimer.SpecificUserIds = data.ActiveTimer.SpecificUserIds ?? new List<string>();
                data.ActiveTimer.SpecificGroupIds = data.ActiveTimer.SpecificGroupIds ?? new List<string>();
            }
            return data;
        }

        private StoreData TryLoadFile(string path)
        {
            try
            {
                if (!File.Exists(path)) return null;
                var json = File.ReadAllText(path);
                if (string.IsNullOrWhiteSpace(json)) return null;
                return JsonSerializer.Deserialize<StoreData>(json, JsonOpts);
            }
            catch (Exception ex)
            {
                _logger.Warn("EmbyCast: failed to read store file {0}: {1}", Path.GetFileName(path), ex.Message);
                return null;
            }
        }

        private void PreserveCorruptFile()
        {
            try
            {
                var target = _filePath + ".corrupt-" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");
                File.Move(_filePath, target);
                _logger.Error("EmbyCast: unreadable store file preserved as {0}.", Path.GetFileName(target));
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: could not preserve unreadable store file.", ex);
            }
        }

        /// <summary>Deletes the store file from disk - backs Plugin.OnUninstalling() (see
        /// Plugin.cs), called when the admin uninstalls EmbyCast via Dashboard -> Plugins, so no
        /// message history/scheduled messages/groups/welcomed-user tracking is left behind on
        /// disk after a full uninstall. Emby's own uninstall flow only ever deletes the plugin
        /// DLL itself, never any files a plugin created on its own - this is opt-in cleanup this
        /// plugin does for itself. Safe to call even if the file doesn't exist (e.g. a plugin
        /// that was installed but never actually used). Deliberately does NOT clear _data/reset
        /// in memory - the plugin is about to be unloaded anyway, and any in-flight call already
        /// holding a reference to _data shouldn't suddenly see it wiped out from under it.</summary>
        public void DeleteStoreFile()
        {
            lock (_lock)
            {
                _deleted = true;
                try
                {
                    foreach (var path in new[] { _filePath, TmpPath, BakPath })
                    {
                        if (File.Exists(path)) File.Delete(path);
                    }
                }
                catch (Exception ex)
                {
                    _logger.ErrorException("EmbyCast: failed to delete store file during uninstall.", ex);
                }
            }
        }

        /// <summary>Must be called while holding _lock. Writes to ".tmp" (flushed to disk), then
        /// swaps it in with File.Replace, which keeps the previous version as ".bak" - there is
        /// never a moment where no complete store file exists, unlike the old delete-then-move,
        /// where a crash between the two steps left no main file at all. Load() knows how to
        /// recover from either leftover.</summary>
        private void Save()
        {
            if (_deleted) return;
            try
            {
                var bytes = JsonSerializer.SerializeToUtf8Bytes(_data, JsonOpts);
                using (var fs = new FileStream(TmpPath, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    fs.Write(bytes, 0, bytes.Length);
                    fs.Flush(true);
                }

                if (!File.Exists(_filePath))
                {
                    File.Move(TmpPath, _filePath);
                    return;
                }

                try
                {
                    File.Replace(TmpPath, _filePath, BakPath);
                }
                catch (Exception ex) when (ex is IOException || ex is PlatformNotSupportedException || ex is UnauthorizedAccessException)
                {
                    // Some filesystems (certain network shares / container bind mounts) don't
                    // support File.Replace. Fall back to copies: less atomic, but a complete
                    // ".bak" and ".tmp" both exist at every step, so Load() can still recover.
                    File.Copy(_filePath, BakPath, true);
                    File.Copy(TmpPath, _filePath, true);
                    File.Delete(TmpPath);
                }
            }
            catch (Exception ex)
            {
                _logger.ErrorException("EmbyCast: failed to save store.", ex);
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

        /// <summary>Records a whole send's outcome in one write: every delivery record on the
        /// history entry plus every offline-queue record, then a single Save(). DeliveryService
        /// used to call UpdateHistoryDelivery/QueueOffline once per recipient, rewriting the entire
        /// store file each time - N full rewrites for an "All users" broadcast. Delivery records
        /// are keyed by DeliveryRecord.UserId; records without one are skipped. The offline
        /// records are queued even if the history entry has meanwhile disappeared (capped or
        /// cleared), same as QueueOffline always did.</summary>
        public void RecordSendResults(string historyEntryId, IEnumerable<DeliveryRecord> deliveries, IEnumerable<OfflineMessageRecord> offlineRecords)
        {
            lock (_lock)
            {
                var changed = false;
                var entry = _data.History.FirstOrDefault(h => h.Id == historyEntryId);
                if (entry != null)
                {
                    foreach (var record in deliveries ?? Enumerable.Empty<DeliveryRecord>())
                    {
                        if (record == null || string.IsNullOrEmpty(record.UserId)) continue;
                        entry.Deliveries[record.UserId] = record;
                        changed = true;
                    }
                }
                foreach (var offline in offlineRecords ?? Enumerable.Empty<OfflineMessageRecord>())
                {
                    if (offline == null) continue;
                    _data.OfflineQueue.Add(offline);
                    changed = true;
                }
                if (changed) Save();
            }
        }

        public List<HistoryEntry> GetHistory()
        {
            lock (_lock) return _data.History.Select(Clone).ToList();
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
                return Clone(record);
            }
        }

        public List<ScheduledMessageRecord> GetScheduled(bool includeSentOrCancelled = false)
        {
            lock (_lock)
            {
                return _data.ScheduledMessages
                    .Where(s => includeSentOrCancelled || (!s.Sent && !s.Cancelled))
                    .OrderBy(s => s.SendAtUtc)
                    .Select(Clone)
                    .ToList();
            }
        }

        public List<ScheduledMessageRecord> GetDueScheduled(DateTime nowUtc)
        {
            lock (_lock)
            {
                return _data.ScheduledMessages
                    .Where(s => !s.Sent && !s.Cancelled && s.SendAtUtc <= nowUtc)
                    .Select(Clone)
                    .ToList();
            }
        }

        /// <summary>Atomically removes a still-pending scheduled message and returns it (null if
        /// it no longer exists - already taken, cancelled or edited away). The background sender
        /// takes a message BEFORE sending it, so a crash or restart mid-send can never make it go
        /// out twice (at-most-once); if the send fails before anything reached anyone, the caller
        /// puts it back with ReturnScheduled(). Records are removed outright rather than flagged
        /// Sent=true: the full audit trail lives in the HistoryEntry the send creates, and
        /// nothing in the UI reads back already-sent scheduled records.</summary>
        public ScheduledMessageRecord TryTakeScheduled(string id)
        {
            lock (_lock)
            {
                var record = _data.ScheduledMessages.FirstOrDefault(s => s.Id == id && !s.Sent && !s.Cancelled);
                if (record == null) return null;
                _data.ScheduledMessages.Remove(record);
                Save();
                return record;
            }
        }

        /// <summary>Puts a message taken by TryTakeScheduled() back, unchanged, for another
        /// attempt on the next poll. A no-op if a record with the same id exists again.</summary>
        public void ReturnScheduled(ScheduledMessageRecord record)
        {
            if (record == null) return;
            lock (_lock)
            {
                if (_data.ScheduledMessages.Any(s => s.Id == record.Id)) return;
                _data.ScheduledMessages.Add(record);
                Save();
            }
        }

        /// <summary>Updates a still-pending scheduled message in place (same Id, so it keeps its
        /// position/identity rather than becoming a new entry). Returns null if no such record
        /// exists any more - covers both "wrong id" and "it already fired or was cancelled" in one
        /// case, since TryTakeScheduled/CancelScheduled both remove the record outright rather
        /// than flagging it (see their doc comments) - same "not found" contract as
        /// UpdateGroup.</summary>
        public ScheduledMessageRecord UpdateScheduled(
            string id, string header, string text, int timeoutMs, DateTime sendAtUtc,
            string recipientMode, List<string> userIds, List<string> groupIds)
        {
            lock (_lock)
            {
                var record = _data.ScheduledMessages.FirstOrDefault(s => s.Id == id);
                if (record == null) return null;
                record.Header = header;
                record.Text = text;
                record.TimeoutMs = timeoutMs;
                record.SendAtUtc = sendAtUtc;
                record.RecipientMode = recipientMode;
                record.SpecificUserIds = userIds ?? new List<string>();
                record.SpecificGroupIds = groupIds ?? new List<string>();
                Save();
                return Clone(record);
            }
        }

        /// <summary>Removes the scheduled-message record outright on cancellation, for the same
        /// reason as TryTakeScheduled above.</summary>
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

        /// <summary>Puts messages taken by TakePendingForUser() back into the queue because they
        /// could not actually be delivered (e.g. the session ended before the send, or the
        /// session manager was unavailable) - otherwise they would be lost while their history
        /// entry kept showing "Pending" forever. Records keep their original Id and QueuedAtUtc,
        /// so offline expiry still counts from the first queueing. A record whose history entry
        /// was dismissed in the meantime is NOT re-queued, since dismissing is how an admin
        /// cancels pending deliveries (see DismissHistory). Returns the number re-queued.</summary>
        public int RequeueOffline(IEnumerable<OfflineMessageRecord> records)
        {
            lock (_lock)
            {
                var count = 0;
                foreach (var record in records ?? Enumerable.Empty<OfflineMessageRecord>())
                {
                    if (record == null) continue;
                    if (!string.IsNullOrEmpty(record.HistoryEntryId))
                    {
                        var entry = _data.History.FirstOrDefault(h => h.Id == record.HistoryEntryId);
                        if (entry != null && !entry.Active) continue;
                    }
                    if (_data.OfflineQueue.Any(o => o.Id == record.Id)) continue;
                    _data.OfflineQueue.Add(record);
                    count++;
                }
                if (count > 0) Save();
                return count;
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

        /// <summary>Atomically claims the single timer slot: stores <paramref name="state"/> only
        /// if the slot is currently free (no timer record at all, or a leftover record from one
        /// that already completed/was cancelled - Active=false and ScheduledStartUtc=null, same
        /// definition TimerService.HasActiveOrPendingTimer() uses). Returns false without
        /// modifying anything if the slot is already actively counting down or already pending -
        /// unlike a plain "check HasActiveOrPendingTimer(), then set it directly" pair, the check
        /// and the write happen under the same lock acquisition, so two near-simultaneous
        /// Start/Schedule requests (double-click, two admin tabs) can't both pass the check and
        /// have the second one silently overwrite the first's state. The sole way to populate
        /// ActiveTimer - there is deliberately no unconditional "just set it" sibling method, so a
        /// future caller can't accidentally reintroduce that race.</summary>
        public bool TryClaimTimerSlot(TimerJobState state)
        {
            lock (_lock)
            {
                var existing = _data.ActiveTimer;
                if (existing != null && (existing.Active || existing.ScheduledStartUtc.HasValue))
                    return false;
                _data.ActiveTimer = state;
                Save();
                return true;
            }
        }

        public TimerJobState GetActiveTimer()
        {
            lock (_lock) return Clone(_data.ActiveTimer);
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

        /// <summary>Atomically claims the welcome message for this user: returns true (and
        /// persists the mark) only for the first caller - a separate HasWelcomed() check followed
        /// by a later mark let two sessions starting at the same time (e.g. web + app) both pass
        /// the check and both send the welcome message. The caller must undo the claim with
        /// UnmarkWelcomed() if the send then fails, so the user is retried on the next login
        /// instead of being counted as welcomed without ever having received it.</summary>
        public bool TryMarkWelcomed(string userId)
        {
            lock (_lock)
            {
                if (!_data.WelcomedUserIds.Add(userId)) return false;
                Save();
                return true;
            }
        }

        /// <summary>Reverts a TryMarkWelcomed() claim whose send failed.</summary>
        public void UnmarkWelcomed(string userId)
        {
            lock (_lock)
            {
                if (_data.WelcomedUserIds.Remove(userId)) Save();
            }
        }

        // ---------------------------------------------------------------
        // Media news auto-send slot
        // ---------------------------------------------------------------

        public DateTime? GetMediaNewsLastAutoSentUtc()
        {
            lock (_lock) return _data.MediaNewsLastAutoSentUtc;
        }

        /// <summary>Atomically claims a weekly auto-send slot: returns true (and records nowUtc
        /// as the last send) only if the last recorded send is older than slotUtc. Check and
        /// write happen under one lock acquisition, so the slot can be handed out at most once.</summary>
        public bool TryClaimMediaNewsAutoSlot(DateTime slotUtc, DateTime nowUtc)
        {
            lock (_lock)
            {
                var last = _data.MediaNewsLastAutoSentUtc;
                if (last.HasValue && last.Value >= slotUtc) return false;
                _data.MediaNewsLastAutoSentUtc = nowUtc;
                Save();
                return true;
            }
        }

        /// <summary>One-time migration of the legacy PluginConfiguration.MediaNewsLastAutoSentUtc
        /// into the store - only if the store doesn't have a value yet, so it can never move the
        /// timestamp backwards once the store owns it.</summary>
        public void MigrateMediaNewsLastAutoSentUtc(DateTime? legacyValue)
        {
            if (!legacyValue.HasValue) return;
            lock (_lock)
            {
                if (_data.MediaNewsLastAutoSentUtc.HasValue) return;
                _data.MediaNewsLastAutoSentUtc = legacyValue;
                Save();
            }
        }

        /// <summary>Marks every given user id as already welcomed WITHOUT sending them the
        /// welcome message - backs the dashboard's "Mark existing users" action, so enabling
        /// Welcome Message afterwards only actually sends to users created from that point on.
        /// Safe to call repeatedly/for a mix of already-marked and new ids (an already-marked id
        /// is simply skipped); saves once at the end rather than once per user. Returns the
        /// number of ids newly marked.</summary>
        public int MarkWelcomedBulk(IEnumerable<string> userIds)
        {
            lock (_lock)
            {
                var count = 0;
                foreach (var id in userIds ?? Enumerable.Empty<string>())
                {
                    if (string.IsNullOrWhiteSpace(id)) continue;
                    if (_data.WelcomedUserIds.Add(id)) count++;
                }
                // Record this run unconditionally - even a 0-count run (everyone was already
                // marked) still confirms to the admin that the action actually happened just
                // now, which is the whole point of showing it back on the dashboard (see
                // GetLastMarkExistingWelcomed). Deliberately overwrites any previous run rather
                // than keeping a history - only "when was this last done" is tracked.
                _data.LastMarkExistingWelcomedUtc = DateTime.UtcNow;
                _data.LastMarkExistingWelcomedCount = count;
                Save();
                return count;
            }
        }

        /// <summary>Clears every id from WelcomedUserIds - backs the dashboard's "Reset welcomed
        /// users" action. Does not send anything itself; the practical effect is that every
        /// current user will receive the welcome message again the next time they log in (same
        /// check as a brand-new user goes through, see EmbyCastEntryPoint.OnSessionStarted), not
        /// immediately. Deliberately does NOT touch LastMarkExistingWelcomedUtc/Count - those
        /// track the separate "Mark existing users" action's own history, not this one. Returns
        /// the number of ids actually cleared (0 if the set was already empty), purely for the
        /// confirmation message shown back to the admin.</summary>
        public int UnmarkAllWelcomed()
        {
            lock (_lock)
            {
                var count = _data.WelcomedUserIds.Count;
                if (count > 0) _data.WelcomedUserIds.Clear();
                // Record this run unconditionally - even a 0-count run (list was already empty)
                // still confirms to the admin that the action actually happened just now, same
                // reasoning as MarkWelcomedBulk above. Deliberately overwrites any previous run
                // rather than keeping a history - only "when was this last done" is tracked.
                _data.LastUnmarkExistingWelcomedUtc = DateTime.UtcNow;
                _data.LastUnmarkExistingWelcomedCount = count;
                Save();
                return count;
            }
        }

        /// <summary>Backs the dashboard's persistent "Wurde am ... durchgeführt" hint under the
        /// "Mark existing users" button - lets the admin see when they last ran it (and how many
        /// were marked) even after navigating away and back, not just in the moment right after
        /// clicking. Both out values are null if it has never been run. Uses out params rather
        /// than a tuple to match this class's existing style elsewhere.</summary>
        public void GetLastMarkExistingWelcomed(out DateTime? lastRunUtc, out int? count)
        {
            lock (_lock)
            {
                lastRunUtc = _data.LastMarkExistingWelcomedUtc;
                count = _data.LastMarkExistingWelcomedCount;
            }
        }

        /// <summary>Backs the dashboard's persistent hint under the "Reset welcomed users"
        /// button - mirrors GetLastMarkExistingWelcomed above but for UnmarkAllWelcomed. Both out
        /// values are null if it has never been run.</summary>
        public void GetLastUnmarkExistingWelcomed(out DateTime? lastRunUtc, out int? count)
        {
            lock (_lock)
            {
                lastRunUtc = _data.LastUnmarkExistingWelcomedUtc;
                count = _data.LastUnmarkExistingWelcomedCount;
            }
        }

        // ---------------------------------------------------------------
        // User groups ("User-Gruppen") - flat, named lists of user ids offered as a reusable
        // recipient selection alongside individually-picked "Specific" users. See UserGroup's
        // doc comment for why membership is resolved dynamically (ExpandGroupsToUserIds) rather
        // than flattened into a fixed list when a group is chosen as a recipient.
        // ---------------------------------------------------------------

        public List<UserGroup> GetGroups()
        {
            lock (_lock) return _data.Groups.OrderBy(g => g.Name, StringComparer.OrdinalIgnoreCase).Select(Clone).ToList();
        }

        public UserGroup CreateGroup(string name, List<string> userIds)
        {
            lock (_lock)
            {
                var group = new UserGroup
                {
                    Name = string.IsNullOrWhiteSpace(name) ? "Group" : name.Trim(),
                    UserIds = (userIds ?? new List<string>()).Where(id => !string.IsNullOrWhiteSpace(id))
                        .Distinct(StringComparer.OrdinalIgnoreCase).ToList()
                };
                _data.Groups.Add(group);
                Save();
                return Clone(group);
            }
        }

        /// <summary>Returns null if no group with this id exists (caller returns 404-equivalent).</summary>
        public UserGroup UpdateGroup(string id, string name, List<string> userIds)
        {
            lock (_lock)
            {
                var group = _data.Groups.FirstOrDefault(g => g.Id == id);
                if (group == null) return null;
                if (!string.IsNullOrWhiteSpace(name)) group.Name = name.Trim();
                group.UserIds = (userIds ?? new List<string>()).Where(uid => !string.IsNullOrWhiteSpace(uid))
                    .Distinct(StringComparer.OrdinalIgnoreCase).ToList();
                Save();
                return Clone(group);
            }
        }

        /// <summary>Also strips this group id from any still-pending Scheduled Message / active
        /// Timer that references it, so a deleted group can never silently keep affecting a
        /// future send. ExpandGroupsToUserIds already ignores unresolvable group ids defensively
        /// too, in case this is ever bypassed (e.g. a hand-edited store file).</summary>
        public bool DeleteGroup(string id)
        {
            lock (_lock)
            {
                var group = _data.Groups.FirstOrDefault(g => g.Id == id);
                if (group == null) return false;
                _data.Groups.Remove(group);
                foreach (var s in _data.ScheduledMessages) s.SpecificGroupIds?.Remove(id);
                if (_data.ActiveTimer != null) _data.ActiveTimer.SpecificGroupIds?.Remove(id);
                Save();
                return true;
            }
        }

        /// <summary>Expands a set of group ids into the union of their current members' user
        /// ids. Unknown/deleted group ids are silently ignored rather than treated as an error -
        /// a send simply proceeds with whatever recipients still resolve.</summary>
        public List<string> ExpandGroupsToUserIds(IEnumerable<string> groupIds)
        {
            lock (_lock)
            {
                var idSet = new HashSet<string>(groupIds ?? Enumerable.Empty<string>());
                if (idSet.Count == 0) return new List<string>();
                return _data.Groups.Where(g => idSet.Contains(g.Id)).SelectMany(g => g.UserIds).ToList();
            }
        }
    }
}
