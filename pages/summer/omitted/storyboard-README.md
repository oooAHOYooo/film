# Storyboard (Summer — reusable for all films)

- **Storyboard page**: `storyboard.html` — 9 shots per 11×8.5″ page, print-friendly.
- **Data**: `storyboard-data.json` — one panel per scene (or more if you add extra entries).

## Panel fields (edit in `storyboard-data.json`)

| Field     | Description |
|----------|-------------|
| `sceneId` | Matches `id` in the film’s script `manifest.json`. |
| `camera`  | Shot size/type: **Wide**, **Medium**, **Close-up**, **ECU**, **Two-shot**, **OTS**, etc. |
| `caption` | Optional caption next to the shot. |
| `image`   | Optional image path (e.g. `script-system/storyboards/arrival/01.jpg`). |

## Using this for another film (e.g. Winter)

1. Copy `storyboard.html` and `storyboard-data.json` into that film’s folder.
2. In `storyboard.html`, set `SHEETS_URL` and `DATA_URL` to that film’s script manifest and storyboard data (e.g. `script-system/manifest.json`, `storyboard-data.json`).
3. Fill `storyboard-data.json` with one object per scene: `sceneId` must match the script manifest’s scene `id`; set `camera` and optional `caption` (and `image` when you have assets).
