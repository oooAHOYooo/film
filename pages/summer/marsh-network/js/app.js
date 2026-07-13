/* =========================================================================
   MAKAYLA FIELD NETWORK — Inherited Marsh Array
   Practical field-research instrument for CREATURES IN THE TALL GRASS.
   Everything runs offline. Keys 0–9 drive the cinematic scenarios.
   ========================================================================= */
(function () {
'use strict';

const MFN = window.MFN = {};

/* ---------------- array definition -------------------------------------
   Positions are SVG map coordinates (600x640 viewBox).
   Installed dates go back years — the array is inherited work.          */
const NODES = [
    { id: 'NODE 01', x: 150, y: 555, kind: 'geophone',   fw: '4.7.2', installed: '2009-04-18', note: "mom's first pour — concrete still good" },
    { id: 'NODE 02', x: 235, y: 455, kind: 'microphone', fw: '4.7.2', installed: '2011-06-02', note: 'rewired after the ’12 nor’easter' },
    { id: 'NODE 03', x: 300, y: 330, kind: 'microphone', fw: '4.7.1', installed: '2013-05-11', note: 'best low-freq response in the array' },
    { id: 'NODE 04', x: 218, y: 205, kind: 'hydrophone', fw: '4.6.9', installed: '2014-09-27', note: 'in the channel, mind the tide' },
    { id: 'NODE 05', x: 352, y: 118, kind: 'microphone', fw: '4.7.2', installed: '2016-04-03', note: 'replaced windscreen 03/24' },
    { id: 'NODE 06', x: 415, y: 235, kind: 'geophone',   fw: '4.7.2', installed: '2018-08-14', note: 'near old oak — root noise below 8 Hz' },
    { id: 'NODE 07', x: 388, y: 395, kind: 'microphone', fw: '4.7.0', installed: '2021-05-30', note: 'first node I built alone — M.' },
    { id: 'NODE 08', x: 300, y: 555, kind: 'hydrophone', fw: '4.7.2', installed: '2023-03-19', note: 'boardwalk cable run, packet loss in rain' },
];
const HOUSE = { x: 452, y: 468 };
const MARSH_MARK = { x: 252, y: 312 };   // predicted source — deep in the marsh body
const SOUND_MS = 343 / 1000;              // metres per millisecond
const MAP_M_PER_UNIT = 100 / 60;          // scale bar: 60 units = 100 m

/* ---------------- state ------------------------------------------------ */
const state = {
    mode: 1,
    modeName: 'PASSIVE MONITORING',
    lowPower: false,
    stormLevel: 0,             // 0..1
    netFail: false,
    unknownActive: false,
    compared: false,
    solved: false,
    signal: { label: 'Wind', freq: 142.6, intensity: -61, floor: -78, conf: 0.88 },
    history: [],               // captured signal events
    selected: null,
    t0: performance.now(),
    screenMode: 1,             // 1=normal, 2=fullscreen calm, 3=creature appears, 4=golden corruption, 5=breakdown
    corruption: 0,             // 0..1 corruption intensity
    zoom: 1,
    panX: 0,
    panY: 0,
};

const AMBIENT = [
    { label: 'Wind',            freq: [80, 240],  conf: [0.82, 0.95] },
    { label: 'Marsh Wren',      freq: [1800, 4200], conf: [0.9, 0.98] },
    { label: 'Green Frog',      freq: [90, 260],  conf: [0.88, 0.97] },
    { label: 'Great Blue Heron',freq: [150, 480], conf: [0.85, 0.95] },
    { label: 'Rain',            freq: [400, 900], conf: [0.9, 0.99] },
    { label: 'Boat (outboard)', freq: [55, 130],  conf: [0.86, 0.96] },
    { label: 'Coyote (distant)',freq: [350, 700], conf: [0.8, 0.93] },
    { label: 'Red-winged Blackbird', freq: [2600, 4800], conf: [0.9, 0.98] },
];

const rnd = (a, b) => a + Math.random() * (b - a);
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
const pad = (n, w = 2) => String(Math.floor(n)).padStart(w, '0');

function now() { return new Date(); }
function stamp(d) {
    d = d || now();
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(), 3)}`;
}

/* =========================================================================
   EVENT LOG
   ========================================================================= */
const logEl = document.getElementById('event-log');
let logCount = 0;

function log(node, msg, cls) {
    const line = document.createElement('div');
    line.className = 'log-line' + (cls ? ' ' + cls : '');
    line.innerHTML = `<span class="lt">${stamp()}</span><span class="ln">${node || 'ARRAY'}</span><span class="lm">${msg}</span>`;
    logEl.appendChild(line);
    if (++logCount > 400) logEl.removeChild(logEl.firstChild);
    logEl.scrollTop = logEl.scrollHeight;
    if (window.anime && !state.lowPower) {
        anime({ targets: line, opacity: [0, 1], translateY: [3, 0], duration: 260, easing: 'easeOutQuad' });
    }
}

const IDLE_LOGS = [
    () => log(pick(NODES).id, `Packet received · seq ${Math.floor(rnd(100000, 999999))}`),
    () => log(pick(NODES).id, `GPS clock sync PASS · drift ${rnd(2, 28).toFixed(1)} µs`, 'system'),
    () => log(pick(NODES).id, `Ambient sample archived · ${rnd(14, 40).toFixed(1)} s window`),
    () => log('ARRAY', `Cross correlation complete · lag matrix nominal`),
    () => log(pick(NODES).id, `Battery telemetry · ${rnd(11.9, 13.4).toFixed(2)} V`),
    () => log(pick(NODES).id, `Classifier: ${pick(AMBIENT).label} · confidence ${Math.floor(rnd(82, 98))}%`),
    () => log('ARRAY', `Bearing updated · residual ${rnd(0.2, 2.4).toFixed(2)}°`),
    () => log(pick(NODES).id, `Noise floor ${(-rnd(74, 82)).toFixed(1)} dB re 20 µPa`),
    () => log('CAM 2', `Motion event · reviewed · raccoon`),
    () => log(pick(NODES).id, `Humidity compensation applied · sensor Δ ${rnd(0.1, 0.9).toFixed(2)}%`),
    () => log('ARRAY', `Wavefront solved · plane-wave fit OK`),
];

/* =========================================================================
   CLOCK & HEADER
   ========================================================================= */
const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
setInterval(() => {
    const d = now();
    document.getElementById('clock-time').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    document.getElementById('clock-date').textContent =
        `${DAYS[d.getDay()]} ${pad(d.getDate())} ${MONTHS[d.getMonth()]} — EDT · GPS`;
}, 250);

/* =========================================================================
   MAP: nodes, pulses, tooltips, bearings
   ========================================================================= */
const svgNS = 'http://www.w3.org/2000/svg';
const nodeLayer = document.getElementById('node-layer');
const bearingLayer = document.getElementById('bearing-lines');
const mapSvg = document.getElementById('marsh-map');
const tooltip = document.getElementById('map-tooltip');

// scatter reed hatching
(function reeds() {
    const g = document.getElementById('reeds');
    let d = '';
    for (let i = 0; i < 260; i++) {
        const x = rnd(180, 470), y = rnd(30, 620);
        const h = rnd(3, 8);
        d += `M ${x.toFixed(1)} ${y.toFixed(1)} l ${rnd(-1.5, 1.5).toFixed(1)} ${-h.toFixed(1)} `;
    }
    const p = document.createElementNS(svgNS, 'path');
    p.setAttribute('d', d);
    g.appendChild(p);
})();

const KIND_GLYPH = { microphone: 'M', geophone: 'G', hydrophone: 'H' };

NODES.forEach(n => {
    const g = document.createElementNS(svgNS, 'g');
    g.setAttribute('transform', `translate(${n.x} ${n.y})`);
    g.setAttribute('data-node', n.id);
    g.style.cursor = 'pointer';
    g.innerHTML = `
        <circle class="pulse" r="6" fill="none" stroke="#8fa671" stroke-width="1" opacity="0"/>
        <circle class="dot" r="4.2" fill="#141c10" stroke="#8fa671" stroke-width="1.4"/>
        <text y="2.8" text-anchor="middle" font-size="5" font-family="monospace" fill="#c9d6ad">${KIND_GLYPH[n.kind]}</text>
        <text x="8" y="-5" font-size="8.5" font-family="monospace" fill="#a4b088">${n.id.replace('NODE ', 'N')}</text>`;
    nodeLayer.appendChild(g);
    n.el = g;
    n.status = 'ONLINE';
    n.batt = rnd(0.55, 0.98);
    n.temp = rnd(21, 26);
    n.rh = rnd(60, 82);
    n.loss = rnd(0, 1.8);
    n.sync = rnd(4, 30);
    n.lastSeen = 0;

    g.addEventListener('mousemove', ev => {
        const r = document.getElementById('map-panel').getBoundingClientRect();
        tooltip.style.display = 'block';
        tooltip.style.left = (ev.clientX - r.left + 14) + 'px';
        tooltip.style.top = (ev.clientY - r.top + 6) + 'px';
        tooltip.innerHTML =
            `<div class="tt-head">${n.id} · ${n.kind.toUpperCase()}</div>` +
            `installed ${n.installed} · fw ${n.fw}<br>` +
            `batt ${(n.batt * 100).toFixed(0)}% · sync ±${n.sync.toFixed(0)} µs · loss ${n.loss.toFixed(1)}%<br>` +
            `<i style="color:#8d8266">“${n.note}”</i>`;
    });
    g.addEventListener('mouseleave', () => { tooltip.style.display = 'none'; });
});

function pulseNode(n, color) {
    if (state.lowPower || !window.anime) return;
    const c = n.el.querySelector('.pulse');
    c.setAttribute('stroke', color || '#8fa671');
    anime.remove(c);
    anime({ targets: c, r: [5, 16], opacity: [0.8, 0], duration: 1100, easing: 'easeOutCubic' });
}

setInterval(() => {
    if (state.netFail) return;
    const n = pick(NODES);
    if (n.status !== 'OFFLINE') pulseNode(n);
}, 1400);

/* Bearing lines. Each node gets a line; angle either random ambient or
   aimed at the house (with optional error). */
const bearings = NODES.map(n => {
    const ln = document.createElementNS(svgNS, 'line');
    ln.setAttribute('x1', n.x); ln.setAttribute('y1', n.y);
    ln.setAttribute('x2', n.x); ln.setAttribute('y2', n.y);
    ln.setAttribute('stroke', '#6d7a58');
    ln.setAttribute('stroke-width', '0.9');
    ln.setAttribute('stroke-dasharray', '4 3');
    ln.setAttribute('opacity', '0');
    bearingLayer.appendChild(ln);
    return { node: n, el: ln, angle: rnd(0, Math.PI * 2), len: 0 };
});

function setBearing(b, angle, len, opacity, color) {
    b.angle = angle; b.len = len;
    b.el.setAttribute('x2', b.node.x + Math.cos(angle) * len);
    b.el.setAttribute('y2', b.node.y + Math.sin(angle) * len);
    b.el.setAttribute('opacity', opacity);
    if (color) b.el.setAttribute('stroke', color);
}

function angleToHouse(n) { return Math.atan2(HOUSE.y - n.y, HOUSE.x - n.x); }

function showAmbientBearings() {
    bearings.forEach(b => {
        setBearing(b, rnd(0, Math.PI * 2), rnd(40, 90), 0.35, '#6d7a58');
    });
}

/* =========================================================================
   NODE HEALTH PANEL
   ========================================================================= */
const nodeList = document.getElementById('node-list');
function statusClass(s) {
    return { 'ONLINE': 'online', 'WEAK SIGNAL': 'weak', 'LOW BATTERY': 'lowbatt',
             'CALIBRATING': 'calibrating', 'OFFLINE': 'offline', 'RECONNECTED': 'reconnected' }[s] || 'online';
}
function renderNodes() {
    nodeList.innerHTML = NODES.map(n => `
        <div class="node-card">
            <div class="nc-head">
                <span class="nc-name">${n.id} <span style="color:#4d5c42">· ${n.kind}</span></span>
                <span class="nc-status ${statusClass(n.status)}">● ${n.status}</span>
            </div>
            <div class="nc-grid">
                <span><b>BATT</b>${(n.batt * 100).toFixed(0)}%</span>
                <span><b>SYNC</b>±${n.sync.toFixed(0)} µs</span>
                <span><b>LOSS</b>${n.loss.toFixed(1)}%</span>
                <span><b>TEMP</b>${n.temp.toFixed(1)}°C</span>
                <span><b>RH</b>${n.rh.toFixed(0)}%</span>
                <span><b>SEEN</b>${n.status === 'OFFLINE' ? '—' : n.lastSeen + 's'}</span>
            </div>
            <div class="batt-bar"><div class="batt-fill ${n.batt < 0.25 ? 'low' : ''}" style="width:${n.batt * 100}%"></div></div>
        </div>`).join('');
    // dim offline nodes on map
    NODES.forEach(n => {
        n.el.style.opacity = n.status === 'OFFLINE' ? 0.28 : 1;
        n.el.querySelector('.dot').setAttribute('stroke',
            n.status === 'OFFLINE' ? '#a0523f' :
            n.status === 'WEAK SIGNAL' || n.status === 'RECONNECTED' ? '#d9a441' : '#8fa671');
    });
    const online = NODES.filter(n => n.status !== 'OFFLINE').length;
    document.getElementById('hdr-array').textContent = `${online}/8 NODES`;
}

setInterval(() => {
    NODES.forEach(n => {
        n.temp += rnd(-0.08, 0.08);
        n.rh = Math.min(96, Math.max(40, n.rh + rnd(-0.4, 0.4)));
        n.batt = Math.max(0.03, n.batt - rnd(0, 0.0004));
        n.sync = Math.max(2, n.sync + rnd(-1.5, 1.5));
        n.loss = Math.max(0, n.loss + rnd(-0.2, 0.2) + state.stormLevel * rnd(0, 1.2));
        n.lastSeen = n.status === 'OFFLINE' ? n.lastSeen : Math.floor(rnd(0, 6));
        if (n.status === 'RECONNECTED' && Math.random() < 0.2) n.status = 'ONLINE';
        if (!state.netFail && n.status === 'ONLINE') {
            if (n.batt < 0.22) n.status = 'LOW BATTERY';
            else if (state.stormLevel > 0.5 && Math.random() < 0.25) n.status = 'WEAK SIGNAL';
        }
        if (n.status === 'WEAK SIGNAL' && state.stormLevel < 0.3 && Math.random() < 0.3) n.status = 'ONLINE';
    });
    renderNodes();
    // environment drift
    document.getElementById('env-temp').textContent = (24.1 + rnd(-0.3, 0.3)).toFixed(1) + ' °C';
    document.getElementById('env-rh').textContent = Math.floor(71 + state.stormLevel * 20 + rnd(-2, 2)) + '%';
    document.getElementById('env-wind').textContent = (2.4 + state.stormLevel * 9 + rnd(-0.4, 0.4)).toFixed(1) + ' m/s SSW';
    document.getElementById('env-water').textContent = (22.7 + rnd(-0.1, 0.1)).toFixed(1) + ' °C';
    document.getElementById('env-baro').textContent = (1013.8 - state.stormLevel * 14 + rnd(-0.3, 0.3)).toFixed(1) + ' hPa';
}, 2500);

/* =========================================================================
   WAVEFORM & SPECTROGRAM
   ========================================================================= */
const wf = document.getElementById('waveform');
const wfCtx = wf ? wf.getContext('2d') : null;
const sp = document.getElementById('spectrogram');
const spCtx = sp ? sp.getContext('2d') : null;

function sizeCanvas(c) {
    if (!c) return;
    const r = c.getBoundingClientRect();
    if (c.width !== Math.floor(r.width) || c.height !== Math.floor(r.height)) {
        c.width = Math.floor(r.width); c.height = Math.floor(r.height);
    }
}

function sizeAllCanvases() {
    sizeCanvas(wf);
    sizeCanvas(sp);
    sizeCanvas(document.getElementById('waveform-nb'));
    sizeCanvas(document.getElementById('waveform-bb'));
    sizeCanvas(document.getElementById('waveform-anomaly'));
}

window.addEventListener('resize', sizeAllCanvases);

let phase = 0;

function sampleSignal(t) {
    // composite of ambient marsh sound; scenario changes character
    let v = 0;
    v += Math.sin(t * 0.9 + Math.sin(t * 0.13) * 3) * 0.22;                  // wind sway
    v += Math.sin(t * 4.1) * 0.05 + Math.sin(t * 7.3 + 1.2) * 0.04;          // insects/frogs
    v += (Math.random() - 0.5) * (0.12 + state.stormLevel * 0.75);           // noise / storm
    if (state.unknownActive) {
        // the 41.8 Hz harmonic — slow, patterned, repeating
        const envelope = 0.5 + 0.5 * Math.sin(t * 0.35);
        v += Math.sin(t * 2.62) * 0.45 * envelope;
        v += Math.sin(t * 5.24) * 0.18 * envelope;   // first harmonic
    }
    if (state.netFail) v *= 0.12;
    return v;
}

let waveformGlows = { narrowband: 0, broadband: 0, anomaly: 0 };

// Initialize anime.js animations for waveform glows
if (window.anime) {
    anime.timeline({ loop: true })
        .add({
            targets: waveformGlows,
            narrowband: [0, 1],
            duration: 2000,
            easing: 'easeInOutSine'
        }, 0)
        .add({
            targets: waveformGlows,
            broadband: [0, 1],
            duration: 2400,
            easing: 'easeInOutSine'
        }, 0)
        .add({
            targets: waveformGlows,
            anomaly: [0, 1],
            duration: 1800,
            easing: 'easeInOutSine'
        }, 0);
}

function drawWaveformType(canvasId, type, phase) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height, mid = H / 2;

    ctx.fillStyle = '#0d120d';
    ctx.fillRect(0, 0, W, H);

    // instrument graticule — same moss green everywhere
    const glowIntensity = waveformGlows[type] || 0;
    ctx.strokeStyle = 'rgba(143, 166, 113, 0.10)';
    ctx.lineWidth = 0.5;
    for (let gx = 0; gx < W; gx += 50) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
    }
    for (let gy = 0; gy < H; gy += H / 4) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(143, 166, 113, 0.18)';
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(W, mid); ctx.stroke();

    // fixed channel colors (match .trace-key legend in the panel labels)
    const TRACE = {
        narrowband: '#5fb8a8',
        broadband:  '#b07f9e',
        anomaly:    state.unknownActive ? '#d9a441' : '#9a8fc0',
    };

    ctx.lineWidth = 1.2 + glowIntensity * 0.3;
    ctx.strokeStyle = TRACE[type] || '#8fa671';
    ctx.beginPath();

    for (let x = 0; x < W; x++) {
        let v = 0;
        const t = phase + x * 0.04;

        if (type === 'narrowband') {
            v = Math.sin(t * 2.62) * 0.6;
            v += Math.random() * 0.08;
        } else if (type === 'broadband') {
            v += Math.sin(t * 0.9) * 0.25;
            v += Math.sin(t * 4.1) * 0.1;
            v += Math.sin(t * 7.3) * 0.08;
            v += (Math.random() - 0.5) * 0.35;
        } else if (type === 'anomaly') {
            const envelope = 0.6 + 0.4 * Math.sin(t * 0.3);
            v = Math.sin(t * 2.62) * 0.5 * envelope;
            v += Math.sin(t * 5.24) * 0.15 * envelope;
            v += (Math.random() - 0.5) * 0.25;
            v += Math.sin(t * 1.4) * 0.1;
        }

        const y = mid - v * mid * 0.75;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // faint phosphor glow in the trace's own color
    if (glowIntensity > 0.2) {
        ctx.globalAlpha = glowIntensity * 0.18;
        ctx.lineWidth = 3 + glowIntensity * 1.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
}

function drawWaveform() {
    phase += 0.02;  // Very slow, deliberate waveform scroll

    // Draw three different signal types
    drawWaveformType('waveform-nb', 'narrowband', phase);
    drawWaveformType('waveform-bb', 'broadband', phase);
    drawWaveformType('waveform-anomaly', 'anomaly', phase);
}

function spectroColor(v) {
    // 0..1 → near-black green → moss → amber → cream
    if (v < 0.25) { const k = v / 0.25; return `rgb(${13 + 20 * k},${18 + 24 * k},${13 + 10 * k})`; }
    if (v < 0.55) { const k = (v - 0.25) / 0.3; return `rgb(${33 + 65 * k},${42 + 60 * k},${23 + 25 * k})`; }
    if (v < 0.8) { const k = (v - 0.55) / 0.25; return `rgb(${98 + 119 * k},${102 + 62 * k},${48 + 17 * k})`; }
    const k = (v - 0.8) / 0.2; return `rgb(${217 + 25 * k},${164 + 60 * k},${65 + 100 * k})`;
}

function drawSpectrogram() {
    sizeCanvas(sp);
    const W = sp.width, H = sp.height;
    // scroll left by 2px
    spCtx.drawImage(sp, -2, 0);
    const col = spCtx.createImageData ? null : null;
    for (let y = 0; y < H; y++) {
        const f = 1 - y / H;            // 0 bottom → 1 top of band (0–500 Hz)
        let e = 0.06 + Math.random() * 0.08;
        e += Math.exp(-Math.pow((f - 0.12), 2) / 0.004) * (0.25 + 0.1 * Math.sin(phase * 0.2)); // low rumble band
        e += Math.exp(-Math.pow((f - rnd(0.5, 0.54)), 2) / 0.0008) * 0.18;                       // bird chatter flecks
        e += state.stormLevel * (0.3 + Math.random() * 0.35);
        if (state.unknownActive) {
            const envelope = 0.55 + 0.45 * Math.sin(phase * 0.35);
            e += Math.exp(-Math.pow((f - 0.0836), 2) / 0.00012) * 1.1 * envelope; // 41.8 Hz line
            e += Math.exp(-Math.pow((f - 0.1672), 2) / 0.00012) * 0.6 * envelope; // 83.6 Hz harmonic
            e += Math.exp(-Math.pow((f - 0.2508), 2) / 0.00015) * 0.35 * envelope;
        }
        if (state.netFail) e *= 0.15;
        spCtx.fillStyle = spectroColor(Math.min(1, e));
        spCtx.fillRect(W - 2, y, 2, 1);
    }
}

let frame = 0;
function loop() {
    frame++;
    if (!state.lowPower || frame % 2 === 0) {
        sizeAllCanvases();
        drawWaveform();
        if (frame % 2 === 0) drawSpectrogram();
    }
    requestAnimationFrame(loop);
}

/* readout updates */
setInterval(() => {
    const s = state.signal;
    if (state.unknownActive) {
        s.label = pick(['Unknown Harmonic', 'Signal Under Review', 'Pattern Repeating', 'Unknown']);
        s.freq = 41.8 + rnd(-0.05, 0.05);
        s.intensity = -38 + rnd(-2, 2);
        s.conf = rnd(0.31, 0.52); // classifier can't place it
    } else if (state.stormLevel > 0.4) {
        s.label = 'Rain'; s.freq = rnd(380, 720); s.intensity = -44 + rnd(-3, 3); s.conf = rnd(0.9, 0.99);
    } else if (state.netFail) {
        s.label = '—'; s.conf = 0;
    } else {
        const a = pick(AMBIENT);
        s.label = a.label; s.freq = rnd(a.freq[0], a.freq[1]);
        s.intensity = -rnd(52, 68); s.conf = rnd(a.conf[0], a.conf[1]);
    }
    s.floor = -(76 + rnd(0, 6) - state.stormLevel * 18);
    document.getElementById('ro-class').textContent = s.label;
    document.getElementById('ro-class').className = 'rc-value' + (state.unknownActive ? ' warn' : '');
    document.getElementById('ro-freq').textContent = s.freq.toFixed(1) + ' Hz';
    document.getElementById('ro-int').textContent = s.intensity.toFixed(1) + ' dB';
    document.getElementById('ro-floor').textContent = s.floor.toFixed(1) + ' dB';
    document.getElementById('ro-conf').textContent = state.netFail ? '—' : Math.floor(s.conf * 100) + '%';
}, 3000);

/* =========================================================================
   SIGNAL HISTORY + INSPECTOR (the timestamp reveal)
   ========================================================================= */
const histStrip = document.getElementById('history-strip');

function captureEvent(anomalous) {
    const n = pick(NODES.filter(x => x.status !== 'OFFLINE'));
    if (!n) return;
    const distUnits = Math.hypot(HOUSE.x - n.x, HOUSE.y - n.y);
    const distM = distUnits * MAP_M_PER_UNIT;
    const expectedMs = distM / SOUND_MS;              // ms for sound to travel
    const ev = {
        id: 'EVT-' + String(1000 + state.history.length),
        node: n,
        time: now(),
        anomalous: !!anomalous,
        freq: anomalous ? 41.8 + rnd(-0.04, 0.04) : rnd(90, 460),
        label: anomalous ? 'Unknown Harmonic' : pick(AMBIENT).label,
        distM,
        expectedMs,
        observedMs: anomalous ? rnd(30, 90) : expectedMs + rnd(-8, 8),
    };
    state.history.push(ev);
    if (state.history.length > 14) {
        state.history.shift();
        histStrip.removeChild(histStrip.firstChild);
    }
    const chip = document.createElement('div');
    chip.className = 'hist-chip' + (ev.anomalous ? ' anomaly' : '');
    chip.innerHTML = `<span class="hc-label">${ev.label}</span><br>${stamp(ev.time)}<br>${ev.node.id} · ${ev.freq.toFixed(1)} Hz`;
    chip.addEventListener('click', () => openInspector(ev, chip));
    histStrip.appendChild(chip);
    histStrip.scrollLeft = histStrip.scrollWidth;
    ev.chip = chip;
    pulseNode(n, ev.anomalous ? '#d9a441' : '#8fa671');
    return ev;
}

function openInspector(ev, chip) {
    document.querySelectorAll('.hist-chip.selected').forEach(c => c.classList.remove('selected'));
    if (chip) chip.classList.add('selected');
    state.selected = ev;
    const insp = document.getElementById('inspector');
    const body = document.getElementById('inspector-body');
    const diffMs = ev.observedMs - ev.expectedMs;
    const bad = ev.anomalous;
    body.innerHTML = `
        <div class="insp-row"><span class="k">EVENT</span><span class="v">${ev.id}</span></div>
        <div class="insp-row"><span class="k">NODE</span><span class="v">${ev.node.id} · ${ev.node.kind}</span></div>
        <div class="insp-row"><span class="k">TIMESTAMP</span><span class="v amber">${stamp(ev.time)}</span></div>
        <div class="insp-row divider"><span class="k">DOMINANT FREQUENCY</span><span class="v">${ev.freq.toFixed(2)} Hz</span></div>
        <div class="insp-row"><span class="k">RANGE TO REFERENCE PT.</span><span class="v">${ev.distM.toFixed(0)} m</span></div>
        <div class="insp-row"><span class="k">PREDICTED ARRIVAL DELAY</span><span class="v">${(ev.expectedMs / 1000).toFixed(2)} sec</span></div>
        <div class="insp-row"><span class="k">OBSERVED ARRIVAL DELAY</span><span class="v ${bad ? 'bad' : ''}">${(ev.observedMs / 1000).toFixed(2)} sec</span></div>
        <div class="insp-row"><span class="k">DIFFERENCE</span><span class="v ${bad ? 'bad' : ''}">${diffMs >= 0 ? '+' : '−'}${Math.abs(diffMs).toFixed(0)} ms</span></div>
        <div class="insp-row"><span class="k">PROPAGATION ERROR</span><span class="v ${bad ? 'bad' : ''}">${bad ? Math.abs(diffMs).toFixed(0) + ' milliseconds' : 'within tolerance'}</span></div>
        <div id="insp-status"></div>`;
    insp.style.display = 'block';
    if (window.anime && !state.lowPower)
        anime({ targets: insp, opacity: [0, 1], translateX: ['-50%', '-50%'], translateY: [-8, 0], duration: 300, easing: 'easeOutQuad' });

    const status = document.getElementById('insp-status');
    if (bad) {
        status.innerHTML = 'Propagation error exceeds model tolerance.<br>Rechecking GPS clocks…';
        log(ev.node.id, `Propagation error ${Math.abs(diffMs).toFixed(0)} ms — rechecking GPS clocks…`, 'alert');
        setTimeout(() => {
            NODES.forEach(n => log(n.id, `GPS clock sync PASS · drift ${rnd(3, 22).toFixed(1)} µs`, 'system'));
            status.innerHTML += '<br><span class="pass">Clock Sync PASS — all 8 nodes.</span><br><span class="fail">Clocks are correct. Error is physical.</span>';
        }, 1800);
    } else {
        status.innerHTML = '<span class="pass">Arrival consistent with acoustic propagation model. No action.</span>';
    }
}

MFN.closeInspector = function () {
    document.getElementById('inspector').style.display = 'none';
    document.querySelectorAll('.hist-chip.selected').forEach(c => c.classList.remove('selected'));
};

/* =========================================================================
   CINEMATIC SCREENS (keyboard 1–5) — Viewport System
   ========================================================================= */
let corruptionTimer = null;
const screenMaps = {};

function initializeScreen(screenNum) {
    const screenId = `screen${screenNum}`;
    const mapId = `marsh-map-${screenNum}`;
    const svg = document.getElementById(mapId);

    if (!svg || svg.innerHTML) return; // Already initialized

    // Clone the original map SVG content
    svg.innerHTML = mapSvg.innerHTML;
    screenMaps[screenNum] = svg;

    // Only enable zoom/pan for fullscreen map screens (2, 3)
    if (screenNum === 2 || screenNum === 3) {
        enableZoomPan(svg);

        // Initialize noise canvas
        const noiseCanvas = document.getElementById(`map-noise-${screenNum}`);
        if (noiseCanvas) {
            const rect = svg.getBoundingClientRect();
            noiseCanvas.width = rect.width;
            noiseCanvas.height = rect.height;
        }
    }
}

function enableZoomPan(svg) {
    let isPanning = false;
    let startX, startY;
    let zoom = 1, panX = 0, panY = 0;

    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        zoom = Math.max(1, Math.min(8, zoom * zoomFactor));
        applyTransform();
    });

    svg.addEventListener('mousedown', (e) => {
        if (e.button === 0 && zoom > 1) {
            isPanning = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
        }
    });

    svg.addEventListener('mousemove', (e) => {
        if (isPanning) {
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            applyTransform();
        }
    });

    svg.addEventListener('mouseup', () => { isPanning = false; });
    svg.addEventListener('mouseleave', () => { isPanning = false; });

    function applyTransform() {
        const w = svg.clientWidth, h = svg.clientHeight;
        svg.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
        svg.style.transformOrigin = '0 0';
    }
}

function updateMapColors(svg, color) {
    const nodes = svg.querySelectorAll('[data-node] .dot');
    nodes.forEach(dot => {
        dot.setAttribute('stroke', color);
    });
}

function corruptMap(svg, intensity) {
    const nodes = svg.querySelectorAll('[data-node] .dot');
    const pulses = svg.querySelectorAll('[data-node] .pulse');
    const bg = svg.querySelector('rect:first-of-type');

    // Much subtler corruption effect
    if (bg) {
        const r = Math.floor(19 + intensity * 40);
        const g = Math.floor(26 + intensity * 30);
        const b = Math.floor(16 + intensity * 20);
        bg.setAttribute('fill', `rgb(${r}, ${g}, ${b})`);
    }

    nodes.forEach((dot, i) => {
        // Smaller radius variation
        const r = 4.2 + Math.random() * intensity * 1;
        dot.setAttribute('r', r);
        const golden = Math.floor(217 + intensity * 15);
        const greenish = Math.floor(164 + intensity * 25);
        const warm = Math.floor(65 + intensity * 30);
        dot.setAttribute('stroke', `rgb(${golden}, ${greenish}, ${warm})`);
    });

    if (intensity > 0.2) {
        pulses.forEach(pulse => {
            pulse.setAttribute('opacity', Math.min(0.6, intensity * 0.8));
            pulse.setAttribute('stroke', `rgb(${217 + intensity * 15}, ${164 + intensity * 25}, ${65 + intensity * 30})`);
        });
    }
}

function oscillateMap(svg, intensity) {
    const nodes = svg.querySelectorAll('[data-node]');
    nodes.forEach((g, i) => {
        // Much subtler oscillation — reduced amplitude
        const shake = intensity * Math.sin(performance.now() * 0.005 + i) * 1.5;
        const shakeY = intensity * Math.cos(performance.now() * 0.007 + i) * 1.5;
        const nodeData = NODES[i];
        g.setAttribute('transform', `translate(${nodeData.x + shake} ${nodeData.y + shakeY})`);
    });
}

function heatmapColor(intensity) {
    // same instrument ramp as the screen-1 spectrogram:
    // near-black green → moss → amber → cream
    return spectroColor(Math.max(0, Math.min(1, intensity)));
}

function drawWaterfall(canvasId, audioPhase, intensity, isAlarm) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    // Scroll existing content up faster (more active)
    ctx.drawImage(canvas, 0, 6, w, h - 6, 0, 0, w, h - 6);

    // Draw new bottom line (most recent) — 6 pixels per frame for faster scroll
    const bands = 500;
    const pixelsPerHz = w / bands;

    for (let i = 0; i < bands; i++) {
        const freq = i; // Hz
        let amp = 0;

        // 41.8 Hz peak — stronger
        const peak41 = Math.exp(-Math.pow(freq - 41.8, 2) / 18) * (0.7 + intensity * 0.5);
        amp += peak41;

        // Harmonics (if alarm mode) — much more active
        if (isAlarm) {
            for (let h = 2; h <= 8; h++) {
                const harmFreq = 41.8 * h;
                if (harmFreq < bands) {
                    const harmamp = Math.exp(-Math.pow(freq - harmFreq, 2) / (16 + h * 3)) * (0.4 / h);
                    amp += harmamp;

                    // Add dynamic jitter to harmonics
                    amp += Math.sin(audioPhase * (0.3 + h * 0.08) + i * 0.04) * 0.1 * intensity;
                }
            }
        }

        // WHITE NOISE — aggressive (simulating capturing everything)
        const whiteNoise = Math.random() * (0.15 + intensity * 0.2);
        amp += whiteNoise;

        // Random interference bursts
        if (Math.random() < 0.015 * intensity) {
            amp += Math.random() * 0.25;
        }

        amp = Math.max(0, Math.min(1, amp));

        const color = heatmapColor(amp);
        ctx.fillStyle = color;
        ctx.fillRect(i * pixelsPerHz, h - 6, pixelsPerHz, 6);
    }

    // Add subtle vertical scan line effect
    if (Math.random() > 0.85) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(Math.random() * w, h - 8, 1, 8);
    }
}

function drawSpectrum(canvasId, audioPhase, intensity, isAlarm) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.fillStyle = 'rgba(13, 18, 13, 0.5)';
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(143, 166, 113, 0.08)';
    ctx.lineWidth = 1;
    for (let f = 0; f <= 500; f += 50) {
        const x = (f / 500) * w;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
    }

    const bands = 512;
    const barWidth = w / bands;

    // Draw spectrum bars with MUCH more activity
    for (let i = 0; i < bands; i++) {
        const freq = (i / bands) * 500; // 0-500 Hz
        let amp = 0;

        // 41.8 Hz fundamental — stronger and more active
        const gaussian41 = Math.exp(-Math.pow(freq - 41.8, 2) / 16);
        amp += gaussian41 * (0.8 + intensity * 0.4);

        // Harmonics (if alarm) — more pronounced
        if (isAlarm) {
            for (let h = 2; h <= 8; h++) {
                const harmFreq = 41.8 * h;
                if (harmFreq < 500) {
                    const harmGaussian = Math.exp(-Math.pow(freq - harmFreq, 2) / (14 + h * 2));
                    // Higher amplitude harmonics
                    amp += harmGaussian * (0.5 / h) * intensity;

                    // Add some shimmer/jitter to harmonics
                    amp += Math.sin(audioPhase * (0.5 + h * 0.1) + i * 0.05) * 0.08 * intensity;
                }
            }
        }

        // WHITE NOISE — much more aggressive
        const whiteNoise = Math.random() * (0.12 + intensity * 0.18);
        amp += whiteNoise;

        // Occasional activity spikes (interference artifacts)
        if (Math.random() < 0.02 * intensity) {
            amp += Math.random() * 0.3;
        }

        amp = Math.max(0, Math.min(1, amp));

        const height = amp * h * 0.85;
        // lift bars off the black end of the ramp so the noise floor stays readable
        const color = heatmapColor(0.28 + amp * 0.72);

        ctx.fillStyle = color;
        ctx.fillRect(i * barWidth, h - height, barWidth - 0.5, height);

        // Add some visible grain/noise texture on top
        if (Math.random() > 0.92) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.fillRect(i * barWidth, 0, barWidth, h);
        }
    }

    // Peak frequency marker for fundamental
    const peakX = (41.8 / 500) * w;
    ctx.strokeStyle = 'rgba(143, 166, 113, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(peakX, 0);
    ctx.lineTo(peakX, h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Add horizontal scan lines for texture (very subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.01)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}

function drawMapNoise(canvasId, intensity) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * (30 + intensity * 40);
        data[i] = noise;       // R
        data[i + 1] = noise;   // G
        data[i + 2] = noise;   // B
        data[i + 3] = Math.max(8, 15 * intensity); // A - very subtle
    }

    ctx.putImageData(imageData, 0, 0);
}

function drawNodeTacticalDisplay(nodeIdx, phase) {
    const canvas = document.getElementById(`node-display-${nodeIdx}`);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const mid = h / 2;

    // Clear
    ctx.fillStyle = '#0d120d';
    ctx.fillRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(143, 166, 113, 0.10)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
        const y = (i / 4) * h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }

    // Waveform - tactical style
    ctx.strokeStyle = '#8fa671';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; x < w; x++) {
        const t = phase + x * 0.05 + nodeIdx;
        const v1 = Math.sin(t * 2.62) * 0.3;  // 41.8 Hz harmonic
        const v2 = Math.sin(t * 0.9) * 0.15;  // ambient
        const v3 = Math.random() * 0.08;      // noise

        const y = mid - (v1 + v2 + v3) * mid * 0.7;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Center line
    ctx.strokeStyle = 'rgba(143, 166, 113, 0.18)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    ctx.stroke();

    // Peak indicators
    ctx.fillStyle = 'rgba(217, 164, 65, 0.35)';
    const peakX = (w / 2);
    ctx.fillRect(peakX - 2, mid - 12, 4, 24);
}

function updateNodeTacticalData(nodeIdx) {
    const n = NODES[nodeIdx];
    const sigEl = document.getElementById(`sig-${nodeIdx}`);
    const freqEl = document.getElementById(`freq-${nodeIdx}`);

    if (sigEl) sigEl.textContent = `${(-60 + Math.random() * 20).toFixed(1)} dB`;
    if (freqEl) freqEl.textContent = `${(41.8 + Math.random() * 0.1).toFixed(1)} Hz`;
}

function drawTacticalScanlines() {
    const canvas = document.getElementById('tactical-scanlines');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;

    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, w, h);

    // Scanlines
    ctx.strokeStyle = 'rgba(143, 166, 113, 0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < h; y += 2) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
}

/* ---- tactical map overlay (screens 2 & 3) --------------------------------
   Drawn INSIDE the cloned map svg so it pans/zooms with the map.
   Static layer: WGS-84 graticule, node coordinates, baselines with ranges,
   overlapping detection rings. Dynamic layer: propagation sweeps and, on
   screen 3, triangulation bearings converging on the source.              */

function mapLatLon(x, y) {
    const lat = 41.2662 - (y / 640) * 0.0090;
    const lon = -72.8235 + (x / 600) * 0.0119;
    return { lat, lon, s: `${lat.toFixed(4)}°N ${Math.abs(lon).toFixed(4)}°W` };
}

function ensureTacticalOverlay(svg, screenNum) {
    if (!svg || svg.querySelector('.ovl-static')) return;
    let h = '';

    // graticule — minor every 50 u, labeled major every 100 u
    for (let gx = 0; gx <= 600; gx += 50) {
        const major = gx % 100 === 0;
        h += `<line x1="${gx}" y1="0" x2="${gx}" y2="640" stroke="#8fa671" stroke-opacity="${major ? 0.10 : 0.05}" stroke-width="0.5"/>`;
        if (major && gx > 0 && gx < 600) {
            const lon = Math.abs(-72.8235 + (gx / 600) * 0.0119).toFixed(4);
            h += `<text x="${gx + 2}" y="9" font-size="5.5" font-family="monospace" fill="#6d7a58" fill-opacity="0.8">${lon}°W</text>`;
        }
    }
    for (let gy = 0; gy <= 640; gy += 50) {
        const major = gy % 100 === 0;
        h += `<line x1="0" y1="${gy}" x2="600" y2="${gy}" stroke="#8fa671" stroke-opacity="${major ? 0.10 : 0.05}" stroke-width="0.5"/>`;
        if (major && gy > 0 && gy < 640) {
            const lat = (41.2662 - (gy / 640) * 0.0090).toFixed(4);
            h += `<text x="2" y="${gy - 2}" font-size="5.5" font-family="monospace" fill="#6d7a58" fill-opacity="0.8">${lat}°N</text>`;
        }
    }
    h += `<text x="598" y="636" text-anchor="end" font-size="6" font-family="monospace" fill="#6d7a58">DATUM WGS-84 · GRID 83 m · TDOA BASELINES ACTIVE</text>`;

    // inter-node baselines with range labels
    for (let i = 0; i < NODES.length; i++) {
        for (let j = i + 1; j < NODES.length; j++) {
            const a = NODES[i], b = NODES[j];
            const d = Math.hypot(b.x - a.x, b.y - a.y);
            if (d < 190) {
                const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
                h += `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#8fa671" stroke-opacity="0.22" stroke-width="0.6" stroke-dasharray="2 3"/>`;
                h += `<text x="${mx + 3}" y="${my - 2}" font-size="5.5" font-family="monospace" fill="#8fa671" fill-opacity="0.55">${(d * MAP_M_PER_UNIT).toFixed(0)} m</text>`;
            }
        }
    }

    // detection-range rings — overlapping coverage (the venn effect)
    NODES.forEach(n => {
        h += `<circle cx="${n.x}" cy="${n.y}" r="52" fill="#8fa671" fill-opacity="0.020" stroke="#8fa671" stroke-opacity="0.14" stroke-width="0.6"/>`;
        h += `<circle cx="${n.x}" cy="${n.y}" r="86" fill="none" stroke="#8fa671" stroke-opacity="0.07" stroke-width="0.5" stroke-dasharray="1 3"/>`;
        const c = mapLatLon(n.x, n.y);
        h += `<text x="${n.x + 8}" y="${n.y + 10}" font-size="5" font-family="monospace" fill="#6d7a58" fill-opacity="0.9">${c.s}</text>`;
    });

    const gs = document.createElementNS(svgNS, 'g');
    gs.setAttribute('class', 'ovl-static');
    gs.innerHTML = h;
    svg.appendChild(gs);

    const gd = document.createElementNS(svgNS, 'g');
    gd.setAttribute('class', 'ovl-dyn');
    svg.appendChild(gd);
}

