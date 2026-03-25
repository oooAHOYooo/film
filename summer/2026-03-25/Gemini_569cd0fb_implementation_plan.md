# Implementation Plan: Announcement Event Dates Enhancement

## Goal Description
Enhance the "event dates" field in the announcement creation section to provide a better calendar experience, potentially including Google Calendar-like features.

## User Decision
The user opted for **Option 1 (Enhanced Visual Calendar Picker)** as it is the most reliable, safest, and easiest to use without altering complex schema.

### Selected Option: Enhanced Visual Calendar Picker
Upgrades the current date and time text boxes into a beautiful, interactive popup calendar widget using **Flatpickr**. 
- **Features:** A modern, visual popup to select dates and times.
- **Impact:** No database changes required. Maximizes reliability.

### Option 2: Full Google Calendar Features (More Complex)
Adds support for **recurring events** (e.g., "Every Tuesday", "First Sunday of the month").
- **Features:** A robust UI where you can set repeating rules, generate multiple occurrences, and add end-dates for recurrences, similar to Google Calendar.
- **Impact:** Requires a database schema update (adding a recurrence rule column to the `Announcement` model) and significant changes to how events are displayed on the frontend to handle multiple dates.

## Proposed Changes (Based on Choice)

### If Option 1 (Visual Picker):
#### [MODIFY] `templates/admin/announcement_create.html`
- Inject Flatpickr JS/CSS.
- Target the `event_date`, `event_start_time`, and `event_end_time` fields to initialize the interactive calendar widgets.

### If Option 2 (Full Recurrence):
#### [MODIFY] `models.py`
- Add `recurrence_rule` string column to `Announcement` model (to store standard iCal RRULE strings).
#### [MODIFY] `app.py`
- Update `AnnouncementView` to handle the new recurrence field.
#### [NEW] `migrate_add_recurrence.py`
- Create a migration script to add the new column to SQLite/PostgreSQL.
#### [MODIFY] `templates/admin/announcement_create.html`
- Add a custom UI for selecting recurrence patterns (Daily, Weekly, Monthly, Custom).
#### [MODIFY] `frontend templates` (e.g. `events.html`)
- Update the logic that displays events to expand recurring rules into individual event instances on the calendar.

## Verification Plan
### Automated / Code Tests
- Run database migrations locally using safe scripts.
- Start the Flask app locally to ensure everything loads without errors.
### Manual Verification
- Open the Admin Dashboard -> Create Announcement.
- Verify the new calendar UI loads perfectly.
- Create an event and verify the dates/times are saved correctly to the database.
- (If Option 2) Test generating a repeating event and verify it shows up correctly on the frontend.
