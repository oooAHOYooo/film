# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Creatures in the Tall Grass** is a multi-part film production repository with a "found-footage research" narrative structure. The project includes:
- Four seasonal film scripts (Spring, Summer, Autumn, Winter)
- Multi-narrative novels (Black, Cyan, Magenta, Yellow)
- Production documentation, storyboards, and supplementary projects
- A comprehensive markdown→HTML compilation and publishing system

The repository is organized around markdown source files that are compiled into HTML outputs for viewing and distribution. All seasonal scripts are treated as modular systems with independent compilation pipelines.

## Common Commands

### Compile All Seasonal Scripts

```bash
npm run compile:all
```

Compiles all seasonal script systems (Spring, Summer, Autumn, Winter, Nibbler) plus Summer-specific systems (storyboard, production, bible, character sheets, directors notes, inspiration gallery). This is the primary build command.

### Compile Individual Seasons

Each season has its own compilation script in `pages/{season}/script-system/`:

```bash
node pages/spring/script-system/compile.js
node pages/summer/script-system/compile.js
node pages/autumn/script-system/compile.js
node pages/winter/script-system/compile.js
node pages/nibbler/script-system/compile.js
```

### Summer Treatment Publishing

The Summer season uses a special treatment publication workflow:

```bash
cd pages/summer
./update-treat <version-tag>        # Publish with git commit & push
./update-treat <version-tag> --no-git    # Skip git operations
./update-treat <version-tag> --no-push   # Commit but don't push
```

This workflow:
1. Archives the current treatment version
2. Updates version metadata in `treatment.md`
3. Parses treatment into ACT structure
4. Updates `storybook.html` with the new version
5. Commits and pushes to git

The version tag follows the format: `cred16G`, `cred17_4a`, etc.

### Generate Inspiration Manifests

```bash
npm run generate
```

Generates manifest files for the inspiration/concept art system.

## Architecture & File Structure

### Core Seasonal Script System

Each season (Spring, Summer, Autumn, Winter) follows this structure:

```
pages/{season}/
├── script-system/
│   ├── scenes/              # Individual scene files (s01.md, s02.md, etc.)
│   ├── manifest.json        # Lists scenes and metadata
│   ├── compile.js           # Compilation script
│   ├── full_script.md       # Generated: concatenated markdown
│   ├── full_script.html     # Generated: formatted HTML output
│   └── plot-cards-data.json # Generated: scene summaries for plot cards
└── {other subsystems}
```

**How it works:**
- `manifest.json` defines the scene order and metadata
- `compile.js` reads each scene from `scenes/` directory
- Scenes are concatenated into `full_script.md` (with proper formatting)
- An HTML template converts the markdown to `full_script.html`
- Plot card summaries are extracted from inline HTML comments: `<!-- summary: ... -->`

### Summer Production Systems

The Summer season has additional subsystems beyond the base script system:

- **Storyboard System** (`pages/summer/storyboard-system/`): Maps script scenes to visual storyboard frames with frame data
- **Production Bible** (`pages/summer/bible-system/`): Technical and lore documentation organized by sections
- **Character Sheets** (`pages/summer/characters/`): Character metadata and actor information
- **Director's Notes** (`pages/summer/directors-notes/`): Thematic and directional notes per scene
- **Inspiration Gallery** (`pages/summer/inspiration/`): Concept art and visual reference collection
- **Production Hub** (`pages/summer/compile-production.js`): Generates production metadata dashboard

Each subsystem has its own `compile.js` script following the same pattern: read source data, generate markdown, output HTML.

### Treatment Publishing System

The treatment workflow is specific to Summer and uses a version control system:

```
pages/summer/
├── treatment.md                    # Current working treatment (EDIT THIS)
├── storybook.html                  # Generated: interactive HTML viewer
├── update-treat.js                 # Publishing script
├── treatment-versions/             # Version archive
│   ├── treatment-v1.1-*.md
│   ├── treatment-v1.0-*.md
│   └── notes/                      # Changelog per version
└── PUBLISHING.md                   # Full treatment publishing docs
```

**Workflow:**
1. Edit `pages/summer/treatment.md` directly
2. Run `./update-treat <version>` from `pages/summer/`
3. Script automatically archives old version, updates metadata, parses ACT structure, generates HTML
4. `storybook.html` becomes the canonical published view with version history

### Data Directory

