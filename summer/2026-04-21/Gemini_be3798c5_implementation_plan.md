# Music Section Refactor Plan

Refactor the `music.html` page to focus on inspiration and high-level progress tracking. The current detailed composition notes will be removed in favor of a "TL;DR" approach for 5 major musical themes and their variations.

## User Review Required

> [!IMPORTANT]
> - I have grouped the existing 12 songs into **5 Major Themes**. Please confirm if this categorization aligns with your vision.
> - The **Progress** column will be initialized with placeholder statuses (e.g., "In Progress", "Planned"). Let me know if you want specific status labels.
> - The "Composition Notes" (Mood & Direction) will be removed from the table entirely to keep the page clean and inspiration-focused.

## Proposed Changes

### [Music Page](file:///c:/Users/agonzalez7/film/pages/summer/music.html)

#### [MODIFY] [music.html](file:///c:/Users/agonzalez7/film/pages/summer/music.html)
- **Refactor Header**: Update the intro and philosophy section to feel more like an "Inspiration Hub."
- **New TL;DR Section**: Add a high-level summary for the 5 major themes, now structured with a "Motif" philosophy (Wonder meets Dread):
    1. **The Hum (Discovery Motif)**: A rising 3-note signal. Scientific wonder turning into a biological pulse. 
    2. **Marsh Walk (Environmental Awe)**: Subdued curiosity. Leveraging Lydian shifts to capture the "otherworldliness" of the tall grass.
    3. **The Hymn (The Normal)**: Domestic warmth under threat. A familiar melody that "frays" at the edges.
    4. **The Burn Mark (The Hunter Ostinato)**: A low, rhythmic 2-note pulse. Minimalist, physical, and relentless.
    5. **Final Echoes (The Resolution)**: A shattering orchestral release followed by a single-note resonant stillness.
- **Sonic Inspiration Section**: Add a guide on using specific keys and intervals to create that "Acoustic Horror" vibe.
- **Update Track Table**:
    - Remove "Mood & Direction" column.
    - Add "Progress" column.
    - Reorganize songs into Major themes with indented Variations.
- **Style Adjustments**: Ensure the UI feels premium and visual, emphasizing the "Inspiration" aspect.

## Open Questions
- Are there any specific visual inspiration images or colors you'd like highlighted on this page?
- Should the "Progress" column be interactive (editable) or just static text for now?

## Verification Plan

### Automated Tests
- None applicable for this UI/Content refactor.

### Manual Verification
- View the refactored `music.html` in the browser to ensure the layout is clean.
- Verify the 5 themes are correctly summarized and the table is easy to read.
- Ensure the existing "Inspiration Links" and "Notes" tools still function as expected.
