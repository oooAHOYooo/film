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
  const title = nickname
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  return title.toLowerCase() === 'mr mike' ? 'Mr. Mike' : title;
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

function groupEquipmentByCategory(equipmentList) {
  const categories = {
    'Camera': [],
    'Lenses': [],
    'Audio': [],
    'Support / Rigging': [],
    'Power / Batteries': [],
    'Accessories': []
  };

  const categoryKeywords = {
    'Camera': ['camera body', 'gimbal', 'monitor', 'viewfinder'],
    'Lenses': ['lens', 'zoom', 'filter'],
    'Audio': ['audio recorder', 'field recorder', 'shotgun', 'lav mic', 'headphones', 'mic cable', 'xlr', 'boom'],
    'Support / Rigging': ['tripod', 'fluid head', 'quick release', 'plate', 'monopod'],
    'Power / Batteries': ['battery', 'charger', 'power', 'usb'],
    'Accessories': ['gaffer', 'lens cloth', 'blower', 'toolkit', 'tape', 'slate', 'clapper']
  };

  equipmentList.forEach(item => {
    const cleanItem = item.replace(/^•\s*/, '').trim();
    let assigned = false;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => cleanItem.toLowerCase().includes(kw))) {
        categories[category].push(cleanItem);
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      categories['Accessories'].push(cleanItem);
    }
  });

  return categories;
}

function renderEquipmentGroupsHtml(equipmentList) {
  if (!equipmentList || equipmentList.length === 0) {
    return '<div style="color:#666; font-style:italic;">No equipment listed for this day.</div>';
  }

  const groups = groupEquipmentByCategory(equipmentList);
  let html = '';

  for (const [category, items] of Object.entries(groups)) {
    if (items.length === 0) continue;

    html += `<div style="margin-bottom: 12px;">
      <div style="font-weight: 700; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: #333; margin-bottom: 4px;">${category}</div>
      <div style="margin-left: 8px;">
        ${items.map(item => `<div style="margin-bottom: 2px; font-size: 0.84rem;">• ${escapeHtml(item)}</div>`).join('')}
      </div>
    </div>`;
  }

  return html;
}

function markdownToHtml(md) {
  if (!md) return '';
  let html = escapeHtml(md);
  // Convert bold markdown
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  // Convert italics markdown
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Convert bullet points and dashes
  html = html.replace(/^• (.+)$/gm, '<div style="margin-bottom: 1px;">• $1</div>');
  html = html.replace(/^- (.+)$/gm, '<div style="margin-bottom: 1px;">• $1</div>');
  // Convert line breaks
  html = html.replace(/\n/g, '<br>');
  return html;
}

