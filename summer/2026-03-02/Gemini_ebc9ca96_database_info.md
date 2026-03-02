# Database Connection Information

You are seeing fewer entries than Chris because your local development server is connected to a **local SQLite database**, while Chris (and the live website) are connected to the **remote Render PostgreSQL database**.

## How to Verify Your Connection

When you start your server with `python app.py`, look at the first few lines of the terminal output. You should see a log message like:

`DB init: engine=sqlite host=localhost dbname=cpc_newhaven.db`

If it says `engine=sqlite`, you are interacting with the local file located at `instance/cpc_newhaven.db`. Changes you make here will **not** appear on the live site, and you won't see data entered by others on the live site.

## How to Connect to the Remote Database

If you want to see the "real" data locally, you need to tell your application where the remote database is:

1.  **Get the URL**: Log into your Render dashboard, go to the `cpc-newhaven-db` PostgreSQL service, and find the **External Database URL**.
2.  **Create a `.env` file**: In your project's root folder (`cpc-web-app`), create a file named `.env` (if it doesn't already exist).
3.  **Add the variable**: Add the following line to the `.env` file:
    ```env
    DATABASE_URL=postgres://your_username:your_password@your_host.render.com/your_dbname
    ```
4.  **Restart**: Stop and restart your local server. The logs should now show:
    `DB init: engine=postgresql host=... dbname=...`

> [!WARNING]
> When connected to the remote database, any changes you make in your local admin panel **will affect the live website**. Use caution when editing or deleting entries!
