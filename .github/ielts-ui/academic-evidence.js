(function(root){
/** Pure, evidence-only class progress scoring. No network, writes or prose parsing. */
const ACADEMIC_SKILLS = ['reading', 'listening', 'writing', 'speaking'];
const COMPONENT_WEIGHTS = Object.freeze({reading: .2, listening: .2, writing: .2, speaking: .2, habit: .2});
const DAY = 86400000, OFFSET = 7 * 3600000;
const families = {reading: 'SELF_READING', listening: 'SELF_LISTENING', writing: 'HW_WRITING', speaking: 'HW_SPEAKING', shadowing: 'SELF_SHADOWING'};
const list = value => Array.isArray(value) ? value : [];
const finite = value => typeof value === 'number' && Number.isFinite(value);
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const canonical = value => String(value || '').trim().toUpperCase();
const mean = rows => rows.reduce((sum, value) => sum + value, 0) / rows.length;

function parseSourceTime(value, endOfDay = false) {
  if (finite(value)) return value > 1e11 ? value : 0;
  const text = String(value || '').trim();
  if (/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(text)) return Date.parse(text) || 0;
  let m = text.match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d\d):(\d\d)(?::(\d\d))?)?$/);
  if (m) m = [m[0], m[3], m[2], m[1], m[4], m[5], m[6]];
  else m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ ·,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return 0;
  const [, day, month, year, hour, minute, second] = m;
  const d = new Date(Date.UTC(+year, +month - 1, +day, +(hour || 0), +(minute || 0), +(second || 0)));
  if (d.getUTCFullYear() !== +year || d.getUTCMonth() !== +month - 1 || d.getUTCDate() !== +day || +(hour || 0) > 23 || +(minute || 0) > 59 || +(second || 0) > 59) return 0;
  return d.getTime() - OFFSET + (endOfDay && hour === undefined ? DAY - 1 : 0);
}

