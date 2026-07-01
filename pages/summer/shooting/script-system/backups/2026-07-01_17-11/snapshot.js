#!/usr/bin/env node
// Usage: node snapshot.js [label]
// Saves a compiled snapshot of the full script to versions/ as a single .md file.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCRIPT_DIR = __dirname;
const FULL_SCRIPT_PATH = path.join(SCRIPT_DIR, 'full_script.md');
const VERSIONS_DIR = path.join(SCRIPT_DIR, 'versions');
const INDEX_PATH = path.join(VERSIONS_DIR, 'INDEX.md');

const label = process.argv[2] || '';

// Build timestamp
const now = new Date();
const pad = n => String(n).padStart(2, '0');
const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
const slug = label
  ? `${datePart}_${timePart}_${label.replace(/\s+/g, '-')}`
  : `${datePart}_${timePart}`;

fs.mkdirSync(VERSIONS_DIR, { recursive: true });

// Recompile first so the snapshot is always fresh
console.log('Recompiling...');
execSync(`node ${path.join(SCRIPT_DIR, 'compile.js')}`, { stdio: 'inherit' });

// Copy compiled script as a single named file
const snapshotFile = path.join(VERSIONS_DIR, `${slug}.md`);
fs.copyFileSync(FULL_SCRIPT_PATH, snapshotFile);

// Count scenes for the index entry
const MANIFEST_PATH = path.join(SCRIPT_DIR, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

// Update INDEX.md (newest first)
const displayTime = timePart.replace('-', ':');
const indexEntry = `| [${slug}.md](${slug}.md) | ${datePart} ${displayTime} | ${label || '—'} | ${manifest.length} scenes |`;

let indexContent = '';
if (fs.existsSync(INDEX_PATH)) {
  const existing = fs.readFileSync(INDEX_PATH, 'utf8');
  // Insert after the table header (second | line)
  const headerEnd = existing.indexOf('\n| ---');
  if (headerEnd !== -1) {
    const afterHeader = existing.indexOf('\n', headerEnd + 1);
    indexContent = existing.slice(0, afterHeader + 1) + indexEntry + '\n' + existing.slice(afterHeader + 1);
  } else {
    indexContent = existing + '\n' + indexEntry;
  }
} else {
  indexContent = `# Shooting Script — Version Index

*Creatures in the Tall Grass · Summer*

Each file is the full compiled script at that moment. Drag any into a GPT window or open in any markdown reader.

| File | Date | Label | Scenes |
| --- | --- | --- | --- |
${indexEntry}
`;
}

fs.writeFileSync(INDEX_PATH, indexContent);

console.log(`✓  Saved: versions/${slug}.md`);
console.log(`   INDEX.md updated`);
