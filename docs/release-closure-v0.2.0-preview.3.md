# UScreen v0.2.0-preview.3 — release closure report

Date: 2026-10-25
Scope: publication closure only. No engineering cycle, no hardware test, no change to the
installed product or to the runtime safety state.

## Canonical state

| Item | Value |
|---|---|
| Private source | `https://github.com/Benriez/uscreen-macos`, branch `macos-port` |
| Private HEAD (code identity of the published binary) | `4ad661bbacdc8e11caf27a03d9e642b64d9c2345` |
| Private HEAD (bundle-version record, published after the artifact) | `a22449d` |
| Public repository | `https://github.com/Benriez/uscreen`, branch `main` |
| Public HEAD (documentation consistency commit) | `c18312a` |
| Release tag `v0.2.0-preview.3` | annotated, target commit `66cd968c4aa676e3cf33508bfc52231c38d0d578` |
| Tag moved or overwritten | **no** |
| GitHub Release id | `423429380`, published `2026-10-25T13:43:37Z`, `prerelease: true`, `draft: false` |
| Website | https://benriez.github.io/uscreen/ |
| Release page | https://github.com/Benriez/uscreen/releases/tag/v0.2.0-preview.3 |

Worktrees observed: the `macos-port` worktree of the macOS source repository, plus
two detached temporary worktrees (`84fbb68` and `4e5a674`) — the latter two belong to
other sessions and were not touched.

A `UScreen-0.2.0-preview.4-macos-arm64.zip` exists in the local build directory from a
parallel session (built 14:10). It is **ad-hoc signed and not committed to any branch**
(`git log --all` tops out at `4ad661b`). It was not published and is not a release
candidate.

## Published artifacts

| Asset | Bytes | SHA-256 |
|---|---|---|
| `UScreen-0.2.0-preview.3-macos-arm64.zip` | 2 416 900 | `524377140fe9fc60545da7fe19d7b3dfbaa1e290859f15bee9cc510cc5ebceea` |
| `UScreen-0.2.0-preview.2-android.apk` | 1 536 506 | `510f24e76557727c15f1e603a5172c2a2564a412eee5f3af3e50b0198dde7c8e` |
| `SHA256SUMS` | 208 | — |
| `PUBLICATION_BUILD.json` | 3 880 | — |
| `LICENSE` | 1 066 | — |

- macOS download: https://github.com/Benriez/uscreen/releases/download/v0.2.0-preview.3/UScreen-0.2.0-preview.3-macos-arm64.zip
- Android download: https://github.com/Benriez/uscreen/releases/download/v0.2.0-preview.3/UScreen-0.2.0-preview.2-android.apk

### The Android asset is deliberately named for its own version

The receiver was **not rebuilt and not updated** for preview.3: the bytes are identical to
the published preview.2 asset (same SHA-256, verified by `cmp` against the live preview.2
download). Its own version is `0.2.0-preview.2` (versionCode 20), minSdk 27, targetSdk 34.
It is therefore published under `UScreen-0.2.0-preview.2-android.apk` — naming it
`-preview.3-` would claim an Android build that does not exist. The release body, the
manifest, the website and the documentation all state this explicitly.

### macOS artifact verification (from the published download)

| Check | Result |
|---|---|
| Archive SHA-256 vs `SHA256SUMS` / `PUBLICATION_BUILD.json` | match |
| Archive contents | `UScreen.app` (6 files), `INSTALL.txt`, `LICENSE` |
| Code signatures | 4/4 valid (`codesign --verify --strict`): app, menu bar, backend, native dylib |
| Signing certificate | SHA-256 `6D:BB:46:EF:97:6C:0C:8A:1F:B1:6B:51:81:20:83:F8:8B:A1:99:E8:FC:4D:33:8E:73:5D:FB:A3:CE:2D:E9:31` (`UScreen Local Code Signing`, self-signed, not notarized) |
| Native linkage | `@rpath/libuscreen_native.dylib`, rpath `@loader_path/../Frameworks`, dylib id `@rpath/libuscreen_native.dylib` |
| Absolute build paths in the backend | 0 |
| Version | CLI `uscreen-macos 0.2.0`, bundle `0.2.0` / `2026.10.25.3` |
| Swift menu-bar self-test | `SELFTEST OK` |
| Device serial / builder home path / secret-shaped strings in the binaries | 0 / 0 / 0 |

### Android artifact verification (from the published download)

| Check | Result |
|---|---|
| SHA-256 vs `SHA256SUMS` / `PUBLICATION_BUILD.json` | match |
| Identity | `com.uscreen`, versionName `0.2.0-preview.2`, versionCode 20, minSdk 27, targetSdk 34 |
| Signatures | APK Signature Scheme v2 **true**, v3 **true**, one signer |
| Certificate | SHA-256 `c19de7ade1d089eac92e6081f9965fb4431b95482da468137f104a9bd8fac4e4` (`UScreen Local Release`) |
| Byte identity vs the preview.2 release asset | identical |
| Protocol compatibility | the shipped APK corresponds to the source at `4ad661b` (`android/app/build.gradle.kts`: `versionCode 20`, `versionName 0.2.0-preview.2`); the wire protocol, framing and 64-character token handshake are unchanged from the receiver published in preview.2, which was used in the accepted session |

