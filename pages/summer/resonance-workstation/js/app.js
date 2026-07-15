/* ============================================================
   RESONANCE WORKSTATION — Creatures in the Tall Grass
   Screen prop for S08 / S11 / S12 (Dallas's workstation)
   Fully offline. No dependencies beyond bundled anime.min.js.
   ============================================================ */
(function () {
"use strict";

/* ---------- utilities ---------- */
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pad2 = (n) => String(n).padStart(2, "0");

/* seeded value-noise so waveforms are irregular but stable frame-to-frame */
function makeNoise(seed) {
  const perm = [];
  let s = seed >>> 0;
  for (let i = 0; i < 512; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    perm.push((s >>> 8) / 16777216);
  }
  return function (x) {
    const i = Math.floor(x), f = x - i;
    const u = f * f * (3 - 2 * f);
    const a = perm[((i % 512) + 512) % 512];
    const b = perm[(((i + 1) % 512) + 512) % 512];
    return lerp(a, b, u) * 2 - 1;
  };
}
const n1 = makeNoise(1187), n2 = makeNoise(4409), n3 = makeNoise(9001), n4 = makeNoise(2731);

/* ============================================================
   GLOBAL STATE
   Every visual parameter has current + target; the rAF loop
   eases current toward target, so scene keys feel like the
   software is "processing" rather than snapping.
   ============================================================ */
const S = {
  mode: "1",
  scene: "S08",
  playing: true,
  loop: false,
  ab: false,          // A/B split waveform
  speed: 1,
  lowPower: false,
  t: 0,               // master timeline seconds
  clockBase: null,    // Date offset for the on-screen clock
  sessionStart: performance.now(),

  cur: {},            // eased params (populated from targets below)
  tgt: {
    envNoise: 1.0,    // marsh/room broadband noise amplitude
    hum: 0.14,        // buried low-frequency component
    humVisible: 0,    // how legible the isolated hum trace is
    creature: 0,      // creature tonal amplitude (gold)
    creatureSmooth: 0,// 0 ragged .. 1 rounded lullaby shape
    external: 0,      // hostile external component (green-gray)
    sierra: 0,        // burgundy archive trace overlay
    calm: 0.15,       // global calm factor: reduces jitter, motion, noise
    subjResp: 0,      // subject breaths/min (0 = module dormant)
    opResp: 14.2,
    opPulse: 74,
    phaseDiff: 2.4,   // respiratory phase difference (s)
    corr: 0,          // subject/operator correlation %
    filterHz: 2000,   // displayed low-pass ceiling
    feed: 0,          // abstract enclosure feed brightness
    distress: 0,      // subject variance / raggedness
  },
  ease: 0.02,         // easing speed (some modes slow it further)
  markers: [],        // {frac, label}
  liveWorkspace: false,
};
for (const k in S.tgt) S.cur[k] = S.tgt[k];

/* ============================================================
   RECORDING LIBRARY
   ============================================================ */
const LIBRARY = [
  { name: "BRANFORD_EDGE_0714_1942.wav", dur: "12:41", date: "07/14", sr: "48k", src: "MIC 2", tag: "under the wind", seed: 11 },
  { name: "BACKYARD_LOW_HUM_02.wav", dur: "06:03", date: "07/12", sr: "48k", src: "MIC 2", tag: "not electrical", seed: 23 },
  { name: "MARSH_NIGHT_SIERRA_TAPE_A.wav", dur: "31:17", date: "—", sr: "TAPE", src: "LINE IN", tag: "Sierra tape", sierra: true, seed: 31 },
  { name: "OSC_BEARING_WEST_01.wav", dur: "02:12", date: "07/13", sr: "44.1k", src: "AUX", tag: "left channel stronger", seed: 47 },
  { name: "SUBJECT_RESPIRATION_001.wav", dur: "18:56", date: "07/16", sr: "48k", src: "MIC 1", tag: "breathing?", seed: 53 },
  { name: "SUBJECT_CALL_001.wav", dur: "04:22", date: "07/16", sr: "48k", src: "MIC 1", tag: "again at 01:14", seed: 61 },
  { name: "SUBJECT_CALL_DALLAS_PRESENT.wav", dur: "09:44", date: "07/17", sr: "48k", src: "MIC 1", tag: "when I entered room", seed: 71 },
  { name: "SUBJECT_CALL_DALLAS_ABSENT.wav", dur: "11:02", date: "07/17", sr: "48k", src: "MIC 1", tag: "stopped when I left", seed: 79 },
  { name: "SIERRA_FIELD_NOTE_17.wav", dur: "01:48", date: "—", sr: "TAPE", src: "LINE IN", tag: "do not normalize", sierra: true, seed: 89 },
  { name: "ROOM_TONE_ATTIC_032.wav", dur: "22:00", date: "07/15", sr: "48k", src: "MIC 2", tag: "same interval?", seed: 97 },
];

/* ============================================================
   OBSERVATION LOG — revealed progressively by scene
   ============================================================ */
const LOG_ENTRIES = [
  { t: "19:42", txt: "Low component audible beneath insects.", scene: 1 },
  { t: "20:06", txt: "Same interval in second recording.", scene: 1 },
  { t: "20:31", txt: "Direction appears consistent.", scene: 1 },
  { t: "23:18", txt: "Subject breathing irregular.", scene: 2 },
  { t: "23:24", txt: "External component returned.", scene: 2 },
  { t: "23:27", txt: "Subject settled when I remained beside enclosure.", scene: 2 },
  { t: "00:11", txt: "Vocal phrase repeated.", scene: 2 },
  { t: "00:14", txt: "I became tired.", scene: 2 },
  { t: "02:43", txt: "Woke briefly. Subject still vocalizing.", scene: 3 },
  { t: "06:19", txt: "Need to repeat without headphones.", scene: 3 },
  { t: "06:32", txt: "Correlation may be equipment artifact.", scene: 3 },
  { t: "06:41", txt: "It is not an equipment artifact.", scene: 3 },
];

/* ============================================================
   DOM refs & canvas setup
   ============================================================ */
const waveCanvas = $("wave-canvas"), specCanvas = $("spec-canvas");
const feedCanvas = $("feed-canvas"), breathCanvas = $("breath-canvas");
const wctx = waveCanvas.getContext("2d"), sctx = specCanvas.getContext("2d");
const fctx = feedCanvas.getContext("2d"), bctx = breathCanvas.getContext("2d");
let specCol = 0; // scroll position of spectrogram

function sizeCanvas(c) {
  const r = c.getBoundingClientRect();
  const dpr = S.lowPower ? 1 : Math.min(window.devicePixelRatio || 1, 2);
  if (r.width && (c.width !== Math.round(r.width * dpr) || c.height !== Math.round(r.height * dpr))) {
    c.width = Math.round(r.width * dpr);
    c.height = Math.round(r.height * dpr);
  }
}
function sizeAll() { [waveCanvas, specCanvas, feedCanvas, breathCanvas].forEach(sizeCanvas); }
window.addEventListener("resize", () => { sizeAll(); specColReset(); });
function specColReset() { specCol = 0; sctx.fillStyle = "#0a0b0d"; sctx.fillRect(0, 0, specCanvas.width, specCanvas.height); }

/* ============================================================
   AUDIO ENGINE — fully procedural (Web Audio), starts on first
   user gesture; every node creation is defensive.
   ============================================================ */
const AU = {
  ctx: null, master: null, muted: false,
  layers: {},
  started: false,
};

function audioInit() {
  if (AU.started) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    AU.ctx = new Ctx();
    AU.master = AU.ctx.createGain();
    AU.master.gain.value = 0.55;
    AU.master.connect(AU.ctx.destination);
    buildLayers();
    AU.started = true;
  } catch (e) { /* prop must survive without sound */ }
}

function noiseBuffer(ctx, seconds, brown) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; }
    else d[i] = w;
  }
  return buf;
}

function layer(nodes, gainVal) {
  const g = AU.ctx.createGain();
  g.gain.value = gainVal;
  nodes[nodes.length - 1].connect(g);
  g.connect(AU.master);
  return g;
}

