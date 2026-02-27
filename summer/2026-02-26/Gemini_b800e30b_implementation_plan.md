# Goal Description
Build a fully custom, auto-updating Raspberry Pi 4 kiosk using a Python/Flask backend and a gorgeous, "10-foot" HTML/CSS/JS web frontend. This architecture gives you absolute 100% control over the visual branding of the TV display, and uses Python `subprocess` modules to effortlessly launch your native Linux games, media files, and emulators directly from the web browser.

This `baker` repository will contain the web code, the Python orchestrator, and the auto-updater script.

## User Review Required
> [!NOTE]
> - This path means we build the UI! We can make it look incredible, like Netflix or a futuristic command center.
> - **Input:** How do you want to control the menu? (Mouse/Keyboard, TV ReMote (CEC), or a Gamepad?) HTML is easily controlled by a mouse, but if you want Gamepad support on a webpage, we will add a small JavaScript library (like `gamepad API`) to map D-Pad inputs to UI focuses.

## Proposed Changes

### Setup Infrastructure
#### [NEW] `setup.sh`
Installs required packages on the fresh Pi:
- `python3` and `flask`
- `chromium-browser` and a Wayland/X11 Kiosk Window Manager (like `cage` or `matchbox`)
- Video players (`mpv`) and emulator dependencies out of standard debian repositories.

### The Auto-Updater
#### [NEW] `update.sh`
- Runs periodically (e.g., via `systemd.timer` every 15 minutes).
- Executes `git pull origin main`.
- If Python or Web files changed, it gracefully restarts the `baker-flask.service`.
- If new game binaries or video files are detected on GitHub or an external mount, it syncs them.

### Kiosk Launcher (The Core)
#### [NEW] `launcher/server.py`
A Flask server that does two things:
1. Serves the `index.html` frontend.
2. Exposes API endpoints (e.g., `/launch/ahoy`, `/launch/game`, `/launch/review`).
When an endpoint is hit, Flask uses Python's `subprocess` to launch the external Linux application (like Ahoy or RetroArch) effectively "on over" or replacing the Chromium browser temporarily. Once the game closes, Chromium regains focus.

#### [NEW] `launcher/static/index.html` & `style.css`
A bold, TV-scaled user interface. It will contain giant, stylized tiles for Apps, Games, Review, and Settings, relying on vanilla CSS animations for a premium feel.

#### [NEW] `launcher/launch_scripts/`
A directory containing simple `.sh` wrappers that `server.py` calls to cleanly start and stop the other apps.

## Verification Plan

### Local Verification
1. **Windows/Garuda Testing:** We can run `python launcher/server.py` and open `localhost:5000` on your current machines to visually perfect the CSS/HTML UI and test the Javascript button logic.
2. **Mock Launching:** We verify that clicking UI buttons triggers the correct Python backend endpoints.

### Pi Deployment
1. SSH into the Pi and run `bash setup.sh`.
2. Verify the Pi boots cleanly into the Chromium Flask kiosk.
3. Test launching a full-screen application (like Ahoy or a video) via the Flask UI, and verify that upon closing it, the user is safely returned to the UI.
4. Verify the `update.sh` correctly pulls remote UI changes and restarts the system seamlessly.
