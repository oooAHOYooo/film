#!/usr/bin/env node

/**
 * Shooting Production Compiler
 * Generates call sheets for the shooting script version
 * Reads from shooting/script-system/ and generates to shooting/production/
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..', '..');
const SCRIPT_SYSTEM = path.join(__dirname, 'script-system');
const SCENES_DIR = path.join(SCRIPT_SYSTEM, 'scenes');
const MANIFEST_PATH = path.join(SCRIPT_SYSTEM, 'manifest.json');
const PLOT_CARDS_PATH = path.join(SCRIPT_SYSTEM, 'plot-cards-data.json');
const PRODUCTION_DATA_PATH = path.join(__dirname, 'production-data.json');
const OUTPUT_HTML = path.join(__dirname, 'shooting_production.html');
const PRODUCTION_DIR = path.join(__dirname, 'production');
const CAST_DIR = path.join(PRODUCTION_DIR, 'cast');
const DAYS_DIR = path.join(PRODUCTION_DIR, 'days');

function ensureDirectoryExistence(filePath) {
  const dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
}

function loadManifest() {
  const raw = fs.readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

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
  let currentTotal = 0;
  const chronoOffset = productionData.settings?.chronologicalStartDay ? productionData.settings.chronologicalStartDay - 1 : 0;

  scenes.forEach((scene, index) => {
    const card = useGallery ? plotCards[index] : null;
    const n = card ? card.n : index + 1;
    const fileId = scene.file ? scene.file.replace('.md', '') : `s${String(n).padStart(2, '0')}`;
    const id = scene.id || scene.nickname || `scene-${n}`;
    const title = card ? card.title : (scene.title || nicknameToTitle(scene.nickname || scene.id) || `Scene ${n}`);
    const act = card ? (card.act ?? 0) : (scene.act || 0);
    const actTitle = card ? (card.actTitle || '') : (scene.actTitle || '');
    const content = loadScene(scene.file);
    const { location: parsedLocation, time: parsedTime } = parseSceneHeading(content);
    const characters = extractCharacters(content);
    if (characters.length === 0 && /\b[Dd]allas\b/.test(content)) {
        characters.push('DALLAS');
    }
    const data = productionData[id] || (scene.file ? productionData[scene.file.replace('.md', '').toLowerCase()] : {}) || {};
    const location = data.location != null && data.location !== '' ? data.location : parsedLocation;
    const time = data.time != null && data.time !== '' ? data.time : parsedTime;
    const durationMin = data.durationMin;
    const shootDays = data.shootDays;
    const pickup = !!data.pickup;
    const keyElements = data.keyElements || '';
    const productionNotes = data.productionNotes || '';

    let scheduledDays = [];
    if (data.assignedDay) {
        scheduledDays = Array.isArray(data.assignedDay) ? data.assignedDay : [data.assignedDay];
    } else if (Number(shootDays) > 0) {
        const startDay = Math.ceil(currentTotal + 0.001) || 1;
        currentTotal += Number(shootDays);
        const endDay = Math.ceil(currentTotal);
        for (let i = startDay; i <= endDay; i++) {
            scheduledDays.push(i + chronoOffset);
        }
    }

    rows.push({
      n,
      fileId,
      id,
      title,
      location,
      time,
      durationMin,
      shootDays,
      pickup,
      keyElements,
      productionNotes,
      props: data.props || [],
      wardrobe: data.wardrobe || [],
      act,
      actTitle,
      characters,
      scheduledDays,
      content
    });
  });
  return rows;
}

function extractCharacters(content) {
  if (!content || typeof content !== 'string') return [];
  // Look for uppercase names at start of line (allows periods for names like MR. MIKE, PAT CLENDENEN)
  const charRegex = /^[ \t]*([A-Z]{2,}\.?(?:\s+[A-Z]{2,}\.?)*)(?:\s*\(.*?\))?\s*$/gm;
  const matches = content.matchAll(charRegex);
  const chars = new Set();
  for (const match of matches) {
    const raw = match[1].trim();
    // Normalize: remove trailing periods, collapse "MR." to "MR" so MR. MIKE and MR MIKE merge
    const name = raw.replace(/\.(\s)/g, '$1').replace(/\.\s*$/, '').trim();
    if (name && !/^(INT|EXT|FADE|CUT|DISSOLVE|ACT|SCENE|DAY|NIGHT)\b/i.test(name)) {
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

function getDayConfig(dateStr) {
    if (!dateStr) return { color: '#8b949e', icon: '', class: 'day-none' };
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const configs = [
        { name: 'Sunday',    icon: 'Su', color: '#000', class: 'day-sun' },
        { name: 'Monday',    icon: 'M',  color: '#000', class: 'day-mon' },
        { name: 'Tuesday',   icon: 'T',  color: '#000', class: 'day-tue' },
        { name: 'Wednesday', icon: 'W',  color: '#000', class: 'day-wed' },
        { name: 'Thursday',  icon: 'Th', color: '#000', class: 'day-thu' },
        { name: 'Friday',    icon: 'F',  color: '#000', class: 'day-fri' },
        { name: 'Saturday',  icon: 'Sa', color: '#000', class: 'day-sat' }
    ];
    return configs[day];
}

function totalShootDays(rows) {
  return Math.max(...rows.flatMap(r => r.scheduledDays || []), 0);
}

function totalDurationMin(rows) {
  const sum = rows.reduce((acc, r) => acc + (Number(r.durationMin) || 0), 0);
  return sum;
}

function getProductionStyles() {
  return `            :root {
                --prod-accent: #000;
                --prod-head: #f5f5f5;
                --prod-border: #ccc;
                --prod-tag-bg: #f9f9f9;
                --prod-tag-border: #bbb;
                --prod-row-hover: #f5f5f5;
                --sidebar-w: 260px;
            }
            body {
                margin: 0;
                display: block;
                min-height: 100vh;
                overflow-y: auto;
                background: #fff;
                color: #111;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
            }
            .dashboard-container {
                display: block;
                overflow: hidden;
            }
            .brand-title {
                font-family: "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
                font-size: 1rem;
                font-weight: 700;
                line-height: 1.15;
                letter-spacing: 0.02em;
                color: #111;
            }
            .brand-title-main {
                font-size: 2.05rem;
                line-height: 1.02;
            }
            .main-content {
                flex: 1;
                overflow-y: auto;
                padding: 40px;
                scroll-behavior: smooth;
                position: relative;
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
`;
}

function generateFullHtml(rows, totalDays, productionData) {
  const totalScenes = rows.length;

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Dashboard — Shooting Script — Summer Production</title>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <style>
            ${getProductionStyles()}
        </style>
    </head>
    <body>
        <div class="dashboard-container">
            <main class="main-content">
                <header style="margin: 8px 0 40px 0; padding-left: 54px;">
                    <h1 class="brand-title brand-title-main" style="margin: 0; color: #111;">Creatures in the Tall Grass</h1>
                    <p style="opacity: 0.7; margin: 8px 0 0 0;">Production Dashboard · Shooting Script Version</p>
                    <p style="opacity: 0.5; margin: 8px 0 0 0; font-size: 0.9rem;">Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
                </header>

                <section style="margin-bottom: 40px;">
                  <div style="padding: 16px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; color: #856404;">
                    <strong>Shooting Script Version</strong><br>
                    This is the alternate shooting script where Dallas is driven by audio signals and research, not pet-sitting. Call sheets are tailored to this version's scenes.
                  </div>
                </section>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 16px; margin-bottom: 40px;">
                  <div class="stats-card">
                    <div class="stats-title">Total Scenes</div>
                    <div class="stats-value">${totalScenes}</div>
                  </div>
                  <div class="stats-card">
                    <div class="stats-title">Shooting Days</div>
                    <div class="stats-value">${totalDays}</div>
                  </div>
                </div>

                <section style="margin-bottom: 40px;">
                  <h2 style="color: #111; margin: 0 0 20px 0; font-size: 1.5rem;">Call Sheets</h2>
                  <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">
`;

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    html += `
                    <div class="stats-card" style="cursor: pointer;" onclick="window.location.href='production/days/${dayNum}.html'">
                      <div style="font-weight: 700; color: #111; margin-bottom: 12px; font-size: 1.1rem;">Day ${dayNum}</div>
                      <a href="production/days/${dayNum}.html" style="color: #0366d6; text-decoration: none; font-weight: 600;">View Call Sheet →</a>
                    </div>
`;
  }

  html += `
                  </div>
                </section>
            </main>
        </div>
    </body>
</html>
`;

  return html;
}

function generateDayHtml(dayNum, rows, productionData) {
  const calendar = productionData.calendar || {};
  const dateStr = calendar[dayNum] || '—';
  const holidays = productionData.holidays || {};
  const holiday = holidays[dateStr];

  const sortedDays = Object.keys(calendar).map(Number).sort((a,b) => a - b);
  const currentIndex = sortedDays.indexOf(Number(dayNum));
  const prevDay = currentIndex > 0 ? sortedDays[currentIndex - 1] : null;
  const nextDay = currentIndex >= 0 && currentIndex < sortedDays.length - 1 ? sortedDays[currentIndex + 1] : null;

  const shootPlan = Array.isArray(productionData.shootPlan) ? productionData.shootPlan : [];
  const planEntry = shootPlan.find((entry) => Number(entry.day) === Number(dayNum));
  const totalShootDays = shootPlan.filter((entry) => !entry.special).length || Object.keys(calendar).length;

  const unique = (items) => Array.from(new Set((items || []).filter(Boolean)));
  const sceneIds = planEntry && Array.isArray(planEntry.scenes) && planEntry.scenes.length
    ? unique(planEntry.scenes)
    : unique(rows.filter((r) => r.scheduledDays && r.scheduledDays.includes(dayNum)).map((r) => r.fileId));
  const dayRows = sceneIds
    .map((sceneId) => rows.find((r) => r.id === sceneId || r.fileId.toLowerCase() === String(sceneId).toLowerCase() || String(r.n).toLowerCase() === String(sceneId).toLowerCase()))
    .filter(Boolean);
  const summaryLocations = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'locations')
    ? unique(Array.isArray(planEntry.locations) ? planEntry.locations : [planEntry.locations])
    : unique(dayRows.map((r) => r.location || '').filter((loc) => loc && loc !== '—'));
  const summaryCast = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'cast')
    ? unique(Array.isArray(planEntry.cast) ? planEntry.cast : [planEntry.cast])
    : unique(dayRows.flatMap((r) => r.characters || []));

  const summaryProps = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'props')
    ? (Array.isArray(planEntry.props) ? planEntry.props : [planEntry.props])
    : unique(dayRows.flatMap((r) => r.props || []));

  const summaryWardrobe = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'wardrobe')
    ? (Array.isArray(planEntry.wardrobe) ? planEntry.wardrobe : [planEntry.wardrobe])
    : unique(dayRows.flatMap((r) => r.wardrobe || []));

  const summaryEquipment = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'equipment')
    ? (Array.isArray(planEntry.equipment) ? planEntry.equipment : [planEntry.equipment])
    : unique(dayRows.flatMap((r) => r.equipment || []));

  const summaryLocationDetails = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'locationDetails')
    ? (Array.isArray(planEntry.locationDetails) ? planEntry.locationDetails : [planEntry.locationDetails])
    : unique(dayRows.flatMap((r) => r.locationDetails || []));

  const dayLabel = planEntry ? `Day ${planEntry.day}` : `Day ${dayNum}`;
  const sourceNote = planEntry && planEntry.sourceNote ? planEntry.sourceNote : '';
  const crewCall = planEntry && planEntry.crewCall ? planEntry.crewCall : 'GENERAL CREW CALL: 08:00 AM';

  function extractSceneSnippet(content, n) {
    if (!content || typeof content !== 'string') return '';
    let text = content;
    const regex = new RegExp(`##s0*${n}\\b`, 'i');
    const match = content.match(regex);
    if (match) {
      const index = match.index + match[0].length;
      const nextMatch = content.slice(index).match(/##s\d+\b/i);
      text = nextMatch ? content.slice(index, index + nextMatch.index) : content.slice(index);
    }

    let clean = text
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/^##.*$/gm, '')
      .replace(/^(INT\.|EXT\.)\s.*$/gm, '')
      .trim();
    const lines = clean.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const l of lines) {
      if (l.length > 15 && l !== l.toUpperCase()) {
        return l.length > 120 ? l.slice(0, 117) + '...' : l;
      }
    }
    return '';
  }

  const sceneRows = dayRows.map(r => {
    const chars = (r.characters || []).join(', ');
    const snippet = extractSceneSnippet(r.content, r.fileId);
    return `
      <tr>
        <td>${r.fileId}</td>
        <td>${escapeHtml(r.time || '—')}</td>
        <td>
          <div style="font-weight: 700; color: black;">${escapeHtml(r.title)}</div>
          ${snippet ? `<div style="font-size:0.75rem; color:#666; margin-top:4px; line-height:1.3; font-style: italic;">${escapeHtml(snippet)}</div>` : ''}
        </td>
        <td>${chars || '—'}</td>
      </tr>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Day ${dayNum} — Call Sheet — Shooting Script</title>
        <style>
            ${getProductionStyles()}
            .main-content { padding: 40px; margin: 0 auto; max-width: 1000px; box-sizing: border-box; }
            .callsheet-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                border-bottom: 3px solid black;
                padding-bottom: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
                gap: 12px;
            }
            .production-table { background: transparent; border: none; width: 100%; border-collapse: collapse; }
            .production-table th { background: transparent; color: black !important; border-bottom: 2px solid black; font-weight: 700; text-align: left; padding: 8px; }
            .production-table td { border-bottom: 1px solid #eee; padding: 12px 8px; color: black; vertical-align: top; }

            @media (max-width: 768px) {
                .main-content { padding: 15px; }
                .callsheet-header {
                    flex-direction: column;
                    align-items: flex-start;
                    border-bottom-width: 2px;
                }
                .callsheet-header div:last-child {
                    text-align: left !important;
                }
                .production-table {
                    display: block;
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
            }
        </style>
    </head>
    <body style="background:white; color:black;">
        <div class="main-content">
            <div class="no-print" style="display:flex; justify-content:space-between; margin-bottom:10px; font-size:0.7rem; text-transform:uppercase; font-weight:700; background:#f0f0f0; padding:6px 12px; border-radius:4px;">
                ${prevDay ? `<a href="${prevDay}.html" style="color:#0366d6; text-decoration:none;">&larr; Day ${prevDay}</a>` : `<span></span>`}
                <a href="../../shooting_production.html" style="color:#666; text-decoration:none;">Dashboard</a>
                ${nextDay ? `<a href="${nextDay}.html" style="color:#0366d6; text-decoration:none;">Day ${nextDay} &rarr;</a>` : `<span></span>`}
            </div>
            <header class="callsheet-header">
                <div>
                    <h1 style="margin:0;">DAILY CALL SHEET</h1>
                    <h2 style="margin:0; font-size:1.5rem;">${dayLabel} of ${totalShootDays}</h2>
                    <p style="margin:4px 0 0 0; font-size:0.85rem; opacity:0.6;">Shooting Script Version</p>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700;">${getDayName(dateStr).toUpperCase()}</div>
                    <div style="font-size:1.2rem;">${formatDate(dateStr)}</div>
                    ${holiday ? `<div style="color:red; font-weight:700;">${holiday}</div>` : ''}
                </div>
            </header>

            <section style="margin-bottom:18px; padding:14px; border:1px solid #ddd; border-radius:8px; background:#fafafa;">
                <div style="font-size:0.72rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#666; margin-bottom:8px;">Shoot Plan Summary</div>
                ${sourceNote ? `<div style="font-size:0.9rem; font-family: ui-monospace, monospace; margin-bottom:10px;">${escapeHtml(sourceNote)}</div>` : ''}
                <div style="display:grid; gap:10px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
                    <div><div style="font-size:0.7rem; text-transform:uppercase; color:#666; font-weight:700;">Number of Scenes</div><div style="font-size:0.95rem;">${sceneIds.length}</div></div>
                    <div><div style="font-size:0.7rem; text-transform:uppercase; color:#666; font-weight:700;">Estimated Length of Day</div><div style="font-size:0.95rem;">${(() => {
                        const totalMin = dayRows.reduce((sum, r) => sum + (Number(r.durationMin) || 0), 0);
                        if (totalMin === 0) return 'TBD';
                        const h = Math.floor(totalMin/60);
                        const m = totalMin % 60;
                        return (h > 0 ? h + 'h ' : '') + (m > 0 || h === 0 ? m + 'm' : '').trim();
                    })()}</div></div>
                </div>
            </section>

            <section style="margin-bottom:30px;">
                <h3 style="background:black; color:white; padding:5px 10px; margin:0;">${escapeHtml(crewCall)}</h3>
            </section>

            <h3 style="margin:20px 0 10px 0; border-bottom:1px solid black;">SCENE SCHEDULE</h3>
            <table class="production-table" style="background:white; border-color:black;">
                <thead>
                    <tr style="background:#eee;">
                        <th style="color:black;border-color:black;">SCENE</th>
                        <th style="color:black;border-color:black;">TIME TO START</th>
                        <th style="color:black;border-color:black;">DESCRIPTION</th>
                        <th style="color:black;border-color:black;">CAST</th>
                    </tr>
                </thead>
                <tbody style="color:black;">
                    ${sceneRows}
                </tbody>
            </table>

            <section style="margin-top:20px; display:flex; flex-direction:column; gap:20px;">
                <div style="padding:14px; border:2px solid black; border-radius:8px; background:transparent;">
                    <h3 style="margin:0 0 10px 0; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px; color: black;">PROPS</h3>
                    <div style="font-size:0.9rem; min-height:60px; white-space: pre-wrap;">${summaryProps.length > 0 ? summaryProps.map(p => `<div style="margin-bottom: 4px;">☐ ${escapeHtml(p)}</div>`).join('') : '<div style="color:#999; font-style:italic;">No props listed for this day.</div>'}</div>
                </div>
                <div style="padding:14px; border:2px solid black; border-radius:8px; background:transparent;">
                    <h3 style="margin:0 0 10px 0; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px; color: black;">EQUIPMENT</h3>
                    <div style="font-size:0.9rem; min-height:60px; white-space: pre-wrap;">${summaryEquipment.length > 0 ? summaryEquipment.map(e => `<div style="margin-bottom: 4px;">${escapeHtml(e)}</div>`).join('') : '<div style="color:#999; font-style:italic;">No equipment listed for this day.</div>'}</div>
                </div>
                <div style="padding:14px; border:2px solid black; border-radius:8px; background:transparent;">
                    <h3 style="margin:0 0 10px 0; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px; color: black;">LOCATION DETAILS</h3>
                    <div style="font-size:0.9rem;">${summaryLocationDetails.length > 0 ? summaryLocationDetails.map(l => `<div>${escapeHtml(l)}</div>`).join('') : '<div style="color:#999; font-style:italic;">Location details TBD</div>'}</div>
                </div>
            </section>
        </div>
    </body>
</html>`;
}

function compile() {
  console.log('Loading shooting script manifest...');
  const scenes = loadManifest();
  console.log(`Found ${scenes.length} scenes`);
  const plotCards = loadPlotCardsData();
  const productionData = loadProductionData();
  const rows = buildProductionRows(scenes, productionData, plotCards);
  const totalDays = totalShootDays(rows);

  console.log(`Total shooting days: ${totalDays}`);

  let html = generateFullHtml(rows, totalDays, productionData);

  ensureDirectoryExistence(path.join(DAYS_DIR, 'dummy.html'));

  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`✓ Created ${path.relative(ROOT, OUTPUT_HTML)}`);

  // Generate Daily Call Sheets
  const calendar = productionData.calendar || {};
  Object.keys(calendar).forEach(dayNum => {
    const dayHtml = generateDayHtml(Number(dayNum), rows, productionData);
    const dayPath = path.join(DAYS_DIR, `${dayNum}.html`);
    fs.writeFileSync(dayPath, dayHtml, 'utf8');
    console.log(`  ✓ Generated Day ${dayNum} Call Sheet`);
  });
}

if (require.main === module) {
  compile();
}

module.exports = { compile };
