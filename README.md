# UScreen for macOS

**An Android tablet as a real extended macOS display over USB.**

UScreen registers a genuine extended display with the macOS window server, captures
it with ScreenCaptureKit, encodes H.264 with VideoToolbox, and sends the stream to an
Android tablet over the cable. Touch events travel back and are injected as pointer
and scroll events on the Mac.

This repository hosts the **product website, the documentation and the release
artifacts**. The source code is developed in a private repository.

> **Status: experimental preview.** One hardware combination has been exercised end
> to end. Read [Limitations](docs/limitations.md) before installing. The build is
> signed with a local certificate and is **not notarized**.

---

## Download

**[UScreen 0.2.0-preview.3 — macOS (arm64, 13+) and Android 8.1+](https://github.com/Benriez/uscreen/releases/tag/v0.2.0-preview.3)**

It is a pre-release: `releases/latest` does not point at it yet.

| | |
|---|---|
| macOS archive | `UScreen-0.2.0-preview.3-macos-arm64.zip` (2.3 MB) |
| macOS SHA-256 | `524377140fe9fc60545da7fe19d7b3dfbaa1e290859f15bee9cc510cc5ebceea` |
| Android receiver | `UScreen-0.2.0-preview.3-android.apk` (1.5 MB) |
| Android SHA-256 | `510f24e76557727c15f1e603a5172c2a2564a412eee5f3af3e50b0198dde7c8e` |
| Signature | project-local self-signed keys — the macOS app is **not notarized** |
| Provenance | [`PUBLICATION_BUILD.json`](https://github.com/Benriez/uscreen/releases/download/v0.2.0-preview.2/PUBLICATION_BUILD.json) |

The macOS archive contains `UScreen.app`, `INSTALL.txt` and `LICENSE`. The receiver APK
is signed with a project-local key, so a tablet that already carries an upstream build
has to uninstall it first.

Quick start:

```bash
mkdir -p ~/Applications && cp -R UScreen.app ~/Applications/
open ~/Applications/UScreen.app        # right-click → Open on first launch
adb install UScreen-0.2.0-preview.2-android.apk
~/Applications/UScreen/bin/uscreen-macos setup install --activate \
  --serial "$(adb devices | awk 'NR==2{print $1}')"
```

Then grant **Screen Recording** and **Accessibility** to the installed backend and
choose **Connect** in the menu bar. Full walkthrough: [Installation](docs/installation.md).

---

## What it does

- **Extended display, not mirroring.** The display is created through
  `CGVirtualDisplay`, so macOS lays out windows, the menu bar and Mission Control
  across it like any physical monitor.
- **Hardware pipeline.** ScreenCaptureKit → VideoToolbox (H.264) → TCP over
  `adb reverse`. No ffmpeg child process, no kernel extension.
- **Touch back to the Mac.** Tap, drag and two-finger scroll, mapped to the virtual
  display's geometry.
- **One cable, local only.** Loopback sockets tunneled through adb; no network
  listener, no account, no cloud.
- **Explicit safety model.** Session authorization, a device-serial binding, a
  creation ledger and an independent supervisor that can stop a session.

## What it does not do

No Wi-Fi transport. No Intel build. No pen pressure, tilt or eraser. No pinch-zoom.
No HEVC. No live resolution change. No long-term stability claim. No macOS
notarization.

---

## Documentation

| Document | Contents |
|---|---|
| [Installation](docs/installation.md) | Requirements, first launch, permissions, verification, uninstall |
| [Architecture](docs/architecture.md) | Processes, ports, protocol, authorization, lifecycle |
| [Compatibility](docs/compatibility.md) | Tested matrix and what is untested |
| [Performance](docs/performance.md) | Method, measured numbers, how to read them |
| [Limitations](docs/limitations.md) | The honest list |
| [Troubleshooting](docs/troubleshooting.md) | Symptom → cause → fix |
| [FAQ](docs/faq.md) | Common questions |
| [Privacy](docs/privacy.md) | Data flows and local artifacts |
| [Building](docs/building.md) | Toolchain and verification commands |
| [Release notes](docs/release-notes/v0.2.0-preview.3.md) | What changed in this preview |

## Verification status of this build

| Check | Result |
|---|---|
| Rust test suite (hardware-free) | 894 passed, 0 failed |
| Swift menu-bar self-test | `SELFTEST OK` |
| Code signature (app + three nested binaries) | valid on disk, satisfies Designated Requirement |
| Installer into a temporary root | binary, native library, two LaunchAgents, install marker |
| Gatekeeper assessment | rejected — expected for a non-notarized build |
| Full hardware session on this build | one attended **product** session of 11+ minutes — live desktop, window drag and touch confirmed by the operator; clean disconnect and a verified reconnect |

## Project and licence

The Android receiver is the application of
[UScreen for Linux](https://github.com/majmichu1/UScreen) by **majmichu1** (MIT). It is
taken from the upstream 1.2.10 release and modified locally in four Kotlin files
(+370/−48 lines): the receiver no longer overwrites the negotiated frame rate and bitrate,
streaming instability on real hardware was fixed, and stream latency was lowered with a
shallower capture queue, a measured ACK window and less idle churn. The upstream copyright
and licence are preserved.

The macOS host, the Swift platform layer and the virtual-display work are independent work
and are **not published** in this repository.

MIT licensed — see [LICENSE](LICENSE). That licence covers what this repository publishes:
the site, the documentation and the redistributed receiver build, upstream copyright
included. It does **not** extend to the private macOS source, which carries its own licence
file. Not affiliated with Apple or Google.
