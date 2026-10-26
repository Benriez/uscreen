# Installation

This guide installs UScreen 0.2.0-preview.3 on Apple Silicon macOS and the matching
Android receiver (which is unchanged since preview.2). It assumes no administrator password, no developer tools and no prior
knowledge of the project.

If anything here fails, [Troubleshooting](troubleshooting.md) starts from the actual
error message rather than from the setup order.

---

## 1. Requirements

| Requirement | Detail |
|---|---|
| Mac | Apple Silicon (arm64). There is no Intel build. |
| macOS | 13.0 or newer. Developed and tested on macOS 26.5.1. |
| Tablet | Android 8.1+ with a hardware H.264 decoder and USB debugging. |
| Cable | A **data** cable. Charge-only cables are the single most common failure. |
| Tools | `adb` on your `PATH` (`brew install android-platform-tools`). |

`adb` is used for the transport itself, not just for installation. UScreen looks for
it at `/opt/homebrew/bin/adb`, `/usr/local/bin/adb` and `/usr/bin/adb`, then falls
back to `PATH`.

---

## 2. What the installer writes

Everything is user-scoped. There is no system modification, no kernel extension, no
`sudo`.

| Path | Purpose |
|---|---|
| `~/Applications/UScreen.app` | The application you download |
| `~/Applications/UScreen/bin/uscreen-macos` | Installed backend (this is what runs sessions) |
| `~/Applications/UScreen/Frameworks/libuscreen_native.dylib` | Swift platform layer (display, capture, encoder, input) |
| `~/Library/LaunchAgents/com.uscreen.supervisor.plist` | Independent supervisor, runs `uscreen-macos supervise` |
| `~/Library/LaunchAgents/com.uscreen.connection.plist` | USB watcher, runs `uscreen-macos connect` **in observe-only mode** |
| `~/Library/Application Support/uscreen/product-install.json` | Install marker; records the bound ADB serial |
| `~/Library/Logs/UScreen/` | `supervisor.log`, `connection.log` and their error streams |

The connection agent does **not** create displays on its own. Installing services is
not authorization: a session still requires an explicit start, and where an advisory
is present, a Touch ID confirmation.

---

## 3. Install

### 3.1 Unzip and place the app

```bash
cd ~/Downloads
shasum -a 256 UScreen-0.2.0-preview.3-macos-arm64.zip   # compare with the release page
ditto -x -k UScreen-0.2.0-preview.3-macos-arm64.zip .
mkdir -p ~/Applications
cp -R UScreen-0.2.0-preview.3/UScreen.app ~/Applications/
```

### 3.2 First launch

The build carries a local self-signed certificate, not an Apple Developer ID, and it
is not notarized. macOS will refuse a normal double-click exactly once.

Use the per-app override:

1. Right-click `UScreen.app` → **Open** → **Open**, or
2. **System Settings → Privacy & Security → “Open Anyway”** after the first refusal.

Do not disable Gatekeeper or SIP, and do not clear the quarantine attribute as a
routine step. The override is scoped to this app and is reversible.

After launching you get a menu-bar icon (⊞). There is no Dock window and no main
window; the whole interface is the menu.

### 3.3 Connect the tablet

1. Enable **Developer options → USB debugging** on the tablet.
2. Plug in the data cable. Accept **Allow USB debugging** on the tablet.
3. Confirm exactly one device is visible and authorized:

```bash
adb devices
# List of devices attached
# R58XXXXXXXX     device
```

`unauthorized` means the RSA prompt was not accepted. `offline` usually means a bad
cable or a stalled adbd; see [Troubleshooting](troubleshooting.md).

4. Install the receiver app from the same release:

```bash
adb install UScreen-0.2.0-preview.2-android.apk
```

If the tablet already carries a build of `com.uscreen` signed by a different key
(the upstream release, or an older debug build), Android refuses the update with
`INSTALL_FAILED_UPDATE_INCOMPATIBLE`. Uninstall it first:

```bash
adb uninstall com.uscreen
adb install UScreen-0.2.0-preview.2-android.apk
```

### 3.4 Run setup

From the menu bar choose **Set Up UScreen**. The app resolves the serial from the one
authorized `adb devices` entry, installs the backend and the native library, writes
both LaunchAgents and activates them.

The CLI form is equivalent and is the one to use if more than one device is attached:

```bash
~/Applications/UScreen/bin/uscreen-macos setup install --activate \
  --serial <your-adb-serial> \
  --profile low_latency \
  --device "Your tablet"
```

`--serial` is required. There is no default: a published build must not carry someone
else's device identity, and a fixed default would bind your installation to a tablet
you do not own.

Check the result:

```bash
~/Applications/UScreen/bin/uscreen-macos setup status
```

Expect three `ok` components: backend binary, supervisor service, connection service.

### 3.5 Grant the macOS permissions

Two permissions are needed, and both must be granted to the **installed backend**, not
to the app bundle:

`~/Applications/UScreen/bin/uscreen-macos`

| Permission | Needed for | Where |
|---|---|---|
| **Screen Recording** | ScreenCaptureKit capture | System Settings → Privacy & Security → Screen Recording |
| **Accessibility** | Pointer and scroll injection via CGEvent | System Settings → Privacy & Security → Accessibility |

Add the binary with the **+** button (drag it in from Finder), enable it, then quit and
reopen UScreen. macOS only applies these grants to a newly started process.

Verify without starting a session:

```bash
~/Applications/UScreen/bin/uscreen-macos doctor
```

`doctor` checks permissions, adb, the virtual display capability and the encoder. It
creates no display.

---

## 4. Start a session