## Test evidence

| Suite | Result |
|---|---|
| Rust, safe build (`cargo test --no-default-features --release`) | **919 passed, 0 failed** |
| Rust, hardware build (`cargo test --release`) | **921 passed, 0 failed** |
| Swift menu-bar self-test | `SELFTEST OK` |
| Architecture invariants | enforced by `macos/src/architecture_tests.rs` (part of both suites) |

## Hardware acceptance (carried over from the acceptance run, not repeated)

Performed on the published preview.3 packages: M1 Pro, macOS 26.5.1, DOOGEE U12 over USB,
1600×960 @ 60 Hz, low-latency profile.

| Measurement | Value |
|---|---|
| Capture (motion) | 28.8 – 43.0 fps |
| Acknowledged | 28.0 – 42.8 fps |
| Blank / dropped frames | 0 / 0 |
| Frame age | 15 ms p50 (19 – 21 ms p95) |
| Capture age | 1.1 – 1.9 ms p50 |
| Android decode | 28.7 – 29.4 ms |
| Frames in flight | 0.2 |
| Session length | 11+ minutes, ended only on the operator's disconnect |
| Extended display | genuine 1600×960 @ 60 Hz, removed cleanly on disconnect |

Operator-confirmed: the live Mac desktop on the tablet, a window dragged from the MacBook
onto the tablet display, a tap moving the Mac pointer to the correct position, and
touch-dragging moving a window. The operator then disconnected (display removed, ledger
unchanged) and reconnected on the same USB attachment — the second session is recorded in
the creation ledger (`display_id` 26 and 27) with two separate one-session leases.

The source report behind these numbers is the run recorded in
`~/Library/Application Support/uscreen/host.log` (metrics lines), `display-creations.jsonl`
(creation ledger), `lease-audit.jsonl` (authorisations) and
`quarantine-history.jsonl` (five archived quarantine records, each with its reason).

## Website

Deployed from `main` @ `c18312a` (Pages run `40199289773`, success).

- Hero, download panel, version label, installation guide, release-notes links, provenance
  link, FAQ, limitations, changelog and compatibility table all state Preview.3.
- The Android download points at the receiver's true asset name; its version label reads
  `8.1+ · 0.2.0-preview.2`.
- Statements that the receiver had never been installed were corrected — it is the APK
  installed on the tablet during the acceptance session.
- The hardware-test rows and the limitations describe the eleven-minute product session,
  not the earlier three-minute one.
- Historical statements were left intact: the Preview.2 release notes, the Preview.3
  comparison rows and the upstream 1.2.10 lineage.

Verification of the deployed page: 19/19 anchors resolve; every internal and external
link returns 200 (including both download links); no horizontal overflow at 390 px or
1440 px; 0 console errors; Lighthouse 100/100/100/100 on desktop and mobile; LCP 369 ms,
CLS 0.00.

## Local production isolation

Nothing on this machine was changed by the closure work:

- the installed application, the backend, the native library and the running services are
  exactly as they were (the installed product *is* the published preview.3 build:
  backend `823c1d49…`, GUI `e375f919…`, dylib `45cf4e61…`);
- the supervisor and the connection manager were not restarted; the host session from the
  acceptance run (pid 48077, display id 27) is still running;
- no lease was issued or consumed, no quarantine was cleared, no TCC entry was touched,
  no runtime safety record was modified, no display was created, no hardware test was run;
- the creation ledger (24 entries), the lease audit (23 lines) and the quarantine history
  (5 archived records) are unchanged.

The only local writes were the two Git commits in the private repository (the fix series
was already committed before the handoff; this closure added only the bundle-version
record `a22449d`) and the public documentation commits.

## Remaining known limitations

1. **Long-term stability is unproven.** The longest accepted session was about eleven
   minutes. Nothing has been run for hours or days.
2. **One machine.** M1 Pro, macOS 26.5.1, DOOGEE U12 over USB, 1600×960.
3. **Not notarized.** The macOS app carries a self-signed certificate; first launch needs
   a per-app Gatekeeper override.
4. **The Android receiver is unchanged and still signed with the project-local key**, so a
   tablet carrying an upstream-signed build must uninstall it first.
5. **The machine's own displays drive ColorSync churn.** Three quarantines during the
   acceptance work came from the *physical* displays (51 %, 57 %, 56 % ColorSync CPU),
   not from UScreen — the supervisor's absolute CPU limit acted correctly. On a quieter
   desktop this does not occur.
6. **The Private Mac Mode consent is bound to an older release** and has to be re-accepted
   in the menu bar; the backend reports the mismatch instead of silently accepting it.
7. **The tagged snapshot of the release notes** (`v0.2.0-preview.3`, commit `66cd968`)
   still names the Android asset `UScreen-0.2.0-preview.3-android.apk`. The published
   release body, the manifest and the live website use the receiver's true name. The tag
   was deliberately not moved, so the tagged file keeps the earlier wording.
8. **A parallel session is building a `preview.4`** in the same working tree. It is
   unsigned and uncommitted; if that work is to be released it needs its own test and
   signature pass, and its own release decision.
