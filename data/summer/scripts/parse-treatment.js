// Script to parse treatment.md and generate storybook data
const fs = require('fs');
const path = require('path');

const treatmentPath = path.join(__dirname, 'treatment.md');
const treatment = fs.readFileSync(treatmentPath, 'utf8');

// Extract content (skip header)
const lines = treatment.split('\n');
let contentStart = false;
const contentLines = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---' && !contentStart) {
        contentStart = true;
        continue;
    }
    if (contentStart && line.trim() !== '' && !line.startsWith('##')) {
        contentLines.push(line);
    }
    if (line.startsWith('## Version History')) {
        break;
    }
}

// Join and clean up content
let fullContent = contentLines.join('\n').trim();

// Split into acts based on natural breaks
// Looking for transitions like "Dawn", scene changes, etc.
const acts = [];

// ACT I: Opening through first night
const act1End = fullContent.indexOf('Dawn. The storm approaches.');
const act1Content = fullContent.substring(0, act1End).trim();

// ACT II: Dawn through creature discovery and home
const act2Start = act1End;
const act2End = fullContent.indexOf('Makayla, as she drops off Howie');
const act2Content = fullContent.substring(act2Start, act2End).trim();

// ACT III: Makayla arrives through the rescue/return
const act3Start = act2End;
const act3End = fullContent.indexOf('Dallas makes contact with the creature');
const act3Content = fullContent.substring(act3Start, act3End).trim();

// ACT IV: Final resolution
const act4Start = act3End;
const act4Content = fullContent.substring(act3Start).trim();

// Split content into paragraphs
function splitIntoParagraphs(text) {
    return text.split(/\t/).filter(p => p.trim().length > 0).map(p => p.trim());
}

acts.push({
    act: "ACT I",
    title: "Arrival & Discovery",
    duration: "~20 minutes",
    content: splitIntoParagraphs(act1Content)
});

acts.push({
    act: "ACT II",
    title: "The Creature",
    duration: "~25 minutes",
    content: splitIntoParagraphs(act2Content)
});

acts.push({
    act: "ACT III",
    title: "The Return",
    duration: "~30 minutes",
    content: splitIntoParagraphs(act3Content)
});

acts.push({
    act: "ACT IV",
    title: "Resolution",
    duration: "~15 minutes",
    content: splitIntoParagraphs(act4Content)
});

// Generate JavaScript array format
let jsOutput = 'const treatmentData = [\n';
acts.forEach((act, idx) => {
    jsOutput += '    {\n';
    jsOutput += `        act: "${act.act}",\n`;
    jsOutput += `        title: "${act.title}",\n`;
    jsOutput += `        duration: "${act.duration}",\n`;
    jsOutput += '        content: [\n';
    act.content.forEach((para, pIdx) => {
        const escaped = para.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
        jsOutput += `            "${escaped}"`;
        if (pIdx < act.content.length - 1) {
            jsOutput += ',';
        }
        jsOutput += '\n';
    });
    jsOutput += '        ]\n';
    jsOutput += '    }';
    if (idx < acts.length - 1) {
        jsOutput += ',';
    }
    jsOutput += '\n';
});
jsOutput += '];\n';

console.log(jsOutput);

