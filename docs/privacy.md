# Privacy and data flows

The short version: nothing about your screen leaves the two devices on the cable. There
is no telemetry, no analytics, no account, no update check and no crash reporting.

---

## What is transmitted

| Data | Direction | Path | Destination |
|---|---|---|---|
| Captured screen (H.264) | Mac → tablet | TCP `127.0.0.1:8890`, tunneled by `adb reverse` | the attached tablet only |
| Touch / pointer events | tablet → Mac | WebSocket `127.0.0.1:8891`, tunneled by `adb reverse` | the Mac |
| Session token | Mac → tablet | `am start --es token`, over adb | the attached tablet only |
| Frame acknowledgements | tablet → Mac | same WebSocket | the Mac |

Both servers bind to loopback. There is no listener on a routable interface, so the
stream is not reachable from your network even while a session is running. `adb reverse`
is scoped to the connected device.

The token is generated per session and delivered through adb. It is never displayed in
the UI, never placed in a URL that leaves the machine, and never written to a log.

---

## What is stored locally

| Path | Content | Contains personal data |
|---|---|---|
| `~/Library/Application Support/uscreen/config.toml` | display mode, ports, profile | no |
| `~/Library/Application Support/uscreen/product-install.json` | install marker, bound ADB serial | the tablet's serial (as you provided it) |
| `~/Library/LaunchAgents/com.uscreen.*.plist` | service definitions, including `--serial` | the tablet's serial |
| `~/Library/Logs/UScreen/*.log` | session events, frame statistics, error causes | device serial, window titles in some diagnostics, timing data |
| creation ledger / baseline files | display creation counts, CPU baselines | no |
| quarantine / commissioning records | operator decisions, reason strings | whatever reason text was entered |

Nothing in that list is uploaded anywhere. It exists so the host can refuse unsafe starts
after an incident and so a failure can be explained afterwards.

If you share a log when asking for help, read it first: it can contain your device serial
and the names of windows that were on the captured display.

---

## What is *not* collected

- No analytics or crash reporter.
- No unique installation identifier that leaves the machine.
- No screen content, thumbnails or recordings beyond the live stream to your tablet.
- No microphone, camera, clipboard or keystroke capture. The input channel carries
  pointer positions and scroll deltas — not keyboard events.

---

## The website

This site is static files served by GitHub Pages.

- No cookies, no local storage, no fingerprinting.
- No third-party scripts, fonts or images — every asset is served from the same origin.
- No analytics of any kind.

GitHub, as the host, may log requests under
[its own privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement).
That is outside this project's control and is disclosed here rather than glossed over.

---

## Permissions, and why each is required

| Permission | Used for | Revocable |
|---|---|---|
| Screen Recording | ScreenCaptureKit capture of the virtual display | yes — session fails, nothing else breaks |
| Accessibility | `CGEvent` pointer and scroll injection | yes — video still works, input does not |
| Local Authentication (Touch ID) | confirming a session authorization | yes — authorization cannot be minted, so no session |

UScreen does not request Full Disk Access, camera, microphone, contacts, calendar,
location or automation of other applications.

---

## Threat model in one paragraph

UScreen assumes the Mac and the tablet are yours and the cable is trusted. It defends
against a second local process connecting to the video port without the token, against an
unintended second display, and against silent recovery from a graphics incident. It does
not defend against a local administrator, a compromised Mac, or physical access to an
unlocked device — and it is not a sandbox.
