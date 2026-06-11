const fs = require('fs');
const path = require('path');

const SCENES_DIR = path.join(__dirname, '../scenes');
const SUMMARIES_PATH = path.join(__dirname, '../plot-cards-summaries.json');

if (!fs.existsSync(SUMMARIES_PATH)) {
    console.error('Summaries file not found!');
    process.exit(1);
}

const summaries = JSON.parse(fs.readFileSync(SUMMARIES_PATH, 'utf8'));

Object.entries(summaries).forEach(([filename, summary]) => {
    const filePath = path.join(SCENES_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`Scene file not found: ${filename}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    // Check if summary already exists
    if (content.includes('<!-- summary:')) {
        console.log(`Skipping ${filename} (summary tag already exists)`);
        return;
    }

    const summaryTag = `<!-- summary: ${summary} -->`;

    // Insert after nickname if present, otherwise at top
    if (content.match(/<!--\s*nickname:.*?-->/)) {
        content = content.replace(/(<!--\s*nickname:.*?-->)/, `$1\n${summaryTag}`);
    } else {
        content = `${summaryTag}\n\n${content}`;
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filename}`);
});

console.log('Migration complete!');
