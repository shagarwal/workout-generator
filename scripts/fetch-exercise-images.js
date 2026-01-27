/**
 * Exercise Image Fetcher Script - Robust Version
 *
 * Downloads exercise demonstration images by:
 * 1. Searching for the exercise page on muscleandstrength.com
 * 2. Extracting the actual image URL from the page
 * 3. Downloading the image
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CONFIG = {
  outputDir: path.join(__dirname, '..', 'public', 'exercise-images'),
  exercisesFile: path.join(__dirname, '..', 'lib', 'exercises.ts'),
  mappingFile: path.join(__dirname, '..', 'exercise-image-mapping.json'),
  urlsFile: path.join(__dirname, 'exercise-urls.json'),
  requestDelay: 1500,
};

if (!fs.existsSync(CONFIG.outputDir)) {
  fs.mkdirSync(CONFIG.outputDir, { recursive: true });
}

function parseExercises() {
  const content = fs.readFileSync(CONFIG.exercisesFile, 'utf-8');
  const exerciseRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'/g;
  const exercises = [];
  let match;
  while ((match = exerciseRegex.exec(content)) !== null) {
    exercises.push({ id: match[1], name: match[2] });
  }
  return exercises;
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        ...options.headers,
      },
    };

    const req = protocol.request(reqOptions, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = `${urlObj.protocol}//${urlObj.hostname}${redirectUrl}`;
        }
        makeRequest(redirectUrl, options).then(resolve).catch(reject);
        return;
      }

      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data, headers: res.headers }));
    });

    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function downloadImage(url, filepath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;

    const request = protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Referer': `${urlObj.protocol}//${urlObj.hostname}/`,
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        let redirectUrl = response.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = `${urlObj.protocol}//${urlObj.hostname}${redirectUrl}`;
        }
        downloadImage(redirectUrl, filepath).then(resolve).catch(reject);
        return;
      }

      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const fileStream = fs.createWriteStream(filepath);
      response.pipe(fileStream);
      fileStream.on('finish', () => { fileStream.close(); resolve(filepath); });
      fileStream.on('error', (err) => { fs.unlink(filepath, () => {}); reject(err); });
    });

    request.on('error', reject);
    request.setTimeout(30000, () => { request.destroy(); reject(new Error('Timeout')); });
  });
}

function getImageExtension(url) {
  try {
    const ext = path.extname(new URL(url).pathname).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return ext;
  } catch (e) {}
  return '.jpg';
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract image URL from M&S page HTML
 */
function extractImageFromPage(html) {
  // Try multiple patterns to find the exercise image
  const patterns = [
    // Schema markup image
    /"image"\s*:\s*"(https:\/\/cdn\.muscleandstrength\.com\/sites\/default\/files\/[^"]+)"/i,
    // Open Graph image
    /property="og:image"\s+content="(https:\/\/cdn\.muscleandstrength\.com[^"]+)"/i,
    /content="(https:\/\/cdn\.muscleandstrength\.com[^"]+)"\s+property="og:image"/i,
    // Direct CDN reference
    /(https:\/\/cdn\.muscleandstrength\.com\/sites\/default\/files\/[a-zA-Z0-9_-]+\.(?:jpg|jpeg|png|gif))/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && !match[1].includes('logo') && !match[1].includes('icon')) {
      return match[1];
    }
  }
  return null;
}

/**
 * Generate possible M&S URLs for an exercise
 */
function generateMSUrls(exerciseName) {
  const cleanName = exerciseName
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^\w\s-]/g, ' ')
    .trim();

  const slug = cleanName.replace(/\s+/g, '-').replace(/-+/g, '-');

  // Generate multiple URL patterns to try
  const urls = [
    `https://www.muscleandstrength.com/exercises/${slug}.html`,
    `https://www.muscleandstrength.com/exercises/${slug}s.html`,
  ];

  // Add variations
  if (slug.includes('dumbbell')) {
    urls.push(`https://www.muscleandstrength.com/exercises/${slug.replace('dumbbell-', '')}.html`);
  }
  if (slug.includes('barbell')) {
    urls.push(`https://www.muscleandstrength.com/exercises/${slug.replace('barbell-', '')}.html`);
  }
  if (!slug.includes('dumbbell') && !slug.includes('barbell')) {
    urls.push(`https://www.muscleandstrength.com/exercises/dumbbell-${slug}.html`);
    urls.push(`https://www.muscleandstrength.com/exercises/barbell-${slug}.html`);
  }

  return urls;
}

/**
 * Find image URL by fetching the M&S page
 */
async function findImageUrl(exerciseName, exerciseId) {
  const urls = generateMSUrls(exerciseName);

  for (const url of urls) {
    try {
      const response = await makeRequest(url);
      if (response.statusCode === 200) {
        const imageUrl = extractImageFromPage(response.data);
        if (imageUrl) {
          return imageUrl;
        }
      }
    } catch (e) {
      // Continue to next URL
    }
    await sleep(500);
  }
  return null;
}

/**
 * Load known URLs from JSON file
 */
function loadKnownUrls() {
  if (fs.existsSync(CONFIG.urlsFile)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG.urlsFile, 'utf-8'));
    } catch (e) {}
  }
  return {};
}

/**
 * Save URLs to JSON file
 */