function buildLayers() {
  const c = AU.ctx;
  // tape hiss
  const hiss = c.createBufferSource();
  hiss.buffer = noiseBuffer(c, 4, false); hiss.loop = true;
  const hissF = c.createBiquadFilter(); hissF.type = "highpass"; hissF.frequency.value = 3200;
  hiss.connect(hissF); hiss.start();
  AU.layers.hiss = layer([hiss, hissF], 0.012);

  // marsh / room ambience (brown noise, lowpassed)
  const amb = c.createBufferSource();
  amb.buffer = noiseBuffer(c, 6, true); amb.loop = true;
  const ambF = c.createBiquadFilter(); ambF.type = "lowpass"; ambF.frequency.value = 640;
  amb.connect(ambF); amb.start();
  AU.layers.amb = layer([amb, ambF], 0.10);

  // insects (bandpassed noise, tremolo)
  const ins = c.createBufferSource();
  ins.buffer = noiseBuffer(c, 3, false); ins.loop = true;
  const insF = c.createBiquadFilter(); insF.type = "bandpass"; insF.frequency.value = 4300; insF.Q.value = 9;
  const insTrem = c.createGain(); insTrem.gain.value = 0.5;
  const insLFO = c.createOscillator(); insLFO.frequency.value = 11;
  const insLFOg = c.createGain(); insLFOg.gain.value = 0.4;
  insLFO.connect(insLFOg); insLFOg.connect(insTrem.gain); insLFO.start();
  ins.connect(insF); insF.connect(insTrem); ins.start();
  AU.layers.insects = layer([ins, insF, insTrem], 0.018);

  // buried 41.8 Hz hum
  const hum = c.createOscillator(); hum.type = "sine"; hum.frequency.value = 41.8;
  const hum2 = c.createOscillator(); hum2.type = "sine"; hum2.frequency.value = 83.6;
  const humMix = c.createGain(); humMix.gain.value = 1;
  const h2g = c.createGain(); h2g.gain.value = 0.18;
  hum.connect(humMix); hum2.connect(h2g); h2g.connect(humMix);
  hum.start(); hum2.start();
  AU.layers.hum = layer([hum, humMix], 0.0);

  // creature soothing tone: low fundamental + two soft harmonics,
  // breath-shaped LFO on amplitude and slight pitch drift
  const f0 = 58;
  const ct = c.createGain(); ct.gain.value = 1;
  [1, 1.5, 2.5].forEach((r, i) => {
    const o = c.createOscillator(); o.type = "sine"; o.frequency.value = f0 * r;
    const og = c.createGain(); og.gain.value = i === 0 ? 1 : (i === 1 ? 0.22 : 0.09);
    o.connect(og); og.connect(ct); o.start();
    // imperfect pitch: very slow random detune
    const dLFO = c.createOscillator(); dLFO.frequency.value = 0.07 + i * 0.03;
    const dg = c.createGain(); dg.gain.value = 0.6 + i;
    dLFO.connect(dg); dg.connect(o.detune); dLFO.start();
  });
  const breathLFO = c.createOscillator(); breathLFO.frequency.value = 0.16; // ~10/min
  const bg = c.createGain(); bg.gain.value = 0.45;
  const ctAmp = c.createGain(); ctAmp.gain.value = 0.55;
  breathLFO.connect(bg); bg.connect(ctAmp.gain); breathLFO.start();
  ct.connect(ctAmp);
  AU.layers.creature = layer([ct, ctAmp], 0.0);
  AU.layers.creatureLFO = breathLFO;

  // creature respiration (soft filtered noise swells)
  const br = c.createBufferSource();
  br.buffer = noiseBuffer(c, 5, true); br.loop = true;
  const brF = c.createBiquadFilter(); brF.type = "lowpass"; brF.frequency.value = 300;
  const brAmp = c.createGain(); brAmp.gain.value = 0.5;
  const brLFO = c.createOscillator(); brLFO.frequency.value = 0.18;
  const brLg = c.createGain(); brLg.gain.value = 0.5;
  brLFO.connect(brLg); brLg.connect(brAmp.gain); brLFO.start();
  br.connect(brF); brF.connect(brAmp); br.start();
  AU.layers.breath = layer([br, brF, brAmp], 0.0);

  // hostile external component: detuned low saw pair, unsteady
  const ex1 = c.createOscillator(); ex1.type = "sawtooth"; ex1.frequency.value = 47;
  const ex2 = c.createOscillator(); ex2.type = "sawtooth"; ex2.frequency.value = 48.7;
  const exF = c.createBiquadFilter(); exF.type = "lowpass"; exF.frequency.value = 140;
  const exMix = c.createGain(); exMix.gain.value = 0.5;
  ex1.connect(exMix); ex2.connect(exMix); exMix.connect(exF);
  ex1.start(); ex2.start();
  AU.layers.external = layer([exMix, exF], 0.0);
}

/* per-frame audio gain follows visual state (smooth ramps) */
function audioUpdate() {
  if (!AU.started || AU.muted) return;
  try {
    const t = AU.ctx.currentTime, R = 0.4;
    const cur = S.cur;
    const set = (l, v) => AU.layers[l] && AU.layers[l].gain.setTargetAtTime(v, t, R);
    set("amb", 0.10 * cur.envNoise * (S.playing ? 1 : 0.25));
    set("insects", 0.018 * cur.envNoise * (S.playing ? 1 : 0));
    set("hiss", 0.008 + 0.006 * cur.envNoise);
    set("hum", 0.05 * cur.hum * cur.humVisible * (S.playing ? 1 : 0));
    set("creature", 0.11 * cur.creature * (0.4 + 0.6 * cur.creatureSmooth));
    set("breath", 0.05 * (cur.subjResp > 0 ? 1 : 0) * (0.5 + cur.distress * 0.5));
    set("external", 0.05 * cur.external);
    if (AU.layers.creatureLFO) {
      // creature breath rate tracks its respiration estimate
      AU.layers.creatureLFO.frequency.setTargetAtTime(Math.max(0.08, cur.subjResp / 60), t, 1.2);
    }
  } catch (e) { /* ignore */ }
}

/* master volume / mute controls */
$("master-vol").addEventListener("input", (e) => {
  if (AU.master) AU.master.gain.value = e.target.value / 100;
});
$("mute-btn").addEventListener("click", () => {
  AU.muted = !AU.muted;
  $("mute-btn").classList.toggle("active", AU.muted);
  $("mute-btn").textContent = AU.muted ? "MUTED" : "SND";
  if (AU.master) AU.master.gain.value = AU.muted ? 0 : $("master-vol").value / 100;
});

/* tiny UI click */
function uiClick() {
  if (!AU.started || AU.muted) return;
  try {
    const c = AU.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = "square"; o.frequency.value = 1400 + rand(-200, 200);
    g.gain.setValueAtTime(0.015, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.03);
    o.connect(g); g.connect(AU.master);
    o.start(); o.stop(c.currentTime + 0.04);
  } catch (e) {}
}

/* ============================================================
   OVERLAY MESSAGES (restrained, monospace, fade-in)
   ============================================================ */
let msgSeq = 0;
function showMsgs(list, opts) {
  const box = $("overlay-msgs");
  const mySeq = ++msgSeq;
  box.innerHTML = "";
  const hold = (opts && opts.hold) || false;
  list.forEach((m, i) => {
    const el = document.createElement("div");
    el.className = "ov-msg" + (m.cls ? " " + m.cls : "");
    el.textContent = m.text;
    box.appendChild(el);
    const d = (m.delay != null ? m.delay : i * 900);
    anime({
      targets: el, opacity: [0, 1], translateY: [5, 0],
      duration: 700, delay: d, easing: "easeOutQuad",
    });
    setTimeout(() => { if (msgSeq === mySeq) el.style.opacity = "1"; }, d + 900); // failsafe
  });
  if (!hold) {
    setTimeout(() => {
      if (msgSeq !== mySeq) return;
      anime({ targets: box.children, opacity: 0, duration: 1200, easing: "linear" });
    }, (opts && opts.ttl) || 14000);
  }
}
function clearMsgs() { msgSeq++; $("overlay-msgs").innerHTML = ""; }

/* processing indicator on the transport bar */
let procTimer = null;
function processing(text, ms, done) {
  const el = $("proc-msg");
  clearTimeout(procTimer);
  el.textContent = text + " …";
  procTimer = setTimeout(() => {
    el.textContent = "";
    if (done) done();
  }, ms);
}

/* ============================================================
   LIBRARY RENDERING
   ============================================================ */
function drawMiniWave(canvas, seed, sierra) {
  const ctx = canvas.getContext("2d");
  const w = canvas.width = 200, h = canvas.height = 12;
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = sierra ? "rgba(154,85,92,0.8)" : "rgba(155,148,132,0.7)";
  ctx.beginPath();
  const nz = makeNoise(seed);
  for (let x = 0; x < w; x++) {
    const v = nz(x * 0.11) * 0.5 + nz(x * 0.4) * 0.3;
    ctx.lineTo(x, h / 2 + v * h * 0.42);
  }
  ctx.stroke();
}

function buildLibrary() {
  const list = $("lib-list");
  list.innerHTML = "";
  LIBRARY.forEach((rec, i) => {
    const div = document.createElement("div");
    div.className = "lib-item" + (rec.sierra ? " sierra" : "") + (i === 0 ? " selected" : "");
    div.dataset.idx = i;
    div.innerHTML =
      `<div class="lib-name">${rec.name}</div>` +
      `<div class="lib-meta"><span>${rec.dur}</span><span>${rec.date}</span><span>${rec.sr}</span><span>${rec.src}</span></div>` +
      `<canvas class="lib-wave"></canvas>` +
      `<div class="lib-tag">${rec.tag}</div>`;
    div.addEventListener("click", () => selectRecording(i));
    list.appendChild(div);
    drawMiniWave(div.querySelector(".lib-wave"), rec.seed, rec.sierra);
  });
}

