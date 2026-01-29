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
const SCRIPT_NAME = 'Creatures in the Tall Grass Script';

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
    
    const sceneContent = loadScene(scene.file);
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
<body>
  <div class="gallery-container">
    <div class="script-sticky-bar no-print" id="scriptStickyBar">
      <div class="nav">
        <div class="nav-left">
          <a href="/pages/summer.html">← Summer Hub</a>
          <a href="index.html">← Back to Gallery</a>
        </div>
        <button type="button" class="print-button" onclick="window.print()">Print</button>
      </div>

      <div class="script-stats-row">
        <div class="script-stats" id="scriptStats" aria-hidden="true">
          <span class="script-pages" id="scriptPages">—</span>
          <span class="script-runtime" id="scriptRuntime">—</span>
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
    
    // Format screenplay elements
    formatScreenplay(document.querySelector('.screenplay-container'));

    // Filmmaking-style page length & runtime (1 page ≈ 1 minute; ~250 words/page)
    // Count from raw markdown so we get the full script (DOM textContent can undercount)
    (function initScriptStatsAndProgress() {
      const WORDS_PER_PAGE = 250;
      const content = document.getElementById('scriptContent');
      const pagesEl = document.getElementById('scriptPages');
      const runtimeEl = document.getElementById('scriptRuntime');
      const progressFill = document.getElementById('scriptProgressFill');
      const progressLabel = document.getElementById('scriptProgressLabel');
      const progressBar = document.querySelector('.script-progress-bar');

      if (!pagesEl) return;

      const wordCount = (typeof markdown === 'string' ? markdown : (content && content.textContent) || '')
        .split(/\s+/)
        .filter(Boolean)
        .length;
      const estimatedPages = Math.round((wordCount / WORDS_PER_PAGE) * 10) / 10;
      const estimatedMinutes = Math.max(1, Math.round(estimatedPages));

      pagesEl.textContent = 'Est. ' + estimatedPages + ' pages';
      runtimeEl.textContent = 'Est. runtime ' + estimatedMinutes + ' min';

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

    // Scene nav: add ids to scene headings and wire dropdown to scroll
    (function initSceneNav() {
      const content = document.getElementById('scriptContent');
      const selectEl = document.getElementById('scriptSceneSelect');
      if (!content || !selectEl) return;

      const sceneHeadings = content.querySelectorAll('h3');
      sceneHeadings.forEach((h3, i) => {
        if (/^Scene \\d+:/i.test(h3.textContent || '')) {
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
        
        // Parentheticals (text in parentheses, italic) - check before character names
        if (/^\(.+\)$/.test(text)) {
          p.className = 'parenthetical';
          inDialogueBlock = true;
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
        if (!looksLikeNewBlock && inDialogueBlock && prevP && (prevP.classList.contains('character-name') || prevP.classList.contains('parenthetical') || prevP.classList.contains('dialogue'))) {
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

  console.log('\n✓ Compilation complete!');
  console.log(`  - Markdown: ${OUTPUT_MD}`);
  console.log(`  - HTML: ${OUTPUT_HTML}`);
}

// Run if called directly
if (require.main === module) {
  compile();
}

module.exports = { compile, loadManifest, loadScene };
