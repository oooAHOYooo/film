# Goal Description

The objective is to design the architecture and flesh out a fresh repository for a **professional-grade 2D animation tool**—specifically tailored for traditional, frame-by-frame animation in the style of Studio Ghibli. We also need to construct a comprehensive "Megaprompt" that you can use in another AI editor (like Cursor, Windsurf, or Copilot) to build this massive project efficiently.

## Core Features of a Professional 2D Animation Tool
To create something on the level of Studio Ghibli, the tool must support:
1. **High-Performance Canvas**: Hardware-accelerated drawing (WebGL/PixiJS) to handle large resolutions, minimal latency, and pressure-sensitive drawing tablets.
2. **Advanced Timeline & X-Sheet**: Frame-by-frame timing, an exposure sheet for traditional pacing, keyframing, and playback controls.
3. **Layer Management**: Support for rough animation, tie-down, cleanup, coloring, and background layers with blending modes and grouping.
4. **Onion Skinning**: Fully customizable forward/backward onion skinning with color coding (e.g., red for previous, green for next).
5. **Custom Brush Engine**: Textured brushes that emulate pencils, ink pens, and watercolor/gouache (essential for Ghibli-style backgrounds).
6. **Audio Synchronization**: Scrubbing audio on the timeline for lip-syncing and musical timing.

## Proposed Tech Stack for the Fresh Repo
- **Frontend Framework**: React (or Vue) + TypeScript
- **Build Tool**: Vite (for rapid development and instant HMR)
- **Graphics Engine**: Native HTML5 Canvas API + WebGL (or a lightweight library like Pixi.js for rendering performance)
- **State Management**: Zustand or Redux (crucial for undo/redo stacks and managing thousands of frames/layers)
- **Desktop Wrapper**: Tauri (Rust-based, lightweight) or Electron (Node-based) to turn this into a standalone desktop application with native file system access for large exports.

> [!IMPORTANT]
> ## User Review Required
> 1. **Repository Setup**: Do you want me to initialize this fresh repository (e.g., `npx create-vite@latest ghibli-animator`) right here in your current `mrg-stem` workspace, or are you purely looking to take the Megaprompt and run it in a completely separate project directory using your other editor?
> 2. **Tech Stack Approval**: Does the proposed stack (React + TypeScript + Vite + Canvas/WebGL) align with your preferences for this project?
> 3. **Desktop App vs Web App**: Should we plan for a Web-based tool first, or immediately wrap it in Tauri/Electron for desktop performance?

## Proposed Changes / Next Steps

### 1. The Megaprompt Artifact (Available Now)
I have created a separate artifact called `megaprompt.md` (which I will generate in my next step). This contains the massive, highly-detailed prompt you can copy and paste into your other editor to scaffold the entire application with best practices.

### 2. Scaffold the Fresh Repo
If you approve, I will run the initialization commands to create the fresh repository in a new folder (e.g., `./professional-animation-studio`), set up the directory structure (components, canvas, state, utils), and install the initial dependencies.

### 3. Build the Core Canvas & Timeline Prototype
We can start building the basic architecture:
- A drawing canvas that captures pointer events (with pressure).
- A basic timeline that allows adding frames and scrubbing.
- State management to store stroke data per frame.

## Verification Plan

### Automated / Lint Verification
- Ensure the project builds successfully (`npm run build`).
- Verify TypeScript types across the canvas and state management.

### Manual Verification
- You (the user) will draw on the canvas using a tablet or mouse and verify the latency.
- Add a new frame, draw again, and verify the onion skinning works correctly.
- Test playback at 12fps or 24fps to ensure smooth rendering.
