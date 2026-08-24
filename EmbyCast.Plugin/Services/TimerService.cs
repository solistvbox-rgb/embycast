using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using EmbyCast.Plugin.Models;
using EmbyCast.Plugin.Storage;
using MediaBrowser.Controller;
using MediaBrowser.Model.Logging;

namespace EmbyCast.Plugin.Services
{
    public class TimerStatusDto
    {
        public bool Active { get; set; }
        /// <summary>True if a timer job is scheduled to start later but hasn't started yet
        /// (mutually exclusive with Active - never both true). Drives the "Upcoming Timer &amp;
        /// Server Countdown" card on the dashboard.</summary>
        public bool Pending { get; set; }
        public string Header { get; set; }
        public string TextTemplate { get; set; }
        public DateTime StartUtc { get; set; }
        public DateTime EndUtc { get; set; }
        public int SecondsRemaining { get; set; }
        public List<int> PresetMinutes { get; set; } = new List<int>();
        public List<int> FiredPresets { get; set; } = new List<int>();
        public string PostAction { get; set; }
        public string LastError { get; set; }
        /// <summary>Populated for both Active and Pending, so the dashboard can build a "To: ..."
        /// recipient line either way (see config.js's buildRecipientLineHtml, which already
        /// works off any object exposing these three fields, e.g. a scheduled-message record).</summary>
        public string RecipientMode { get; set; }
        public List<string> SpecificUserIds { get; set; } = new List<string>();
        public List<string> SpecificGroupIds { get; set; } = new List<string>();
        /// <summary>Pending-only: when this timer is due to actually start.</summary>
        public DateTime? ScheduledStartUtc { get; set; }
        /// <summary>Pending-only: the countdown length it will run for once started (Active
        /// status instead exposes the already-computed StartUtc/EndUtc).</summary>
        public int TotalMinutes { get; set; }
    }

    /// <summary>
    /// Runs a single countdown/timer job in the background. Only one timer can be active at a
    /// time (matches the dashboard's single "Start Timer" / "Cancel Timer" pair).
    ///
    /// CRITICAL requirement this class satisfies: before each preset interval is sent, the
    /// current session list is re-queried from ISessionManager (via DeliveryService.SendAsync,
    /// which always calls sessionManager.Sessions fresh - see DeliveryService) so users who log
    /// in mid-countdown still receive the remaining preset messages, not just the ones who were
    /// online when the timer started.
    /// </summary>
    public class TimerService
    {
        private readonly DeliveryService _delivery;
        private readonly MessageStore _store;
        private readonly IServerApplicationHost _appHost;
        private readonly ILogger _logger;

        private CancellationTokenSource _cts;
        private readonly object _lock = new object();

        public TimerService(DeliveryService delivery, MessageStore store, IServerApplicationHost appHost, ILogManager logManager)
        {
            _delivery = delivery;
            _store = store;
            _appHost = appHost;
            _logger = logManager.GetLogger(nameof(TimerService));
        }

        public TimerStatusDto GetStatus()
        {
            var state = _store.GetActiveTimer();
            if (state == null) return new TimerStatusDto { Active = false, Pending = false };

            if (state.Active)
            {
                var remaining = (int)Math.Max(0, (state.EndUtc - DateTime.UtcNow).TotalSeconds);
                return new TimerStatusDto
                {
                    Active = true,
                    Pending = false,
                    Header = state.Header,
                    TextTemplate = state.TextTemplate,
                    StartUtc = state.StartUtc,
                    EndUtc = state.EndUtc,
                    SecondsRemaining = remaining,
                    PresetMinutes = state.PresetMinutes,
                    FiredPresets = state.FiredPresets,
                    PostAction = state.PostAction,
                    LastError = state.LastError,
                    RecipientMode = state.RecipientMode,
                    SpecificUserIds = state.SpecificUserIds,
                    SpecificGroupIds = state.SpecificGroupIds
                };
            }

            if (state.ScheduledStartUtc.HasValue)
            {
                return new TimerStatusDto
                {
                    Active = false,
                    Pending = true,
                    Header = state.Header,
                    TextTemplate = state.TextTemplate,
                    PresetMinutes = state.PresetMinutes,
                    PostAction = state.PostAction,
                    RecipientMode = state.RecipientMode,
                    SpecificUserIds = state.SpecificUserIds,
                    SpecificGroupIds = state.SpecificGroupIds,
                    ScheduledStartUtc = state.ScheduledStartUtc,
                    TotalMinutes = state.TotalMinutes
                };
            }

            // A record is left over from a timer that already completed or was cancelled -
            // Active=false, ScheduledStartUtc=null - kept around only so LastError/
            // CompletedActionRan can still be read back (see RunLoopAsync's finally block). Not
            // pending, not active: reported the same as "no timer" to the dashboard.
            return new TimerStatusDto { Active = false, Pending = false };
        }

