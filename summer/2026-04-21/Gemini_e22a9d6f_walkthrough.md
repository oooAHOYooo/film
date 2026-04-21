# Production Schedule Upgrade Walkthrough

The production schedule for "Creatures in the Tall Grass" has been overhauled to comply with cast availability.

## talent Availability Rules Applied
- **Weekends**: Asher, Ensemble (4+ actors), and guest cast (Janice, Pat, etc.).
- **Weekdays**: Core trio only (Dallas, Dominic, Makayla).

## Calendar Corrections
Based on your feedback, the calendar has been adjusted:
- **Day 8**: Fixed to **Saturday, June 27th**.
- **Day 9**: Added as **Sunday, June 28th**.
- **Weekend Expansion**: Ensured enough slots exist (up to Day 21) to cover all ensemble requirements.

## Schedule Overview
| Period | Focus | Key Scenes |
| --- | --- | --- |
| **Day 1-4 (Sat/Sun)** | Initial Discovery | Arrival, Fellowship, News Vans, The Escape |
| **Day 5-7 (Weekdays)** | Core Trio | Dallas Night, The Hum, Merlin App, Trailcam |
| **Day 8-9 (Sat/Sun)** | Mid-Point Ensemble | The Hymn, Red Eyes, Marsh Confrontation |
| **Day 10-14 (Weekdays)** | Tensions Rising | Kitchen Triage, The Burn Mark, Entering Grass |
| **Day 15 (Sunday)** | Climax Prep | Trench Run, The Final Blast |
| **Day 21 (Saturday)** | Wrap/Aftermath | The Morning After, Final Circle |

## Verification
I ran the `compile-production.js` script and verified that:
- Every ensemble scene is assigned to a Saturday or Sunday.
- Individual cast schedules for Asher and guest stars are exclusive to weekends.
- No single shoot day exceeds a 1.0 day workload.

You can verify the result on the [Production Dashboard](file:///c:/Users/agonzalez7/film/pages/summer/production.html).
