# Changelog

Release artifacts and provenance records live on the
[releases page](https://github.com/Benriez/uscreen/releases).

## 0.2.0-preview.3 — 2026-10-25

**A normal connection works, and keeps working.** Preview.2 could be connected
once; after a failed start it could not be connected at all without clearing a
quarantine, and a session that did start was a bounded controlled test rather
than a product session.

**Fixed**
- The supervisor recognises a host only by a verified process identity. A
  diagnostic (`doctor`, `bench`, `setup status`) takes the same instance lock
  and was judged as a running host, which could quarantine the machine.
- The relative ColorSync band bounds UScreen's own per-display contribution
  instead of the machine total, using the attribution the supervisor already
  collects. A storm (the measured incident was 1650 profiles/min) still
  escalates and still stops the host.
- The operator's product lease authorises a product session, so a normal
  connection runs until it is stopped instead of ending with a bounded
  controlled retest.
- Clearing a quarantine releases the connection manager, and an arm that
  arrives while the manager is settling is recorded instead of dropped.
- After a clean disconnect the next Connect works on the same attachment; no
  unplug required.
- The manager's liveness is a heartbeat it touches on every poll, so a live
  manager is not mistaken for a dead one on a loaded machine.
- `quarantine clear` is verified: it refuses while a host or a UScreen display
  is alive, archives the record in `quarantine-history.jsonl` and reconciles a
  lifecycle record whose process is verified gone.

**Unchanged:** ColorSync CPU 50 %, profile rate 300/min, WindowServer CPU,
memory pressure, heartbeat, the singleton lock, the creation ledger and budget,
the quarantine semantics and the commissioning model.

**Hardware acceptance:** one attended product session on the published packages
(M1 Pro, macOS 26.5.1, DOOGEE U12 over USB, 1600×960 @ 60 Hz) — capture
28.8–43.0 fps, acknowledged 28.0–42.8 fps, 0 blank and 0 dropped frames, live
desktop / window drag / tap / touch-drag confirmed by the operator, 11+ minutes
without ending by itself, clean disconnect and a verified reconnect.

## 0.2.0-preview.2 — 2026-10-25

**Hardware acceptance** — the published packages were installed and exercised once,
end to end, on the reference machine and the tablet: extended display created and
removed cleanly, live desktop on the tablet confirmed by the operator, window drag onto
the tablet, tap and touch-drag confirmed, 17.6–38.4 fps captured and 18.0–37.8 fps
acknowledged with 0 blank and 0 dropped frames, and a verified shutdown with the ledger,
lease and commissioning records consistent. 60 fps was not reached and long-term
stability is not claimed.

Second public preview: version identity fixed, Android receiver published.

**Fixed**
- `uscreen-macos --version` reported `0.1.0` while the bundle reported `0.2.0`. Both
  report `0.2.0` now; bundle build number `2026.10.25.2`.
- Release backend is built with `--remap-path-prefix`, so no builder home path is
  embedded in the shipped binary.

**Added**
- Android receiver published for the first time:
  `UScreen-0.2.0-preview.2-android.apk` (`com.uscreen` 0.2.0-preview.2, versionCode 20,
  minSdk 27), release build with R8, signed with a project-local key (APK Signature
  Scheme v2 + v3). A tablet carrying an upstream build must uninstall it first.
- `LICENSE` (MIT, upstream copyright) ships inside the macOS archive.
- Release notes for this preview.

**Not verified**
- Neither artifact has been through a hardware session after this rebuild; the APK has
  not been installed on a tablet.

## 0.2.0-preview.1 — 2026-10-25

First public preview build for Apple Silicon.

**Product**
- Extended virtual display through `CGVirtualDisplay`; not mirroring.
- ScreenCaptureKit capture, VideoToolbox H.264 hardware encode.
- USB transport over `adb reverse`; loopback-only servers; 64-character token handshake.
- Touch input: tap, drag, two-finger scroll, mapped to the virtual display geometry.
- User-level installation (`setup install`): backend, native library, two LaunchAgents,
  install marker. No admin rights, no kernel extension.
- Menu bar application with explicit setup, connect, disconnect and private-mode actions.
- Session authorization (`lease`) behind a `LocalAuthentication` biometric check.
- Independent supervisor, start gate, creation ledger, quarantine and single-use
  commissioning authorization.

**Publication hardening**
- `setup install` no longer has a default ADB serial; the argument is required.
- The menu bar resolves the serial from `product-install.json` first, then from the single
  authorized `adb devices` entry, and refuses with an explanation when neither exists.
- The shell installer requires `--serial` / `USCREEN_SERIAL`.
- Release builds remap the builder's home directory out of embedded paths.
- Bundle version set to `0.2.0` (`2026.10.25`).

**Verification**
- 894 hardware-free Rust tests pass; Swift self-test passes.
- All four nested code signatures verify.
- Installer exercised into a temporary root; installed backend executes.
- Binaries contain no device serial and no builder home path.
- No full hardware session was performed on this exact build.

**Known issues**
- 60 fps not reached (≈50–56 fps capture on the reference host).
- No HEVC, no pen input, no pinch-zoom.
- Resolution change requires a restart.
- Not notarized; local signing certificate only.
- No Android APK distributed here.

> Correction (2026-10-25): the statement above describes preview.1 only. The receiver is
> the upstream app with local streaming modifications (see
> [Compatibility](docs/compatibility.md#tablet-side-application)), and preview.2 does
> distribute a signed APK.

## Earlier history

Development happened in a private repository before publication. The internal phases,
experiments and incidents are not part of this repository's history; the outcomes that
matter are documented in [docs/](docs/).
