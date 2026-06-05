#!/usr/bin/env node
// Converts production-data.json → production-edit.md for human editing.
// Run: node export-production.js  (or: npm run production:export)
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, 'production-data.json');
const MD_PATH = path.join(__dirname, 'production-edit.md');

const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
const RESERVED = new Set(['settings', 'calendar', 'shootPlan', 'locationDirectory']);
const out = [];

const push = (l = '') => out.push(l);
const iList = (items, transform = x => x) =>
  items.forEach(i => push(`  - ${transform(i)}`));
const stripBullet = s => s.replace(/^[•·]\s*/, '');

push('# Production Data — Shooting Script');
push('<!-- Edit this file freely, then run: npm run production:sync -->');
push('<!-- Lines starting with <!-- are comments and are ignored by sync -->');
push('');

// SETTINGS
push('## SETTINGS');
push('');
if (data.settings) push(`chronological-start-day: ${data.settings.chronologicalStartDay}`);
push('');
push('');

// CALENDAR
push('## CALENDAR');
push('');
if (data.calendar) {
  for (const [day, date] of Object.entries(data.calendar)) push(`${day}: ${date}`);
}
push('');
push('');

// SCENES
push('## SCENES');
push('');

for (const [id, scene] of Object.entries(data)) {
  if (RESERVED.has(id)) continue;
  push(`### scene: ${id}`);
  if (scene.durationMin !== undefined) push(`duration: ${scene.durationMin}`);
  if (scene.shootDays !== undefined) push(`shoot-days: ${scene.shootDays}`);
  if (scene.assignedDay !== undefined) push(`assigned-day: ${scene.assignedDay}`);
  if (scene.location) push(`location: ${scene.location}`);
  if (scene.time) push(`time: ${scene.time}`);
  if (scene.keyElements !== undefined) push(`key-elements: ${scene.keyElements}`);
  if (scene.productionNotes !== undefined) push(`production-notes: ${scene.productionNotes}`);
  if (scene.cast && scene.cast.length) push(`cast: ${scene.cast.join(', ')}`);
  if (scene.props && scene.props.length) {
    push('props:');
    iList(scene.props);
  }
  push('');
}

// SHOOT PLAN
push('');
push('## SHOOT PLAN');
push('');

for (const day of (data.shootPlan || [])) {
  const date = data.calendar
    ? (data.calendar[String(day.day)] || '')
    : '';
  push(`### Day ${day.day}${date ? ` — ${date}` : ''}`);
  push('');
  if (day.estLength) push(`est-length: ${day.estLength}`);
  if (day.scenes && day.scenes.length) push(`scenes: ${day.scenes.join(', ')}`);
  push('');

  if (day.crewCall) {
    push('crew-call:');
    day.crewCall.split('\n').forEach(l => push(`  ${l}`));
    push('');
  }

  if (day.crew && day.crew.length) {
    push('crew:');
    day.crew.forEach(m => push(`  - ${m.role}: ${m.name}`));
    push('');
  }

  if (day.locationDetails && day.locationDetails.length) {
    push('locations:');
    iList(day.locationDetails);
    push('');
  }

  if (day.equipment && day.equipment.length) {
    push('equipment:');
    iList(day.equipment, stripBullet);
    push('');
  }

  if (day.props && day.props.length) {
    push('props:');
    iList(day.props, stripBullet);
    push('');
  }

  if (day.shotList && day.shotList.length) {
    for (const beat of day.shotList) {
      push(`#### Beat: ${beat.beat} — ${beat.title}`);
      push(`scene: ${beat.scene}`);
      if (beat.cast && beat.cast.length) push(`cast: ${beat.cast.join(', ')}`);
      if (beat.description) push(`description: ${beat.description}`);
      if (beat.shots && beat.shots.length) {
        push('shots:');
        iList(beat.shots);
      }
      push('');
    }
  }

  push('---');
  push('');
}

// LOCATION DIRECTORY
push('## LOCATION DIRECTORY');
push('');
for (const loc of (data.locationDirectory || [])) {
  push(`### ${loc.fictional}`);
  push(`actual: ${loc.actual || ''}`);
  push(`address: ${loc.address || ''}`);
  push('');
}

fs.writeFileSync(MD_PATH, out.join('\n'), 'utf8');
console.log(`✓ Exported to production-edit.md (${out.length} lines)`);
console.log('  Edit that file, then run: npm run production:sync');
