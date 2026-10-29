(function (root, document) {
  'use strict';
  // Presentation only: all task selection/counting stays in the native Master API.
  const classNumber = document.currentScript?.dataset.ieltsClass;
  if (!/^(45|46|47|48|49|50|51|52)$/.test(classNumber || '')) return;
  const installation = 'ieltsPendingNavigation' + classNumber;
  if (document[installation]) return;
  document[installation] = true;

  document.addEventListener('click', function (event) {
    const button = event.target.closest?.(
      '#ielts-pending-work-banner button, #ielts-pending-work-gate button, [data-compact-pending]'
    );
    if (!button) return;
    const master = root['Ielts' + classNumber + 'Master'];
    const acknowledge = root['ielts' + classNumber + 'OpenPendingHomeworkV32_'];
    if (typeof master?.openAllPending !== 'function') return;
    const legacyNotice = button.closest('#ielts-pending-work-banner, #ielts-pending-work-gate');
    if (legacyNotice && typeof acknowledge !== 'function') return;
    event.preventDefault();
    event.stopImmediatePropagation();
    // Reuse the original reminder acknowledgement/unlock, including its seen signature.
    if (legacyNotice) acknowledge();
    master.openAllPending();
    // Runs after the native navigation callbacks. Focus the actual outstanding list.
    root.requestAnimationFrame(function () {
      const panel = document.getElementById('panel-homework');
      if (!panel || panel.hidden) return;
      const target = panel.querySelector('.master-list .master-title') || panel.querySelector('.master-heading');
      if (!target) return;
      if (!target.matches('button, a, [tabindex]')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });
  }, true);
})(globalThis, document);
