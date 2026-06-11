# Summer Film Project Memory

## What This Project Is

**Project:** *Creatures in the Tall Grass*  
**Core idea:** Dallas moves to Branford, starts hearing a marsh hum, and is pulled into a story about the tall grass, the creature, and the people around him.

The current live materials are spread across three systems:

- `pages/summer/script-system/` for screenplay scenes and scene order.
- `pages/summer/storyboard-system/` for visual planning and shot lists.
- `pages/summer/production/` plus `pages/summer/production-data.json` for call sheets and scheduling.

## Source of Truth

When the project changes, these are the files that matter first:

- `pages/summer/script-system/manifest.json`
- `pages/summer/script-system/scenes/*.md`
- `pages/summer/storyboard-data.json`
- `pages/summer/storyboard-system/scenes/*.md`
- `pages/summer/production-data.json`
- `pages/summer/production/days/*.html`
- `pages/summer/treatment.md`

Generated or compiled outputs should be treated as downstream artifacts:

- `pages/summer/script-system/full_script.md`
- `pages/summer/script-system/full_script.html`
- `pages/summer/storyboard-system/full_storyboard.md`
- `pages/summer/storyboard-system/full_storyboard.html`
- production day pages and compiled exports

## Current Structure Snapshot

The live script currently runs like this around the marsh discovery:

- `dallas-marsh-walk` / `s08`: Dallas walks Howie, follows the marsh reading, and heads into the grass.
- `dallas-night-work` / `s09`: Dallas finds the injured creature.
- `shadows-in-wind` / `s10`: Dallas flees back out with the creature.

The storyboard and production data currently mirror that order.

## Proposed Change

The idea that fits best is to add one new scene **before the current creature discovery**.

Working concept:

- Dallas takes Howie out again.
- Nothing weird happens.
- The walk is calmer, longer, and more domestic.
- On the second walk, Dallas returns to the marsh and finds the creature.

Why this helps:

- It gives Dallas and Howie more screen time together.
- It delays the creature reveal so the discovery lands harder.
- It creates a clearer contrast between ordinary walking and the moment the marsh turns uncanny.

## Recommended Placement

Insert the new scene between:

- `dallas-marsh-walk`
- `dallas-night-work`

That keeps the emotional beat intact while preserving the later chase.

## If We Implement It

Likely files to update:

- `pages/summer/script-system/manifest.json`
- `pages/summer/script-system/scenes/` for the new scene file
- `pages/summer/script-system/scene_list.md`
- `pages/summer/script-system/SCENE_OUTLINE.md`
- `pages/summer/storyboard-data.json`
- `pages/summer/storyboard-system/scenes/`
- `pages/summer/production-data.json`
- any call sheet pages that reference the affected scenes
- compiled script and storyboard outputs

## Practical Note

The older outline documents in `pages/summer/script-system/SCENE_OUTLINE.md` and `pages/summer/storyboard-system/full_storyboard.md` do not fully match the live manifest anymore. For future edits, the manifest should be treated as the ordering source of truth.
