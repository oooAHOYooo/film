# Teaching Series Session Wizard Plan

## Proposed Changes

### [MODIFY] `app.py`
- Re-add `inline_models = (TeachingSeriesSession,)` to `TeachingSeriesView` so that Flask-Admin handles the nested session objects.

### [MODIFY] `templates/admin/teaching_series_create.html` and `templates/admin/teaching_series_edit.html`
- Add custom HTML/Javascript to these templates.
- **Wizard UI**:
  - Initially hide the default Flask-Admin `inline-model` container for sessions.
  - Present a custom input: "How many sessions/classes?" and a "Generate" button.
  - Upon clicking "Generate", loop `N` times and programmatically trigger the Flask-Admin "Add Session" link (`.inline-add-field`).
- Make the generated forms visible to the user, perhaps restyling them slightly so they look like a clean wizard list.
- Flask-Admin will naturally process the generated inputs on form save.

## Verification Plan

### Automated Tests
- No automated UI tests exist for this specific admin interaction.

### Manual Verification
1. Navigate to `/admin/teachingseries/new/`
2. Enter the Teaching Series details
3. Scroll down to the sessions section (wizard UI).
4. Enter `3` in the "How many classes?" input and click Generate.
5. Verify 3 session sub-forms appear.
6. Fill them out and click Save.
7. Navigate to the edit view and verify the sessions saved properly.
