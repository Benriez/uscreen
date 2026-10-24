# Limitations

This is a preview. The list below is deliberately blunt, because the failure modes are
more useful than the feature list.

## Status

**Experimental.** No production-ready claim. Sessions in the tens of minutes have been
run; there is no multi-hour or multi-day evidence.

**One machine.** All end-to-end verification happened on an M1 Pro with macOS 26.5.1 and
a DOOGEE U12. Every other combination is untested, including other Apple Silicon Macs.

**This build has not been re-tested on hardware.** The published 0.2.0-preview.2
artifacts were rebuilt from a hardened source tree after the last hardware session.
Hardware-free tests and packaging were verified; a full session was not. The differences
are listed in the [release notes](release-notes/v0.2.0-preview.2.md).

---

## Platform

| Limitation | Consequence |
|---|---|
| `CGVirtualDisplay` is a private API | A macOS update can break display creation. The host reports the failure; it does not fake a display. |
| No in-process resize or removal | Changing resolution requires stopping and restarting the host. |
| No kernel extension | This is a design choice, and it is also why the private API is required. |
| Display identity is synthetic | Vendor/product/serial in the descriptor are generated. Some apps that key preferences on display identity may need to be told about the new screen once. |

---

## Video

| Limitation | Consequence |
|---|---|
| H.264 only | HEVC is not wired up. No codec negotiation. |
| 60 fps not reached | Capture tops out around 50–56 fps on the test host; the encoder is not the bottleneck. |
| Tablet decoder sets the floor | ~60 ms of the ~70 ms median frame age is tablet-side decode. A slower tablet is slower, and cannot be fixed from the Mac. |
| Damage-driven capture | A static screen produces almost no frames. Reported "fps" on an idle desktop is not a defect signal. |
| No HDR, no wide gamut handling | Color is SDR. A color-managed app may look different on the tablet than on a calibrated Mac display. |

---

## Input

| Limitation | Consequence |
|---|---|
| Tap, drag, scroll only | No pinch-zoom, no rotate, no multitouch gestures beyond two-finger scroll. |
| No pen support | Pressure, tilt, eraser and stylus buttons are out of scope on macOS. A pen behaves as a pointer. |
| Two fingers mean scroll | Not zoom. This surprises people; it is not configurable per-gesture. |
| Scroll direction is a flag | One global setting, not per-application. |
| Tablet single-pointer limitation | `adb shell input`-style single pointer on the test ROM means some gestures cannot be distinguished at all. |

---

## Graphics-stack care

Long sessions stressed the host's graphics stack on the test machine. ColorSync
display-services activity rose from a 0/min baseline to roughly 12/min, and WindowServer
CPU was observed well above its recorded baseline. The supervisor watches these signals
during a session and can stop the host.

This is the reason for several controls that look heavy for a screen-sharing tool: an
instance lock, a start gate, a creation ledger, a quarantine and a supervisor. They are
not ceremony; they exist because the host has already wedged once.

Practical advice: run sessions, do not leave one running for days. If the Mac becomes
unresponsive, stop the host rather than trying to reconfigure it.

---

## Distribution

| Limitation | Consequence |
|---|---|
| Not notarized | First launch needs a per-app override. Do not disable Gatekeeper or SIP. |
| Local self-signed certificate | There is no Apple-issued trust chain. `spctl` will reject the app by policy. |
| No Intel build | `arm64` only. |
| No auto-update | Download a new release manually. |
| Self-signed Android key | The receiver APK is signed with a project-local key; an upstream build on the tablet must be uninstalled before installing it. |

---

## Nothing here is a security boundary

The authorization, gate, ledger and quarantine exist to prevent *accidents*: an
unintended start, a second display, a silent recovery from an incident. They are not a
defence against a local administrator, and they are not a sandbox. The app runs as you,
with your permissions, and can do what you can do.
