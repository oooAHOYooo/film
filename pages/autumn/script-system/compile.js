#!/usr/bin/env node

/**
 * Script Compiler — The Fall of Hibisicas (Autumn Film)
 * Reads manifest.json and compiles all scenes into a single full_script.md
 * and generates full_script.html for printing/viewing
 *
 * Usage: node compile.js
 *
 * Outputs:
 *   full_script.md       — raw markdown of the full compiled script
 *   full_script.html     — rendered, navigable HTML of the full script
 *   plot-cards-data.json — per-scene summary data used by the gallery
 *   index.html           — scene gallery page (generated from plot cards)
 */

const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.join(__dirname, 'scenes');
const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const OUTPUT_MD = path.join(__dirname, 'full_script.md');
const OUTPUT_HTML = path.join(__dirname, 'full_script.html');
const PLOT_CARDS_PATH = path.join(__dirname, 'plot-cards-data.json');
const SCRIPT_NAME = 'The Fall of Hibisicas';
const HUB_PATH = '/pages/autumn.html';
const HUB_LABEL = '🍂 Autumn';

// ─── Utilities ───────────────────────────────────────────────────────────────

function toRoman(num) {
    const map = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
    ];
    let n = num;
    let out = '';
    for (const [v, s] of map) {
        while (n >= v) {
            out += s;
            n -= v;
        }
    }
    return out;
}

// ─── Manifest ────────────────────────────────────────────────────────────────

function loadManifest() {
    try {
        const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
        return JSON.parse(manifestContent);
    } catch (error) {
        console.error('Error reading manifest.json:', error.message);
        process.exit(1);
    }
}

// ─── Scene file helpers ───────────────────────────────────────────────────────

function loadScene(filename) {
    const filePath = path.join(SCENES_DIR, filename);
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        console.warn(`Warning: Could not read scene file ${filename}: ${error.message}`);
        return `\n[SCENE FILE MISSING: ${filename}]\n`;
    }
}

// Extract <!-- nickname: foo-bar --> from scene content
function getNicknameFromScene(content) {
    if (!content || typeof content !== 'string') return null;
    const match = content.match(/<!--\s*nickname:\s*([^>]+?)\s*-->/i);
    return match ? match[1].trim() : null;
}

// Extract <!-- summary: ... --> from scene content
function getSummaryFromScene(content) {
    if (!content || typeof content !== 'string') return null;
    const match = content.match(/<!--\s*summary:\s*([\s\S]+?)\s*-->/i);
    return match ? match[1].trim() : null;
}

