/* Presentation-only candidate. Publish separately under /dashboard-ui/ after service QA. */
(() => {
  'use strict';
  const script = document.currentScript;
  const endpoint = script?.dataset.assessmentEndpoint || '';
  const access = typeof ieltsParentAccess === 'object' ? ieltsParentAccess : null;
  const className = access?.className;
  if (!['IELTS 45', 'IELTS 49'].includes(className)) return;

  const panel = document.getElementById('panel-overview');
  const shell = document.getElementById('portal-shell');
  if (!panel || !shell) return;
  const node = (tag, className_, text) => {
    const el = document.createElement(tag);
    if (className_) el.className = className_;
    if (text !== undefined) el.textContent = String(text);
    return el;
  };
  const status = node('p', 'wa-status');
  status.setAttribute('role', 'status');
  const launcher = node('section', 'wa-launcher');
  launcher.id = 'wa-assessment-launcher';
  launcher.append(node('h3', '', 'Bài chữa kiểm tra Writing'));
  launcher.append(node('p', '', 'Xem điểm theo tiêu chí, nhận xét của Cô, bản chép, bản sửa và ảnh bài viết tay.'));
  const openButton = node('button', 'wa-button', 'Xem bài chữa Writing');
  openButton.type = 'button';
  launcher.append(openButton, status);

  const dialog = node('dialog', 'wa-dialog');
  dialog.setAttribute('aria-label', 'Bài chữa kiểm tra Writing');
  const frame = node('div', 'wa-frame');
  const toolbar = node('header', 'wa-toolbar');
  toolbar.append(node('strong', '', 'Bài chữa kiểm tra Writing'));
  const closeButton = node('button', 'wa-close', 'Đóng');
  closeButton.type = 'button';
  toolbar.append(closeButton);
  const body = node('div', 'wa-body');
  frame.append(toolbar, body);
  dialog.append(frame);
  document.body.append(dialog);

  let epoch = 0;
  let openSerial = 0;
  let context = null;
  const pending = new Map();
  const memory = new Map();
  let index = null;
  let activeReview = null;
  let nearObserver = null;
  // The native shell's visibility is the presentation gate; every service call
  // independently verifies the unchanged parent profile and identity.
  const canOpen = () => Boolean(access.valid && access.token && !shell.hidden);
  const abort = () => { epoch++; for (const item of pending.values()) item.controller.abort(); pending.clear(); memory.clear(); };
  const clear = () => { abort(); nearObserver?.disconnect(); nearObserver = null; context = null; index = null; activeReview = null; body.replaceChildren(); status.textContent = ''; };
  closeButton.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => { openSerial++; clear(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });

  const displayName = () => document.getElementById('portal-student-name')?.textContent || '';
  const generation = () => access.preparedGeneration || '';
  const sameContext = () => Boolean(context && canOpen() && access.token === context.token &&
    displayName() === context.displayName && generation() === context.generation);
  async function sha256(value) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  }
  const validImageSrc = value => typeof value === 'string' &&
    /^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(value);
  async function nativeProfile() {
    if (!canOpen()) throw new Error('Hồ sơ học viên chưa sẵn sàng.');
    const profile = await access.request('profile', true);
    if (!profile?.parentName || !profile?.student?.name || !profile?.parentRosterRevision)
      throw new Error('Hồ sơ học viên chưa xác thực đầy đủ.');
    if (profile.className && profile.className !== className)
      throw new Error('Hồ sơ không khớp lớp.');
    return profile;
  }
  async function startContext(opening) {
    const token = access.token;
    const profile = await nativeProfile();
    if (!dialog.open || opening !== openSerial || !canOpen() || access.token !== token)
      throw new Error('Phiên học viên đã thay đổi.');
    clear();
    context = {token, studentName:profile.student.name, parentName:profile.parentName,
      revision:profile.parentRosterRevision, identity:await sha256(className + '|' + profile.parentName),
      displayName:displayName(), generation:generation()};
    if (!sameContext()) throw new Error('Phiên học viên đã thay đổi.');
  }
  async function refreshContext() {
    if (!sameContext()) { clear(); throw new Error('Phiên học viên đã thay đổi.'); }
    let profile;
    try { profile = await nativeProfile(); }
    catch (error) { clear(); throw error; }
    if (profile.parentName !== context.parentName || profile.student.name !== context.studentName ||
        profile.parentRosterRevision !== context.revision) {
      clear(); throw new Error('Hồ sơ học viên đã cập nhật. Em vui lòng mở lại bài chữa.');
    }
  }
  async function freshIndexGuard(owner, descriptor, action) {
    // The native browser profile can lag revocation in an upstream cache. An
    // uncached assessment index read is the live permission check for bytes
    // already in this page's memory; its service revalidates native authority.
    try {
      const response = await fetch(endpoint, {
        method:'POST', mode:'cors', credentials:'omit', redirect:'follow',
        cache:'no-store', referrerPolicy:'no-referrer',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({className, token:owner.token, action:'index'})
      });
      if (!response.ok) throw new Error('Phiên học viên không còn hợp lệ. Em vui lòng mở lại bài chữa.');
      const envelope = await response.json();
      if (context !== owner || !sameContext() || envelope?.ok !== true ||
          envelope.className !== className || envelope.action !== 'index' ||
          envelope.data?.studentName !== owner.studentName ||
          envelope.data?.studentIdentity !== owner.identity ||
          envelope.data?.parentRosterRevision !== owner.revision ||
          !Array.isArray(envelope.data.reviews))
        throw new Error('Hồ sơ học viên đã thay đổi. Em vui lòng mở lại bài chữa.');
      for (const oldRow of index?.reviews || []) {
        const freshRow = envelope.data.reviews.find(row => row.assessmentKey === oldRow.assessmentKey);
        if (!freshRow || freshRow.attempt !== oldRow.attempt || freshRow.paper !== oldRow.paper ||
            freshRow.reviewObjectSha256 !== oldRow.reviewObjectSha256 ||
            freshRow.sourceObjectSha256 !== oldRow.sourceObjectSha256)
          throw new Error('Bài chữa đã cập nhật. Em vui lòng mở lại danh sách.');
      }
      if (descriptor && !envelope.data.reviews.some(row => row.assessmentKey === descriptor.assessmentKey &&
          row[action+'ObjectSha256'] === descriptor[action+'ObjectSha256']))
        throw new Error('Bài chữa không còn trong hồ sơ hiện tại.');
    } catch (error) { clear(); throw error; }
  }
  async function request(action, assessmentKey) {
    if (!endpoint || !sameContext()) throw new Error('Chưa thể mở bài chữa từ hồ sơ hiện tại.');
    const owner = context;
    const descriptor = assessmentKey && index?.reviews?.find(row => row.assessmentKey === assessmentKey);
    if (assessmentKey && !descriptor) throw new Error('Bài chữa không nằm trong hồ sơ này.');
    // Native profile guards identity; the service index is authoritative for
    // cache hits because its own profile checks bypass stale browser snapshots.
    if (action !== 'index') await refreshContext();
    if (context !== owner || !sameContext()) throw new Error('Phiên học viên đã thay đổi.');
    const key = `${owner.identity}|${action}|${assessmentKey || ''}|${descriptor?.[action+'ObjectSha256'] || ''}`;
    if (memory.has(key)) {
      if (action !== 'index') await freshIndexGuard(owner, descriptor, action);
      if (context !== owner || !sameContext()) throw new Error('Phiên học viên đã thay đổi.');
      return memory.get(key);
    }
    if (pending.has(key)) return pending.get(key).promise;
    const current = epoch;
    const controller = new AbortController();
    const promise = (async () => {
      const response = await fetch(endpoint, {
        method:'POST', mode:'cors', credentials:'omit', redirect:'follow',
        cache:'no-store', referrerPolicy:'no-referrer',
        headers:{'content-type':'application/json'},
        body:JSON.stringify({className, token:owner.token, action, ...(assessmentKey ? {assessmentKey} : {})}),
        signal:controller.signal
      });
      if (!response.ok) throw new Error('Chưa tải được bài chữa. Em vui lòng thử lại.');
      const envelope = await response.json();
      if (current !== epoch || context !== owner || !sameContext()) throw new Error('Phiên học viên đã thay đổi.');
      if (envelope?.ok !== true || envelope.className !== className || envelope.action !== action || !envelope.data)
        throw new Error('Dữ liệu bài chữa không khớp hồ sơ.');
      const data = envelope.data;
      if (action === 'index') {
        if (data.studentName !== owner.studentName || data.studentIdentity !== owner.identity ||
            data.parentRosterRevision !== owner.revision || !Array.isArray(data.reviews))
          throw new Error('Danh sách bài chữa không khớp hồ sơ.');
        if (data.reviews.some(row => !/^lrw\|[1-4]\|task[12]$/.test(row.assessmentKey || '') ||
            !['task1','task2'].includes(row.paper) || !Number.isInteger(row.attempt) ||
            !/^[a-f0-9]{64}$/.test(row.reviewObjectSha256 || '') ||
            !/^[a-f0-9]{64}$/.test(row.sourceObjectSha256 || '')))
          throw new Error('Danh sách bài chữa có mục không hợp lệ.');
      } else {
        if (data.studentIdentity !== owner.identity || data.assessmentKey !== assessmentKey ||
            (action === 'review' && (data.parentStudentName !== owner.studentName ||
              data.attempt !== descriptor.attempt || data.paper !== descriptor.paper)))
          throw new Error('Bài chữa trả về không khớp học viên hoặc bài kiểm tra.');
        const expected = descriptor[action+'ObjectSha256'];
        if (!expected || envelope.payloadSha256 !== expected ||
            !/^[a-f0-9]{64}$/.test(envelope.responseDataSha256 || '') ||
            await sha256(JSON.stringify(data)) !== envelope.responseDataSha256)
          throw new Error('Bản bài chữa không khớp dấu kiểm nội dung.');
        const images = action === 'review' ? data.task?.images || [] : data.pages || [];
        if (!Array.isArray(images) || images.some(image => !validImageSrc(image.src)))
          throw new Error('Hình bài chữa không hợp lệ.');
      }
      memory.set(key, data);
      return data;
    })().finally(() => { if (pending.get(key)?.promise === promise) pending.delete(key); });
    pending.set(key, {controller, promise});
    return promise;
  }

  function showMessage(message) { body.replaceChildren(node('p', 'wa-message', message)); }
  function makeButton(label, click, className_='wa-button') {
    const button = node('button', className_, label);
    button.type = 'button'; button.addEventListener('click', click); return button;
  }
  function renderIndex(data) {
    index = data;
    nearObserver?.disconnect();
    body.replaceChildren(node('h2', '', 'Bài kiểm tra Writing của em'));
    const list = node('div', 'wa-index');
    nearObserver = typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(entries => {
          for (const entry of entries) if (entry.isIntersecting) {
            nearObserver?.unobserve(entry.target);
            const key = entry.target.dataset.assessmentKey;
            if (key) request('review', key).catch(() => {});
          }
        }, {root:body, rootMargin:'350px'}) : null;
    for (const row of data.reviews || []) {
      if (!row.assessmentKey) continue;
      const item = node('article', 'wa-index-item');
      item.append(node('h3', '', `${row.paper === 'task2' ? 'Task 2' : 'Task 1'} · ${row.examDate || 'Kiểm tra Writing'}`));
      item.append(node('p', '', row.title || row.assessmentKey));
      if (Number.isFinite(Number(row.classOverall))) item.append(node('strong', 'wa-index-score', `Điểm: ${row.classOverall}`));
      const button = makeButton('Đọc bài chữa', () => loadReview(row.assessmentKey));
      button.dataset.assessmentKey = row.assessmentKey;
      for (const event of ['pointerenter','focus','touchstart'])
        button.addEventListener(event, () => request('review', row.assessmentKey).catch(() => {}), {passive:true});
      item.append(button);
      list.append(item);
      nearObserver?.observe(button);
    }
    body.append(list.childElementCount ? list : node('p', 'wa-message', 'Chưa có bài chữa được công bố cho hồ sơ này.'));
  }

  // JavaScript string offsets are UTF-16, matching the frozen review spans.
  function markedText(paragraph, spans, className_) {
    const p = node('p');
    const mask = new Uint8Array(paragraph.length);
    for (const span of spans || []) {
      const start = Math.max(0, Math.min(paragraph.length, Number(span.start)));
      const end = Math.max(start, Math.min(paragraph.length, Number(span.end)));
      if (Number.isFinite(start) && Number.isFinite(end)) mask.fill(1, start, end);
    }
    for (let i = 0; i < paragraph.length;) {
      let j = i + 1;
      while (j < paragraph.length && mask[j] === mask[i]) j++;
      p.append(node(mask[i] ? 'mark' : 'span', mask[i] ? className_ : '', paragraph.slice(i, j)));
      i = j;
    }
    return p;
  }
  function originalText(paragraph, annotations) {
    const p = node('p');
    const valid = (annotations || []).map(a => ({...a,
      start:Math.max(0,Math.min(paragraph.length,Number(a.start))),
      end:Math.max(0,Math.min(paragraph.length,Number(a.end)))}))
      .filter(a => Number.isFinite(a.start) && Number.isFinite(a.end) && a.end > a.start);
    const cuts = [...new Set([0, paragraph.length, ...valid.flatMap(a => [a.start,a.end])])].sort((a,b) => a-b);
    const classes = {grammar:'wa-grammar-mark', vocabulary:'wa-vocabulary-mark', coherence:'wa-coherence-mark'};
    for (let i=0;i<cuts.length-1;i++) {
      const from=cuts[i], to=cuts[i+1];
      const active=valid.find(a => a.start <= from && a.end >= to);
      p.append(node(active ? 'mark' : 'span', active ? classes[active.category] || 'wa-coherence-mark' : '', paragraph.slice(from,to)));
      for (const a of valid.filter(a => a.end === to)) {
        const sup=node('sup','wa-note-anchor');
        const jump=makeButton(a.id || '•', () => document.getElementById('wa-note-'+a.id)?.scrollIntoView({block:'center',behavior:'smooth'}), 'wa-note-jump');
        jump.setAttribute('aria-label', `Xem chú thích ${a.id || ''}`);
        sup.append(jump); p.append(sup);
      }
    }
    return p;
  }
  function heading(text) { return node('h3', 'wa-section-title', text); }
  function renderReview(data) {
    activeReview = data;
    body.replaceChildren();
    body.append(makeButton('← Danh sách bài chữa', () => renderIndex(index), 'wa-back'));
    body.append(node('h2', '', data.assignmentLabel || data.title || 'Bài chữa Writing'));
    if (data.examDate) body.append(node('p', 'wa-muted', `Ngày kiểm tra: ${data.examDate}`));
    const assessment = data.assessment || {};
    const score = node('section', 'wa-score');
    score.append(node('strong', '', `Điểm bài kiểm tra: ${assessment.overallBand ?? '—'}`));
    if (data.classPolicy && data.descriptorAssessment) {
      const deduction = Number(data.classPolicy.wordShortfallDeduction) || 0;
      score.append(node('small', 'wa-score-detail',
        `Điểm theo descriptor: ${data.descriptorAssessment.overallBand ?? '—'} · Quy tắc lớp: ${deduction ? `trừ ${deduction} band ở mỗi CC, LR, GRA` : 'không trừ điểm thiếu từ'} · Điểm lớp: ${data.classPolicy.classOverall ?? assessment.overallBand ?? '—'}`));
    }
    if (data.wordCount) score.append(node('small', 'wa-score-detail',
      `Số từ được tính: ${data.wordCount.count ?? '—'} / tối thiểu ${data.wordCount.minimum ?? '—'}`));
    score.append(node('p', '', data.overall || ''));
    body.append(score);
    const criteria = node('div', 'wa-criteria');
    for (const c of assessment.criteria || []) {
      const card = node('article', 'wa-criterion');
      card.append(node('strong', '', `${c.label || c.id}: ${c.band}`));
      card.append(node('p', '', c.comment || ''));
      criteria.append(card);
    }
    body.append(heading('Điểm theo tiêu chí'), criteria);
    const task = data.task || {};
    body.append(heading('Đề bài'), node('p', 'wa-prompt', task.text || ''));
    for (const image of task.images || []) {
      if (!image.src) continue;
      const figure = node('figure', 'wa-chart');
      const img = node('img'); img.src = image.src; img.alt = image.alt || 'Hình trong đề bài'; img.loading = 'lazy';
      figure.append(img, node('figcaption', '', image.label || 'Hình trong đề')); body.append(figure);
    }
    const original = node('div', 'wa-essay');
    (data.paragraphs || []).forEach((paragraph, paragraphIndex) => {
      const spans = (data.annotations || []).filter(a => a.paragraphIndex === paragraphIndex);
      original.append(originalText(String(paragraph), spans));
    });
    const legend = node('div', 'wa-legend');
    for (const [label, category] of [['Ngữ pháp','grammar'],['Từ vựng','vocabulary'],['Mạch bài','coherence']])
      legend.append(node('span', `wa-legend-item wa-${category}-mark`, label));
    body.append(heading('Bài viết gốc và chú thích'), legend, original);
    if (data.transcriptionNote) body.append(node('p', 'wa-transcription-note', data.transcriptionNote));
    const notes = node('div', 'wa-notes');
    for (const a of data.annotations || []) {
      const card = node('article', 'wa-note');
      card.id = 'wa-note-'+a.id;
      card.append(node('strong', '', `${a.id || ''} · ${a.title || a.errorTypeLabel || 'Nhận xét'}`));
      card.append(node('blockquote', '', a.quote || ''));
      card.append(node('p', '', a.explanation || ''));
      if (a.replacement) card.append(node('p', 'wa-replacement', `Gợi ý sửa: ${a.replacement}`));
      notes.append(card);
    }
    body.append(notes);
    const revision = node('div', 'wa-essay wa-revision');
    for (const paragraph of data.revision?.paragraphs || [])
      revision.append(markedText(String(paragraph.text || ''), paragraph.changes || [], 'wa-revised-mark'));
    body.append(heading('Bản sửa gợi ý'), revision);
    const sourceSection = node('section', 'wa-source');
    sourceSection.append(heading('Ảnh bài viết tay'));
    sourceSection.append(makeButton('Xem ảnh bài gốc', () => loadSource(data.assessmentKey, sourceSection), 'wa-button'));
    body.append(sourceSection);
  }

  async function loadReview(key) {
    showMessage('Đang tải bài chữa…');
    try { renderReview(await request('review', key)); }
    catch (error) { if (error.name !== 'AbortError') showMessage(error.message); }
  }
  async function loadSource(key, host) {
    host.querySelector('.wa-message')?.remove();
    const button = host.querySelector('button');
    if (button) button.disabled = true;
    const loading = node('p', 'wa-message', 'Đang tải ảnh bài gốc…');
    host.append(loading);
    try {
      const data = await request('source', key);
      if (activeReview?.assessmentKey !== key || !host.isConnected) return;
      loading.remove(); button?.remove();
      for (const page of data.pages || []) {
        const figure = node('figure', 'wa-page');
        const image = node('img'); image.src = page.src; image.alt = page.alt || 'Trang bài gốc'; image.loading = 'lazy';
        figure.append(image, node('figcaption', '', page.label || 'Trang bài gốc')); host.append(figure);
      }
    } catch (error) {
      button && (button.disabled = false);
      if (error.name !== 'AbortError') loading.textContent = error.message;
      else loading.remove();
    }
  }
  openButton.addEventListener('click', async () => {
    if (!canOpen() || dialog.open) return;
    const opening = ++openSerial;
    dialog.showModal(); showMessage('Đang tải danh sách bài chữa…');
    try {
      await startContext(opening);
      const data = await request('index');
      if (dialog.open && opening === openSerial) renderIndex(data);
    } catch (error) {
      if (dialog.open && opening === openSerial && error.name !== 'AbortError') showMessage(error.message);
    }
  });

  // Native overview HTML is reconciled in place; reattach this separate card
  // after those paints without changing the native result cards or counters.
  let scheduled = false;
  const mount = () => {
    scheduled = false;
    if (context && !sameContext()) { if (dialog.open) dialog.close(); else clear(); }
    if (!canOpen()) { if (launcher.isConnected) launcher.remove(); if (dialog.open) dialog.close(); return; }
    const target = panel.querySelector('.ielts-personal-results') || panel;
    if (!launcher.isConnected || launcher.parentElement !== target) target.prepend(launcher);
  };
  const schedule = () => { if (!scheduled) { scheduled = true; queueMicrotask(mount); } };
  new MutationObserver(schedule).observe(panel, {childList:true,subtree:true});
  new MutationObserver(schedule).observe(shell, {attributes:true,attributeFilter:['hidden']});
  const nameNode = document.getElementById('portal-student-name');
  if (nameNode) new MutationObserver(schedule).observe(nameNode, {childList:true,characterData:true,subtree:true});
  document.addEventListener('visibilitychange', schedule);
  window.addEventListener('pageshow', schedule);
  window.addEventListener('pagehide', () => { openSerial++; if (dialog.open) dialog.close(); clear(); });
  setInterval(() => {
    if (!dialog.open || !context) return;
    if (!sameContext()) { dialog.close(); return; }
    const owner = context;
    refreshContext().then(() => freshIndexGuard(owner)).catch(() => { if (dialog.open) dialog.close(); });
  }, 30000);
  setInterval(() => { if (dialog.open && context && !sameContext()) dialog.close(); }, 500);
  schedule();
})();
