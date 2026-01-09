const { json, assertAdmin, requireEnv, ghFetch, b64decode, repoParts } = require('./_shared.cjs');

// Reads manifest.json from GitHub and returns scenes with sceneNumber.
exports.handler = async (event) => {
  try {
    const unauth = assertAdmin(event);
    if (unauth) return unauth;

    const token = requireEnv('GITHUB_TOKEN');
    const branch = process.env.GITHUB_BRANCH || 'main';
    const { owner, name } = repoParts();

    const manifestPath = 'pages/summer/script-system/manifest.json';
    const res = await ghFetch(`/repos/${owner}/${name}/contents/${encodeURIComponent(manifestPath)}?ref=${encodeURIComponent(branch)}`, { token });
    if (!res.ok) {
      return json(res.status, { ok: false, error: 'Failed to fetch manifest', details: res.data || res.raw });
    }

    const contentB64 = res.data && res.data.content;
    const manifestText = b64decode(contentB64);
    const arr = JSON.parse(manifestText);
    const scenes = Array.isArray(arr) ? arr.map((s, idx) => ({ ...s, sceneNumber: idx + 1 })) : [];

    return json(200, { ok: true, scenes, branch });
  } catch (e) {
    return json(500, { ok: false, error: String(e && e.message ? e.message : e) });
  }
};

