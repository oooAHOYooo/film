#!/usr/bin/env node

/**
 * compile-all.js
 * Compiles all seasonal film script systems plus Summer extras.
 *
 * Usage:
 *   node compile-all.js
 *   npm run compile:all
 *
 * Seasonal scripts compiled:
 *   Spring  → pages/spring/script-system/compile.js
 *   Summer  → pages/summer/script-system/compile.js
 *   Autumn  → pages/autumn/script-system/compile.js
 *   Winter  → pages/winter/script-system/compile.js
 *   Nibbler → pages/nibbler/script-system/compile.js
 */

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;

const tasks = [
  // ── Seasonal Script Systems ───────────────────────────────────
  {
    name: 'Spring Script System',
    script: path.join(ROOT, 'pages', 'spring', 'script-system', 'compile.js'),
  },
  {
    name: 'Summer Script System',
    script: path.join(ROOT, 'pages', 'summer', 'script-system', 'compile.js'),
  },
  {
    name: 'Autumn Script System',
    script: path.join(ROOT, 'pages', 'autumn', 'script-system', 'compile.js'),
  },
  {
    name: 'Winter Script System',
    script: path.join(ROOT, 'pages', 'winter', 'script-system', 'compile.js'),
  },
  {
    name: 'Nibbler Script System',
    script: path.join(ROOT, 'pages', 'nibbler', 'script-system', 'compile.js'),
  },
  // ── Summer Extras ──────────────────────────────────────────
  {
    name: 'Summer Production',
    script: path.join(ROOT, 'pages', 'summer', 'compile-production.js'),
  },
  {
    name: "Summer Director's Notes",
    script: path.join(ROOT, 'pages', 'summer', 'directors-notes', 'compile.js'),
  },
  {
    name: 'Summer Character Sheets',
    script: path.join(ROOT, 'pages', 'summer', 'characters', 'compile.js'),
  },
  {
    name: 'Summer Production Bible',
    script: path.join(ROOT, 'pages', 'summer', 'bible-system', 'compile.js'),
  },
  {
    name: 'Summer Inspiration Gallery',
    script: path.join(ROOT, 'pages', 'summer', 'inspiration', 'compile.js'),
  },
  {
    name: 'Summer Storyboard Frames',
    script: path.join(ROOT, 'pages', 'summer', 'storyboard-system', 'compile.js'),
  },
  {
    name: 'Summer Storyboard PDFs',
    script: path.join(ROOT, 'pages', 'summer', 'storyboard-system', 'compile-pdfs.js'),
  },
];

function runTask(task) {
  console.log(`\n=== ${task.name} ===`);
  console.log(`Running: node ${path.relative(ROOT, task.script)}`);

  const result = spawnSync(process.execPath, [task.script], {
    cwd: ROOT,
    stdio: 'inherit',
  });

  if (result.error) {
    console.error(`Error running ${task.name}:`, result.error.message);
    return false;
  }

  if (typeof result.status === 'number' && result.status !== 0) {
    console.error(`${task.name} failed with exit code ${result.status}.`);
    return false;
  }

  console.log(`✓ ${task.name} complete`);
  return true;
}

function main() {
  console.log('Compiling Summer markdown systems from repo root...');
  const startedAt = Date.now();

  for (const task of tasks) {
    const ok = runTask(task);
    if (!ok) {
      console.error('\nCompilation stopped due to an error.');
      process.exit(1);
    }
  }

  const isWindows = process.platform === 'win32';
  if (isWindows) {
    console.log('\n=== Exporting Artifacts ===');
    console.log('Running: export-artifacts.ps1');
    const exportResult = spawnSync('powershell.exe', ['-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'export-artifacts.ps1')], {
      cwd: ROOT,
      stdio: 'inherit',
    });

    if (exportResult.error) {
      console.error('Error running export-artifacts.ps1:', exportResult.error.message);
    } else if (typeof exportResult.status === 'number' && exportResult.status !== 0) {
      console.error(`export-artifacts.ps1 failed with exit code ${exportResult.status}.`);
    } else {
      console.log('✓ Artifacts export complete');
    }
  } else {
    console.log('\n=== Exporting Artifacts ===');
    console.log('Skipped (export-artifacts.ps1 is Windows-only).');
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(`\nAll compilers finished successfully in ${(elapsedMs / 1000).toFixed(1)}s.`);
}

main();
