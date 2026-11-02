using System;
using MediaBrowser.Model.Plugins;

namespace EmbyCast.Plugin.Configuration
{
    /// <summary>
    /// Persisted plugin settings (serialized to XML by Emby's BasePlugin infrastructure).
    /// Runtime data (history, offline queue, scheduled messages, active timer, groups, System
    /// Messages) lives in <see cref="EmbyCast.Plugin.Storage.MessageStore"/> instead - growing
    /// lists are slow and fragile in the XML config file.
    /// </summary>
    public class PluginConfiguration : BasePluginConfiguration
    {
        // ---- UI ---------------------------------------------------------
        /// <summary>Default dashboard language: "en" or "de". The dashboard remembers the
        /// admin's last choice in the browser and falls back to this value.</summary>
        public string Language { get; set; } = "en";

        // ---- Welcome message ---------------------------------------------
        public bool WelcomeMessageEnabled { get; set; } = false;
        public string WelcomeMessageHeader { get; set; } = "Welcome!";
        public string WelcomeMessageText { get; set; } = "Welcome to our media server - enjoy your stay!";
        public int WelcomeMessageTimeoutMs { get; set; } = 0;

        // ---- Timer / countdown defaults -----------------------------------
        /// <summary>Comma separated default minute presets, e.g. "60,30,15,5,1".</summary>
        public string TimerPresetMinutesCsv { get; set; } = "60,30,15,5,1";

        // ---- Media news / "what's new" -------------------------------------
        public string MediaNewsHeader { get; set; } = "What's New";
        public int MediaNewsLookbackDays { get; set; } = 7;
        /// <summary>Comma separated library (virtual folder) ids to include.
        /// Empty = nothing selected = nothing sent (see MediaNewsService.ResolveLibraryPaths).</summary>
        public string MediaNewsLibraryIdsCsv { get; set; } = "";
        public string MediaNewsRecipientMode { get; set; } = "All"; // Active | All | Specific
        public string MediaNewsSpecificUserIdsCsv { get; set; } = "";
        /// <summary>Comma separated user-group ids (see Models.UserGroup), resolved to member
        /// user ids at send time - never stored expanded here.</summary>
        public string MediaNewsSpecificGroupIdsCsv { get; set; } = "";
        public bool MediaNewsSkipWhenEmpty { get; set; } = true;
        /// <summary>LEGACY: the former either/or "NewSeries"/"NewEpisodes" choice, replaced by
        /// MediaNewsIncludeNewSeries/MediaNewsIncludeNewEpisodes. Only read by the one-time startup
        /// migration in Plugin - do not use in new code.
        ///
        /// The default must stay null: XmlSerializer leaves a null property out of the saved XML,
        /// so after the migration clears it the element is gone for good. A non-null default would
        /// be restored from the initializer on every load and re-trigger the migration.</summary>
        public string MediaNewsSeriesMode { get; set; } = null;
        /// <summary>Include a "New TV Shows" section (name + year). Can be combined with
        /// MediaNewsIncludeNewEpisodes.</summary>
        public bool MediaNewsIncludeNewSeries { get; set; } = true;
        /// <summary>Include a "New Episodes" section, one line per episode formatted per
        /// MediaNewsEpisodeTemplate.</summary>
        public bool MediaNewsIncludeNewEpisodes { get; set; } = false;
        /// <summary>Per-episode line format. Placeholders: "{Series name (year)}", "{SxxExx}"
        /// (e.g. "S11E02") and "{Episode title}". MediaNewsService.FormatEpisodeLine also still
        /// understands the older German placeholders ("{Serienname (Jahr)}"/"{Episodentitel}"),
        /// so templates saved with them keep working.</summary>
        public string MediaNewsEpisodeTemplate { get; set; } = "{Series name (year)} - {SxxExx} - {Episode title}";

