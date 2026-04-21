# Upgrade Production Schedule

The production schedule for "Creatures in the Tall Grass" needs to be updated to follow specific talent availability rules:
- **Weekends (Sat/Sun)**: Scenes involving **Asher**, any other cast members (Janice, Pat, etc.), or **Ensemble** scenes (more than 3 actors).
- **Weekdays (Mon-Fri)**: Scenes involving only **Dallas, Dominic, and Makayla** (maximum 3 actors).

## User Review Required

> [!IMPORTANT]
> The production calendar now includes **Saturday, June 27th as Day 8** based on your correction.
> I have also added **Sunday, June 28th as Day 9** to maximize weekend capacity.
> This provides **9 weekend slots** (May 30, 31, June 6, 7, 20, 27, 28, July 5, 11), which fits all ensemble and Asher work (~8 days total).

> [!WARNING]
> Moving ensemble scenes to weekends will create significant gaps in the weekday schedule where only the core trio remains. I will consolidate these core trio scenes onto the available weekdays.

## Proposed Changes

### Production Data

#### [MODIFY] [production-data.json](file:///c:/Users/agonzalez7/film/pages/summer/production-data.json)
- Update `assignedDay` for all scenes to align with the new talent rules.
- Fix **Day 8** to June 27 (Saturday).
- Add **Day 9** as June 28 (Sunday).
- Shift subsequent weekdays (Monday, June 29 becomes Day 10, Tuesday, June 30 becomes Day 11, etc.).
- Group ensemble/Asher scenes on weekend Days (1, 2, 3, 4, 6, 8, 9, 13, 19).
- Group Core Trio (Dallas/Dominic/Makayla) scenes on weekday Days (5, 7, 10, 11, 12, 14, 15, 16, 17, 18).

## Open Questions

- **July 3rd/4th**: Currently, July 3rd is marked as a holiday (observed) and July 4th is omitted from the shoot calendar. Should we utilize Saturday, July 4th as a shoot day for the ensemble if needed?
- **Friday, June 19 (Juneteenth)**: This is currently a shoot day (Day 5). Should it be treated as a Weekend/Holiday (Ensemble OK) or a Weekday (Core Trio only)?

## Verification Plan

### Automated Tests
- Run a validation script to check every scene's assigned day against its character list and the calendar.
- Verify that no Day contains more than 1.0 `shootDays` total.
- Ensure the production page compiles successfully using `node compile-production.js`.

### Manual Verification
- Open the generated `production.html` and verify the "Schedule Overview" shows correct cast-to-day mappings.
- Check the individual cast pages for Asher and others to ensure their days are all Saturdays/Sundays.
