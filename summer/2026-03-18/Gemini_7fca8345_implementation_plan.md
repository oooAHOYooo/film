# Implementation Plan: Dynamic Scene Storyboards

## Goal
To update the `storyboard.html` page so it can render a specific scene's storyboard based on a folder name (e.g., `s23` = Scene 23), populated with the corresponding AI-generated images from `storyboard-system/frames/s23/`, and add a link to this in the Summer Hub.

## Proposed Changes

### 1. Build Script for Frames Data
- **[NEW]** `c:\Users\agonzalez7\film\pages\summer\storyboard-system\build-frames.js`
  - A Node.js script that scans the `frames/` directory for scene folders (e.g., `s23`).
  - For each folder, it collects the image files (preferring `shot-generator.png` or `posterframe.jpg`), sorting them by board number (`board-1`, `board-2`, etc.).
  - It attempts to parse the corresponding scene markdown (e.g., `S23 - SL.md`) to extract shot sizes and captions.
  - Outputs a compiled `frames-data.json` containing all the sorted image paths and captions grouped by folder so the browser can easily consume it.

### 2. Update Storyboard Template
- **[MODIFY]** `c:\Users\agonzalez7\film\pages\summer\storyboard.html`
  - Modify the existing JavaScript logic to check for a URL parameter `?folder=...` (e.g., `?folder=s23`).
  - If `folder` is present, it fetches `storyboard-system/frames-data.json`, extracts the panels for that scene, and renders them in the existing 3x3 print-friendly grid template.
  - If `folder` is absent, it falls back to the current behavior (rendering the full film overview storyboard).
  - Update the page title and header dynamically (e.g., "Scene 23 Storyboard").

### 3. Update Summer Hub
- **[MODIFY]** `c:\Users\agonzalez7\film\pages\summer.html`
  - Add a dedicated link to the Scene 23 Storyboard (`/pages/summer/storyboard.html?folder=s23`) inside the Bento section, or modify the "Storyboards" bento item to link to a dropdown/sub-menu of available frames.
  - Since the user explicitly asked to "add it to the summer hub", we will add an entry specifically for "Scene 23 Storyboard (Frames)" or similar.

## Verification Plan

### Automated Tests
- Run `node build-frames.js` in the terminal to verify it successfully generates `frames-data.json` without errors and maps the `s23` images correctly.

### Manual Verification
1. Open `summer.html` in the browser.
2. Verify the new link for the Scene 23 Storyboard appears.
3. Click the link to navigate to `storyboard.html?folder=s23`.
4. Visually confirm that the storyboard template is populated with the images from `frames/s23/` and that the captions/headers correctly identify it as Scene 23.
