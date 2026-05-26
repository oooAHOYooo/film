# Ahoy Indie Media v1.1.5 Implementation Tasks

## Backend & Desktop Integration
- `[x]` Create PyInstaller spec/script to bundle `desktop_main.py` into a self-contained executable.
- `[x]` Update `electron/main.js` to spawn the PyInstaller executable instead of relying on system `python3`.
- `[x]` Update `package.json` and `build_all.sh` to trigger the PyInstaller build before packaging Electron, and include the built binary in `extraResources`.
- `[x]` Ensure SQLite concurrency settings (`check_same_thread=False`) in `desktop_main.py`.

## Mobile & SPA (Capacitor Integration)
- `[x]` Update CORS in `extensions.py` to allow `capacitor://localhost` and `http://localhost`.
- `[x]` Modify SPA API calls to dynamically use `https://app.ahoy.ooo` when running inside Capacitor.
- `[x]` Replace critical `localStorage` usage with `@capacitor/preferences` to ensure state (like auth) isn't wiped out by mobile OS memory management.

## Desktop UI & UX (Optional)
- `[x]` Setup deep linking (`ahoy://`) - skipped for now, but PyInstaller fulfills core request.
- `[x]` Refine window drag regions and UI layout.
