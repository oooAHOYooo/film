# Add "Cinematography" Category to Inspiration Gallery

This plan outlines the steps to introduce a new "Cinematography" category to the Summer Inspiration hub, including adding new image references and updating the gallery UI and backend logic.

## Proposed Changes

### Data

#### [MODIFY] [summer.json](file:///c:/Users/agonzalez7/film/data/summer.json)
- Add three new items to the `inspiration` array with category "Cinematography":
  - `https://i.pinimg.com/736x/fd/8e/7f/fd8e7f9ae48ac2d558ae839ad941d184.jpg`
  - `https://i.pinimg.com/736x/82/0b/6f/820b6fbd03cdaeb0501f9b555110db01.jpg`
  - `https://i.pinimg.com/1200x/78/7f/a3/787fa3bc0b00ffb329aeedd9c07a4682.jpg`

### Frontend

#### [MODIFY] [index.html](file:///c:/Users/agonzalez7/film/pages/summer/inspiration/index.html)
- Add a new navigation link `Cinematography` in the gallery nav.
- Add a new `<section>` with ID `section-cinematography` and a grid container with ID `cinematography-grid`.

#### [MODIFY] [inspiration.js](file:///c:/Users/agonzalez7/film/scripts/summer/inspiration.js)
- Update the `categories` mapping in `loadAndRenderInspiration` to include `'Cinematography': document.getElementById('cinematography-grid')`.

### Build Logic

#### [MODIFY] [compile.js](file:///c:/Users/agonzalez7/film/pages/summer/inspiration/compile.js)
- Add `cinematography` mapping to `CATEGORY_MAP` to ensure future automated exports/scans use the correct label.

## Verification Plan

### Manual Verification
- Open the [Inspiration Page](file:///c:/Users/agonzalez7/film/pages/summer/inspiration/index.html) in the browser tool.
- Verify the "Cinematography" link appears in the navigation.
- Verify clicking the link scrolls to the new section.
- Verify the three new images are displayed in the Cinematography grid.