function updateTacticalOverlay(svg, screenNum, phase, intensity) {
    const dyn = svg && svg.querySelector('.ovl-dyn');
    if (!dyn) return;
    let h = '';

    // propagation sweeps — expanding rings staggered across the array
    NODES.forEach((n, i) => {
        const k = (phase * 0.25 + i / NODES.length) % 1;
        const r = 8 + k * 80;
        const op = (1 - k) * (0.20 + intensity * 0.25);
        h += `<circle cx="${n.x}" cy="${n.y}" r="${r.toFixed(1)}" fill="none" stroke="#8fa671" stroke-opacity="${op.toFixed(3)}" stroke-width="0.8"/>`;
    });

    if (screenNum === 3) {
        // prediction: amber bearings from every node converging on a mark
        // deep in the marsh body
        const M = MARSH_MARK;
        const dash = ((phase * 20) % 8).toFixed(1);
        NODES.forEach(n => {
            const brg = (Math.atan2(M.x - n.x, -(M.y - n.y)) * 180 / Math.PI + 360) % 360;
            const mx = n.x + (M.x - n.x) * 0.55, my = n.y + (M.y - n.y) * 0.55;
            h += `<line x1="${n.x}" y1="${n.y}" x2="${M.x}" y2="${M.y}" stroke="#d9a441" stroke-opacity="${(0.25 + intensity * 0.5).toFixed(2)}" stroke-width="0.8" stroke-dasharray="5 3" stroke-dashoffset="-${dash}"/>`;
            h += `<text x="${mx + 3}" y="${my - 3}" font-size="5.5" font-family="monospace" fill="#d9a441" fill-opacity="0.75">BRG ${brg.toFixed(1)}°</text>`;
        });
        // predicted-position mark: pulsing rings + crosshair, flagged PREDICTED
        const c = mapLatLon(M.x, M.y);
        const pr = 14 + Math.sin(phase * 3) * 3;
        h += `<circle cx="${M.x}" cy="${M.y}" r="${pr.toFixed(1)}" fill="none" stroke="#d9a441" stroke-opacity="0.85" stroke-width="1"/>`;
        h += `<circle cx="${M.x}" cy="${M.y}" r="30" fill="none" stroke="#d9a441" stroke-opacity="0.35" stroke-width="0.6" stroke-dasharray="2 3"/>`;
        h += `<line x1="${M.x - 24}" y1="${M.y}" x2="${M.x + 24}" y2="${M.y}" stroke="#d9a441" stroke-opacity="0.6" stroke-width="0.6"/>`;
        h += `<line x1="${M.x}" y1="${M.y - 24}" x2="${M.x}" y2="${M.y + 24}" stroke="#d9a441" stroke-opacity="0.6" stroke-width="0.6"/>`;
        h += `<text x="${M.x}" y="${M.y - 34}" text-anchor="middle" font-size="7" font-family="monospace" fill="#d9a441" letter-spacing="2">PREDICTED</text>`;
        const bx = M.x - 170, by = M.y - 92;
        h += `<line x1="${M.x - 16}" y1="${M.y - 16}" x2="${bx + 126}" y2="${by + 34}" stroke="#8a6a2f" stroke-width="0.6"/>`;
        h += `<g font-family="monospace" font-size="6" fill="#d9a441">
                <rect x="${bx}" y="${by}" width="126" height="38" fill="#0d120d" fill-opacity="0.85" stroke="#8a6a2f" stroke-width="0.6"/>
                <text x="${bx + 5}" y="${by + 9}">PREDICTED FIX ${c.s}</text>
                <text x="${bx + 5}" y="${by + 17}" fill="#e8dfc8" fill-opacity="0.8">BEARING INTERSECT · 8/8 NODES</text>
                <text x="${bx + 5}" y="${by + 25}" fill="#e8dfc8" fill-opacity="0.6">EST. ERROR ELLIPSE 4.6 × 2.1 m</text>
                <text x="${bx + 5}" y="${by + 33}" fill="#e8dfc8" fill-opacity="0.6">41.8 Hz · CONF ${(88 + intensity * 10).toFixed(1)}% · TRACKING</text>
              </g>`;
    }

    dyn.innerHTML = h;
}

