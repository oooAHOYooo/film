// Generates gallery manifests from assets/*/inspo-imgs into data/<season>.json
// Run: node scripts/generate-inspo-manifests.js
const fs = require('fs');
const path = require('path');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const SEASONS = ['summer', 'winter', 'autumn', 'spring'];

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

function collectImagesFromDirs(repoRoot, season, subfolders, urlPrefix) {
  const candidateDirs = subfolders.map(sub => path.join(repoRoot, 'assets', season, sub));
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
        url: `/assets/${season}/${urlPrefix}/${filename}`,
        title: humanizeFilename(filename),
        description: '',
      };
    });

  return images;
}

function collectImagesForSeason(repoRoot, season) {
  // Support both 'inspo-imgs' and 'inspiration' as folder names
  return collectImagesFromDirs(repoRoot, season, ['inspo-imgs', 'inspiration'], 'inspo-imgs');
}

function collectStillsForSeason(repoRoot, season) {
    // Support '<season>-stills' and 'stills'
    // For URL construction, we need to know which folder was actually used or just pick one.
    // The previous logic hardcoded 'inspo-imgs' in the URL.
    // Let's check which directory actually has files or just return based on what we find.
    // To simplify, let's just use the scanner logic which returns valid items.
    // But wait, the URL needs the correct path component.

    // Let's do a more direct approach similar to previous code but adapting for Stills
    // user said "summer-stills" folder.
    const subfolders = [`${season}-stills`, 'stills'];
    
    // We need to know which subfolder the file came from to generate the correct URL.
    // The previous helper `collectImagesFromDirs` assumed a single `urlPrefix`.
    
    const images = [];
    const seen = new Set();

    subfolders.forEach(sub => {
        const absDir = path.join(repoRoot, 'assets', season, sub);
        const entries = readDirSafe(absDir);
        entries.forEach(e => {
             if (!e.isFile()) return;
             const filename = e.name;
             if (seen.has(filename)) return;
             const ext = path.extname(filename).toLowerCase();
             if (!IMAGE_EXTENSIONS.has(ext)) return;
             
             seen.add(filename);
             const abs = path.join(absDir, filename);
             
             images.push({
                 filename,
                 mtimeMs: getFileMtimeMsSafe(abs),
                 urlSub: sub 
             });
        });
    });

    return images
        .sort((a, b) => b.mtimeMs - a.mtimeMs)
        .map(img => ({
            url: `/assets/${season}/${img.urlSub}/${img.filename}`,
            title: humanizeFilename(img.filename),
            description: ''
        }));
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

function updateSeasonManifest(repoRoot, season, inspoGallery, stillsGallery) {
  const dataFile = path.join(repoRoot, 'data', `${season}.json`);
  const existing = readJsonSafe(dataFile);
  
  // Inspiration logic - merge and sort by mtimeMs (newest first)
  const existingInspiration = Array.isArray(existing.inspiration) ? existing.inspiration : [];
  const existingUrls = new Set(existingInspiration.map((g) => g && g.url).filter(Boolean));
  const newItems = (inspoGallery || []).filter((g) => g && g.url && !existingUrls.has(g.url));
  
  // For existing items, try to get mtimeMs from file system
  const allInspiration = existingInspiration.map(item => {
    if (item && item.url && item.url.startsWith('/assets/')) {
      const filePath = path.join(repoRoot, item.url);
      const mtimeMs = getFileMtimeMsSafe(filePath);
      return { ...item, mtimeMs };
    }
    return { ...item, mtimeMs: 0 };
  }).concat(newItems);
  
  // Sort by mtimeMs descending (newest first), then reverse to put newest at the beginning
  const mergedInspiration = allInspiration.sort((a, b) => (b.mtimeMs || 0) - (a.mtimeMs || 0));

  // Stills logic - same approach
  const existingStills = Array.isArray(existing.stills) ? existing.stills : [];
  const existingStillsUrls = new Set(existingStills.map((g) => g && g.url).filter(Boolean));
  const newStillsItems = (stillsGallery || []).filter((g) => g && g.url && !existingStillsUrls.has(g.url));
  
  const allStills = existingStills.map(item => {
    if (item && item.url && item.url.startsWith('/assets/')) {
      const filePath = path.join(repoRoot, item.url);
      const mtimeMs = getFileMtimeMsSafe(filePath);
      return { ...item, mtimeMs };
    }
    return { ...item, mtimeMs: 0 };
  }).concat(newStillsItems);
  
  const mergedStills = allStills.sort((a, b) => (b.mtimeMs || 0) - (a.mtimeMs || 0));

  // Remove mtimeMs from final output (it's just for sorting)
  const cleanedInspiration = mergedInspiration.map(({ mtimeMs, ...item }) => item);
  const cleanedStills = mergedStills.map(({ mtimeMs, ...item }) => item);

  const updated = { ...existing, inspiration: cleanedInspiration, stills: cleanedStills };
  writeJsonPretty(dataFile, updated);
}

function main() {
  const repoRoot = resolveRepoRoot();
  let total = 0;

  SEASONS.forEach((season) => {
    const gallery = collectImagesForSeason(repoRoot, season);
    const stills = collectStillsForSeason(repoRoot, season);
    updateSeasonManifest(repoRoot, season, gallery, stills);
    total += gallery.length + stills.length;
    console.log(`[gallery] ${season}: ${gallery.length} inspo, ${stills.length} stills`);
  });

  console.log(`[gallery] Done. Total images indexed: ${total}`);
}

if (require.main === module) {
  main();
}


