#!/usr/bin/env node

/**
 * Script Compiler
 * Reads manifest.json and compiles all scenes into a single full_script.md
 * and generates full_script.html for printing/viewing
 */

const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.join(__dirname, 'scenes');
const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const OUTPUT_MD = path.join(__dirname, 'full_script.md');
const OUTPUT_HTML = path.join(__dirname, 'full_script.html');
const PLOT_CARDS_PATH = path.join(__dirname, 'plot-cards-data.json');
const SCRIPT_NAME = 'Creatures in the Tall Grass Script';

// Scene file → plot point number(s) for plot-cards summary tags (from plot-points-scene-map)
const PLOT_POINT_BY_FILE = {
  's08.md': [1],
  's12.md': [2],
  's13.md': [2],
  's19.md': [3],
  's20.md': [3],
  's21.md': [3],
  's23.md': [4],
  's24.md': [5, 6],
  's25.md': [7],
  's26.md': [8, 9, 10],
  's27.md': [11],
  's28.md': [12, 13],
  's29.md': [14],
};

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

// Read manifest
function loadManifest() {
  try {
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
    return JSON.parse(manifestContent);
  } catch (error) {
    console.error('Error reading manifest.json:', error.message);
    process.exit(1);
  }
}

// Read a scene file
function loadScene(filename) {
  const filePath = path.join(SCENES_DIR, filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`Warning: Could not read scene file ${filename}: ${error.message}`);
    return `\n[SCENE FILE MISSING: ${filename}]\n`;
  }
}

// Extract nickname from first line of scene content: <!-- nickname: foo-bar -->
function getNicknameFromScene(content) {
  if (!content || typeof content !== 'string') return null;
  const match = content.match(/<!--\s*nickname:\s*([^>]+?)\s*-->/i);
  return match ? match[1].trim() : null;
}

