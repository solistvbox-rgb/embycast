using System;
using System.Collections.Generic;

namespace EmbyCast.Plugin.Models
{
    /// <summary>One user's delivery outcome for a given history entry.</summary>
    public class DeliveryRecord
    {
        public string UserId { get; set; }
        public string Username { get; set; }
        public string Status { get; set; } // DeliveryStatus as string (serialization-friendly)
        public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
    }

    /// <summary>A single row in "Status & History". Covers instant, scheduled, timer,
    /// media-news, welcome and offline messages alike.</summary>
    public class HistoryEntry
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string MessageType { get; set; } // MessageOrigin as string
        public string Header { get; set; }
        public string Text { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public DateTime? ScheduledForUtc { get; set; }
        public string RecipientMode { get; set; } // RecipientMode as string
        public List<string> RequestedUserIds { get; set; } = new List<string>();
        public Dictionary<string, DeliveryRecord> Deliveries { get; set; } =
            new Dictionary<string, DeliveryRecord>(StringComparer.OrdinalIgnoreCase);
        /// <summary>False once dismissed by an admin from the history list.</summary>
        public bool Active { get; set; } = true;
    }

    /// <summary>A message an admin scheduled for a future date/time.</summary>
    public class ScheduledMessageRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Header { get; set; }
        public string Text { get; set; }
        public DateTime SendAtUtc { get; set; }
        public string RecipientMode { get; set; } = "All";
        public List<string> SpecificUserIds { get; set; } = new List<string>();
        public int TimeoutMs { get; set; }
        public bool Sent { get; set; }
        public bool Cancelled { get; set; }
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public string HistoryEntryId { get; set; }
    }

    /// <summary>A message queued for a specific user because they were offline at send time.
    /// Delivered by SessionEventListener the next time that user's session starts.</summary>
    public class OfflineMessageRecord
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string HistoryEntryId { get; set; }
        public string UserId { get; set; }
        public string Header { get; set; }
        public string Text { get; set; }
        public int TimeoutMs { get; set; }
        public DateTime QueuedAtUtc { get; set; } = DateTime.UtcNow;
    }

    /// <summary>State of the single active countdown/timer job, if any.</summary>
    public class TimerJobState
    {
        public string Id { get; set; } = Guid.NewGuid().ToString("N");
        public string Header { get; set; }
        /// <summary>Message template. May contain the placeholder "{minutes}" which is
        /// substituted with the remaining minutes at each preset interval.</summary>
        public string TextTemplate { get; set; }
        /// <summary>Auto-dismiss timeout (ms) applied to every message this timer job sends,
        /// same semantics as the timeout field on instant/scheduled messages.</summary>
        public int TimeoutMs { get; set; }
        public DateTime StartUtc { get; set; }
        public DateTime EndUtc { get; set; }
        /// <summary>Minute marks (descending) at which an intermediate message is sent,
        /// e.g. [60, 30, 15, 5, 1].</summary>
        public List<int> PresetMinutes { get; set; } = new List<int>();
        public List<int> FiredPresets { get; set; } = new List<int>();
        public string PostAction { get; set; } = "None"; // PostTimerAction as string
        public string RecipientMode { get; set; } = "Active";
        public List<string> SpecificUserIds { get; set; } = new List<string>();
        public bool Active { get; set; }
        public bool CompletedActionRan { get; set; }
        public string LastError { get; set; }
    }

    /// <summary>Root document persisted as a single JSON file.</summary>
    public class StoreData
    {
        public List<HistoryEntry> History { get; set; } = new List<HistoryEntry>();
        public List<ScheduledMessageRecord> ScheduledMessages { get; set; } = new List<ScheduledMessageRecord>();
        public List<OfflineMessageRecord> OfflineQueue { get; set; } = new List<OfflineMessageRecord>();
        public TimerJobState ActiveTimer { get; set; }
        public HashSet<string> WelcomedUserIds { get; set; } = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
    }
}
