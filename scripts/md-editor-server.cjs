/* Local Markdown Editor Server (no dependencies)
 *
 * Serves the script-system static site + provides safe read/write APIs for scenes.
 *
 * Run:
 *   npm run editor
 *
 * Then open:
 *   http://127.0.0.1:41731/editor.html
 */

const http = require('http');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { URL } = require('url');
const { spawn } = require('child_process');

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 41731);

const PROJECT_ROOT = process.cwd();
const SCRIPT_SYSTEM_DIR = path.join(PROJECT_ROOT, 'pages', 'summer', 'script-system');
const SCENES_DIR = path.join(SCRIPT_SYSTEM_DIR, 'scenes');
const MANIFEST_PATH = path.join(SCRIPT_SYSTEM_DIR, 'manifest.json');
const ENABLE_GIT = process.env.FILM_EDITOR_ENABLE_GIT === '1';

const GIT_SCOPE_PATHS = [
  'pages/summer/script-system/scenes',
  'pages/summer/script-system/manifest.json',
];

function hasGitRepo() {
  return fs.existsSync(path.join(PROJECT_ROOT, '.git'));
}

function runGit(args, opts = {}) {
  const timeoutMs = typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 25_000;
  return new Promise((resolve) => {
    const child = spawn('git', args, {
      cwd: PROJECT_ROOT,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        // Never prompt for creds; fail fast and return error
        GIT_TERMINAL_PROMPT: '0',
      },
    });

    let stdout = '';
    let stderr = '';
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });

    let killedByTimeout = false;
    const t = setTimeout(() => {
      killedByTimeout = true;
      try { child.kill('SIGKILL'); } catch (e) { /* ignore */ }
    }, timeoutMs);

    child.on('close', (code, signal) => {
      clearTimeout(t);
      resolve({
        ok: code === 0 && !killedByTimeout,
        code,
        signal,
        killedByTimeout,
        stdout: stdout.trimEnd(),
        stderr: stderr.trimEnd(),
        cmd: `git ${args.join(' ')}`,
      });
    });

    child.on('error', (err) => {
      clearTimeout(t);
      resolve({
        ok: false,
        code: -1,
        signal: null,
        killedByTimeout: false,
        stdout: '',
        stderr: String(err && err.message ? err.message : err),
        cmd: `git ${args.join(' ')}`,
      });
    });
  });
}

function send(res, statusCode, headers, body) {
  res.writeHead(statusCode, headers);
  res.end(body);
}

function sendText(res, statusCode, text, contentType = 'text/plain; charset=utf-8') {
  send(res, statusCode, { 'Content-Type': contentType }, text);
}

function sendJson(res, statusCode, obj) {
  send(res, statusCode, { 'Content-Type': 'application/json; charset=utf-8' }, JSON.stringify(obj, null, 2));
}

function safeSceneFileName(file) {
  if (typeof file !== 'string') return null;
  if (!file.endsWith('.md')) return null;
  if (file.includes('/') || file.includes('\\')) return null;
  if (file.includes('..')) return null;
  if (!/^[a-zA-Z0-9._-]+\.md$/.test(file)) return null;
  return file;
}

