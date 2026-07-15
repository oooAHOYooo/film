# RESONANCE WORKSTATION

**Screen prop for _Creatures in the Tall Grass_ — Dallas's private bioacoustics workstation.**
Appears in **S08** (marsh hum analysis), **S11** (live observation of the injured creature), and **S12** (morning realization / soothing synchronization).

Internal project label: `BRANFORD ACOUSTIC STUDY — D. VALE`

This is **not** the Makayla Marsh Network interface. It is a small, improvised field-recording and signal-comparison tool that one researcher has customized for years — old-university-software energy, roughly 2005–2015. The supernatural is only ever visible as restrained changes in the data.

---

## Running it

Open `index.html` directly in Chrome or Safari. No server, no internet, no build step, no npm. Everything (including anime.js) is bundled locally with relative paths.

- Designed for fullscreen **1920×1080** HDMI monitors; scales down to 1366×768.
- Audio is fully procedural (Web Audio API) and starts on the **first key press or click** (browser autoplay policy). The prop looks correct with sound muted.
- Text selection is disabled during prop operation. Press **Shift+D** to toggle developer/debug mode (re-enables selection).

## Filming keys

| Key | State |
|-----|-------|
| **1** | S08 — raw marsh recording (boring, plausible; hum nearly invisible) |
| **2** | S08 — isolate low frequency (low-pass to 86 Hz, 41.8 Hz fundamental emerges) |
| **3** | S08 — mark repeating intervals (markers placed; mean 13.273 s, confidence 96.1%) |
| **4** | S08 — directional A/B comparison + rough notebook bearing (247° ± 11°) |
| **5** | S08 — Sierra archive match / the hunch (`SIERRA_FIELD_NOTE_17.wav`) |
| **6** | S11 — live Subject A monitoring (gold trace, abstract enclosure feed) |
| **7** | S11 — Subject A distress (external component present, restrained amber) |
| **8** | S11 — Dallas approaches; ~20 s gradual stabilization; correlation 18% → 92% |
| **9** | S11 — soothing tone; phase difference 2.4 s → 0.2 s; `PHASE COHERENCE: STABLE` |
| **0** | S12 — morning observation (overnight timeline, correlation 0.91) |
| **Q** | S12 — presence comparison (`DALLAS PRESENT` / `DALLAS ABSENT`, "not one-way") |
| **W** | S12 — playback experiment (response latency 1.84 s, match 88.4%, extra pulse) |
| **E** | S12 — Sierra tonal comparison (three traces align; shared interval, ratio 3:2) |
| **R** | S12 — external hum returns (synchronization breaks) |
| **T** | Complete calm state (long cinematic insert / background coverage) |
| **A** | Tape archive browser (~92 catalogued .wav files, ordered `BAS-YY-NNNN` numbers; click a row to "load" it) |
| **Y** | Full reset to the S08 raw state |
| **H** | Hide/show the keyboard guide strip |
| **F** | Toggle fullscreen |
| **L** | Low-power mode (keeps waveforms, drops texture overlays and render cost) |
| **Esc** | Close all floating panels and overlay messages |
| **Shift+D** | Developer mode (allows text selection) |

## Intended dramatic order

### S08 — the hunch
1. Start with **1**. The screen should look ordinary.
2. Press **2** as Dallas filters the recording — noise recedes, the low tone appears.
3. Press **3** when he recognizes repetition — markers, interval analysis.
4. Press **4** as he compares locations — A/B split, rough bearing toward the deeper marsh.
5. Press **5** for the match against Sierra's tape. This is what sends him back to the marsh.

### S11 — the creature
1. Start with **6** (live observation).
2. Press **7** when the creature becomes distressed by the outside hum.
3. Press **8** as Dallas sits beside it. **Let this run — the settle takes ~20 seconds** and the correlation counter arrives late and quietly.
4. Press **9** as the creature begins soothing him. Hold on the synchronized breathing traces.

### S12 — the realization
1. Start with **0** (morning; Dallas slept at the desk).
2. Press **Q** when he compares the present/absent data.
3. Press **W** for the call-and-response experiment.
4. Press **E** for the Sierra connection (three traces briefly share one shape, then it dissolves).
5. Use **R** when the outside hum interrupts.
6. Use **T** for quiet coverage of Dallas and the creature at rest.

## Clickable interactions (for the actor)

- **Recording library** entries load with believable 300–1200 ms "tape transfer" delays and switch the input source chip (`LINE IN — SIERRA RECORDER`, `MIC 1 — ENCLOSURE`, etc.).
- **Transport**: play/pause, loop, A/B, playback speed, noise-isolation slider (the slider genuinely isolates the hum).
- **Spectrogram**: clicking inspects the frequency at that band.
- **Observation log** header collapses/expands; entries reveal progressively as scenes advance. The unsaved note ("First quiet night in months.") appears briefly and fades during the morning state — easy to miss, by design.
- Mute (`SND`) and master volume are in the header.

## Design notes

- Palette: charcoal, graphite, navy-gray, warm cream, oxidized brass, dusty amber, muted gold; phosphor green used sparingly for measurements; faded burgundy reserved for anything tied to Sierra's recorder.
- The creature's signal is warm low-saturation **gold**; Dallas's recorded audio is **cream**; environmental noise is **green-gray**; Sierra's archives are **burgundy**.
- Calm states progressively reduce on-screen motion (graph jitter, easing speed, flicker); distress increases irregularity, not speed.
- Three.js is intentionally **not** used — the flat, functional canvas rendering reads better as period software. Only `vendor/anime.min.js` is bundled.
- Scan lines, monitor bloom, timestamp drift, refresh flicker, and slightly rotated "windows" provide texture; all are disabled in low-power mode.

## Files

```
resonance-workstation/
├── index.html
├── css/style.css
├── js/app.js
├── vendor/anime.min.js
├── audio/            (empty — all sound is generated procedurally at runtime;
│                      optional .wav files placed here are not required)
└── README.md
```