function selectRecording(i) {
  uiClick();
  const rec = LIBRARY[i];
  document.querySelectorAll(".lib-item").forEach((el, j) =>
    el.classList.toggle("selected", j === i));
  processing(rec.sr === "TAPE" ? "LOADING TAPE TRANSFER" : "ALIGNING RECORDINGS",
    rand(400, 1100), () => {
      $("session-file").textContent = rec.name;
      $("input-source").textContent = rec.src === "LINE IN" ? "LINE IN — SIERRA RECORDER"
        : rec.src === "MIC 1" ? "MIC 1 — ENCLOSURE"
        : rec.src === "AUX" ? "AUX — OSCILLATOR" : "MIC 2 — ROOM";
    });
}

/* ============================================================
   OBSERVATION LOG
   ============================================================ */
let logSceneShown = 0;
function buildLog() {
  const box = $("obs-log");
  box.innerHTML = "";
  LOG_ENTRIES.forEach((e) => {
    const div = document.createElement("div");
    div.className = "log-entry";
    div.dataset.scene = e.scene;
    div.innerHTML = `<span class="log-time">${e.t}</span>${e.txt}`;
    box.appendChild(div);
  });
}
function revealLog(scene) {
  if (scene <= logSceneShown) return;
  logSceneShown = scene;
  document.querySelectorAll(".log-entry").forEach((el) => {
    if (+el.dataset.scene <= scene) el.classList.add("shown");
  });
  const box = $("obs-log");
  box.scrollTop = box.scrollHeight;
}
$("log-toggle").addEventListener("click", () => {
  uiClick();
  const log = $("obs-log");
  log.classList.toggle("collapsed");
  $("log-caret").textContent = log.classList.contains("collapsed") ? "▸" : "▾";
});

/* ============================================================
   WAVEFORM RENDERING
   The composite signal is procedural: env noise + hum + creature
   tone + external component + sierra archive trace.
   ============================================================ */
function waveSample(x, t, cur, channel) {
  // x: 0..1 across screen, t: seconds
  const jitter = 1 - cur.calm * 0.7;
  const ph = channel === "B" ? 13.7 : 0;
  let v = 0;

  // broadband marsh/room noise (multi-octave value noise)
  const nx = x * 90 + t * 22 + ph;
  v += cur.envNoise * jitter * (
    n1(nx) * 0.45 + n2(nx * 2.7) * 0.28 + n3(nx * 7.1) * 0.16 + n4(nx * 19) * 0.09);

  // buried low hum — slow sine, only clearly visible once isolated
  const humAmp = cur.hum * (0.3 + 0.7 * cur.humVisible);
  v += humAmp * Math.sin((x * 34 + t * 3.1 + ph * 0.4)) *
       (0.85 + 0.15 * Math.sin(t * 0.47)); // 13.27 s swell

  // creature tone: rounded pulses, gold — raggedness follows distress
  if (cur.creature > 0.01) {
    const breathe = 0.5 + 0.5 * Math.sin(t * (cur.subjResp || 10) / 60 * 2 * Math.PI);
    const rag = cur.distress * (n3(x * 60 + t * 40) * 0.5);
    const body = Math.sin(x * 26 + t * 2.2) * (0.55 + 0.25 * Math.sin(x * 39 + t * 3.3));
    v += cur.creature * (body * (0.5 + 0.5 * breathe) * (1 - cur.distress * 0.4) + rag);
  }

  // external hostile component: jagged, low, unsteady
  if (cur.external > 0.01) {
    v += cur.external * (n4(x * 140 + t * 60) * 0.5 + Math.sin(x * 52 + t * 9.7) * 0.3);
  }
  return clamp(v, -1.15, 1.15);
}

function drawWave(now) {
  const w = waveCanvas.width, h = waveCanvas.height;
  const cur = S.cur;
  wctx.fillStyle = "#0b0c0f";
  wctx.fillRect(0, 0, w, h);

  // faint grid
  wctx.strokeStyle = "rgba(58,61,68,0.25)";
  wctx.lineWidth = 1;
  wctx.beginPath();
  for (let gy = 1; gy < 4; gy++) { wctx.moveTo(0, h * gy / 4); wctx.lineTo(w, h * gy / 4); }
  for (let gx = 1; gx < 12; gx++) { wctx.moveTo(w * gx / 12, 0); wctx.lineTo(w * gx / 12, h); }
  wctx.stroke();

  const mid = h / 2;
  const t = S.t;
  const split = S.ab; // A/B halves

  function trace(color, width, ampl, fn) {
    wctx.strokeStyle = color;
    wctx.lineWidth = width;
    wctx.beginPath();
    const step = S.lowPower ? 4 : 2;
    for (let px = 0; px <= w; px += step) {
      const x = px / w;
      const y = mid - fn(x) * ampl;
      px === 0 ? wctx.moveTo(px, y) : wctx.lineTo(px, y);
    }
    wctx.stroke();
  }

  if (split) {
    // two half-height channels
    const amp = h * 0.16;
    wctx.save();
    wctx.strokeStyle = "rgba(160,138,82,0.4)";
    wctx.beginPath(); wctx.moveTo(0, mid); wctx.lineTo(w, mid); wctx.stroke();
    wctx.restore();
    ["A", "B"].forEach((ch, i) => {
      const cy = h * (i === 0 ? 0.27 : 0.75);
      wctx.strokeStyle = i === 0 ? "rgba(232,224,205,0.75)" : "rgba(200,190,168,0.65)";
      wctx.lineWidth = 1.2;
      wctx.beginPath();
      const step = S.lowPower ? 4 : 2;
      for (let px = 0; px <= w; px += step) {
        const x = px / w;
        const scale = ch === "B" ? 0.72 : 1; // arrival strength differs
        const y = cy - waveSample(x + (ch === "B" ? 0.013 : 0), t, cur, ch) * amp * scale;
        px === 0 ? wctx.moveTo(px, y) : wctx.lineTo(px, y);
      }
      wctx.stroke();
    });
  } else {
    const amp = h * 0.33;
    // composite (cream)
    trace("rgba(232,224,205,0.8)", 1.3, amp, (x) => waveSample(x, t, cur, "A"));
    // isolated hum ghost (phosphor) once filtering begins
    if (cur.humVisible > 0.05) {
      trace(`rgba(143,174,138,${0.55 * cur.humVisible})`, 1, amp,
        (x) => cur.hum * Math.sin(x * 34 + t * 3.1) * (0.85 + 0.15 * Math.sin(t * 0.47)));
    }
    // creature gold trace
    if (cur.creature > 0.02) {
      trace(`rgba(216,180,106,${0.35 + 0.55 * cur.creatureSmooth})`, 1.8, amp, (x) => {
        const breathe = 0.5 + 0.5 * Math.sin(t * (cur.subjResp || 10) / 60 * 2 * Math.PI);
        const rag = cur.distress * n3(x * 60 + t * 40) * 0.5;
        return cur.creature * (Math.sin(x * 26 + t * 2.2) *
          (0.55 + 0.25 * Math.sin(x * 39 + t * 3.3)) * (0.5 + 0.5 * breathe) *
          (1 - cur.distress * 0.4) + rag);
      });
    }
    // external component (muted green-gray, beneath)
    if (cur.external > 0.02) {
      trace(`rgba(111,125,108,${0.6 * cur.external})`, 1, amp,
        (x) => n4(x * 140 + t * 60) * 0.5 + Math.sin(x * 52 + t * 9.7) * 0.3);
    }
    // sierra archive overlay (faded burgundy)
    if (cur.sierra > 0.02) {
      trace(`rgba(154,85,92,${0.7 * cur.sierra})`, 1.1, amp,
        (x) => 0.4 * Math.sin(x * 26 + t * 2.2 + 0.35) * (0.6 + 0.4 * Math.sin(x * 8 + t * 0.9)));
    }
  }

  // playhead
  if (S.playing && !split) {
    const px = ((t * 0.03 * S.speed) % 1) * w;
    wctx.strokeStyle = "rgba(201,151,63,0.55)";
    wctx.beginPath(); wctx.moveTo(px, h * 0.06); wctx.lineTo(px, h * 0.94); wctx.stroke();
  }
}

/* ============================================================
   SPECTROGRAM — column-scrolled offscreen render
   Believable organic bands: broadband floor, insects, wind,
   hum + harmonics with breathing modulation.
   ============================================================ */
