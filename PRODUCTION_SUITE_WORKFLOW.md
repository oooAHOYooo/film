# Production Suite Creation Workflow
**For Replicating Nibbler Model on Other Projects (e.g., Lantern)**

---

## Overview

This is the step-by-step process used to create the complete Nibbler production suite. It's designed to be repeatable for other film projects (Lantern, etc.) without overwhelming your workflow.

**Total Steps:** 7 (can be done in one or two focused work sessions)  
**Output:** 4 markdown documents + 1 HTML dashboard + updated hub link  
**Time to Complete:** 4-6 hours per project

---

## Step 1: Understand Your Project Constraints

**Before you start writing, confirm:**

- [ ] Total budget (real number, not ideal)
- [ ] Cast model (paid professionals? friends? hybrid?)
- [ ] Location model (venue rentals? volunteers? public access?)
- [ ] Shoot schedule (how many days? which dates?)
- [ ] Scope (how many episodes/scenes? total runtime?)
- [ ] Equipment available (owned? borrowed? rented?)
- [ ] Post-production plan (in-house? outsourced? timeline?)

**For Lantern example:**
- Budget: $[X]
- Cast: [paid/friends/mixed]
- Locations: [owned/volunteer/rented]
- Days: [14/21/10]
- Episodes: [how many]
- Equipment: [what access]

*Save this as a reference. Write it down. You'll reference it constantly.*

---

## Step 2: Create the Shooting Schedule Document

**File:** `pages/[project]/production/[PROJECT]_SHOOTING_SCHEDULE.md`

**Structure (Copy-Paste Template):**

```markdown
# [PROJECT] — [X]-Day Shooting Schedule
**[DATES] Production**

## Production Overview
| Field | Value |
|---|---|
| Project | [Name] |
| Format | [episodes/type] |
| Total Scenes | [number] |
| Schedule | [X] Days ([dates]) |
| Crew Size | [estimate] |
| Primary Locations | [number] |

## Location Breakdown
### Loc. 1: [Name]
- Type: [interior/exterior/both]
- Scenes: [list scene numbers]
- Setup: [what's needed]
- **Cinematography:** [approach]

[Repeat for each location]

## [X]-Day Shooting Schedule

### **DAY 1 — [Date]**
**Location: [Name]**
| Time | Scene | Episode | Shots | Notes |
|---|---|---|---|---|
| [time] | [scene] | [ep] | [count] | [detail] |

[Continue for each day]

## Location Summary Table
[Table of all locations by day]

## Crew Allocation by Shoot Day
[Table showing crew size per day]

## Total Production Location Budget
[Summary of costs if applicable]

## Key Locations / Cinematography Notes
[Specific guidance for DP/director]
```

**Tips:**
- List every scene with episode, time, and location
- Include crew count needed per day (varies by location)
- Add cinematography notes (special equipment, wide shots, etc.)
- Break down by location so you can see when you'll be where
- Include travel/setup/breakdown time in schedule

**For Lantern:**
- How many episodes?
- How many scenes per episode?
- What are the distinct locations?
- Any night/action sequences requiring special crew?

---

## Step 3: Create the Location List Document

**File:** `pages/[project]/production/[PROJECT]_LOCATION_LIST.md`

**Structure (Copy-Paste Template):**

```markdown
# [PROJECT] — Location List
**[DATES] Production**

## Location Directory
| # | Location | Type | Usage | Days | Priority | Status |
|---|---|---|---|---|---|---|
| 1 | [Name] | [int/ext] | [scenes] | [days] | [priority] | Scouting |

## Location 1: [Name]

### **Physical Description**
- **Type:** [interior/exterior, time of day]
- **Dimensions:** [size, relevant details]
- **Scenes:** [list]
- **Shoot Days:** [which days]
- **Estimated Runtime:** [minutes]

### **Location Requirements**
- [Equipment needed]
- [Furniture/fixtures]
- [Practical elements]

### **Cinematography Specs**
- **Primary Setup:** [camera placement]
- **Key Shots:** [what matters]
- **Lighting Approach:** [how to light it]
- **Color Palette:** [aesthetic]

### **Practical Needs**
- **Electrical:** [outlet requirements]
- **Parking:** [how many spaces]
- **Permits:** [what's needed]
- **Access Hours:** [when available]

### **Scout Notes**
- **Ideal:** [what you're looking for]
- **Preferred:** [secondary options]
- **Must-Have:** [non-negotiables]
- **Avoid:** [problems to watch for]

### **Budget Estimate**
- **Location Fee:** $[X]
- **Permits:** $[X]
- [other line items]

[Repeat for each location]

## Location Summary Table
[All locations with budget totals]
```

