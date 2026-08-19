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
        public string Header { get; set; }
        public string TextTemplate { get; set; }
        public DateTime StartUtc { get; set; }
        public DateTime EndUtc { get; set; }
        public int SecondsRemaining { get; set; }
        public List<int> PresetMinutes { get; set; } = new List<int>();
        public List<int> FiredPresets { get; set; } = new List<int>();
        public string PostAction { get; set; }
        public string LastError { get; set; }
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
            if (state == null || !state.Active)
                return new TimerStatusDto { Active = false };

            var remaining = (int)Math.Max(0, (state.EndUtc - DateTime.UtcNow).TotalSeconds);
            return new TimerStatusDto
            {
                Active = true,
                Header = state.Header,
                TextTemplate = state.TextTemplate,
                StartUtc = state.StartUtc,
                EndUtc = state.EndUtc,
                SecondsRemaining = remaining,
                PresetMinutes = state.PresetMinutes,
                FiredPresets = state.FiredPresets,
                PostAction = state.PostAction,
                LastError = state.LastError
            };
        }

        public TimerStatusDto StartTimer(
            string header,
            string textTemplate,
            int totalMinutes,
            List<int> presetMinutes,
            PostTimerAction postAction,
            RecipientMode recipientMode,
            List<string> specificUserIds,
            int timeoutMs = 0)
        {
            if (totalMinutes <= 0) throw new ArgumentException("totalMinutes must be > 0");

            // Cancel whatever is currently running first - only one timer at a time.
            CancelTimer();

            var start = DateTime.UtcNow;
            var end = start.AddMinutes(totalMinutes);
            // "<= totalMinutes" (not "<") on purpose: a preset equal to the total countdown
            // means "send the first reminder right when the timer starts" (at t=0, minutes
            // remaining == totalMinutes), which is exactly what an admin who sets e.g. a
            // 60-minute countdown with a 60-minute preset expects to happen immediately.
            var presets = (presetMinutes ?? new List<int>())
                .Where(p => p > 0 && p <= totalMinutes)
                .Distinct()
                .OrderByDescending(p => p)
                .ToList();

            var state = new TimerJobState
            {
                Header = string.IsNullOrWhiteSpace(header) ? "Countdown" : header,
                TextTemplate = string.IsNullOrWhiteSpace(textTemplate)
                    ? "The server will restart in {minutes} minute(s)."
                    : textTemplate,
                TimeoutMs = timeoutMs,
                StartUtc = start,
                EndUtc = end,
                PresetMinutes = presets,
                FiredPresets = new List<int>(),
                PostAction = postAction.ToString(),
                RecipientMode = recipientMode.ToString(),
                SpecificUserIds = specificUserIds ?? new List<string>(),
                Active = true
            };
            _store.SetActiveTimer(state);

            lock (_lock)
            {
                _cts = new CancellationTokenSource();
                var token = _cts.Token;
                _ = Task.Run(() => RunLoopAsync(state.Id, token), token);
            }

            return GetStatus();
        }

        public bool CancelTimer()
        {
            lock (_lock)
            {
                if (_cts == null) return false;
                try { _cts.Cancel(); } catch { /* ignore */ }
                _cts = null;
            }
            _store.UpdateActiveTimer(s => s.Active = false);
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
                        s.CompletedActionRan = true;
                        s.LastError = resultMessage;
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.Error("EmbyCast: timer loop failed: {0}", ex.Message);
                _store.UpdateActiveTimer(s => s.LastError = ex.Message);
            }
            finally
            {
                _store.UpdateActiveTimer(s => s.Active = false);
            }
        }

        private async Task FirePresetAsync(TimerJobState state, int preset)
        {
            try
            {
                var text = (state.TextTemplate ?? "").Replace("{minutes}", preset.ToString());
                var mode = Enum.TryParse<RecipientMode>(state.RecipientMode, out var m) ? m : RecipientMode.Active;

                await _delivery.SendAsync(
                    state.Header, text, state.TimeoutMs, mode, state.SpecificUserIds, MessageOrigin.Timer
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
                    state.Header, text, state.TimeoutMs, mode, state.SpecificUserIds, MessageOrigin.Timer
                ).ConfigureAwait(false);
            }
            catch (Exception ex)
            {
                _logger.Warn("EmbyCast: failed to send final timer message: {0}", ex.Message);
            }
        }

        /// <summary>Called from the plugin's IServerEntryPoint.Dispose() so a running countdown
        /// doesn't keep a background thread alive after the plugin/server shuts down.</summary>
        public void StopForShutdown() => CancelTimer();
    }
}
