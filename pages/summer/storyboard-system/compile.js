const fs = require('fs');
const path = require('path');

const SYSTEM_DIR = __dirname;
const FRAMES_DIR = path.join(SYSTEM_DIR, 'frames');
const SCENES_DIR = path.join(SYSTEM_DIR, 'scenes');

function compileStoryboardFrames() {
  console.log('Compiling storyboard frames...');
  const framesData = {};

  if (!fs.existsSync(FRAMES_DIR)) {
    console.log('No frames directory found, skipping.');
    return;
  }

  const folders = fs.readdirSync(FRAMES_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

  for (const folder of folders) {
    const folderPath = path.join(FRAMES_DIR, folder);
    const files = fs.readdirSync(folderPath);

    // Filter to shot-generator.png or posterframe.jpg
    let images = files.filter(f => f.includes('shot-generator.png') || f.includes('posterframe.jpg'));
    
    // Sort logically by board number
    images.sort((a, b) => {
      const numA = parseInt(a.match(/board-(\d+)/)?.[1] || 0, 10);
      const numB = parseInt(b.match(/board-(\d+)/)?.[1] || 0, 10);
      return numA - numB;
    });

    const uniqueBoards = new Map();
    for (const img of images) {
      const match = img.match(/board-(\d+)/);
      if (match) {
        const boardNum = parseInt(match[1], 10);
        if (!uniqueBoards.has(boardNum)) {
          uniqueBoards.set(boardNum, img);
        } else {
          const existing = uniqueBoards.get(boardNum);
          if (img.includes('shot-generator.png') && existing.includes('posterframe')) {
            uniqueBoards.set(boardNum, img);
          }
        }
      }
    }

    const sortedNum = Array.from(uniqueBoards.keys()).sort((a,b) => a - b);
    const finalImages = sortedNum.map(num => uniqueBoards.get(num));

    const sceneUpper = folder.toUpperCase();
    let captions = [];
    try {
      const sceneFiles = fs.readdirSync(SCENES_DIR);
      const sceneFile = sceneFiles.find(f => f.toUpperCase().replace(/\s/g, '').startsWith(sceneUpper) && f.endsWith('.md'));
      if (sceneFile) {
        const mdContent = fs.readFileSync(path.join(SCENES_DIR, sceneFile), 'utf-8');
        const lines = mdContent.split('\n');
        let currentShot = null;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          const shotMatch = line.match(/^- ([A-Z]-\d+):\s*\[(.*?)\]/);
          if (shotMatch) {
            currentShot = { id: shotMatch[1], size: shotMatch[2], action: "" };
            captions.push(currentShot);
          } else if (currentShot && line.startsWith('- ')) {
             if (currentShot.action === "") {
               currentShot.action = line.replace(/^- /, '').trim();
             }
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse captions for", folder);
    }

    const panels = finalImages.map((img, index) => {
      const mdIndex = index;
      let caption = `Board ${sortedNum[index]}`;
      let camera = "Wide";
      if (captions[mdIndex]) {
        caption = `${captions[mdIndex].id}: ${captions[mdIndex].action}`;
        camera = captions[mdIndex].size;
      }

      return {
        sceneNumber: parseInt(sortedNum[index]),
        sceneId: folder,
        camera: camera,
        caption: caption,
        image: `storyboard-system/frames/${folder}/${img}`,
        title: `Shot ${sortedNum[index]}`
      };
    });

    framesData[folder] = panels;
  }

  const outputPath = path.join(SYSTEM_DIR, 'frames-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(framesData, null, 2));
  console.log(`Generated frames-data.json with ${Object.keys(framesData).length} scenes.`);
}

compileStoryboardFrames();
