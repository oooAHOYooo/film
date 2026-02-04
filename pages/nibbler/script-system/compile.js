#!/usr/bin/env node

/**
 * Script Compiler — The Nibbler
 * Reads manifest.json and compiles all scenes into full_script.md and full_script.html
 */

const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.join(__dirname, 'scenes');
const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const OUTPUT_MD = path.join(__dirname, 'full_script.md');
const OUTPUT_HTML = path.join(__dirname, 'full_script.html');
const SCRIPT_NAME = 'The Nibbler';

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

function loadManifest() {
  try {
    const manifestContent = fs.readFileSync(MANIFEST_PATH, 'utf8');
    return JSON.parse(manifestContent);
  } catch (error) {
    console.error('Error reading manifest.json:', error.message);
    process.exit(1);
  }
}

function loadScene(filename) {
  const filePath = path.join(SCENES_DIR, filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`Warning: Could not read scene file ${filename}: ${error.message}`);
    return `\n[SCENE FILE MISSING: ${filename}]\n`;
  }
}

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

    const sceneContent = loadScene(scene.file);
    output += sceneContent;
    output += `\n\n---\n\n`;
  });

  return output;
}

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
  <link rel="stylesheet" href="/pages/summer/script-system/script.css?v=20260108-5">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <div class="gallery-container">
    <div class="script-sticky-bar no-print" id="scriptStickyBar">
      <div class="nav">
        <div class="nav-left">
          <a href="/pages/">← Film Hub</a>
          <a href="/pages/nibbler/">← Nibbler</a>
        </div>
        <button type="button" class="print-button" onclick="window.print()">Print</button>
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
      <div class="script-progress" id="scriptProgress" aria-hidden="true">
        <div class="script-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
          <div class="script-progress-fill" id="scriptProgressFill"></div>
        </div>
        <div class="script-progress-label" id="scriptProgressLabel">Minute 0</div>
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
    const container = document.getElementById('scriptContent');
    marked.setOptions({ breaks: true });
    container.innerHTML = marked.parse(markdown);
    formatScreenplay(document.querySelector('.screenplay-container'));

    (function initScriptStatsAndProgress() {
      const WORDS_PER_PAGE = 250;
      const content = document.getElementById('scriptContent');
      const progressFill = document.getElementById('scriptProgressFill');
      const progressLabel = document.getElementById('scriptProgressLabel');
      const progressBar = document.querySelector('.script-progress-bar');
      if (!progressFill) return;
      const wordCount = (typeof markdown === 'string' ? markdown : (content && content.textContent) || '').split(/\s+/).filter(Boolean).length;
      const MIN_PAGES = 90;
      const rawPages = Math.round((wordCount / WORDS_PER_PAGE) * 10) / 10;
      const estimatedPages = Math.max(MIN_PAGES, rawPages);
      const estimatedMinutes = Math.max(MIN_PAGES, Math.round(estimatedPages));
      function updateProgress() {
        const docEl = document.documentElement;
        const scrollTop = docEl.scrollTop || document.body.scrollTop;
        const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
        if (scrollHeight <= 0) {
          progressFill.style.width = '0%';
          progressLabel.textContent = 'Minute 0 of ' + estimatedMinutes;
          if (progressBar) progressBar.setAttribute('aria-valuenow', 0);
          return;
        }
        const pct = Math.min(1, Math.max(0, scrollTop / scrollHeight));
        const currentMinute = Math.min(estimatedMinutes, Math.floor(pct * estimatedMinutes));
        progressFill.style.width = (pct * 100) + '%';
        progressLabel.textContent = 'Minute ' + currentMinute + ' of ' + estimatedMinutes;
        if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(pct * 100));
      }
      updateProgress();
      window.addEventListener('scroll', updateProgress, { passive: true });
      window.addEventListener('resize', updateProgress);
    })();

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
            if (!firstSlug && node.classList && node.classList.contains('scene-heading')) firstSlug = (node.textContent || '').trim();
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

    function formatScreenplay(container) {
      const content = container.querySelector('.screenplay-content');
      if (!content) return;
      function normalizeParagraphBreaks(content) {
        const paragraphs = Array.from(content.querySelectorAll('p'));
        paragraphs.forEach((p) => {
          if (!p.querySelector('br')) return;
          const parts = p.innerHTML.split(/<br\s*\/?\s*>/i).map((s) => s.replace(/&nbsp;/g, ' ').trim()).filter(Boolean);
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
      normalizeParagraphBreaks(content);
      const paragraphs = content.querySelectorAll('p');
      let inDialogueBlock = false;
      paragraphs.forEach((p, index) => {
        const text = p.textContent.trim();
        const nextP = paragraphs[index + 1];
        const prevP = paragraphs[index - 1];
        if (!text) return;
        if (p.classList.length > 0 && !p.classList.contains('line-split')) return;
        if (/^(INT\.|EXT\.)/i.test(text)) { p.className = 'scene-heading'; p.textContent = text.toUpperCase(); inDialogueBlock = false; return; }
        if (/^(FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT)/i.test(text)) { p.className = 'transition'; p.textContent = text.toUpperCase(); inDialogueBlock = false; return; }
        if (/^\(.+\)$/.test(text)) { p.className = 'parenthetical'; inDialogueBlock = true; return; }
        const isAllCaps = /^[A-Z][A-Z\s\.'-]+$/.test(text) && text === text.toUpperCase();
        const isReasonableLength = text.length > 2 && text.length < 35;
        const isNotSceneHeading = !/^(INT\\.|EXT\\.|FADE|CUT|DISSOLVE)/i.test(text);
        if (isAllCaps && isReasonableLength && isNotSceneHeading) {
          const nextText = nextP ? nextP.textContent.trim() : '';
          const looksLikeDialogue = nextText && (/^\(.+\)$/.test(nextText) || (!/^(INT\.|EXT\.|FADE|CUT|DISSOLVE)/i.test(nextText) && !/^[A-Z][A-Z\s\.'-]+$/.test(nextText)));
          if (looksLikeDialogue || !prevP || prevP.classList.contains('action-line') || prevP.classList.contains('scene-heading')) {
            p.className = 'character-name';
            inDialogueBlock = true;
            return;
          }
        }
        const looksLikeNewBlock = /^(INT\.|EXT\.|FADE IN|FADE OUT|CUT TO|DISSOLVE TO|SMASH CUT|MATCH CUT)/i.test(text);
        const looksLikeCharacter = isAllCaps && isReasonableLength && isNotSceneHeading;
        if (!looksLikeNewBlock && inDialogueBlock && prevP && (prevP.classList.contains('character-name') || prevP.classList.contains('parenthetical') || prevP.classList.contains('dialogue'))) {
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
  </script>
</body>
</html>
  `.trim();

  return html;
}

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
  console.log('\n✓ Compilation complete!');
  console.log(`  - Markdown: ${OUTPUT_MD}`);
  console.log(`  - HTML: ${OUTPUT_HTML}`);
}

if (require.main === module) {
  compile();
}

module.exports = { compile, loadManifest, loadScene };
