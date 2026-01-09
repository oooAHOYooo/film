const $ = (id) => document.getElementById(id);

const elSceneList = $('sceneList');
const elSearch = $('search');
const elDoc = $('doc');
const elRaw = $('raw');
const elFileTitle = $('fileTitle');
const elFileSub = $('fileSub');
const elStatus = $('status');
const elAutoPublish = $('autoPublish');
const elBtnPublish = $('btnPublish');
const elBtnSave = $('btnSave');
const elBtnRaw = $('btnRaw');
const elBtnZen = $('btnZen');

let scenes = [];
let activeFile = null;
let activeScene = null;
let cleanValue = '';
let lastLoadToken = 0;
let isPublishing = false;
let isRawMode = false;

function setStatus(kind, msg) {
  elStatus.className = 'status';
  if (kind) elStatus.classList.add(kind);
  elStatus.textContent = msg;
}

function isDirty() {
  return activeFile && getCurrentText() !== cleanValue;
}

function updateDirtyUI() {
  if (!activeFile) {
    setStatus('', 'Idle');
    return;
  }
  if (isDirty()) setStatus('is-dirty', 'Unsaved');
  else setStatus('is-saved', 'Saved');
}

function normalizeNewlines(s) {
  return String(s || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function textToDocHtml(text) {
  const t = normalizeNewlines(text);
  const blocks = t.split(/\n{2,}/);
  const ps = blocks.map((b) => {
    const trimmed = b.replace(/\s+$/g, '');
    if (!trimmed) return '<p><br></p>';
    const html = escapeHtml(trimmed).replace(/\n/g, '<br>');
    return `<p>${html}</p>`;
  });
  return ps.join('');
}

function docToText() {
  // Prefer block elements; fall back to innerText
  const blocks = [];
  const children = Array.from(elDoc.childNodes);
  for (const node of children) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = /** @type {HTMLElement} */ (node);
      const txt = (el.innerText || '').replace(/\u00A0/g, ' ').replace(/\s+$/g, '');
      blocks.push(txt);
    } else if (node.nodeType === Node.TEXT_NODE) {
      const txt = (node.textContent || '').replace(/\u00A0/g, ' ').replace(/\s+$/g, '');
      if (txt.trim()) blocks.push(txt);
    }
  }
  if (!blocks.length) return '';
  // Collapse excess empty blocks
  const collapsed = [];
  for (const b of blocks) {
    const v = normalizeNewlines(b);
    if (!v.trim()) {
      if (collapsed.length === 0) continue;
      if (!collapsed[collapsed.length - 1].trim()) continue;
      collapsed.push('');
      continue;
    }
    collapsed.push(v);
  }
  return collapsed.join('\n\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function setMode(raw) {
  isRawMode = !!raw;
  if (isRawMode) {
    // Sync doc -> raw
    elRaw.value = activeFile ? docToText().replace(/\n$/, '') : '';
    elRaw.style.display = 'block';
    elDoc.style.display = 'none';
    elBtnRaw.textContent = 'Doc';
    elRaw.focus();
  } else {
    // Sync raw -> doc
    if (activeFile) {
      const t = normalizeNewlines(elRaw.value || '');
      elDoc.innerHTML = textToDocHtml(t);
    }
    elRaw.style.display = 'none';
    elDoc.style.display = 'block';
    elBtnRaw.textContent = 'Raw';
    if (activeFile) focusDocEnd();
  }
  updateDirtyUI();
}

function focusDocEnd() {
  elDoc.focus();
  const range = document.createRange();
  range.selectNodeContents(elDoc);
  range.collapse(false);
  const sel = window.getSelection();
  if (!sel) return;
  sel.removeAllRanges();
  sel.addRange(range);
}

function getCurrentText() {
  if (!activeFile) return '';
  if (isRawMode) return normalizeNewlines(elRaw.value || '').trimEnd() + '\n';
  return docToText();
}

function draftKey(file) {
  return `zen-md-editor:draft:${file}`;
}

function saveDraft(file, content) {
  try {
    localStorage.setItem(draftKey(file), JSON.stringify({ content, ts: Date.now() }));
  } catch (e) {
    // ignore
  }
}

function loadDraft(file) {
  try {
    const raw = localStorage.getItem(draftKey(file));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.content !== 'string') return null;
    return parsed;
  } catch (e) {
    return null;
  }
}

function clearDraft(file) {
  try {
    localStorage.removeItem(draftKey(file));
  } catch (e) {
    // ignore
  }
}

function groupByAct(items) {
  const map = new Map();
  for (const s of items) {
    const act = Number(s.act || 0);
    const title = (s.actTitle || (act ? `Act ${act}` : 'Unsorted')).trim();
    if (!map.has(act)) map.set(act, { act, title, scenes: [] });
    map.get(act).scenes.push(s);
  }
  return Array.from(map.values()).sort((a, b) => a.act - b.act);
}