function showScreen(screenNum) {
    // Hide all screens
    document.querySelectorAll('.viewport').forEach(v => v.classList.remove('active'));

    // Clear any running corruption
    if (corruptionTimer) clearInterval(corruptionTimer);
    state.corruption = 0;

    // Initialize and show target screen
    const screen = document.getElementById(`screen${screenNum}`);
    screen.classList.add('active');
    state.screenMode = screenNum;

    if (screenNum === 1) {
        // Normal view - no special effects
        return;
    }

    if (screenNum === 2) {
        // Calm fullscreen - lighter green, with subtle noise and connections
        initializeScreen(screenNum);
        const svg = screenMaps[screenNum];
        updateMapColors(svg, '#a4c684');
        ensureTacticalOverlay(svg, 2);

        let noisePhase = 0;
        corruptionTimer = setInterval(() => {
            noisePhase += 0.1;
            drawMapNoise('map-noise-2', 0.3);
            updateTacticalOverlay(svg, 2, noisePhase, 0.4);
        }, 100);
    } else if (screenNum === 3) {
        // Creature appears - subtle golden corruption + node interactions
        initializeScreen(screenNum);
        const svg = screenMaps[screenNum];
        ensureTacticalOverlay(svg, 3);
        state.corruption = 0;
        let interactionIntensity = 0;
        let ovlPhase = 0;

        corruptionTimer = setInterval(() => {
            state.corruption = Math.min(0.4, state.corruption + 0.04);
            interactionIntensity = Math.sin(performance.now() * 0.003) * 0.5 + 0.5;
            ovlPhase += 0.08;

            corruptMap(svg, state.corruption);
            oscillateMap(svg, state.corruption * 0.15);
            drawMapNoise('map-noise-3', state.corruption * 0.5);
            updateTacticalOverlay(svg, 3, ovlPhase, state.corruption * 0.8 + interactionIntensity * 0.3);
        }, 80);
    } else if (screenNum === 4) {
        // Professional SETI screen - The Hum Detected
        let audioPhase = 0;
        corruptionTimer = setInterval(() => {
            audioPhase += 0.15;
            drawWaterfall('waterfall-4', audioPhase, 0.5, false);
            drawSpectrum('spectrum-4', audioPhase, 0.5, false);
        }, 80);
    } else if (screenNum === 5) {
        // Professional SETI screen - The Hum Intensifies with Harmonics & WHITE NOISE
        let audioPhase = 0;
        corruptionTimer = setInterval(() => {
            audioPhase += 0.35;
            drawWaterfall('waterfall-5', audioPhase, 0.9, true);
            drawSpectrum('spectrum-5', audioPhase, 0.9, true);
        }, 50);
    } else if (screenNum === 7) {
        // Dedicated wideband spectrum monitor — reflects current array state:
        // calm noise floor normally, harmonic stack when the signal is active
        const wcan = document.getElementById('waterfall-7');
        const scan = document.getElementById('spectrum-7');
        setTimeout(() => { sizeCanvas(wcan); sizeCanvas(scan); }, 650); // after slide transition
        let audioPhase = 0;
        corruptionTimer = setInterval(() => {
            audioPhase += 0.2;
            const alarm = state.unknownActive;
            drawWaterfall('waterfall-7', audioPhase, alarm ? 0.9 : 0.5, alarm);
            drawSpectrum('spectrum-7', audioPhase, alarm ? 0.9 : 0.5, alarm);
        }, 60);
    } else if (screenNum === 6) {
        // Tactical array matrix - Independence Day style
        let tacticalPhase = 0;
        corruptionTimer = setInterval(() => {
            tacticalPhase += 0.15;

            // Update each node display
            for (let i = 0; i < 8; i++) {
                drawNodeTacticalDisplay(i, tacticalPhase);
                updateNodeTacticalData(i);
            }

            // Draw scanlines
            drawTacticalScanlines();
        }, 80);
    }
}

