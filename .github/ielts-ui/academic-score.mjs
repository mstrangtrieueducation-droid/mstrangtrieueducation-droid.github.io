/** Pure, evidence-only class progress scoring. No network, writes or prose parsing. */
export const ACADEMIC_SKILLS = ['reading', 'listening', 'writing', 'speaking'];
export const COMPONENT_WEIGHTS = Object.freeze({reading: .2, listening: .2, writing: .2, speaking: .2, habit: .2});
const DAY = 86400000, OFFSET = 7 * 3600000;
const families = {reading: 'SELF_READING', listening: 'SELF_LISTENING', writing: 'HW_WRITING', speaking: 'HW_SPEAKING', shadowing: 'SELF_SHADOWING'};
const list = value => Array.isArray(value) ? value : [];
const finite = value => typeof value === 'number' && Number.isFinite(value);
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const canonical = value => String(value || '').trim().toUpperCase();
const mean = rows => rows.reduce((sum, value) => sum + value, 0) / rows.length;

export function parseSourceTime(value, endOfDay = false) {
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

export function normalizeScore(row, {bandOnly = false} = {}) {
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

export function academicEvidence(packet) {
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
export function latestHomeworkEvidence(packet) {
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

function explicitMaps(item) {
  const code = canonical(item.assignmentCode || item.sourceCode), family = families[item.skill];
  if (!family || !/^(?:IELTS-(?:SELF-READING-(?:T\d+(?:-P\d+)?|R\d+)|SELF-LISTENING-L\d+|SPEAKING-S\d+|WRITING-W\d+)|SHADOW-L[12]-\d{3})$/.test(code)) return [];
  return [{code, family}];
}

function inStudentScope(item, student) {
  const released = parseSourceTime(item.releaseDate || item.lessonDate || item.assignedAt), joined = parseSourceTime(student.joinDate);
  if (joined && (!released || released < joined)) return false;
  if (item.skill === 'speaking' && /^group[12]$/.test(student.speakingGroup || '')) {
    const assigned = String(item.scheduleClassName || '').match(/\.(1|2)\s*$/);
    if (assigned && assigned[1] !== student.speakingGroup.slice(-1)) return false;
  }
  return true;
}

function coverageKnows(submissions, packet, map, dueAt) {
  if (packet.sourceStatus?.servingLastConfirmed || submissions.submissionVerification?.complete !== true || submissions.submissionVerification?.freshRead !== true || submissions.assignmentAuthority?.complete !== true || submissions.assignmentAuthority?.freshRead !== true) return false;
  return list(submissions.coverage).some(row => {
    if (row.family !== map.family || row.complete !== true || row.freshRead !== true || !finite(row.verifiedAt) || row.verifiedAt < dueAt) return false;
    if (list(row.codes).some(code => canonical(code) === canonical(map.code))) return true;
    return list(row.codePatterns).some(pattern => {
      if (typeof pattern !== 'string' || pattern.length > 250 || !pattern.startsWith('^') || !pattern.endsWith('$')) return false;
      try { return new RegExp(pattern).test(canonical(map.code)); } catch { return false; }
    });
  });
}

function receiptHasContent(receipt) {
  if (receipt.receiptType === 'grading-summary' || receipt.contentStatus === 'empty') return false;
  if (receipt.receiptType === 'attempt' && receipt.scoreSource === 'original-grading' && normalizeScore(receipt)) return true;
  return Boolean(receipt.contentStatus === 'complete' || list(receipt.links).some(link => /^https:\/\//i.test(link.url || '')) || /^https:\/\//i.test(receipt.viewUrl || ''));
}

export function habitEvidence(packet, options = {}) {
  const {student, dashboard, submissions} = packetParts(packet), now = options.now ?? Date.now();
  const windowDays = options.windowDays ?? 56, startAt = now - windowDays * DAY;
  const raw = list(dashboard.assignments).concat(list(dashboard.shadowingAssignments));
  const byId = new Map(raw.filter(Boolean).map(item => [String(item.id || [item.skill, item.assignmentCode, item.lessonDate].join('|')), item]));
  const assignments = [...byId.values()].filter(item => families[item.skill] && !item.noHomework && list(item.tasks).length && inStudentScope(item, student)).map(item => {
    const maps = (options.resolveAssignment ? options.resolveAssignment(item, student, dashboard) : explicitMaps(item)) || [];
    return {item, assignedAt: parseSourceTime(item.releaseDate || item.lessonDate || item.assignedAt), dueAt: parseSourceTime(item.dueAt || item.deadlineAt || item.dueDate, true), maps: list(maps).filter(map => map?.code && map?.family).map(map => ({...map, code: canonical(map.code)}))};
  });
  let due = assignments.filter(row => row.assignedAt && row.assignedAt <= now && row.dueAt >= startAt && row.dueAt < now && row.dueAt >= row.assignedAt);
  if (options.latestPerSkill) due = due.filter(row => !due.some(other => other.item.skill === row.item.skill && other.dueAt > row.dueAt));
  const allRows = due.map(row => {
    const scopeKey = row.maps.map(map => `${map.family}:${map.code}`).sort().join('|');
    if (!row.maps.length) return {id: row.item.id, skill: row.item.skill, scopeKey: '', assignedAt: row.assignedAt, dueAt: row.dueAt, state: 'unknown', reason: 'assignment-code-unresolved'};
    const parts = row.maps.flatMap(map => (list(map.requiredParts).length ? map.requiredParts : ['']).map(part => {
      const nextRelease = Math.min(Infinity, ...assignments.filter(other => other.assignedAt > row.assignedAt && other.maps.some(otherMap => otherMap.family === map.family && otherMap.code === map.code)).map(other => other.assignedAt));
      const receipts = list(submissions.receipts).filter(receipt => {
        const at = parseSourceTime(receipt.submittedAtMs) || parseSourceTime(receipt.submittedAt);
        return receipt.family === map.family && canonical(receipt.code) === map.code && (!part || String(receipt.part || '') === String(part)) && at >= row.assignedAt && at < nextRelease && at <= now && receiptHasContent(receipt);
      });
      return {map, part, firstAt: receipts.length ? Math.min(...receipts.map(receipt => parseSourceTime(receipt.submittedAtMs) || parseSourceTime(receipt.submittedAt))) : 0, negativeVerified: coverageKnows(submissions, packet, map, row.dueAt)};
    }));
    const complete = parts.length > 0 && parts.every(part => part.firstAt);
    const known = complete || parts.every(part => part.firstAt || part.negativeVerified);
    const completedAt = complete ? Math.max(...parts.map(part => part.firstAt)) : null;
    return {id: row.item.id, skill: row.item.skill, scopeKey, codes: [...new Set(row.maps.map(map => map.code))], assignedAt: row.assignedAt, dueAt: row.dueAt, state: complete ? 'completed' : known ? 'not-completed' : 'unknown', completedAt, onTime: complete ? completedAt <= row.dueAt : known ? false : null, reason: known ? '' : 'source-not-verified'};
  });
  const selectedKeys = options.habitScope ? new Set(options.habitScope.keys || options.habitScope) : null;
  const rows = selectedKeys ? allRows.filter(row => selectedKeys.has(row.scopeKey)) : allRows;
  const known = rows.filter(row => row.state !== 'unknown'), shadow = rows.filter(row => row.skill === 'shadowing'), knownShadow = shadow.filter(row => row.state !== 'unknown');
  const completedShadowing = knownShadow.filter(row => row.state === 'completed').length, onTime = known.filter(row => row.onTime === true).length;
  const completionRate = knownShadow.length ? completedShadowing / knownShadow.length * 100 : null;
  const onTimeRate = known.length ? onTime / known.length * 100 : null;
  const missing = [];
  if (completionRate === null) missing.push('shadowing-evidence');
  if (onTimeRate === null) missing.push('timeliness-evidence');
  return {value: missing.length ? null : round(completionRate * .5 + onTimeRate * .5), scale: 'percent', source: 'confirmed-form-receipts', completionRate: completionRate === null ? null : round(completionRate), onTimeRate: onTimeRate === null ? null : round(onTimeRate), policy: {windowDays, latestPerSkill: Boolean(options.latestPerSkill), shadowingWeight: .5, onTimeWeight: .5, commonVerifiedScope: Boolean(selectedKeys)}, coverage: {eligible: rows.length, known: known.length, unknown: rows.length - known.length, windowEligible: allRows.length, excluded: allRows.length - rows.length, shadowingEligible: shadow.length, shadowingKnown: knownShadow.length, completedShadowing, onTime, ratio: rows.length ? round(known.length / rows.length * 100) : null}, scopeRestricted: Boolean(selectedKeys && allRows.length !== rows.length), provisional: known.length !== rows.length || missing.length > 0, missing, outcomes: rows};
}

/**
 * Every pupil uses the same confirmed assignment-code cohort. An unavailable
 * result for any eligible pupil excludes that assignment for the entire class.
 * Pupils who joined after release are not considered eligible for that item.
 */
export function chooseCommonHabitScope(packets, options = {}) {
  const groups = new Map(), unresolved = [];
  packets.forEach((entry, index) => {
    const pupil = entry.hash || String(index), packet = entry.packet || entry;
    const rows = habitEvidence(packet, {...options, habitScope: undefined}).outcomes;
    for (const row of rows) {
      if (!row.scopeKey) { unresolved.push({pupil, id: row.id, skill: row.skill, reason: row.reason}); continue; }
      if (!groups.has(row.scopeKey)) groups.set(row.scopeKey, {key: row.scopeKey, skill: row.skill, codes: row.codes, eligible: new Set(), known: new Set(), unknown: new Set(), outcomes: 0, unknownOutcomes: 0, latestAssignedAt: 0});
      const group = groups.get(row.scopeKey);
      group.latestAssignedAt = Math.max(group.latestAssignedAt, row.assignedAt || 0);
      group.eligible.add(pupil); group.outcomes += 1;
      if (row.state === 'unknown') { group.unknown.add(pupil); group.unknownOutcomes += 1; }
      else group.known.add(pupil);
    }
  });
  for (const group of groups.values()) packets.forEach((entry, index) => {
    const pupil = entry.hash || String(index);
    if (group.eligible.has(pupil)) return;
    const joined = parseSourceTime(packetParts(entry.packet || entry).student.joinDate);
    // An explicit post-release enrollment is the only safe exemption. An
    // incomplete schedule/packet cannot prove that an older pupil was exempt.
    if (joined && joined > group.latestAssignedAt) return;
    group.eligible.add(pupil); group.unknown.add(pupil); group.unknownOutcomes += 1;
  });
  const summarize = group => ({key: group.key, skill: group.skill, codes: group.codes, eligiblePupils: group.eligible.size, verifiedPupils: group.eligible.size - group.unknown.size, outcomes: group.outcomes, unknownOutcomes: group.unknownOutcomes});
  const included = [...groups.values()].filter(group => group.unknown.size === 0).map(summarize).sort((a,b) => a.key.localeCompare(b.key));
  const excluded = [...groups.values()].filter(group => group.unknown.size > 0).map(group => ({...summarize(group), reason: 'not-confirmed-for-every-eligible-pupil'})).sort((a,b) => a.key.localeCompare(b.key));
  return {policy: 'Shared assignment-code intersection: include only when every eligible pupil and occurrence has confirmed status. Unavailable codes are excluded for the entire class, never scored as zero.', windowDays: options.windowDays ?? 56, latestPerSkill: Boolean(options.latestPerSkill), pupilCount: packets.length, keys: included.map(row=>row.key), included, excluded, unresolvedAssignmentCount: unresolved.length, includedAssignmentCodes: included.length, excludedAssignmentCodes: excluded.length, excludedPupilOutcomes: excluded.reduce((sum,row)=>sum+row.outcomes,0) + unresolved.length};
}

export function chooseAcademicScope(packets, {now = Date.now()} = {}) {
  const all = packets.flatMap(entry => academicEvidence(entry.packet || entry)).filter(row => row.sourceAt && row.sourceAt <= now);
  const scope = Object.fromEntries(ACADEMIC_SKILLS.map(skill => {
    const candidates = all.filter(row => row.skill === skill).sort((a, b) => b.sourceAt - a.sourceAt || a.key.localeCompare(b.key));
    const selected = candidates[0];
    return [skill, selected ? {key: selected.key, sourceDate: selected.sourceDate, sourceLabel: selected.title, title: selected.title, sourceAt: selected.sourceAt} : null];
  }));
  scope.sourceLabels = Object.fromEntries(ACADEMIC_SKILLS.map(skill=>[skill,scope[skill]?.sourceLabel || null]));
  scope.sourceDates = Object.fromEntries(ACADEMIC_SKILLS.map(skill=>[skill,scope[skill]?.sourceDate || null]));
  return scope;
}

export function scorePupil(packet, options = {}) {
  const {student} = packetParts(packet), scope = options.scope || chooseAcademicScope([packet], options), evidence = academicEvidence(packet), components = {};
  for (const skill of ACADEMIC_SKILLS) components[skill] = evidence.find(row => row.skill === skill && row.key === scope[skill]?.key) || {skill, value: null, missing: true, reason: 'no-published-score-for-common-assessment'};
  components.habit = habitEvidence(packet, options);
  const missing = Object.keys(COMPONENT_WEIGHTS).filter(key => !finite(components[key].value));
  const provisional = components.habit.provisional;
  const total = missing.length ? null : round(Object.entries(COMPONENT_WEIGHTS).reduce((sum, [key, weight]) => sum + components[key].value * weight, 0));
  return {name: student.name || packet.name || '', components, total, provisional, missing, rank: null, coverage: {academicSkills: ACADEMIC_SKILLS.filter(skill => finite(components[skill].value)).length, academicExpected: 4, habit: components.habit.coverage}, improvement: ACADEMIC_SKILLS.filter(skill => finite(components[skill].value)).sort((a, b) => components[a].value - components[b].value).slice(0, 1)};
}

export function buildAcademicLeaderboard(packets, options = {}) {
  const now = options.now ?? Date.now(), scope = options.scope || chooseAcademicScope(packets, {now});
  const habitScope = options.habitScope || (options.commonHabitScope === false ? null : chooseCommonHabitScope(packets, {...options, now}));
  const entries = packets.map(entry => ({...scorePupil(entry.packet || entry, {...options, now, scope, habitScope}), ...(entry.hash ? {hash: entry.hash} : {})}));
  const ranked = entries.filter(entry => entry.total !== null && (!entry.provisional || options.allowProvisionalRank === true)).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, 'vi'));
  let previous = null, rank = 0;
  ranked.forEach((entry, index) => { if (entry.total !== previous) rank = index + 1; entry.rank = rank; previous = entry.total; });
  entries.sort((a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity) || (b.total ?? -1) - (a.total ?? -1) || a.name.localeCompare(b.name, 'vi'));
  return {schemaVersion: 1, className: packets[0]?.packet?.className || packets[0]?.className || 'IELTS 48', generatedAt: new Date(now).toISOString(), scope: {...scope, habit: habitScope}, policy: {weights: COMPONENT_WEIGHTS, academic: 'Latest shared published assessment per skill; structured band / 9 × 100. This is a progress score, not an IELTS Overall Band.', homeworkAttempts: 'Diagnostics only: latest scored attempt per exact assignment and part; no best-of-retakes or summary double-counting.', habit: '50% confirmed past-due Shadowing completion + 50% proven on-time rate, within the common assignment-code cohort confirmed for every eligible pupil. Unverified assignments are excluded for the entire class, never treated as not submitted.', commonHabitScope: Boolean(habitScope), provisionalRanks: options.allowProvisionalRank === true, ranking: 'Competition ranking: equal scores share rank; next rank skips tied places.'}, entries, rankedCount: ranked.length, topThree: ranked.filter(entry => entry.rank <= 3).map(entry => ({hash: entry.hash, name: entry.name, rank: entry.rank, total: entry.total, provisional: entry.provisional})), coverage: {pupils: entries.length, completeAcademic: entries.filter(entry => entry.coverage.academicSkills === 4).length, allFiveComponents: entries.filter(entry => entry.total !== null).length, provisional: entries.filter(entry => entry.provisional).length, ranked: ranked.length, unranked: entries.length - ranked.length, commonHabitIncludedCodes: habitScope?.includedAssignmentCodes ?? null, commonHabitExcludedCodes: habitScope?.excludedAssignmentCodes ?? null}};
}