```
data/
├── summer/
│   ├── treatment-versions/   # Version archives (mirrored from pages/summer/)
│   ├── docs/                 # Documentation and guides
│   ├── scripts/              # Utility scripts
│   ├── original-treatment.md # Archive of original treatment
│   └── README.md
├── spring.json, autumn.json, winter.json  # Seasonal metadata
└── everything-else.json      # Miscellaneous data
```

Data files (`.json`) are typically generated by compilation scripts or used as configuration for specific subsystems.

### Novel System

Each novel (Black, Cyan, Magenta, Yellow) has:

```
novels/{color}/
├── chapters/              # Individual chapter markdown files
├── compile.js             # Generates combined manuscript
├── manifest.json          # Chapter order and metadata
└── {generated outputs}
```

## Key Architectural Patterns

### Manifest-Driven Compilation

All compile scripts follow this pattern:
1. Load `manifest.json` (which lists files and order)
2. Read source files from a `scenes/` or `chapters/` directory
3. Parse metadata, extract summaries (from front matter or HTML comments)
4. Generate markdown output
5. Produce HTML output using an embedded or separate HTML template

This allows scene/chapter organization to be declarative and reorderable.

### Versioning Strategy

- **Treatments** use semantic versioning (`v1.0`, `v1.1`, etc.) with credential tags (`cred16G`)
- **Scenes** are immutable files; versioning is managed at the treatment/manifest level
- **Archives** are created automatically before updates; old versions remain accessible

### Git Integration

- Treatment updates commit automatically: `Update treatment to cred16G`
- Storyboard and frame updates are typically committed separately
- Use `--no-git` flag to skip git operations when working offline

## Development Tips

### Adding a Scene

1. Create `pages/{season}/script-system/scenes/sXX.md`
2. Update `pages/{season}/script-system/manifest.json` to include it in the scenes list
3. Run the compile script for that season
4. Verify in `full_script.html`

### Adding a Treatment Version

Edit `pages/summer/treatment.md` and run:
```bash
cd pages/summer
./update-treat <new_version_tag>
```

This handles all archiving, git operations, and HTML generation.

### Extracting Scene Summaries

In scene files, use inline HTML comments for plot card summaries:
```markdown
<!-- summary: Brief one-line description of the scene's plot beat -->

## Scene Content Here
```

If no summary comment is present, the compile script will attempt to derive one from the first heading/paragraph.

### Testing Compilation Output

After running a compile script, check:
1. `full_script.md` for correct concatenation and ordering
2. `full_script.html` in a browser for formatting and rendering
3. `manifest.json` for accuracy if structure changed

## Common Workflows

### Publish a Treatment Update

```bash
cd pages/summer
# 1. Edit treatment.md as needed
# 2. Publish and commit
./update-treat cred17_5
# 3. Verify storybook.html in browser
```

### Update Script Scenes

```bash
# 1. Edit scene files in pages/summer/script-system/scenes/
# 2. Compile
node pages/summer/script-system/compile.js
# 3. Verify full_script.html
# 4. Commit: git add . && git commit -m "Update scenes sXX through sYY"
```

### Full Rebuild

```bash
npm run compile:all
```

This rebuilds all scripts, subsystems, and data files. Check for errors in the output.

## File Editing Guidelines

- **Treatment files**: Use `treatment.md` as the single source of truth; don't edit archives or versions manually
- **Scene files**: Keep them modular and self-contained; don't depend on other scenes
- **Manifests**: Keep JSON valid; maintain consistent scene ordering
- **HTML outputs**: Don't edit generated HTML directly; regenerate from source instead

## Troubleshooting

**Compilation fails:**
- Check manifest.json for syntax errors and file path accuracy
- Verify referenced scene files exist
- Ensure scene markdown structure matches compiler expectations

**Storybook doesn't show latest version:**
- Hard refresh browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- Verify `update-treat` script completed without errors
- Check that storybook.html was actually updated (look at file timestamp)

**Git operations fail during treatment publish:**
- Use `--no-git` flag if not in a proper git repository
- Check git remote is properly configured
- Ensure you have write permissions to the branch

**Scene not appearing in compiled script:**
- Verify the scene filename matches exactly in manifest.json
- Check manifest.json JSON syntax
- Ensure scene file is in the correct `scenes/` directory
- Re-run the compile script

## References

- **Treatment Publishing**: See `data/summer/docs/PUBLISHING.md` and `data/summer/docs/README-PIPELINE.md`
- **Version Control**: See `data/summer/docs/VERSION_CONTROL.md`
- **Project Overview**: See `README.md` in repo root
