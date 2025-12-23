#!/usr/bin/env node

/**
 * Update Treatment - Simple Publishing Pipeline
 * 
 * Usage: ./update-treat <cred-version>
 * Example: ./update-treat cred16G
 * 
 * Options:
 *   --no-git    Skip git commit/push
 *   --no-push   Commit but don't push
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TREATMENT_FILE = path.join(__dirname, 'treatment.md');
const STORYBOOK_FILE = path.join(__dirname, 'storybook.html');
const VERSIONS_DIR = path.join(__dirname, 'treatment-versions');
const NOTES_DIR = path.join(__dirname, 'treatment-versions', 'notes');

// Parse command line arguments
const args = process.argv.slice(2);
const credVersion = args.find(arg => !arg.startsWith('--'));
const noGit = args.includes('--no-git');
const noPush = args.includes('--no-push');

// Auto-increment cred version if not provided
function getNextCredVersion(currentStatus) {
    if (credVersion) {
        return credVersion;
    }
    
    // Auto-increment: cred16F -> cred16G, cred16G -> cred16H, etc.
    const match = currentStatus.match(/cred(\d+)([A-Z])/);
    if (match) {
        const number = match[1];
        const letter = match[2];
        const nextLetter = String.fromCharCode(letter.charCodeAt(0) + 1);
        return `cred${number}${nextLetter}`;
    }
    
    // Fallback: just increment number
    const numMatch = currentStatus.match(/cred(\d+)/);
    if (numMatch) {
        const num = parseInt(numMatch[1]) + 1;
        return `cred${num}`;
    }
    
    // Default fallback
    return 'cred17';
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

// Simple text diff function
function generateDiff(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    
    const additions = [];
    const deletions = [];
    const changes = [];
    
    // Simple line-by-line comparison
    const maxLen = Math.max(oldLines.length, newLines.length);
    
    for (let i = 0; i < maxLen; i++) {
        const oldLine = oldLines[i] || '';
        const newLine = newLines[i] || '';
        
        if (oldLine !== newLine) {
            if (oldLine && !newLine) {
                deletions.push({ line: i + 1, text: oldLine.trim() });
            } else if (!oldLine && newLine) {
                additions.push({ line: i + 1, text: newLine.trim() });
            } else {
                changes.push({ 
                    line: i + 1, 
                    old: oldLine.trim(), 
                    new: newLine.trim() 
                });
            }
        }
    }
    
    return { additions, deletions, changes };
}

// Generate notes for a version
function generateVersionNotes(currentInfo, newCredVersion, oldContent, newContent) {
    // Ensure notes directory exists
    if (!fs.existsSync(NOTES_DIR)) {
        fs.mkdirSync(NOTES_DIR, { recursive: true });
    }
    
    const diff = generateDiff(oldContent, newContent);
    const noteFileName = `notes-${currentInfo.status}.md`;
    const notePath = path.join(NOTES_DIR, noteFileName);
    
    // Get word count changes
    const oldWordCount = oldContent.split(/\s+/).length;
    const newWordCount = newContent.split(/\s+/).length;
    const wordDiff = newWordCount - oldWordCount;
    
    // Analyze content for suggestions
    const suggestions = generateSuggestions(newContent, diff);
    
    const notes = `# Notes on ${currentInfo.status} → ${newCredVersion}

**Date:** ${new Date().toISOString().split('T')[0]}
**Version:** ${currentInfo.version} → ${getNextVersion(currentInfo.version)}

---

## Summary

- **Word count:** ${oldWordCount} → ${newWordCount} (${wordDiff > 0 ? '+' : ''}${wordDiff} words)
- **Lines added:** ${diff.additions.length}
- **Lines deleted:** ${diff.deletions.length}
- **Lines changed:** ${diff.changes.length}

---

## Additions

${diff.additions.length > 0 ? diff.additions.slice(0, 20).map(a => `- **Line ${a.line}:** ${a.text.substring(0, 100)}${a.text.length > 100 ? '...' : ''}`).join('\n') : '*No additions*'}

${diff.additions.length > 20 ? `\n*... and ${diff.additions.length - 20} more additions*` : ''}

---

## Deletions

${diff.deletions.length > 0 ? diff.deletions.slice(0, 20).map(d => `- **Line ${d.line}:** ${d.text.substring(0, 100)}${d.text.length > 100 ? '...' : ''}`).join('\n') : '*No deletions*'}

${diff.deletions.length > 20 ? `\n*... and ${diff.deletions.length - 20} more deletions*` : ''}

---

## Changes

${diff.changes.length > 0 ? diff.changes.slice(0, 10).map(c => `- **Line ${c.line}:**
  - Old: ${c.old.substring(0, 80)}${c.old.length > 80 ? '...' : ''}
  - New: ${c.new.substring(0, 80)}${c.new.length > 80 ? '...' : ''}`).join('\n\n') : '*No changes*'}

${diff.changes.length > 10 ? `\n*... and ${diff.changes.length - 10} more changes*` : ''}

---

## Suggestions for Next Steps

${suggestions.map(s => `- ${s}`).join('\n')}

---

## Full Diff

<details>
<summary>Click to expand full diff</summary>

\`\`\`
${generateFullDiff(oldContent, newContent)}
\`\`\`

</details>
`;

    fs.writeFileSync(notePath, notes, 'utf8');
    console.log(`✅ Generated notes: ${noteFileName}`);
    return notePath;
}

// Generate suggestions based on content analysis
function generateSuggestions(content, diff) {
    const suggestions = [];
    
    // Check for common issues
    const typos = content.match(/\b(Dallaszzza|Dallaszzz|Dallass)\b/gi);
    if (typos) {
        suggestions.push('🔍 **Spellcheck needed:** Found potential typos in character names');
    }
    
    // Check for incomplete sentences
    const incompleteSentences = content.match(/[^.!?]\s*$/gm);
    if (incompleteSentences && incompleteSentences.length > 5) {
        suggestions.push('📝 **Review sentence structure:** Some sentences may be incomplete');
    }
    
    // Check for repeated words
    const repeatedWords = content.match(/\b(\w+)\s+\1\b/gi);
    if (repeatedWords) {
        suggestions.push('✏️ **Word repetition:** Check for repeated words that might need editing');
    }
    
    // Check for ACT structure
    const actCount = (content.match(/## ACT [IVX]+/g) || []).length;
    if (actCount !== 4) {
        suggestions.push(`📚 **Structure check:** Found ${actCount} ACTs (expected 4)`);
    }
    
    // Check for duration markers
    const durationCount = (content.match(/\*\*Duration:\*\*/g) || []).length;
    if (durationCount !== actCount) {
        suggestions.push('⏱️ **Duration markers:** Some ACTs may be missing duration information');
    }
    
    // Analyze changes
    if (diff.additions.length > diff.deletions.length * 2) {
        suggestions.push('➕ **Expansion:** Significant additions made - consider reviewing pacing');
    } else if (diff.deletions.length > diff.additions.length * 2) {
        suggestions.push('➖ **Condensation:** Significant deletions made - ensure key plot points remain');
    }
    
    // Check for dialogue consistency
    const dialogueQuotes = (content.match(/"[^"]+"/g) || []).length;
    if (dialogueQuotes > 0 && dialogueQuotes % 2 !== 0) {
        suggestions.push('💬 **Dialogue check:** Unmatched quotation marks detected');
    }
    
    // Default suggestions if nothing specific
    if (suggestions.length === 0) {
        suggestions.push('✅ **Review:** Read through the treatment for flow and consistency');
        suggestions.push('📖 **Storybook:** Check the storybook to see how it renders');
        suggestions.push('🔍 **Spellcheck:** Run a final spellcheck before next version');
    }
    
    return suggestions;
}

