function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...extraHeaders,
    },
    body: JSON.stringify(body, null, 2),
  };
}

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function getAuthToken(event) {
  const h = event.headers || {};
  const raw = h.authorization || h.Authorization || '';
  const m = String(raw).match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : '';
}

function assertAdmin(event) {
  const expected = process.env.FILM_ADMIN_TOKEN || '';
  if (!expected) throw new Error('Missing env var: FILM_ADMIN_TOKEN');
  const got = getAuthToken(event);
  if (!got || got !== expected) {
    return json(401, { ok: false, error: 'Unauthorized' }, { 'www-authenticate': 'Bearer' });
  }
  return null;
}

function b64decode(b64) {
  return Buffer.from(String(b64 || ''), 'base64').toString('utf8');
}

function b64encode(text) {
  return Buffer.from(String(text || ''), 'utf8').toString('base64');
}

async function ghFetch(path, { method = 'GET', token, body } = {}) {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      'accept': 'application/vnd.github+json',
      'user-agent': 'film-editor-netlify-function',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch (e) { /* ignore */ }
  return { ok: res.ok, status: res.status, data, raw: text };
}

function repoParts() {
  const repo = requireEnv('GITHUB_REPO'); // "owner/name"
  const [owner, name] = repo.split('/');
  if (!owner || !name) throw new Error('GITHUB_REPO must be "owner/name"');
  return { owner, name };
}

module.exports = {
  json,
  requireEnv,
  assertAdmin,
  b64decode,
  b64encode,
  ghFetch,
  repoParts,
};