async function readBodyJson(req) {
  return await new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
      // naive limit (10MB)
      if (raw.length > 10 * 1024 * 1024) {
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

async function atomicWriteFile(targetPath, content) {
  const dir = path.dirname(targetPath);
  const base = path.basename(targetPath);
  const tmp = path.join(dir, `.${base}.tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  await fsp.writeFile(tmp, content, 'utf8');
  await fsp.rename(tmp, targetPath);
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.html':
      return 'text/html; charset=utf-8';
    case '.css':
      return 'text/css; charset=utf-8';
    case '.js':
      return 'application/javascript; charset=utf-8';
    case '.json':
      return 'application/json; charset=utf-8';
    case '.md':
      return 'text/markdown; charset=utf-8';
    case '.svg':
      return 'image/svg+xml';
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

async function handleApi(req, res, url) {
  // GET /api/scenes
  if (req.method === 'GET' && url.pathname === '/api/scenes') {
    try {
      const raw = await fsp.readFile(MANIFEST_PATH, 'utf8');
      const scenes = JSON.parse(raw);
      const normalized = scenes.map((s, idx) => ({
        ...s,
        sceneNumber: idx + 1,
      }));
      return sendJson(res, 200, { ok: true, scenes: normalized });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e && e.message ? e.message : e) });
    }
  }

  // GET /api/scene?file=01_arrival.md
  if (req.method === 'GET' && url.pathname === '/api/scene') {
    const file = safeSceneFileName(url.searchParams.get('file'));
    if (!file) return sendJson(res, 400, { ok: false, error: 'Invalid scene file' });
    const scenePath = path.join(SCENES_DIR, file);

    try {
      const content = await fsp.readFile(scenePath, 'utf8');
      return sendJson(res, 200, { ok: true, file, content });
    } catch (e) {
      const code = e && e.code === 'ENOENT' ? 404 : 500;
      return sendJson(res, code, { ok: false, error: String(e && e.message ? e.message : e) });
    }
  }

  // POST /api/scene?file=... { content }
  if (req.method === 'POST' && url.pathname === '/api/scene') {
    const file = safeSceneFileName(url.searchParams.get('file'));
    if (!file) return sendJson(res, 400, { ok: false, error: 'Invalid scene file' });

    let body;
    try {
      body = await readBodyJson(req);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
    }

    const content = typeof body.content === 'string' ? body.content : null;
    if (content == null) return sendJson(res, 400, { ok: false, error: 'Missing content' });

    const scenePath = path.join(SCENES_DIR, file);
    try {
      // Ensure scenes dir exists
      await fsp.mkdir(SCENES_DIR, { recursive: true });
      await atomicWriteFile(scenePath, content);
      return sendJson(res, 200, { ok: true, file });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e && e.message ? e.message : e) });
    }
  }

  // GET /api/manifest
  if (req.method === 'GET' && url.pathname === '/api/manifest') {
    try {
      const content = await fsp.readFile(MANIFEST_PATH, 'utf8');
      return sendJson(res, 200, { ok: true, content });
    } catch (e) {
      const code = e && e.code === 'ENOENT' ? 404 : 500;
      return sendJson(res, code, { ok: false, error: String(e && e.message ? e.message : e) });
    }
  }

  // POST /api/manifest { content }
  if (req.method === 'POST' && url.pathname === '/api/manifest') {
    let body;
    try {
      body = await readBodyJson(req);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
    }

    const content = typeof body.content === 'string' ? body.content : null;
    if (content == null) return sendJson(res, 400, { ok: false, error: 'Missing content' });

    // Validate JSON (to avoid saving broken manifest)
    try {
      JSON.parse(content);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: 'Manifest content is not valid JSON' });
    }

    try {
      await atomicWriteFile(MANIFEST_PATH, content);
      return sendJson(res, 200, { ok: true });
    } catch (e) {
      return sendJson(res, 500, { ok: false, error: String(e && e.message ? e.message : e) });
    }
  }

  // GET /api/git/status
  if (req.method === 'GET' && url.pathname === '/api/git/status') {
    if (!ENABLE_GIT) return sendJson(res, 403, { ok: false, error: 'Git integration disabled (set FILM_EDITOR_ENABLE_GIT=1)' });
    if (!hasGitRepo()) return sendJson(res, 400, { ok: false, error: 'No .git directory found in project root' });

    const inside = await runGit(['rev-parse', '--is-inside-work-tree'], { timeoutMs: 8000 });
    if (!inside.ok) return sendJson(res, 400, { ok: false, error: inside.stderr || inside.stdout || 'Not a git repo' });

    const st = await runGit(['status', '--porcelain', '--', ...GIT_SCOPE_PATHS], { timeoutMs: 12000 });
    return sendJson(res, 200, {
      ok: true,
      enabled: true,
      scope: GIT_SCOPE_PATHS,
      hasChanges: !!(st.stdout || '').trim(),
      porcelain: st.stdout || '',
    });
  }

  // POST /api/git/publish { message?, file? }
  if (req.method === 'POST' && url.pathname === '/api/git/publish') {
    if (!ENABLE_GIT) return sendJson(res, 403, { ok: false, error: 'Git integration disabled (set FILM_EDITOR_ENABLE_GIT=1)' });
    if (!hasGitRepo()) return sendJson(res, 400, { ok: false, error: 'No .git directory found in project root' });

    let body;
    try {
      body = await readBodyJson(req);
    } catch (e) {
      return sendJson(res, 400, { ok: false, error: 'Invalid JSON body' });
    }

    const file = typeof body.file === 'string' ? body.file : null;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const stamp = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
    const defaultMsg = file ? `Edit ${file} (${stamp})` : `Script edits (${stamp})`;
    const commitMsg = message || defaultMsg;

    const steps = [];

    const inside = await runGit(['rev-parse', '--is-inside-work-tree'], { timeoutMs: 8000 });
    steps.push(inside);
    if (!inside.ok) return sendJson(res, 400, { ok: false, error: inside.stderr || inside.stdout || 'Not a git repo', steps });

    const st = await runGit(['status', '--porcelain', '--', ...GIT_SCOPE_PATHS], { timeoutMs: 12000 });
    steps.push(st);
    if (!st.ok) return sendJson(res, 500, { ok: false, error: st.stderr || 'git status failed', steps });
    if (!((st.stdout || '').trim())) {
      return sendJson(res, 200, { ok: true, published: false, message: 'Nothing to publish', steps });
    }

    const add = await runGit(['add', '--', ...GIT_SCOPE_PATHS], { timeoutMs: 12000 });
    steps.push(add);
    if (!add.ok) return sendJson(res, 500, { ok: false, error: add.stderr || 'git add failed', steps });

    const commit = await runGit(['commit', '-m', commitMsg], { timeoutMs: 12000 });
    steps.push(commit);
    if (!commit.ok) {
      const combined = `${commit.stdout}\n${commit.stderr}`.trim();
      // Common case: nothing to commit (e.g. weird index state)
      if (/nothing to commit/i.test(combined)) {
        return sendJson(res, 200, { ok: true, published: false, message: 'Nothing to commit', steps });
      }
      return sendJson(res, 500, { ok: false, error: combined || 'git commit failed', steps });
    }

    const push = await runGit(['push'], { timeoutMs: 25_000 });
    steps.push(push);
    if (!push.ok) {
      const combined = `${push.stdout}\n${push.stderr}`.trim();
      return sendJson(res, 500, { ok: false, error: combined || 'git push failed', steps });
    }

    return sendJson(res, 200, { ok: true, published: true, message: commitMsg, steps });
  }

  return sendJson(res, 404, { ok: false, error: 'Not found' });
}

async function handleStatic(req, res, url) {
  // Serve from script-system directory only
  let reqPath = decodeURIComponent(url.pathname || '/');
  if (reqPath === '/') reqPath = '/editor.html';

  // Block traversal
  if (reqPath.includes('..')) return sendText(res, 400, 'Bad path');

  const fsPath = path.join(SCRIPT_SYSTEM_DIR, reqPath);
  let stat;
  try {
    stat = await fsp.stat(fsPath);
  } catch (e) {
    return sendText(res, 404, 'Not found');
  }

  if (stat.isDirectory()) {
    const indexPath = path.join(fsPath, 'index.html');
    try {
      const indexStat = await fsp.stat(indexPath);
      if (indexStat.isFile()) {
        const buf = await fsp.readFile(indexPath);
        return send(res, 200, { 'Content-Type': contentTypeFor(indexPath) }, buf);
      }
    } catch (e) {
      return sendText(res, 404, 'Not found');
    }
  }

  if (!stat.isFile()) return sendText(res, 404, 'Not found');
  const buf = await fsp.readFile(fsPath);
  return send(res, 200, { 'Content-Type': contentTypeFor(fsPath) }, buf);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

    // Minimal CORS for local use (handy if you open the editor from a different origin)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return sendText(res, 204, '');

    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    return await handleStatic(req, res, url);
  } catch (e) {
    return sendJson(res, 500, { ok: false, error: String(e && e.message ? e.message : e) });
  }
});

server.listen(PORT, HOST, () => {
  const url = `http://${HOST}:${PORT}/editor.html`;
  // eslint-disable-next-line no-console
  console.log(`MD editor server running: ${url}`);
  // eslint-disable-next-line no-console
  console.log(`Serving static from: ${SCRIPT_SYSTEM_DIR}`);
});

