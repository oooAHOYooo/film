# Creatures in the Tall Grass Script

A local screenplay system that allows you to write scenes in Markdown and automatically generates a gallery view, individual scene pages, and a compiled full script.

## Structure

```
script-system/
├── scenes/              # Individual scene markdown files
├── manifest.json        # Master order of scenes (edit this to reorder)
├── index.html          # Gallery view (plot cards — main beats per scene)
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

- Open `index.html` in a browser to see the gallery (plot cards)
- Click any scene to view it individually
- The scene viewer uses Marked.js (CDN) to render markdown

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

### Action breaks

When the formatter might treat the next line as dialogue (e.g. right after a speaker), you can force an **action break** so the next paragraph is treated as action:

On its own line, write:

```markdown
(action)
```

The formatter ends the current dialogue block at that point. The `(action)` line itself is not shown in the formatted script. Use this whenever you want to be sure a line is rendered as full-width action, not dialogue—for example before character intros or stage direction:

```markdown
DOMINIC
Yep.

(action)

Janice leaves the line of food.

JANICE
Hey Patty - How's Pete?
```

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
