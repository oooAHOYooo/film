# Makayla's Marsh Network

Screen-ready prop software for *Creatures in the Tall Grass* (Summer). Presents as a
bioacoustics field-research instrument — an inherited sensor array in the Branford marsh —
and quietly breaks physics on cue.

## Running it

Open `index.html` in any browser. **Fully offline** — anime.js and three.js are bundled
in `vendor/`, no network, no build step. Designed for fullscreen 1080p on the shoot's
mini PC / HDMI monitor (press F11).

## Keyboard scenarios (for filming)

| Key | Scenario |
|-----|----------|
| `1` | Idle passive monitoring (default) |
| `2` | Elevated node activity — more classifications, ambient bearings |
| `3` | Unknown 41.8 Hz signal detected — amber waveform, spectrogram lines, anomalous captures |
| `4` | Network failure — nodes drop offline one by one |
| `5` | Network restored — reconnect / recalibrate / resync sequence |
| `6` | Compare timestamps — arrival overlay, 2780 ms propagation error, clocks recheck PASS |
| `7` | Run triangulation — SOURCE SOLVER, bearing lines slowly converge on Dallas's house, 98.7% |
| `8` | Storm interference |
| `9` | Historical archive — mother's log entries, 2006–2025 |
| `0` | Full reset |
| `L` | Toggle Low Power Mode (disables particle field & animations) |
| `Esc` | Close signal inspector |

Click any chip in the **signal history strip** (center column) to open the Signal
Inspector — predicted vs. observed arrival, propagation error, GPS recheck. Anomalous
(amber) chips play the "clocks are correct" beat.

Hover map nodes for tooltips with install dates and handwritten notes.

## The intended scene beats

1. Idle (`1`/`2`) — boring, believable wildlife monitoring.
2. `3` — the signal appears. Makayla notices the timestamps, not the waveform.
3. Click an amber history chip — the inspector shows the impossible arrival math.
4. `6` — "Hold on." Compare Signals. Every node heard it at once.
5. `7` — Source Solver. The bearing lines rotate. They all intersect Dallas's house.
   No alarm. Just: SOURCE ESTIMATE · Dallas Residence · 98.7%.
