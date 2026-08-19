using System;
using MediaBrowser.Model.Plugins;

namespace EmbyCast.Plugin.Configuration
{
    /// <summary>
    /// Persisted plugin settings (serialized to XML by Emby's BasePlugin infrastructure).
    /// Runtime/mutable data (history, offline queue, scheduled messages, active timer)
    /// intentionally lives in <see cref="EmbyCast.Plugin.Storage.MessageStore"/>
    /// instead - a growing list inside the XML config file gets slow to (de)serialize and is
    /// more prone to corruption than a small dedicated JSON store.
    /// </summary>
    public class PluginConfiguration : BasePluginConfiguration
    {
        // ---- UI ---------------------------------------------------------
        /// <summary>Default dashboard language: "en" or "de". The dashboard page itself
        /// remembers the user's last choice in the browser (localStorage) and falls back
        /// to this value on first load.</summary>
        public string Language { get; set; } = "en";

        // ---- Welcome message ---------------------------------------------
        public bool WelcomeMessageEnabled { get; set; } = false;
        public string WelcomeMessageHeader { get; set; } = "Welcome!";
        public string WelcomeMessageText { get; set; } = "Welcome to our media server - enjoy your stay!";
        public int WelcomeMessageTimeoutMs { get; set; } = 0;

        // ---- Timer / countdown defaults -----------------------------------
        /// <summary>Comma separated list of default minute presets, e.g. "60,30,15,5,1".
        /// Edited from the dashboard; stored here so the admin's preferred presets persist
        /// across page reloads.</summary>
        public string TimerPresetMinutesCsv { get; set; } = "60,30,15,5,1";

        // ---- Media news / "what's new" -------------------------------------
        public string MediaNewsHeader { get; set; } = "What's New";
        public int MediaNewsLookbackDays { get; set; } = 7;
        /// <summary>Comma separated list of library (virtual folder) ids to include.
        /// Empty = nothing selected = nothing sent (see MediaNewsService.ResolveLibraryPaths).</summary>
        public string MediaNewsLibraryIdsCsv { get; set; } = "";
        public string MediaNewsRecipientMode { get; set; } = "All"; // Active | All | Specific
        public string MediaNewsSpecificUserIdsCsv { get; set; } = "";
        public bool MediaNewsSkipWhenEmpty { get; set; } = true;
        /// <summary>LEGACY: "NewSeries" or "NewEpisodes" - series entries used to be
        /// a single either/or choice. Superseded by the two independent
        /// MediaNewsIncludeNewSeries/MediaNewsIncludeNewEpisodes flags below, which let both be
        /// selected together. Kept only so Plugin's one-time startup migration can read an
        /// admin's pre-split choice out of an already-saved config file; nothing else reads or
        /// writes this property anymore - do not use it in new code.
        ///
        /// Default is deliberately null/empty (NOT "NewSeries"): XmlSerializer omits a null
        /// reference-type property from the saved XML entirely, so once Plugin's one-time
        /// migration sets this to null and saves, the element is simply absent from then on and
        /// a fresh load leaves it at this same null initializer - if this defaulted to
        /// "NewSeries" instead, every reload would reconstruct that non-empty value from the
        /// initializer (since XmlSerializer only overwrites properties that ARE present in the
        /// XML), making the migration re-run and re-save on every single plugin load forever
        /// instead of truly once.</summary>
        public string MediaNewsSeriesMode { get; set; } = null;
        /// <summary>Include a "Newly added series" section (name + year only, same as before
        /// the series/episodes split). Independent of MediaNewsIncludeNewEpisodes - both can be true at once, in
        /// which case the message gets both a "New TV Shows:" and a "New Episodes:" section.</summary>
        public bool MediaNewsIncludeNewSeries { get; set; } = true;
        /// <summary>Include a "New episodes" section, one line per newly added episode formatted
        /// per MediaNewsEpisodeTemplate. Independent of MediaNewsIncludeNewSeries.</summary>
        public bool MediaNewsIncludeNewEpisodes { get; set; } = false;
        /// <summary>Per-episode line format used when MediaNewsIncludeNewEpisodes is true.
        /// Supports the placeholders "{Series name (year)}" (series name + year, e.g.
        /// "Futurama (1999)"), "{SxxExx}" (zero-padded season/episode, e.g. "S11E02"), and
        /// "{Episode title}" (the episode's own title) - admin can arrange/omit them freely.
        /// These English tokens superseded an older set of German-language tokens;
        /// MediaNewsService.FormatEpisodeLine still also replaces the old German tokens
        /// ("{Serienname (Jahr)}"/"{Episodentitel}") so a template saved under the old tokens
        /// keeps working unchanged.</summary>
        public string MediaNewsEpisodeTemplate { get; set; } = "{Series name (year)} - {SxxExx} - {Episode title}";