**Tips:**
- One detailed section per location
- Include access restrictions, hours, owner contact info
- Add scout notes (what to look for, what works/doesn't)
- Budget is important — even if volunteer, note that
- Include safety concerns (water access, traffic, etc.)
- Each location should have clear "why this matters" for cinematography

**For Lantern:**
- Which locations are easy/hard to access?
- Any locations you already have locked?
- Permit requirements for your area?
- Environmental/safety concerns?

---

## Step 4: Create the Cast & Crew Document

**File:** `pages/[project]/production/[PROJECT]_CAST_CREW.md`

**Structure (Copy-Paste Template):**

```markdown
# [PROJECT] — Cast & Crew
**[DATES] Production**

## Production Overview
| Field | Value |
|---|---|
| Production | [Name] |
| Format | [format] |
| Total Budget | $[amount] |
| Crew Size | [X-Y] |

# CAST

## Principal Cast

### **[CHARACTER NAME]**
- **Role:** [brief description]
- **Episode Appearances:** [which episodes]
- **Key Scenes:** [list]
- **Character Description:** [2-3 sentences, age, look, voice]
- **Actor Requirements:** [what actor needs to do]
- **Screen Time:** [duration]
- **Availability:** [days/schedule]

[Repeat for each principal cast member]

## Supporting Cast / Extras
[Brief descriptions]

# CREW

## Executive Leadership
### **Producer**
[Responsibilities, reports to, availability]

### **Line Producer**
[Responsibilities, reports to, availability]

## Creative Leadership
### **Director**
[Responsibilities, key collaborators, availability]

## Production Management
### **1st Assistant Director (1st AD)**
[Responsibilities, reports to, team size]

### **2nd Assistant Director (2nd AD)**
[Responsibilities]

### **Production Coordinator**
[Responsibilities]

[Continue for each department: Camera, Lighting, Grip, Sound, Design, Costume, Makeup, Stunt, Post-Production]

## Crew Allocation by Shoot Day
| Day | Location | Crew Count | Key Departments |
|---|---|---|---|

## Budget Summary — Cast & Crew
| Category | Estimated Cost |
|---|---|
| Principal Cast | $[X] |
| Supporting Cast | $[X] |
| Extras & Background | $[X] |
| Core Crew | $[X] |
| Post-Production Crew | $[X] |
| **TOTAL** | **$[X]** |

## Casting Notes
[Actor type descriptions, audition focus, comparable actors]

## Casting Timeline
| Week | Task |
|---|---|

## Union & Contracts
[SAG-AFTRA, IATSE, local considerations]
```

**Tips:**
- For each role (cast or crew), include: responsibilities, screen time/availability, key requirements
- Be specific about what each person does
- Crew allocation varies by day (more people for big locations)
- Budget is important even if theoretical
- Casting notes help you find the right people later
- If your project is volunteer-based, note that explicitly

**For Lantern:**
- How many principal actors?
- What's your actual cast/crew budget?
- Are crew members paid or volunteer?
- Which positions are absolutely critical?

---

## Step 5: Create the Micro-Budget or Production Approach Document

**File:** `pages/[project]/production/[PROJECT]_PRODUCTION_PLAN.md`

**Structure (copy the sections relevant to YOUR project):**

```markdown
# [PROJECT] — Production Plan
**[DATES] Production**

## Production Overview
[Stats: budget, schedule, cast model, locations, approach]

## Budget Breakdown
[Detailed line-by-line if real budget, or realistic constraints]

## What This Means
[For cast: unpaid/paid/hybrid?]
[For locations: volunteer/rental/owned?]
[For equipment: borrowed/owned/rented?]
[For crew: core team vs. guest volunteers?]

## Realistic Crew Structure
[Minimum crew to make it work]
[Which positions are essential vs. nice-to-have]
[How people wear multiple hats]

## Cast — [Model]
[Character-by-character: requirements, availability, commitment level]

## Locations — All [Model]
[For each location: access model, arrangement, any special requirements]

## Schedule & Logistics
[How you'll actually organize 14+ days]
[Daily crew breakdowns]
[Boatyard-specific scheduling (if applicable)]

## Modified Production Approach
[What you're simplifying vs. professional productions]
[Where you're doubling down]
[Realistic narrative adjustments if budget/time forces cuts]

### **Option 1: Full Script, Scaled Production**
[If doing complete story with limited resources]

### **Option 2: Abbreviated Version**
[If you need to cut scope to be realistic]

### **Option 3: Micro-Series Format**
[If shorter episodes make sense]

## Reality Check: What You CAN/CANNOT Do
✓ [What's realistic]
✗ [What's not]

## Revised Schedule — [Your Model] Friendly
[Day-by-day breakdown, but realistic for YOUR constraints]

## Equipment Checklist (Borrowed/Owned)
### **Camera**
- [ ] [what you have/can borrow]

### **Audio**
- [ ] [lav mic, recorder, etc.]

### **Lighting**
- [ ] [what's available]

[etc.]

## Post-Production on [Your Budget]
[Software approach (free or cheap)]
[Timeline]
[Realistic expectations]

## Expectations & Realities
[What it will look like]
[What will make it work]
[What will be challenging]

## Timeline to Production
[Week-by-week from now until premiere]

## Critical Recommendations
[Your top 5-10 things that must happen for success]
```

**Tips:**
- This document is where you get REAL about your actual constraints
- Be honest about budget, schedule, crew availability
- List what's feasible with your resources (don't aim for feature quality on indie budget)
- Recommend alternatives if full scope doesn't work
- Timeline is important — when do you need to lock things?
- Success factors section should be deeply practical

