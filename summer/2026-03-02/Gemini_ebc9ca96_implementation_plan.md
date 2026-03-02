# Connect Local Environment to Remote PostgreSQL

This plan outlines how to connect your local development environment to the remote Render PostgreSQL database so you can work with live data.

## Proposed Changes

### Configuration
#### [NEW] [.env](file:///c:/Users/agonzalez7/cpc-web-app/.env)
- Create a new `.env` file in the root directory.
- Add the `DATABASE_URL` with the external connection string provided by the user.

## Verification Plan

### Manual Verification
1.  **Restart Server**: Stop the current running server (`python app.py`) and restart it.
2.  **Verify Logs**: Check the terminal output for the log message: `DB init: engine=postgresql host=... dbname=...`. This confirms the app is using the PostgreSQL engine.
3.  **Check Data**: Access the local admin dashboard (usually at `http://localhost:5000/admin`) and verify that all entries from the remote database are visible.
4.  **Test Health Endpoint**: Visit `http://localhost:5000/healthz` to confirm the database status is "ok".
