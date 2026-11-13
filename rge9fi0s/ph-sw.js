/* KIDS parent app service worker (owner 13/11/2026: dashboard as an app + phone notifications; trial KIDS 21).
   Shows pushes from the ph-thongbao Worker and opens the pupil's own link on tap. It caches nothing else:
   the dashboard keeps loading exactly as before. */
const STORE = 'ph-app-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// The page tells the worker which link to open (the pupil's own #p=… address); kept on this device only.
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'link' && typeof d.url === 'string' && d.url.startsWith(self.registration.scope))
    e.waitUntil(caches.open(STORE).then(c => c.put('/__link', new Response(d.url))));
});
async function link() {
  try { const r = await (await caches.open(STORE)).match('/__link'); if (r) return await r.text(); } catch (_) {}
  return self.registration.scope + '?app=1';
}

self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (_) { d = { title: 'Ms. Trang Trieu Education', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.registration.showNotification(d.title || 'Ms. Trang Trieu Education', {
    body: d.body || '', tag: d.tag || 'kids', renotify: true, data: { open: /^[A-Za-z0-9_.-]{1,80}$/.test(d.open || '') ? d.open : '' },
    icon: '/dashboard-ui/kids-app/icon-192.png', badge: '/dashboard-ui/kids-app/icon-192.png', lang: 'vi'
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil((async () => {
    // A notification about one piece of work opens that work's detail: ?mo=<id> before the pupil's #p= link.
    const open = (e.notification.data || {}).open || '';
    let url = await link();
    if (open) url = url.replace(/\?[^#]*/, '').replace('#', '?mo=' + encodeURIComponent(open) + '#');
    // iPhone (13/11): with the app already open, focus() brought the page back but navigate() did nothing, so the
    // parent only saw the dashboard. The item to open is now also left in this worker's store; the page reads it when it
    // becomes visible (and gets a message if it is listening), so it opens whether the app was open or not.
    if (open) { try { await (await caches.open(STORE)).put('/__open', new Response(JSON.stringify({ id: open, at: Date.now() }))); } catch (_) {} }
    const wins = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const w of wins) if (w.url.startsWith(self.registration.scope)) {
      try { w.postMessage({ type: 'open', id: open }); } catch (_) {}
      try { await w.focus(); } catch (_) {}
      return;
    }
    await self.clients.openWindow(url);
  })());
});
