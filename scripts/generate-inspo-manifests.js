// Generates gallery manifests from assets/*/inspo-imgs into data/<season>.json
// Run: node scripts/generate-inspo-manifests.js
const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const SEASONS = ['summer', 'winter', 'autumn'];

function humanizeFilename(filename) {
  const name = filename.replace(/\.[^.]+$/, '');
  return name
    .replace(/[_\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function resolveRepoRoot() {
  // scripts/ is one level down from repo root
  return path.resolve(__dirname, '..');
}

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function getFileMtimeMsSafe(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return stat.mtimeMs || 0;
  } catch {
    return 0;
  }
}

function collectImagesForSeason(repoRoot, season) {
  // Support both 'inspo-imgs' and 'inspiration' as folder names
  const candidateDirs = [
    path.join(repoRoot, 'assets', season, 'inspo-imgs'),
    path.join(repoRoot, 'assets', season, 'inspiration'),
  ];
  const seen = new Set();
  const fileRecords = [];

  candidateDirs.forEach((absDir) => {
    const entries = readDirSafe(absDir);
    entries.forEach((e) => {
      if (!e.isFile()) return;
      const filename = e.name;
      if (seen.has(filename)) return;
      const ext = path.extname(filename).toLowerCase();
      if (!IMAGE_EXTENSIONS.has(ext)) return;
      const abs = path.join(absDir, filename);
      seen.add(filename);
      fileRecords.push({ abs, filename });
    });
  });

  const images = fileRecords
    .map(({ abs, filename }) => ({
      filename,
      mtimeMs: getFileMtimeMsSafe(abs),
    }))
    .filter(Boolean)
    // newest first for a feed-like experience
    .sort((a, b) => b.mtimeMs - a.mtimeMs)
    .map(({ filename }) => {
      return {
        // Prefer 'inspo-imgs' path in output; both folder names will be served if present
        url: `/assets/${season}/inspo-imgs/${filename}`,
        title: humanizeFilename(filename),
        description: '',
      };
    });

  return images;
}

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeJsonPretty(filePath, data) {
  const json = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(filePath, json, 'utf8');
}

function updateSeasonManifest(repoRoot, season, inspoGallery) {
  const dataFile = path.join(repoRoot, 'data', `${season}.json`);
  const existing = readJsonSafe(dataFile);
  const existingInspiration = Array.isArray(existing.inspiration) ? existing.inspiration : [];

  // Preserve existing inspiration items, append new local images de-duped by URL.
  const existingUrls = new Set(existingInspiration.map((g) => g && g.url).filter(Boolean));
  const newItems = (inspoGallery || []).filter((g) => g && g.url && !existingUrls.has(g.url));
  const mergedInspiration = existingInspiration.concat(newItems);

  const updated = { ...existing, inspiration: mergedInspiration };
  writeJsonPretty(dataFile, updated);
}

function main() {
  const repoRoot = resolveRepoRoot();
  let total = 0;

  SEASONS.forEach((season) => {
    const gallery = collectImagesForSeason(repoRoot, season);
    updateSeasonManifest(repoRoot, season, gallery);
    total += gallery.length;
    console.log(`[gallery] ${season}: ${gallery.length} image(s)`);
  });

  console.log(`[gallery] Done. Total images indexed: ${total}`);
}

if (require.main === module) {
  main();
}


