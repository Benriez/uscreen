# Compatibility

Everything on this page describes what has actually been exercised, not what is
expected to work in principle.

---

## Verified combination

| Layer | Verified value |
|---|---|
| Mac | Apple Silicon **M1 Pro** |
| macOS | **26.5.1** |
| Tablet | **DOOGEE U12**, Android, USB |
| Transport | USB data cable, `adb reverse` |
| Display modes | **1600×960**, **2000×1200** @ 60 Hz |
| Decoder | `c2.unisoc.avc.decoder` (tablet-side hardware H.264) |
| Session length | 10-minute soak with an adb interruption and recovery |

Resolution was verified with `CGDisplayBounds` reporting the virtual display at the
expected origin and size, and with a window dragged from the Mac onto the tablet.

---

## Declared but untested

| Item | Claim | Confidence |
|---|---|---|
| macOS 13 – 26.4 | Bundle declares `LSMinimumSystemVersion 13.0`; APIs used exist since 13 | untested |
| Intel Macs | No build exists. `arm64` only. | not supported |
| Other Apple Silicon | Same code path, different GPU/media engine | untested |
| Other tablets | Any Android 8.1+ device with hardware H.264 and adb | untested |
| Other resolutions | The descriptor accepts custom modes | untested |
| Multiple monitors | Arrangement is set to the right edge by default | untested |

If you run it on a different combination, the useful thing to report is: Mac model,
macOS version, tablet model, Android version, decoder name from
`adb shell dumpsys media.player | grep -i codec`, resolution, and the output of
`uscreen-macos doctor --deep`.

---

## Requirements that are not negotiable

| Requirement | Why |
|---|---|
| **USB data cable** | Charge-only cables enumerate nothing. This is the most common setup failure by a wide margin. |
| **USB debugging authorized** | The transport is `adb reverse`. No adb, no session. |
| **Hardware H.264 decoder** | 1600×960 at 60 Hz in software is not viable. `doctor` reports the decoder path. |
| **Apple Silicon** | The native layer and the release binary are `arm64`. |
| **One authorized device** | The installation is bound to a single serial. |

---

## Tablet-side application

The receiver is the **unmodified upstream UScreen Android app** from the Linux project.
This repository does not distribute an APK, and no Android release is published here.

| Item | State |
|---|---|
| APK in this release | not included |
| Android build published here | none |
| Compatible app | upstream UScreen receiver matching the documented protocol |
| Install helper | `uscreen-macos install-apk <file.apk>` |

The protocol is documented in [Architecture](architecture.md) precisely so that a
compatible receiver can be identified without guesswork: the same framing, the same
64-character token handshake, and the same JSON input schema.

---

## Known incompatibilities

| Configuration | Result |
|---|---|
| Display mirroring expectation | UScreen creates an *extended* display; it does not mirror the primary screen |
| Wireless / TCP-IP adb | refused where the authorization specifies USB |
| Multiple tablets simultaneously | one authorized serial at a time |
| Resolution change mid-session | requires a host restart |
| Pen input (pressure, tilt, eraser) | not implemented on macOS |
| Pinch-to-zoom | not implemented; two fingers scroll |
| HEVC | not wired up |
| Macs with only integrated Intel graphics | no build |
