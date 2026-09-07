/* The active dashboard's editable name/class hint belongs to this viewer only. */
(function () {
  'use strict';
  const config = window.MTTLearningConfig;
  const receiver = window.MTTStudentPrefill;
  const frame = document.getElementById('lesson');
  const status = document.getElementById('status');
  const message = document.getElementById('message');
  const help = document.getElementById('help');
  const original = document.getElementById('original');
  const retry = document.getElementById('retry');
  const query = new URLSearchParams(location.search);
  const denied = new Set(config.dashboardRoutes);
  function lessonTarget(value) {
    try {
      const url = new URL(value);
      if (url.origin !== config.origin || url.username || url.password) return null;
      const parts = decodeURIComponent(url.pathname).split('/').filter(Boolean);
      const first = (parts[0] || '').toLowerCase();
      if (!first || first === 'kids-learning' || denied.has(first) || parts.some(part =>
        /^\.|[\\\x00-\x1f]/.test(part) || /^(?:assets?|sources?|src|scripts?|styles?|downloads?|media|videos?)$/i.test(part))) return null;
      const last = parts[parts.length - 1];
      if (/\./.test(last) && !/\.html?$/i.test(last)) return null;
      return url;
    } catch (_) { return null; }
  }
  const values = query.getAll('lesson');
  const target = values.length === 1 ? lessonTarget(values[0]) : null;
  const hint = receiver.read(location.search);
  if (!target || hint.state !== 'valid') {
    message.textContent = 'Liên kết bài học chưa đầy đủ. Vui lòng mở lại bài từ hồ sơ của con.';
    document.getElementById('student').textContent = 'Chưa chọn học sinh';
    return;
  }
  document.getElementById('student').textContent = hint.name;
  document.getElementById('className').textContent = hint.className;
  document.title = hint.name + ' · ' + hint.className + ' · Bài học';
  original.href = target.href;
  let installedDocument = null, waitingDocument = null, disconnect = null;
  let timer = null, deadlineTimer = null, stopped = false;
  function loading() {
    frame.setAttribute('aria-busy', 'true');
    frame.inert = true;
    status.hidden = false;
    help.hidden = true;
    message.textContent = 'Đang mở bài học của ' + hint.name + '…';
    clearTimeout(deadlineTimer);
    deadlineTimer = setTimeout(function () {
      message.textContent = 'Bài học đang tải lâu hơn bình thường. Bạn có thể thử lại hoặc mở bài gốc.';
      help.hidden = false;
    }, 20000);
  }
  function fail() {
    clearTimeout(timer); clearTimeout(deadlineTimer);
    frame.setAttribute('aria-busy', 'true'); frame.inert = true;
    status.hidden = false; help.hidden = false;
    message.textContent = 'Chưa mở được bài học. Bạn có thể thử lại hoặc mở bài gốc và tự điền tên, lớp.';
  }
  function apply(doc) {
    if (stopped || doc !== frame.contentDocument || installedDocument === doc) return;
    try {
      if (!lessonTarget(frame.contentWindow.location.href)) return fail();
      if (disconnect) disconnect();
      disconnect = receiver.install(config, frame.contentWindow, hint);
      installedDocument = doc;
      // Keep interaction blocked until the native page initializer has run and
      // its saved sibling values have been replaced by this page's pair.
      frame.setAttribute('aria-busy', 'false'); frame.inert = false;
      status.hidden = true; help.hidden = true;
      clearTimeout(deadlineTimer); clearTimeout(timer);
      frame.contentWindow.addEventListener('pagehide', function () {
        if (stopped) return;
        loading(); schedule();
      }, { once: true });
    } catch (_) { fail(); }
  }
  function inspect() {
    if (stopped) return;
    try {
      // Access the actual location before a null contentDocument can mask an
      // external navigation as an indefinitely loading same-origin page.
      const href = frame.contentWindow.location.href;
      const doc = frame.contentDocument;
      if (href !== 'about:blank' && !lessonTarget(href)) return fail();
      if (!doc || !doc.documentElement || href === 'about:blank') return schedule();
      if (doc === installedDocument) return;
      const nav = frame.contentWindow.performance.getEntriesByType('navigation')[0];
      if (doc.readyState === 'complete' || (nav && nav.domContentLoadedEventStart > 0)) return apply(doc);
      if (doc !== waitingDocument) {
        waitingDocument = doc;
        doc.addEventListener('DOMContentLoaded', function () {
          // Run after all of the lesson's synchronous DOMContentLoaded handlers.
          setTimeout(function () { apply(doc); }, 0);
        }, { once: true });
      }
      schedule();
    } catch (_) { fail(); }
  }
  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(inspect, 100);
  }
  frame.addEventListener('load', inspect);
  retry.addEventListener('click', function () {
    installedDocument = null; waitingDocument = null;
    if (disconnect) disconnect();
    loading(); frame.src = target.href; schedule();
  });
  window.addEventListener('pagehide', function () {
    stopped = true; clearTimeout(timer); clearTimeout(deadlineTimer);
    if (disconnect) disconnect();
  });
  // Returning from the browser's back/forward cache must restore the watcher.
  window.addEventListener('pageshow', function (event) {
    if (!event.persisted) return;
    stopped = false; installedDocument = null; loading(); inspect();
  });
  loading();
  frame.src = target.href;
  schedule();
})();
