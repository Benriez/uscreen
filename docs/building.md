# Building and verifying

The source is developed in a private repository, so these instructions describe the
reproducible parts of the pipeline rather than a clone-and-go flow. They are here so that
the published artifact can be checked, and so the build is documented rather than
implied.

---

## Toolchain

| Component | Used |
|---|---|
| Rust | stable, `aarch64-apple-darwin` |
| Swift | `swiftc` from the Xcode command line tools |
| Cargo features | `hardware` (default) links the Swift platform layer |
| Signing | local self-signed certificate in the login keychain |

The native library (`libuscreen_native.dylib`) is compiled by `build.rs`. A
`--no-default-features` build omits it entirely and is used for hardware-free testing.

---

## Build

```bash
# Hardware-free unit/integration suite (no native library, no display)
cargo test --no-default-features --release

# Release binary with the Swift platform layer
RUSTFLAGS="--remap-path-prefix=$HOME=/home/build" \
  cargo build --release

# Menu-bar app, bundle assembly, embedded library, ad-hoc signature, provenance stamp
./app/build-app.sh

# Sign with a specific identity (never resolve a certificate by common name)
security find-identity -p codesigning
./tools/sign-local.sh <SHA-1-of-identity> --out build/public
```

`--remap-path-prefix` matters for a public build: without it, Rust embeds absolute paths
from the builder's home directory into the binary. With it, the embedded paths are
`/home/build/...`.

---

## What the bundle contains

```
UScreen.app/Contents/
  Info.plist                        identifier com.uscreen.menubar, version 0.2.0
  MacOS/UScreenMenuBar              Swift menu-bar app
  MacOS/uscreen-macos               Rust backend
  Frameworks/libuscreen_native.dylib Swift platform layer
  _CodeSignature/CodeResources      signature
```

Three binaries are signed individually with explicit entitlements, then the bundle is
signed. `--deep` is deliberately not used: it signs in an order that can invalidate the
nested signatures.

---

## Verification of a build or a download

```bash
# 1. Signature chain
codesign --verify --strict --verbose=2 UScreen.app
codesign --verify --strict --verbose=2 UScreen.app/Contents/MacOS/uscreen-macos
codesign --verify --strict --verbose=2 UScreen.app/Contents/Frameworks/libuscreen_native.dylib
codesign --verify --strict --verbose=2 UScreen.app/Contents/MacOS/UScreenMenuBar

# 2. Identity of each binary
codesign -dv --verbose=2 UScreen.app 2>&1 | grep -E 'Identifier|Authority|TeamIdentifier'

# 3. Library linkage — must be @rpath, never an absolute path
otool -L UScreen.app/Contents/MacOS/uscreen-macos | grep libuscreen
otool -l UScreen.app/Contents/MacOS/uscreen-macos | grep -A2 LC_RPATH

# 4. No builder paths, no embedded device identity
strings -a UScreen.app/Contents/MacOS/uscreen-macos | grep -c '/Users/'
strings -a UScreen.app/Contents/MacOS/uscreen-macos | grep -c 'U1[0-9]\{12,\}'

# 5. Archive integrity
shasum -a 256 UScreen-0.2.0-macos-arm64.zip
```

`spctl -a -t exec UScreen.app` will report `rejected`, because there is no notarization
ticket. That is expected and is not evidence of a bad build. The meaningful checks are the
four `codesign --verify` calls, the recorded SHA-256, and the absence of absolute paths.

---

## Installer verification without touching a real installation

`setup install` accepts `--root`, which redirects every path it writes. This is how the
published build was checked without installing over an existing copy:

```bash
ROOT=$(mktemp -d)
UScreen.app/Contents/MacOS/uscreen-macos setup install \
  --root "$ROOT" \
  --source UScreen.app/Contents/MacOS/uscreen-macos \
  --serial TEST0000000000000001 \
  --device "Test tablet"

find "$ROOT" -type f          # backend, library, two plists, marker
"$ROOT/Applications/UScreen/bin/uscreen-macos" --help
rm -rf "$ROOT"
```

`--activate` is refused outside a real home directory on purpose: a build check must not
be able to start services.

---

## Test coverage

| Suite | Count | Notes |
|---|---|---|
| Rust hardware-free tests | 894 | protocol, mapping, gesture, adb selection, authorization, gate, ledger, supervisor rules |
| Swift menu-bar self-test | 14 checks | state presentation, quarantine, consent, error wording |
| End-to-end protocol script | — | config packet plus frames to a protocol-accurate fake tablet |

What the tests deliberately cannot prove: that `CGVirtualDisplay` works, that
ScreenCaptureKit delivers frames, that a tablet decodes them, and that input lands in the
right place. Those need hardware, and this build has not had a hardware session.

---

## Release checklist

1. `cargo test --no-default-features --release` — all green.
2. `RUSTFLAGS=… cargo build --release` — clean build.
3. `./app/build-app.sh` — self-test, bundle, provenance stamp.
4. `./tools/sign-local.sh <sha1>` — sign and verify nested binaries.
5. `codesign --verify --strict` on all four components.
6. Install into a temporary root; confirm five artifacts and a working `--help`.
7. Scan binaries for builder paths and device identities.
8. `ditto -c -k --sequesterRsrc --keepParent` → zip; record SHA-256.
9. Extract the zip again and re-verify the signature.
10. Publish as a **pre-release**, with `SHA256SUMS`, `PUBLICATION_BUILD.json` and the git
    commit recorded.
