const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'summer.json');

function addInspo() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log('Usage: node scripts/add-inspo.js <url> [category] [title]');
        process.exit(1);
    }

    const url = args[0];
    const category = args[1] || 'Misc';
    const title = args[2] || 'New Inspiration';

    if (!fs.existsSync(DATA_FILE)) {
        console.error('Data file not found:', DATA_FILE);
        process.exit(1);
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

    // Check for duplicates
    if (data.inspiration.find(item => item.url === url)) {
        console.log('⚠️ Item already exists in gallery.');
        return;
    }

    // Add to the START of the list
    data.inspiration.unshift({
        url: url,
        title: title,
        category: category
    });

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Added to ${category}: ${url}`);
    console.log('Now run: node compile-all.js to update the web view.');
}

addInspo();
