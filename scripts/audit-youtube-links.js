/**
 * YouTube Link Audit Script
 *
 * Checks all YouTube URLs in exercises.ts for validity using the YouTube oEmbed API.
 * Outputs a report categorizing each exercise as valid_correct, valid_wrong, or broken.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CONFIG = {
  exercisesFile: path.join(__dirname, '..', 'lib', 'exercises.ts'),
  outputFile: path.join(__dirname, 'youtube-audit-results.json'),
  requestDelay: 500, // ms between requests
};

function parseExercises() {
  const content = fs.readFileSync(CONFIG.exercisesFile, 'utf-8');
  const exerciseRegex = /{\s*id:\s*'([^']+)',\s*name:\s*'([^']+)'[\s\S]*?youtubeQuery:\s*'([^']+)'/g;
  const exercises = [];
  let match;
  while ((match = exerciseRegex.exec(content)) !== null) {
    exercises.push({ id: match[1], name: match[2], youtubeQuery: match[3] });
  }
  return exercises;
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });

    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function tokenize(str) {
  const stopWords = new Set(['the', 'a', 'an', 'with', 'and', 'or', 'for', 'to', 'of', 'in', 'on', 'at', 'how', 'do', 'your']);
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopWords.has(w));
}

function checkTitleMatch(exerciseName, videoTitle) {
  const nameTokens = tokenize(exerciseName);
  const titleLower = videoTitle.toLowerCase();
  const matchCount = nameTokens.filter(token => titleLower.includes(token)).length;
  return nameTokens.length > 0 ? matchCount / nameTokens.length >= 0.5 : false;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function auditExercise(exercise) {
  const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(exercise.youtubeQuery)}&format=json`;

  try {
    const response = await makeRequest(oembedUrl);

    if (response.statusCode === 200) {
      const data = JSON.parse(response.data);
      const titleMatch = checkTitleMatch(exercise.name, data.title);
      return {
        id: exercise.id,
        name: exercise.name,
        currentUrl: exercise.youtubeQuery,
        status: titleMatch ? 'valid_correct' : 'valid_wrong',
        videoTitle: data.title,
        httpStatus: 200,
        needsReplacement: !titleMatch,
      };
    } else {
      return {
        id: exercise.id,
        name: exercise.name,
        currentUrl: exercise.youtubeQuery,
        status: 'broken',
        videoTitle: null,
        httpStatus: response.statusCode,
        needsReplacement: true,
      };
    }
  } catch (err) {
    return {
      id: exercise.id,
      name: exercise.name,
      currentUrl: exercise.youtubeQuery,
      status: 'broken',
      videoTitle: null,
      httpStatus: null,
      error: err.message,
      needsReplacement: true,
    };
  }
}

async function main() {
  console.log('Parsing exercises...');
  const exercises = parseExercises();
  console.log(`Found ${exercises.length} exercises\n`);

  const results = [];
  let valid_correct = 0;
  let valid_wrong = 0;
  let broken = 0;

  for (let i = 0; i < exercises.length; i++) {
    const exercise = exercises[i];
    process.stdout.write(`[${i + 1}/${exercises.length}] Checking ${exercise.name}... `);

    const result = await auditExercise(exercise);
    results.push(result);

    if (result.status === 'valid_correct') {
      valid_correct++;
      console.log(`OK (${result.videoTitle})`);
    } else if (result.status === 'valid_wrong') {
      valid_wrong++;
      console.log(`WRONG VIDEO: "${result.videoTitle}"`);
    } else {
      broken++;
      console.log(`BROKEN (${result.httpStatus || result.error})`);
    }

    if (i < exercises.length - 1) {
      await delay(CONFIG.requestDelay);
    }
  }

  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: exercises.length,
      valid_correct,
      valid_wrong,
      broken,
    },
    exercises: results,
  };

  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(report, null, 2));

  console.log('\n--- AUDIT SUMMARY ---');
  console.log(`Total exercises: ${exercises.length}`);
  console.log(`Valid & correct: ${valid_correct}`);
  console.log(`Valid but wrong video: ${valid_wrong}`);
  console.log(`Broken/deleted: ${broken}`);
  console.log(`\nReport saved to: ${CONFIG.outputFile}`);
}

main().catch(console.error);
