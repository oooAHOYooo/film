const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = '/Users/ag/film/pages/summer/';

const map = {
    's17.md': 's17.md', 's18.md': 's17.md', 's19.md': 's18.md',
    's20.md': 's20.md', 's21.md': 's19.md', 's22.md': 's20.md',
    's23.md': 's21.md', 's24.md': 's22.md', 's25.md': 's23.md',
    's26.md': 's24.md', 's27.md': 's25.md'
};

const numMap = {
    18: 17, 19: 18, 21: 19, 22: 20, 23: 21,
    24: 22, 25: 23, 26: 24, 27: 25, 28: 26, 29: 27
};

const mapPr = {};
for (const [oldScene, newScene] of Object.entries(numMap)) {
    mapPr[`pr${oldScene}.md`] = `pr${newScene}.md`;
}

// Delete pr17 and pr20 to avoid conflicts
try { execSync('git rm bible-system/content/practical-effects/pr17.md', { cwd: root }); } catch (e) { }
try { execSync('git rm bible-system/content/practical-effects/pr20.md', { cwd: root }); } catch (e) { }

// Rename scenes (loop in order to avoid conflicts like s19 -> s18 after s18 -> s17 is done)
const renameOrder = ['s17.md', 's18.md', 's19.md', 's20.md', 's21.md', 's22.md', 's23.md', 's24.md', 's25.md', 's26.md', 's27.md'];

for (const oldName of renameOrder) {
    const newName = map[oldName];
    const p1 = path.join(root, 'script-system/scenes', oldName);
    const p2 = path.join(root, 'script-system/scenes', newName);
    if (fs.existsSync(p1)) {
        console.log(`Renaming ${oldName} to ${newName}`);
        execSync(`git mv ${p1} ${p2}`, { cwd: root });
    }
}

for (const oldName of renameOrder) {
    const prOld = `pr${oldName.substring(1)}`;
    const prNew = `pr${map[oldName].substring(1)}`;
    const p1 = path.join(root, 'bible-system/content/practical-effects', prOld);
    const p2 = path.join(root, 'bible-system/content/practical-effects', prNew);
    if (fs.existsSync(p1)) {
        console.log(`Renaming ${prOld} to ${prNew}`);
        execSync(`git mv ${p1} ${p2}`, { cwd: root });
    }
}

// Update file contents
function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            if (!fullPath.includes('.git') && !fullPath.includes('node_modules')) {
                results = results.concat(walk(fullPath));
            }
        } else {
            if (fullPath.endsWith('.md') || fullPath.endsWith('.json') || fullPath.endsWith('.js') || fullPath.endsWith('.css') || fullPath.endsWith('.html')) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

const files = walk(root);
for (const file of files) {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // Replace sXX.md and prXX.md
    const regex = /s(18|19|21|22|23|24|25|26|27|28|29)\.md/g;
    if (regex.test(content)) {
        content = content.replace(regex, (match) => map[match]);
        changed = true;
    }

    const regexPr = /pr(18|19|21|22|23|24|25|26|27|28|29)\.md/g;
    if (regexPr.test(content)) {
        content = content.replace(regexPr, (match) => mapPr[match]);
        changed = true;
    }

    // Update "# Scene XX" (ignoring others for safety)
    const regexSc = /# Scene (18|19|21|22|23|24|25|26|27|28|29)\b/g;
    if (regexSc.test(content)) {
        content = content.replace(regexSc, (match, n) => {
            return `# Scene ${numMap[n]}`;
        });
        changed = true;
    }

    // Update "scene: XX " in HTML comments "<!-- scene: 17 file: s17.md -->"
    const regexComment = /<!-- scene: (18|19|21|22|23|24|25|26|27|28|29)\b/g;
    if (regexComment.test(content)) {
        content = content.replace(regexComment, (match, n) => {
            return `<!-- scene: ${numMap[n]}`;
        });
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
    }
}
console.log('Done migrating files');