        /// <summary>True if a timer job currently occupies the single-timer slot - either
        /// actively counting down, or scheduled/pending for a future start. A leftover record
        /// from a timer that already completed or was cancelled does NOT count (see GetStatus's
        /// doc comment above) - only used to decide whether starting/scheduling a new timer
        /// should be blocked with "already running/scheduled" rather than silently replacing it,
        /// per the admin's explicit request that a new Start no longer auto-cancels an existing
        /// one.</summary>
        public bool HasActiveOrPendingTimer()
        {
            var state = _store.GetActiveTimer();
            return state != null && (state.Active || state.ScheduledStartUtc.HasValue);
        }

        public TimerStatusDto StartTimer(
            string header,
            string textTemplate,
            int totalMinutes,
            List<int> presetMinutes,
            PostTimerAction postAction,
            RecipientMode recipientMode,
            List<string> specificUserIds,
            int timeoutMs = 0,
            List<string> specificGroupIds = null)
        {
            if (totalMinutes <= 0) throw new ArgumentException("totalMinutes must be > 0");

            var start = DateTime.UtcNow;
            var end = start.AddMinutes(totalMinutes);
            var presets = FilterPresets(presetMinutes, totalMinutes);

            var state = new TimerJobState
            {
                Header = string.IsNullOrWhiteSpace(header) ? "Countdown" : header,
                TextTemplate = string.IsNullOrWhiteSpace(textTemplate)
                    ? "The server will restart in {minutes} minute(s)."
                    : textTemplate,
                TimeoutMs = timeoutMs,
                TotalMinutes = totalMinutes,
                StartUtc = start,
                EndUtc = end,
                PresetMinutes = presets,
                FiredPresets = new List<int>(),
                PostAction = postAction.ToString(),
                RecipientMode = recipientMode.ToString(),
                SpecificUserIds = specificUserIds ?? new List<string>(),
                SpecificGroupIds = specificGroupIds ?? new List<string>(),
                Active = true,
                ScheduledStartUtc = null
            };
            // Atomic claim (not a separate HasActiveOrPendingTimer() check followed by directly
            // setting the store's ActiveTimer) so two near-simultaneous Start/Schedule requests
            // can't both pass a check and have the second silently overwrite the first - see
            // MessageStore.TryClaimTimerSlot's doc comment.
            if (!_store.TryClaimTimerSlot(state)) throw new InvalidOperationException("A timer is already active or scheduled.");
            LaunchRunLoop(state.Id);

            return GetStatus();
        }

