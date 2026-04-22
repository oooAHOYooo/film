# Walkthrough: Summer Scene Pipeline Update

I have successfully integrated the new scenes (`s14b`, `s14c`, `s15a`, `s15b`, `s15c`) into the Summer project pipeline. The scripts and manifests have been updated, and a full compilation has been verified.

## Changes Made

### 1. Script System Updates
- **Manifest**: Added `s14c`, `s15a`, `s15c` and updated `s15` to `s15b`.
- **Scene Files**: Fixed the header and scene ID in `s15c.md` which previously pointed to `s15b`.
- **Compilation**: Verified that the Summer Script System now correctly compiles 33 scenes (up from 30).

### 2. Storyboard System Updates
- **Manifest**: Added placeholder entries for all new scenes so they "manifest" in the hub and galleries as pending scenes.
- **Linking**: Updated `s15-sl` to link to the new `the-tracking-box` script ID.

### 3. Bible System Updates
- **Manifest**: Added Practical Effects (PE) placeholders for the new scenes (`PE 14B`, `PE 14C`, `PE 15A`, `PE 15C`) and updated `PE 15B`.

## Verification Results

### Compilation Success
I ran the root `compile-all.js` script, which triggered all sub-compilers. All tasks completed successfully.

```powershell
=== Summer Script System ===
Running: node pages\summer\script-system\compile.js
Loading manifest...
Found 33 scenes in manifest
Compiling scenes...
Writing full_script.md...
✓ Created ...\full_script.md
Generating full_script.html...
✓ Created ...\full_script.html
...
✓ Compilation complete!
```

### Order Check
The scenes are now in the correct narrative order in `full_script.md`:
`... -> Scene 14 (s14) -> Scene 14B (s14b) -> Scene 14C (s14c) -> Scene 15 (s15a) -> Scene 16 (s15b) -> Scene 17 (s15c) -> Scene 18 (s16) -> ...`

> [!NOTE]
> Since new scenes were inserted, the absolute scene numbers for later scenes have shifted forward. This is expected and reflected in the updated `full_script.html` and `index.html` galleries.

## Next Steps

- **Practical Effects Docs**: You can now create the actual markdown files for the new practical effects in `pages/summer/bible-system/practical-effects/` if needed.
- **Storyboards**: The storyboard frames can be added to `pages/summer/storyboard-system/scenes/` using the IDs provided in the manifest.
