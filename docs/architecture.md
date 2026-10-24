# Architecture

UScreen for macOS is a host replacement: the wire protocol and the Android application
are inherited unchanged from the Linux project, while everything that talked to Linux
graphics and kernel interfaces is replaced with macOS frameworks.

---

## Processes

```
                    ┌──────────────── macOS ────────────────┐
                    │                                       │
  menu bar app ─────┤  UScreen.app (Swift, UI only)         │
  (Swift)           │    └─ shells out to the backend CLI   │
                    │                                       │
                    │  uscreen-macos (Rust backend)          │
                    │    ├─ display      CGVirtualDisplay    │──┐
                    │    ├─ stream       TCP :8890           │  │
                    │    ├─ input        WebSocket :8891     │  │
                    │    ├─ adb          reverse + launch    │  │
                    │    └─ session      orchestration       │  │
                    │          │ FFI                          │  │
                    │    libuscreen_native.dylib (Swift)     │  │
                    │      ├─ CGVirtualDisplay               │  │
                    │      ├─ ScreenCaptureKit               │  │
                    │      ├─ VideoToolbox (H.264)           │  │
                    │      └─ CGEvent                        │  │
                    │                                        │  │
                    │  uscreen-macos supervise (independent) │  │
                    │    reads status, can stop the host     │  │
                    └────────────────────────────────────────┘  │
                                                                │ USB
                    ┌──────────────── tablet ────────────────────┘
                    │  UScreen app (unmodified upstream APK)
                    │    ├─ MediaCodec  H.264 decode
                    │    ├─ SurfaceView present
                    │    └─ TouchCapture → input WebSocket
                    └────────────────────────────────────────────
```

The menu-bar app owns no capture state. It reads the backend's status projection and
invokes the backend CLI. Killing the menu bar does not stop a running session; killing
the backend does.

`supervise` runs as its own LaunchAgent (`com.uscreen.supervisor`) so that a wedged
host cannot also wedge its own watchdog. It reports, and it can stop the host. It never
starts one.

---

## The virtual display

`CGVirtualDisplay` is a **private** CoreGraphics API. It is not in the SDK, so it is
reached through the Objective-C runtime. macOS treats the result as a real display:

- it appears in `system_profiler SPDisplaysDataType` and in Display settings;
- windows can be moved onto it, and the menu bar can be moved to it;
- it has a stable identity (name, vendor/product id, serial) so the window server and
  apps keep their window positions across sessions.

Arrangement uses `CGConfigureDisplayOrigin`, and mirroring is deliberately *not* the
default: the point is an extended desktop. Physical size and mode list are supplied in
the descriptor, which is why the tablet can advertise 1600×960 or 2000×1200 without
the Mac treating it as an unknown monitor.

**Failure is reported, never faked.** If the display cannot be created, the start
fails and says so. There is no silent fallback to mirroring or to a window.

**Removal.** The display is destroyed when the host process exits, and only then. macOS
does not allow a display to be removed from inside the process that created it, so a
resolution change means: stop, restart. After the display subsystem incident documented
in the engineering log, the host also takes an instance lock and refuses to start when
a previous instance might still own a display.

---

## Video path

| Stage | Implementation |
|---|---|
| Capture | `SCStream` bound to the virtual display, `SCContentFilter` on that display only |
| Encode | `VTCompressionSession`, realtime, H.264, no frame reordering, no B-frames |
| Framing | `u32 BE length` + `u8 type` + payload |
| Transport | TCP on loopback, tunneled by `adb reverse` to the tablet |
| Decode | `MediaCodec` hardware decoder on the tablet |
| Present | `SurfaceView` |

Two frame types exist:

| Type | Payload |
|---|---|
| `0` | Annex-B SPS/PPS (codec configuration) |
| `1` | `u32 sequence` + one Annex-B access unit |

**Backlog policy.** At most two frames may be in flight on the sender side
(`MAX_BACKLOG = 2` in the transport, `max_inflight_frames = 4` in the ACK window), and
the sender skips forward to the newest IDR rather than replaying stale frames. A
128 KiB socket send buffer keeps the kernel from queueing seconds of latency. The
design goal is "current picture", not "every picture".

