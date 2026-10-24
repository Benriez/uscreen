# Troubleshooting

Start with the symptom. Every section names the actual message or observation first, then
the cause, then the fix.

Read-only commands, in order of usefulness:

```bash
uscreen-macos doctor            # permissions, adb, display, encoder
uscreen-macos setup status      # installed services
uscreen-macos status            # is a host running, and what is it doing
uscreen-macos health --passive  # system state; creates nothing
```

`health` requires `--passive`. Without it the command refuses to run, because the
default path is allowed to start subprocesses and the passive path is not.

---

## "Library not loaded: @rpath/libuscreen_native.dylib"

```
dyld: Library not loaded: @rpath/libuscreen_native.dylib
  Referenced from: .../macos/target/release/uscreen-macos
```

**Cause:** you are running the build output directly. The native library is resolved
relative to the binary (`@loader_path/../Frameworks`), and `target/release` has no
`Frameworks` directory.

**Fix:** run the installed backend, or the one inside the bundle:

```bash
~/Applications/UScreen/bin/uscreen-macos status
# or
/Applications/UScreen.app/Contents/MacOS/uscreen-macos status
```

`setup install` copies the library next to the installed binary, which is why the
installed path works.

---

## `adb devices` shows nothing

**Causes, in order of likelihood:**

1. **Charge-only cable.** No data lines, no enumeration. Try a cable that mounts the
   tablet as storage.
2. **USB debugging off** or not authorized on the tablet.
3. **adb server stale** or installed from a different SDK.

```bash
adb kill-server && adb start-server && adb devices
```

4. The tablet is in "charging only" USB mode. Change it to **File transfer (MTP)**.

---

## `adb devices` shows `unauthorized`

The RSA prompt is waiting on the tablet, or was dismissed.

- Unlock the tablet and accept **Allow USB debugging**.
- If no prompt appears: **Developer options → Revoke USB debugging authorizations**, then
  replug.

---

## `adb devices` shows `offline`

The device enumerated but adbd is not answering.

```bash
adb kill-server && adb start-server
```

If that fails, replug the cable, then restart the tablet. `offline` after a long session
usually means the tablet's USB stack gave up.

---

## Setup fails with "missing --serial"

```
missing --serial <adb serial> (or USCREEN_SERIAL)
```

**Cause:** the installer has no default serial by design.

**Fix:** pass it, or export it.

```bash
~/Applications/UScreen/bin/uscreen-macos setup install --activate \
  --serial "$(adb devices | awk 'NR==2{print $1}')"
```

---

## The menu says "No tablet found"

UScreen resolves the serial in two steps: the serial recorded by `setup install`, then the
single authorized `adb devices` entry. It refuses to guess when several devices are
attached.

- Connect exactly one tablet, or
- run the CLI form with an explicit `--serial`.

---

## Permissions were granted, but capture still fails

**Cause:** the grant was given to the wrong binary. The app bundle and the installed
backend are different executables, and macOS grants Screen Recording and Accessibility
per executable path.

**Fix:** grant both permissions to

```
~/Applications/UScreen/bin/uscreen-macos
```

then **quit and relaunch** UScreen. macOS does not apply a new grant to a running
process.

Check the effective state:

```bash
uscreen-macos doctor
```

---

## macOS refuses to open the app

**Cause:** the build is not notarized. This is expected.

**Fix:** right-click → **Open** → **Open**, or System Settings → Privacy & Security →
**Open Anyway**.

`spctl -a -vvv UScreen.app` reporting `rejected` is the correct result for this build and
is not a sign of tampering. Verify integrity with `codesign --verify --strict` and the
published SHA-256 instead.

Do not disable Gatekeeper or SIP.

---

## The tablet shows a black or frozen picture

1. Check that a host is running and what it thinks is happening:

```bash
uscreen-macos status
```

2. Quit the UScreen app on the tablet and reconnect it — a receiver waiting on a dead
   socket never recovers on its own.
3. Confirm the tablet is the authorized serial. A different tablet is refused before the
   display is created.
4. Restart the session:

```bash
uscreen-macos stop
uscreen-macos start
```

5. Look at the log for the actual reason:

```bash
tail -40 ~/Library/Logs/UScreen/connection.log
tail -40 ~/Library/Logs/UScreen/supervisor.log
```

---

## The frame rate is low, but the Mac is idle

Expected on a static desktop. Capture is damage-driven: no screen change, no frames. To
judge throughput you need continuous motion, for example a video or a dragged window.

If the rate stays low **with** motion:

- Lower the profile (1600×960 instead of 2000×1200).
- Check the tablet's decoder selection.
- Re-seat the cable; a marginal cable degrades throughput before it disconnects.

---

## The session stops by itself

The supervisor can stop a host. That is a feature, and it leaves a record.

```bash
uscreen-macos quarantine          # "not quarantined" means nothing was flagged
uscreen-macos health --passive    # memory pressure, ColorSync rate, WindowServer CPU
```

Typical causes on the test host: elevated memory pressure, a ColorSync creation-rate
escalation, or WindowServer CPU above the recorded baseline for two consecutive
intervals. When a start is refused after an incident, the machine needs a human decision
(a fresh baseline, or a single-use commissioning authorization) rather than a retry loop.

---

## A display is still visible after a crash

The display is removed when the host process exits. If the process is gone and the
display is still listed:

```bash
pgrep -fl uscreen-macos
system_profiler SPDisplaysDataType | grep -c UScreen
```

- If a process is alive, `uscreen-macos stop`.
- If no process is alive and the display persists, log out and back in. A virtual display
  cannot be removed from a process that no longer exists, and forcing more virtual
  displays on top of a stale one is how the display subsystem wedges.
- Check the creation ledger before trying again: `uscreen-macos ledger`.

---

## Two sessions, or a session nobody started

The connection agent installed by `setup install` runs in **observe-only** mode. It never
creates a display by itself; auto-connect must be requested explicitly.

If sessions appear on their own:

```bash
launchctl print gui/$(id -u)/com.uscreen.connection | grep -A5 ProgramArguments
```

Look for `--auto-connect` in the arguments. Remove it, reload the agent, and check that no
second copy of the app is running (`pgrep -fl UScreenMenuBar`).

---

## Resolution change had no effect

A virtual display cannot be resized inside the process that created it.

```bash
uscreen-macos stop
# edit ~/Library/Application Support/uscreen/config.toml
uscreen-macos start
```

---

## The Mac becomes unresponsive during a long session

Stop the session from the menu bar. If the UI does not respond, from a terminal:

```bash
pkill -f 'uscreen-macos start'
pkill -f 'uscreen-macos supervise'   # only if the supervisor is also stuck
```

Do not start another session until `health --passive` reports no quarantine and acceptable
memory pressure. Repeated forced restarts are how a graphics incident becomes a wedged
machine.

---

## Where the logs are

| File | Content |
|---|---|
| `~/Library/Logs/UScreen/connection.log` | USB watcher and session events |
| `~/Library/Logs/UScreen/connection.err.log` | its stderr |
| `~/Library/Logs/UScreen/supervisor.log` | supervisor decisions |
| `~/Library/Logs/UScreen/supervisor.err.log` | its stderr |
| `~/Library/Logs/uscreen/` | logs from the optional shell installer (`service/install.sh`), lowercase |

When reporting a problem, include: `doctor` output, `status`, `health --passive`, the
tablet model and Android version, and the last 40 lines of `connection.log`.