function normalizeSceneAnchor(sceneId, rows) {
  const raw = String(sceneId || '').trim();
  const lower = raw.toLowerCase();
  const row = (rows || []).find((r) => {
    const fileId = String(r.fileId || '').toLowerCase();
    const id = String(r.id || '').toLowerCase();
    const n = String(r.n || '').toLowerCase();
    return fileId === lower || id === lower || n === lower;
  });
  if (row && row.fileId) {
    return String(row.fileId).toLowerCase();
  }

  // Treat subscene ids like s02.3 as a jump to the parent scene section.
  const subsceneMatch = lower.match(/^(s\d+)\.\d+$/);
  if (subsceneMatch) {
    return subsceneMatch[1];
  }

  return lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function daySortValue(day) {
  const value = Number.parseFloat(day);
  return Number.isFinite(value) ? value : 99999;
}

function sceneHref(sceneId, rows, prefix) {
  const anchor = normalizeSceneAnchor(sceneId, rows);
  return `${prefix}#scene-${anchor}`;
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
    const data = productionData[id] || (scene.file ? productionData[scene.file.replace('.md', '').toLowerCase()] : {}) || {};
    if (characters.length === 0) {
        if (Array.isArray(data.cast) && data.cast.length > 0) {
            characters.push(...data.cast.map(c => c.toUpperCase()));
        } else if (/\b[Dd]allas\b/.test(content)) {
            characters.push('DALLAS');
        }
    }
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
                --prod-border: #000;
                --prod-tag-bg: #fff;
                --prod-tag-border: #000;
                --prod-row-hover: #f5f5f5;
                --sidebar-w: 260px;
            }
            body {
                margin: 0;
                display: block;
                min-height: 100vh;
                overflow-y: auto;
                background: #fff;
                color: #000;
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
                padding: 28px 24px 32px;
                scroll-behavior: smooth;
                position: relative;
            }
            .stats-card {
                background: #fff;
                border: 1px solid #000;
                border-radius: 0;
                padding: 10px 12px;
                margin-bottom: 12px;
            }
            .stats-title {
                font-size: 0.65rem;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: #555;
                margin-bottom: 6px;
            }
            .stats-value {
                font-size: 1rem;
                font-weight: 600;
                color: var(--prod-accent);
            }
            a {
                color: #000;
            }
            .stats-card a {
                color: #000;
                text-decoration: none;
            }
            .stats-card a:hover {
                text-decoration: underline;
            }
            @media print {
                @page { margin: 0.45in; }
                body {
                    background: #fff !important;
                    color: #000 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .main-content {
                    padding: 0;
                }
                .stats-card {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                a {
                    color: #000 !important;
                    text-decoration: none !important;
                }
            }
`;
}

function buildCastDateSummary(rows, productionData) {
  const mainCast = ['Dallas', 'Dominic', 'Asher'];
  const mainCastLookup = new Map(mainCast.map((name) => [name.toLowerCase(), name]));
  const calendar = productionData.calendar || {};

  const actorDays = new Map(mainCast.map((name) => [name, new Set()]));
  const group5Days = new Set();

  const normalizeName = (name) => String(name || '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (m) => m.toUpperCase());

  rows.forEach((r) => {
    const days = Array.isArray(r.scheduledDays) ? Array.from(new Set(r.scheduledDays)) : [];
    const cast = Array.isArray(r.characters) ? r.characters : [];

    cast.forEach((character) => {
      const canonical = mainCastLookup.get(normalizeName(character).toLowerCase());
      if (canonical) {
        days.forEach((dayNum) => actorDays.get(canonical).add(dayNum));
        return;
      }

      days.forEach((dayNum) => group5Days.add(dayNum));
    });
  });

  const formatDays = (days) => Array.from(new Set(days)).sort((a, b) => a - b).join(', ');
  const formatDates = (days) => {
    const sortedDays = Array.from(new Set(days)).sort((a, b) => a - b);
    return sortedDays
      .map((dayNum) => {
        const dateStr = calendar[dayNum] || '';
        if (!dateStr) return '';
        return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      })
      .filter(Boolean)
      .join(', ');
  };

  return [
    ...mainCast.map((name) => ({
      label: name,
      days: Array.from(actorDays.get(name) || []),
      note: '',
    })),
    {
      label: 'Group 5',
      days: Array.from(group5Days),
      note: 'All other cast',
    },
  ].map((entry) => ({
    ...entry,
    daysText: formatDays(entry.days) || '—',
    dates: Array.from(new Set(entry.days))
      .sort((a, b) => a - b)
      .map((dayNum) => {
        const dateStr = calendar[dayNum] || '';
        return dateStr ? new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
      })
      .filter(Boolean),
  }));
}

function renderCastDateSummaryHtml(summaryRows) {
  const rowsHtml = (summaryRows || []).map((entry) => `
    <tr style="border-bottom:1px solid #ddd;">
      <td style="padding:6px 10px;border-bottom:1px solid #ddd;font-weight:700;white-space:nowrap;">${escapeHtml(entry.label)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #ddd;font-family:ui-monospace,monospace;white-space:normal;word-break:break-word;line-height:1.35;">${escapeHtml(entry.daysText)}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #ddd;white-space:normal;line-height:1.35;">${(entry.dates && entry.dates.length > 0) ? entry.dates.map((date) => `<div>${escapeHtml(date)}</div>`).join('') : '<span style="color:#666;">—</span>'}</td>
      <td style="padding:6px 10px;border-bottom:1px solid #ddd;color:#666;font-size:0.78rem;">${escapeHtml(entry.note || '')}</td>
    </tr>`).join('');

  return `
    <div style="overflow-x:auto;">
      <table style="width:100%;border-collapse:collapse;font-family:ui-monospace,monospace;font-size:13px;table-layout:fixed;">
        <thead>
          <tr style="color:#555;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;">
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #999;width:18%;">Group</th>
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #999;width:16%;">Days</th>
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #999;width:54%;">Dates</th>
            <th style="text-align:left;padding:6px 10px;border-bottom:1px solid #999;width:12%;">Note</th>
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>
    </div>`;
}

function generateCalendarHtml(productionData) {
  const calendar = productionData.calendar || {};
  const shootPlan = Array.isArray(productionData.shootPlan) ? productionData.shootPlan : [];
  const completedDays = Array.isArray(productionData.completedDays) ? productionData.completedDays.map(String) : [];
  const dayToScenes = {};
  shootPlan.forEach(entry => {
    if (Array.isArray(entry.scenes)) {
      dayToScenes[entry.day] = entry.scenes.join(', ');
    }
  });

  function renderMonthGrid(year, month) {
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    let html = '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-family:ui-monospace,monospace;font-size:12px;table-layout:fixed;"><thead><tr>';
    dayNames.forEach(d => {
      html += `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #999;color:#555;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;width:14.28%;">${d}</th>`;
    });
    html += '</tr></thead><tbody>';

    let date = new Date(startOfMonth);
    let row = '<tr>';
    for (let i = 0; i < date.getDay(); i++) row += '<td style="padding:6px 8px;border:1px solid #eee;vertical-align:top;background:transparent;min-height:60px;height:70px;"></td>';

    while (date <= endOfMonth) {
      const day = date.getDate();
      const dateStr = date.toISOString().split('T')[0];
      const dayNum = Object.keys(calendar).find(k => calendar[k] === dateStr);
      const dayPlan = dayNum ? shootPlan.find((entry) => String(entry.day) === String(dayNum)) : null;
      const isPickup = !!(dayPlan && (dayPlan.special || dayPlan.pickup));
      const isCompleted = dayNum ? completedDays.includes(String(dayNum)) : false;
      const scenes = dayNum && dayToScenes[dayNum] ? dayToScenes[dayNum] : '';

      const cellBg = dayNum ? (isCompleted ? '#d4edda' : '#f0f0f0') : 'transparent';
      const cellBorder = dayNum ? (isCompleted ? '#7fbf8f' : '#999') : '#eee';
      const completedBadge = isCompleted ? `<div style="font-size:9px;font-weight:700;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.04em;margin-top:2px;">✓ Done</div>` : '';
      const cellContent = dayNum
        ? `<div style="font-weight:700;margin-bottom:2px;">${day}</div><div style="font-weight:800;font-size:11px;">${isPickup ? 'Pickup' : `Day ${dayNum}`}</div><div style="color:#666;font-size:10px;line-height:1.3;margin-top:2px;">${scenes}</div>${completedBadge}`
        : `<div style="font-weight:700;margin-bottom:2px;">${day}</div>`;

      const onclick = dayNum ? `onclick="window.location.href='production/days/${dayNum}.html'"` : '';
      const cursor = dayNum ? 'cursor:pointer;' : '';

      row += `<td ${onclick} style="padding:6px 8px;border:1px solid ${cellBorder};vertical-align:top;background:${cellBg};min-height:60px;height:70px;${cursor}">${cellContent}</td>`;

      if (date.getDay() === 6) { row += '</tr><tr>'; }
      date.setDate(date.getDate() + 1);
    }
    while (date.getDay() !== 0) {
      row += `<td style="padding:6px 8px;border:1px solid #eee;vertical-align:top;opacity:0.25;background:transparent;min-height:60px;height:70px;"><div style="font-weight:700;margin-bottom:2px;">${date.getDate()}</div></td>`;
      date.setDate(date.getDate() + 1);
    }
    row += '</tr>';
    html += row + '</tbody></table></div>';
    return html;
  }

  // Collect all months that appear in the calendar, always include June and July 2026
  const monthSet = new Set(['2026-5', '2026-6']);
  Object.values(calendar).forEach(d => {
    const dt = new Date(d + 'T12:00:00');
    monthSet.add(`${dt.getFullYear()}-${dt.getMonth()}`);
  });

  const monthList = Array.from(monthSet)
    .map(k => { const [y, m] = k.split('-').map(Number); return { key: k, year: y, month: m }; })
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month);

  const gridsHtml = monthList.map(g => {
    const label = new Date(g.year, g.month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return `<div style="margin-bottom:32px;">
      <div style="font-size:0.85rem;font-weight:700;font-family:ui-monospace,monospace;text-transform:uppercase;letter-spacing:0.06em;color:#555;margin-bottom:8px;">${label}</div>
      ${renderMonthGrid(g.year, g.month)}
    </div>`;
  }).join('');

  return `<section style="margin-top:0;">
    <h2 style="color:#111;margin:0 0 16px 0;font-size:1.2rem;font-family:ui-monospace,monospace;letter-spacing:0.05em;">Calendar</h2>
    ${gridsHtml}
  </section>`;
}