function assessmentTime(row) {
  const dates = list(row.dates).concat(row.date || []).flatMap(text => {
    const ranged = String(text).match(/^(\d{1,2})-(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    return ranged ? [`${ranged[2]}/${ranged[3]}/${ranged[4]}`] : [text];
  });
  return Math.max(0, ...dates.map(value => parseSourceTime(value, true)));
}

function normalizeScore(row, {bandOnly = false} = {}) {
  if (!row || row.dataConflict === true) return null;
  if (finite(row?.band) && row.band >= 0 && row.band <= 9) return {value: round(row.band / 9 * 100), scale: 'band/9', band: row.band};
  const raw = row?.raw ?? row?.score, maximum = row?.max ?? row?.maximum;
  if (!bandOnly && finite(raw) && finite(maximum) && maximum > 0 && raw >= 0 && raw <= maximum) return {value: round(raw / maximum * 100), scale: 'raw/max', raw, maximum};
  return null;
}

function packetParts(packet) {
  const actions = packet?.actions || {};
  return {packet, student: actions.profile?.student || actions.bootstrap?.profile?.student || {}, dashboard: actions.dashboard || actions.bootstrap?.dashboard || {}, submissions: actions.submissions || {}};
}

function assessmentKey(row) {
  return String(row.officialAssessmentKey || row.id || row.code || '');
}

function componentBand(row, skill) {
  if (row.dataConflict) return null;
  const parts = list(row.components).filter(part => part.skill === skill && !part.dataConflict && normalizeScore(part, {bandOnly: true}));
  if (!parts.length) return null;
  // A published overall/mean is authoritative; do not also average its four criteria.
  const overall = parts.filter(part => /(?:điểm\s*trung\s*bình|overall|average)/iu.test(String(part.label || part.kind || '')));
  if (overall.length === 1) return {band: overall[0].band, basis: 'published-overall-band', count: 1};
  if (parts.length === 1) return {band: parts[0].band, basis: 'published-component-band', count: 1};
  const seen = new Map();
  for (const part of parts) {
    const key = String(part.criterionId || part.writingAssessment?.assessmentKey || part.label || '').trim();
    if (!key) return null;
    const prior = seen.get(key);
    if (prior && prior.band !== part.band) return null;
    seen.set(key, part);
  }
  const unique = [...seen.values()];
  if (unique.length === 1) return {band: unique[0].band, basis: 'published-component-band', count: 1};
  // Only the four explicit Speaking criteria form a complete interchangeable set.
  if (skill === 'speaking' && unique.length === 4) {
    const labels = unique.map(part => String(part.criterionId || part.label).toLowerCase());
    if (['fluency', 'pronunciation', 'vocabulary', 'grammar'].every(label => labels.some(text => text.includes(label)))) return {band: mean(unique.map(part => part.band)), basis: 'mean-four-published-criteria', count: 4};
  }
  return null;
}

function academicEvidence(packet) {
  const {student} = packetParts(packet), rows = [];
  for (const assessment of list(student.assessmentResults)) {
    const key = assessmentKey(assessment);
    if (!key) continue;
    for (const skill of ACADEMIC_SKILLS) {
      const result = componentBand(assessment, skill);
      if (!result) continue;
      rows.push({skill, key, source: 'published-class-assessment', sourceDate: assessment.date || '', sourceAt: assessmentTime(assessment), title: assessment.title || assessment.code || '', band: round(result.band), value: round(result.band / 9 * 100), scale: 'band/9', basis: result.basis, componentCount: result.count});
    }
  }
  const unique = new Map();
  for (const row of rows) {
    const key = `${row.skill}|${row.key}`, prior = unique.get(key);
    if (!prior || row.sourceAt > prior.sourceAt) unique.set(key, row);
    else if (row.sourceAt === prior.sourceAt && row.band !== prior.band) unique.set(key, {...prior, conflict: true});
  }
  return [...unique.values()].filter(row => !row.conflict);
}

/** Homework diagnostics only: latest real scored attempt per exact assignment/part. */
function latestHomeworkEvidence(packet) {
  const {student, submissions} = packetParts(packet), rows = [];
  for (const receipt of list(submissions.receipts)) {
    if (receipt.receiptType !== 'attempt' || receipt.scoreSource !== 'original-grading') continue;
    const skill = Object.keys(families).find(key => families[key] === receipt.family);
    const score = normalizeScore(receipt);
    if (!score || !skill) continue;
    rows.push({...score, skill, code: canonical(receipt.code), part: String(receipt.part || ''), sourceAt: parseSourceTime(receipt.submittedAtMs) || parseSourceTime(receipt.submittedAt), source: 'original-grading', id: String(receipt.id || '')});
  }
  for (const result of list(student.selfStudyResults)) {
    if (!['reading', 'listening'].includes(result.skill) || result.dataConflict) continue;
    const score = normalizeScore(result);
    if (score) rows.push({...score, skill: result.skill, code: canonical(result.assignmentCode || result.code), part: String(result.part || ''), sourceAt: parseSourceTime(result.submittedAtMs) || parseSourceTime(result.submittedAt), source: 'published-self-study-score', id: String(result.id || '')});
  }
  const latest = new Map();
  for (const row of rows) {
    if (!row.code || !row.sourceAt) continue;
    const key = `${row.skill}|${row.code}|${row.part}`, prior = latest.get(key);
    if (!prior || row.sourceAt > prior.sourceAt || row.sourceAt === prior.sourceAt && row.source === 'original-grading') latest.set(key, row);
  }
  return [...latest.values()].sort((a, b) => a.skill.localeCompare(b.skill) || a.code.localeCompare(b.code) || a.part.localeCompare(b.part));
}


root.IeltsAcademicEvidence=academicEvidence;root.IeltsHomeworkEvidence=latestHomeworkEvidence;
})(globalThis);
