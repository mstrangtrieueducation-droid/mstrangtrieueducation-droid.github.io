/* Ms Trang Trieu Education — IELTS result summary card with Cô giáo Titi.
   Presentation only: reads the score already rendered by the app (h2 "Listening: N/40")
   and the per-question review cards. It never changes answers, scores or submissions. */
(function () {
  'use strict';
  if (window.__ttResultRing) return; window.__ttResultRing = true;

  /* Filler check shared with the app's answered-counter, so filler answers keep the
     FINISH button locked exactly like empty ones. No answer key is needed here. */
  var FILL_WORDS = ['k biet', 'ko biet', 'kh biet', 'khong biet', 'kbiet', 'kb', 'chiu', 'bo qua', 'idk', 'dunno', 'no idea', 'skip', 'pass', 'asdf', 'qwerty', 'abcd', 'xyz', 'blank', 'null', 'undefined'];
  var ROMAN = /^(i{1,3}|iv|vi{0,3}|ix|xi{0,2})$/i;
  function flat(v) { return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function isFiller(v) {
    var t = String(v == null ? '' : v).trim();
    if (!t) return false;                                   // empty is handled by the app itself
    if (!/[\p{L}\p{N}]/u.test(t)) return true;             // ..., ???, ---
    if (ROMAN.test(t)) return false;
    var p = flat(t);
    if (FILL_WORDS.indexOf(p) >= 0) return true;            // k biết, idk, skip
    return /^(.)\1{2,}$/.test(p.replace(/ /g, ''));        // xxx, aaaa, 000
  }
  window.TTFiller = { isFiller: isFiller };

  var NAVY = '#0b1238', GOLD = '#f2b51c';
  var BANDS = {
    LISTENING: [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 0]],
    READING: [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 0]]
  };
  function band(mod, s) { var t = BANDS[mod]; for (var i = 0; i < t.length; i++) if (s >= t[i][0]) return t[i][1]; return 0; }
  function fmtBand(b) { return b ? (b % 1 ? b.toFixed(1) : b + '.0') : '—'; }

  var css = '' +
    '.tt-card{--tt-navy:' + NAVY + ';--tt-gold:' + GOLD + ';--tt-ok:#1f9d6b;--tt-bad:#e0533d;--tt-skip:#c9ced8;' +
    'display:grid;grid-template-columns:minmax(150px,210px) 1fr;margin:0 0 24px;border-radius:18px;overflow:hidden;' +
    'background:#fff;box-shadow:0 10px 30px -12px rgba(11,18,56,.35);border:1px solid #e3e6ee;font-family:inherit}' +
    '.tt-side{background:linear-gradient(160deg,#141c52 0%,var(--tt-navy) 70%);color:#fff;padding:18px 14px 0;display:flex;flex-direction:column;align-items:center;position:relative}' +
    '.tt-bubble{background:#fff;color:var(--tt-navy);font-weight:800;font-size:13px;line-height:1.35;padding:9px 12px;border-radius:14px;text-align:center;position:relative;max-width:190px}' +
    '.tt-bubble:after{content:"";position:absolute;left:50%;bottom:-7px;margin-left:-7px;border:7px solid transparent;border-bottom:0;border-top-color:#fff}' +
    '.tt-titi{width:auto;max-width:100%;height:230px;object-fit:contain;margin:8px 0 0;display:block;filter:drop-shadow(0 8px 10px rgba(0,0,0,.35));animation:tt-bob 2.6s ease-in-out infinite}' +
            '@keyframes tt-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}' +
    '.tt-name{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:var(--tt-gold);font-weight:800;margin:4px 0 12px}' +
    '.tt-main{padding:20px 22px;display:flex;flex-direction:column;gap:16px}' +
    '.tt-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}' +
    '.tt-title{font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#5f6877;margin:0}' +
    '.tt-band{font-size:13px;font-weight:800;color:var(--tt-navy);background:#fff6dc;border:1px solid #f4d983;border-radius:999px;padding:4px 12px}' +
    '.tt-band b{font-size:18px}' +
    '.tt-body{display:flex;align-items:center;gap:26px;flex-wrap:wrap}' +
    '.tt-ring{position:relative;width:170px;height:170px;flex:none}.tt-ring svg{width:100%;height:100%;transform:rotate(-90deg)}' +
    '.tt-ring circle{fill:none;stroke-width:14}.tt-seg{transition:stroke-dasharray 1s ease}' +
    '.tt-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:var(--tt-navy)}' +
    '.tt-center b{font-size:34px;font-weight:900;letter-spacing:-.04em;line-height:1}.tt-center span{font-size:13px;font-weight:700;color:#5f6877;margin-top:4px}' +
    '.tt-legend{list-style:none;margin:0;padding:0;display:grid;gap:12px;min-width:150px}' +
    '.tt-legend li{display:flex;align-items:center;gap:10px;font-size:14px;color:#3b4660}' +
    '.tt-legend i{width:12px;height:12px;border-radius:50%;flex:none}.tt-legend strong{margin-left:auto;color:var(--tt-navy);font-size:16px}' +
    '.tt-actions{display:flex;gap:10px;flex-wrap:wrap}' +
    '.tt-btn{appearance:none;border:0;cursor:pointer;font:inherit;font-weight:800;font-size:14px;border-radius:999px;padding:10px 18px;transition:transform .15s,box-shadow .15s}' +
    '.tt-btn:hover{transform:translateY(-1px)}.tt-btn:focus-visible{outline:3px solid var(--tt-gold);outline-offset:2px}' +
    '.tt-primary{background:var(--tt-gold);color:var(--tt-navy);box-shadow:0 6px 14px -6px rgba(242,181,28,.8)}' +
    '.tt-ghost{background:#eef1f8;color:var(--tt-navy)}.tt-ghost[aria-pressed="true"]{background:var(--tt-navy);color:#fff}' +
    '.tt-hide-ok{display:none!important}' +
    '.tt-src-btn{margin-left:10px;font:inherit;font-size:11px;font-weight:800;letter-spacing:.04em;text-transform:none;color:#0b1238;background:#fff6dc;border:1px solid #f4d983;border-radius:999px;padding:2px 10px;cursor:pointer}' +
    '.tt-src-btn:hover{background:#f2b51c}.tt-src-btn:focus-visible{outline:2px solid #0b1238;outline-offset:2px}' +
    '.tt-src{position:fixed;inset:0;z-index:10000;background:rgba(11,18,56,.55);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '.tt-src-box{background:#fff;border-radius:16px;max-width:720px;width:100%;max-height:80vh;overflow:auto;box-shadow:0 20px 50px -15px rgba(0,0,0,.5)}' +
    '.tt-src-head{position:sticky;top:0;display:flex;justify-content:space-between;align-items:center;gap:12px;background:#0b1238;color:#fff;padding:12px 16px;font-weight:800;font-size:14px}' +
    '.tt-src-x{background:none;border:0;color:#fff;font-size:24px;line-height:1;cursor:pointer;padding:0 4px}' +
    '.tt-src-p{margin:0;padding:18px 20px;font-size:16px;line-height:1.75;color:#24334d}' +
    '.tt-src-p mark{background:#ffe27a;color:inherit;border-radius:3px;padding:1px 2px;box-shadow:0 0 0 2px #ffe27a}' +
    '.tt-filler-input{outline:2px solid #e0533d!important;outline-offset:1px;background:#fff5f2!important}' +
    '.tt-filler-bar{position:fixed;left:50%;bottom:18px;transform:translateX(-50%);z-index:9999;max-width:min(560px,calc(100vw - 32px));display:flex;gap:12px;align-items:center;background:#0b1238;color:#fff;border:2px solid #f2b51c;border-radius:16px;padding:10px 14px 10px 10px;box-shadow:0 12px 30px -10px rgba(0,0,0,.5);font-size:14px;line-height:1.4;pointer-events:none}' +
    '.tt-filler-bar img{width:46px;height:64px;object-fit:contain;flex:none}.tt-filler-bar b{color:#f2b51c}' +
    '.tt-junk{margin-left:auto;font-size:11px;font-weight:800;color:#55607a;background:#eceff4;border:1px dashed #b7bfcd;border-radius:999px;padding:2px 9px;white-space:nowrap}' +
    '@media (max-width:640px){.tt-card{grid-template-columns:1fr}.tt-side{flex-direction:row;gap:10px;padding:14px 14px 0;align-items:center}' +
    '.tt-titi{height:150px;max-width:110px;margin:0;flex:none}.tt-name{display:none}.tt-bubble{flex:1;max-width:none;text-align:left}' +
    '.tt-bubble:after{left:-7px;top:50%;bottom:auto;margin:-7px 0 0;border:7px solid transparent;border-left:0;border-right-color:#fff}' +
    '.tt-main{padding:18px 16px}.tt-body{justify-content:center}.tt-ring{width:150px;height:150px}}' +
    '@media (prefers-reduced-motion:reduce){.tt-titi,.tt-seg{animation:none;transition:none}}';

  /* Cô giáo Titi — approved chibi (vanlang-on-thi-lop-6/game-kit/art/teacher-titi-v1), one pose per mood. */
  var TITI_BASE = '/ielts-full-test/assets/titi/';
  function titiSvg(mood) {
    return '<img class="tt-titi" src="' + TITI_BASE + 'titi-' + mood + '.webp" width="200" height="280" alt="Cô giáo Titi" decoding="async">';
  }

  function message(mod, b, correct) {
    var skill = mod === 'LISTENING' ? 'Listening' : 'Reading';
    if (b >= 8) return { mood: 'top', text: 'Xuất sắc! ' + skill + ' band ' + fmtBand(b) + ' — cô Titi tự hào lắm!' };
    if (b >= 7) return { mood: 'top', text: 'Tuyệt vời! Giữ phong độ này nhé, band 8 không xa đâu!' };
    if (b >= 6) return { mood: 'good', text: 'Làm tốt lắm! Xem lại câu sai để lên band tiếp nào.' };
    if (b >= 5) return { mood: 'good', text: 'Cố lên nhé! Mỗi câu sai là một bài học quý.' };
    if (correct > 0) return { mood: 'calm', text: 'Không sao đâu! Đọc kỹ giải thích, lần sau sẽ tiến bộ.' };
    return { mood: 'calm', text: 'Bắt đầu thôi! Cô Titi luôn ở đây cùng em.' };
  }

  /* "Điền cho có": the app refuses blank answers, so some pupils type filler to submit.
     Such answers are shown as Bỏ trống. A real answer that matches the key is never junk. */
  var FILLER = ['k biet', 'ko biet', 'kh biet', 'khong biet', 'kbiet', 'kb', 'chiu', 'bo', 'bo qua', 'idk', 'dunno', 'no idea', 'skip', 'pass', 'asdf', 'qwerty', 'abcd', 'xyz', 'blank', 'null', 'undefined'];
  var CHOICE_KEY = /^([A-J]|[ivx]{1,4}|TRUE|FALSE|NOT GIVEN|YES|NO)$/i;
  var CHOICE_ANS = /^([A-J]|i{1,3}|iv|vi{0,3}|ix|xi{0,2}|TRUE|FALSE|NOT GIVEN|NOTGIVEN|NG|T|F|YES|NO|Y|N)$/i;
  function plain(s) { return s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function isJunk(v, key) {
    var t = (v || '').trim();
    if (!t || t === '—') return true;
    if (key && plain(t) === plain(key)) return false;
    if (!/[\p{L}\p{N}]/u.test(t)) return true;              // ..., ???, ---, ***
    if (CHOICE_ANS.test(t)) return false;                     // A, iii, NG… are real attempts
    var p = plain(t);
    if (FILLER.indexOf(p) >= 0) return true;                  // k biết, idk, skip...
    if (/^(.)\1{2,}$/.test(p.replace(/ /g, ''))) return true; // xxx, aaaa, 0000
    if (CHOICE_KEY.test(key.trim()) && !CHOICE_ANS.test(t)) return true; // letter/TFNG question answered with nonsense
    return false;
  }

  function ring(c, w, s) {
    var R = 70, C = 2 * Math.PI * R, tot = Math.max(1, c + w + s);
    var segs = [[c, 'var(--tt-ok)'], [w, 'var(--tt-bad)'], [s, 'var(--tt-skip)']], off = 0, out = '';
    out += '<circle cx="85" cy="85" r="' + R + '" stroke="#eef0f4"/>';
    segs.forEach(function (x) {
      if (!x[0]) return; var len = C * x[0] / tot, gap = (c + w + s > x[0]) ? 2.5 : 0;
      out += '<circle class="tt-seg" cx="85" cy="85" r="' + R + '" stroke="' + x[1] + '" stroke-dasharray="' + Math.max(0, len - gap) + ' ' + C + '" stroke-dashoffset="' + (-off) + '"/>';
      off += len;
    });
    return '<svg viewBox="0 0 170 170" aria-hidden="true">' + out + '</svg>';
  }

  function build(section) {
    var mod = /listening/i.test(section.id) ? 'LISTENING' : 'READING';
    var h2 = section.querySelector('h2'); if (!h2) return;
    var m = h2.textContent.match(/(\d+)\s*\/\s*(\d+)/); if (!m) return;
    var correct = +m[1], total = +m[2];
    var arts = section.querySelectorAll('article[id^="review-"]');
    if (!arts.length) return;
    var skipped = 0;
    arts.forEach(function (a) {
      var st = a.querySelectorAll('p strong'); if (!st.length) return;
      var given = st[0].textContent.split(' / '), keys = st[1] ? st[1].textContent.split(' / ') : [];
      var junkHere = 0;
      given.forEach(function (v, i) { if (isJunk(v, keys[i] || keys[0] || '')) { skipped++; junkHere++; } });
      if (junkHere && !a.querySelector('.tt-junk')) {
        var tag = document.createElement('span'); tag.className = 'tt-junk';
        tag.textContent = 'Bỏ trống · điền cho có'; tag.title = 'Câu trả lời không có nội dung thật (ví dụ “...”, “???”, “xxx”), được tính là bỏ trống';
        (a.firstElementChild || a).appendChild(tag);
      }
    });
    var wrong = Math.max(0, total - correct - skipped);
    var b = band(mod, correct), msg = message(mod, b, correct);
    var firstBad = Array.prototype.find.call(arts, function (a) { return !/b8ddd7/.test(a.className); });

    var card = document.createElement('div');
    card.className = 'tt-card'; card.setAttribute('data-tt', mod);
    card.innerHTML =
      '<div class="tt-side"><div class="tt-bubble">' + msg.text + '</div>' + titiSvg(msg.mood) + '<div class="tt-name">Cô giáo Titi</div></div>' +
      '<div class="tt-main"><div class="tt-head"><p class="tt-title">Kết quả ' + (mod === 'LISTENING' ? 'Listening' : 'Reading') + '</p>' +
      '<span class="tt-band" title="Ước tính theo bảng quy đổi Cambridge IELTS Academic">Band ước tính <b>' + fmtBand(b) + '</b></span></div>' +
      '<div class="tt-body"><div class="tt-ring" role="img" aria-label="' + correct + ' trên ' + total + ' câu đúng, ' + wrong + ' sai, ' + skipped + ' bỏ trống">' + ring(correct, wrong, skipped) +
      '<div class="tt-center"><b>' + correct + '/' + total + '</b><span>câu đúng</span></div></div>' +
      '<ul class="tt-legend"><li><i style="background:var(--tt-ok)"></i>Đúng<strong>' + correct + ' câu</strong></li>' +
      '<li><i style="background:var(--tt-bad)"></i>Sai<strong>' + wrong + ' câu</strong></li>' +
      '<li><i style="background:var(--tt-skip)"></i>Bỏ trống<strong>' + skipped + ' câu</strong></li></ul></div>' +
      '<div class="tt-actions">' + (firstBad ? '<button type="button" class="tt-btn tt-primary" data-act="explain">Xem giải thích câu sai</button>' : '') +
      (firstBad ? '<button type="button" class="tt-btn tt-ghost" data-act="filter" aria-pressed="false">Chỉ hiện câu sai</button>' : '') + '</div></div>';

    card.addEventListener('click', function (e) {
      var btn = e.target.closest('button[data-act]'); if (!btn) return;
      if (btn.dataset.act === 'explain' && firstBad) { firstBad.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstBad.focus && firstBad.setAttribute('tabindex', '-1'); firstBad.focus({ preventScroll: true }); }
      if (btn.dataset.act === 'filter') {
        var on = btn.getAttribute('aria-pressed') !== 'true'; btn.setAttribute('aria-pressed', String(on));
        btn.textContent = on ? 'Hiện tất cả câu' : 'Chỉ hiện câu sai';
        arts.forEach(function (a) { if (/b8ddd7/.test(a.className)) a.classList.toggle('tt-hide-ok', on); });
      }
    });
    section.insertBefore(card, section.firstChild);
  }

  /* "Xem trong bài": open the source paragraph with the evidence sentence highlighted. */
  var PUBLIC = { 1: 'test-1-public-j3IvMzPX.js', 2: 'test-2-public-BxANiPA9.js', 3: 'test-3-public-5eV7v7pt.js', 4: 'test-4-public-DQoKmM5Q.js', 5: 'test-5-public-YOnZws0X.js', 6: 'test-6-public-KL1pryyw.js', 7: 'test-7-public-0kXWAnJX.js', 8: 'test-8-public-BIxVCDPK.js', 9: 'test-9-public-fxtf_LMC.js', 10: 'test-10-public-CxC_wCW0.js', 11: 'test-11-public-C6n3j6W3.js', 12: 'test-12-public-BPJCFRWh.js', 13: 'test-13-public-DzcXoLdX.js', 14: 'test-14-public-DbSCj40e.js', 15: 'test-15-public-CBbUuylK.js', 16: 'test-16-public-DiWV9DMC.js' };
  var passageCache = {};
  function testNumber() { var m = (document.title + ' ' + (document.querySelector('header') || document.body).textContent).match(/Full Test\s*0?(\d{1,2})/i); return m ? +m[1] : 0; }
  function loadPassages(n) {
    if (!passageCache[n]) passageCache[n] = import('/ielts-full-test/assets/' + PUBLIC[n]).then(function (m) { return (m.default || m).reading.passages; });
    return passageCache[n];
  }
  // normalise while keeping a map back to the original string, so we can highlight the real text
  function normMap(s) {
    var out = '', map = [], prevSpace = true;
    for (var i = 0; i < s.length; i++) {
      var c = s[i].toLowerCase().replace(/[’‘`´]/, "'");
      if (/[a-z0-9'%£$À-ɏ]/.test(c)) { out += c; map.push(i); prevSpace = false; }
      else if (!prevSpace) { out += ' '; map.push(i); prevSpace = true; }
    }
    return { s: out, map: map };
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function findEvidence(passages, evidence) {
    var pieces = evidence.split(/\s*(?:\.\.\.|…)\s*/).map(function (p) { return normMap(p).s.trim(); }).filter(function (p) { return p.length > 3; });
    if (!pieces.length) return null;
    for (var pi = 0; pi < passages.length; pi++) {
      var paras = passages[pi].paragraphs || [];
      for (var k = 0; k < paras.length; k++) {
        var text = paras[k].text || '', nm = normMap(text), ranges = [];
        for (var j = 0; j < pieces.length; j++) {
          var at = nm.s.indexOf(pieces[j]); if (at < 0) { ranges = null; break; }
          ranges.push([nm.map[at], nm.map[at + pieces[j].length - 1] + 1]);
        }
        if (ranges) return { passage: passages[pi], index: pi, para: paras[k], text: text, ranges: ranges };
      }
    }
    return null;
  }
  function showSource(hit) {
    var html = '', last = 0;
    hit.ranges.sort(function (a, b) { return a[0] - b[0]; }).forEach(function (r) { html += esc(hit.text.slice(last, r[0])) + '<mark>' + esc(hit.text.slice(r[0], r[1])) + '</mark>'; last = r[1]; });
    html += esc(hit.text.slice(last));
    var wrap = document.createElement('div'); wrap.className = 'tt-src';
    wrap.innerHTML = '<div class="tt-src-box" role="dialog" aria-modal="true" aria-label="Đoạn văn chứa dẫn chứng">' +
      '<div class="tt-src-head"><span>Passage ' + (hit.index + 1) + (hit.passage.title ? ' · ' + esc(hit.passage.title) : '') + (hit.para.label ? ' · đoạn ' + esc(hit.para.label) : '') + '</span>' +
      '<button type="button" class="tt-src-x" aria-label="Đóng">×</button></div><p class="tt-src-p">' + html + '</p></div>';
    function close() { wrap.remove(); document.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    wrap.addEventListener('click', function (e) { if (e.target === wrap || e.target.closest('.tt-src-x')) close(); });
    document.addEventListener('keydown', onKey);
    document.body.appendChild(wrap);
    var mk = wrap.querySelector('mark'); if (mk) mk.scrollIntoView({ block: 'center' });
    wrap.querySelector('.tt-src-x').focus();
  }
  function addSourceButtons(section) {
    var n = testNumber(); if (!PUBLIC[n]) return;
    section.querySelectorAll('article[id^="review-reading-"] p').forEach(function (label) {
      if (!/^Dẫn chứng/.test(label.textContent) || label.dataset.ttSrc) return;
      var ev = label.nextElementSibling; if (!ev || !ev.textContent.trim()) return;
      label.dataset.ttSrc = '1';
      var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'tt-src-btn'; btn.textContent = 'Xem trong bài';
      btn.addEventListener('click', function () {
        btn.disabled = true;
        loadPassages(n).then(function (ps) {
          var hit = findEvidence(ps, ev.textContent);
          if (hit) showSource(hit); else { btn.textContent = 'Không tìm thấy trong bài'; }
        }).catch(function () { btn.textContent = 'Chưa mở được bài đọc'; }).then(function () { btn.disabled = false; });
      });
      label.appendChild(btn);
    });
  }

  function scan() {
    document.querySelectorAll('section[id^="review-listening"],section[id^="review-reading"]').forEach(function (s) {
      if (!s.querySelector(':scope > .tt-card')) build(s);
      if (/reading/.test(s.id)) addSourceButtons(s);
    });
  }
  function start() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    scan(); new MutationObserver(scan).observe(document.body, { childList: true, subtree: true });
    var bar = null;
    function checkInputs() {
      var bad = [];
      document.querySelectorAll('input[aria-label^="Question "],textarea[aria-label^="Question "]').forEach(function (el) {
        var f = isFiller(el.value); el.classList.toggle('tt-filler-input', f);
        if (f) { el.title = 'Câu trả lời này chưa có nội dung thật nên chưa được tính là đã làm.'; bad.push(el.getAttribute('aria-label').replace('Question ', '')); }
        else if (el.title) el.removeAttribute('title');
      });
      if (!bad.length) { if (bar) { bar.remove(); bar = null; } return; }
      if (!bar) { bar = document.createElement('div'); bar.className = 'tt-filler-bar'; bar.setAttribute('role', 'status'); document.body.appendChild(bar); }
      bar.innerHTML = '<img src="' + TITI_BASE + 'titi-calm.webp" alt="">' +
        '<span>Câu <b>' + bad.join(', ') + '</b> đang điền cho có (như “...”, “???”, “xxx”). Em hãy trả lời thật thì mới nộp bài được nhé!</span>';
    }
    document.addEventListener('input', checkInputs, true);
    document.addEventListener('change', checkInputs, true);
    setInterval(checkInputs, 1500);

  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
