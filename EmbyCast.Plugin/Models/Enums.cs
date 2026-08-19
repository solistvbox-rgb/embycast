namespace EmbyCast.Plugin.Models
{
    /// <summary>Who a message should go to.</summary>
    public enum RecipientMode
    {
        /// <summary>Only sessions that are currently active/connected.</summary>
        Active,
        /// <summary>Every user known to the server, including ones with no active session
        /// right now (those get queued as an offline message, see MessageStore).</summary>
        All,
        /// <summary>An explicit list of user ids.</summary>
        Specific
    }

    /// <summary>Per-user delivery outcome recorded in a history entry.</summary>
    public enum DeliveryStatus
    {
        /// <summary>Sent live to at least one active session of this user.</summary>
        Delivered,
        /// <summary>User had no active session; message queued for delivery at next login.</summary>
        Pending,
        /// <summary>Send attempt failed (and offline queueing was disabled or also failed).</summary>
        Failed,
        /// <summary>Was queued for offline delivery, but never got delivered before the
        /// configured "Geplante Reinigung" offline-expiry deadline (Plugin.Configuration.
        /// OfflineMessageMaxAgeDays) was reached - removed from the queue, will never be
        /// delivered now.</summary>
        Expired
    }

    /// <summary>Where a history entry originated from - purely informational, used for
    /// filtering/labeling in the dashboard history table.</summary>
    public enum MessageOrigin
    {
        Instant,
        Scheduled,
        Timer,
        MediaNews,
        Welcome,
        Offline
    }

    /// <summary>Action to take once a countdown timer reaches zero.
    /// NOTE: RestartServer / ShutdownServer / MaintenanceMode are marked experimental - see
    /// Services/PostTimerActionExecutor.cs and the project README for details on why these
    /// depend on the exact Emby Server build you run.</summary>
    public enum PostTimerAction
    {
        None,
        RestartServer,
        ShutdownServer,
        MaintenanceMode
    }
}