function specColumn(yFrac, t, cur) {
  // yFrac: 0 top (2 kHz) .. 1 bottom (0 Hz), log-ish mapping
  const f = Math.pow(1 - yFrac, 2.2) * 2000; // Hz at this row
  let e = 0.05 + 0.05 * cur.envNoise; // floor

  // broadband environmental noise, denser at low freq, animated
  e += cur.envNoise * (0.35 * Math.exp(-f / 500) + 0.12 * Math.exp(-f / 1800)) *
       (0.7 + 0.3 * n1(f * 0.01 + t * 1.7));

  // insect band ~ 1.1–1.9 kHz, patchy
  const ins = Math.exp(-Math.pow((f - 1500) / 320, 2));
  e += cur.envNoise * ins * 0.4 * (0.4 + 0.6 * Math.max(0, n2(t * 3 + f * 0.002)));

  // filter shelf: rows above the low-pass ceiling get attenuated
  if (f > cur.filterHz) e *= Math.exp(-(f - cur.filterHz) / 220);

  // hum fundamental 41.8 + harmonics — curved organic bands
  const wob = 1 + 0.012 * Math.sin(t * 0.55) + 0.006 * n3(t * 1.3); // slow breathing curve
  const humLevel = cur.hum * (0.35 + 0.65 * cur.humVisible);
  [[41.8, 1], [83.6, 0.4], [125.4, 0.22]].forEach(([hf, hw]) => {
    const d = f - hf * wob;
    e += humLevel * hw * Math.exp(-d * d / (2 * 14));
  });

  // creature call: stable low fundamental + delicate harmonics,
  // slow rise/fall, low noise "silence halo" around the tone
  if (cur.creature > 0.02) {
    const phrase = 0.45 + 0.55 * Math.sin(t * 0.32) * Math.sin(t * 0.13 + 1.2); // rise & fall
    const cf = 58 * (1 + 0.02 * Math.sin(t * (cur.subjResp || 10) / 60 * 2 * Math.PI));
    [[1, 1], [1.5, 0.35], [2.5, 0.18], [4, 0.08]].forEach(([r, wgt]) => {
      const d = f - cf * r;
      e += cur.creature * wgt * Math.max(0, phrase) * Math.exp(-d * d / (2 * 90));
    });
    // silence halo: creature tone suppresses nearby noise
    const halo = Math.exp(-Math.pow((f - 120) / 260, 2));
    e *= 1 - cur.creature * cur.creatureSmooth * halo * 0.55;
  }

  // external hostile component: smeared 40–150 Hz blotches
  if (cur.external > 0.02) {
    const blotch = Math.exp(-Math.pow((f - 90) / 70, 2));
    e += cur.external * blotch * (0.4 + 0.6 * Math.abs(n4(t * 6 + f * 0.05)));
  }

  // calm reduces overall clutter
  e *= 1 - cur.calm * 0.35 * Math.exp(-f / 900) * (f > 30 && f < 45 ? 0 : 1);
  return clamp(e, 0, 1.4);
}

function drawSpec(now) {
  const w = specCanvas.width, h = specCanvas.height;
  if (!w || !h) return;
  const cur = S.cur;
  const colsPerFrame = S.lowPower ? 1 : 2;
  if (!S.playing) return;

  for (let c = 0; c < colsPerFrame; c++) {
    // scroll left by 1px
    sctx.drawImage(specCanvas, 1, 0, w - 1, h, 0, 0, w - 1, h);
    const x = w - 1;
    const step = S.lowPower ? 3 : 2;
    for (let y = 0; y < h; y += step) {
      const e = specColumn(y / h, S.t + c * 0.02, cur);
      // energy → color: charcoal → graphite → brass → dusty amber
      let r, g, b;
      if (e < 0.25) { const k = e / 0.25; r = 12 + 30 * k; g = 13 + 32 * k; b = 16 + 36 * k; }
      else if (e < 0.6) { const k = (e - 0.25) / 0.35; r = 42 + 98 * k; g = 45 + 65 * k; b = 52 + 8 * k; }
      else { const k = clamp((e - 0.6) / 0.5, 0, 1); r = 140 + 76 * k; g = 110 + 60 * k; b = 60 + 30 * k; }
      sctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      sctx.fillRect(x, y, 1, step);
    }
  }
}

/* ============================================================
   SUBJECT FEED — abstract enclosure luminosity monitor
   ============================================================ */
function drawFeed(now) {
  const w = feedCanvas.width, h = feedCanvas.height;
  if (!w) return;
  const cur = S.cur;
  fctx.fillStyle = "#060708";
  fctx.fillRect(0, 0, w, h);
  if (cur.feed < 0.03) {
    fctx.fillStyle = "rgba(90,93,85,0.5)";
    fctx.font = "8px Menlo, monospace";
    fctx.fillText("NO FEED", w / 2 - 16, h / 2 + 3);
    return;
  }
  // warm indistinct shape: layered radial glows, drifting slightly
  const flick = cur.distress > 0.2 ? (0.75 + 0.25 * Math.abs(n4(S.t * 14))) : 1;
  const breathe = 0.85 + 0.15 * Math.sin(S.t * (cur.subjResp || 10) / 60 * 2 * Math.PI);
  const cx = w * (0.5 + 0.04 * n1(S.t * 0.3)), cy = h * (0.56 + 0.05 * n2(S.t * 0.25));
  const rad = Math.min(w, h) * (0.45 + 0.1 * breathe);
  const grd = fctx.createRadialGradient(cx, cy, 2, cx, cy, rad);
  const a = 0.55 * cur.feed * flick * breathe;
  grd.addColorStop(0, `rgba(216,180,106,${a})`);
  grd.addColorStop(0.5, `rgba(160,120,60,${a * 0.4})`);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  fctx.fillStyle = grd;
  fctx.fillRect(0, 0, w, h);
  // scan noise over the feed
  if (!S.lowPower) {
    fctx.fillStyle = "rgba(0,0,0,0.25)";
    for (let y = 0; y < h; y += 3) fctx.fillRect(0, y, w, 1);
  }
  fctx.fillStyle = "rgba(143,174,138,0.7)";
  fctx.font = "7px Menlo, monospace";
  fctx.fillText("ENCLOSURE — IR", 4, 9);
}

/* ============================================================
   BREATHING TRACES — subject (gold) vs operator (cream)
   The emotional core: two imperfect traces breathing together.
   ============================================================ */
function drawBreath(now) {
  const w = breathCanvas.width, h = breathCanvas.height;
  if (!w) return;
  const cur = S.cur;
  bctx.fillStyle = "#08090b";
  bctx.fillRect(0, 0, w, h);
  bctx.strokeStyle = "rgba(58,61,68,0.3)";
  bctx.beginPath(); bctx.moveTo(0, h / 2); bctx.lineTo(w, h / 2); bctx.stroke();

  const t = S.t;
  const opRate = cur.opResp / 60 * 2 * Math.PI;
  const saRate = (cur.subjResp || 10) / 60 * 2 * Math.PI;
  const phase = cur.phaseDiff * opRate; // convert phase diff seconds → radians

  function btrace(color, cy, fn) {
    bctx.strokeStyle = color; bctx.lineWidth = 1.2;
    bctx.beginPath();
    for (let px = 0; px <= w; px += 2) {
      const x = px / w;
      const y = cy - fn(x) * h * 0.20;
      px === 0 ? bctx.moveTo(px, y) : bctx.lineTo(px, y);
    }
    bctx.stroke();
  }
  // operator: cream, slight tremor that fades with calm
  btrace("rgba(232,224,205,0.85)", h * 0.34, (x) =>
    Math.sin((t - x * 8) * opRate) * (1 - 0.15 * cur.calm) +
    n2(x * 30 + t * 6) * 0.22 * (1 - cur.calm));
  // subject: gold (only when observed), raggedness follows distress
  if (cur.subjResp > 0.5) {
    btrace(`rgba(216,180,106,0.9)`, h * 0.66, (x) =>
      Math.sin((t - x * 8) * saRate + phase) * (1 - cur.distress * 0.25) +
      n3(x * 44 + t * 9) * 0.35 * cur.distress);
  }
  bctx.fillStyle = "rgba(90,93,85,0.8)";
  bctx.font = "7px Menlo, monospace";
  bctx.fillText("OPER", 4, h * 0.34 - 14);
  if (cur.subjResp > 0.5) bctx.fillText("SUBJ A", 4, h * 0.66 - 14);
}

/* ============================================================
   MODULE READOUTS (right column, per-frame with drift)
   ============================================================ */
