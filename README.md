# film

### Generate inspiration image manifests
- Requirements: Node.js (no deps), images placed in `assets/<season>/inspo-imgs/` or `assets/<season>/inspiration/`. Supported: `.jpg .jpeg .png .webp .gif .avif`
- Seasons scanned by default: `summer`, `winter`, `autumn` (configurable in the script).

Run from the repo root:

```bash
node scripts/generate-inspo-manifests.js
```

What it does:
- Scans each season’s inspiration folders, newest files first (by mtime).
- Produces/updates `data/<season>.json`, merging into the `inspiration` array.
- De-dupes by URL so re-running won’t duplicate items.
- Prefers output URLs under `/assets/<season>/inspo-imgs/...` even if source files were found in `inspiration/`.

Output shape (merged into your existing JSON):

```json
{
  "inspiration": [
    {
      "url": "/assets/summer/inspo-imgs/example.jpg",
      "title": "Example",
      "description": ""
    }
  ]
}
```

Tips:
- To add a new season, edit `SEASONS` in `scripts/generate-inspo-manifests.js`.
- To reset order or remove items, edit `data/<season>.json` manually.

### What `vault.js` does
`scripts/vault.js` hydrates seasonal pages client-side by fetching the corresponding JSON and rendering sections:
- `loadJson('/data/<key>.json')` fetches with a cache-busting query.
- `hydrateSection('<key>')` fills:
  - `[data-notes]` with `notes`
  - `[data-ideas]` with `ideas`
  - `[data-files]` with `files` (grouped by category; videos get a Play button and open in a modal player)
  - `[data-bookmarks]` with `bookmarks`
  - `[data-gallery]` with `gallery`
  - `[data-inspiration]` with `inspiration` (image grid)

Gallery UX:
- Click any image to open a modal with next/previous navigation and keyboard support (Esc, arrows, space).

Video UX:
- Videos open in a dedicated modal with optional fullscreen toggle, optimized for mobile playback.

Usage on a page (example from Summer):
```html
<script src="/scripts/vault.js"></script>
<script>
  hydrateSection('summer');
</script>
```