        public bool MediaNewsAutoSendEnabled { get; set; } = false;
        /// <summary>Day/Hour/Minute below are UTC (MediaNewsAutoScheduler runs on
        /// DateTime.UtcNow). The dashboard shows and accepts the admin's local time and converts
        /// with the UTC offset at save time (app.js localDayTimeToUtc/utcDayTimeToLocal), so the
        /// local send time can shift by an hour across a DST change until the admin saves again -
        /// accepted, since there is no reliable way to resolve a timezone id on every Emby host.</summary>
        public DayOfWeek MediaNewsAutoSendDay { get; set; } = DayOfWeek.Friday;
        public int MediaNewsAutoSendHour { get; set; } = 18;
        public int MediaNewsAutoSendMinute { get; set; } = 0;
        /// <summary>LEGACY - only read once at startup to migrate into the store
        /// (StoreData.MediaNewsLastAutoSentUtc).</summary>
        public DateTime? MediaNewsLastAutoSentUtc { get; set; }
        /// <summary>"Send only to web-browser sessions" for the weekly auto-send, captured when
        /// "Save Auto-send Settings" is clicked. A manual "Send Media News Now" never stores it.
        /// Defaults to false (all session types).</summary>
        public bool MediaNewsAutoWebOnly { get; set; } = false;

        // ---- Settings tile ----------------------------------------------------
        /// <summary>What EmbyCast writes to the Emby server log: Nothing, ErrorsOnly,
        /// ErrorsAndWarnings (default) or Verbose - see EmbyCastLogger.</summary>
        public string LogLevel { get; set; } = "ErrorsAndWarnings";
        /// <summary>"Offer beta versions": the update check also considers GitHub pre-releases.
        /// Off by default.</summary>
        public bool IncludePreReleases { get; set; } = false;

        // ---- Offline delivery -----------------------------------------------
        /// <summary>Messages for users without an active session (recipients "All users" /
        /// "Selected users &amp; groups") are kept and delivered at their next login. When off,
        /// they are recorded as Failed instead. Timer and System Message never keep messages.</summary>
        public bool OfflineDeliveryEnabled { get; set; } = true;
        /// <summary>Scheduled Cleanup: kept offline messages older than this (counted from
        /// OfflineMessageRecord.QueuedAtUtc) are marked Expired and removed from the queue - see
        /// ScheduledMessageBackgroundService.ProcessCleanupAsync.</summary>
        public int OfflineMessageMaxAgeDays { get; set; } = 7;

        // ---- History ----------------------------------------------------------
        public int HistoryMaxEntries { get; set; } = 300;
        /// <summary>Scheduled Cleanup: history entries older than this (counted from
        /// HistoryEntry.CreatedAtUtc) are deleted for the types selected by the
        /// HistoryCleanupInclude* flags. Must be &gt;= OfflineMessageMaxAgeDays so an entry is
        /// never deleted while its offline delivery is still pending; the dashboard enforces it
        /// and ProcessCleanupAsync clamps again.</summary>
        public int HistoryMaxAgeDays { get; set; } = 14;
        public bool HistoryCleanupIncludeInstant { get; set; } = true;
        public bool HistoryCleanupIncludeScheduled { get; set; } = true;
        public bool HistoryCleanupIncludeTimer { get; set; } = true;
        public bool HistoryCleanupIncludeMediaNews { get; set; } = true;
        public bool HistoryCleanupIncludeWelcome { get; set; } = true;
        public bool HistoryCleanupIncludeOffline { get; set; } = true;
        public bool HistoryCleanupIncludeSystem { get; set; } = true;
        /// <summary>On/off switch for the automatic daily cleanup (offline expiry and history
        /// purge). Saved immediately by the toggle itself; the two "Delete now" buttons work
        /// regardless. Defaults to true (opt-out).</summary>
        public bool CleanupEnabled { get; set; } = true;

        // ---- Dashboard tile homepage ------------------------------------------
        /// <summary>Comma separated tile keys in the admin's display order (drag &amp; drop).
        /// Empty = built-in order. On load, unknown keys are dropped and missing ones appended,
        /// so tiles added by a later plugin version still show up.</summary>
        public string TileOrderCsv { get; set; } = "";

        /// <summary>Tile colour scheme of the tile homepage (Settings tile): Default (the
        /// built-in colourful tiles), Accent (Emby's accent colour), Neutral or Pastel.</summary>
        public string TileColorScheme { get; set; } = "Default";
        /// <summary>Single tiles changed on top of the scheme, "key=#rrggbb,key=#rrggbb".
        /// Empty = every tile uses the scheme colour.</summary>
        public string TileColorsCsv { get; set; } = "";
    }
}
