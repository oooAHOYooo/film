#!/usr/bin/env node

/**
 * Script Compiler for Spring Project: The Fall of Hibisicas
 * Reads manifest.json and compiles all scenes into a single full_script.md
 * and generates full_script.html for printing/viewing
 */

const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.join(__dirname, 'scenes');
const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const LOOSE_NOTES_PATH = path.join(__dirname, 'loose-notes.md');
const OUTPUT_MD = path.join(__dirname, 'full_script.md');
const OUTPUT_HTML = path.join(__dirname, 'full_script.html');
const PLOT_CARDS_PATH = path.join(__dirname, 'plot-cards-data.json');
const GALLERY_PATH = path.join(__dirname, 'index.html');
const SCRIPT_NAME = 'The Fall of Hibisicas';

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

// Turn nickname into display title
function nicknameToTitle(nickname) {
    if (!nickname) return '';
    return nickname
        .split(/[\s-]+/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Compile all scenes into markdown
function compileMarkdown(scenes) {
    let output = `# ${SCRIPT_NAME} — Full Script\n\n`;
    output += `*Compiled on ${new Date().toLocaleString()}*\n\n`;

    // Prepend Loose Notes if they exist
    if (fs.existsSync(LOOSE_NOTES_PATH)) {
        const looseNotes = fs.readFileSync(LOOSE_NOTES_PATH, 'utf8');
        output += `## LOOSE NOTES\n\n${looseNotes}\n\n`;
    }

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
        output += `*${scene.act ? `ACT ${toRoman(scene.act)}${scene.actTitle ? ` — ${scene.actTitle}` : ''} | ` : ''}ID: ${scene.id}*\n\n`;
        output += `---\n\n`;

        let sceneContent = loadScene(scene.file);
        output += sceneContent;
        output += `\n\n---\n\n`;
    });

    return output;
}

// Generate full HTML page
function generateHTMLPage(markdown, scenes) {
    const sceneOptionsHtml = (scenes || []).map((s, i) => {
        const num = i + 1;
        const title = (s.title || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
        return `<option value="scene-${num}">${num}. ${title}</option>`;
    }).join('');

    return String.raw`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Full Script - ${SCRIPT_NAME}</title>
  <link rel="stylesheet" href="script.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body class="full-script-page">
  <div class="gallery-container">
    <div class="script-sticky-bar no-print" id="scriptStickyBar">
      <div class="nav">
        <div class="nav-left">
          <a class="nav-link" href="/" title="Home">Home</a>
          <a class="nav-link" href="/pages/spring.html" title="Spring Hub">Spring Hub</a>
          <a class="nav-link" href="index.html" title="Gallery">Gallery</a>
        </div>
      </div>
      <div class="script-stats-row">
        <div class="script-scene-nav">
          <label for="scriptSceneSelect" class="script-scene-nav-label">Jump to scene</label>
          <select id="scriptSceneSelect" class="script-scene-select">
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
    const container = document.getElementById('scriptContent');
    marked.setOptions({ breaks: true });
    container.innerHTML = marked.parse(markdown);

    // Scene nav
    (function initSceneNav() {
      const selectEl = document.getElementById('scriptSceneSelect');
      if (!selectEl) return;
      
      const content = document.getElementById('scriptContent');
      const h3s = content.querySelectorAll('h3');
      h3s.forEach((h3, i) => {
        if (/^Scene \d+:/i.test(h3.textContent)) {
           // We need to find the correct index in sceneOptionsHtml
           // But since scenes are 1-30, we can just use the natural index if we find it
           const match = h3.textContent.match(/Scene (\d+):/i);
           if (match) {
             h3.id = 'scene-' + match[1];
           }
        }
      });

      selectEl.addEventListener('change', function() {
        const val = this.value;
        if (!val) return;
        const target = document.getElementById(val);
        if (target) target.scrollIntoView({ behavior: 'smooth' });
        this.value = '';
      });
    })();
  </script>
</body>
</html>
  `.trim();
}

function generateGalleryPage(cardsData) {
    return String.raw`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SCRIPT_NAME} - Scene Gallery</title>
  <link rel="stylesheet" href="script.css">
</head>
<body class="plot-cards-page">
  <div class="gallery-container">
    <header class="plot-cards-header">
      <h1>${SCRIPT_NAME}</h1>
      <p class="plot-cards-subtitle">Scene gallery — <a href="full_script.html">Open Full Script</a></p>
    </header>

    <nav class="nav no-print plot-cards-nav">
      <div class="nav-left">
        <a class="nav-link" href="/pages/spring.html" title="Spring Hub">☀ Spring</a>
        <a class="nav-link nav-link--active" href="index.html" title="Gallery">▦ Gallery</a>
        <a class="nav-link" href="full_script.html" title="Full Script">Full Script</a>
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
            actLabel.textContent = 'ACT ' + toRoman(card.act) + ' — ' + (card.actTitle || '');
            grid.appendChild(actLabel);
          }
          const cardDiv = document.createElement('div');
          cardDiv.className = 'plot-card';
          cardDiv.innerHTML =
            '<span class="plot-card-number">' + card.n + '</span>' +
            '<h2 class="plot-card-title">' + card.title + '</h2>' +
            '<p class="plot-card-summary">' + (card.summary || '') + '</p>' +
            '<div class="plot-card-links" style="margin-top: auto; display: flex; gap: 0.75rem; border-top: 1px solid var(--border, #eee); padding-top: 0.75rem; margin-top: 1rem; font-size: 0.8rem;">' +
              '<a href="full_script.html#scene-' + card.n + '" class="plot-card-link" style="text-decoration: none; font-weight: 600;">Full Script</a>' +
            '</div>';
          grid.appendChild(cardDiv);
        });
      }

      renderCards(CARDS_DATA);
    })();
  </script>
</body>
</html>
  `.trim();
}

function writePlotCardsData(scenes) {
    const cards = scenes.map((scene, index) => {
        const n = index + 1;
        return {
            n,
            id: scene.id,
            title: scene.title,
            summary: `Scene ${n}`,
            act: scene.act || 1,
            actTitle: scene.actTitle || 'Initial Act'
        };
    });
    fs.writeFileSync(PLOT_CARDS_PATH, JSON.stringify(cards, null, 2) + '\n', 'utf8');
    return cards;
}

function compile() {
    console.log('Loading manifest...');
    const scenes = loadManifest();

    console.log('Compiling scenes...');
    const markdown = compileMarkdown(scenes);

    console.log('Writing full_script.md...');
    fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');

    console.log('Generating full_script.html...');
    const html = generateHTMLPage(markdown, scenes);
    fs.writeFileSync(OUTPUT_HTML, html, 'utf8');

    console.log('Updating plot cards...');
    const plotCardsData = writePlotCardsData(scenes);

    console.log('Generating Gallery index.html...');
    const galleryHtml = generateGalleryPage(plotCardsData);
    fs.writeFileSync(GALLERY_PATH, galleryHtml, 'utf8');

    console.log('\n✓ Compilation complete!');
}

compile();
