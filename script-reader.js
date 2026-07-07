#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const SCRIPT_PATH = path.join(__dirname, 'pages/summer/shooting/script-system/full_script.md');
const LINES_PER_PAGE = 24; // Adjust to terminal height - 4 for UI

class ScriptReader {
  constructor() {
    this.lines = [];
    this.currentPage = 0;
    this.totalPages = 0;
    this.searchQuery = '';
    this.searchResults = [];
    this.currentSearchIndex = -1;
    this.searchMode = false;

    this.loadScript();
    this.setupTerminal();
  }

  loadScript() {
    const content = fs.readFileSync(SCRIPT_PATH, 'utf-8');
    this.lines = content.split('\n');
    this.totalPages = Math.ceil(this.lines.length / LINES_PER_PAGE);
    console.log(`📖 Loaded ${this.lines.length} lines across ${this.totalPages} pages\n`);
  }

  setupTerminal() {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdout.write('\x1Bc'); // Clear screen

    process.stdin.on('data', (key) => this.handleKey(key));

    this.showCurrentPage();
  }

  formatLine(line) {
    // Highlight section headings
    if (line.startsWith('# ')) {
      return `\x1b[1;36m${line}\x1b[0m`; // Bold cyan
    }
    if (line.startsWith('## ')) {
      return `\x1b[1;33m${line}\x1b[0m`; // Bold yellow
    }
    if (line.startsWith('### ')) {
      return `\x1b[33m${line}\x1b[0m`; // Yellow
    }
    if (line.startsWith('**') && line.endsWith('**')) {
      return `\x1b[1m${line}\x1b[0m`; // Bold
    }
    return line;
  }

  showCurrentPage() {
    const start = this.currentPage * LINES_PER_PAGE;
    const end = Math.min(start + LINES_PER_PAGE, this.lines.length);
    const pageLines = this.lines.slice(start, end);

    console.clear();

    // Show content
    pageLines.forEach(line => {
      console.log(this.formatLine(line));
    });

    // Show footer
    const percentage = Math.round((this.currentPage / this.totalPages) * 100);
    const footer = ` ─ Page ${this.currentPage + 1}/${this.totalPages} (${percentage}%) ─`;
    console.log('\n\x1b[2m' + footer + '\x1b[0m');
    console.log('\x1b[2mCommands: [↑/w]up [↓/s]down [space/n]ext [g]oto [/]search [?]help [q]uit\x1b[0m');
  }

  handleKey(key) {
    // Handle Ctrl+C
    if (key === '') {
      console.log('\n👋 Goodbye!\n');
      process.exit(0);
    }

    // Arrow keys
    if (key === '\x1b[A') { // Up arrow
      if (this.currentPage > 0) {
        this.currentPage--;
        this.showCurrentPage();
      }
      return;
    }
    if (key === '\x1b[B') { // Down arrow
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        this.showCurrentPage();
      }
      return;
    }

    // Regular characters
    const char = key.toLowerCase();

    switch (char) {
      case ' ':
      case 'n':
      case 's': // S for down
        if (this.currentPage < this.totalPages - 1) {
          this.currentPage++;
          this.showCurrentPage();
        }
        break;
      case 'p':
      case 'w': // W for up
        if (this.currentPage > 0) {
          this.currentPage--;
          this.showCurrentPage();
        }
        break;
      case 'g':
        this.promptGoto();
        break;
      case '/':
        this.promptSearch();
        break;
      case '?':
        this.showHelp();
        break;
      case 'q':
        console.log('\n👋 Goodbye!\n');
        process.exit(0);
        break;
    }
  }

  promptGoto() {
    process.stdin.setRawMode(false);
    process.stdout.write('\n\x1b[1mGo to page (1-' + this.totalPages + '): \x1b[0m');

    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('', (input) => {
      rl.close();
      const page = parseInt(input) - 1;
      if (page >= 0 && page < this.totalPages) {
        this.currentPage = page;
      } else {
        console.log('\x1b[31mInvalid page number\x1b[0m');
      }
      process.stdin.setRawMode(true);
      this.showCurrentPage();
    });
  }

  promptSearch() {
    process.stdin.setRawMode(false);
    process.stdout.write('\n\x1b[1mSearch: \x1b[0m');

    const rl = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('', (query) => {
      rl.close();
      if (query.length > 0) {
        this.searchQuery = query.toLowerCase();
        this.searchResults = [];
        this.lines.forEach((line, idx) => {
          if (line.toLowerCase().includes(this.searchQuery)) {
            this.searchResults.push(idx);
          }
        });

        if (this.searchResults.length > 0) {
          this.currentSearchIndex = 0;
          const lineNum = this.searchResults[0];
          this.currentPage = Math.floor(lineNum / LINES_PER_PAGE);
          console.log(`\x1b[32m✓ Found ${this.searchResults.length} match(es)\x1b[0m`);
        } else {
          console.log(`\x1b[31m✗ No matches for "${query}"\x1b[0m`);
        }
      }
      process.stdin.setRawMode(true);
      setTimeout(() => this.showCurrentPage(), 200);
    });
  }

  showHelp() {
    console.clear();
    console.log(`\x1b[1;36m📖 Script Reader Help\x1b[0m\n`);
    console.log('Navigation:');
    console.log('  \x1b[33m↑ / W\x1b[0m          Page up');
    console.log('  \x1b[33m↓ / S\x1b[0m          Page down');
    console.log('  \x1b[33mSPACE / N\x1b[0m     Next page');
    console.log('  \x1b[33mP\x1b[0m            Previous page');
    console.log('  \x1b[33mG\x1b[0m            Go to specific page');
    console.log('  \x1b[33m/\x1b[0m            Search for text');
    console.log('  \x1b[33mQ\x1b[0m            Quit\n');
    console.log('Info:');
    console.log(`  Total lines: ${this.lines.length}`);
    console.log(`  Total pages: ${this.totalPages}`);
    console.log(`  Lines per page: ${LINES_PER_PAGE}\n`);
    process.stdout.write('\x1b[2mPress any key to return...\x1b[0m');

    // Wait for any key
    const onData = () => {
      process.stdin.removeListener('data', onData);
      this.showCurrentPage();
    };
    process.stdin.once('data', onData);
  }
}

// Start the reader
new ScriptReader();
