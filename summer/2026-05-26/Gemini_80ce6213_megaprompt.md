# Studio Ghibli-Style Professional 2D Animation Tool: Megaprompt

Copy and paste the text below into your preferred AI editor (like Cursor, Windsurf, GitHub Copilot Chat, etc.) to kickstart the development of the professional animation tool. 

---

## 📋 The Megaprompt

**Role & Goal:**
You are an expert full-stack developer, graphics programmer, and UI/UX designer. Your goal is to architect and build a **professional-grade 2D frame-by-frame animation application** from scratch. The target audience is professional animators wanting to create traditional, Studio Ghibli-style films. The tool must prioritize performance, a smooth drawing experience, and a highly functional, intuitive interface.

**Tech Stack:**
- **Frontend Framework:** React + TypeScript
- **Build Tool:** Vite
- **Graphics Rendering:** Native HTML5 Canvas API combined with WebGL (or Pixi.js/Fabric.js if necessary for hardware-accelerated rendering).
- **State Management:** Zustand (preferred for managing complex undo/redo stacks, frames, layers, and project state without immense boilerplate).
- **Styling:** CSS Modules or TailwindCSS (choose a dark, sleek, unobtrusive "Pro" aesthetic similar to ToonBoom Harmony, TVPaint, or Clip Studio Paint).
- **Target Platform:** Web application architecture, structured so it can be easily wrapped in Electron or Tauri later for desktop deployment.

**Core Architecture & Features Required:**

1. **The Canvas Engine (The Core):**
   - Must support high-resolution canvases (e.g., 1080p, 4K) with a pan/zoom/rotate viewport.
   - Implement **PointerEvents** to capture stylus pressure, tilt, and precise coordinates for drawing tablets (Wacom, Huion, iPad).
   - Implement a custom brush engine that supports varying thickness based on pressure, opacity, and basic textures (pencil, ink, watercolor).
   - Use a robust data structure for strokes (e.g., storing coordinate arrays and pressure data) to allow for vector-like editing or high-quality rasterization.

2. **Timeline & X-Sheet (Exposure Sheet):**
   - Create a horizontal Timeline component showing Layers (vertical) and Frames (horizontal).
   - Standard frame rates support (12 fps, 24 fps, 30 fps, 60 fps).
   - Implement traditional timing concepts: drawing "on ones", "on twos", and "on threes".
   - Allow users to add, duplicate, delete, and move frames (cels) across the timeline.
   - Implement Play, Pause, Loop, and scrub controls.

3. **Layer Management System:**
   - Support unlimited layers with standard blend modes (Normal, Multiply, Overlay) and Opacity controls.
   - Folders/Groups for organizing drafts, cleanups, lineart, colors, and backgrounds.

4. **Advanced Onion Skinning:**
   - Must show previous frames in a tinted color (e.g., Red) and next frames in another color (e.g., Green).
   - Configurable onion skin depth (e.g., show 1, 2, or 3 frames back/forward) with fading opacity.

5. **State & Memory Management (Crucial!):**
   - Animation software is notoriously memory-heavy. State management must be highly optimized. 
   - Avoid re-rendering the entire React UI on every pointer move. Decouple the React UI from the Canvas drawing loop.
   - Implement a solid Undo/Redo stack that only captures diffs or specific stroke actions rather than deep-copying the entire canvas.

**Development Phases (Step-by-Step Instructions for the AI):**

*Please execute this project in the following sequential phases. Do not move to the next phase until the current one is fully functional.*

- **Phase 1: Project Scaffolding & UI Layout**
  - Initialize the Vite + React + TS project.
  - Create the layout skeleton: Toolbar (left/top), Canvas Viewport (center), Timeline/X-Sheet (bottom), and Properties/Layers panel (right).
  - Use a sleek, dark-mode aesthetic.

- **Phase 2: The Drawing Canvas**
  - Implement the central Canvas component.
  - Capture `pointerdown`, `pointermove`, and `pointerup` events.
  - Read `e.pressure` to dynamically adjust the line width.
  - Implement basic Zoom and Pan (e.g., Spacebar + Drag).

- **Phase 3: The Timeline & State**
  - Set up the Zustand store. Data structure: `Project -> Layers -> Frames -> Strokes`.
  - Build the Timeline UI to map over this state.
  - Link the Timeline to the Canvas: when I select Frame 2 on Layer 1, the Canvas clears and shows Frame 2's strokes.

- **Phase 4: Onion Skinning & Playback**
  - Implement a `requestAnimationFrame` loop for playback at the designated FPS.
  - During playback, update the current frame index in the store.
  - Implement Onion Skin rendering on the Canvas (draw previous/next frames with globalAlpha and color tints).

- **Phase 5: Tools & Polish**
  - Add Erase, Fill (Bucket), and Selection tools.
  - Implement the Undo/Redo stack.
  - Add an export functionality to compile the frames into a `.webm`, `.mp4`, or `.gif` using something like FFmpeg.wasm or Whammy.js.

**Immediate Action:**
Begin with Phase 1. Set up the directory structure, install dependencies (like Zustand and any UI libraries you choose), and build the core UI layout. After you complete Phase 1, ask for my review before moving to Phase 2.
