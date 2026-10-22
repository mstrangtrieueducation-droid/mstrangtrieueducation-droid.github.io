/* Pure calendar model: no network, DOM, storage or changes to source records. */
(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.IeltsStudyPlannerModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var DAY = 86400000;
  var OFFSET = 7 * 3600000;
  var DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  var SKILLS = { speaking: 'Speaking', writing: 'Writing', reading: 'Reading', listening: 'Listening', shadowing: 'Shadowing' };
  var LABELS = { done: '✅ Đã hoàn thành', needs: '⏳ Cần làm', dueSoon: '⚠️ Sắp đến hạn', overdue: '⚠️ Quá hạn', unknown: 'Chờ xác nhận bài nộp' };

  function text(value) { return value == null ? '' : String(value).trim(); }
  function pad(n) { return String(n).padStart(2, '0'); }
  function keyAt(ms) {
    var date = new Date(Number(ms) + OFFSET);
    if (!Number.isFinite(date.getTime())) return '';
    return date.getUTCFullYear() + '-' + pad(date.getUTCMonth() + 1) + '-' + pad(date.getUTCDate());
  }
  function dayStart(value) {
    var source = text(value), match, year, month, day;
    if ((match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(source))) {
      year = +match[1]; month = +match[2]; day = +match[3];
    } else if ((match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(source))) {
      year = +match[3]; month = +match[2]; day = +match[1];
    } else return null;
    var ms = Date.UTC(year, month - 1, day) - OFFSET;
    return keyAt(ms) === year + '-' + pad(month) + '-' + pad(day) ? ms : null;
  }
  function timestamp(value, endOfDay) {
    if (value == null || value === '') return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
    var day = dayStart(value);
    if (day !== null) return day + (endOfDay ? DAY - 1000 : 0);
    var source = text(value);
    var local = /^(\d{1,2}\/\d{1,2}\/\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(source);
    if (local) {
      day = dayStart(local[1]);
      if (day === null || +local[2] > 23 || +local[3] > 59 || +(local[4] || 0) > 59) return null;
      return day + (+local[2] * 3600 + +local[3] * 60 + +(local[4] || 0)) * 1000;
    }
    // Only explicitly zoned ISO timestamps are portable across hosts.
    if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:?\d{2})$/i.test(source)) return null;
    var parsed = Date.parse(source);
    return Number.isFinite(parsed) ? parsed : null;
  }
  function mondayKey(now) {
    var key = keyAt(now), start = dayStart(key);
    return keyAt(start - ((new Date(start + OFFSET).getUTCDay() + 6) % 7) * DAY);
  }
  function groupNumber(value) {
    var source = text(value);
    var match = /(?:group|nhóm)\s*([12])\b/i.exec(source) || /IELTS\s*\d+\.([12])\b/i.exec(source);
    return match ? match[1] : '';
  }
  function studentGroup(student) {
    return groupNumber(student.groupId || student.speakingGroupId || student.speakingGroup || student.groupLabel || student.speakingGroupLabel);
  }
  function correctGroup(item, student) {
    if (text(item.skill).toLowerCase() !== 'speaking' && !/SPEAKING/i.test(text(item.program))) return true;
    var group = groupNumber(item.groupId || item.scheduleClassName || item.groupLabel);
    return !group || group === studentGroup(student);
  }
  function activeAfterEnrollment(item, student) {
    var joined = timestamp(student.joinDate, false);
    var assigned = timestamp(item.assignedAt || item.releaseDate || item.lessonDate || item.date, false);
    return joined === null || assigned === null || keyAt(assigned) >= keyAt(joined);
  }
  function included(item, student) {
    return !!item && item.isAssigned !== false && !item.notAssigned && !item.cancelled && !item.canceled && correctGroup(item, student) && activeAfterEnrollment(item, student);
  }
  function taskLinks(item) {
    var values = (Array.isArray(item.tasks) ? item.tasks : []).concat(item.url ? [{ title: 'Làm / nộp bài', url: item.url }] : []);
    return values.map(function (task) { return { title: text(task.title) || 'Làm / nộp bài', url: text(task.url) }; }).filter(function (link) { return /^https?:\/\//i.test(link.url); });
  }
  function uniqueLinks(links) {
    var seen = new Set();
    return (Array.isArray(links) ? links : []).filter(function (link) {
      if (!link || !/^https?:\/\//i.test(text(link.url)) || seen.has(text(link.url))) return false;
      seen.add(text(link.url)); return true;
    }).map(function (link) { return { title: text(link.title || link.label) || 'Làm / nộp bài', url: text(link.url) }; });
  }
  function normalizedStatus(value, item) {
    if (typeof value === 'string') {
      if (/^(done|submitted|completed)$/.test(value)) value = { submitted: true, confirmed: true };
      else if (/^(needs|missing|unsubmitted|dueSoon|overdue)$/.test(value)) value = { submitted: false, confirmed: true };
      else value = { submitted: null, confirmed: false };
    }
    value = value && typeof value === 'object' ? value : {};
    // Evidence adapters must explicitly confirm absence; unavailable sources are never a failed submission.
    var submitted = value.submitted === true ? true : value.submitted === false && value.confirmed === true ? false : null;
    if (submitted === null && item.submitted === true) submitted = true;
    return { submitted: submitted, confirmed: submitted !== null, submittedAt: value.submittedAt || null, late: value.late === true, label: value.label || null };
  }
  function stateFor(status, dueAt, now) {
    if (status.submitted === true) return 'done';
    if (!status.confirmed) return 'unknown';
    if (dueAt !== null && dueAt < now) return 'overdue';
    if (dueAt !== null && dueAt - now <= DAY) return 'dueSoon';
    return 'needs';
  }
  function orderTasks(a, b) {
    var rank = { overdue: 0, dueSoon: 1, needs: 2, unknown: 3, done: 4 };
    return rank[a.status] - rank[b.status] || (a.dueAt === null ? Infinity : a.dueAt) - (b.dueAt === null ? Infinity : b.dueAt) || a.id.localeCompare(b.id);
  }
  function build(options) {
    options = options || {};
    var dashboard = options.dashboard || {}, student = options.student || {}, adapters = options.adapters || {};
    var now = timestamp(options.now == null ? Date.now() : options.now, false);
    if (now === null) throw new TypeError('Planner now must be a valid instant with an explicit timezone.');
    var todayKey = keyAt(now), base = dayStart(mondayKey(now));
    var weekOffset = Number.isFinite(Number(options.weekOffset)) ? Math.trunc(Number(options.weekOffset)) : 0;
    var start = base + weekOffset * 7 * DAY;
    var seen = new Set(), tasks = [], errors = [];
    (Array.isArray(dashboard.assignments) ? dashboard.assignments : []).concat(Array.isArray(dashboard.shadowingAssignments) ? dashboard.shadowingAssignments : []).forEach(function (item) {
      try {
      if (!included(item, student) || item.noHomework || adapters.includeAssignment && !adapters.includeAssignment(item)) return;
      var release = timestamp(item.assignedAt || item.releaseDate || item.lessonDate, false);
      if (release !== null && keyAt(release) > todayKey) return;
      var skill = text(item.skill || (item.isShadowing ? 'shadowing' : '')).toLowerCase();
      var dueAt = timestamp(item.dueAt || item.dueDate, true);
      var links = uniqueLinks(adapters.links ? adapters.links(item) : taskLinks(item));
      var sourceTasks = Array.isArray(item.tasks) ? item.tasks : [];
      if (!sourceTasks.length && !links.length && !item.assignmentCode && !item.sourceCode) return;
      var id = text(item.id) || [skill, item.assignmentCode || item.sourceCode || item.topic, item.lessonDate, item.dueDate].map(text).join('|');
      if (seen.has(id)) return;
      seen.add(id);
      var evidence = normalizedStatus(adapters.status ? adapters.status(item) : null, item);
      var status = stateFor(evidence, dueAt, now);
      tasks.push({
        id: id, kind: 'homework', skill: skill, skillLabel: SKILLS[skill] || text(item.program) || 'Bài tập',
        title: text(item.topic) || sourceTasks.map(function (task) { return text(task.title); }).filter(Boolean).join(' · ') || text(item.session) || 'Bài tập',
        session: text(item.session), assignmentCode: text(item.assignmentCode || item.sourceCode),
        dueAt: dueAt, dueDateKey: dueAt === null ? '' : keyAt(dueAt), dueDate: text(item.dueDate),
        status: status, statusLabel: evidence.submitted && evidence.label ? evidence.label : LABELS[status], confirmed: evidence.confirmed,
        submittedAt: evidence.submittedAt, late: evidence.late, links: links,
        tasks: sourceTasks.map(function (task) { return { title: text(task.title), instructions: text(task.instructions) }; }),
        source: item
      });
      } catch (_) { errors.push({id:text(item&&item.id)||'unavailable-'+errors.length,skill:text(item&&item.skill),title:text(item&&item.topic)||'Bài tập'}); }
    });
    tasks.sort(orderTasks);
    var seenLessons = new Set(), lessons = [];
    (Array.isArray(dashboard.lessonEvents) ? dashboard.lessonEvents : []).forEach(function (event) {
      try {
      if (!included(event, student) || adapters.includeLesson && !adapters.includeLesson(event)) return;
      var at = timestamp(event.date || event.lessonDate, false);
      if (at === null) return;
      var key = keyAt(at), skill = text(event.skill).toLowerCase();
      var id = text(event.id) || [key, skill, event.session, event.startTime, event.scheduleClassName].map(text).join('|');
      if (seenLessons.has(id)) return;
      seenLessons.add(id);
      lessons.push({ id: id, kind: 'lesson', dateKey: key, title: 'Học trên lớp · ' + (SKILLS[skill] || text(event.program)), skill: skill,
        session: text(event.session), startTime: text(event.startTime), endTime: text(event.endTime), location: text(event.location), mapUrl: text(event.mapUrl), source: event });
      } catch (_) { errors.push({id:text(event&&event.id)||'lesson-unavailable-'+errors.length,skill:'schedule',title:'Lịch học'}); }
    });
    lessons.sort(function (a, b) { return a.dateKey.localeCompare(b.dateKey) || a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id); });
    var days = DAYS.map(function (label, index) {
      var key = keyAt(start + index * DAY);
      return { dateKey: key, label: label, isToday: key === todayKey, tasks: tasks.filter(function (task) { return task.dueDateKey === key; }), lessons: lessons.filter(function (lesson) { return lesson.dateKey === key; }) };
    });
    var availableWeekOffsets = new Set([0, weekOffset]);
    tasks.forEach(function (task) { if (task.dueAt !== null) availableWeekOffsets.add(Math.floor((dayStart(task.dueDateKey) - base) / (7 * DAY))); });
    lessons.forEach(function (lesson) { availableWeekOffsets.add(Math.floor((dayStart(lesson.dateKey) - base) / (7 * DAY))); });
    var summary = { total: tasks.length, done: 0, needs: 0, dueSoon: 0, overdue: 0, unknown: 0 };
    tasks.forEach(function (task) { summary[task.status]++; });
    return { todayKey: todayKey, now: now, weekOffset: weekOffset, weekStart: keyAt(start), weekEnd: keyAt(start + 6 * DAY), days: days,
      priorities: tasks.filter(function (task) { return task.status !== 'done'; }),
      todayTasks: tasks.filter(function (task) { return task.dueDateKey === todayKey; }),
      tasks: tasks, lessons: lessons, undatedTasks: tasks.filter(function (task) { return !task.dueDateKey; }),
      availableWeekOffsets: Array.from(availableWeekOffsets).sort(function (a, b) { return a - b; }), summary: summary, errors: errors };
  }
  return Object.freeze({ build: build, dateKey: keyAt, timestamp: timestamp, mondayKey: mondayKey, statusLabels: LABELS });
});
