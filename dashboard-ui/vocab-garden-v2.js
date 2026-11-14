/* VOCAB_GARDEN_V2 — Vườn từ vựng nổi (Cô 14/11/2026: "thay vì 1 tab mới thì là biểu tượng vườn từ vựng nổi 3D siêu đẹp pop up,
   kết hợp với Cô giáo Titi… ở ngoài nhắc nhở hs tưới cây liên tục" — "cả ielts và fighter").
   Presentation only. A floating 3D garden (with cô Titi on IELTS pages, where her games launcher is hidden) sits outside the page
   content, shows how many plants are wilting and keeps reminding the pupil to water; a tap opens the whole garden as a pop-up.
   IELTS → Cây từ vựng IELTS (702 từ), FIGHTER → Cây từ vựng FIGHTER (Vocabulary Foundation 1 + 2). Progress is the pupil's own
   tree (local copy on this site first, then the tree's Apps Script by name + class). Never touches the native model, receipts,
   homework counts, marks or comments. */
(function (root) {
  'use strict';
  if (root.VocabGarden) return;
  root.VocabGarden = {};
  var d = root.document;
  var API = 'https://script.google.com/macros/s/AKfycbzbIthv3oCEXfF93pXF6k4xzhU-9r7uQvrJyRBRIum6vV2iUXQsh7PYILyzt7Y0PaztIg/exec';
  var PROGS = {
    IELTS: { name: 'IELTS', base: '/vocabulary-reading-web/dab51bda4e22754ff9e263b66c755077/', v: '9', dv: '9', sub: 'từ học thuật cho mọi kỹ năng' },
    FIGHTER: { name: 'FIGHTER', base: '/vocabulary-reading-web/3ef8b052b433d8de39f85ec421f43a1a/', v: '1', dv: '1', sub: 'từ Vocabulary Foundation 1 + 2' }
  };
  var TITI = '/vanlang-on-thi-lop-6/game-kit/adventures/teacher-titi-idle.webp';
  var DAY = 864e5, RHYTHM = 2;
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var today = function () { return Math.floor((Date.now() + 7 * 3600e3) / DAY); };
  var dm = function (n) { var x = new Date(n * DAY); return ('0' + x.getUTCDate()).slice(-2) + '/' + ('0' + (x.getUTCMonth() + 1)).slice(-2); };
  var WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var wd = function (n) { return WD[new Date(n * DAY).getUTCDay()]; };

  function cls() {
    var n = d.getElementById('class-tabs'), src = (n && n.getAttribute('aria-label') || '') + ' ' + (d.title || '');
    var m = /\b(IELTS|FIGHTER)\s+(\d+)\b/i.exec(src); return m ? m[1].toUpperCase() + ' ' + m[2] : '';
  }
  var P = PROGS[cls().split(' ')[0]] || PROGS.IELTS;
  function pupil() {
    var t = '';
    var bar = d.getElementById('portal-student-bar'), el = d.getElementById('portal-student-name');   // IELTS
    if (bar && !bar.hidden && el) t = (el.textContent || '').split('·')[0];
    else { var f = d.querySelector('#f5-student strong'); if (f) t = f.textContent || ''; }   // FIGHTER
    t = t.replace(/\s+/g, ' ').trim();
    return t.length >= 5 && t !== '—' ? t : '';
  }

  /* ---------- plant drawings (36×36, 4 levels + fruit) ---------- */
  var SVG = {
    new: '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M10 24h16l-2 8H12z" fill="#c2814f"/><rect x="9" y="22" width="18" height="3.4" rx="1.6" fill="#a8693c"/><path d="M18 22v-7" stroke="#4d7c0f" stroke-width="1.8" stroke-linecap="round"/><path d="M18 16c-1-4-4.6-5.4-8-4.6.6 3.6 3.8 5.4 8 4.6z" fill="#84cc16"/><path d="M18 15c1.2-4 4.8-5.2 8-4.2-.8 3.6-4 5.2-8 4.2z" fill="#a3e635"/></svg>',
    grow: '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M18 33V9" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round"/><path d="M18 26c-2-4-6-5-9.4-4 1 3.6 4.8 5.2 9.4 4z" fill="#65a30d"/><path d="M18 21c2-4 6-5 9.4-4-1 3.6-4.8 5.2-9.4 4z" fill="#84cc16"/><path d="M18 16c-2-3.6-5.4-4.4-8.4-3.4 1 3.2 4.2 4.6 8.4 3.4z" fill="#84cc16"/><path d="M18 11c1.4-3.4 4.6-4.4 7.4-3.6-.8 3-3.8 4.4-7.4 3.6z" fill="#a3e635"/></svg>',
    ripe: '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M16.6 33l.6-10h1.6l.6 10z" fill="#92582f"/><circle cx="11.5" cy="16.5" r="6.5" fill="#16a34a"/><circle cx="24.5" cy="16.5" r="6.5" fill="#16a34a"/><circle cx="18" cy="11" r="8" fill="#22c55e"/><circle cx="18" cy="18.5" r="7" fill="#22c55e"/><circle cx="15" cy="9" r="2.6" fill="#86efac" opacity=".85"/></svg>',
    fruit: '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M16.6 33l.6-10h1.6l.6 10z" fill="#92582f"/><circle cx="11.5" cy="16.5" r="6.5" fill="#16a34a"/><circle cx="24.5" cy="16.5" r="6.5" fill="#16a34a"/><circle cx="18" cy="11" r="8" fill="#22c55e"/><circle cx="18" cy="18.5" r="7" fill="#22c55e"/><circle cx="13" cy="15" r="2.3" fill="#e11d48"/><circle cx="22.5" cy="11" r="2.3" fill="#e11d48"/><circle cx="21" cy="19.5" r="2.3" fill="#e11d48"/></svg>',
    due: '<svg viewBox="0 0 36 36" aria-hidden="true"><path d="M17 33c0-7 1-12 5-17" stroke="#8a7a3a" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M21 18c-1-4.4-4.6-6-8-5 .6 3.8 3.8 5.8 8 5z" fill="#d6b45c"/><path d="M22 15c2.6-1.8 5.2-1 6.6.8-2 1.8-4.6 2-6.6-.8z" fill="#c9a24b"/><path d="M28 21c-1.2 2-2.2 3.2-2.2 4.4a2.2 2.2 0 0 0 4.4 0c0-1.2-1-2.4-2.2-4.4z" fill="#38bdf8"/></svg>'
  };
  var KIND = { due: ['Đang héo', '#ef4444'], new: ['Mới trồng', '#eab308'], grow: ['Đang lớn', '#84cc16'], ripe: ['Trưởng thành', '#16a34a'] };

  /* ---------- styles ---------- */
  var css = '.vg-tab-dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ea580c;margin-left:6px;vertical-align:2px}' +
    '#panel-vocab{background:#f9f8f4;border-radius:22px;padding:22px;color:#1e1b4b}#panel-vocab *{box-sizing:border-box}' +
    '.vg-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin:0 0 16px}.vg-kick{font-size:11px;font-weight:800;letter-spacing:.14em;color:#b45309;text-transform:uppercase}' +
    '.vg-title{margin:4px 0 0;font-size:30px;line-height:1.15;font-weight:800;color:#1e1b4b;letter-spacing:-.02em}.vg-title em{font-style:italic;font-weight:600;color:#10b981;font-family:Georgia,"Times New Roman",serif}' +
    '.vg-chip{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:7px 13px;font-size:13px;font-weight:700}.vg-ok{background:#e3f5eb;color:#11804b}.vg-warn{background:#fff3d6;color:#a15c00}.vg-bad{background:#fdecea;color:#c2372f}.vg-info{background:#e8f1fb;color:#1d4ed8}' +
    '.vg-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.vg-stat{background:#fff;border-radius:18px;padding:16px;box-shadow:0 4px 20px rgba(15,23,42,.04)}.vg-stat b{display:block;font-size:28px;line-height:1.1;font-weight:700;color:#312e81}.vg-stat b small{font-size:14px;color:#94a3b8;font-weight:600}.vg-stat span{display:block;margin-top:4px;font-size:13px;color:#64748b}' +
    '.vg-stat.o b{color:#ea580c}.vg-stat.g b{color:#16a34a}.vg-stat.e b{color:#059669}' +
    '.vg-act{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:14px 0 6px}.vg-go{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:0;border-radius:16px;padding:14px 22px;font:inherit;font-weight:800;font-size:16px;color:#fff;background:linear-gradient(135deg,#10b981,#047857);box-shadow:0 10px 22px rgba(4,120,87,.25);text-decoration:none;cursor:pointer}.vg-go:hover{filter:brightness(1.05)}' +
    '.vg-act small{font-size:13px;color:#64748b}.vg-bar{height:8px;border-radius:99px;background:#ebe8df;overflow:hidden;position:relative;margin:12px 0 2px}.vg-bar i{position:absolute;left:0;top:0;bottom:0;border-radius:99px}.vg-bar .a{background:#c7f0d8}.vg-bar .b{background:linear-gradient(90deg,#10b981,#059669)}' +
    '.vg-days{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:4px;margin:16px 0 4px}.vg-days span{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:10px;color:#64748b;font-weight:600}.vg-days i{width:100%;max-width:26px;aspect-ratio:1;border-radius:8px;background:#ebe8df;display:grid;place-items:center;font-style:normal;font-size:11px}.vg-days .on i{background:#bfe8f8}.vg-days .now i{box-shadow:0 0 0 2px #312e81}' +
    '.vg-sub{margin:22px 0 10px;font-size:20px;font-weight:700;color:#4338ca}' +
    '.vg-pills{display:flex;flex-wrap:wrap;gap:4px;background:#f3f1ec;border-radius:18px;padding:8px;width:fit-content;max-width:100%}.vg-pills button{border:0;background:transparent;border-radius:999px;padding:7px 12px;font:inherit;font-size:13px;font-weight:600;color:#475569;cursor:pointer;white-space:nowrap}.vg-pills button.on{background:#fff;color:#1e1b4b;font-weight:800;box-shadow:0 2px 8px rgba(15,23,42,.08)}' +
    '.vg-tools{display:flex;gap:8px;flex-wrap:wrap;margin:10px 0 14px}.vg-tools select,.vg-tools input{height:40px;border:1px solid #e5e2d8;border-radius:12px;background:#fff;padding:0 12px;font:inherit;font-size:14px;color:#1e1b4b}.vg-tools input{flex:1;min-width:160px}' +
    '.vg-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}@media(min-width:1024px){.vg-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}}@media(max-width:640px){.vg-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}}' +
    '.vg-w{background:#fff;border-radius:16px;padding:14px;border-left:3.5px solid #eab308;box-shadow:0 2px 12px rgba(15,23,42,.04);display:flex;flex-direction:column;gap:4px;min-width:0;cursor:pointer;text-align:left;border-top:0;border-right:0;border-bottom:0;font:inherit;color:inherit;transition:transform .12s,box-shadow .2s}.vg-w:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(15,23,42,.08)}' +
    '.vg-w .r1{display:flex;justify-content:space-between;align-items:center}.vg-w svg{width:36px;height:36px}.vg-say{width:28px;height:28px;border-radius:50%;border:0;background:#f1f0ea;display:grid;place-items:center;font-size:13px;cursor:pointer;flex:none}' +
    '.vg-w b{font-size:17.5px;font-weight:700;color:#1e1b4b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}.vg-w .vi{font-size:13px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.vg-w .meta{font-size:12px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.vg-badge{background:#f1f0ea;border-radius:6px;padding:2px 6px;font-weight:700;color:#475569}' +
    '.vg-w .ft{display:flex;justify-content:space-between;gap:6px;white-space:nowrap;margin-top:6px;padding-top:8px;border-top:1px solid #f1f5f9;font-size:12.5px;font-weight:700}.vg-w .ft span:last-child{color:#94a3b8;font-weight:600}' +
    '.vg-more{display:block;margin:16px auto 0;border:0;background:#fff;border-radius:999px;padding:10px 18px;font:inherit;font-weight:700;color:#312e81;cursor:pointer;box-shadow:0 2px 10px rgba(15,23,42,.06)}.vg-empty{color:#64748b;font-size:14px;margin:6px 0}' +
    '.vg-modal{position:fixed;inset:0;z-index:2147483100;background:rgba(30,27,75,.38);display:flex;align-items:center;justify-content:center;padding:16px;animation:vgf .18s ease-out}@keyframes vgf{from{opacity:0}}' +
    '.vg-sheet{width:min(460px,100%);max-height:calc(100dvh - 32px);overflow:auto;background:#fff;border-radius:24px;padding:22px;box-shadow:0 30px 80px rgba(30,27,75,.3);position:relative;animation:vgu .22s ease-out}@keyframes vgu{from{transform:translateY(16px);opacity:.6}}' +
    '.vg-x{position:absolute;right:14px;top:14px;width:34px;height:34px;border-radius:50%;border:0;background:#f1f0ea;font-size:15px;cursor:pointer}.vg-sheet .big{display:flex;gap:14px;align-items:center}.vg-sheet .big svg{width:72px;height:72px;flex:none;background:#f9f8f4;border-radius:20px;padding:6px}' +
    '.vg-sheet h3{margin:0;font-size:28px;color:#1e1b4b;word-break:break-word}.vg-sheet .ipa{color:#64748b;font-size:14px;margin:2px 0 0}.vg-sheet .mean{font-size:18px;font-weight:700;color:#047857;margin:16px 0 8px}' +
    '.vg-sheet dl{margin:0;display:grid;gap:2px}.vg-sheet dt{font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#4338ca;margin-top:10px}.vg-sheet dd{margin:0;color:#334155;font-size:15px;line-height:1.55}' +
    '.vg-life{display:flex;gap:8px;flex-wrap:wrap;margin:12px 0 0}.vg-btns{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0 0}.vg-btn2{border:0;border-radius:14px;padding:12px 16px;font:inherit;font-weight:700;background:#f1f0ea;color:#1e1b4b;cursor:pointer}' +
    '@media(max-width:640px){#panel-vocab{padding:16px;border-radius:18px}.vg-w{padding:12px}.vg-w b{font-size:16.5px}.vg-w .ft{font-size:11.5px}.vg-title{font-size:26px}.vg-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.vg-stat b{font-size:26px}.vg-go{width:100%}.vg-days{gap:2px}.vg-modal{align-items:flex-end;padding:0}.vg-sheet{border-radius:24px 24px 0 0;width:100%}}';

  /* ---------- data ---------- */
  var loaded = null;
  function script(src) { return new Promise(function (ok, bad) { var s = d.createElement('script'); s.src = src; s.onload = ok; s.onerror = bad; d.head.appendChild(s); }); }
  function words() {
    if (!loaded) loaded = Promise.all([root.RT_CONFIG ? 1 : script(P.base + 'config.js?v=' + P.v), root.RT_UNITS ? 1 : script(P.base + 'data.js?v=' + P.dv)]).then(function () {
      var W = {}, order = [], pos = {}, units = root.RT_UNITS || [];
      units.forEach(function (u, ui) { u.words.forEach(function (w) { W[w.id] = w; w._u = ui; pos[w.id] = order.length; order.push(w.id); }); });
      return { W: W, order: order, pos: pos, units: units, api: (root.RT_CONFIG || {}).API || API };
    });
    return loaded;
  }
  function localState(name, c) { try { return JSON.parse(localStorage.getItem('rt-state:' + name.toUpperCase() + '|' + c) || 'null'); } catch (e) { return null; } }
  function remoteState(api, name, c) {
    if (!api) return Promise.resolve(null);
    var u = api + '?action=rt&name=' + encodeURIComponent(name) + '&cls=' + encodeURIComponent(c) + '&t=' + Date.now();
    return fetch(u).then(function (r) { return r.json(); }).then(function (j) { return j && j.ok && j.state ? j.state : null; }).catch(function () { return null; });
  }
  function norm(st) {   // trạng thái v2 của cây: w[id] = [hộp, ngày đến hạn, số lần sai, ngày gieo, số lần đúng]
    if (!st || st.v !== 2 || typeof st.w !== 'object') return { w: {}, days: {}, lw: 0, n: 0, t: st && +st.t || 0 };
    return { w: st.w, days: st.days || {}, lw: +st.lw || 0, n: +st.n || 0, t: +st.t || 0 };
  }
  function kind(w, t) { if (w[1] <= t) return 'due'; if (w[0] >= 3) return 'ripe'; if (w[0] >= 2) return 'grow'; return 'new'; }
  var right = function (w) { return w[4] != null ? +w[4] : Math.max(0, +w[0] || 0); };
  function say(t) { try { if (!root.speechSynthesis) return; speechSynthesis.cancel(); if (speechSynthesis.paused) speechSynthesis.resume(); var u = new SpeechSynthesisUtterance(String(t).replace(/·/g, ',')); u.lang = 'en-GB'; u.rate = .9; var v = speechSynthesis.getVoices(); var e = v.filter(function (x) { return /^en-gb/i.test(x.lang); })[0] || v.filter(function (x) { return /^en/i.test(x.lang); })[0]; if (e) { u.voice = e; u.lang = e.lang; } setTimeout(function () { speechSynthesis.speak(u); }, 60); } catch (e2) {} }

  /* ---------- render ---------- */
  var cur = { key: '', filter: 'all', unit: '', q: '', limit: 48, data: null, S: null };
  function treeUrl(name, c, extra) { return P.base + '?name=' + encodeURIComponent(name) + '&cls=' + encodeURIComponent(c) + (extra || ''); }
  function render(panel, name, c) {
    var data = cur.data, S = cur.S, t = today();
    if (!name) { panel.innerHTML = '<p class="vg-empty">Chọn học viên để xem Vườn từ vựng.</p>'; return; }
    if (!data || !S) { panel.innerHTML = '<p class="vg-empty">Đang tải vườn của em…</p>'; return; }
    var total = data.order.length, ids = Object.keys(S.w).filter(function (id) { return data.W[id]; });
    var cnt = { due: 0, new: 0, grow: 0, ripe: 0 }; ids.forEach(function (id) { cnt[kind(S.w[id], t)]++; });
    var lw = S.lw, due = lw + RHYTHM, chip;
    if (!lw) chip = '<span class="vg-chip vg-info">🌱 Chưa bắt đầu — gieo hạt đầu tiên hôm nay</span>';
    else if (lw === t) chip = '<span class="vg-chip vg-ok">✓ Đã tưới hôm nay · lần tới trước hết ' + wd(due) + ' ' + dm(due) + '</span>';
    else if (t <= due) chip = t === due ? '<span class="vg-chip vg-warn">⏰ Hôm nay là hạn tưới</span>' : '<span class="vg-chip vg-ok">💧 Đúng nhịp · hạn tưới ' + wd(due) + ' ' + dm(due) + '</span>';
    else chip = '<span class="vg-chip vg-bad">🥀 Vườn đang héo · trễ ' + (t - due) + ' ngày</span>';
    var pctS = Math.round(ids.length / total * 100), pctR = Math.round(cnt.ripe / total * 100);
    var days = ''; for (var i = 13; i >= 0; i--) { var x = t - i, on = !!S.days[x]; days += '<span class="' + (on ? 'on' : '') + (x === t ? ' now' : '') + '"><i>' + (on ? '💧' : '') + '</i>' + (x === t ? 'Nay' : wd(x)) + '</span>'; }
    var q = cur.q.trim().toLowerCase();
    var list = ids.filter(function (id) { var w = data.W[id]; return (cur.filter === 'all' || kind(S.w[id], t) === cur.filter) && (cur.unit === '' || String(w._u) === cur.unit) && (!q || w.w.toLowerCase().indexOf(q) >= 0 || (w.vi || '').toLowerCase().indexOf(q) >= 0); })
      .sort(function (a, b) { var A = S.w[a], B = S.w[b], ka = kind(A, t) === 'due' ? 0 : 1, kb = kind(B, t) === 'due' ? 0 : 1; return ka - kb || A[1] - B[1] || data.pos[a] - data.pos[b]; });
    var cards = list.slice(0, cur.limit).map(function (id) {
      var w = data.W[id], s = S.w[id], k = kind(s, t), left = s[1] - t, svg = k === 'ripe' && s[0] >= 4 ? SVG.fruit : SVG[k];
      return '<div class="vg-w" role="button" tabindex="0" data-vg-w="' + esc(id) + '" style="border-left-color:' + KIND[k][1] + '"><div class="r1">' + svg + '<button type="button" class="vg-say" data-vg-say="' + esc(w.w) + '" aria-label="Nghe phát âm ' + esc(w.w) + '">🔊</button></div>' +
        '<b>' + esc(w.w) + '</b><span class="vi">' + esc(w.vi) + '</span><span class="meta"><span class="vg-badge">' + esc((data.units[w._u] || {}).label || '') + '</span> · ' + right(s) + ' lần đúng</span>' +
        '<div class="ft"><span style="color:' + KIND[k][1] + '">' + (k === 'ripe' && s[0] >= 4 ? 'Ra quả' : KIND[k][0]) + '</span><span>' + (left <= 0 ? 'Hôm nay' : left + 'd') + '</span></div></div>';
    }).join('');
    var F = [['all', 'Tất cả ' + ids.length], ['due', '🥀 Đang héo ' + cnt.due], ['new', '🌱 Mới trồng ' + cnt.new], ['grow', '🌿 Đang lớn ' + cnt.grow], ['ripe', '🌳 Trưởng thành ' + cnt.ripe]];
    var opts = '<option value="">Tất cả chặng</option>' + data.units.map(function (u, i) { var n = u.words.filter(function (w) { return S.w[w.id]; }).length; return n ? '<option value="' + i + '"' + (cur.unit === String(i) ? ' selected' : '') + '>' + esc(u.label) + ' · ' + n + ' cây</option>' : ''; }).join('');
    var keepFocus = d.activeElement && d.activeElement.id === 'vg-q';
    panel.innerHTML = '<div class="vg-head"><div><span class="vg-kick">Cây từ vựng ' + P.name + ' · ' + total + ' ' + P.sub + '</span><h3 class="vg-title">Vườn <em>từ vựng</em> của bạn</h3></div>' + chip + '</div>' +
      '<div class="vg-stats"><div class="vg-stat"><b>' + ids.length + ' <small>/ ' + total + '</small></b><span>Tổng cây</span></div>' +
      '<div class="vg-stat o"><b>' + cnt.due + '</b><span>Cần tưới hôm nay</span></div>' +
      '<div class="vg-stat g"><b>' + (S.days[t] ? '✓' : 0) + '</b><span>Đã tưới hôm nay</span></div>' +
      '<div class="vg-stat e"><b>' + cnt.ripe + '</b><span>Cây trưởng thành</span></div></div>' +
      '<div class="vg-act"><a class="vg-go" href="' + esc(treeUrl(name, c, '&go=1')) + '" target="_blank" rel="noopener">💧 ' + (S.days[t] ? 'Tưới thêm / ôn lại' : 'Tưới cây hôm nay') + '</a><small>Ít nhất <b>2 ngày tưới 1 lần</b> · mỗi lần 5–7 phút: ôn cây đang héo + gieo cây mới.</small></div>' +
      '<div class="vg-bar" title="Đã gieo ' + ids.length + '/' + total + ' · trưởng thành ' + cnt.ripe + '"><i class="a" style="width:' + pctS + '%"></i><i class="b" style="width:' + pctR + '%"></i></div>' +
      '<div class="vg-days" aria-label="Nhịp tưới 14 ngày">' + days + '</div>' +
      '<h4 class="vg-sub">Vườn từ vựng</h4>' +
      (ids.length ? '<div class="vg-pills" role="tablist">' + F.map(function (f) { return '<button type="button" data-vg-f="' + f[0] + '"' + (cur.filter === f[0] ? ' class="on"' : '') + '>' + f[1] + '</button>'; }).join('') + '</div>' +
        '<div class="vg-tools"><select id="vg-unit" aria-label="Lọc theo chặng">' + opts + '</select><input id="vg-q" type="search" placeholder="🔎 Tìm từ hoặc nghĩa…" value="' + esc(cur.q) + '"></div>' +
        (cards ? '<div class="vg-grid">' + cards + '</div>' : '<p class="vg-empty">Không có cây nào ở mục này.</p>') + (list.length > cur.limit ? '<button type="button" class="vg-more" data-vg-more>Xem thêm ' + Math.min(48, list.length - cur.limit) + ' cây</button>' : '')
        : '<p class="vg-empty">Vườn còn trống. Bấm <b>Tưới cây hôm nay</b> để gieo những hạt từ đầu tiên.</p>');
    panel.querySelectorAll('[data-vg-f]').forEach(function (b) { b.onclick = function () { cur.filter = b.getAttribute('data-vg-f'); cur.limit = 48; render(panel, name, c); }; });
    var sel = panel.querySelector('#vg-unit'); if (sel) sel.onchange = function () { cur.unit = sel.value; cur.limit = 48; render(panel, name, c); };
    var qi = panel.querySelector('#vg-q'); if (qi) { qi.oninput = function () { cur.q = qi.value; cur.limit = 48; clearTimeout(qi._t); qi._t = setTimeout(function () { render(panel, name, c); }, 180); }; if (keepFocus) { qi.focus(); qi.setSelectionRange(qi.value.length, qi.value.length); } }
    var more = panel.querySelector('[data-vg-more]'); if (more) more.onclick = function () { cur.limit += 48; render(panel, name, c); };
    panel.querySelectorAll('[data-vg-say]').forEach(function (b) { b.onclick = function (e) { e.stopPropagation(); say(b.getAttribute('data-vg-say')); }; });
    panel.querySelectorAll('[data-vg-w]').forEach(function (el) {
      var open = function () { detail(el.getAttribute('data-vg-w'), name, c); };
      el.onclick = open; el.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
    });
  }
  function detail(id, name, c) {
    var data = cur.data, S = cur.S, w = data.W[id], s = S.w[id], t = today(); if (!w || !s) return;
    var k = kind(s, t), svg = k === 'ripe' && s[0] >= 4 ? SVG.fruit : SVG[k], left = s[1] - t;
    var m = d.createElement('div'); m.className = 'vg-modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.setAttribute('aria-label', w.w);
    m.innerHTML = '<div class="vg-sheet"><button type="button" class="vg-x" aria-label="Đóng">✕</button><div class="big">' + svg + '<div><h3>' + esc(w.w) + '</h3><p class="ipa">' + esc([w.ipa, w.pos].filter(Boolean).join(' · ')) + '</p></div></div>' +
      '<div class="vg-life"><span class="vg-chip" style="background:' + KIND[k][1] + '1f;color:' + KIND[k][1] + '">' + (k === 'ripe' && s[0] >= 4 ? '🍎 Ra quả' : KIND[k][0]) + '</span><span class="vg-chip vg-info">✓ ' + right(s) + ' lần đúng' + (s[2] ? ' · ✗ ' + s[2] + ' lần sai' : '') + '</span><span class="vg-chip" style="background:#f1f0ea;color:#475569">' + (left <= 0 ? 'Cần ôn hôm nay' : 'Ôn lại sau ' + left + ' ngày') + '</span></div>' +
      '<p class="mean">' + esc(w.vi) + '</p><dl>' + (w.fam ? '<dt>Word family</dt><dd>' + esc(w.fam) + '</dd>' : '') + (w.col ? '<dt>Collocation</dt><dd><em>' + esc(w.col) + '</em></dd>' : '') + (w.ex ? '<dt>Ví dụ</dt><dd>' + esc(w.ex) + '</dd>' : '') + '</dl>' +
      '<div class="vg-btns"><button type="button" class="vg-btn2" data-say>🔊 Nghe phát âm</button><a class="vg-go" href="' + esc(treeUrl(name, c, '&focus=' + encodeURIComponent(id))) + '" target="_blank" rel="noopener">💧 Luyện bài tập cho từ này</a></div></div>';
    var close = function () { m.remove(); d.removeEventListener('keydown', onKey); };
    var onKey = function (e) { if (e.key === 'Escape') close(); };
    m.onclick = function (e) { if (e.target === m) close(); };
    m.querySelector('.vg-x').onclick = close; m.querySelector('[data-say]').onclick = function () { say(w.w); };
    d.addEventListener('keydown', onKey); d.body.appendChild(m); m.querySelector('.vg-x').focus(); say(w.w);
  }
  /* ---------- floating 3D garden + pop-up ---------- */
  function tree3d(mood) {   // mood: due (héo, bình tưới đang rót) · ok (xanh) · ripe (ra quả) · seed (mầm)
    var L = mood === 'due' ? ['#f3e3a0', '#c9b04a', '#7a6a22'] : ['#d9f99d', '#4ade80', '#15803d'];
    var B = mood === 'due' ? ['#c2a83e', '#6b5b1c'] : ['#22c55e', '#14532d'];
    var crown = mood === 'seed'
      ? '<path d="M60 72V50" stroke="url(#vgT)" stroke-width="4.5" stroke-linecap="round"/><path d="M60 56c-4-12-15-16-25-12 2 11 13 17 25 12z" fill="url(#vgL)"/><path d="M60 51c4-12 15-15 25-11-3 11-13 16-25 11z" fill="url(#vgL)"/><ellipse cx="45" cy="47" rx="5" ry="2" fill="#fff" opacity=".5" transform="rotate(20 45 47)"/>'
      : '<path d="M60 74V46M60 60l-12-10M60 54l11-9" stroke="url(#vgT)" stroke-width="6.5" stroke-linecap="round"/>' +
        '<g' + (mood === 'due' ? ' transform="rotate(6 60 70)"' : '') + '>' +
        '<circle cx="36" cy="46" r="15" fill="url(#vgB)"/><circle cx="84" cy="46" r="15" fill="url(#vgB)"/><circle cx="60" cy="54" r="16" fill="url(#vgB)"/>' +
        '<circle cx="44" cy="34" r="17" fill="url(#vgL)"/><circle cx="77" cy="34" r="17" fill="url(#vgL)"/><circle cx="60" cy="22" r="19" fill="url(#vgL)"/><circle cx="60" cy="42" r="17" fill="url(#vgL)"/>' +
        '<ellipse cx="52" cy="13" rx="8" ry="4.4" fill="#fff" opacity=".6" transform="rotate(-24 52 13)"/><ellipse cx="36" cy="28" rx="4.4" ry="2.4" fill="#fff" opacity=".45" transform="rotate(-34 36 28)"/><ellipse cx="70" cy="30" rx="3.6" ry="2" fill="#fff" opacity=".4" transform="rotate(-20 70 30)"/>' +
        (mood === 'ripe' ? '<g class="vg-fruit"><circle cx="42" cy="44" r="4.8" fill="url(#vgF)"/><circle cx="78" cy="40" r="4.8" fill="url(#vgF)"/><circle cx="64" cy="50" r="4.8" fill="url(#vgF)"/><circle cx="54" cy="26" r="4.2" fill="url(#vgF)"/><circle cx="72" cy="20" r="4" fill="url(#vgF)"/></g>' : '') +
        (mood === 'due' ? '<path d="M30 58c-3 4-3 8-1 10M90 58c3 4 3 8 1 10" stroke="#a8862c" stroke-width="2.4" fill="none" stroke-linecap="round"/>' : '') + '</g>';
    var can = mood === 'due' || mood === 'seed'
      ? '<g class="vg-can"><path d="M101 2h14a5 5 0 0 1 5 5v13a5 5 0 0 1-5 5h-14a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z" fill="url(#vgC)" transform="rotate(-28 108 14)"/><path d="M98 18L82 28" stroke="#0284c7" stroke-width="4" stroke-linecap="round"/><path d="M80 25l5 6" stroke="#0369a1" stroke-width="3.4" stroke-linecap="round"/><path d="M110 0c7 0 10 5 9 10" stroke="#0369a1" stroke-width="2.6" fill="none" stroke-linecap="round" transform="rotate(-28 108 14)"/></g>' +
        '<g class="vg-drops"><path d="M80 34c-1.6 2.6-2.6 4.2-2.6 5.4a2.6 2.6 0 0 0 5.2 0c0-1.2-1-2.8-2.6-5.4z" fill="#38bdf8"/><path d="M74 42c-1.4 2.2-2.2 3.6-2.2 4.6a2.2 2.2 0 0 0 4.4 0c0-1-.8-2.4-2.2-4.6z" fill="#7dd3fc"/><path d="M85 44c-1.4 2.2-2.2 3.6-2.2 4.6a2.2 2.2 0 0 0 4.4 0c0-1-.8-2.4-2.2-4.6z" fill="#0ea5e9"/></g>' : '';
    return '<svg viewBox="0 0 124 120" aria-hidden="true"><defs>' +
      '<radialGradient id="vgL" cx="32%" cy="26%" r="85%"><stop offset="0" stop-color="' + L[0] + '"/><stop offset=".48" stop-color="' + L[1] + '"/><stop offset="1" stop-color="' + L[2] + '"/></radialGradient>' +
      '<radialGradient id="vgB" cx="40%" cy="30%" r="80%"><stop offset="0" stop-color="' + B[0] + '"/><stop offset="1" stop-color="' + B[1] + '"/></radialGradient>' +
      '<linearGradient id="vgP" x1="0" x2="1"><stop offset="0" stop-color="#9a3412"/><stop offset=".33" stop-color="#f6a06a"/><stop offset=".62" stop-color="#dc6a32"/><stop offset="1" stop-color="#7c2d12"/></linearGradient>' +
      '<linearGradient id="vgR" x1="0" x2="1"><stop offset="0" stop-color="#b4471d"/><stop offset=".38" stop-color="#ffc59c"/><stop offset="1" stop-color="#9a3412"/></linearGradient>' +
      '<linearGradient id="vgT" x1="0" x2="1"><stop offset="0" stop-color="#6b3f1d"/><stop offset=".5" stop-color="#b98450"/><stop offset="1" stop-color="#5b3416"/></linearGradient>' +
      '<linearGradient id="vgC" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7dd3fc"/><stop offset="1" stop-color="#0284c7"/></linearGradient>' +
      '<radialGradient id="vgF" cx="35%" cy="30%"><stop offset="0" stop-color="#ffe4e6"/><stop offset=".45" stop-color="#f43f5e"/><stop offset="1" stop-color="#9f1239"/></radialGradient>' +
      '<radialGradient id="vgS"><stop offset="0" stop-color="#0f172a" stop-opacity=".35"/><stop offset="1" stop-color="#0f172a" stop-opacity="0"/></radialGradient></defs>' +
      '<ellipse cx="60" cy="113" rx="38" ry="6.5" fill="url(#vgS)"/>' +
      '<path d="M34 80h52l-6.2 27.6a5 5 0 0 1-4.9 3.9H45.1a5 5 0 0 1-4.9-3.9z" fill="url(#vgP)"/>' +
      '<rect x="29" y="71" width="62" height="12" rx="6" fill="url(#vgR)"/><ellipse cx="60" cy="72.6" rx="27" ry="3.4" fill="#4a2c14"/>' +
      '<path d="M45 92c8 3 22 3 30 0" stroke="#fff" stroke-opacity=".28" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
      crown + can + '</svg>';
  }
  var fabCss = '#vg-fab{position:fixed;right:max(18px,env(safe-area-inset-right));bottom:calc(max(18px,env(safe-area-inset-bottom)) + var(--vg-lift,0px));z-index:2147482000;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font-family:inherit;pointer-events:none}' +
    '#vg-fab[hidden]{display:none!important}#vg-fab>*{pointer-events:auto}' +
    '#vg-fab .vg-fbtn{position:relative;display:flex;align-items:flex-end;justify-content:flex-end;width:124px;height:124px;padding:0;border:0;background:none;cursor:pointer;perspective:420px;-webkit-tap-highlight-color:transparent}' +
    '#vg-fab .vg-fbtn:focus-visible{outline:3px solid #10b981;outline-offset:4px;border-radius:24px}' +
    '#vg-fab .vg-fbtn.titi{width:178px}#vg-fab .vg-stage{position:relative;width:112px;height:112px;margin-bottom:6px;transform-style:preserve-3d;animation:vg-bob 3.6s ease-in-out infinite;transition:transform .25s}' +
    '#vg-fab .vg-fbtn:hover .vg-stage{transform:rotateX(10deg) rotateY(-14deg) scale(1.06)}' +
    '#vg-fab .vg-disc{position:absolute;left:4px;right:4px;bottom:2px;height:34px;border-radius:50%;background:radial-gradient(ellipse at 50% 35%,#ecfdf5 0,#a7f3d0 45%,#34d399 75%,#047857 100%);box-shadow:0 10px 18px rgba(4,120,87,.35),inset 0 -4px 8px rgba(6,78,59,.35),inset 0 3px 6px rgba(255,255,255,.7);transform:rotateX(58deg)}' +
    '#vg-fab .vg-tree{position:absolute;left:0;right:0;bottom:8px;margin:auto;width:104px;height:100px;filter:drop-shadow(0 8px 6px rgba(15,23,42,.22))}#vg-fab .vg-tree svg{width:100%;height:100%;display:block;overflow:visible}' +
    '#vg-fab.due .vg-tree svg{transform-origin:50% 92%;animation:vg-wilt 2.8s ease-in-out infinite}#vg-fab .vg-drops{animation:vg-drip 1.3s ease-in infinite}#vg-fab .vg-can{transform-origin:108px 14px;animation:vg-pour 2.6s ease-in-out infinite}' +
    '#vg-fab .vg-titi{position:absolute;left:0;bottom:14px;width:74px;height:99px;background:url(\'' + TITI + '\') 0 0/400% 100% no-repeat;filter:drop-shadow(0 6px 6px rgba(15,23,42,.25));animation:vg-wave 5.6s steps(1,end) infinite;pointer-events:none}' +
    '#vg-fab .vg-cap{position:absolute;left:50%;bottom:-8px;transform:translateX(-50%);white-space:nowrap;padding:5px 11px;border-radius:999px;background:linear-gradient(180deg,#065f46,#064e3b);color:#fff;border:1px solid #6ee7b7;font-size:11.5px;font-weight:800;box-shadow:0 3px 0 #022c22,0 8px 18px rgba(2,44,34,.28)}' +
    '#vg-fab .vg-n{position:absolute;right:6px;top:4px;min-width:26px;height:26px;padding:0 7px;border-radius:999px;background:linear-gradient(180deg,#fb7185,#e11d48);color:#fff;font-size:13px;font-weight:900;display:grid;place-items:center;border:2px solid #fff;box-shadow:0 4px 10px rgba(225,29,72,.4);animation:vg-pulse 1.8s ease-in-out infinite}#vg-fab .vg-n[hidden]{display:none}' +
    '#vg-fab .vg-bub{position:relative;max-width:min(250px,calc(100vw - 40px));background:#fff;color:#1e1b4b;border-radius:18px;padding:11px 34px 11px 14px;box-shadow:0 14px 34px rgba(15,23,42,.18),0 2px 0 #d1fae5;border:1px solid #d1fae5;font-size:13.5px;line-height:1.4;text-align:left;cursor:pointer;animation:vg-pop .35s cubic-bezier(.2,1.4,.4,1)}' +
    '#vg-fab .vg-bub:after{content:"";position:absolute;right:52px;bottom:-8px;width:16px;height:16px;background:#fff;border-right:1px solid #d1fae5;border-bottom:1px solid #d1fae5;transform:rotate(45deg)}' +
    '#vg-fab .vg-bub b{display:block;font-size:14.5px;color:#047857}#vg-fab.due .vg-bub b{color:#c2410c}#vg-fab .vg-bub span{display:block;color:#475569;font-size:12.5px;margin-top:2px}' +
    '#vg-fab .vg-bub .vg-bx{position:absolute;right:6px;top:6px;width:24px;height:24px;border:0;border-radius:50%;background:#f1f5f9;color:#64748b;font-size:13px;line-height:24px;cursor:pointer;padding:0}' +
    '#vg-fab .vg-bub.nudge{animation:vg-nudge .9s ease-in-out}' +
    '@keyframes vg-wave{0%,100%{background-position:0 0}18%,23%{background-position:33.3333% 0}27%,45%{background-position:0 0}50%,69%{background-position:100% 0}73%,78%{background-position:33.3333% 0}82%{background-position:0 0}}@keyframes vg-pour{0%,100%{transform:rotate(0)}40%,70%{transform:rotate(-10deg)}}@keyframes vg-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}@keyframes vg-wilt{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}}' +
    '@keyframes vg-drip{0%{transform:translateY(-6px);opacity:0}30%{opacity:1}100%{transform:translateY(14px);opacity:0}}@keyframes vg-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.12)}}' +
    '@keyframes vg-pop{from{transform:translateY(8px) scale(.9);opacity:0}}@keyframes vg-nudge{0%,100%{transform:rotate(0)}20%{transform:rotate(-4deg) scale(1.04)}40%{transform:rotate(3deg)}60%{transform:rotate(-2deg)}80%{transform:rotate(1deg)}}' +
    '@media(prefers-reduced-motion:reduce){#vg-fab *{animation:none!important}}' +
    '@media(max-width:640px){#vg-fab .vg-fbtn{width:104px;height:108px}#vg-fab .vg-fbtn.titi{width:150px}#vg-fab .vg-stage{width:94px;height:94px}#vg-fab .vg-tree{width:88px;height:85px}#vg-fab .vg-titi{width:60px;height:80px;bottom:16px}#vg-fab .vg-bub{font-size:12.5px;max-width:220px}}' +
    '.vg-pop{position:fixed;inset:0;z-index:2147483000;background:rgba(15,23,42,.42);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:18px;animation:vgf .18s ease-out}' +
    '.vg-pop[hidden]{display:none}.vg-card{position:relative;width:min(1080px,100%);max-height:calc(100dvh - 36px);overflow:auto;overscroll-behavior:contain;border-radius:26px;background:#f9f8f4;box-shadow:0 30px 90px rgba(15,23,42,.35);animation:vgu .24s ease-out}' +
    '.vg-card .vg-close{position:sticky;top:12px;float:right;margin:12px 12px -46px 0;z-index:2;width:38px;height:38px;border-radius:50%;border:0;background:#fff;box-shadow:0 4px 14px rgba(15,23,42,.14);font-size:17px;cursor:pointer}' +
    '.vg-card #panel-vocab{border-radius:26px;padding:26px}' +
    '@media(max-width:640px){.vg-pop{padding:0;align-items:flex-end}.vg-card{border-radius:24px 24px 0 0;max-height:94dvh}.vg-card #panel-vocab{padding:18px 14px 26px}}';

  var lastKey = '';
  function load(name, c) {   // trạng thái cây: bản trong máy (cùng trang web) rồi bản trên máy chủ
    var key = name + '|' + c;
    if (key !== cur.key) cur = { key: key, filter: 'all', unit: '', q: '', limit: 48, data: cur.data, S: null };
    var loc = norm(localState(name, c)); if (!cur.S || loc.t > cur.S.t) cur.S = loc;
    return fetch(API + '?action=rt&name=' + encodeURIComponent(name) + '&cls=' + encodeURIComponent(c) + '&t=' + Date.now())
      .then(function (r) { return r.json(); }).then(function (j) { if (cur.key === key && j && j.ok && j.state) { var r = norm(j.state); if (r.t > cur.S.t) cur.S = r; } })
      .catch(function () {}).then(function () { return cur.key === key; });
  }
  function status(S) {
    var t = today(), due = 0; Object.keys(S.w).forEach(function (id) { if (S.w[id][1] <= t) due++; });
    var ripe = 0; Object.keys(S.w).forEach(function (id) { if (S.w[id][0] >= 3 && S.w[id][1] > t) ripe++; });
    var n = Object.keys(S.w).length, lw = S.lw, dueDay = lw + RHYTHM, o = { due: due, n: n, ripe: ripe };
    if (!n && !lw) { o.mood = 'seed'; o.need = true; o.title = 'Cô Titi tặng em một vườn từ vựng 🌱'; o.text = 'Gieo những hạt từ đầu tiên hôm nay nhé!'; }
    else if (S.days[t]) { o.mood = ripe ? 'ripe' : 'ok'; o.need = false; o.title = 'Giỏi lắm! Vườn đã được tưới hôm nay 🌳'; o.text = 'Lần tưới tới: trước hết ' + wd(dueDay) + ' ' + dm(dueDay); }
    else if (t > dueDay) { o.mood = 'due'; o.need = true; o.title = '🥀 Vườn trễ ' + (t - dueDay) + ' ngày rồi!'; o.text = (due ? due + ' cây đang héo — ' : '') + 'vào tưới cứu cây ngay nhé 💧'; }
    else if (t === dueDay || due) { o.mood = 'due'; o.need = true; o.title = 'Tưới cây hôm nay nhé! 💧'; o.text = due ? due + ' cây đang héo chờ em' : 'Hôm nay đến hạn tưới vườn'; }
    else { o.mood = ripe ? 'ripe' : 'ok'; o.need = false; o.title = 'Vườn đang xanh tốt 🌿'; o.text = 'Hạn tưới: ' + wd(dueDay) + ' ' + dm(dueDay) + ' · ' + n + ' cây'; }
    return o;
  }
  function hush(set) { try { if (set) sessionStorage.setItem('vg-hush', String(Date.now())); return Date.now() - (+sessionStorage.getItem('vg-hush') || 0) < 30 * 60e3; } catch (e) { return false; } }

  function install() {
    var c = cls(); if (!/^(IELTS|FIGHTER) \d+$/.test(c) || d.getElementById('vg-fab')) return;
    var st = d.createElement('style'); st.id = 'vg-style'; st.textContent = css + fabCss; d.head.appendChild(st);
    var titiGames = d.getElementById('titi-games');
    var withTiti = P.name === 'IELTS';   // IELTS: cô Titi (trò chơi) đã ẩn → cô đứng cạnh vườn; FIGHTER: vườn đứng trên nút trò chơi của cô
    var fab = d.createElement('div'); fab.id = 'vg-fab'; fab.hidden = true;
    fab.innerHTML = '<div class="vg-bub" role="status" hidden><button type="button" class="vg-bx" aria-label="Ẩn lời nhắc">✕</button><b></b><span></span></div>' +
      '<button type="button" class="vg-fbtn' + (withTiti ? ' titi' : '') + '" aria-label="Mở Vườn từ vựng">' + (withTiti ? '<span class="vg-titi" aria-hidden="true"></span>' : '') +
      '<span class="vg-stage"><span class="vg-disc"></span><span class="vg-tree"></span></span>' +
      '<span class="vg-n" hidden></span><span class="vg-cap">🌳 Vườn từ vựng</span></button>';
    d.body.appendChild(fab);
    var bub = fab.querySelector('.vg-bub'), btn = fab.querySelector('.vg-fbtn'), cnt = fab.querySelector('.vg-n'), treeEl = fab.querySelector('.vg-tree');
    var pop = d.createElement('div'); pop.className = 'vg-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-modal', 'true'); pop.setAttribute('aria-label', 'Vườn từ vựng');
    pop.innerHTML = '<div class="vg-card"><button type="button" class="vg-close" aria-label="Đóng Vườn từ vựng">✕</button><section id="panel-vocab" aria-label="Vườn từ vựng"></section></div>';
    d.body.appendChild(pop);
    var panel = pop.querySelector('#panel-vocab');
    function lift() {   // FIGHTER: đứng ngay trên nút trò chơi của cô Titi
      var g = titiGames && root.getComputedStyle(titiGames).display !== 'none' && titiGames.getBoundingClientRect();
      fab.style.setProperty('--vg-lift', g && g.height ? Math.round(g.height + 14) + 'px' : '0px');
    }
    var mood = '', shownAt = 0;
    function paint() {
      var name = pupil(); fab.hidden = !name || !cur.S || cur.key !== name + '|' + c; if (fab.hidden) return;
      var o = status(cur.S);
      if (o.mood !== mood) { mood = o.mood; treeEl.innerHTML = tree3d(mood); fab.className = mood === 'due' || mood === 'seed' ? 'due' : ''; }
      cnt.hidden = !o.due; cnt.textContent = o.due > 99 ? '99+' : String(o.due);
      btn.setAttribute('aria-label', 'Mở Vườn từ vựng — ' + o.title + (o.due ? ' · ' + o.due + ' cây đang héo' : ''));
      bub.querySelector('b').textContent = o.title; bub.querySelector('span').textContent = o.text;
      var show = o.need ? !hush() : Date.now() - shownAt < 6000;   // đến hạn: nhắc liên tục (ẩn được 30 phút); đã tưới: khen 6 giây
      if (show && bub.hidden) { bub.hidden = false; if (!o.need) setTimeout(paint, 6200); }
      if (!show) bub.hidden = true;
      lift();
    }
    function refresh() {
      var name = pupil();
      if (!name) { cur.key = ''; paint(); return; }
      var first = cur.key !== name + '|' + c; if (first) shownAt = Date.now();
      load(name, c).then(function (ok) { if (!ok) return; paint(); if (!pop.hidden && cur.data) render(panel, name, c); });
    }
    function open() {
      var name = pupil(); if (!name) return;
      pop.hidden = false; d.documentElement.style.overflow = 'hidden'; bub.hidden = true;
      render(panel, name, c);
      words().then(function (data) { cur.data = data; if (!pop.hidden) render(panel, pupil(), c); })
        .catch(function () { panel.innerHTML = '<p class="vg-empty">Chưa tải được Vườn từ vựng — em kiểm tra mạng rồi mở lại nhé.</p>'; loaded = null; });
      setTimeout(function () { var x = pop.querySelector('.vg-close'); if (x) x.focus(); }, 30);
    }
    function close() { pop.hidden = true; d.documentElement.style.overflow = ''; paint(); btn.focus(); }
    btn.addEventListener('click', open);
    bub.addEventListener('click', function (e) { if (e.target.closest('.vg-bx')) { e.stopPropagation(); hush(true); bub.hidden = true; return; } open(); });
    pop.querySelector('.vg-close').addEventListener('click', close);
    pop.addEventListener('click', function (e) { if (e.target === pop) close(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden && !d.querySelector('.vg-modal')) close(); });
    // nhắc liên tục: lắc bong bóng mỗi 25 giây khi vườn đến hạn tưới
    setInterval(function () { if (!bub.hidden && fab.className === 'due' && pop.hidden) { bub.classList.remove('nudge'); void bub.offsetWidth; bub.classList.add('nudge'); } }, 25000);
    setInterval(refresh, 10 * 60e3);
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'visible') refresh(); });   // em tưới ở tab khác rồi quay lại
    root.addEventListener('resize', lift);
    // học sinh mở / đổi hồ sơ: theo dõi tên đang hiển thị
    var seen = '';
    function watch() { var n = pupil(); if (n !== seen) { seen = n; refresh(); } }
    if (root.MutationObserver) new MutationObserver(function () { clearTimeout(watch._t); watch._t = setTimeout(watch, 250); }).observe(d.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['hidden'] });
    setInterval(watch, 3000);
    root.VocabGarden = { open: open, refresh: refresh, program: P.name };
    watch();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', install); else install();
})(window);
