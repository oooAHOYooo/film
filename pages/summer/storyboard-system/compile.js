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

    // Filter to shot-generator.png, posterframe.jpg, or S08 style images
    let images = files.filter(f => f.includes('shot-generator.png') || f.includes('posterframe.jpg') || f.match(/board-\d+\.png/));
    
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
          
          // Format 1: - A-1: [Wide]
          const shotMatch1 = line.match(/^- ([A-Z]-\d+):\s*\[(.*?)\]/);
          // Format 2: ### Shot 1 - WIDE TRACKING - House Exit
          const shotMatch2 = line.match(/^### Shot (\d+) - (.*?) - (.*?)$/i);

          if (shotMatch1) {
            currentShot = { id: shotMatch1[1], size: shotMatch1[2], action: "" };
            captions.push(currentShot);
          } else if (shotMatch2) {
            currentShot = { id: parseInt(shotMatch2[1], 10), action: "", captionText: "" };
            captions.push(currentShot);
          } else if (currentShot) {
             const actionMatch = line.match(/^- Action:\s*(.*)/i);
             const sizeMatch = line.match(/^- Size:\s*(.*)/i);
             const captionMatch = line.match(/^- Caption:\s*(.*)/i);
             
             if (actionMatch) {
               currentShot.action = actionMatch[1].trim();
             } else if (sizeMatch && !currentShot.size) {
               currentShot.size = sizeMatch[1].trim();
             } else if (captionMatch) {
               currentShot.captionText = captionMatch[1].trim();
             } else if (line.startsWith('- ') && currentShot.action === "" && !shotMatch2) {
               currentShot.action = line.replace(/^- /, '').trim();
             }
          }
        }
      }
    } catch (e) {
      console.warn("Could not parse captions for", folder);
    }

    const panels = finalImages.map((img, index) => {
      const boardNum = sortedNum[index];
      let caption = `Board ${boardNum}`;
      let camera = "Wide";
      
      // Try to find by exact board number first
      let matchedShot = captions.find(c => c.id == boardNum);
      if (!matchedShot) {
        // Fallback to sequential index
        matchedShot = captions[index];
      }
      
      if (matchedShot) {
        let actionTxt = matchedShot.captionText || matchedShot.action;
        caption = `${matchedShot.id}: ${actionTxt}`;
        camera = matchedShot.size;
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

  // Auto-generate manifest.json
  console.log('Generating manifest.json...');
  const SCRIPT_MANIFEST = path.join(SYSTEM_DIR, '../script-system/manifest.json');
  let scriptData = [];
  try {
    scriptData = JSON.parse(fs.readFileSync(SCRIPT_MANIFEST, 'utf-8'));
  } catch(e) {
    console.warn('Could not read script manifest.');
  }

  const scLookup = {};
  scriptData.forEach(s => {
    const match = s.file.match(/s(\d+)\.md/i);
    if(match) {
      scLookup[parseInt(match[1], 10)] = s;
    }
  });

  const builtManifest = [];
  const processedNums = new Set();
  const scenesDirFiles = fs.existsSync(SCENES_DIR) ? fs.readdirSync(SCENES_DIR) : [];

  for (const f of scenesDirFiles) {
    const m = f.match(/S(\d+).*?\.md/i);
    if (m) {
      const num = parseInt(m[1], 10);
      processedNums.add(num);
      const sc = scLookup[num] || {};
      builtManifest.push({
        id: `s${m[1].padStart(2,'0')}-sl`,
        file: f,
        title: sc.title || `Scene ${num}`,
        act: sc.act || 0,
        actTitle: sc.actTitle || ''
      });
    }
  }

  for (const folder of folders) {
    const m = folder.match(/s(\d+)/i);
    if (m) {
      const num = parseInt(m[1], 10);
      if (!processedNums.has(num)) {
        processedNums.add(num);
        const sc = scLookup[num] || {};
        builtManifest.push({
          id: `s${m[1].padStart(2,'0')}-sl`,
          file: "", 
          title: sc.title || `Scene ${num}`,
          act: sc.act || 0,
          actTitle: sc.actTitle || ''
        });
      }
    }
  }

  builtManifest.sort((a,b) => {
    const aNum = parseInt((a.id.match(/\d+/) || [0])[0], 10);
    const bNum = parseInt((b.id.match(/\d+/) || [0])[0], 10);
    return aNum - bNum;
  });

  fs.writeFileSync(path.join(SYSTEM_DIR, 'manifest.json'), JSON.stringify(builtManifest, null, 2));
  console.log(`Generated manifest.json with ${builtManifest.length} scenes.`);
}

compileStoryboardFrames();
