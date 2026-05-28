#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const EXPENSES_FILE = path.join(process.cwd(), '.film-expenses.json');
const TODOS_FILE = path.join(process.cwd(), '.film-todos.json');
const DATA_LOCATIONS_FILE = path.join(process.cwd(), '.film-data-locations.json');
const PROJECT = 'Creatures in the Tall Grass';

// Initialize expenses file if it doesn't exist
function initFile() {
  if (!fs.existsSync(EXPENSES_FILE)) {
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify({
      project: PROJECT,
      expenses: [],
      categories: [
        'Props/Set',
        'Camera/Gear',
        'Crew',
        'Location',
        'Post-Production',
        'Transportation',
        'Catering',
        'Insurance',
        'Permits',
        'Other'
      ]
    }, null, 2));
  }
  if (!fs.existsSync(TODOS_FILE)) {
    fs.writeFileSync(TODOS_FILE, JSON.stringify({
      project: PROJECT,
      todos: []
    }, null, 2));
  }
  if (!fs.existsSync(DATA_LOCATIONS_FILE)) {
    fs.writeFileSync(DATA_LOCATIONS_FILE, JSON.stringify({
      project: PROJECT,
      locations: []
    }, null, 2));
  }
}

function getExpenses() {
  initFile();
  return JSON.parse(fs.readFileSync(EXPENSES_FILE, 'utf8'));
}

function saveExpenses(data) {
  fs.writeFileSync(EXPENSES_FILE, JSON.stringify(data, null, 2));
}

function getTodos() {
  initFile();
  return JSON.parse(fs.readFileSync(TODOS_FILE, 'utf8'));
}

function saveTodos(data) {
  fs.writeFileSync(TODOS_FILE, JSON.stringify(data, null, 2));
}

function getDataLocations() {
  initFile();
  return JSON.parse(fs.readFileSync(DATA_LOCATIONS_FILE, 'utf8'));
}

function saveDataLocations(data) {
  fs.writeFileSync(DATA_LOCATIONS_FILE, JSON.stringify(data, null, 2));
}

function formatDate(dateStr) {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  return dateStr;
}

function addExpense(args) {
  if (args.length < 3) {
    console.error('Usage: film add <price> <category> "<memo>" [--date YYYY-MM-DD]');
    console.error('Example: film add 150.00 "Props/Set" "Fake blood and bandages" --date 2026-05-27');
    process.exit(1);
  }

  const price = parseFloat(args[0]);
  const category = args[1];
  const memo = args[2];

  let date = new Date().toISOString().split('T')[0];
  for (let i = 3; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      date = args[i + 1];
      i++;
    }
  }

  if (isNaN(price)) {
    console.error('Error: price must be a number');
    process.exit(1);
  }

  const data = getExpenses();
  const id = data.expenses.length > 0 ? Math.max(...data.expenses.map(e => e.id)) + 1 : 1;

  const expense = {
    id,
    date,
    memo,
    category,
    price: parseFloat(price.toFixed(2))
  };

  data.expenses.push(expense);
  saveExpenses(data);

  console.log(`✓ Added expense: $${price.toFixed(2)} | ${category} | ${memo} (${date})`);
}

function listExpenses(args) {
  const data = getExpenses();
  let expenses = [...data.expenses];

  // Filter by category
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      expenses = expenses.filter(e => e.category === args[i + 1]);
      i++;
    }
  }

  if (expenses.length === 0) {
    console.log('No expenses found.');
    return;
  }

  // Sort by date (newest first)
  expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log('\n' + PROJECT);
  console.log('─'.repeat(80));
  console.log('Date       │ Category        │ Memo                          │ Price');
  console.log('─'.repeat(80));

  let total = 0;
  expenses.forEach(e => {
    const pad = (str, len) => str.padEnd(len).substring(0, len);
    const datePad = pad(e.date, 10);
    const catPad = pad(e.category, 15);
    const memoPad = pad(e.memo, 29);
    const pricePad = `$${e.price.toFixed(2)}`.padStart(8);

    console.log(`${datePad} │ ${catPad} │ ${memoPad} │ ${pricePad}`);
    total += e.price;
  });

  console.log('─'.repeat(80));
  console.log(`Total: $${total.toFixed(2)}`);
  console.log();
}

function getStats(args) {
  const data = getExpenses();
  const expenses = data.expenses;

  if (expenses.length === 0) {
    console.log('No expenses recorded yet.');
    return;
  }

  let filterCat = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--category' && args[i + 1]) {
      filterCat = args[i + 1];
      i++;
    }
  }

  let filtered = filterCat
    ? expenses.filter(e => e.category === filterCat)
    : expenses;

  const stats = {
    totalExpenses: filtered.reduce((sum, e) => sum + e.price, 0),
    count: filtered.length,
    byCategory: {}
  };

  filtered.forEach(e => {
    if (!stats.byCategory[e.category]) {
      stats.byCategory[e.category] = { total: 0, count: 0 };
    }
    stats.byCategory[e.category].total += e.price;
    stats.byCategory[e.category].count += 1;
  });

  console.log('\n' + PROJECT);
  console.log('Expense Statistics');
  console.log('─'.repeat(50));
  console.log(`Total Expenses: $${stats.totalExpenses.toFixed(2)}`);
  console.log(`Item Count: ${stats.count}`);
  console.log();

  if (Object.keys(stats.byCategory).length > 0) {
    console.log('By Category:');
    Object.entries(stats.byCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .forEach(([cat, data]) => {
        console.log(`  ${cat.padEnd(15)} $${data.total.toFixed(2).padStart(10)} (${data.count} items)`);
      });
  }
  console.log();
}

