# FAQ

### Is this a fork of the Linux project?

No. It is a macOS host that speaks the same wire protocol and drives the same upstream
Android app, with local modifications to the receiver's streaming code. The Linux host uses
EVDI, ffmpeg and uinput; macOS needs
`CGVirtualDisplay`, ScreenCaptureKit/VideoToolbox and `CGEvent` instead. The upstream
project is [UScreen for Linux](https://github.com/majmichu1/UScreen) by majmichu1.

### Is it mirroring?

No. It creates a second, extended display. Windows move onto it independently; the menu
bar can be moved to it; Mission Control spans it. Mirroring is not offered.

### Why does macOS say the app cannot be opened?

It is signed with a local certificate and is not notarized. Approve it once for this app
(right-click → Open, or Privacy & Security → Open Anyway). Do not disable system
security for it.

### Does it work over Wi-Fi?

No. The transport is `adb reverse` over USB. Wireless adb is not supported, and a session
authorized for USB refuses a TCP/IP device.

### Can I use two tablets at once?

No. An installation is bound to one ADB serial. A second device is not silently
substituted; reinstall with the other serial to switch.

### Why is the frame rate below 60?

Because 60 Hz is the display refresh rate, not a promise about frames. Capture is
damage-driven: it produces frames when the screen changes. On a static desktop it drops
towards zero, correctly. Under continuous motion the test host delivered 55.7 of 60
possible frames, with the encoder keeping up 1:1 — the deficit is at the capture/sampling
boundary, and the cause has not been isolated.

### Why is the latency around 70 ms?

Roughly 60 ms of it is the tablet decoding and presenting the frame. About 33 ms is
transport, and capture-to-encode is around 1 ms. The tablet's decoder is the floor; a
faster tablet helps, a faster Mac mostly does not.

### Does it support the Apple Pencil / S Pen?

No. Pen pressure, tilt, eraser and stylus buttons are out of scope on macOS. A pen acts as
a pointer. Two fingers scroll; there is no pinch-zoom.

### Can I resize the display without restarting?

No. macOS does not allow a display to be removed from the process that created it, so a
mode change means stop and start.

### Is my screen sent anywhere?

No. Video and input use loopback sockets tunneled through adb to the attached tablet.
There is no network listener, no relay, no account and no telemetry. See
[Privacy](privacy.md).

### Why does it need Screen Recording and Accessibility?

Screen Recording is how any macOS app captures a display (ScreenCaptureKit enforces the
same permission). Accessibility is how it injects pointer and scroll events. Both must be
granted to the installed backend binary, not to the app bundle.

### What are all these safety gates for?

The host has wedged the graphics subsystem on the test machine before. The instance lock,
start gate, creation ledger, quarantine, supervisor and commissioning authorization exist
to prevent a second display from being created on top of a stuck one, and to make silent
recovery impossible. They are accident prevention, not a security boundary.

### What is the difference between the recommended build and the development build?

The recommended build (`v0.2.0-preview.3`) is the last one verified on real
hardware, and it is the one to use. The development build (`v0.3.0-dev.1`)
carries the newest fixes — including the normal-Disconnect quarantine fix —
and is published so that they can be tried and problems reported.

They are separate installations, not two versions of one: separate app
bundle, bundle identifier, services, configuration and Android application.
Installing the development build changes nothing about the recommended one.

The development build is **not yet fully hardware-tested** and is not
recommended as a replacement for the working version.

### Can I return to the recommended version after trying the development build?

Yes, and nothing has to be rebuilt or downloaded again. The recommended
installation was never modified by the development build. Remove the
development tree, its two services and the `com.uscreen.dev` app; the
recommended release stays exactly where it was.

### The recommended build sometimes says "quarantined" after I disconnect. What now?

That is a known defect of the recommended build: after an ordinary Disconnect
the supervisor can occasionally read the teardown as a failed host and refuse
the next connection until an operator clears it. The fix is in the
development build, but it has not yet been accepted on hardware. See
[Limitations](limitations.md).

### Is the source code available?

This repository hosts the site, documentation and release artifacts. The source is
developed privately. The release ships a provenance record naming the exact commit, so
documented claims can be traced to a build.

**Licence scope.** The MIT licence in this repository covers what this repository publishes
— the site, the documentation and the redistributed receiver build, upstream copyright
included. It does not extend to the private macOS source, which carries its own licence
file in its own repository.

### Where is the Android APK?

In this release: `UScreen-0.2.0-preview.2-android.apk` (`com.uscreen`, Android 8.1+),
signed with a project-local key. A tablet that already carries an upstream-signed build
has to uninstall it first — Android refuses a differently signed update. The receiver is the
upstream app with local streaming modifications; see
[Tablet-side application](compatibility.md#tablet-side-application).

### Will a macOS update break it?

Possibly. `CGVirtualDisplay` is unsupported. When it fails, the host reports a failure
instead of faking a display — so a break shows up as a clear error, not as a silently
mirrored screen.

### How do I uninstall it completely?

```bash
uscreen-macos stop
uscreen-macos setup uninstall
rm -rf ~/Applications/UScreen.app ~/Applications/UScreen
```

Then remove the binary from Screen Recording and Accessibility in System Settings.
