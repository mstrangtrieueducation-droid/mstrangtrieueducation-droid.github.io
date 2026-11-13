/* KIDS_APP_V1 (owner 13/11/2026: "làm dash thành như 1 webapp ... chuông thông báo ở điện thoại"; trial KIDS 21, Bean).
   Presentation only: never reads or changes homework data. It
   - lets the page be added to the home screen as an app (manifest + a small service worker under the class folder),
   - reopens the pupil's own link when the app is started from the home screen,
   - offers "Bật thông báo": the device's push address + the pupil's data hash go to the ph-thongbao Worker, which
     sends what is new (comments, stars, marks, new homework, deadlines). Nothing else leaves the device. */
(() => {
  'use strict';
  const me = document.currentScript, CLS = Number(me && me.dataset.cls), SERVER = me && me.dataset.server, VAPID = me && me.dataset.vapid;
  if (!CLS || !SERVER || !VAPID) return;
  const D = document, path = location.pathname.replace(/index\.html$/, ''), LINK = 'kids-app-link:' + path, ON = 'kids-app-push:' + path;
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const inApp = /Zalo|FBAN|FBAV|FB_IAB|Messenger|Instagram|Line\/|; wv\)/i.test(navigator.userAgent);
  // Samsung Internet takes the subscription but a Samsung phone puts it to sleep, so notices do not ring (owner's
  // husband, 14/11). Parents on it are sent to Chrome, like in-app browsers.
  const samsung = /SamsungBrowser/i.test(navigator.userAgent);
  const android = /Android/i.test(navigator.userAgent), HELPED = 'kids-app-home:' + location.pathname;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const token = () => { const m = /[#&]p=([A-Za-z0-9_-]{16,128})/.exec(location.hash); return m ? m[1] : ''; };
  const ls = { get: k => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } }, set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (_) {} } };

  // Home-screen icon on Android/desktop: add the manifest (iOS keeps the exact address it was added from instead).
  const head = (tag, attrs) => { const n = D.createElement(tag); Object.assign(n, attrs); D.head.appendChild(n); };
  // Android: no manifest, so "Thêm vào màn hình chính" makes a plain shortcut to this exact page. Installing it as an
  // app was blocked by Google Play Protect / Samsung Auto Blocker on the owner's Samsung (13/11). Desktop keeps install.
  if (!ios && !android) head('link', { rel: 'manifest', href: path + 'app.webmanifest' });
  head('link', { rel: 'apple-touch-icon', href: '/dashboard-ui/kids-app/icon-192.png' });
  head('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  head('meta', { name: 'mobile-web-app-capable', content: 'yes' });
  head('meta', { name: 'apple-mobile-web-app-title', content: 'KIDS ' + CLS });
  head('meta', { name: 'theme-color', content: '#0F172A' });

  // Started from the home screen without a link: reopen the pupil's own page.
  if (!token()) {
    const saved = ls.get(LINK);
    if (saved && /^[A-Za-z0-9_-]{16,128}$/.test(saved)) { history.replaceState(null, '', path + '#p=' + saved); location.reload(); return; }
    if (standalone || /[?&]app=1/.test(location.search)) D.addEventListener('DOMContentLoaded', pasteBox, { once: true });
    return;
  }
  ls.set(LINK, token());

  const css = `#kapp{position:fixed;right:14px;bottom:96px;z-index:2147480000;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font:14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#kapp button{border:0;border-radius:999px;padding:10px 15px;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(12,24,48,.22);display:inline-flex;align-items:center;gap:7px}
#kapp .k-on{background:#0F172A;color:#fff}#kapp .k-ok{position:fixed;top:8px;right:8px;background:rgba(233,247,239,.92);color:#17663a;padding:3px 7px;font-size:13px;font-weight:700;box-shadow:none;border:1px solid #bfe3cc;line-height:1.2}
@keyframes kappFlash{0%,100%{box-shadow:0 0 0 0 rgba(47,123,208,0)}30%,70%{box-shadow:0 0 0 6px rgba(47,123,208,.35)}}.kapp-flash{animation:kappFlash 1.3s ease-in-out 3;border-radius:16px}
html.kapp-on #bean-updates,html.kapp-on .kids-notice-label{display:none!important}#kapp .k-inst{background:#fff;color:#0F172A;border:1.5px solid #cdd8e6}
#kapp-sheet{position:fixed;inset:0;z-index:2147480001;background:rgba(9,20,40,.5);display:flex;align-items:flex-end;justify-content:center}
#kapp-sheet>div{background:#fff;color:#16263b;width:min(520px,100%);border-radius:18px 18px 0 0;padding:20px 20px 26px;box-shadow:0 -8px 30px rgba(0,0,0,.2);font:15px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#kapp-sheet h3{margin:0 0 8px;font-size:18px}#kapp-sheet ol{margin:8px 0 14px;padding-left:20px}#kapp-sheet li{margin:4px 0}
#kapp-sheet .row{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}#kapp-sheet button{border:0;border-radius:12px;padding:11px 16px;font:inherit;font-weight:700;cursor:pointer}
#kapp-sheet .p{background:#0F172A;color:#fff}#kapp-sheet .s{background:#eef2f7;color:#0F172A}#kapp-sheet .d{background:#fdecef;color:#9b1c3a}
#kapp-toast{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:2147480002;background:#0F172A;color:#fff;padding:11px 16px;border-radius:12px;font:14px/1.4 system-ui,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:90vw}`;
  head('style', { textContent: css });

  const hex = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
  const key = b => { b = b.replace(/-/g, '+').replace(/_/g, '/'); b += '='.repeat((4 - b.length % 4) % 4); return Uint8Array.from(atob(b), c => c.charCodeAt(0)); };
  const toast = t => { D.getElementById('kapp-toast')?.remove(); const n = D.createElement('div'); n.id = 'kapp-toast'; n.textContent = t; D.body.appendChild(n); setTimeout(() => n.remove(), 4500); };
  const pushOK = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  let reg = null, installEvt = null, box = null;

  function sheet(html, wire) {
    D.getElementById('kapp-sheet')?.remove();
    const s = D.createElement('div'); s.id = 'kapp-sheet'; s.innerHTML = '<div role="dialog" aria-modal="true">' + html + '</div>';
    s.addEventListener('click', e => { if (e.target === s || e.target.closest('[data-x]')) s.remove(); });
    D.body.appendChild(s); if (wire) wire(s); return s;
  }
  function inAppHelp() {
    const steps = ios
      ? '<ol><li>Bấm nút <b>⋯</b> hoặc biểu tượng <b>la bàn / Safari</b> ở góc màn hình.</li><li>Chọn <b>Mở bằng trình duyệt</b> (Safari).</li><li>Trong Safari: <b>Chia sẻ</b> → <b>Thêm vào MH chính</b>, mở biểu tượng mới rồi bấm <b>🔔 Bật thông báo</b>.</li></ol>'
      : samsung ? '<ol><li>Bấm <b>Chép link</b> ở dưới.</li><li>Mở ứng dụng <b>Chrome</b> (biểu tượng tròn xanh-đỏ-vàng), bấm vào thanh địa chỉ, <b>dán</b> link rồi mở.</li><li>Trong Chrome bấm <b>🔔 Bật thông báo</b> → <b>Cho phép</b>.</li></ol>'
      : '<ol><li>Bấm nút <b>⋮</b> (ba chấm) ở góc trên bên phải.</li><li>Chọn <b>Mở bằng trình duyệt</b> / <b>Mở trong Chrome</b>.</li><li>Trong Chrome bấm <b>🔔 Bật thông báo</b> → <b>Cho phép</b>.</li></ol>';
    sheet('<h3>🔔 Mở bằng ' + (ios ? 'Safari' : 'Chrome') + ' để nhận thông báo</h3><p>' + (samsung ? 'Trình duyệt Samsung Internet hay bị máy cho ngủ nên thông báo không kêu.' : 'Trang đang mở bên trong Zalo nên chưa nhận được thông báo.') + ' Không cần cài gì, bố mẹ chỉ mở trang bằng ' + (ios ? 'Safari' : 'Chrome') + ':</p>' + steps +
      '<div class="row"><button class="p" data-copy>Chép link</button><button class="s" data-x>Đóng</button></div>', sh => sh.querySelector('[data-copy]').addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(location.origin + path + '#p=' + token()); toast('Đã chép link. Dán vào ' + (ios ? 'Safari' : 'Chrome') + ' là mở được.'); } catch (_) { toast('Bố mẹ bấm giữ thanh địa chỉ để chép link nhé.'); }
      }));
  }
  function iosHelp() {
    sheet('<h3>📲 Đưa hồ sơ của con ra màn hình chính</h3><p><b>Không cần cài app.</b> iPhone chỉ báo tin khi trang đã ở màn hình chính, bố mẹ làm một lần:</p><ol><li>Mở trang bằng <b>Safari</b>.</li><li>Bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên ↑).</li><li>Chọn <b>Thêm vào MH chính</b> → <b>Thêm</b>.</li><li>Mở app <b>KIDS ' + CLS + '</b> trên màn hình chính rồi bấm <b>🔔 Bật thông báo</b>.</li></ol><div class="row"><button class="p" data-x>Đã hiểu</button></div>');
  }
  function androidHelp() {
    sheet('<h3>📲 Đưa hồ sơ của con ra màn hình chính</h3><p><b>Không cần cài app.</b> Bố mẹ chỉ thêm một biểu tượng ra màn hình chính, bấm vào là mở thẳng hồ sơ của con:</p>' +
      '<p><b>Chrome:</b></p><ol><li>Bấm nút <b>⋮</b> (ba chấm, góc trên bên phải).</li><li>Chọn <b>Thêm vào màn hình chính</b>.</li><li>Bấm <b>Thêm</b>.</li></ol>' +
      '<p><b>Trình duyệt Samsung Internet:</b></p><ol><li>Bấm nút <b>☰</b> (góc dưới bên phải).</li><li>Chọn <b>Thêm trang vào</b> → <b>Màn hình chính</b>.</li></ol>' +
      '<p>Rồi bấm <b>🔔 Bật thông báo</b> → <b>Cho phép</b> để điện thoại báo khi cô nhận xét, có sao/điểm, có bài mới và trước hạn nộp.</p>' +
      '<div class="row"><button class="p" data-done>Đã làm xong</button><button class="s" data-x>Để sau</button></div>',
      sh => sh.querySelector('[data-done]').addEventListener('click', () => { ls.set(HELPED, '1'); sh.remove(); paint(); }));
  }
  async function enable() {
    try {
      if (Notification.permission === 'denied') { sheet('<h3>Thông báo đang bị chặn</h3><p>Bố mẹ mở cài đặt trình duyệt / điện thoại, cho phép thông báo của trang này rồi bấm lại nhé.</p><div class="row"><button class="p" data-x>Đã hiểu</button></div>'); return; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { toast('Chưa bật: bố mẹ chưa cho phép thông báo.'); return; }
      reg = reg || await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key(VAPID) });
      const r = await fetch(SERVER + '/dk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cls: CLS, hash: await hex(token()), sub: sub.toJSON() }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw Error(j.error || 'Máy chủ chưa nhận.');
      ls.set(ON, '1'); paint(); toast('🔔 Đã bật thông báo cho ' + (j.alias || 'con') + '. Có tin mới, điện thoại sẽ báo.');
    } catch (e) { toast('Chưa bật được thông báo: ' + (e.message || e)); }
  }
  async function disable() {
    try {
      reg = reg || await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) { await fetch(SERVER + '/dk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cls: CLS, hash: await hex(token()), off: true, sub: { endpoint: sub.endpoint } }) }).catch(() => {}); await sub.unsubscribe(); }
    } catch (_) {}
    ls.set(ON, ''); paint(); toast('Đã tắt thông báo trên máy này.');
  }
  async function paint() {
    if (!box) { box = D.createElement('div'); box.id = 'kapp'; D.body.appendChild(box); }
    let subscribed = false;
    try { if (reg) subscribed = Boolean(await reg.pushManager.getSubscription()) && Notification.permission === 'granted' && ls.get(ON) === '1'; } catch (_) {}
    box.innerHTML = '';
    const add = (cls, text, fn) => { const b = D.createElement('button'); b.type = 'button'; b.className = cls; b.textContent = text; b.addEventListener('click', fn); box.appendChild(b); };
    if (installEvt && !standalone) add('k-inst', '📲 Cài app', async () => { const e = installEvt; installEvt = null; e.prompt(); try { await e.userChoice; } catch (_) {} paint(); });
    // Links opened inside Zalo / Facebook / Messenger cannot receive notifications (most parents open them there).
    if (inApp || samsung) { add('k-inst', '🔔 Mở bằng ' + (ios ? 'Safari' : 'Chrome') + ' để nhận thông báo', inAppHelp); return; }
    if (ios && !standalone && !pushOK) { add('k-inst', '📲 Đưa ra màn hình chính (không cần cài)', iosHelp); return; }
    // Android: no home-screen step at all (owner 14/11: the menu item was not there on her Samsung). Notifications work
    // in Chrome without it, and a tap opens the pupil's page.
    if (!pushOK) return;
    // Owner 14/11: once notifications are on, the page's pink bell goes away (the phone rings instead) and the
    // "on" mark is a small tag at the top, so it is not tapped by mistake. Turning off needs two taps and a confirmation.
    D.documentElement.classList.toggle('kapp-on', subscribed);
    if (subscribed) add('k-ok', '🔔✓', () => sheet('<h3>🔔 Đang nhận thông báo</h3><p>Điện thoại báo giống chiếc chuông trên trang: điểm / sao / nhận xét mới, bài nộp đã nhận, bài học và bài tự luyện mới. Không báo từ 21:30 đến 6:30.</p><div class="row"><button class="p" data-x>Đóng</button></div><p style="margin-top:18px;font-size:13px;color:#6b7a8f">Muốn tắt thông báo trên máy này? <button class="d" data-off style="padding:6px 10px;font-size:13px">Tắt</button></p>', s => s.querySelector('[data-off]').addEventListener('click', () => { if (confirm('Tắt thông báo trên máy này?')) { s.remove(); disable(); } })));
    else add('k-on', '🔔 Bật thông báo', enable);
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; paint(); });
  window.addEventListener('appinstalled', () => { installEvt = null; paint(); toast('📲 Đã cài app. Mở app KIDS ' + CLS + ' từ màn hình chính.'); });

  // Opened from a notification about one piece of work (?mo=<id>): open that work's detail once the page has drawn it.
  // Opened from a notification: the daily "Con còn n bài cần làm" reminder steps aside this once, so the item the
  // parent tapped is visible. A normal opening of the page still shows it.
  function yieldGate() {
    const gate = D.getElementById('pendingWorkGate');
    if (gate && !gate.hidden) { gate.hidden = true; D.body.classList.remove('pending-work-locked'); }
    let n = 0; const keep = setInterval(() => { const g = D.getElementById('pendingWorkGate'); if (g && !g.hidden) { g.hidden = true; D.body.classList.remove('pending-work-locked'); } if (++n > 24) clearInterval(keep); }, 250);
  }
  let opening = null;
  function openItem(id) {
    if (!/^[A-Za-z0-9_.-]{1,80}$/.test(id || '')) return;
    if (opening) clearInterval(opening);
    // An item opened before (or the reminder) must not stand in for the new one.
    D.querySelectorAll('dialog[open]').forEach(d => { try { d.close(); } catch (_) {} });
    // Tests and interviews have no detail of their own: open the results tab ("Kết quả & Xếp hạng").
    // Interviews and paper tests are shown on the results tab: open it, then bring the exact result into view and
    // highlight it (interview: article[data-assessment-id]; paper test: the "KIỂM TRA GIẤY" section).
    if (/-test-/.test(id)) {
      let n = 0, switched = false;
      const tt = setInterval(() => {
        n++;
        const tab = D.querySelector('[data-tab="journey"]');
        if (tab && tab.getAttribute('aria-selected') !== 'true') { tab.click(); switched = true; return; }
        const self = D.querySelector('[data-journey="self"]');
        if (self && self.getAttribute('aria-selected') !== 'true') { self.click(); return; }
        D.querySelectorAll('dialog[open]').forEach(d => { try { d.close(); } catch (_) {} });
        const target = [...D.querySelectorAll('[data-assessment-id]')].find(e => e.getAttribute('data-assessment-id') === id)
          || [...D.querySelectorAll('#j-panel section')].filter(e => /^\W*KIỂM TRA GIẤY/i.test(e.textContent.trim())).sort((x, y) => x.textContent.length - y.textContent.length)[0];
        if (target) { clearInterval(tt); yieldGate(); target.scrollIntoView({ block: 'start' }); window.scrollBy(0, -12); target.classList.add('kapp-flash'); setTimeout(() => target.classList.remove('kapp-flash'), 4000); }
        else if (n > 80) clearInterval(tt);
      }, 250);
      return;
    }
    // The page draws in steps (journey view, then the reminder gate). Keep the detail open for the first 12 s:
    // if a later repaint closes it, open it again. The detail is a modal dialog, so it sits above the reminder.
    // Stops once the detail has stayed open for 1.5 s, so a parent closing it is never fought.
    // Lessons open from their card (data-open = id). Video homework opens from the "Bài tập & Video" tab, video group,
    // row data-archive-detail="video|<series>::<id>".
    const finder = () => {
      const lesson = [...D.querySelectorAll('[data-open]')].find(b => b.getAttribute('data-open') === id);
      if (lesson) return lesson;
      const row = [...D.querySelectorAll('[data-archive-detail]')].find(b => b.getAttribute('data-archive-detail').endsWith('::' + id));
      if (row) return row;
      if (/-L\d+-/.test(id)) {
        // Lesson cards live on the first tab ("Kế hoạch & Lịch học").
        const week = D.querySelector('[data-tab="week"]');
        if (week && week.getAttribute('aria-selected') !== 'true') week.click();
      } else {
        const tab = D.querySelector('[data-tab="library"]');
        if (tab && tab.getAttribute('aria-selected') !== 'true') { tab.click(); return null; }
        const group = D.querySelector('[data-archive-group^="video|"]');
        if (group && group.getAttribute('aria-selected') !== 'true') group.click();
      }
      return null;
    };
    let tries = 0, opened = 0, steady = 0;
    const t = opening = setInterval(() => {
      tries++;
      const open = D.querySelector('dialog[open]');
      if (open) steady++; else { steady = 0; const btn = finder(); if (btn) { btn.click(); opened++; } }
      if (steady >= 6 || tries > 80 || opened > 6) { clearInterval(t); if (opening === t) opening = null; }
    }, 250);
  }
  // Ways a notification tap reaches the page: ?mo=<id> on a fresh start, a message from the service worker, or the
  // item the worker left in its store (read whenever the app comes to the front; iPhone does not always deliver either).
  function openFromNotice() {
    const m = /[?&]mo=([A-Za-z0-9_.-]{1,80})/.exec(location.search);
    if (!m) return;
    history.replaceState(null, '', path + location.hash);
    openItem(decodeURIComponent(m[1]));
  }
  async function pendingOpen() {
    try {
      if (!('caches' in window)) return;
      const c = await caches.open('ph-app-v1'), r = await c.match('/__open');
      if (!r) return;
      const d = JSON.parse(await r.text()); await c.delete('/__open');
      if (d && d.id && Date.now() - d.at < 5 * 60e3) openItem(d.id);
    } catch (_) {}
  }
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'open' && e.data.id) { try { caches.open('ph-app-v1').then(c => c.delete('/__open')); } catch (_) {} openItem(e.data.id); }
  });
  D.addEventListener('visibilitychange', () => { if (D.visibilityState === 'visible') pendingOpen(); });
  window.addEventListener('pageshow', () => pendingOpen());

  async function boot() {
    openFromNotice();
    pendingOpen();
    if ('serviceWorker' in navigator) {
      try {
        reg = await navigator.serviceWorker.register(path + 'ph-sw.js', { scope: path });
        const ready = await navigator.serviceWorker.ready;
        (ready.active || reg.active)?.postMessage({ type: 'link', url: location.origin + path + '#p=' + token() });
      } catch (_) { reg = null; }
    }
    paint();
  }
  if (D.readyState === 'loading') D.addEventListener('DOMContentLoaded', boot, { once: true }); else boot();

  function pasteBox() {
    sheet('<h3>Mở hồ sơ của con</h3><p>Bố mẹ dán <b>link riêng</b> của con (link cô gửi qua Zalo) vào ô dưới đây. Lần sau app tự mở.</p><input id="kapp-link" type="url" placeholder="https://…#p=…" style="width:100%;box-sizing:border-box;padding:12px;border:1.5px solid #cdd8e6;border-radius:12px;font:inherit"><div class="row"><button class="p" data-go>Mở</button></div>', s => {
      s.querySelector('[data-go]').addEventListener('click', () => {
        const m = /[#&]p=([A-Za-z0-9_-]{16,128})/.exec(s.querySelector('#kapp-link').value || '');
        if (!m) { toast('Link chưa đúng. Bố mẹ dán đúng link riêng của con nhé.'); return; }
        ls.set(LINK, m[1]); history.replaceState(null, '', path + '#p=' + m[1]); location.reload();
      });
    });
  }
})();