function renderSceneList(filterText = '') {
  const q = filterText.trim().toLowerCase();
  const filtered = q
    ? scenes.filter((s) => {
        const hay = `${s.title || ''} ${s.id || ''} ${s.file || ''} ${s.sceneNumber || ''}`.toLowerCase();
        return hay.includes(q);
      })
    : scenes.slice();

  const acts = groupByAct(filtered);
  elSceneList.innerHTML = '';

  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.style.padding = '14px';
    empty.style.color = 'rgba(255,255,255,0.65)';
    empty.textContent = 'No matches.';
    elSceneList.appendChild(empty);
    return;
  }

  for (const act of acts) {
    const wrap = document.createElement('div');
    wrap.className = 'act';
    const t = document.createElement('div');
    t.className = 'act-title';
    t.textContent = act.title;
    wrap.appendChild(t);

    for (const s of act.scenes) {
      const row = document.createElement('div');
      row.className = 'scene';
      if (activeFile && s.file === activeFile) row.classList.add('is-active');
      row.dataset.file = s.file;

      const num = document.createElement('div');
      num.className = 'scene-num';
      num.textContent = String(s.sceneNumber || '').padStart(2, '0');

      const meta = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'scene-title';
      title.textContent = s.title || s.id || s.file;
      const file = document.createElement('div');
      file.className = 'scene-file';
      file.textContent = s.file;
      meta.appendChild(title);
      meta.appendChild(file);

      row.appendChild(num);
      row.appendChild(meta);
      row.addEventListener('click', () => openSceneFile(s.file));

      wrap.appendChild(row);
    }

    elSceneList.appendChild(wrap);
  }
}

function setZen(on) {
  document.body.classList.toggle('zen', !!on);
  elBtnZen.textContent = document.body.classList.contains('zen') ? 'Exit Zen' : 'Zen';
}

async function apiGetJson(path) {
  const res = await fetch(path, { headers: { 'Accept': 'application/json' } });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.ok === false) {
    const err = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data;
}

async function apiPostJson(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data || data.ok === false) {
    const err = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data;
}

async function loadScenes() {
  setStatus('', 'Loading…');
  const data = await apiGetJson('/api/scenes');
  scenes = Array.isArray(data.scenes) ? data.scenes : [];
  renderSceneList(elSearch.value);
  setStatus('', 'Pick a scene');
}

function setActiveSceneMeta(scene) {
  activeScene = scene || null;
  if (!scene) {
    elFileTitle.textContent = 'Pick a scene';
    elFileSub.textContent = 'Ctrl/Cmd+S to save • Ctrl/Cmd+Enter to toggle raw • Ctrl/Cmd+\\ to zen';
    return;
  }

  elFileTitle.textContent = `Scene ${String(scene.sceneNumber).padStart(2, '0')}: ${scene.title || scene.id || scene.file}`;
  elFileSub.textContent = `File: ${scene.file} • ID: ${scene.id || '—'}`;
}

async function openSceneFile(file) {
  if (!file) return;

  if (activeFile && file === activeFile) return;

  if (isDirty()) {
    const ok = window.confirm('You have unsaved changes. Discard them and switch scenes?');
    if (!ok) return;
  }

  activeFile = file;
  cleanValue = '';
  elDoc.innerHTML = '';
  elRaw.value = '';
  elDoc.setAttribute('contenteditable', 'false');
  elRaw.disabled = true;
  updateDirtyUI();

  // Highlight active row
  renderSceneList(elSearch.value);

  const scene = scenes.find((s) => s.file === file) || { file, title: file, sceneNumber: 0 };
  setActiveSceneMeta(scene);

  const token = ++lastLoadToken;
  try {
    setStatus('', 'Loading…');
    const data = await apiGetJson(`/api/scene?file=${encodeURIComponent(file)}`);
    if (token !== lastLoadToken) return;

    const serverText = typeof data.content === 'string' ? data.content : '';

    // Offer draft restore if present and different
    const draft = loadDraft(file);
    let nextText = serverText;
    if (draft && typeof draft.content === 'string' && draft.content !== serverText) {
      const restore = window.confirm('Found a local draft for this scene. Restore it?');
      if (restore) nextText = draft.content;
      else clearDraft(file);
    }

    cleanValue = normalizeNewlines(serverText).trimEnd() + '\n';

    // Load content into both views, default to doc mode
    elDoc.innerHTML = textToDocHtml(nextText);
    elRaw.value = normalizeNewlines(nextText).replace(/\n$/, '');
    elDoc.setAttribute('contenteditable', 'true');
    elRaw.disabled = false;
    setMode(false);
    updateDirtyUI();
    setStatus('', isDirty() ? 'Unsaved' : 'Saved');
  } catch (e) {
    if (token !== lastLoadToken) return;
    elDoc.setAttribute('contenteditable', 'false');
    elRaw.disabled = true;
    setStatus('is-error', `Load failed: ${e.message}`);
  }
}

