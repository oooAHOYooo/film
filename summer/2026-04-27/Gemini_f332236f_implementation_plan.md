# Implementation Plan - Hub Update & Global Navigation

Synchronize the Storyboard Hub and Script Manifest with latest assets, and propagate the "Quick Links" navigation pattern to all major hubs.

## User Review Required

> [!IMPORTANT]
> This involves running several compilation scripts (`node compile.js`, `node compile-pdfs.js`) to synchronize manifests and PDF data.

## Proposed Changes

### [Compilation & Sync]
- **Script System**: Run `node compile.js` to sync `manifest.json` with the latest `.md` scene files.
- **Storyboard System**:
  - Run `node compile.js` to sync storyboard `manifest.json` with the script manifest.
  - Run `node compile-pdfs.js` to merge latest PDFs and update `pdfs-data.json`.

### [Global Navigation]

#### [MODIFY] [full_script.html](file:///c:/Users/agonzalez7/film/pages/summer/script-system/full_script.html)
- Replace individual links in `nav-left` with the "Quick Links" dropdown.
- Add JS toggle logic.

#### [MODIFY] [storyboard.css](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/storyboard.css)
- Add dropdown menu and link styles.

#### [MODIFY] [index.html](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/index.html)
- Update `nav-left` to include the "Quick Links" dropdown.
- Add JS toggle logic.

#### [MODIFY] [production.html](file:///c:/Users/agonzalez7/film/pages/summer/production.html)
- Add a top `<nav>` bar inside the header area.
- Add CSS for the navigation bar and dropdown menu.
- Add JS toggle logic.

## Verification Plan

### Automated Steps
- Run compilation commands and check for "✓" or "Successfully" in output.

### Manual Verification
- Verify "Quick Links" dropdown functions correctly on:
  - `script-system/index.html` (already done)
  - `script-system/full_script.html`
  - `storyboard-system/index.html`
  - `production.html`
- Check Storyboard Hub for updated PDF links.
