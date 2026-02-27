# Inspiration Gallery Implementation Plan

The goal is to create a dedicated subpage for the "Summer" film project's inspiration gallery, organized by specific categories, and integrate it into the automated compilation workflow.

## Proposed Changes

### [Component: Pages]

#### [NEW] [index.html](file:///c:/Users/agonzalez7/film/pages/summer/inspiration/index.html)
- Create a new directory `pages/summer/inspiration/`.
- Create a new `index.html` with a premium aesthetic similar to `summer.html`.
- **Sections**:
    1.  **Good Creatures**
    2.  **Bad Creatures**
    3.  **Wardrobe**
    4.  **Practical SFX Ideas**
    5.  **Location Ideas**
    6.  **Vibes + Colors**
    7.  **Misc (Catch-all)**

#### [NEW] [compile.js](file:///c:/Users/agonzalez7/film/pages/summer/inspiration/compile.js)
- A new compiler script that scans `assets/summer/inspiration/` subdirectories.
- Projects these into `data/summer.json` under the `inspiration` key, assigning a `category` property to each item based on its folder.
- Fallback: Current items in `/assets/summer/inspo-imgs/` will be categorized as "Misc".

#### [MODIFY] [summer.html](file:///c:/Users/agonzalez7/film/pages/summer.html)
- Add "Inspiration Gallery" to the Bento Grid and Sitemap.

### [Component: Scripts]

#### [NEW] [inspiration.js](file:///c:/Users/agonzalez7/film/scripts/summer/inspiration.js)
- Renders the `inspiration` data from `summer.json` grouped by the 7 categories.

#### [MODIFY] [compile-all.js](file:///c:/Users/agonzalez7/film/compile-all.js)
- Add the Inspiration Gallery compiler to the master `tasks` list.

## Verification Plan

### Manual Verification
1.  **Compilation Test**: Move a few images into a "Good Creatures" folder and run `node compile-all.js`. Verify `summer.json` updates with the correct categories.
2.  **UI Check**: Verify `pages/summer/inspiration/index.html` displays the items in their respective sections.