async function saveActive() {
  if (!activeFile) return;
  const content = getCurrentText();
  try {
    setStatus('', 'Saving…');
    await apiPostJson(`/api/scene?file=${encodeURIComponent(activeFile)}`, { content });
    // "clean" state becomes what we just wrote
    cleanValue = content;
    clearDraft(activeFile);
    updateDirtyUI();
    setStatus('is-saved', 'Saved');

    if (elAutoPublish && elAutoPublish.checked) {
      // fire-and-forget but serialized; this will show errors in status
      await publishNow({ confirmFirst: false });
    }
  } catch (e) {
    setStatus('is-error', `Save failed: ${e.message}`);
  }
}

function autoPublishKey() {
  return 'zen-md-editor:autoPublish';
}

function loadAutoPublish() {
  try {
    return localStorage.getItem(autoPublishKey()) === '1';
  } catch (e) {
    return false;
  }
}

function saveAutoPublish(on) {
  try {
    localStorage.setItem(autoPublishKey(), on ? '1' : '0');
  } catch (e) {
    // ignore
  }
}

function suggestedCommitMessage() {
  if (activeScene && activeScene.file) {
    const title = activeScene.title ? ` — ${activeScene.title}` : '';
    return `Edit ${activeScene.file}${title}`;
  }
  return 'Script edits';
}

async function publishNow({ confirmFirst } = { confirmFirst: true }) {
  if (isPublishing) return;
  if (!activeFile) {
    window.alert('Pick a scene first.');
    return;
  }
  if (isDirty()) {
    const okSave = window.confirm('You have unsaved edits. Save first?');
    if (!okSave) return;
    await saveActive();
    if (isDirty()) return; // save failed
  }

  if (confirmFirst) {
    const ok = window.confirm('Publish changes? This will git add/commit/push your script edits.');
    if (!ok) return;
  }

  isPublishing = true;
  const msg = suggestedCommitMessage();
  try {
    setStatus('', 'Publishing…');
    const res = await apiPostJson('/api/git/publish', { file: activeFile, message: msg });
    if (res.published) setStatus('is-saved', 'Published');
    else setStatus('', res.message || 'Nothing to publish');
  } catch (e) {
    setStatus('is-error', `Publish failed: ${e.message}`);
    window.alert(
      `Publish failed.\n\n${e.message}\n\nCommon fixes:\n- Ensure you have a git remote + upstream set\n- Run git push once in Terminal to authenticate (credential helper)\n- Re-run with FILM_EDITOR_ENABLE_GIT=1`
    );
  } finally {
    isPublishing = false;
  }
}

// Events
elSearch.addEventListener('input', () => renderSceneList(elSearch.value));
elBtnSave.addEventListener('click', () => saveActive());
elBtnPublish.addEventListener('click', () => publishNow({ confirmFirst: true }));
elBtnRaw.addEventListener('click', () => setMode(!isRawMode));
elBtnZen.addEventListener('click', () => setZen(!document.body.classList.contains('zen')));

if (elAutoPublish) {
  elAutoPublish.checked = loadAutoPublish();
  elAutoPublish.addEventListener('change', () => saveAutoPublish(elAutoPublish.checked));
}

elDoc.addEventListener('input', () => {
  updateDirtyUI();
  if (activeFile) saveDraft(activeFile, getCurrentText());
});

elRaw.addEventListener('input', () => {
  updateDirtyUI();
  if (activeFile) saveDraft(activeFile, getCurrentText());
});

window.addEventListener('beforeunload', (e) => {
  if (!isDirty()) return;
  e.preventDefault();
  e.returnValue = '';
});

document.addEventListener('keydown', (e) => {
  const isMod = e.metaKey || e.ctrlKey;
  if (!isMod) return;

  // Cmd/Ctrl+S
  if (e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveActive();
  }

  // Cmd/Ctrl+P (publish)
  if (e.key.toLowerCase() === 'p') {
    e.preventDefault();
    publishNow({ confirmFirst: true });
  }

  // Cmd/Ctrl+Enter (toggle raw)
  if (e.key === 'Enter') {
    e.preventDefault();
    setMode(!isRawMode);
  }

  // Cmd/Ctrl+\ (zen)
  if (e.key === '\\') {
    e.preventDefault();
    setZen(!document.body.classList.contains('zen'));
  }
});

// Init
(async function init() {
  // Start in doc mode, but keep the page empty until a scene is selected
  isRawMode = false;
  elRaw.style.display = 'none';
  elDoc.style.display = 'block';
  elBtnRaw.textContent = 'Raw';
  setZen(false);
  elDoc.setAttribute('contenteditable', 'false');
  elRaw.disabled = true;
  try {
    await loadScenes();
  } catch (e) {
    setStatus('is-error', `Failed to load manifest: ${e.message}`);
  }
})();