function remove(args) {
  if (!args[0]) {
    console.error('Usage: film remove <expense-id>');
    process.exit(1);
  }

  const id = parseInt(args[0]);
  const data = getExpenses();
  const index = data.expenses.findIndex(e => e.id === id);

  if (index === -1) {
    console.error(`Expense #${id} not found`);
    process.exit(1);
  }

  const removed = data.expenses.splice(index, 1)[0];
  saveExpenses(data);
  console.log(`✓ Removed: ${removed.memo} ($${removed.price.toFixed(2)})`);
}

// ============ TODO FUNCTIONS ============

function addTodo(args) {
  if (args.length < 1) {
    console.error('Usage: film todo add "<task>" [--priority high|medium|low] [--due YYYY-MM-DD]');
    process.exit(1);
  }

  const task = args[0];
  let priority = 'medium';
  let due = null;

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--priority' && args[i + 1]) {
      priority = args[i + 1];
      i++;
    } else if (args[i] === '--due' && args[i + 1]) {
      due = args[i + 1];
      i++;
    }
  }

  const data = getTodos();
  const id = data.todos.length > 0 ? Math.max(...data.todos.map(t => t.id)) + 1 : 1;

  const todo = {
    id,
    task,
    priority,
    due,
    completed: false,
    createdAt: new Date().toISOString().split('T')[0]
  };

  data.todos.push(todo);
  saveTodos(data);

  console.log(`✓ Todo #${id}: ${task} [${priority}]${due ? ` (due: ${due})` : ''}`);
}

function listTodos(args) {
  const data = getTodos();
  let todos = [...data.todos];

  let showPending = false;
  let filterPriority = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--pending') {
      showPending = true;
    } else if (args[i] === '--priority' && args[i + 1]) {
      filterPriority = args[i + 1];
      i++;
    }
  }

  if (showPending) {
    todos = todos.filter(t => !t.completed);
  }

  if (filterPriority) {
    todos = todos.filter(t => t.priority === filterPriority);
  }

  if (todos.length === 0) {
    console.log('No todos found.');
    return;
  }

  // Sort by priority, then by due date
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  todos.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    if (a.due && b.due) return a.due.localeCompare(b.due);
    return a.id - b.id;
  });

  console.log('\n' + PROJECT);
  console.log('Production Tasks');
  console.log('─'.repeat(90));

  let pending = 0;
  todos.forEach(t => {
    if (!t.completed) pending++;
    const checkmark = t.completed ? '✓' : ' ';
    const priColor = t.priority === 'high' ? '!' : (t.priority === 'low' ? '-' : '•');
    const dueStr = t.due ? ` (due: ${t.due})` : '';
    const completed = t.completed ? ' [DONE]' : '';
    console.log(`[${checkmark}] #${String(t.id).padStart(2)} ${priColor} ${t.task}${dueStr}${completed}`);
  });

  console.log('─'.repeat(90));
  console.log(`${pending} pending, ${todos.length - pending} done`);
  console.log();
}

function checkTodo(args) {
  if (!args[0]) {
    console.error('Usage: film todo check <id>');
    process.exit(1);
  }

  const id = parseInt(args[0]);
  const data = getTodos();
  const todo = data.todos.find(t => t.id === id);

  if (!todo) {
    console.error(`Todo #${id} not found`);
    process.exit(1);
  }

  todo.completed = !todo.completed;
  saveTodos(data);

  const status = todo.completed ? 'completed' : 'reopened';
  console.log(`✓ Todo #${id} ${status}: ${todo.task}`);
}

function removeTodo(args) {
  if (!args[0]) {
    console.error('Usage: film todo remove <id>');
    process.exit(1);
  }

  const id = parseInt(args[0]);
  const data = getTodos();
  const index = data.todos.findIndex(t => t.id === id);

  if (index === -1) {
    console.error(`Todo #${id} not found`);
    process.exit(1);
  }

  const removed = data.todos.splice(index, 1)[0];
  saveTodos(data);
  console.log(`✓ Removed: ${removed.task}`);
}

// ============ DATA LOCATIONS FUNCTIONS ============

