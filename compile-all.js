#!/usr/bin/env node

/**
 * Compile all Summer markdown-driven systems from project root.
 *
 * Usage:
 *   node compile-all.js
 *   npm run compile:all
 */

const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = __dirname;

const tasks = [
  {
    name: 'Summer Script System',
    script: path.join(ROOT, 'pages', 'summer', 'script-system', 'compile.js'),
  },
  {
    name: 'Summer Production (from script-system)',
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

  const elapsedMs = Date.now() - startedAt;
  console.log(`\nAll compilers finished successfully in ${(elapsedMs / 1000).toFixed(1)}s.`);
}

main();
