define(['baseView'], function (BaseView) {
    'use strict';

    // GUID must match EmbyCast.Plugin.Plugin.Id in Plugin.cs.
    var PLUGIN_ID = '0245cf9a-831e-41cf-b49c-1d5c5705f572';
    var LANG_STORAGE_KEY = 'embyCastLang';

    // =====================================================================
    // Translations - every visible string in app.html has a matching
    // data-i18n (or data-i18n-placeholder) key here, plus a handful of
    // dynamically generated strings (status/confirm/tooltip messages) used
    // directly from the JS below via t(key).
    // =====================================================================
    var TRANSLATIONS = {
        en: {
            pageTitle: 'EmbyCast',
            pageSubtitle: 'Send messages to your users, right from the dashboard.',

            updatesTitle: 'Plugin Updates',
            updatesDesc: 'Check GitHub for a newer version of this plugin and install it with one click.',
            updatesGithubLink: 'Project page:',
            updatesInstalledVersion: 'Installed version: v{0}',
            instantTitle: 'Instant Message',
            scheduledTitle: 'Scheduled Message',
            scheduledDesc: 'Queue a message to be sent automatically at a future date and time.',
            timerTitle: 'Timer & Server Countdown',
            timerDesc: 'Announce a countdown (e.g. before a restart) with reminders sent at chosen minute marks. The session list is re-checked before every reminder, so users who log in mid-countdown still get the remaining reminders. Users who are not online don\'t get them later - countdown messages are never kept.',
            mediaNewsTitle: 'Media News',
            mediaNewsDesc: 'Announce recently added movies and TV shows.',
            welcomeTitle: 'Welcome Message',
            welcomeDesc: 'Automatically sent the first time a user ever logs in.',
            groupsTitle: 'User Groups',
            groupsDesc: 'Combine several users into a named group to quickly select them together as message recipients.',
            historyTitle: 'Status & History',
            settingsTitle: 'Settings',
            systemTitle: 'System Message',
            systemDesc: 'Show Emby server events - e.g. logins, failed logins, new media, failed scheduled tasks or plugin updates - as a dialog or short pop-up on the active Emby sessions of the selected administrators.',
            btnNewSystemMessage: 'New System Message',
            systemFormNew: 'New System Message',
            systemFormEdit: 'Edit System Message',
            labelSystemName: 'Name',
            labelSystemEnabled: 'Active',
            labelSystemAdmins: 'Administrators',
            labelSystemEvents: 'Events',
            labelSystemUsers: 'Limit user events to',
            noteSystemUsers: 'Applies to events caused by a user (playback, logins, favourites, ...). Events without a user - backups, scheduled tasks, plugins - are always shown.',
            systemUsersMeta: 'only: {0}',
            systemUsersNone: 'only: nobody left - user events are not shown',
            msgSystemNeedUser: 'Please select at least one user or group, or choose "All users".',
            btnSystemSave: 'Save',
            btnSystemCancel: 'Cancel',
            btnSystemTest: 'Test',
            btnSystemEdit: 'Edit',
            btnSystemDelete: 'Delete',
            systemListEmpty: 'No System Message set up yet.',
            systemListError: 'The System Messages could not be loaded.',
            systemEventsError: 'The list of Emby events could not be loaded.',
            systemEvents: '{0} event(s)',
            systemDisabled: 'off',
            systemNoAdmins: 'No administrator found.',
            msgSystemSaved: 'System Message saved.',
            msgSystemDeleted: 'System Message deleted.',
            msgConfirmDeleteSystem: 'Delete the System Message "{0}"?',
            msgSystemTestSent: 'Test sent to {0} administrator(s).',
            msgSystemTestNobody: 'Test not shown - none of the selected administrators has an active Emby session right now.',
            msgSystemNeedName: 'Please enter a name.',
            msgSystemNeedEvent: 'Please select at least one event.',
            msgSystemNeedAdmin: 'Please select at least one administrator.',
            systemNote: 'Only administrators can receive System Messages, and only on sessions that are active at that moment - nothing is kept for later. Administrators are not told about their own actions (e.g. their own playback or login), except failed logins and lock-outs of their account. The texts come from Emby itself. Note: "Scheduled Task Completed" fires for every task Emby runs, including several right after each server start. Delivered messages appear in Status & History as "System Message".',
            settingsDesc: 'General options for EmbyCast.',
            labelTileColors: 'Tile colours',
            tileSchemeDefault: 'Colourful (default)',
            tileSchemeAccent: 'Emby accent colour',
            tileSchemeNeutral: 'Neutral grey',
            tileSchemePastel: 'Pastel',
            btnTileColorsReset: 'Reset all tile colours',
            tileColorReset: 'Back to the scheme colour',
            noteTileColors: 'Pick a scheme, then change single tiles if you like - a changed tile keeps its colour when you switch the scheme. "Emby accent colour" follows Emby\'s accent setting. Saved with "Save Settings" and used for all administrators. Drag a tile to change the order - like on the homepage, the order is saved right away.',
            labelPreReleases: 'Offer beta versions',
            notePreReleases: 'The update check in "Plugin Updates" also offers pre-releases (betas) from GitHub. Betas may contain bugs - only switch this on if you want to test new versions early. A newer stable version is always offered, even with this switched off. Takes effect after saving.',
            updatesBetaOn: 'Beta versions are offered (see Settings).',
            msgUpdateAvailableBeta: 'Beta update available: v{0} (current: v{1})',
            msgConfirmInstallBeta: 'v{0} is a beta version (pre-release) and may contain bugs. Install it anyway?',
            labelLogLevel: 'Logging (Emby server log)',
            logLevelNothing: 'Nothing',
            logLevelErrorsOnly: 'Errors only',
            logLevelErrorsAndWarnings: 'Errors and warnings (default)',
            logLevelVerbose: 'Verbose - everything',
            noteLogLevel: 'How much EmbyCast writes to the Emby server log. "Verbose" additionally logs every message sent, Media News queries including library folder paths, and the cleanup of deleted users - meant for troubleshooting. Takes effect immediately after saving. Requests that Emby itself rejects are still logged by Emby, regardless of this setting.',
            labelOfflineDelivery: 'Offline delivery',
            noteOfflineDelivery: 'Keep messages for users who are not online (recipients "All users" or "Selected users & groups") and deliver them at their next login. Kept messages are deleted after the number of days set in the "Scheduled Cleanup" tile (default: 7) and then recorded as "Expired". When switched off, such messages are recorded as "Failed" in Status & History. "Active users", Timer & Server Countdown and System Message never keep messages for later.',
            btnSaveSettings: 'Save Settings',
            msgSettingsSaved: 'Settings saved.',
            historyDesc: 'Every message this plugin has sent, with per-user delivery status. Green = delivered, yellow = pending (offline, will be delivered at next login), red = failed, grey = expired (not delivered in time).',

            labelHeader: 'Header',
            labelMessage: 'Message',
            labelMessageTemplate: 'Message (use {minutes} as a placeholder)',
            labelDisplay: 'Display',
            displayDialog: 'Dialog',
            displayDialogDesc: 'Stays visible until the user presses "Got it". Title and line breaks are shown.',
            displayToast: 'Short pop-up',
            displayToastDesc: 'Disappears by itself after about 3 seconds. Text only - no title, all on one line.',
            noteToast: 'Line breaks are shown as " · ". Keep it short - on most Emby apps it is visible for about 3 seconds.',
            labelUserPreview: 'Preview for users',
            previewGotIt: 'Got it',
            labelRecipients: 'Recipients',
            labelDateTime: 'Date & time',
            labelTotalMinutes: 'Total countdown (minutes)',
            labelScheduleTimer: 'Start later (pick a date & time)',
            labelPresets: 'Reminder minute marks',
            labelPreview: 'Preview',
            labelPostAction: 'Action after countdown ends',
            labelLookbackDays: 'Look back (days)',
            labelLibraries: 'Libraries',
            librariesNote: 'Libraries with a content type such as audiobooks, books or music cannot be used for Media News and are not listed here.',
            labelSeriesMode: 'Series entries',
            labelEpisodeTemplate: 'Episode format',
            labelAutoSend: 'Send automatically every 7 days',
            labelWeekday: 'Weekday',
            labelTime: 'Time',
            labelEnableWelcome: 'Enable welcome message',
            noteWelcomeFirstActivation: 'Existing users also receive the message the first time this is activated - after that, only new users get it automatically. Editing the text or turning it off and back on only affects newly created users.',
            btnMarkExistingUsers: 'Mark existing users as already welcomed',
            noteMarkExistingUsers: 'Skips every user who already exists right now, so only users created from this point on receive the welcome message. Safe to click any time, including more than once - already-marked users are simply skipped again.',
            btnUnmarkExistingUsers: 'Reset welcomed users',
            noteUnmarkExistingUsers: 'Clears the welcomed-users list and turns off "Enable welcome message", so nothing is sent out immediately. Every current user will then receive the welcome message again once you turn it back on, the next time each of them logs in.',

            placeholderMessage: 'Type your message here...',

            recipientActive: 'Active users',
            recipientAll: 'All users',
            recipientSpecific: 'Selected users & groups',

            seriesModeNewSeries: 'Newly added series',
            seriesModeNewEpisodes: 'New episodes',
            episodeTemplateNote: 'Click a placeholder to insert it at the cursor position.',

            btnSendNow: 'Send Now',
            btnSchedule: 'Schedule Message',
            btnSaveScheduleChanges: 'Save Changes',
            btnEditScheduled: 'Edit',
            btnStartTimer: 'Start Timer',
            btnScheduleTimer: 'Schedule Timer',
            btnCancelTimer: 'Cancel Timer',
            btnPreviewMediaNews: 'Show preview',
            btnHidePreview: 'Hide preview',
            btnClosePreview: 'Close preview',
            btnSendMediaNewsNow: 'Send Media News Now',
            btnSaveAutoSettings: 'Save Auto-send Settings',
            btnCheckUpdate: 'Check for Updates',
            btnInstallUpdate: '⇩ Install Update',
            btnShowReleaseNotes: 'Release notes v{0}',
            btnHideReleaseNotes: 'Hide release notes',

            refreshUsers: '↻ Refresh user list',
            manageGroupsLink: '✎ Manage groups',
            refreshHistory: '↻ Refresh',
            clearAllHistory: '✕ Discard all',
            linkCancelEdit: '✕ Cancel edit',
            presetUnit: 'min',

            // Suggested/default text that ships in the form fields (not just static labels).
            // When the language is switched, any field still holding the *other* language's
            // default gets swapped to this language's default too - see swapDefaultFieldTexts()
            // below. Fields the admin has actually typed something custom into are left alone.
            defaultInstantHeader: 'Announcement',
            defaultScheduledHeader: 'Announcement',
            defaultTimerHeader: 'Server Countdown',
            defaultTimerText: 'The server will restart in {minutes} minute(s).',
            defaultTimerTextShutdown: 'The server will shut down in {minutes} minute(s).',
            defaultTimerTextNone: 'Countdown: {minutes} minute(s) remaining',
            defaultWelcomeHeader: 'Welcome!',
            defaultWelcomeText: 'Welcome to our media server - enjoy your stay!',
            defaultMediaNewsHeader: "What's New",

            scheduledUpcoming: 'Upcoming scheduled messages',
            presetsNote: 'Click a preset to toggle it, or type a custom comma-separated list above.',
            postActionNote: 'Server actions depend on your Emby Server build and are marked experimental - see the plugin README.',

            postActionNone: 'None (message only)',
            postActionRestart: 'Restart server (experimental)',
            postActionShutdown: 'Shut down server (experimental)',

            dayMonday: 'Monday', dayTuesday: 'Tuesday', dayWednesday: 'Wednesday', dayThursday: 'Thursday',
            dayFriday: 'Friday', daySaturday: 'Saturday', daySunday: 'Sunday',

            nextRunUnknown: 'Next scheduled send: unknown',
            nextRunLabel: 'Next scheduled send: {0}',
            lastSentLabel: 'Last sent: {0}',
            lastSentNever: 'Last sent: never',
            autoCardRecipient: 'sent to {0}',
            autoCardPeriod: 'period: last {0} day(s)',
            autoCardWebOnly: 'web-browser sessions only',

            msgSending: 'Sending…',
            msgPleaseEnterMessage: 'Please enter a message before sending.',
            msgPleaseSelectUsers: 'Please select at least one user.',
            msgPleaseSelectLibrary: 'Please select at least one library first.',
            msgPleaseSelectLibraryForAuto: 'Please select at least one library before enabling automatic sending.',
            msgPleaseSelectSeriesEntries: 'The selected library only contains TV shows, but neither "Newly added series" nor "New episodes" is checked - nothing would ever be sent. Please check at least one of them, or also select a movie library.',
            msgPleaseSetDateTime: 'Please choose a date and time in the future.',
            msgSent: 'Sent - {0} delivered, {1} pending, {2} failed.',
            msgScheduleCreated: 'Message scheduled.',
            msgScheduleUpdated: 'Message updated.',
            msgScheduleNotFound: 'This message no longer exists (it may have already been sent or cancelled in another tab).',
            msgScheduleCancelled: 'Scheduled message cancelled.',
            msgConfirmCancelSchedule: 'Cancel this scheduled message?',
            msgTimerStarted: 'Timer started.',
            msgTimerScheduled: 'Timer scheduled.',
            msgTimerCancelled: 'Timer cancelled.',
            msgTimerNoneActive: 'No active timer.',
            msgTimerInvalidTotal: 'Total countdown minutes must be greater than 0.',
            msgTimerAlreadyExists: 'A timer is already running or scheduled - cancel it first.',
            timerUpcomingTitle: 'Upcoming Timer & Server Countdown',
            timerStartsAt: 'Starts at {0}',
            openOrderTimerScheduled: 'Countdown scheduled',
            msgMediaNewsSending: 'Building and sending media news…',
            msgMediaNewsPreviewing: 'Building preview…',
            msgMediaNewsPreviewEmpty: 'No new media in the selected period - nothing would be sent.',
            msgAutoSettingsSaved: 'Auto-send settings saved.',
            msgConfirmCancelAutoSend: 'Turn off the automatic weekly send?',
            msgAutoSendCancelled: 'Automatic sending turned off.',
            msgConfirmSaveAutoConfig: 'Save these automatic Media News settings?\n\n{0}',
            msgPleaseCheckAutoSend: 'Please check "Send automatically every 7 days" before automatic sending can be enabled.',
            valueNoneSelected: 'none',
            msgWelcomeSaved: 'Welcome message settings saved.',
            msgWelcomeDisabled: 'Welcome message turned off.',
            msgUpdateChecking: 'Checking…',
            msgUpdateAvailable: 'Update available: v{0} (current: v{1})',
            msgUpdateNoChecksum: 'Update available: v{0} (current: v{1}), but this release has no published checksum file - install the DLL manually instead.',
            msgUpToDate: 'Up to date (v{0})',
            msgUpdateInstalling: 'Downloading and installing…',
            msgLoadFailed: 'Failed to load data.',
            msgNoActiveSessions: 'No active sessions right now.',
            msgNoUsers: 'No users found.',
            msgNoScheduled: 'No scheduled messages.',
            msgNoHistory: 'No messages sent yet.',
            msgDismiss: 'Dismiss',
            msgConfirmDismissPending: 'This message still has pending deliveries to offline users. Dismissing it will also cancel those pending deliveries - they will no longer be delivered. Continue?',
            msgHistoryDismissed: 'Entry dismissed.',
            msgHistoryCleared: 'History cleared.',
            msgOfflineCancelled: 'Also cancelled {0} pending offline deliverie(s).',
            msgCancel: 'Cancel',
            msgConfirmClearHistory: 'Discard the entire history? This cannot be undone.',
            msgNoDeliveries: 'No deliveries yet',
            msgPendingOffline: 'offline / pending',
            statusDelivered: 'Delivered',
            statusPending: 'Pending (offline)',
            statusFailed: 'Failed',
            statusExpired: 'Expired',
            nowPlayingPrefix: 'Now playing: ',
            errorPrefix: 'Error: ',

            typeInstant: 'Instant',
            typeScheduled: 'Scheduled',
            typeTimer: 'Timer',
            typeMediaNews: 'Media News',
            typeWelcome: 'Welcome',
            typeOffline: 'Offline',
            typeSystem: 'System Message',
            msgNoSupportedLibraries: 'No libraries with a usable content type (movies/tvshows) found.',

            labelWebOnly: 'Send only to web-browser sessions',
            webOnlyNote: 'Useful for long Media News lists, which often don\'t fit well on phone or TV apps. Users without an active web-browser session don\'t get it right away: the message is kept and delivered automatically the next time they log in via a web browser (only if "Offline delivery" is switched on in Settings). Kept messages are deleted after the number of days set in the "Scheduled Cleanup" tile (default: 7) – users who haven\'t logged in via a web browser by then won\'t get it.',

            cleanupTitle: 'Scheduled Cleanup',
            cleanupDesc: 'Automatically cleans up undelivered messages and old history entries. Undelivered (offline) messages only exist when "Offline delivery" is switched on in Settings.',
            cleanupStorageFile: 'Stored file: {0}',
            cleanupStorageHistory: 'History: {0} entrie(s) (~{1})',
            cleanupStorageOffline: 'Offline queue: {0} entrie(s) (~{1})',
            cleanupOfflinePrefix: 'Offline messages are marked "Expired" and removed from the queue after',
            cleanupOfflineSuffix: 'day(s).',
            cleanupHistoryPrefix: 'All selected history entries below are deleted after',
            cleanupHistorySuffix: 'day(s). Scheduled Messages and the Media News automation (weekly job) are not affected by this.',
            cleanupMaxEntriesPrefix: 'The history list is additionally capped at',
            cleanupMaxEntriesSuffix: 'entrie(s) - the oldest are removed automatically as soon as a new one is added, regardless of the schedule above.',
            cleanupTypesTitle: 'Affected message types:',
            btnPurgeOffline: 'Delete all undelivered messages',
            btnPurgeHistory: 'Delete history now',
            btnSaveCleanup: 'Save Settings',
            msgCleanupSaved: 'Cleanup settings saved.',
            msgHistoryDaysTooLow: 'The history retention period cannot be shorter than the offline retention period ({0} day(s)).',
            msgMaxEntriesOutOfRange: 'The maximum number of history entries must be between {0} and {1}.',
            msgConfirmPurgeOffline: 'Delete all {0} currently undelivered message(s) right now? This cannot be undone.',
            msgConfirmPurgeHistory: 'Delete all history entries matching the checked message types right now? This cannot be undone.',
            msgPurgedOffline: '{0} undelivered message(s) deleted.',
            msgPurgedHistory: '{0} history entrie(s) deleted.',
            msgNothingToPurge: 'Nothing to delete.',
            labelEnableCleanup: 'Automatic cleanup active',
            noteCleanupToggleIndependent: 'This switch turns the automatic daily cleanup on/off immediately by itself, separately from "Save Settings" (which only stores the fields above). The two "Delete now" buttons above always work regardless of this switch.',
            msgCleanupEnabled: 'Automatic cleanup turned on.',
            msgCleanupDisabled: 'Automatic cleanup turned off.',

            historyShowMore: 'Show more ▾',
            historyShowLess: 'Show less ▴',

            recipientToLabel: 'To:',
            recipientUnknownUser: 'Unknown user',
            recipientMoreLink: '+{0} more',
            recipientShowLess: 'show less',

            backToOverview: 'Overview',
            backToSection: 'Back to {0}',
            openOrdersTitle: 'Open items',
            openOrdersNone: 'Nothing pending right now.',
            openOrderTimerActive: 'Countdown active',
            openOrderEndsIn: 'ends in {0}',
            tileArrow: '→ {0}',
            msgTileOrderSaved: 'Tile order saved.',

            labelGroupName: 'Group name',
            labelGroupMembers: 'Members',
            btnNewGroup: '+ New Group',
            btnEditGroup: 'Edit',
            btnDeleteGroup: 'Delete',
            btnSaveGroup: 'Save',
            userlistGroupsSubtitle: 'Groups',
            userlistUsersSubtitle: 'Individual users',
            groupMemberCountChip: '{0} user(s)',
            groupMembersLine: '{0} member(s): {1}',
            groupDeletedMembers: '{0} deleted user(s) - removed automatically at the next server start',
            noteUserDeleted: 'user no longer exists in Emby',
            msgGroupEmpty: 'No members yet.',
            msgNoGroups: 'No groups yet.',
            msgGroupNameRequired: 'Please enter a group name.',
            msgGroupSaved: 'Group saved.',
            msgGroupNotFound: 'This group no longer exists (it may have just been deleted in another tab).',
            msgGroupDeleted: 'Group deleted.',
            msgConfirmDeleteGroup: 'Delete group "{0}"? Any Scheduled Message or Timer that still references it will simply no longer include it - nothing else is affected.',
            groupFormNewTitle: 'New group',
            groupFormEditTitle: 'Edit group: {0}',
            recipientUnknownGroup: 'Unknown group',
            msgExistingUsersMarked: '{0} existing user(s) marked - only users created from now on will receive the welcome message.',
            noteMarkExistingUsersLastRun: 'Last run on {0} - {1} existing user(s) marked.',
            msgConfirmUnmarkExisting: 'Reset the welcomed-users list and turn off "Enable welcome message"? Every current user will receive the welcome message again once you turn it back on - not immediately, but the next time each of them logs in.',
            msgExistingUsersUnmarked: '{0} user(s) reset - they will receive the welcome message again once you turn "Enable welcome message" back on.',
            noteUnmarkExistingUsersLastRun: 'Last run on {0} - {1} user(s) restored.',

            mediaNewsStructureMovies: 'New Movies:',
            mediaNewsStructureSeries: 'New TV Shows:',
            mediaNewsStructureEpisodes: 'New Episodes:',
            mediaNewsStructureMoviesLine: '- shows Movies added in the last {0} days',
            mediaNewsStructureSeriesLine: '- shows TV Shows added in the last {0} days',
            mediaNewsStructureEpisodesLine: '- shows new Episodes added in the last {0} days',
            mediaNewsStructureNoLibrary: 'No library selected - nothing would be sent.'
        },
        de: {
            pageTitle: 'EmbyCast',
            pageSubtitle: 'Nachrichten direkt aus dem Dashboard an eure User senden.',

            updatesTitle: 'Plugin-Updates',
            updatesDesc: 'Prüft auf GitHub, ob eine neuere Version dieses Plugins verfügbar ist, und installiert sie mit einem Klick.',
            updatesGithubLink: 'Projektseite:',
            updatesInstalledVersion: 'Installierte Version: v{0}',
            instantTitle: 'Sofortnachricht',
            scheduledTitle: 'Terminierte Nachricht',
            scheduledDesc: 'Plant eine Nachricht, die automatisch zu einem bestimmten Zeitpunkt gesendet wird.',
            timerTitle: 'Timer & Server-Countdown',
            timerDesc: 'Kündigt einen Countdown an (z. B. vor einem Neustart) mit Erinnerungen zu ausgewählten Minutenmarken. Die Session-Liste wird vor jeder Erinnerung neu geprüft, damit User, die während des Countdowns dazukommen, die restlichen Erinnerungen ebenfalls erhalten. User, die nicht online sind, erhalten sie nicht später – Countdown-Nachrichten werden nie aufbewahrt.',
            mediaNewsTitle: 'Medien-Neuheiten',
            mediaNewsDesc: 'Kündigt kürzlich hinzugefügte Filme und Serien an.',
            welcomeTitle: 'Willkommensnachricht',
            welcomeDesc: 'Wird automatisch beim allerersten Login eines Users gesendet.',
            groupsTitle: 'User-Gruppen',
            groupsDesc: 'Mehrere User zu einer benannten Gruppe zusammenfassen, um sie beim Versenden gemeinsam auszuwählen.',
            historyTitle: 'Status & Historie',
            settingsTitle: 'Einstellungen',
            systemTitle: 'System Message',
            systemDesc: 'Emby-Server-Ereignisse – z. B. Anmeldungen, fehlgeschlagene Anmeldungen, neue Medien, fehlgeschlagene geplante Aufgaben oder Plugin-Updates – als Dialog oder kurze Einblendung auf den aktiven Emby-Sitzungen der ausgewählten Administratoren anzeigen.',
            btnNewSystemMessage: 'Neue System Message',
            systemFormNew: 'Neue System Message',
            systemFormEdit: 'System Message bearbeiten',
            labelSystemName: 'Name',
            labelSystemEnabled: 'Aktiv',
            labelSystemAdmins: 'Administratoren',
            labelSystemEvents: 'Ereignisse',
            labelSystemUsers: 'User-Ereignisse beschränken auf',
            noteSystemUsers: 'Gilt für Ereignisse, die ein User auslöst (Wiedergabe, Anmeldungen, Favoriten, ...). Ereignisse ohne User – Backups, geplante Aufgaben, Plugins – werden immer angezeigt.',
            systemUsersMeta: 'nur: {0}',
            systemUsersNone: 'nur: niemand mehr – User-Ereignisse werden nicht angezeigt',
            msgSystemNeedUser: 'Bitte mindestens einen User oder eine Gruppe auswählen oder „Alle User“ wählen.',
            btnSystemSave: 'Speichern',
            btnSystemCancel: 'Abbrechen',
            btnSystemTest: 'Testen',
            btnSystemEdit: 'Bearbeiten',
            btnSystemDelete: 'Löschen',
            systemListEmpty: 'Noch keine System Message eingerichtet.',
            systemListError: 'Die System Messages konnten nicht geladen werden.',
            systemEventsError: 'Die Liste der Emby-Ereignisse konnte nicht geladen werden.',
            systemEvents: '{0} Ereignis(se)',
            systemDisabled: 'aus',
            systemNoAdmins: 'Kein Administrator gefunden.',
            msgSystemSaved: 'System Message gespeichert.',
            msgSystemDeleted: 'System Message gelöscht.',
            msgConfirmDeleteSystem: 'System Message „{0}“ löschen?',
            msgSystemTestSent: 'Test an {0} Administrator(en) gesendet.',
            msgSystemTestNobody: 'Test nicht angezeigt – keiner der ausgewählten Administratoren hat gerade eine aktive Emby-Sitzung.',
            msgSystemNeedName: 'Bitte einen Namen eingeben.',
            msgSystemNeedEvent: 'Bitte mindestens ein Ereignis auswählen.',
            msgSystemNeedAdmin: 'Bitte mindestens einen Administrator auswählen.',
            systemNote: 'Nur Administratoren können System Messages erhalten, und nur auf Sitzungen, die in dem Moment aktiv sind – nichts wird für später aufbewahrt. Über eigene Aktionen (z. B. eigene Wiedergabe oder Anmeldung) wird ein Administrator nicht informiert – ausser bei fehlgeschlagenen Anmeldungen und Sperrungen seines Kontos. Die Texte kommen von Emby selbst. Hinweis: „Scheduled Task Completed“ meldet jede Aufgabe, die Emby ausführt, auch mehrere direkt nach jedem Server-Start. Zugestellte Nachrichten erscheinen in „Status & Historie“ als „System Message“.',
            settingsDesc: 'Allgemeine Optionen für EmbyCast.',
            labelTileColors: 'Kachelfarben',
            tileSchemeDefault: 'Bunt (Standard)',
            tileSchemeAccent: 'Emby-Akzentfarbe',
            tileSchemeNeutral: 'Neutral grau',
            tileSchemePastel: 'Pastell',
            btnTileColorsReset: 'Alle Kachelfarben zurücksetzen',
            tileColorReset: 'Zurück zur Schema-Farbe',
            noteTileColors: 'Wähle ein Schema und ändere bei Bedarf einzelne Kacheln – eine geänderte Kachel behält ihre Farbe auch beim Wechsel des Schemas. „Emby-Akzentfarbe“ folgt Embys Akzentfarben-Einstellung. Wird mit „Einstellungen speichern“ gespeichert und gilt für alle Administratoren. Kacheln ziehen ändert die Reihenfolge – wie auf der Startseite wird sie sofort gespeichert.',
            labelPreReleases: 'Beta-Versionen anbieten',
            notePreReleases: 'Der Update-Check in „Plugin Updates“ bietet auch Pre-Releases (Betas) von GitHub an. Betas können Fehler enthalten – nur einschalten, wenn du neue Versionen früh testen willst. Eine neuere stabile Version wird immer angeboten, auch wenn dies ausgeschaltet ist. Wirkt nach dem Speichern.',
            updatesBetaOn: 'Beta-Versionen werden angeboten (siehe Einstellungen).',
            msgUpdateAvailableBeta: 'Beta-Update verfügbar: v{0} (aktuell: v{1})',
            msgConfirmInstallBeta: 'v{0} ist eine Beta-Version (Pre-Release) und kann Fehler enthalten. Trotzdem installieren?',
            labelLogLevel: 'Protokollierung (Emby-Server-Log)',
            logLevelNothing: 'Nichts',
            logLevelErrorsOnly: 'Nur Fehler',
            logLevelErrorsAndWarnings: 'Fehler und Warnungen (Standard)',
            logLevelVerbose: 'Ausführlich – alles',
            noteLogLevel: 'Wie viel EmbyCast ins Emby-Server-Log schreibt. „Ausführlich“ protokolliert zusätzlich jede gesendete Nachricht, Media-News-Abfragen inklusive Bibliothekspfaden und die Bereinigung gelöschter User – gedacht für die Fehlersuche. Wirkt sofort nach dem Speichern. Anfragen, die Emby selbst ablehnt, protokolliert Emby unabhängig von dieser Einstellung.',
            labelOfflineDelivery: 'Offline-Zustellung',
            noteOfflineDelivery: 'Nachrichten für User, die gerade nicht online sind (Empfänger „Alle User“ oder „Ausgewählte User & Gruppen“), aufbewahren und beim nächsten Login zustellen. Aufbewahrte Nachrichten werden nach der in der Kachel „Geplante Reinigung“ eingestellten Anzahl Tage gelöscht (Standard: 7) und dann als „Abgelaufen“ erfasst. Ausgeschaltet werden solche Nachrichten in „Status & Historie“ als „Fehlgeschlagen“ erfasst. „Aktive User“, Timer & Server-Countdown und System Message bewahren nie Nachrichten für später auf.',
            btnSaveSettings: 'Einstellungen speichern',
            msgSettingsSaved: 'Einstellungen gespeichert.',
            historyDesc: 'Alle von diesem Plugin gesendeten Nachrichten mit Zustellstatus pro User. Grün = zugestellt, Gelb = ausstehend (offline, wird beim nächsten Login zugestellt), Rot = fehlgeschlagen, Grau = abgelaufen (nicht rechtzeitig zugestellt).',

            labelHeader: 'Titel',
            labelMessage: 'Nachricht',
            labelMessageTemplate: 'Nachricht (Platzhalter {minutes} verwendbar)',
            labelDisplay: 'Anzeige',
            displayDialog: 'Dialog',
            displayDialogDesc: 'Bleibt sichtbar, bis der User „Verstanden“ drückt. Titel und Zeilenumbrüche werden angezeigt.',
            displayToast: 'Kurze Einblendung',
            displayToastDesc: 'Verschwindet nach etwa 3 Sekunden von selbst. Nur Text – ohne Titel, alles auf einer Zeile.',
            noteToast: 'Zeilenumbrüche werden als „ · “ angezeigt. Kurz halten – bei den meisten Emby-Apps ist die Einblendung nur etwa 3 Sekunden sichtbar.',
            labelUserPreview: 'Vorschau beim User',
            previewGotIt: 'Verstanden',
            labelRecipients: 'Empfänger',
            labelDateTime: 'Datum & Uhrzeit',
            labelTotalMinutes: 'Gesamter Countdown (Minuten)',
            labelScheduleTimer: 'Später starten (Datum & Uhrzeit wählen)',
            labelPresets: 'Erinnerungs-Minutenmarken',
            labelPreview: 'Vorschau',
            labelPostAction: 'Aktion nach Ablauf des Countdowns',
            labelLookbackDays: 'Zeitraum (Tage)',
            labelLibraries: 'Bibliotheken',
            librariesNote: 'Bibliotheken mit einem Inhaltstyp wie audiobooks, books oder music können bei Medien-Neuheiten nicht verwendet werden und werden hier nicht aufgelistet.',
            labelSeriesMode: 'Serien-Einträge',
            labelEpisodeTemplate: 'Episoden-Format',
            labelAutoSend: 'Automatisch alle 7 Tage senden',
            labelWeekday: 'Wochentag',
            labelTime: 'Uhrzeit',
            labelEnableWelcome: 'Willkommensnachricht aktivieren',
            noteWelcomeFirstActivation: 'Bestehende User erhalten die Nachricht beim erstmaligen Aktivieren ebenfalls – danach werden die Nachrichten automatisch nur noch an neue User versendet. Textänderungen und das De- oder Aktivieren haben nach der erstmaligen Aktivierung nur noch Einfluss auf neu erstellte User.',
            btnMarkExistingUsers: 'Bestehende User als bereits begrüsst markieren',
            noteMarkExistingUsers: 'Überspringt alle aktuell bestehenden User, sodass die Willkommensnachricht nur noch an ab jetzt neu erstellte User geht. Kann jederzeit, auch mehrmals, gefahrlos geklickt werden – bereits markierte User werden dabei einfach übersprungen.',
            btnUnmarkExistingUsers: 'Begrüsste User zurücksetzen',
            noteUnmarkExistingUsers: 'Leert die Liste der bereits begrüssten User und schaltet "Willkommensnachricht aktivieren" aus, damit nicht sofort etwas versendet wird. Jeder aktuelle User erhält die Willkommensnachricht dann erneut, sobald ihr sie wieder aktiviert - beim jeweils nächsten Login.',

            placeholderMessage: 'Nachricht hier eingeben...',

            recipientActive: 'Aktive User',
            recipientAll: 'Alle User',
            recipientSpecific: 'Ausgewählte User & Gruppen',

            seriesModeNewSeries: 'Neu hinzugefügte Serien',
            seriesModeNewEpisodes: 'Neue Episoden',
            episodeTemplateNote: 'Platzhalter anklicken, um ihn an der Cursorposition einzufügen.',

            btnSendNow: 'Sofort senden',
            btnSchedule: 'Nachricht terminieren',
            btnSaveScheduleChanges: 'Änderungen speichern',
            btnEditScheduled: 'Bearbeiten',
            btnStartTimer: 'Timer starten',
            btnScheduleTimer: 'Timer terminieren',
            btnCancelTimer: 'Timer abbrechen',
            btnPreviewMediaNews: 'Vorschau anzeigen',
            btnHidePreview: 'Vorschau ausblenden',
            btnClosePreview: 'Vorschau schließen',
            btnSendMediaNewsNow: 'Neuheiten jetzt senden',
            btnSaveAutoSettings: 'Automatik-Einstellungen speichern',
            btnCheckUpdate: 'Nach Updates suchen',
            btnInstallUpdate: '⇩ Update installieren',
            btnShowReleaseNotes: 'Release Notes v{0}',
            btnHideReleaseNotes: 'Release Notes ausblenden',

            refreshUsers: '↻ User-Liste aktualisieren',
            manageGroupsLink: '✎ Gruppen verwalten',
            refreshHistory: '↻ Aktualisieren',
            clearAllHistory: '✕ Alles verwerfen',
            linkCancelEdit: '✕ Bearbeitung abbrechen',
            presetUnit: 'Min.',

            defaultInstantHeader: 'Ankündigung',
            defaultScheduledHeader: 'Ankündigung',
            defaultTimerHeader: 'Server-Countdown',
            defaultTimerText: 'Der Server wird in {minutes} Minute(n) neu gestartet.',
            defaultTimerTextShutdown: 'Der Server wird in {minutes} Minute(n) heruntergefahren.',
            defaultTimerTextNone: 'Countdown: noch {minutes} Minute(n)',
            defaultWelcomeHeader: 'Willkommen!',
            defaultWelcomeText: 'Willkommen auf unserem Medienserver - wir wünschen dir viel Spaß!',
            defaultMediaNewsHeader: 'Neuheiten',

            scheduledUpcoming: 'Anstehende terminierte Nachrichten',
            presetsNote: 'Preset anklicken zum Umschalten, oder oben eine eigene, kommagetrennte Liste eingeben.',
            postActionNote: 'Server-Aktionen hängen von der jeweiligen Emby-Server-Version ab und sind als experimentell gekennzeichnet - siehe README des Plugins.',

            postActionNone: 'Keine (nur Nachricht)',
            postActionRestart: 'Server neu starten (experimentell)',
            postActionShutdown: 'Server herunterfahren (experimentell)',

            dayMonday: 'Montag', dayTuesday: 'Dienstag', dayWednesday: 'Mittwoch', dayThursday: 'Donnerstag',
            dayFriday: 'Freitag', daySaturday: 'Samstag', daySunday: 'Sonntag',

            nextRunUnknown: 'Nächster geplanter Versand: unbekannt',
            nextRunLabel: 'Nächster geplanter Versand: {0}',
            lastSentLabel: 'Zuletzt gesendet: {0}',
            lastSentNever: 'Zuletzt gesendet: nie',
            autoCardRecipient: 'wird an {0} versandt',
            autoCardPeriod: 'Zeitraum letzte {0} Tage',
            autoCardWebOnly: 'nur Web-Browser-Sitzungen',

            msgSending: 'Wird gesendet…',
            msgPleaseEnterMessage: 'Bitte eine Nachricht eingeben, bevor gesendet wird.',
            msgPleaseSelectUsers: 'Bitte mindestens einen User auswählen.',
            msgPleaseSelectLibrary: 'Bitte zuerst mindestens eine Bibliothek auswählen.',
            msgPleaseSelectLibraryForAuto: 'Bitte mindestens eine Bibliothek auswählen, bevor der automatische Versand aktiviert wird.',
            msgPleaseSelectSeriesEntries: 'Die ausgewählte Bibliothek enthält nur Serien, aber weder "Neu hinzugefügte Serien" noch "Neue Episoden" ist angehakt - es würde nie etwas gesendet. Bitte mindestens eine dieser Optionen ankreuzen, oder zusätzlich eine Film-Bibliothek auswählen.',
            msgPleaseSetDateTime: 'Bitte ein Datum und eine Uhrzeit in der Zukunft wählen.',
            msgSent: 'Gesendet - {0} zugestellt, {1} ausstehend, {2} fehlgeschlagen.',
            msgScheduleCreated: 'Nachricht terminiert.',
            msgScheduleUpdated: 'Nachricht aktualisiert.',
            msgScheduleNotFound: 'Diese Nachricht existiert nicht mehr (wurde evtl. bereits versendet oder in einem anderen Tab storniert).',
            msgScheduleCancelled: 'Terminierte Nachricht abgebrochen.',
            msgConfirmCancelSchedule: 'Diese terminierte Nachricht abbrechen?',
            msgTimerStarted: 'Timer gestartet.',
            msgTimerScheduled: 'Timer terminiert.',
            msgTimerCancelled: 'Timer abgebrochen.',
            msgTimerNoneActive: 'Kein aktiver Timer.',
            msgTimerInvalidTotal: 'Der Gesamt-Countdown muss größer als 0 Minuten sein.',
            msgTimerAlreadyExists: 'Es läuft oder ist bereits ein Timer geplant - zuerst abbrechen.',
            timerUpcomingTitle: 'Anstehender Timer & Server-Countdown',
            timerStartsAt: 'Startet um {0}',
            openOrderTimerScheduled: 'Countdown geplant',
            msgMediaNewsSending: 'Neuheiten werden zusammengestellt und gesendet…',
            msgMediaNewsPreviewing: 'Vorschau wird erstellt…',
            msgMediaNewsPreviewEmpty: 'Keine neuen Medien im gewählten Zeitraum - es würde nichts gesendet.',
            msgAutoSettingsSaved: 'Automatik-Einstellungen gespeichert.',
            msgConfirmCancelAutoSend: 'Automatischen Versand ausschalten?',
            msgAutoSendCancelled: 'Automatischer Versand ausgeschaltet.',
            msgConfirmSaveAutoConfig: 'Diese Automatik-Einstellungen für Medien-Neuheiten speichern?\n\n{0}',
            msgPleaseCheckAutoSend: 'Bitte Checkbox auswählen, bevor der automatische Versand aktiviert wird.',
            valueNoneSelected: 'keine',
            msgWelcomeSaved: 'Willkommensnachricht-Einstellungen gespeichert.',
            msgWelcomeDisabled: 'Willkommensnachricht ausgeschaltet.',
            msgUpdateChecking: 'Wird geprüft…',
            msgUpdateAvailable: 'Update verfügbar: v{0} (aktuell: v{1})',
            msgUpdateNoChecksum: 'Update verfügbar: v{0} (aktuell: v{1}), aber für dieses Release wurde keine Prüfsumme veröffentlicht - bitte die DLL manuell installieren.',
            msgUpToDate: 'Aktuell (v{0})',
            msgUpdateInstalling: 'Wird heruntergeladen und installiert…',
            msgLoadFailed: 'Daten konnten nicht geladen werden.',
            msgNoActiveSessions: 'Aktuell keine aktiven Sessions.',
            msgNoUsers: 'Keine User gefunden.',
            msgNoScheduled: 'Keine terminierten Nachrichten.',
            msgNoHistory: 'Bisher keine Nachrichten gesendet.',
            msgDismiss: 'Verwerfen',
            msgConfirmDismissPending: 'Diese Nachricht hat noch ausstehende Zustellungen an offline User. Beim Verwerfen werden diese ausstehenden Zustellungen ebenfalls storniert - sie werden dann nicht mehr zugestellt. Fortfahren?',
            msgHistoryDismissed: 'Eintrag verworfen.',
            msgHistoryCleared: 'Historie verworfen.',
            msgOfflineCancelled: 'Zusätzlich {0} ausstehende Offline-Zustellung(en) storniert.',
            msgCancel: 'Abbrechen',
            msgConfirmClearHistory: 'Die gesamte Historie verwerfen? Dies kann nicht rückgängig gemacht werden.',
            msgNoDeliveries: 'Noch keine Zustellung',
            msgPendingOffline: 'offline / ausstehend',
            statusDelivered: 'Zugestellt',
            statusPending: 'Ausstehend (offline)',
            statusFailed: 'Fehlgeschlagen',
            statusExpired: 'Abgelaufen',
            nowPlayingPrefix: 'Läuft gerade: ',
            errorPrefix: 'Fehler: ',

            typeInstant: 'Sofort',
            typeScheduled: 'Terminiert',
            typeTimer: 'Timer',
            typeMediaNews: 'Neuheiten',
            typeWelcome: 'Willkommen',
            typeOffline: 'Offline',
            typeSystem: 'System Message',
            msgNoSupportedLibraries: 'Keine Bibliotheken mit nutzbarem Inhaltstyp (movies/tvshows) gefunden.',

            labelWebOnly: 'Nur an Web-Browser-Sitzungen senden',
            webOnlyNote: 'Sinnvoll bei langen Media-News-Listen, für die auf Handy- oder TV-Apps oft nicht genug Platz ist. User ohne aktive Web-Browser-Sitzung erhalten die Nachricht nicht sofort: Sie wird aufbewahrt und automatisch zugestellt, sobald sie sich das nächste Mal per Web-Browser anmelden (nur wenn „Offline-Zustellung“ in den Einstellungen eingeschaltet ist). Aufbewahrte Nachrichten werden nach der in der Kachel „Geplante Reinigung“ eingestellten Anzahl Tage gelöscht (Standard: 7) – wer sich bis dahin nicht per Web-Browser angemeldet hat, erhält sie nicht mehr.',

            cleanupTitle: 'Geplante Reinigung',
            cleanupDesc: 'Räumt nicht zugestellte Nachrichten und alte Verlaufseinträge automatisch auf. Nicht zugestellte (Offline-)Nachrichten gibt es nur, wenn „Offline-Zustellung“ in den Einstellungen eingeschaltet ist.',
            cleanupStorageFile: 'Gespeicherte Datei: {0}',
            cleanupStorageHistory: 'History: {0} Eintrag/Einträge (~{1})',
            cleanupStorageOffline: 'Offline-Warteschlange: {0} Eintrag/Einträge (~{1})',
            cleanupOfflinePrefix: 'Offline-Nachrichten werden nach',
            cleanupOfflineSuffix: 'Tag(en) als "Expired" markiert und aus der Warteschlange entfernt.',
            cleanupHistoryPrefix: 'Alle ausgewählten History-Einträge unten werden nach Ablauf von',
            cleanupHistorySuffix: 'Tag(en) gelöscht. Scheduled Messages und Media-News-Automatik (wöchentlicher Auftrag) sind davon nicht betroffen.',
            cleanupMaxEntriesPrefix: 'Die History-Liste wird zusätzlich automatisch auf maximal',
            cleanupMaxEntriesSuffix: 'Einträge begrenzt - die ältesten werden sofort beim Hinzufügen eines neuen Eintrags entfernt, unabhängig vom Zeitplan oben.',
            cleanupTypesTitle: 'Betroffene Nachrichtentypen:',
            btnPurgeOffline: 'Alle nicht zugestellten Nachrichten löschen',
            btnPurgeHistory: 'History sofort löschen',
            btnSaveCleanup: 'Einstellungen speichern',
            msgCleanupSaved: 'Einstellungen für die Reinigung gespeichert.',
            msgHistoryDaysTooLow: 'Die History-Aufbewahrungsdauer darf nicht kürzer sein als die Offline-Aufbewahrungsdauer ({0} Tag(e)).',
            msgMaxEntriesOutOfRange: 'Die maximale Anzahl History-Einträge muss zwischen {0} und {1} liegen.',
            msgConfirmPurgeOffline: 'Alle {0} aktuell nicht zugestellten Nachricht(en) jetzt löschen? Dies kann nicht rückgängig gemacht werden.',
            msgConfirmPurgeHistory: 'Alle History-Einträge löschen, die auf die angehakten Nachrichtentypen zutreffen? Dies kann nicht rückgängig gemacht werden.',
            msgPurgedOffline: '{0} nicht zugestellte Nachricht(en) gelöscht.',
            msgPurgedHistory: '{0} History-Einträge gelöscht.',
            msgNothingToPurge: 'Nichts zu löschen.',
            labelEnableCleanup: 'Automatische Reinigung aktiv',
            noteCleanupToggleIndependent: 'Dieser Schalter schaltet die tägliche automatische Reinigung sofort und für sich alleine ein/aus, unabhängig von "Einstellungen speichern" (das speichert nur die Felder oben). Die beiden "Jetzt löschen"-Buttons oben funktionieren unabhängig von diesem Schalter immer.',
            msgCleanupEnabled: 'Automatische Reinigung eingeschaltet.',
            msgCleanupDisabled: 'Automatische Reinigung ausgeschaltet.',

            historyShowMore: 'Mehr anzeigen ▾',
            historyShowLess: 'Weniger anzeigen ▴',

            recipientToLabel: 'An:',
            recipientUnknownUser: 'Unbekannter User',
            recipientMoreLink: '+{0} weitere',
            recipientShowLess: 'weniger anzeigen',

            backToOverview: 'Übersicht',
            backToSection: 'Zurück zu {0}',
            openOrdersTitle: 'Offene Aufträge',
            openOrdersNone: 'Aktuell nichts Offenes.',
            openOrderTimerActive: 'Countdown aktiv',
            openOrderEndsIn: 'endet in {0}',
            tileArrow: '→ {0}',
            msgTileOrderSaved: 'Kachel-Reihenfolge gespeichert.',

            labelGroupName: 'Gruppenname',
            labelGroupMembers: 'Mitglieder',
            btnNewGroup: '+ Neue Gruppe',
            btnEditGroup: 'Bearbeiten',
            btnDeleteGroup: 'Löschen',
            btnSaveGroup: 'Speichern',
            userlistGroupsSubtitle: 'Gruppen',
            userlistUsersSubtitle: 'Einzelne User',
            groupMemberCountChip: '{0} User',
            groupMembersLine: '{0} Mitglied(er): {1}',
            groupDeletedMembers: '{0} gelöschte(r) User - wird beim nächsten Serverstart automatisch entfernt',
            noteUserDeleted: 'User existiert in Emby nicht mehr',
            msgGroupEmpty: 'Noch keine Mitglieder.',
            msgNoGroups: 'Noch keine Gruppen vorhanden.',
            msgGroupNameRequired: 'Bitte einen Gruppennamen eingeben.',
            msgGroupSaved: 'Gruppe gespeichert.',
            msgGroupNotFound: 'Diese Gruppe existiert nicht mehr (evtl. gerade in einem anderen Tab gelöscht).',
            msgGroupDeleted: 'Gruppe gelöscht.',
            msgConfirmDeleteGroup: 'Gruppe "{0}" löschen? Eine Scheduled Message oder ein Timer, die/der noch darauf verweist, berücksichtigt sie danach einfach nicht mehr - sonst hat das keine Auswirkungen.',
            groupFormNewTitle: 'Neue Gruppe',
            groupFormEditTitle: 'Gruppe bearbeiten: {0}',
            recipientUnknownGroup: 'Unbekannte Gruppe',
            msgExistingUsersMarked: '{0} bestehende(r) User markiert - die Willkommensnachricht geht künftig nur noch an ab jetzt neu erstellte User.',
            noteMarkExistingUsersLastRun: 'Wurde am {0} durchgeführt - {1} bestehende(r) User markiert.',
            msgConfirmUnmarkExisting: 'Liste der begrüssten User zurücksetzen und "Willkommensnachricht aktivieren" ausschalten? Jeder aktuelle User erhält die Willkommensnachricht erneut, sobald ihr sie wieder aktiviert - nicht sofort, sondern beim jeweils nächsten Login.',
            msgExistingUsersUnmarked: '{0} User zurückgesetzt - sie erhalten die Willkommensnachricht erneut, sobald ihr "Willkommensnachricht aktivieren" wieder einschaltet.',
            noteUnmarkExistingUsersLastRun: 'Wurde am {0} durchgeführt - {1} User zurückgesetzt.',

            mediaNewsStructureMovies: 'Neue Filme:',
            mediaNewsStructureSeries: 'Neue Serien:',
            mediaNewsStructureEpisodes: 'Neue Episoden:',
            mediaNewsStructureMoviesLine: '- zeigt Filme, die in den letzten {0} Tagen hinzugefügt wurden',
            mediaNewsStructureSeriesLine: '- zeigt Serien, die in den letzten {0} Tagen hinzugefügt wurden',
            mediaNewsStructureEpisodesLine: '- zeigt neue Episoden, die in den letzten {0} Tagen hinzugefügt wurden',
            mediaNewsStructureNoLibrary: 'Keine Bibliothek ausgewählt - es würde nichts gesendet.'
        }
    };

    var currentLang = 'en';
    function t(key) {
        var dict = TRANSLATIONS[currentLang] || TRANSLATIONS.en;
        return dict[key] || TRANSLATIONS.en[key] || key;
    }
    function fmt(key) {
        var str = t(key);
        for (var i = 1; i < arguments.length; i++) {
            var value = arguments[i];
            // Substitute via a replacer FUNCTION, not a plain string - when the second argument
            // to String.replace() is a string, JS still special-cases "$"-patterns inside it
            // ($&, $`, $', $$, $n). Values here can be admin-entered free text (e.g. a Media News
            // Header or an Emby library name used in buildAutoConfigSummaryText's confirmation
            // dialog), so a literal "$" in that text must never be reinterpreted - a replacer
            // function's return value is inserted verbatim, with no such special-casing.
            str = str.replace('{' + (i - 1) + '}', function () { return value; });
        }
        return str;
    }

    // =====================================================================
    // View
    // =====================================================================
    function View(view, params) {
        BaseView.apply(this, arguments);

        var allUsersCache = [];
        var activeSessionsCache = [];
        var allGroupsCache = [];
        var librariesCache = [];
        var pluginConfig = null;
        var timerPollHandle = null;

        // ---------------- language ----------------

        function loadLangPreference() {
            try {
                var stored = window.localStorage.getItem(LANG_STORAGE_KEY);
                if (stored === 'en' || stored === 'de') return stored;
            } catch (e) { /* localStorage may be unavailable */ }
            return 'en';
        }

        function saveLangPreference(lang) {
            try { window.localStorage.setItem(LANG_STORAGE_KEY, lang); } catch (e) { /* ignore */ }
        }


        // ---------------- light/dark theme detection ----------------

        // Emby swaps in an entirely different stylesheet per dashboard theme rather than toggling
        // a documented body class/attribute we could target directly, so instead of guessing at
        // undocumented Emby internals, this measures the ACTUAL rendered background behind the
        // page at runtime and derives light-vs-dark from that - correct regardless of how Emby
        // implements theming internally, and regardless of which of Emby's several themes (not
        // just "Light"/"Dark") is active. Adds/removes a `bcm-light-bg` class on the root view
        // element; see the matching `.bcm-light-bg ...` overrides in app.html for the actual
        // color adjustments (currently: darker text inside the status/badge/history-tag pills,
        // which are tuned by default for the dark theme and are low-contrast on a light one).
        function applyBackgroundAwareTheme() {
            try {
                var probe = view;
                var bg = null;
                // Walk every ancestor up to and including <html>: Emby's separate Dashboard theme
                // (Light) paints its background on <html> itself. <html>.parentElement is null, so
                // the loop ends on its own.
                while (probe) {
                    var color = window.getComputedStyle(probe).backgroundColor;
                    if (color && color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)') {
                        bg = color;
                        break;
                    }
                    probe = probe.parentElement;
                }
                var match = /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(bg || '');
                if (!match) return;
                var r = parseInt(match[1], 10), g = parseInt(match[2], 10), b = parseInt(match[3], 10);
                // Perceived luminance (ITU-R BT.601). Emby's light theme background is a
                // near-white gray and its dark themes are near-black/navy, so 150 sits cleanly
                // between the two without being close to either real value.
                var luminance = (0.299 * r + 0.587 * g + 0.114 * b);
                view.classList.toggle('bcm-light-bg', luminance > 150);
            } catch (e) { /* detection failed for any reason - keep the dark-theme-tuned defaults */ }
        }

        function applyStaticTranslations() {
            view.querySelectorAll('[data-i18n]').forEach(function (el) {
                var key = el.getAttribute('data-i18n');
                el.textContent = t(key);
            });
            view.querySelectorAll('[data-i18n-placeholder]').forEach(function (el) {
                el.setAttribute('placeholder', t(el.getAttribute('data-i18n-placeholder')));
            });
            view.querySelectorAll('.bcm-langbtn').forEach(function (btn) {
                btn.classList.toggle('active', btn.getAttribute('data-lang') === currentLang);
            });
        }

        // Fields whose *value* (not just their label) is a suggested default that should
        // follow the selected language - see FIELD_DEFAULTS/swapDefaultFieldTexts below.
        var FIELD_DEFAULTS = [
            { selector: '.instant-header', key: 'defaultInstantHeader' },
            { selector: '.scheduled-header', key: 'defaultScheduledHeader' },
            { selector: '.timer-header', key: 'defaultTimerHeader' },
            { selector: '.welcome-header', key: 'defaultWelcomeHeader' },
            { selector: '.welcome-text', key: 'defaultWelcomeText' },
            { selector: '.medianews-header', key: 'defaultMediaNewsHeader' }
        ];

        // .timer-text isn't a single fixed default like the fields above - its suggested text
        // also depends on the selected "action after countdown ends" (Restart/Shutdown/None; see
        // updateTimerTextForAction below), so it's handled separately here rather than through
        // the generic FIELD_DEFAULTS list.
        var TIMER_TEXT_DEFAULT_KEYS = ['defaultTimerText', 'defaultTimerTextShutdown', 'defaultTimerTextNone'];

        // Every post-countdown action has its own suggested message - "None" included, so the
        // field is never left empty (an empty template used to make the preview show no text
        // while the server silently substituted a "server will restart" message).
        function timerDefaultKeyFor(action) {
            if (action === 'ShutdownServer') return 'defaultTimerTextShutdown';
            if (action === 'RestartServer') return 'defaultTimerText';
            return 'defaultTimerTextNone';
        }

        function selectedTimerAction() {
            var sel = view.querySelector('.timer-postaction');
            return sel ? sel.value : 'None';
        }

        // The template that will actually be sent: what's typed, or - if the field is empty -
        // the default for the selected action. Used by both the preview and the Start button,
        // so the preview always shows exactly what users will receive.
        function effectiveTimerTemplate() {
            var typed = (view.querySelector('.timer-text').value || '').trim();
            return typed || t(timerDefaultKeyFor(selectedTimerAction()));
        }

        function isTimerTextDefault(value) {
            if (!value || value.trim() === '') return true;
            return TIMER_TEXT_DEFAULT_KEYS.some(function (k) {
                return value === TRANSLATIONS.en[k] || value === TRANSLATIONS.de[k];
            });
        }

        // Swaps .timer-text from whichever of the three action-specific defaults it currently
        // shows (in fromLang) to the same one in toLang. Left untouched if it doesn't match any
        // known default (i.e. the admin typed a custom message).
        function swapTimerTextDefault(fromLang, toLang) {
            var el = view.querySelector('.timer-text');
            if (!el) return;
            var value = el.value;
            for (var i = 0; i < TIMER_TEXT_DEFAULT_KEYS.length; i++) {
                var key = TIMER_TEXT_DEFAULT_KEYS[i];
                if (value === TRANSLATIONS[fromLang][key]) {
                    el.value = TRANSLATIONS[toLang][key];
                    return;
                }
            }
        }

        // Sets .timer-text to the default message matching the selected post-countdown action,
        // but only if the field is still showing one of the known defaults (or is empty) -
        // anything the admin actually typed is left untouched.
        function updateTimerTextForAction(action) {
            var el = view.querySelector('.timer-text');
            if (!el || !isTimerTextDefault(el.value)) return;
            el.value = t(timerDefaultKeyFor(action));
            updateTimerPreview();
        }

        // Unlike updateTimerTextForAction() above (which only overwrites .timer-text if it's
        // still showing a default, so a custom message an admin is mid-typing isn't clobbered by
        // just picking a different post-action from the dropdown), this always resets it - used
        // after a timer has actually been started, so the form returns to the same state as on
        // page load: the default message for the selected action.
        function resetTimerTextToDefault(action) {
            var el = view.querySelector('.timer-text');
            if (!el) return;
            el.value = t(timerDefaultKeyFor(action));
            updateTimerPreview();
        }

        // Swaps each field's value from the "fromLang" default to the "toLang" default, but
        // only if the field is still showing a default (empty, or exactly the fromLang text) -
        // anything the admin actually typed is left untouched.
        function swapDefaultFieldTexts(fromLang, toLang) {
            if (fromLang === toLang) return;
            FIELD_DEFAULTS.forEach(function (f) {
                var el = view.querySelector(f.selector);
                if (!el) return;
                var fromDefault = TRANSLATIONS[fromLang][f.key];
                var toDefault = TRANSLATIONS[toLang][f.key];
                if (!el.value || el.value.trim() === '' || el.value === fromDefault) {
                    el.value = toDefault;
                }
            });
            swapTimerTextDefault(fromLang, toLang);
            updateTimerPreview();
        }

        // A value loaded from the server-side plugin configuration (welcome/media-news fields)
        // is only ever stored in English by default (see PluginConfiguration.cs). If the admin
        // never customized it, show it translated into the current UI language instead of the
        // literal stored English text.
        function localizeStoredDefault(value, key) {
            if (!value || value === TRANSLATIONS.en[key] || value === TRANSLATIONS.de[key]) {
                return TRANSLATIONS[currentLang][key];
            }
            return value;
        }

        // The two static Preview buttons no longer carry a data-i18n attribute (their label
        // depends on shown/hidden state, not just the language), so applyStaticTranslations()
        // always skips them - call this explicitly after any point currentLang changes (or on
        // first render) to (re)apply the correct label, preserving whichever shown/hidden state
        // each button's box was already in.
        function relabelStaticPreviewButtons() {
            [['.medianews-preview-btn', '.medianews-preview'], ['.medianews-auto-preview-btn', '.medianews-auto-preview']].forEach(function (pair) {
                var btn = view.querySelector(pair[0]);
                var box = view.querySelector(pair[1]);
                setPreviewShown(btn, box, box.dataset.shown === '1');
            });
        }

        function setLanguage(lang) {
            var newLang = (lang === 'de') ? 'de' : 'en';
            swapDefaultFieldTexts(currentLang, newLang);
            currentLang = newLang;
            saveLangPreference(currentLang);
            applyStaticTranslations();
            relabelStaticPreviewButtons();
            // Re-render dynamic content that embeds translated strings - including the preset
            // chips, whose "min"/"Min." unit suffix is language-dependent (chip.textContent is
            // set once at render time, so it needs an explicit re-render on every language
            // switch, not just a data-i18n attribute).
            renderPresetChips();
            renderRecipientLists();
            loadScheduled();
            loadHistory();
            // Neither of these two button labels are plain data-i18n text - both encode extra
            // state (Timer's "Start later" checkbox, Scheduled Message's edit-vs-create mode) that
            // applyStaticTranslations() just reset back to its default a few lines up, so they need
            // an explicit re-derive here. See each function's own doc comment for why.
            updateTimerStartButtonLabel();
            setScheduledFormEditMode(!!editingScheduledId);
            DISPLAY_PREFIXES.forEach(applyDisplayMode);
            refreshMediaNewsAutoStatus();
            renderTileGrid();
            renderTileColorSettings();
            renderOpenOrders();
            renderInstalledVersion();
            renderReleaseNotesButton();
            if (currentSection) {
                view.querySelector('#bcmDetailTitle').textContent = t(TILE_TITLE_I18N[currentSection]);
                updateBackLinkLabel();
                if (currentSection === 'groups') renderGroupsList();
            }
        }

        view.querySelectorAll('.bcm-langbtn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                setLanguage(btn.getAttribute('data-lang'));
            });
        });

        // ---------------- status helpers ----------------

        // Fixed, non-configurable delay (not a per-message/user setting) after which every status
        // message on this page (Update, Sofortnachricht, Terminierte Nachricht, Timer, Media
        // News, Automatik, Willkommensnachricht, Status & Historie - every one of them, since
        // they all funnel through showStatus() below) hides itself automatically, instead of
        // lingering until the admin reloads the page.
        var STATUS_AUTO_HIDE_MS = 10000;

        function showStatus(el, message, kind) {
            if (!el) return;
            el.textContent = message;
            el.classList.remove('ok', 'err');
            el.classList.add(kind === 'err' ? 'err' : 'ok');
            // Track the pending auto-hide timer on the element itself and clear any previous one
            // first, so if a section shows two messages in quick succession (e.g. an error
            // immediately followed by a success once retried), the CURRENT message always gets
            // its own full countdown instead of being cut short by a timer from the earlier one.
            if (el._bcmHideTimer) clearTimeout(el._bcmHideTimer);
            el._bcmHideTimer = setTimeout(function () {
                el.classList.remove('ok', 'err');
                el.textContent = '';
                el._bcmHideTimer = null;
            }, STATUS_AUTO_HIDE_MS);
        }

        function esc(str) {
            return String(str == null ? '' : str)
                .replace(/&/g, '&amp;').replace(/</g, '&lt;')
                .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
        }

        function ajax(method, url, data) {
            var opts = { type: method, url: ApiClient.getUrl(url), dataType: 'json' };
            if (data !== undefined) {
                opts.data = JSON.stringify(data);
                opts.contentType = 'application/json';
            }
            return ApiClient.ajax(opts);
        }

        // ---------------- confirmations ----------------

        // Asks via Emby's own confirm dialog. window.confirm() is suppressed in embedded
        // browsers and some Emby apps - it returns false at once without showing anything
        // (verified in an embedded Chromium), so every confirm-guarded button silently did
        // nothing there. window.confirm() stays only as fallback if Emby's dialog can't load.
        // skip === true runs the action without asking.
        function confirmAction(message, action, skip) {
            if (skip) { action(); return; }
            var loader = (window.Emby && typeof Emby.importModule === 'function')
                ? Emby.importModule('./modules/common/dialogs/confirm.js')
                : Promise.reject();
            loader.then(function (confirm) {
                var show = typeof confirm === 'function' ? confirm : confirm && confirm.default;
                if (typeof show !== 'function') throw new Error('no confirm dialog');
                show({ title: 'EmbyCast', text: message }).then(action, function () { /* cancelled */ });
            }).then(null, function () {
                if (window.confirm(message)) action();
            });
        }

        // ---------------- recipient pickers (shared across sections) ----------------

        // 'sysmsg' = System Message's "Limit user events to" (only All / Specific - a filter,
        // not a recipient list, so there is no "Active users" there).
        var RECIPIENT_PREFIXES = ['instant', 'scheduled', 'timer', 'medianews', 'sysmsg'];

        function wireRecipientGroup(prefix) {
            var group = view.querySelector('.' + prefix + '-recipient-group');
            var list = view.querySelector('.' + prefix + '-userlist');
            if (!group || !list) return;
            group.querySelectorAll('input[type=radio]').forEach(function (radio) {
                radio.addEventListener('change', function () {
                    list.classList.toggle('show', radio.value === 'Specific' && radio.checked);
                    // Switching the recipient mode (e.g. Specific -> Active -> Specific) used to
                    // leave previously checked users checked in the hidden list, since the
                    // checkboxes were only ever hidden via CSS, never actually unchecked - so
                    // they'd silently reappear pre-selected on switching back to "Selected users".
                    // A 'change' event only fires when the checked radio actually changes (not on
                    // re-clicking the already-selected one), so this only resets on a real mode
                    // switch, never while the admin is just ticking/unticking users.
                    Array.prototype.slice.call(list.querySelectorAll('input[type=checkbox]:checked'))
                        .forEach(function (cb) { cb.checked = false; });
                });
            });
        }
        RECIPIENT_PREFIXES.forEach(wireRecipientGroup);

        function getRecipientMode(prefix) {
            var checked = view.querySelector('.' + prefix + '-recipient-group input[type=radio]:checked');
            return checked ? checked.value : 'Active';
        }

        // Used after a successful send/schedule/timer-start to put the recipient picker back to
        // its original default mode. Dispatches a real 'change' event (setting .checked alone
        // doesn't fire one) so the existing wireRecipientGroup() listener runs too - that's what
        // actually hides the "Selected users" list again and clears any checked users, instead of
        // duplicating that logic here.
        function resetRecipientGroup(prefix, defaultValue) {
            var group = view.querySelector('.' + prefix + '-recipient-group');
            if (!group) return;
            var radio = group.querySelector('input[type=radio][value="' + defaultValue + '"]');
            if (!radio) return;
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
        }

        // Group checkboxes are marked with the "group-checkbox" class so they can be told apart
        // from individual-user checkboxes sharing the same list (see renderRecipientLists()
        // below) - both are plain <input type=checkbox>, only the class differs.
        function getSelectedUserIds(prefix) {
            var list = view.querySelector('.' + prefix + '-userlist');
            if (!list) return [];
            return Array.prototype.slice.call(list.querySelectorAll('input[type=checkbox]:checked:not(.group-checkbox)'))
                .map(function (cb) { return cb.value; });
        }

        function getSelectedGroupIds(prefix) {
            var list = view.querySelector('.' + prefix + '-userlist');
            if (!list) return [];
            return Array.prototype.slice.call(list.querySelectorAll('input.group-checkbox[type=checkbox]:checked'))
                .map(function (cb) { return cb.value; });
        }

        // Looks up a group's display name from the shared allGroupsCache; falls back to a
        // generic "Unknown group" label for ids that no longer resolve (e.g. a group deleted
        // after a Scheduled Message/Timer was created referencing it).
        function resolveGroupName(groupId) {
            for (var i = 0; i < allGroupsCache.length; i++) {
                if (allGroupsCache[i].Id === groupId) return allGroupsCache[i].Name;
            }
            return t('recipientUnknownGroup');
        }

        function renderRecipientLists() {
            RECIPIENT_PREFIXES.forEach(function (prefix) {
                var list = view.querySelector('.' + prefix + '-userlist');
                if (!list) return;
                var previouslySelectedUsers = getSelectedUserIds(prefix);
                var previouslySelectedGroups = getSelectedGroupIds(prefix);
                if (allUsersCache.length === 0) {
                    list.innerHTML = '<p style="opacity:.4;font-size:.85em;margin:0;">' + esc(t('msgNoUsers')) + '</p>';
                    return;
                }
                var activeByUserId = {};
                activeSessionsCache.forEach(function (s) { activeByUserId[s.UserId] = s; });

                list.innerHTML = '';

                // "Groups" sub-section, shown only once at least one group exists - lets an
                // admin combine one or more saved groups with individually-picked users below.
                if (allGroupsCache.length > 0) {
                    var groupsTitleEl = document.createElement('div');
                    groupsTitleEl.className = 'userlist-subtitle';
                    groupsTitleEl.textContent = t('userlistGroupsSubtitle');
                    list.appendChild(groupsTitleEl);
                    allGroupsCache.forEach(function (group) {
                        var glabel = document.createElement('label');
                        var gchecked = previouslySelectedGroups.indexOf(group.Id) !== -1;
                        glabel.innerHTML = '<input type="checkbox" class="group-checkbox" value="' + esc(group.Id) + '"' +
                            (gchecked ? ' checked' : '') + ' /> <span>' + esc(group.Name) + '</span>' +
                            '<span class="group-chip">' + esc(fmt('groupMemberCountChip', existingGroupMembers(group).length)) + '</span>';
                        list.appendChild(glabel);
                    });
                    var usersTitleEl = document.createElement('div');
                    usersTitleEl.className = 'userlist-subtitle';
                    usersTitleEl.textContent = t('userlistUsersSubtitle');
                    list.appendChild(usersTitleEl);
                }

                allUsersCache.forEach(function (user) {
                    var label = document.createElement('label');
                    var checked = previouslySelectedUsers.indexOf(user.Id) !== -1;
                    var nowPlayingHtml = '';
                    var session = activeByUserId[user.Id];
                    if (session) {
                        nowPlayingHtml = '<span class="bcm-nowplaying">● ' +
                            (session.NowPlaying ? esc(t('nowPlayingPrefix') + session.NowPlaying) : esc(t('recipientActive'))) +
                            '</span>';
                    }
                    label.innerHTML = '<input type="checkbox" value="' + esc(user.Id) + '"' + (checked ? ' checked' : '') + ' /> ' +
                        '<span>' + esc(user.Name) + '</span>' + nowPlayingHtml;
                    list.appendChild(label);
                });
            });
        }

        // Also loads groups (not just users/sessions) - a single shared refresh keeps every
        // recipient checkbox list AND the "User Groups" section AND the groups tile badge in
        // sync, since group membership/naming can change from that section at any time.
        function loadUsersAndSessions() {
            return Promise.all([
                ajax('GET', 'EmbyCast/Users/All').catch(function () { return []; }),
                ajax('GET', 'EmbyCast/Sessions/Active').catch(function () { return []; }),
                ajax('GET', 'EmbyCast/Groups').catch(function () { return []; })
            ]).then(function (results) {
                allUsersCache = results[0] || [];
                activeSessionsCache = results[1] || [];
                allGroupsCache = results[2] || [];
                renderRecipientLists();
                renderGroupsList();
                renderTileBadges();
                // See the race-condition note on buildRecipientLineHtml(): if the scheduled list
                // already rendered before user data was available, re-render it now that names
                // can actually be resolved. No-op (lastScheduledItems still null) on the very
                // first load if this happens to resolve before loadScheduled() ever ran.
                if (lastScheduledItems) renderScheduled(lastScheduledItems);
            });
        }

        // ---------------- user groups ----------------

        var editingGroupId = null;

        function renderGroupsList() {
            var el = view.querySelector('.group-list');
            if (!el) return;
            if (allGroupsCache.length === 0) {
                el.innerHTML = '<p style="opacity:.35;font-size:.85em;margin:0;">' + esc(t('msgNoGroups')) + '</p>';
                return;
            }
            el.innerHTML = '';
            allGroupsCache.forEach(function (group) {
                var row = document.createElement('div');
                row.className = 'group-item';
                var existing = existingGroupMembers(group);
                var deletedCount = (group.UserIds || []).length - existing.length;
                var names = existing.map(resolveUserName);
                var memberText = names.length === 0
                    ? t('msgGroupEmpty')
                    : fmt('groupMembersLine', names.length,
                        names.slice(0, 4).join(', ') + (names.length > 4 ? ', …' : ''));
                if (deletedCount > 0) memberText += ' · ⚠ ' + fmt('groupDeletedMembers', deletedCount);
                row.innerHTML =
                    '<div class="group-main"><div class="group-name"></div><div class="group-members"></div></div>' +
                    '<div class="group-actions">' +
                    '<button type="button" class="bcm-btn secondary small group-edit-btn">' + esc(t('btnEditGroup')) + '</button>' +
                    '<button type="button" class="bcm-btn danger small group-delete-btn">' + esc(t('btnDeleteGroup')) + '</button>' +
                    '</div>';
                row.querySelector('.group-name').textContent = group.Name;
                row.querySelector('.group-members').textContent = memberText;
                row.querySelector('.group-edit-btn').addEventListener('click', function () { openGroupForm(group.Id); });
                row.querySelector('.group-delete-btn').addEventListener('click', function () { deleteGroup(group.Id, group.Name); });
                el.appendChild(row);
            });
        }

        // Same form markup for "New group" and "Edit group" - only the title/prefilled values
        // differ. groupId === null means "new group".
        function openGroupForm(groupId) {
            editingGroupId = groupId;
            var form = view.querySelector('.group-form');
            var title = form.querySelector('.group-form-title');
            var nameInput = form.querySelector('.group-form-name');
            var list = form.querySelector('.group-form-userlist');

            var group = groupId ? allGroupsCache.filter(function (g) { return g.Id === groupId; })[0] : null;
            title.textContent = group ? fmt('groupFormEditTitle', group.Name) : t('groupFormNewTitle');
            nameInput.value = group ? group.Name : '';

            list.innerHTML = '';
            if (allUsersCache.length === 0) {
                list.innerHTML = '<p style="opacity:.4;font-size:.85em;margin:0;">' + esc(t('msgNoUsers')) + '</p>';
            } else {
                var memberIds = group ? (group.UserIds || []) : [];
                allUsersCache.forEach(function (user) {
                    var label = document.createElement('label');
                    var checked = memberIds.indexOf(user.Id) !== -1;
                    label.innerHTML = '<input type="checkbox" value="' + esc(user.Id) + '"' + (checked ? ' checked' : '') + ' /> <span>' + esc(user.Name) + '</span>';
                    list.appendChild(label);
                });
            }

            form.classList.add('show');
            var statusEl = form.querySelector('.group-form-status');
            statusEl.style.display = 'none';
            nameInput.focus();
        }

        function closeGroupForm() {
            view.querySelector('.group-form').classList.remove('show');
            editingGroupId = null;
        }

        view.querySelector('.group-new').addEventListener('click', function () { openGroupForm(null); });
        view.querySelector('.group-form-cancel').addEventListener('click', closeGroupForm);

        view.querySelector('.group-form-save').addEventListener('click', function () {
            var form = view.querySelector('.group-form');
            var statusEl = form.querySelector('.group-form-status');
            var name = form.querySelector('.group-form-name').value.trim();
            if (!name) { showStatus(statusEl, t('msgGroupNameRequired'), 'err'); return; }
            var userIds = Array.prototype.slice.call(form.querySelectorAll('.group-form-userlist input[type=checkbox]:checked'))
                .map(function (cb) { return cb.value; });

            var wasEditingId = editingGroupId;
            var request = editingGroupId
                ? ajax('POST', 'EmbyCast/Groups/' + editingGroupId, { Id: editingGroupId, Name: name, UserIds: userIds })
                : ajax('POST', 'EmbyCast/Groups', { Name: name, UserIds: userIds });

            request.then(function (result) {
                // The server returns null (200 OK, empty body) if the group being edited no
                // longer exists - e.g. deleted from another browser tab in the meantime. Treat
                // that the same as an error rather than showing a false "Group saved.".
                if (wasEditingId && !result) {
                    showStatus(statusEl, t('msgGroupNotFound'), 'err');
                    loadUsersAndSessions();
                    return;
                }
                if (result && result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                closeGroupForm();
                showStatus(view.querySelector('.groups-status'), t('msgGroupSaved'), 'ok');
                loadUsersAndSessions();
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        function deleteGroup(id, name) {
            confirmAction(fmt('msgConfirmDeleteGroup', name), function () {
                ajax('DELETE', 'EmbyCast/Groups/' + id).then(function () {
                    showStatus(view.querySelector('.groups-status'), t('msgGroupDeleted'), 'ok');
                    loadUsersAndSessions();
                }, function (err) {
                    showStatus(view.querySelector('.groups-status'), t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
                });
            });
        }

        // "✎ Manage groups" links inside every "Selected users & groups" recipient panel
        // (Instant/Scheduled/Timer/Media News) - jumps straight to the "User Groups" section
        // without losing whatever is currently being composed, and remembers where to return to
        // (see openSection()'s returnTo param / the context-aware back-link wiring below).
        view.querySelectorAll('.manage-groups-link').forEach(function (el) {
            el.addEventListener('click', function () { openSection('groups', currentSection); });
        });

        // Every section that offers a "Selected users" recipient mode gets its own refresh
        // link; they all call the same shared loadUsersAndSessions(), which refreshes the
        // user/session data for all RECIPIENT_PREFIXES sections at once.
        ['.instant-refresh-users', '.scheduled-refresh-users', '.timer-refresh-users', '.medianews-refresh-users']
            .forEach(function (selector) {
                var el = view.querySelector(selector);
                if (el) el.addEventListener('click', loadUsersAndSessions);
            });

        // ---------------- plugin self-update ----------------

        function checkForUpdate() {
            var btn = view.querySelector('.update-check');
            var statusEl = view.querySelector('.update-status');
            btn.disabled = true;
            showStatus(statusEl, t('msgUpdateChecking'), 'ok');

            ajax('POST', 'EmbyCast/CheckUpdate').then(function (result) {
                btn.disabled = false;
                if (result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                setReleaseNotes(result);
                if (result.UpdateAvailable && !result.ChecksumAvailable) {
                    // Server refuses to install a release with no GitHub-provided SHA-256 digest
                    // available (see Plugin.InstallUpdateAsync) - don't even show the Install
                    // button, so the admin isn't led into clicking it just to get an error.
                    showStatus(statusEl, fmt('msgUpdateNoChecksum', result.LatestVersion, result.CurrentVersion), 'err');
                } else if (result.UpdateAvailable) {
                    showStatus(statusEl, fmt(result.IsPreRelease ? 'msgUpdateAvailableBeta' : 'msgUpdateAvailable', result.LatestVersion, result.CurrentVersion), 'ok');
                    view.querySelector('.update-install').style.display = '';
                } else {
                    showStatus(statusEl, fmt('msgUpToDate', result.CurrentVersion), 'ok');
                }
            }, function (err) {
                btn.disabled = false;
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        }

        // A beta (pre-release) is only installed after an explicit confirmation.
        function installUpdate() {
            if (pendingUpdate && pendingUpdate.isPreRelease) {
                confirmAction(fmt('msgConfirmInstallBeta', pendingUpdate.version), runInstallUpdate);
                return;
            }
            runInstallUpdate();
        }

        function runInstallUpdate() {
            var btn = view.querySelector('.update-install');
            var statusEl = view.querySelector('.update-status');
            btn.disabled = true;
            showStatus(statusEl, t('msgUpdateInstalling'), 'ok');

            // result.Message comes straight from the server (Plugin.InstallUpdateAsync) and is
            // English-only, unlike the check-for-update status above.
            ajax('POST', 'EmbyCast/InstallUpdate').then(function (result) {
                btn.disabled = false;
                showStatus(statusEl, result.Message, result.Success ? 'ok' : 'err');
                if (result.Success) btn.style.display = 'none';
            }, function (err) {
                btn.disabled = false;
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        }

        view.querySelector('.update-check').addEventListener('click', checkForUpdate);
        view.querySelector('.update-install').addEventListener('click', installUpdate);

        // ---------------- release notes of an available update ----------------

        // The update check already returns the GitHub release text (ReleaseNotes = the release's
        // Markdown "body"). Shown here so admins don't need the project page. Only the newest
        // release's notes are available - versions skipped in between are not shown.
        var releaseNotes = null; // { version, text } or null

        // The update the last check found ({ version, isPreRelease }) or null.
        var pendingUpdate = null;

        function setReleaseNotes(result) {
            pendingUpdate = result && result.UpdateAvailable
                ? { version: result.LatestVersion, isPreRelease: !!result.IsPreRelease } : null;
            var text = result && result.UpdateAvailable && result.ReleaseNotes ? String(result.ReleaseNotes).trim() : '';
            releaseNotes = text ? { version: result.LatestVersion, text: text } : null;
            var btn = view.querySelector('.update-notes-toggle');
            var box = view.querySelector('.update-notes');
            btn.style.display = releaseNotes ? '' : 'none';
            if (!releaseNotes) box.style.display = 'none';
            renderReleaseNotesButton();
        }

        function renderReleaseNotesButton() {
            var btn = view.querySelector('.update-notes-toggle');
            if (!releaseNotes) return;
            var open = view.querySelector('.update-notes').style.display !== 'none';
            btn.textContent = fmt(open ? 'btnHideReleaseNotes' : 'btnShowReleaseNotes', releaseNotes.version);
        }

        view.querySelector('.update-notes-toggle').addEventListener('click', function () {
            if (!releaseNotes) return;
            var box = view.querySelector('.update-notes');
            var open = box.style.display !== 'none';
            if (!open) box.innerHTML = renderMarkdown(releaseNotes.text);
            box.style.display = open ? 'none' : '';
            renderReleaseNotesButton();
        });

        // Small Markdown subset for GitHub release notes: headings, lists, fenced code, horizontal
        // rules, paragraphs; inline code, bold, italic and links. Everything is HTML-escaped
        // FIRST, so nothing in the notes can inject markup or script; links are only kept for
        // http(s) URLs and open in a new tab.
        function renderMarkdown(md) {
            var lines = String(md || '').replace(/\r\n?/g, '\n').split('\n');
            var html = [];
            var para = [];
            var listType = null;
            var inCode = false;
            var code = [];

            function flushPara() {
                if (para.length) { html.push('<p>' + para.map(mdInline).join('<br>') + '</p>'); para = []; }
            }
            function closeList() {
                if (listType) { html.push('</' + listType + '>'); listType = null; }
            }

            lines.forEach(function (line) {
                if (/^\s*```/.test(line)) {
                    if (inCode) { html.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>'); code = []; inCode = false; }
                    else { flushPara(); closeList(); inCode = true; }
                    return;
                }
                if (inCode) { code.push(line); return; }

                var m;
                if (/^\s*$/.test(line)) { flushPara(); closeList(); return; }
                if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flushPara(); closeList(); html.push('<hr>'); return; }
                if ((m = /^\s*(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line))) {
                    flushPara(); closeList();
                    var level = Math.min(5, Math.max(3, m[1].length + 2));
                    html.push('<h' + level + '>' + mdInline(m[2]) + '</h' + level + '>');
                    return;
                }
                if ((m = /^\s*[-*+]\s+(.*)$/.exec(line)) || (m = /^\s*\d+[.)]\s+(.*)$/.exec(line))) {
                    flushPara();
                    var type = /^\s*\d/.test(line) ? 'ol' : 'ul';
                    if (listType !== type) { closeList(); html.push('<' + type + '>'); listType = type; }
                    html.push('<li>' + mdInline(m[1]) + '</li>');
                    return;
                }
                closeList();
                para.push(line.trim());
            });
            if (inCode) html.push('<pre><code>' + esc(code.join('\n')) + '</code></pre>');
            flushPara();
            closeList();
            return html.join('');
        }

        function mdInline(text) {
            var codes = [];
            var s = esc(text).replace(/`([^`]+)`/g, function (all, c) {
                codes.push('<code>' + c + '</code>');
                return '\u0000' + (codes.length - 1) + '\u0000';
            });
            s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function (all, label, url) {
                return '<a href="' + url + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
            });
            s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/__([^_]+)__/g, '<strong>$1</strong>');
            s = s.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
            return s.replace(/\u0000(\d+)\u0000/g, function (all, i) { return codes[+i]; });
        }

        function renderBetaNote() {
            view.querySelector('.updates-beta-note').style.display =
                pluginConfig && pluginConfig.IncludePreReleases ? '' : 'none';
        }

        var updateAvailableFlag = false;
        // Last CurrentVersion seen from the "Cached" update-check route, so the "Installed
        // version: vX" line can be re-rendered (re-translated) on a language switch without
        // firing another network request - see renderInstalledVersion()/setLanguage() below.
        var lastKnownPluginVersion = null;

        // Silent check driving only the Plugin-Updates tile's "update available" dot - never
        // touches the manual Check-for-Updates button/status text above, and never surfaces an
        // error to the admin (this runs unprompted on every page load, an admin who's offline or
        // whose GitHub check fails shouldn't see a scary error for something they didn't ask for).
        // Uses the read-only "Cached" route (GET, never invalidates) rather than the manual
        // button's POST route - reading the existing UpdateChecker cache (see CacheTtl) instead
        // of forcing a fresh GitHub call on every single page load.
        function silentCheckForUpdateBadge() {
            ajax('GET', 'EmbyCast/CheckUpdate/Cached').then(function (result) {
                updateAvailableFlag = !!(result && result.UpdateAvailable);
                renderTileBadges();
                setReleaseNotes(result);
                // Piggy-backs on this same cached, no-side-effect check to fill in the
                // permanent "Installed version: vX" line on the Plugin Updates card - no
                // separate request needed, and it's already known cheap/silent-safe (see
                // comment above) since it just reads UpdateChecker's existing cache.
                if (result && result.CurrentVersion) {
                    lastKnownPluginVersion = result.CurrentVersion;
                }
                renderInstalledVersion();
            }, function () { /* ignore - badge just stays hidden */ });
        }

        // Re-renders the "Installed version: vX" line from the last known version (set by
        // silentCheckForUpdateBadge above) without firing a new network request - so a language
        // switch can call this directly to re-translate the line instead of waiting for the next
        // silent update check.
        function renderInstalledVersion() {
            var versionEl = view.querySelector('.updates-installed-version');
            if (versionEl && lastKnownPluginVersion) {
                versionEl.textContent = fmt('updatesInstalledVersion', lastKnownPluginVersion);
            }
        }

        // ---------------- display mode (dialog vs. short pop-up) ----------------

        // Emby's apps show any message with TimeoutMs > 0 as a short pop-up ("toast"): about 3
        // seconds regardless of the number sent, no title, all text on one line (verified in the
        // web client; the same was observed in the Android and Android TV apps). So instead of a
        // seconds field the dashboard offers exactly these two choices. The server applies the
        // toast rules itself (DeliveryService.SendAsync: no header, lines joined, history title
        // "Toast-Message"); everything here only mirrors them for the previews.
        var TOAST_TIMEOUT_MS = 4000;
        var TOAST_LINE_SEPARATOR = ' · ';          // = TextFormatting.ToastLineSeparator
        var TOAST_HISTORY_TITLE = 'Toast-Message'; // = DeliveryService.ToastHistoryTitle
        var DISPLAY_PREFIXES = ['instant', 'scheduled', 'timer'];

        function getDisplayMode(prefix) {
            var checked = view.querySelector('input[name="' + prefix + '-display"]:checked');
            return checked && checked.value === 'toast' ? 'toast' : 'dialog';
        }

        function displayTimeoutMs(prefix) {
            return getDisplayMode(prefix) === 'toast' ? TOAST_TIMEOUT_MS : 0;
        }

        // Header to send: none for a short pop-up (it would never be shown), so a hidden, stale
        // header can't end up stored with a scheduled message or timer.
        function headerForSend(prefix, defaultKey) {
            if (getDisplayMode(prefix) === 'toast') return '';
            return view.querySelector('.' + prefix + '-header').value.trim() || t(defaultKey);
        }

        // How a stored message/timer is labelled in lists: what users actually see as its title.
        function displayTitle(header, timeoutMs) {
            return timeoutMs > 0 ? TOAST_HISTORY_TITLE : (header || '');
        }

        function setDisplayMode(prefix, mode) {
            var radio = view.querySelector('input[name="' + prefix + '-display"][value="' + (mode === 'toast' ? 'toast' : 'dialog') + '"]');
            if (radio) radio.checked = true;
            applyDisplayMode(prefix);
        }

        function joinLinesForToast(text) {
            return (text || '').split(/\r\n|\r|\n/)
                .map(function (line) { return line.trim(); })
                .filter(function (line) { return line.length > 0; })
                .join(TOAST_LINE_SEPARATOR);
        }

        function applyDisplayMode(prefix) {
            var toast = getDisplayMode(prefix) === 'toast';
            view.querySelectorAll('.' + prefix + '-display-group .bcm-display-opt').forEach(function (opt) {
                opt.classList.toggle('selected', opt.querySelector('input').checked);
            });
            var headerField = view.querySelector('.' + prefix + '-header-field');
            if (headerField) headerField.style.display = toast ? 'none' : '';
            var note = view.querySelector('.' + prefix + '-toast-note');
            if (note) note.style.display = toast ? '' : 'none';
            if (prefix === 'timer') updateTimerPreview();
            else renderUserPreview(prefix);
        }

        // "Preview for users" under Instant/Scheduled Message: a dialog with title, text and the
        // "Got it" button, or a narrow one-line pop-up - as the Emby apps render them.
        function renderUserPreview(prefix) {
            var box = view.querySelector('.' + prefix + '-user-preview');
            if (!box) return;
            var text = view.querySelector('.' + prefix + '-text').value;
            box.innerHTML = '';
            if (getDisplayMode(prefix) === 'toast') {
                var toastEl = document.createElement('div');
                toastEl.className = 'bcm-up-toast';
                toastEl.textContent = joinLinesForToast(text) || '…';
                box.appendChild(toastEl);
                return;
            }
            var dialog = document.createElement('div');
            dialog.className = 'bcm-up-dialog';
            var title = document.createElement('div');
            title.className = 'bcm-up-title';
            title.textContent = headerForSend(prefix, prefix === 'instant' ? 'defaultInstantHeader' : 'defaultScheduledHeader');
            var body = document.createElement('div');
            body.className = 'bcm-up-text';
            body.textContent = text.trim() || '…';
            var btn = document.createElement('span');
            btn.className = 'bcm-up-btn';
            btn.textContent = t('previewGotIt');
            dialog.appendChild(title);
            dialog.appendChild(body);
            dialog.appendChild(btn);
            box.appendChild(dialog);
        }

        DISPLAY_PREFIXES.forEach(function (prefix) {
            view.querySelectorAll('input[name="' + prefix + '-display"]').forEach(function (radio) {
                radio.addEventListener('change', function () { applyDisplayMode(prefix); });
            });
            if (prefix === 'timer') return; // the timer has its own preview (updateTimerPreview)
            ['header', 'text'].forEach(function (field) {
                var el = view.querySelector('.' + prefix + '-' + field);
                if (el) el.addEventListener('input', function () { renderUserPreview(prefix); });
            });
        });

        // ---------------- instant message ----------------

        view.querySelector('.instant-send').addEventListener('click', function () {
            var header = headerForSend('instant', 'defaultInstantHeader');
            var text = view.querySelector('.instant-text').value.trim();
            var timeoutMs = displayTimeoutMs('instant');
            var statusEl = view.querySelector('.instant-status');

            if (!text) { showStatus(statusEl, t('msgPleaseEnterMessage'), 'err'); return; }
            var mode = getRecipientMode('instant');
            var userIds = mode === 'Specific' ? getSelectedUserIds('instant') : [];
            var groupIds = mode === 'Specific' ? getSelectedGroupIds('instant') : [];
            if (mode === 'Specific' && userIds.length === 0 && groupIds.length === 0) { showStatus(statusEl, t('msgPleaseSelectUsers'), 'err'); return; }

            showStatus(statusEl, t('msgSending'), 'ok');
            var btn = view.querySelector('.instant-send');
            btn.disabled = true;

            ajax('POST', 'EmbyCast/Send', {
                Header: header, Text: text, TimeoutMs: timeoutMs,
                RecipientMode: mode, UserIds: userIds, GroupIds: groupIds
            }).then(function (result) {
                btn.disabled = false;
                if (result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                showStatus(statusEl, fmt('msgSent', result.Delivered, result.Pending, result.Failed), 'ok');
                view.querySelector('.instant-header').value = t('defaultInstantHeader');
                view.querySelector('.instant-text').value = '';
                setDisplayMode('instant', 'dialog');
                resetRecipientGroup('instant', 'Active');
                loadHistory();
            }, function (err) {
                btn.disabled = false;
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        // ---------------- scheduled message ----------------

        // Non-null while the top form is editing an existing scheduled message rather than
        // composing a new one (see startEditingScheduled()/cancelEditingScheduled() below) - the
        // form fields are shared between "create" and "edit" (same pattern as the User Groups
        // form), only this flag and the Save button's label distinguish which mode is active.
        var editingScheduledId = null;

        function resetScheduledForm() {
            view.querySelector('.scheduled-header').value = t('defaultScheduledHeader');
            view.querySelector('.scheduled-text').value = '';
            view.querySelector('.scheduled-datetime').value = '';
            setDisplayMode('scheduled', 'dialog');
            resetRecipientGroup('scheduled', 'All');
        }

        // Swaps the Save button's label between "Schedule Message"/"Save Changes" and shows/hides
        // the "Cancel edit" link - called both when entering/leaving edit mode and again from
        // setLanguage() (see updateTimerStartButtonLabel()'s doc comment for why a plain one-time
        // textContent assignment isn't enough: applyStaticTranslations() would reset the button
        // back to its data-i18n default on every language switch otherwise).
        function setScheduledFormEditMode(editing) {
            view.querySelector('.scheduled-create').textContent = t(editing ? 'btnSaveScheduleChanges' : 'btnSchedule');
            view.querySelector('.scheduled-cancel-edit').style.display = editing ? '' : 'none';
        }

        function cancelEditingScheduled() {
            editingScheduledId = null;
            resetScheduledForm();
            setScheduledFormEditMode(false);
        }

        // Converts a Date to the local "YYYY-MM-DDTHH:mm" string a <input type="datetime-local">
        // expects as its value - used to prefill the date/time field below. Built from the Date
        // object's local getters (not toISOString(), which is UTC) so the picker shows the same
        // wall-clock time the admin originally chose, in the browser's own local time zone.
        function toDatetimeLocalValue(date) {
            var pad = function (n) { return (n < 10 ? '0' : '') + n; };
            return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate()) +
                'T' + pad(date.getHours()) + ':' + pad(date.getMinutes());
        }

        // Loads an existing scheduled message's values into the (shared) form above and switches
        // it into edit mode - clicking "Save Changes" afterwards updates this same message in
        // place instead of creating a new one (see the .scheduled-create handler below). Clicking
        // Edit on a different message while one is already being edited simply switches to the new
        // one, discarding any unsaved changes to the first - no confirmation, by design (kept
        // deliberately simple; "Cancel edit" is the only way out that was asked for).
        function startEditingScheduled(item) {
            editingScheduledId = item.Id;
            view.querySelector('.scheduled-header').value = item.Header || '';
            view.querySelector('.scheduled-text').value = item.Text || '';
            // Messages saved with any timeout > 0 (including ones from before this choice
            // existed, e.g. 10000) are short pop-ups for the Emby apps.
            setDisplayMode('scheduled', (item.TimeoutMs || 0) > 0 ? 'toast' : 'dialog');
            view.querySelector('.scheduled-datetime').value = toDatetimeLocalValue(new Date(item.SendAtUtc));

            var mode = item.RecipientMode || 'All';
            var radio = view.querySelector('.scheduled-recipient-group input[type=radio][value="' + mode + '"]');
            if (radio) {
                radio.checked = true;
                // Dispatched (not just .checked = true) so the existing wireRecipientGroup()
                // listener actually runs - it shows/hides the user list for this mode and clears
                // any previously-checked users, exactly as a real click would. The correct users/
                // groups for THIS item are then checked explicitly right after.
                radio.dispatchEvent(new Event('change'));
            }
            if (mode === 'Specific') {
                var list = view.querySelector('.scheduled-userlist');
                (item.SpecificUserIds || []).forEach(function (uid) {
                    var cb = list.querySelector('input[type=checkbox]:not(.group-checkbox)[value="' + uid + '"]');
                    if (cb) cb.checked = true;
                });
                (item.SpecificGroupIds || []).forEach(function (gid) {
                    var cb = list.querySelector('input.group-checkbox[value="' + gid + '"]');
                    if (cb) cb.checked = true;
                });
            }

            setScheduledFormEditMode(true);
            view.querySelector('.scheduled-header').scrollIntoView({ block: 'start', behavior: 'smooth' });
        }

        view.querySelector('.scheduled-cancel-edit').addEventListener('click', cancelEditingScheduled);

        view.querySelector('.scheduled-create').addEventListener('click', function () {
            var header = headerForSend('scheduled', 'defaultScheduledHeader');
            var text = view.querySelector('.scheduled-text').value.trim();
            var timeoutMs = displayTimeoutMs('scheduled');
            var dtValue = view.querySelector('.scheduled-datetime').value;
            var statusEl = view.querySelector('.scheduled-status');

            if (!text) { showStatus(statusEl, t('msgPleaseEnterMessage'), 'err'); return; }
            if (!dtValue) { showStatus(statusEl, t('msgPleaseSetDateTime'), 'err'); return; }
            var sendAt = new Date(dtValue);
            if (isNaN(sendAt.getTime()) || sendAt.getTime() <= Date.now()) {
                showStatus(statusEl, t('msgPleaseSetDateTime'), 'err'); return;
            }
            var mode = getRecipientMode('scheduled');
            var userIds = mode === 'Specific' ? getSelectedUserIds('scheduled') : [];
            var groupIds = mode === 'Specific' ? getSelectedGroupIds('scheduled') : [];
            if (mode === 'Specific' && userIds.length === 0 && groupIds.length === 0) { showStatus(statusEl, t('msgPleaseSelectUsers'), 'err'); return; }

            var payload = {
                Header: header, Text: text, TimeoutMs: timeoutMs,
                SendAtUtc: sendAt.toISOString(), RecipientMode: mode, UserIds: userIds, GroupIds: groupIds
            };

            var editingId = editingScheduledId;
            var request = editingId
                ? ajax('POST', 'EmbyCast/Schedule/' + editingId, payload)
                : ajax('POST', 'EmbyCast/Schedule', payload);

            request.then(function (result) {
                // The server returns null (200 OK, empty body) if the message being edited no
                // longer exists - e.g. it already fired or was cancelled from another tab in the
                // meantime. Same handling as the Groups form: treat that as an error rather than
                // showing a false "Message updated.", then fall back to the create-a-new-one state.
                if (editingId && !result) {
                    showStatus(statusEl, t('msgScheduleNotFound'), 'err');
                    cancelEditingScheduled();
                    loadScheduled();
                    return;
                }
                if (result && result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                showStatus(statusEl, t(editingId ? 'msgScheduleUpdated' : 'msgScheduleCreated'), 'ok');
                if (editingId) {
                    cancelEditingScheduled();
                } else {
                    resetScheduledForm();
                }
                loadScheduled();
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        function loadScheduled() {
            ajax('GET', 'EmbyCast/Schedule').then(renderScheduled, function () {
                view.querySelector('.scheduled-list').innerHTML =
                    '<p style="opacity:.4;font-size:.85em;">' + esc(t('msgLoadFailed')) + '</p>';
            });
        }

        // Cached so a re-render can be triggered once allUsersCache actually has data (see the
        // race-condition note in buildRecipientLineHtml() below) without a second server round-trip.
        var lastScheduledItems = null;

        function renderScheduled(items) {
            lastScheduledItems = items || [];
            // The message currently loaded into the form for editing may have been cancelled or
            // may have fired from another tab/session since the last refresh - loadScheduled() gets
            // called from several places besides this feature's own success paths (onResume,
            // setLanguage(), tile navigation), none of which know about editingScheduledId. Catch
            // that here too, not just in the two spots that trigger a save/cancel directly, so the
            // form never keeps silently showing stale data for a message that's already gone.
            if (editingScheduledId && !lastScheduledItems.some(function (s) { return s.Id === editingScheduledId; })) {
                cancelEditingScheduled();
            }
            var el = view.querySelector('.scheduled-list');
            if (!items || items.length === 0) {
                el.innerHTML = '<p style="opacity:.35;font-size:.85em;margin:0;">' + esc(t('msgNoScheduled')) + '</p>';
                renderOpenOrders();
                return;
            }
            el.innerHTML = '';
            items.forEach(function (s) {
                var row = document.createElement('div');
                row.className = 'bcm-history-item';
                var when = localeDateTimeString(new Date(s.SendAtUtc));
                row.innerHTML =
                    '<div class="bcm-history-head">' +
                    '<span><strong>' + esc(displayTitle(s.Header, s.TimeoutMs)) + '</strong> &mdash; ' + esc(when) + '</span>' +
                    '<span style="display:flex;gap:.4em;flex-shrink:0;">' +
                    '<button class="bcm-dismiss edit-scheduled-btn" data-id="' + esc(s.Id) + '">' + esc(t('btnEditScheduled')) + '</button>' +
                    '<button class="bcm-dismiss cancel-scheduled-btn" data-id="' + esc(s.Id) + '">' + esc(t('msgCancel')) + '</button>' +
                    '</span>' +
                    '</div>' +
                    buildRecipientLineHtml(s) +
                    '<div style="font-size:.88em;opacity:.75;">' + esc(s.Text) + '</div>';
                el.appendChild(row);
            });
            el.querySelectorAll('.edit-scheduled-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var id = btn.getAttribute('data-id');
                    var item = lastScheduledItems.filter(function (s) { return s.Id === id; })[0];
                    if (item) startEditingScheduled(item);
                });
            });
            el.querySelectorAll('.cancel-scheduled-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    confirmAction(t('msgConfirmCancelSchedule'), function () {
                        var id = btn.getAttribute('data-id');
                        ajax('DELETE', 'EmbyCast/Schedule/' + id).then(function () {
                            // The message just cancelled from the list might be the one currently
                            // loaded into the form above for editing - leaving edit mode on in that
                            // case would let "Save Changes" try to update a message that no longer
                            // exists (harmless - it just falls into the msgScheduleNotFound branch -
                            // but resetting here avoids the confusing intermediate state entirely).
                            if (id === editingScheduledId) cancelEditingScheduled();
                            loadScheduled();
                        });
                    });
                });
            });
            wireRecipientMoreLinks(el);
            renderOpenOrders();
        }

        // Looks up a user's display name from the shared allUsersCache; falls back to a generic
        // "Unknown user" label for ids that no longer resolve (e.g. a user account that was since
        // deleted from Emby but is still referenced by an already-scheduled message).
        function resolveUserName(userId) {
            for (var i = 0; i < allUsersCache.length; i++) {
                if (allUsersCache[i].Id === userId) return allUsersCache[i].Name;
            }
            return t('recipientUnknownUser');
        }

        // A group can still list a user that was deleted in Emby - the server removes such ids
        // on its next start (UserCleanupService), and immediately for deletions while it runs.
        // Until then they're shown separately instead of as "Unknown user" members. Only judged
        // once the user list has actually loaded, so a failed/slow load never marks everyone.
        function isKnownUser(userId) {
            if (allUsersCache.length === 0) return true;
            for (var i = 0; i < allUsersCache.length; i++) {
                if (allUsersCache[i].Id === userId) return true;
            }
            return false;
        }

        function existingGroupMembers(group) {
            return (group.UserIds || []).filter(isKnownUser);
        }

        var RECIPIENT_NAMES_SHOWN_COLLAPSED = 4;

        // Builds the "To: ..." line shown under each upcoming scheduled message. Active/All modes
        // just show the (translated) mode label, matching how Media News already summarizes its
        // own recipient mode. "Specific" mode lists resolved user names, truncated to the first 4
        // with a clickable "+N more" (see wireRecipientMoreLinks) once there are more than that.
        //
        // Race condition note: on a fresh page load, loadScheduled() and loadUsersAndSessions()
        // both kick off in parallel from init() - if the schedule list comes back first, names
        // aren't resolvable yet and every "Specific" entry would show "Unknown user" for everyone.
        // loadUsersAndSessions() re-renders the scheduled list (via lastScheduledItems, see
        // below) once allUsersCache actually has data, so this self-corrects a moment later
        // without a second server round-trip for the schedule itself.
        function buildRecipientLineHtml(s) {
            var mode = s.RecipientMode || 'All';
            var toText;
            if (mode === 'Specific') {
                var ids = s.SpecificUserIds || [];
                var groupIds = s.SpecificGroupIds || [];
                if (ids.length === 0 && groupIds.length === 0) {
                    toText = '<b>' + esc(t('recipientSpecific')) + '</b>';
                } else {
                    // Groups are listed first, each prefixed so they read as distinct from
                    // individually-picked users in the same "+N more" list.
                    var names = groupIds.map(function (id) { return '👥 ' + resolveGroupName(id); })
                        .concat(ids.map(resolveUserName));
                    var shown = names.slice(0, RECIPIENT_NAMES_SHOWN_COLLAPSED);
                    toText = '<b class="bcm-recipient-names">' + esc(shown.join(', ')) + '</b>';
                    if (names.length > RECIPIENT_NAMES_SHOWN_COLLAPSED) {
                        // The remaining count is stored explicitly in data-remaining (rather than
                        // re-derived later by splitting data-all on ', ') so a display name that
                        // itself happens to contain ", " can never throw the count off.
                        toText += ' <span class="bcm-recipient-more" data-all="' + esc(names.join(', ')) + '" ' +
                            'data-collapsed="' + esc(shown.join(', ')) + '" data-expanded="0" ' +
                            'data-remaining="' + (names.length - RECIPIENT_NAMES_SHOWN_COLLAPSED) + '">' +
                            esc(fmt('recipientMoreLink', names.length - RECIPIENT_NAMES_SHOWN_COLLAPSED)) + '</span>';
                    }
                }
            } else {
                toText = '<b>' + esc(mode === 'Active' ? t('recipientActive') : t('recipientAll')) + '</b>';
            }
            return '<div class="bcm-recipient-line">' + esc(t('recipientToLabel')) + ' ' + toText + '</div>';
        }

        // Wires up the "+N more"/"show less" toggle for truncated "Selected users" recipient
        // lines - swaps the visible name list and the link's own label between the two states,
        // entirely client-side (no re-fetch needed, the full name list is already in the DOM via
        // data-all/data-collapsed).
        function wireRecipientMoreLinks(container) {
            container.querySelectorAll('.bcm-recipient-more').forEach(function (link) {
                link.addEventListener('click', function () {
                    var namesEl = this.previousElementSibling;
                    var expanded = this.getAttribute('data-expanded') === '1';
                    if (expanded) {
                        namesEl.textContent = this.getAttribute('data-collapsed');
                        this.textContent = fmt('recipientMoreLink', this.getAttribute('data-remaining'));
                        this.setAttribute('data-expanded', '0');
                    } else {
                        namesEl.textContent = this.getAttribute('data-all');
                        this.textContent = t('recipientShowLess');
                        this.setAttribute('data-expanded', '1');
                    }
                });
            });
        }

        // ---------------- timer / countdown ----------------

        var DEFAULT_PRESETS = [60, 30, 15, 5, 1];
        var enabledPresets = DEFAULT_PRESETS.slice();
        // The presets as loaded with the page (PluginConfiguration.TimerPresetMinutesCsv, or the
        // built-in defaults) - what the form returns to after a timer has been started.
        var savedPresets = DEFAULT_PRESETS.slice();

        // The chip row shows the hard-coded defaults plus whatever is currently enabled (typed
        // into the custom field or toggled on), recomputed fresh on every render - so a custom
        // value shows a chip while it's present in enabledPresets, and that chip disappears again
        // as soon as the value is removed from the custom field. (Previously this used a
        // "knownPresets" array that only ever grew, so removed custom values left orphaned chips
        // behind - fixed by not persisting any chip state beyond enabledPresets + the defaults.)
        function getChipValues() {
            var vals = DEFAULT_PRESETS.slice();
            enabledPresets.forEach(function (v) {
                if (vals.indexOf(v) === -1) vals.push(v);
            });
            return vals;
        }

        function renderPresetChips() {
            var container = view.querySelector('.timer-preset-chips');
            container.innerHTML = '';
            getChipValues().sort(function (a, b) { return b - a; }).forEach(function (p) {
                var chip = document.createElement('span');
                chip.className = 'bcm-preset-chip' + (enabledPresets.indexOf(p) !== -1 ? ' active' : '');
                chip.textContent = p + ' ' + t('presetUnit');
                chip.addEventListener('click', function () {
                    var idx = enabledPresets.indexOf(p);
                    if (idx === -1) enabledPresets.push(p); else enabledPresets.splice(idx, 1);
                    syncCustomPresetField();
                    renderPresetChips();
                    updateTimerPreview();
                });
                container.appendChild(chip);
            });
        }

        function syncCustomPresetField() {
            view.querySelector('.timer-preset-custom').value = enabledPresets.slice().sort(function (a, b) { return b - a; }).join(',');
        }

        // "input" (not "change") so the chip row updates live as the admin types, instead of
        // only after the field loses focus.
        view.querySelector('.timer-preset-custom').addEventListener('input', function () {
            var raw = this.value || '';
            enabledPresets = raw.split(',').map(function (s) { return parseInt(s.trim(), 10); })
                .filter(function (n) { return !isNaN(n) && n > 0; });
            renderPresetChips();
            updateTimerPreview();
        });

        // Mirrors TimerService.RenderFinalText() server-side (see Services/TimerService.cs):
        // collapses "in {minutes} minute(s)"/"in {minutes} Minute(n)" to "now"/"jetzt" so the
        // last preview line reads the same way the actual final message will.
        var FINAL_PHRASE_EN = /in\s*\{minutes\}\s*minute\(s\)/i;
        var FINAL_PHRASE_DE = /in\s*\{minutes\}\s*Minute\(n\)/i;
        // "None" defaults: "Countdown: {minutes} minute(s) remaining" / "Countdown: noch
        // {minutes} Minute(n)" -> "Countdown: finished" / "Countdown: abgelaufen".
        var FINAL_REMAINING_EN = /\{minutes\}\s*minute\(s\)\s*remaining/i;
        var FINAL_REMAINING_DE = /noch\s*\{minutes\}\s*Minute\(n\)/i;
        function renderFinalText(template) {
            var text = template || '';
            if (FINAL_REMAINING_EN.test(text)) return text.replace(FINAL_REMAINING_EN, 'finished');
            if (FINAL_REMAINING_DE.test(text)) return text.replace(FINAL_REMAINING_DE, 'abgelaufen');
            if (FINAL_PHRASE_EN.test(text)) return text.replace(FINAL_PHRASE_EN, 'now');
            if (FINAL_PHRASE_DE.test(text)) return text.replace(FINAL_PHRASE_DE, 'jetzt');
            return text.replace('{minutes}', '0');
        }

        function updateTimerPreview() {
            var header = view.querySelector('.timer-header').value.trim() || t('defaultTimerHeader');
            var template = effectiveTimerTemplate();
            var total = parseInt(view.querySelector('.timer-total').value, 10) || 0;
            // "<= total" (not "<"): a preset equal to the total countdown fires immediately at
            // t=0, so it belongs in the preview too - matches TimerService.StartTimer's filter.
            var presets = enabledPresets.filter(function (p) { return p <= total; })
                .slice().sort(function (a, b) { return b - a; });

            // Short pop-ups have no title and keep no line breaks - show them that way too.
            var toast = getDisplayMode('timer') === 'toast';
            var line = function (text) {
                return toast ? joinLinesForToast(text) : '[' + header + '] ' + text;
            };
            var lines = presets.map(function (p) {
                return line(template.replace('{minutes}', p));
            });
            lines.push(line(renderFinalText(template)));
            view.querySelector('.timer-preview').textContent = lines.join('\n');
        }

        ['timer-header', 'timer-text', 'timer-total'].forEach(function (cls) {
            view.querySelector('.' + cls).addEventListener('input', updateTimerPreview);
        });

        // Swaps the message template to match the selected post-countdown action (unless the
        // admin already customized it) - see updateTimerTextForAction above.
        view.querySelector('.timer-postaction').addEventListener('change', function () {
            updateTimerTextForAction(this.value);
            updateTimerPreview();
        });

        // Swaps the main button's label between "Start Timer"/"Schedule Timer" based on the
        // "Start later" checkbox - reads the checkbox itself rather than taking a parameter, and
        // is called both from the checkbox's own change handler below AND from setLanguage() (see
        // that function), since applyStaticTranslations() would otherwise reset the button back to
        // its data-i18n default ("Start Timer") on every language switch regardless of which mode
        // is actually active - a plain one-time textContent assignment isn't enough to survive that.
        function updateTimerStartButtonLabel() {
            var scheduleEnabled = view.querySelector('.timer-schedule-enabled').checked;
            view.querySelector('.timer-start').textContent = t(scheduleEnabled ? 'btnScheduleTimer' : 'btnStartTimer');
        }

        // Toggling "Start later" shows/hides the date & time picker and swaps the main button's
        // label (Start Timer / Schedule Timer) so it's always obvious which action a click will
        // actually perform - purely cosmetic, the real branching happens server-side based on
        // whether ScheduledStartUtc is sent at all (see EmbyCastApi.Post(StartTimer)).
        view.querySelector('.timer-schedule-enabled').addEventListener('change', function () {
            view.querySelector('.timer-schedule-datetime-wrap').style.display = this.checked ? '' : 'none';
            updateTimerStartButtonLabel();
        });

        view.querySelector('.timer-start').addEventListener('click', function () {
            var header = headerForSend('timer', 'defaultTimerHeader');
            var template = effectiveTimerTemplate();
            var total = parseInt(view.querySelector('.timer-total').value, 10) || 0;
            var timeoutMs = displayTimeoutMs('timer');
            var postAction = view.querySelector('.timer-postaction').value;
            var statusEl = view.querySelector('.timer-status');

            if (total <= 0) { showStatus(statusEl, t('msgTimerInvalidTotal'), 'err'); return; }

            var scheduleEnabled = view.querySelector('.timer-schedule-enabled').checked;
            var scheduledStartUtc = null;
            if (scheduleEnabled) {
                var dtVal = view.querySelector('.timer-schedule-datetime').value;
                var picked = dtVal ? new Date(dtVal) : null;
                if (!picked || isNaN(picked.getTime()) || picked <= new Date()) {
                    showStatus(statusEl, t('msgPleaseSetDateTime'), 'err');
                    return;
                }
                scheduledStartUtc = picked.toISOString();
            }

            var mode = getRecipientMode('timer');
            var userIds = mode === 'Specific' ? getSelectedUserIds('timer') : [];
            var groupIds = mode === 'Specific' ? getSelectedGroupIds('timer') : [];
            if (mode === 'Specific' && userIds.length === 0 && groupIds.length === 0) { showStatus(statusEl, t('msgPleaseSelectUsers'), 'err'); return; }

            var payload = {
                Header: header, TextTemplate: template, TotalMinutes: total,
                PresetMinutes: enabledPresets, PostAction: postAction,
                RecipientMode: mode, UserIds: userIds, GroupIds: groupIds, TimeoutMs: timeoutMs
            };
            if (scheduledStartUtc) payload.ScheduledStartUtc = scheduledStartUtc;

            ajax('POST', 'EmbyCast/Timer/Start', payload).then(function (result) {
                // The single-timer slot may already be occupied - see EmbyCastApi.
                // Post(StartTimer)'s guard, which returns {Success:false, AlreadyExists:true}
                // (a normal 200 response, not a thrown error) precisely so this can show a clear,
                // specific status message instead of a generic "Error: ...".
                if (result && result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                if (result && result.Success === false) {
                    showStatus(statusEl, t('msgTimerAlreadyExists'), 'err');
                    return;
                }
                showStatus(statusEl, t(scheduledStartUtc ? 'msgTimerScheduled' : 'msgTimerStarted'), 'ok');
                view.querySelector('.timer-header').value = t('defaultTimerHeader');
                resetTimerTextToDefault(postAction);
                view.querySelector('.timer-total').value = 60;
                setDisplayMode('timer', 'toast');
                enabledPresets = savedPresets.slice();
                syncCustomPresetField();
                renderPresetChips();
                resetRecipientGroup('timer', 'Active');
                updateTimerPreview();
                view.querySelector('.timer-schedule-enabled').checked = false;
                view.querySelector('.timer-schedule-datetime-wrap').style.display = 'none';
                view.querySelector('.timer-schedule-datetime').value = '';
                updateTimerStartButtonLabel();
                startTimerPolling();
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        view.querySelector('.timer-cancel').addEventListener('click', function () {
            var statusEl = view.querySelector('.timer-status');
            ajax('POST', 'EmbyCast/Timer/Cancel').then(function (result) {
                // CancelTimer returns {Success:false} when there was nothing active or pending to
                // cancel (see TimerService.CancelTimer) - only show the "cancelled" confirmation
                // when something was actually cancelled, rather than unconditionally.
                if (result && result.Success === false) {
                    showStatus(statusEl, t('msgTimerNoneActive'), 'ok');
                } else {
                    showStatus(statusEl, t('msgTimerCancelled'), 'ok');
                }
                refreshTimerStatus();
            });
        });

        var lastTimerStatus = null;
        // Separate from lastTimerStatus above (which is Active-only, driving the live countdown
        // chip/bar): tracks a scheduled-but-not-yet-started timer, for the tile dot badge and the
        // "Offene Aufträge" list. Never both non-null at once (Active and Pending are mutually
        // exclusive - see TimerStatusDto).
        var lastTimerPending = null;

        // Shared by the Timer card's own countdown text and the tile grid's countdown badge (see
        // renderTileBadges()), so both always agree and a tile reorder (which recreates the tile
        // grid's DOM, see renderTileGrid()) can immediately paint the current value instead of
        // showing a stale "--:--:--" placeholder until the next 1s poll tick.
        function formatHms(totalSeconds) {
            var remaining = Math.max(0, totalSeconds || 0);
            var h = Math.floor(remaining / 3600);
            var m = Math.floor((remaining % 3600) / 60);
            var s = remaining % 60;
            var pad = function (n) { return (n < 10 ? '0' : '') + n; };
            return pad(h) + ':' + pad(m) + ':' + pad(s);
        }

        // Builds the "Upcoming Timer & Server Countdown" card for a Pending (scheduled but not
        // yet started) timer - same visual treatment as the "Upcoming scheduled messages" list
        // (reuses .bcm-history-item/.bcm-history-head and buildRecipientLineHtml, which already
        // works off any object exposing RecipientMode/SpecificUserIds/SpecificGroupIds, see
        // TimerStatusDto). Unlike that list there's ever only one entry, since only one timer job
        // can exist at a time (see TimerService.HasActiveOrPendingTimer).
        function renderTimerUpcoming(status) {
            var wrap = view.querySelector('.timer-upcoming-wrap');
            var el = view.querySelector('.timer-upcoming-list');
            if (!status || !status.Pending) {
                wrap.style.display = 'none';
                el.innerHTML = '';
                return;
            }
            var when = fmt('timerStartsAt', localeDateTimeString(new Date(status.ScheduledStartUtc)));
            el.innerHTML =
                '<div class="bcm-history-item">' +
                '<div class="bcm-history-head">' +
                '<span><strong>' + esc(displayTitle(status.Header, status.TimeoutMs)) + '</strong> &mdash; ' + esc(when) + '</span>' +
                '<button class="bcm-dismiss timer-upcoming-cancel-btn">' + esc(t('msgCancel')) + '</button>' +
                '</div>' +
                buildRecipientLineHtml(status) +
                '<div style="font-size:.88em;opacity:.75;">' + esc(status.TextTemplate || '') + '</div>' +
                '</div>';
            el.querySelector('.timer-upcoming-cancel-btn').addEventListener('click', function () {
                var statusEl = view.querySelector('.timer-status');
                ajax('POST', 'EmbyCast/Timer/Cancel').then(function () {
                    showStatus(statusEl, t('msgTimerCancelled'), 'ok');
                    refreshTimerStatus();
                });
            });
            wireRecipientMoreLinks(el);
            wrap.style.display = '';
        }

        function refreshTimerStatus() {
            ajax('GET', 'EmbyCast/Timer/Status').then(function (status) {
                lastTimerStatus = (status && status.Active) ? status : null;
                lastTimerPending = (status && status.Pending) ? status : null;
                var visual = view.querySelector('.timer-visual');
                renderTimerUpcoming(status);

                if (!status || (!status.Active && !status.Pending)) {
                    visual.style.display = 'none';
                    stopTimerPolling();
                    renderTileBadges();
                    renderOpenOrders();
                    return;
                }

                if (!status.Active) {
                    // Pending: nothing to tick down yet - still poll (see below) so this flips
                    // over to the live countdown automatically once the server actually starts it.
                    visual.style.display = 'none';
                    if (!timerPollHandle) { timerPollHandle = window.setInterval(refreshTimerStatus, 1000); }
                    renderTileBadges();
                    renderOpenOrders();
                    return;
                }

                visual.style.display = 'block';
                var remaining = Math.max(0, status.SecondsRemaining || 0);
                var text = formatHms(remaining);
                view.querySelector('.timer-countdown-text').textContent = text;

                var totalSeconds = (new Date(status.EndUtc) - new Date(status.StartUtc)) / 1000;
                var elapsedRatio = totalSeconds > 0 ? (1 - remaining / totalSeconds) : 0;
                view.querySelector('.bcm-countdown-bar-fill').style.width = Math.min(100, Math.max(0, elapsedRatio * 100)) + '%';

                // Pre-existing gap fixed here: previously, an active timer's polling only ever
                // started from the "Start Timer" button click - a page reload (or first init())
                // while a timer was already running left this countdown showing a static,
                // non-ticking snapshot until the admin next interacted with the Start button. Since
                // this function itself now knows the timer is Active, it can just resume polling on
                // its own if nothing is polling yet. startTimerPolling() calls this function
                // immediately and THEN sets the interval, so this guard (not startTimerPolling
                // itself) is what actually breaks the recursion.
                if (!timerPollHandle) { timerPollHandle = window.setInterval(refreshTimerStatus, 1000); }

                renderTileBadges();
                renderOpenOrders();
            }, function () { stopTimerPolling(); });
        }

        function startTimerPolling() {
            stopTimerPolling();
            refreshTimerStatus();
        }
        function stopTimerPolling() {
            if (timerPollHandle) { window.clearInterval(timerPollHandle); timerPollHandle = null; }
        }

        // ---------------- media news ----------------

        // Content types Media News can ever pick anything up from - it only ever queries for
        // Movie/Series items, so a library Emby scans purely as e.g. music or audiobooks can
        // never contribute regardless of selection. "" / "mixed" (unset content type) is kept
        // as potentially relevant since such a folder can contain anything, movies/series
        // included. Libraries whose type isn't in this set are filtered out of the checklist
        // entirely below - showing a checkbox that can never do anything is more confusing than
        // just not listing it.
        var MEDIANEWS_SUPPORTED_CONTENT_TYPES = { movies: true, tvshows: true, mixed: true, '': true };

        // Shown verbatim (lowercase, as Emby's own API reports it - "movies", "tvshows", ...)
        // rather than translated, so it always matches the exact value visible/configured in
        // Emby itself regardless of dashboard language.
        function contentTypeLabel(raw) {
            var key = (raw || '').toLowerCase();
            return key === '' ? 'mixed' : key;
        }

        function loadLibraries() {
            ajax('GET', 'EmbyCast/Libraries').then(function (libs) {
                librariesCache = (libs || []).filter(function (lib) {
                    var typeKey = (lib.ContentType || '').toLowerCase();
                    return Object.prototype.hasOwnProperty.call(MEDIANEWS_SUPPORTED_CONTENT_TYPES, typeKey);
                });
                var el = view.querySelector('.medianews-libraries');
                if (librariesCache.length === 0) {
                    el.innerHTML = '<p style="opacity:.4;font-size:.85em;margin:0;">' + esc(t('msgNoSupportedLibraries')) + '</p>';
                    return;
                }
                el.innerHTML = '';
                librariesCache.forEach(function (lib) {
                    var label = document.createElement('label');
                    var text = lib.Name + ' (' + contentTypeLabel(lib.ContentType) + ')';
                    label.innerHTML = '<input type="checkbox" value="' + esc(lib.Id) + '" /> <span>' + esc(text) + '</span>';
                    el.appendChild(label);
                });
            });
        }

        function getSelectedLibraryIds() {
            return Array.prototype.slice.call(view.querySelectorAll('.medianews-libraries input[type=checkbox]:checked'))
                .map(function (cb) { return cb.value; });
        }

        // "Series entries" used to be a single either/or radio choice; the two
        // options are now independent checkboxes, so both, either, or neither can be selected.
        function getIncludeNewSeries() {
            return view.querySelector('.medianews-include-series').checked;
        }

        function getIncludeNewEpisodes() {
            return view.querySelector('.medianews-include-episodes').checked;
        }

        function getEpisodeTemplate() {
            return view.querySelector('.medianews-episode-template').value;
        }

        function toggleEpisodeTemplateField() {
            view.querySelector('.medianews-episode-template-field').style.display = getIncludeNewEpisodes() ? '' : 'none';
        }
        view.querySelector('.medianews-include-episodes').addEventListener('change', toggleEpisodeTemplateField);

        // Inserts a placeholder token at the current cursor position in the episode-template
        // field (replacing any selected text), rather than just appending it to the end - lets
        // the admin freely rearrange {Series name (year)} / {SxxExx} / {Episode title} without
        // having to retype anything.
        function insertAtCursor(input, text) {
            var start = typeof input.selectionStart === 'number' ? input.selectionStart : input.value.length;
            var end = typeof input.selectionEnd === 'number' ? input.selectionEnd : input.value.length;
            input.value = input.value.slice(0, start) + text + input.value.slice(end);
            var pos = start + text.length;
            if (typeof input.setSelectionRange === 'function') input.setSelectionRange(pos, pos);
            input.focus();
        }
        view.querySelectorAll('.medianews-placeholder-chips .bcm-preset-chip').forEach(function (chip) {
            chip.addEventListener('click', function () {
                insertAtCursor(view.querySelector('.medianews-episode-template'), chip.getAttribute('data-placeholder'));
            });
        });

        function buildMediaNewsPayload() {
            var header = view.querySelector('.medianews-header').value.trim() || t('defaultMediaNewsHeader');
            var days = parseInt(view.querySelector('.medianews-days').value, 10) || 7;
            return {
                LookbackDays: days, LibraryIds: getSelectedLibraryIds(), Header: header, Language: currentLang,
                IncludeNewSeries: getIncludeNewSeries(), IncludeNewEpisodes: getIncludeNewEpisodes(), EpisodeTemplate: getEpisodeTemplate()
            };
        }

        // Given a set of selected library ids, resolves which content categories they could ever
        // actually contribute, using each library's ContentType from librariesCache (populated by
        // loadLibraries()). Mirrors the real backend (MediaNewsService.BuildSinceDays) closely
        // enough for preview purposes: that method filters purely by folder PATH, not by a
        // library's configured content type, so a library typed "movies" can never yield a
        // Series/Episode item and vice versa - only a "mixed"/unset-type library (or blank/null,
        // which the dashboard displays as "mixed") could contain either. Keeps the structural
        // preview from listing sections the real send could never contain.
        function getMediaNewsLibraryTypeFlags(selectedIds) {
            var wanted = {};
            (selectedIds || []).forEach(function (id) { wanted[id] = true; });
            var hasMovie = false, hasSeries = false;
            (librariesCache || []).forEach(function (lib) {
                if (!wanted[lib.Id]) return;
                var type = (lib.ContentType || '').toLowerCase();
                if (type === 'movies' || type === 'mixed' || type === '') hasMovie = true;
                if (type === 'tvshows' || type === 'mixed' || type === '') hasSeries = true;
            });
            return { hasMovie: hasMovie, hasSeries: hasSeries };
        }

        // Returns a red validation message when the CURRENTLY SELECTED libraries + "Series
        // entries" checkboxes can never produce anything to send, or null when the selection is
        // fine. Cases:
        //  - no library selected at all (libraryOnlyMessageKey - existing msgPleaseSelectLibrary /
        //    msgPleaseSelectLibraryForAuto, picked by the caller since the wording differs
        //    slightly between "before sending" and "before enabling automatic sending").
        //  - only series-capable (tvshows/mixed) libraries selected, but NEITHER "Newly added
        //    series" nor "New episodes" is checked - a config mistake that would stay empty
        //    forever, not "nothing new happened". A movie-capable library needs no such
        //    checkbox of its own - see buildMediaNewsStructureLines - so this only fires when
        //    there's no movie-capable library in the mix either.
        // Shared by the main "Show preview" button, the "Send Media News Now" button, the
        // auto-send section's own "Show preview" button, and "Save Auto-send Settings".
        function getMediaNewsSelectionError(libraryOnlyMessageKey) {
            var ids = getSelectedLibraryIds();
            if (ids.length === 0) return t(libraryOnlyMessageKey);
            var flags = getMediaNewsLibraryTypeFlags(ids);
            if (!flags.hasMovie && flags.hasSeries && !getIncludeNewSeries() && !getIncludeNewEpisodes()) {
                return t('msgPleaseSelectSeriesEntries');
            }
            return null;
        }

        // Builds a purely structural preview of the message - the section labels and a
        // placeholder-style description line for each (using the currently configured Header and
        // lookback-days), rather than the actual movie/show titles that would be found. Used ONLY
        // by the two "Send automatically every 7 days" preview buttons (the auto-send form and the
        // saved-config card), where only the shape/wording of the weekly message matters. The
        // "Send Media News Now" preview stays a real server-side preview (see the
        // .medianews-preview-btn handler below), since that button sends immediately.
        //
        // hasMovieLibrary/hasSeriesLibrary (see getMediaNewsLibraryTypeFlags above): "New Movies"
        // is shown only when a movie-capable library is selected, and "New TV Shows"/"New Episodes"
        // only when BOTH a series-capable library is selected AND the respective checkbox is on.
        // With neither a movie- nor series-capable library selected (which, given every listed
        // library is movies/tvshows/mixed/unset - see MEDIANEWS_SUPPORTED_CONTENT_TYPES - only
        // happens when nothing at all is checked), the "no library selected" line is shown instead
        // of an empty/misleading set of sections.
        function buildMediaNewsStructureLines(header, days, includeSeries, includeEpisodes, hasMovieLibrary, hasSeriesLibrary) {
            var lines = ['[' + header + ']'];
            if (!hasMovieLibrary && !hasSeriesLibrary) {
                lines.push(t('mediaNewsStructureNoLibrary'));
                return lines.join('\n');
            }
            if (hasMovieLibrary) lines.push(t('mediaNewsStructureMovies'), fmt('mediaNewsStructureMoviesLine', days));
            if (hasSeriesLibrary && includeSeries) lines.push('', t('mediaNewsStructureSeries'), fmt('mediaNewsStructureSeriesLine', days));
            if (hasSeriesLibrary && includeEpisodes) lines.push('', t('mediaNewsStructureEpisodes'), fmt('mediaNewsStructureEpisodesLine', days));
            return lines.join('\n');
        }

        // For the auto-send form's own preview button - reads straight from whatever is
        // currently in the shared form fields (including the library checkboxes), matching what
        // buildMediaNewsPayload()/the auto-send save payload would use.
        function buildMediaNewsStructurePreviewText() {
            var header = view.querySelector('.medianews-header').value.trim() || t('defaultMediaNewsHeader');
            var days = parseInt(view.querySelector('.medianews-days').value, 10) || 7;
            var flags = getMediaNewsLibraryTypeFlags(getSelectedLibraryIds());
            return buildMediaNewsStructureLines(header, days, getIncludeNewSeries(), getIncludeNewEpisodes(), flags.hasMovie, flags.hasSeries);
        }

        // For the "upcoming auto-send" card's saved-config preview - reads from the SAVED
        // MediaNewsAutoStatusDto (see renderMediaNewsAutoStatus below) rather than the form, same
        // "saved, not whatever's unsaved in the form" distinction the old PreviewSaved endpoint
        // existed for. HasMovieLibrarySelected/HasSeriesLibrarySelected come from the server (see
        // EmbyCastApi.cs's MediaNewsAutoStatusDto) since this DTO otherwise carries no library
        // information at all.
        function buildMediaNewsStructurePreviewTextFromStatus(status) {
            var header = (status && status.Header) || t('defaultMediaNewsHeader');
            var days = (status && status.LookbackDays) || 7;
            return buildMediaNewsStructureLines(header, days, !!(status && status.IncludeNewSeries), !!(status && status.IncludeNewEpisodes),
                !!(status && status.HasMovieLibrarySelected), !!(status && status.HasSeriesLibrarySelected));
        }

        // Sets a preview button/box pair to a definite shown/hidden state - tracked via a
        // data-shown attribute on the box itself (rather than inferring it from style.display)
        // so toggleMediaNewsPreview below has one unambiguous source of truth to read back.
        function setPreviewShown(btn, previewEl, shown) {
            previewEl.style.display = shown ? '' : 'none';
            previewEl.dataset.shown = shown ? '1' : '0';
            if (btn) btn.textContent = shown ? t('btnHidePreview') : t('btnPreviewMediaNews');
        }

        // Shared by all three "Preview" buttons on this card (main section, auto-send section,
        // and the "upcoming auto-send" card's own button) - each passes its own preview/status
        // elements and its own text-producing function. The main-section button's fetchPromiseFn
        // hits the real server endpoint (EmbyCast/MediaNews/Preview - see its own handler below);
        // the two auto-send buttons instead build a purely structural preview client-side (see
        // buildMediaNewsStructurePreviewText[FromStatus]) and just wrap it in Promise.resolve so
        // this same toggle/show/hide/close-button plumbing works for both kinds unchanged.
        // Toggles: a second click while already shown just hides it again - only a click while
        // hidden (re)builds/refetches the text.
        //
        // validateFn (optional) runs only when about to SHOW a new preview (not when just hiding
        // an already-shown one) - used by the main-section button AND the auto-send form's own
        // button (both via getMediaNewsSelectionError) to require a valid library/series-checkbox
        // selection before showing anything (same guard the send button itself applies).
        // Only the "upcoming auto-send" card's own saved-config preview button passes none, since
        // a saved config that was valid at save time needs no further gating here.
        function toggleMediaNewsPreview(btn, previewEl, statusEl, fetchPromiseFn, validateFn) {
            if (previewEl.dataset.shown === '1') {
                setPreviewShown(btn, previewEl, false);
                return;
            }
            if (validateFn) {
                var validationError = validateFn();
                if (validationError) { showStatus(statusEl, validationError, 'err'); return; }
            }
            showStatus(statusEl, t('msgMediaNewsPreviewing'), 'ok');
            fetchPromiseFn().then(function (result) {
                if (result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                if (result.Empty) {
                    showStatus(statusEl, t('msgMediaNewsPreviewEmpty'), 'ok');
                    setPreviewShown(btn, previewEl, false);
                    return;
                }
                statusEl.classList.remove('ok', 'err');
                previewEl.textContent = result.Text;
                // Small top-right "x" so a long, scrolled-down preview (see .medianews-preview's
                // max-height/overflow-y in app.html) can always be dismissed without scrolling
                // back up to the toggle button. Built fresh here (rather than living as static
                // HTML) because the textContent assignment just above wipes out any previous
                // children of previewEl - this always runs right after that, so it's never lost.
                var closeBtn = document.createElement('button');
                closeBtn.type = 'button';
                closeBtn.className = 'bcm-preview-close';
                closeBtn.setAttribute('aria-label', t('btnClosePreview'));
                closeBtn.title = t('btnClosePreview');
                closeBtn.textContent = '×';
                closeBtn.addEventListener('click', function () { setPreviewShown(btn, previewEl, false); });
                previewEl.appendChild(closeBtn);
                setPreviewShown(btn, previewEl, true);
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        }

        view.querySelector('.medianews-preview-btn').addEventListener('click', function () {
            var btn = this;
            // "Send Media News Now" sends immediately on click, so its preview must show the
            // real message that would go out - real server-side content preview (hits the
            // library, same as an actual send would), not the structural placeholder used by the
            // two auto-send preview buttons below. See toggleMediaNewsPreview's doc comment.
            toggleMediaNewsPreview(btn, view.querySelector('.medianews-preview'), view.querySelector('.medianews-status'),
                function () { return ajax('POST', 'EmbyCast/MediaNews/Preview', buildMediaNewsPayload()); },
                function () { return getMediaNewsSelectionError('msgPleaseSelectLibrary'); });
        });

        view.querySelector('.medianews-send').addEventListener('click', function () {
            var statusEl = view.querySelector('.medianews-status');
            // Same selection check the preview button already uses (see its own validateFn just
            // above) - catches "TV-only library, no series checkbox" before it even reaches the
            // server, instead of only after a round trip that would just report "no new media".
            var selectionError = getMediaNewsSelectionError('msgPleaseSelectLibrary');
            if (selectionError) { showStatus(statusEl, selectionError, 'err'); return; }
            var mode = getRecipientMode('medianews');
            var userIds = mode === 'Specific' ? getSelectedUserIds('medianews') : [];
            var groupIds = mode === 'Specific' ? getSelectedGroupIds('medianews') : [];
            if (mode === 'Specific' && userIds.length === 0 && groupIds.length === 0) { showStatus(statusEl, t('msgPleaseSelectUsers'), 'err'); return; }

            setPreviewShown(view.querySelector('.medianews-preview-btn'), view.querySelector('.medianews-preview'), false);
            showStatus(statusEl, t('msgMediaNewsSending'), 'ok');
            var payload = buildMediaNewsPayload();
            payload.RecipientMode = mode;
            payload.UserIds = userIds;
            payload.GroupIds = groupIds;
            payload.WebOnly = view.querySelector('.medianews-webonly').checked;
            ajax('POST', 'EmbyCast/MediaNews/Send', payload).then(function (result) {
                if (result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                // Any Skipped outcome (no library selected, or no new media in the selected
                // period) is shown red. NoLibrarySelected still exists on the DTO for anyone
                // needing to distinguish the two reasons, but the dashboard treats both the same
                // here.
                showStatus(statusEl, result.Message, result.Skipped ? 'err' : 'ok');
                loadHistory();
                loadCleanupStats();
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        function toggleAutoFields() {
            var enabled = view.querySelector('.medianews-auto-enabled').checked;
            view.querySelector('.medianews-auto-fields').style.opacity = enabled ? '1' : '.45';
        }
        view.querySelector('.medianews-auto-enabled').addEventListener('change', toggleAutoFields);

        // Matches C#'s DayOfWeek enum member names exactly (Sunday=0..Saturday=6, same order as
        // JS Date.getDay()/getUTCDay()) - these are also the exact <option value="..."> strings
        // used by .medianews-auto-day in app.html, and what SaveMediaNewsAutoConfig.Day binds
        // to server-side (ServiceStack parses the enum from its name).
        var DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        // The "Weekday"/"Time" fields show and accept the admin's LOCAL wall-clock time, but
        // MediaNewsAutoScheduler (server-side) runs its polling loop entirely on DateTime.UtcNow
        // and PluginConfiguration.MediaNewsAutoSendDay/Hour/Minute are UTC - see the doc comment
        // there. Previously the raw local Hour/Minute were sent straight through and silently
        // treated as UTC server-side, which is exactly the bug the user reported (choosing 10:03
        // local actually fired at 12:03 local in a UTC+2 zone, i.e. the server used "10:03" as if
        // it were already UTC). These two helpers convert local <-> UTC entirely in the browser
        // using plain JS Date arithmetic, including rolling the WEEKDAY forward/back a day when
        // the conversion crosses midnight (e.g. a very late/early local time near a UTC offset
        // boundary). Known limitation: the conversion uses whatever UTC offset is in effect at
        // the moment of saving/loading, not the offset that will actually be in effect on the
        // future send date - so the local send time can drift by an hour across a DST transition
        // until the admin re-saves. Implementing full DST-aware recurring scheduling would need a
        // reliable IANA timezone id resolvable on every OS/runtime this plugin's server-side code
        // might run on, which isn't something this project can verify without a real server to
        // test against - documented here and in PluginConfiguration.cs rather than guessed at.
        function localDayTimeToUtc(dayName, hour, minute) {
            var now = new Date();
            var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
            var targetIdx = DAY_NAMES.indexOf(dayName);
            var diff = ((targetIdx === -1 ? d.getDay() : targetIdx) - d.getDay() + 7) % 7;
            d.setDate(d.getDate() + diff);
            return { day: DAY_NAMES[d.getUTCDay()], hour: d.getUTCHours(), minute: d.getUTCMinutes() };
        }

        function utcDayTimeToLocal(dayName, hour, minute) {
            var now = new Date();
            var d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, minute, 0, 0));
            var targetIdx = DAY_NAMES.indexOf(dayName);
            var diff = ((targetIdx === -1 ? d.getUTCDay() : targetIdx) - d.getUTCDay() + 7) % 7;
            d.setUTCDate(d.getUTCDate() + diff);
            return { day: DAY_NAMES[d.getDay()], hour: d.getHours(), minute: d.getMinutes() };
        }

        // Shared by both the Save button and the "Cancel" button on the upcoming-send card below,
        // so cancelling never accidentally resets Weekday/Time/Libraries/etc. to the request
        // DTO's own hard-coded defaults by only sending Enabled:false - the server has no other
        // way to know the admin's previously-saved values than what's actually in this payload.
        function buildAutoConfigPayload(enabledOverride) {
            var enabled = enabledOverride !== undefined ? enabledOverride : view.querySelector('.medianews-auto-enabled').checked;
            var localDay = view.querySelector('.medianews-auto-day').value;
            var timeVal = view.querySelector('.medianews-auto-time').value || '18:00';
            var parts = timeVal.split(':');
            var localHour = parseInt(parts[0], 10) || 0;
            var localMinute = parseInt(parts[1], 10) || 0;
            var utc = localDayTimeToUtc(localDay, localHour, localMinute);
            var days = parseInt(view.querySelector('.medianews-days').value, 10) || 7;

            return {
                Enabled: enabled, Day: utc.day, Hour: utc.hour, Minute: utc.minute,
                LookbackDays: days, LibraryIdsCsv: getSelectedLibraryIds().join(','),
                RecipientMode: getRecipientMode('medianews'),
                SpecificUserIdsCsv: getSelectedUserIds('medianews').join(','),
                SpecificGroupIdsCsv: getSelectedGroupIds('medianews').join(','),
                SkipWhenEmpty: true,
                Header: view.querySelector('.medianews-header').value.trim() || t('defaultMediaNewsHeader'),
                IncludeNewSeries: getIncludeNewSeries(), IncludeNewEpisodes: getIncludeNewEpisodes(), EpisodeTemplate: getEpisodeTemplate(),
                // Shared with the manual "Send Media News Now" checkbox above (same element,
                // same reasoning as RecipientMode/LibraryIdsCsv/etc.) - only actually applies to
                // the recurring weekly job once "Save Auto-send Settings" is clicked, same as
                // every other field built here. See PluginConfiguration.MediaNewsAutoWebOnly.
                WebOnly: view.querySelector('.medianews-webonly').checked
            };
        }

        // Human-readable summary of what "Automatik-Einstellungen speichern" is about to persist,
        // shown in a confirmation dialog before every save. Exists specifically so a value that
        // was only meant for a one-off manual test in the (shared) form fields above - e.g.
        // temporarily raising "Zeitraum (Tage)" to 90 to preview older content - can't silently
        // get baked into the recurring weekly job just because it was still sitting in the form
        // when Save was clicked. Reads Weekday/Time straight from the form (not the UTC-converted
        // payload) so it matches exactly what the admin sees on screen.
        function buildAutoConfigSummaryText(payload) {
            var localDay = view.querySelector('.medianews-auto-day').value;
            var localTime = view.querySelector('.medianews-auto-time').value || '18:00';
            var recipientKey = payload.RecipientMode === 'All' ? 'recipientAll'
                : (payload.RecipientMode === 'Specific' ? 'recipientSpecific' : 'recipientActive');
            var selectedIds = payload.LibraryIdsCsv ? payload.LibraryIdsCsv.split(',') : [];
            var libNames = librariesCache.filter(function (lib) { return selectedIds.indexOf(lib.Id) !== -1; })
                .map(function (lib) { return lib.Name; });
            var seriesBits = [];
            if (payload.IncludeNewSeries) seriesBits.push(t('seriesModeNewSeries'));
            if (payload.IncludeNewEpisodes) seriesBits.push(t('seriesModeNewEpisodes'));

            var lines = [
                t('labelWeekday') + ': ' + t('day' + localDay) + ', ' + t('labelTime') + ': ' + localTime,
                t('labelLookbackDays') + ': ' + payload.LookbackDays,
                t('labelHeader') + ': ' + payload.Header,
                t('labelLibraries') + ': ' + (libNames.length ? libNames.join(', ') : t('valueNoneSelected')),
                t('labelSeriesMode') + ': ' + (seriesBits.length ? seriesBits.join(' / ') : t('valueNoneSelected')),
                t('labelRecipients') + ': ' + t(recipientKey)
            ];
            // Only called out when on, same as the saved-status card below (renderMediaNewsAutoStatus)
            // - keeps the confirmation summary short for the (still default) common case.
            if (payload.WebOnly) lines.push(t('labelWebOnly') + ': ' + t('autoCardWebOnly'));
            return lines.join('\n');
        }

        view.querySelector('.medianews-auto-preview-btn').addEventListener('click', function () {
            var btn = this;
            toggleMediaNewsPreview(btn, view.querySelector('.medianews-auto-preview'), view.querySelector('.medianews-auto-status'),
                function () { return Promise.resolve({ Text: buildMediaNewsStructurePreviewText() }); },
                function () { return getMediaNewsSelectionError('msgPleaseSelectLibraryForAuto'); });
        });

        view.querySelector('.medianews-auto-save').addEventListener('click', function () {
            var statusEl = view.querySelector('.medianews-auto-status');
            var payload = buildAutoConfigPayload();
            // "Automatik-Einstellungen speichern" only ever makes sense as "create/update the
            // recurring job", so both of its preconditions block outright with a plain status
            // message rather than a confirm() popup - same style as the "select at least
            // one user" guard elsewhere on this page. To turn an already-running job off, use the
            // "Cancel" button on the upcoming-send card below instead (cancelMediaNewsAutoSend) -
            // this button no longer doubles as a way to save-while-disabled.
            if (!payload.Enabled) {
                showStatus(statusEl, t('msgPleaseCheckAutoSend'), 'err');
                return;
            }
            // Enabling automatic sending with no library checked - or a TV-only library with
            // neither "Series entries" checkbox on - would silently never send anything, ever,
            // forever. (MediaNewsAutoScheduler also independently guards against the no-library
            // case server-side, in case an admin already had Enabled=true with no library saved
            // before this check existed - see its own "no library selected" log warning.)
            var selectionError = getMediaNewsSelectionError('msgPleaseSelectLibraryForAuto');
            if (selectionError) {
                showStatus(statusEl, selectionError, 'err');
                return;
            }
            confirmAction(fmt('msgConfirmSaveAutoConfig', buildAutoConfigSummaryText(payload)), function () {
                ajax('POST', 'EmbyCast/MediaNews/AutoConfig', payload).then(function (status) {
                    if (status && status.Error) { showStatus(statusEl, t('errorPrefix') + status.Error, 'err'); return; }
                    showStatus(statusEl, t('msgAutoSettingsSaved'), 'ok');
                    renderMediaNewsAutoStatus(status);
                }, function (err) {
                    showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
                });
            });
        });

        // Cancels the recurring auto-send directly from the "upcoming send" card (see
        // renderMediaNewsAutoStatus below) - equivalent to unchecking "Send automatically" and
        // clicking "Save Auto-send Settings", but in one click, mirroring the "Cancel" button
        // already available for one-off Scheduled Messages.
        function cancelMediaNewsAutoSend() {
            confirmAction(t('msgConfirmCancelAutoSend'), function () {
                var statusEl = view.querySelector('.medianews-auto-status');
                ajax('POST', 'EmbyCast/MediaNews/AutoConfig', buildAutoConfigPayload(false)).then(function (status) {
                    view.querySelector('.medianews-auto-enabled').checked = false;
                    toggleAutoFields();
                    showStatus(statusEl, t('msgAutoSendCancelled'), 'ok');
                    renderMediaNewsAutoStatus(status);
                }, function (err) {
                    showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
                });
            });
        }

        // Emby's own "Date/time locale" dashboard setting (Emby Web Settings -> General) is NOT
        // stored server-side - it lives only in the browser's localStorage under the key
        // "datetimelocale" (e.g. "en-GB"), written by Emby's own web client. Without reading it,
        // every toLocale*String() call below falls back to the browser's own default locale,
        // which often doesn't match what the admin actually configured for the rest of Emby (e.g.
        // seeing US-style dates while every other Emby page shows UK/24h style).
        //
        // Returns undefined (== "use the runtime default locale")
        // when the setting is on "Auto" (key absent/empty), when localStorage itself isn't
        // available (some embedded/kiosk browser contexts disable it), or when the stored value
        // isn't a locale Intl actually recognizes (Intl.DateTimeFormat throws for a garbage
        // string) - so this can never make date/time display WORSE than before, only better when
        // a valid explicit locale is set.
        function getEmbyDateTimeLocale() {
            try {
                var loc = window.localStorage && localStorage.getItem('datetimelocale');
                if (loc) {
                    new Intl.DateTimeFormat(loc); // throws for an invalid/unrecognized locale
                    return loc;
                }
            } catch (e) { /* localStorage unavailable, or invalid locale - fall through */ }
            return undefined;
        }

        function localeDateString(date) {
            return date.toLocaleDateString(getEmbyDateTimeLocale());
        }

        function localeTimeString(date, opts) {
            return date.toLocaleTimeString(getEmbyDateTimeLocale(), opts);
        }

        function localeDateTimeString(date) {
            return date.toLocaleString(getEmbyDateTimeLocale());
        }

        // Local date/time formatting without seconds, e.g. "20.8.2026, 20:00" (de) / "8/20/2026,
        // 8:00 PM" (en) - matches the user's requested card format, which shows minute precision
        // only (the default toLocaleString() included seconds, which looked noisy/overly precise
        // for a weekly recurring send).
        function formatDateNoSeconds(iso) {
            var d = new Date(iso);
            return localeDateString(d) + ', ' + localeTimeString(d, { hour: '2-digit', minute: '2-digit' });
        }

        // Renders the "upcoming auto-send" card (header + next run + recipient mode + lookback
        // period + saved-config Preview + Cancel button) in place of the plain "Next scheduled
        // send: ..." text whenever auto-send is enabled - same idea as the "Upcoming scheduled
        // messages" list under Scheduled Message, but showing only the Header (never a message
        // body, since Media News' actual content can't be known until it's actually built at
        // send time) - except for the dedicated saved-config Preview button below, which DOES
        // build and show a structural preview on demand, from the saved config specifically (see
        // buildMediaNewsStructurePreviewTextFromStatus), never from whatever is currently unsaved
        // in the form above.
        // Tracks the weekly auto-send's on/off state for the Media News tile's dot badge (see
        // renderTileBadges()) - kept as its own variable rather than read from pluginConfig,
        // since auto-send is saved through its own dedicated endpoint (EmbyCast/MediaNews/
        // AutoConfig) rather than ApiClient.updatePluginConfiguration, so pluginConfig's copy of
        // MediaNewsAutoSendEnabled would otherwise go stale after a save here.
        var lastMediaNewsAutoEnabled = false;

        function renderMediaNewsAutoStatus(status) {
            if (!status) return;
            lastMediaNewsAutoEnabled = !!status.Enabled;
            renderTileBadges();
            var nextRunEl = view.querySelector('.medianews-next-run');
            var upcomingEl = view.querySelector('.medianews-auto-upcoming');
            if (status.Enabled) {
                nextRunEl.style.display = 'none';
                var when = formatDateNoSeconds(status.NextRunUtc);
                var header = status.Header || t('defaultMediaNewsHeader');
                var recipientKey = status.RecipientMode === 'All' ? 'recipientAll'
                    : (status.RecipientMode === 'Specific' ? 'recipientSpecific' : 'recipientActive');
                var recipientText = fmt('autoCardRecipient', t(recipientKey));
                var periodText = fmt('autoCardPeriod', status.LookbackDays || 7);
                var infoLine = '<strong>' + esc(header) + '</strong> &mdash; ' + esc(when) +
                    ' &mdash; ' + esc(recipientText) + ' &mdash; ' + esc(periodText);
                // Only called out when the saved job is actually web-only - avoids cluttering the
                // card's info line for the (still default) common case of "all session types".
                if (status.WebOnly) infoLine += ' &mdash; ' + esc(t('autoCardWebOnly'));

                upcomingEl.innerHTML =
                    '<div class="bcm-history-item">' +
                    '<div class="bcm-history-head">' +
                    '<span>' + infoLine + '</span>' +
                    '<span style="display:flex;gap:.4em;flex-shrink:0;">' +
                    '<button class="bcm-dismiss medianews-auto-preview-saved-btn"></button>' +
                    '<button class="bcm-dismiss medianews-auto-cancel-btn">' + esc(t('msgCancel')) + '</button>' +
                    '</span>' +
                    '</div>' +
                    '<div class="bcm-preview medianews-auto-saved-preview" style="display:none;margin-top:.6em;"></div>' +
                    '</div>';

                upcomingEl.querySelector('.medianews-auto-cancel-btn').addEventListener('click', cancelMediaNewsAutoSend);

                var savedPreviewBtn = upcomingEl.querySelector('.medianews-auto-preview-saved-btn');
                var savedPreviewEl = upcomingEl.querySelector('.medianews-auto-saved-preview');
                setPreviewShown(savedPreviewBtn, savedPreviewEl, false);
                savedPreviewBtn.addEventListener('click', function () {
                    toggleMediaNewsPreview(savedPreviewBtn, savedPreviewEl, view.querySelector('.medianews-auto-status'),
                        function () { return Promise.resolve({ Text: buildMediaNewsStructurePreviewTextFromStatus(status) }); });
                });

                upcomingEl.style.display = '';
            } else {
                upcomingEl.style.display = 'none';
                upcomingEl.innerHTML = '';
                nextRunEl.style.display = '';
                nextRunEl.textContent = t('nextRunUnknown');
            }
        }

        function refreshMediaNewsAutoStatus() {
            ajax('GET', 'EmbyCast/MediaNews/AutoStatus').then(renderMediaNewsAutoStatus);
        }

        // ---------------- welcome message ----------------

        // Persists Header/Text together with the given enabled state in one call, from the
        // toggle switch's 'change' handler below (the switch saves by itself). enabledOverride
        // comes from the switch's own event so the saved value matches what the admin just set.
        //
        // Uses the dedicated EmbyCast/Welcome/Save endpoint (server-side length validation, only
        // touches Welcome's own fields) instead of Emby's generic updatePluginConfiguration().
        // Language is sent along - see SaveWelcomeMessage.Language in EmbyCastApi.cs.
        function saveWelcomeConfig(enabledOverride, successKey) {
            var statusEl = view.querySelector('.welcome-status');
            if (!pluginConfig) return;
            var toggleEl = view.querySelector('.welcome-enabled');
            var enabled = enabledOverride !== undefined ? enabledOverride : toggleEl.checked;
            var previousEnabled = pluginConfig.WelcomeMessageEnabled;
            var header = view.querySelector('.welcome-header').value.trim() || t('defaultWelcomeHeader');
            var text = view.querySelector('.welcome-text').value.trim();

            ajax('POST', 'EmbyCast/Welcome/Save', { Enabled: enabled, Header: header, Text: text, Language: currentLang }).then(function (result) {
                if (result && result.Error) {
                    showStatus(statusEl, t('errorPrefix') + result.Error, 'err');
                    return;
                }
                pluginConfig.WelcomeMessageEnabled = result.Enabled;
                pluginConfig.WelcomeMessageHeader = result.Header;
                pluginConfig.WelcomeMessageText = result.Text;
                pluginConfig.Language = currentLang;
                toggleEl.checked = result.Enabled;
                showStatus(statusEl, t(successKey), 'ok');
                renderTileBadges();
            }, function (err) {
                // Roll the switch (and pluginConfig's in-memory copy) back to whatever was
                // actually last saved - otherwise a failed request would leave the switch showing
                // the new state even though the server never received it.
                pluginConfig.WelcomeMessageEnabled = previousEnabled;
                toggleEl.checked = !!previousEnabled;
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        }

        view.querySelector('.welcome-enabled').addEventListener('change', function () {
            saveWelcomeConfig(this.checked, this.checked ? 'msgWelcomeSaved' : 'msgWelcomeDisabled');
        });

        // "Mark existing users as already welcomed" - safe/idempotent (see MessageStore.
        // MarkWelcomedBulk), so left permanently available rather than hidden after first use:
        // useful again any time a user hasn't logged in since it was last clicked (e.g. right
        // after a bulk import of accounts).
        // Renders the persistent "Wurde am ... durchgeführt" hint under the button - unlike the
        // status toast above (which auto-hides after a few seconds, see showStatus()), this stays
        // visible across page reloads/navigation, so an admin coming back later can still see
        // whether/when they last ran this. Always shows the most recent run only, never a
        // history/log (see MessageStore.MarkWelcomedBulk) - overwritten every time this is
        // called with fresh data, including a 0-count run.
        function renderMarkExistingLastRun(lastRunUtc, count) {
            var el = view.querySelector('.welcome-mark-lastrun');
            if (!el) return;
            if (!lastRunUtc) { el.style.display = 'none'; return; }
            // Date + time (no seconds), same helper/format used everywhere else on this page a
            // "when did this happen" timestamp is shown (scheduled messages, timer starts,
            // tile badges) - date-only here previously made it impossible to tell apart two runs
            // on the same day. See formatDateNoSeconds's own doc comment.
            var dateText = formatDateNoSeconds(lastRunUtc);
            el.textContent = fmt('noteMarkExistingUsersLastRun', dateText, count || 0);
            el.style.display = '';
        }

        // Same idea as renderMarkExistingLastRun above, but for the opposite "Reset welcomed
        // users" button (its own persistent hint element, .welcome-unmark-lastrun).
        function renderUnmarkExistingLastRun(lastRunUtc, count) {
            var el = view.querySelector('.welcome-unmark-lastrun');
            if (!el) return;
            if (!lastRunUtc) { el.style.display = 'none'; return; }
            var dateText = formatDateNoSeconds(lastRunUtc);
            el.textContent = fmt('noteUnmarkExistingUsersLastRun', dateText, count || 0);
            el.style.display = '';
        }

        // Populate both hints from whatever was already persisted, on page load - the buttons
        // themselves may not have been clicked at all in this session, or ever.
        ajax('GET', 'EmbyCast/Welcome/MarkExistingStatus').then(function (result) {
            renderMarkExistingLastRun(result && result.LastRunUtc, result && result.Count);
        }, function () { /* ignore - hint just stays hidden */ });
        ajax('GET', 'EmbyCast/Welcome/UnmarkExistingStatus').then(function (result) {
            renderUnmarkExistingLastRun(result && result.LastRunUtc, result && result.Count);
        }, function () { /* ignore - hint just stays hidden */ });

        view.querySelector('.welcome-mark-existing').addEventListener('click', function () {
            var statusEl = view.querySelector('.welcome-mark-status');
            var btn = this;
            btn.disabled = true;
            ajax('POST', 'EmbyCast/Welcome/MarkExisting').then(function (result) {
                btn.disabled = false;
                showStatus(statusEl, fmt('msgExistingUsersMarked', (result && result.Count) || 0), 'ok');
                renderMarkExistingLastRun(result && result.LastRunUtc, result && result.Count);
            }, function (err) {
                btn.disabled = false;
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        // Opposite of "Mark existing users" above: clears the welcomed-users list entirely, so
        // every current user is treated as never-welcomed again. Confirmed first since it's a
        // bulk action with a real, delayed consequence (each affected user gets the welcome
        // message again at their NEXT login, not immediately - see MessageStore.
        // UnmarkAllWelcomed's doc comment) rather than an instant mass-send.
        // Also turns "Enable welcome message" off server-side (see Post(UnmarkAllWelcomed) in
        // EmbyCastApi.cs) - reflected here in both pluginConfig's in-memory copy and the switch
        // itself, so the dashboard doesn't keep showing it as enabled until the next reload.
        view.querySelector('.welcome-unmark-existing').addEventListener('click', function () {
            var btn = this;
            confirmAction(t('msgConfirmUnmarkExisting'), function () {
                var statusEl = view.querySelector('.welcome-mark-status');
                btn.disabled = true;
                ajax('POST', 'EmbyCast/Welcome/UnmarkAll').then(function (result) {
                    btn.disabled = false;
                    showStatus(statusEl, fmt('msgExistingUsersUnmarked', (result && result.Count) || 0), 'ok');
                    renderUnmarkExistingLastRun(result && result.LastRunUtc, result && result.Count);
                    if (pluginConfig) pluginConfig.WelcomeMessageEnabled = false;
                    view.querySelector('.welcome-enabled').checked = false;
                    renderTileBadges();
                }, function (err) {
                    btn.disabled = false;
                    showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
                });
            });
        });

        // ---------------- history ----------------

        function timeAgo(isoStr) {
            var diff = Math.floor((Date.now() - new Date(isoStr).getTime()) / 1000);
            if (diff < 60) return diff + 's';
            if (diff < 3600) return Math.floor(diff / 60) + 'm';
            if (diff < 86400) return Math.floor(diff / 3600) + 'h';
            return Math.floor(diff / 86400) + 'd';
        }

        function typeLabel(type) {
            var key = 'type' + type;
            return TRANSLATIONS[currentLang][key] || type;
        }

        function loadHistory() {
            ajax('GET', 'EmbyCast/History').then(renderHistory, function () {
                view.querySelector('.history-list').innerHTML =
                    '<p style="opacity:.4;font-size:.85em;">' + esc(t('msgLoadFailed')) + '</p>';
            });
        }

        function renderHistory(items) {
            var el = view.querySelector('.history-list');
            var active = (items || []).filter(function (h) { return h.Active; });
            if (active.length === 0) {
                el.innerHTML = '<p style="opacity:.35;font-size:.85em;margin:0;">' + esc(t('msgNoHistory')) + '</p>';
                return;
            }
            el.innerHTML = '';
            active.forEach(function (h) {
                var deliveries = h.Deliveries || {};
                var keys = Object.keys(deliveries);
                var badges = '';
                keys.forEach(function (uid) {
                    var rec = deliveries[uid];
                    var statusClass = rec.Status === 'Delivered' ? 'delivered' : (rec.Status === 'Pending' ? 'pending' : (rec.Status === 'Expired' ? 'expired' : 'failed'));
                    var statusText = rec.Status === 'Delivered' ? t('statusDelivered') : (rec.Status === 'Pending' ? t('statusPending') : (rec.Status === 'Expired' ? t('statusExpired') : t('statusFailed')));
                    var tooltip = statusText + (rec.Note === 'UserDeleted' ? ' - ' + t('noteUserDeleted') : '');
                    badges += '<span class="bcm-badge ' + statusClass + '" title="' + esc(tooltip) + '">' + esc(rec.Username) + '</span>';
                });
                if (keys.length === 0) {
                    badges = '<span class="bcm-badge pending">' + esc(t('msgNoDeliveries')) + '</span>';
                }

                var hasPending = keys.some(function (uid) { return deliveries[uid].Status === 'Pending'; });

                var row = document.createElement('div');
                row.className = 'bcm-history-item';
                row.innerHTML =
                    '<div class="bcm-history-head">' +
                    '<span><span class="bcm-history-tag">' + esc(typeLabel(h.MessageType)) + '</span>' +
                    '<strong>' + esc(h.Header) + '</strong></span>' +
                    '<span style="font-size:.75em;opacity:.4;">' + esc(timeAgo(h.CreatedAtUtc)) + '</span>' +
                    '</div>' +
                    // Starts collapsed by default (per measureHistoryCollapse() below); the toggle
                    // link is only added to the DOM for entries that actually overflow the
                    // collapsed height, so a short entry never shows a pointless "Show more" link.
                    '<div class="bcm-history-text collapsed">' + esc(h.Text) + '</div>' +
                    '<div style="margin-bottom:.5em;">' + badges + '</div>' +
                    '<button class="bcm-dismiss dismiss-history-btn">' + esc(t('msgDismiss')) + '</button>';
                // Dismissing now also cancels any still-pending offline deliveries for this entry
                // (see MessageStore.DismissHistory) - only prompt for confirmation when that's
                // actually a real consequence here, so the common case (everything already
                // delivered) stays a single click like before.
                row.querySelector('.dismiss-history-btn').addEventListener('click', function () {
                    confirmAction(t('msgConfirmDismissPending'), function () {
                        ajax('DELETE', 'EmbyCast/History/' + h.Id).then(function (result) {
                            var note = (result && result.CancelledOfflineCount) ? ' ' + fmt('msgOfflineCancelled', result.CancelledOfflineCount) : '';
                            showStatus(view.querySelector('.history-status'), t('msgHistoryDismissed') + note, 'ok');
                            loadHistory();
                        });
                    }, !hasPending);
                });
                el.appendChild(row);
            });
            measureHistoryCollapse();
        }

        // Decides, per entry, whether the collapsed height actually clips any content - if so,
        // keeps the 'collapsed' class and adds a "Show more" toggle link; otherwise removes the
        // class so short entries render exactly as before, with no link at all.
        //
        // Under the tile-navigation layout, the "Status & History" card lives inside a
        // .bcm-section that defaults to display:none, and loadHistory()/renderHistory() still run
        // during init() regardless of which tile is open. A hidden (display:none) element always
        // reports scrollHeight/clientHeight as 0, so measuring right after render would wrongly
        // treat every entry as "fits, no link needed" while History isn't the open section. To
        // avoid that, this skips elements that are still hidden (offsetParent === null) - openSection()
        // calls this again once History becomes visible, which is when hidden entries actually get
        // measured and (if needed) their toggle link added.
        function measureHistoryCollapse() {
            var els = view.querySelectorAll('.bcm-history-text');
            for (var i = 0; i < els.length; i++) {
                var el = els[i];
                if (el.offsetParent === null) continue; // still hidden - measure later, see above
                if (el._bcmMeasured) continue; // already decided once while visible - don't redo
                el._bcmMeasured = true;
                // scrollHeight reflects the FULL content height regardless of the collapsed
                // class's max-height/overflow:hidden, so this comparison is valid even with
                // 'collapsed' already applied - no need to remove it first to measure.
                var overflows = el.scrollHeight > el.clientHeight + 2; // +2px rounding slack
                if (!overflows) {
                    el.classList.remove('collapsed');
                    continue;
                }
                var link = document.createElement('span');
                link.className = 'bcm-history-expand';
                link.textContent = t('historyShowMore');
                link.addEventListener('click', function () {
                    var textEl = this.previousElementSibling;
                    var collapsed = textEl.classList.toggle('collapsed');
                    this.textContent = collapsed ? t('historyShowMore') : t('historyShowLess');
                });
                el.parentNode.insertBefore(link, el.nextSibling);
            }
        }

        view.querySelector('.history-refresh').addEventListener('click', loadHistory);

        view.querySelector('.history-clear-all').addEventListener('click', function () {
            confirmAction(t('msgConfirmClearHistory'), function () {
                ajax('POST', 'EmbyCast/History/ClearAll').then(function (result) {
                    var note = (result && result.CancelledOfflineCount) ? ' ' + fmt('msgOfflineCancelled', result.CancelledOfflineCount) : '';
                    showStatus(view.querySelector('.history-status'), t('msgHistoryCleared') + note, 'ok');
                    loadHistory();
                });
            });
        });

        // ---------------- scheduled cleanup ----------------

        var lastCleanupStats = null;

        function formatBytes(n) {
            if (n == null || isNaN(n)) return '';
            if (n < 1024) return n + ' B';
            if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
            return (n / (1024 * 1024)).toFixed(1) + ' MB';
        }

        function loadCleanupStats() {
            ajax('GET', 'EmbyCast/Cleanup/Stats').then(renderCleanupStats, function () { /* non-critical, leave box as-is */ });
        }

        function renderCleanupStats(stats) {
            lastCleanupStats = stats;
            var el = view.querySelector('.cleanup-storage-box');
            if (!el) return;
            el.innerHTML =
                '<span>' + esc(fmt('cleanupStorageFile', formatBytes(stats.TotalFileBytes))) + '</span>' +
                '<span>' + esc(fmt('cleanupStorageHistory', stats.HistoryCount, formatBytes(stats.HistoryBytes))) + '</span>' +
                '<span>' + esc(fmt('cleanupStorageOffline', stats.OfflineQueueCount, formatBytes(stats.OfflineQueueBytes))) + '</span>';
        }

        function getCleanupTypeCheckboxes() {
            return {
                IncludeInstant: view.querySelector('.cleanup-type-instant').checked,
                IncludeScheduled: view.querySelector('.cleanup-type-scheduled').checked,
                IncludeTimer: view.querySelector('.cleanup-type-timer').checked,
                IncludeMediaNews: view.querySelector('.cleanup-type-medianews').checked,
                IncludeWelcome: view.querySelector('.cleanup-type-welcome').checked,
                IncludeOffline: view.querySelector('.cleanup-type-offline').checked,
                IncludeSystem: view.querySelector('.cleanup-type-system').checked
            };
        }

        // ---------------- system message tile ----------------

        // Entries live in EmbyCast's own store (EmbyCast/SystemMessages) and are reported to Emby
        // by the system-level notifier (SystemMessageNotifier.cs), so EmbyCast never shows up in
        // Emby's per-user "Add Notification" menu. The event list (ids, names, categories) is
        // read from Emby's own Notifications/Types - the same list Emby's notification page shows.
        var sysmsgTypes = null;
        var sysmsgData = { Entries: [], Administrators: [] };
        // false until the entries were loaded once - the tile's status dot stays hidden until then
        // instead of flashing grey on every page load.
        var sysmsgLoaded = false;

        // Same rule as SystemMessageNotifier.GetConfiguredNotifications: only these entries are
        // reported to Emby, so only they can deliver anything.
        function anySystemMessageActive() {
            return (sysmsgData.Entries || []).some(function (e) {
                var events = (e.EventIds || []).filter(function (id) {
                    return SYSTEM_HIDDEN_EVENTS.indexOf(String(id).toLowerCase()) === -1;
                });
                return e.Enabled && events.length > 0 && (e.RecipientUserIds || []).length > 0;
            });
        }

        // Light load for the tile's status dot (page load / resume) - without the Emby event list.
        function refreshSystemMessageBadge() {
            return ajax('GET', 'EmbyCast/SystemMessages').then(function (data) {
                sysmsgData = data || { Entries: [], Administrators: [] };
                sysmsgLoaded = true;
                renderTileBadges();
            }, function () { /* dot just stays hidden */ });
        }
        var sysmsgEditingId = null;

        // Server events EmbyCast leaves out (also ignored server-side, see
        // SystemMessageService.HiddenEventIds): startup / updated reach nobody (no active session
        // yet), restart required / update available are shown in Emby's dashboard anyway, and
        // maintenance mode is switched by an admin, who isn't told about their own actions.
        var SYSTEM_HIDDEN_EVENTS = ['system.serverstartup', 'system.serverrestartrequired', 'system.updateavailable',
            'system.updated', 'system.entermaintenancemode', 'system.exitmaintenancemode'];

        // Emby lists "Add to Favourites" and "Remove from Favourites" under one id (item.rate) -
        // merged into one checkbox here.
        function normalizeSystemTypes(categories) {
            return (categories || []).map(function (cat) {
                var events = [];
                (cat.Events || []).forEach(function (ev) {
                    if (SYSTEM_HIDDEN_EVENTS.indexOf(String(ev.Id).toLowerCase()) !== -1) return;
                    var existing = events.filter(function (e) { return e.Id === ev.Id; })[0];
                    if (existing) existing.Name += ' / ' + ev.Name;
                    else events.push({ Id: ev.Id, Name: ev.Name });
                });
                return { Id: cat.Id, Name: cat.Name, Events: events };
            }).filter(function (cat) { return cat.Events.length > 0; });
        }

        function systemEventName(id) {
            var name = id;
            (sysmsgTypes || []).forEach(function (cat) {
                cat.Events.forEach(function (ev) { if (ev.Id === id) name = ev.Name; });
            });
            return name;
        }

        function loadSystemTypes() {
            if (sysmsgTypes) return Promise.resolve(sysmsgTypes);
            return ApiClient.getJSON(ApiClient.getUrl('Notifications/Types', { UserId: ApiClient.getCurrentUserId() }))
                .then(function (categories) {
                    sysmsgTypes = normalizeSystemTypes(categories);
                    return sysmsgTypes;
                });
        }

        function loadSystemMessages() {
            var statusEl = view.querySelector('.sysmsg-status');
            loadSystemTypes().then(null, function () {
                showStatus(statusEl, t('systemEventsError'), 'err');
            }).then(function () {
                return ajax('GET', 'EmbyCast/SystemMessages');
            }).then(function (data) {
                sysmsgData = data || { Entries: [], Administrators: [] };
                sysmsgLoaded = true;
                renderSystemList();
                renderTileBadges();
            }, function () {
                showStatus(statusEl, t('systemListError'), 'err');
            });
        }

        function adminName(id) {
            var admin = (sysmsgData.Administrators || []).filter(function (a) { return a.Id === id; })[0];
            return admin ? admin.Name : resolveUserName(id);
        }

        function renderSystemList() {
            var el = view.querySelector('.sysmsg-list');
            var entries = sysmsgData.Entries || [];
            if (!entries.length) {
                el.innerHTML = '<p class="sysmsg-empty">' + esc(t('systemListEmpty')) + '</p>';
                return;
            }
            el.innerHTML = '';
            entries.forEach(function (entry) {
                var events = entry.EventIds || [];
                var eventText = fmt('systemEvents', events.length) + ': ' +
                    events.slice(0, 3).map(systemEventName).join(', ') + (events.length > 3 ? ', …' : '');
                var meta = [entry.DisplayMode === 'Dialog' ? t('displayDialog') : t('displayToast'), eventText];
                if (entry.LimitUsers) {
                    var filterNames = (entry.UserFilterGroupIds || []).map(resolveGroupName)
                        .concat((entry.UserFilterIds || []).map(resolveUserName));
                    // Can end up empty when the chosen users/groups were deleted - the entry then
                    // shows no user events at all (never silently "all users"), so say so.
                    meta.push(filterNames.length ? fmt('systemUsersMeta', filterNames.join(', ')) : '⚠ ' + t('systemUsersNone'));
                }
                meta.push('→ ' + (entry.RecipientUserIds || []).map(adminName).join(', '));
                if (!entry.Enabled) meta.unshift(t('systemDisabled'));

                var row = document.createElement('div');
                row.className = 'group-item' + (entry.Enabled ? '' : ' sysmsg-off');
                row.innerHTML =
                    '<div class="group-main"><div class="group-name"></div><div class="group-members"></div></div>' +
                    '<div class="group-actions">' +
                    '<button type="button" class="bcm-btn secondary small sysmsg-test-btn">' + esc(t('btnSystemTest')) + '</button>' +
                    '<button type="button" class="bcm-btn secondary small sysmsg-edit-btn">' + esc(t('btnSystemEdit')) + '</button>' +
                    '<button type="button" class="bcm-btn danger small sysmsg-delete-btn">' + esc(t('btnSystemDelete')) + '</button>' +
                    '</div>';
                row.querySelector('.group-name').textContent = entry.Name;
                row.querySelector('.group-members').textContent = meta.join(' · ');
                row.querySelector('.sysmsg-test-btn').addEventListener('click', function () { testSystemMessage(entry); });
                row.querySelector('.sysmsg-edit-btn').addEventListener('click', function () { openSystemForm(entry); });
                row.querySelector('.sysmsg-delete-btn').addEventListener('click', function () { deleteSystemMessage(entry); });
                el.appendChild(row);
            });
        }

        // Same pattern as editing a Scheduled Message: dispatching 'change' lets the shared
        // wireRecipientGroup() listener show/hide the list and clear old ticks first, then this
        // entry's users and groups are ticked.
        function setSystemUserFilter(entry) {
            var limit = !!(entry && entry.LimitUsers);
            var radio = view.querySelector('.sysmsg-recipient-group input[type=radio][value="' + (limit ? 'Specific' : 'All') + '"]');
            radio.checked = true;
            radio.dispatchEvent(new Event('change'));
            if (!limit) return;
            var list = view.querySelector('.sysmsg-userlist');
            (entry.UserFilterIds || []).forEach(function (uid) {
                var cb = list.querySelector('input[type=checkbox]:not(.group-checkbox)[value="' + uid + '"]');
                if (cb) cb.checked = true;
            });
            (entry.UserFilterGroupIds || []).forEach(function (gid) {
                var cb = list.querySelector('input.group-checkbox[value="' + gid + '"]');
                if (cb) cb.checked = true;
            });
        }

        function renderSystemAdmins(selectedIds) {
            var box = view.querySelector('.sysmsg-admins');
            var admins = sysmsgData.Administrators || [];
            if (!admins.length) {
                box.innerHTML = '<span class="sysmsg-empty">' + esc(t('systemNoAdmins')) + '</span>';
                return;
            }
            box.innerHTML = admins.map(function (admin) {
                var checked = selectedIds.indexOf(admin.Id) !== -1 ? ' checked' : '';
                return '<label><input type="checkbox" value="' + esc(admin.Id) + '"' + checked + ' /> ' + esc(admin.Name) + '</label>';
            }).join('');
        }

        // Fixed order for the 3-column grid (filled row by row): the long lists in the first
        // row, the short ones at the bottom. Categories Emby may add later go at the end.
        var SYSTEM_CATEGORY_ORDER = ['users', 'livetv', 'playback', 'plugins', 'system', 'scheduledtasks', 'library', 'devices', 'external'];

        function orderedSystemCategories() {
            function rank(cat) {
                var i = SYSTEM_CATEGORY_ORDER.indexOf(String(cat.Id).toLowerCase());
                return i === -1 ? SYSTEM_CATEGORY_ORDER.length : i;
            }
            return sysmsgTypes.slice().sort(function (a, b) { return rank(a) - rank(b); });
        }

        function renderSystemEvents(selectedIds) {
            var box = view.querySelector('.sysmsg-events');
            if (!sysmsgTypes || !sysmsgTypes.length) {
                box.innerHTML = '<p class="sysmsg-empty">' + esc(t('systemEventsError')) + '</p>';
                return;
            }
            box.innerHTML = orderedSystemCategories().map(function (cat) {
                return '<div class="sysmsg-cat">' +
                    '<label class="sysmsg-cat-head"><input type="checkbox" class="sysmsg-cat-toggle" /> ' + esc(cat.Name) + '</label>' +
                    '<div class="sysmsg-cat-events">' +
                    cat.Events.map(function (ev) {
                        var checked = selectedIds.indexOf(ev.Id) !== -1 ? ' checked' : '';
                        return '<label><input type="checkbox" class="sysmsg-event" value="' + esc(ev.Id) + '"' + checked + ' /> ' + esc(ev.Name) + '</label>';
                    }).join('') +
                    '</div></div>';
            }).join('');
            box.querySelectorAll('.sysmsg-cat').forEach(function (catEl) {
                var toggle = catEl.querySelector('.sysmsg-cat-toggle');
                var events = catEl.querySelectorAll('.sysmsg-event');
                function syncToggle() {
                    var count = 0;
                    events.forEach(function (cb) { if (cb.checked) count++; });
                    toggle.checked = count === events.length;
                    toggle.indeterminate = count > 0 && count < events.length;
                }
                toggle.addEventListener('change', function () {
                    events.forEach(function (cb) { cb.checked = toggle.checked; });
                });
                events.forEach(function (cb) { cb.addEventListener('change', syncToggle); });
                syncToggle();
            });
        }

        // Same form for "New" and "Edit"; entry === null means a new System Message.
        function openSystemForm(entry) {
            sysmsgEditingId = entry ? entry.Id : null;
            var form = view.querySelector('.sysmsg-form');
            form.querySelector('.sysmsg-form-title').textContent = t(entry ? 'systemFormEdit' : 'systemFormNew');
            form.querySelector('.sysmsg-name').value = entry ? entry.Name : '';
            form.querySelector('.sysmsg-enabled').checked = entry ? entry.Enabled !== false : true;
            setDisplayMode('sysmsg', entry && entry.DisplayMode === 'Dialog' ? 'dialog' : 'toast');
            var me = String(ApiClient.getCurrentUserId() || '').replace(/-/g, '').toLowerCase();
            renderSystemAdmins(entry ? (entry.RecipientUserIds || []) : [me]);
            renderSystemEvents(entry ? (entry.EventIds || []) : []);
            setSystemUserFilter(entry);
            form.querySelector('.sysmsg-form-status').textContent = '';
            form.classList.add('show');
            form.scrollIntoView({ block: 'start', behavior: 'smooth' });
        }

        function closeSystemForm() {
            sysmsgEditingId = null;
            view.querySelector('.sysmsg-form').classList.remove('show');
        }

        function checkedValues(selector) {
            var values = [];
            view.querySelectorAll(selector).forEach(function (cb) { if (cb.checked) values.push(cb.value); });
            return values;
        }

        view.querySelector('.sysmsg-new').addEventListener('click', function () {
            loadSystemTypes().then(null, function () { }).then(function () { openSystemForm(null); });
        });
        view.querySelector('.sysmsg-cancel').addEventListener('click', closeSystemForm);
        view.querySelectorAll('input[name="sysmsg-display"]').forEach(function (radio) {
            radio.addEventListener('change', function () { applyDisplayMode('sysmsg'); });
        });

        view.querySelector('.sysmsg-save').addEventListener('click', function () {
            var statusEl = view.querySelector('.sysmsg-form-status');
            var payload = {
                Id: sysmsgEditingId || '',
                Name: view.querySelector('.sysmsg-name').value.trim(),
                Enabled: view.querySelector('.sysmsg-enabled').checked,
                DisplayMode: getDisplayMode('sysmsg') === 'dialog' ? 'Dialog' : 'Toast',
                EventIds: checkedValues('.sysmsg-events .sysmsg-event'),
                RecipientUserIds: checkedValues('.sysmsg-admins input'),
                LimitUsers: getRecipientMode('sysmsg') === 'Specific',
                UserFilterIds: getSelectedUserIds('sysmsg'),
                UserFilterGroupIds: getSelectedGroupIds('sysmsg')
            };
            if (!payload.Name) { showStatus(statusEl, t('msgSystemNeedName'), 'err'); return; }
            if (!payload.EventIds.length) { showStatus(statusEl, t('msgSystemNeedEvent'), 'err'); return; }
            if (!payload.RecipientUserIds.length) { showStatus(statusEl, t('msgSystemNeedAdmin'), 'err'); return; }
            if (payload.LimitUsers && !payload.UserFilterIds.length && !payload.UserFilterGroupIds.length) { showStatus(statusEl, t('msgSystemNeedUser'), 'err'); return; }

            ajax('POST', 'EmbyCast/SystemMessages', payload).then(function (result) {
                if (result && result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                closeSystemForm();
                showStatus(view.querySelector('.sysmsg-status'), t('msgSystemSaved'), 'ok');
                loadSystemMessages();
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        function testSystemMessage(entry) {
            var statusEl = view.querySelector('.sysmsg-status');
            ajax('POST', 'EmbyCast/SystemMessages/' + encodeURIComponent(entry.Id) + '/Test', {}).then(function (result) {
                if (result && result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                var delivered = (result && result.Delivered) || 0;
                showStatus(statusEl, delivered > 0 ? fmt('msgSystemTestSent', delivered) : t('msgSystemTestNobody'), delivered > 0 ? 'ok' : 'err');
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        }

        function deleteSystemMessage(entry) {
            confirmAction(fmt('msgConfirmDeleteSystem', entry.Name), function () {
                var statusEl = view.querySelector('.sysmsg-status');
                ajax('DELETE', 'EmbyCast/SystemMessages/' + encodeURIComponent(entry.Id)).then(function () {
                    if (sysmsgEditingId === entry.Id) closeSystemForm();
                    showStatus(statusEl, t('msgSystemDeleted'), 'ok');
                    loadSystemMessages();
                }, function (err) {
                    showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
                });
            });
        }

        // ---------------- tile colours (Settings tile) ----------------

        // Built-in colours = the .tile.c-* CSS rules (first gradient stop). A scheme gives every
        // tile a colour; single tiles can be changed on top of it. Saved server-side
        // (TileColorScheme / TileColorsCsv) like the tile order, so all admins see the same.
        var TILE_DEFAULT_COLORS = {
            updates: '#5b6875', instant: '#4f8fd1', scheduled: '#8b6fd1', timer: '#d1854f',
            medianews: '#d1607a', welcome: '#5fae7a', groups: '#5fae9a', history: '#4fb8c4',
            cleanup: '#b5954f', settings: '#b05fa8', system: '#6870c9'
        };
        var TILE_SCHEMES = ['Default', 'Accent', 'Neutral', 'Pastel'];
        var NEUTRAL_TILE_COLOR = '#5d6570';

        // savedTileColors = what the tile grid shows; tileColorForm = the Settings form's
        // working copy until "Save Settings".
        var savedTileColors = { scheme: 'Default', overrides: {} };
        var tileColorForm = { scheme: 'Default', overrides: {} };

        function cloneTileColors(c) {
            var overrides = {};
            Object.keys(c.overrides).forEach(function (k) { overrides[k] = c.overrides[k]; });
            return { scheme: c.scheme, overrides: overrides };
        }

        function isHexColor(value) { return /^#[0-9a-f]{6}$/i.test(value || ''); }

        function parseTileColors(config) {
            var scheme = TILE_SCHEMES.indexOf(config && config.TileColorScheme) !== -1 ? config.TileColorScheme : 'Default';
            var overrides = {};
            String((config && config.TileColorsCsv) || '').split(',').forEach(function (pair) {
                var parts = pair.split('=');
                var key = (parts[0] || '').trim().toLowerCase();
                var color = (parts[1] || '').trim().toLowerCase();
                if (TILE_DEFAULT_COLORS[key] && isHexColor(color)) overrides[key] = color;
            });
            return { scheme: scheme, overrides: overrides };
        }

        function hexToRgb(hex) {
            var n = parseInt(hex.slice(1), 16);
            return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
        }

        function rgbToHex(rgb) {
            return '#' + rgb.map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
        }

        // amount 0..1 towards the target colour
        function mixColor(hex, targetHex, amount) {
            var a = hexToRgb(hex), b = hexToRgb(targetHex);
            return rgbToHex(a.map(function (v, i) { return v + (b[i] - v) * amount; }));
        }

        function isLightColor(hex) {
            var rgb = hexToRgb(hex).map(function (v) {
                v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
            });
            // 0.36: every Pastel tile (>= 0.37) gets dark text, mid-tone colours such as Emby's
            // green accent (0.35) keep white text like Emby's own accent buttons.
            return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2] > 0.36;
        }

        // Emby's current accent colour as #rrggbb (read from the --bcm-accent variable).
        function currentAccentHex() {
            var probe = document.createElement('span');
            probe.style.color = 'var(--bcm-accent)';
            probe.style.display = 'none';
            view.appendChild(probe);
            var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(getComputedStyle(probe).color || '');
            view.removeChild(probe);
            return m ? rgbToHex([+m[1], +m[2], +m[3]]) : '#00a4dc';
        }

        function schemeTileColor(scheme, key) {
            if (scheme === 'Accent') return currentAccentHex();
            if (scheme === 'Neutral') return NEUTRAL_TILE_COLOR;
            if (scheme === 'Pastel') return mixColor(TILE_DEFAULT_COLORS[key], '#ffffff', 0.4);
            return TILE_DEFAULT_COLORS[key];
        }

        function effectiveTileColor(colors, key) {
            return colors.overrides[key] || schemeTileColor(colors.scheme, key);
        }

        // Same look as the CSS tiles: a gradient into a ~20% darker shade.
        function paintTile(el, color) {
            el.style.background = 'linear-gradient(160deg, ' + color + ', ' + mixColor(color, '#000000', 0.2) + ')';
            el.classList.toggle('tile-dark-text', isLightColor(color));
        }

        // Settings preview of one tile - decides the text colour exactly like the tile grid:
        // the built-in colours ("Colourful" scheme, not changed) always keep their white text,
        // e.g. the light turquoise of Status & History.
        function paintTilePreview(el, colors, key) {
            paintTile(el, effectiveTileColor(colors, key));
            if (colors.scheme === 'Default' && !colors.overrides[key]) el.classList.remove('tile-dark-text');
        }

        function applyTileColors() {
            var grid = view.querySelector('#tileGrid');
            if (!grid) return;
            grid.querySelectorAll('.tile[data-key]').forEach(function (tile) {
                var key = tile.getAttribute('data-key');
                if (savedTileColors.scheme === 'Default' && !savedTileColors.overrides[key]) {
                    tile.style.background = '';
                    tile.classList.remove('tile-dark-text');
                } else {
                    paintTile(tile, effectiveTileColor(savedTileColors, key));
                }
            });
        }

        function renderTileColorSettings() {
            var list = view.querySelector('.tilecolor-list');
            if (!list) return;
            view.querySelector('.settings-tile-scheme').value = tileColorForm.scheme;
            list.innerHTML = '';
            tileOrder.forEach(function (key) {
                var color = effectiveTileColor(tileColorForm, key);
                var row = document.createElement('div');
                row.className = 'tilecolor-row' + (tileColorForm.overrides[key] ? ' custom' : '');
                row.setAttribute('draggable', 'true');
                row.setAttribute('data-key', key);
                row.innerHTML =
                    '<span class="tilecolor-swatch"></span>' +
                    '<input type="color" />' +
                    '<button type="button" class="bcm-btn secondary small tilecolor-reset">&#8634;</button>';
                var swatch = row.querySelector('.tilecolor-swatch');
                swatch.textContent = t(TILE_TITLE_I18N[key]);
                paintTilePreview(swatch, tileColorForm, key);
                var input = row.querySelector('input');
                input.value = color;
                input.title = t(TILE_TITLE_I18N[key]);
                input.addEventListener('input', function () {
                    var value = input.value.toLowerCase();
                    if (value === schemeTileColor(tileColorForm.scheme, key)) delete tileColorForm.overrides[key];
                    else tileColorForm.overrides[key] = value;
                    paintTilePreview(swatch, tileColorForm, key);
                    row.classList.toggle('custom', !!tileColorForm.overrides[key]);
                });
                var reset = row.querySelector('.tilecolor-reset');
                reset.title = t('tileColorReset');
                reset.addEventListener('click', function () {
                    delete tileColorForm.overrides[key];
                    renderTileColorSettings();
                });
                wireTileDragHandlers(row);
                list.appendChild(row);
            });
        }

        view.querySelector('.settings-tile-scheme').addEventListener('change', function () {
            tileColorForm.scheme = this.value;
            renderTileColorSettings();
        });

        view.querySelector('.tilecolor-reset-all').addEventListener('click', function () {
            tileColorForm = { scheme: 'Default', overrides: {} };
            renderTileColorSettings();
        });

        // ---------------- settings tile ----------------

        // Saved through its own endpoint (EmbyCast/Settings) that writes only these two fields -
        // same reasoning as the Cleanup and tile-order saves: never post back the whole
        // configuration loaded with this page.
        view.querySelector('.settings-save').addEventListener('click', function () {
            var statusEl = view.querySelector('.settings-status');
            var payload = {
                LogLevel: view.querySelector('.settings-loglevel').value,
                OfflineDeliveryEnabled: view.querySelector('.settings-offline').checked,
                IncludePreReleases: view.querySelector('.settings-prerelease').checked,
                TileColorScheme: tileColorForm.scheme,
                TileColors: Object.keys(tileColorForm.overrides).map(function (key) {
                    return { Key: key, Color: tileColorForm.overrides[key] };
                })
            };
            ajax('POST', 'EmbyCast/Settings', payload).then(function (result) {
                if (result && result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                if (pluginConfig) {
                    pluginConfig.LogLevel = payload.LogLevel;
                    pluginConfig.OfflineDeliveryEnabled = payload.OfflineDeliveryEnabled;
                    pluginConfig.IncludePreReleases = payload.IncludePreReleases;
                }
                renderBetaNote();
                // The server dropped its cached update check - refresh badge, notes and status.
                silentCheckForUpdateBadge();
                savedTileColors = cloneTileColors(tileColorForm);
                applyTileColors();
                showStatus(statusEl, t('msgSettingsSaved'), 'ok');
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        view.querySelector('.cleanup-save').addEventListener('click', function () {
            var statusEl = view.querySelector('.cleanup-status');
            if (!pluginConfig) return;

            var offlineDays = parseInt(view.querySelector('.cleanup-offline-days').value, 10);
            var historyDays = parseInt(view.querySelector('.cleanup-history-days').value, 10);
            if (isNaN(offlineDays) || offlineDays < 1) offlineDays = 1;
            if (isNaN(historyDays) || historyDays < 1) historyDays = 1;

            // Field 2 (History) may never be shorter than Field 1 (Offline) - a history entry
            // must never be purged while its offline delivery task could still be pending.
            if (historyDays < offlineDays) {
                view.querySelector('.cleanup-history-days').value = offlineDays;
                historyDays = offlineDays;
                showStatus(statusEl, fmt('msgHistoryDaysTooLow', offlineDays), 'err');
                return;
            }

            // Mirrors the server-side floor in MessageStore.AddHistory (Math.Max(20, maxEntries))
            // and the min/max on the <input> itself - kept in sync so a value the server would
            // silently clamp anyway is instead rejected here with a clear message.
            var maxEntriesField = view.querySelector('.cleanup-history-max-entries');
            var maxEntries = parseInt(maxEntriesField.value, 10);
            if (isNaN(maxEntries) || maxEntries < 20 || maxEntries > 5000) {
                showStatus(statusEl, fmt('msgMaxEntriesOutOfRange', 20, 5000), 'err');
                return;
            }

            // Dedicated endpoint that writes only these fields - NOT the generic
            // ApiClient.updatePluginConfiguration(pluginConfig), which would post back the whole
            // configuration as loaded with this page and revert anything changed since (e.g. by
            // another tab or another section's own endpoint). See EmbyCastApi.SaveCleanupSettings.
            var types = getCleanupTypeCheckboxes();
            var payload = {
                OfflineMessageMaxAgeDays: offlineDays,
                HistoryMaxAgeDays: historyDays,
                HistoryMaxEntries: maxEntries,
                IncludeInstant: types.IncludeInstant,
                IncludeScheduled: types.IncludeScheduled,
                IncludeTimer: types.IncludeTimer,
                IncludeMediaNews: types.IncludeMediaNews,
                IncludeWelcome: types.IncludeWelcome,
                IncludeOffline: types.IncludeOffline,
                IncludeSystem: types.IncludeSystem
            };

            ajax('POST', 'EmbyCast/Cleanup/Settings', payload).then(function (result) {
                if (result && result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                pluginConfig.OfflineMessageMaxAgeDays = offlineDays;
                pluginConfig.HistoryMaxAgeDays = historyDays;
                pluginConfig.HistoryMaxEntries = maxEntries;
                pluginConfig.HistoryCleanupIncludeInstant = types.IncludeInstant;
                pluginConfig.HistoryCleanupIncludeScheduled = types.IncludeScheduled;
                pluginConfig.HistoryCleanupIncludeTimer = types.IncludeTimer;
                pluginConfig.HistoryCleanupIncludeMediaNews = types.IncludeMediaNews;
                pluginConfig.HistoryCleanupIncludeWelcome = types.IncludeWelcome;
                pluginConfig.HistoryCleanupIncludeOffline = types.IncludeOffline;
                pluginConfig.HistoryCleanupIncludeSystem = types.IncludeSystem;
                showStatus(statusEl, t('msgCleanupSaved'), 'ok');
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        // Deliberately separate from the ".cleanup-save" handler above: per the admin's request,
        // flipping this switch immediately turns the automatic daily cleanup pass on/off by
        // itself (its own save, right away), while "Save Settings" only ever persists the two day
        // fields + six type checkboxes and never touches CleanupEnabled. The two manual "Delete
        // now" buttons remain fully independent of this switch either way (see
        // ScheduledMessageBackgroundService.ProcessCleanup).
        view.querySelector('.cleanup-enabled').addEventListener('change', function () {
            var statusEl = view.querySelector('.cleanup-status');
            if (!pluginConfig) return;
            var enabled = view.querySelector('.cleanup-enabled').checked;
            pluginConfig.CleanupEnabled = enabled;
            // Dedicated endpoint (see EmbyCastApi.SaveCleanupEnabled) - same reasoning as the
            // ".cleanup-save" handler above for not using updatePluginConfiguration().
            ajax('POST', 'EmbyCast/Cleanup/Enabled', { Enabled: enabled }).then(function () {
                showStatus(statusEl, t(enabled ? 'msgCleanupEnabled' : 'msgCleanupDisabled'), 'ok');
                renderTileBadges();
            }, function (err) {
                // Revert both the visible switch AND the shared pluginConfig object on failure,
                // so the tile badge (renderTileBadges) doesn't show a never-persisted state.
                view.querySelector('.cleanup-enabled').checked = !enabled;
                pluginConfig.CleanupEnabled = !enabled;
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        view.querySelector('.cleanup-purge-offline').addEventListener('click', function () {
            var statusEl = view.querySelector('.cleanup-status');
            var count = lastCleanupStats ? lastCleanupStats.OfflineQueueCount : 0;
            if (!count) { showStatus(statusEl, t('msgNothingToPurge'), 'ok'); return; }
            confirmAction(fmt('msgConfirmPurgeOffline', count), function () {
                ajax('POST', 'EmbyCast/Cleanup/PurgeOffline').then(function (result) {
                    showStatus(statusEl, fmt('msgPurgedOffline', (result && result.Count) || 0), 'ok');
                    loadCleanupStats();
                    loadHistory();
                }, function (err) {
                    showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
                });
            });
        });

        view.querySelector('.cleanup-purge-history').addEventListener('click', function () {
            var statusEl = view.querySelector('.cleanup-status');
            confirmAction(t('msgConfirmPurgeHistory'), function () {
                ajax('POST', 'EmbyCast/Cleanup/PurgeHistory', getCleanupTypeCheckboxes()).then(function (result) {
                    showStatus(statusEl, fmt('msgPurgedHistory', (result && result.Count) || 0), 'ok');
                    loadCleanupStats();
                    loadHistory();
                }, function (err) {
                    showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
                });
            });
        });

        // ---------------- tile homepage ----------------

        // Order matches the previous top-to-bottom card layout, used as the default (and as the
        // fallback for any key missing from a saved TileOrderCsv - see parseTileOrder()).
        var TILE_KEYS = ['updates', 'instant', 'scheduled', 'timer', 'medianews', 'welcome', 'groups', 'history', 'cleanup', 'settings', 'system'];
        var TILE_ICON_KEYS = {
            updates: 'refresh', instant: 'message', scheduled: 'calendar', timer: 'server',
            medianews: 'speaker', welcome: 'door', groups: 'people', history: 'history', cleanup: 'trash',
            settings: 'settings', system: 'system'
        };
        var TILE_TITLE_I18N = {
            updates: 'updatesTitle', instant: 'instantTitle', scheduled: 'scheduledTitle', timer: 'timerTitle',
            medianews: 'mediaNewsTitle', welcome: 'welcomeTitle', groups: 'groupsTitle', history: 'historyTitle', cleanup: 'cleanupTitle',
            settings: 'settingsTitle', system: 'systemTitle'
        };
        // Tabler Icons (outline set, MIT licensed), inlined so no extra network request is needed
        // to render the tile grid.
        var ICONS = {
            system: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 5a2 2 0 0 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6" /><path d="M9 17v1a3 3 0 0 0 6 0v-1" /><path d="M21 6.727a11.05 11.05 0 0 0 -2.794 -3.727" /><path d="M3 6.727a11.05 11.05 0 0 1 2.792 -3.727" /></svg>',
            settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065z" /><path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" /></svg>',
            refresh: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8.1 8.1 0 0 0 -15.5 -2m-.5 -4v4h4" /><path d="M4 13a8.1 8.1 0 0 0 15.5 2m.5 4v-4h-4" /></svg>',
            message: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1" /></svg>',
            calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4" /><path d="M14 18a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M15 3v4" /><path d="M7 3v4" /><path d="M3 11h16" /><path d="M18 16.496v1.504l1 1" /></svg>',
            server: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v2a3 3 0 0 1 -3 3h-12a3 3 0 0 1 -3 -3v-2" /><path d="M12 20h-6a3 3 0 0 1 -3 -3v-2a3 3 0 0 1 3 -3h10.5" /><path d="M16 18a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" /><path d="M18 14.5v1.5" /><path d="M18 20v1.5" /><path d="M21.032 16.25l-1.299 .75" /><path d="M16.27 19l-1.3 .75" /><path d="M14.97 16.25l1.3 .75" /><path d="M19.733 19l1.3 .75" /><path d="M7 8v.01" /><path d="M7 16v.01" /></svg>',
            speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8a3 3 0 0 1 0 6" /><path d="M10 8v11a1 1 0 0 1 -1 1h-1a1 1 0 0 1 -1 -1v-5" /><path d="M12 8l4.524 -3.77a.9 .9 0 0 1 1.476 .692v12.156a.9 .9 0 0 1 -1.476 .692l-4.524 -3.77h-8a1 1 0 0 1 -1 -1v-4a1 1 0 0 1 1 -1h8" /></svg>',
            door: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 12v.01" /><path d="M3 21h18" /><path d="M5 21v-16a2 2 0 0 1 2 -2h6m4 10.5v7.5" /><path d="M21 7h-7m3 -3l-3 3l3 3" /></svg>',
            history: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8l0 4l2 2" /><path d="M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5" /></svg>',
            trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7l16 0" /><path d="M10 11l0 6" /><path d="M14 11l0 6" /><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" /><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" /></svg>',
            people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" /><path d="M3 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /><path d="M21 21v-2a4 4 0 0 0 -3 -3.85" /></svg>'
        };

        var tileOrder = TILE_KEYS.slice(); // current display order; mutated by drag & drop
        var currentSection = null; // null = grid view is showing
        // Set only when a section was opened via a "✎ Manage groups" deep link (see
        // openSection()'s returnTo param) - makes the back-link jump straight back to the
        // section the admin was composing in instead of always going to the tile overview.
        var returnToSection = null;
        var dragKey = null;

        // Drops any key not in TILE_KEYS (e.g. from a future downgrade, or hand-edited XML) and
        // appends any known key missing from the CSV (e.g. a tile added by a later plugin update)
        // at the end - so existing installs always see every tile at least once, in a sane place,
        // without needing a fresh default.
        function parseTileOrder(csv) {
            if (!csv) return TILE_KEYS.slice();
            var seen = {};
            var parsed = csv.split(',').map(function (s) { return s.trim(); })
                .filter(function (k) { return TILE_KEYS.indexOf(k) !== -1 && !seen[k] && (seen[k] = true); });
            TILE_KEYS.forEach(function (k) { if (parsed.indexOf(k) === -1) parsed.push(k); });
            return parsed;
        }

        function saveTileOrder() {
            if (!pluginConfig) return;
            pluginConfig.TileOrderCsv = tileOrder.join(',');
            // The tile colour list in Settings mirrors the tile grid's order.
            renderTileColorSettings();
            // Dedicated endpoint (see EmbyCastApi.SaveTileOrder) - same reasoning as the
            // ".cleanup-save" handler for not using updatePluginConfiguration().
            ajax('POST', 'EmbyCast/TileOrder', { TileOrderCsv: pluginConfig.TileOrderCsv }).then(function () {
                showStatus(view.querySelector('#tileOrderStatus'), t('msgTileOrderSaved'), 'ok');
            }, function () { /* non-critical - the new order still applies to this page instance */ });
        }

        // Used for the tiles on the homepage AND the rows of the tile colour list in Settings -
        // both carry data-key, both reorder the same tileOrder and save it right away.
        function wireTileDragHandlers(tile) {
            tile.addEventListener('dragstart', function (e) {
                dragKey = tile.getAttribute('data-key');
                tile._bcmSuppressClick = true;
                tile.classList.add('dragging');
                try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragKey); } catch (ex) { /* ignore */ }
            });
            tile.addEventListener('dragend', function () {
                tile.classList.remove('dragging');
                view.querySelectorAll('.drag-over').forEach(function (el) { el.classList.remove('drag-over'); });
                dragKey = null;
                // dragend always fires at the end of every drag gesture, whether or not it ended
                // in a valid drop (e.g. dropped back on itself, or outside any tile) - clearing
                // the suppress-next-click flag here too (in addition to the click handler itself
                // consuming it) guarantees it never survives past the gesture that set it, so an
                // aborted drag can never leave this tile's next real click silently swallowed.
                tile._bcmSuppressClick = false;
            });
            tile.addEventListener('dragover', function (e) {
                e.preventDefault();
                try { e.dataTransfer.dropEffect = 'move'; } catch (ex) { /* ignore */ }
                tile.classList.add('drag-over');
            });
            tile.addEventListener('dragleave', function () { tile.classList.remove('drag-over'); });
            tile.addEventListener('drop', function (e) {
                e.preventDefault();
                tile.classList.remove('drag-over');
                var targetKey = tile.getAttribute('data-key');
                // Prefer the key carried by the native drag payload (e.dataTransfer) over the
                // closure `dragKey` variable: some browsers fire a premature 'dragend' right after
                // 'dragstart', which resets dragKey before the drop. dragKey is only a fallback
                // in case dataTransfer access fails.
                var draggedKey = dragKey;
                try {
                    var fromTransfer = e.dataTransfer && e.dataTransfer.getData('text/plain');
                    if (fromTransfer) draggedKey = fromTransfer;
                } catch (ex) { /* ignore */ }
                if (!draggedKey || draggedKey === targetKey) return;
                var from = tileOrder.indexOf(draggedKey);
                var to = tileOrder.indexOf(targetKey);
                if (from === -1 || to === -1) return;
                tileOrder.splice(from, 1);
                tileOrder.splice(to, 0, draggedKey);
                renderTileGrid();
                saveTileOrder();
            });
        }

        function renderTileGrid() {
            var grid = view.querySelector('#tileGrid');
            if (!grid) return;
            grid.innerHTML = '';
            tileOrder.forEach(function (key) {
                var tile = document.createElement('div');
                tile.className = 'tile c-' + key;
                tile.setAttribute('draggable', 'true');
                tile.setAttribute('data-key', key);

                var iconSpan = document.createElement('span');
                iconSpan.className = 'tile-icon';
                iconSpan.innerHTML = ICONS[TILE_ICON_KEYS[key]] || '';
                tile.appendChild(iconSpan);

                var labelSpan = document.createElement('span');
                labelSpan.className = 'tile-label';
                labelSpan.textContent = t(TILE_TITLE_I18N[key]);
                tile.appendChild(labelSpan);

                if (key === 'timer') {
                    var cd = document.createElement('span');
                    cd.className = 'tile-countdown';
                    cd.style.display = 'none';
                    cd.innerHTML = '<span class="pulse-dot"></span><span id="tileCountdownText">--:--:--</span>';
                    tile.appendChild(cd);
                }

                tile.addEventListener('click', function () {
                    // A drag operation ends with a 'click' firing on the drop target in some
                    // browsers - suppress exactly that one synthetic click so dropping a tile
                    // doesn't also immediately navigate into it.
                    if (tile._bcmSuppressClick) { tile._bcmSuppressClick = false; return; }
                    openSection(key);
                });
                wireTileDragHandlers(tile);
                grid.appendChild(tile);
            });
            applyTileColors();
            renderTileBadges();
        }

        function setTileBadge(key, opts) {
            var grid = view.querySelector('#tileGrid');
            if (!grid) return;
            var tile = grid.querySelector('.tile[data-key="' + key + '"]');
            if (!tile) return;
            var existing = tile.querySelector('.tile-badge');
            if (existing) existing.parentNode.removeChild(existing);
            if (!opts) return;
            var badge = document.createElement('span');
            // opts.cls ('green'/'muted') selects the dot's color - see the .tile-badge.dot.green/
            // .tile-badge.dot.muted rules in app.html. Only meaningful together with opts.dot;
            // ignored for the plain numeric badges (Scheduled/Groups), which stay the original red.
            badge.className = 'tile-badge' + (opts.dot ? ' dot' : '') + (opts.cls ? ' ' + opts.cls : '');
            if (!opts.dot) badge.textContent = opts.text;
            tile.insertBefore(badge, tile.firstChild);
        }

        // Badge data all comes from state already loaded for other purposes (updateAvailableFlag
        // from the silent update check, lastScheduledItems from the Scheduled Message list,
        // lastTimerStatus/lastTimerPending from the timer poll, lastMediaNewsAutoEnabled from the
        // auto-send status, pluginConfig.WelcomeMessageEnabled/CleanupEnabled from the shared
        // config object) - no dedicated endpoint/request needed just for the tile grid.
        function renderTileBadges() {
            var grid = view.querySelector('#tileGrid');
            if (!grid) return;
            setTileBadge('updates', updateAvailableFlag ? { dot: true } : null);
            var count = (lastScheduledItems || []).length;
            setTileBadge('scheduled', count > 0 ? { text: String(count) } : null);
            setTileBadge('groups', allGroupsCache.length > 0 ? { text: String(allGroupsCache.length) } : null);

            // Media News / Welcome Message / Scheduled Cleanup: always show a dot reflecting
            // their persistent on/off state (green = on, grey = off) rather than hiding it when
            // off - unlike Timer below, "off" here is an admin-configured setting worth a
            // deliberate reminder, not just a normal resting state.
            setTileBadge('medianews', { dot: true, cls: lastMediaNewsAutoEnabled ? 'green' : 'muted' });
            setTileBadge('welcome', { dot: true, cls: (pluginConfig && pluginConfig.WelcomeMessageEnabled) ? 'green' : 'muted' });
            setTileBadge('cleanup', { dot: true, cls: (pluginConfig && pluginConfig.CleanupEnabled !== false) ? 'green' : 'muted' });
            // System Message: green = at least one entry can deliver (see anySystemMessageActive).
            setTileBadge('system', sysmsgLoaded ? { dot: true, cls: anySystemMessageActive() ? 'green' : 'muted' } : null);

            // Timer: only ever shows the green dot (active countdown running, or one scheduled
            // for later) - "nothing scheduled" is its normal resting state, not a toggle to
            // remind the admin about, so no grey/muted variant here.
            setTileBadge('timer', (lastTimerStatus || lastTimerPending) ? { dot: true, cls: 'green' } : null);

            var countdownEl = grid.querySelector('.tile[data-key="timer"] .tile-countdown');
            if (countdownEl) {
                countdownEl.style.display = lastTimerStatus ? 'flex' : 'none';
                if (lastTimerStatus) {
                    // Paint the current value immediately (using formatHms(), the same helper
                    // refreshTimerStatus() uses) rather than leaving the "--:--:--" placeholder
                    // showing until the next 1s poll tick - matters right after a tile reorder,
                    // since renderTileGrid() rebuilds this element from scratch.
                    var textEl = countdownEl.querySelector('#tileCountdownText');
                    if (textEl) textEl.textContent = formatHms(lastTimerStatus.SecondsRemaining);
                }
            }
        }

        function formatDurationShort(totalSeconds) {
            totalSeconds = Math.max(0, totalSeconds || 0);
            var h = Math.floor(totalSeconds / 3600);
            var m = Math.floor((totalSeconds % 3600) / 60);
            var s = totalSeconds % 60;
            if (h > 0) return h + 'h ' + m + 'm';
            if (m > 0) return m + 'm ' + s + 's';
            return s + 's';
        }

        // Plain-text (not HTML) equivalent of buildRecipientLineHtml(), for the "Offene
        // Aufträge" list below the tile grid.
        function recipientSummaryText(s) {
            var mode = s.RecipientMode || 'All';
            if (mode === 'Specific') {
                var ids = s.SpecificUserIds || [];
                var groupIds = s.SpecificGroupIds || [];
                if (ids.length === 0 && groupIds.length === 0) return t('recipientSpecific');
                var names = groupIds.map(function (id) { return '👥 ' + resolveGroupName(id); })
                    .concat(ids.map(resolveUserName));
                if (names.length > RECIPIENT_NAMES_SHOWN_COLLAPSED) {
                    return names.slice(0, RECIPIENT_NAMES_SHOWN_COLLAPSED).join(', ') + ' ' +
                        fmt('recipientMoreLink', names.length - RECIPIENT_NAMES_SHOWN_COLLAPSED);
                }
                return names.join(', ');
            }
            return mode === 'Active' ? t('recipientActive') : t('recipientAll');
        }

        // "Offene Aufträge": not-yet-sent Scheduled Messages plus an active Timer/Countdown, if
        // any - deliberately excludes the Media News weekly auto-send job (confirmed with the
        // admin: that job isn't considered an "open item" the way a one-off scheduled message or
        // a running countdown is).
        function renderOpenOrders() {
            var el = view.querySelector('#openOrdersList');
            if (!el) return;
            var items = [];
            (lastScheduledItems || []).forEach(function (s) {
                items.push({
                    title: displayTitle(s.Header, s.TimeoutMs),
                    sub: localeDateTimeString(new Date(s.SendAtUtc)) + ' · ' + recipientSummaryText(s),
                    targetKey: 'scheduled'
                });
            });
            if (lastTimerStatus) {
                items.push({
                    title: t('openOrderTimerActive'),
                    sub: fmt('openOrderEndsIn', formatDurationShort(lastTimerStatus.SecondsRemaining)),
                    targetKey: 'timer'
                });
            } else if (lastTimerPending) {
                items.push({
                    title: t('openOrderTimerScheduled'),
                    sub: fmt('timerStartsAt', localeDateTimeString(new Date(lastTimerPending.ScheduledStartUtc))),
                    targetKey: 'timer'
                });
            }
            if (items.length === 0) {
                el.innerHTML = '<p style="opacity:.35;font-size:.85em;margin:0;">' + esc(t('openOrdersNone')) + '</p>';
                return;
            }
            el.innerHTML = '';
            items.forEach(function (item) {
                var row = document.createElement('div');
                row.className = 'open-order-item';
                row.innerHTML =
                    '<div class="oo-main"><span class="oo-title"></span><span class="oo-sub"></span></div>' +
                    '<span class="oo-arrow"></span>';
                row.querySelector('.oo-title').textContent = item.title;
                row.querySelector('.oo-sub').textContent = item.sub;
                row.querySelector('.oo-arrow').textContent = fmt('tileArrow', t(TILE_TITLE_I18N[item.targetKey]));
                row.addEventListener('click', function () { openSection(item.targetKey); });
                el.appendChild(row);
            });
        }

        // returnTo (optional): when given, the back-link shows "Back to <returnTo>" and jumps
        // there instead of the tile overview - used by the "✎ Manage groups" deep link so
        // editing a group from mid-composition can hop back to exactly where you were. A normal
        // tile click never passes this, so returnToSection is cleared on any "plain" navigation.
        function openSection(key, returnTo) {
            if (TILE_KEYS.indexOf(key) === -1) return;
            currentSection = key;
            returnToSection = (returnTo && TILE_KEYS.indexOf(returnTo) !== -1 && returnTo !== key) ? returnTo : null;
            view.querySelector('#tileGridView').style.display = 'none';
            view.querySelectorAll('.bcm-section').forEach(function (sec) {
                sec.style.display = (sec.getAttribute('data-section') === key) ? '' : 'none';
            });
            view.querySelector('#bcmDetailHeader').style.display = 'flex';
            view.querySelector('#bcmDetailTitle').textContent = t(TILE_TITLE_I18N[key]);
            updateBackLinkLabel();
            window.scrollTo(0, 0);
            // Only History needs a post-open hook right now: its Expand/Collapse measurement
            // (see measureHistoryCollapse()) can't run correctly while the section was still
            // display:none, so re-run it now that it's actually visible.
            if (key === 'history') {
                measureHistoryCollapse();
                // Entries can be added server-side while this page stays open (System Message,
                // scheduled messages, timer, welcome) - reload so they show up.
                loadHistory();
            }
            // Groups' member counts/names can go stale while the admin was composing elsewhere
            // (e.g. after a group edit made via this very deep link, then navigating back in and
            // out again) - cheap to just always re-render on open.
            if (key === 'groups') renderGroupsList();
            if (key === 'system') loadSystemMessages();
        }

        function updateBackLinkLabel() {
            var labelEl = view.querySelector('#bcmBackLink .bcm-back-label');
            if (!labelEl) return;
            labelEl.textContent = returnToSection ? fmt('backToSection', t(TILE_TITLE_I18N[returnToSection])) : t('backToOverview');
        }

        function showGrid() {
            currentSection = null;
            returnToSection = null;
            view.querySelector('#tileGridView').style.display = '';
            view.querySelectorAll('.bcm-section').forEach(function (sec) { sec.style.display = 'none'; });
            view.querySelector('#bcmDetailHeader').style.display = 'none';
            renderTileBadges();
            renderOpenOrders();
        }

        var backLinkEl = view.querySelector('#bcmBackLink');
        if (backLinkEl) backLinkEl.addEventListener('click', function () {
            if (returnToSection) {
                var target = returnToSection;
                returnToSection = null;
                openSection(target);
            } else {
                showGrid();
            }
        });

        // ---------------- init ----------------

        function init() {
            applyBackgroundAwareTheme();
            currentLang = loadLangPreference();
            renderPresetChips();
            syncCustomPresetField();
            applyStaticTranslations();
            // The static HTML always ships its suggested defaults in English; if the resolved
            // language is German, translate those default field values right away too.
            swapDefaultFieldTexts('en', currentLang);
            DISPLAY_PREFIXES.forEach(applyDisplayMode);
            toggleAutoFields();
            // Both static Preview buttons ship with a plain "Preview" placeholder in the HTML;
            // set their real (localized) "show" label up front so they're correct before the
            // admin's first click, rather than only updating on toggle.
            relabelStaticPreviewButtons();
            // Render the tile grid immediately with the default order, so the homepage has
            // content right away instead of waiting on the config round-trip below; re-rendered
            // again once the admin's saved TileOrderCsv (if any) comes back.
            renderTileGrid();

            ApiClient.getPluginConfiguration(PLUGIN_ID).then(function (config) {
                pluginConfig = config;
                tileOrder = parseTileOrder(config.TileOrderCsv);
                savedTileColors = parseTileColors(config);
                tileColorForm = cloneTileColors(savedTileColors);
                renderTileGrid();
                renderTileColorSettings();
                if (!window.localStorage || !window.localStorage.getItem(LANG_STORAGE_KEY)) {
                    var configLang = config.Language === 'de' ? 'de' : 'en';
                    if (configLang !== currentLang) {
                        swapDefaultFieldTexts(currentLang, configLang);
                        currentLang = configLang;
                        applyStaticTranslations();
                        relabelStaticPreviewButtons();
                    }
                }
                if (config.TimerPresetMinutesCsv) {
                    enabledPresets = config.TimerPresetMinutesCsv.split(',')
                        .map(function (s) { return parseInt(s.trim(), 10); })
                        .filter(function (n) { return !isNaN(n) && n > 0; });
                    savedPresets = enabledPresets.slice();
                    renderPresetChips();
                    syncCustomPresetField();
                    updateTimerPreview();
                }
                view.querySelector('.welcome-enabled').checked = !!config.WelcomeMessageEnabled;
                view.querySelector('.welcome-header').value = localizeStoredDefault(config.WelcomeMessageHeader, 'defaultWelcomeHeader');
                view.querySelector('.welcome-text').value = localizeStoredDefault(config.WelcomeMessageText, 'defaultWelcomeText');

                view.querySelector('.settings-loglevel').value = config.LogLevel || 'ErrorsAndWarnings';
                view.querySelector('.settings-prerelease').checked = config.IncludePreReleases === true;
                renderBetaNote();
                view.querySelector('.settings-offline').checked = config.OfflineDeliveryEnabled !== false;
                view.querySelector('.cleanup-offline-days').value = config.OfflineMessageMaxAgeDays || 7;
                view.querySelector('.cleanup-history-days').value = config.HistoryMaxAgeDays || 14;
                view.querySelector('.cleanup-history-max-entries').value = config.HistoryMaxEntries || 300;
                view.querySelector('.cleanup-type-instant').checked = config.HistoryCleanupIncludeInstant !== false;
                view.querySelector('.cleanup-type-scheduled').checked = config.HistoryCleanupIncludeScheduled !== false;
                view.querySelector('.cleanup-type-timer').checked = config.HistoryCleanupIncludeTimer !== false;
                view.querySelector('.cleanup-type-medianews').checked = config.HistoryCleanupIncludeMediaNews !== false;
                view.querySelector('.cleanup-type-welcome').checked = config.HistoryCleanupIncludeWelcome !== false;
                view.querySelector('.cleanup-type-offline').checked = config.HistoryCleanupIncludeOffline !== false;
                view.querySelector('.cleanup-type-system').checked = config.HistoryCleanupIncludeSystem !== false;
                view.querySelector('.cleanup-enabled').checked = config.CleanupEnabled !== false;

                // Media News header/period/libraries/series entries/episode format are
                // deliberately NOT restored from the saved config here. These fields are shared
                // between "Send Media News Now" and "Save Auto-send Settings"; a saved weekly job
                // is never edited in place - to change it, turn it off and save fresh settings.
                // So the form always starts at its fixed defaults (as in app.html, localized by
                // swapDefaultFieldTexts() above)
                // rather than showing whatever a previously saved job happens to use - that keeps
                // a value left over from one job (or from a one-off manual send) from silently
                // ending up in the next "Save Auto-send Settings" click.
                toggleEpisodeTemplateField();

                // Auto-send Weekday/Time/Enabled were previously never restored from the saved
                // config at all - the form always showed the static HTML defaults (Friday,
                // 18:00, unchecked) regardless of what was actually saved and running, which is
                // exactly what made the reported timezone mixup hard to spot. Day/Hour/Minute are
                // stored as UTC (see PluginConfiguration.cs) - convert back to local for display.
                view.querySelector('.medianews-auto-enabled').checked = !!config.MediaNewsAutoSendEnabled;
                if (config.MediaNewsAutoSendDay) {
                    var localAuto = utcDayTimeToLocal(config.MediaNewsAutoSendDay, config.MediaNewsAutoSendHour || 0, config.MediaNewsAutoSendMinute || 0);
                    var dayOption = view.querySelector('.medianews-auto-day option[value="' + localAuto.day + '"]');
                    if (dayOption) view.querySelector('.medianews-auto-day').value = localAuto.day;
                    view.querySelector('.medianews-auto-time').value =
                        ('0' + localAuto.hour).slice(-2) + ':' + ('0' + localAuto.minute).slice(-2);
                }
                toggleAutoFields();
            }).catch(function () { /* defaults already in the markup */ });

            loadUsersAndSessions();
            loadLibraries();
            loadScheduled();
            loadHistory();
            refreshTimerStatus();
            refreshMediaNewsAutoStatus();
            loadCleanupStats();
            refreshSystemMessageBadge();
            // Silent - only drives the Plugin-Updates tile's dot badge, see
            // silentCheckForUpdateBadge() above. Cheap: reads the server-side cache
            // (UpdateChecker.CacheTtl, currently 7 days) via the read-only "Cached" route instead
            // of forcing a fresh GitHub request on every page load.
            silentCheckForUpdateBadge();
        }

        // Guards against this page staying visible/interactive after the admin switched to a
        // different (non-admin) Emby user and navigated back - e.g. Dashboard -> EmbyCast, switch
        // user via Emby's own user picker, then the browser's Back button. Originally written
        // a browser back/forward-cache restore, but Emby's own SPA "revisited this view without a
        // reload" mechanism (this.onResume) causes the same - so the check runs from BOTH
        // this.onResume and the pageshow listener below, whichever fires.
        //
        // Re-uses the existing, already-idempotent getPluginConfiguration call (rather than
        // adding a dependency on a specific User/Policy field shape) purely as an admin-only
        // probe - a 401/403 here means the current session's user is no longer an admin, so the
        // fix is to navigate away from this admin-only content (every /EmbyCast/... route is
        // [Authenticated(Roles="Admin")] - an action attempted on the stale page would otherwise
        // only fail later with "Forbidden").
        //
        // Deliberately NOT window.location.reload(): Emby's web client intercepts same-URL
        // reloads and re-renders this same admin-only view, which would trigger this check again -
        // an endless 403 loop. Navigating to the bare app root (window.location.origin/pathname,
        // no EmbyCast hash) lands the non-admin user on their normal home page instead.
        //
        // Returns a promise resolving to true if the session is still admin (caller may proceed),
        // false if a navigation-away was triggered (caller should stop, a fresh page load is
        // already underway).
        function reloadIfNoLongerAdmin() {
            return ApiClient.getPluginConfiguration(PLUGIN_ID).then(function () {
                return true;
            }).catch(function (err) {
                var status = err && (err.status || (err.response && err.response.status));
                if (status === 401 || status === 403) {
                    window.location.href = window.location.origin + window.location.pathname;
                    return false;
                }
                // Some other transient error (network hiccup, etc.) - not a sign the session lost
                // admin rights, so let the caller proceed as usual rather than getting stuck.
                return true;
            });
        }

        this.onResume = function () {
            BaseView.prototype.onResume.apply(this, arguments);
            reloadIfNoLongerAdmin().then(function (stillAdmin) {
                if (!stillAdmin) return;
                // Re-check in case the admin switched the Emby dashboard theme in another
                // tab/page since this view was last active.
                applyBackgroundAwareTheme();
                loadUsersAndSessions();
                loadScheduled();
                loadHistory();
                refreshTimerStatus();
                refreshMediaNewsAutoStatus();
                loadCleanupStats();
                refreshSystemMessageBadge();
                renderTileBadges();
                renderOpenOrders();
            });
        };

        this.onPause = function () {
            stopTimerPolling();
            BaseView.prototype.onPause.apply(this, arguments);
        };

        // Second layer of the same guard (see reloadIfNoLongerAdmin above), for the case where a
        // genuine browser back/forward-cache (bfcache) restore happens instead of - or in
        // addition to - Emby's own onResume: the whole page (DOM and JS state included) is pulled
        // back out of the browser's memory as-is, without re-running this View's constructor,
        // init(), or necessarily onResume either. window.addEventListener('pageshow', ...) with
        // event.persisted is the standard, browser-native way to detect that case.
        //
        // Self-unregisters the first time it notices its own `view` is no longer attached to the
        // document - each EmbyCast page visit constructs a brand-new View (and thus a brand-new
        // listener) without ever tearing down the previous one, so without this the number of
        // stale, window-level listeners (each still holding a closure over an old, detached view)
        // would grow by one on every single visit to this page for the lifetime of the browser
        // tab, each one needlessly re-running on every future pageshow anywhere in the app.
        function handleBfcacheRestore(event) {
            if (!document.body.contains(view)) {
                window.removeEventListener('pageshow', handleBfcacheRestore);
                return;
            }
            if (!event.persisted) return;
            reloadIfNoLongerAdmin();
        }
        window.addEventListener('pageshow', handleBfcacheRestore);

        init();
    }

    View.prototype = Object.create(BaseView.prototype);
    View.prototype.constructor = View;

    return View;
});
