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
const NOVEL_NAME = 'Machulu';

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
  <link rel="stylesheet" href="/novels/cyan/novel.css?v=20260130-1">
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
          <a class="nav-link" href="/novels/cyan/full_novel.md" title="Markdown">
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
      <div class="penguin-running-header no-print" aria-label="Running header">
        <span class="penguin-book-title">${NOVEL_NAME}</span>
        <span class="penguin-chapter-title" id="currentChapterTitle"></span>
      </div>
      <div class="novel-content-viewport no-print" id="contentViewport" aria-label="Page view">
        <div class="novel-content-scroll" id="contentScroll">
          <div class="novel-content-pages" id="contentPages"></div>
          <div class="novel-content-inner">
            <div class="novel-content" id="novelContent"></div>
          </div>
        </div>
      </div>
      <div class="penguin-folio no-print" id="pageFolio" aria-label="Page number">Page 1 of 1</div>
    </div>
  </div>

  <script>
    const markdown = ${JSON.stringify(markdown)};
    const container = document.getElementById('novelContent');
    marked.setOptions({ breaks: true });
    container.innerHTML = marked.parse(markdown);

    (function initPenguinPages() {
      var viewport = document.getElementById('contentViewport');
      var scrollEl = document.getElementById('contentScroll');
      var pagesEl = document.getElementById('contentPages');
      var inner = scrollEl && scrollEl.querySelector('.novel-content-inner');
      var content = document.getElementById('novelContent');
      var folioEl = document.getElementById('pageFolio');
      if (!viewport || !scrollEl || !pagesEl || !inner || !content) return;
      var style = window.getComputedStyle(document.body);
      var fs = parseFloat(style.fontSize) || 14;
      var lh = parseFloat(style.lineHeight) || 1.25;
      if (isNaN(lh)) lh = 1.25;
      var pageHeightPx = Math.round(35 * fs * lh);
      var contentHeight = content.scrollHeight;
      var totalPages = Math.max(1, Math.ceil(contentHeight / pageHeightPx));
      pagesEl.innerHTML = '';
      for (var i = 0; i < totalPages; i++) {
        var div = document.createElement('div');
        div.className = 'penguin-page-snap';
        div.style.height = pageHeightPx + 'px';
        pagesEl.appendChild(div);
      }
      scrollEl.style.minHeight = (totalPages * pageHeightPx) + 'px';
      inner.style.height = contentHeight + 'px';
      if (folioEl) {
        folioEl.textContent = 'Page 1 of ' + totalPages;
        function updateFolio() {
          var st = viewport.scrollTop;
          var cur = Math.min(totalPages, Math.max(1, Math.floor(st / pageHeightPx) + 1));
          folioEl.textContent = 'Page ' + cur + ' of ' + totalPages;
        }
        viewport.addEventListener('scroll', function() { requestAnimationFrame(updateFolio); });
        window.addEventListener('resize', updateFolio);
      }
    })();

    (function initChapterNav() {
      var content = document.getElementById('novelContent');
      var selectEl = document.getElementById('novelChapterSelect');
      var viewport = document.getElementById('contentViewport');
      if (!content || !selectEl || !viewport) return;
      var chapterHeadings = content.querySelectorAll('h3');
      var chapterHeadingRe = /^Chapter \\d+:/i;
      chapterHeadings.forEach(function(h3, i) {
        var text = (h3.textContent || '').trim();
        if (chapterHeadingRe.test(text)) h3.id = 'chapter-' + (i + 1);
      });
      selectEl.addEventListener('change', function() {
        var value = this.value;
        if (!value) return;
        var el = document.getElementById(value);
        if (el) viewport.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
        this.value = '';
      });
    })();

    (function initRunningHeader() {
      var content = document.getElementById('novelContent');
      var titleEl = document.getElementById('currentChapterTitle');
      var viewport = document.getElementById('contentViewport');
      if (!content || !titleEl || !viewport) return;
      var chapterHeadings = content.querySelectorAll('h3');
      var chapterHeadingRe = /^Chapter \\d+:/i;
      function setChapter(title) { titleEl.textContent = title || ''; }
      var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (!entry.isIntersecting) return;
          var text = (entry.target.textContent || '').trim();
          if (chapterHeadingRe.test(text)) setChapter(text);
        });
      }, { root: viewport, rootMargin: '-10% 0px -70% 0px', threshold: 0 });
      chapterHeadings.forEach(function(h) {
        if (chapterHeadingRe.test((h.textContent || '').trim())) observer.observe(h);
      });
      if (chapterHeadings.length) setChapter((chapterHeadings[0].textContent || '').trim());
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
