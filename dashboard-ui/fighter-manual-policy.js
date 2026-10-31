/* Fighter presentation policy, 30 Oct 2026. Native marks and receipts stay intact. */
(function (root) {
  'use strict';
  const groups = root.FighterHomeworkGroups;
  if (!groups || groups.retiredManualPolicy === 1) return;
  const nativeBuild = groups.build;
  const vocab = unit => unit.programKey === 'vf1' || unit.programKey === 'vf2';
  function retiredTask(unit, task, state) {
    const manualKind = state?.manualSubmissionKind || task?.manualSubmissionKind;
    if (unit.programKey === 'pt') return manualKind === 'practice_redo_notebook';
    return vocab(unit) && (manualKind === 'preparation' ||
      /^tra cuu truoc\b/.test(root.FighterCourseParser.norm(task?.title)));
  }
  function scope(model) {
    const hidden = new Set(), hiddenTasks = new Set(), hiddenEntries = new Set();
    for (const unit of [...(model.units || []), ...(model.guidanceUnits || [])]) {
      const columns = new Set();
      for (const component of unit.components || []) {
        const tasks = component.tasks || [];
        const retired = vocab(unit) && component.role === 'preparation' ||
          tasks.length > 0 && tasks.every(entry => retiredTask(unit, entry.task, entry.state));
        if (!retired) continue;
        hidden.add(component);
        for (const entry of tasks) {
          hiddenTasks.add(entry.task);
          // These are already scoped native manual-verification column bindings.
          for (const column of entry.state?.manualSubmissionVerification?.columns || []) columns.add(column);
        }
      }
      for (const component of unit.components || []) {
        if (columns.has(component.column) && (vocab(unit) && component.role === 'preparation' ||
            unit.programKey === 'pt' && component.role !== 'redo')) hidden.add(component);
      }
      for (const assignment of unit.assignments || []) {
        for (const [index, task] of (assignment.tasks || []).entries()) {
          if (hiddenTasks.has(task) || retiredTask(unit, task)) {
            hiddenTasks.add(task);
            hiddenEntries.add(String(assignment.id || assignment.sourceCode || '') + '|' + index);
          }
        }
      }
    }
    return { hidden, hiddenTasks, hiddenEntries };
  }
  const REDO_HEADING = 'Hướng dẫn làm lại · cô kiểm tra trực tiếp trên lớp';
  // Untracked Practice Test parts are labelled by their task title, which the detail view repeats.
  const practiceLabel = { submission: '📤 Bài nộp', redo: '🌐 Làm lại web' };
  function relabelPractice(unit, component) {
    const only = component.tasks?.length === 1 ? component.tasks[0].task : null;
    if (unit.programKey === 'pt' && only && component.label === only.title && practiceLabel[component.role]) {
      component.label = practiceLabel[component.role];
    }
  }
  // Teacher-checked Practice Test redo notebooks are not submissions, but their instructions stay visible.
  function practiceRedoGuidance(unit, removed, selected) {
    if (unit.programKey !== 'pt') return [];
    const tasks = new Set(removed.flatMap(component => (component.tasks || []).map(entry => entry.task)));
    for (const assignment of unit.assignments || []) {
      for (const task of assignment.tasks || []) if (selected.hiddenTasks.has(task) || retiredTask(unit, task)) tasks.add(task);
    }
    return [...tasks].filter(Boolean);
  }
  function projectUnit(unit, selected) {
    const removed = (unit.components || []).filter(component => selected.hidden.has(component));
    const components = (unit.components || []).filter(component => !selected.hidden.has(component));
    const warning = component => component.teacherNote || component.label + ': ' + component.statusText;
    const removedWarnings = new Set(removed.map(warning)), keptWarnings = new Set(components.map(warning));
    components.forEach(component => relabelPractice(unit, component));
    const redoGuidance = practiceRedoGuidance(unit, removed, selected);
    const guidance = (unit.guidance || []).filter(task => !selected.hiddenTasks.has(task) && !retiredTask(unit, task));
    return {
      ...unit,
      components,
      guidance: [...redoGuidance, ...guidance],
      ...(redoGuidance.length ? { guidanceHeading: REDO_HEADING } : {}),
      warnings: (unit.warnings || []).filter(value => !removedWarnings.has(value) || keptWarnings.has(value))
    };
  }
  function build(model, nativeEntries) {
    const selected = scope(model), result = nativeBuild(model, nativeEntries);
    const keep = row => !selected.hidden.has(row.component) &&
      !selected.hiddenEntries.has(String(row.entry?.id || '') + '|' + (row.entry?.part || '0'));
    const projected = new Map();
    const projectRow = row => {
      if (!projected.has(row.unit)) projected.set(row.unit, projectUnit(row.unit, selected));
      return { ...row, unit: projected.get(row.unit) };
    };
    const rows = result.rows.filter(keep).map(projectRow);
    const manualRows = result.manualRows.filter(keep).map(projectRow);
    const buckets = { todo: [], overdue: [], fix: [], done: [] };
    for (const row of rows) buckets[row.status].push(row);
    const retiredRecordIds = [...result.rows, ...result.manualRows].filter(row => !keep(row)).map(row => 'task:' + row.key);
    return { ...result, rows, manualRows, buckets, retiredRecordIds, pending: [...buckets.todo, ...buckets.overdue].map(row => row.entry) };
  }
  function visibleModel(model) {
    const selected = scope(model), statusByUnit = new Map(
      groups.units(model.homeworkGroups || build(model, []), 'all', 'all').map(unit => [unit.key, unit.status])
    );
    const projectedUnits = (model.units || []).map(unit => {
      const projected = projectUnit(unit, selected);
      if (statusByUnit.has(unit.key)) projected.status = statusByUnit.get(unit.key);
      return projected;
    });
    const units = projectedUnits.filter(unit => unit.components.length);
    // A Practice Test whose only part is a teacher-checked notebook still shows its instructions.
    const guidanceOnly = projectedUnits.filter(unit => !unit.components.length && unit.programKey === 'pt' && unit.guidance.length);
    const guidanceUnits = [...(model.guidanceUnits || []).map(unit => projectUnit(unit, selected)), ...guidanceOnly]
      .filter(unit => unit.guidance.length);
    teacherChecked = teacherCheckedItems(units, guidanceUnits, model.manualUnits || []);
    root.setTimeout(renderTeacherChecked, 0);
    return { ...model, units, guidanceUnits };
  }

  // Teacher-checked work is not counted as homework to submit, but pupils must still see it
  // prominently in every status filter and in today's plan.
  let teacherChecked = [];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  function todaySerial() {
    const bangkok = new Date(Date.now() + 7 * 3600000);
    return Date.UTC(bangkok.getUTCFullYear(), bangkok.getUTCMonth(), bangkok.getUTCDate());
  }
  function taskDue(unit, task) {
    const assignment = (unit.assignments || []).find(a => (a.tasks || []).includes(task));
    return assignment?.dueDate || '';
  }
  function teacherCheckedItems(units, guidanceUnits, manualUnits) {
    const today = todaySerial(), items = [], parse = root.FighterCourseParser.dateTime;
    const current = due => !due || parse(due) <= 0 || parse(due) >= today;
    for (const unit of [...units, ...guidanceUnits]) {
      if (unit.guidanceHeading !== REDO_HEADING) continue;
      const tasks = (unit.guidance || []).filter(task => current(taskDue(unit, task)));
      if (tasks.length) items.push({ key: unit.key, title: unit.title, program: unit.program, due: taskDue(unit, tasks[0]), parts: tasks.map(t => t.title), state: 'Mang sổ đến lớp' });
    }
    for (const unit of manualUnits) {
      const pending = (unit.components || []).filter(c => c.status === 'manual' || c.status === 'fix');
      if (!pending.length) continue;
      const fix = pending.some(c => c.status === 'fix');
      items.push({ key: unit.key, title: unit.title, program: unit.program, due: pending.map(c => c.dueDate).find(Boolean) || '', parts: pending.map(c => c.label), state: fix ? 'Cần bổ sung' : 'Chờ cô ghi nhận' });
    }
    return items;
  }
  function ensureStyle() {
    if (document.getElementById('f5-teacher-checked-style')) return;
    const style = document.createElement('style');
    style.id = 'f5-teacher-checked-style';
    style.textContent = '.f5-teacher-checked{margin:12px 0 14px;padding:14px 16px;border:1px solid #e3b45c;border-left:5px solid #d9901a;border-radius:10px;background:#fff8e8;color:#5c3d07}' +
      '.f5-teacher-checked h3{margin:0 0 4px;font-size:15px;color:#7a4b00}.f5-teacher-checked>p{margin:0 0 10px;font-size:12.5px;line-height:1.55}' +
      '.f5-teacher-checked button{display:flex;width:100%;justify-content:space-between;align-items:center;gap:10px;margin-top:6px;padding:9px 11px;border:1px solid #ecd3a3;border-radius:8px;background:#fff;color:#3d2a07;font:inherit;font-size:13px;text-align:left;cursor:pointer}' +
      '.f5-teacher-checked button b{flex:none;font-size:12px;color:#a35f00}.f5-teacher-checked small{display:block;color:#7d6640;font-size:11.5px;margin-top:2px}' +
      '.f5-priority-row.f5-teacher-row{border-color:#e3b45c;background:#fff8e8}';
    document.head.append(style);
  }
  function row(item, extraClass) {
    const due = item.due ? ' · Hạn ' + escape(item.due) : '';
    return '<button type="button" class="' + extraClass + '" data-f5-open="' + escape(item.key) + '"><span>' + escape(item.title) +
      '<small>' + escape(item.parts.join(' · ')) + due + '</small></span><b>' + escape(item.state) + ' →</b></button>';
  }
  function renderTeacherChecked() {
    const count = document.getElementById('f5-list-count');
    if (!count) return;
    ensureStyle();
    let panel = document.getElementById('f5-teacher-checked');
    if (!teacherChecked.length) { panel?.remove(); } else {
      if (!panel) { panel = document.createElement('section'); panel.id = 'f5-teacher-checked'; panel.className = 'f5-teacher-checked'; }
      if (panel.nextElementSibling !== count) count.before(panel);
      const html = '<h3>📌 Cô kiểm tra trực tiếp trên lớp · ' + teacherChecked.length + ' bài</h3>' +
        '<p>Không cần nộp Form. Con hoàn thành đúng hướng dẫn và mang sổ đến lớp để cô kiểm tra.</p>' +
        teacherChecked.map(item => row(item, 'f5-teacher-item')).join('');
      if (panel.innerHTML !== html) panel.innerHTML = html;
    }
    const priority = document.getElementById('f5-priority');
    if (priority) {
      priority.querySelectorAll('.f5-teacher-row').forEach(node => node.remove());
      if (teacherChecked.length) priority.insertAdjacentHTML('beforeend', teacherChecked.map(item => row(item, 'f5-priority-row f5-teacher-row')).join(''));
    }
  }
  groups.build = build;
  groups.visibleModel = visibleModel;
  groups.formula = value => String(value || '').replace(/; phần tra cứu được đánh dấu Đủ vẫn tính hoàn thành\./u, '.');
  const cleanedProfiles = new Set();
  groups.retireNoticeHistory = function (profileKey, recordIds) {
    if (!profileKey || !recordIds?.length || cleanedProfiles.has(profileKey)) return;
    const retired = new Set(recordIds);
    let hash = 2166136261;
    for (const character of String(profileKey)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    const key = 'mtt_native_updates_v1_' + (hash >>> 0).toString(36);
    try {
      const ledger = JSON.parse(root.localStorage.getItem(key) || 'null');
      if (ledger?.version === 1) {
        ledger.events = (ledger.events || []).filter(event => !retired.has(event.recordId));
        for (const id of retired) if (ledger.seen) delete ledger.seen[id];
        root.localStorage.setItem(key, JSON.stringify(ledger));
      }
    } catch (_) { /* Notice storage is optional; no submission data is changed. */ }
    cleanedProfiles.add(profileKey);
  };
  groups.retiredManualPolicy = 1;
})(globalThis);