// Generate a simple full diff
function generateFullDiff(oldText, newText) {
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const maxLen = Math.max(oldLines.length, newLines.length);
    const diffLines = [];
    
    for (let i = 0; i < maxLen; i++) {
        const oldLine = oldLines[i];
        const newLine = newLines[i];
        
        if (oldLine === newLine) {
            diffLines.push(`  ${oldLine || ''}`);
        } else {
            if (oldLine) diffLines.push(`- ${oldLine}`);
            if (newLine) diffLines.push(`+ ${newLine}`);
        }
    }
    
    return diffLines.join('\n');
}

// Archive current version
function archiveCurrentVersion(currentInfo) {
    const archiveName = `treatment-v${currentInfo.version}-${currentInfo.date}-${currentInfo.status}.md`;
    const archivePath = path.join(VERSIONS_DIR, archiveName);
    
    // Ensure versions directory exists
    if (!fs.existsSync(VERSIONS_DIR)) {
        fs.mkdirSync(VERSIONS_DIR, { recursive: true });
    }
    
    // Read current content before archiving
    const currentContent = fs.readFileSync(TREATMENT_FILE, 'utf8');
    
    fs.copyFileSync(TREATMENT_FILE, archivePath);
    console.log(`✅ Archived to: ${archiveName}`);
    
    return { archiveName, archivePath, currentContent };
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
        // Find git root (go up from script location)
        const gitRoot = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
        const scriptDir = __dirname;
        const relativePath = path.relative(gitRoot, scriptDir);
        
        // Stage files using relative paths from git root
        const treatmentPath = path.join(relativePath, 'treatment.md');
        const storybookPath = path.join(relativePath, 'storybook.html');
        const versionsPath = path.join(relativePath, 'treatment-versions');
        
        execSync(`git add "${treatmentPath}" "${storybookPath}" "${versionsPath}"`, { 
            cwd: gitRoot,
            stdio: 'inherit' 
        });
        
        // Commit
        const commitMessage = `Update treatment to ${credVersion}`;
        execSync(`git commit -m "${commitMessage}"`, { 
            cwd: gitRoot,
            stdio: 'inherit' 
        });
        console.log(`✅ Committed: ${commitMessage}`);
        
        // Push (unless --no-push)
        if (!noPush) {
            execSync('git push', { 
                cwd: gitRoot,
                stdio: 'inherit' 
            });
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
    const currentInfo = getCurrentTreatmentInfo();
    const newCredVersion = getNextCredVersion(currentInfo.status);
    const newVersion = getNextVersion(currentInfo.version);
    const newDate = new Date().toISOString().split('T')[0];
    
    console.log(`\n🚀 Updating treatment\n`);
    console.log(`Current: v${currentInfo.version} (${currentInfo.status})`);
    console.log(`New: v${newVersion} (${newCredVersion})\n`);
    
    // Step 1: Archive current (and get old content for diff)
    const { currentContent } = archiveCurrentVersion(currentInfo);
    
    // Step 2: Update treatment.md
    updateTreatmentHeader(newVersion, newDate, newCredVersion);
    
    // Step 3: Read new content and generate notes
    const newContent = fs.readFileSync(TREATMENT_FILE, 'utf8');
    generateVersionNotes(currentInfo, newCredVersion, currentContent, newContent);
    
    // Step 4: Update storybook
    updateStorybook(newVersion, newDate, newCredVersion);
    
    // Step 5: Git operations
    gitCommitAndPush(newCredVersion);
    
    console.log(`\n✅ Done! Treatment ${newCredVersion} is now live in the storybook.`);
    console.log(`📝 Check treatment-versions/notes/ for detailed change notes.\n`);
}

main();