let readoutTick = 0;
function updateReadouts(now) {
  if (now - readoutTick < 350) return; // don't churn text every frame
  readoutTick = now;
  const cur = S.cur;
  const drift = (v, r) => v + n1(S.t * 0.8 + v) * r * (1 - cur.calm * 0.75);

  // signal profile
  const humOn = cur.humVisible > 0.15 || cur.creature > 0.05;
  $("sp-fund").textContent = humOn ? (cur.creature > 0.05 ? drift(58.2, 0.4).toFixed(1) : drift(41.8, 0.15).toFixed(1)) + " Hz" : "—";
  $("sp-harm").textContent = humOn ? (cur.creature > 0.05 ? "1 : 1.5 : 2.5" : "1 : 2.0") : "—";
  $("sp-pulse").textContent = cur.humVisible > 0.3 ? drift(13.273, 0.02).toFixed(3) + " s" : "—";
  const stab = clamp(0.3 + cur.calm * 0.68 - cur.distress * 0.4, 0.05, 0.99);
  $("sp-stab").textContent = humOn ? (stab * 100).toFixed(1) + " %" : "—";
  $("sp-noise").textContent = (-31 - 26 * (1 - cur.envNoise)).toFixed(1) + " dB";
  $("sp-drift").textContent = humOn ? drift(0.4, 0.3).toFixed(2) + " °/s" : "—";
  $("sp-conf").textContent = cur.humVisible > 0.5 ? "96.1 %" : (cur.humVisible > 0.15 ? "…" : "—");
  $("fund-readout").textContent = $("sp-fund").textContent;
  $("harm-readout").textContent = humOn && cur.creature > 0.05 ? "3 : 2" : (humOn ? "2 : 1" : "—");

  // environment
  $("env-temp").textContent = (21.4 + cur.calm * 0.9 + n2(S.t * 0.1) * 0.1).toFixed(1) + " °C";
  $("env-spl").textContent = (38 - cur.calm * 9 + cur.external * 6).toFixed(0) + " dB";
  $("env-em").textContent = cur.external > 0.3 ? "ELEVATED" : "LOW";
  $("env-em").className = cur.external > 0.3 ? "warn-v" : "";
  $("env-light").textContent = S.mode === "0" ? "MORNING" : "DIM";

  // subject A
  const live = cur.subjResp > 0.5;
  $("mod-subject").classList.toggle("dormant", !live);
  $("subj-feed-tag").classList.toggle("hidden", !live);
  if (live) {
    $("sa-resp").textContent = drift(cur.subjResp, 0.5).toFixed(1) + " /min";
    $("sa-move").textContent = cur.distress > 0.5 ? "FREQUENT" : cur.distress > 0.15 ? "OCCASIONAL" : "MINIMAL";
    $("sa-move").className = cur.distress > 0.5 ? "warn-v" : "";
    $("sa-vocal").textContent = cur.creature > 0.5 ? "TONAL — SUSTAINED" : cur.creature > 0.1 ? "FRAGMENTS" : "QUIET";
    $("sa-vocal").className = cur.creature > 0.5 ? "hot" : "";
    $("sa-lum").textContent = (0.2 + cur.feed * 0.65 + cur.creature * 0.1).toFixed(2) + " rel";
    $("sa-rest").textContent = cur.distress > 0.4 ? "DISTURBED" : cur.calm > 0.65 ? "REST" : "SETTLING";
    $("sa-rest").className = cur.calm > 0.65 ? "calm-v" : (cur.distress > 0.4 ? "warn-v" : "");
    $("sa-stress").textContent = (cur.distress * 0.9 + 0.05).toFixed(2);
  } else {
    ["sa-resp","sa-move","sa-vocal","sa-lum","sa-rest","sa-stress"].forEach(id => $(id).textContent = "—");
  }

  // operator
  $("op-resp").textContent = drift(cur.opResp, 0.3).toFixed(1) + " /min";
  $("op-pulse").textContent = Math.round(drift(cur.opPulse, 1.5)) + " bpm";
  $("op-motion").textContent = cur.calm > 0.75 ? "STILL" : cur.calm > 0.4 ? "REDUCED" : "ACTIVE";
  $("op-motion").className = cur.calm > 0.75 ? "calm-v" : "";
  $("op-var").textContent = (0.31 * (1 - cur.calm * 0.85) + 0.03).toFixed(2);
  const sess = (performance.now() - S.sessionStart) / 1000;
  $("op-session").textContent = S.mode === "0" ? "07:42" : pad2(Math.floor(sess / 3600)) + ":" + pad2(Math.floor(sess / 60) % 60);
}

/* status module */
function setStatus(lines) {
  for (let i = 1; i <= 3; i++) {
    const l = lines[i - 1] || ["", ""];
    $("st-line-" + i).textContent = l[0] || "";
    $("st-line-" + i + "v").textContent = l[1] || "";
    $("st-line-" + i + "v").className = l[2] || "";
  }
}

/* ============================================================
   PANELS helpers
   ============================================================ */
const ALL_PANELS = ["interval-panel","bearing-panel","match-panel","corr-panel",
  "phase-panel","night-panel","presence-panel","sierra-panel"];
function hidePanels() { ALL_PANELS.forEach(id => $(id).classList.add("hidden")); }
function showPanel(id) {
  const el = $(id);
  el.classList.remove("hidden");
  anime({ targets: el, opacity: [0, 1], translateY: [8, 0], duration: 900, easing: "easeOutQuad" });
  // failsafe: never leave a panel stuck invisible if the animation tick stalls
  setTimeout(() => { el.style.opacity = "1"; el.style.transform = "none"; }, 1100);
}

function clearMarkers() { S.markers = []; $("marker-layer").innerHTML = ""; }

/* mode housekeeping shared by every key */
let modeTimers = [];
function resetModeTimers() { modeTimers.forEach(clearTimeout); modeTimers = []; }
function later(fn, ms) { modeTimers.push(setTimeout(fn, ms)); }

function setSession(label, file, clock) {
  $("session-label").textContent = label;
  if (file) $("session-file").textContent = file;
  if (clock != null) S.clockBase = clock; // seconds-of-day
  anime({ targets: [$("session-label"), $("session-file")], opacity: [0, 1], duration: 800, easing: "linear" });
}

function enterMode(m) {
  resetModeTimers();
  clearMsgs();
  hidePanels();
  S.mode = m;
  S.ab = false;
  $("btn-ab").classList.remove("active");
  ["ab-label-l", "ab-label-r"].forEach(id => $(id).classList.add("hidden"));
}

/* ============================================================
   ================  FILMING MODES  ===========================
   ============================================================ */
/* if an S11/S12 key is hit cold, quietly establish the live workspace first */
function ensureLive() {
  if (S.scene === "S08") {
    MODES["6"]();
    resetModeTimers();
    clearMsgs();
    for (const k in S.tgt) S.cur[k] = S.tgt[k]; // jump-cut, no settle animation
  }
}

