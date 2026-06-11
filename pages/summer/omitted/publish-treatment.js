#!/usr/bin/env node

/**
 * Automated Treatment Publishing Pipeline
 * 
 * This script:
 * 1. Archives the current treatment version
 * 2. Updates treatment.md with new version info
 * 3. Updates storybook.html with the new version
 * 4. Optionally commits and pushes to git
 * 5. Maintains the latest + previous 3 versions in storybook
 * 
 * Usage: node publish-treatment.js <cred-version> [--no-git] [--no-push]
 * Example: node publish-treatment.js cred16G
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TREATMENT_FILE = path.join(__dirname, 'treatment.md');
const STORYBOOK_FILE = path.join(__dirname, 'storybook.html');
const VERSIONS_DIR = path.join(__dirname, 'treatment-versions');

// Parse command line arguments
const args = process.argv.slice(2);
const credVersion = args.find(arg => !arg.startsWith('--'));
const noGit = args.includes('--no-git');
const noPush = args.includes('--no-push');

if (!credVersion) {
    console.error('❌ Error: Please provide a cred version');
    console.log('Usage: node publish-treatment.js <cred-version> [--no-git] [--no-push]');
    console.log('Example: node publish-treatment.js cred16G');
    process.exit(1);
}

// Get current treatment info
function getCurrentTreatmentInfo() {
    const content = fs.readFileSync(TREATMENT_FILE, 'utf8');
    const versionMatch = content.match(/\*\*Version:\*\*\s*(\d+\.\d+)/);
    const dateMatch = content.match(/\*\*Last Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/);
    const statusMatch = content.match(/\*\*Status:\*\*\s*(\S+)/);
    
    return {
        version: versionMatch ? versionMatch[1] : '1.0',
        date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
        status: statusMatch ? statusMatch[1] : 'unknown'
    };
}

// Calculate next version number
function getNextVersion(currentVersion) {
    const [major, minor] = currentVersion.split('.').map(Number);
    return `${major}.${minor + 1}`;
}

// Archive current version
function archiveCurrentVersion(currentInfo) {
    const archiveName = `treatment-v${currentInfo.version}-${currentInfo.date}-${currentInfo.status}.md`;
    const archivePath = path.join(VERSIONS_DIR, archiveName);
    
    // Ensure versions directory exists
    if (!fs.existsSync(VERSIONS_DIR)) {
        fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    }
    
    fs.copyFileSync(TREATMENT_FILE, archivePath);
    console.log(`✅ Archived to: ${archiveName}`);
    return archiveName;
}

// Update treatment.md header
function updateTreatmentHeader(newVersion, newDate, newStatus) {
    let content = fs.readFileSync(TREATMENT_FILE, 'utf8');
    
    // Update version
    content = content.replace(/\*\*Version:\*\*\s*\d+\.\d+/, `**Version:** ${newVersion}`);
    
    // Update date
    content = content.replace(/\*\*Last Updated:\*\*\s*\d{4}-\d{2}-\d{2}/, `**Last Updated:** ${newDate}`);
    
    // Update status
    content = content.replace(/\*\*Status:\*\*\s*\S+/, `**Status:** ${newStatus}`);
    
    // Add to version history (find the table and insert after header row)
    const versionHistoryLine = `| ${newVersion} | ${newDate} | ${newStatus} - Minor edits and spellchecks | AG |`;
    const tableHeaderPattern = /(\| Version \| Date \| Changes \| Author \|)/;
    
    if (content.match(tableHeaderPattern)) {
        content = content.replace(
            tableHeaderPattern,
            `$1\n${versionHistoryLine}`
        );
    }
    
    fs.writeFileSync(TREATMENT_FILE, content, 'utf8');
    console.log(`✅ Updated treatment.md header`);
}

// Parse treatment into acts for storybook
function parseTreatmentIntoActs() {
    const content = fs.readFileSync(TREATMENT_FILE, 'utf8');
    
    // Skip header (everything before first ---)
    const headerEnd = content.indexOf('---');
    const treatmentContent = content.substring(headerEnd + 3).trim();
    
    const acts = [];
    const actRegex = /## (ACT [IVX]+)\s*\n\n### (.+?)\s*\n\n\*\*Duration:\*\* (.+?)\s*\n\n([\s\S]*?)(?=\n## ACT|$)/g;
    
    let match;
    while ((match = actRegex.exec(treatmentContent)) !== null) {
        const [, actNum, title, duration, actContent] = match;
        
        // Split content into paragraphs (preserve empty lines for spacing)
        const paragraphs = actContent
            .split(/\n\n+/)
            .map(p => p.trim())
            .filter(p => p.length > 0);
        
        acts.push({
            act: actNum,
            title: title,
            duration: duration,
            content: paragraphs.length > 0 ? paragraphs : [actContent.trim()]
        });
    }
    
    return acts;
}

// Generate JavaScript array for storybook
function generateTreatmentDataJS(acts) {
    let js = '            const treatmentData = [\n';
    
    acts.forEach((act, idx) => {
        js += '                {\n';
        js += `                    act: "${act.act}",\n`;
        js += `                    title: "${act.title}",\n`;
        js += `                    duration: "${act.duration}",\n`;
        js += '                    content: [\n';
        
        act.content.forEach((para, pIdx) => {
            // Escape for JavaScript string
            const escaped = para
                .replace(/\\/g, '\\\\')
                .replace(/"/g, '\\"')
                .replace(/\n/g, '\\n');
            js += `                        "${escaped}"`;
            if (pIdx < act.content.length - 1) {
                js += ',';
            }
            js += '\n';
        });
        
        js += '                    ]\n';
        js += '                }';
        if (idx < acts.length - 1) {
            js += ',';
        }
        js += '\n';
    });
    
    js += '            ];';
    return js;
}

// Get available versions from archive directory
function getAvailableVersions() {
    if (!fs.existsSync(VERSIONS_DIR)) {
        return [];
    }
    
    const files = fs.readdirSync(VERSIONS_DIR)
        .filter(f => f.startsWith('treatment-v') && f.endsWith('.md'))
        .map(f => {
            // Parse: treatment-v1.1-2025-01-24-cred16F.md
            const match = f.match(/treatment-v(\d+\.\d+)-(\d{4}-\d{2}-\d{2})-(.+)\.md/);
            if (match) {
                return {
                    file: f,
                    version: match[1],
                    date: match[2],
                    status: match[3],
                    fullPath: path.join(VERSIONS_DIR, f)
                };
            }
            return null;
        })
        .filter(v => v !== null)
        .sort((a, b) => {
            // Sort by date descending, then version descending
            if (a.date !== b.date) {
                return b.date.localeCompare(a.date);
            }
            return parseFloat(b.version) - parseFloat(a.version);
        });
    
    return files;
}

// Update storybook.html
function updateStorybook(newVersion, newDate, newStatus) {
    let storybook = fs.readFileSync(STORYBOOK_FILE, 'utf8');
    
    // Update header meta
    storybook = storybook.replace(
        /<p class="meta">[^<]+<\/p>/,
        `<p class="meta">${newStatus} | Last Updated: ${newDate}</p>`
    );
    
    // Update version selector buttons
    const versions = getAvailableVersions();
    const latestVersions = versions.slice(0, 3); // Previous 3 + current = 4 total shown
    
    // Generate version buttons HTML
    let versionButtons = `<button class="version-btn active" id="enhancedBtn" onclick="switchVersion('enhanced')">${newStatus}</button>\n`;
    
    latestVersions.forEach((v, idx) => {
        const versionId = `version${idx}`;
        versionButtons += `                <button class="version-btn" id="${versionId}Btn" onclick="switchVersion('${versionId}')">${v.status} (${v.date})</button>\n`;
    });
    
    // Replace version selector
    const versionSelectorRegex = /<div class="version-selector">[\s\S]*?<\/div>/;
    storybook = storybook.replace(
        versionSelectorRegex,
        `<div class="version-selector">\n                ${versionButtons}            </div>`
    );
    
    // Parse and update treatment data
    const acts = parseTreatmentIntoActs();
    const treatmentDataJS = generateTreatmentDataJS(acts);
    
    // Replace treatmentData array - find the comment line and replace everything until the closing ];
    const commentPattern = /\/\/ Latest treatment content[^\n]*/;
    const commentMatch = storybook.match(commentPattern);
    
    if (commentMatch) {
        const startIndex = commentMatch.index;
        // Find the next occurrence of ]; after const treatmentData = [
        const dataStart = storybook.indexOf('const treatmentData = [', startIndex);
        if (dataStart !== -1) {
            // Find the closing ]; - look for pattern: \n            ];
            const closingPattern = /\n\s+\];/;
            const closingMatch = storybook.substring(dataStart).match(closingPattern);
            
            if (closingMatch) {
                const endIndex = dataStart + closingMatch.index + closingMatch[0].length;
                const before = storybook.substring(0, startIndex);
                const after = storybook.substring(endIndex);
                const newContent = `// Latest treatment content - ${newStatus} - broken into slides\n            ${treatmentDataJS}`;
                storybook = before + newContent + after;
            } else {
                console.warn('⚠️  Could not find closing ]; for treatmentData array');
            }
        } else {
            console.warn('⚠️  Could not find const treatmentData = [ in storybook');
        }
    } else {
        console.warn('⚠️  Could not find treatmentData comment in storybook');
    }
    
    // TODO: Add support for loading archived versions dynamically
    // For now, we'll just update the main version
    
    fs.writeFileSync(STORYBOOK_FILE, storybook, 'utf8');
    console.log(`✅ Updated storybook.html`);
}

