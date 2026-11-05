/* Ms Trang Trieu Education — IELTS NGHE: Cô giáo Titi result card + per-question review.
   Presentation only. It reads the page's own grading (gradeAllResponses, DATA, state/answers)
   after the score is shown, and never changes answers, scores, receipts or submissions. */
(function () {
  'use strict';
  if (window.__ttNghe) return; window.__ttNghe = true;
  var TITI = '/ielts-full-test/assets/titi/';
  var BAND = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [0, 0]];
  function band(s) { for (var i = 0; i < BAND.length; i++) if (s >= BAND[i][0]) return BAND[i][1]; return 0; }
  function fb(b) { return b % 1 ? b.toFixed(1) : b + '.0'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function N(v) { try { return typeof norm === 'function' ? norm(v) : String(v || '').trim().toLowerCase(); } catch (e) { return String(v || '').trim().toLowerCase(); } }
  function has(name) { try { return typeof eval(name) !== 'undefined'; } catch (e) { return false; } }

  var css = '' +
    '.tt-card{display:grid;grid-template-columns:minmax(140px,190px) 1fr;margin:0 0 18px;border-radius:18px;overflow:hidden;background:#fff;box-shadow:0 10px 30px -12px rgba(7,21,53,.35);border:1px solid #e3e6ee;text-align:left}' +
    '.tt-side{background:linear-gradient(160deg,#142d67,#071535 70%);color:#fff;padding:16px 12px 0;display:flex;flex-direction:column;align-items:center}' +
    '.tt-bubble{background:#fff;color:#071535;font-weight:800;font-size:13px;line-height:1.35;padding:9px 12px;border-radius:14px;text-align:center;position:relative}' +
    '.tt-bubble:after{content:"";position:absolute;left:50%;bottom:-7px;margin-left:-7px;border:7px solid transparent;border-bottom:0;border-top-color:#fff}' +
    '.tt-titi{height:210px;width:auto;max-width:100%;object-fit:contain;margin-top:8px;filter:drop-shadow(0 8px 10px rgba(0,0,0,.35))}' +
    '.tt-name{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#ffc83d;font-weight:900;margin:4px 0 12px}' +
    '.tt-main{padding:18px 20px;display:flex;flex-direction:column;gap:14px}' +
    '.tt-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}' +
    '.tt-title{font-size:13px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#667087;margin:0}' +
    '.tt-band{font-size:13px;font-weight:800;color:#071535;background:#fff6dc;border:1px solid #f4d983;border-radius:999px;padding:4px 12px}.tt-band b{font-size:18px}' +
    '.tt-body{display:flex;align-items:center;gap:24px;flex-wrap:wrap}' +
    '.tt-ring{position:relative;width:150px;height:150px;flex:none}.tt-ring svg{width:100%;height:100%;transform:rotate(-90deg)}.tt-ring circle{fill:none;stroke-width:14}' +
    '.tt-center{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;color:#071535}.tt-center b{font-size:30px;font-weight:900;line-height:1}.tt-center span{font-size:12px;font-weight:700;color:#667087;margin-top:4px}' +
    '.tt-legend{list-style:none;margin:0;padding:0;display:grid;gap:10px;min-width:160px}.tt-legend li{display:flex;align-items:center;gap:10px;font-size:14px;color:#3b4660}.tt-legend i{width:12px;height:12px;border-radius:50%}.tt-legend strong{margin-left:auto;color:#071535}' +
    '.tt-actions{display:flex;gap:10px;flex-wrap:wrap}.tt-btn{appearance:none;border:0;cursor:pointer;font:inherit;font-weight:800;font-size:14px;border-radius:999px;padding:10px 18px}' +
    '.tt-primary{background:#ffc83d;color:#071535}.tt-ghost{background:#eef1f8;color:#071535}.tt-ghost[aria-pressed="true"]{background:#071535;color:#fff}' +
    '.tt-review{margin:16px 0;display:grid;gap:10px;text-align:left}.tt-review h3{margin:6px 0 2px;color:#071535}' +
    '.tt-q{border:1px solid #d6dbe7;border-radius:12px;padding:12px 14px;background:#fff;font-size:14px;line-height:1.6}' +
    '.tt-q.bad{border-color:#f0c2b8;background:#fff7f4}.tt-q.skip{border-color:#d6dbe7;background:#f6f7fa}' +
    '.tt-q .tt-qh{display:flex;gap:8px;align-items:center;font-weight:900;color:#071535}.tt-q .tt-tag{font-size:11px;border-radius:999px;padding:1px 9px;font-weight:800}' +
    '.tt-ok-t{background:#dff5ea;color:#16754d}.tt-bad-t{background:#ffe3dc;color:#b23a22}.tt-skip-t{background:#eceff4;color:#55607a}' +
    '.tt-q .tt-ans{margin:4px 0 6px;color:#3b4660}.tt-q .tt-ev{border-left:3px solid #142d67;padding-left:10px;color:#24334d;margin:6px 0}.tt-q .tt-trap{border-left:3px solid #d29b2f;padding-left:10px;color:#5d4a20;margin-top:6px}' +
    '.tt-hide{display:none!important}' +
    '@media (max-width:640px){.tt-card{grid-template-columns:1fr}.tt-side{flex-direction:row;gap:10px;padding:12px 12px 0;align-items:center}.tt-titi{height:140px}.tt-name{display:none}.tt-bubble{flex:1;text-align:left}.tt-bubble:after{display:none}}';

  function ring(c, w, s) {
    var R = 60, C = 2 * Math.PI * R, tot = Math.max(1, c + w + s), off = 0, out = '<circle cx="75" cy="75" r="' + R + '" stroke="#eef0f4"/>';
    [[c, '#1f9d6b'], [w, '#e0533d'], [s, '#c9ced8']].forEach(function (x) { if (!x[0]) return; var len = C * x[0] / tot, gap = tot > x[0] ? 2.5 : 0; out += '<circle cx="75" cy="75" r="' + R + '" stroke="' + x[1] + '" stroke-dasharray="' + Math.max(0, len - gap) + ' ' + C + '" stroke-dashoffset="' + (-off) + '"/>'; off += len; });
    return '<svg viewBox="0 0 150 150" aria-hidden="true">' + out + '</svg>';
  }
  function mood(p) { return p >= 0.8 ? ['top', 'Xuất sắc! Em nghe rất chắc tay — cô Titi tự hào lắm!'] : p >= 0.6 ? ['good', 'Làm tốt lắm! Xem lại câu sai để lên band tiếp nào.'] : p >= 0.4 ? ['good', 'Cố lên nhé! Nghe lại đoạn có đáp án, em sẽ tiến bộ nhanh.'] : ['calm', 'Không sao đâu! Đọc kỹ dẫn chứng rồi nghe lại, lần sau sẽ khác.']; }

  // --- read the page's own data -------------------------------------------------
  function engine() { return has('DATA') && DATA && DATA.answers ? 'A' : 'B'; }
  function rows() {
    var out = [], E = engine();
    DATA.sections.forEach(function (s, idx) {
      if (E === 'A') {
        var r = range(idx), groups = {}, gm = questionGroupsFor(idx) || [];
        gm.forEach(function (nums, key) { var g = [key, nums]; nums.forEach(function (n) { groups[n] = g; }); });
        for (var n = r[0]; n <= r[1]; n++) {
          var key = DATA.answers[n] || [], g = groups[n];
          if (g) {
            var chosen = (state.q[g[0]] || []).map(String), pos = g[1].indexOf(n), valid = g[1].map(function (m) { return (DATA.answers[m] || [])[0]; });
            var mine = chosen[pos] || '';
            out.push({ n: n, mine: mine, key: valid.join(' / '), group: true, ok: !!mine && valid.map(N).indexOf(N(mine)) >= 0 && chosen.map(N).indexOf(N(mine)) === pos });
          } else {
            var v = state.q[n]; out.push({ n: n, mine: v == null ? '' : String(v), key: key.join(' / '), ok: key.map(N).indexOf(N(v)) >= 0 });
          }
        }
      } else {
        var base = (s.number - 1) * 10, gmap = {};
        (s.groups || []).forEach(function (g) { if (!g.selectCount) return; var items = groupQuestions(s, g); items.forEach(function (it, j) { gmap[it.number] = { g: g, items: items, j: j }; }); });
        s.questions.forEach(function (q) {
          var acc = s.ieltsAnswers[q.number - base - 1] || '';
          var accList = (typeof variants === 'function' ? variants(acc) : String(acc).split('|'));
          var gi = gmap[q.number];
          if (gi && gi.items[0] && gi.items[0].options) {
            var sel = (answers['group:' + (gi.g.key || gi.items[0].number)] || []).map(String), m2 = sel[gi.j] || '';
            var validAll = gi.items.map(function (it) { return s.ieltsAnswers[it.number - base - 1]; }).join('|');
            out.push({ n: q.number, mine: m2, key: (typeof variants === 'function' ? variants(validAll) : [validAll]).join(' / '), group: true, ok: !!m2 && (typeof variants === 'function' ? variants(validAll) : []).map(N).indexOf(N(m2)) >= 0 });
          } else {
            var mv = answers['q' + q.number];
            out.push({ n: q.number, mine: mv == null ? '' : String(mv), key: accList.join(' / '), ok: typeof correct === 'function' ? correct(mv, acc) : accList.map(N).indexOf(N(mv)) >= 0 });
          }
        });
      }
    });
    return out;
  }
  function scores() {
    var g = gradeAllResponses(), sc = g && g.scores ? g.scores : g, ielts = 0, dict = 0, dmax = 0;
    Object.keys(sc).forEach(function (k) { if (k[0] === 'i') ielts += +sc[k] || 0; if (k[0] === 'd') { dict += +sc[k] || 0; dmax += 20; } });
    return { ielts: ielts, dict: dict, dmax: dmax };
  }
  function resultsOpen() {
    var E = engine();
    try { if (E === 'A') return stage === 'score' && finalSubmitted(); } catch (e) { return false; }
    var r = document.getElementById('answerReview'); return !!(r && r.children.length && r.offsetParent !== null);
  }

  var explain = null;
  function loadExplain(cb) {
    if (explain) return cb(explain);
    var w = String(DATA.week).padStart(2, '0');
    fetch('/ielts-nghe/explain/week-' + w + '.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }).then(function (j) { explain = j || {}; cb(explain); });
  }

  function build(host) {
    var list = rows(), total = list.length, sc = scores();
    var right = list.filter(function (r) { return r.ok; }).length;
    if (Math.abs(right - sc.ielts) > 0) right = sc.ielts; // the page's grading is authoritative
    var skipped = list.filter(function (r) { return !String(r.mine).trim(); }).length;
    var wrong = Math.max(0, total - right - skipped), m = mood(right / Math.max(1, total));
    var card = document.createElement('div'); card.className = 'tt-card';
    card.innerHTML = '<div class="tt-side"><div class="tt-bubble">' + m[1] + '</div><img class="tt-titi" src="' + TITI + 'titi-' + m[0] + '.webp" alt="Cô giáo Titi"><div class="tt-name">Cô giáo Titi</div></div>' +
      '<div class="tt-main"><div class="tt-head"><p class="tt-title">Kết quả Listening · Tuần ' + esc(DATA.week) + '</p>' +
      (total === 40 ? '<span class="tt-band" title="Ước tính theo bảng quy đổi Cambridge">Band ước tính <b>' + fb(band(right)) + '</b></span>' : '') + '</div>' +
      '<div class="tt-body"><div class="tt-ring" role="img" aria-label="' + right + ' trên ' + total + ' câu đúng">' + ring(right, wrong, skipped) + '<div class="tt-center"><b>' + right + '/' + total + '</b><span>câu IELTS đúng</span></div></div>' +
      '<ul class="tt-legend"><li><i style="background:#1f9d6b"></i>Đúng<strong>' + right + ' câu</strong></li><li><i style="background:#e0533d"></i>Sai<strong>' + wrong + ' câu</strong></li><li><i style="background:#c9ced8"></i>Bỏ trống<strong>' + skipped + ' câu</strong></li>' +
      (sc.dmax ? '<li><i style="background:#ffc83d"></i>Chính tả<strong>' + sc.dict + '/' + sc.dmax + '</strong></li>' : '') + '</ul></div>' +
      '<div class="tt-actions"><button type="button" class="tt-btn tt-primary" data-a="go">Xem chữa từng câu</button><button type="button" class="tt-btn tt-ghost" data-a="bad" aria-pressed="false">Chỉ hiện câu sai</button></div></div>';
    var rev = document.createElement('div'); rev.className = 'tt-review'; rev.innerHTML = '<h3>Chữa từng câu cùng cô Titi</h3><p style="margin:0;color:#667087">Đang tải giải thích…</p>';
    host.insertBefore(card, host.firstChild); card.after(rev);
    loadExplain(function (ex) {
      rev.innerHTML = '<h3>Chữa từng câu cùng cô Titi</h3>' + list.map(function (r) {
        var st = !String(r.mine).trim() ? 'skip' : r.ok ? 'ok' : 'bad', x = ex[String(r.n)] || {};
        return '<div class="tt-q ' + st + '" data-st="' + st + '"><div class="tt-qh">Câu ' + r.n + ' <span class="tt-tag tt-' + st + '-t">' + (st === 'ok' ? 'Đúng' : st === 'bad' ? 'Sai' : 'Bỏ trống') + '</span></div>' +
          '<div class="tt-ans">Em trả lời: <b>' + esc(r.mine || '—') + '</b> · Đáp án: <b>' + esc(r.key) + '</b></div>' +
          (x.evidence ? '<div class="tt-ev">“' + esc(x.evidence) + '”</div>' : '') + (x.explanationVi ? '<div>' + esc(x.explanationVi) + '</div>' : '') +
          (x.trapVi ? '<div class="tt-trap"><b>Bẫy cần tránh:</b> ' + esc(x.trapVi) + '</div>' : '') + '</div>';
      }).join('');
    });
    card.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-a]'); if (!b) return;
      if (b.dataset.a === 'go') { var f = rev.querySelector('.tt-q.bad,.tt-q.skip') || rev; f.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      if (b.dataset.a === 'bad') { var on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', String(on)); b.textContent = on ? 'Hiện tất cả câu' : 'Chỉ hiện câu sai'; rev.querySelectorAll('.tt-q.ok').forEach(function (q) { q.classList.toggle('tt-hide', on); }); }
    });
  }

  function tick() {
    if (!has('DATA') || !has('gradeAllResponses')) return;
    if (!resultsOpen()) return;
    var host = document.querySelector('#content .score-view') || document.getElementById('answerReview')?.parentElement || document.getElementById('content');
    if (!host || host.querySelector(':scope > .tt-card')) return;
    try { build(host); } catch (e) { if (window.console) console.warn('[titi-review]', e); }
  }
  function start() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    new MutationObserver(tick).observe(document.body, { childList: true, subtree: true }); tick(); setInterval(tick, 1500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
