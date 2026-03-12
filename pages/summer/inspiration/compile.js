const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.join(__dirname, '..', '..', '..');
const DATA_FILE = path.join(PROJECT_ROOT, 'data', 'summer.json');
const INSPO_ASSETS_DIR = path.join(PROJECT_ROOT, 'assets', 'summer', 'inspiration');
const LEGACY_INSPO_DIR = path.join(PROJECT_ROOT, 'assets', 'summer', 'inspo-imgs');

const CATEGORY_MAP = {
    'good-creatures': 'Good Creatures',
    'bad-creatures': 'Dark Creature',
    'wardrobe': 'Wardrobe',
    'practical-sfx': 'Practical SFX Ideas',
    'locations': 'Location Ideas',
    'vibes-colors': 'Vibes + Colors',
    'gear': 'Gear',
    'camera-rig': 'Camera Rig',
    'misc': 'Misc'
};

function compile() {
    console.log('Compiling Summer Inspiration Gallery...');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('Data file not found:', DATA_FILE);
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    let inspiration = [];

    // 1. Scan modular folders
    if (fs.existsSync(INSPO_ASSETS_DIR)) {
        const folders = fs.readdirSync(INSPO_ASSETS_DIR);
        folders.forEach(folder => {
            const folderPath = path.join(INSPO_ASSETS_DIR, folder);
            if (fs.statSync(folderPath).isDirectory()) {
                const category = CATEGORY_MAP[folder] || 'Misc';
                const files = fs.readdirSync(folderPath);
                files.forEach(file => {
                    if (/\.(jpg|jpeg|png|gif|webp|mov|mp4)$/i.test(file)) {
                        inspiration.push({
                            url: `/assets/summer/inspiration/${folder}/${file}`,
                            title: file.split('.')[0].replace(/-/g, ' '),
                            category: category
                        });
                    }
                });
            }
        });
    }

    // 2. Scan legacy folder (all as Misc)
    if (fs.existsSync(LEGACY_INSPO_DIR)) {
        const legacyFiles = fs.readdirSync(LEGACY_INSPO_DIR);
        legacyFiles.forEach(file => {
            if (/\.(jpg|jpeg|png|gif|webp|mov|mp4)$/i.test(file)) {
                // Avoid duplicates if already in new system
                const url = `/assets/summer/inspo-imgs/${file}`;
                if (!inspiration.find(item => item.url === url)) {
                    inspiration.push({
                        url: url,
                        title: file.split('.')[0].replace(/-/g, ' '),
                        category: 'Misc'
                    });
                }
            }
        });
    }

    // 3. Keep existing Pinterest links but ensure they have categories (default to Misc)
    if (data.inspiration) {
        data.inspiration.forEach(item => {
            if (item.url.startsWith('http')) {
                if (!inspiration.find(i => i.url === item.url)) {
                    inspiration.push({
                        ...item,
                        category: item.category || 'Misc'
                    });
                }
            }
        });
    }

    // Sort inspiration items (Misc at the end)
    inspiration.sort((a, b) => {
        if (a.category === 'Misc' && b.category !== 'Misc') return 1;
        if (a.category !== 'Misc' && b.category === 'Misc') return -1;
        return a.category.localeCompare(b.category);
    });

    data.inspiration = inspiration;
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✓ Compiled ${inspiration.length} inspiration items.`);
}

compile();
