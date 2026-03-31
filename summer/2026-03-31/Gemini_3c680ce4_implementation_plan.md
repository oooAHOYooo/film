# Restructure Production Bible to Wikipedia-like Layout

This plan outlines the steps to add a dynamic search bar and restructure the Production Bible to match the Wikipedia aesthetic.

## User Review Required

> [!IMPORTANT]
> The "Wikipedia" look involves changing the primarily sans-serif design to a mix of serif (for titles) and sans-serif (for body content). It also introduces a top search bar and a more structured sidebar.

## Proposed Changes

We will modify the core HTML and CSS files for the Bible system.

### [Bible System](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/)

#### [MODIFY] [bible.css](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/bible.css)
- Add Wikipedia-inspired design tokens (Serif fonts, specific colors).
- Style the new Top Bar and search input.
- Redesign the sidebar to be a clean, list-based navigation.
- Add styles for "Infoboxes" that will be used for entry metadata.
- Update typography for headers (Serif) and body (Sans-serif).

#### [MODIFY] [index.html](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/index.html)
- Add the new Top Bar with dynamic search.
- Restructure the page to have a sidebar (like a Portal page in Wikipedia).
- Apply Wikipedia-style header and subheader.

#### [MODIFY] [full_bible.html](file:///c:/Users/agonzalez7/film/pages/summer/bible-system/full_bible.html)
- Add the new Top Bar with dynamic search.
- Enhance the existing sidebar functionality.
- Update the entry rendering logic to create Wikipedia-style articles with infoboxes.
- Implement the "Dynamic Search" script to filter entries and provide a dropdown.

## Implementation Details

### Wikipedia Aesthetic
- **Fonts**: Use `Georgia`, `Serif` for headings. `Inter` or `Arial` for body.
- **Top Bar**: A persistent bar at the top containing the site title and a search input.
- **Infobox**: A floating box on the right of each entry containing "Category" and "Source File" info.

### Dynamic Search
- As the user types in the search bar, a dropdown will show matching entries.
- Using `ENTRIES` constant already present in the script.
- Support keyboard navigation for the search results.

## Verification Plan

### Automated Tests
- N/A (Visual changes)

### Manual Verification
- Verify search functionality: typing should filter and show results.
- Verify Wikipedia styling: Check headers, sidebar, and infoboxes.
- Responsive check: Ensure the new top bar and sidebar work on mobile.