function addDataLocation(args) {
  if (args.length < 2) {
    console.error('Usage: film data add "<location>" "<description>" [--date YYYY-MM-DD]');
    console.error('Example: film data add "Commercial Work" "Test footage from Jerry\'s" --date 2026-05-25');
    process.exit(1);
  }

  const location = args[0];
  const description = args[1];

  let date = new Date().toISOString().split('T')[0];
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--date' && args[i + 1]) {
      date = args[i + 1];
      i++;
    }
  }

  const data = getDataLocations();
  const id = data.locations.length > 0 ? Math.max(...data.locations.map(l => l.id)) + 1 : 1;

  const entry = {
    id,
    date,
    location,
    description,
    addedAt: new Date().toISOString()
  };

  data.locations.push(entry);
  saveDataLocations(data);

  console.log(`✓ Added location: ${location} | ${description} (${date})`);
}

function listDataLocations(args) {
  const data = getDataLocations();
  let locations = [...data.locations];

  if (locations.length === 0) {
    console.log('No data locations recorded yet.');
    return;
  }

  // Sort by date (newest first)
  locations.sort((a, b) => new Date(b.date) - new Date(a.date));

  console.log('\n' + PROJECT);
  console.log('Where Is The Data');
  console.log('─'.repeat(90));
  console.log('Date       │ Location              │ Description');
  console.log('─'.repeat(90));

  locations.forEach(l => {
    const pad = (str, len) => str.padEnd(len).substring(0, len);
    const datePad = pad(l.date, 10);
    const locPad = pad(l.location, 21);
    const descPad = pad(l.description, 56);

    console.log(`${datePad} │ ${locPad} │ ${descPad}`);
  });

  console.log('─'.repeat(90));
  console.log(`${locations.length} location(s) recorded\n`);
}

function removeDataLocation(args) {
  if (!args[0]) {
    console.error('Usage: film data remove <id>');
    process.exit(1);
  }

  const id = parseInt(args[0]);
  const data = getDataLocations();
  const index = data.locations.findIndex(l => l.id === id);

  if (index === -1) {
    console.error(`Location #${id} not found`);
    process.exit(1);
  }

  const removed = data.locations.splice(index, 1)[0];
  saveDataLocations(data);
  console.log(`✓ Removed: ${removed.location} | ${removed.description}`);
}

function showHelp() {
  console.log(`
${PROJECT} · Production Tools

EXPENSES:
  film add <price> <category> "<memo>" [--date YYYY-MM-DD]
  film list [--category <category>]
  film stats [--category <category>]
  film remove <id>

TODOS:
  film todo add "<task>" [--priority high|medium|low] [--due YYYY-MM-DD]
  film todo list [--pending] [--priority <level>]
  film todo check <id>
  film todo remove <id>

WHERE IS THE DATA:
  film data add "<location>" "<description>" [--date YYYY-MM-DD]
  film data list
  film data remove <id>

Examples:
  # Expenses
  film add 150.00 "Props/Set" "Fake blood and bandages"
  film list --category "Props/Set"
  film stats

  # Todos
  film todo add "Scout forest location for scene 9" --priority high
  film todo add "Design Dallas costume" --due 2026-06-15 --priority medium
  film todo list --pending
  film todo check 1

  # Data Locations
  film data add "Commercial Work" "Test footage from Jerry's" --date 2026-05-25
  film data list
  film data remove 1

Expense Categories:
  Props/Set, Camera/Gear, Crew, Location, Post-Production,
  Transportation, Catering, Insurance, Permits, Other
`);
}

const command = process.argv[2];
const subcommand = process.argv[3];
const args = process.argv.slice(4);

switch (command) {
  // Expenses
  case 'add':
    addExpense(process.argv.slice(3));
    break;
  case 'list':
    listExpenses(process.argv.slice(3));
    break;
  case 'stats':
  case 'summary':
    getStats(process.argv.slice(3));
    break;
  case 'remove':
    remove(process.argv.slice(3));
    break;

  // Todos
  case 'todo':
    if (!subcommand) {
      console.error('Usage: film todo <add|list|check|remove>');
      process.exit(1);
    }
    switch (subcommand) {
      case 'add':
        addTodo(args);
        break;
      case 'list':
        listTodos(args);
        break;
      case 'check':
        checkTodo(args);
        break;
      case 'remove':
        removeTodo(args);
        break;
      default:
        console.error(`Unknown todo command: ${subcommand}`);
        process.exit(1);
    }
    break;

  // Data Locations
  case 'data':
    if (!subcommand) {
      console.error('Usage: film data <add|list|remove>');
      process.exit(1);
    }
    switch (subcommand) {
      case 'add':
        addDataLocation(args);
        break;
      case 'list':
        listDataLocations(args);
        break;
      case 'remove':
        removeDataLocation(args);
        break;
      default:
        console.error(`Unknown data command: ${subcommand}`);
        process.exit(1);
    }
    break;

  case 'help':
  case '-h':
  case '--help':
    showHelp();
    break;
  default:
    if (command) {
      console.error(`Unknown command: ${command}`);
    }
    showHelp();
    process.exit(1);
}
