# Changelog

Release artifacts and provenance records live on the
[releases page](https://github.com/Benriez/uscreen/releases).

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

## Earlier history

Development happened in a private repository before publication. The internal phases,
experiments and incidents are not part of this repository's history; the outcomes that
matter are documented in [docs/](docs/).