function saveKnownUrls(urls) {
  fs.writeFileSync(CONFIG.urlsFile, JSON.stringify(urls, null, 2));
}

async function fetchAllExerciseImages() {
  console.log('='.repeat(60));
  console.log('Exercise Image Fetcher');
  console.log('='.repeat(60));

  const exercises = parseExercises();
  console.log(`\nFound ${exercises.length} exercises\n`);

  const knownUrls = loadKnownUrls();
  const results = { success: [], failed: [], skipped: [] };
  const imageMapping = {};

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    const progress = `[${i + 1}/${exercises.length}]`;

    // Check if already downloaded
    const existingFiles = fs.readdirSync(CONFIG.outputDir);
    const existingImage = existingFiles.find(f => f.startsWith(exercise.id + '.'));

    if (existingImage) {
      console.log(`${progress} SKIP: ${exercise.name} (exists)`);
      results.skipped.push(exercise.id);
      imageMapping[exercise.id] = `/exercise-images/${existingImage}`;
      continue;
    }

    // Try known URL first
    let imageUrl = knownUrls[exercise.id];

    // If no known URL or it failed before, search for it
    if (!imageUrl) {
      console.log(`${progress} SEARCH: ${exercise.name}...`);
      imageUrl = await findImageUrl(exercise.name, exercise.id);

      if (imageUrl) {
        // Save the found URL for future runs
        knownUrls[exercise.id] = imageUrl;
        saveKnownUrls(knownUrls);
      }

      await sleep(CONFIG.requestDelay);
    }

    if (!imageUrl) {
      console.log(`${progress} FAIL: ${exercise.name} (no image found)`);
      results.failed.push({ id: exercise.id, name: exercise.name });
      continue;
    }

    // Download the image
    try {
      const ext = getImageExtension(imageUrl);
      const filename = `${exercise.id}${ext}`;
      const filepath = path.join(CONFIG.outputDir, filename);

      console.log(`${progress} DOWNLOAD: ${exercise.name}`);

      await downloadImage(imageUrl, filepath);

      const stats = fs.statSync(filepath);
      if (stats.size < 1000) {
        throw new Error('File too small');
      }

      console.log(`  OK: ${filename} (${Math.round(stats.size / 1024)}KB)`);
      results.success.push({ id: exercise.id, name: exercise.name, file: filename });
      imageMapping[exercise.id] = `/exercise-images/${filename}`;

      await sleep(300);
    } catch (err) {
      console.log(`  FAIL: ${err.message}`);
      // Remove bad URL so we search again next time
      delete knownUrls[exercise.id];
      saveKnownUrls(knownUrls);
      results.failed.push({ id: exercise.id, name: exercise.name, url: imageUrl });
    }

    // Save mapping periodically
    if (i % 10 === 0) {
      fs.writeFileSync(CONFIG.mappingFile, JSON.stringify(imageMapping, null, 2));
    }
  }

  fs.writeFileSync(CONFIG.mappingFile, JSON.stringify(imageMapping, null, 2));

  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total: ${exercises.length}`);
  console.log(`Downloaded: ${results.success.length}`);
  console.log(`Skipped: ${results.skipped.length}`);
  console.log(`Failed: ${results.failed.length}`);

  if (results.failed.length > 0 && results.failed.length <= 50) {
    console.log('\nFailed:');
    results.failed.forEach(f => console.log(`  - ${f.id}: ${f.name}`));
  }

  return results;
}

function updateExercisesFile() {
  if (!fs.existsSync(CONFIG.mappingFile)) {
    console.log('No mapping file. Run fetch first.');
    return;
  }

  const mapping = JSON.parse(fs.readFileSync(CONFIG.mappingFile, 'utf-8'));
  let content = fs.readFileSync(CONFIG.exercisesFile, 'utf-8');
  let updateCount = 0;

  for (const [exerciseId, imagePath] of Object.entries(mapping)) {
    const regex = new RegExp(`(id:\\s*'${exerciseId}'[\\s\\S]*?imageUrl:\\s*)'[^']*'`, 'g');
    const newContent = content.replace(regex, `$1'${imagePath}'`);
    if (newContent !== content) {
      content = newContent;
      updateCount++;
    }
  }

  if (updateCount > 0) {
    fs.copyFileSync(CONFIG.exercisesFile, CONFIG.exercisesFile + '.backup');
    fs.writeFileSync(CONFIG.exercisesFile, content);
    console.log(`Updated ${updateCount} image URLs`);
  } else {
    console.log('No updates needed');
  }
}

function listStatus() {
  const exercises = parseExercises();
  const existingFiles = fs.readdirSync(CONFIG.outputDir);
  let has = 0, missing = 0;

  exercises.forEach(ex => {
    const exists = existingFiles.find(f => f.startsWith(ex.id + '.'));
    if (exists) has++; else missing++;
  });

  console.log(`Total: ${exercises.length} | Downloaded: ${has} | Missing: ${missing}`);
}

const command = process.argv[2];
switch (command) {
  case 'fetch': fetchAllExerciseImages().catch(console.error); break;
  case 'update': updateExercisesFile(); break;
  case 'status': listStatus(); break;
  default:
    console.log(`
Usage: node fetch-exercise-images.js <command>

Commands:
  fetch   - Download exercise images
  update  - Update exercises.ts with image paths
  status  - Show download status
`);
}
