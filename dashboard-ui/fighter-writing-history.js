/* Presentation only: keep completed native Academic Paragraph lessons in history. */
(() => {
  'use strict';

  const completedStatus = 'Đã hoàn thành';
  let observedWork = null;
  let workObserver = null;
  let visibilityObserver = null;
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
    if (!work || !student || work.hidden) return;

    workObserver?.disconnect();
    decorateWritingTests(work, student);
    workObserver?.observe(work, {childList: true, subtree: true});

    const cards = [...work.children].filter(node => node.matches?.('.f5-writing-lesson[data-f5-writing]'));
    const heading = work.querySelector(':scope > .f5-writing-heading');
    if (heading) heading.hidden = cards.length === 0 && ![...work.children].some(node => node.matches?.('.f5-writing-card'));
    const completed = cards.filter(card =>
      student.assignments?.some(item =>
        item.assignmentId === card.dataset.f5Writing && item.status === completedStatus));
    if (!completed.length) return;

    workObserver?.disconnect();
    let history = [...work.children].find(node => node.matches?.('.f5-writing-completed-history'));
    if (!history) {
      history = document.createElement('details');
      history.className = 'f5-writing-history f5-writing-completed-history';
      const summary = document.createElement('summary');
      const content = document.createElement('div');
      history.append(summary, content);
      work.append(history);
    }
    const content = history.querySelector(':scope > div');
    completed.forEach(card => content.append(card));
    const total = content.querySelectorAll('.f5-writing-card').length;
    history.querySelector(':scope > summary').textContent = `Xem ${total} buổi Đoạn văn học thuật đã hoàn thành`;
    if (heading) heading.hidden = ![...work.children].some(node => node.matches?.('.f5-writing-card'));
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
    observedWork = work;
    workObserver = new MutationObserver(schedule);
    workObserver.observe(work, {childList: true, subtree: true});
    visibilityObserver = new MutationObserver(schedule);
    visibilityObserver.observe(work, {attributes: true, attributeFilter: ['hidden']});
    rootObserver?.disconnect();
    schedule();
  }

  rootObserver = new MutationObserver(connect);
  rootObserver.observe(document.documentElement, {childList: true, subtree: true});
  connect();
})();