        /// <summary>Same as StartTimer, but stores the job as pending (Active=false,
        /// ScheduledStartUtc set) instead of starting it right away - no background run-loop task
        /// is launched yet. TimerService's periodic CheckPendingStart() (see
        /// ScheduledMessageBackgroundService's poll loop, which calls it) actually starts the
        /// countdown once DateTime.UtcNow reaches scheduledStartUtc, and ResumeAfterRestart/the
        /// same CheckPendingStart poll pick it back up if the server restarts while it's still
        /// waiting, since it's persisted via MessageStore like everything else here.</summary>
        public TimerStatusDto ScheduleTimer(
            string header,
            string textTemplate,
            int totalMinutes,
            List<int> presetMinutes,
            PostTimerAction postAction,
            RecipientMode recipientMode,
            List<string> specificUserIds,
            DateTime scheduledStartUtc,
            int timeoutMs = 0,
            List<string> specificGroupIds = null)
        {
            if (totalMinutes <= 0) throw new ArgumentException("totalMinutes must be > 0");

            var presets = FilterPresets(presetMinutes, totalMinutes);

            var state = new TimerJobState
            {
                Header = string.IsNullOrWhiteSpace(header) ? "Countdown" : header,
                TextTemplate = string.IsNullOrWhiteSpace(textTemplate)
                    ? "The server will restart in {minutes} minute(s)."
                    : textTemplate,
                TimeoutMs = timeoutMs,
                TotalMinutes = totalMinutes,
                PresetMinutes = presets,
                FiredPresets = new List<int>(),
                PostAction = postAction.ToString(),
                RecipientMode = recipientMode.ToString(),
                SpecificUserIds = specificUserIds ?? new List<string>(),
                SpecificGroupIds = specificGroupIds ?? new List<string>(),
                Active = false,
                ScheduledStartUtc = scheduledStartUtc
            };
            // See StartTimer's identical comment - atomic claim, not check-then-act.
            if (!_store.TryClaimTimerSlot(state)) throw new InvalidOperationException("A timer is already active or scheduled.");

            return GetStatus();
        }

        // "<= totalMinutes" (not "<") on purpose: a preset equal to the total countdown means
        // "send the first reminder right when the timer starts" (at t=0, minutes remaining ==
        // totalMinutes), which is exactly what an admin who sets e.g. a 60-minute countdown with
        // a 60-minute preset expects to happen immediately. Shared by StartTimer and
        // ScheduleTimer so both filter presets identically.
        private static List<int> FilterPresets(List<int> presetMinutes, int totalMinutes) =>
            (presetMinutes ?? new List<int>())
                .Where(p => p > 0 && p <= totalMinutes)
                .Distinct()
                .OrderByDescending(p => p)
                .ToList();

        /// <summary>Called periodically from ScheduledMessageBackgroundService's poll loop to
        /// check whether a persisted pending timer's scheduled start time has arrived - if so,
        /// promotes it to an actually-running countdown (computes real StartUtc/EndUtc from now,
        /// clears ScheduledStartUtc, sets Active=true) and launches its run-loop task. A no-op if
        /// there's no timer, it's already active, or it's pending but not due yet.</summary>
        public void CheckPendingStart()
        {
            // Cheap unlocked pre-check first (no Save()) so the common every-20s tick - no
            // pending timer at all, or one that isn't due yet - doesn't touch the store file.
            var precheck = _store.GetActiveTimer();
            if (precheck == null || precheck.Active || !precheck.ScheduledStartUtc.HasValue) return;
            if (DateTime.UtcNow < precheck.ScheduledStartUtc.Value) return;

            // The actual due-check-and-promote happens again here, inside the mutate lambda -
            // i.e. under MessageStore's own lock, the same lock CancelTimer()'s UpdateActiveTimer
            // call uses. Without this second, atomic check, a CancelTimer() landing between the
            // pre-check above and this call could be silently clobbered: this method would still
            // go on to promote (and LaunchRunLoop) a timer the admin just cancelled.
            string promotedId = null;
            _store.UpdateActiveTimer(s =>
            {
                if (s.Active || !s.ScheduledStartUtc.HasValue || DateTime.UtcNow < s.ScheduledStartUtc.Value) return;
                var start = DateTime.UtcNow;
                s.StartUtc = start;
                s.EndUtc = start.AddMinutes(s.TotalMinutes);
                s.Active = true;
                s.ScheduledStartUtc = null;
                s.FiredPresets = new List<int>();
                promotedId = s.Id;
            });

            if (promotedId != null) LaunchRunLoop(promotedId);
        }