const MODES = {

/* ---- 1 · S08 raw marsh recording ---- */
"1": function () {
  enterMode("1");
  S.scene = "S08";
  clearMarkers();
  Object.assign(S.tgt, {
    envNoise: 1.0, hum: 0.14, humVisible: 0, creature: 0, creatureSmooth: 0,
    external: 0, sierra: 0, calm: 0.15, subjResp: 0, opResp: 14.2, opPulse: 74,
    phaseDiff: 2.4, corr: 0, filterHz: 2000, feed: 0, distress: 0,
  });
  S.ease = 0.03;
  setSession("SESSION: MARSH RECORDING REVIEW", "BRANFORD_EDGE_0714_1942.wav", 19 * 3600 + 42 * 60);
  $("wave-mode-label").textContent = "WAVEFORM — LINE MONITOR";
  $("filter-readout").textContent = "";
  $("input-source").textContent = "MIC 2 — ROOM";
  document.querySelectorAll(".lib-item").forEach((el, j) => el.classList.toggle("selected", j === 0));
  setStatus([["MONITORING", ""], ["FILTER", "OFF"], ["MARKERS", "0"]]);
  revealLog(1);
},

/* ---- 2 · S08 isolate low frequency ---- */
"2": function () {
  enterMode("2");
  processing("CALCULATING NOISE PROFILE", 900, () => {
    // animate the filter ceiling downward; noise recedes, hum emerges
    anime({
      targets: S.tgt, filterHz: 86, envNoise: 0.32, humVisible: 0.85, hum: 0.5,
      duration: 5200, easing: "easeInOutQuad",
      update: () => { $("filter-readout").textContent = "LP " + Math.round(S.tgt.filterHz) + " Hz"; },
    });
    later(() => showMsgs([
      { text: "LOW-PASS FILTER: 86 Hz", cls: "subtle" },
      { text: "REPEATING COMPONENT DETECTED" },
      { text: "FUNDAMENTAL ESTIMATE: 41.8 Hz" },
    ], { hold: true }), 2600);
    later(() => processing("ESTIMATING FUNDAMENTAL", 1100), 3600);
    setStatus([["MONITORING", ""], ["FILTER", "LP 86 Hz", "calm-v"], ["MARKERS", "0"]]);
  });
},

/* ---- 3 · S08 mark repetitions ---- */
"3": function () {
  enterMode("3");
  const times = ["00:18.240", "00:31.511", "00:44.779", "00:58.052", "01:11.321"];
  clearMarkers();
  const layer = $("marker-layer");
  times.forEach((label, i) => {
    later(() => {
      uiClick();
      const el = document.createElement("div");
      el.className = "wave-marker";
      el.dataset.t = label;
      el.style.left = (12 + i * 19.2) + "%";
      layer.appendChild(el);
      anime({ targets: el, opacity: [0, 0.75], scaleY: [0.4, 1], duration: 500, easing: "easeOutQuad" });
    }, 700 + i * 1150);
  });
  later(() => {
    processing("UPDATING OBSERVATION LOG", 700);
    showPanel("interval-panel");
    $("mean-int").textContent = "—"; $("var-int").textContent = "—"; $("conf-int").textContent = "—";
    later(() => { $("mean-int").textContent = "13.273 s"; }, 900);
    later(() => { $("var-int").textContent = "0.006 s"; }, 1700);
    later(() => {
      const o = { v: 0 };
      anime({ targets: o, v: 96.1, duration: 2400, easing: "easeOutQuad",
        update: () => { $("conf-int").textContent = o.v.toFixed(1) + " %"; } });
    }, 2600);
  }, 700 + times.length * 1150 + 500);
  setStatus([["MONITORING", ""], ["FILTER", "LP 86 Hz", "calm-v"], ["MARKERS", "5"]]);
},

/* ---- 4 · S08 directional comparison ---- */
"4": function () {
  enterMode("4");
  processing("ALIGNING RECORDINGS", 1200, () => {
    S.ab = true;
    $("btn-ab").classList.add("active");
    $("ab-label-l").textContent = "A: BACKYARD_WEST.wav";
    $("ab-label-r").textContent = "B: MARSH_EDGE_NORTH.wav";
    ["ab-label-l", "ab-label-r"].forEach(id => $(id).classList.remove("hidden"));
    $("wave-mode-label").textContent = "A/B COMPARISON — PHASE OFFSET 4.1 ms";
    showPanel("bearing-panel");
    drawBearing();
    setStatus([["A/B", "ACTIVE", "hot"], ["CH BAL", "L +2.8 dB"], ["BEARING", "247°"]]);
  });
},

/* ---- 5 · S08 match found / hunch ---- */
"5": function () {
  enterMode("5");
  S.tgt.humVisible = 1; S.tgt.hum = 0.6;
  processing("COMPARING RECORDINGS", 1400, () => {
    // brief second harmonic pulse + sierra overlay
    anime({ targets: S.tgt, sierra: 0.85, duration: 2600, easing: "easeInOutQuad" });
    later(() => showPanel("match-panel"), 1800);
    later(() => {
      // settle: sierra trace fades most of the way back down
      anime({ targets: S.tgt, sierra: 0.3, calm: 0.3, duration: 6000, easing: "easeInOutQuad" });
    }, 9000);
    setStatus([["MATCH", "FOUND", "hot"], ["REF", "SIERRA_17"], ["FILTER", "LP 86 Hz"]]);
  });
  revealLog(1);
},

/* ---- 6 · S11 live subject monitoring ---- */
"6": function () {
  enterMode("6");
  S.scene = "S11";
  S.liveWorkspace = true;
  clearMarkers();
  Object.assign(S.tgt, {
    envNoise: 0.34, hum: 0.05, humVisible: 0, creature: 0.5, creatureSmooth: 0.2,
    external: 0, sierra: 0, calm: 0.3, subjResp: 16, opResp: 14.8, opPulse: 76,
    phaseDiff: 2.4, corr: 0, filterHz: 400, feed: 0.7, distress: 0.28,
  });
  S.ease = 0.02;
  S.sessionStart = performance.now();
  setSession("LIVE OBSERVATION — SUBJECT A", "MIC 1 — ENCLOSURE (LIVE)", 23 * 3600 + 4 * 60);
  $("wave-mode-label").textContent = "LIVE INPUT — MIC 1 — ENCLOSURE";
  $("filter-readout").textContent = "LP 400 Hz";
  $("input-source").textContent = "MIC 1 — ENCLOSURE";
  setStatus([["LIVE", "REC", "hot"], ["SUBJECT", "SETTLING"], ["EXT", "NONE"]]);
  showMsgs([{ text: "LIVE OBSERVATION ACTIVE", cls: "subtle" }], { ttl: 6000 });
  revealLog(2);
},

/* ---- 7 · S11 distress event ---- */
"7": function () {
  ensureLive();
  enterMode("7");
  anime({
    targets: S.tgt, external: 0.75, distress: 0.85, creatureSmooth: 0.05,
    creature: 0.6, subjResp: 26, calm: 0.1, opResp: 15.5, feed: 0.85,
    duration: 6500, easing: "easeInOutQuad",
  });
  later(() => showMsgs([
    { text: "EXTERNAL COMPONENT PRESENT", cls: "warn" },
    { text: "SOURCE: UNRESOLVED", cls: "warn" },
    { text: "SUBJECT VARIANCE INCREASING", cls: "warn" },
  ], { hold: true }), 2200);
  setStatus([["LIVE", "REC", "hot"], ["EXT SOURCE", "UNRESOLVED", "warn-v"], ["SUBJ VAR", "RISING", "warn-v"]]);
},

/* ---- 8 · S11 Dallas approaches — slow stabilization ---- */
"8": function () {
  ensureLive();
  enterMode("8");
  // the whole point: ~20 s of gradual settling
  anime({
    targets: S.tgt, external: 0, distress: 0.06, creatureSmooth: 0.85,
    creature: 0.7, subjResp: 11, calm: 0.8, opResp: 10.5, opPulse: 63, feed: 0.6,
    duration: 21000, easing: "easeInOutSine",
  });
  setStatus([["LIVE", "REC", "hot"], ["SUBJ VAR", "FALLING", "calm-v"], ["OPER", "SEATED"]]);
  // correlation counter appears late, steps up quietly
  later(() => {
    showPanel("corr-panel");
    const steps = [18, 34, 49, 67, 81, 92];
    steps.forEach((v, i) => later(() => {
      $("corr-value").textContent = v + " %";
      anime({ targets: $("corr-value"), opacity: [0.4, 1], duration: 700, easing: "linear" });
    }, i * 2400));
  }, 9000);
  revealLog(2);
},

/* ---- 9 · S11 soothing tone / synchronization ---- */
"9": function () {
  ensureLive();
  enterMode("9");
  anime({
    targets: S.tgt, creature: 0.85, creatureSmooth: 1, calm: 0.94,
    subjResp: 9.5, opResp: 9.5, opPulse: 57, distress: 0, envNoise: 0.16,
    external: 0, feed: 0.55,
    duration: 15000, easing: "easeInOutSine",
  });
  showPanel("phase-panel");
  $("phase-coherence").classList.add("hidden");
  const seq = [2.4, 1.8, 1.1, 0.6, 0.2];
  seq.forEach((v, i) => later(() => {
    $("phase-value").textContent = v.toFixed(1) + " s";
    S.tgt.phaseDiff = v;
  }, 1500 + i * 3200));
  later(() => {
    $("phase-value").textContent = "0.2 s";
    $("phase-coherence").classList.remove("hidden");
    anime({ targets: $("phase-coherence"), opacity: [0, 1], duration: 1600, easing: "linear" });
  }, 1500 + seq.length * 3200);
  setStatus([["SUBJECT", "VOCALIZING", "hot"], ["OPER RESP", "FALLING", "calm-v"], ["COHERENCE", "…"]]);
  later(() => setStatus([["SUBJECT", "VOCALIZING", "hot"], ["OPER", "STILL", "calm-v"], ["COHERENCE", "STABLE", "calm-v"]]), 18000);
},

/* ---- 0 · S12 morning observation ---- */
"0": function () {
  enterMode("0");
  S.scene = "S12";
  Object.assign(S.tgt, {
    envNoise: 0.2, hum: 0.03, humVisible: 0, creature: 0.35, creatureSmooth: 0.9,
    external: 0, sierra: 0, calm: 0.85, subjResp: 9, opResp: 10, opPulse: 58,
    phaseDiff: 0.4, corr: 91, filterHz: 400, feed: 0.4, distress: 0,
  });
  setSession("SESSION RESUMED — 06:17:42", "OVERNIGHT LOG — 07 h 42 m", 6 * 3600 + 17 * 60 + 42);
  $("wave-mode-label").textContent = "LIVE INPUT — MIC 1 — ENCLOSURE";
  showMsgs([
    { text: "SESSION DURATION: 07 h 42 m", cls: "subtle" },
    { text: "OPERATOR INACTIVE: 06 h 11 m", cls: "subtle" },
    { text: "SUBJECT STATE: REST" },
    { text: "VOCAL ACTIVITY: INTERMITTENT", cls: "subtle" },
    { text: "ROOM NOISE: LOW", cls: "subtle" },
  ], { ttl: 20000 });
  later(() => { showPanel("night-panel"); drawNight(); }, 2500);
  setStatus([["SUBJECT", "REST", "calm-v"], ["OPERATOR", "WAKING"], ["NIGHT LOG", "SAVED"]]);
  revealLog(3);
  later(() => {
    $("unsaved-note").classList.remove("hidden");
    anime({ targets: $("unsaved-note"), opacity: [0, 0.9], duration: 2000, easing: "linear" });
    later(() => anime({ targets: $("unsaved-note"), opacity: 0, duration: 2500, easing: "linear",
      complete: () => $("unsaved-note").classList.add("hidden") }), 9000);
  }, 12000);
},

/* ---- Q · S12 presence comparison ---- */
"q": function () {
  ensureLive();
  enterMode("q");
  processing("COMPARING RESPIRATION", 1300, () => {
    showPanel("presence-panel");
    drawPresence();
    later(() => showMsgs([
      { text: "MUTUAL STATE VARIATION", cls: "subtle" },
      { text: "DIRECTIONAL CAUSALITY: INCONCLUSIVE" },
    ], { hold: true }), 2000);
  });
  setStatus([["COMPARE", "PRESENT / ABSENT"], ["CAUSALITY", "INCONCLUSIVE"], ["", ""]]);
},

/* ---- W · S12 playback experiment ---- */
"w": function () {
  ensureLive();
  enterMode("w");
  $("wave-mode-label").textContent = "PLAYBACK — SUBJECT_CALL_001.wav → SPEAKER";
  processing("CHECKING CLOCK SOURCE", 800, () => {
    showMsgs([{ text: "PLAYBACK STARTED", cls: "subtle" }], { ttl: 5000 });
    // playback: sierra-less clean tone rises (played recording)…
    anime({ targets: S.tgt, creature: 0.5, creatureSmooth: 0.9, calm: 0.6, duration: 3000, easing: "easeInOutQuad" });
    // …subject listens, then responds after a believable delay
    later(() => {
      anime({ targets: S.tgt, creature: 0.9, subjResp: 10.5, duration: 2400, easing: "easeOutQuad" });
      showMsgs([
        { text: "CALL / RESPONSE CANDIDATE" },
        { text: "RESPONSE LATENCY: 1.84 s", cls: "subtle" },
        { text: "MATCH: 88.4%" },
      ], { hold: true });
    }, 6800);
    // playback stops; live subject continues one extra pulse
    later(() => {
      $("wave-mode-label").textContent = "PLAYBACK STOPPED — LIVE INPUT — MIC 1";
      anime({ targets: S.tgt, creature: 0.55, duration: 1200, easing: "easeOutQuad" });
      later(() => anime({ targets: S.tgt, creature: 0.8, duration: 1800, easing: "easeInOutSine" }), 2200);
      later(() => anime({ targets: S.tgt, creature: 0.4, duration: 3200, easing: "easeInOutSine" }), 5000);
    }, 16000);
  });
  setStatus([["PLAYBACK", "AUX → SPEAKER", "hot"], ["RESPONSE", "1.84 s"], ["MATCH", "88.4 %"]]);
},

/* ---- E · Sierra comparison ---- */
"e": function () {
  ensureLive();
  enterMode("e");
  document.querySelectorAll(".lib-item").forEach((el, j) => el.classList.toggle("selected", j === 8));
  $("input-source").textContent = "LINE IN — SIERRA RECORDER";
  processing("LOADING TAPE TRANSFER", 1600, () => {
    anime({ targets: S.tgt, sierra: 0.8, creature: 0.7, creatureSmooth: 0.95, calm: 0.85, opResp: 9.8, duration: 6000, easing: "easeInOutSine" });
    showPanel("sierra-panel");
    startSierraAnim();
    later(() => {
      $("ratio-row").classList.remove("hidden");
      anime({ targets: $("ratio-row"), opacity: [0, 1], duration: 1400, easing: "linear" });
    }, 9000);
    // let it disappear back into ordinary noise
    later(() => {
      anime({ targets: S.tgt, sierra: 0.05, duration: 7000, easing: "easeInOutQuad" });
      anime({ targets: $("ratio-row"), opacity: 0.25, duration: 5000, easing: "linear" });
    }, 17000);
  });
  setStatus([["ARCHIVE", "SIERRA_17", "hot"], ["SHARED INT.", "3 : 2"], ["", ""]]);
},

/* ---- R · external hum returns ---- */
"r": function () {
  ensureLive();
  enterMode("r");
  anime({
    targets: S.tgt, external: 0.65, distress: 0.6, creatureSmooth: 0.25,
    calm: 0.2, subjResp: 19, opResp: 14, opPulse: 74, sierra: 0,
    duration: 7000, easing: "easeInOutQuad",
  });
  later(() => showMsgs([
    { text: "SECONDARY SOURCE PRESENT", cls: "warn" },
    { text: "NOT GENERATED IN ROOM", cls: "warn" },
    { text: "BEARING UNAVAILABLE", cls: "subtle" },
  ], { hold: true }), 2500);
  setStatus([["EXT SOURCE", "PRESENT", "warn-v"], ["ORIGIN", "OUTSIDE"], ["SYNC", "BROKEN", "warn-v"]]);
},

/* ---- T · complete calm state ---- */
"t": function () {
  ensureLive();
  enterMode("t");
  S.ease = 0.008; // everything drifts very slowly into stillness
  anime({
    targets: S.tgt, external: 0, distress: 0, creature: 0.45, creatureSmooth: 1,
    calm: 1, envNoise: 0.1, subjResp: 8.5, opResp: 8.5, opPulse: 54,
    phaseDiff: 0.15, sierra: 0, feed: 0.4, hum: 0.02, humVisible: 0,
    duration: 12000, easing: "easeInOutSine",
  });
  later(() => showMsgs([
    { text: "SUBJECT STATE: REST", cls: "subtle" },
    { text: "OPERATOR STATE: REST", cls: "subtle" },
    { text: "COHERENCE: STABLE", cls: "subtle" },
  ], { hold: true }), 6000);
  setStatus([["SUBJECT", "REST", "calm-v"], ["OPERATOR", "REST", "calm-v"], ["COHERENCE", "STABLE", "calm-v"]]);
},

/* ---- Y · full reset ---- */
"y": function () { S.ease = 0.03; MODES["1"](); },
};

