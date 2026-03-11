# Implement Code Popup for Elemental Rhythm Game

## Goal
Modify `mge-elemental-rhythm.html` so that every 15 successful arrow presses, the player receives a prompt where they "add elements together" to learn the basics of code.

## Proposed Changes

### `mge-elemental-rhythm.html`
- **Modify Input Tracking**: Add a counter for `successfulHits`. Increment this in the `successHit` function.
- **Trigger Condition**: When `successfulHits % 15 === 0`, trigger the new coding popup instead of the existing random math popup.
- **Remove Random Math Timer**: Remove `scheduleMath()` so the interruptions are based purely on skill/progress (every 15 hits).
- **New Coding Interface**: Create a `coding-popup` overlay (similar to `math-popup`). It will present simple coding challenges focused on adding "elements" together.
  - Examples of questions:
    - Array insertion: `let atoms = ["H", "H"]; atoms.____("O"); // add O` (Answer: `push`)
    - String concatenation: `let water = "H2" __ "O";` (Answer: `+`)
    - Arithmetic: `let carbon = 6; let oxygen = carbon __ 2; // = 8` (Answer: `+`)
  - When answered correctly, the game resumes.

## User Review Required
> [!IMPORTANT]
> Is this exactly what you envision by "getting to add elements together and teach them about the basics of code"? I plan to focus on basic array methods (like `.push()`), string concatenation (using `+`), and basic math in code format. Let me know if you prefer specific coding concepts (like HTML elements instead of JavaScript arrays/strings).
