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
    const characters = extractCharacters(content);
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
      characters,
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

function extractCharacters(content) {
  if (!content || typeof content !== 'string') return [];
  // Look for uppercase names at start of line or after (action) or in dialogue
  const charRegex = /^[ \t]*([A-Z]{2,}(?:\s+[A-Z]{2,})*)(?:\s*\(.*?\))?\s*$/gm;
  const matches = content.matchAll(charRegex);
  const chars = new Set();
  for (const match of matches) {
    const name = match[1].trim();
    if (name && !/^(INT\.|EXT\.|FADE|CUT|DISSOLVE|ACT|SCENE|DAY|NIGHT)/i.test(name)) {
      chars.add(name);
    }
  }
  return Array.from(chars).sort();
}

function getDayName(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00'); // Midday to avoid timezone drift
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getProductionStyles() {
  return `            :root {
                --prod-accent: #79b8ff;
                --prod-head: rgba(56, 139, 253, 0.12);
                --prod-border: rgba(56, 139, 253, 0.18);
                --prod-tag-bg: rgba(56, 139, 253, 0.1);
                --prod-tag-border: rgba(56, 139, 253, 0.25);
                --prod-row-hover: rgba(56, 139, 253, 0.06);
                --sidebar-w: 260px;
            }
            body { 
                margin: 0; 
                display: flex; 
                flex-direction: column; 
                height: 100vh; 
                overflow: hidden; 
                background: #0d1117;
                color: #c9d1d9;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            }
            .dashboard-container {
                display: flex;
                flex: 1;
                overflow: hidden;
            }
            .sidebar {
                width: var(--sidebar-w);
                background: #161b22;
                border-right: 1px solid var(--prod-border);
                display: flex;
                flex-direction: column;
                padding: 20px;
                overflow-y: auto;
            }
            .main-content {
                flex: 1;
                overflow-y: auto;
                padding: 40px;
                scroll-behavior: smooth;
            }
            .stats-card {
                background: var(--prod-tag-bg);
                border: 1px solid var(--prod-tag-border);
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 24px;
            }
            .stats-title {
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: var(--text-secondary);
                margin-bottom: 8px;
            }
            .stats-value {
                font-size: 1.5rem;
                font-weight: 600;
                color: var(--prod-accent);
            }
            .sidebar-button {
                display: block;
                width: 100%;
                padding: 14px;
                background: #2ea44f;
                color: #fff;
                text-align: center;
                text-decoration: none;
                font-weight: 600;
                border-radius: 6px;
                margin-bottom: 24px;
                font-size: 0.9rem;
                transition: background 0.2s;
            }
            .sidebar-button:hover {
                background: #2c974b;
            }
            .sidebar-nav-title {
                font-size: 0.85rem;
                font-weight: 600;
                margin: 20px 0 10px 0;
                color: var(--prod-accent);
            }
            .sidebar-link {
                display: block;
                padding: 8px 12px;
                color: var(--text-secondary);
                text-decoration: none;
                font-size: 0.9rem;
                border-radius: 6px;
                margin-bottom: 2px;
                transition: all 0.2s;
            }
            .sidebar-link:hover {
                background: var(--prod-row-hover);
                color: var(--prod-accent);
            }
            .production-table {
                width: 100%;
                border-collapse: collapse;
                background: #0d1117;
                border: 1px solid var(--prod-border);
                font-size: 0.9rem;
            }
            .production-table th {
                text-align: left;
                padding: 12px;
                border-bottom: 2px solid var(--prod-border);
                background: #161b22;
                color: var(--prod-accent);
                position: sticky;
                top: -41px;
                z-index: 10;
            }
            .production-table td {
                padding: 12px;
                border-bottom: 1px solid var(--prod-border);
                vertical-align: top;
            }
            .day-divider {
                background: var(--prod-head);
                color: var(--prod-accent);
                font-weight: 600;
                padding: 12px 20px;
                border-left: 4px solid var(--prod-accent);
                margin: 40px 0 20px 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .actor-chip {
                display: inline-block;
                padding: 2px 8px;
                background: rgba(56, 139, 253, 0.15);
                border: 1px solid rgba(56, 139, 253, 0.3);
                border-radius: 12px;
                font-size: 0.75rem;
                margin-right: 4px;
                margin-bottom: 4px;
                color: #58a6ff;
            }
            .click-copy {
                cursor: pointer;
                border-bottom: 1px dashed transparent;
            }
            .click-copy:hover {
                border-bottom-color: var(--prod-accent);
                color: var(--prod-accent);
            }
            .sync-check {
                cursor: pointer;
                opacity: 0.4;
                transition: opacity 0.2s;
            }
            .sync-check:checked {
                opacity: 1;
            }
            .row-dimmed {
                opacity: 0.4;
            }
            @media print {
                .sidebar, .nav-bar, .back-to-top { display: none; }
                .dashboard-container { display: block; }
                .main-content { padding: 0; }
                body { overflow: visible; height: auto; }
            }
`;
}

function generateBreakdownRows(rows, calendar, holidays) {
  let html = '';
  let currentTotalDays = 0;
  let currentDayInt = 0;

  rows.forEach((r, i) => {
    const shootDays = Number(r.shootDays) || 0;
    const oldDayInt = currentDayInt;
    currentTotalDays += shootDays;
    currentDayInt = Math.ceil(currentTotalDays);

    // If Day # changed, insert a day divider
    if (currentDayInt > oldDayInt && !r.pickup) {
      const dateStr = calendar[currentDayInt];
      const dayName = getDayName(dateStr);
      const formattedDate = formatDate(dateStr);
      const holiday = holidays[dateStr];
      html += `
        <tr class="day-divider-row">
          <td colspan="9">
            <div class="day-divider" id="day-${currentDayInt}">
              <span>Day ${currentDayInt} — ${dayName}, ${formattedDate} ${holiday ? `<span style="color:#ff7b72;margin-left:10px;">[${holiday}]</span>` : ''}</span>
              <span style="font-size:0.8rem;opacity:0.7;">Scheduled Scenes</span>
            </div>
          </td>
        </tr>`;
    }

    const charChips = (r.characters || []).map(c => `<span class="actor-chip">${c}</span>`).join('');

    html += `
                        <tr id="row-${r.n}">
                            <td><input type="checkbox" class="sync-check" onclick="document.getElementById('row-${r.n}').classList.toggle('row-dimmed', this.checked)"> <span class="scene-number click-copy" onclick="navigator.clipboard.writeText('${r.n}')">${r.n}</span></td>
                            <td class="scene-name-col"><span class="scene-name click-copy" onclick="navigator.clipboard.writeText('${escapeHtml(r.title)}')">${escapeHtml(r.title)}</span></td>
                            <td><span class="location-tag click-copy" onclick="navigator.clipboard.writeText('${escapeHtml(r.location || '—')}')">${escapeHtml(r.location || '—')}</span></td>
                            <td><span class="time-of-day">${escapeHtml(r.time || '—')}</span></td>
                            <td class="duration-col"><span class="duration">${r.durationMin != null ? r.durationMin + ' min' : '—'}</span></td>
                            <td class="act-col"><span class="act-tag act${r.act}">Act ${r.act}</span></td>
                            <td class="shoot-days-col"><span class="shoot-days">${r.pickup ? 'pickup' : (r.shootDays != null ? r.shootDays : '—')}</span></td>
                            <td class="key-elements">
                                ${r.keyElements ? r.keyElements.replace(/\n/g, ' ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') : '—'}
                                <div style="margin-top:8px;">${charChips}</div>
                            </td>
                            <td class="production-notes">${escapeHtml(r.productionNotes || '—')}</td>
                        </tr>`;
  });
  return html;
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

function generateFullHtml(rows, actRangesList, locationRows, totalMin, totalDays, productionData) {
  const totalScenes = rows.length;
  const pickupSceneCount = rows.filter((r) => r.pickup).length;
  const calendar = productionData.calendar || {};
  const holidays = productionData.holidays || {};
  const offDates = productionData.offDates || {};

  const allCharacters = new Set();
  rows.forEach(r => r.characters.forEach(c => allCharacters.add(c)));
  const sortedChars = Array.from(allCharacters).sort();

  const sidebarActorsHtml = sortedChars.map(c => `
    <a href="#" class="sidebar-link" onclick="filterByActor('${c}')">${c}</a>
  `).join('');

  const sidebarLocationsHtml = locationRows.map(l => `
    <a href="#" class="sidebar-link" onclick="filterByLocation('${escapeHtml(l.location)}')">${escapeHtml(l.location)}</a>
  `).join('');

  const sidebarDaysHtml = Object.keys(calendar).sort((a,b) => Number(a)-Number(b)).map(d => `
    <a href="#day-${d}" class="sidebar-link">Day ${d} — ${getDayName(calendar[d])}</a>
  `).join('');

  const breakdownRowsHtml = generateBreakdownRows(rows, calendar, holidays);
  const locationRowsHtml = generateLocationTable(locationRows, totalDays);

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Dashboard — Summer Production</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
            ${getProductionStyles()}
        </style>
    </head>
    <body>
        <div class="dashboard-container">
            <aside class="sidebar no-print">
                <div style="font-size: 1.2rem; font-weight: 700; color: var(--prod-accent); margin-bottom: 24px;">SUMMER HUB</div>
                
                <a href="https://docs.google.com/spreadsheets/d/1si2c5ahcv-MxEjdCnCVAq7QULCkY4I6Wj-JR7zKhFFg/edit?usp=sharing" target="_blank" class="sidebar-button">
                    📊 Open Master Schedule<br>
                    <span style="font-size:0.7rem; font-weight:400; opacity:0.8;">(Google Sheet Sync)</span>
                </a>

                <div class="stats-card">
                    <div class="stats-title">Current Status</div>
                    <div class="stats-value" style="font-size:1.1rem;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                    <div style="font-size:0.8rem; opacity:0.7; margin-top:4px;">${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>

                <div class="stats-card">
                    <div class="stats-title">Vital Stats</div>
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
                        <div>
                            <div style="font-size:0.7rem; opacity:0.6;">Scenes</div>
                            <div style="font-size:1.1rem; font-weight:600;">${totalScenes}</div>
                        </div>
                        <div>
                            <div style="font-size:0.7rem; opacity:0.6;">Days</div>
                            <div style="font-size:1.1rem; font-weight:600;">${totalDays}</div>
                        </div>
                    </div>
                </div>

                <div class="sidebar-nav-title">Timeline</div>
                ${sidebarDaysHtml}

                <div class="sidebar-nav-title">Cast</div>
                <a href="#" class="sidebar-link" onclick="filterByActor('')">Show All</a>
                ${sidebarActorsHtml}

                <div class="sidebar-nav-title">Locations</div>
                <a href="#" class="sidebar-link" onclick="filterByLocation('')">Show All</a>
                ${sidebarLocationsHtml}

                <div style="margin-top:auto; padding-top:20px; font-size:0.75rem; opacity:0.5;">
                    Last Compiled:<br>${new Date().toLocaleString()}
                </div>
            </aside>

            <main class="main-content">
                <header style="margin-bottom: 40px;">
                    <h1 style="margin: 0; font-size: 2.5rem; color: #fff;">Production Dashboard</h1>
                    <p style="opacity: 0.7;">Creatures in the Tall Grass — Official Breakdown</p>
                </header>

                <section id="breakdown">
                    <table class="production-table">
                        <thead>
                            <tr>
                                <th style="width: 60px;">ID</th>
                                <th style="width: 200px;">Scene Name</th>
                                <th style="width: 180px;">Location</th>
                                <th style="width: 100px;">Time</th>
                                <th style="width: 80px;">Dur.</th>
                                <th style="width: 80px;">Act</th>
                                <th style="width: 80px;">Day</th>
                                <th>Elements & Action</th>
                                <th style="width: 200px;">Notes</th>
                            </tr>
                        </thead>
                        <tbody id="production-body">
                            ${breakdownRowsHtml}
                        </tbody>
                    </table>
                </section>
            </main>
        </div>

        <script>
            function filterByActor(actor) {
                const rows = document.querySelectorAll('#production-body tr:not(.day-divider-row)');
                rows.forEach(row => {
                    if (!actor) {
                        row.style.display = '';
                    } else {
                        const chips = row.querySelectorAll('.actor-chip');
                        let found = false;
                        chips.forEach(c => { if(c.textContent === actor) found = true; });
                        row.style.display = found ? '' : 'none';
                    }
                });
            }

            function filterByLocation(loc) {
                const rows = document.querySelectorAll('#production-body tr:not(.day-divider-row)');
                rows.forEach(row => {
                    if (!loc) {
                        row.style.display = '';
                    } else {
                        const tag = row.querySelector('.location-tag').textContent;
                        row.style.display = tag === loc ? '' : 'none';
                    }
                });
            }
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

  const html = generateFullHtml(rows, actRangesList, locationRows, totalMin, totalDays, productionData);
  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`✓ Created ${path.relative(ROOT, OUTPUT_HTML)}`);
}

if (require.main === module) {
  compile();
}

module.exports = { compile, buildProductionRows, loadManifest, loadProductionData };
