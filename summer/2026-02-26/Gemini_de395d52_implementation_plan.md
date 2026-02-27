# Implementation Plan - Teaching Series Enhancements

Enable Pastor Craig to quickly create a teaching series with multiple sessions, manage all sessions inline before saving, use clearer "Deploy" terminology, and understand Render's deployment behavior.

## User Review Required

> [!IMPORTANT]
> **1. Inline Class Setup ("Add X Classes")**: To allow the pastor to "control everything here before they save and deploy," I will enable **Inline Models** on the `TeachingSeries` admin form. This means there will be a section at the bottom of the series form where you can dynamically click "Add Teaching Series Session" as many times as you want, fill out their details (date, PDF, etc.) live, and then save the entire series and its sessions in one click.
> 
> **2. Terminology Updates**: I will update the global button from "Save All" to <i class="fas fa-rocket"></i> **Save & Deploy** and change the success messages where applicable.
> 
> **3. Render Deployment Question**: You mentioned *"I also want to make sure that the render is always pushing the latest commit instead of me having to manually do it"*. 
>    - **Important Clarification:** Adding *content* (like a new teaching series or classes) **does not require a GitHub commit or a Render deployment limit**. Your app uses a live PostgreSQL database on Render. When you click "Save & Deploy" in the admin panel, the content is saved to the live database and appears on the site instantly! You never have to manually push a commit just to add a new class or sermon.
>    - For actual *code* changes, Render relies on GitHub's "Auto-Deploy" feature. If you push code to GitHub (`git push`), Render will automatically rebuild and deploy it, provided the toggle is enabled in your Render dashboard.

## Proposed Changes

### Core Logic & Admin (`app.py`)

#### [MODIFY] [app.py](file:///c:/Users/agonzalez7/cpc-web-app/app.py)
- Enable `inline_models = (TeachingSeriesSession,)` inside `TeachingSeriesView` so sessions can be added directly on the series edit/create page.
- Remove the separate `QuickAddSessionsView` wizard, as the inline models will fulfill the "control everything here before they save" requirement perfectly.

### Admin Templates (`templates/admin`)

#### [MODIFY] [master.html](file:///c:/Users/agonzalez7/cpc-web-app/templates/admin/master.html)
- Change the global `Save All` button text to `Save & Deploy` to reflect the immediate nature of the updates.
- Update the comfort modal to say "Content Deployed Securely" and "Committed to Live Database".

### Verification Plan

### Manual Verification
1. Log in as `craig` (password: `mrCRAIG`).
2. Go to the Teaching Series admin -> Create New.
3. Observe the "Save & Deploy" button.
4. Add a series title, then scroll down to the "Teaching Series Sessions" inline section.
5. Click "Add Teaching Series Session" multiple times to add the classes, configuring titles and dates inline.
6. Click "Save & Deploy".
7. Verify all sessions were created and linked correctly on the live `/pastor-teaching` page.
