#!/usr/bin/env node

/**
 * Start up the Summer project: compile everything, serve the site, and open the full script.
 *
 * Usage (from repo root):
 *   node start-summer.js
 *   npm run "start up"
 */

const path = require('path');
const fs = require('fs');
const http = require('http');
const { spawnSync, execSync } = require('child_process');

const ROOT = __dirname;
const PORT = 3333;
const FULL_SCRIPT_URL = `http://localhost:${PORT}/pages/summer/script-system/full_script.html`;

function compileSummer() {
  console.log('Compiling Summer (script, production, notes, characters)...');
  const result = spawnSync(process.execPath, [path.join(ROOT, 'compile-all.js')], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    console.error('Compile failed.');
    process.exit(1);
  }
  console.log('Compile done.\n');
}

function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  if (platform === 'darwin') cmd = `open "${url}"`;
  else if (platform === 'win32') cmd = `start "${url}"`;
  else cmd = `xdg-open "${url}"`;
  try {
    execSync(cmd, { stdio: 'ignore' });
  } catch (_) {
    console.log('Open this URL in your browser:', url);
  }
}

function serveStatic(req, res) {
  let filePath = path.join(ROOT, req.url === '/' ? '/index.html' : req.url);
  const parsed = path.parse(filePath);
  if (!parsed.ext) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end();
    return;
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    const ext = path.extname(filePath);
    const types = {
      '.html': 'text/html',
      '.css': 'text/css',
      '.js': 'application/javascript',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.ico': 'image/x-icon',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.svg': 'image/svg+xml',
    };
    res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
    res.end(data);
  });
}

function main() {
  compileSummer();

  const server = http.createServer(serveStatic);
  server.listen(PORT, () => {
    console.log(`Serving at http://localhost:${PORT}`);
    console.log(`Opening full script: ${FULL_SCRIPT_URL}\n`);
    openBrowser(FULL_SCRIPT_URL);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is in use. Try closing the other process or change PORT in start-summer.js.`);
    } else {
      console.error(err);
    }
    process.exit(1);
  });
}

main();
