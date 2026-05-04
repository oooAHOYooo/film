# Production Data Mega-Repo

Central hub for all production logistics, expenses, and media storage tracking for **Creatures in the Tall Grass**.

## Files

### `expenses.json`
Complete expense ledger across all projects (Summer, Spring, Autumn, Winter).
- **Structure**: Categories, amounts, dates, vendors, project/scene associations
- **Use**: Budget tracking, expense reports, category analysis
- **Update via CLI**: `film expense add ...`

### `logistics.json`
Production tasks, meetings, and logistics milestones.
- **Structure**: Priority levels, dates, project associations, status tracking
- **Use**: Production scheduling, task management, meeting notes
- **Update via CLI**: `film log add ...`

### `media-storage.json`
Inventory of all drives, storage, and media capacity tracking.
- **Structure**: Drive specs, capacity, usage, shoot-day associations
- **Use**: Storage planning, backup management, media archiving
- **Update via CLI**: `film drive add ...`, `film drive update ...`

## CLI Commands

All data syncs automatically with the film CLI (`film` command).

```bash
# Expenses
film expense add <amount> "<description>" --category <category> --date <date> --project <project>
film expense list [--summary] [--category <category>] [--project <project>]
film expense remove <id>

# Logistics
film log add "<task>" --date <date> --priority <priority> --project <project>
film log list [--pending] [--project <project>]
film log check <id>

# Storage
film drive add "<name>" <capacity> --type <type> --description "<description>"
film drive update "<name>" <used> --shoot-day "<day>"
film drive list
```

## Projects

- **Summer**: Main feature project (Creatures in the Tall Grass - Summer Arc)
- **Spring**: Spring Arc
- **Autumn**: Autumn Arc
- **Winter**: Winter Arc

## Data Flow

1. CLI commands update the SQLite database (`~/.config/barnacle/logistics.db`)
2. Mega-repo JSON files are the source of truth for reporting/analysis
3. Sync mechanism keeps CLI and mega-repo in sync

## Categories

### Expense Categories
- Camera/Gear
- Crew
- Location
- Props/Set
- Post-Production
- Transportation
- Catering
- Insurance
- Permits
- Other

### Task Categories
- Meeting
- Workshop
- Design
- Pre-Production
- Principal Photography
- Post-Production
- VFX
- Sound
- Location Scout
- Equipment Test
- Admin

## Future Extensions

- Scene-level expense tracking (tie costs to specific scenes)
- Budget forecasting and variance analysis
- Crew scheduling and rate management
- Location scout/permit tracking
- Equipment rental/purchase decision trees
