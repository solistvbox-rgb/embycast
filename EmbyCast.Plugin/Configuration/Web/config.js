define(['baseView'], function (BaseView) {
    'use strict';

    // GUID must match EmbyCast.Plugin.Plugin.Id in Plugin.cs.
    var PLUGIN_ID = '0245cf9a-831e-41cf-b49c-1d5c5705f572';
    var LANG_STORAGE_KEY = 'embyCastLang';
    var SERVER_VERSION_STORAGE_KEY = 'embyCastServerVersion';

    // =====================================================================
    // Translations - every visible string in config.html has a matching
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
            timerDesc: 'Announce a countdown (e.g. before a restart) with reminders sent at chosen minute marks. The session list is re-checked before every reminder, so users who log in mid-countdown still get the remaining reminders.',
            mediaNewsTitle: 'Media News',
            mediaNewsDesc: 'Announce recently added movies and TV shows.',
            welcomeTitle: 'Welcome Message',
            welcomeDesc: 'Automatically sent the first time a user ever logs in.',
            groupsTitle: 'User Groups',
            groupsDesc: 'Combine several users into a named group to quickly select them together as message recipients.',
            historyTitle: 'Status & History',
            historyDesc: "Every message this plugin has sent, with per-user delivery status. Green = delivered, yellow = pending (offline, will be delivered at next login).",

            labelHeader: 'Header',
            labelMessage: 'Message',
            labelMessageTemplate: 'Message (use {minutes} as a placeholder)',
            labelTimeout: 'Auto-dismiss (seconds, 0 = stays until dismissed)',
            noteTimeoutNotGuaranteed: 'Not every Emby client honors this exact number of seconds - some clients may show the message for a different length of time regardless of this value. 0 (stays until manually dismissed) is the one value reliably respected everywhere.',
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

            msgSending: 'Sending…',
            msgPleaseEnterMessage: 'Please enter a message before sending.',
            msgPleaseSelectUsers: 'Please select at least one user.',
            msgPleaseSelectLibrary: 'Please select at least one library first.',
            msgPleaseSelectLibraryForAuto: 'Please select at least one library before enabling automatic sending.',
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

            msgNoSupportedLibraries: 'No libraries with a usable content type (movies/tvshows) found.',

            labelWebOnly: 'Send only to web-browser sessions',
            webOnlyNote: 'Useful for long Media News lists, which often don\'t fit well on phone or TV apps. Users without an active web-browser session won\'t get it right away - it stays saved and is delivered automatically the next time they log in via a web browser. If it\'s still undelivered by then, it will eventually be removed automatically according to the "Scheduled Cleanup" settings below.',

            cleanupTitle: 'Scheduled Cleanup',
            cleanupDesc: 'Automatically cleans up undelivered messages and old history entries.',
            cleanupStorageFile: 'Stored file: {0}',
            cleanupStorageHistory: 'History: {0} entrie(s) (~{1})',
            cleanupStorageOffline: 'Offline queue: {0} entrie(s) (~{1})',
            cleanupOfflinePrefix: 'Offline messages are marked "Expired" and removed from the queue after',
            cleanupOfflineSuffix: 'day(s).',
            cleanupHistoryPrefix: 'All selected history entries below are deleted after',
            cleanupHistorySuffix: 'day(s). Scheduled Messages and the Media News automation (weekly job) are not affected by this.',
            cleanupTypesTitle: 'Affected message types:',
            btnPurgeOffline: 'Delete all undelivered messages',
            btnPurgeHistory: 'Delete history now',
            btnSaveCleanup: 'Save Settings',
            msgCleanupSaved: 'Cleanup settings saved.',
            msgHistoryDaysTooLow: 'The history retention period cannot be shorter than the offline retention period ({0} day(s)).',
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
            mediaNewsStructureEpisodesLine: '- shows new Episodes added in the last {0} days'
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
            timerDesc: 'Kündigt einen Countdown an (z. B. vor einem Neustart) mit Erinnerungen zu ausgewählten Minutenmarken. Die Session-Liste wird vor jeder Erinnerung neu geprüft, damit User, die während des Countdowns dazukommen, die restlichen Erinnerungen ebenfalls erhalten.',
            mediaNewsTitle: 'Medien-Neuheiten',
            mediaNewsDesc: 'Kündigt kürzlich hinzugefügte Filme und Serien an.',
            welcomeTitle: 'Willkommensnachricht',
            welcomeDesc: 'Wird automatisch beim allerersten Login eines Users gesendet.',
            groupsTitle: 'User-Gruppen',
            groupsDesc: 'Mehrere User zu einer benannten Gruppe zusammenfassen, um sie beim Versenden gemeinsam auszuwählen.',
            historyTitle: 'Status & Historie',
            historyDesc: 'Alle von diesem Plugin gesendeten Nachrichten mit Zustellstatus pro User. Grün = zugestellt, Gelb = ausstehend (offline, wird beim nächsten Login zugestellt).',

            labelHeader: 'Titel',
            labelMessage: 'Nachricht',
            labelMessageTemplate: 'Nachricht (Platzhalter {minutes} verwendbar)',
            labelTimeout: 'Automatisch ausblenden (Sekunden, 0 = bleibt bis manuell geschlossen)',
            noteTimeoutNotGuaranteed: 'Nicht jeder Emby-Client hält sich exakt an diese Sekundenzahl - manche Clients zeigen die Nachricht unabhängig davon unterschiedlich lange an. 0 (bleibt bis manuell geschlossen) ist der einzige Wert, der zuverlässig überall eingehalten wird.',
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

            msgSending: 'Wird gesendet…',
            msgPleaseEnterMessage: 'Bitte eine Nachricht eingeben, bevor gesendet wird.',
            msgPleaseSelectUsers: 'Bitte mindestens einen User auswählen.',
            msgPleaseSelectLibrary: 'Bitte zuerst mindestens eine Bibliothek auswählen.',
            msgPleaseSelectLibraryForAuto: 'Bitte mindestens eine Bibliothek auswählen, bevor der automatische Versand aktiviert wird.',
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

            msgNoSupportedLibraries: 'Keine Bibliotheken mit nutzbarem Inhaltstyp (movies/tvshows) gefunden.',

            labelWebOnly: 'Nur an Web-Browser-Sitzungen senden',
            webOnlyNote: 'Sinnvoll bei langen Media-News-Listen, für die auf Handy- oder TV-Apps oft nicht genug Platz ist. Nutzer ohne aktive Web-Browser-Sitzung erhalten die Nachricht nicht sofort - sie bleibt gespeichert und wird automatisch zugestellt, sobald sie sich das nächste Mal per Web-Browser anmelden. Wird sie bis dahin nicht zugestellt, wird sie gemäß den Einstellungen unter "Geplante Reinigung" irgendwann automatisch gelöscht.',

            cleanupTitle: 'Geplante Reinigung',
            cleanupDesc: 'Räumt nicht zugestellte Nachrichten und alte Verlaufseinträge automatisch auf.',
            cleanupStorageFile: 'Gespeicherte Datei: {0}',
            cleanupStorageHistory: 'History: {0} Eintrag/Einträge (~{1})',
            cleanupStorageOffline: 'Offline-Warteschlange: {0} Eintrag/Einträge (~{1})',
            cleanupOfflinePrefix: 'Offline-Nachrichten werden nach',
            cleanupOfflineSuffix: 'Tag(en) als "Expired" markiert und aus der Warteschlange entfernt.',
            cleanupHistoryPrefix: 'Alle ausgewählten History-Einträge unten werden nach Ablauf von',
            cleanupHistorySuffix: 'Tag(en) gelöscht. Scheduled Messages und Media-News-Automatik (wöchentlicher Auftrag) sind davon nicht betroffen.',
            cleanupTypesTitle: 'Betroffene Nachrichtentypen:',
            btnPurgeOffline: 'Alle nicht zugestellten Nachrichten löschen',
            btnPurgeHistory: 'History sofort löschen',
            btnSaveCleanup: 'Einstellungen speichern',
            msgCleanupSaved: 'Einstellungen für die Reinigung gespeichert.',
            msgHistoryDaysTooLow: 'Die History-Aufbewahrungsdauer darf nicht kürzer sein als die Offline-Aufbewahrungsdauer ({0} Tag(e)).',
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
            mediaNewsStructureEpisodesLine: '- zeigt neue Episoden, die in den letzten {0} Tagen hinzugefügt wurden'
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

        // ---------------- stale-cache detection ----------------

        // The Emby dashboard has repeatedly been observed serving a stale, browser-cached copy of
        // this exact config.html/config.js pair after an update - sometimes surviving even a
        // plain reload, only fixed by a manual hard-refresh (Ctrl+Shift+R). This asks the server
        // (a tiny, uncached GET - see EmbyCastApi's GetPluginVersion) what plugin version is
        // ACTUALLY running right now, and compares it against the version this exact browser last
        // recorded seeing. A mismatch means this browser is very likely showing an outdated
        // cached page, so it forces a real navigation with a changed query string - browsers
        // always fetch a changed URL fresh over the network, never from a cached response for the
        // old URL, regardless of how aggressively that old response's headers said to cache it.
        // Note: this guarantees a fresh config.html, but can't guarantee it also busts the cache
        // for the separate config.js module Emby's own dashboard framework loads via RequireJS
        // (that request's URL/caching is controlled by Emby, not by this code) - in practice a
        // full navigation like this should still refresh it in the vast majority of setups, but
        // if it's ever not enough, a manual hard-refresh remains the fallback.
        //
        // Deliberately runs on every single page load (not just once) and is cheap (one small
        // GET) - this is what lets it self-correct automatically on every future release from
        // here on, without needing anyone to remember to hard-refresh again.
        function checkForStaleClientAndReload() {
            if (!window.localStorage) return;
            ajax('GET', 'EmbyCast/PluginVersion').then(function (result) {
                var serverVersion = result && result.Version;
                if (!serverVersion) return;
                var lastKnown;
                try { lastKnown = window.localStorage.getItem(SERVER_VERSION_STORAGE_KEY); } catch (e) { return; }
                try {
                    window.localStorage.setItem(SERVER_VERSION_STORAGE_KEY, serverVersion);
                    // Read back and confirm the write actually stuck before trusting it to
                    // prevent a future reload loop - some browsers/extensions allow reads but
                    // silently swallow writes (e.g. certain privacy modes or storage-quota edge
                    // cases). If the new value didn't really persist, bail out entirely rather
                    // than risk re-triggering the same reload on every subsequent page load
                    // forever with no way to ever record that it already happened once.
                    if (window.localStorage.getItem(SERVER_VERSION_STORAGE_KEY) !== serverVersion) return;
                } catch (e) { return; }
                // No stored value yet (first time this check has ever run in this browser) -
                // nothing to compare against, just record the baseline. Only a genuine CHANGE
                // since last time indicates a stale cache.
                if (!lastKnown || lastKnown === serverVersion) return;
                try {
                    var url = new URL(window.location.href);
                    url.searchParams.set('_bcmv', serverVersion);
                    window.location.replace(url.toString());
                } catch (e) {
                    window.location.reload();
                }
            }, function () { /* version check failed (offline, etc.) - never block the page over this */ });
        }

        // ---------------- light/dark theme detection ----------------

        // Emby swaps in an entirely different stylesheet per dashboard theme rather than toggling
        // a documented body class/attribute we could target directly, so instead of guessing at
        // undocumented Emby internals, this measures the ACTUAL rendered background behind the
        // page at runtime and derives light-vs-dark from that - correct regardless of how Emby
        // implements theming internally, and regardless of which of Emby's several themes (not
        // just "Light"/"Dark") is active. Adds/removes a `bcm-light-bg` class on the root view
        // element; see the matching `.bcm-light-bg ...` overrides in config.html for the actual
        // color adjustments (currently: darker text inside the status/badge/history-tag pills,
        // which are tuned by default for the dark theme and are low-contrast on a light one).
        function applyBackgroundAwareTheme() {
            try {
                var probe = view;
                var bg = null;
                // Walk every ancestor all the way up to and including <html> - previously stopped
                // one level short of <html> and only separately fell back to <body> (itself
                // already covered by this same walk, since body is always view's ancestor), which
                // meant a theme painting its background on <html> itself was never seen and this
                // silently kept whatever bcm-light-bg state happened to already be set (normally
                // "not light", i.e. the dark-theme-tuned defaults). Confirmed 2026-08-24: Emby has
                // a SEPARATE theme setting just for the Dashboard (independent of the main
                // library-view theme), and its Light Dashboard theme apparently does exactly
                // that - <html>.parentElement is naturally null, so the loop still terminates on
                // its own without a separate stop condition.
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
        var TIMER_TEXT_DEFAULT_KEYS = ['defaultTimerText', 'defaultTimerTextShutdown'];

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
        // anything the admin actually typed is left untouched. "None" intentionally has no
        // default of its own: selecting it leaves whatever text is already there as-is.
        function updateTimerTextForAction(action) {
            var el = view.querySelector('.timer-text');
            if (!el || !isTimerTextDefault(el.value)) return;
            if (action === 'ShutdownServer') el.value = t('defaultTimerTextShutdown');
            else if (action === 'RestartServer') el.value = t('defaultTimerText');
            updateTimerPreview();
        }

        // Unlike updateTimerTextForAction() above (which only overwrites .timer-text if it's
        // still showing a default, so a custom message an admin is mid-typing isn't clobbered by
        // just picking a different post-action from the dropdown), this always resets it - used
        // after a timer has actually been started, mirroring how Instant Message/Scheduled
        // Message already clear their text field unconditionally once it's been sent. "None" has
        // no default text of its own (see isTimerTextDefault/TIMER_TEXT_DEFAULT_KEYS above), so
        // it resets to empty rather than leaving the just-used message behind.
        function resetTimerTextToDefault(action) {
            var el = view.querySelector('.timer-text');
            if (!el) return;
            if (action === 'ShutdownServer') el.value = t('defaultTimerTextShutdown');
            else if (action === 'RestartServer') el.value = t('defaultTimerText');
            else el.value = '';
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
            updateTimerPreview();
            refreshMediaNewsAutoStatus();
            renderTileGrid();
            renderOpenOrders();
            renderInstalledVersion();
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

        // ---------------- recipient pickers (shared across sections) ----------------

        var RECIPIENT_PREFIXES = ['instant', 'scheduled', 'timer', 'medianews'];

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

                // "Gruppen" sub-section, shown only once at least one group exists - lets an
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
                            '<span class="group-chip">' + esc(fmt('groupMemberCountChip', group.UserIds.length)) + '</span>';
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
                var names = (group.UserIds || []).map(resolveUserName);
                var memberText = names.length === 0
                    ? t('msgGroupEmpty')
                    : fmt('groupMembersLine', names.length,
                        names.slice(0, 4).join(', ') + (names.length > 4 ? ', …' : ''));
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
                closeGroupForm();
                showStatus(view.querySelector('.groups-status'), t('msgGroupSaved'), 'ok');
                loadUsersAndSessions();
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        function deleteGroup(id, name) {
            if (!window.confirm(fmt('msgConfirmDeleteGroup', name))) return;
            ajax('DELETE', 'EmbyCast/Groups/' + id).then(function () {
                showStatus(view.querySelector('.groups-status'), t('msgGroupDeleted'), 'ok');
                loadUsersAndSessions();
            }, function (err) {
                showStatus(view.querySelector('.groups-status'), t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
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
                if (result.UpdateAvailable && !result.ChecksumAvailable) {
                    // Server refuses to install a release with no GitHub-provided SHA-256 digest
                    // available (see Plugin.InstallUpdateAsync) - don't even show the Install
                    // button, so the admin isn't led into clicking it just to get an error.
                    showStatus(statusEl, fmt('msgUpdateNoChecksum', result.LatestVersion, result.CurrentVersion), 'err');
                } else if (result.UpdateAvailable) {
                    showStatus(statusEl, fmt('msgUpdateAvailable', result.LatestVersion, result.CurrentVersion), 'ok');
                    view.querySelector('.update-install').style.display = '';
                } else {
                    showStatus(statusEl, fmt('msgUpToDate', result.CurrentVersion), 'ok');
                }
            }, function (err) {
                btn.disabled = false;
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        }

        function installUpdate() {
            var btn = view.querySelector('.update-install');
            var statusEl = view.querySelector('.update-status');
            btn.disabled = true;
            showStatus(statusEl, t('msgUpdateInstalling'), 'ok');

            // result.Message here comes straight from the server (Plugin.InstallUpdateAsync) and
            // is English-only, unlike the check-for-update status above which this file builds
            // itself from translated strings - matches the EmbyNotify reference plugin's
            // behavior for this specific message.
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

        // ---------------- instant message ----------------

        view.querySelector('.instant-send').addEventListener('click', function () {
            var header = view.querySelector('.instant-header').value.trim() || t('defaultInstantHeader');
            var text = view.querySelector('.instant-text').value.trim();
            var timeoutSec = parseInt(view.querySelector('.instant-timeout').value, 10) || 0;
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
                Header: header, Text: text, TimeoutMs: timeoutSec * 1000,
                RecipientMode: mode, UserIds: userIds, GroupIds: groupIds
            }).then(function (result) {
                btn.disabled = false;
                if (result.Error) { showStatus(statusEl, t('errorPrefix') + result.Error, 'err'); return; }
                showStatus(statusEl, fmt('msgSent', result.Delivered, result.Pending, result.Failed), 'ok');
                view.querySelector('.instant-header').value = t('defaultInstantHeader');
                view.querySelector('.instant-text').value = '';
                view.querySelector('.instant-timeout').value = 0;
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
            view.querySelector('.scheduled-timeout').value = 0;
            view.querySelector('.scheduled-datetime').value = '';
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
            view.querySelector('.scheduled-timeout').value = Math.round((item.TimeoutMs || 0) / 1000);
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
            var header = view.querySelector('.scheduled-header').value.trim() || t('defaultScheduledHeader');
            var text = view.querySelector('.scheduled-text').value.trim();
            var timeoutSec = parseInt(view.querySelector('.scheduled-timeout').value, 10) || 0;
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
                Header: header, Text: text, TimeoutMs: timeoutSec * 1000,
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
                var when = new Date(s.SendAtUtc).toLocaleString();
                row.innerHTML =
                    '<div class="bcm-history-head">' +
                    '<span><strong>' + esc(s.Header) + '</strong> &mdash; ' + esc(when) + '</span>' +
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
                    if (!window.confirm(t('msgConfirmCancelSchedule'))) return;
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
        function renderFinalText(template) {
            var text = template || '';
            if (FINAL_PHRASE_EN.test(text)) return text.replace(FINAL_PHRASE_EN, 'now');
            if (FINAL_PHRASE_DE.test(text)) return text.replace(FINAL_PHRASE_DE, 'jetzt');
            return text.replace('{minutes}', '0');
        }

        function updateTimerPreview() {
            var header = view.querySelector('.timer-header').value.trim() || t('defaultTimerHeader');
            var template = view.querySelector('.timer-text').value || '';
            var total = parseInt(view.querySelector('.timer-total').value, 10) || 0;
            // "<= total" (not "<"): a preset equal to the total countdown fires immediately at
            // t=0, so it belongs in the preview too - matches TimerService.StartTimer's filter.
            var presets = enabledPresets.filter(function (p) { return p <= total; })
                .slice().sort(function (a, b) { return b - a; });

            var lines = presets.map(function (p) {
                return '[' + header + '] ' + template.replace('{minutes}', p);
            });
            lines.push('[' + header + '] ' + renderFinalText(template));
            view.querySelector('.timer-preview').textContent = lines.join('\n');
        }

        ['timer-header', 'timer-text', 'timer-total'].forEach(function (cls) {
            view.querySelector('.' + cls).addEventListener('input', updateTimerPreview);
        });

        // Swaps the message template to match the selected post-countdown action (unless the
        // admin already customized it) - see updateTimerTextForAction above.
        view.querySelector('.timer-postaction').addEventListener('change', function () {
            updateTimerTextForAction(this.value);
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
            var header = view.querySelector('.timer-header').value.trim() || t('defaultTimerHeader');
            var template = view.querySelector('.timer-text').value.trim();
            var total = parseInt(view.querySelector('.timer-total').value, 10) || 0;
            var timeoutSec = parseInt(view.querySelector('.timer-timeout').value, 10) || 0;
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
                RecipientMode: mode, UserIds: userIds, GroupIds: groupIds, TimeoutMs: timeoutSec * 1000
            };
            if (scheduledStartUtc) payload.ScheduledStartUtc = scheduledStartUtc;

            ajax('POST', 'EmbyCast/Timer/Start', payload).then(function (result) {
                // The single-timer slot may already be occupied - see EmbyCastApi.
                // Post(StartTimer)'s guard, which returns {Success:false, AlreadyExists:true}
                // (a normal 200 response, not a thrown error) precisely so this can show a clear,
                // specific status message instead of a generic "Error: ...".
                if (result && result.Success === false) {
                    showStatus(statusEl, t('msgTimerAlreadyExists'), 'err');
                    return;
                }
                showStatus(statusEl, t(scheduledStartUtc ? 'msgTimerScheduled' : 'msgTimerStarted'), 'ok');
                view.querySelector('.timer-header').value = t('defaultTimerHeader');
                resetTimerTextToDefault(postAction);
                view.querySelector('.timer-total').value = 60;
                view.querySelector('.timer-timeout').value = 10;
                enabledPresets = DEFAULT_PRESETS.slice();
                view.querySelector('.timer-preset-custom').value = '';
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
            var when = fmt('timerStartsAt', new Date(status.ScheduledStartUtc).toLocaleString());
            el.innerHTML =
                '<div class="bcm-history-item">' +
                '<div class="bcm-history-head">' +
                '<span><strong>' + esc(status.Header) + '</strong> &mdash; ' + esc(when) + '</span>' +
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

        // Builds a purely structural preview of the message - the section labels and a
        // placeholder-style description line for each (using the currently configured Header and
        // lookback-days), rather than the actual movie/show titles that would be found. Replaced
        // the old "real content" preview (which hit EmbyCast/MediaNews/Preview or PreviewSaved)
        // 2026-08-24 per user feedback: admins just want to check the message's shape/wording,
        // not preview real library content here. "New Movies" has no matching checkbox (Movies
        // are queried unconditionally, same as the real digest - see MediaNewsService.
        // ToMessageText, though there that section only actually prints once at least one movie
        // was found; here it's always shown, since this is a preview of the possible structure,
        // not of an actual result), so it's shown unconditionally; "New TV Shows"/"New Episodes"
        // mirror their own checkboxes.
        // Deliberately built client-side with no network call - it no longer depends on which (if
        // any) libraries are selected.
        function buildMediaNewsStructureLines(header, days, includeSeries, includeEpisodes) {
            var lines = ['[' + header + ']', t('mediaNewsStructureMovies'), fmt('mediaNewsStructureMoviesLine', days)];
            if (includeSeries) lines.push('', t('mediaNewsStructureSeries'), fmt('mediaNewsStructureSeriesLine', days));
            if (includeEpisodes) lines.push('', t('mediaNewsStructureEpisodes'), fmt('mediaNewsStructureEpisodesLine', days));
            return lines.join('\n');
        }

        // For the two form-based preview buttons (main section + auto-send fields) - reads
        // straight from whatever is currently in the form, matching what buildMediaNewsPayload()
        // above would send.
        function buildMediaNewsStructurePreviewText() {
            var header = view.querySelector('.medianews-header').value.trim() || t('defaultMediaNewsHeader');
            var days = parseInt(view.querySelector('.medianews-days').value, 10) || 7;
            return buildMediaNewsStructureLines(header, days, getIncludeNewSeries(), getIncludeNewEpisodes());
        }

        // For the "upcoming auto-send" card's saved-config preview - reads from the SAVED
        // MediaNewsAutoStatusDto (see renderMediaNewsAutoStatus below) rather than the form, same
        // "saved, not whatever's unsaved in the form" distinction the old PreviewSaved endpoint
        // existed for.
        function buildMediaNewsStructurePreviewTextFromStatus(status) {
            var header = (status && status.Header) || t('defaultMediaNewsHeader');
            var days = (status && status.LookbackDays) || 7;
            return buildMediaNewsStructureLines(header, days, !!(status && status.IncludeNewSeries), !!(status && status.IncludeNewEpisodes));
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
        // elements and its own text-producing function. All three now build a purely structural
        // preview client-side (see buildMediaNewsStructurePreviewText[FromStatus]) rather than
        // hitting the server for real content - fetchPromiseFn is still a Promise-returning
        // function (resolved immediately, via Promise.resolve) so this toggle/show/hide/close-
        // button plumbing didn't need to change. Toggles: a second click while already shown just
        // hides it again - only a click while hidden (re)builds the text.
        //
        // validateFn (optional) runs only when about to SHOW a new preview (not when just hiding
        // an already-shown one) - currently unused (the structural preview has nothing to
        // validate), kept for any future preview kind that needs it.
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
                // max-height/overflow-y in config.html) can always be dismissed without scrolling
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
            // Purely structural preview, built client-side - no request, no library-selection
            // guard (the structure doesn't depend on which libraries are picked). See
            // buildMediaNewsStructurePreviewText().
            toggleMediaNewsPreview(btn, view.querySelector('.medianews-preview'), view.querySelector('.medianews-status'),
                function () { return Promise.resolve({ Text: buildMediaNewsStructurePreviewText() }); });
        });

        view.querySelector('.medianews-send').addEventListener('click', function () {
            var statusEl = view.querySelector('.medianews-status');
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
        // used by .medianews-auto-day in config.html, and what SaveMediaNewsAutoConfig.Day binds
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
                IncludeNewSeries: getIncludeNewSeries(), IncludeNewEpisodes: getIncludeNewEpisodes(), EpisodeTemplate: getEpisodeTemplate()
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

            return [
                t('labelWeekday') + ': ' + t('day' + localDay) + ', ' + t('labelTime') + ': ' + localTime,
                t('labelLookbackDays') + ': ' + payload.LookbackDays,
                t('labelHeader') + ': ' + payload.Header,
                t('labelLibraries') + ': ' + (libNames.length ? libNames.join(', ') : t('valueNoneSelected')),
                t('labelSeriesMode') + ': ' + (seriesBits.length ? seriesBits.join(' / ') : t('valueNoneSelected')),
                t('labelRecipients') + ': ' + t(recipientKey)
            ].join('\n');
        }

        view.querySelector('.medianews-auto-preview-btn').addEventListener('click', function () {
            var btn = this;
            toggleMediaNewsPreview(btn, view.querySelector('.medianews-auto-preview'), view.querySelector('.medianews-auto-status'),
                function () { return Promise.resolve({ Text: buildMediaNewsStructurePreviewText() }); });
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
            // Enabling automatic sending with no library checked would silently never send
            // anything, ever, forever. (MediaNewsAutoScheduler also independently guards against
            // this server-side, in case an admin already had Enabled=true with no library saved
            // before this check existed - see its own "no library selected" log warning.)
            if (payload.LibraryIdsCsv === '') {
                showStatus(statusEl, t('msgPleaseSelectLibraryForAuto'), 'err');
                return;
            }
            if (!window.confirm(fmt('msgConfirmSaveAutoConfig', buildAutoConfigSummaryText(payload)))) return;
            ajax('POST', 'EmbyCast/MediaNews/AutoConfig', payload).then(function (status) {
                showStatus(statusEl, t('msgAutoSettingsSaved'), 'ok');
                renderMediaNewsAutoStatus(status);
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        // Cancels the recurring auto-send directly from the "upcoming send" card (see
        // renderMediaNewsAutoStatus below) - equivalent to unchecking "Send automatically" and
        // clicking "Save Auto-send Settings", but in one click, mirroring the "Cancel" button
        // already available for one-off Scheduled Messages.
        function cancelMediaNewsAutoSend() {
            if (!window.confirm(t('msgConfirmCancelAutoSend'))) return;
            var statusEl = view.querySelector('.medianews-auto-status');
            ajax('POST', 'EmbyCast/MediaNews/AutoConfig', buildAutoConfigPayload(false)).then(function (status) {
                view.querySelector('.medianews-auto-enabled').checked = false;
                toggleAutoFields();
                showStatus(statusEl, t('msgAutoSendCancelled'), 'ok');
                renderMediaNewsAutoStatus(status);
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        }

        // Local date/time formatting without seconds, e.g. "20.8.2026, 20:00" (de) / "8/20/2026,
        // 8:00 PM" (en) - matches the user's requested card format, which shows minute precision
        // only (the default toLocaleString() included seconds, which looked noisy/overly precise
        // for a weekly recurring send).
        function formatDateNoSeconds(iso) {
            var d = new Date(iso);
            return d.toLocaleDateString() + ', ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

        // Persists Header/Text together with the given enabled state in one call. Used directly
        // by the toggle switch's 'change' handler below - there are no separate "Save"/
        // "Turn off" buttons anymore (removed: flipping the switch alone used to do nothing until
        // one of those buttons was also clicked, which was confusing). enabledOverride is always
        // passed explicitly from the switch's own event so the persisted value matches exactly
        // what the admin just set.
        function saveWelcomeConfig(enabledOverride, successKey) {
            var statusEl = view.querySelector('.welcome-status');
            if (!pluginConfig) return;
            var toggleEl = view.querySelector('.welcome-enabled');
            var enabled = enabledOverride !== undefined ? enabledOverride : toggleEl.checked;
            var previousEnabled = pluginConfig.WelcomeMessageEnabled;
            pluginConfig.WelcomeMessageEnabled = enabled;
            pluginConfig.WelcomeMessageHeader = view.querySelector('.welcome-header').value.trim() || t('defaultWelcomeHeader');
            pluginConfig.WelcomeMessageText = view.querySelector('.welcome-text').value.trim();
            pluginConfig.Language = currentLang;

            ApiClient.updatePluginConfiguration(PLUGIN_ID, pluginConfig).then(function (result) {
                toggleEl.checked = enabled;
                showStatus(statusEl, t(successKey), 'ok');
                if (window.Dashboard && Dashboard.processPluginConfigurationUpdateResult) {
                    try { Dashboard.processPluginConfigurationUpdateResult(result); } catch (e) { /* ignore */ }
                }
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
            var dateText = new Date(lastRunUtc).toLocaleDateString();
            el.textContent = fmt('noteMarkExistingUsersLastRun', dateText, count || 0);
            el.style.display = '';
        }

        // Same idea as renderMarkExistingLastRun above, but for the opposite "Reset welcomed
        // users" button (its own persistent hint element, .welcome-unmark-lastrun).
        function renderUnmarkExistingLastRun(lastRunUtc, count) {
            var el = view.querySelector('.welcome-unmark-lastrun');
            if (!el) return;
            if (!lastRunUtc) { el.style.display = 'none'; return; }
            var dateText = new Date(lastRunUtc).toLocaleDateString();
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
            if (!window.confirm(t('msgConfirmUnmarkExisting'))) return;
            var statusEl = view.querySelector('.welcome-mark-status');
            var btn = this;
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
                    badges += '<span class="bcm-badge ' + statusClass + '" title="' + esc(statusText) + '">' + esc(rec.Username) + '</span>';
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
                    if (hasPending && !window.confirm(t('msgConfirmDismissPending'))) return;
                    ajax('DELETE', 'EmbyCast/History/' + h.Id).then(function (result) {
                        var note = (result && result.CancelledOfflineCount) ? ' ' + fmt('msgOfflineCancelled', result.CancelledOfflineCount) : '';
                        showStatus(view.querySelector('.history-status'), t('msgHistoryDismissed') + note, 'ok');
                        loadHistory();
                    });
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
            if (!window.confirm(t('msgConfirmClearHistory'))) return;
            ajax('POST', 'EmbyCast/History/ClearAll').then(function (result) {
                var note = (result && result.CancelledOfflineCount) ? ' ' + fmt('msgOfflineCancelled', result.CancelledOfflineCount) : '';
                showStatus(view.querySelector('.history-status'), t('msgHistoryCleared') + note, 'ok');
                loadHistory();
            });
        });

        // ---------------- scheduled cleanup ("Geplante Reinigung") ----------------

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
                IncludeOffline: view.querySelector('.cleanup-type-offline').checked
            };
        }

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

            pluginConfig.OfflineMessageMaxAgeDays = offlineDays;
            pluginConfig.HistoryMaxAgeDays = historyDays;
            var types = getCleanupTypeCheckboxes();
            pluginConfig.HistoryCleanupIncludeInstant = types.IncludeInstant;
            pluginConfig.HistoryCleanupIncludeScheduled = types.IncludeScheduled;
            pluginConfig.HistoryCleanupIncludeTimer = types.IncludeTimer;
            pluginConfig.HistoryCleanupIncludeMediaNews = types.IncludeMediaNews;
            pluginConfig.HistoryCleanupIncludeWelcome = types.IncludeWelcome;
            pluginConfig.HistoryCleanupIncludeOffline = types.IncludeOffline;

            ApiClient.updatePluginConfiguration(PLUGIN_ID, pluginConfig).then(function (result) {
                showStatus(statusEl, t('msgCleanupSaved'), 'ok');
                if (window.Dashboard && Dashboard.processPluginConfigurationUpdateResult) {
                    try { Dashboard.processPluginConfigurationUpdateResult(result); } catch (e) { /* ignore */ }
                }
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
            ApiClient.updatePluginConfiguration(PLUGIN_ID, pluginConfig).then(function (result) {
                showStatus(statusEl, t(enabled ? 'msgCleanupEnabled' : 'msgCleanupDisabled'), 'ok');
                if (window.Dashboard && Dashboard.processPluginConfigurationUpdateResult) {
                    try { Dashboard.processPluginConfigurationUpdateResult(result); } catch (e) { /* ignore */ }
                }
                renderTileBadges();
            }, function (err) {
                // Revert both the visible switch AND the shared pluginConfig object on failure -
                // reverting only the checkbox would leave pluginConfig.CleanupEnabled holding the
                // never-actually-persisted value, which the unrelated ".cleanup-save" button would
                // then silently write out on its next click.
                view.querySelector('.cleanup-enabled').checked = !enabled;
                pluginConfig.CleanupEnabled = !enabled;
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        view.querySelector('.cleanup-purge-offline').addEventListener('click', function () {
            var statusEl = view.querySelector('.cleanup-status');
            var count = lastCleanupStats ? lastCleanupStats.OfflineQueueCount : 0;
            if (!count) { showStatus(statusEl, t('msgNothingToPurge'), 'ok'); return; }
            if (!window.confirm(fmt('msgConfirmPurgeOffline', count))) return;
            ajax('POST', 'EmbyCast/Cleanup/PurgeOffline').then(function (result) {
                showStatus(statusEl, fmt('msgPurgedOffline', (result && result.Count) || 0), 'ok');
                loadCleanupStats();
                loadHistory();
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        view.querySelector('.cleanup-purge-history').addEventListener('click', function () {
            var statusEl = view.querySelector('.cleanup-status');
            if (!window.confirm(t('msgConfirmPurgeHistory'))) return;
            ajax('POST', 'EmbyCast/Cleanup/PurgeHistory', getCleanupTypeCheckboxes()).then(function (result) {
                showStatus(statusEl, fmt('msgPurgedHistory', (result && result.Count) || 0), 'ok');
                loadCleanupStats();
                loadHistory();
            }, function (err) {
                showStatus(statusEl, t('errorPrefix') + (err && (err.statusText || err.status) || 'unknown'), 'err');
            });
        });

        // ---------------- tile homepage ----------------

        // Order matches the previous top-to-bottom card layout, used as the default (and as the
        // fallback for any key missing from a saved TileOrderCsv - see parseTileOrder()).
        var TILE_KEYS = ['updates', 'instant', 'scheduled', 'timer', 'medianews', 'welcome', 'groups', 'history', 'cleanup'];
        var TILE_ICON_KEYS = {
            updates: 'refresh', instant: 'message', scheduled: 'calendar', timer: 'server',
            medianews: 'speaker', welcome: 'door', groups: 'people', history: 'history', cleanup: 'trash'
        };
        var TILE_TITLE_I18N = {
            updates: 'updatesTitle', instant: 'instantTitle', scheduled: 'scheduledTitle', timer: 'timerTitle',
            medianews: 'mediaNewsTitle', welcome: 'welcomeTitle', groups: 'groupsTitle', history: 'historyTitle', cleanup: 'cleanupTitle'
        };
        // Tabler Icons (outline set, MIT licensed), inlined so no extra network request is needed
        // to render the tile grid.
        var ICONS = {
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
            ApiClient.updatePluginConfiguration(PLUGIN_ID, pluginConfig).then(function (result) {
                if (window.Dashboard && Dashboard.processPluginConfigurationUpdateResult) {
                    try { Dashboard.processPluginConfigurationUpdateResult(result); } catch (e) { /* ignore */ }
                }
                showStatus(view.querySelector('#tileOrderStatus'), t('msgTileOrderSaved'), 'ok');
            }, function () { /* non-critical - the new order still applies to this page instance */ });
        }

        function wireTileDragHandlers(tile) {
            tile.addEventListener('dragstart', function (e) {
                dragKey = tile.getAttribute('data-key');
                tile._bcmSuppressClick = true;
                tile.classList.add('dragging');
                try { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', dragKey); } catch (ex) { /* ignore */ }
            });
            tile.addEventListener('dragend', function () {
                tile.classList.remove('dragging');
                view.querySelectorAll('.tile.drag-over').forEach(function (el) { el.classList.remove('drag-over'); });
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
                // closure `dragKey` variable. Confirmed via live debugging (Chrome DevTools,
                // 2026-08) that some environments fire an extra, premature 'dragend' event right
                // after 'dragstart' - before the real 'drop' ever happens. Since the dragend
                // handler below resets dragKey to null, that spurious early dragend was wiping
                // dragKey before this drop handler ever ran, silently aborting every reorder even
                // though the drop itself landed correctly. e.dataTransfer isn't affected by that
                // spurious dragend (it's tied to the native drag session, not our own event
                // handlers) and reliably still holds the value set in dragstart's setData() call -
                // dragKey is kept only as a fallback for the unlikely case dataTransfer access
                // itself fails.
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
            // .tile-badge.dot.muted rules in config.html. Only meaningful together with opts.dot;
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
                    title: s.Header,
                    sub: new Date(s.SendAtUtc).toLocaleString() + ' · ' + recipientSummaryText(s),
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
                    sub: fmt('timerStartsAt', new Date(lastTimerPending.ScheduledStartUtc).toLocaleString()),
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
            if (key === 'history') measureHistoryCollapse();
            // Groups' member counts/names can go stale while the admin was composing elsewhere
            // (e.g. after a group edit made via this very deep link, then navigating back in and
            // out again) - cheap to just always re-render on open.
            if (key === 'groups') renderGroupsList();
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
            // Runs first, before anything else - if this browser turns out to be showing a stale
            // cached copy of this very page, everything below is about to be thrown away by a
            // forced reload anyway, so there's no point doing it now.
            checkForStaleClientAndReload();
            applyBackgroundAwareTheme();
            currentLang = loadLangPreference();
            renderPresetChips();
            syncCustomPresetField();
            applyStaticTranslations();
            // The static HTML always ships its suggested defaults in English; if the resolved
            // language is German, translate those default field values right away too.
            swapDefaultFieldTexts('en', currentLang);
            updateTimerPreview();
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
                renderTileGrid();
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
                    renderPresetChips();
                    syncCustomPresetField();
                    updateTimerPreview();
                }
                view.querySelector('.welcome-enabled').checked = !!config.WelcomeMessageEnabled;
                view.querySelector('.welcome-header').value = localizeStoredDefault(config.WelcomeMessageHeader, 'defaultWelcomeHeader');
                view.querySelector('.welcome-text').value = localizeStoredDefault(config.WelcomeMessageText, 'defaultWelcomeText');

                view.querySelector('.cleanup-offline-days').value = config.OfflineMessageMaxAgeDays || 7;
                view.querySelector('.cleanup-history-days').value = config.HistoryMaxAgeDays || 14;
                view.querySelector('.cleanup-type-instant').checked = config.HistoryCleanupIncludeInstant !== false;
                view.querySelector('.cleanup-type-scheduled').checked = config.HistoryCleanupIncludeScheduled !== false;
                view.querySelector('.cleanup-type-timer').checked = config.HistoryCleanupIncludeTimer !== false;
                view.querySelector('.cleanup-type-medianews').checked = config.HistoryCleanupIncludeMediaNews !== false;
                view.querySelector('.cleanup-type-welcome').checked = config.HistoryCleanupIncludeWelcome !== false;
                view.querySelector('.cleanup-type-offline').checked = config.HistoryCleanupIncludeOffline !== false;
                view.querySelector('.cleanup-enabled').checked = config.CleanupEnabled !== false;

                // Media News Header/Zeitraum/Bibliotheken/Serien-Einträge/Episoden-Format are
                // deliberately NOT restored from the saved config here. These fields are shared
                // between the manual "Send Media News
                // Now" button and the "Save Auto-send Settings" button below; per the admin's
                // decision, an already-saved weekly job is never edited in place through this
                // form again - if it needs to change, the intended workflow is to turn it off and
                // save fresh settings. So the form always starts at its fixed defaults (as
                // already shipped in config.html, localized by swapDefaultFieldTexts() above)
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
            // Silent - only drives the Plugin-Updates tile's dot badge, see
            // silentCheckForUpdateBadge() above. Cheap: reads the server-side cache
            // (UpdateChecker.CacheTtl, currently 7 days) via the read-only "Cached" route instead
            // of forcing a fresh GitHub request on every page load.
            silentCheckForUpdateBadge();
        }

        // Guards against this page staying visible/interactive after the admin switched to a
        // different (non-admin) Emby user and navigated back - e.g. Dashboard -> EmbyCast, switch
        // user via Emby's own user picker, then the browser's Back button. Originally written
        // assuming a genuine browser back/forward-cache (bfcache) restore (see the pageshow
        // listener below), but real-world testing (2026-08-23) showed the stale page also appears
        // this way on Emby's own built-in admin settings pages, not just EmbyCast - meaning what's
        // actually firing in this scenario is Emby's own SPA-level "revisited this view without a
        // real document reload" mechanism (this.onResume), not a true browser bfcache restore.
        // The two are different browser/app mechanisms and don't reliably fire together, so this
        // check now runs from BOTH this.onResume and the pageshow listener, whichever actually
        // fires for a given browser/navigation path.
        //
        // Re-uses the existing, already-idempotent getPluginConfiguration call (rather than
        // adding a dependency on a specific User/Policy field shape) purely as an admin-only
        // probe - a 401/403 here means the current session's user is no longer an admin, so the
        // fix is to navigate away from this admin-only content (every /EmbyCast/... route is
        // [Authenticated(Roles="Admin")] - an action attempted on the stale page would otherwise
        // only fail later with "Forbidden").
        //
        // Deliberately NOT window.location.reload(): live testing (2026-08-23) showed Emby's own
        // web client intercepts same-URL reloads through the browser's Navigation API and
        // re-renders the current hash route client-side (appRouter.sendRouteToViewManager) rather
        // than performing a real full-document reload - since the current route is still this
        // exact EmbyCast page, that just reconstructs this same admin-only view again, whose
        // init() immediately re-triggers this same 401/403 detection, calling reload() again -
        // an infinite loop (confirmed live: constant 403s in the console, page never actually
        // changes). Navigating to a different URL - the bare app root, with no EmbyCast hash -
        // breaks that loop: even if Emby's router intercepts this too, it has a different route
        // to resolve and lands the current (non-admin) user on their own normal home page instead
        // of bouncing back to this one (confirmed manually by the admin: visiting the bare
        // server/web/index.html URL as the switched-to non-admin user correctly shows their
        // normal start page). Built from window.location.origin/pathname rather than any
        // hardcoded address, so this works on every installation's own server URL.
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
