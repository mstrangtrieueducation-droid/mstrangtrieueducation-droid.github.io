/* IELTS_VOCAB_GARDEN_V1 (Cô 14/11/2026: "tôi muốn cây này lên dashboard ielts của hs tôi" + bản mô tả "VƯỜN TỪ VỰNG").
   Presentation only. Adds a "🌳 Vườn từ vựng" tab + panel to an IELTS class page: every word of the Cây từ vựng IELTS list
   (/vocabulary-reading-web/…/data.js, kept 100% as is) is one plant. It reads the pupil's own tree progress (local copy on
   this site first, then the tree's Apps Script by name + class) and sends the pupil to the tree's own exercises to water.
   Never touches the native model, receipts, homework counts, marks or comments. */
(function (root) {
  'use strict';
  if (root.IeltsVocabGarden) return;
  root.IeltsVocabGarden = {};
  var d = root.document;
  var BASE = '/vocabulary-reading-web/dab51bda4e22754ff9e263b66c755077/';
  var DAY = 864e5, RHYTHM = 2;
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var today = function () { return Math.floor((Date.now() + 7 * 3600e3) / DAY); };
  var dm = function (n) { var x = new Date(n * DAY); return ('0' + x.getUTCDate()).slice(-2) + '/' + ('0' + (x.getUTCMonth() + 1)).slice(-2); };
  var WD = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  var wd = function (n) { return WD[new Date(n * DAY).getUTCDay()]; };

  function cls() { var n = d.getElementById('class-tabs'); var m = n && /IELTS\s+\d+/.exec(n.getAttribute('aria-label') || ''); return m ? m[0].toUpperCase() : ''; }
  function pupil() {
    var bar = d.getElementById('portal-student-bar'), el = d.getElementById('portal-student-name');
    if (!bar || bar.hidden || !el) return '';
    var t = (el.textContent || '').split('·')[0].replace(/\s+/g, ' ').trim();
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
    '.vg-modal{position:fixed;inset:0;z-index:2147483000;background:rgba(30,27,75,.38);display:flex;align-items:center;justify-content:center;padding:16px;animation:vgf .18s ease-out}@keyframes vgf{from{opacity:0}}' +
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
    if (!loaded) loaded = Promise.all([root.RT_CONFIG ? 1 : script(BASE + 'config.js?v=7'), root.RT_UNITS ? 1 : script(BASE + 'data.js?v=7')]).then(function () {
      var W = {}, order = [], pos = {}, units = root.RT_UNITS || [];
      units.forEach(function (u, ui) { u.words.forEach(function (w) { W[w.id] = w; w._u = ui; pos[w.id] = order.length; order.push(w.id); }); });
      return { W: W, order: order, pos: pos, units: units, api: (root.RT_CONFIG || {}).API || '' };
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
  function say(t) { try { speechSynthesis.cancel(); var u = new SpeechSynthesisUtterance(String(t).replace(/·/g, ',')); u.lang = 'en-GB'; u.rate = .88; var v = speechSynthesis.getVoices(); u.voice = v.filter(function (x) { return /^en-gb/i.test(x.lang); })[0] || v.filter(function (x) { return /^en/i.test(x.lang); })[0] || null; speechSynthesis.speak(u); } catch (e) {} }

  /* ---------- render ---------- */
  var cur = { key: '', filter: 'all', unit: '', q: '', limit: 48, data: null, S: null };
  function treeUrl(name, c, extra) { return BASE + '?name=' + encodeURIComponent(name) + '&cls=' + encodeURIComponent(c) + (extra || ''); }
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
    panel.innerHTML = '<div class="vg-head"><div><span class="vg-kick">Cây từ vựng IELTS · ' + total + ' từ cho mọi kỹ năng</span><h3 class="vg-title">Vườn <em>từ vựng</em> của bạn</h3></div>' + chip + '</div>' +
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
  function refresh(panel, tab) {
    var name = pupil(), c = cls(), key = name + '|' + c;
    if (key !== cur.key) cur = { key: key, filter: 'all', unit: '', q: '', limit: 48, data: null, S: null };
    if (!name || !c) { render(panel, '', c); dot(tab, false); return; }
    words().then(function (data) {
      if (cur.key !== key) return;
      cur.data = data;
      var loc = norm(localState(name, c)); if (!cur.S || loc.t > cur.S.t) cur.S = loc;
      if (!panel.hidden) render(panel, name, c); dot(tab, needs(cur.S));
      remoteState(data.api, name, c).then(function (st) {
        if (cur.key !== key || !st) return; var r = norm(st);
        if (r.t > cur.S.t) { cur.S = r; if (!panel.hidden) render(panel, name, c); dot(tab, needs(r)); }
      });
    }).catch(function () { panel.innerHTML = '<p class="vg-empty">Chưa tải được Vườn từ vựng — em kiểm tra mạng rồi bấm lại tab này.</p>'; loaded = null; });
  }
  function needs(S) { var t = today(); return !S.days[t] && (!S.lw || S.lw + RHYTHM <= t); }
  function dot(tab, on) { var g = root.IeltsVocabGarden && root.IeltsVocabGarden.groupButton && root.IeltsVocabGarden.groupButton(); if (g && g !== tab) dot(g, on); var x = tab.querySelector('.vg-tab-dot'); if (on && !x) tab.insertAdjacentHTML('beforeend', '<span class="vg-tab-dot" aria-label="đến hạn tưới"></span>'); if (!on && x) x.remove(); }

  function install() {
    var nav = d.getElementById('class-tabs'), ref = d.getElementById('panel-overview') || d.querySelector('.panel');
    if (!nav || !ref || d.getElementById('panel-vocab') || !/^IELTS \d+$/.test(cls())) return;
    var st = d.createElement('style');
    st.textContent = css + '#class-tabs.grouped-navigation.vg-has{grid-template-columns:repeat(4,minmax(0,1fr))!important}#class-tabs [data-group="vocab"]{background:#ecfdf5;color:#047857}#class-tabs [data-group="vocab"].is-active{background:#047857;color:#fff}';
    d.head.appendChild(st);
    var tab = d.createElement('button'); tab.type = 'button'; tab.className = 'tab'; tab.setAttribute('data-vg-tab', '1'); tab.textContent = '🌳 Vườn từ vựng';
    var after = nav.querySelector('[data-tab="planner"]');
    if (after) after.parentNode.insertBefore(tab, after.nextSibling); else nav.appendChild(tab);
    // a wrapper keeps our panel out of "main > .panel" (the grouped layout rewrites those in place)
    var wrap = d.createElement('div'); wrap.className = 'vg-host';
    var panel = d.createElement('section'); panel.className = 'panel'; panel.id = 'panel-vocab'; panel.hidden = true; panel.setAttribute('aria-label', 'Vườn từ vựng');
    wrap.appendChild(panel); ref.parentNode.insertBefore(wrap, ref.nextSibling);
    var group = null;
    function open() {
      nav.querySelectorAll('.tab').forEach(function (b) { b.classList.toggle('is-active', b === tab); });
      nav.querySelectorAll('[data-group]').forEach(function (b) { var on = b === group; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
      var tools = nav.nextElementSibling; if (tools && /group-tools$/.test(tools.id || '')) tools.querySelectorAll('[data-tools]').forEach(function (x) { x.hidden = true; });
      d.querySelectorAll('.panel').forEach(function (p) { p.hidden = p !== panel; });
      var master = d.getElementById('panel-homework'); if (master) master.hidden = true;
      refresh(panel, tab); if (cur.data && cur.S) render(panel, pupil(), cls());
      try { panel.scrollIntoView({ block: 'nearest' }); } catch (e) {}
    }
    tab.addEventListener('click', open);
    // the IELTS pages group their tabs into 3 big buttons (📅 / 📚 / 🏆); ours becomes the 4th
    function placeGroup() {
      if (group || !nav.classList.contains('grouped-navigation') || !nav.querySelector('[data-group]')) return;
      group = d.createElement('button'); group.type = 'button'; group.setAttribute('data-group', 'vocab'); group.setAttribute('aria-pressed', 'false'); group.textContent = '🌳 Vườn từ vựng';
      var work = nav.querySelector('[data-group="work"]');   // Cô 14/11: ngay bên trái "📚 Bài tập 4 kỹ năng"
      if (work) nav.insertBefore(group, work); else nav.appendChild(group); nav.classList.add('vg-has'); group.addEventListener('click', open); dot(group, cur.S ? needs(cur.S) : false);
    }
    placeGroup();
    if (root.MutationObserver) new MutationObserver(placeGroup).observe(nav, { attributes: true, attributeFilter: ['class'], childList: true });
    // a native tab/group hides every .panel (ours too) and moves is-active; keep our buttons in step
    nav.addEventListener('click', function (e) { var b = e.target.closest && e.target.closest('.tab,[data-group]'); if (b && b !== tab && b !== group) { tab.classList.remove('is-active'); if (group) { group.classList.remove('is-active'); group.setAttribute('aria-pressed', 'false'); } } });
    var nameEl = d.getElementById('portal-student-name');
    function rf() { refresh(panel, tab); }
    if (nameEl && root.MutationObserver) new MutationObserver(rf).observe(nameEl, { childList: true, characterData: true, subtree: true });
    // the pupil may water in another tab: refresh when coming back
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'visible' && !panel.hidden) rf(); });
    root.IeltsVocabGarden = { open: open, groupButton: function () { return group; } };
    rf();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', install); else install();
})(window);
