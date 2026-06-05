#!/usr/bin/env node
// Syncs production-edit.md back to production-data.json.
// Run: node sync-production.js  (or: npm run production:sync)
const fs = require('fs');
const path = require('path');

const MD_PATH = path.join(__dirname, 'production-edit.md');
const JSON_PATH = path.join(__dirname, 'production-data.json');

if (!fs.existsSync(MD_PATH)) {
  console.error('production-edit.md not found. Run: npm run production:export first.');
  process.exit(1);
}

const text = fs.readFileSync(MD_PATH, 'utf8');
const lines = text.split('\n');

// ─── helpers ────────────────────────────────────────────────────────────────

// Collect "  - item" list lines starting at idx; returns { items, next }
function collectList(arr, idx) {
  const items = [];
  let i = idx;
  while (i < arr.length && arr[i].startsWith('  - ')) {
    items.push(arr[i].slice(4));
    i++;
  }
  return { items, next: i };
}

// Collect indented (2-space, non-dash) lines — used for crew-call
function collectIndented(arr, idx) {
  const items = [];
  let i = idx;
  while (i < arr.length && /^  [^-\s]/.test(arr[i])) {
    items.push(arr[i].slice(2));
    i++;
  }
  return { items, next: i };
}

// Extract value after "key: " (handles missing space or empty value)
function val(line, key) {
  const prefix = key.endsWith(':') ? key : key + ':';
  if (!line.startsWith(prefix)) return null;
  return line.slice(prefix.length).replace(/^ /, '');
}

// ─── section splitting ───────────────────────────────────────────────────────

const SECTION_NAMES = ['SETTINGS', 'CALENDAR', 'SCENES', 'SHOOT PLAN', 'LOCATION DIRECTORY'];
const sections = Object.fromEntries(SECTION_NAMES.map(n => [n, []]));
let currentSection = null;

for (const line of lines) {
  // Skip HTML comments
  if (line.trimStart().startsWith('<!--')) continue;

  if (line.startsWith('## ')) {
    const name = line.slice(3).trim();
    currentSection = sections[name] !== undefined ? name : null;
  } else if (currentSection) {
    sections[currentSection].push(line);
  }
}

const result = {};

// ─── SETTINGS ────────────────────────────────────────────────────────────────

for (const line of sections.SETTINGS) {
  if (line.startsWith('chronological-start-day:')) {
    result.settings = { chronologicalStartDay: Number(val(line, 'chronological-start-day')) };
  }
}

// ─── CALENDAR ────────────────────────────────────────────────────────────────

const calendar = {};
for (const line of sections.CALENDAR) {
  const m = line.match(/^(\d+(?:\.\d+)?):\s*(.+)/);
  if (m) calendar[m[1]] = m[2].trim();
}
result.calendar = calendar;

// ─── SCENES ──────────────────────────────────────────────────────────────────

function parseScene(blockLines) {
  const scene = {};
  let i = 0;
  while (i < blockLines.length) {
    const line = blockLines[i];
    if (!line.trim() || line.startsWith('---') || line.startsWith('#')) { i++; continue; }

    if (line.startsWith('duration:'))           scene.durationMin      = Number(val(line, 'duration'));
    else if (line.startsWith('shoot-days:'))     scene.shootDays        = Number(val(line, 'shoot-days'));
    else if (line.startsWith('assigned-day:'))   scene.assignedDay      = Number(val(line, 'assigned-day'));
    else if (line.startsWith('location:'))       scene.location         = val(line, 'location');
    else if (line.startsWith('time:'))           scene.time             = val(line, 'time');
    else if (line.startsWith('key-elements:'))   scene.keyElements      = val(line, 'key-elements');
    else if (line.startsWith('production-notes:')) scene.productionNotes = val(line, 'production-notes');
    else if (line.startsWith('cast:')) {
      const v = val(line, 'cast').trim();
      scene.cast = v ? v.split(',').map(s => s.trim()) : [];
    } else if (line === 'props:') {
      const { items, next } = collectList(blockLines, i + 1);
      scene.props = items;
      i = next - 1;
    }
    i++;
  }
  return scene;
}

// Split scenes section into per-scene blocks
{
  let id = null, buf = [];
  for (const line of sections.SCENES) {
    if (line.startsWith('### scene: ')) {
      if (id) result[id] = parseScene(buf);
      id = line.slice('### scene: '.length).trim();
      buf = [];
    } else if (id) {
      buf.push(line);
    }
  }
  if (id) result[id] = parseScene(buf);
}

// ─── SHOOT PLAN ──────────────────────────────────────────────────────────────

