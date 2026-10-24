# Performance

Every number here comes from one machine. Treat them as a data point, not a
specification: the tablet's decoder and the amount of screen change dominate the result.

**Test host:** Apple Silicon M1 Pro, macOS 26.5.1, arm64.
**Tablet:** DOOGEE U12 over USB, hardware H.264 decoder.
**Configuration:** 2000×1200 @ 60 Hz, 12 Mbit/s unless stated otherwise.

---

## Frame age (end to end)

Measured from the tablet's `rendered` acknowledgements, so it includes capture, encode,
transport, decode and present — not just the send timestamp.

| Percentile | Median of windows | Range across windows |
|---|---|---|
| p50 | **69.5 ms** | 65.4 – 78.8 ms |
| p95 | **109.9 ms** | 95.7 – 139.6 ms |
| p99 | 146.8 ms | one outlier at 921 ms during an adb reconnect |

Breakdown at p50: transport ≈ 33 ms, tablet decode ≈ 60 ms, capture-to-encode ≈ 1 ms,
present-to-callback ≈ 0.3 ms. The largest single term is the tablet's decode pipeline,
and it is the one component that cannot be changed from the Mac side.

---

## Throughput

| Stage | Result | Context |
|---|---|---|
| Animation ground truth | 60.00 fps | free-running timer, measured by the producer |
| Capture | 55.7 fps | 7 × 5 s windows, 54.6 – 56.2 |
| Encode | 55.7 fps | 2091 frames |
| Sent | 55.7 fps | 1:1 with encode |
| Acknowledged | 55.7 fps | 1:1 with sent |
| Encode median (10-minute soak) | 54.6 fps | min 21.0 at a phase boundary, max 56.0 |

`capture → encode → send → ACK` stayed **1:1**. Nothing was lost downstream of the
capture callback.

### Why 55.7 and not 60

When the animation stopped, capture dropped to zero within two seconds with
`idle = 0, blank = 0, dropped = 0`. Capture is damage-driven: it delivers frames when
content changes. The 4.3 fps deficit sits at the boundary between a free-running 60 Hz
producer and a 60 Hz sampler, which coalesces roughly one update per fifteen refreshes.
Proving which of the two effects dominates would need a benchmark at a non-60 Hz
animation rate, which has not been run.

The honest label is **55.7 / 60 = 92.8 %, cause not isolated** — not "capture is
broken", and not "60 fps".

---

## Live session (interactive, 1600×960)

The benchmark above drives a continuous 1:1 motion pattern at 2000×1200. An ordinary
interactive session is a different measurement, and it is much slower:

| Measurement | Value | Context |
|---|---|---|
| Captured | **12.3 fps** | interactive session, 1600×960, USB |
| Acknowledged by the tablet | **12.1 fps** | same session |
| Dropped or blank frames | 0 | observed in this session |

Both figures are real; they were measured under different conditions. The gap between
55.7 fps and ~12 fps has **not** been isolated. The tablet's decode pipeline and the
USB link are the usual suspects — the decode term is already the largest single term
in the frame-age breakdown above — but no measurement here separates them.

Do not quote the benchmark number as an expected result.

---

## Stability

| Test | Duration | Result |
|---|---|---|
| Soak with dynamic content | 10 minutes | 63 dynamic windows, **0 lost**, **0 stale** frames |
| adb interruption during soak | — | one disconnect; session resumed with a fresh keyframe; second session counted |
| Teardown | — | display removed, primary display geometry unchanged (1512×982 @ 0,0) |

There is no long-term (hours) stability claim. Sessions in the tens of minutes have been
run; multi-hour behaviour is untested.

---

## How to reproduce

```bash
# Encoder-only throughput, no tablet needed
~/Applications/UScreen/bin/uscreen-macos bench

# Full checks, including the display and encoder path
~/Applications/UScreen/bin/uscreen-macos doctor --deep

# Read-only snapshot, creates nothing
~/Applications/UScreen/bin/uscreen-macos health
```

`bench` measures the encoder in isolation. It is the right tool to answer "is the Mac
the bottleneck?", and the usual answer is no.

---

## Reading frame rate correctly

Three different numbers get called "fps" and they are not interchangeable:

1. **Display refresh** — 60 Hz. What the virtual display is configured for.
2. **Capture rate** — how often ScreenCaptureKit delivered a frame. Damage-driven;
   close to zero on a static desktop.
3. **Presented rate** — how often the tablet finished presenting. What the user sees.

A static desktop showing "2 fps" is working correctly. A moving window showing "12 fps"
is not, and the bottleneck is almost always the tablet's decoder or the cable.
