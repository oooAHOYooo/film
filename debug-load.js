const fs = require('fs');
const path = require('path');

const manifest = JSON.parse(fs.readFileSync('pages/summer/script-system/manifest.json', 'utf8'));
const prodData = JSON.parse(fs.readFileSync('pages/summer/production-data.json', 'utf8'));

manifest.forEach((scene, index) => {
    const id = scene.id || scene.nickname;
    const fileKey = scene.file ? scene.file.replace('.md', '').toLowerCase() : '';
    
    const data = prodData[id] || prodData[fileKey] || {};
    
    if (fileKey === 's09') {
        console.log('MATCH FOR S09:');
        console.log('  ID:', id);
        console.log('  FileKey:', fileKey);
        console.log('  Data from JSON:', JSON.stringify(data));
    }
});
