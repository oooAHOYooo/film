#!/usr/bin/env node

/**
 * Character sheets recompile
 * Reads .md files from sheets/ and regenerates each character .html and index.html
 * with content baked in (no fetch). Run after editing any sheets/*.md.
 *
 * Usage: node compile.js   (from pages/summer/characters/)
 *    or: node pages/summer/characters/compile.js
 */

const fs = require('fs');
const path = require('path');

const DIR = path.resolve(__dirname);
const SHEETS_DIR = path.join(DIR, 'sheets');
const ACTORS_FILE = path.join(DIR, 'actors.json');

const SHEETS = [
  { id: 'dallas', file: 'dallas', title: 'Dallas' },
  { id: 'dominic', file: 'dominic', title: 'Dominic' },
  { id: 'makayla', file: 'makayla', title: 'Makayla' },
  { id: 'asher', file: 'asher', title: 'Asher' },
  { id: 'mr-mike', file: 'mr-mike', title: 'Mr. Mike' },
  { id: 'janice', file: 'janice', title: 'Janice' },
  { id: 'howie', file: 'howie', title: 'Howie' },
];

/** Simple markdown to HTML: # heading, - list items, escape rest */
function mdToHtml(md) {
  const lines = md.split(/\r?\n/);
  const out = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      const text = escapeHtml(trimmed.slice(2).trim());
      out.push(`<h1>${text}</h1>`);
      continue;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (!inList) {
        out.push('<ul>');
        inList = true;
      }
      const text = escapeHtml(trimmed.slice(2).trim());
      out.push(`<li>${text}</li>`);
      continue;
    }

    if (trimmed === '') {
      if (inList) {
        out.push('</ul>');
        inList = false;
      }
      continue;
    }

    if (inList) {
      out.push('</ul>');
      inList = false;
    }
    const text = escapeHtml(trimmed);
    out.push(`<p>${text}</p>`);
  }

  if (inList) out.push('</ul>');
  return out.join('\n');
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function loadMd(file) {
  const p = path.join(SHEETS_DIR, file + '.md');
  try {
    return fs.readFileSync(p, 'utf8');
  } catch (e) {
    console.warn(`Warning: could not read ${p}: ${e.message}`);
    return '';
  }
}

function loadActors() {
  try {
    const raw = fs.readFileSync(ACTORS_FILE, 'utf8');
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch (e) {
    return {};
  }
}

function renderGallery(photos, label) {
  if (!Array.isArray(photos) || photos.length === 0) return '';
  const items = photos
    .filter((p) => p && p.url)
    .map((p) => {
      const name = escapeHtml(p.name || '');
      const role = escapeHtml(p.role || '');
      const caption = [name, role].filter(Boolean).join(' · ');
      return (
        `<figure class="char-photo-card">` +
          `<div class="char-photo-frame">` +
            `<img src="${escapeHtml(p.url)}" alt="${name || label}" loading="lazy" decoding="async">` +
          `</div>` +
          (caption ? `<figcaption>${caption}</figcaption>` : '') +
        `</figure>`
      );
    })
    .join('\n');
  if (!items) return '';
  return (
    `<div class="char-gallery">` +
      `<div class="char-gallery-title">Photo gallery</div>` +
      `<div class="char-gallery-grid">` +
        items +
      `</div>` +
    `</div>`
  );
}

function injectGalleryIntoHtml(contentHtml, galleryHtml) {
  if (!galleryHtml) return contentHtml;
  const marker = '</h1>';
  const idx = contentHtml.indexOf(marker);
  if (idx === -1) return contentHtml + '\n' + galleryHtml;
  return contentHtml.slice(0, idx + marker.length) + '\n' + galleryHtml + contentHtml.slice(idx + marker.length);
}

function writeCharPage(sheet, contentHtml) {
  const actors = loadActors();
  const galleryHtml = renderGallery(actors[sheet.id], sheet.title);
  const bodyHtml = injectGalleryIntoHtml(contentHtml, galleryHtml);
  const title = `${sheet.title} — Character Sheet — Creatures in the Tall Grass`;
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="stylesheet" href="characters.css" />
  </head>
  <body>
    <div class="chars-page">
      <div class="chars-toolbar no-print">
        <a href="/pages/summer.html">← Summer Hub</a>
        <a href="index.html">All characters</a>
        <button type="button" class="print-btn" onclick="window.print()">Print</button>
      </div>
      <div class="chars-container">
        <p class="chars-subtitle no-print" style="margin-bottom: 1rem;">Creatures in the Tall Grass — Character sheet</p>
        <div class="chars-content">
${bodyHtml}
        </div>
      </div>
    </div>
  </body>
</html>
`;
  const outPath = path.join(DIR, sheet.file + '.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('  ' + sheet.file + '.html');
}

function extractFirstH1(html) {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : '';
}

function stripFirstH1(html) {
  return html.replace(/<h1[^>]*>[\s\S]*?<\/h1>\n?/, '').trim();
}

function writeIndexPage() {
  const actors = loadActors();
  const sections = SHEETS.map((s) => {
    const md = loadMd(s.file);
    const fullHtml = mdToHtml(md);
    const name = extractFirstH1(fullHtml) || s.title;
    const body = stripFirstH1(fullHtml);
    const galleryHtml = renderGallery(actors[s.id], name);
    return { id: s.id, file: s.file, name, body, galleryHtml };
  });

  const sectionsHtml = sections
    .map(
      (s) =>
        `<section class="sheet" id="${s.id}"><h2><a href="${s.file}.html">${s.name}</a></h2>\n${s.galleryHtml}\n${s.body}</section>`
    )
    .join('\n\n');

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Character Sheets — Creatures in the Tall Grass</title>
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="stylesheet" href="characters.css" />
  </head>
  <body>
    <div class="chars-page">
      <div class="chars-toolbar no-print">
        <a href="/pages/summer.html">← Summer Hub</a>
        <a href="/pages/summer/script-system/full_script.html">Full Script</a>
        <button type="button" class="print-btn" onclick="window.print()">Print all</button>
      </div>

      <div class="chars-container">
        <div class="chars-index-header">
          <h1 class="chars-index-title">Character Sheets</h1>
          <p class="chars-index-desc">Subset of main characters for Creatures in the Tall Grass. Backstory and intent for cast and crew. <strong>Edit the .md files in <code>sheets/</code></strong> then run <code>node compile.js</code> to recompile.</p>
        </div>

        <div class="char-nav no-print">
          ${SHEETS.map((s) => `<a href="${s.file}.html">${s.title}</a>`).join('\n          ')}
        </div>

        <div id="allSheets">
${sectionsHtml}
        </div>
      </div>
    </div>
  </body>
</html>
`;
  const outPath = path.join(DIR, 'index.html');
  fs.writeFileSync(outPath, html, 'utf8');
  console.log('  index.html');
}

function main() {
  console.log('Recompiling character sheets from sheets/*.md ...\n');

  SHEETS.forEach((sheet) => {
    const md = loadMd(sheet.file);
    const contentHtml = mdToHtml(md)
      .split('\n')
      .map((line) => '          ' + line)
      .join('\n');
    writeCharPage(sheet, contentHtml);
  });

  console.log('');
  writeIndexPage();

  console.log('\nDone.');
}

main();
