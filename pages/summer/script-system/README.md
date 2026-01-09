# Creatures in the Tall Grass Script

A local screenplay system that allows you to write scenes in Markdown and automatically generates a gallery view, individual scene pages, and a compiled full script.

## Structure

```
script-system/
├── scenes/              # Individual scene markdown files
├── manifest.json        # Master order of scenes (edit this to reorder)
├── index.html          # Gallery view (lists all scenes)
├── scene.html          # Individual scene viewer
├── full_script.html    # Compiled full script (generated)
├── full_script.md      # Compiled markdown (generated)
├── script.css          # Screenplay formatting styles
├── compile.js          # Compiler script
└── README.md           # This file
```

## Quick Start

### 1. Add a New Scene

1. Create a new `.md` file in the `scenes/` folder (e.g., `discovery.md`)
2. Write your scene in standard screenplay format:
   - Scene headings: `INT. LOCATION - TIME`
   - Character names: `CHARACTER NAME` (in caps)
   - Dialogue: Indented under character name
   - Action: Regular paragraphs

3. Add it to `manifest.json`:
```json
{
  "id": "discovery",
  "file": "discovery.md",
  "title": "The Discovery"
}
```

### 2. Reorder Scenes

Simply edit `manifest.json` and move the scene objects to your desired order. The system will automatically number them 1, 2, 3... based on position.

### 3. View Scenes

- Open `index.html` in a browser to see the gallery
- Click any scene to view it individually
- The scene viewer uses Marked.js (CDN) to render markdown

### 3b. Edit Scenes (Zen Browser Editor)

This repo includes a tiny local server that lets the browser **save edits back to your `.md` files**.

From the project root:

```bash
npm run editor
```

Then open `http://127.0.0.1:41731/editor.html`

### 3c. Publish (git commit + push) from the Editor (optional)

For safety, git actions are **disabled by default**. To enable the editor’s **Publish** button:

```bash
FILM_EDITOR_ENABLE_GIT=1 npm run editor
```

Notes:
- Publish runs `git add/commit/push` **non-interactively** (won’t hang on auth prompts).
- If `git push` fails, run `git push` once in a normal terminal to authenticate/set upstream, then retry in the editor.

### 4. Compile Full Script

Run the compiler to generate `full_script.md` and `full_script.html`:

```bash
node compile.js
```

Or from the project root:
```bash
node pages/summer/script-system/compile.js
```

The compiled script will include all scenes in the order specified in `manifest.json`.

## Screenplay Formatting

The CSS automatically formats:
- **Scene Headings**: Uppercase, bold
- **Character Names**: Uppercase, bold, 2.0in left margin
- **Dialogue**: 1.0in left margin, 1.5in right margin
- **Action**: Full width, standard margins

## Features

- **Order-Agnostic**: Scenes are numbered by position in manifest, not filename
- **Easy Insertion**: Add scenes anywhere by editing manifest.json
- **Print-Ready**: Full script HTML is optimized for "Print to PDF"
- **Typewriter Font**: Uses Courier Prime for authentic screenplay look
- **No Build Step**: Pure HTML/JS/CSS - just open in browser

## Example Scene Format

```markdown
INT. DALLAS' HOUSE - DAY

Dallas enters the room. He looks around.

DALLAS
(to himself)
This is it.

He sets down his bag and begins to unpack.
```

## Tips

- Use descriptive scene IDs (e.g., `marsh-rescue` not `scene-05`)
- Keep scene files focused on single scenes or sequences
- The manifest is the source of truth for scene order
- Scene numbers are auto-generated, so you can reorder anytime
