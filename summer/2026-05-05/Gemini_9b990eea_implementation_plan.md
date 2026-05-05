# Implementation Plan - Fix Scene Gallery Compilation

The current scene gallery compilation logic in `compile.js` fails to correctly handle scenes with alphanumeric suffixes (like 7B, 14C, etc.). This leads to misaligned scene summaries and incorrect navigation in the gallery and full script pages. Additionally, the automatic summary derivation is picking up metadata lines.

## Proposed Changes

### [compile.js](file:///c:/Users/agonzalez7/film/pages/summer/script-system/compile.js)

#### [MODIFY] [compile.js](file:///c:/Users/agonzalez7/film/pages/summer/script-system/compile.js)
- Update `extractSceneBlocksFromFullScript` regex to match alphanumeric scene numbers: `### Scene \d+[A-Z]*:`.
- Update `generateHTMLPage` embedded script's `sceneHeadingRe` to match alphanumeric scene numbers.
- Improve `deriveSummary` to skip metadata lines (starting with `*`) and horizontal rules.
- Ensure `extractSceneBlocksFromFullScript` correctly handles the split when multiple scenes are present in a segment due to missing headers (though fixing the regex should solve this).

## Verification Plan

### Automated Tests
- Run `node compile.js` and verify the output:
    - Check `plot-cards-data.json` to ensure summaries are correctly associated with their scenes.
    - Check `index.html` to ensure the gallery displays the correct number of cards (39) and correct summaries.
    - Check `full_script.html` to ensure "Jump to scene" dropdown includes all scenes and navigation works.

### Manual Verification
- Open `index.html` in the browser and visually verify that Scene 14C, 21B, etc., have correct summaries and aren't lumped with others.
- Verify that the "Full Script" links in the gallery point to the correct sections.
