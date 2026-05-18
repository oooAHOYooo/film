# Swapping Day 4 and Day 9 in Production Schedule

This plan outlines the steps to perform a full swap of the shooting schedules between Day 4 (June 13, 2026) and Day 9 (June 20, 2026). The swap is required because the actress playing **Janice** is available on June 13 but not on June 20. 

All scenes previously scheduled for Day 9 (requiring Janice) will now be filmed on Day 4 (June 13). All scenes previously scheduled for Day 4 (not requiring Janice) will now be filmed on Day 9 (June 20). 

We will also fix an existing schedule inconsistency for `s07` to place it properly on Day 8 as outlined in the active `shootPlan`.

## Proposed Changes

### 1. Production Data System

#### [MODIFY] [production-data.json](file:///c:/Users/agonzalez7/film/pages/summer/production-data.json)

- **Scene Assigned Days Updates**:
  - `s03`: Change `"assignedDay": 4` to `"assignedDay": 9`.
  - `s05`: Change `"assignedDay": 4` to `"assignedDay": 9`.
  - `s06`: Change `"assignedDay": 4` to `"assignedDay": 9`.
  - `s07`: Change `"assignedDay": 4` to `"assignedDay": 8` (to match Day 8 shootPlan where it is scheduled).
  - `s13`: Change `"assignedDay": 9` to `"assignedDay": 4`.
  - `s14`: Change `"assignedDay": 9` to `"assignedDay": 4`.
  - `s14b`: Change `"assignedDay": 9` to `"assignedDay": 4`.
  - `s14c`: Change `"assignedDay": 9` to `"assignedDay": 4`.
  - `s17`: Change `"assignedDay": [2, 9]` to `"assignedDay": [2, 4]`.
  - `s17b`: Change `"assignedDay": [9, 12]` to `"assignedDay": [4, 12]`.
  - `s17c`: Change `"assignedDay": [9, 12]` to `"assignedDay": [4, 12]`.

- **Shoot Plan Swap**:
  - Swap the `"scenes"`, `"cast"`, and `"sourceNote"` fields between the Day 4 and Day 9 entries in `"shootPlan"`.
  - Keep the correct dates and days (`2026-06-13` for Day 4, `2026-06-20` for Day 9) and adjust `"sourceNote"` dates:
    - **Day 4 shootPlan** (6.13):
      - `"scenes"`: `["s13", "s14", "s17"]`
      - `"sourceNote"`: `"D4 = 6.13.26 - Sat <s13, s14s, s17 >"`
      - (Remove `"cast"` key as Day 9 did not specify an explicit one, allowing it to extract characters dynamically).
    - **Day 9 shootPlan** (6.20):
      - `"scenes"`: `["s03", "s05", "s06"]`
      - `"cast"`: `["Dallas", "Dominic", "Pat Clendenen"]`
      - `"sourceNote"`: `"D9 = 6.20.26 = Sat <s03,s05,s06>"`

---

### 2. Scene Script Comments

#### [MODIFY] [s03.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s03.md)
- Change `<!-- filmming on 6.14-->` to `<!-- FILMING ON - DAY 9 = 6.20.26 -->`.

#### [MODIFY] [s05.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s05.md)
- Change `<!-- FILMING ON - DAY 4 = 6.13.26 -->` to `<!-- FILMING ON - DAY 9 = 6.20.26 -->`.

#### [MODIFY] [s06.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s06.md)
- Change `<!-- FILMING ON - DAY 4 = 6.13.26 -->` to `<!-- FILMING ON - DAY 9 = 6.20.26 -->`.

#### [MODIFY] [s07.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s07.md)
- Change `<!-- FILMING ON - DAY 4 = 6.13.26 -->` to `<!-- FILMING ON - DAY 8 = 6.19.26 -->`.

#### [MODIFY] [s13.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s13.md)
- Change `<!-- FILMING ON \nDAY 9 = 6.20.26 -->` to `<!-- FILMING ON \nDAY 4 = 6.13.26 -->`.

#### [MODIFY] [s14.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s14.md)
- Change `<!-- FILMING ON = DAy 9 = 6.20.26 -->` to `<!-- FILMING ON = DAY 4 = 6.13.26 -->`.

#### [MODIFY] [s14b.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s14b.md)
- Change `<!-- FILMING ON = DAY 9 = 6.20.26 -->` to `<!-- FILMING ON = DAY 4 = 6.13.26 -->`.

#### [MODIFY] [s14c.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s14c.md)
- Change `<!-- FILMING ON = DAY 9 = 6.20.26 -->` to `<!-- FILMING ON = DAY 4 = 6.13.26 -->`.

#### [MODIFY] [s17.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s17.md)
- Change `<!-- GOING TO FILM ON Day 9 -->` to `<!-- GOING TO FILM ON Day 4 -->`.

---

## Verification Plan

### Automated Compilation Tests
- Run `node compile-production.js` in `pages/summer` to regenerate:
  - `production.html` (the primary dashboard file)
  - `production/days/4.html` (new call sheet for Day 4)
  - `production/days/9.html` (new call sheet for Day 9)
  - All updated cast sheets in `production/cast/` (including `janice.html`, `pat.html`, etc.)
- Run `node script-system/compile.js` in `pages/summer` to regenerate compiled script artifacts.
- Verify that no compilation warnings or errors are produced, and that output HTML matches the new date structure.

### Manual Verification
- Verify that Day 4 call sheet displays scenes `s13`, `s14`, `s17` and lists the correct cast members including Janice.
- Verify that Day 9 call sheet displays scenes `s03`, `s05`, `s06` and lists the correct cast members (and does NOT list Janice).
