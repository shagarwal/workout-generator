/**
 * Script to mark exercises that don't have proper images
 * Sets imageUrl to empty string and adds needsImage: true
 */

const fs = require('fs');
const path = require('path');

const exercisesFile = path.join(__dirname, '..', 'lib', 'exercises.ts');
const imageDir = path.join(__dirname, '..', 'public', 'exercise-images');

// Get list of downloaded images
const existingImages = fs.readdirSync(imageDir);

// Read exercises.ts
let content = fs.readFileSync(exercisesFile, 'utf-8');

// Parse exercise IDs from file
const exerciseRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
const exercises = [];
let match;
while ((match = exerciseRegex.exec(content)) !== null) {
  exercises.push({ id: match[1], name: match[2] });
}

// Find exercises without images
const missingImages = exercises.filter(ex =>
  !existingImages.find(f => f.startsWith(ex.id + '.'))
);

console.log(`Found ${missingImages.length} exercises without images`);

// For each exercise without image, update the imageUrl to empty and add needsImage: true
let updateCount = 0;
for (const ex of missingImages) {
  // Pattern to find this exercise's imageUrl line
  // Matches: imageUrl: '/some/path.jpg', or imageUrl: 'https://...',
  const regex = new RegExp(
    `(id:\\s*'${ex.id}'[\\s\\S]*?)(imageUrl:\\s*)'[^']*'`,
    'g'
  );

  const newContent = content.replace(regex, `$1$2'' // TODO: needs image`);

  if (newContent !== content) {
    content = newContent;
    updateCount++;
    console.log(`  Updated: ${ex.name}`);
  }
}

// Write back
if (updateCount > 0) {
  // Backup first
  fs.copyFileSync(exercisesFile, exercisesFile + '.backup2');
  fs.writeFileSync(exercisesFile, content);
  console.log(`\nUpdated ${updateCount} exercises with empty imageUrl and TODO comment`);
} else {
  console.log('\nNo updates needed');
}
