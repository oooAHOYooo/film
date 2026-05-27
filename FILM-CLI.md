# Film Production CLI

Simple, fast production tracking for **Creatures in the Tall Grass** — manage expenses and production todos.

## Quick Start

All expenses are stored in `.film-expenses.json` in the project root.

### Add an Expense

```bash
npm run film add <price> <category> "<memo>" [--date YYYY-MM-DD]
```

**Example:**
```bash
npm run film add 150.00 "Props/Set" "Fake blood and bandages"
npm run film add 89.50 "Props/Set" "Weathered clothing" --date 2026-05-27
```

### View All Expenses

```bash
npm run film list [--category <category>]
```

### Get Quick Statistics

```bash
npm run film stats
npm run film stats --category "Props/Set"
```

### Remove an Expense

```bash
npm run film remove <expense-id>
```

## Production Todos

Track real-world tasks while developing the story and storyboard.

### Add a Todo

```bash
./film.js todo add "<task>" [--priority high|medium|low] [--due YYYY-MM-DD]
```

**Example:**
```bash
./film.js todo add "Scout forest location for scene 9" --priority high
./film.js todo add "Design Dallas costume" --priority medium --due 2026-06-15
./film.js todo add "Finalize shot list" --priority low
```

### View Todos

```bash
./film.js todo list                    # All todos (sorted by priority)
./film.js todo list --pending          # Only incomplete todos
./film.js todo list --priority high    # Filter by priority
```

### Check Off a Todo

```bash
./film.js todo check <id>              # Toggle complete/incomplete
./film.js todo remove <id>             # Delete a todo
```

**Priority Levels:** `high` (!) | `medium` (•) | `low` (-)

Todos are stored in `.film-todos.json` and sorted by priority and due date.

## Available Expense Categories

- `Props/Set`
- `Camera/Gear`
- `Crew`
- `Location`
- `Post-Production`
- `Transportation`
- `Catering`
- `Insurance`
- `Permits`
- `Other`

## API Mode (for GPT/Agents)

Start the API server:

```bash
npm run film:api
```

Server runs on `http://localhost:3333`

### API Endpoints

**Add Expense**
```bash
curl -X POST http://localhost:3333/expense \
  -H "Content-Type: application/json" \
  -d '{
    "price": 150.00,
    "category": "Props/Set",
    "memo": "Fake blood and bandages",
    "date": "2026-05-27"
  }'
```

**List Expenses**
```bash
curl http://localhost:3333/expenses
curl http://localhost:3333/expenses?category=Props/Set
```

**Get Statistics**
```bash
curl http://localhost:3333/stats
```

**Remove Expense**
```bash
curl -X DELETE http://localhost:3333/expense/3
```

## JSON Format

Expenses are stored in `.film-expenses.json`:

```json
{
  "project": "Creatures in the Tall Grass",
  "expenses": [
    {
      "id": 1,
      "date": "2026-05-27",
      "memo": "Fake blood and bandages",
      "category": "Props/Set",
      "price": 150.00
    },
    {
      "id": 2,
      "date": "2026-05-27",
      "memo": "Weathered clothing and costume pieces",
      "category": "Props/Set",
      "price": 89.50
    }
  ],
  "categories": ["Props/Set", "Camera/Gear", "..."]
}
```

## Data Files

All data is stored as JSON in your project root for easy tracking and version control:

- **`.film-expenses.json`** — All expense records with category, price, date, memo
- **`.film-todos.json`** — All production tasks with priority, due dates, completion status

## Integration with Claude Code

You can ask Claude Code to:
- "Add a $150 prop expense for fake blood"
- "Show me the expense stats"
- "List high-priority todos"
- "Add a todo to scout the forest location"
- "Check off todo #1"
- "Show me what's pending"

Claude will execute the appropriate commands automatically.
