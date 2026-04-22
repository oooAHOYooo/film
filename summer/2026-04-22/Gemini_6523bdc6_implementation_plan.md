# Updating Scene Pipeline for New Summer Scenes

The user has added several new scenes to the Summer project: `s14b`, `s14c`, `s15a`, `s15b` (formerly `s15`), and `s15c`. These need to be integrated into all manifest files and compilation scripts to ensure they appear in the full script, gallery, and other system views.

## User Review Required

> [!IMPORTANT]
> - I will rename internal IDs from `s15` to `s15b` where appropriate.
> - I will adjust the order of scenes in all manifests to: `14 -> 14b -> 14c -> 15a -> 15b -> 15c -> 16`.
> - I will check and update `PLOT_POINT_BY_FILE` in `script-system/compile.js` if these new scenes are critical plot points.
> - In `s15c.md`, the header incorrectly identifies as `15b`/`s15b.md`. I will correct this to `15c`/`s15c.md`.

## Proposed Changes

### [Script System](file:///c:/Users/agonzalez7/film/pages/summer/script-system/)

#### [MODIFY] [manifest.json](file:///c:/Users/agonzalez7/film/pages/summer/script-system/manifest.json)
- Add `s14c`, `s15a`, `s15c`.
- Update `s15` to `s15b`.
- Use correct titles and nicknames from scene files.

#### [MODIFY] [compile.js](file:///c:/Users/agonzalez7/film/pages/summer/script-system/compile.js)
- Update `PLOT_POINT_BY_FILE` if necessary (e.g. if `s15a` or `s14c` are major beats).

#### [MODIFY] [s15c.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s15c.md)
- Fix header to refer to `15c` instead of `15b`.

### [Storyboard System](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/)

#### [MODIFY] [manifest.json](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/manifest.json)
- Sync scene structure with the script manifest.
- Add placeholders for new scenes if they don't have storyboard files yet (matching existing patterns).

### [Bible System](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/)

#### [MODIFY] [manifest.json](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/manifest.json)
- Update Practical Effects (PE) entries to match new scene numbering/ordering.

### [Compilation Runner](file:///c:/Users/agonzalez7/film/)

#### [MODIFY] [compile-all.js](file:///c:/Users/agonzalez7/film/compile-all.js)
- Ensure all relevant compile scripts are called (it already seems to call them, but I'll double check for any hardcoded logic).

## Open Questions

- Should I create empty "Practical Effects" markdown files for the new scenes in `bible-system/practical-effects/`? Or just update the manifest?
- Are there any specific plot point numbers I should assign to the new scenes in `script-system/compile.js`?

## Verification Plan

### Automated Tests
- Run `node compile-all.js` and verify all tasks complete successfully.
- Check generated `full_script.html` and `index.html` (Gallery) for the script system to ensure new scenes are present and in order.

### Manual Verification
- View the generated `full_script.html` to confirm scene numbering and titles are correct.
- Verify `manifest.json` files are valid JSON.
