# Ahoy Indie Media v1.1.5 — Holistic Examination & Improvement Plan

This document outlines a holistic review of the Ahoy Indie Media platform (Frontend, Backend, and App Shells) with specific recommendations to ensure a smooth, premium experience across Linux, Windows, Mac (Desktop), Android, and iOS (Mobile/TestFlight) for the upcoming v1.1.5 release.

## User Review Required

> [!IMPORTANT]
> Please review these recommendations. Some of these changes involve architectural shifts (like how Python is packaged for Desktop) and changes to how the Frontend communicates with the API on Mobile. Let me know which of these you would like to prioritize for v1.1.5.

## Open Questions

1. **Desktop Python Environment**: Currently, `desktop_main.py` relies on the host machine having `python3` installed. Do you want to bundle the Python environment using PyInstaller so users don't need Python pre-installed, or do you prefer the current fallback to the remote `app.ahoy.ooo` if local server fails?
2. **Mobile Backend**: Should the iOS/Android apps *always* connect to the remote production server (`https://app.ahoy.ooo`), or do you intend for them to run a local server (which is generally not feasible on mobile)?
3. **Desktop UI**: Would you like to implement a custom frameless window (custom minimize/maximize/close buttons) for the Electron app to make it feel more like a native, premium media player (like Spotify or Apple Music)?

---

## Proposed Changes

### 1. Frontend (Vue 3 SPA & Capacitor)

#### [MODIFY] `spa/src/main.js` & API utilities
- **Dynamic API Base URL**: Mobile apps built with Capacitor run on `http://localhost` or `capacitor://localhost`. Relative API calls (e.g., `fetch('/api/...')`) will fail because the backend isn't running on the phone. We need to intercept or configure all API calls to point to `https://app.ahoy.ooo` when running natively.
- **Capacitor Storage**: Standard `localStorage` can be cleared by iOS/Android to save space. We should integrate `@capacitor/preferences` for critical state (like auth tokens) to ensure users don't get randomly logged out.

#### [MODIFY] `spa/src/App.vue` & CSS
- **Safe Area Insets**: Ensure the UI respects mobile safe areas (notches, home indicators) by utilizing `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)` in the Tailwind CSS configuration.
- **Desktop Window Dragging**: Add `-webkit-app-region: drag` to the top navigation bar so users can drag the Electron window easily, making it feel like a native desktop app.

---

### 2. Desktop Shell (Electron)

#### [MODIFY] `electron/main.js`
- **Deep Linking**: Register a custom protocol (`ahoy://`) so that links from browsers or emails can open directly in the Desktop app.
- **Improved Window Styling**: Change `titleBarStyle` from `default` to `hidden` or `hiddenInset` (on macOS) to seamlessly integrate the UI into the window frame without the default OS title bar.

#### [MODIFY] `package.json` & `build_all.sh`
- **PyInstaller Bundling (Optional but Recommended)**: Integrate a build step to compile `desktop_main.py` into a standalone binary using PyInstaller. Electron can then spawn this binary instead of invoking `python3`, ensuring it works out-of-the-box on Windows, Mac, and Linux without external dependencies.

---

### 3. Backend (Flask API)

#### [MODIFY] `extensions.py` / `app.py`
- **CORS Configuration**: Ensure that `flask_cors` explicitly allows origins like `http://localhost`, `capacitor://localhost`, and `app://.` to prevent Cross-Origin Resource Sharing errors when the mobile and desktop apps communicate with the production API.
- **Cookie Security**: Ensure session cookies have `SameSite=None` and `Secure=True` so they are successfully attached to cross-origin requests originating from the Capacitor mobile apps.

#### [MODIFY] `desktop_main.py`
- **SQLite Concurrency**: Ensure the local SQLite database for the desktop app is configured with `check_same_thread=False` and `WAL` (Write-Ahead Logging) mode to prevent database locking errors during high concurrent read/writes (e.g., background syncing).

## Verification Plan

### Automated Tests
- Build and run the Vue SPA to ensure no syntax regressions.
- Verify that standard web usage (outside Capacitor/Electron) is unaffected.

### Manual Verification
- **Desktop**: Run `npm run electron:dev` to ensure the window frame and local server integration works.
- **Mobile**: Run `npx cap run ios` and `npx cap run android` on simulators to verify that API requests correctly hit the production server and auth states persist.