**Idle behaviour.** Capture is damage-driven. When nothing changes, no frames are
produced — `idle`, `blank` and `dropped` counters stay at zero and the reported frame
rate falls. A low frame rate on a static desktop is correct, not a stall.

---

## Input path

A WebSocket server on loopback receives JSON messages:

```json
{"type":"auth"}
{"type":"touch","action":"down","x":0.5,"y":0.5}
{"type":"config"}
{"type":"rendered","seq":1234}
{"type":"pen"}
```

Normalized coordinates are mapped to global points using the virtual display's origin,
bounds and rotation, then injected with `CGEvent`:

| Tablet gesture | macOS result |
|---|---|
| Tap | Left click |
| Drag | Left button down → move → up |
| Two-finger swipe | Scroll wheel event (direction configurable) |
| Pen | Treated as a pointer; no pressure, tilt or eraser |

`rendered` messages from the tablet are what make end-to-end latency measurable: the
host can report the age of the frame that the tablet says it presented, instead of
guessing from send timestamps.

---

## Authorization and safety layers

These are separate mechanisms that answer different questions. All of them fail closed.

| Layer | Question it answers | Where it lives |
|---|---|---|
| **Device binding** | Is this the one tablet this installation is bound to? | `product-install.json`, re-checked at prepare, immediately before display creation, and during the session |
| **Lease / authorization** | Has an operator authorized a session, for which profile, how many times? | `lease`, minted after a `LocalAuthentication` biometric check |
| **Startup gate** | Is the machine in a state where creating a display is allowed? | `gate`, read-only evaluation, exit code 2 when it would refuse |
| **Creation ledger** | How many displays have been created, and when? | `ledger`, durable on disk |
| **Quarantine** | Did something go wrong that requires a human decision before the next start? | `quarantine`, set by the supervisor |
| **Supervisor** | Is the running session within limits? | `supervise`, independent process |
| **Commissioning** | May a quarantined machine create exactly one display, under supervision? | `commissioning`, single-use, operator-issued |

`private-mode` is a **policy record, not a capability**. It records that you accepted a
threat model; it relaxes no permission and skips no check.

Nothing in this stack is a security boundary against a local administrator. It exists
to prevent accidental starts, accidental second displays, and silent recovery from an
incident.

---

## Wire security

| Property | Implementation |
|---|---|
| Bind address | Loopback only (`127.0.0.1`) |
| Reachability from tablet | `adb reverse tcp:8890` / `tcp:8891` — scoped to the attached device |
| Video auth | 64-character hex token, sent as the first 64 bytes; a wrong or missing token is dropped before the greeting |
| Input auth | `{"type":"auth"}` as the first WebSocket message |
| Token delivery | `am start --es token …` on the device — never typed, never in a URL that leaves the machine |
| Network exposure | none; there is no listener on a routable interface |

`require_token` defaults to `true` and there is no supported configuration that turns
the transport into an unauthenticated network service.

---

## Configuration

`~/Library/Application Support/uscreen/config.toml`:

```toml
profile = "low_latency"
width = 1600
height = 960
fps = 60
bitrate_kbps = 8000
refresh_hz = 60.0
codec = "h264"
video_port = 8890
input_port = 8891
require_token = true
auto_launch_app = true
side = "right"
max_inflight_frames = 4
capture_queue_depth = 2
drop_idle_frames = true
```

Two profiles ship:

| Profile | Mode | Bitrate | Notes |
|---|---|---|---|
| `LOW_LATENCY` | 1600×960 @ 60 Hz | 8000 kbit/s | default; lower pixel rate, lower latency |
| `HIGH_QUALITY` | 2000×1200 @ 60 Hz | 16000 kbit/s | sharper text, higher pixel rate |

Latency follows pixel rate. On the test host, the lower resolution was measurably
faster end to end, which is why it is the default.

---

## Deliberate non-goals

- **No kernel extension.** The Linux host uses EVDI; the macOS host does not use a kext,
  an overlay driver or a display-link hack.
- **No screen-recording daemon.** Capture starts with a session and ends with it.
- **No cloud, no relay, no account.** The cable is the network.
- **No protocol fork.** The Android app is unchanged, so both hosts speak the same wire
  format.