function generateScheduleTableHtml(rows, productionData) {
  const calendar = productionData.calendar || {};
  const shootPlan = Array.isArray(productionData.shootPlan) ? productionData.shootPlan : [];
  const completedDays = Array.isArray(productionData.settings?.completedDays) ? productionData.settings.completedDays : [];

  const sceneSortValue = (sceneId) => {
    const anchor = normalizeSceneAnchor(sceneId, rows);
    const row = (rows || []).find((r) => String(r.fileId || '').toLowerCase() === anchor || String(r.id || '').toLowerCase() === String(sceneId || '').toLowerCase());
    if (row && Number.isFinite(Number(row.n))) return Number(row.n);
    const digits = String(sceneId || '').match(/\d+/);
    return digits ? Number(digits[0]) : 99999;
  };

  const sortedPlan = [...shootPlan].sort((a, b) => daySortValue(a.day) - daySortValue(b.day));

  let html = `
    <section style="margin-top:48px; margin-bottom:48px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap;">
        <h2 style="color:#111;margin:0;font-size:1.2rem;font-family:ui-monospace,monospace;letter-spacing:0.05em;">Shooting Schedule</h2>
        <div style="display:flex;gap:8px;margin-left:auto;flex-wrap:wrap;">
          <button id="sort-btn-day" type="button" onclick="sortShootingSchedule('day')" style="font-family:ui-monospace,monospace;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:6px 14px;border:2px solid #111;border-radius:6px;background:#111;color:#fff;cursor:pointer;">Sort by Day</button>
          <button id="sort-btn-scene" type="button" onclick="sortShootingSchedule('scene')" style="font-family:ui-monospace,monospace;font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;padding:6px 14px;border:2px solid #999;border-radius:6px;background:#fff;color:#333;cursor:pointer;">Sort by Scene</button>
        </div>
      </div>
      <div style="overflow-x:auto;">
        <table id="schedule-table" style="width:100%;border-collapse:collapse;font-family:ui-monospace,monospace;font-size:13px;">
          <thead>
            <tr style="color:#555;font-size:0.7rem;text-transform:uppercase;letter-spacing:0.08em;">
              <th id="col-day" style="text-align:left;padding:6px 10px;border-bottom:1px solid #999;">Day</th>
              <th id="col-date" style="text-align:left;padding:6px 10px;border-bottom:1px solid #999;">Date</th>
              <th id="col-scenes" style="text-align:left;padding:6px 10px;border-bottom:1px solid #999;">Scenes</th>
            </tr>
          </thead>
          <tbody id="schedule-tbody-day">`;

  sortedPlan.forEach(entry => {
    const dateStr = calendar[entry.day];
    const date = dateStr ? new Date(dateStr + 'T12:00:00') : null;
    const dateFormatted = date ? date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '—';
    const scenes = Array.isArray(entry.scenes) ? entry.scenes : [];
    const scenesHtml = scenes.length
      ? scenes.map((sceneId) => {
          const href = sceneHref(sceneId, rows, 'script-system/full_script.html');
          return '<a href="' + href + '" onclick="event.stopPropagation()" style="color:#111;text-decoration:none;font-weight:700;border-bottom:1px dotted currentColor;" title="Jump to ' + escapeHtml(sceneId) + ' in the full script">' + escapeHtml(sceneId) + '</a>';
        }).join(', ')
      : '';
    const firstScene = scenes.length ? normalizeSceneAnchor(scenes[0], rows) : '';
    const firstSceneSort = scenes.length ? sceneSortValue(scenes[0]) : Number(entry.day) || 0;
    const isCompleted = completedDays.includes(Number(entry.day)) || completedDays.includes(entry.day);
    const completedStyle = isCompleted ? 'background-color:#f0f0f0;opacity:0.7;' : '';
    const completedBadge = isCompleted ? ' ✓' : '';
    html += `<tr data-day="${entry.day}" data-scene-sort="${firstSceneSort}" data-first-scene="${escapeHtml(firstScene)}" style="border-bottom:1px solid #ddd;cursor:pointer;${completedStyle}" onclick="window.location.href='production/days/${entry.day}.html'"><td style="padding:8px 10px;border-bottom:1px solid #ddd;"><strong>Day ${entry.day}${completedBadge}</strong></td><td style="padding:8px 10px;border-bottom:1px solid #ddd;color:#555;">${dateFormatted}</td><td style="padding:8px 10px;border-bottom:1px solid #ddd;">${scenesHtml}</td></tr>`;
  });

  html += `</tbody></table></div></section>
  <script>
    (function() {
      var state = { key: 'day', asc: true };
      window.sortShootingSchedule = function(key) {
        var tbody = document.getElementById('schedule-tbody-day');
        if (!tbody) return;
        if (state.key === key) {
          state.asc = !state.asc;
        } else {
          state.key = key;
          state.asc = true;
        }

        var rows = Array.from(tbody.querySelectorAll('tr[data-day]'));
        rows.sort(function(a, b) {
          var av = key === 'scene'
            ? parseFloat(a.getAttribute('data-scene-sort')) || 0
            : daySortValue(a.getAttribute('data-day'));
          var bv = key === 'scene'
            ? parseFloat(b.getAttribute('data-scene-sort')) || 0
            : daySortValue(b.getAttribute('data-day'));
          return state.asc ? av - bv : bv - av;
        });
        rows.forEach(function(row) { tbody.appendChild(row); });

        ['day', 'scene'].forEach(function(k) {
          var btn = document.getElementById('sort-btn-' + k);
          if (!btn) return;
          if (k === key) {
            btn.style.background = '#111';
            btn.style.color = '#fff';
            btn.style.borderColor = '#111';
            btn.textContent = (k === 'day' ? 'Sort by Day' : 'Sort by Scene') + (state.asc ? ' ↑' : ' ↓');
          } else {
            btn.style.background = '#fff';
            btn.style.color = '#333';
            btn.style.borderColor = '#999';
            btn.textContent = k === 'day' ? 'Sort by Day' : 'Sort by Scene';
          }
        });
      };
    })();
  </script>`;
  return html;
}

