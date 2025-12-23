// Simple Version Control Script for Treatment
// Run this with: node version-control.js

const fs = require('fs');
const path = require('path');

const treatmentPath = path.join(__dirname, 'treatment.md');
const versionsDir = path.join(__dirname, 'treatment-versions');

function createVersion() {
    // Read current treatment
    const treatment = fs.readFileSync(treatmentPath, 'utf8');
    
    // Extract version info from header
    const versionMatch = treatment.match(/\*\*Version:\*\*\s*(\d+\.\d+)/);
    const dateMatch = treatment.match(/\*\*Last Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    
    const version = versionMatch ? versionMatch[1] : '1.0';
    const date = dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0];
    
    // Create version filename
    const versionFilename = `treatment-v${version}-${date}.md`;
    const versionPath = path.join(versionsDir, versionFilename);
    
    // Check if version already exists
    if (fs.existsSync(versionPath)) {
        console.log(`Version ${versionFilename} already exists.`);
        console.log('Please update the version number in treatment.md first.');
        return;
    }
    
    // Copy to versions directory
    fs.writeFileSync(versionPath, treatment);
    
    console.log(`✓ Created version: ${versionFilename}`);
    console.log(`  Location: ${versionPath}`);
}

function listVersions() {
    if (!fs.existsSync(versionsDir)) {
        console.log('No versions directory found.');
        return;
    }
    
    const files = fs.readdirSync(versionsDir)
        .filter(f => f.startsWith('treatment-v') && f.endsWith('.md'))
        .sort()
        .reverse();
    
    if (files.length === 0) {
        console.log('No versions found.');
        return;
    }
    
    console.log('\nAvailable versions:');
    files.forEach(file => {
        const stats = fs.statSync(path.join(versionsDir, file));
        console.log(`  ${file} (${stats.size} bytes, ${stats.mtime.toLocaleDateString()})`);
    });
}

function showVersion(version) {
    const versionPath = path.join(versionsDir, `treatment-v${version}.md`);
    
    if (!fs.existsSync(versionPath)) {
        // Try to find by partial match
        const files = fs.readdirSync(versionsDir)
            .filter(f => f.includes(version));
        
        if (files.length === 0) {
            console.log(`Version ${version} not found.`);
            return;
        }
        
        if (files.length > 1) {
            console.log(`Multiple matches found:`);
            files.forEach(f => console.log(`  ${f}`));
            return;
        }
        
        const content = fs.readFileSync(path.join(versionsDir, files[0]), 'utf8');
        console.log(content);
    } else {
        const content = fs.readFileSync(versionPath, 'utf8');
        console.log(content);
    }
}

// CLI
const command = process.argv[2];
const arg = process.argv[3];

if (command === 'create' || command === 'save') {
    createVersion();
} else if (command === 'list' || command === 'ls') {
    listVersions();
} else if (command === 'show' || command === 'view') {
    if (!arg) {
        console.log('Usage: node version-control.js show <version>');
        console.log('Example: node version-control.js show 1.0');
    } else {
        showVersion(arg);
    }
} else {
    console.log('Treatment Version Control');
    console.log('\nUsage:');
    console.log('  node version-control.js create    - Save current treatment as new version');
    console.log('  node version-control.js list      - List all versions');
    console.log('  node version-control.js show <v>  - Show specific version');
    console.log('\nExample:');
    console.log('  node version-control.js create');
    console.log('  node version-control.js show 1.0');
}

