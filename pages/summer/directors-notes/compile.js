#!/usr/bin/env node

/**
 * Director's Notes Compiler
 * Reads script_additions.md, other_ideas.md, and notes/<scene-id>.md (keyed by script manifest),
 * compiles into full_notes.md and full_notes.html with hierarchy.
 */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const SCRIPT_MANIFEST_PATH = path.join(DIR, '../script-system/manifest.json');
const NOTES_DIR = path.join(DIR, 'notes');
const OUTPUT_MD = path.join(DIR, 'full_notes.md');
const OUTPUT_HTML = path.join(DIR, 'full_notes.html');
const TITLE = "Director's Notes — Creatures in the Tall Grass";

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

function readFileSafe(filePath, fallback) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return fallback != null ? fallback : '';
  }
}

function loadScriptManifest() {
  try {
    return JSON.parse(fs.readFileSync(SCRIPT_MANIFEST_PATH, 'utf8'));
  } catch (e) {
    console.warn('Warning: Could not read script manifest:', e.message);
    return [];
  }
}

function compileMarkdown() {
  const scriptAdditions = readFileSafe(path.join(DIR, 'script_additions.md'), '');
  const otherIdeas = readFileSafe(path.join(DIR, 'other_ideas.md'), '');
  const scenes = loadScriptManifest();

  let out = `# ${TITLE}\n\n`;
  out += `*Compiled on ${new Date().toLocaleString()}*\n\n`;
  out += `---\n\n`;

  // 1. Script Additions
  out += `## Script Additions\n\n`;
  out += scriptAdditions.trim() || '*No content in script_additions.md.*\n';
  out += `\n\n---\n\n`;

  // 2. By Scene (hierarchy: Act → Scene → note)
  out += `## By Scene\n\n`;
  let currentAct = null;
  scenes.forEach((scene, index) => {
    const sceneNumber = index + 1;
    if (scene.act != null && scene.act !== currentAct) {
      currentAct = scene.act;
      const actTitle = scene.actTitle ? ` — ${scene.actTitle}` : '';
      out += `\n### ACT ${toRoman(scene.act)}${actTitle}\n\n`;
    }

    out += `#### Scene ${sceneNumber}: ${scene.title}\n\n`;
    out += `*ID: ${scene.id}*\n\n`;

    const notePath = path.join(NOTES_DIR, `${scene.id}.md`);
    const noteContent = readFileSafe(notePath, null);
    if (noteContent && noteContent.trim()) {
      out += noteContent.trim();
    } else {
      out += '*No director\'s note for this scene.*';
    }
    out += '\n\n';
  });

  out += `---\n\n`;

  // 3. Other Ideas
  out += `## Other Ideas\n\n`;
  out += otherIdeas.trim() || '*No content in other_ideas.md.*\n';

  return out;
}

function generateHTMLPage(markdown) {
  const escapedMarkdown = JSON.stringify(markdown);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${TITLE}</title>
  <link rel="stylesheet" href="directors-notes.css">
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
</head>
<body>
  <div class="dn-container">
    <nav class="dn-nav no-print">
      <a href="/pages/summer.html">← Summer Hub</a>
      <a href="/pages/summer/script-system/index.html">Script Gallery</a>
      <a href="/pages/summer/script-system/full_script.html">Full Script</a>
      <a href="index.html">Director's Notes (hub)</a>
      <a href="full_notes.html">Full Notes (this)</a>
    </nav>

    <div class="dn-header">
      <h1>${TITLE}</h1>
      <p>Compiled on ${new Date().toLocaleString()}</p>
    </div>

    <div class="dn-note-content" id="notesContent"></div>
  </div>

  <script>
    const markdown = ${escapedMarkdown};
    const MARKDOWN_FILE_NAME = 'creatures_in_the_tall_grass_directors_notes.md';

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
      const w = window.open('', '_blank', 'noopener,noreferrer');
      if (!w) return;
      const escaped = String(markdown)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      w.document.write([
        '<!doctype html>',
        '<html lang="en">',
        '<head><meta charset="UTF-8"><title>Director\\'s Notes - Markdown</title>',
        '<style>body{ margin:1in; font-family:ui-monospace,monospace; } pre{ white-space:pre-wrap; line-height:1.35; font-size:11pt; }</style>',
        '</head><body><pre>' + escaped + '</pre></body></html>'
      ].join('\\n'));
      w.document.close();
      w.focus();
      w.print();
      w.onafterprint = function() { w.close(); };
    }

    marked.setOptions({ breaks: true });
    document.getElementById('notesContent').innerHTML = marked.parse(markdown);
  <\/script>
</body>
</html>`;
}

function compile() {
  console.log('Loading script manifest and note files...');
  const markdown = compileMarkdown();

  console.log('Writing full_notes.md...');
  fs.writeFileSync(OUTPUT_MD, markdown, 'utf8');
  console.log(`✓ Created ${OUTPUT_MD}`);

  console.log('Generating full_notes.html...');
  const html = generateHTMLPage(markdown);
  fs.writeFileSync(OUTPUT_HTML, html, 'utf8');
  console.log(`✓ Created ${OUTPUT_HTML}`);

  console.log('\n✓ Director\'s notes compilation complete.');
  console.log(`  - Markdown: ${OUTPUT_MD}`);
  console.log(`  - HTML: ${OUTPUT_HTML}`);
}

if (require.main === module) {
  compile();
}

module.exports = { compile, compileMarkdown };