/* =========================================================================
   SCENARIOS (keyboard 0–9)
   ========================================================================= */
let activityTimer = null;

function setMode(num, name) {
    state.mode = num;
    state.modeName = name;
    document.getElementById('mode-name').textContent = name;
}

function clearScenario() {
    state.unknownActive = false;
    state.stormLevel = 0;
    state.netFail = false;
    if (activityTimer) { clearInterval(activityTimer); activityTimer = null; }
    document.getElementById('solver-overlay').style.display = 'none';
    document.getElementById('source-estimate').style.display = 'none';
    document.getElementById('house-halo').setAttribute('opacity', 0);
    MFN.closeInspector();
    bearings.forEach(b => setBearing(b, b.angle, 0, 0));
}

const SCENARIOS = {

    // 1 — idle
    1() {
        clearScenario();
        setMode(1, 'PASSIVE MONITORING');
        log('ARRAY', 'Passive monitoring resumed · all classifiers nominal', 'system');
    },

    // 2 — more node activity
    2() {
        clearScenario();
        setMode(2, 'ELEVATED ACTIVITY');
        log('ARRAY', 'Elevated biological activity across array', 'notable');
        showAmbientBearings();
        activityTimer = setInterval(() => {
            captureEvent(false);
            const n = pick(NODES);
            log(n.id, `Classifier: ${pick(AMBIENT).label} · confidence ${Math.floor(rnd(84, 98))}%`, 'notable');
        }, 2200);
    },

    // 3 — unknown signal detected
    3() {
        clearScenario();
        setMode(3, 'UNKNOWN SIGNAL');
        state.unknownActive = true;
        log('NODE 03', 'Low Frequency Event · 41.8 Hz', 'anomaly');
        setTimeout(() => log('ARRAY', 'Cross Correlation Complete', 'anomaly'), 400);
        setTimeout(() => log('ARRAY', 'Bearing Updated', 'anomaly'), 800);
        setTimeout(() => log('NODE 03', 'Signal Confidence 91%', 'anomaly'), 1200);
        setTimeout(() => log('NODE 03', 'GPS Clock Sync PASS', 'system'), 1600);
        setTimeout(() => log('ARRAY', 'Classifier result: UNKNOWN HARMONIC — pattern repeating', 'alert'), 2400);
        activityTimer = setInterval(() => {
            const ev = captureEvent(true);
            if (ev) log(ev.node.id, `Low Frequency Event · ${ev.freq.toFixed(1)} Hz · pattern repeating`, 'anomaly');
        }, 4200);
        captureEvent(true);
    },

    // 4 — network failure
    4() {
        clearScenario();
        setMode(4, 'NETWORK FAILURE');
        state.netFail = true;
        const order = [...NODES].sort(() => Math.random() - 0.5);
        order.forEach((n, i) => {
            setTimeout(() => {
                n.status = 'OFFLINE';
                log(n.id, 'Link lost · no carrier', 'alert');
                renderNodes();
            }, i * 500);
        });
        setTimeout(() => {
            log('ARRAY', 'ARRAY DEGRADED — localization unavailable', 'alert');
            document.getElementById('hdr-sync').textContent = 'HOLDOVER';
            document.getElementById('sync-led').className = 'led red';
        }, order.length * 500 + 400);
    },

    // 5 — network restored
    5() {
        state.netFail = false;
        setMode(5, 'RESTORING NETWORK');
        const offline = NODES.filter(n => n.status === 'OFFLINE');
        (offline.length ? offline : NODES).forEach((n, i) => {
            setTimeout(() => {
                n.status = 'RECONNECTED';
                n.sync = rnd(40, 120);
                log(n.id, 'RECONNECTED · resynchronizing clock…', 'notable');
                renderNodes();
                pulseNode(n, '#d9a441');
                setTimeout(() => { n.status = 'CALIBRATING'; renderNodes(); }, 2500);
                setTimeout(() => {
                    n.status = 'ONLINE'; n.sync = rnd(4, 24);
                    log(n.id, `GPS Clock Sync PASS · drift ${n.sync.toFixed(1)} µs`, 'system');
                    renderNodes();
                }, 5000 + i * 300);
            }, i * 700);
        });
        setTimeout(() => {
            document.getElementById('hdr-sync').textContent = 'LOCKED ±14 µs';
            document.getElementById('sync-led').className = 'led';
            log('ARRAY', 'Array restored · passive monitoring resumed', 'system');
            setMode(1, 'PASSIVE MONITORING');
        }, 9000);
    },

    // 6 — compare timestamps
    6() {
        setMode(6, 'COMPARE SIGNALS');
        state.compared = true;
        if (!state.unknownActive) state.unknownActive = true;
        log('ARRAY', 'COMPARE SIGNALS — overlaying arrivals from 8 nodes', 'notable');
        // one anomalous capture per node, arriving nearly simultaneously
        const t = now();
        NODES.forEach((n, i) => {
            setTimeout(() => {
                const distM = Math.hypot(HOUSE.x - n.x, HOUSE.y - n.y) * MAP_M_PER_UNIT;
                const expected = distM / SOUND_MS;
                const observed = rnd(38, 74); // near-simultaneous everywhere
                log(n.id, `Arrival ${stamp(new Date(t.getTime() + observed))} · predicted +${(expected / 1000).toFixed(2)} s · observed +${(observed / 1000).toFixed(2)} s`, 'anomaly');
            }, i * 600);
        });
        setTimeout(() => {
            log('ARRAY', 'Expected spread 2.84 sec · observed spread 0.06 sec', 'alert');
            log('ARRAY', 'Propagation error 2780 milliseconds', 'alert');
            log('ARRAY', 'Rechecking GPS clocks…', 'notable');
        }, NODES.length * 600 + 600);
        setTimeout(() => {
            NODES.forEach(n => log(n.id, `GPS Clock Sync PASS · drift ${rnd(3, 20).toFixed(1)} µs`, 'system'));
            log('ARRAY', 'All clocks verified correct. Arrival model violated.', 'alert');
            const ev = captureEvent(true);
            if (ev) openInspector(ev, ev.chip);
        }, NODES.length * 600 + 3200);
    },

    // 7 — run triangulation (the big moment)
    7() {
        setMode(7, 'SOURCE SOLVER');
        if (!state.unknownActive) state.unknownActive = true;
        MFN.closeInspector();
        const overlay = document.getElementById('solver-overlay');
        const step = document.getElementById('solver-step');
        const fill = document.getElementById('solver-fill');
        overlay.style.display = 'flex';
        fill.style.width = '0%';

        const steps = ['Calculating…', 'Estimating time differences of arrival…', 'Triangulating…', 'Searching solution space…'];
        steps.forEach((s, i) => setTimeout(() => {
            step.textContent = s;
            log('SOLVER', s, 'notable');
            if (window.anime) anime({ targets: fill, width: ((i + 1) / (steps.length + 1) * 100) + '%', duration: 900, easing: 'easeInOutQuad' });
        }, i * 1600));

        // bearings sweep from ambient angles to the house — slowly
        setTimeout(() => {
            log('SOLVER', 'SOURCE VECTOR UPDATED', 'alert');
            step.textContent = 'SOURCE VECTOR UPDATED';
            if (window.anime) anime({ targets: fill, width: '100%', duration: 800, easing: 'easeOutQuad' });
            bearings.forEach(b => {
                const from = b.len > 0 ? b.angle : rnd(0, Math.PI * 2);
                const to = angleToHouse(b.node);
                const len = Math.hypot(HOUSE.x - b.node.x, HOUSE.y - b.node.y);
                const o = { a: from, l: Math.max(b.len, 30), op: 0.35 };
                if (window.anime) {
                    anime({
                        targets: o, a: to, l: len, op: 0.85,
                        duration: 4200, easing: 'easeInOutSine',
                        update: () => setBearing(b, o.a, o.l, o.op, '#d9a441'),
                    });
                } else setBearing(b, to, len, 0.85, '#d9a441');
            });
        }, steps.length * 1600 + 400);

        // quiet convergence: no alarm, just the estimate
        setTimeout(() => {
            overlay.style.display = 'none';
            state.solved = true;
            const halo = document.getElementById('house-halo');
            if (window.anime) {
                anime({ targets: halo, opacity: [0, 0.7], duration: 1500, easing: 'easeInOutQuad' });
                anime({ targets: halo, r: [20, 30], direction: 'alternate', loop: true, duration: 2400, easing: 'easeInOutSine' });
            } else halo.setAttribute('opacity', 0.7);
            const se = document.getElementById('source-estimate');
            se.style.display = 'block';
            document.getElementById('se-value').textContent = 'Dallas Residence';
            document.getElementById('se-conf').textContent = 'CONFIDENCE 98.7% · RMS RESIDUAL 0.9 m';
            if (window.anime) anime({ targets: se, opacity: [0, 1], duration: 1200, easing: 'easeOutQuad' });
            log('SOLVER', 'SOURCE ESTIMATE — Dallas Residence · confidence 98.7%', 'alert');
        }, steps.length * 1600 + 5200);
    },

    // 8 — storm interference
    8() {
        setMode(8, 'STORM INTERFERENCE');
        state.stormLevel = 0.85;
        log('ARRAY', 'Storm cell approaching · broadband interference rising', 'alert');
        log('NODE 08', 'Packet loss climbing · boardwalk cable run', 'alert');
        setTimeout(() => log('ARRAY', 'Classifier suppressed — SNR below threshold', 'notable'), 2000);
    },

    // 9 — historical data
    9() {
        setMode(9, 'HISTORICAL ARCHIVE');
        log('ARCHIVE', 'Loading historical record… 11,482,904 events since 2009', 'system');
        const rows = [
            ['2006-08-14 03:12', 'E.H. — 41.9 Hz event, single node, dismissed as pump noise'],
            ['2009-07-02 02:47', 'E.H. — 41.8 Hz, two nodes, "arrivals don’t make sense — check clocks"'],
            ['2013-06-30 01:58', 'E.H. — 41.8 Hz, pattern repeating, 14 min duration'],
            ['2017-07-11 03:05', 'E.H. — last entry in her hand: "it isn’t moving. it’s already here."'],
            ['2023-08-01 02:51', 'M.H. — resumed monitoring · array recommissioned'],
            ['2025-07-29 03:12', 'M.H. — 41.8 Hz, all nodes, first full-array capture'],
        ];
        rows.forEach((r, i) => setTimeout(() => log('ARCHIVE', `${r[0]} — ${r[1]}`, i >= 3 ? 'anomaly' : 'notable'), 900 + i * 1100));
        setTimeout(() => log('ARCHIVE', 'Every recorded event: same frequency. Same hour. Same propagation error.', 'alert'), 900 + rows.length * 1100 + 800);
    },

    // 0 — reset
    0() {
        clearScenario();
        setMode(1, 'PASSIVE MONITORING');
        NODES.forEach(n => { n.status = 'ONLINE'; n.sync = rnd(4, 24); n.loss = rnd(0, 1.5); });
        document.getElementById('hdr-sync').textContent = 'LOCKED ±14 µs';
        document.getElementById('sync-led').className = 'led';
        renderNodes();
        log('ARRAY', 'System reset · passive monitoring · all nodes nominal', 'system');
    },
};