// "dallas-marsh-walk" → "Dallas Marsh Walk"
function nicknameToTitle(nickname) {
    if (!nickname) return '';
    return nickname
        .split(/[\s-]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Turn <!-- [ADDITION] --> / <!-- [DELETION] --> into wrapper divs + label
function sceneContentWithVisibleMarkers(content) {
    let out = content;
    out = out.replace(/<!-- \/(?:ADDITION|DELETION)] -->/g, '\n\n</div>\n\n');
    out = out.replace(/<!-- \[ADDITION\][\s\S]*?-->/g, '\n\n<div class="script-addition">\n\n> addition\n\n');
    out = out.replace(/<!-- \[DELETION\][\s\S]*?-->/g, '\n\n<div class="script-deletion">\n\n> deletion\n\n');
    return out;
}

function injectSceneComments(content, sceneNumber, scene) {
    const file = scene && scene.file ? String(scene.file) : '';
    const nickname = scene && (scene.nickname || scene.id) ? String(scene.nickname || scene.id) : '';
    const num = String(sceneNumber).padStart(2, '0');
    const header = `<!-- scene: ${num} file: ${file} nickname: ${nickname} -->`;

    let out = `${header}\n\n${content}`;
    out = out.replace(/^\(action\)\s*$/gim, `${header}\n\n(action)`);
    return out;
}

// ─── Markdown compilation ─────────────────────────────────────────────────────

function compileMarkdown(scenes) {
    let output = `# ${SCRIPT_NAME} — Full Script\n\n`;
    output += `*Compiled on ${new Date().toLocaleString()}*\n\n`;
    output += `---\n\n`;

    let currentAct = null;
    scenes.forEach((scene, index) => {
        const sceneNumber = index + 1;

        if (scene.act && scene.act !== currentAct) {
            currentAct = scene.act;
            const actTitle = scene.actTitle ? ` — ${scene.actTitle}` : '';
            output += `\n## ACT ${toRoman(scene.act)}${actTitle}\n\n---\n\n`;
        }

        output += `\n### Scene ${sceneNumber}: ${scene.title}\n\n`;
        output += `*${scene.act ? `ACT ${toRoman(scene.act)}${scene.actTitle ? ` — ${scene.actTitle}` : ''} | ` : ''}ID: ${scene.id} | File: ${scene.file}*\n\n`;
        output += `---\n\n`;

        let sceneContent = loadScene(scene.file);
        sceneContent = sceneContentWithVisibleMarkers(sceneContent);
        sceneContent = injectSceneComments(sceneContent, sceneNumber, scene);
        output += sceneContent;
        output += `\n\n---\n\n`;
    });

    return output;
}

// ─── Plot cards ───────────────────────────────────────────────────────────────

function deriveSummary(content) {
    if (!content || typeof content !== 'string') return '';
    const maxLen = 220;
    const lines = content
        .replace(/<!--[\s\S]*?-->/g, '\n')
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
    const actionParts = [];
    let inDialogue = false;
    for (const line of lines) {
        if (/^(INT\.|EXT\.|FADE|CUT\s|DISSOLVE|#)/i.test(line)) continue;
        if (/^\(action\)$/i.test(line)) continue;
        if (/^\([^)]+\)$/.test(line)) continue;
        if (/^[A-Z][A-Za-z\s]{2,}$/.test(line) && line === line.toUpperCase()) {
            inDialogue = true;
            continue;
        }
        if (inDialogue) {
            if (line.length < 2 || /^[A-Z]/.test(line)) continue;
            inDialogue = false;
        }
        if (line.length > 10 && !/^[A-Z][A-ZA-Z\s]+\n?$/.test(line)) {
            actionParts.push(line);
            const soFar = actionParts.join(' ').length;
            if (soFar >= maxLen) break;
        }
    }
    let text = actionParts.join(' ').replace(/\s+/g, ' ').replace(/[#*_~`]/g, '').trim();
    if (text.length > maxLen) {
        const cut = text.slice(0, maxLen).lastIndexOf(' ');
        text = (cut > 60 ? text.slice(0, cut) : text.slice(0, maxLen)) + '…';
    }
    return text || '';
}

function extractSceneBlocksFromFullScript(fullScriptMarkdown) {
    if (!fullScriptMarkdown || typeof fullScriptMarkdown !== 'string') return [];
    const blocks = [];
    const segments = fullScriptMarkdown.split(/(?=^### Scene \d+:)/m);
    for (let i = 1; i < segments.length; i++) {
        const s = segments[i];
        const afterDivider = s.indexOf('\n\n---\n\n');
        const content = afterDivider === -1 ? s : s.slice(afterDivider + '\n\n---\n\n'.length);
        const endMark = content.lastIndexOf('\n\n---');
        const body = endMark > 0 ? content.slice(0, endMark) : content;
        blocks.push(body.trim());
    }
    return blocks;
}

function writePlotCardsData(scenes, fullScriptMarkdown) {
    const sceneBlocks = fullScriptMarkdown ? extractSceneBlocksFromFullScript(fullScriptMarkdown) : [];
    const cards = scenes.map((scene, index) => {
        const n = index + 1;
        const id = scene.id || scene.nickname || `scene-${n}`;
        const raw = loadScene(scene.file);
        const nickname = getNicknameFromScene(raw);
        const inlineSummary = getSummaryFromScene(raw);
        const title = nickname ? nicknameToTitle(nickname) : (scene.title || `Scene ${n}`);
        const fullScriptBlock = sceneBlocks[index];
        const derived = fullScriptBlock ? deriveSummary(fullScriptBlock) : deriveSummary(raw);
        const summary = inlineSummary || derived;
        return {
            n,
            id,
            title,
            act: scene.act ?? 0,
            actTitle: scene.actTitle || '',
            summary: summary || `Scene ${n} — ${title}`,
        };
    });
    fs.writeFileSync(PLOT_CARDS_PATH, JSON.stringify(cards, null, 2) + '\n', 'utf8');
    console.log(`✓ Updated ${PLOT_CARDS_PATH}`);
    return cards;
}

// ─── HTML generation ──────────────────────────────────────────────────────────

function generateHTMLPage(markdown, scenes) {
    const sceneOptionsHtml = (scenes || []).map((s, i) => {
        const num = i + 1;
        const title = (s.title || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        return `<option value="scene-${num}">${num}. ${title}</option>`;
    }).join('');

    const html = String.raw`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Full Script - ${SCRIPT_NAME}</title>
  <link rel="stylesheet" href="script.css?v=${new Date().toISOString().split('T')[0]}">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body class="full-script-page">
  <div class="gallery-container">
    <!-- Vertical progress rail -->
    <div class="script-progress-rail no-print" id="scriptProgressRail" aria-hidden="true">
      <div class="script-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
        <div class="script-progress-fill" id="scriptProgressFill"></div>
      </div>
      <div class="script-progress-label" id="scriptProgressLabel">0</div>
    </div>

    <div class="script-sticky-bar no-print" id="scriptStickyBar">
      <div class="nav">
        <div class="nav-left">
          <a class="nav-link" href="/index.html" title="Home">
            <span class="nav-icon" aria-hidden="true">⌂</span>
            <span class="nav-text">Home</span>
          </a>
          <a class="nav-link" href="${HUB_PATH}" title="Autumn Hub">
            <span class="nav-icon" aria-hidden="true">🍂</span>
            <span class="nav-text">Autumn</span>
          </a>
          <a class="nav-link" href="index.html" title="Gallery">
            <span class="nav-icon" aria-hidden="true">▦</span>
            <span class="nav-text">Gallery</span>
          </a>
          <a class="nav-link" href="scene_outline.html" title="Scene Outline">
            <span class="nav-text">Scene Outline</span>
          </a>
        </div>
        <div class="nav-right">
          <div class="script-export-dropdown" id="scriptExportDropdown">
            <button type="button" class="print-button script-export-trigger" id="scriptExportTrigger" aria-haspopup="true" aria-expanded="false" aria-controls="scriptExportMenu">
              Export / Print
            </button>
            <div class="script-export-menu" id="scriptExportMenu" role="menu" aria-label="Export and print options">
              <button type="button" role="menuitem" onclick="downloadMarkdown()">Download .md</button>
              <button type="button" role="menuitem" onclick="printMarkdownPdf()">PDF (Markdown)</button>
              <button type="button" role="menuitem" onclick="window.print()">Print</button>
            </div>
          </div>
        </div>
      </div>

      <div class="script-stats-row">
        <div class="script-status-bar" id="scriptStatusBar" aria-hidden="true">
          <div class="script-status-scene-block">
            <span class="script-status-scene" id="scriptStatusScene">—</span>
            <span class="script-status-characters" id="scriptStatusCharacters">—</span>
          </div>
          <span class="script-status-divider">|</span>
          <span class="script-status-production" id="scriptStatusProduction">—</span>
        </div>
        <div class="script-scene-nav">
          <label for="scriptSceneSelect" class="script-scene-nav-label">Jump to scene</label>
          <select id="scriptSceneSelect" class="script-scene-select" aria-label="Jump to scene">
            <option value="">—</option>
            ${sceneOptionsHtml}
          </select>
        </div>
      </div>
    </div>

    <div class="screenplay-container">
      <div class="full-script-header">
        <div class="full-script-title">${SCRIPT_NAME} — Full Script</div>
        <div class="full-script-meta">Compiled on ${new Date().toLocaleString()}</div>
      </div>
      <div class="screenplay-content" id="scriptContent"></div>
    </div>
  </div>

  <script>
    const markdown = ${JSON.stringify(markdown)};
    const MARKDOWN_FILE_NAME = 'the_fall_of_hibisicas_full_script.md';

    function downloadMarkdown() {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = MARKDOWN_FILE_NAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }

    function printMarkdownPdf() {
      const printable = window.open('', '_blank', 'noopener,noreferrer');
      if (!printable) return;
      const escaped = String(markdown)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      const title = document.title.replace(/<\/?[^>]+>/g, '');
      printable.document.write([
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '  <meta charset="UTF-8">',
        '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
        '  <title>' + title + ' - Markdown</title>',
        '  <style>',
        '    body { margin: 1in; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }',
        '    pre { white-space: pre-wrap; line-height: 1.35; font-size: 11pt; }',
        '  </style>',
        '</head>',
        '<body>',
        '  <pre>' + escaped + '</pre>',
        '</body>',
        '</html>',
      ].join('\n'));
      printable.document.close();
      printable.focus();
      printable.print();
      printable.onafterprint = () => printable.close();
    }

    const container = document.getElementById('scriptContent');
    marked.setOptions({ breaks: true });
    container.innerHTML = marked.parse(markdown);

    // Export dropdown
    (function initExportDropdown() {
      var trigger = document.getElementById('scriptExportTrigger');
      var menu = document.getElementById('scriptExportMenu');
      if (!trigger || !menu) return;
      function open() {
        menu.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
      }
      function close() {
        menu.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (menu.classList.contains('is-open')) close(); else open();
      });
      menu.querySelectorAll('button').forEach(function(btn) {
        btn.addEventListener('click', function() { close(); });
      });
      document.addEventListener('click', function() { close(); });
    })();

    // Format screenplay elements
    formatScreenplay(document.querySelector('.screenplay-container'));

    // Progress rail + runtime estimate
    (function initScriptStatsAndProgress() {
      const WORDS_PER_PAGE = 250;
      const progressFill = document.getElementById('scriptProgressFill');
      const progressLabel = document.getElementById('scriptProgressLabel');
      const progressBar = document.querySelector('.script-progress-bar');
      if (!progressFill) return;
      const wordCount = (typeof markdown === 'string' ? markdown : '')
        .split(/\s+/).filter(Boolean).length;
      const MIN_PAGES = 90;
      const rawPages = Math.round((wordCount / WORDS_PER_PAGE) * 10) / 10;
      const estimatedPages = Math.max(MIN_PAGES, rawPages);
      const estimatedMinutes = Math.max(MIN_PAGES, Math.round(estimatedPages));
      function updateProgress() {
        const docEl = document.documentElement;
        const scrollTop = docEl.scrollTop || document.body.scrollTop;
        const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
        if (scrollHeight <= 0) {
          progressFill.style.height = '0%';
          progressLabel.textContent = '0 / ' + estimatedMinutes;
          if (progressBar) progressBar.setAttribute('aria-valuenow', 0);
          return;
        }
        const pct = Math.min(1, Math.max(0, scrollTop / scrollHeight));
        const currentMinute = Math.min(estimatedMinutes, Math.floor(pct * estimatedMinutes));
        progressFill.style.height = (pct * 100) + '%';
        progressLabel.textContent = currentMinute + ' / ' + estimatedMinutes;
        if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(pct * 100));
      }
      updateProgress();
      window.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('resize', updateProgress);
    })();

    // Scene nav: ids on h3s + dropdown
    (function initSceneNav() {
      const content = document.getElementById('scriptContent');
      const selectEl = document.getElementById('scriptSceneSelect');
      if (!content || !selectEl) return;
      const sceneHeadings = content.querySelectorAll('h3');
      const sceneHeadingRe = /^Scene \d+:/i;
      sceneHeadings.forEach((h3, i) => {
        const text = (h3.textContent || '').trim();
        if (sceneHeadingRe.test(text)) h3.id = 'scene-' + (i + 1);
      });
      selectEl.addEventListener('change', function() {
        const value = this.value;
        if (!value) return;
        const el = document.getElementById(value);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.value = '';
      });
    })();

    // Status bar: current scene, characters, production tag
    (function initStatusBar() {
      const content = document.getElementById('scriptContent');
      const sceneEl = document.getElementById('scriptStatusScene');
      const charsEl = document.getElementById('scriptStatusCharacters');
      const prodEl = document.getElementById('scriptStatusProduction');
      if (!content || !sceneEl) return;
      function getSceneHeadingsInOrder() {
        const h3s = content.querySelectorAll('h3[id^="scene-"]');
        return Array.from(h3s).sort((a, b) => {
          const nA = parseInt(a.id.replace('scene-', ''), 10);
          const nB = parseInt(b.id.replace('scene-', ''), 10);
          return nA - nB;
        });
      }
      function getSceneBlock(sceneH3, nextSceneH3) {
        const chars = new Set();
        let firstSlug = '';
        let node = sceneH3.nextSibling;
        while (node) {
          if (node === nextSceneH3) break;
          if (node.nodeType === 1) {
            if (node.classList && node.classList.contains('character-name')) {
              const name = (node.textContent || '').trim();
              if (name) chars.add(name);
            }
            if (!firstSlug && node.classList && node.classList.contains('scene-heading')) {
              firstSlug = (node.textContent || '').trim();
            }
          }
          node = node.nextSibling;
        }
        return { characters: Array.from(chars), production: firstSlug };
      }
      function updateStatusBar() {
        const sceneHeadings = getSceneHeadingsInOrder();
        if (sceneHeadings.length === 0) return;
        const viewportThreshold = 160;
        let current = sceneHeadings[0];
        for (let i = 0; i < sceneHeadings.length; i++) {
          const top = sceneHeadings[i].getBoundingClientRect().top;
          if (top <= viewportThreshold) current = sceneHeadings[i];
        }
        const title = (current.textContent || '').trim();
        const nextId = current.id.replace('scene-', '');
        const nextNum = parseInt(nextId, 10) + 1;
        const nextScene = document.getElementById('scene-' + nextNum);
        const block = getSceneBlock(current, nextScene || null);
        sceneEl.textContent = title || '—';
        charsEl.textContent = block.characters.length ? block.characters.join(', ') : '—';
        prodEl.textContent = block.production || '—';
      }
      updateStatusBar();
      window.addEventListener('scroll', updateStatusBar, { passive: true });
      window.addEventListener('resize', updateStatusBar);
    })();

    function looksLikeActionIntro(text) {
      if (!text || text.length < 15) return false;
      if (/^\(.+\)$/.test(text)) return false;
      if (/^(INT\.|EXT\.|FADE|CUT|DISSOLVE)/i.test(text)) return false;
      if (/^[A-Z][a-z]+,\s*(?:Mid\s*\d+s|\d+s|[A-Za-z\s]+),/.test(text) && /[a-z]/.test(text)) return true;
      if (/^[A-Z][a-z]+,\s*(?:Mid\s*\d+s|\d+s)\s*[,.]/.test(text)) return true;
      return false;
    }

    function formatScreenplay(container) {
      const content = container.querySelector('.screenplay-content');
      if (!content) return;
      normalizeParagraphBreaks(content);
      const paragraphs = content.querySelectorAll('p');
      let inDialogueBlock = false;
      paragraphs.forEach((p, index) => {
        const text = p.textContent.trim();
        const nextP = paragraphs[index + 1];
        const prevP = paragraphs[index - 1];
        if (!text) return;
        if (p.classList.length > 0 && !p.classList.contains('line-split')) return;
        if (/^(INT\.|EXT\.)/i.test(text)) {
          p.className = 'scene-heading';
          p.textContent = text.toUpperCase();
          inDialogueBlock = false;
          return;
        }
        if (/^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT)/i.test(text)) {
          p.className = 'transition';
          p.textContent = text.toUpperCase();
          inDialogueBlock = false;
          return;
        }
        if (/^\(action\)$/i.test(text)) {
          p.className = 'action-break';
          p.textContent = '';
          inDialogueBlock = false;
          return;
        }
        if (/^\(.+\)$/.test(text)) {
          p.className = 'parenthetical';
          inDialogueBlock = true;
          return;
        }
        if (looksLikeActionIntro(text)) {
          p.className = 'action-line';
          inDialogueBlock = false;
          return;
        }
        const isAllCaps = /^[A-Z][A-Z\s\.'-]+$/.test(text) && text === text.toUpperCase();
        const isReasonableLength = text.length > 2 && text.length < 35;
        const isNotSceneHeading = !/^(INT\.|EXT\.|FADE|CUT|DISSOLVE)/i.test(text);
        if (isAllCaps && isReasonableLength && isNotSceneHeading) {
          const nextText = nextP ? nextP.textContent.trim() : '';
          const looksLikeDialogue = nextText && (
            /^\(.+\)$/.test(nextText) ||
            (!/^(INT\.|EXT\.|FADE|CUT|DISSOLVE)/i.test(nextText) &&
             !/^[A-Z][A-Z\s\.'-]+$/.test(nextText))
          );
          if (looksLikeDialogue || !prevP || prevP.classList.contains('action-line') || prevP.classList.contains('scene-heading')) {
            p.className = 'character-name';
            inDialogueBlock = true;
            return;
          }
        }
        const looksLikeNewBlock = /^(INT\.|EXT\.|FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT)/i.test(text);
        const looksLikeCharacter = isAllCaps && isReasonableLength && isNotSceneHeading;
        if (!looksLikeNewBlock && !looksLikeActionIntro(text) && inDialogueBlock && prevP &&
            (prevP.classList.contains('character-name') || prevP.classList.contains('parenthetical') || prevP.classList.contains('dialogue'))) {
          p.className = 'dialogue';
          inDialogueBlock = true;
          return;
        }
        if (looksLikeCharacter || looksLikeNewBlock) inDialogueBlock = false;
        p.className = 'action-line';
        inDialogueBlock = false;
      });
      const ps = content.querySelectorAll('p');
      ps.forEach((p, i) => {
        if (!p.classList.contains('dialogue') && !p.classList.contains('parenthetical')) return;
        const next = ps[i + 1];
        if (!next || (!next.classList.contains('dialogue') && !next.classList.contains('parenthetical'))) {
          if (p.classList.contains('dialogue')) p.classList.add('dialogue-last');
          if (p.classList.contains('parenthetical')) p.classList.add('parenthetical-last');
        }
      });
    }

    function normalizeParagraphBreaks(content) {
      const paragraphs = Array.from(content.querySelectorAll('p'));
      paragraphs.forEach((p) => {
        if (!p.querySelector('br')) return;
        const parts = p.innerHTML
          .split(/<br\s*\/?>/i)
          .map((s) => s.replace(/&nbsp;/g, ' ').trim())
          .filter(Boolean);
        if (parts.length <= 1) return;
        const frag = document.createDocumentFragment();
        parts.forEach((html) => {
          const np = document.createElement('p');
          np.innerHTML = html;
          frag.appendChild(np);
        });
        p.replaceWith(frag);
      });
    }
  </script>
</body>
</html>
  `.trim();

    return html;
}

function generateGalleryPage(cardsData) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SCRIPT_NAME} Script - Scene Gallery</title>
  <link rel="stylesheet" href="script.css?v=${new Date().toISOString().split('T')[0]}">
</head>
<body class="plot-cards-page">
  <div class="gallery-container">
    <header class="plot-cards-header">
      <h1>${SCRIPT_NAME} Script</h1>
      <p class="plot-cards-subtitle">Scene gallery — main beats per scene · <a href="full_script.html">Open Full Script</a> to jump to any scene</p>
    </header>

    <nav class="nav no-print plot-cards-nav">
      <div class="nav-left">
        <a class="nav-link" href="${HUB_PATH}" title="Autumn Hub">${HUB_LABEL}</a>
        <a class="nav-link nav-link--active" href="index.html" title="Gallery">▦ Gallery</a>
        <a class="nav-link" href="full_script.html" title="Full Script">Full Script</a>
        <a class="nav-link" href="scene_outline.html" title="Scene Outline">Scene Outline</a>
      </div>
    </nav>

    <div class="plot-cards-grid" id="plotCardsGrid" aria-label="Scene index cards">
      <!-- Cards injected by JS -->
    </div>
  </div>

  <script>
    (function() {
      const CARDS_DATA = ${JSON.stringify(cardsData)};
      const grid = document.getElementById('plotCardsGrid');

      function toRoman(num) {
        const map = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
        let n = num, out = '';
        for (const [v, s] of map) {
          while (n >= v) { out += s; n -= v; }
        }
        return out;
      }

      function renderCards(cards) {
        if (!cards || !cards.length) {
          grid.innerHTML = '<p class="plot-cards-loading">No card data available.</p>';
          return;
        }
        let currentAct = null;
        cards.forEach(function(card) {
          if (card.act !== currentAct) {
            currentAct = card.act;
            const actLabel = document.createElement('div');
            actLabel.className = 'plot-cards-act-label';
            actLabel.setAttribute('aria-hidden', 'true');
            actLabel.textContent = 'ACT ' + toRoman(card.act) + ' — ' + (card.actTitle || '');
            grid.appendChild(actLabel);
          }
          const cardDiv = document.createElement('div');
          cardDiv.className = 'plot-card';
          cardDiv.innerHTML =
            '<span class="plot-card-number">' + card.n + '</span>' +
            '<h2 class="plot-card-title">' + escapeHtml(card.title) + '</h2>' +
            '<p class="plot-card-summary">' + escapeHtml(card.summary) + '</p>' +
            '<div class="plot-card-links" style="margin-top: auto; display: flex; gap: 0.75rem; border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 1rem; font-size: 0.8rem;">' +
              '<a href="full_script.html#scene-' + card.n + '" class="plot-card-link" style="text-decoration: none; font-weight: 600;">Full Script</a>' +
              '<a href="scene.html?id=' + encodeURIComponent(card.id) + '" class="plot-card-link" style="text-decoration: none; color: var(--muted); border-left: 1px solid var(--border); padding-left: 0.75rem;">Preview</a>' +
            '</div>';
          grid.appendChild(cardDiv);
        });
      }

      function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }

      renderCards(CARDS_DATA);
    })();
  </script>
</body>
</html>`;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function compile() {
    console.log('Loading manifest...');
    const scenes = loadManifest();
    console.log(`Found ${scenes.length} scenes in manifest`);

    console.log('Compiling scenes...');
    const markdown = compileMarkdown(scenes);

    console.log('Writing full_script.md...');
    fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');
    console.log(`✓ Created ${OUTPUT_MD}`);

    console.log('Generating full_script.html...');
    const html = generateHTMLPage(markdown, scenes);
    fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
    console.log(`✓ Created ${OUTPUT_HTML}`);

    console.log('Updating plot cards...');
    const plotCardsData = writePlotCardsData(scenes, markdown);

    console.log('Generating index.html (Gallery)...');
    const galleryHtml = generateGalleryPage(plotCardsData);
    const galleryPath = path.join(__dirname, 'index.html');
    fs.writeFileSync(galleryPath, galleryHtml, 'utf8');
    console.log(`✓ Created ${galleryPath}`);

    console.log('\n✓ Compilation complete!');
    console.log(`  - Markdown: ${OUTPUT_MD}`);
    console.log(`  - HTML: ${OUTPUT_HTML}`);
    console.log(`  - Plot cards: ${PLOT_CARDS_PATH}`);
    console.log(`  - Gallery: ${galleryPath}`);
}

if (require.main === module) {
    compile();
}

module.exports = { compile, loadManifest, loadScene };
