# Director's Notes

A small system for script additions, scene-linked notes, and other ideas — similar in spirit to the script-system.

## Structure

```
directors-notes/
├── index.html           # Hub: Script Additions, By Scene, Other Ideas
├── note.html            # Single-note viewer (?type=scene&id=... | script_additions | other_ideas)
├── directors-notes.css  # Styles
├── script_additions.md  # Running list of additions/changes to fold into the script
├── other_ideas.md       # Tone, imagery, design — not tied to a scene
├── notes/               # One .md per scene (optional)
│   └── <scene-id>.md    # e.g. the-last-dinner.md
└── README.md
```

## Scene IDs

Scene list and links come from the **script-system** `manifest.json`. Each scene has an `id` (e.g. `the-last-dinner`). To add a director’s note for that scene, create:

- `notes/the-last-dinner.md`

Use the same `id` as in the script manifest so “By Scene” links match.

## Quick start

1. **Script additions** — Edit `script_additions.md` with ideas to add or change in the script.
2. **Other ideas** — Edit `other_ideas.md` for general tone, design, or casting notes.
3. **Per-scene notes** — Create `notes/<scene-id>.md` for any scene. Link to the script in the note with:  
   `[View script →](/pages/summer/script-system/scene.html?id=<scene-id>)`

### Compile to one document (optional)

To build a single **full notes** document (markdown + HTML) with hierarchy: Script Additions → By Scene (by act) → Other Ideas:

```bash
node compile.js
```

This creates:
- `full_notes.md` — all notes in one markdown file
- `full_notes.html` — same content, rendered; linked from Full Script nav as "Full Notes"

Open `index.html` in a browser (or serve the repo) for the hub. Scene list is loaded from `../script-system/manifest.json`.
