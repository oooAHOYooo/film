# Walkthrough — Scene Manifest & Numbering Updates

I have updated the Summer project's compilation systems to correctly handle new scenes and fix the numbering discrepancy you noticed.

## Changes Made

### 1. Script System
- **Alphanumeric Numbering**: Updated `compile.js` to derive scene numbers from filenames. 
    - `s07b.md` is now **Scene 7B**.
    - `s08.md` is now **Scene 8** (aligning with your expectation).
- **Navigation Fix**: The "Jump to scene" dropdown now correctly displays these alphanumeric numbers.
- **Plot Cards**: Added `displayNum` to the plot cards data for better gallery display.

### 2. Storyboard System
- **Manifest Generator**: Updated the storyboard compiler to recognize alphanumeric scene IDs.
- **New Scene Files**: Created storyboard outline files for `S07B`, `S08B`, `S08C`, and `S08D` so they appear in the gallery and compiled PDF.

### 3. Production Bible
- **Manifest Update**: Added new "Practical Effects" entries for the tension-building scenes.
- **New Entries**: Created placeholder files for `PE 7B`, `PE 8B`, `PE 8C`, and `PE 8D`.

## Verification Results

### Compiled Script
I ran the full compilation and verified that the headings now align:
- `### Scene 8: The Trailcam`
- `### Scene 8B: The Research Beat`
- `### Scene 8C: The Threshold`
- `### Scene 8D: The Return`

### Comment Injection Logic
I've also improved the `injectSceneComments` function in `compile.js`. It now automatically removes any existing scene-tracking comments from the source files before injecting the new ones. This ensures that the compiled script doesn't end up with duplicate or conflicting headers (e.g., no more `09D` comments left over from previous versions).

### Storyboard & Bible
The new scenes now appear in the storyboard manifest and the production bible gallery.

```bash
node compile-all.js
✓ Summer Script System complete
✓ Summer Storyboard complete
✓ Summer Production Bible complete
```
