/* Presentation only: show newly scored Fighter submissions on first open. */
(() => {
  'use strict';
  const bell = globalThis.NativeUpdatesBell;
  if (!bell || bell.fighterRecentNoticeBridge) return;
  const originalRender = bell.render;
  const initialized = new Set();
  const prefix = 'mtt_native_updates_v1_';
  const recentWindow = 72 * 3600000;
  function hash(value) {
    let n = 2166136261;
    for (const character of String(value)) {
      n ^= character.charCodeAt(0);
      n = Math.imul(n, 16777619);
    }
    return (n >>> 0).toString(36);
  }
  bell.render = function (input) {
    if (input?.profileKey && Array.isArray(input.records)) {
      const key = prefix + hash(input.profileKey);
      if (!initialized.has(key)) {
        initialized.add(key);
        let hasPriorSnapshot = false;
        try { hasPriorSnapshot = !!localStorage.getItem(key); } catch (_) {}
        if (!hasPriorSnapshot) {
          const now = Date.now();
          const recentScored = new Set(input.records.filter(record =>
            record.kind === 'task' && record.status === 'done' &&
            Number.isFinite(record.score) && Number(record.receiptAt) > 0 &&
            Number(record.receiptAt) <= now && now - Number(record.receiptAt) <= recentWindow
          ));
          if (recentScored.size) {
            // Establish the ordinary native bell baseline for older records,
            // then let its own comparison announce only the recent scored rows.
            originalRender.call(this, {...input, records: input.records.filter(record => !recentScored.has(record))});
          }
        }
      }
    }
    return originalRender.call(this, input);
  };
  bell.fighterRecentNoticeBridge = true;
})();
