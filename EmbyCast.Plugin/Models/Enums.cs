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
    /// NOTE: RestartServer / ShutdownServer are marked experimental - see
    /// Services/PostTimerActionExecutor.cs and the project README for details on why these
    /// depend on the exact Emby Server build you run.
    /// A "MaintenanceMode" option existed here through v1.2.0 - removed (2026-08-20) because it
    /// was never actually wired to Emby's real Dashboard > General maintenance-mode toggle (it
    /// only sent a notice message; see the removed case in PostTimerActionExecutor.cs's history),
    /// which was misleading, and a real implementation isn't reliably possible: Emby's real
    /// maintenance mode is a very recent (~August 2025) beta feature with no documented plugin
    /// SDK surface to verify against.</summary>
    public enum PostTimerAction
    {
        None,
        RestartServer,
        ShutdownServer
    }
}
