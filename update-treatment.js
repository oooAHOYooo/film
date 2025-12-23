#!/usr/bin/env node

/**
 * Update Treatment - Node.js wrapper
 * This allows you to run: node update-treatment
 */

const { execSync } = require('child_process');
const path = require('path');

const scriptPath = path.join(__dirname, 'pages', 'summer', 'update-treat.js');
const args = process.argv.slice(2).join(' ');

try {
    execSync(`node "${scriptPath}" ${args}`, { 
        stdio: 'inherit',
        cwd: __dirname 
    });
} catch (error) {
    process.exit(error.status || 1);
}

