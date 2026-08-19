# EmbyCast

An Emby Server plugin that lets admins send instant, scheduled, countdown/timer, media-news,
welcome and offline messages to users from a single dashboard page — with a full English/German
UI and a built-in self-updater.

<img width="768" height="512" alt="EmbyCast logo" src="assets/logo.png" />

## Features

- **Instant messages** to all users, active sessions, or a specific user.
- **Scheduled messages** — set a date/time, delivered automatically in the background.
- **Countdown/timer** broadcasts with configurable presets and an optional post-timer action
  (e.g. restart/shutdown notice).
- **Media news** — auto-generated "what's new" digests from your libraries, sendable on demand
  or on a weekly schedule.
- **Welcome message** for first-time logins and **offline delivery** (queued until the user next
  logs in).
- **Status & history** view of every sent message with per-user delivery status.
- **Self-update** — checks GitHub Releases for a newer version and installs it with one click.

## Credits

Built using the same SDK patterns as **EmbyNotify** and **EmbyWeeklyDigest**, two plugins created
by **[SFTech13](https://github.com/sftech13)**, which served as the architectural template for
this project. This project is not affiliated with SFTech13.

## Installation

1. Download `EmbyCast.Plugin.dll` from the [Releases](../../releases) page.
2. Copy it into your Emby Server `plugins` folder (e.g. `%ProgramData%\Emby-Server\plugins` on
   Windows, `/var/lib/emby/plugins` on Linux).
3. Restart Emby Server.
4. Go to **Dashboard → Plugins**, open "EmbyCast", and configure it.

## Building from source

```
cd EmbyCast.Plugin
dotnet restore
dotnet build -c Release
```

Requires the .NET SDK. The project targets **netstandard2.0** on purpose — do not change this,
Emby Server's plugin loader expects netstandard2.0 assemblies.

## Publishing a release (for self-update)

The dashboard's "Check for Updates" / "Install Update" buttons verify the downloaded DLL's
SHA-256 before installing it, and refuse to install a release with no checksum available.

**Nothing extra to do**: just attach the built `EmbyCast.Plugin.dll` as a release asset (with that
exact name). GitHub automatically computes and exposes a SHA-256 digest for every uploaded release
asset, and the plugin reads that directly - no separate checksum file needed. A release with no
digest available (e.g. a GitHub Enterprise instance that doesn't support it) is refused by the
self-updater rather than installed unverified.

Note this only guards against a corrupted download, not a compromised GitHub account - since
both the DLL and any checksum published alongside it come from the same release, an attacker
with write access to the repo could fake both together. Real protection against that would need
cryptographic signing with a key never stored in the repo, which this project deliberately
doesn't do (not worth the added complexity for a project with a single maintainer).

## License

MIT — free to use, modify and distribute.

## Built with AI assistance

Developed with the help of [Claude](https://claude.ai) (Anthropic).