**For Lantern:**
- What's your actual budget?
- How realistic is your proposed schedule?
- Any production constraints you're not saying out loud?
- What's the one thing that MUST go right?

---

## Step 6: Create the Production Dashboard HTML

**File:** `pages/[project]/production/index.html`

**Structure (Use as Template):**

```html
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>[PROJECT] Production — [DATES]</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        [COPY entire style block from nibbler/production/index.html — customize colors if desired]
    </style>
</head>
<body>
    <div class="header-nav">
        <a href="../../[project].html">← [PROJECT] Hub</a>
        <a href="../treatment.md">Treatment ↗</a>
    </div>

    <div class="hero">
        <p class="hero-eyebrow">[Format descriptor] · [Dates]</p>
        <h1>[PROJECT] Production</h1>
        <p class="subtitle">[Budget] · [Model]</p>
        <p class="meta">[X] Days · [Episodes/Scenes] · [Approach]</p>
    </div>

    <!-- Production Stats -->
    <div class="section-container">
        <p class="section-title">Overview</p>
        <div class="stat-row">
            <div class="stat">
                <div class="stat-number">[X]</div>
                <div class="stat-label">Shooting Days</div>
            </div>
            <div class="stat">
                <div class="stat-number">[X]</div>
                <div class="stat-label">Total Scenes</div>
            </div>
            <div class="stat">
                <div class="stat-number">$[X]</div>
                <div class="stat-label">Total Budget</div>
            </div>
            <div class="stat">
                <div class="stat-number">[X]</div>
                <div class="stat-label">Primary Locations</div>
            </div>
        </div>

        <div class="feature-banner">
            <h3>[Your Production Approach]</h3>
            <p>[2-3 sentence summary of what makes this production unique]</p>
        </div>
    </div>

    <!-- Production Documents -->
    <div class="section-container">
        <p class="section-title">Production Documents</p>
        <div class="card-grid">
            <a class="card" href="[PROJECT]_SHOOTING_SCHEDULE.md">
                <div class="card-icon">📅</div>
                <h3>[X]-Day Shooting Schedule</h3>
                <p>[Brief description]</p>
                <div class="card-meta">[size]KB · Markdown</div>
            </a>

            <a class="card" href="[PROJECT]_LOCATION_LIST.md">
                <div class="card-icon">📍</div>
                <h3>Location List & Scouting</h3>
                <p>[Brief description]</p>
                <div class="card-meta">[size]KB · Markdown</div>
            </a>

            <a class="card" href="[PROJECT]_PRODUCTION_PLAN.md">
                <div class="card-icon">💰</div>
                <h3>Production Plan</h3>
                <p>[Brief description]</p>
                <div class="card-meta">[size]KB · Markdown</div>
            </a>

            <a class="card" href="[PROJECT]_CAST_CREW.md">
                <div class="card-icon">👥</div>
                <h3>Cast & Crew</h3>
                <p>[Brief description]</p>
                <div class="card-meta">[size]KB · Markdown</div>
            </a>
        </div>
    </div>

    <!-- Key Production Info -->
    <div class="section-container">
        <p class="section-title">Production Essentials</p>
        [Copy info-grid structure, customize 8 boxes for your project]
    </div>

    <!-- Production Timeline -->
    <div class="section-container">
        <p class="section-title">Timeline</p>
        [Copy timeline structure, customize for your dates]
    </div>

    <!-- Cast / Resources / etc -->
    [Add sections relevant to your project]

    <!-- Footer -->
    <div class="footer">
        <a href="../../[project].html">[PROJECT] Hub</a> · 
        <a href="../../">Film Vault</a> · [DATES] · [Studio Name]
    </div>
</body>
</html>
```

