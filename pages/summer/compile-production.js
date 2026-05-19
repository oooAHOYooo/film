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
  let currentTotal = 0;
  const chronoOffset = productionData.settings?.chronologicalStartDay ? productionData.settings.chronologicalStartDay - 1 : 0;

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
  return Math.max(...rows.flatMap(r => r.scheduledDays || []), 0);
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

function getDayConfig(dateStr) {
    if (!dateStr) return { color: '#8b949e', icon: '', class: 'day-none' };
    const date = new Date(dateStr + 'T12:00:00');
    const day = date.getDay(); // 0 (Sun) to 6 (Sat)
    const configs = [
        { name: 'Sunday',    icon: '☀️', color: '#0ea5e9', class: 'day-sun' },
        { name: 'Monday',    icon: 'M',  color: '#6366f1', class: 'day-mon' },
        { name: 'Tuesday',   icon: 'T',  color: '#10b981', class: 'day-tue' },
        { name: 'Wednesday', icon: 'W',  color: '#8b5cf6', class: 'day-wed' },
        { name: 'Thursday',  icon: 'T',  color: '#f59e0b', class: 'day-thu' },
        { name: 'Friday',    icon: 'F',  color: '#f43f5e', class: 'day-fri' },
        { name: 'Saturday',  icon: '🌟', color: '#eab308', class: 'day-sat' }
    ];
    return configs[day];
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
                display: block; 
                min-height: 100vh; 
                overflow-y: auto; 
                background: #0d1117;
                color: #c9d1d9;
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
                color: #f5f7fb;
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
            .quick-menu-btn {
                position: sticky;
                top: 18px;
                left: 0;
                width: 36px;
                height: 36px;
                border-radius: 10px;
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,255,255,0.08);
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: #c9d1d9;
                cursor: pointer;
                transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
                z-index: 30;
            }
            .quick-menu-btn:hover {
                background: rgba(121,184,255,0.12);
                border-color: rgba(121,184,255,0.28);
                color: #fff;
            }
            .quick-menu-btn svg {
                width: 17px;
                height: 17px;
            }
            .quick-menu {
                position: fixed;
                top: 18px;
                left: 18px;
                width: 240px;
                max-width: calc(100vw - 24px);
                background: #161b22;
                border: 1px solid var(--prod-border);
                border-radius: 14px;
                padding: 14px;
                box-shadow: 0 18px 40px rgba(0,0,0,0.38);
                z-index: 998;
                display: none;
                max-height: calc(100vh - 36px);
                overflow-y: auto;
                box-sizing: border-box;
            }
            .quick-menu.open {
                display: block;
            }
            .quick-menu-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 10px;
            }
            .quick-menu .brand-title {
                margin: 0;
            }
            .quick-menu-close {
                width: 26px;
                height: 26px;
                border: none;
                border-radius: 8px;
                background: rgba(255,255,255,0.05);
                color: #c9d1d9;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                line-height: 1;
                padding: 0;
            }
            .quick-menu-close:hover {
                background: rgba(121,184,255,0.12);
                color: #fff;
            }
            .quick-menu a {
                display: block;
                color: #fff;
                text-decoration: none;
                padding: 10px 12px;
                border-radius: 8px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.06);
                margin-bottom: 8px;
                font-size: 0.88rem;
            }
            .quick-menu a:hover {
                background: rgba(121,184,255,0.12);
                border-color: rgba(121,184,255,0.28);
            }
            .quick-menu .quick-meta {
                margin-top: 10px;
                font-size: 0.72rem;
                color: rgba(255,255,255,0.56);
                line-height: 1.4;
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
                text-decoration: none;
                transition: transform 0.1s, filter 0.1s;
                cursor: pointer;
            }
            .actor-chip:hover {
                transform: translateY(-1px);
                filter: brightness(1.2);
            }
            .actor-chip[data-character="dallas"] { color: #eab308; border-color: rgba(234, 179, 8, 0.3); background: rgba(234, 179, 8, 0.15); }
            .actor-chip[data-character="makayla"] { color: #ec4899; border-color: rgba(236, 72, 153, 0.3); background: rgba(236, 72, 153, 0.15); }
            .actor-chip[data-character="dominic"] { color: #10b981; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.15); }
            .actor-chip[data-character="asher"] { color: #f59e0b; border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.15); }
            .actor-chip[data-character="janice"] { color: #8b5cf6; border-color: rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.15); }
            .actor-chip[data-character="mr-mike"] { color: #6366f1; border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.15); }
            .actor-chip[data-character="howie"] { color: #14b8a6; border-color: rgba(20, 184, 166, 0.3); background: rgba(20, 184, 166, 0.15); }
            .actor-chip[data-character="pat"] { color: #f43f5e; border-color: rgba(244, 63, 94, 0.3); background: rgba(244, 63, 94, 0.15); }
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
            .day-badge {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                border-radius: 6px;
                font-size: 0.7rem;
                font-weight: 800;
                margin-right: 8px;
                color: #fff;
                background: rgba(255,255,255,0.1);
            }
            .day-sun { background: rgba(14, 165, 233, 0.2); color: #0ea5e9; border: 1px solid rgba(14, 165, 233, 0.4); }
            .day-mon { background: rgba(99, 102, 241, 0.2); color: #6366f1; border: 1px solid rgba(99, 102, 241, 0.4); }
            .day-tue { background: rgba(16, 185, 129, 0.2); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.4); }
            .day-wed { background: rgba(139, 92, 246, 0.2); color: #8b5cf6; border: 1px solid rgba(139, 92, 246, 0.4); }
            .day-thu { background: rgba(245, 158, 11, 0.2); color: #f59e0b; border: 1px solid rgba(245, 158, 11, 0.4); }
            .day-fri { background: rgba(244, 63, 94, 0.2); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.4); }
            .day-sat { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid rgba(234, 179, 8, 0.4); }
            
            .day-filter-bar {
                display: flex;
                gap: 8px;
                margin-bottom: 24px;
                flex-wrap: wrap;
                background: rgba(255,255,255,0.03);
                padding: 12px;
                border-radius: 8px;
                border: 1px solid rgba(255,255,255,0.05);
            }
            .filter-btn {
                background: #21262d;
                border: 1px solid var(--prod-border);
                color: #8b949e;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.75rem;
                cursor: pointer;
                transition: all 0.2s;
            }
            .filter-btn:hover {
                background: #30363d;
                border-color: var(--prod-accent);
                color: #fff;
            }
            .filter-btn.active {
                background: var(--prod-accent);
                color: #0d1117;
                border-color: var(--prod-accent);
                font-weight: 700;
            }

            .compact-list {
                max-width: 800px;
                margin-bottom: 50px;
                display: none; /* Hidden by default, toggled via script if we add one, or just shown for now */
            }
            .compact-item {
                display: flex;
                align-items: center;
                padding: 10px 16px;
                background: #161b22;
                border: 1px solid var(--prod-border);
                border-radius: 6px;
                margin-bottom: 8px;
                transition: transform 0.2s;
            }
            .compact-item:hover {
                transform: translateX(4px);
                border-color: var(--prod-accent);
            }
            .compact-date {
                font-size: 0.75rem;
                opacity: 0.6;
                width: 100px;
            }
            .compact-title {
                flex: 1;
                font-weight: 600;
                font-size: 0.9rem;
            }
            .compact-scenes {
                font-family: ui-monospace, monospace;
                font-size: 0.75rem;
                opacity: 0.5;
                margin-left: 20px;
            }
            .shoot-plan {
                margin-bottom: 50px;
            }
            .shoot-plan-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 14px;
            }
            .shoot-plan-card {
                background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015));
                border: 1px solid var(--prod-border);
                border-radius: 12px;
                padding: 14px;
                box-shadow: 0 10px 24px rgba(0,0,0,0.18);
                transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
                cursor: pointer;
            }
            .shoot-plan-card:hover {
                transform: translateY(-2px);
                border-color: rgba(121, 184, 255, 0.45);
                box-shadow: 0 14px 28px rgba(0,0,0,0.24);
            }
            .shoot-plan-card.special {
                border-color: rgba(234, 179, 8, 0.35);
                background: linear-gradient(180deg, rgba(234,179,8,0.08), rgba(255,255,255,0.015));
            }
            .shoot-plan-head {
                display: flex;
                align-items: flex-start;
                justify-content: space-between;
                gap: 12px;
                margin-bottom: 10px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            }
            .shoot-plan-title {
                font-weight: 800;
                color: #fff;
                line-height: 1.1;
            }
            .shoot-plan-date {
                font-size: 0.82rem;
                color: var(--prod-accent);
                margin-top: 4px;
            }
            .shoot-plan-note {
                font-family: ui-monospace, monospace;
                font-size: 0.74rem;
                line-height: 1.35;
                color: #c9d1d9;
                margin-bottom: 10px;
                opacity: 0.9;
            }
            .shoot-plan-label {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                border-radius: 999px;
                padding: 3px 8px;
                font-size: 0.68rem;
                letter-spacing: 0.05em;
                font-weight: 700;
                text-transform: uppercase;
                color: #0d1117;
                background: var(--prod-accent);
            }
            .shoot-plan-chip-row {
                display: flex;
                flex-wrap: wrap;
                gap: 4px;
                margin-top: 6px;
            }
            .shoot-plan-block {
                margin-top: 10px;
                font-size: 0.83rem;
                line-height: 1.45;
            }
            .shoot-plan-block strong {
                display: block;
                margin-bottom: 4px;
                font-size: 0.65rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                color: #8b949e;
            }

            .mobile-header {
                display: none;
                background: #161b22;
                border-bottom: 1px solid var(--prod-border);
                padding: 10px 16px;
                justify-content: space-between;
                align-items: center;
                position: sticky;
                top: 0;
                z-index: 1000;
            }
            .mobile-title {
                font-size: 0.95rem;
                color: #f5f7fb;
            }
            .hamburger-btn {
                background: none;
                border: none;
                color: inherit;
                cursor: pointer;
                outline: none;
                display: flex;
                align-items: center;
                padding: 0;
            }
            @media (max-width: 768px) {
                body {
                    height: auto;
                    overflow: auto;
                }
                .main-content {
                    padding: 20px;
                    overflow-y: visible;
                }
                .brand-title-main {
                    font-size: 1.15rem;
                }
                .quick-menu {
                    top: 58px;
                    left: 12px;
                    max-width: calc(100vw - 24px);
                }
                .production-table {
                    display: block;
                    width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                }
                .production-table th, .production-table td {
                    padding: 8px;
                    font-size: 0.8rem;
                }
                .day-filter-bar {
                    margin-bottom: 16px;
                    padding: 8px;
                }
                .filter-btn {
                    padding: 4px 10px;
                }
                .day-divider {
                    margin: 20px 0 10px 0;
                    padding: 8px 12px;
                    font-size: 0.9rem;
                }
            }

            @media print {
                @page { margin: 0.45in; }
                :root {
                    --prod-accent: #1f4f8a;
                    --prod-head: rgba(31, 79, 138, 0.12);
                    --prod-border: rgba(31, 79, 138, 0.28);
                    --prod-tag-bg: rgba(31, 79, 138, 0.08);
                    --prod-tag-border: rgba(31, 79, 138, 0.22);
                    --prod-row-hover: transparent;
                }
                html, body {
                    background: #fff !important;
                    color: #111 !important;
                    height: auto;
                    overflow: visible;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .quick-menu, .nav-bar, .back-to-top, .mobile-header, .day-filter-bar,
                .filter-btn, .hamburger-btn, .quick-menu-btn,
                .stats-dropdown summary, .stats-dropdown-content .stat-row, .no-print {
                    display: none !important;
                }
                .main-content {
                    padding: 0;
                    overflow: visible;
                }
                .stats-card, .production-table, .day-divider, .stats-dropdown-content {
                    background: #fff !important;
                    color: #111 !important;
                }
                .stats-card, .production-table, .day-divider, .stats-dropdown,
                .stats-dropdown-content, .sidebar-link {
                    border-color: #c7d0db !important;
                }
                .stats-card {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                .day-divider {
                    color: var(--prod-accent) !important;
                    border-left-color: var(--prod-accent) !important;
                    border-bottom: 1px solid #c7d0db;
                }
                .production-table {
                    border: 1px solid #c7d0db;
                }
                .production-table th {
                    background: #f3f6fa !important;
                    color: #111 !important;
                    border-bottom: 2px solid #c7d0db !important;
                    position: static;
                }
                .production-table td {
                    border-bottom: 1px solid #e5eaf0 !important;
                    color: #111 !important;
                }
                .main-content * {
                    color: #111 !important;
                    background-image: none !important;
                    text-shadow: none !important;
                    box-shadow: none !important;
                }
                .main-content .day-badge,
                .main-content .day-divider,
                .main-content .day-divider *,
                .main-content .stats-value,
                .main-content .actor-chip,
                .main-content .actor-chip * {
                    color: var(--prod-accent) !important;
                }
                .actor-chip {
                    color: #123a66 !important;
                    background: rgba(31, 79, 138, 0.08) !important;
                    border-color: rgba(31, 79, 138, 0.25) !important;
                    box-shadow: none !important;
                    transform: none !important;
                    filter: none !important;
                }
                .day-badge {
                    border-color: currentColor !important;
                    box-shadow: none !important;
                }
                .stats-card, .production-table tr, .production-table td, .production-table th {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                a {
                    color: #123a66 !important;
                    text-decoration: none !important;
                }
                h1, h2, h3, p, span, div {
                    text-shadow: none !important;
                }
            }

            .stats-dropdown {
                width: 100%;
                margin-bottom: 20px;
            }
            .stats-dropdown summary {
                list-style: none;
                background: #1f242c;
                color: #c9d1d9;
                border: 1px solid var(--prod-border);
                border-radius: 6px;
                padding: 10px 12px;
                font-size: 0.9rem;
                cursor: pointer;
                display: flex;
                justify-content: space-between;
                align-items: center;
                transition: border-color 0.2s, background-color 0.2s;
                font-weight: 600;
            }
            .stats-dropdown summary:hover {
                border-color: var(--prod-accent);
                background: #232a34;
            }
            .stats-dropdown summary::-webkit-details-marker {
                display: none;
            }
            .stats-dropdown summary::after {
                content: '▼';
                font-size: 0.7rem;
                opacity: 0.6;
            }
            .stats-dropdown[open] summary::after {
                content: '▲';
            }
            .stats-dropdown[open] summary {
                border-bottom-left-radius: 0;
                border-bottom-right-radius: 0;
                border-bottom-color: transparent;
            }
            .stats-dropdown-content {
                background: rgba(255,255,255,0.02);
                border: 1px solid var(--prod-border);
                border-top: none;
                border-radius: 0 0 6px 6px;
                padding: 12px 16px;
            }
            .stat-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                font-size: 0.85rem;
            }
            .stat-row:last-child {
                border-bottom: none;
            }
            .stat-label {
                opacity: 0.6;
            }
            .stat-val {
                font-weight: 600;
                color: var(--prod-accent);
            }
`;
}

function generateBreakdownRows(rows, calendar, holidays) {
  let html = '';
  let lastDayDivider = 0;

  rows.forEach((r, i) => {
    const minDay = r.scheduledDays && r.scheduledDays.length > 0 ? Math.min(...r.scheduledDays) : null;
    const dateStr = minDay !== null ? calendar[minDay] : null;
    const dayConfig = getDayConfig(dateStr);

    // If scene falls on a new day, insert divider
    if (minDay !== null && minDay > lastDayDivider && !r.pickup) {
      lastDayDivider = minDay;
      const dayName = getDayName(dateStr);
      const formattedDate = formatDate(dateStr);
      const holiday = holidays[dateStr];
      html += `
        <tr class="day-divider-row" data-day-name="${dayConfig.name}">
          <td colspan="9">
            <div class="day-divider" id="day-${minDay}">
              <span style="display:flex; align-items:center;">
                <span class="day-badge ${dayConfig.class}">${dayConfig.icon}</span>
                Day ${minDay} — ${dayName}, ${formattedDate} ${holiday ? `<span style="color:#ff7b72;margin-left:10px;">[${holiday}]</span>` : ''}
              </span>
              <a href="production/days/${minDay}.html" target="_blank" style="color:var(--prod-accent);font-size:0.85rem;text-decoration:none;">📄 View Call Sheet</a>
            </div>
          </td>
        </tr>`;
    }

    const charChips = (r.characters || []).map(c => {
      const slug = c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `<a href="production/cast/${c.toLowerCase()}.html" class="actor-chip" data-character="${slug}" target="_blank">${c}</a>`;
    }).join('');

    html += `
                        <tr id="row-${r.n}" data-day-name="${dayConfig.name}">
                            <td><input type="checkbox" class="sync-check" onclick="document.getElementById('row-${r.n}').classList.toggle('row-dimmed', this.checked)"> <span class="scene-number click-copy" onclick="navigator.clipboard.writeText('${r.n}')">${r.n}</span></td>
                            <td class="scene-name-col"><span class="scene-name click-copy" onclick="navigator.clipboard.writeText('${escapeHtml(r.title)}')">${escapeHtml(r.title)}</span></td>
                            <td><span class="location-tag click-copy" onclick="navigator.clipboard.writeText('${escapeHtml(r.location || '—')}')">${escapeHtml(r.location || '—')}</span></td>
                            <td><span class="time-of-day">${escapeHtml(r.time || '—')}</span></td>
                            <td class="duration-col"><span class="duration">${r.durationMin != null ? r.durationMin + ' min' : '—'}</span></td>
                            <td class="act-col"><span class="act-tag act${r.act}">Act ${r.act}</span></td>
                            <td class="shoot-days-col"><span class="shoot-days">${r.pickup ? 'pickup' : (r.shootDays != null ? r.shootDays : '—')}</span></td>
                            <td class="key-elements">
                                ${r.keyElements ? r.keyElements.replace(/\n/g, ' ').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') : '—'}
                                ${r.characters && r.characters.length === 1 && r.characters[0] === 'DALLAS' ? '<div style="margin-top:8px;"><span style="color:#eab308; background:rgba(234,179,8,0.1); border:1px solid rgba(234,179,8,0.3); padding:2px 6px; border-radius:4px; font-size:0.6rem; letter-spacing:0.05em; font-weight:700;">JUST DALLAS</span></div>' : ''}
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

function generateOverviewListHtml(rows, calendar, totalDays) {
  let html = '<section id="schedule-overview" style="margin-bottom: 50px;">';
  html += '<h2 style="color: #fff; margin: 0 0 20px 0; font-size: 1.5rem; display: flex; align-items: center;">Schedule Overview <span style="font-size: 0.8rem; font-weight: normal; opacity: 0.6; margin-left: 12px; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px;">At a glance</span></h2>';
  html += '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px;">';

  const formatD = (dStr) => {
    if (!dStr) return '';
    const date = new Date(dStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const dayRows = rows.filter(r => r.scheduledDays && r.scheduledDays.includes(dayNum));

    const chars = new Set();
    const locs = new Set();
    const sceneNums = [];
    dayRows.forEach(r => {
      if (r.location && r.location !== '—') locs.add(r.location);
      if (r.characters) r.characters.forEach(c => chars.add(c));
      sceneNums.push('s' + r.n.toString().padStart(2, '0'));
    });

    const dateStr = calendar[dayNum] || '';
    const dayConfig = getDayConfig(dateStr);
    const dayNameStr = getDayName(dateStr);
    const charChips = Array.from(chars).sort().map(c => {
      const slug = c.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      return `<a onclick="event.stopPropagation()" href="production/cast/${c.toLowerCase()}.html" class="actor-chip" data-character="${slug}" target="_blank">${c}</a>`;
    }).join(' ') || '—';
    const locList = Array.from(locs).sort().join('<br>') || '—';
    const scenesList = sceneNums.length > 0 ? sceneNums.join(' + ') : '—';

    const isJustDallas = chars.size === 1 && chars.has('DALLAS');
    const dallasTag = isJustDallas ? '<span style="float: right; margin-right: 10px; margin-top: 2px; color:#eab308; background:rgba(234,179,8,0.1); border:1px solid rgba(234,179,8,0.3); padding:2px 6px; border-radius:4px; font-size:0.6rem; letter-spacing:0.05em; font-weight:700;">JUST DALLAS</span>' : '';

    html += `
      <div class="stats-card" data-day-name="${dayNameStr}" style="margin-bottom: 0; cursor: pointer;" onclick="window.location.href='production/days/${dayNum}.html'">
        <div style="font-weight: 700; color: #fff; margin-bottom: 12px; font-size: 1.1rem; border-bottom: 1px solid var(--prod-border); padding-bottom: 8px; display:flex; align-items:center;">
          <span class="day-badge ${dayConfig.class}" style="width:20px; height:20px; font-size:0.6rem;">${dayConfig.icon}</span>
          Day ${dayNum} <span style="flex:1; color: ${dayConfig.color}; font-weight: 700; font-size: 0.85rem; text-align: right;">${formatD(dateStr)}</span>
          ${dallasTag}
        </div>
        <div style="display: flex; gap: 20px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px;">
          <div>
            <strong style="color: #8b949e; text-transform: uppercase; font-size: 0.6rem; display: block; letter-spacing: 0.05em;">Start Time</strong>
            <span style="font-size: 0.85rem; color: #fff;">—</span>
          </div>
          <div>
            <strong style="color: #8b949e; text-transform: uppercase; font-size: 0.6rem; display: block; letter-spacing: 0.05em;">End Call</strong>
            <span style="font-size: 0.85rem; color: #fff;">—</span>
          </div>
        </div>
        <div style="font-size: 0.85rem; margin-bottom: 12px;">
          <strong style="color: #8b949e; text-transform: uppercase; font-size: 0.7rem; display: block; letter-spacing: 0.05em; margin-bottom: 4px;">Locations</strong>
          <div style="line-height: 1.4;">${locList}</div>
        </div>
        <div style="font-size: 0.85rem;">
          <strong style="color: #8b949e; text-transform: uppercase; font-size: 0.7rem; display: block; letter-spacing: 0.05em; margin-bottom: 4px;">Scenes & Cast</strong>
          <div style="color: #fff; font-family: ui-monospace, monospace; font-size: 0.8rem; margin-bottom: 4px;">${scenesList}</div>
          <div style="line-height: 1.5; margin-top: 6px;">${charChips}</div>
        </div>
      </div>
    `;
  }

  html += '</div></section>';
  return html;
}

function generateCompactListHtml(rows, calendar, totalDays) {
  let html = '<section id="compact-list-view" class="compact-list" style="display: block;">';
  html += '<h2 style="color: #fff; margin: 0 0 20px 0; font-size: 1.5rem;">List View</h2>';

  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const dayRows = rows.filter(r => r.scheduledDays && r.scheduledDays.includes(dayNum));
    const dateStr = calendar[dayNum] || '';
    const dayNameStr = getDayName(dateStr);
    const dayNameShort = dayNameStr.slice(0,3);
    const dayConfig = getDayConfig(dateStr);
    const sceneNums = dayRows.map(r => 's' + r.n.toString().padStart(2, '0')).join(', ');
    
    // Get unique locations for the day
    const locs = Array.from(new Set(dayRows.map(r => r.location).filter(l => l && l !== '—'))).join(', ') || '—';

    html += `
      <div class="compact-item" data-day-name="${dayNameStr}" style="cursor: pointer;" onclick="window.location.href='production/days/${dayNum}.html'">
        <div class="compact-date" style="color: ${dayConfig.color}; font-weight: 700;">${dayNameShort}, ${formatDate(dateStr).split(',')[0]}</div>
        <div class="day-badge ${dayConfig.class}" style="width:18px; height:18px; font-size:0.5rem; margin-right:12px;">${dayConfig.icon}</div>
        <div class="compact-title">Day ${dayNum} — ${locs}</div>
        <div style="display: flex; gap: 12px; margin-right: 20px; opacity: 0.6; font-size: 0.7rem;">
          <span>Start: —</span>
          <span>End: —</span>
        </div>
        <div class="compact-scenes">${sceneNums}</div>
      </div>
    `;
  }

  html += '</section>';
  return html;
}

function generateShootPlanHtml(rows, productionData) {
  const plan = Array.isArray(productionData.shootPlan)
    ? productionData.shootPlan.slice().sort((a, b) => Number(a.day) - Number(b.day))
    : [];

  if (!plan.length) return '';

  const dayRowsFor = (day) => rows.filter((r) => r.scheduledDays && r.scheduledDays.includes(day));
  const unique = (items) => Array.from(new Set(items.filter(Boolean)));
  const toChipRow = (items, label) => {
    if (!items.length) {
      return `<div class="shoot-plan-block"><strong>${label}</strong>—</div>`;
    }
    const chips = items
      .map((item) => `<span class="actor-chip" style="pointer-events:none; cursor:default;">${escapeHtml(item)}</span>`)
      .join('');
    return `<div class="shoot-plan-block"><strong>${label}</strong><div class="shoot-plan-chip-row">${chips}</div></div>`;
  };

  return `
    <section id="shoot-plan" class="shoot-plan">
      <h2 style="color: #fff; margin: 0 0 20px 0; font-size: 1.5rem; display: flex; align-items: center;">Shoot Plan <span style="font-size: 0.8rem; font-weight: normal; opacity: 0.6; margin-left: 12px; background: rgba(255,255,255,0.1); padding: 4px 8px; border-radius: 4px;">16-day source of truth</span></h2>
      <div class="shoot-plan-grid">
        ${(() => {
          const limboIds = Array.isArray(productionData.limbo) ? productionData.limbo : [];
          if (!limboIds.length) return '';
          const limboRows = limboIds.map((id) => rows.find((r) => r.id === id || `s${String(r.n).padStart(2, '0')}`.toLowerCase() === String(id).toLowerCase())).filter(Boolean);
          if (!limboRows.length) return '';
          const chips = limboRows.map((r) => `<span class="actor-chip" style="pointer-events:none; cursor:default; opacity:0.6;">${escapeHtml(`s${String(r.n).padStart(2, '0')} — ${r.title}`)}</span>`).join('');
          return `
            <article class="shoot-plan-card" style="opacity:0.5; border-style:dashed;">
              <div class="shoot-plan-head">
                <div>
                  <div class="shoot-plan-title">Limbo</div>
                  <div class="shoot-plan-date">Unscheduled scenes</div>
                </div>
                <span class="shoot-plan-label" style="background:#6b7280;">Limbo</span>
              </div>
              <div class="shoot-plan-block">
                <strong>Scenes</strong>
                <div class="shoot-plan-chip-row">${chips}</div>
              </div>
            </article>
          `;
        })()}
        ${plan.map((entry) => {
          const dayValue = Number(entry.day);
          const dayRows = Number.isFinite(dayValue) ? dayRowsFor(dayValue) : [];
          const dayName = entry.weekday || getDayName(entry.date);
          const dayConfig = getDayConfig(entry.date);
          const hasExplicitScenes = Object.prototype.hasOwnProperty.call(entry, 'scenes');
          const hasExplicitLocations = Object.prototype.hasOwnProperty.call(entry, 'locations');
          const hasExplicitCast = Object.prototype.hasOwnProperty.call(entry, 'cast');
          const scenes = unique(hasExplicitScenes ? (Array.isArray(entry.scenes) ? entry.scenes : [entry.scenes]) : dayRows.map((r) => `s${String(r.n).padStart(2, '0')}`));
          const locations = unique(hasExplicitLocations ? (Array.isArray(entry.locations) ? entry.locations : [entry.locations]) : dayRows.map((r) => r.location || '').filter((loc) => loc && loc !== '—'));
          const cast = unique(hasExplicitCast ? (Array.isArray(entry.cast) ? entry.cast : [entry.cast]) : dayRows.flatMap((r) => r.characters || []));
          const callSheetHref = `production/days/${String(entry.day)}.html`;
          const manifestForChips = (() => { try { return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch(e) { return []; } })();
          const scenesHtml = scenes.length
            ? scenes.map((scene) => {
                const mEntry = manifestForChips.find(m => (m.file || '').replace('.md','') === scene);
                const href = mEntry && mEntry.id
                  ? `script-system/scene.html?id=${encodeURIComponent(mEntry.id)}`
                  : callSheetHref;
                return `<a href="${href}" target="_blank" class="actor-chip" style="pointer-events:auto; cursor:pointer; margin-right:6px;">${escapeHtml(scene)}</a>`;
              }).join('')
            : '—';
          const locationsText = locations.length ? locations.join(', ') : '—';
          const dateLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          const cardClass = entry.special ? 'shoot-plan-card special' : 'shoot-plan-card';
          const label = entry.special ? 'Note' : 'Shoot';

          return `
            <article class="${cardClass}" data-call-sheet-href="${callSheetHref}" role="link" tabindex="0" aria-label="Open call sheet for Day ${escapeHtml(entry.day)}">
              <div class="shoot-plan-head">
                <div>
                  <div class="shoot-plan-title">Day ${escapeHtml(entry.day)}</div>
                  <div class="shoot-plan-date">${escapeHtml(dayName)}, ${escapeHtml(dateLabel)}</div>
                </div>
                <span class="shoot-plan-label" style="background:${dayConfig.color};">${label}</span>
              </div>
              <div class="shoot-plan-note">${escapeHtml(entry.sourceNote || '')}</div>
              <div class="shoot-plan-block">
                <strong>Scenes</strong>
                <div style="font-family: ui-monospace, monospace;">${scenesHtml}</div>
              </div>
              <div class="shoot-plan-block">
                <strong>Locations</strong>
                <div>${escapeHtml(locationsText)}</div>
              </div>
              ${toChipRow(cast, 'Actors')}
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

const PICKUP_DAYS = 2;

function generateCheatSheetHtml(rows, productionData) {
  const shootPlan = productionData.shootPlan || [];

  const schedule = {};
  for (const day of shootPlan) {
    for (const sid of (day.scenes || [])) {
      schedule[sid] = { day: day.day, date: day.date, weekday: day.weekday };
    }
  }

  let manifest = [];
  try { manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8')); } catch(e) {}

  const weekdayShort = (wd) => wd ? wd.slice(0, 3) : '—';
  const weekdayColor = (wd) => {
    if (!wd) return '#666';
    const w = wd.toLowerCase();
    if (w === 'sunday') return '#f0a500';
    if (w === 'saturday') return '#7ec8a0';
    return '#666';
  };
  const formatDate = (iso) => {
    if (!iso) return '—';
    const [, m, d] = iso.split('-');
    const months = ['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m)]} ${parseInt(d)}`;
  };

  const actColors = { 1: '#4a9eff', 2: '#a78bfa', 3: '#f97316', 4: '#34d399' };
  let lastAct = null;

  const sceneRows = manifest.map((entry) => {
    const sid = entry.file ? entry.file.replace('.md', '') : entry;
    const title = entry.title || sid;
    const act = entry.act || '';
    const info = schedule[sid] || {};
    const dayLink = info.day != null
      ? `<a style="color:#4a9eff;text-decoration:none;" href="production/days/${info.day}.html">${info.day}</a>`
      : '<span style="color:#444;">—</span>';

    let groupRow = '';
    if (act && act !== lastAct) {
      const actTitles = { 1: 'Act 1', 2: 'Act 2', 3: 'Act 3', 4: 'Act 4' };
      groupRow = `<tr><td colspan="5" style="padding:12px 10px 4px;color:${actColors[act] || '#888'};font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;border-bottom:none;">${actTitles[act] || 'Act ' + act}</td></tr>`;
      lastAct = act;
    }

    const sceneHref = entry.id ? `script-system/scene.html?id=${encodeURIComponent(entry.id)}` : null;
    const sceneLink = sceneHref
      ? `<a style="color:#4a9eff;font-weight:bold;text-decoration:none;" href="${sceneHref}">${escapeHtml(sid)}</a>`
      : `<span style="color:#4a9eff;font-weight:bold;">${escapeHtml(sid)}</span>`;
    const titleCell = sceneHref
      ? `<a style="color:#e0e0e0;text-decoration:none;" href="${sceneHref}">${escapeHtml(title)}</a>`
      : escapeHtml(title);

    return groupRow + `<tr style="border-bottom:1px solid #1a1a1a;">
      <td style="white-space:nowrap;padding:5px 10px;border-bottom:1px solid #1a1a1a;">${sceneLink}</td>
      <td style="padding:5px 10px;border-bottom:1px solid #1a1a1a;">${titleCell}</td>
      <td style="color:#fff;white-space:nowrap;padding:5px 10px;border-bottom:1px solid #1a1a1a;">${dayLink}</td>
      <td style="color:#666;font-size:0.8rem;white-space:nowrap;padding:5px 10px;border-bottom:1px solid #1a1a1a;"><span style="color:${weekdayColor(info.weekday)}">${weekdayShort(info.weekday)}</span> ${formatDate(info.date)}</td>
    </tr>`;
  }).join('');

  return `
  <section style="margin-top:48px;">
    <h2 style="color:#fff;margin:0 0 16px 0;font-size:1.2rem;font-family:ui-monospace,monospace;letter-spacing:0.05em;">Scene Cheat Sheet</h2>
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-family:ui-monospace,monospace;font-size:13px;">
        <thead>
          <tr style="color:#555;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;">
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #333;">Scene</th>
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #333;">Title</th>
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #333;">Day</th>
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #333;">Date</th>
          </tr>
        </thead>
        <tbody>${sceneRows}</tbody>
      </table>
    </div>
  </section>`;
}

function generateFullHtml(rows, actRangesList, locationRows, totalMin, totalDays, productionData) {
  const totalScenes = rows.length;
  const pickupSceneCount = rows.filter((r) => r.pickup).length;
  const shootPlanHtml = generateShootPlanHtml(rows, productionData);
  const cheatSheetHtml = generateCheatSheetHtml(rows, productionData);

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
        <button class="quick-menu-btn no-print" onclick="toggleQuickMenu()" aria-label="Open quick menu" style="position: fixed; top: 18px; left: 18px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </button>
        <div class="quick-menu no-print" id="quick-menu">
            <div class="quick-menu-header">
                <div class="brand-title">Creatures in the Tall Grass</div>
                <button class="quick-menu-close" type="button" onclick="toggleQuickMenu()" aria-label="Close quick menu">×</button>
            </div>
            <a href="https://docs.google.com/spreadsheets/d/1si2c5ahcv-MxEjdCnCVAq7QULCkY4I6Wj-JR7zKhFFg/edit?usp=sharing" target="_blank" rel="noreferrer">Open Master Schedule</a>
            <a href="script-system/full_script.html">View Full Script</a>
            <a href="storyboard.html">View Storyboards</a>
            <a href="storyboard-system/full_storyboard.pdf" target="_blank" rel="noreferrer">Full Storyboard PDF</a>
            <div class="quick-meta">
                Scenes: ${totalScenes}<br>
                Shoot days: ${totalDays}<br>
                Last compiled: ${new Date().toLocaleString()}
            </div>
        </div>
        <div class="dashboard-container">
            <main class="main-content">
                <header style="margin: 8px 0 40px 0; padding-left: 54px;">
                    <h1 class="brand-title brand-title-main" style="margin: 0; color: #fff;">Creatures in the Tall Grass</h1>
                    <p style="opacity: 0.7; margin: 8px 0 0 0;">Production Dashboard · Official Shoot Plan</p>
                </header>

                ${cheatSheetHtml}
                ${shootPlanHtml}
            </main>
        </div>

        <script>
            function toggleQuickMenu() {
                const menu = document.getElementById('quick-menu');
                if (menu) menu.classList.toggle('open');
            }

            function init() {
                document.addEventListener('click', (event) => {
                    const menu = document.getElementById('quick-menu');
                    const button = document.querySelector('.quick-menu-btn');
                    if (!menu || !menu.classList.contains('open')) return;
                    if (menu.contains(event.target) || (button && button.contains(event.target))) return;
                    menu.classList.remove('open');
                });

                document.addEventListener('keydown', (event) => {
                    if (event.key === 'Escape') {
                        const menu = document.getElementById('quick-menu');
                        if (menu) menu.classList.remove('open');
                    }
                });

                document.querySelectorAll('.shoot-plan-card[data-call-sheet-href]').forEach((card) => {
                    const href = card.getAttribute('data-call-sheet-href');
                    if (!href) return;

                    const openCallSheet = () => {
                        window.location.href = href;
                    };

                    card.addEventListener('click', (event) => {
                        if (event.target.closest('a, button, select, input, textarea, label')) return;
                        openCallSheet();
                    });

                    card.addEventListener('keydown', (event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            openCallSheet();
                        }
                    });
                });
            }
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', init);
            } else {
                init();
            }
            window.onload = init;
        </script>
    </body>
</html>

`;
}

function generateCastHtml(actor, rows, productionData) {
  const actorRows = rows.filter(r => r.characters.includes(actor));
  const calendar = productionData.calendar || {};
  
  const totalDays = new Set(actorRows.flatMap(r => r.scheduledDays || [])).size;

  const scheduleRows = actorRows.map(r => {
    const dayNum = r.scheduledDays && r.scheduledDays.length > 0 ? r.scheduledDays[0] : '—';
    const dateStr = calendar[dayNum] || '—';
    return `
      <tr>
        <td style="font-weight:700; color:#0366d6; border-bottom:1px solid #eee;">DAY ${dayNum}</td>
        <td style="font-size:0.9rem; opacity:0.8; border-bottom:1px solid #eee;">${formatDate(dateStr)}</td>
        <td style="border-bottom:1px solid #eee;"><span class="scene-number" style="color:black;">${r.n}</span></td>
        <td style="font-style:italic; border-bottom:1px solid #eee;">${escapeHtml(r.title)}</td>
        <td style="border-bottom:1px solid #eee;"><span class="location-tag" style="background:transparent; border-color:#ccc; color:black;">${escapeHtml(r.location || '—')}</span></td>
      </tr>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>Schedule: ${actor} — Summer Production</title>
        <style>
            ${getProductionStyles()}
            body { background: white; color: black; font-family: -apple-system, system-ui, sans-serif; margin:0; padding:0; -webkit-print-color-adjust: exact; }
            .cast-container { max-width: 900px; margin: 40px auto; padding: 0 20px; }
            .cast-header { border-bottom: 3px solid black; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .back-link { color: #0366d6; text-decoration: none; font-size: 0.9rem; margin-bottom: 10px; display: inline-block; }
            .cast-stats { display: flex; gap: 40px; margin-bottom: 30px; }
            .stat-box { border-left: 3px solid black; padding-left: 15px; }
            .stat-label { font-size: 0.75rem; text-transform: uppercase; color: #666; font-weight: 700; }
            .stat-value { font-size: 1.8rem; font-weight: 800; color: black; }
            .print-btn { background: black; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; font-size: 0.9rem; font-weight: 700; transition: opacity 0.2s; }
            .print-btn:hover { opacity: 0.8; }
            .production-table { width: 100%; border-collapse: collapse; background: transparent; border: none; }
            .production-table th { text-align: left; padding: 12px; border-bottom: 2px solid black; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; background: transparent; color: black; }
            .production-table td { padding: 12px; border-bottom: 1px solid #eee; vertical-align: middle; }
            .scene-number { font-weight: 800; font-family: ui-monospace, monospace; }
            @media print {
                .print-btn, .back-link { display: none; }
                .cast-container { margin: 0; max-width: 100%; }
            }
        </style>
    </head>
    <body onload="window.scrollTo(0, 0)">
        <div class="cast-container">
            <a href="../../production.html" class="back-link">← DASHBOARD</a>
            <header class="cast-header">
                <div>
                    <h1 style="margin:0; font-size:2.8rem; font-weight:900; letter-spacing:-0.02em;">${actor.toUpperCase()}</h1>
                    <p style="margin:5px 0 0 0; font-weight:600; text-transform:uppercase; font-size:0.8rem; letter-spacing:0.1em; opacity:0.6;">Production Schedule • Summer Hub</p>
                </div>
                <button class="print-btn" onclick="window.print()">PRINT / SHARE</button>
            </header>

            <div class="cast-stats">
                <div class="stat-box">
                    <div class="stat-label">Shoot Days</div>
                    <div class="stat-value">${totalDays}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Scenes</div>
                    <div class="stat-value">${actorRows.length}</div>
                </div>
            </div>

            <table class="production-table">
                <thead>
                    <tr>
                        <th style="width:100px;">DAY</th>
                        <th style="width:160px;">CALENDAR DATE</th>
                        <th style="width:60px;">ID</th>
                        <th>SCENE DESCRIPTION</th>
                        <th style="width:200px;">LOCATION</th>
                    </tr>
                </thead>
                <tbody>
                    ${scheduleRows}
                </tbody>
            </table>

            <footer style="margin-top:60px; padding-top:20px; border-top:1px solid black; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; text-align:center;">
                Official Project Breakdown • Generated ${new Date().toLocaleDateString()}
            </footer>
        </div>
    </body>
</html>`;
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
    : unique(rows.filter((r) => r.scheduledDays && r.scheduledDays.includes(dayNum)).map((r) => `s${String(r.n).padStart(2, '0')}`));
  const dayRows = sceneIds
    .map((sceneId) => rows.find((r) => r.id === sceneId || `s${String(r.n).padStart(2, '0')}`.toLowerCase() === String(sceneId).toLowerCase() || String(r.n).toLowerCase() === String(sceneId).toLowerCase()))
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

  const summaryLocationDetails = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'locationDetails')
    ? (Array.isArray(planEntry.locationDetails) ? planEntry.locationDetails : [planEntry.locationDetails])
    : unique(dayRows.flatMap((r) => r.locationDetails || []));

  const summaryCrew = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'crew')
    ? (Array.isArray(planEntry.crew) ? planEntry.crew : [planEntry.crew])
    : unique(dayRows.flatMap((r) => r.crew || []));

  const summaryMisc = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'misc')
    ? (Array.isArray(planEntry.misc) ? planEntry.misc : [planEntry.misc])
    : unique(dayRows.flatMap((r) => r.misc || []));

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
    const snippet = extractSceneSnippet(r.content, r.n);
    return `
      <tr>
        <td>${r.n}</td>
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
        <title>Day ${dayNum} — Call Sheet — Summer</title>
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
                <a href="../production.html" style="color:#666; text-decoration:none;">Dashboard</a>
                ${nextDay ? `<a href="${nextDay}.html" style="color:#0366d6; text-decoration:none;">Day ${nextDay} &rarr;</a>` : `<span></span>`}
            </div>
            <header class="callsheet-header">
                <div>
                    <h1 style="margin:0;">DAILY CALL SHEET</h1>
                    <h2 style="margin:0; font-size:1.5rem;">${dayLabel} of ${totalShootDays}</h2>
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
                    <h3 style="margin:0 0 10px 0; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px; color: black;">LOCATION DETAILS & CALL TIMES</h3>
                    <div style="font-size:0.9rem; min-height:40px; white-space: pre-wrap;">${summaryLocationDetails.length > 0 ? summaryLocationDetails.map(l => `<div style="margin-bottom: 4px;">${escapeHtml(l)}</div>`).join('') : '<div style="color:#666; font-style:italic;">1. Location Name (Address)\n   • Arrival: 08:00 AM\n   • Notes: Parking in rear</div>'}</div>
                </div>
                <div style="display:grid; gap:20px; grid-template-columns: 1fr 1fr;">
                    <div style="padding:14px; border:2px solid black; border-radius:8px;">
                        <h3 style="margin:0 0 10px 0; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px;">WARDROBE</h3>
                        <div style="font-size:0.9rem; min-height:60px; white-space: pre-wrap;">${summaryWardrobe.length > 0 ? summaryWardrobe.map(w => `<div style="margin-bottom: 4px;">${escapeHtml(w)}</div>`).join('') : '<div style="color:#666; font-style:italic;">1. Dallas Outfit #1\n   a. White Shirt\n   b. Blue Shorts</div>'}</div>
                    </div>
                    <div style="padding:14px; border:2px solid black; border-radius:8px;">
                        <h3 style="margin:0 0 10px 0; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px;">PROPS</h3>
                        <div style="font-size:0.9rem; min-height:60px; white-space: pre-wrap;">${summaryProps.length > 0 ? summaryProps.map(p => `<div style="margin-bottom: 4px;">${escapeHtml(p)}</div>`).join('') : '<div style="color:#666; font-style:italic;">1. Oscillator\n2. Audio Headphones</div>'}</div>
                    </div>
                </div>
                <div style="display:grid; gap:20px; grid-template-columns: 1fr 1fr;">
                    <div style="padding:14px; border:2px solid black; border-radius:8px;">
                        <h3 style="margin:0 0 10px 0; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px;">CREW</h3>
                        <div style="font-size:0.9rem; min-height:60px; white-space: pre-wrap;">${summaryCrew.length > 0 ? summaryCrew.map(w => `<div style="margin-bottom: 4px;">${escapeHtml(w)}</div>`).join('') : '<div style="color:#666; font-style:italic;">Add crew involved...</div>'}</div>
                    </div>
                    <div style="padding:14px; border:2px solid black; border-radius:8px;">
                        <h3 style="margin:0 0 10px 0; font-size:1rem; border-bottom:1px solid #ccc; padding-bottom:5px;">MISC</h3>
                        <div style="font-size:0.9rem; min-height:60px; white-space: pre-wrap;">${summaryMisc.length > 0 ? summaryMisc.map(p => `<div style="margin-bottom: 4px;">${escapeHtml(p)}</div>`).join('') : '<div style="color:#666; font-style:italic;">Add miscellaneous notes...</div>'}</div>
                    </div>
                </div>
            </section>

            <footer style="margin-top:50px; text-align:center; font-size:0.8rem; border-top:1px solid black; padding-top:20px;">
                THIS IS A GENERATED CALL SHEET FOR PRODUCTION USE ONLY. RE-SYNC WITH GOOGLE SHEET FOR LATEST CALL TIMES.
            </footer>
        </div>
    </body>
</html>`;
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

  // --- SUBPAGE GENERATION ---
  ensureDirectoryExistence(path.join(CAST_DIR, 'dummy.html'));
  ensureDirectoryExistence(path.join(DAYS_DIR, 'dummy.html'));

  // 1. Generate Cast Sheets
  const allCharacters = new Set();
  rows.forEach(r => r.characters.forEach(c => allCharacters.add(c)));
  allCharacters.forEach(actor => {
    const castHtml = generateCastHtml(actor, rows, productionData);
    const castPath = path.join(CAST_DIR, `${actor.toLowerCase()}.html`);
    fs.writeFileSync(castPath, castHtml, 'utf8');
    console.log(`  ✓ Generated Cast Sheet: ${actor}`);
  });

  // 2. Generate Daily Call Sheets
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

module.exports = { compile, buildProductionRows, loadManifest, loadProductionData };
