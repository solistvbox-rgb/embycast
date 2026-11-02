/*
 * EmbyCast dashboard SHELL loader - keep this file (and config.html) as stable as possible.
 *
 * Why this exists: Emby serves plugin pages as configurationpage?name=...&v=<SERVER version>
 * with a content-independent ETag and answers revalidation with 304. After a plugin update the
 * URL and ETag stay the same, so browsers kept running the previous dashboard until someone
 * cleared the cache by hand (F12 -> "Empty cache and hard reload").
 *
 * So this file only bootstraps: it asks the plugin for its current version, then loads the real
 * dashboard - app.html (markup) and app.js (the controller) - from EmbyCast's own endpoints
 * (EmbyCast/Client/Page and EmbyCast/Client/Script) with ?v=<plugin version> in the URL. Every
 * plugin version therefore gets new URLs that no browser has cached yet.
 *
 * The real controller (app.js) is constructed with the same view element and receives every
 * lifecycle call Emby makes on this controller (onBeginResume / onResume / onPause / destroy /
 * autoFocus).
 *
 * If THIS file ever has to change: bump SHELL_VERSION here and PluginVersionDto.ShellVersion in
 * EmbyCastApi.cs together. A browser still running an older shell then shows a notice asking
 * the admin to clear the browser cache once.
 */