// Turn nickname into display title: "dallas-marsh-walk" → "Dallas Marsh Walk", "shadow walk" → "Shadow Walk"
function nicknameToTitle(nickname) {
  if (!nickname) return '';
  return nickname
    .split(/[\s-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Turn <!-- [ADDITION] --> / <!-- [DELETION] --> into wrapper divs + label; text inside gets colored
function sceneContentWithVisibleMarkers(content) {
  let out = content;
  out = out.replace(/<!-- \[\/(?:ADDITION|DELETION)\] -->/g, '\n\n</div>\n\n');
  out = out.replace(/<!-- \[ADDITION\][\s\S]*?-->/g, '\n\n<div class="script-addition">\n\n> addition\n\n');
  out = out.replace(/<!-- \[DELETION\][\s\S]*?-->/g, '\n\n<div class="script-deletion">\n\n> deletion\n\n');
  return out;
}

function injectSceneComments(content, sceneNumber, scene) {
  const file = scene && scene.file ? String(scene.file) : '';
  const nickname = scene && (scene.nickname || scene.id) ? String(scene.nickname || scene.id) : '';
  const num = String(sceneNumber).padStart(2, '0');
  const header = `<!-- scene: ${num} file: ${file} nickname: ${nickname} -->`;

  // Ensure one header at top (even if the scene already has a nickname comment)
  let out = `${header}\n\n${content}`;

  // Before every explicit action-break marker, inject a scene header comment.
  // This helps when scanning raw markdown without affecting rendered output.
  out = out.replace(/^\(action\)\s*$/gim, `${header}\n\n(action)`);
  return out;
}

// Compile all scenes into markdown
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

// Generate HTML from markdown (simple conversion)
function markdownToHTML(markdown) {
  // Simple markdown to HTML conversion
  // For production, you might want to use a library like marked
  let html = markdown
    // Headers
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Line breaks
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>');
  
  return `<p>${html}</p>`;
}

// Generate full HTML page
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
  <link rel="stylesheet" href="script.css?v=20260108-5">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body class="full-script-page">
  <div class="gallery-container">
    <!-- Vertical progress rail: fixed left, timeline progression -->
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
          <a class="nav-link" href="/pages/summer.html" title="Summer Hub">
            <span class="nav-icon" aria-hidden="true">☀</span>
            <span class="nav-text">Summer</span>
          </a>
          <a class="nav-link" href="index.html" title="Gallery">
            <span class="nav-icon" aria-hidden="true">▦</span>
            <span class="nav-text">Gallery</span>
          </a>
          <a class="nav-link" href="/pages/summer/directors-notes/index.html" title="Director's Notes (hub)">
            <span class="nav-icon" aria-hidden="true">📝</span>
            <span class="nav-text">Director's Notes</span>
          </a>
          <a class="nav-link" href="/pages/summer/directors-notes/full_notes.html" title="Director's Notes (compiled)">
            <span class="nav-text">Full Notes</span>
          </a>
          <a class="nav-link" href="/pages/summer/characters/index.html" title="Character Sheets">
            <span class="nav-icon" aria-hidden="true">👤</span>
            <span class="nav-text">Characters</span>
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
    const MARKDOWN_FILE_NAME = 'creatures_in_the_tall_grass_full_script.md';

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

    // Export dropdown: toggle on trigger click, close on outside click or menu action
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

    // Filmmaking-style page length & runtime (1 page ≈ 1 minute; ~250 words/page)
    // Count from raw markdown so we get the full script (DOM textContent can undercount)
    (function initScriptStatsAndProgress() {
      const WORDS_PER_PAGE = 250;
      const content = document.getElementById('scriptContent');
      const progressFill = document.getElementById('scriptProgressFill');
      const progressLabel = document.getElementById('scriptProgressLabel');
      const progressBar = document.querySelector('.script-progress-bar');

      if (!progressFill) return;

      const wordCount = (typeof markdown === 'string' ? markdown : (content && content.textContent) || '')
        .split(/\s+/)
        .filter(Boolean)
        .length;
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

    // Scene nav: add ids to scene headings and wire dropdown to scroll
    (function initSceneNav() {
      const content = document.getElementById('scriptContent');
      const selectEl = document.getElementById('scriptSceneSelect');
      if (!content || !selectEl) return;

      const sceneHeadings = content.querySelectorAll('h3');
      const sceneHeadingRe = /^Scene \d+:/i;
      sceneHeadings.forEach((h3, i) => {
        const text = (h3.textContent || '').trim();
        if (sceneHeadingRe.test(text)) {
          h3.id = 'scene-' + (i + 1);
        }
      });

      selectEl.addEventListener('change', function() {
        const value = this.value;
        if (!value) return;
        const el = document.getElementById(value);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        this.value = '';
      });
    })();

    // Status bar: current scene, who's in scene, production tags (updates on scroll)
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
        
        // Skip if already formatted (but allow normalizeParagraphBreaks output)
        if (!text) return;
        if (p.classList.length > 0 && !p.classList.contains('line-split')) return;
        
        // Scene headings (INT. or EXT. at start of line)
        if (/^(INT\.|EXT\.)/i.test(text)) {
          p.className = 'scene-heading';
          p.textContent = text.toUpperCase();
          inDialogueBlock = false;
          return;
        }
        
        // Transitions (right-aligned, uppercase)
        if (/^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT)/i.test(text)) {
          p.className = 'transition';
          p.textContent = text.toUpperCase();
          inDialogueBlock = false;
          return;
        }

        // Action break: (action) on its own line — ends dialogue block, next line is action; line is hidden
        if (/^\(action\)$/i.test(text)) {
          p.className = 'action-break';
          p.textContent = '';
          inDialogueBlock = false;
          return;
        }
        
        // Parentheticals (text in parentheses, italic) - check before character names
        if (/^\(.+\)$/.test(text)) {
          p.className = 'parenthetical';
          inDialogueBlock = true;
          return;
        }

        // Action lines that introduce a character or describe action (e.g. "Janice, Mid 50s, puts her hand...")
        // Never treat these as dialogue so they don't get wrapped with the previous speaker
        if (looksLikeActionIntro(text)) {
          p.className = 'action-line';
          inDialogueBlock = false;
          return;
        }
        
        // Character names (all caps, typically short, not scene headings)
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
        
        // Dialogue (follows character name / parenthetical / dialogue)
        const looksLikeNewBlock = /^(INT\.|EXT\.|FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT)/i.test(text);
        const looksLikeCharacter = isAllCaps && isReasonableLength && isNotSceneHeading;
        if (!looksLikeNewBlock && !looksLikeActionIntro(text) && inDialogueBlock && prevP && (prevP.classList.contains('character-name') || prevP.classList.contains('parenthetical') || prevP.classList.contains('dialogue'))) {
          p.className = 'dialogue';
          inDialogueBlock = true;
          return;
        }
        
        // If we're in a dialogue block but this doesn't match, end the block
        if (looksLikeCharacter || looksLikeNewBlock) {
          inDialogueBlock = false;
        }
        
        // Default: action line
        p.className = 'action-line';
        inDialogueBlock = false;
      });

      // Add markers for last line in dialogue / parenthetical blocks (spacing)
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

    // Split <p> blocks that contain <br> into separate <p>s per line.
    // This lets screenplay formatting work even if the markdown uses single newlines.
    function normalizeParagraphBreaks(content) {
      const paragraphs = Array.from(content.querySelectorAll('p'));
      paragraphs.forEach((p) => {
        if (!p.querySelector('br')) return;
        const parts = p.innerHTML
          .split(/<br\s*\/?\s*>/i)
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

// Load existing plot-cards-data.json to preserve user-edited summaries (keyed by id)
function loadExistingPlotCards() {
  try {
    const raw = fs.readFileSync(PLOT_CARDS_PATH, 'utf8');
    const arr = JSON.parse(raw);
    const byId = new Map();
    (Array.isArray(arr) ? arr : []).forEach((card) => {
      if (card.id) byId.set(card.id, card.summary);
    });
    return byId;
  } catch {
    return new Map();
  }
}

// Derive a one-line summary from scene content (first substantial action text)
function deriveSummary(content) {
  if (!content || typeof content !== 'string') return '';
  const maxLen = 200;
  let text = content
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^[\s\S]*?^(?:INT\.|EXT\.)[^\n]*/im, '')
    .replace(/\n[A-Z][A-Za-z\s]+\n(?:\([^)]*\)\n)?/g, ' ') // character + dialogue
    .replace(/\(action\)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length > maxLen) {
    const cut = text.slice(0, maxLen).lastIndexOf(' ');
    text = (cut > 80 ? text.slice(0, cut) : text.slice(0, maxLen)) + '…';
  }
  return text || '';
}

function formatPlotPointTag(plotNums) {
  if (!plotNums || plotNums.length === 0) return '';
  if (plotNums.length === 1) return ` [Plot ${plotNums[0]}]`;
  return ` [Plot ${plotNums[0]}–${plotNums[plotNums.length - 1]}]`;
}

// Write plot-cards-data.json from manifest; titles from scene nickname; preserve or derive summaries
function writePlotCardsData(scenes) {
  const existingSummaries = loadExistingPlotCards();
  const cards = scenes.map((scene, index) => {
    const n = index + 1;
    const id = scene.id || scene.nickname || `scene-${n}`;
    const raw = loadScene(scene.file);
    const nickname = getNicknameFromScene(raw);
    const title = nickname ? nicknameToTitle(nickname) : (scene.title || `Scene ${n}`);
    let summary = existingSummaries.get(id);
    if (summary == null || summary === '') {
      summary = deriveSummary(raw);
    }
    const plotNums = PLOT_POINT_BY_FILE[scene.file];
    if (plotNums && summary && !/\[Plot \d+/.test(summary)) {
      summary = summary.replace(/\s*…?\s*$/, '') + formatPlotPointTag(plotNums);
    }
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
}

// Main compilation function
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
  writePlotCardsData(scenes);

  console.log('\n✓ Compilation complete!');
  console.log(`  - Markdown: ${OUTPUT_MD}`);
  console.log(`  - HTML: ${OUTPUT_HTML}`);
  console.log(`  - Plot cards: ${PLOT_CARDS_PATH}`);
}

// Run if called directly
if (require.main === module) {
  compile();
}

module.exports = { compile, loadManifest, loadScene };
