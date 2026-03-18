# LLM Game Maker Implementation Plan

## Goal Description
Create a "student's own LLM" environment where students can type prompts to build and manipulate a 3D game scene using Three.js. This will feature a split-screen 2x2 grid design with an agent/tutorial area, a prompt input area, and a 3D preview window.

## User Review Required
> [!IMPORTANT]
> **Clarification needed on file placement:** Your request asks to build this "in the `mge.html`". Currently, `mge.html` acts as the main hub/dashboard linking to all your other experiments (like the Skating Game, Minecraft Clone, etc.). 
> 
> * **Option A (Recommended):** I can create a brand new file (e.g., `mge-llm-maker.html`) that contains this new game maker, and then add a card in `mge.html` that links to it.
> * **Option B:** I can completely overwrite the current `mge.html` with this new game maker interface (which would remove the current hub).
>
> Please confirm which option you prefer!

## Proposed Changes

### 1. New File: `mge-llm-maker.html` (Assuming Option A)
Creating the new game maker using HTML, CSS (Grid), and vanilla JS (Three.js).

#### Layout Structure (2x2 Grid)
We will use CSS Grid to create the layout exactly as described:
* **Left Column (Coding Agent):**
  * **Top Left (Row 1):** Tutorial / Agent Dialog (Where the agent talks to the student and provides instructions).
  * **Bottom Left (Row 2):** Coding / Prompt Area (Textarea where the student types their prompts).
* **Right Column:**
  * **Top Right (Row 1):** Output Preview Window (The Three.js canvas where the game renders).
  * **Bottom Right (Row 2):** Clear for now (An empty panel reserved for future use).

#### Core Features
* **Pseudo-LLM Logic:** A JavaScript logic parser that listens to the student's text input (e.g., "add a red box", "make the floor green", "add a spinning sphere"). When they submit, the logic will fake a "thinking" animation in the Agent panel, and then execute the corresponding Three.js commands in the Preview Window.
* **Three.js Scene:** A basic scene setup with a camera, lighting, a grid helper (to show it's a 3D space), and dynamic object creation based on the student's code/prompts.
* **Premium Hacker Aesthetic:** Dark mode by default, monospace fonts for the terminal side, glowing borders, and smooth animations to simulate a high-tech AI agent like Antigravity.

### 2. Update `mge.html` (If Option A is chosen)
#### [MODIFY] `mge.html`
* Add a new `<div class="experiment-card">` linking to `mge-llm-maker.html` in the "Experiments Grid".

## Verification Plan

### Manual Verification
1. Open the created file in the browser.
2. Verify the 2x2 grid layout matches the specification (Tutorial Top-Left, Prompt Bottom-Left, Preview Top-Right, Empty Bottom-Right).
3. Type a prompt like "add a cube" into the coding area and submit.
4. Verify that the Agent/Tutorial window acknowledges the command and that a cube appears in the 3D Preview window.
