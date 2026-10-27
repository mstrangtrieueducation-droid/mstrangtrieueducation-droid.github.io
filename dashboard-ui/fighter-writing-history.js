/* Presentation only: remove the duplicate Schedule lesson view from Fighter work. */
(() => {
  'use strict';

  let observedWork = null;
  let workObserver = null;
  let visibilityObserver = null;
  let listObserver = null;
  let programObserver = null;
  let scheduled = false;
  let rootObserver = null;

  function nativeStudent() {
    try {
      if (!dashboard || !activeStudentName_) return null;
      return dashboard.students?.find(student => student.name === activeStudentName_) || null;
    } catch (_) {
      return null;
    }
  }

  function decorateWritingTests(work, student) {
    for (const card of work.querySelectorAll('.f5-writing-card[data-f5-writing]:not(.f5-writing-lesson)')) {
      const assignment = dashboard.assignments?.find(item => item.id === card.dataset.f5Writing);
      if (!assignment?.assessmentOnly) continue;
      const mark = student.writingTestMarks?.[assignment.sourceCode] || {};
      const kicker = card.querySelector('.f5-writing-kicker');
      if (kicker) kicker.textContent = `✍️ ĐOẠN VĂN HỌC THUẬT · PHẦN 2 · ${assignment.session}`;
      const score = card.querySelector('.f5-writing-mark');
      if (score && !Number.isFinite(mark.score)) score.textContent = mark.notebookStatus || 'Chờ cô ghi nhận';
      const instruction = card.querySelector('.f5-writing-instruction');
      if (instruction) instruction.textContent = 'Hoàn thiện phần chữa và bản viết lại trong vở Phần 2; cô kiểm tra trực tiếp tại lớp.';
      const due = card.querySelector('.f5-writing-due');
      if (due) due.textContent = `Hạn hoàn thành vở: ${assignment.completionDueDate || assignment.completionDueLabel || 'Theo hướng dẫn'}`;
      const message = String(assignment.scheduleMessage || '').trim();
      if (message && !card.querySelector('.f5-writing-brief')) {
        const details = document.createElement('details');
        details.className = 'f5-writing-brief';
        const summary = document.createElement('summary');
        summary.textContent = 'Hướng dẫn từ Schedule';
        const paragraph = document.createElement('p');
        paragraph.textContent = message;
        paragraph.style.whiteSpace = 'pre-line';
        details.append(summary, paragraph);
        due?.after(details);
      }
    }
  }

  function adjust() {
    scheduled = false;
    const work = document.querySelector('#f5-writing-work');
    const student = nativeStudent();
    if (!work || !student) return;

    workObserver?.disconnect();
    // The native #f5-list already renders these lessons, their original status,
    // feedback and submitted files. The older parallel Schedule cards repeated
    // the same sessions and added unnecessary "Xem buổi" history controls.
    for (const card of work.querySelectorAll('.f5-writing-card:not(.f5-writing-lesson)')) {
      if (card.parentElement !== work) work.append(card);
    }
    work.querySelectorAll('.f5-writing-lesson, .f5-writing-history, .f5-writing-heading').forEach(node => node.remove());
    decorateWritingTests(work, student);
    const list = document.querySelector('#f5-list');
    if (list?.parentElement === work.parentElement && work.previousElementSibling !== list) list.after(work);
    const selected = document.querySelector('#f5-programs [data-f5-program="dvht"][aria-pressed="true"]');
    const hasTest = !!work.querySelector('.f5-writing-card:not(.f5-writing-lesson)');
    const show = !!selected && hasTest;
    if (work.hidden === show) work.hidden = !show;
    // A teacher-marked KT is not Web homework. Avoid a misleading empty Web
    // list just above it; never change native counts or component statuses.
    if (list && selected && hasTest) {
      const hasNativeCards = !!list.querySelector('[data-f5-key]');
      if (list.hidden !== !hasNativeCards) list.hidden = !hasNativeCards;
      const count = document.querySelector('#f5-list-count');
      if (count && count.hidden !== !hasNativeCards) count.hidden = !hasNativeCards;
    } else {
      if (list?.hidden) list.hidden = false;
      const count = document.querySelector('#f5-list-count');
      if (count?.hidden) count.hidden = false;
    }
    workObserver?.observe(work, {childList: true, subtree: true});
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(adjust);
  }

  function connect() {
    const work = document.querySelector('#f5-writing-work');
    if (!work || work === observedWork) return;
    workObserver?.disconnect();
    visibilityObserver?.disconnect();
    listObserver?.disconnect();
    programObserver?.disconnect();
    observedWork = work;
    workObserver = new MutationObserver(schedule);
    workObserver.observe(work, {childList: true, subtree: true});
    visibilityObserver = new MutationObserver(schedule);
    visibilityObserver.observe(work, {attributes: true, attributeFilter: ['hidden']});
    const list = document.querySelector('#f5-list');
    if (list) {
      listObserver = new MutationObserver(schedule);
      listObserver.observe(list, {childList: true, subtree: true});
    }
    const programs = document.querySelector('#f5-programs');
    if (programs) {
      programObserver = new MutationObserver(schedule);
      programObserver.observe(programs, {childList: true, subtree: true});
    }
    rootObserver?.disconnect();
    schedule();
  }

  rootObserver = new MutationObserver(connect);
  rootObserver.observe(document.documentElement, {childList: true, subtree: true});
  connect();
})();
