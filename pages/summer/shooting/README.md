# Shooting Script Version
## Creatures in the Tall Grass — Summer

This folder contains a **complete parallel script system** for the shooting script version, where Dallas is driven by audio signals and curiosity rather than being asked to watch Howie (the dog).

### Folder Structure

```
shooting/
├── script-system/                 (Complete mirror of ../script-system/)
│   ├── scenes/                    (All .md files - edit these!)
│   │   ├── s01.md, s02.md, ... s28.md
│   ├── manifest.json              (Scene order & metadata)
│   └── compile.js                 (Build full script from scenes)
│
├── shooting_production.html       (Production dashboard)
└── README.md                      (This file)
```

### Key Changes from Original

**Core narrative shift:**
- **Original**: Dallas is asked to watch Howie (dog); dog ties him to Dominic's family; dog's reactions signal danger
- **Shooting**: Dallas is compelled by audio signals and his wife's unfinished research; his curiosity drives him deeper; he's more active/culpable

**Affected scenes** (16 total):
- s03, s04, s07, s08, s08b, s08d, s09, s10, s11, s13, s14, s14c, s16, s18, s19, s28

In each:
- Howie mentions removed
- Dallas's agency increased
- Audio signal pursuit becomes his primary motivation
- Relationships shift (less about pet-sitting, more about research collaboration)

### How to Use This Folder

1. **Edit scenes** — Modify `.md` files in `script-system/scenes/` directly
2. **Compile locally** — Run `node script-system/compile.js` to generate `script-system/full_script.md`
3. **View compiled output** — Open `script-system/full_script.html` in browser
4. **Reference production** — Use `shooting_production.html` to check schedule/cast/logistics
5. **Preserve originals** — Everything in `../script-system/` and `../production.html` stays untouched

### Workflow

```bash
cd pages/summer/shooting

# Edit scene files as needed (script-system/scenes/*.md)

# Compile the script
node script-system/compile.js

# Open in browser
open script-system/full_script.html
```

### Next Steps

- Modify scenes in `script-system/scenes/` as needed
- Once happy with changes, copy back to `../script-system/scenes/` to commit
- Run `npm run compile:all` from repo root to finalize

---

**Status:** Work in progress. Original script-system and production.html preserved for reference.
