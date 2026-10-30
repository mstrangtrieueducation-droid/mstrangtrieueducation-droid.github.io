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
  function projectUnit(unit, selected) {
    const removed = (unit.components || []).filter(component => selected.hidden.has(component));
    const components = (unit.components || []).filter(component => !selected.hidden.has(component));
    const warning = component => component.teacherNote || component.label + ': ' + component.statusText;
    const removedWarnings = new Set(removed.map(warning)), keptWarnings = new Set(components.map(warning));
    return {
      ...unit,
      components,
      guidance: (unit.guidance || []).filter(task => !selected.hiddenTasks.has(task) && !retiredTask(unit, task)),
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
    return { ...result, rows, manualRows, buckets, pending: [...buckets.todo, ...buckets.overdue].map(row => row.entry) };
  }
  function visibleModel(model) {
    const selected = scope(model), statusByUnit = new Map(
      groups.units(model.homeworkGroups || build(model, []), 'all', 'all').map(unit => [unit.key, unit.status])
    );
    const units = (model.units || []).map(unit => {
      const projected = projectUnit(unit, selected);
      if (statusByUnit.has(unit.key)) projected.status = statusByUnit.get(unit.key);
      return projected;
    }).filter(unit => unit.components.length);
    const guidanceUnits = (model.guidanceUnits || []).map(unit => projectUnit(unit, selected))
      .filter(unit => unit.guidance.length);
    return { ...model, units, guidanceUnits };
  }
  groups.build = build;
  groups.visibleModel = visibleModel;
  groups.formula = value => String(value || '').replace(/; phần tra cứu được đánh dấu Đủ vẫn tính hoàn thành\./u, '.');
  groups.retiredManualPolicy = 1;
})(globalThis);
