#!/usr/bin/env node

/**
 * Bible Compiler
 * Reads manifest.json and compiles all Bible entries into a web interface
 */

const fs = require('fs');
const path = require('path');

const BIBLE_SRC_DIR = path.join(__dirname, '..', '..', '..', 'Bible');
const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
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
  const filePath = path.join(BIBLE_SRC_DIR, filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`Warning: Could not read entry file ${filename}: ${error.message}`);
    return `\n[ENTRY FILE MISSING: ${filename}]\n`;
  }
}

// Generate full HTML page
function generateFullPage(entries) {
  const tocHtml = entries.map((entry, i) => {
    return `<li><a href="#entry-${entry.id}">${entry.title}</a></li>`;
  }).join('');

  const contentHtml = entries.map((entry) => {
    let content = loadEntry(entry.file);
    // Basic Markdown conversion for the compiled view
    // In the real app, we use marked.js in the browser
    return `<section id="entry-${entry.id}" class="bible-entry">
      <h2>${entry.title}</h2>
      <div class="bible-meta">Category: ${entry.category} | File: ${entry.file}</div>
      <div class="bible-markdown-raw" style="display:none;">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
      <div class="bible-rendered-content"></div>
    </section>`;
  }).join('<hr>');

  const html = `
<!DOCTYPE html>
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
</head>
<body class="bible-page">
  <nav class="nav no-print">
    <div class="nav-left">
      <a class="nav-link" href="/pages/summer.html">☀ Summer</a>
      <a class="nav-link" href="index.html">▦ Gallery</a>
      <a class="nav-link active" href="full_bible.html">Full Bible</a>
    </div>
  </nav>

  <div class="bible-container">
    <header class="bible-header">
      <h1>${BIBLE_NAME}</h1>
      <p>Compiled on ${new Date().toLocaleString()}</p>
    </header>

    <div class="bible-layout">
      <aside class="bible-sidebar no-print">
        <h3>Contents</h3>
        <ul>${tocHtml}</ul>
      </aside>

      <main class="bible-main">
        ${contentHtml}
      </main>
    </div>
  </div>

  <script>
    mermaid.initialize({ startOnLoad: true, theme: 'dark' });
    marked.setOptions({ gfm: true, breaks: true });

    document.querySelectorAll('.bible-entry').forEach(entry => {
      const raw = entry.querySelector('.bible-markdown-raw').textContent;
      const target = entry.querySelector('.bible-rendered-content');
      target.innerHTML = marked.parse(raw);
    });
  </script>
</body>
</html>`;

  return html;
}

// Generate Gallery Page
function generateGalleryPage(entries) {
  const cardsHtml = entries.map((entry) => {
    return `
    <div class="plot-card" onclick="location.hash='entry-${entry.id}'">
      <div class="plot-card-num">${entry.category}</div>
      <h3 class="plot-card-title">${entry.title}</h3>
      <div class="plot-card-summary">View production details for ${entry.title}.</div>
      <a href="full_bible.html#entry-${entry.id}" class="plot-card-link">Open Entry →</a>
    </div>`;
  }).join('');

  const html = `
<!DOCTYPE html>
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
      <p class="plot-cards-subtitle">Production Bible — lore, technical specs, and world building</p>
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
  console.log(`Found ${entries.length} entries in manifest`);

  console.log('Generating full_bible.html...');
  const fullHtml = generateFullPage(entries);
  fs.writeFileSync(OUTPUT_FULL_HTML, fullHtml, 'utf8');
  console.log(`✓ Created ${OUTPUT_FULL_HTML}`);

  console.log('Generating index.html (Gallery)...');
  const indexHtml = generateGalleryPage(entries);
  fs.writeFileSync(OUTPUT_INDEX_HTML, indexHtml, 'utf8');
  console.log(`✓ Created ${OUTPUT_INDEX_HTML}`);

  console.log('\n✓ Bible Compilation complete!');
}

compile();