        public bool MediaNewsAutoSendEnabled { get; set; } = false;
        /// <summary>Day/Hour/Minute below are all UTC (MediaNewsAutoScheduler's polling loop runs
        /// entirely on DateTime.UtcNow) - NOT the admin's local wall-clock time. The dashboard's
        /// "Weekday"/"Time" fields show/accept the admin's local time and convert to/from UTC in
        /// config.js (localDayTimeToUtc/utcDayTimeToLocal) before saving/after loading; nothing
        /// server-side ever needs to know the admin's timezone. Because that conversion uses a
        /// fixed UTC offset captured at save time, the actual local send time can drift by an
        /// hour across a DST transition until the admin re-saves - a deliberate, documented
        /// trade-off given this plugin has no reliable way to resolve an IANA timezone id on
        /// every Emby Server host/OS it might run on.</summary>
        public DayOfWeek MediaNewsAutoSendDay { get; set; } = DayOfWeek.Friday;
        public int MediaNewsAutoSendHour { get; set; } = 18;
        public int MediaNewsAutoSendMinute { get; set; } = 0;
        /// <summary>UTC timestamp of the last automatic media-news send, used to avoid
        /// double-sending the same weekly slot after a server restart.</summary>
        public DateTime? MediaNewsLastAutoSentUtc { get; set; }

        // ---- Offline delivery -----------------------------------------------
        public bool OfflineDeliveryEnabled { get; set; } = true;
        /// <summary>"Geplante Reinigung" Feld 1: offline messages older than this (counted from
        /// OfflineMessageRecord.QueuedAtUtc) are marked DeliveryStatus.Expired and removed from
        /// the queue automatically, so it doesn't grow forever for users who never log back in.
        /// Existing installs keep whatever value was already saved (this default only applies to
        /// a brand-new config file) - see ScheduledMessageBackgroundService.ProcessCleanupAsync.</summary>
        public int OfflineMessageMaxAgeDays { get; set; } = 7;

        // ---- History ----------------------------------------------------------
        public int HistoryMaxEntries { get; set; } = 300;
        /// <summary>"Geplante Reinigung" Feld 2: history entries older than this (counted from
        /// HistoryEntry.CreatedAtUtc) are deleted automatically, for the message types selected
        /// via the HistoryCleanupInclude* flags below. The dashboard enforces this to always be
        /// >= OfflineMessageMaxAgeDays (so a history entry is never deleted while its offline
        /// delivery task is still pending); ProcessCleanupAsync also clamps defensively in case
        /// that's ever bypassed.</summary>
        public int HistoryMaxAgeDays { get; set; } = 14;
        public bool HistoryCleanupIncludeInstant { get; set; } = true;
        public bool HistoryCleanupIncludeScheduled { get; set; } = true;
        public bool HistoryCleanupIncludeTimer { get; set; } = true;
        public bool HistoryCleanupIncludeMediaNews { get; set; } = true;
        public bool HistoryCleanupIncludeWelcome { get; set; } = true;
        public bool HistoryCleanupIncludeOffline { get; set; } = true;

        // ---- Dashboard tile homepage ------------------------------------------
        /// <summary>Comma separated list of tile keys ("updates,instant,scheduled,timer,
        /// medianews,welcome,history,cleanup") in the admin's preferred display order, set via
        /// drag &amp; drop on the dashboard's tile homepage. Empty = use the built-in default
        /// order. On load, config.js drops any unknown keys and appends any missing known keys
        /// at the end, so a future plugin update that adds a new tile still shows up for
        /// existing installs without needing a fresh default.</summary>
        public string TileOrderCsv { get; set; } = "";
    }
}
