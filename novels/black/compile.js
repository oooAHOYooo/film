#!/usr/bin/env node

/**
 * Novel Compiler — Winter Writing (Machulu)
 * Reads manifest.json and compiles all chapters into full_novel.md and full_novel.html
 */

const fs = require('fs');
const path = require('path');

const CHAPTERS_DIR = path.join(__dirname, 'chapters');
const MANIFEST_PATH = path.join(__dirname, 'manifest.json');
const OUTPUT_MD = path.join(__dirname, 'full_novel.md');
const OUTPUT_HTML = path.join(__dirname, 'full_novel.html');
const NOVEL_NAME = 'Field Notes';

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

function loadChapter(filename) {
  const filePath = path.join(CHAPTERS_DIR, filename);
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.warn(`Warning: Could not read chapter file ${filename}: ${error.message}`);
    return `\n[CHAPTER FILE MISSING: ${filename}]\n`;
  }
}

function compileMarkdown(chapters) {
  let output = `# ${NOVEL_NAME} — Full Novel\n\n`;
  output += `*Compiled on ${new Date().toLocaleString()}*\n\n`;
  output += `---\n\n`;

  let currentAct = null;
  chapters.forEach((chapter, index) => {
    const chapterNumber = index + 1;

    if (chapter.act && chapter.act !== currentAct) {
      currentAct = chapter.act;
      const actTitle = chapter.actTitle ? ` — ${chapter.actTitle}` : '';
      output += `\n## ACT ${toRoman(chapter.act)}${actTitle}\n\n---\n\n`;
    }

    output += `\n### Chapter ${chapterNumber}: ${chapter.title}\n\n`;
    output += `*${chapter.act ? `ACT ${toRoman(chapter.act)}${chapter.actTitle ? ` — ${chapter.actTitle}` : ''} | ` : ''}ID: ${chapter.id} | File: ${chapter.file}*\n\n`;
    output += `---\n\n`;

    const chapterContent = loadChapter(chapter.file);
    output += chapterContent;
    output += `\n\n---\n\n`;
  });

  return output;
}

function generateHTMLPage(markdown, chapters) {
  const chapterOptionsHtml = (chapters || []).map((c, i) => {
    const num = i + 1;
    const title = (c.title || '').replace(/</g, '&lt;').replace(/"/g, '&quot;');
    return `<option value="chapter-${num}">${num}. ${title}</option>`;
  }).join('');

  const html = String.raw`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Full Novel - ${NOVEL_NAME}</title>
  <link rel="stylesheet" href="/novels/black/novel.css?v=20260130-1">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <div class="novel-container">
    <div class="novel-sticky-bar no-print" id="novelStickyBar">
      <div class="nav">
        <div class="nav-left">
          <a class="nav-link" href="/index.html" title="Home">
            <span class="nav-icon" aria-hidden="true">⌂</span>
            <span class="nav-text">Home</span>
          </a>
          <a class="nav-link" href="/novels/index.html" title="Novels">
            <span class="nav-icon" aria-hidden="true">📖</span>
            <span class="nav-text">Novels</span>
          </a>
          <a class="nav-link" href="/novels/black/full_novel.md" title="Markdown">
            <span class="nav-icon" aria-hidden="true">✎</span>
            <span class="nav-text">Markdown</span>
          </a>
        </div>
        <button type="button" class="print-button" onclick="window.print()">Print</button>
      </div>
      <div class="novel-nav-row">
        <label for="novelChapterSelect" class="novel-nav-label">Jump to chapter</label>
        <select id="novelChapterSelect" class="novel-select" aria-label="Jump to chapter">
          <option value="">—</option>
          ${chapterOptionsHtml}
        </select>
      </div>
    </div>

    <div class="novel-reader">
      <div class="novel-header">
        <div class="novel-title">${NOVEL_NAME} — Full Novel</div>
        <div class="novel-meta">Compiled on ${new Date().toLocaleString()}</div>
      </div>
      <div class="novel-content" id="novelContent"></div>
    </div>
  </div>

  <script>
    const markdown = ${JSON.stringify(markdown)};
    const container = document.getElementById('novelContent');
    marked.setOptions({ breaks: true });
    container.innerHTML = marked.parse(markdown);

    (function initChapterNav() {
      const content = document.getElementById('novelContent');
      const selectEl = document.getElementById('novelChapterSelect');
      if (!content || !selectEl) return;
      const chapterHeadings = content.querySelectorAll('h3');
      const chapterHeadingRe = /^Chapter \\d+:/i;
      chapterHeadings.forEach((h3, i) => {
        const text = (h3.textContent || '').trim();
        if (chapterHeadingRe.test(text)) h3.id = 'chapter-' + (i + 1);
      });
      selectEl.addEventListener('change', function() {
        const value = this.value;
        if (!value) return;
        const el = document.getElementById(value);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        this.value = '';
      });
    })();
  </script>
</body>
</html>
  `.trim();

  return html;
}

function compile() {
  console.log('Loading manifest...');
  const chapters = loadManifest();
  console.log(`Found ${chapters.length} chapters in manifest`);
  console.log('Compiling chapters...');
  const markdown = compileMarkdown(chapters);
  console.log('Writing full_novel.md...');
  fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');
  console.log(`✓ Created ${OUTPUT_MD}`);
  console.log('Generating full_novel.html...');
  const html = generateHTMLPage(markdown, chapters);
  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`✓ Created ${OUTPUT_HTML}`);
  console.log('\n✓ Compilation complete!');
  console.log(`  - Markdown: ${OUTPUT_MD}`);
  console.log(`  - HTML: ${OUTPUT_HTML}`);
}

if (require.main === module) {
  compile();
}

module.exports = { compile, loadManifest, loadChapter };
