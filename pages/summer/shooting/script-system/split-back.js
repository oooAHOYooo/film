#!/usr/bin/env node

/**
 * Split-back tool
 * Reads an edited copy of the full script (full_script.edit.md by default)
 * and writes each scene's content back to its source file in scenes/.
 *
 * Usage:
 *   node split-back.js              # dry-run: prints a diff per changed scene
 *   node split-back.js --write      # actually writes the scene files
 *   node split-back.js --file path  # use a different edited script file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SCENES_DIR = path.join(__dirname, 'scenes');
const DEFAULT_EDIT_FILE = path.join(__dirname, 'full_script.edit.md');

const args = process.argv.slice(2);
const write = args.includes('--write');
const fileArgIndex = args.indexOf('--file');
const editFilePath = fileArgIndex !== -1 ? path.resolve(args[fileArgIndex + 1]) : DEFAULT_EDIT_FILE;

if (!fs.existsSync(editFilePath)) {
  console.error(`Edited script not found: ${editFilePath}`);
  process.exit(1);
}

const fullText = fs.readFileSync(editFilePath, 'utf8');

// Matches each scene's compiled header block and captures the target filename.
// Block shape (see compile.js compileMarkdown):
//   ### Scene <n>: <title>
//   *ACT ... | ID: <id> | File: <file>*
//   ---
//   <!-- scene: <n> file: <file> nickname: <nick> -->
const HEADER_RE = /### Scene [^\n]+\n\n\*[^\n]*\|\s*File:\s*(\S+?)\*\n\n---\n\n<!-- scene:[^\n]*-->\n\n/g;

const matches = [...fullText.matchAll(HEADER_RE)];

if (matches.length === 0) {
  console.error('No scene headers found — is this a compiled full_script(.edit).md file?');
  process.exit(1);
}

// Trailing separator between one scene's content and the next scene/act heading.
const TRAILING_SEP_RE = /\n+---\s*\n+(?:## ACT[^\n]*\n+---\s*\n+)?\s*$/;

const scenes = matches.map((m, i) => {
  const file = m[1];
  const contentStart = m.index + m[0].length;
  const contentEnd = i + 1 < matches.length ? matches[i + 1].index : fullText.length;
  let content = fullText.slice(contentStart, contentEnd);
  content = content.replace(TRAILING_SEP_RE, '\n');
  return { file, content: content.trimEnd() + '\n' };
});

let changedCount = 0;

scenes.forEach(({ file, content }) => {
  const scenePath = path.join(SCENES_DIR, file);
  if (!fs.existsSync(scenePath)) {
    console.warn(`⚠ Skipping ${file}: no matching file in scenes/`);
    return;
  }

  const original = fs.readFileSync(scenePath, 'utf8');

  // Preserve the scene file's own header comment exactly (case/formatting),
  // rather than the one compile.js injected into the full script.
  const originalHeaderMatch = original.match(/^<!-- scene:.*?-->\n\n/);
  let newContent = content;
  if (originalHeaderMatch) {
    const bodyWithoutInjectedHeader = content.replace(/^<!-- scene:.*?-->\n\n/, '');
    newContent = originalHeaderMatch[0] + bodyWithoutInjectedHeader;
  }

  if (newContent === original) return;

  changedCount++;

  if (write) {
    fs.writeFileSync(scenePath, newContent, 'utf8');
    console.log(`✓ Updated ${file}`);
  } else {
    console.log(`\n=== ${file} (dry-run) ===`);
    const tmpOld = path.join(require('os').tmpdir(), `split-back-old-${file}`);
    const tmpNew = path.join(require('os').tmpdir(), `split-back-new-${file}`);
    fs.writeFileSync(tmpOld, original);
    fs.writeFileSync(tmpNew, newContent);
    try {
      execSync(`diff -u "${tmpOld}" "${tmpNew}"`, { stdio: 'inherit' });
    } catch (e) {
      // diff exits 1 when files differ; that's expected here.
    }
    fs.unlinkSync(tmpOld);
    fs.unlinkSync(tmpNew);
  }
});

if (changedCount === 0) {
  console.log('No changes detected between edited script and scene files.');
} else if (!write) {
  console.log(`\n${changedCount} scene(s) changed. Re-run with --write to apply.`);
} else {
  console.log(`\n${changedCount} scene(s) written. Re-run compile.js to regenerate full_script.md/html.`);
}