/* ============================================================
   STATIC PANEL DRAWINGS
   ============================================================ */
function drawBearing() {
  const c = $("bearing-canvas"), ctx = c.getContext("2d");
  ctx.clearRect(0, 0, c.width, c.height);
  const cx = c.width / 2, cy = c.height / 2 + 8;
  // notebook-ish compass ring
  ctx.strokeStyle = "rgba(155,148,132,0.5)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, 58, 0, Math.PI * 2); ctx.stroke();
  ctx.font = "8px Menlo, monospace"; ctx.fillStyle = "rgba(155,148,132,0.7)";
  ctx.fillText("N", cx - 3, cy - 63);
  // two crude bearing arrows from the two mics
  function arrow(x0, y0, deg, len, color) {
    const a = (deg - 90) * Math.PI / 180;
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    ctx.strokeStyle = color; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.beginPath(); ctx.arc(x0, y0, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
  arrow(cx + 26, cy + 18, 251, 62, "rgba(232,224,205,0.8)");   // backyard mic
  arrow(cx - 20, cy - 6, 243, 60, "rgba(201,165,90,0.85)");    // marsh edge mic
  // consensus line toward deeper marsh (slightly heavier)
  arrow(cx + 4, cy + 6, 247, 74, "rgba(201,151,63,0.95)");
  ctx.fillStyle = "rgba(201,151,63,0.9)";
  ctx.font = "italic 9px Georgia, serif";
  ctx.fillText("deeper marsh", 8, 16);
}

/* overnight longitudinal graph — precomputed so it looks archival */
function drawNight() {
  const c = $("night-canvas");
  c.width = c.clientWidth * 2; c.height = 300;
  const ctx = c.getContext("2d");
  const w = c.width, h = c.height;
  ctx.fillStyle = "#0b0c0f"; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "rgba(58,61,68,0.4)";
  for (let i = 1; i < 8; i++) { ctx.beginPath(); ctx.moveTo(w * i / 8, 0); ctx.lineTo(w * i / 8, h); ctx.stroke(); }
  ctx.font = "16px Menlo, monospace"; ctx.fillStyle = "rgba(90,93,85,0.9)";
  ["23:00","00:00","01:00","02:00","03:00","04:00","05:00"].forEach((s, i) =>
    ctx.fillText(s, w * (i + 1) / 8 - 22, h - 8));

  // creature vocal pulses (events): 9 quiet pulses across the night
  const pulses = [0.09, 0.18, 0.27, 0.36, 0.47, 0.58, 0.68, 0.79, 0.9];
  function row(cy, color, width, fn) {
    ctx.strokeStyle = color; ctx.lineWidth = width;
    ctx.beginPath();
    for (let px = 0; px <= w; px += 3) {
      const x = px / w;
      ctx.lineTo(px, cy - fn(x) * 26);
    }
    ctx.stroke();
  }
  const nearPulse = (x) => pulses.reduce((m, p) => Math.max(m, Math.exp(-Math.pow((x - p) / 0.018, 2))), 0);
  const afterPulse = (x) => pulses.reduce((m, p) => Math.max(m, x > p ? Math.exp(-(x - p) / 0.045) : 0), 0);
  // subject vocal activity (gold spikes)
  row(h * 0.16, "rgba(201,165,90,0.95)", 2.5, (x) => nearPulse(x) * 1.9 + n1(x * 60) * 0.06);
  // subject respiration (dim gold, slow)
  row(h * 0.36, "rgba(138,115,63,0.9)", 2, (x) => 0.5 + n2(x * 25) * 0.28 - nearPulse(x) * 0.2);
  // operator respiration (cream) — dips FOLLOW the pulses by a small offset
  row(h * 0.56, "rgba(232,224,205,0.9)", 2, (x) => 0.6 + n3(x * 20) * 0.3 - afterPulse(x - 0.008) * 0.55);
  // room noise (grey-green, low)
  row(h * 0.74, "rgba(92,96,88,0.8)", 2, (x) => 0.25 + Math.abs(n4(x * 40)) * 0.3);
  // external hum activity (env green): brief episode ~03:10, subject pulses answer it
  row(h * 0.9, "rgba(111,125,108,0.85)", 2, (x) => Math.exp(-Math.pow((x - 0.62) / 0.02, 2)) * 1.4 + 0.03);
}

function drawPresence() {
  [["pp-left", 0.15], ["pp-right", 0.55]].forEach(([id, varAmt]) => {
    const c = $(id);
    c.width = c.clientWidth * 2; c.height = 180;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#0b0c0f"; ctx.fillRect(0, 0, c.width, c.height);
    function row(cy, color, nz, amt) {
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath();
      for (let px = 0; px <= c.width; px += 3) {
        const x = px / c.width;
        ctx.lineTo(px, cy + (Math.sin(x * 40) * 0.4 + nz(x * 55) * amt * 2.2) * 26);
      }
      ctx.stroke();
    }
    row(c.height * 0.32, "rgba(201,165,90,0.9)", n1, varAmt);        // subject
    row(c.height * 0.7, "rgba(232,224,205,0.85)", n2, varAmt + 0.05); // operator
  });
}

/* sierra three-trace alignment animation (E) */
let sierraAnim = null;
function startSierraAnim() {
  const c = $("sierra-canvas");
  c.width = c.clientWidth * 2; c.height = 280;
  const ctx = c.getContext("2d");
  const t0 = performance.now();
  cancelAnimationFrame(sierraAnim);
  (function frame() {
    if ($("sierra-panel").classList.contains("hidden")) return;
    const el = (performance.now() - t0) / 1000;
    const conv = clamp(el / 9, 0, 1); // convergence over ~9 s, then release
    const rel = clamp((el - 17) / 8, 0, 1);
    const k = conv * (1 - rel * 0.8);
    const w = c.width, h = c.height;
    ctx.fillStyle = "#0b0c0f"; ctx.fillRect(0, 0, w, h);
    const base = (x, t) => Math.sin(x * 30 + t * 1.6) * (0.6 + 0.3 * Math.sin(x * 9 + t * 0.5));
    function row(cy, color, own, ownAmt) {
      ctx.strokeStyle = color; ctx.lineWidth = 2.2;
      ctx.beginPath();
      for (let px = 0; px <= w; px += 3) {
        const x = px / w;
        const shared = base(x, el);
        const v = lerp(own(x, el) * ownAmt, shared, k);
        ctx.lineTo(px, cy - v * 32);
      }
      ctx.stroke();
    }
    row(h * 0.24, "rgba(154,85,92,0.9)", (x, t) => Math.sin(x * 30 + t * 1.6 + 0.2) * 0.8, 1);          // sierra (near the shape already)
    row(h * 0.52, "rgba(216,180,106,0.9)", (x, t) => Math.sin(x * 34 + t * 2.4) * 0.7 + n3(x * 40 + t * 5) * 0.3, 1); // subject
    row(h * 0.8, "rgba(232,224,205,0.85)", (x, t) => Math.sin(x * 22 + t * 1.1) * 0.5 + n2(x * 30 + t * 4) * 0.35, 1); // operator
    sierraAnim = requestAnimationFrame(frame);
  })();
}

/* ============================================================
   CLICK INTERACTIONS
   ============================================================ */
$("btn-play").addEventListener("click", () => {
  uiClick();
  S.playing = !S.playing;
  $("btn-play").textContent = S.playing ? "▶ PLAY" : "❚❚ PAUSED";
  $("btn-play").classList.toggle("active", !S.playing);
});
$("btn-loop").addEventListener("click", () => {
  uiClick(); S.loop = !S.loop;
  $("btn-loop").classList.toggle("active", S.loop);
});
$("btn-ab").addEventListener("click", () => {
  uiClick();
  if (S.ab) { S.ab = false; $("btn-ab").classList.remove("active");
    ["ab-label-l","ab-label-r"].forEach(id => $(id).classList.add("hidden")); }
  else MODES["4"]();
});
$("speed-sel").addEventListener("change", (e) => {
  uiClick(); S.speed = parseFloat(e.target.value);
});
$("noise-iso").addEventListener("input", (e) => {
  const v = e.target.value / 100;
  S.tgt.envNoise = lerp(1, 0.15, v);
  S.tgt.humVisible = Math.max(S.tgt.humVisible, v * 0.9);
  processing("CALCULATING NOISE PROFILE", 600);
});
// clicking the spectrogram drops a temporary frequency inspect readout
specCanvas.addEventListener("click", (e) => {
  uiClick();
  const r = specCanvas.getBoundingClientRect();
  const f = Math.pow(1 - (e.clientY - r.top) / r.height, 2.2) * 2000;
  processing("ESTIMATING FUNDAMENTAL", rand(400, 900), () => {
    $("filter-readout").textContent = "INSPECT " + f.toFixed(1) + " Hz";
  });
});
waveCanvas.addEventListener("click", () => uiClick());

/* ============================================================
   KEYBOARD
   ============================================================ */
document.addEventListener("keydown", (ev) => {
  if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
  audioInit();
  const k = ev.key.toLowerCase();
  if (MODES[k]) { MODES[k](); return; }
  switch (k) {
    case "h":
      document.body.classList.toggle("guide-hidden");
      break;
    case "f":
      if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
      else document.exitFullscreen().catch(() => {});
      break;
    case "l":
      S.lowPower = !S.lowPower;
      document.body.classList.toggle("low-power", S.lowPower);
      sizeAll(); specColReset();
      break;
    case "escape":
      hidePanels(); clearMsgs();
      break;
    case "d":
      if (ev.shiftKey) document.body.classList.toggle("debug"); // Shift+D: allow text selection
      break;
  }
});
document.addEventListener("pointerdown", audioInit, { once: false });

/* ============================================================
   CLOCK + timestamp drift (imperfect equipment)
   ============================================================ */
let clockDrift = 0;
function updateClock(now) {
  if (S.clockBase == null) S.clockBase = 19 * 3600 + 42 * 60;
  const el = (performance.now() - S.sessionStart) / 1000;
  if (Math.random() < 0.002) clockDrift += rand(-0.4, 0.7); // occasional drift
  const s = Math.floor(S.clockBase + el + clockDrift) % 86400;
  $("clock").textContent = pad2(Math.floor(s / 3600)) + ":" + pad2(Math.floor(s / 60) % 60) + ":" + pad2(s % 60);
  // timecode
  const tc = S.t * S.speed;
  $("timecode").textContent = pad2(Math.floor(tc / 3600)) + ":" + pad2(Math.floor(tc / 60) % 60) + ":" +
    pad2(Math.floor(tc) % 60) + "." + String(Math.floor((tc % 1) * 1000)).padStart(3, "0");
}

/* ============================================================
   MAIN LOOP
   ============================================================ */
let lastFrame = performance.now();
let flickerT = 0;
function loop(now) {
  const dt = Math.min((now - lastFrame) / 1000, 0.1);
  lastFrame = now;
  if (S.playing) S.t += dt * S.speed;

  // ease current → target; calm slows the easing itself (screen "settles")
  const e = S.ease * (1 - S.cur.calm * 0.4) * (dt * 60);
  for (const k in S.tgt) S.cur[k] = lerp(S.cur[k], S.tgt[k], clamp(e, 0, 1));

  drawWave(now);
  drawSpec(now);
  drawFeed(now);
  drawBreath(now);
  updateReadouts(now);
  updateClock(now);
  audioUpdate();

  // occasional screen refresh flicker (skipped in low power / deep calm)
  if (!S.lowPower && S.cur.calm < 0.8) {
    flickerT -= dt;
    if (flickerT <= 0) {
      flickerT = rand(6, 18);
      const ov = $("bloom-overlay");
      ov.style.opacity = "0.65";
      setTimeout(() => { ov.style.opacity = "1"; }, 70);
    }
  }
  requestAnimationFrame(loop);
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  if (window.anime) anime.suspendWhenDocumentHidden = false; // prop must keep moving even if window visibility flickers
  buildLibrary();
  buildLog();
  sizeAll();
  specColReset();
  MODES["1"]();
  // pre-warm current values so mode 1 doesn't animate in from zero
  for (const k in S.tgt) S.cur[k] = S.tgt[k];
  // optional ?start=<key> lets a state be preloaded before rolling camera
  const start = new URLSearchParams(location.search).get("start");
  if (start && MODES[start.toLowerCase()] && start !== "1") {
    setTimeout(() => MODES[start.toLowerCase()](), 400);
  }
  requestAnimationFrame(loop);
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
else boot();

})();
