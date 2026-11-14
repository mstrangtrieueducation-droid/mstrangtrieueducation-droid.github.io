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
      // A published review score (set by fighter-assessment-review-v1.js) replaces the waiting label.
      const reviewed = card.dataset.faScore ? `Điểm ${card.dataset.faScore}/1` : '';
      const label = reviewed || (!Number.isFinite(mark.score) ? mark.notebookStatus || 'Chờ cô ghi nhận' : '');
      if (score && label && score.textContent !== label) score.textContent = label;
      const instruction = card.querySelector('.f5-writing-instruction');
      if (instruction) instruction.textContent = 'Hoàn thiện phần chữa và bản viết lại trong vở Phần 2; cô kiểm tra trực tiếp tại lớp.';
      const due = card.querySelector('.f5-writing-due');
      if (due) due.textContent = `Hạn hoàn thành vở: ${assignment.completionDueDate || assignment.completionDueLabel || 'Theo hướng dẫn'}`;
      // The owner retired the long Schedule message on test cards; the review panel carries the guidance.
      card.querySelectorAll('.f5-writing-brief').forEach(node => node.remove());
    }
  }

  // Pupils who joined after every regular paragraph lesson have no native "dvht" pill,
  // yet their released KT cards still exist. This pill only switches what is shown.
  let writingOnly = false;
  const hiddenByPill = ['#f5-list', '#f5-list-count', '#f5-statuses', '#f5-guidance-list', '#f5-manual-list'];

  function syncWritingPill(work, hasTest) {
    const programs = document.querySelector('#f5-programs');
    if (!programs) return false;
    const native = programs.querySelector('[data-f5-program="dvht"]');
    let pill = programs.querySelector('[data-fwh-writing]');
    if (native || !hasTest) {
      pill?.remove();
      writingOnly = false;
    } else if (!pill) {
      pill = document.createElement('button');
      pill.type = 'button';
      pill.dataset.fwhWriting = '1';
      pill.innerHTML = '<span aria-hidden="true">✍️</span> Đoạn văn học thuật';
      pill.addEventListener('click', () => { writingOnly = true; schedule(); });
      const after = programs.querySelector('[data-f5-program="listening"],[data-f5-program="pt"],[data-f5-program="shadow"]');
      programs.insertBefore(pill, after);
    }
    if (pill) {
      if (pill.getAttribute('aria-pressed') !== String(writingOnly)) pill.setAttribute('aria-pressed', String(writingOnly));
      if (writingOnly) programs.querySelectorAll('[data-f5-program][aria-pressed="true"]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    }
    for (const selector of hiddenByPill) {
      const node = document.querySelector(selector);
      if (!node) continue;
      if (writingOnly && !node.hidden) { node.hidden = true; node.dataset.fwhHidden = '1'; }
      else if (!writingOnly && node.dataset.fwhHidden) { node.hidden = false; delete node.dataset.fwhHidden; }
    }
    return !!pill && writingOnly;
  }

  // Any native programme or status choice leaves the fallback view.
  document.addEventListener('click', event => {
    // Match the clicked button itself: the page root also carries data-f5-view.
    const button = event.target.closest?.('button');
    if (writingOnly && button && button.matches('[data-f5-program],[data-f5-status],[data-f5-view]')) { writingOnly = false; schedule(); }
  }, true);

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
    const hasTest = !!work.querySelector('.f5-writing-card:not(.f5-writing-lesson)');
    const fallback = syncWritingPill(work, hasTest);
    const selected = fallback || document.querySelector('#f5-programs [data-f5-program="dvht"][aria-pressed="true"]');
    const show = !!selected && hasTest;
    if (work.hidden === show) work.hidden = !show;
    // A teacher-marked KT is not Web homework. Avoid a misleading empty Web
    // list just above it; never change native counts or component statuses.
    if (fallback) {
      // syncWritingPill already hid the Web list for this view.
    } else if (list && selected && hasTest) {
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

/* Cô 15/11/2026: on every Fighter page a graded paper goes straight to the dash — in-class paragraphs
   (fighter-paragraph-review-v1) and KT papers with their detailed correction (fighter-assessment-review-v1) —
   and the raw "Xem ghi nhận trên bảng" block is removed from the writing cards. Pages that do not list a module
   get it here, so new Fighter classes need no page edit. */
(() => {
  'use strict';
  const style = document.createElement('style');
  style.textContent = 'details[data-history-section^="f5-raw-"]{display:none!important}';
  document.head.append(style);
  ['fighter-paragraph-review-v1', 'fighter-assessment-review-v1'].forEach(name => {
    if (document.querySelector('script[src*="/dashboard-ui/' + name + '.js"]')) return;
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/dashboard-ui/' + name + '.css';
    document.head.append(css);
    const js = document.createElement('script');
    js.src = '/dashboard-ui/' + name + '.js';
    document.head.append(js);
  });
})();
