# Shooting Script Version
## Creatures in the Tall Grass — Summer

This folder contains a **complete parallel script system** for the shooting script version, where Dallas is driven by audio signals and curiosity rather than by a pet-sitting favor.

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
- Dallas is compelled by audio signals and his wife's unfinished research; his curiosity drives him deeper; he's more active/culpable
- No dog: the pet-sitting thread is gone; Dallas's agency and the audio-signal pursuit are his primary motivation
- Relationships shift (less about pet-sitting, more about research collaboration)

**Family structure:**
- Makayla has been cut from the film entirely
- Dominic (early 40s) and Asher (14) are brothers — much older / much younger, possibly not blood; a patched-together, taken-in family
- Mr. Mike (mid 70s) is "Uncle Mike" — the older figure they care for; "uncle" because he took people in and stayed, not necessarily blood
- Dominic had a wife and child once; they are gone. Blood matters less than who stayed.
- The standalone aunt character has been removed; her beats fold into Dominic

**Affected scenes:**
- s03, s04, s06, s07, s07b, s08d, s11, s13, s14, s14c, s15b, s16, s17b, s17c, s18, s19, s26, s28

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
