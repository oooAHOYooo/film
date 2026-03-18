# Agent Genesis Walkthrough

We've successfully built an entirely new "Student's own LLM" environment, which we're calling **Agent Genesis**.

## Changes Made

### 1. Created `mge-llm-maker.html`
* **Layout:** Implemented a full-screen, grid-based dashboard with two columns and two rows as requested.
  * **Top Left:** 💬 **Agent Output** - The tutorial/dialog area where the "AI Agent" responses appear.
  * **Bottom Left:** ⌨️ **Prompt Input** - A coding text area where students type commands (e.g. `add a red cube`, `make it spin`, `create a pink ball`, `clear everything`). Pressing `Shift+Enter` or clicking the execute button triggers the action.
  * **Top Right:** 🎮 **Preview Window** - An integrated Three.js canvas featuring a grid floor, 3D camera, and dynamic lighting.
  * **Bottom Right:** 🏗️ **System Architecture Room** - Currently marked as reserved block space.
* **Pseudo-LLM Logic (Natural Language):** Built a Javascript command parser that reads prompts and executes corresponding Three.js scripts in the background, complete with a "thinking" typing indicator delay to feel like Antigravity or Claude Code.
* **Saving Framework:** 
  * Implemented a `Save Local` button that uses `localStorage` to bookmark student scripts.
  * Implemented an `Load` button to load them back on refresh and replay the commands sequence.
  * Implemented an `Export Prompt History` button that downloads the student's code as a `.txt` file onto their computer.

### 2. Updated `mge.html`
* **New Link Card:** Injected a beautiful purple gradient card right at the front of the experiments grid for **Agent Genesis**, along with a link in the sidebar so students can find it easily.

## Validation
Please manually open `mge.html` in your browser.
1. Click the new "Agent Genesis" card.
2. In the bottom left, try tying comments like:
   - `add a purple box`
   - `make it bounce`
   - `add a green floor`
   - `clear the scene`
3. Click "Save Local", refresh the page, and click "Load" to watch your scripts replay automatically!
