#!/usr/bin/env node
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(process.argv[2] || '.');
const siteDir = path.join(root, 'ielts-nghe');
const manifestPath = path.join(__dirname, 'visual-manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

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
const pages = fs.readdirSync(siteDir).filter((name) => {
  if (!name.endsWith('.html')) return false;
  return /const DATA\s*=\s*/.test(fs.readFileSync(path.join(siteDir, name), 'utf8'));
}).sort();
assert.equal(pages.length, 40, 'Expected all 40 weekly IELTS Listening pages');

const tests = new Map();
const actualAssetRefs = new Map();
let sectionCount = 0;
let questionCount = 0;
let dictationGapCount = 0;
let sourceImageCount = 0;

for (const name of pages) {
  const file = path.join(siteDir, name);
  const text = fs.readFileSync(file, 'utf8');
  const data = parseData(text, name);
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

    const gaps = section.clozeAnswers || section.dictationAnswers || [];
    assert.equal(gaps.length, 20, `Test ${test} Section ${sectionNumber}: expected 20 dictation gaps`);
    dictationGapCount += gaps.length;
    summary.gaps += gaps.length;

    if (Array.isArray(section.questions)) {
      assert.equal(section.questions.length, 10, `Test ${test} Section ${sectionNumber}: expected 10 questions`);
      for (const item of section.questions) summary.questions.add(Number(item.number));
    } else {
      for (let number = (sectionNumber - 1) * 10 + 1; number <= sectionNumber * 10; number += 1) {
        summary.questions.add(number);
      }
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
}
assert.deepEqual([...actualAssetRefs.keys()].sort(), [...expectedRefs.keys()].sort(), 'Visual manifest and page references differ');

console.log(`PASS visual audit: ${manifest.assets.length} verified source assets, ${manifest.structuredFlows.length} reviewed structured flows, 0 hand-drawn spatial diagrams`);
console.log(`PASS full audit: ${tests.size} tests, ${sectionCount} sections, ${questionCount} questions, ${dictationGapCount} dictation gaps`);
