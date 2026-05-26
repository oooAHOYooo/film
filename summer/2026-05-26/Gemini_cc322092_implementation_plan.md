# Implementation Plan: ¡Eco-Clasifica! Spanish Recycling STEM Game

Create a second interactive Spanish STEM game designed for 2nd graders: **"¡Eco-Clasifica! El Robot del Reciclaje"** (Eco-Sort! The Recycling Robot). Feature it across the hub with a dedicated **"In Spanish"** tag.

## User Review Required

> [!IMPORTANT]
> The game is built with simple, 2nd-grade appropriate Spanish vocabulary to teach environmental science, ecology, and waste sorting.
> Both **¡Eco-Energía!** and **¡Eco-Clasifica!** will be tagged clearly with a **"🇪🇸 In Spanish"** tag in the hubs so students can easily find them.

## Proposed Changes

---

### New Game File

#### [NEW] [mge-eco-clasifica.html](file:///c:/Users/agonzalez7/mrg-stem/mge-eco-clasifica.html)
- A standalone HTML5 game featuring **Verdito the Robot** 🤖.
- Drag-and-drop or click-and-match sorting gameplay with animated items (cajas 📦, botellas 🥤, latas 🥫, manzanas 🍎, etc.) falling into colorful bins.
- Celebrations, point tracking, progressive speed rounds, and Web Audio API synthesized retro sound effects.

---

### MGE Hub Integrations

#### [MODIFY] [mge.html](file:///c:/Users/agonzalez7/mrg-stem/mge.html)
- Feature **"¡Eco-Clasifica!"** in the **NEW & FEATURED** and **Discovery** grids.
- Add prominent **"🇪🇸 In Spanish"** tags/badges to:
  - **¡Eco-Clasifica!**
  - **¡Eco-Energía!**
  - **El Laboratorio Loco**

#### [MODIFY] [index.html](file:///c:/Users/agonzalez7/mrg-stem/index.html)
- Feature the new game on the main page.
- Add the **"🇪🇸 In Spanish"** tag to all featured Spanish games.

---

## Verification Plan

### Manual Verification
- Play through all three sorting rounds.
- Verify sorting logic and explanatory tips for incorrect selections.
- Ensure the "In Spanish" tag is visually striking and well-aligned on all layouts.