function parseBeat(header, beatLines) {
  const dashIdx = header.indexOf(' — ');
  const beatId  = dashIdx >= 0 ? header.slice(0, dashIdx) : header;
  const title   = dashIdx >= 0 ? header.slice(dashIdx + 3) : '';
  const beat = { beat: beatId, title };

  for (let j = 0; j < beatLines.length; j++) {
    const l = beatLines[j];
    if (l.startsWith('scene:'))       beat.scene = val(l, 'scene').trim();
    else if (l.startsWith('cast:')) {
      const v = val(l, 'cast').trim();
      beat.cast = v ? v.split(',').map(s => s.trim()) : [];
    }
    else if (l.startsWith('description:')) beat.description = val(l, 'description');
    else if (l === 'shots:') {
      const { items, next } = collectList(beatLines, j + 1);
      beat.shots = items;
      j = next - 1;
    }
  }
  return beat;
}

function parseDay(dayNum, dayLines) {
  const day = { day: dayNum };
  let i = 0;

  // Parse day-level fields until first beat
  while (i < dayLines.length && !dayLines[i].startsWith('#### Beat:')) {
    const line = dayLines[i];
    if (!line.trim() || line === '---') { i++; continue; }

    if (line.startsWith('est-length:'))     day.estLength = val(line, 'est-length').trim();
    else if (line.startsWith('scenes:')) {
      const v = val(line, 'scenes').trim();
      day.scenes = v ? v.split(',').map(s => s.trim()) : [];
    }
    else if (line === 'crew-call:') {
      const { items, next } = collectIndented(dayLines, i + 1);
      day.crewCall = items.join('\n');
      i = next - 1;
    }
    else if (line === 'crew:') {
      const { items, next } = collectList(dayLines, i + 1);
      day.crew = items.map(item => {
        const ci = item.indexOf(': ');
        return ci >= 0
          ? { role: item.slice(0, ci), name: item.slice(ci + 2) }
          : { role: item, name: '' };
      });
      i = next - 1;
    }
    else if (line === 'locations:') {
      const { items, next } = collectList(dayLines, i + 1);
      day.locationDetails = items;
      i = next - 1;
    }
    else if (line === 'equipment:') {
      const { items, next } = collectList(dayLines, i + 1);
      day.equipment = items.map(s => `• ${s}`);
      i = next - 1;
    }
    else if (line === 'props:') {
      const { items, next } = collectList(dayLines, i + 1);
      day.props = items.map(s => `• ${s}`);
      i = next - 1;
    }
    i++;
  }

  // Parse beats
  const beats = [];
  let beatHeader = null, beatBuf = [];

  while (i < dayLines.length) {
    const line = dayLines[i];
    if (line.startsWith('#### Beat: ')) {
      if (beatHeader !== null) beats.push(parseBeat(beatHeader, beatBuf));
      beatHeader = line.slice('#### Beat: '.length).trim();
      beatBuf = [];
    } else if (beatHeader !== null) {
      beatBuf.push(line);
    }
    i++;
  }
  if (beatHeader !== null) beats.push(parseBeat(beatHeader, beatBuf));
  if (beats.length) day.shotList = beats;

  return day;
}

// Split shoot plan into per-day blocks
{
  const shootPlan = [];
  let dayNum = null, buf = [];

  for (const line of sections['SHOOT PLAN']) {
    const m = line.match(/^### Day (\d+(?:\.\d+)?)/);
    if (m) {
      if (dayNum !== null) shootPlan.push(parseDay(Number(dayNum), buf));
      dayNum = m[1];
      buf = [];
    } else if (dayNum !== null) {
      buf.push(line);
    }
  }
  if (dayNum !== null) shootPlan.push(parseDay(Number(dayNum), buf));
  result.shootPlan = shootPlan;
}

// ─── LOCATION DIRECTORY ──────────────────────────────────────────────────────

{
  const locs = [];
  let loc = null;
  for (const line of sections['LOCATION DIRECTORY']) {
    if (line.startsWith('### ')) {
      if (loc) locs.push(loc);
      loc = { fictional: line.slice(4).trim(), actual: '', address: '' };
    } else if (loc) {
      if (line.startsWith('actual:'))  loc.actual  = val(line, 'actual').trim();
      if (line.startsWith('address:')) loc.address = val(line, 'address').trim();
    }
  }
  if (loc) locs.push(loc);
  result.locationDirectory = locs;
}

// ─── write ────────────────────────────────────────────────────────────────────

const jsonOut = JSON.stringify(result, null, 2);
fs.writeFileSync(JSON_PATH, jsonOut, 'utf8');

const scenes = Object.keys(result).filter(k =>
  !['settings','calendar','shootPlan','locationDirectory'].includes(k)).length;
const days = result.shootPlan ? result.shootPlan.length : 0;
const locs = result.locationDirectory ? result.locationDirectory.length : 0;

console.log(`✓ Synced to production-data.json`);
console.log(`  ${scenes} scenes · ${days} shoot days · ${locs} locations`);
console.log('  Run compile to regenerate HTML: node compile-production.js');
