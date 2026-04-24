# Update Scene Manifests and Numbering Logic

The user has noted that new scenes `s08b` and `s08c` are missing from some manifests and the "jump to scene" navigation. Additionally, there is a numbering mismatch where Scene 9 is being called "The Trailcam" but it should be Scene 8 (matching `s08.md`).

## User Review Required

> [!IMPORTANT]
> I will be changing the scene numbering logic in the Script System to use alphanumeric IDs based on filenames (e.g., `s07b` becomes Scene 7B). This will shift the numbering of subsequent scenes back by one, so `s08` becomes Scene 8, aligning with the user's request.

## Proposed Changes

### Script System

#### [MODIFY] [manifest.json](file:///c:/Users/agonzalez7/film/pages/summer/script-system/manifest.json)
- Ensure all scenes (`s07b`, `s08b`, `s08c`, `s08d`) have correct titles and IDs.

#### [MODIFY] [compile.js](file:///c:/Users/agonzalez7/film/pages/summer/script-system/compile.js)
- Update `compileMarkdown` and `generateHTMLPage` to use alphanumeric scene numbering derived from filenames instead of a simple incrementing index.

### Storyboard System

#### [MODIFY] [compile.js](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/compile.js)
- Update the manifest generator regex to support alphanumeric scene IDs (e.g., `s08b`).
- Ensure it picks up scenes with suffixes.

#### [NEW] [S08B - SL.md](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/scenes/S08B%20-%20SL.md)
#### [NEW] [S08C - SL.md](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/scenes/S08C%20-%20SL.md)
#### [NEW] [S08D - SL.md](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/scenes/S08D%20-%20SL.md)
- Create basic storyboard outline files for the new scenes to ensure they appear in the gallery.

### Bible System

#### [MODIFY] [manifest.json](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/manifest.json)
- Add entries for `pr08b`, `pr08c`, and `pr08d` under "Practical Effects".

#### [NEW] [pr08b.md](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/content/practical-effects/pr08b.md)
#### [NEW] [pr08c.md](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/content/practical-effects/pr08c.md)
#### [NEW] [pr08d.md](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/content/practical-effects/pr08d.md)
- Create placeholder files for the new practical effects entries.

## Verification Plan

### Automated Tests
- Run `node compile-all.js` and verify that the output files are generated without errors.
- Check `pages/summer/script-system/full_script.html` for the correct scene numbers in the "Jump to scene" dropdown.
- Check `pages/summer/storyboard-system/index.html` and `pages/summer/bible-system/index.html` to ensure the new scenes/entries are visible.

### Manual Verification
- Verify that "The Trailcam" is labeled as Scene 8 in the compiled script.
- Verify that `s08b`, `s08c`, and `s08d` appear in the script navigation.
