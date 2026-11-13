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
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
  const token = () => { const m = /[#&]p=([A-Za-z0-9_-]{16,128})/.exec(location.hash); return m ? m[1] : ''; };
  const ls = { get: k => { try { return localStorage.getItem(k) || ''; } catch (_) { return ''; } }, set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (_) {} } };

  // Home-screen icon on Android/desktop: add the manifest (iOS keeps the exact address it was added from instead).
  const head = (tag, attrs) => { const n = D.createElement(tag); Object.assign(n, attrs); D.head.appendChild(n); };
  if (!ios) head('link', { rel: 'manifest', href: path + 'app.webmanifest' });
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

  const css = `#kapp{position:fixed;right:14px;bottom:18px;z-index:2147480000;display:flex;flex-direction:column;align-items:flex-end;gap:8px;font:14px/1.35 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
#kapp button{border:0;border-radius:999px;padding:10px 15px;font:inherit;font-weight:700;cursor:pointer;box-shadow:0 6px 18px rgba(12,24,48,.22);display:inline-flex;align-items:center;gap:7px}
#kapp .k-on{background:#0F172A;color:#fff}#kapp .k-ok{background:#e9f7ef;color:#17663a;padding:9px 12px}#kapp .k-inst{background:#fff;color:#0F172A;border:1.5px solid #cdd8e6}
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
  function iosHelp() {
    sheet('<h3>📲 Cài app vào iPhone</h3><p>Để nhận thông báo trên iPhone, bố mẹ cài trang này thành app trước:</p><ol><li>Mở trang bằng <b>Safari</b>.</li><li>Bấm nút <b>Chia sẻ</b> (ô vuông có mũi tên ↑).</li><li>Chọn <b>Thêm vào MH chính</b> → <b>Thêm</b>.</li><li>Mở app <b>KIDS ' + CLS + '</b> trên màn hình chính rồi bấm <b>🔔 Bật thông báo</b>.</li></ol><div class="row"><button class="p" data-x>Đã hiểu</button></div>');
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
    if (ios && !standalone && !pushOK) { add('k-inst', '📲 Cài app để nhận thông báo', iosHelp); return; }
    if (!pushOK) return;
    if (subscribed) add('k-ok', '🔔 ✓', () => sheet('<h3>🔔 Đang nhận thông báo</h3><p>Điện thoại sẽ báo khi cô nhận xét, có sao/điểm, có bài mới và trước hạn nộp bài. Không báo từ 21:30 đến 6:30.</p><div class="row"><button class="s" data-x>Đóng</button><button class="d" data-off>Tắt thông báo</button></div>', s => s.querySelector('[data-off]').addEventListener('click', () => { s.remove(); disable(); })));
    else add('k-on', '🔔 Bật thông báo', enable);
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEvt = e; paint(); });
  window.addEventListener('appinstalled', () => { installEvt = null; paint(); toast('📲 Đã cài app. Mở app KIDS ' + CLS + ' từ màn hình chính.'); });

  async function boot() {
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
