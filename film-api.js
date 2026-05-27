#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const EXPENSES_FILE = path.join(process.cwd(), '.film-expenses.json');
const PORT = process.env.PORT || 3333;

function getExpenses() {
  if (!fs.existsSync(EXPENSES_FILE)) {
    const init = {
      project: 'Creatures in the Tall Grass',
      expenses: [],
      categories: [
        'Props/Set', 'Camera/Gear', 'Crew', 'Location', 'Post-Production',
        'Transportation', 'Catering', 'Insurance', 'Permits', 'Other'
      ]
    };
    fs.writeFileSync(EXPENSES_FILE, JSON.stringify(init, null, 2));
    return init;
  }
  return JSON.parse(fs.readFileSync(EXPENSES_FILE, 'utf8'));
}

function saveExpenses(data) {
  fs.writeFileSync(EXPENSES_FILE, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // POST /expense - Add new expense
  if (req.method === 'POST' && pathname === '/expense') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const { price, category, memo, date } = JSON.parse(body);
        if (!price || !category || !memo) {
          res.writeHead(400);
          res.end(JSON.stringify({ error: 'Missing required fields: price, category, memo' }));
          return;
        }

        const data = getExpenses();
        const id = data.expenses.length > 0 ? Math.max(...data.expenses.map(e => e.id)) + 1 : 1;
        const expense = {
          id,
          date: date || new Date().toISOString().split('T')[0],
          memo,
          category,
          price: parseFloat(parseFloat(price).toFixed(2))
        };

        data.expenses.push(expense);
        saveExpenses(data);

        res.writeHead(201);
        res.end(JSON.stringify({ success: true, expense }));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // GET /expenses - List all expenses
  if (req.method === 'GET' && pathname === '/expenses') {
    const data = getExpenses();
    let expenses = [...data.expenses];

    if (query.category) {
      expenses = expenses.filter(e => e.category === query.category);
    }

    expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.writeHead(200);
    res.end(JSON.stringify({
      project: data.project,
      expenses,
      total: expenses.reduce((sum, e) => sum + e.price, 0),
      count: expenses.length
    }));
    return;
  }

  // GET /stats - Get expense statistics
  if (req.method === 'GET' && pathname === '/stats') {
    const data = getExpenses();
    const expenses = data.expenses;

    const stats = {
      totalExpenses: expenses.reduce((sum, e) => sum + e.price, 0),
      count: expenses.length,
      byCategory: {}
    };

    expenses.forEach(e => {
      if (!stats.byCategory[e.category]) {
        stats.byCategory[e.category] = { total: 0, count: 0 };
      }
      stats.byCategory[e.category].total += e.price;
      stats.byCategory[e.category].count += 1;
    });

    res.writeHead(200);
    res.end(JSON.stringify({
      project: data.project,
      stats
    }));
    return;
  }

  // DELETE /expense/{id} - Remove expense
  if (req.method === 'DELETE' && pathname.startsWith('/expense/')) {
    const id = parseInt(pathname.split('/')[2]);
    const data = getExpenses();
    const index = data.expenses.findIndex(e => e.id === id);

    if (index === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: `Expense #${id} not found` }));
      return;
    }

    const removed = data.expenses.splice(index, 1)[0];
    saveExpenses(data);

    res.writeHead(200);
    res.end(JSON.stringify({ success: true, removed }));
    return;
  }

  // GET / - API info
  if (pathname === '/') {
    res.writeHead(200);
    res.end(JSON.stringify({
      project: 'Creatures in the Tall Grass',
      api: 'Expense Tracker API',
      endpoints: {
        'POST /expense': 'Add expense { price, category, memo, date? }',
        'GET /expenses': 'List all expenses (query: category)',
        'GET /stats': 'Get expense statistics',
        'DELETE /expense/{id}': 'Remove expense by ID'
      }
    }));
    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, () => {
  console.log(`Film Expense API running on http://localhost:${PORT}`);
  console.log('Example: curl -X POST http://localhost:3333/expense -H "Content-Type: application/json" -d \'{"price":150,"category":"Props/Set","memo":"Fake blood"}\'');
});