/* keys: 1–7 screens · letters + 8/9/0 drive scenarios on screen 1 */
const SCENARIO_KEYS = { a: 2, u: 3, f: 4, r: 5, c: 6, t: 7 };

function runScenario(num) {
    if (state.screenMode > 1) showScreen(1);
    SCENARIOS[num]();
}

document.addEventListener('keydown', e => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;  // don't hijack browser shortcuts
    const k = e.key.toLowerCase();
    // Screen navigation (1-7)
    if (e.key >= '1' && e.key <= '7') {
        showScreen(+e.key);
    }
    // Scenarios: 8 storm · 9 history · 0 reset
    else if (e.key === '8' || e.key === '9' || e.key === '0') {
        runScenario(+e.key);
    }
    // Scenarios: A activity · U unknown · F net fail · R restore · C compare · T triangulate
    else if (SCENARIO_KEYS[k]) {
        runScenario(SCENARIO_KEYS[k]);
    }
    else if (e.key === 'l' || e.key === 'L') {
        state.lowPower = !state.lowPower;
        document.getElementById('particle-layer').style.display = state.lowPower ? 'none' : 'block';
        log('SYSTEM', `Low Power Mode ${state.lowPower ? 'ENABLED' : 'DISABLED'}`, 'system');
    }
    else if (e.key === 'Escape') {
        if (state.screenMode > 1) {
            showScreen(1);
        } else {
            MFN.closeInspector();
        }
    }
});

