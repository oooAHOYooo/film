# Align Scene Numbering with Filenames

Currently, there is a numbering mismatch where files `s08b.md` and `s08c.md` are internally labeled as "Scene 9B" and "Scene 9C", and the storyboard has a +1 shift starting from `s07b.md` (labeled as Scene 8). This plan aligns all internal labels and the storyboard with the `sXX` filename convention to ensure consistency across the script system.

## Proposed Changes

### Script Scenes
Align internal headers and metadata comments with the filename "8" series.

#### [MODIFY] [s08b.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s08b.md)
- Change `<!-- scene: 09b ... -->` to `<!-- scene: 08b ... -->`
- Change `# SCENE 9B: THE RESEARCH BEAT` to `# SCENE 8B: THE RESEARCH BEAT`

#### [MODIFY] [s08c.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s08c.md)
- Change `<!-- scene: 09c ... -->` to `<!-- scene: 08c ... -->`
- Change `# SCENE 9C: THE THRESHOLD` to `# SCENE 8C: THE THRESHOLD`

#### [MODIFY] [s08d.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s08d.md)
- Change `<!-- scene: 09d ... -->` to `<!-- scene: 08d ... -->`

---

### Storyboard System
Align storyboard headers with filenames to eliminate the numbering shift.

#### [MODIFY] [full_storyboard.md](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/full_storyboard.md)
- Scene 8 (s07b) -> Scene 7B
- Scene 9 (s08) -> Scene 8
- Scene 9B (s08b) -> Scene 8B
- Scene 9C (s08c) -> Scene 8C
- Scene 9D (s08d) -> Scene 8D
- Scene 10 (s09) -> Scene 9
- Scene 11 (s10) -> Scene 10
- Scene 12 (s11) -> Scene 11
- Scene 13 (s12) -> Scene 12
- Ensure all subsequent scenes match their `sXX` filenames.

---

### Compilation System
Update the master script to reflect the new numbering.

#### [MODIFY] [full_script.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/full_script.md)
- Update all headers and comments for the affected scenes to match the new "8" series numbering.

## Verification Plan

### Automated Tests
- Run `node compile.js` in `pages/summer/script-system/` to ensure the script builds correctly and check the output for consistent numbering.

### Manual Verification
- Verify that `full_script.md` and `full_storyboard.md` have consistent scene numbers matching the `sXX.md` filenames.
