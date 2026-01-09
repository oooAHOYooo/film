const { json, assertAdmin, requireEnv, ghFetch, b64decode, b64encode, repoParts } = require('./_shared.cjs');

function safeSceneFileName(file) {
  if (typeof file !== 'string') return null;
  if (!file.endsWith('.md')) return null;
  if (file.includes('/') || file.includes('\\')) return null;
  if (file.includes('..')) return null;
  if (!/^[a-zA-Z0-9._-]+\.md$/.test(file)) return null;
  return file;
}

exports.handler = async (event) => {
  try {
    const unauth = assertAdmin(event);
    if (unauth) return unauth;

    const token = requireEnv('GITHUB_TOKEN');
    const branch = process.env.GITHUB_BRANCH || 'main';
    const { owner, name } = repoParts();

    const file = safeSceneFileName((event.queryStringParameters || {}).file);
    if (!file) return json(400, { ok: false, error: 'Invalid scene file' });

    const scenePath = `pages/summer/script-system/scenes/${file}`;
    const baseUrl = `/repos/${owner}/${name}/contents/${encodeURIComponent(scenePath)}`;

    // GET: read file
    if (event.httpMethod === 'GET') {
      const res = await ghFetch(`${baseUrl}?ref=${encodeURIComponent(branch)}`, { token });
      if (!res.ok) {
        return json(res.status, { ok: false, error: 'Failed to fetch scene', details: res.data || res.raw });
      }
      const text = b64decode(res.data && res.data.content);
      return json(200, { ok: true, file, content: text, sha: res.data && res.data.sha, branch });
    }

    // POST: write file (commit to GitHub)
    if (event.httpMethod === 'POST') {
      const body = event.body ? JSON.parse(event.body) : {};
      const content = typeof body.content === 'string' ? body.content : null;
      if (content == null) return json(400, { ok: false, error: 'Missing content' });
      const message = typeof body.message === 'string' && body.message.trim()
        ? body.message.trim()
        : `Edit ${file}`;

      // Need current sha
      const current = await ghFetch(`${baseUrl}?ref=${encodeURIComponent(branch)}`, { token });
      if (!current.ok) {
        return json(current.status, { ok: false, error: 'Failed to fetch current sha', details: current.data || current.raw });
      }

      const sha = current.data && current.data.sha;
      const put = await ghFetch(baseUrl, {
        method: 'PUT',
        token,
        body: {
          message,
          content: b64encode(content),
          sha,
          branch,
        },
      });
      if (!put.ok) {
        return json(put.status, { ok: false, error: 'Failed to write scene', details: put.data || put.raw });
      }

      return json(200, {
        ok: true,
        file,
        message,
        commit: put.data && put.data.commit ? {
          sha: put.data.commit.sha,
          url: put.data.commit.html_url,
        } : null,
        branch,
      });
    }

    return json(405, { ok: false, error: 'Method not allowed' });
  } catch (e) {
    return json(500, { ok: false, error: String(e && e.message ? e.message : e) });
  }
};

