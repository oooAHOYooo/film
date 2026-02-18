#!/usr/bin/env node

/**
 * Production page compiler
 * Reads script-system manifest + scene files (and optional production-data.json),
 * then generates pages/summer/production.html so the production overview stays
 * in sync with the scene system when you run node compile-all.js.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const SCRIPT_SYSTEM = path.join(__dirname, 'script-system');
const SCENES_DIR = path.join(SCRIPT_SYSTEM, 'scenes');
const MANIFEST_PATH = path.join(SCRIPT_SYSTEM, 'manifest.json');
const PLOT_CARDS_PATH = path.join(SCRIPT_SYSTEM, 'plot-cards-data.json');
const PRODUCTION_DATA_PATH = path.join(__dirname, 'production-data.json');
const OUTPUT_HTML = path.join(__dirname, 'production.html');

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

/** Load scene gallery data (same source as script-system index.html). If present and length matches manifest, use for titles/act so production matches the gallery. */
function loadPlotCardsData() {
  try {
    const raw = fs.readFileSync(PLOT_CARDS_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function loadScene(filename) {
  const filePath = path.join(SCENES_DIR, filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return '';
  }
}

function loadProductionData() {
  try {
    const raw = fs.readFileSync(PRODUCTION_DATA_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return {};
  }
}

function nicknameToTitle(nickname) {
  if (!nickname) return '';
  return nickname
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Parse first INT. / EXT. line in scene content → { location, time }
function parseSceneHeading(content) {
  if (!content || typeof content !== 'string') return { location: '', time: '' };
  const match = content.match(/^(INT\.|EXT\.)\s+(.+?)\s*-\s*([A-Za-z][A-Za-z\s]*)\s*$/m);
  if (!match) return { location: '', time: '' };
  const type = match[1].toUpperCase().startsWith('EXT') ? 'Exterior' : 'Interior';
  const locationName = match[2].trim().replace(/\s+/g, ' ');
  const time = match[3].trim();
  const location = locationName ? `${locationName} - ${type}` : type;
  return { location, time };
}

function escapeHtml(s) {
  if (s == null || s === '') return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildProductionRows(scenes, productionData, plotCards) {
  const useGallery = Array.isArray(plotCards) && plotCards.length === scenes.length;
  const rows = [];
  scenes.forEach((scene, index) => {
    const card = useGallery ? plotCards[index] : null;
    const n = card ? card.n : index + 1;
    const id = scene.id || scene.nickname || `scene-${n}`;
    const title = card ? card.title : (scene.title || nicknameToTitle(scene.nickname || scene.id) || `Scene ${n}`);
    const act = card ? (card.act ?? 0) : (scene.act || 0);
    const actTitle = card ? (card.actTitle || '') : (scene.actTitle || '');
    const content = loadScene(scene.file);
    const { location: parsedLocation, time: parsedTime } = parseSceneHeading(content);
    const data = productionData[id] || {};
    const location = data.location != null && data.location !== '' ? data.location : parsedLocation;
    const time = data.time != null && data.time !== '' ? data.time : parsedTime;
    const durationMin = data.durationMin;
    const shootDays = data.shootDays;
    const pickup = !!data.pickup;
    const keyElements = data.keyElements || '';
    const productionNotes = data.productionNotes || '';
    rows.push({
      n,
      id,
      title,
      location,
      time,
      durationMin,
      shootDays,
      pickup,
      keyElements,
      productionNotes,
      act,
      actTitle,
    });
  });
  return rows;
}

function actRangesFromRows(rows) {
  const byAct = {};
  rows.forEach((row) => {
    const act = row.act || 0;
    if (!byAct[act]) byAct[act] = [];
    byAct[act].push(row.n);
  });
  return Object.keys(byAct)
    .sort((a, b) => Number(a) - Number(b))
    .map((act) => {
      const nums = byAct[act];
      return {
        act: Number(act),
        sceneRange: nums.length ? `${nums[0]}-${nums[nums.length - 1]}` : '',
        count: nums.length,
        durationMin: null,
      };
    });
}

function locationBreakdown(rows) {
  const byLocation = {};
  rows.forEach((row) => {
    const loc = row.location || '—';
    if (!byLocation[loc]) byLocation[loc] = { scenes: [], shootDays: 0 };
    byLocation[loc].scenes.push(row.n);
    byLocation[loc].shootDays += Number(row.shootDays) || 0;
  });
  return Object.entries(byLocation).map(([location, { scenes, shootDays }]) => ({
    location,
    scenes: scenes.sort((a, b) => a - b).join(', '),
    shootDays: shootDays > 0 ? shootDays : '—',
  }));
}

function totalShootDays(rows) {
  const sum = rows.reduce((acc, r) => acc + (Number(r.shootDays) || 0), 0);
  return sum;
}

function totalDurationMin(rows) {
  const sum = rows.reduce((acc, r) => acc + (Number(r.durationMin) || 0), 0);
  return sum;
}

function getProductionStyles() {
  return `
            .production-table-wrap {
                margin: 16px 0;
                overflow-x: auto;
                -webkit-overflow-scrolling: touch;
            }
            .production-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
                background: var(--glass-bg);
                border: 1px solid var(--prod-border);
                border-radius: var(--soft);
                font-size: 0.9rem;
            }
            .production-table thead th {
                position: sticky;
                top: 52px;
                z-index: 15;
                padding: 10px 12px;
                text-align: left;
                font-weight: 600;
                font-size: 0.85rem;
                color: var(--prod-accent);
                border-bottom: 2px solid var(--prod-border);
                background: #161b22;
                box-shadow: 0 2px 0 0 var(--prod-border);
            }
            .production-table .duration-col { width: 80px; text-align: center; }
            .production-table .act-col { width: 88px; text-align: center; }
            .production-table .shoot-days-col { width: 88px; text-align: center; }
            .production-table .scene-name-col { width: 200px; }
            .production-table td {
                padding: 8px 12px;
                border-bottom: 1px solid var(--prod-border);
                color: var(--text-primary);
                vertical-align: top;
                line-height: 1.4;
            }
            .production-table tbody tr:hover { background: var(--prod-row-hover); }
            .production-table tbody tr:last-child td { border-bottom: none; }
            .scene-number {
                font-weight: 600;
                color: var(--prod-accent);
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            }
            .location-tag {
                display: inline-block;
                padding: 3px 8px;
                background: var(--prod-tag-bg);
                border: 1px solid var(--prod-tag-border);
                border-radius: 4px;
                font-size: 0.82rem;
                color: var(--prod-accent);
                margin: 2px 0;
            }
            .time-of-day { font-size: 0.85rem; color: var(--text-secondary); font-style: italic; }
            .production-notes { font-size: 0.88rem; color: var(--text-secondary); line-height: 1.45; }
            .key-elements { font-size: 0.88rem; line-height: 1.5; }
            .key-elements strong { color: var(--prod-accent); }
            .compact-table {
                width: 100%;
                border-collapse: collapse;
                margin: 24px 0;
                background: var(--glass-bg);
                border: 1px solid var(--prod-border);
                border-radius: var(--soft);
                overflow: hidden;
                font-size: 0.9rem;
            }
            .compact-table thead { background: var(--prod-head); }
            .compact-table th {
                padding: 12px 16px;
                text-align: left;
                font-weight: 600;
                color: var(--prod-accent);
                border-bottom: 2px solid var(--prod-border);
                white-space: nowrap;
            }
            .compact-table td {
                padding: 10px 16px;
                border-bottom: 1px solid var(--prod-border);
                color: var(--text-primary);
                vertical-align: middle;
            }
            .compact-table tbody tr:hover { background: var(--prod-row-hover); }
            .compact-table tbody tr:last-child td { border-bottom: none; }
            .compact-table .scene-col { width: 60px; text-align: center; }
            .compact-table .scene-name-col { width: 200px; }
            .compact-table .location-col { width: 180px; }
            .scene-name { font-size: 0.9rem; color: var(--text-primary); font-style: italic; opacity: 0.85; }
            .scene-name:empty::before { content: '—'; color: var(--text-muted); }
            .compact-table .time-col { width: 100px; }
            .compact-table .duration-col { width: 80px; text-align: center; }
            .compact-table .act-col { width: 100px; text-align: center; }
            .compact-table .shoot-days-col { width: 90px; text-align: center; }
            .shoot-days, .duration {
                font-weight: 600;
                color: var(--prod-accent);
                font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
            }
            .act-tag {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.8rem;
                font-weight: 600;
            }
            .act-tag.act1 {
                background: rgba(63, 185, 80, 0.18);
                border: 1px solid rgba(63, 185, 80, 0.35);
                color: #7ee787;
            }
            .act-tag.act2 {
                background: rgba(210, 153, 34, 0.18);
                border: 1px solid rgba(210, 153, 34, 0.35);
                color: #e3b341;
            }
            .act-tag.act3 {
                background: rgba(248, 81, 73, 0.15);
                border: 1px solid rgba(248, 81, 73, 0.3);
                color: #ff7b72;
            }
            .act-tag.act4 {
                background: var(--prod-tag-bg);
                border: 1px solid var(--prod-tag-border);
                color: var(--prod-accent);
            }
            .compact-summary { font-size: 0.9rem; line-height: 1.4; color: var(--text-primary); }
            .compact-summary strong { color: var(--prod-accent); }
            .nav-bar {
                position: sticky;
                top: 0;
                z-index: 100;
                background: rgba(13, 17, 23, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid var(--prod-border);
                padding: 12px 0;
                margin: 0;
            }
            .nav-bar-content {
                max-width: var(--maxw);
                margin: 0 auto;
                padding: 0 var(--gap);
                display: flex;
                align-items: center;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 16px;
            }
            .nav-links { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
            .nav-link {
                padding: 6px 12px;
                background: var(--prod-tag-bg);
                border: 1px solid var(--prod-tag-border);
                border-radius: 6px;
                color: var(--prod-accent);
                text-decoration: none;
                font-size: 0.85rem;
                transition: all 0.2s ease;
                white-space: nowrap;
            }
            .nav-link:hover {
                background: var(--prod-row-hover);
                border-color: var(--prod-accent);
                transform: translateY(-1px);
            }
            .nav-link.active {
                background: var(--prod-row-hover);
                border-color: var(--prod-accent);
            }
            .back-to-top {
                position: fixed;
                bottom: 24px;
                right: 24px;
                width: 48px;
                height: 48px;
                background: var(--glass-bg);
                border: 1px solid var(--prod-border);
                border-radius: 50%;
                color: var(--prod-accent);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 1.2rem;
                transition: all 0.2s ease;
                z-index: 50;
                opacity: 0;
                visibility: hidden;
                backdrop-filter: blur(10px);
            }
            .back-to-top.visible { opacity: 1; visibility: visible; }
            .back-to-top:hover {
                background: var(--prod-row-hover);
                border-color: var(--prod-accent);
                transform: translateY(-2px);
            }
            .section-anchor { scroll-margin-top: 80px; }
            @media (max-width: 768px) {
                .production-table { font-size: 0.85rem; }
                .production-table th { padding: 8px 10px; }
                .production-table td { padding: 6px 10px; }
                .compact-table { font-size: 0.8rem; }
                .compact-table th, .compact-table td { padding: 8px 12px; }
                .compact-table .location-col { width: 150px; }
                .compact-table .time-col { width: 80px; }
                .compact-table .scene-name-col { width: 150px; }
                .nav-bar { padding: 8px 0; }
                .nav-bar-content { flex-direction: column; align-items: flex-start; }
                .nav-links { width: 100%; justify-content: flex-start; }
                .nav-link { font-size: 0.8rem; padding: 6px 10px; }
                .back-to-top { bottom: 16px; right: 16px; width: 40px; height: 40px; font-size: 1rem; }
            }
`;
}

function generateBreakdownRows(rows) {
  return rows
    .map(
      (r) => `
                        <tr>
                            <td><span class="scene-number">${r.n}</span></td>
                            <td class="scene-name-col"><span class="scene-name">${escapeHtml(r.title)}</span></td>
                            <td><span class="location-tag">${escapeHtml(r.location || '—')}</span></td>
                            <td><span class="time-of-day">${escapeHtml(r.time || '—')}</span></td>
                            <td class="duration-col"><span class="duration">${r.durationMin != null ? r.durationMin + ' min' : '—'}</span></td>
                            <td class="act-col"><span class="act-tag act${r.act}">Act ${r.act}</span></td>
                            <td class="shoot-days-col"><span class="shoot-days">${r.pickup ? 'pickup' : (r.shootDays != null ? r.shootDays : '—')}</span></td>
                            <td class="key-elements">${r.keyElements ? r.keyElements.replace(/\n/g, ' ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') : '—'}</td>
                            <td class="production-notes">${escapeHtml(r.productionNotes || '—')}</td>
                        </tr>`
    )
    .join('');
}

function generateOverviewStats(rows, actRangesList, totalMin, totalDays) {
  const totalScenes = rows.length;
  return actRangesList
    .map(
      (a) => `
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">${a.act === 1 ? 'Act I' : a.act === 2 ? 'Act II' : a.act === 3 ? 'Act III' : 'Act IV'}${a.count ? ` (Scenes ${a.sceneRange})` : ''}</div>
                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--prod-accent);">${a.durationMin != null ? '~' + a.durationMin + ' min' : a.count ? a.count + ' scenes' : '—'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${a.count ? a.count + ' scenes' : ''}</div>
                    </div>`
    )
    .join('');
}

function generateLocationTable(locationRows, totalDays) {
  return locationRows
    .map(
      (loc) => `
                            <tr>
                                <td><strong>${escapeHtml(loc.location)}</strong></td>
                                <td>${escapeHtml(loc.scenes)}</td>
                                <td><span class="shoot-days">${loc.shootDays}</span></td>
                                <td>—</td>
                            </tr>`
    )
    .join('');
}

const PICKUP_DAYS = 2;

function generateFullHtml(rows, actRangesList, locationRows, totalMin, totalDays) {
  const totalScenes = rows.length;
  const pickupSceneCount = rows.filter((r) => r.pickup).length;
  const shootDaysLabel = totalDays != null && totalDays !== ''
    ? (pickupSceneCount > 0 ? `${totalDays} shoot days + ${PICKUP_DAYS} pickup (SFX/action, Makayla + Dallas)` : `${totalDays} shoot days`)
    : '';
  const overviewStats = actRangesList
    .map(
      (a) => `
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">${a.act === 1 ? 'Act I' : a.act === 2 ? 'Act II' : a.act === 3 ? 'Act III' : 'Act IV'}${a.count ? ` (Scenes ${a.sceneRange})` : ''}</div>
                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--prod-accent);">${a.durationMin != null ? '~' + a.durationMin + ' min' : a.count ? a.count + ' scenes' : '—'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${a.count ? a.count + ' scenes' : ''}</div>
                    </div>`
    )
    .join('');

  const breakdownRowsHtml = generateBreakdownRows(rows);
  const locationRowsHtml = generateLocationTable(locationRows, totalDays);

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Production — Creatures in the Tall Grass</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="stylesheet" href="/styles/style.css">
        <style>
            :root {
                --prod-accent: #79b8ff;
                --prod-head: rgba(56, 139, 253, 0.12);
                --prod-border: rgba(56, 139, 253, 0.18);
                --prod-tag-bg: rgba(56, 139, 253, 0.1);
                --prod-tag-border: rgba(56, 139, 253, 0.25);
                --prod-row-hover: rgba(56, 139, 253, 0.06);
            }
            ${getProductionStyles()}
        </style>
    </head>
    <body>
        <header class="header">
            <h1><a href="/pages/summer.html">← Summer Film</a> / Production</h1>
            <p>Scene breakdown and production notes for Creatures in the Tall Grass. Generated from script-system (manifest + scenes).</p>
        </header>

        <nav class="nav-bar">
            <div class="nav-bar-content">
                <div style="font-weight: 600; color: var(--prod-accent); font-size: 0.9rem;">Quick Navigation:</div>
                <div class="nav-links">
                    <a href="#overview" class="nav-link">Overview</a>
                    <a href="#breakdown" class="nav-link">Scene Breakdown</a>
                    <a href="#locations-scheduling" class="nav-link">Locations</a>
                    <a href="#production-notes" class="nav-link">Production Notes</a>
                    <a href="/pages/summer/script-system/full_script.html" class="nav-link">Full Script</a>
                    <a href="/pages/summer.html" class="nav-link">← Back to Summer</a>
                </div>
            </div>
        </nav>

        <div class="back-to-top" id="backToTop" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">↑</div>

        <section class="section section-anchor" id="overview" style="margin-top: 20px;">
            <div class="card">
                <h3 style="margin: 0 0 12px 0; color: var(--prod-accent);">Production Overview</h3>
                <p style="margin: 0 0 20px 0; color: var(--text-secondary); line-height: 1.6;">
                    This scene breakdown is generated from the script-system (manifest + scenes). Use it for
                    scheduling, location scouting, and technical planning. Edit production-data.json to add
                    duration, shoot days, key elements, and production notes per scene.
                </p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--prod-border);">
                    <div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px;">Total</div>
                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--prod-accent);">${totalMin ? '~' + totalMin + ' min' : totalScenes + ' scenes'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${totalScenes} scenes${shootDaysLabel ? ' · ' + shootDaysLabel : ''}</div>
                    </div>
                    ${overviewStats}
                </div>
            </div>
        </section>

        <section class="section section-anchor" id="breakdown">
            <h2 style="margin: 0 0 16px 0;">Scene Breakdown</h2>
            <p style="margin: 0 0 20px 0; color: var(--text-secondary); line-height: 1.6;">
                Production-ready breakdown aligned with the script-system (scenes folder). ${totalScenes} scenes.
                Location and time are parsed from INT/EXT headings; duration, shoot days, key elements, and notes come from production-data.json.
            </p>
            <div class="production-table-wrap">
                <table class="production-table">
                    <thead>
                        <tr>
                            <th style="width: 80px;">Scene</th>
                            <th class="scene-name-col">Scene Name</th>
                            <th style="width: 200px;">Location</th>
                            <th style="width: 120px;">Time</th>
                            <th class="duration-col">Duration</th>
                            <th class="act-col">Act</th>
                            <th class="shoot-days-col">Shoot Days</th>
                            <th>Key Elements & Action</th>
                            <th style="width: 250px;">Production Notes</th>
                        </tr>
                    </thead>
                    <tbody>
${breakdownRowsHtml}
                    </tbody>
                </table>
            </div>
        </section>

        <section class="section section-anchor" id="locations-scheduling">
            <h2>Locations & Scheduling</h2>
            <div class="card" style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 16px 0; color: var(--prod-accent);">Location Breakdown</h3>
                <p style="margin: 0 0 20px 0; color: var(--text-secondary); line-height: 1.6;">
                    Scenes grouped by location. Shoot days summed from production-data.json when set.
                </p>
                <div style="overflow-x: auto;">
                    <table class="compact-table" style="margin: 0;">
                        <thead>
                            <tr>
                                <th style="width: 250px;">Location</th>
                                <th style="width: 150px;">Scenes</th>
                                <th style="width: 120px;">Total Shoot Days</th>
                                <th>Notes</th>
                            </tr>
                        </thead>
                        <tbody>
${locationRowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="card">
                <h3 style="margin: 0 0 16px 0; color: var(--prod-accent);">Scheduling Summary</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 24px;">
                    <div>
                        <h4 style="margin: 0 0 12px 0; color: var(--text-primary);">Total Shoot Days</h4>
                        <div style="font-size: 2rem; font-weight: 600; color: var(--prod-accent); margin-bottom: 8px;">${totalDays ?? '—'}${pickupSceneCount > 0 ? ' + ' + PICKUP_DAYS + ' pickup' : ''}</div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary);">${totalScenes} scenes (script-system)${pickupSceneCount > 0 ? ' · Pickup for SFX/action (Makayla + Dallas)' : ''}</div>
                    </div>
                </div>
            </div>
        </section>

        <section class="section section-anchor" id="production-notes">
            <h2>Production Notes Summary</h2>
            <div class="card">
                <h3 style="margin: 0 0 16px 0; color: var(--prod-accent);">Key Production Considerations</h3>
                <p style="margin: 0 0 16px 0; color: var(--text-secondary);">Add per-scene notes in production-data.json (keyElements, productionNotes). High-level categories below.</p>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px;">
                    <div>
                        <h4 style="margin: 0 0 12px 0; color: var(--text-primary);">Visual Effects</h4>
                        <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.8;">
                            <li>Creature design and animation</li>
                            <li>Glowing effects, predator red eyes</li>
                            <li>Burn marks and trails, weather</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 12px 0; color: var(--text-primary);">Sound Design</h4>
                        <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.8;">
                            <li>Hum, creature cries, equipment</li>
                            <li>Storm, wind, coyotes</li>
                        </ul>
                    </div>
                    <div>
                        <h4 style="margin: 0 0 12px 0; color: var(--text-primary);">Locations</h4>
                        <ul style="margin: 0; padding-left: 20px; color: var(--text-secondary); line-height: 1.8;">
                            <li>Dallas' house, Dominic's house</li>
                            <li>Branford streets, marsh, tall grass</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>

        <footer><p>Barnacle Film Studio Company ©2025</p></footer>

        <script>
            var backToTop = document.getElementById('backToTop');
            window.addEventListener('scroll', function() {
                backToTop.classList.toggle('visible', window.pageYOffset > 300);
            });
            document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
                anchor.addEventListener('click', function(e) {
                    var href = this.getAttribute('href');
                    if (href !== '#' && href !== '') {
                        e.preventDefault();
                        var target = document.querySelector(href);
                        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                });
            });
            var sections = document.querySelectorAll('.section-anchor');
            var navLinks = document.querySelectorAll('.nav-link[href^="#"]');
            window.addEventListener('scroll', function() {
                var current = '';
                sections.forEach(function(section) {
                    if (pageYOffset >= section.offsetTop - 100) current = section.getAttribute('id');
                });
                navLinks.forEach(function(link) {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
                });
            });
        </script>
    </body>
</html>
`;
}

function compile() {
  console.log('Loading manifest...');
  const scenes = loadManifest();
  console.log(`Found ${scenes.length} scenes`);
  const plotCards = loadPlotCardsData();
  if (plotCards && plotCards.length === scenes.length) {
    console.log('Using plot-cards-data.json so production matches scene gallery');
  }
  const productionData = loadProductionData();
  const rows = buildProductionRows(scenes, productionData, plotCards);
  const actRangesList = actRangesFromRows(rows);
  const totalMin = totalDurationMin(rows);
  const totalDays = totalShootDays(rows);
  const locationRows = locationBreakdown(rows);

  // Add duration per act for overview
  actRangesList.forEach((a) => {
    const actRows = rows.filter((r) => r.act === a.act);
    a.durationMin = totalDurationMin(actRows) || null;
  });
  // Ensure act list is sorted by act number for display
  actRangesList.sort((a, b) => a.act - b.act);

  const html = generateFullHtml(rows, actRangesList, locationRows, totalMin, totalDays);
  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`✓ Created ${path.relative(ROOT, OUTPUT_HTML)}`);
}

if (require.main === module) {
  compile();
}

module.exports = { compile, buildProductionRows, loadManifest, loadProductionData };