        /// <summary>Called once from EmbyCastEntryPoint.Run() at server startup to resume a timer
        /// that was actively counting down when the server last stopped. Without this, a
        /// persisted Active=true state would keep reporting a countdown forever without its
        /// remaining preset reminders, final message or post-action ever actually firing, since
        /// the in-memory background task that drives all of that only ever existed in the
        /// previous process. A no-op if no timer is persisted, or if the persisted timer isn't
        /// Active - a pending/scheduled timer is instead picked up by the regular
        /// CheckPendingStart() poll once its start time arrives, same as if the server hadn't
        /// restarted at all.</summary>
        public void ResumeAfterRestart()
        {
            var state = _store.GetActiveTimer();
            if (state == null || !state.Active) return;
            _logger.Info("EmbyCast: resuming an active timer job after restart (id {0}).", state.Id);
            LaunchRunLoop(state.Id);
        }

        private void LaunchRunLoop(string timerId)
        {
            lock (_lock)
            {
                _cts = new CancellationTokenSource();
                var token = _cts.Token;
                _ = Task.Run(() => RunLoopAsync(timerId, token), token);
            }
        }

        public bool CancelTimer()
        {
            CancellationTokenSource ctsToCancel;
            lock (_lock)
            {
                ctsToCancel = _cts;
                _cts = null;
            }
            if (ctsToCancel != null)
            {
                try { ctsToCancel.Cancel(); } catch { /* ignore */ }
            }

            // A pending (not-yet-started) timer never had a run-loop task/CTS to begin with, so
            // the old "if (_cts == null) return false;" short-circuit above used to leave it
            // stuck in the store forever, silently blocking every future Start/Schedule attempt -
            // fixed by always checking/clearing the persisted state itself, not just the CTS.
            var state = _store.GetActiveTimer();
            if (state == null || (!state.Active && !state.ScheduledStartUtc.HasValue))
                return false; // nothing active or pending to cancel

            _store.UpdateActiveTimer(s =>
            {
                s.Active = false;
                s.ScheduledStartUtc = null;
            });
            return true;
        }

