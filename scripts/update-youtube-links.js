/**
 * YouTube Link Update Script
 *
 * Updates exercises.ts with verified YouTube URLs from verified-youtube-links.json
 * Following the same pattern as fetch-exercise-images.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  exercisesFile: path.join(__dirname, '..', 'lib', 'exercises.ts'),
  verifiedLinksFile: path.join(__dirname, 'verified-youtube-links.json'),
};

function updateExercisesFile() {
  if (!fs.existsSync(CONFIG.verifiedLinksFile)) {
    console.log('No verified-youtube-links.json file found. Create it first.');
    return;
  }

  const verifiedLinks = JSON.parse(fs.readFileSync(CONFIG.verifiedLinksFile, 'utf-8'));
  let content = fs.readFileSync(CONFIG.exercisesFile, 'utf-8');
  let updateCount = 0;
  const updated = [];
  const notFound = [];

  // Filter out metadata keys that start with underscore
  const exerciseLinks = Object.entries(verifiedLinks).filter(([key]) => !key.startsWith('_'));

  for (const [exerciseId, youtubeUrl] of exerciseLinks) {
    // Match: id: 'exercise-id' ... youtubeQuery: 'old-url'
    // The [\s\S]*? is non-greedy match for anything including newlines
    const regex = new RegExp(`(id:\\s*'${exerciseId}'[\\s\\S]*?youtubeQuery:\\s*)'[^']*'`, 'g');
    const newContent = content.replace(regex, `$1'${youtubeUrl}'`);

    if (newContent !== content) {
      content = newContent;
      updateCount++;
      updated.push(exerciseId);
    } else {
      notFound.push(exerciseId);
    }
  }

  if (updateCount > 0) {
    // Create backup
    const backupPath = CONFIG.exercisesFile + '.youtube-backup';
    fs.copyFileSync(CONFIG.exercisesFile, backupPath);
    console.log(`Backup created: ${backupPath}`);

    // Write updated content
    fs.writeFileSync(CONFIG.exercisesFile, content);
    console.log(`\nUpdated ${updateCount} YouTube URLs:`);
    updated.forEach(id => console.log(`  ✓ ${id}`));
  } else {
    console.log('No updates needed');
  }

  if (notFound.length > 0) {
    console.log(`\nExercise IDs not found in exercises.ts (${notFound.length}):`);
    notFound.forEach(id => console.log(`  ✗ ${id}`));
  }
}

function showStatus() {
  if (!fs.existsSync(CONFIG.verifiedLinksFile)) {
    console.log('No verified-youtube-links.json file found.');
    return;
  }

  const verifiedLinks = JSON.parse(fs.readFileSync(CONFIG.verifiedLinksFile, 'utf-8'));
  const exerciseLinks = Object.entries(verifiedLinks).filter(([key]) => !key.startsWith('_'));

  console.log(`Verified YouTube links: ${exerciseLinks.length}`);
  console.log('\nExercises with verified URLs:');
  exerciseLinks.forEach(([id, url]) => {
    console.log(`  ${id}: ${url}`);
  });
}

const command = process.argv[2];
switch (command) {
  case 'update':
    updateExercisesFile();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log(`
YouTube Link Update Script

Usage: node update-youtube-links.js <command>

Commands:
  update  - Update exercises.ts with verified YouTube URLs
  status  - Show verified links in verified-youtube-links.json

Files:
  Input:  scripts/verified-youtube-links.json
  Output: lib/exercises.ts (with backup created)
`);
}