/* =========================================================================
   THREE.JS — nearly imperceptible particle field (acoustic energy)
   ========================================================================= */
(function particles() {
    if (!window.THREE) return;
    const canvas = document.getElementById('particle-layer');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 30;

    const N = 700;
    const pos = new Float32Array(N * 3);
    for (let i = 0; i < N * 3; i++) pos[i] = (Math.random() - 0.5) * 60;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: 0x8fa671, size: 0.09, transparent: true, opacity: 0.22 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    function resize() {
        renderer.setSize(window.innerWidth, window.innerHeight, false);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);
    resize();

    (function tick() {
        if (!state.lowPower) {
            pts.rotation.y += 0.00035;
            pts.rotation.x += 0.00012;
            mat.opacity = 0.18 + (state.unknownActive ? 0.1 : 0) + Math.sin(performance.now() * 0.0004) * 0.04;
            renderer.render(scene, camera);
        }
        requestAnimationFrame(tick);
    })();
})();

/* =========================================================================
   BOOT
   ========================================================================= */
// Initialize viewport system
document.getElementById('screen1').classList.add('active');
state.screenMode = 1;

renderNodes();
loop();

log('SYSTEM', 'MAKAYLA FIELD NETWORK v4.7.2 — cold start', 'system');
log('SYSTEM', 'Loading array manifest · 8 nodes · 2 trail cameras · 1 tide gauge', 'system');
log('SYSTEM', 'GPS discipline acquired · holdover cleared', 'system');
log('ARRAY', 'Passive monitoring active. Research continues.', 'notable');
log('SYSTEM', 'Screens 1–7 · scenarios A/U/F/R/C/T · 8 storm · 9 history · 0 reset', 'system');

setInterval(() => { if (!state.netFail) pick(IDLE_LOGS)(); }, 1900);
setInterval(() => {
    const d = Math.floor((performance.now() - state.t0) / 1000);
    document.getElementById('hdr-uptime').textContent = `412 d ${pad(6 + Math.floor(d / 3600))} h`;
}, 30000);

// seed some ambient history so the strip isn't empty on camera
for (let i = 0; i < 5; i++) setTimeout(() => captureEvent(false), 600 + i * 400);

})();
