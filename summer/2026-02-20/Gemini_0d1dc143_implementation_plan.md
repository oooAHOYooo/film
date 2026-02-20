# 3D Co-op Action Adventure Pipeline & Design

This plan outlines the multi-platform development pipeline (Windows, Mac, Linux) using Git and your 32GB flash drive, as well as the design updates to pivot the game into a highly replayable 3D action-adventure with expressive, "Skate-like" controls.

## User Review Required

> [!IMPORTANT]
> Since you want to develop on 4 machines (2 Windows, 1 Mac, 1 Linux), please review the pipeline below. UE5 C++ projects can be tricky across OSs, so we'll rely on Git for code/config and the Flash Drive for heavy assets or simple repo transfer.

## Pipeline Strategy: Git + Flash Drive

Developing Unreal Engine 5 across Windows (Work), Mac (Home), and Linux is completely doable if we separate **Code/Config** from **Heavy Assets** or rely on a centralized Git repo.

### 1. The Code Sync (Git)
Since the `life` repo is already tracking your progress, keeping the game in `life/projects/CPPd1` is a great idea.
* **What Syncs via Git:** `.uproject`, `Source/` (C++ scripts), `Config/`, `Scripts/`, and Markdown docs.
* **Command:** Standard `git pull` & `git push`.
* **Cross-OS Note:** When pulling on Mac/Linux, you will right-click `.uproject` and select "Generate Project Files" (or run the equivalent shell script), then compile. 

### 2. The Heavy Lifting (32GB Flash Drive)
Git limits large files, and checking in binary assets (`.uasset`, `.umap`) can cause bloat. The 32GB Flash drive is perfect for this!
* **What goes on the Flash Drive:** The `Content/` folder, 3D models, textures, animations, and sound files.
* **Workflow Tool:** We will use the existing `backup-to-flash.bat` (and create equivalents for Mac/Linux) to easily sync out your repository and asset folders to the USB drive before leaving a machine.

## Generated Concepts

![3D Action Game Concept](C:\Users\agonzalez7\.gemini\antigravity\brain\0d1dc143-9554-45e1-9267-a4744bff7901\concept_3d_action_1771607566826.png)
![Trickster Concept](C:\Users\agonzalez7\.gemini\antigravity\brain\0d1dc143-9554-45e1-9267-a4744bff7901\concept_trickster_1771607386473.png)
![Brute Concept](C:\Users\agonzalez7\.gemini\antigravity\brain\0d1dc143-9554-45e1-9267-a4744bff7901\concept_brute_1771607476740.png)

## Proposed Changes

### Game Design Document (GDD) Updates

We will update your GDD (`life/data/games/gdd.md`) to reflect the new direction.

#### [MODIFY] [gdd.md](file:///c:/Users/agonzalez7/life/data/games/gdd.md)
* **Status:** Update to reflect 3D transition.
* **Vision:** Shift from "top-down/2D" to a **3D 2-player action adventure**.
* **Core Mechanics:** Introduce expressive, physics-driven or highly reactive controls, inspired by the fluidity and replayability of the *Skate* franchise. Moving, dodging, and wrestling will feel rhythmic and momentum-based.
* **AI Asset Generation:** Add a section on using AI to generate the heavy lifting: generating C++ rule scripts, auto-generating 3D character blockouts, and generating procedural animations.

### Asset Generation & AI Lifting

#### [NEW] [generate-assets.py](file:///c:/Users/agonzalez7/life/projects/CPPd1/Scripts/generate-assets.py)
* We will create Python automation scripts inside your `CPPd1/Scripts` folder that hit AI APIs (like Gemini) to generate C++ boilerplates for new enemies and mechanics, automatically placing them into your `Source` directory.

## Verification Plan

### Manual Verification
1. Review the generated GDD updates to see if the "Skate-like" control philosophy matches your vision.
2. Confirm the drive letter of your 32GB flash drive so we can test the backup script.
3. Test a quick `git push` from your work PC and a `git pull` from the Mac/Linux machines.
