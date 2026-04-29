# Walkthrough - Scene Numbering Fix

I have standardized the scene numbering across the entire project to ensure consistency between filenames, internal headers, and the storyboard.

## Key Changes

### 1. Fixed "Research Beat" Sequence (s08b, s08c, s08d)
- Updated [s08b.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s08b.md) and [s08c.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s08c.md) internal headers from "Scene 9" series to **Scene 8** series to match their filenames.
- Corrected the metadata comments in `s08b.md`, `s08c.md`, and `s08d.md`.

### 2. Corrected Storyboard Numbering
- Updated [full_storyboard.md](file:///c:/Users/agonzalez7/film/pages/summer/storyboard-system/full_storyboard.md) to eliminate the +1 shift that began at Scene 7B.
- Renumbered all subsequent scenes (8 through 13) to align with their actual `sXX` filenames.
- Inserted the missing **Scene 13: The Confrontation (s13)** into the storyboard.

### 3. Fixed Act Assignments (s17b, s17c)
- Discovered that **Scene 17B: Normal Day** and **Scene 17C: Mute Drive** were incorrectly assigned to Act 4 (Aftermath) in the [manifest.json](file:///c:/Users/agonzalez7/film/pages/summer/script-system/manifest.json).
- Moved them to **Act 2: The Creature**, as they describe the tension in the town *before* the storm.
- Added standardized headers and metadata to `s17b.md` and `s17c.md`.

### 4. Compiled System
- Ran the script compiler to refresh [full_script.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/full_script.md) and [full_script.html](file:///c:/Users/agonzalez7/film/pages/summer/script-system/full_script.html).
- Verified that all headers are now consistent and follow the chronological order.

## Verification Results
- **Filenames**: All scene numbers in headers now match the `sXX.md` format.
- **Acts**: The Act transitions in the full script now correctly place the "Normal Day" and "Mute Drive" sequences within the Rising Action (Act 2).
- **Storyboard**: The storyboard now perfectly mirrors the script's numbering.
