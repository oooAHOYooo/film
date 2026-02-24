#!/usr/bin/env node

/**
 * Production content compiler
 * Reads manifest.json and compiles all content entries (MD files in content/) into:
 * - full_bible.md (single combined markdown)
 * - full_bible.html (progress rail, sticky nav, entry jump dropdown, full content)
 * - index.html (gallery of plot cards grouped by category)
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, 'content');
const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const OUTPUT_FULL_MD = path.join(__dirname, 'full_bible.md');
const OUTPUT_FULL_HTML = path.join(__dirname, 'full_bible.html');
const OUTPUT_INDEX_HTML = path.join(__dirname, 'index.html');
const BIBLE_NAME = 'Creatures in the Tall Grass - Production Bible';

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

// Read a bible entry file
function loadEntry(filename) {
  const filePath = path.join(CONTENT_DIR, filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`Warning: Could not read entry file ${filename}: ${error.message}`);
    return `\n[ENTRY FILE MISSING: ${filename}]\n`;
  }
}

// Compile all entries into one markdown (for full_bible.md and embedding)
function compileMarkdown(entries) {
  let output = `# ${BIBLE_NAME}\n\n`;
  output += `*Compiled on ${new Date().toLocaleString()}*\n\n`;
  output += `---\n\n`;

  entries.forEach((entry) => {
    output += `\n## ${entry.title}\n\n`;
    output += `*Category: ${entry.category} | File: ${entry.file}*\n\n`;
    output += `---\n\n`;
    output += loadEntry(entry.file);
    output += `\n\n---\n\n`;
  });

  return output;
}

// Build left sidebar nav (grouped by category; Command Center first)
function buildSidebarNav(entries) {
  const byCategory = {};
  entries.forEach((e) => {
    const cat = e.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(e);
  });
  const catOrder = ['Lore', 'Optics', 'Locations', 'Tone', 'Practical Effects'];
  let html = '<nav class="bible-sidebar-nav" aria-label="Bible contents">';
  html += '<a class="bible-sidebar-link bible-sidebar-link--command" href="#command-center"><span class="bible-sidebar-icon" aria-hidden="true">▣</span><span class="bible-sidebar-label">Command Center</span></a>';
  catOrder.forEach((cat) => {
    if (!byCategory[cat]) return;
    html += '<div class="bible-sidebar-group">';
    html += '<div class="bible-sidebar-cat">' + cat + '</div>';
    byCategory[cat].forEach((e) => {
      const num = e.category === 'Practical Effects' && e.id && e.id.startsWith('pr') ? e.id.replace('pr', '') : '';
      const label = e.category === 'Practical Effects' ? (e.title || '').replace(/^PE \d+ — /, '') : (e.title || '');
      html += '<a class="bible-sidebar-link" href="#entry-' + e.id + '"><span class="bible-sidebar-icon">' + (num || '·') + '</span><span class="bible-sidebar-label">' + label.replace(/</g, '&lt;') + '</span></a>';
    });
    html += '</div>';
  });
  html += '</nav>';
  return html;
}

// Build Command Center table rows (Practical Effects at a glance)
function buildCommandCenterTable(entries) {
  const pe = entries
    .filter((e) => e.category === 'Practical Effects')
    .sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  return pe
    .map((e) => {
      const n = e.id.replace('pr', '');
      const sceneFile = 's' + n.padStart(2, '0');
      const shortTitle = e.title.replace(/^PE \d+ — /, '').replace(/</g, '&lt;');
      return `<tr><td class="cc-num" data-label="#">${n}</td><td class="cc-scene" data-label="Scene">${sceneFile}</td><td class="cc-title" data-label="Title">${shortTitle}</td><td class="cc-go" data-label=""><a href="#entry-${e.id}">→</a></td></tr>`;
    })
    .join('');
}

// Generate full HTML page (script-system style: progress rail, sticky nav, entry dropdown, full content)
function generateFullPage(entries, markdown) {
  const compiledAt = new Date().toLocaleString();
  const sidebarNavHtml = buildSidebarNav(entries);
  const commandCenterRows = buildCommandCenterTable(entries);
  const entryOptionsHtml =
    '<option value="command-center">Command Center</option>' +
    entries
      .map(
        (e) =>
          `<option value="entry-${e.id}">${e.title.replace(/</g, '&lt;')}</option>`
      )
      .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BIBLE_NAME}</title>
  <link rel="stylesheet" href="bible.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/contrib/auto-render.min.js"></script>
</head>
<body class="full-bible-page">
  <div class="bible-progress-rail no-print" id="bibleProgressRail" aria-hidden="true">
    <div class="bible-progress-bar" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
      <div class="bible-progress-fill" id="bibleProgressFill"></div>
    </div>
    <div class="bible-progress-label" id="bibleProgressLabel">0%</div>
  </div>

  <div class="bible-layout">
    <aside class="bible-sidebar no-print" id="bibleSidebar" aria-label="Contents">
      <div class="bible-sidebar-head">
        <a class="bible-sidebar-home" href="/pages/summer.html"><span class="bible-sidebar-icon">☀</span><span class="bible-sidebar-label">Summer</span></a>
        <a class="bible-sidebar-home" href="index.html"><span class="bible-sidebar-icon">▦</span><span class="bible-sidebar-label">Gallery</span></a>
      </div>
      ${sidebarNavHtml}
      <button type="button" class="bible-sidebar-toggle" id="bibleSidebarToggle" aria-label="Toggle sidebar" aria-expanded="true"><span aria-hidden="true">☰</span></button>
    </aside>

    <main class="bible-main">
    <div class="gallery-container">
    <div class="bible-sticky-bar no-print" id="bibleStickyBar">
      <div class="nav">
        <div class="nav-left">
          <a class="nav-link" href="/pages/summer.html">☀ Summer</a>
          <a class="nav-link" href="index.html">▦ Gallery</a>
          <a class="nav-link active" href="full_bible.html">Full Bible</a>
        </div>
        <div class="nav-right">
          <div class="bible-export-dropdown" id="bibleExportDropdown">
            <button type="button" class="print-button bible-export-trigger" id="bibleExportTrigger" aria-haspopup="true" aria-expanded="false">Export / Print</button>
            <div class="bible-export-menu" id="bibleExportMenu" role="menu" aria-label="Export and print options">
              <button type="button" role="menuitem" onclick="downloadMarkdown()">Download .md</button>
              <button type="button" role="menuitem" onclick="window.print()">Print</button>
            </div>
          </div>
        </div>
      </div>
      <div class="bible-stats-row">
        <div class="bible-status-bar" id="bibleStatusBar">
          <span class="bible-status-entry" id="bibleStatusEntry">—</span>
        </div>
        <div class="bible-entry-nav">
          <label for="bibleEntrySelect" class="bible-entry-nav-label">Jump to entry</label>
          <select id="bibleEntrySelect" class="bible-entry-select" aria-label="Jump to entry">
            <option value="">—</option>
            ${entryOptionsHtml}
          </select>
        </div>
      </div>
    </div>

    <div class="bible-content-container">
      <div class="full-bible-header">
        <div class="full-bible-title">${BIBLE_NAME}</div>
        <div class="full-bible-meta">Compiled on ${compiledAt}</div>
      </div>
      <section id="command-center" class="bible-command-center no-print" aria-label="Practical effects command center">
        <h2 class="bible-cc-title">Command Center</h2>
        <p class="bible-cc-desc">Practical effects at a glance. Jump to full entry below.</p>
        <div class="bible-cc-wrap">
          <table class="bible-cc-table">
            <thead><tr><th scope="col">#</th><th scope="col">Scene</th><th scope="col">Title</th><th scope="col"></th></tr></thead>
            <tbody>${commandCenterRows}</tbody>
          </table>
        </div>
      </section>
      <div class="bible-content" id="bibleContent"></div>
    </div>
  </div>
  </main>
  </div>

  <script>
    const markdown = ${JSON.stringify(markdown)};
    const ENTRIES = ${JSON.stringify(entries.map((e) => ({ id: e.id, title: e.title, category: e.category })))};

    const container = document.getElementById('bibleContent');
    marked.setOptions({ gfm: true, breaks: true });
    container.innerHTML = marked.parse(markdown);

    // Assign ids to entry headings (first h2 per entry in order)
    (function assignEntryIds() {
      const h2s = container.querySelectorAll('h2');
      ENTRIES.forEach(function(entry, i) {
        if (h2s[i]) h2s[i].id = 'entry-' + entry.id;
      });
    })();

    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(container, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }] });
    }

    (function initExportDropdown() {
      var trigger = document.getElementById('bibleExportTrigger');
      var menu = document.getElementById('bibleExportMenu');
      if (!trigger || !menu) return;
      function open() { menu.classList.add('is-open'); trigger.setAttribute('aria-expanded', 'true'); }
      function close() { menu.classList.remove('is-open'); trigger.setAttribute('aria-expanded', 'false'); }
      trigger.addEventListener('click', function(e) {
        e.stopPropagation();
        if (menu.classList.contains('is-open')) close(); else open();
      });
      menu.querySelectorAll('button').forEach(function(btn) { btn.addEventListener('click', close); });
      document.addEventListener('click', close);
    })();

    // Progress rail
    (function initProgress() {
      const progressFill = document.getElementById('bibleProgressFill');
      const progressLabel = document.getElementById('bibleProgressLabel');
      const progressBar = document.querySelector('.bible-progress-bar');
      if (!progressFill) return;
      function update() {
        const docEl = document.documentElement;
        const scrollTop = docEl.scrollTop || document.body.scrollTop;
        const scrollHeight = docEl.scrollHeight - docEl.clientHeight;
        if (scrollHeight <= 0) {
          progressFill.style.height = '0%';
          progressLabel.textContent = '0%';
          if (progressBar) progressBar.setAttribute('aria-valuenow', 0);
          return;
        }
        const pct = Math.min(1, Math.max(0, scrollTop / scrollHeight));
        progressFill.style.height = (pct * 100) + '%';
        progressLabel.textContent = Math.round(pct * 100) + '%';
        if (progressBar) progressBar.setAttribute('aria-valuenow', Math.round(pct * 100));
      }
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    })();

    // Entry dropdown: scroll to entry
    (function initEntryNav() {
      const selectEl = document.getElementById('bibleEntrySelect');
      if (!selectEl) return;
      selectEl.addEventListener('change', function() {
        const value = this.value;
        if (!value) return;
        const el = document.getElementById(value);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.value = '';
      });
    })();

    // Status bar: current entry on scroll
    (function initStatusBar() {
      const content = document.getElementById('bibleContent');
      const statusEl = document.getElementById('bibleStatusEntry');
      if (!content || !statusEl) return;
      const headings = ENTRIES.map(function(e) { return document.getElementById('entry-' + e.id); }).filter(Boolean);
      function update() {
        const threshold = 120;
        let current = headings[0];
        for (let i = 0; i < headings.length; i++) {
          if (headings[i].getBoundingClientRect().top <= threshold) current = headings[i];
        }
        const entry = ENTRIES.find(function(e) { return current.id === 'entry-' + e.id; });
        statusEl.textContent = entry ? entry.title : '—';
      }
      update();
      window.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
    })();

    (function initSidebarToggle() {
      var sidebar = document.getElementById('bibleSidebar');
      var toggle = document.getElementById('bibleSidebarToggle');
      if (!sidebar || !toggle) return;
      toggle.addEventListener('click', function() {
        sidebar.classList.toggle('is-expanded');
        toggle.setAttribute('aria-expanded', sidebar.classList.contains('is-expanded'));
      });
      if (window.matchMedia('(max-width: 900px)').matches) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    })();

    function downloadMarkdown() {
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'creatures_in_the_tall_grass_production_bible.md';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }
  </script>
</body>
</html>`;

  return html;
}

// Generate Gallery Page: plot cards grouped by category (like script's acts)
function generateGalleryPage(entries) {
  // Group by category
  const byCategory = {};
  entries.forEach((entry) => {
    const cat = entry.category || 'Other';
    if (!byCategory[cat]) byCategory[cat] = [];
    byCategory[cat].push(entry);
  });
  const categories = Object.keys(byCategory).sort();

  let cardsHtml = '';
  categories.forEach((category) => {
    cardsHtml += `<div class="plot-cards-act-label" aria-hidden="true">${category}</div>`;
    byCategory[category].forEach((entry) => {
      cardsHtml += `
    <a class="plot-card" href="full_bible.html#entry-${entry.id}" data-entry="${entry.id}">
      <span class="plot-card-number">${entry.category}</span>
      <h2 class="plot-card-title">${entry.title.replace(/</g, '&lt;')}</h2>
      <p class="plot-card-summary">${(entry.title + ' — production details and reference.').replace(/</g, '&lt;')}</p>
      <span class="plot-card-link">Open Entry →</span>
    </a>`;
    });
  });

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${BIBLE_NAME} - Gallery</title>
  <link rel="stylesheet" href="bible.css">
</head>
<body class="plot-cards-page">
  <div class="gallery-container">
    <header class="plot-cards-header">
      <h1>${BIBLE_NAME}</h1>
      <p class="plot-cards-subtitle">Production Bible — lore, technical specs, and world building · <a href="full_bible.html">Open Full Bible</a> to jump to any entry</p>
    </header>

    <nav class="nav no-print plot-cards-nav">
      <div class="nav-left">
        <a class="nav-link" href="/pages/summer.html">☀ Summer</a>
        <a class="nav-link active" href="index.html">▦ Gallery</a>
        <a class="nav-link" href="full_bible.html">Full Bible</a>
      </div>
    </nav>

    <div class="plot-cards-grid">
${cardsHtml}
    </div>
  </div>
</body>
</html>`;

  return html;
}

// Main compilation function
function compile() {
  console.log('Loading manifest...');
  const entries = loadManifest();
  console.log(`Found ${entries.length} entries in manifest (content/)`);

  console.log('Compiling full_bible.md from MD sources...');
  const markdown = compileMarkdown(entries);
  fs.writeFileSync(OUTPUT_FULL_MD, markdown, 'utf8');
  console.log(`✓ Created ${OUTPUT_FULL_MD}`);

  console.log('Generating full_bible.html...');
  const fullHtml = generateFullPage(entries, markdown);
  fs.writeFileSync(OUTPUT_FULL_HTML, fullHtml, 'utf8');
  console.log(`✓ Created ${OUTPUT_FULL_HTML}`);

  console.log('Generating index.html (Gallery by category)...');
  const indexHtml = generateGalleryPage(entries);
  fs.writeFileSync(OUTPUT_INDEX_HTML, indexHtml, 'utf8');
  console.log(`✓ Created ${OUTPUT_INDEX_HTML}`);

  console.log('\n✓ Production content compilation complete!');
  console.log(`  - Markdown: ${OUTPUT_FULL_MD}`);
  console.log(`  - HTML: ${OUTPUT_FULL_HTML}`);
  console.log(`  - Gallery: ${OUTPUT_INDEX_HTML}`);
}

compile();
