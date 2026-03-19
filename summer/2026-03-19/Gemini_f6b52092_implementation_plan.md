# Goal Description
Update the storyboard generation process to support `S08` frames. This involves modifying `compile.js` to recognize internal PNG formats for `S08` frames and extracting metadata from the newly formatted `S08 - SL.md` to map captions properly.

## Proposed Changes

### compile.js
#### [MODIFY] `compile.js`
- **File Filter Update**: Modify the existing file filter logic (`f.includes('shot-generator.png') || f.includes('posterframe.jpg')`) to also accept `f.match(/board-\d+\.png/)` to support the newer `s08-board-00002.png` name style.
- **Support S08 Markdown Format**: Update the markdown parsing loop to recognize headers like `### Shot 1 - WIDE TRACKING` and extract the matching `Size:`, `Action:`, and `Caption:` items below them.
- **Intelligent Shot Mapping**: S08 has specific boarding numbers (e.g. `s08-board-00005.png` should map to Shot 5). I'll enhance the caption assignment logic to first attempt matching the shot ID with the exact board number from the filename. If it does not match dynamically, it will fall back to using sequential indices (which correctly works for S23's `A-1`, `A-2` formatting).

## Verification Plan

### Automated Tests
1. **Run Generation**: Run `node compile.js` from `pages/summer/storyboard-system`.
2. **Verify Output**: View `frames-data.json` and ensure there is an `"s08"` key populated correctly with its captions and image links.

### Manual Verification
- Once generated successfully, we will test the storyboard page in the frontend to ensure the "Visual Board" button correctly appears and renders S08 shots.