        private async Task RunLoopAsync(string timerId, CancellationToken token)
        {
            try
            {
                while (!token.IsCancellationRequested)
                {
                    var state = _store.GetActiveTimer();
                    if (state == null || state.Id != timerId || !state.Active) return;

                    var now = DateTime.UtcNow;
                    if (now >= state.EndUtc) break;

                    var minutesRemaining = (int)Math.Ceiling((state.EndUtc - now).TotalMinutes);
                    var due = state.PresetMinutes
                        .Where(p => p >= minutesRemaining && !state.FiredPresets.Contains(p))
                        .ToList();

                    foreach (var preset in due)
                    {
                        await FirePresetAsync(state, preset).ConfigureAwait(false);
                    }

                    try { await Task.Delay(1000, token).ConfigureAwait(false); }
                    catch (TaskCanceledException) { return; }
                }

                // Countdown reached zero and wasn't cancelled.
                var finalState = _store.GetActiveTimer();
                if (finalState == null || finalState.Id != timerId || !finalState.Active) return;

                await SendFinalMessageAsync(finalState).ConfigureAwait(false);

                if (!token.IsCancellationRequested)
                {
                    var resultMessage = await PostTimerActionExecutor
                        .ExecuteAsync(finalState.PostAction, _appHost, _logger)
                        .ConfigureAwait(false);
                    _store.UpdateActiveTimer(s =>
                    {
                        if (s.Id != timerId) return;
                        s.CompletedActionRan = true;
                        s.LastError = resultMessage;
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.Error("EmbyCast: timer loop failed: {0}", ex.Message);
                if (!token.IsCancellationRequested)
                {
                    _store.UpdateActiveTimer(s => { if (s.Id == timerId) s.LastError = ex.Message; });
                }
            }
            finally
            {
                // Only mark this specific job inactive here on a genuine natural completion
                // (countdown reached zero, handled above) or a real error caught above - NOT
                // merely because this task is exiting due to its token being cancelled. A
                // cancellation always has one of two causes, and both already own the correct
                // persisted-state decision themselves: CancelTimer() (which synchronously sets
                // Active=false itself before this task even wakes up) or StopForShutdown() (which
                // deliberately leaves the persisted state untouched, precisely so a restart can
                // resume it - see its doc comment). Blindly setting Active=false here regardless
                // of why we're exiting used to silently undo StopForShutdown's entire point on
                // every ordinary server restart. The s.Id == timerId guard additionally protects
                // against a rarer race: this stale task for an already-cancelled timer A only
                // unblocking (and reaching here) after a brand-new timer B has already been
                // started, which without the guard would incorrectly deactivate B instead.
                if (!token.IsCancellationRequested)
                {
                    _store.UpdateActiveTimer(s => { if (s.Id == timerId) s.Active = false; });
                }
            }
        }

        private async Task FirePresetAsync(TimerJobState state, int preset)
        {
            try
            {
                var text = (state.TextTemplate ?? "").Replace("{minutes}", preset.ToString());
                var mode = Enum.TryParse<RecipientMode>(state.RecipientMode, out var m) ? m : RecipientMode.Active;

                await _delivery.SendAsync(
                    state.Header, text, state.TimeoutMs, mode, state.SpecificUserIds, MessageOrigin.Timer,
                    specificGroupIds: state.SpecificGroupIds
                ).ConfigureAwait(false);

                _store.UpdateActiveTimer(s =>
                {
                    if (!s.FiredPresets.Contains(preset)) s.FiredPresets.Add(preset);
                });
            }
            catch (Exception ex)
            {
                _logger.Warn("EmbyCast: failed to send timer preset {0}: {1}", preset, ex.Message);
            }
        }

        // Matches "in {minutes} minute(s)" (English default template) or "in {minutes}
        // Minute(n)" (German default template) so the zero-minute message reads naturally as
        // "...will restart now."/"...wird jetzt neu gestartet." instead of "...in 0 minute(s).".
        private static readonly Regex FinalPhraseEn = new Regex(@"in\s*\{minutes\}\s*minute\(s\)", RegexOptions.IgnoreCase);
        private static readonly Regex FinalPhraseDe = new Regex(@"in\s*\{minutes\}\s*Minute\(n\)", RegexOptions.IgnoreCase);

        /// <summary>Renders the timer's text template for the moment the countdown hits zero.
        /// Custom templates that don't match either shipped default simply fall back to
        /// substituting "0" for {minutes}, same as before.</summary>
        internal static string RenderFinalText(string template)
        {
            var text = template ?? "";
            if (FinalPhraseEn.IsMatch(text)) return FinalPhraseEn.Replace(text, "now");
            if (FinalPhraseDe.IsMatch(text)) return FinalPhraseDe.Replace(text, "jetzt");
            return text.Replace("{minutes}", "0");
        }

        private async Task SendFinalMessageAsync(TimerJobState state)
        {
            try
            {
                var text = RenderFinalText(state.TextTemplate);
                var mode = Enum.TryParse<RecipientMode>(state.RecipientMode, out var m) ? m : RecipientMode.Active;
                await _delivery.SendAsync(
                    state.Header, text, state.TimeoutMs, mode, state.SpecificUserIds, MessageOrigin.Timer,
                    specificGroupIds: state.SpecificGroupIds
                ).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.Warn("EmbyCast: failed to send final timer message: {0}", ex.Message);
            }
        }

        /// <summary>Called from the plugin's IServerEntryPoint.Dispose() so a running countdown's
        /// background task doesn't keep a thread alive after the plugin/server shuts down.
        /// Deliberately NOT the same as a user-initiated CancelTimer(): this must never touch the
        /// persisted timer state, only stop the in-memory task - an active or pending timer is
        /// meant to survive a restart (see ResumeAfterRestart/CheckPendingStart, and the admin's
        /// explicit request that a scheduled timer "soll bei Neustart nicht verloren gehen"), so
        /// shutdown marking it cancelled/clearing ScheduledStartUtc the way CancelTimer() does
        /// would silently destroy a still-valid scheduled timer on every ordinary server
        /// restart.</summary>
        public void StopForShutdown()
        {
            CancellationTokenSource ctsToCancel;
            lock (_lock)
            {
                ctsToCancel = _cts;
                _cts = null;
            }
            if (ctsToCancel != null)
            {
                try { ctsToCancel.Cancel(); } catch { /* ignore */ }
            }
        }
    }
}