Menu bar → **Connect**. If an advisory is present, UScreen asks for Touch ID and mints
a single-session authorization. Nothing is created if you cancel.

The CLI equivalent:

```bash
~/Applications/UScreen/bin/uscreen-macos lease issue \
  --serial <your-adb-serial> --profile low_latency --sessions 1 --ttl-secs 7200

~/Applications/UScreen/bin/uscreen-macos start
```

Then:

- Drag a window off the right edge — it should land on the tablet.
- Tap, drag and two-finger scroll on the tablet; the pointer follows.

Check what the host thinks is happening:

```bash
~/Applications/UScreen/bin/uscreen-macos status
```

Stop here:

```bash
~/Applications/UScreen/bin/uscreen-macos stop
```

The virtual display is removed when the host process exits. If `stop` reports that the
host is not running while the tablet still shows a frozen picture, the tablet app is
waiting for a socket that no longer exists; quitting the app on the tablet is enough.

---

## 5. Everyday use

| Task | How |
|---|---|
| Status | Menu bar icon, or `uscreen-macos status` |
| Health, read-only, creates nothing | `uscreen-macos health` |
| Effective configuration | `uscreen-macos config` |
| Encoder throughput without a tablet | `uscreen-macos bench` |
| Install the receiver APK on the tablet | `uscreen-macos install-apk UScreen-0.2.0-preview.2-android.apk` |
| Profiles and what they change | `uscreen-macos profiles` |
| Quarantine state | `uscreen-macos quarantine` |

The connection agent watches for the tablet but stays in observe-only mode. Auto-connect
must be requested explicitly; it is never enabled by the installer.

---

## 5b. Installing the experimental development build

The development release (`v0.3.0-dev.3`) is a **separate installation**. It
never updates the recommended one, and the recommended one is not modified
in any way.

```bash
# 1. Unpack and place the development app. It installs into its own tree.
mkdir -p ~/Applications && cp -R UScreen-dev.app ~/Applications/
open ~/Applications/UScreen-dev.app          # right-click → Open on first launch

# 2. Install its Android companion. It is a different application
#    (com.uscreen.dev) and installs alongside the recommended receiver.
adb install UScreen-0.3.0-dev.3-android.apk

# 3. Set up the development installation. Installing does not start it:
#    the development channel is inert until you authorize a session.
~/Applications/UScreen-dev/bin/uscreen-macos setup install \
  --serial "$(adb devices | awk 'NR==2{print $1}')"

# 4. Start a bounded development session. The install above is inert:
#    nothing starts at login, and nothing respawns.
~/Applications/UScreen-dev/bin/uscreen-macos dev start --authorize \
  --serial "$(adb devices | awk 'NR==2{print $1}')"

#    The session lasts 2 hours (maximum 8). Check it, and end it:
~/Applications/UScreen-dev/bin/uscreen-macos dev status
~/Applications/UScreen-dev/bin/uscreen-macos dev stop
```

Coming from 0.3.0-dev.1? Its Development agents auto-started from
`~/Library/LaunchAgents`. Remove them once:

```bash
~/Applications/UScreen-dev/bin/uscreen-macos setup install --migrate
```

What is different:

| | Recommended | Development |
|---|---|---|
| App bundle | `UScreen.app` | `UScreen-dev.app` |
| Bundle id | `com.uscreen.menubar` | `com.uscreen.menubar.dev` |
| Backend | `~/Applications/UScreen/bin/uscreen-macos` | `~/Applications/UScreen-dev/bin/uscreen-macos` |
| Services | `com.uscreen.supervisor`, `com.uscreen.connection` | `com.uscreen.supervisor.dev`, `com.uscreen.connection.dev` (staged, never auto-started) |
| Configuration | `~/Library/Application Support/uscreen/` | `~/Library/Application Support/uscreen-dev/` |
| Android app | `com.uscreen` | `com.uscreen.dev` |

Both installations need their own Screen Recording and Accessibility
permissions, because they are separate applications.

**Check which one you are running:**

```bash
uscreen-macos channel
```

`stable` is the recommended build, `development` is the experimental one. The
channel is compiled into the binary: a development build cannot be pointed at
the recommended installation, and it refuses to write there.

To go back, remove the development tree, its services and its Android app.
The recommended installation needs no reinstallation.

## 6. Uninstall

```bash
~/Applications/UScreen/bin/uscreen-macos stop
~/Applications/UScreen/bin/uscreen-macos setup uninstall
rm -rf ~/Applications/UScreen.app
```

`setup uninstall` removes the two LaunchAgents and the installed backend. It does not
delete the app bundle — that is your decision. Remove the remaining support directory
if you want a clean slate:

```bash
rm -rf ~/Applications/UScreen \
       "$HOME/Library/Application Support/uscreen" \
       "$HOME/Library/Logs/UScreen"
```

Finally, remove `uscreen-macos` from **Screen Recording** and **Accessibility** in
System Settings so no stale grant survives the uninstall.

---

## 7. Verifying what you installed

```bash
# Signature of the app and every nested binary
codesign --verify --strict --verbose=2 ~/Applications/UScreen.app
codesign -dv --verbose=2 ~/Applications/UScreen.app 2>&1 | grep Authority

# The backend can find its native library
otool -L ~/Applications/UScreen/bin/uscreen-macos | grep libuscreen

# What is actually loaded right now
pgrep -fl 'uscreen-macos'
```

A `spctl` rejection is expected and is not a defect: without notarization there is no
Apple-issued ticket. The meaningful checks are `codesign --verify`, the recorded
SHA-256, and whether the binary loads.