// Git operations
function gitCommitAndPush(credVersion) {
    if (noGit) {
        console.log('⏭️  Skipping git operations (--no-git flag)');
        return;
    }
    
    try {
        // Check if we're in a git repo
        execSync('git rev-parse --git-dir', { stdio: 'ignore' });
        
        // Stage files
        execSync('git add pages/summer/treatment.md pages/summer/storybook.html pages/summer/treatment-versions/', { stdio: 'inherit' });
        
        // Commit
        const commitMessage = `Update treatment to ${credVersion}`;
        execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
        console.log(`✅ Committed: ${commitMessage}`);
        
        // Push (unless --no-push)
        if (!noPush) {
            execSync('git push', { stdio: 'inherit' });
            console.log('✅ Pushed to remote');
        } else {
            console.log('⏭️  Skipping push (--no-push flag)');
        }
    } catch (error) {
        console.warn('⚠️  Git operations failed (this is okay if not in a git repo)');
    }
}

// Main execution
function main() {
    console.log(`\n🚀 Publishing treatment: ${credVersion}\n`);
    
    const currentInfo = getCurrentTreatmentInfo();
    console.log(`Current: v${currentInfo.version} (${currentInfo.status})`);
    
    const newVersion = getNextVersion(currentInfo.version);
    const newDate = new Date().toISOString().split('T')[0];
    
    console.log(`New: v${newVersion} (${credVersion})\n`);
    
    // Step 1: Archive current
    archiveCurrentVersion(currentInfo);
    
    // Step 2: Update treatment.md
    updateTreatmentHeader(newVersion, newDate, credVersion);
    
    // Step 3: Update storybook
    updateStorybook(newVersion, newDate, credVersion);
    
    // Step 4: Git operations
    gitCommitAndPush(credVersion);
    
    console.log(`\n✅ Done! Treatment ${credVersion} is now live in the storybook.\n`);
}

main();

