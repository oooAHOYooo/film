# Task Plan: Enhance Announcement Event Dates

## Objective
Update the announcement creation section so the event dates field uses a calendar picker and potentially supports recurring/advanced scheduling features similar to Google Calendar.

## Checklist
- [x] Requirements gathering
  - [x] Inspect `Announcement` model in `models.py` to see how dates/times are currently stored. (Uses Date and String fields)
  - [x] Inspect Flask-Admin configuration for `AnnouncementView` to see what widget is currently used. (Uses basic DatePickerField)
- [x] Determine implementation approach
  - [x] Proceeding with the simpler visual date/time picker (Flatpickr) based on user preference for reliability.
  - [x] No complex recurring models or database changes are needed.
- [x] Implement enhanced widget
  - [x] Modify `models.py` / `admin_management.py` (or similar) to integrate the enhanced widget into the admin interface. (Injected via template)
  - [x] Add necessary CSS/JS. (Added Flatpickr to `admin/announcement_create.html` and `submit_announcement.html`)
  - [x] Refined Flask-Admin WTForms config to use standard `DateField` and renamed label to 'Add an event date'.
- [ ] Verify functionality
  - [ ] Test creating a new announcement with enhanced date fields.
  - [ ] Verify frontend display of announcements handles the new date formats correctly.