**Tips:**
- Copy nibbler/production/index.html entirely and modify
- Change hero section (title, dates, budget, approach)
- Update all card links to your document names
- Customize the info grid (8 boxes) for your project's key details
- Update timeline based on your actual dates
- Change footer links and branding
- Colors can stay same or customize to match your project hub

**For Lantern:**
- What are the 4 key stats to show upfront?
- What's your timeline from now to premiere?
- What 8 "essentials" should the dashboard highlight?

---

## Step 7: Update Your Project Hub & Commit

### **Update Your Project Hub HTML**

**File:** `pages/[project].html`

**Find the "Project Resources" section and add:**

```html
<a class="nav-card" href="[project]/production/">
    <h4>Production Dashboard</h4>
    <p>[Brief description of your production dates, budget, approach]</p>
</a>
```

**Then commit everything:**

```bash
# From repo root
git add pages/[project]/production/
git add pages/[project].html
git commit -m "Create [PROJECT] production suite

Production documents:
  - Shooting schedule ([X] days)
  - Location list ([X] locations)
  - Production plan ([budget/approach])
  - Cast & crew breakdown

Production dashboard (index.html):
  - Stats overview
  - Document links
  - Production essentials
  - Timeline
  - Cast & approach

Updated [project].html hub with production dashboard link.

Co-Authored-By: Claude [version]"

git push -u origin [branch-name]
```

---

## Checklist for Each Project

**Before You Start:**
- [ ] Know your actual budget
- [ ] Know your actual schedule (dates + days)
- [ ] Know your cast model (paid/friends/hybrid)
- [ ] Know your location model (owned/volunteer/rented)
- [ ] Know your scope (episodes, scenes, runtime)
- [ ] Know your equipment situation

**Step 1: Shooting Schedule**
- [ ] List all scenes with episode + times
- [ ] Assign each scene to a location + day
- [ ] Add crew count needed per day
- [ ] Add cinematography notes per location
- [ ] Create summary tables

