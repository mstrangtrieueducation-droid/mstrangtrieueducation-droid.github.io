/* FIGHTER_QUALITY_V1 — presentation only.
   Shows the notebook quality the native model already parses from "Chất lượng: đạt N%" (component.quality):
   passed notebooks get "✅ Đạt N%", notebooks the native model already marks 'fix' get a red "❌ N% · CẦN NỘP LẠI"
   chip, a red line on their card and a red strip at the top of the study hub (plus one reminder pop-up a day).
   Never changes status, receipts, counts, marks or comments; reads FighterStudyHub.getModel() only. */
(() => {
  'use strict';
  const D = document;
  const E = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const pct = v => Math.round(Number(v));
  const hub = () => window.FighterStudyHub;
  let queued = false;

  const graded = c => c && c.role !== 'shadow' && Number.isFinite(c.quality);
  const norm = v => String(v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
  // The grader's own verdict line decides (owner 12/11): "Chưa đạt (Yêu cầu nộp lại…)" is a fail even where a cached
  // model still says done.
  const isBad = c => graded(c) && (c.status === 'fix' || /chua dat \(yeu cau nop lai/.test(norm(c.raw || c.comment)));
  const isOk = c => graded(c) && !isBad(c) && c.status === 'done';
  const failing = u => (u.components || []).filter(isBad);

  function chipFor(card, c, used) {
    for (const chip of card.querySelectorAll('.f5-chips > .f5-chip')) {
      if (used.has(chip)) continue;
      const b = chip.querySelector('b');
      if (b && b.textContent.trim().replace(/:$/, '') === String(c.label || '').trim()) { used.add(chip); return chip; }
    }
    return null;
  }

  function paintCards(units) {
    const byKey = new Map(units.map(u => [String(u.key), u]));
    for (const card of D.querySelectorAll('.f5-unit[data-f5-key]')) {
      const u = byKey.get(card.dataset.f5Key);
      if (!u) continue;
      const sig = (u.components || []).map(c => c.status + ':' + c.quality).join('|');
      if (card.dataset.fq === sig) continue;
      card.dataset.fq = sig;
      const used = new Set();
      for (const c of u.components || []) {
        if (!graded(c)) continue;
        const chip = chipFor(card, c, used);
        if (!chip) continue;
        if (isOk(c)) {
          chip.innerHTML = '<b>' + E(c.label) + ':</b> ✅ Đạt ' + pct(c.quality) + '%' + (c.late ? ' · Muộn' : '');
          chip.classList.add('fq-ok');
        } else if (isBad(c)) {
          chip.innerHTML = '<b>' + E(c.label) + ':</b> ❌ ' + pct(c.quality) + '% · CẦN NỘP LẠI';
          chip.classList.add('fq-bad');
        }
      }
      card.querySelector('.fq-alert')?.remove();
      card.querySelector('.fq-bars')?.remove();
      const rows = (u.components || []).filter(c => isOk(c) || isBad(c));
      if (rows.length) {
        // KIDS-style quality bars: one bar per graded notebook, green from 90%, red below.
        card.querySelector('.f5-chips')?.insertAdjacentHTML('afterend', '<div class="fq-bars">' + rows.map(c => {
          const v = Math.max(0, Math.min(100, pct(c.quality))), ok = isOk(c);
          return '<div class="fq-bar ' + (ok ? 'ok' : 'bad') + '"><div class="fq-bar-top"><span>' + E(c.label) + '</span><b>' +
            (ok ? '✅ Đạt ' : '❌ CHƯA ĐẠT · ') + v + '%' + (ok ? '' : ' — NỘP LẠI') + '</b></div><div class="fq-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' +
            v + '"><span style="width:' + v + '%"></span><i style="left:90%" title="Mức đạt 90%"></i></div></div>';
        }).join('') + '</div>');
      }
      const bad = failing(u);
      if (bad.length) {
        card.classList.add('fq-card-bad');
        const pill = card.querySelector('.f5-status');
        if (pill) { pill.textContent = '❌ Cần nộp lại'; pill.classList.add('fq-pill-bad'); }
        const worst = Math.min(...bad.map(c => c.quality));
        card.querySelector('.f5-unit-top')?.insertAdjacentHTML('afterend',
          '<p class="fq-alert">❌ CHƯA ĐẠT — chất lượng ' + pct(worst) + '% (cần từ 90%). Bài vẫn tính là CHƯA NỘP cho tới khi con nộp lại đạt yêu cầu.</p>');
      } else card.classList.remove('fq-card-bad');
    }
  }

  function paintStrip(units) {
    const host = D.getElementById('f5-alert');
    if (!host || !host.parentNode) return;
    const bad = units.flatMap(u => failing(u).map(c => ({u, c})));
    const sig = bad.map(x => x.u.key + ':' + x.c.quality).join('|');
    let strip = D.getElementById('fq-strip');
    if (strip && strip.dataset.sig === sig) return;
    strip?.remove();
    if (!bad.length) return;
    strip = D.createElement('section');
    strip.id = 'fq-strip';
    strip.dataset.sig = sig;
    strip.setAttribute('role', 'alert');
    strip.innerHTML = '<strong>❌ Con có ' + bad.length + ' bài CHƯA ĐẠT — phải NỘP LẠI ngay:</strong>' +
      bad.map(x => '<button type="button" data-f5-open="' + E(x.u.key) + '">' + E(x.u.title) + ' · ' + E(x.c.label) +
        ' — <b>' + pct(x.c.quality) + '%</b></button>').join('') +
      '<small>Bài chưa đạt vẫn tính là CHƯA NỘP BÀI. Bấm vào từng bài để xem cô nhận xét thiếu phần nào.</small>';
    host.parentNode.insertBefore(strip, host);
    remind(bad);
  }

  // One pop-up a day per pupil while something is still owed.
  function remind(bad) {
    let key = '';
    try {
      key = 'fq_remind_' + (location.hash || '').slice(0, 80) + '_' + new Date().toISOString().slice(0, 10);
      if (localStorage.getItem(key)) return;
    } catch (_) { return; }
    const dlg = D.createElement('dialog');
    dlg.id = 'fq-dialog';
    dlg.innerHTML = '<h2>❌ Bài CHƯA ĐẠT — cần nộp lại</h2><ul>' +
      bad.map(x => '<li><b>' + E(x.u.title) + ' · ' + E(x.c.label) + ':</b> chất lượng ' + pct(x.c.quality) + '% (cần từ 90%)</li>').join('') +
      '</ul><p>Các bài này vẫn tính là <b>CHƯA NỘP</b>. Con xem nhận xét của cô, bổ sung đủ rồi chụp lại và nộp lại trước buổi học tới.</p>' +
      '<button type="button" class="fq-close">Con đã hiểu</button>';
    D.body.append(dlg);
    dlg.querySelector('.fq-close').addEventListener('click', () => {
      try { localStorage.setItem(key, '1'); } catch (_) {}
      dlg.close(); dlg.remove();
    });
    try { dlg.showModal(); } catch (_) { dlg.remove(); }
  }

  function paint() {
    queued = false;
    const m = hub()?.getModel?.();
    if (!m || !Array.isArray(m.units)) return;
    paintCards(m.units);
    paintStrip(m.units);
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(paint); } }
  new MutationObserver(schedule).observe(D.documentElement, {childList: true, subtree: true});
  schedule();

  const style = D.createElement('style');
  style.textContent = `
  .f5-chip.fq-ok{background:#e3f4e8;color:#1b5e20;font-weight:700}
  .f5-chip.fq-bad{background:#b71c1c;color:#fff;font-weight:800}
  .f5-chip.fq-bad b{color:#fff}
  .f5-unit.fq-card-bad{border:2px solid #b71c1c!important;box-shadow:0 0 0 3px rgba(183,28,28,.12)}
  .fq-alert{margin:8px 0 4px;padding:8px 10px;border-radius:8px;background:#fdecea;color:#b71c1c;font-weight:800;font-size:12px;line-height:1.45}
  #fq-strip{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:10px 0;padding:12px 14px;border-radius:12px;
    background:#b71c1c;color:#fff;font-size:13px;line-height:1.5;animation:fqPulse 1.6s ease-in-out 3}
  #fq-strip strong{flex:1 1 100%;font-size:14px}
  #fq-strip button{border:0;border-radius:8px;padding:6px 10px;background:#fff;color:#b71c1c;font-weight:700;cursor:pointer}
  #fq-strip small{flex:1 1 100%;opacity:.92}
  #fq-dialog{max-width:440px;border:3px solid #b71c1c;border-radius:14px;padding:18px 20px;color:#16263b}
  #fq-dialog h2{margin:0 0 10px;color:#b71c1c;font-size:18px}
  #fq-dialog ul{padding-left:18px;margin:0 0 10px}
  #fq-dialog .fq-close{margin-top:6px;border:0;border-radius:8px;padding:9px 14px;background:#b71c1c;color:#fff;font-weight:700;cursor:pointer}
  .f5-status.fq-pill-bad{background:#b71c1c!important;color:#fff!important;font-weight:800}
  .f5-unit.fq-card-bad{background:#fff5f5!important}
  .fq-bar.bad .fq-bar-top{font-size:13px}
  .fq-bars{display:grid;gap:8px;margin:10px 0 4px}
  .fq-bar-top{display:flex;justify-content:space-between;gap:8px;font-size:12px;margin-bottom:4px;color:#16263b}
  .fq-bar.ok .fq-bar-top b{color:#1b5e20}.fq-bar.bad .fq-bar-top b{color:#b71c1c}
  .fq-track{position:relative;height:12px;border-radius:999px;background:#e9eef4;overflow:visible}
  .fq-track>span{display:block;height:100%;border-radius:999px;transition:width .8s ease}
  .fq-bar.ok .fq-track>span{background:#2e9d57}.fq-bar.bad .fq-track>span{background:#d32f2f}
  .fq-track>i{position:absolute;top:-3px;width:2px;height:18px;background:#16263b;opacity:.55}
  @keyframes fqPulse{0%,100%{box-shadow:0 0 0 0 rgba(183,28,28,.5)}50%{box-shadow:0 0 0 8px rgba(183,28,28,0)}}
  `;
  D.head.append(style);
})();