define(['baseView', 'require'], function (BaseView, require) {
    'use strict';

    var SHELL_VERSION = 1;

    var TEXT = {
        en: {
            loading: 'Loading EmbyCast…',
            failed: 'EmbyCast could not be loaded.',
            failedHint: 'Please reload the page. If this keeps happening, clear the browser cache (F12 → right-click the reload button → "Empty cache and hard reload") and check the Emby server log.',
            staleShell: 'This browser is still using an outdated copy of the EmbyCast page frame.',
            staleShellHint: 'Please clear the browser cache once (F12 → right-click the reload button → "Empty cache and hard reload"). EmbyCast itself is already up to date.'
        },
        de: {
            loading: 'EmbyCast wird geladen…',
            failed: 'EmbyCast konnte nicht geladen werden.',
            failedHint: 'Bitte die Seite neu laden. Falls das wiederholt passiert, den Browser-Cache leeren (F12 → Rechtsklick auf Neu laden → „Cache leeren und vollständig aktualisieren“) und das Emby-Server-Log prüfen.',
            staleShell: 'Dieser Browser verwendet noch eine veraltete Kopie des EmbyCast-Seitenrahmens.',
            staleShellHint: 'Bitte den Browser-Cache einmal leeren (F12 → Rechtsklick auf Neu laden → „Cache leeren und vollständig aktualisieren“). EmbyCast selbst ist bereits aktuell.'
        }
    };

    function lang() {
        try { if (window.localStorage.getItem('embyCastLang') === 'de') return 'de'; } catch (e) { /* ignore */ }
        return 'en';
    }

    function t(key) { return TEXT[lang()][key]; }

    function noticeBox(title, hint, detail) {
        var box = document.createElement('div');
        box.className = 'embycast-shell-notice';
        box.style.cssText = 'margin:1em 0;padding:.9em 1.1em;border-radius:6px;border:1px solid rgba(230,160,0,.55);background:rgba(230,160,0,.12);line-height:1.45;';
        var strong = document.createElement('strong');
        strong.textContent = title;
        var p = document.createElement('div');
        p.style.cssText = 'margin-top:.35em;opacity:.85;';
        p.textContent = hint;
        box.appendChild(strong);
        box.appendChild(p);
        if (detail) {
            var d = document.createElement('div');
            d.style.cssText = 'margin-top:.5em;font-size:.82em;opacity:.6;font-family:monospace;word-break:break-word;';
            d.textContent = detail;
            box.appendChild(d);
        }
        return box;
    }

    function getText(url) {
        return ApiClient.ajax({ type: 'GET', url: url, dataType: 'text' }).then(function (result) {
            // Older ApiClient builds hand back the raw Response for non-JSON requests.
            return (result && typeof result.text === 'function') ? result.text() : result;
        });
    }

    // Runs app.js (an AMD module: define(['baseView'], factory)) and resolves with what its
    // factory returns - the real controller constructor. Evaluated from text rather than via a
    // <script src> so the request can carry the normal Emby auth header (the endpoint is
    // admin-only) and can never be answered from the browser's HTTP cache.
    function evaluateAppModule(code, versionTag) {
        return new Promise(function (resolve, reject) {
            var defined = false;
            function localDefine(deps, factory) {
                if (typeof deps === 'function') { factory = deps; deps = []; }
                defined = true;
                require(deps || [], function () {
                    try { resolve(factory.apply(null, arguments)); } catch (e) { reject(e); }
                }, reject);
            }
            localDefine.amd = {};
            try {
                /* eslint-disable no-new-func */
                new Function('define', code + '\n//# sourceURL=embycast-app-' + versionTag + '.js')(localDefine);
            } catch (e) {
                reject(e);
                return;
            }
            if (!defined) reject(new Error('app.js did not call define()'));
        });
    }

    function Shell(view, params) {
        BaseView.apply(this, arguments);

        var ctorArgs = arguments;
        var app = null;
        var visible = false;
        var lastResumeArgs = null;
        var destroyed = false;

        var slider = view.querySelector('.scrollSlider') || view;
        var status = slider.querySelector('.embycast-shell-status');
        if (status) status.textContent = t('loading');

        // ---- lifecycle forwarding -------------------------------------------------------
        this.onBeginResume = function () {
            BaseView.prototype.onBeginResume.apply(this, arguments);
            if (app && app.onBeginResume) app.onBeginResume.apply(app, arguments);
        };
        this.onResume = function () {
            BaseView.prototype.onResume.apply(this, arguments);
            visible = true;
            lastResumeArgs = arguments;
            if (app && app.onResume) app.onResume.apply(app, arguments);
        };
        this.onPause = function () {
            BaseView.prototype.onPause.apply(this, arguments);
            visible = false;
            if (app && app.onPause) app.onPause.apply(app, arguments);
        };
        this.destroy = function () {
            destroyed = true;
            if (app && app.destroy) {
                try { app.destroy.apply(app, arguments); } catch (e) { console.error('EmbyCast: app destroy failed', e); }
            }
            BaseView.prototype.destroy.apply(this, arguments);
        };
        this.autoFocus = function () {
            if (app && app.autoFocus) return app.autoFocus.apply(app, arguments);
            return BaseView.prototype.autoFocus.apply(this, arguments);
        };

        // ---- bootstrap ---------------------------------------------------------------
        ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl('EmbyCast/PluginVersion'), dataType: 'json' })
            .then(function (info) {
                var version = (info && info.Version) || 'unknown';
                var tag = encodeURIComponent(version);
                if (info && info.ShellVersion && info.ShellVersion > SHELL_VERSION) {
                    slider.insertBefore(noticeBox(t('staleShell'), t('staleShellHint')), slider.firstChild);
                }
                return Promise.all([
                    getText(ApiClient.getUrl('EmbyCast/Client/Page', { v: version })),
                    getText(ApiClient.getUrl('EmbyCast/Client/Script', { v: version }))
                ]).then(function (parts) {
                    if (destroyed) return;
                    if (status && status.parentNode) status.parentNode.removeChild(status);
                    var container = document.createElement('div');
                    container.innerHTML = parts[0];
                    while (container.firstChild) slider.appendChild(container.firstChild);
                    return evaluateAppModule(parts[1], tag).then(function (AppView) {
                        if (destroyed) return;
                        app = new AppView(view, ctorArgs[1], ctorArgs[2]);
                        // Emby may already have shown the view while app.js was loading.
                        if (visible && app.onResume) app.onResume.apply(app, lastResumeArgs || []);
                    });
                });
            })
            .catch(function (err) {
                console.error('EmbyCast: failed to load the dashboard', err);
                if (status && status.parentNode) status.parentNode.removeChild(status);
                var detail = err && (err.message || err.statusText || err.status) ? String(err.message || err.statusText || err.status) : '';
                slider.appendChild(noticeBox(t('failed'), t('failedHint'), detail));
            });
    }

    Shell.prototype = Object.create(BaseView.prototype);
    Shell.prototype.constructor = Shell;

    return Shell;
});