**Step 2: Location List**
- [ ] Detail each location (physical, requirements, specs)
- [ ] Include scout notes for each
- [ ] Add budget if applicable
- [ ] Note access restrictions, hours, permits
- [ ] Include safety concerns

**Step 3: Cast & Crew**
- [ ] Describe each principal actor (role, requirements, availability)
- [ ] List crew positions (can copy from Nibbler, customize)
- [ ] Add crew allocation by day (varies by location)
- [ ] Include budget or explain model (volunteer/paid)
- [ ] Add casting notes if hiring

**Step 4: Production Plan**
- [ ] Be honest about budget constraints
- [ ] Explain cast model clearly
- [ ] Describe location situation
- [ ] List equipment available/needed
- [ ] Add realistic options if full scope is too much
- [ ] Timeline from now to premiere
- [ ] Critical success factors

**Step 5: Production Dashboard HTML**
- [ ] Copy nibbler version, customize colors/content
- [ ] Add hero section (title, dates, approach)
- [ ] Update card links to your documents
- [ ] Customize info grid (8 essential stats/info)
- [ ] Update timeline section
- [ ] Fix footer links and branding

**Step 6: Update Project Hub**
- [ ] Add production dashboard link to nav cards
- [ ] Make sure link path is correct
- [ ] Test link works

**Step 7: Commit & Push**
- [ ] Add all production files
- [ ] Commit with clear message
- [ ] Push to new branch or main
- [ ] Verify on GitHub

---

## Time Estimate by Document

| Document | Time | Notes |
|---|---|---|
| Shooting Schedule | 90-120 min | Depends on scene count |
| Location List | 60-90 min | One per location × detail level |
| Production Plan | 45-60 min | Faster if you already know your constraints |
| Cast & Crew | 60-90 min | Can copy/adapt from Nibbler template |
| Dashboard HTML | 20-30 min | Copy nibbler version, customize |
| Hub Update + Git | 10-15 min | Quick link + commit |
| **TOTAL** | 285-405 min (4.5-6.5 hrs) | Can be done in 1-2 work sessions |

---

## Notes for Lantern Specifically

When you're ready to do this for Lantern:

1. **Confirm your actual constraints** (budget, schedule, locations)
2. **Start with the Shooting Schedule** (hardest part, but it informs everything else)
3. **Location List comes second** (you know where you'll be from schedule)
4. **Production Plan is easier** (you've defined everything, now just explain reality)
5. **Cast & Crew can reference Nibbler** (much of structure is template-able)
6. **Dashboard HTML is mostly copy-paste** (just customize the content)
7. **Hub update is a two-minute link addition**

---

## Questions to Answer Before Starting

**Budget:**
- What's the real number?
- Who pays for what?
- Is cast paid or volunteer?
- Are locations free or rented?

**Schedule:**
- How many days can you actually shoot?
- Which dates work for everyone?
- Any constraints (weather, location availability, actor conflicts)?

**Scope:**
- How many episodes or scenes?
- What's your target runtime?
- Can you cut anything if needed?

**Equipment:**
- What do you have?
- What can you borrow?
- What must you rent?

**Locations:**
- How many distinct places?
- Are they already locked?
- Any special permits needed?

**Cast:**
- Professional actors?
- Friends/locals?
- How available are they?

**Crew:**
- How many core people?
- Paid or volunteer?
- Any specialized skills needed?

---

## Final Note

This workflow is linear but flexible. You can:
- Work on documents in different order
- Start rough and polish later
- Update as constraints change
- Reference Nibbler version as template for any section

The goal is **clear documentation** that lets you see the entire production at a glance, make informed decisions, and communicate with your team.

For Lantern, you can move through this in 1-2 focused work sessions without cluttering your chat. Just follow the steps, use this as a reference, and build out each document section by section.

**Good luck. You've got this.**

---

**Created:** July 9, 2026  
**Template Project:** Nibbler (September 2026 micro-budget production)  
**For:** Replication on Lantern + other projects

