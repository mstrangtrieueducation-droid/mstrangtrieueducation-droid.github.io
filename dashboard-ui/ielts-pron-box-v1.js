/* IELTS_PRON_BOX_V1 (Cô 14/11/2026: "ok làm phát âm"). Presentation only.
   A "🎙 Luyện phát âm" card on the IELTS homework view (panel-homework, after the counters): the pupil's lesson this week
   (PRON-001…050, one per week, self-paced: the next lesson after the last one that reached ĐẠT, or the one still to redo),
   its link, and what the pronunciation grader returned (submitted / score / ĐẠT) — read from the grader's own Apps Script
   (action=pa, by name + class). Native PRON self-study cards (if the Schedule releases them) get the grader's status in their
   badge text (Cô cho phép ghi đè trạng thái thẻ PRON). Never changes native counts, receipts, marks or comments. */
(function (root) {
  'use strict';
  if (root.IeltsPronBox) return;
  root.IeltsPronBox = {};
  var d = root.document;
  var API = 'https://script.google.com/macros/s/AKfycbzbIthv3oCEXfF93pXF6k4xzhU-9r7uQvrJyRBRIum6vV2iUXQsh7PYILyzt7Y0PaztIg/exec';
  var PAGE = '/vocabulary-reading-web/bd0dce6f2a3925450d119b2133aea9db/';
  var CLASSES = ['IELTS 45', 'IELTS 46', 'IELTS 47', 'IELTS 48', 'IELTS 49', 'IELTS 50', 'IELTS 51', 'IELTS 52'];
  var PASS = 80;
  var L = [["Âm cuối /t/","Hometown","Quê hương"],["Âm cuối /d/","Home","Nhà ở"],["Âm cuối /k/","Study","Việc học"],["Âm cuối /p/","Work","Công việc"],["Đuôi -s / -es: /s/ · /z/ · /ɪz/","Family","Gia đình"],["Đuôi -ed: /t/ · /d/ · /ɪd/","Friends","Bạn bè"],["Âm cuối /l/","Daily routine","Thói quen hằng ngày"],["Âm cuối /n/ và /ŋ/","Weekends","Cuối tuần"],["Âm /θ/ (th vô thanh)","Food","Đồ ăn"],["Âm /ð/ (th hữu thanh)","Shopping","Mua sắm"],["Âm /ʃ/ và /s/","Clothes","Quần áo"],["Âm /tʃ/ và /dʒ/","Weather","Thời tiết"],["Âm /z/","Sports","Thể thao"],["Âm /v/ và /w/","Music","Âm nhạc"],["Âm /r/ và /l/","Films","Phim ảnh"],["Âm đầu /p/ và /b/","Reading","Đọc sách"],["Cụm phụ âm đầu (tr, dr, st, sp, pl, br…)","Transport","Giao thông"],["Cụm phụ âm cuối (-st, -kt, -ks, -ndz, -nθs…)","Technology","Công nghệ"],["/ɪ/ ngắn và /iː/ dài","Hobbies","Sở thích"],["/æ/ và /e/","Pets","Thú cưng"],["/ʌ/ và /ɑː/","Colours","Màu sắc"],["/ʊ/ ngắn và /uː/ dài","Photos","Ảnh"],["/ɒ/ ngắn và /ɔː/ dài","Art","Nghệ thuật"],["Âm /ə/ (schwa)","Museums","Bảo tàng"],["Nguyên âm đôi /eɪ/ · /aɪ/ · /ɔɪ/","Gifts","Quà tặng"],["Nguyên âm đôi /əʊ/ · /aʊ/","Birthdays","Sinh nhật"],["Danh từ, tính từ 2 âm tiết: nhấn âm đầu","Neighbours","Hàng xóm"],["Động từ 2 âm tiết: nhấn âm thứ hai","Travel","Du lịch"],["Từ có đuôi -tion / -sion: nhấn ngay trước đuôi","Holidays","Kì nghỉ"],["Đuôi -ic: nhấn ngay trước · đuôi -ity: nhấn âm thứ ba từ cuối","Languages","Ngôn ngữ"],["Hậu tố không đổi trọng âm: -er, -or, -ly, -ful, -ness, -ment","Teachers","Thầy cô"],["Từ 3–4 âm tiết: thường nhấn âm thứ ba từ cuối","Maths","Môn Toán"],["Danh từ ghép: nhấn từ đầu","Science","Khoa học"],["Cùng một từ: danh từ nhấn âm đầu, động từ nhấn âm sau","Internet","Internet"],["Trọng âm câu: nhấn từ mang nghĩa","Sleep","Giấc ngủ"],["Dạng yếu (1): a, the, of, to, for, and, at","Health","Sức khoẻ"],["Dạng yếu (2): can, was, were, do, have, them","Cooking","Nấu ăn"],["Nối âm: phụ âm cuối + nguyên âm đầu","Housework","Việc nhà"],["Nối âm: nguyên âm + nguyên âm (/j/, /w/, /r/)","Plants","Cây cối"],["Nuốt âm /t/, /d/ giữa hai phụ âm","Noise","Tiếng ồn"],["Dạng rút gọn: I'm, I've, I'd, I'll, it's, there's","Patience","Sự kiên nhẫn"],["Rút gọn phủ định: can't, don't, doesn't, isn't, won't","Being on time","Đúng giờ"],["Xuống giọng ở cuối câu trả lời","Social media","Mạng xã hội"],["Lên giọng khi chưa hết ý, xuống giọng khi kết thúc","Advertisements","Quảng cáo"],["Ngữ điệu khi liệt kê và khi lựa chọn","Money","Tiền bạc"],["Ngắt câu theo cụm ý (chunking)","Environment","Môi trường"],["Nhấn mạnh để so sánh, đối lập","Future plans","Dự định tương lai"],["Nói có cảm xúc: mở rộng cao độ, kết hợp lên – xuống – ngắt","Happiness","Hạnh phúc"],["Ôn tập 1: âm cuối, phụ âm khó, nguyên âm (tuần 1–26)","About you","Về bản thân em"],["Ôn tập 2: trọng âm, nối âm, ngữ điệu (tuần 27–48)","Looking ahead","Hướng tới tương lai"]];   // [âm luyện, chủ đề Part 1, chủ đề tiếng Việt] cho tuần 1…50 (từ data.js của trang Luyện phát âm)
  var code = function (w) { return 'PRON-' + ('00' + w).slice(-3); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  function cls() { var n = d.getElementById('class-tabs'); var m = /IELTS\s+\d+/.exec((n && n.getAttribute('aria-label') || '') + ' ' + d.title); return m ? m[0].toUpperCase().replace(/\s+/, ' ') : ''; }
  function pupil() {
    var bar = d.getElementById('portal-student-bar'), el = d.getElementById('portal-student-name');
    if (!bar || bar.hidden || !el) return '';
    var t = (el.textContent || '').split('·')[0].replace(/\s+/g, ' ').trim();
    return t.length >= 5 && t !== '—' ? t : '';
  }
  var css = '.pb-card{margin:14px 0 18px;background:linear-gradient(135deg,#fff7ed 0,#fff 46%,#eef2ff 100%);border:1px solid #fde4c4;border-radius:18px;padding:16px 18px;display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;color:#1e1b4b}' +
    '.pb-ic{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;font-size:26px;background:linear-gradient(160deg,#fb923c,#ea580c);box-shadow:0 8px 18px rgba(234,88,12,.25),inset 0 2px 0 rgba(255,255,255,.35)}' +
    '.pb-k{display:block;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#c2410c}.pb-t{display:block;margin:3px 0 2px;font-size:17px;font-weight:800;line-height:1.3}.pb-s{display:block;font-size:13px;color:#475569}' +
    '.pb-chips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.pb-chip{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:700;background:#f1f5f9;color:#334155}' +
    '.pb-ok{background:#dcfce7;color:#166534}.pb-wait{background:#fef3c7;color:#92400e}.pb-bad{background:#fee2e2;color:#b91c1c}.pb-new{background:#e0e7ff;color:#3730a3}' +
    '.pb-go{display:inline-flex;align-items:center;gap:6px;border-radius:14px;padding:11px 16px;font-weight:800;font-size:14.5px;color:#fff;text-decoration:none;white-space:nowrap;background:linear-gradient(135deg,#f97316,#c2410c);box-shadow:0 8px 18px rgba(194,65,12,.25)}.pb-go:hover{filter:brightness(1.05)}' +
    '.pb-bar{height:6px;border-radius:9px;background:#fde4c4;overflow:hidden;margin-top:8px;max-width:320px}.pb-bar i{display:block;height:100%;background:linear-gradient(90deg,#fb923c,#16a34a);border-radius:9px}' +
    '.pb-badge{font-weight:700}' +
    '@media(max-width:640px){.pb-card{grid-template-columns:auto 1fr;padding:14px}.pb-go{grid-column:1/-1;justify-content:center}}';

  var cache = { key: '', R: null, at: 0 };
  function results(name, c) {
    var key = name + '|' + c;
    if (cache.key === key && cache.R && Date.now() - cache.at < 120e3) return Promise.resolve(cache.R);
    return fetch(API + '?action=pa&name=' + encodeURIComponent(name) + '&cls=' + encodeURIComponent(c) + '&t=' + Date.now())
      .then(function (r) { return r.json(); }).then(function (j) { var R = j && j.ok ? j.results || [] : []; if (j && j.pass) PASS = +j.pass || PASS; cache = { key: key, R: R, at: Date.now() }; return R; })
      .catch(function () { return cache.key === key && cache.R ? cache.R : null; });
  }
  function byCode(R) {   // mỗi bài: lần nộp tốt nhất (đã chấm) + có lượt đang chờ chấm hay không
    var m = {};
    (R || []).forEach(function (r) {
      var x = m[r.code] = m[r.code] || { best: null, pending: false, n: 0, invalid: false };
      x.n++;
      if (r.status === 'Đã chấm' && r.score != null) { if (x.best === null || r.score > x.best) { x.best = r.score; x.invalid = !!(r.fb && r.fb.invalid); } }
      else if (/Chờ chấm|Đang chấm|thử lại/i.test(r.status || '')) x.pending = true;
    });
    return m;
  }
  function state(x) {
    if (!x) return { t: 'Chưa nộp', c: 'pb-new', icon: '📝' };
    if (x.best !== null && x.best >= PASS) return { t: 'ĐẠT · ' + x.best + ' điểm', c: 'pb-ok', icon: '✅' };
    if (x.pending) return { t: 'Đã nộp · đang chấm', c: 'pb-wait', icon: '⏳' };
    if (x.best !== null) return { t: 'Chưa đạt · ' + x.best + '/100 — luyện lại & nộp lại', c: 'pb-bad', icon: '🔁' };
    return { t: 'Đã nộp · chờ chấm', c: 'pb-wait', icon: '⏳' };
  }
  function current(m) {   // bài tuần này: bài đang dở (đã nộp, chưa đạt) sớm nhất; nếu không có thì bài kế tiếp sau bài đạt cao nhất
    var hi = 0, w;
    for (w = 1; w <= L.length; w++) { var x = m[code(w)]; if (x && x.best !== null && x.best >= PASS) hi = w; }
    for (w = 1; w <= hi; w++) { var y = m[code(w)]; if (y && !(y.best !== null && y.best >= PASS)) return w; }
    return Math.min(L.length, hi + 1);
  }
  function link(w, name, c) { return PAGE + '?w=' + w + '&name=' + encodeURIComponent(name) + '&cls=' + encodeURIComponent(c); }
  function card(name, c, R) {
    var m = byCode(R), w = current(m), t = L[w - 1] || ['', '', ''], s = state(m[code(w)]);
    var passed = 0; Object.keys(m).forEach(function (k) { if (m[k].best !== null && m[k].best >= PASS) passed++; });
    var recent = Object.keys(m).sort().reverse().filter(function (k) { return k !== code(w); }).slice(0, 3).map(function (k) {
      var z = state(m[k]); return '<span class="pb-chip ' + z.c + '" title="' + esc(k) + '">' + z.icon + ' ' + esc(k.replace('PRON-', 'Tuần ').replace(/ 0+/, ' ')) + ' · ' + esc(z.t.split(' — ')[0]) + '</span>';
    }).join('');
    return '<span class="pb-ic" aria-hidden="true">🎙</span><div><span class="pb-k">Luyện phát âm · Tuần ' + w + '/' + L.length + ' · ' + code(w) + '</span>' +
      '<span class="pb-t">' + esc(t[0]) + ' · Part 1: ' + esc(t[1]) + '</span><span class="pb-s">' + esc(t[2]) + ' · 10–15 phút: nghe mẫu, thu giọng so sánh, quay màn hình đọc và nộp. Cần từ ' + PASS + ' điểm.</span>' +
      '<div class="pb-chips"><span class="pb-chip ' + s.c + '">' + s.icon + ' ' + esc(s.t) + '</span>' + recent + '</div>' +
      '<div class="pb-bar" title="Đã đạt ' + passed + '/' + L.length + ' tuần"><i style="width:' + Math.round(passed / L.length * 100) + '%"></i></div></div>' +
      '<a class="pb-go" href="' + esc(link(w, name, c)) + '" target="_blank" rel="noopener">🎙 ' + (m[code(w)] && !(m[code(w)].best >= PASS) && !m[code(w)].pending ? 'Luyện lại tuần ' + w : 'Mở bài tuần ' + w) + '</a>';
  }
  function badges(R) {   // thẻ bài PRON của dashboard (nếu Schedule giao): trạng thái theo máy chấm phát âm
    var m = byCode(R);
    d.querySelectorAll('#panel-homework article.master-card, #panel-speaking article').forEach(function (a) {
      var k = /PRON-\d{3}/.exec(a.textContent || ''); if (!k) return;
      var s = state(m[k[0]]), b = a.querySelector('.master-result span, [class*="badge"]');
      if (b && b.getAttribute('data-pb') !== s.t) { b.textContent = s.icon + ' ' + s.t; b.setAttribute('data-pb', s.t); b.classList.add('pb-badge'); }
    });
  }

  var busy = false;
  function paint() {
    var name = pupil(), c = cls(), host = d.getElementById('panel-homework');
    var box = d.getElementById('pb-card');
    if (!name || CLASSES.indexOf(c) < 0 || !host) { if (box) box.remove(); return; }
    if (busy) return; busy = true;
    results(name, c).then(function (R) {
      busy = false; if (pupil() !== name) return paint();
      var status = host.querySelector('.master-status'), anchor = status || host.querySelector('.master-heading');
      if (!anchor) return;
      box = d.getElementById('pb-card');
      if (!box) { box = d.createElement('section'); box.id = 'pb-card'; box.className = 'pb-card'; box.setAttribute('aria-label', 'Luyện phát âm'); }
      var html = card(name, c, R || []);
      if (box.getAttribute('data-h') !== html) { box.innerHTML = html; box.setAttribute('data-h', html); }
      if (box.previousElementSibling !== anchor) anchor.parentNode.insertBefore(box, anchor.nextSibling);
      if (R) badges(R);
    });
  }
  function install() {
    if (CLASSES.indexOf(cls()) < 0) return;
    var st = d.createElement('style'); st.textContent = css; d.head.appendChild(st);
    var t = 0, kick = function () { clearTimeout(t); t = setTimeout(paint, 300); };
    if (root.MutationObserver) new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) { var n = list[i].target; if (n.id === 'pb-card' || (n.closest && n.closest('#pb-card'))) continue; kick(); return; }
    }).observe(d.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'visible') { cache.at = 0; kick(); } });   // nộp bài ở tab khác rồi quay lại
    root.IeltsPronBox = { refresh: function () { cache.at = 0; paint(); } };
    paint();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', install); else install();
})(window);
