#!/usr/bin/env node
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || '.');
const siteDir = path.join(root, 'ielts-nghe');
const manifestPath = path.join(__dirname, 'visual-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const audioManifestPath = path.join(__dirname, 'audio-manifest.json');
const audioManifest = JSON.parse(fs.readFileSync(audioManifestPath, 'utf8'));

function parseData(text, file) {
  const match = /const DATA\s*=\s*/.exec(text);
  assert(match, `${file}: const DATA is missing`);
  const start = match.index + match[0].length;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '{' || char === '[') depth += 1;
    else if (char === '}' || char === ']') {
      depth -= 1;
      if (depth === 0) return JSON.parse(text.slice(start, i + 1));
    }
  }
  throw new Error(`${file}: DATA is not balanced`);
}

function walkVisuals(value, found = []) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkVisuals(item, found));
  } else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      if (key === 'visual' && item && typeof item === 'object') found.push(item);
      walkVisuals(item, found);
    }
  }
  return found;
}

function digest(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

const forbiddenClasses = ['red-hill-map', 'sheepmarket-map', 'granford-map', 'hinchingbrooke-map'];
const forbiddenVisualTypes = new Set([
  'antigen-antibody-process', 'street-map', 'floor-plan', 'pie-chart', 'bar-chart',
  'hydroelectric-dam', 'site-plan', 'diagram-pair', 'cycle-diagram', 'cloud-diagram',
  'venn-diagram',
]);
const allowedStructured = new Set(manifest.structuredFlows.map((item) => `${item.test}:${item.section}:${item.type}`));
// Fail closed: an unregistered drawing must fail even when its class/type has
// never appeared in the historic blacklist (the heater-board regression).
const approvedHtmlClasses = new Set([
  'exam-section','question-range','task-copy','ielts-listening-section-content-wrapper',
  'ielts-listening-transcript-subhead','question-item','q-number','paper-input',
  'question-list','paper-option','option-letter','question-visual',
  'ielts-listening-matching-table','ielts-listening-matching-question-cell',
  'ielts-listening-matching-option-cell','matching-dnd-questions','inline-choice',
  'option-bank','verified-question-visual','aligncenter','source-answer-grid','source-answer',
]);
function auditQuestionMarkup(html, label) {
  assert(!/<(?:svg|canvas)\b|\brole\s*=\s*["']img["']|\bstyle\s*=/i.test(html), `${label}: unreviewed embedded spatial drawing`);
  for (const match of html.matchAll(/\bclass="([^"]*)"/g)) {
    for (const cls of match[1].trim().split(/\s+/).filter(Boolean)) {
      assert(approvedHtmlClasses.has(cls), `${label}: unreviewed question class ${cls}`);
    }
  }
  if (/label\s+the\s+(?:map|plan|diagram)/i.test(html)) {
    assert(/<img\b/.test(html), `${label}: spatial labelling task has no source image`);
  }
  for (const match of html.matchAll(/<img\b[^>]*>/g)) {
    assert(/src="\.\/question-assets\//.test(match[0]), `${label}: visual must use a registered local source image`);
  }
}
assert.throws(() => auditQuestionMarkup('<div class="new-unknown-board">drawing</div>','regression'), /unreviewed/);
assert.throws(() => auditQuestionMarkup('<p>Label the diagram below.</p><div></div>','regression'), /no source image/);
const pages = fs.readdirSync(siteDir).filter((name) => {
  if (!name.endsWith('.html')) return false;
  return /const DATA\s*=\s*/.test(fs.readFileSync(path.join(siteDir, name), 'utf8'));
}).sort();
assert.equal(pages.length, 40, 'Expected all 40 weekly IELTS Listening pages');

const tests = new Map();
const actualAssetRefs = new Map();
const expectedAudio = new Map();
for (const entry of audioManifest.entries || []) {
  const key = `${entry.test}:${entry.section}`;
  assert(!expectedAudio.has(key), `${key}: duplicate audio manifest entry`);
  expectedAudio.set(key, entry);
}
assert.equal(expectedAudio.size, 120, 'Expected 120 reviewed audio manifest entries');
const reviewedAudio = new Set();
let sectionCount = 0;
let questionCount = 0;
let dictationGapCount = 0;
let sourceImageCount = 0;

for (const name of pages) {
  const file = path.join(siteDir, name);
  const text = fs.readFileSync(file, 'utf8');
  const data = parseData(text, name);
  assert(text.includes('src="./question-visuals.js"') && text.includes('href="./question-visuals.css"'), `${name}: missing shared accessible image viewer`);
  assert(Number.isInteger(Number(data.test)), `${name}: invalid test number`);
  const test = Number(data.test);
  if (!tests.has(test)) tests.set(test, { sections: new Set(), questions: new Set(), gaps: 0, audios: new Set() });
  const summary = tests.get(test);

  for (const className of forbiddenClasses) {
    assert(!text.includes(`class=\"${className}`), `${name}: forbidden hand-drawn map class ${className}`);
  }

  const refs = [...text.matchAll(/\.\/question-assets\/[^"<]+?\.(?:jpg|png|webp)/g)].map((m) => m[0].slice(2));
  for (const ref of new Set(refs)) {
    assert(!actualAssetRefs.has(ref), `${ref}: referenced by more than one page`);
    actualAssetRefs.set(ref, name);
  }

  const visuals = walkVisuals(data);
  for (const visual of visuals) {
    assert(!forbiddenVisualTypes.has(visual.type), `${name}: ${visual.type} must use a verified source image`);
    if (visual.type === 'source-image') {
      sourceImageCount += 1;
      assert(/^\.\/question-assets\//.test(visual.src), `${name}: source image must be local`);
      assert(Array.isArray(visual.questions) && visual.questions.length > 0, `${name}: source image needs answer controls`);
    } else if (visual.type === 'vertical-flow' || visual.type === 'flow-chart' || visual.type === 'cause-effect') {
      const section = data.sections.find((candidate) => (candidate.groups || []).some((group) => group.visual === visual));
      assert(allowedStructured.has(`${test}:${section.number}:${visual.type}`), `${name}: unreviewed structured visual`);
    } else {
      assert.fail(`${name}: unreviewed visual type ${visual.type}`);
    }
  }

  for (const section of data.sections || []) {
    sectionCount += 1;
    const sectionNumber = Number(section.number);
    assert(sectionNumber >= 1 && sectionNumber <= 4, `${name}: invalid section number`);
    assert(!summary.sections.has(sectionNumber), `Test ${test}: duplicated section ${sectionNumber}`);
    summary.sections.add(sectionNumber);
    const audio = String(section.audio || '');
    const isFileAudio = /^\.\/audio\/test-\d+\/section-\d+\.(?:mp3|m4a)$/.test(audio);
    const isEmbeddedAudio = /^data:audio\/(?:ogg|mpeg|mp4);base64,/.test(audio) && audio.length > 100_000;
    assert(isFileAudio || isEmbeddedAudio, `${name}: invalid audio source for section ${sectionNumber}`);
    const audioKey = isEmbeddedAudio ? crypto.createHash('sha256').update(audio).digest('hex') : audio;
    assert(!summary.audios.has(audioKey), `Test ${test}: duplicated audio for section ${sectionNumber}`);
    summary.audios.add(audioKey);

    const reviewKey = `${test}:${sectionNumber}`;
    const review = expectedAudio.get(reviewKey);
    assert(review, `Test ${test} Section ${sectionNumber}: missing semantic audio review`);
    assert(!reviewedAudio.has(reviewKey), `Test ${test} Section ${sectionNumber}: audio reviewed twice`);
    reviewedAudio.add(reviewKey);
    assert.equal(review.page, name, `Test ${test} Section ${sectionNumber}: reviewed page mismatch`);
    let audioBytes;
    let audioRef;
    if (isEmbeddedAudio) {
      audioBytes = Buffer.from(audio.slice(audio.indexOf(',') + 1), 'base64');
      audioRef = 'embedded';
    } else {
      audioRef = audio.slice(2);
      const audioFile = path.join(siteDir, audioRef);
      assert(fs.existsSync(audioFile), `Test ${test} Section ${sectionNumber}: audio file is missing`);
      audioBytes = fs.readFileSync(audioFile);
    }
    assert.equal(review.audio, audioRef, `Test ${test} Section ${sectionNumber}: audio reference changed`);
    assert.equal(review.bytes, audioBytes.length, `Test ${test} Section ${sectionNumber}: audio byte count changed`);
    assert.equal(
      review.sha256,
      crypto.createHash('sha256').update(audioBytes).digest('hex'),
      `Test ${test} Section ${sectionNumber}: audio changed without semantic review`,
    );
    assert(review.durationSeconds > 30, `Test ${test} Section ${sectionNumber}: reviewed duration is invalid`);
    assert.equal(review.asrReview.matchedTest, test, `Test ${test} Section ${sectionNumber}: ASR matched another test`);
    assert.equal(review.asrReview.matchedSection, sectionNumber, `Test ${test} Section ${sectionNumber}: ASR matched another section`);
    assert(review.asrReview.score >= 0.10, `Test ${test} Section ${sectionNumber}: ASR confidence is too low`);

    const gaps = section.clozeAnswers || section.dictationAnswers || [];
    assert.equal(gaps.length, 20, `Test ${test} Section ${sectionNumber}: expected 20 dictation gaps`);
    dictationGapCount += gaps.length;
    summary.gaps += gaps.length;

    if (Array.isArray(section.questions)) {
      assert.equal(section.questions.length, 10, `Test ${test} Section ${sectionNumber}: expected 10 questions`);
      for (const item of section.questions) summary.questions.add(Number(item.number));
    } else {
      auditQuestionMarkup(section.questions, `Test ${test} Section ${sectionNumber}`);
      const actual = new Set([...section.questions.matchAll(/data-q="(\d+)"/g)].map(m => Number(m[1])));
      for (const match of section.questions.matchAll(/data-group="(\d+)-(\d+)"/g)) {
        for (let number = Number(match[1]); number <= Number(match[2]); number++) actual.add(number);
      }
      assert.deepEqual([...actual].sort((a,b) => a-b), Array.from({length:10}, (_,i) => (sectionNumber-1)*10+i+1), `Test ${test} Section ${sectionNumber}: missing or misplaced answer controls`);
      for (const number of actual) summary.questions.add(number);
    }
  }
}

for (const [test, summary] of [...tests.entries()].sort((a, b) => a[0] - b[0])) {
  assert.deepEqual([...summary.sections].sort(), [1, 2, 3, 4], `Test ${test}: sections are incomplete`);
  assert.deepEqual([...summary.questions].sort((a, b) => a - b), Array.from({ length: 40 }, (_, i) => i + 1), `Test ${test}: question numbers are incomplete`);
  assert.equal(summary.gaps, 80, `Test ${test}: dictation set is incomplete`);
  assert.equal(summary.audios.size, 4, `Test ${test}: audio set is incomplete`);
  questionCount += summary.questions.size;
  console.log(`PASS Test ${String(test).padStart(2, '0')}: 4 sections, 40 questions, 4 audios, 80 dictation gaps`);
}

assert.equal(tests.size, 30, 'Expected Tests 1-30');
assert.equal(sectionCount, 120, 'Expected 120 sections');
assert.equal(questionCount, 1200, 'Expected 1,200 questions');
assert.equal(dictationGapCount, 2400, 'Expected 2,400 dictation gaps');
assert.equal(reviewedAudio.size, 120, 'Expected all 120 section audios to be reviewed');
assert.equal(sourceImageCount, 11, 'Expected 11 converted legacy source visuals');

const expectedRefs = new Map();
for (const item of manifest.assets) {
  assert(!expectedRefs.has(item.asset), `${item.asset}: duplicate manifest entry`);
  expectedRefs.set(item.asset, item);
  const file = path.join(siteDir, item.asset);
  assert(fs.existsSync(file), `${item.asset}: asset is missing`);
  assert(fs.statSync(file).size >= 20_000, `${item.asset}: asset is unexpectedly small`);
  assert.equal(digest(file), item.sha256, `${item.asset}: source image changed without review`);
  assert.equal(actualAssetRefs.get(item.asset), item.page, `${item.asset}: page reference mismatch`);
  if (item.reviewedAnswers) {
    const data = parseData(fs.readFileSync(path.join(siteDir, item.page), 'utf8'), item.page);
    for (const [number, answer] of Object.entries(item.reviewedAnswers)) {
      assert.deepEqual(data.answers[number], [answer], `${item.asset}: answer ${number} differs from reviewed source`);
    }
  }
}
assert.deepEqual([...actualAssetRefs.keys()].sort(), [...expectedRefs.keys()].sort(), 'Visual manifest and page references differ');

console.log(`PASS visual audit: ${manifest.assets.length} verified source assets, ${manifest.structuredFlows.length} reviewed structured flows, 0 hand-drawn spatial diagrams`);
console.log(`PASS audio audit: ${reviewedAudio.size} section audios locked to transcript-matched SHA-256 files`);
console.log(`PASS full audit: ${tests.size} tests, ${sectionCount} sections, ${questionCount} questions, ${dictationGapCount} dictation gaps`);