function generateFullHtml(rows, totalDays, productionData) {
  const totalScenes = rows.length;
  const castDateSummaryHtml = renderCastDateSummaryHtml(buildCastDateSummary(rows, productionData));
  const calendar = productionData.calendar || {};
  const shootPlan = Array.isArray(productionData.shootPlan) ? productionData.shootPlan : [];
  const callSheetDays = Object.keys(calendar).sort((a, b) => daySortValue(a) - daySortValue(b));

  let html = `<!doctype html>
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
                    <p style="opacity: 0.55; margin: 8px 0 0 0; font-size: 0.82rem; letter-spacing: 0.03em;">Shooting cut</p>
                    <p style="opacity: 0.5; margin: 8px 0 0 0; font-size: 0.9rem;">Last updated: ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}</p>
                    <button onclick="location.reload(true)" style="margin-top: 12px; padding: 8px 16px; background: #000; color: #fff; border: none; border-radius: 4px; font-size: 0.9rem; font-weight: 600; cursor: pointer;">🔄 Hard Refresh</button>
                </header>

                ${generateCalendarHtml(productionData)}

                ${generateScheduleTableHtml(rows, productionData)}

                <section style="margin-bottom: 40px;">
                  <h2 style="color: #000; margin: 0 0 12px 0; font-size: 1.2rem; letter-spacing: 0.04em; text-transform: uppercase;">Call Sheets</h2>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
`;

  const completedDaysSet = new Set((Array.isArray(productionData.settings?.completedDays) ? productionData.settings.completedDays : []).map(String));
  for (const dayNum of callSheetDays) {
    const planEntry = shootPlan.find((entry) => String(entry.day) === String(dayNum));
    const isPickup = !!(planEntry && (planEntry.special || planEntry.pickup));
    const dayDate = calendar[dayNum] || '';
    const dateLabel = dayDate ? new Date(dayDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
    const isDone = completedDaysSet.has(String(dayNum));
    const cardBg = isDone ? '#d4edda' : '#fff';
    const cardBorder = isDone ? '1px solid #7fbf8f' : '1px solid #000';
    const doneTag = isDone ? `<span style="font-size:0.72rem;font-weight:700;color:#2d6a4f;text-transform:uppercase;letter-spacing:0.04em;border:1px solid #7fbf8f;padding:2px 6px;border-radius:3px;background:#c3e6cb;">✓ Complete</span>` : '';
    html += `
                    <div class="stats-card" style="cursor: pointer; margin-bottom: 0; background: ${cardBg}; border: ${cardBorder};" onclick="window.location.href='production/days/${dayNum}.html'">
                      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                        <div style="font-weight: 700; color: #000; font-size: 0.95rem; display:flex; align-items:center; gap:8px;">${isPickup ? 'Pickup' : `Day ${dayNum}`}${dateLabel ? ` · ${dateLabel}` : ''} ${doneTag}</div>
                        <a href="production/days/${dayNum}.html" style="color: #000; text-decoration: none; font-weight: 600;">${isPickup ? 'Open pickup sheet' : 'Open call sheet'}</a>
                      </div>
                    </div>
`;
  }

  html += `
                  </div>
                </section>

                <section style="margin-bottom: 40px;">
                  <h2 style="color: #000; margin: 0 0 12px 0; font-size: 1.2rem; letter-spacing: 0.04em; text-transform: uppercase;">Cast Dates</h2>
                  <div class="compact-panel">
                    ${castDateSummaryHtml}
                  </div>
                </section>

                <section style="margin-bottom: 40px;">
                  <h2 style="color: #000; margin: 0 0 12px 0; font-size: 1.2rem; letter-spacing: 0.04em; text-transform: uppercase;">Additional Resources</h2>
                  <div style="display: flex; flex-direction: column; gap: 8px;">
                    <div class="stats-card" style="cursor: pointer; margin-bottom: 0;" onclick="window.location.href='resources/film-grammar.html'">
                      <div style="display:flex; justify-content:space-between; align-items:center; gap:12px;">
                        <div style="font-weight: 700; color: #000; font-size: 0.95rem;">Film Grammar</div>
                        <a href="resources/film-grammar.html" style="color: #000; text-decoration: none; font-weight: 600;">Open</a>
                      </div>
                      <div style="font-size: 0.78rem; color: #555; margin-top: 4px;">Rules and conventions for shot composition, camera movement, and visual storytelling.</div>
                    </div>
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

  const shootPlan = Array.isArray(productionData.shootPlan) ? productionData.shootPlan : [];
  const sortedDays = shootPlan.map(p => Number(p.day)).sort((a,b) => a - b);
  const currentIndex = sortedDays.indexOf(Number(dayNum));
  const prevDay = currentIndex > 0 ? sortedDays[currentIndex - 1] : null;
  const nextDay = currentIndex >= 0 && currentIndex < sortedDays.length - 1 ? sortedDays[currentIndex + 1] : null;
  const planEntry = shootPlan.find((entry) => Number(entry.day) === Number(dayNum));
  const totalShootDays = shootPlan.filter((entry) => !entry.special).length || Object.keys(calendar).length;

  const unique = (items) => Array.from(new Set((items || []).filter(Boolean)));
  const sceneIds = planEntry && Array.isArray(planEntry.scenes) && planEntry.scenes.length
    ? unique(planEntry.scenes)
    : unique(rows.filter((r) => r.scheduledDays && r.scheduledDays.includes(dayNum)).map((r) => r.fileId));
  const dayScenes = sceneIds.map((sceneId) => {
    const row = rows.find((r) => r.id === sceneId || r.fileId.toLowerCase() === String(sceneId).toLowerCase() || String(r.n).toLowerCase() === String(sceneId).toLowerCase());
    if (row) {
      return {
        ...row,
        fullScriptHref: sceneHref(row.fileId, rows, '../../script-system/full_script.html'),
        resolved: true,
      };
    }
    return {
      fileId: sceneId,
      id: sceneId,
      title: sceneId,
      time: '—',
      characters: [],
      props: [],
      wardrobe: [],
      equipment: [],
      locationDetails: [],
      content: '',
      fullScriptHref: sceneHref(sceneId, rows, '../../script-system/full_script.html'),
      resolved: false,
    };
  });
  const dayRows = dayScenes.filter((scene) => scene.resolved);
  const summaryLocations = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'locations')
    ? unique(Array.isArray(planEntry.locations) ? planEntry.locations : [planEntry.locations])
    : unique(dayRows.map((r) => r.location || '').filter((loc) => loc && loc !== '—'));
  const castOverride = planEntry && Object.prototype.hasOwnProperty.call(planEntry, 'cast')
    ? (Array.isArray(planEntry.cast) ? planEntry.cast : [planEntry.cast])
    : null;
  const summaryCast = Array.from(new Map(
    (castOverride !== null ? castOverride : dayRows.flatMap((r) => r.characters || []))
      .filter(Boolean)
      .map((name) => {
        const normalized = nicknameToTitle(name);
        return [normalized.toLowerCase(), normalized];
      })
  ).values());

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
  const castDateSummaryHtml = renderCastDateSummaryHtml(buildCastDateSummary(rows, productionData));

  const completedDaysList = Array.isArray(productionData.completedDays) ? productionData.completedDays.map(String) : [];
  const isDayComplete = completedDaysList.includes(String(dayNum));
  const dayBg = isDayComplete ? '#e8f5e9' : '#fff';

  const dayLabel = planEntry && planEntry.special ? 'Pickup Date' : (planEntry ? `Day ${planEntry.day}` : `Day ${dayNum}`);
  const sourceNote = planEntry && planEntry.sourceNote ? planEntry.sourceNote : '';
  const crewCall = planEntry && planEntry.crewCall ? planEntry.crewCall : 'GENERAL CREW CALL: 08:00 AM';
  const customShotList = planEntry && Array.isArray(planEntry.shotList) && planEntry.shotList.length
    ? planEntry.shotList
    : null;
  const cameraSettings = planEntry && planEntry.cameraSettings ? planEntry.cameraSettings : '';
  const settingsOverview = planEntry && planEntry.settingsOverview ? planEntry.settingsOverview : '';

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

  const sceneRows = dayScenes.map(r => {
    const chars = (castOverride !== null ? summaryCast : (r.characters || [])).join(', ');
    let snippet = r.resolved ? extractSceneSnippet(r.content, r.fileId) : '';
    // Override description for s00b-pickup
    if (r.fileId === 's00b') {
      snippet = 'CU of dallas walking around new appt';
    }
    const fullScriptHref = r.fullScriptHref;
    return `
      <tr>
        <td><a href="${fullScriptHref}" onclick="event.stopPropagation()" style="color:#111;text-decoration:none;font-weight:700;border-bottom:1px dotted currentColor;" title="Jump to ${escapeHtml(r.fileId)} in the full script">${escapeHtml(r.fileId)}</a></td>
        <td>
          <div style="font-weight: 700; color: black;"><a href="${fullScriptHref}" onclick="event.stopPropagation()" style="color:inherit;text-decoration:none;border-bottom:1px dotted currentColor;" title="Jump to ${escapeHtml(r.title)} in the full script">${escapeHtml(r.title)}</a></div>
          ${snippet ? `<div style="font-size:0.75rem; color:#666; margin-top:4px; line-height:1.3; font-style: italic;">${escapeHtml(snippet)}</div>` : ''}
        </td>
        <td>${chars || '—'}</td>
      </tr>`;
  }).join('');
  const shotListRows = (customShotList || dayScenes).map((entry, index) => {
    if (customShotList) {
      const beat = entry.beat || entry.scene || entry.fileId || entry.id || `Shot ${index + 1}`;
      const sceneId = entry.scene || entry.fileId || entry.id || '';
      const title = entry.title || entry.name || '';
      const description = entry.description || entry.note || entry.snippet || '';
      const cast = Array.isArray(entry.cast) ? entry.cast : (entry.cast ? [entry.cast] : []);
      const linkHref = sceneId ? sceneHref(sceneId, rows, '../../script-system/full_script.html') : '#';
      const shotsHtml = Array.isArray(entry.shots) && entry.shots.length
        ? `<div style="margin-top:6px; padding-top:6px; border-top:1px solid #eee; font-size:0.72rem; color:#666;"><div style="font-weight:700; color:#555; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.03em;">Shots:</div>${entry.shots.map(shot => {
          if (typeof shot === 'string') {
            return `<div style="margin-bottom:2px;">• ${markdownToHtml(shot)}</div>`;
          } else if (typeof shot === 'object' && shot.shot) {
            const dir = shot.stage_direction ? `<div style="margin-left:12px; margin-top:2px; color:#888; font-style:italic; line-height:1.35;">${escapeHtml(shot.stage_direction)}</div>` : '';
            return `<div style="margin-bottom:4px;">• ${escapeHtml(shot.shot)}${dir}</div>`;
          }
          return '';
        }).join('')}</div>`
        : '';
      return `
      <li style="padding:10px 0; border-bottom:1px solid #ddd; display:block;">
        <div style="display:flex; gap:12px; justify-content:space-between; align-items:flex-start;">
          <div style="min-width:0; flex:1;">
            <div style="font-weight:700;">
              <span style="color:#555; font-size:0.78rem; margin-right:6px;">${index + 1}.</span>
              ${sceneId ? `<a href="${linkHref}" onclick="event.stopPropagation()" style="color:#111;text-decoration:none;border-bottom:1px dotted currentColor;" title="Jump to ${escapeHtml(sceneId)} in the full script">${escapeHtml(beat)}</a>` : `<span style="color:#111;">${escapeHtml(beat)}</span>`}
              ${title ? `<span style="color:#555; font-weight:600;"> - ${escapeHtml(title)}</span>` : ''}
            </div>
            ${description ? `<div style="font-size:0.75rem; color:#666; margin-top:4px; line-height:1.3; font-style: italic;">${escapeHtml(description)}</div>` : ''}
          </div>
          <div style="flex:0 0 32%; min-width:120px; text-align:right; font-size:0.78rem; color:#555; line-height:1.3;">
            ${cast.length ? escapeHtml(cast.map((name) => nicknameToTitle(name)).join(', ')) : '—'}
          </div>
        </div>${shotsHtml}
      </li>`;
    }

    const scene = entry;
    const fullScriptHref = scene.fullScriptHref;
    const snippet = scene.resolved ? extractSceneSnippet(scene.content, scene.fileId) : '';
    const cast = (scene.characters || []).join(', ');
    return `
      <li style="padding:10px 0; border-bottom:1px solid #ddd; display:flex; gap:12px; justify-content:space-between; align-items:flex-start;">
        <div style="min-width:0;">
          <div style="font-weight:700;">
            <span style="color:#555; font-size:0.78rem; margin-right:6px;">${index + 1}.</span>
            <a href="${fullScriptHref}" onclick="event.stopPropagation()" style="color:#111;text-decoration:none;border-bottom:1px dotted currentColor;" title="Jump to ${escapeHtml(scene.fileId)} in the full script">${escapeHtml(scene.fileId)}</a>
            <span style="color:#555; font-weight:600;">${scene.title && scene.title !== scene.fileId ? ` - ${escapeHtml(scene.title)}` : ''}</span>
          </div>
          ${snippet ? `<div style="font-size:0.75rem; color:#666; margin-top:4px; line-height:1.3; font-style: italic;">${escapeHtml(snippet)}</div>` : ''}
        </div>
        <div style="flex:0 0 32%; min-width:120px; text-align:right; font-size:0.78rem; color:#555; line-height:1.3;">
          ${cast ? escapeHtml(cast) : '—'}
        </div>
      </li>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>${planEntry && planEntry.special ? 'Pickup Date' : `Day ${dayNum}`} — Call Sheet — Shooting Script</title>
        <style>
            ${getProductionStyles()}
            .main-content { padding: 24px 22px 32px; margin: 0 auto; max-width: 920px; box-sizing: border-box; }
            body { background: ${dayBg}; color: #000; }
            .callsheet-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-end;
                border-bottom: 2px solid #000;
                padding-bottom: 8px;
                margin-bottom: 14px;
                flex-wrap: wrap;
                gap: 10px;
            }
            .callsheet-kicker {
                margin: 4px 0 0 0;
                font-size: 0.78rem;
                letter-spacing: 0.04em;
                text-transform: uppercase;
                color: #555;
            }
            .compact-block {
                margin: 12px 0 14px 0;
                padding: 0;
            }
            .compact-label {
                font-size: 0.7rem;
                font-weight: 700;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                color: #555;
                margin-bottom: 4px;
            }
            .compact-panel {
                border: 1px solid #000;
                padding: 8px 10px;
            }
            .production-table {
                background: transparent;
                border: none;
                width: 100%;
                border-collapse: collapse;
                font-size: 0.88rem;
            }
            .production-table th {
                background: transparent;
                color: #000 !important;
                border-bottom: 2px solid #000;
                font-weight: 700;
                text-align: left;
                padding: 6px 8px;
                line-height: 1.1;
            }
            .production-table td {
                border-bottom: 1px solid #ddd;
                padding: 8px 8px;
                color: #000;
                vertical-align: top;
                line-height: 1.25;
            }
            .production-table a {
                color: #000 !important;
                text-decoration: none;
            }
            .production-table a:hover {
                text-decoration: underline;
            }
            .scene-snippet {
                font-size: 0.72rem;
                color: #666;
                margin-top: 3px;
                line-height: 1.25;
                font-style: italic;
            }
            .scene-start {
                white-space: nowrap;
            }
            .notice-bar {
                display: flex;
                justify-content: space-between;
                gap: 10px;
                margin-bottom: 10px;
                font-size: 0.68rem;
                text-transform: uppercase;
                font-weight: 700;
                color: #333;
            }

            @media (max-width: 768px) {
                .main-content { padding: 16px 14px 22px; }
                .callsheet-header {
                    flex-direction: column;
                    align-items: flex-start;
                    border-bottom-width: 1px;
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

            @media print {
                @page { margin: 0.45in; }
                body {
                    background: #fff !important;
                    color: #000 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                .notice-bar {
                    display: flex;
                }
                .production-table th {
                    background: #fff !important;
                }
                .compact-panel {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }
                a {
                    color: #000 !important;
                    text-decoration: none !important;
                }
            }
        </style>
    </head>
    <body style="background:${dayBg}; color:black;">
        <div class="main-content">
            <div class="notice-bar no-print">
                ${prevDay !== null ? `<a href="${prevDay}.html" style="color:#0366d6; text-decoration:none;">&larr; Day ${prevDay}</a>` : `<span></span>`}
                <a href="../../shooting_production.html" style="color:#666; text-decoration:none;">Dashboard</a>
                <span style="display:flex;gap:12px;align-items:center;">
                ${planEntry && Array.isArray(planEntry.overflow) && planEntry.overflow.length ? `<a href="${dayNum}-overflow.html" style="color:#c07000; text-decoration:none; font-weight:700;">Overflow &rarr;</a>` : ''}
                ${nextDay !== null ? `<a href="${nextDay}.html" style="color:#0366d6; text-decoration:none;">Day ${nextDay} &rarr;</a>` : `<span></span>`}
                </span>
            </div>
            <header class="callsheet-header">
                <div>
                    <h1 style="margin:0;">DAILY CALL SHEET</h1>
                    <h2 style="margin:0; font-size:1.5rem;">${dayLabel}${planEntry && !planEntry.special ? ` of ${totalShootDays}` : ''}</h2>
                    <p class="callsheet-kicker">Shooting cut</p>
                </div>
                <div style="text-align:right;">
                    <div style="font-weight:700;">${getDayName(dateStr).toUpperCase()}</div>
                    <div style="font-size:1.2rem;">${formatDate(dateStr)}</div>
                    ${holiday ? `<div style="color:red; font-weight:700;">${holiday}</div>` : ''}
                </div>
            </header>

            <section class="compact-block">
                <div class="compact-label">Shoot Plan Summary</div>
                <div class="compact-panel">
                    ${sourceNote ? `<div style="font-size:0.82rem; font-family: ui-monospace, monospace; margin-bottom:8px;">${escapeHtml(sourceNote)}</div>` : ''}
                    <div style="display:grid; gap:8px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));">
                        <div><div style="font-size:0.68rem; text-transform:uppercase; color:#555; font-weight:700;">Production Day</div><div style="font-size:0.92rem;">${(() => {
                          const callMatch = crewCall.match(/CALL:\s*(.+?)(?:\n|$)/);
                          const wrapMatch = crewCall.match(/WRAP:\s*(.+?)(?:\n|$)/);
                          if (callMatch && wrapMatch) {
                            return escapeHtml(callMatch[1].trim() + ' - ' + wrapMatch[1].trim());
                          }
                          return 'TBD';
                        })()}</div></div>
                        <div><div style="font-size:0.68rem; text-transform:uppercase; color:#555; font-weight:700;">Scenes</div><div style="font-size:0.92rem;">${sceneIds.length}</div></div>
                        <div><div style="font-size:0.68rem; text-transform:uppercase; color:#555; font-weight:700;">Est. Length</div><div style="font-size:0.92rem;">${planEntry && planEntry.estLength ? escapeHtml(planEntry.estLength) : (() => {
                        const callMatch = crewCall.match(/CALL:\s*(.+?)(?:\n|$)/);
                        const wrapMatch = crewCall.match(/WRAP:\s*(.+?)(?:\n|$)/);
                        if (callMatch && wrapMatch) {
                          // Simple time calculation: just count hours/minutes from CALL to WRAP
                          const callStr = callMatch[1].trim();
                          const wrapStr = wrapMatch[1].trim();
                          const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
                          const callTime = timeRegex.exec(callStr);
                          const wrapTime = timeRegex.exec(wrapStr);
                          if (callTime && wrapTime) {
                            let callHour = parseInt(callTime[1]);
                            let callMin = parseInt(callTime[2]);
                            let wrapHour = parseInt(wrapTime[1]);
                            let wrapMin = parseInt(wrapTime[2]);
                            if (callTime[3].toUpperCase() === 'PM' && callHour !== 12) callHour += 12;
                            if (wrapTime[3].toUpperCase() === 'PM' && wrapHour !== 12) wrapHour += 12;
                            let totalMin = (wrapHour * 60 + wrapMin) - (callHour * 60 + callMin);
                            if (totalMin < 0) totalMin += 24 * 60;
                            const h = Math.floor(totalMin / 60);
                            const m = totalMin % 60;
                            return (h > 0 ? h + 'h ' : '') + (m > 0 || h === 0 ? m + 'm' : '').trim();
                          }
                        }
                        const totalMin = dayRows.reduce((sum, r) => sum + (Number(r.durationMin) || 0), 0);
                        if (totalMin === 0) return 'TBD';
                        const h = Math.floor(totalMin/60);
                        const m = totalMin % 60;
                        return (h > 0 ? h + 'h ' : '') + (m > 0 || h === 0 ? m + 'm' : '').trim();
                    })()}</div></div>
                    </div>
                </div>
            </section>

            <h3 style="margin:18px 0 8px 0; border-bottom:1px solid #000; font-size:0.95rem; letter-spacing:0.04em;">SCENE SCHEDULE</h3>
            <div style="${isDayComplete ? 'background:#d4edda; border:1px solid #7fbf8f; padding:4px 0; border-radius:2px;' : ''}">
            <table class="production-table">
                <thead>
                    <tr>
                        <th style="${isDayComplete ? 'background:#c3e6cb;' : ''}">SCENE</th>
                        <th style="${isDayComplete ? 'background:#c3e6cb;' : ''}">DESCRIPTION</th>
                        <th style="${isDayComplete ? 'background:#c3e6cb;' : ''}">CAST</th>
                    </tr>
                </thead>
                <tbody>
                    ${sceneRows}
                </tbody>
            </table>
            </div>

            <section class="compact-block">
                <div class="compact-label">Day Schedule</div>
                <div class="compact-panel" style="padding: 0;">
                    ${(() => {
                        const lines = crewCall.split('\n').map(l => l.trim()).filter(l => l);
                        if (lines.length === 0) return '<div style="padding: 12px 10px; color: #666;">Schedule TBD</div>';

                        // Parse schedule items with times and time ranges
                        const scheduleItems = [];

                        lines.forEach(line => {
                            // Format: "LABEL: time — detail" or "LABEL: time - time — detail"
                            const colonMatch = line.match(/^([A-Z]+):\s*(.+)$/);

                            if (colonMatch) {
                                const label = colonMatch[1];
                                const content = colonMatch[2].trim();

                                // Extract time (can be single "HH:MM AM/PM" or range "HH:MM AM/PM - HH:MM AM/PM")
                                const timeMatch = content.match(/^([\d:]+\s*(?:AM|PM)(?:\s*-\s*[\d:]+\s*(?:AM|PM))?)/i);

                                if (timeMatch) {
                                    const time = timeMatch[1].trim();
                                    // Get detail after time (remove leading — or dash if present)
                                    const detail = content.replace(/^[\d:\s\-APM]+/i, '').replace(/^[—\-]\s*/, '').trim() || label;

                                    if (time) {
                                        scheduleItems.push({ time, location: detail || label });
                                    }
                                } else {
                                    // No time found, just use the whole content
                                    scheduleItems.push({ time: label, location: content });
                                }
                            }
                        });

                        if (scheduleItems.length === 0) {
                            return '<div style="padding: 12px 10px; color: #666;">Schedule TBD</div>';
                        }

                        return `
                            <table style="width: 100%; border-collapse: collapse; font-size: 0.84rem;">
                                <thead>
                                    <tr style="background: #f5f5f5; border-bottom: 2px solid #000;">
                                        <th style="padding: 10px 10px; text-align: left; font-weight: 700; color: #555; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; width: 25%;">Time</th>
                                        <th style="padding: 10px 10px; text-align: left; font-weight: 700; color: #555; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em;">Location / Activity</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${scheduleItems.map((item, idx) => `
                                        <tr style="border-bottom: ${idx < scheduleItems.length - 1 ? '1px solid #ddd' : 'none'};">
                                            <td style="padding: 10px 10px; font-weight: 600; color: #000; white-space: nowrap; font-size: 0.9rem;">
                                                ${escapeHtml(item.time)}
                                            </td>
                                            <td style="padding: 10px 10px; color: #000; line-height: 1.4;">
                                                ${escapeHtml(item.location)}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        `;
                    })()}
                </div>
            </section>

            <section class="compact-block">
                <div class="compact-label">Crew</div>
                <div class="compact-panel">
                    ${planEntry && planEntry.crew && Array.isArray(planEntry.crew) && planEntry.crew.length > 0
                      ? `<table style="width:100%; border-collapse:collapse; font-size:0.84rem;">
                          ${planEntry.crew.map(member => `
                            <tr style="border-bottom: 1px solid #ddd;">
                              <td style="padding: 8px; font-weight: 700; width: 45%;">${escapeHtml(member.role)}</td>
                              <td style="padding: 8px; text-align: left;">${escapeHtml(member.name)}</td>
                            </tr>
                          `).join('')}
                        </table>`
                      : '<div style="color:#666; font-style:italic; padding: 8px;">Crew TBD</div>'
                    }
                </div>
            </section>

            ${planEntry && Array.isArray(planEntry.plotPoints) && planEntry.plotPoints.length ? `
            <section class="compact-block" style="margin-top:16px;">
                <div class="compact-label">Plot Points Needed</div>
                <div class="compact-panel">
                    <ol style="margin:0; padding-left:20px; list-style:decimal;">
                        ${planEntry.plotPoints.map(pt => `<li style="padding:1px 0; font-size:0.76rem; line-height:1.3; color:#222;">${escapeHtml(pt)}</li>`).join('')}
                    </ol>
                </div>
            </section>` : ''}

            <section class="compact-block" style="margin-top:16px;">
                <div class="compact-label">Shot List</div>
                <div class="compact-panel">
                    ${(customShotList ? customShotList.length : dayScenes.length) > 0 ? `<ol style="margin:0; padding-left:18px; list-style:none;">${shotListRows}</ol>` : '<div style="color:#666; font-style:italic;">No shot list entries for this day.</div>'}
                </div>
            </section>

            <section style="margin-top:16px; display:flex; flex-direction:column; gap:12px;">
                <div class="compact-panel">
                    <h3 style="margin:0 0 6px 0; font-size:0.9rem; border-bottom:1px solid #000; padding-bottom:4px; color:#000;">PROPS</h3>
                    <div style="font-size:0.84rem; min-height:40px; white-space: pre-wrap;">${summaryProps.length > 0 ? summaryProps.map(p => `<div style="margin-bottom: 2px;">☐ ${escapeHtml(p.replace(/^•\s*/, ''))}</div>`).join('') : '<div style="color:#666; font-style:italic;">No props listed for this day.</div>'}</div>
                </div>
                <div class="compact-panel">
                    <h3 style="margin:0 0 6px 0; font-size:0.9rem; border-bottom:1px solid #000; padding-bottom:4px; color:#000;">EQUIPMENT</h3>
                    <div style="font-size:0.84rem; min-height:40px;">${renderEquipmentGroupsHtml(summaryEquipment)}</div>
                </div>
                <div class="compact-panel">
                    <h3 style="margin:0 0 6px 0; font-size:0.9rem; border-bottom:1px solid #000; padding-bottom:4px; color:#000;">LOCATION DETAILS</h3>
                    <div style="font-size:0.84rem;">${summaryLocationDetails.length > 0 ? summaryLocationDetails.map(l => `<div>${escapeHtml(l)}</div>`).join('') : '<div style="color:#666; font-style:italic;">Location details TBD</div>'}</div>
                </div>
                <div class="compact-panel">
                    <h3 style="margin:0 0 6px 0; font-size:0.9rem; border-bottom:1px solid #000; padding-bottom:4px; color:#000;">CAST NEEDED</h3>
                    <div style="display:flex; flex-wrap:wrap; gap:6px; font-size:0.84rem; min-height:28px;">${summaryCast.length > 0 ? summaryCast.map(c => `<span style="display:inline-block; border:1px solid #000; padding:3px 8px; border-radius:999px; font-weight:700;">${escapeHtml(c)}</span>`).join('') : '<div style="color:#666; font-style:italic;">No cast listed for this day.</div>'}</div>
                </div>
                ${cameraSettings ? `<div class="compact-panel">
                    <h3 style="margin:0 0 6px 0; font-size:0.9rem; border-bottom:1px solid #000; padding-bottom:4px; color:#000;">CAMERA & AUDIO SETTINGS</h3>
                    <div style="font-size:0.84rem; line-height:1.5;">${markdownToHtml(cameraSettings)}</div>
                </div>` : ''}
                ${settingsOverview ? `<div class="compact-panel">
                    <h3 style="margin:0 0 6px 0; font-size:0.9rem; border-bottom:1px solid #000; padding-bottom:4px; color:#000;">QUICK SETUP</h3>
                    <div style="font-size:0.84rem; line-height:1.5;">${markdownToHtml(settingsOverview)}</div>
                </div>` : ''}
            </section>

            ${planEntry && Array.isArray(planEntry.directorNotes) && planEntry.directorNotes.length ? `
            <section class="compact-block" style="margin-top:16px;">
                <div class="compact-label">Director's Notes</div>
                <div class="compact-panel" style="display:flex; flex-direction:column; gap:10px;">
                    ${planEntry.directorNotes.map(n => `
                    <div>
                        ${n.heading ? `<div style="font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#555; margin-bottom:3px;">${escapeHtml(n.heading)}</div>` : ''}
                        <div style="font-size:0.82rem; line-height:1.45; color:#111;">${escapeHtml(n.note)}</div>
                    </div>`).join('<hr style="border:none; border-top:1px solid #eee; margin:2px 0;">')}
                </div>
            </section>` : ''}
            ${planEntry && planEntry.directorNote ? `
            <section class="compact-block" style="margin-top:16px;">
                <div class="compact-label">Director Note</div>
                <div class="compact-panel">
                    <div style="font-size:0.84rem; line-height:1.55;">${markdownToHtml(planEntry.directorNote)}</div>
                </div>
            </section>` : ''}
            ${planEntry && Array.isArray(planEntry.shootingOrder) && planEntry.shootingOrder.length ? `
            <section class="compact-block" style="margin-top:16px;">
                <div class="compact-label">Shooting Order</div>
                <div class="compact-panel">
                    <ol style="margin:0; padding-left:20px;">
                        ${planEntry.shootingOrder.map((item) => `<li style="padding:3px 0; font-size:0.84rem; line-height:1.4;">${escapeHtml(item)}</li>`).join('')}
                    </ol>
                </div>
            </section>` : ''}
            ${planEntry && planEntry.framingNote ? `
            <section class="compact-block" style="margin-top:16px;">
                <div class="compact-label">Framing Note</div>
                <div class="compact-panel">
                    <div style="font-size:0.84rem; line-height:1.55; font-style:italic;">${markdownToHtml(planEntry.framingNote)}</div>
                </div>
            </section>` : ''}
        </div>
        <script>
            // Convert scene numbers to clickable links to full script
            function linkSceneNumbers() {
              const fullScriptUrl = '../../script-system/full_script.html';
              // Pattern to match scene numbers: s00, s01, s02.3, prologue, etc.
              const scenePattern = /\\b(prologue|s\\d+(?:\\.\\d+)?(?:[a-z])?)\b/gi;

              // Get all text nodes in the page
              function makeLinksInElement(element) {
                const childNodes = Array.from(element.childNodes);

                childNodes.forEach(node => {
                  if (node.nodeType === Node.TEXT_NODE) {
                    const text = node.textContent;
                    if (scenePattern.test(text)) {
                      // Reset regex lastIndex since we tested it
                      scenePattern.lastIndex = 0;

                      // Create a fragment to hold the new content
                      const fragment = document.createDocumentFragment();
                      let lastIndex = 0;
                      let match;

                      scenePattern.lastIndex = 0;
                      while ((match = scenePattern.exec(text)) !== null) {
                        // Add text before the match
                        if (match.index > lastIndex) {
                          fragment.appendChild(
                            document.createTextNode(text.substring(lastIndex, match.index))
                          );
                        }

                        // Create link for the scene number
                        const link = document.createElement('a');
                        link.href = fullScriptUrl + '#scene-' + match[1].toLowerCase();
                        link.textContent = match[1];
                        link.style.color = '#0366d6';
                        link.style.textDecoration = 'none';
                        link.style.cursor = 'pointer';
                        link.style.borderBottom = '1px dotted currentColor';
                        link.title = 'Jump to scene ' + match[1] + ' in full script';

                        fragment.appendChild(link);
                        lastIndex = scenePattern.lastIndex;
                      }

                      // Add remaining text
                      if (lastIndex < text.length) {
                        fragment.appendChild(
                          document.createTextNode(text.substring(lastIndex))
                        );
                      }

                      // Replace the text node with the new content
                      node.parentNode.replaceChild(fragment, node);
                    }
                  } else if (node.nodeType === Node.ELEMENT_NODE && !['SCRIPT', 'STYLE', 'A'].includes(node.tagName)) {
                    // Recursively process child elements, except script, style, and existing links
                    makeLinksInElement(node);
                  }
                });
              }

              // Only link scene numbers in the main content area
              const mainContent = document.querySelector('.main-content') || document.body;
              makeLinksInElement(mainContent);
            }

            // Run after page loads
            document.addEventListener('DOMContentLoaded', linkSceneNumbers);
            // Also run immediately in case DOM is already ready
            linkSceneNumbers();
        </script>
    </body>
</html>`;
}

function generateOverflowHtml(dayNum, planEntry, productionData) {
  const calendar = productionData.calendar || {};
  const dateStr = calendar[dayNum] || '—';
  const overflow = planEntry.overflow || [];
  const dayLabel = `Day ${dayNum}`;

  const shotRows = overflow.map((entry, index) => {
    const beat = entry.beat || `Shot ${index + 1}`;
    const title = entry.title || '';
    const description = entry.description || '';
    const cast = Array.isArray(entry.cast) ? entry.cast : [];
    const shotsHtml = Array.isArray(entry.shots) && entry.shots.length
      ? `<div style="margin-top:6px; padding-top:6px; border-top:1px solid #eee; font-size:0.72rem; color:#666;">
          <div style="font-weight:700; color:#555; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.03em;">Shots:</div>
          ${entry.shots.map(shot => {
            if (typeof shot === 'string') {
              return `<div style="margin-bottom:2px;">• ${markdownToHtml(shot)}</div>`;
            } else if (typeof shot === 'object' && shot.shot) {
              return `<div style="margin-bottom:2px;">• ${escapeHtml(shot.shot)}</div>`;
            }
            return '';
          }).join('')}
        </div>`
      : '';
    return `
      <li style="padding:10px 0; border-bottom:1px solid #ddd; display:block;">
        <div style="display:flex; gap:12px; justify-content:space-between; align-items:flex-start;">
          <div style="min-width:0; flex:1;">
            <div style="font-weight:700;">
              <span style="color:#555; font-size:0.78rem; margin-right:6px;">${index + 1}.</span>
              <span style="color:#111;">${escapeHtml(beat)}</span>
              ${title ? `<span style="color:#555; font-weight:600;"> — ${escapeHtml(title)}</span>` : ''}
            </div>
            ${description ? `<div style="font-size:0.75rem; color:#666; margin-top:4px; line-height:1.3; font-style:italic;">${escapeHtml(description)}</div>` : ''}
          </div>
          <div style="flex:0 0 32%; min-width:120px; text-align:right; font-size:0.78rem; color:#555; line-height:1.3;">
            ${cast.length ? escapeHtml(cast.map(n => nicknameToTitle(n)).join(', ')) : '—'}
          </div>
        </div>
        ${shotsHtml}
      </li>`;
  }).join('');

  return `<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <title>${dayLabel} Overflow — Shooting Script</title>
        <style>
            ${getProductionStyles()}
            .main-content { padding: 24px 22px 32px; margin: 0 auto; max-width: 920px; box-sizing: border-box; }
            body { background: #fff; color: #000; }
            .notice-bar { display:flex; justify-content:space-between; gap:10px; margin-bottom:10px; font-size:0.68rem; text-transform:uppercase; font-weight:700; color:#333; }
            .compact-panel { border: 1px solid #000; padding: 8px 10px; }
            .compact-label { font-size:0.7rem; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#555; margin-bottom:4px; }
        </style>
    </head>
    <body>
        <div class="main-content">
            <div class="notice-bar">
                <a href="${dayNum}.html" style="color:#0366d6; text-decoration:none;">&larr; Back to ${dayLabel}</a>
                <a href="../../shooting_production.html" style="color:#666; text-decoration:none;">Dashboard</a>
                <span></span>
            </div>
            <header style="border-bottom:2px solid #000; padding-bottom:8px; margin-bottom:14px;">
                <h1 style="margin:0;">OVERFLOW — ${dayLabel.toUpperCase()}</h1>
                <p style="margin:4px 0 0 0; font-size:0.78rem; letter-spacing:0.04em; text-transform:uppercase; color:#555;">${formatDate(dateStr)} · Shooting cut</p>
            </header>

            <section style="margin-top:8px;">
                <div class="compact-label">Overflow Shots</div>
                <div class="compact-panel">
                    <ol style="margin:0; padding-left:18px; list-style:none;">
                        ${shotRows}
                    </ol>
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

    const planEntry = (productionData.shootPlan || []).find(p => String(p.day) === String(dayNum));
    if (planEntry && Array.isArray(planEntry.overflow) && planEntry.overflow.length) {
      const overflowHtml = generateOverflowHtml(Number(dayNum), planEntry, productionData);
      const overflowPath = path.join(DAYS_DIR, `${dayNum}-overflow.html`);
      fs.writeFileSync(overflowPath, overflowHtml, 'utf8');
      console.log(`  ✓ Generated Day ${dayNum} Overflow Sheet`);
    }
  });
}

if (require.main === module) {
  compile();
}

module.exports = { compile };
