# Creatures in the Tall Grass Script - TLDR

## What Was Built

A local screenplay management system in `/pages/summer/script-system/` that allows writing scenes in Markdown and automatically generates:

- **Gallery View** (`index.html`): Lists all scenes from `manifest.json` with auto-numbering
- **Individual Scene Viewer** (`scene.html?id=xxx`): Renders scenes using Marked.js CDN
- **Full Script Compiler** (`compile.js`): Generates `full_script.md` and `full_script.html` from all scenes
- **Screenplay CSS** (`script.css`): Courier Prime font, proper margins (Action: 0, Character: 2.0in, Dialogue: 1.0in)

## Key Files

- `manifest.json`: Array of scene objects `[{id, file, title}]` - this is the "master order"
- `scenes/*.md`: Individual scene markdown files
- `index.html`: Gallery that reads manifest and displays scenes
- `scene.html`: Template that loads scene by ID from manifest
- `compile.js`: Node.js script that stitches all scenes into full script
- `script.css`: Screenplay formatting stylesheet

## How It Works

1. **Order-Agnostic**: Scenes are numbered 1, 2, 3... based on position in `manifest.json`, not filename
2. **Easy Insertion**: Add new scene file, add entry to manifest in desired position
3. **No Build Step**: Pure HTML/JS/CSS - open `index.html` in browser
4. **Compilation**: Run `node compile.js` to generate full script

## Tech Stack

- Vanilla JS
- HTML5
- Marked.js (CDN) for markdown parsing
- Node.js for compiler script
- Courier Prime font (Google Fonts)

## Folder Structure

```
script-system/
├── scenes/          # .md scene files
├── manifest.json    # Master order
├── index.html       # Gallery
├── scene.html       # Scene viewer
├── compile.js       # Compiler
├── script.css       # Styling
└── full_script.*    # Generated files
```

## Usage

- Add scene: Create `scenes/name.md`, add to `manifest.json`
- Reorder: Edit `manifest.json` array order
- View: Open `index.html` in browser
- Compile: `node compile.js`
