# Walkthrough: Day 4 & Day 9 Filming Schedule Swap

We have successfully executed the schedule date swap between **Day 4 (June 13, 2026)** and **Day 9 (June 20, 2026)**. This swap ensures that scenes requiring **Janice** (and the actress playing her) are scheduled on **June 13** when she is available, while scenes that do not require her are rescheduled to **June 20** when she is unavailable.

---

## 🛠️ Changes Executed

### 1. Central Database Updates
We modified [production-data.json](file:///c:/Users/agonzalez7/film/pages/summer/production-data.json) to reflect the swapped logic:
* **Rescheduled Scenes:**
  * Swapped `s03`, `s05`, and `s06` from `"assignedDay": 4` to `"assignedDay": 9`.
  * Swapped `s13`, `s14`, `s14b`, and `s14c` from `"assignedDay": 9` to `"assignedDay": 4`.
  * Swapped `s17` from `"assignedDay": [2, 9]` to `"assignedDay": [2, 4]`.
  * Swapped `s17b` and `s17c` from `"assignedDay": [9, 12]` to `"assignedDay": [4, 12]`.
* **Database Inconsistency Fix:**
  * Aligned `s07` (The Coordinates) to `"assignedDay": 8` to match the `shootPlan` array's Friday, June 19 schedule (reconciling a legacy discrepancy).
* **Shoot Plan Swap:**
  * Updated the `shootPlan` block for **Day 4** to list scenes `s13`, `s14`, `s17` and updated `sourceNote` to `"D4 = 6.13.26 - Sat <s13, s14s, s17 >"`.
  * Updated the `shootPlan` block for **Day 9** to list scenes `s03`, `s05`, `s06` along with cast members `Dallas`, `Dominic`, `Pat Clendenen` and updated `sourceNote` to `"D9 = 6.20.26 = Sat <s03,s05,s06>"`.

---

### 2. Scene Script Comments Updated
We updated the inline metadata comments in the following nine script files in [scenes/](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/):
1. [s03.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s03.md): Updated comment to `<!-- FILMING ON - DAY 9 = 6.20.26 -->`.
2. [s05.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s05.md): Updated comment to `<!-- FILMING ON - DAY 9 = 6.20.26 -->`.
3. [s06.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s06.md): Updated comment to `<!-- FILMING ON = DAY 9 = 6.20.26 -->`.
4. [s07.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s07.md): Updated comment to `<!-- FILMING ON - DAY 8 = 6.19.26 -->` (to align with the schedule fix).
5. [s13.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s13.md): Updated comment to `<!-- FILMING ON \nDAY 4 = 6.13.26 -->`.
6. [s14.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s14.md): Updated comment to `<!-- FILMING ON = DAY 4 = 6.13.26 -->`.
7. [s14b.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s14b.md): Updated comment to `<!-- FILMING ON = DAY 4 = 6.13.26 -->`.
8. [s14c.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s14c.md): Updated comment to `<!-- FILMING ON = DAY 4 = 6.13.26 -->`.
9. [s17.md](file:///c:/Users/agonzalez7/film/pages/summer/script-system/scenes/s17.md): Updated comment to `<!-- GOING TO FILM ON Day 4 -->`.

---

## 🚀 Rebuilding & Compilation
We executed the master compile command from the repository root:
```powershell
node compile-all.js
```
The compilation completed in **3.4 seconds** with **zero errors**.
* ✓ Recompiled the **Summer Script System** and the **Scene Gallery**.
* ✓ Recompiled the **Summer Production Dashboard** ([production.html](file:///c:/Users/agonzalez7/film/pages/summer/production.html)).
* ✓ Regenerated all sub-pages including daily call sheets and character cast sheets.
* ✓ Ran `export-artifacts.ps1` to successfully package and back up the updated artifacts.

---

## 🔍 Verification Results

> [!NOTE]
> All generated call sheets match the revised scheduling rules and verified actor availability perfectly.

### Call Sheet Day 4 (June 13)
* **Status:** Verified!
* **Contents:** Shows scenes **s13, s14, s17**.
* **Cast:** Includes characters **Janice** and **Mr. Mike** (exactly matching June 13 availability!).
* **Reflected file:** [4.html](file:///c:/Users/agonzalez7/film/pages/summer/production/days/4.html)

### Call Sheet Day 9 (June 20)
* **Status:** Verified!
* **Contents:** Shows scenes **s03, s05, s06**.
* **Cast:** Lists **Dallas, Dominic, Pat Clendenen** (contains NO references to Janice, matching June 20 unavailability!).
* **Reflected file:** [9.html](file:///c:/Users/agonzalez7/film/pages/summer/production/days/9.html)
