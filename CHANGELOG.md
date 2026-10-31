# Changelog

Release artifacts and provenance records live on the
[releases page](https://github.com/Benriez/uscreen/releases).

## 0.3.0-rc.12 — 2026-10-31 (development channel, experimental)

**The current development build.** It supersedes 0.3.0-rc.11, which is
published but should no longer be used.

Nine defects were fixed on the operator's own hardware. The status panel now
updates in place while it is open and opens on the first click; the machine's
own swap churn no longer vetoes a Connect; a refusal from the backend is no
longer read as a success, so the app never answers a runtime problem with a
permission message; a dead Development manager is recovered automatically
without extending the operator's authorization; a second start no longer
destroys a live session; the documented Stable → Development handover is a
command; and the manager no longer mistakes its own host for a second one.

Measured on the DOOGEE U12 on 2026-10-30: the display at 1600 × 960, the
capture running, the tablet acknowledging the frames (2.0 fps, last
acknowledgement 340 ms), the input channel authenticated with a touch
injected in 18 ms, and a cold Connect to the first visible frame in 12.9 s of
system time. The Android receiver does not resume presenting frames after a
transport loss in the tested window, so the warm-reconnect latency is still
unmeasured.

## 0.3.0-rc.11 — 2026-10-29 (development channel, experimental)

**The current development build.** It supersedes 0.3.0-rc.10, which is
published but should no longer be used.

It is the first development build that completed a hardware session: the
extended desktop was visible on the tablet, a touch moved the pointer, and a
transport reconnect re-established the video session on the same display. Two
defects had refused every earlier Connect and are fixed here — the installer
now signs the backend with a pinned identity, because macOS binds the Screen
Recording and Accessibility grants to the code identity of the running binary,
and an unsigned rebuild silently lost them; and the capture start is
stage-aware and bounded by the host's own startup window instead of a blind
ten-second cap. The ColorSync ceiling now judges the CPU the daemons actually
consumed between two ticks rather than `ps`'s decaying average, and the
Development-primary consent no longer depends on the machine's stream count.

## 0.3.0-rc.10 — 2026-10-28 (development channel, experimental)

**The current development build.** It supersedes 0.3.0-dev.3, which is
published but should no longer be used. Published as a pre-release: the
hardware acceptance of this exact build did not happen, so it replaces
nothing.

**Fixed**
- The Android receiver's launch component was named
  `com.uscreen.dev.MainActivity`, but the development receiver is the same
  application with a different application id — the class stays
  `com.uscreen.MainActivity`. Every token relaunch failed, the tablet kept a
  stale token and no video session ever authenticated.
- The two macOS permissions could not be granted: macOS attributes them to
  the responsible process, and only the launchd-run manager has the host's
  identity. The menu's *Grant Permissions…* now asks the manager to request
  them in its own process, and only on an explicit request.
- A swap-out burst vetoed every start on a routinely loaded Mac. The memory
  rule now measures the memory the kernel can still hand out, and calls a
  burst thrashing only when pages are evicted and faulted back at the same
  time.
- A reversible handover was refused on a false premise: the Stable session
  that follows it is judged by the Stable supervisor against Stable's own
  recorded band, not against the candidate's.
- The manager could be started before its session record existed, which left
  the menu showing a reading from an earlier session.
- A unit test reached the real launchd and could boot the operator's live
  services out — twice, each time killing the running host and its display.
  Every launchd mutation now goes through an injectable interface, and only
  the CLI hands out the real one.
- The machine's own rate probe could not read its own output (68 098 bytes is
  one byte over the pipe's capacity), so the machine had no trusted rate
  window and both the admission gate and the quarantine recovery refused for
  the wrong reason.
- The admission judges what an operation *adds*, not what the machine already
  carries. The directly measured guards — ColorSync CPU at 50 % and memory
  pressure at level 4 — are unchanged and still live.

**Verification**
- 1197 hardware-free Rust tests pass, 1199 in the hardware build.
- The Swift menu-bar self-test passes.
- `codesign --verify --strict` 4/4, pinned to the local signing identity.
- The APK is signed with the same project key as the previous development
  release (v2 + v3), so it installs over it in place.

## 0.3.0-dev.3 — 2026-10-26 (development channel, experimental)

**The current development build.** It supersedes 0.3.0-dev.2, which is
published but should no longer be used.

**Fixed**
- The install summary of 0.3.0-dev.2 ended with "start them with
  `--activate`" — a switch the development channel refuses, because an install
  is inert and a session is what runs it. The operator's first instruction
  pointed at an error. The summary is now channel-aware: the stable line keeps
  `--activate`, the development line names `uscreen-macos dev start
  --authorize`. The wording is a tested function.

**Verification**
- 1018 hardware-free Rust tests pass (28 isolation tests).
- The published binary was run in an isolated HOME: it stages both plists,
  creates no `~/Library/LaunchAgents`, refuses `--activate`, and refuses
  `dev start` without `--authorize`.

## 0.3.0-dev.3 — 2026-10-26 (development channel, experimental)

**A correctness release for the channel model.** It fixes a defect in
0.3.0-dev.1 and is published as a pre-release. Not hardware-tested. Not a
replacement for 0.2.0-preview.3.

**Fixed**
- 0.3.0-dev.1 installed its Development LaunchAgents into
  `~/Library/LaunchAgents` with `RunAtLoad` and `KeepAlive`, exactly like
  Stable. launchd loaded both channels at login and restarted them whenever
  they exited, so two supervisors and two connection managers competed for one
  physical display; the loser reported a ColorSync rate it could not have
  measured. Identity isolation does not survive shared activation.
- Development installs are now inert: their plists are staged in
  `~/Library/Application Support/uscreen-dev/services/`, which launchd never
  scans, and `setup install --activate` is refused for the channel.
- Development plists carry `RunAtLoad false` and no `KeepAlive`, so a reboot,
  a logout, a crash or an interrupted test cannot start one.
- The Development manager refuses to run without an unexpired session bound to
  the installed backend's SHA-256, and stops its own host when the session
  expires.
- `dev start` refuses while another host holds the instance lock or a display
  is online, and reports the owner instead of offering to kill it.

**Added**
- `uscreen-macos dev start --authorize --serial <S>` (default 2 h, max 8 h),
  `dev stop` (bootout, disable, remove, clear session — `.dev` labels only) and
  `dev status` (read-only).
- `setup install --migrate` removes legacy Development agents for people coming
  from 0.3.0-dev.1. Stable is never touched.
- 27 isolation tests and a shell guard script; `AGENTS.md` 3c now lists the
  forbidden recovery actions that caused the incident.

**Verification**
- 1017 hardware-free Rust tests pass; `codesign --verify --strict` 4/4;
  APK Signature Scheme v2 + v3 with the same project key.
- 0 occurrences of the build machine's home directory in the shipped backend.

## 0.3.0-dev.1 — 2026-10-25 (development channel, experimental)

**A separate, isolated development product.** This is not an update of the
recommended release and it does not replace it. It is published so that the
newest fixes can be tried on real hardware.

> **Not yet fully hardware-tested. Not recommended as a replacement for the
> working version.**

**Fixed**
- The normal-Disconnect quarantine race. The supervisor read the lifecycle
  record at the start of its tick and probed the display at the end, so a
  teardown could be read as a failed host and leave a sticky quarantine that
  blocked the next connection. The display probe and the lifecycle read are
  now adjacent, a shutdown announcement must precede the display's absence,
  and the teardown window is bounded on a monotonic clock. A genuinely
  orphaned, crashed or stuck host still triggers the safety controller.
- A host that holds the instance lock no longer blocks the product for ever;
  the operator's one-shot arm is no longer swallowed by the lock state.
- The start gate and the operator's acceptance name the same conditions, so an
  accepted test is not refused at the start.

**Added**
- Stable and Development are separated by construction. The channel is
  compiled into the binary, so a development build physically cannot write
  into the recommended installation: separate install roots, bundle
  identifiers, service labels, configuration, diagnostics and Android
  application id. The hardware authority — the instance lock, the creation
  ledger, the product lease, the quarantine — stays shared, so two hosts can
  never compete for one display.
- Installation transactions are serialized machine-wide with an advisory lock,
  so a promotion, a recovery and a development install cannot interleave.
- The installed Stable payload carries a recorded fingerprint that can be
  verified at any time, and the rollback artifacts are protected.

**Verification:** 988 Rust tests in the safe configuration and 990 with the
hardware feature, the Swift menu-bar self-test, 20 Android JVM tests, four
verified macOS signatures, an APK signed with the project key under the
`com.uscreen.dev` id, and no build-machine path or secret in any shipped
binary. No hardware session has been run with this exact candidate.

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
