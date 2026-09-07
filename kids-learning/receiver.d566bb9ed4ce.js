/* KIDS21 pilot: per-page identity hint only; no storage or parent-token access. */
(function(root) {
  'use strict';
  const pairs = new WeakMap();
  function read(search) {
    const query = new URLSearchParams(search === undefined ? root.location.search : search);
    const names = query.getAll('mtt_name'), classes = query.getAll('mtt_class');
    if (!names.length && !classes.length) return { state: 'absent' };
    const name = String(names[0] || '').trim().replace(/\s+/g, ' ');
    const className = String(classes[0] || '').trim();
    if (names.length !== 1 || classes.length !== 1 || !name || name.length > 60 ||
        /[\u0000-\u001f\u007f]/.test(String(names[0] || '')) || className !== 'KIDS 21') {
      return { state: 'invalid' };
    }
    return { state: 'valid', name: name, className: className };
  }
  function formTarget(value, mapping, baseUrl) {
    let url;
    try { url = new URL(value, baseUrl || root.location.href); } catch (_) { return null; }
    if (url.protocol !== 'https:' || url.hostname !== 'docs.google.com') return null;
    const match = url.pathname.match(/^\/forms\/(?:u\/\d+\/)?d\/e\/([^/]+)\/viewform\/?$/);
    if (!match || !mapping || match[1] !== mapping.formId ||
        !/^entry\.\d+$/.test(mapping.nameEntry || '') || !/^entry\.\d+$/.test(mapping.classEntry || '') ||
        mapping.nameEntry === mapping.classEntry) return null;
    return url;
  }
  function formUrl(value, mapping, incoming, baseUrl) {
    const hint = incoming || read();
    if (hint.state === 'absent') return value;
    const url = formTarget(value, mapping, baseUrl);
    if (!url) return value;
    if (hint.state === 'valid') {
      url.searchParams.set('usp', 'pp_url');
      url.searchParams.set(mapping.nameEntry, hint.name);
      url.searchParams.set(mapping.classEntry, hint.className);
    } else {
      url.searchParams.delete(mapping.nameEntry);
      url.searchParams.delete(mapping.classEntry);
    }
    return url.href;
  }
  function write(control, value) {
    const win = control.ownerDocument.defaultView;
    const proto = control.tagName === 'SELECT' ? win.HTMLSelectElement.prototype : win.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(control, value);
    control.dispatchEvent(new win.Event('input', { bubbles: true }));
    control.dispatchEvent(new win.Event('change', { bubbles: true }));
  }
  function fillPair(nameControl, classControl, incoming) {
    const hint = incoming || read();
    if (hint.state === 'absent' || !nameControl || !classControl || pairs.has(nameControl)) return false;
    if (!/^(?:INPUT|SELECT)$/.test(classControl.tagName) || nameControl.tagName !== 'INPUT') return false;
    const allowed = classControl.tagName !== 'SELECT' || Array.from(classControl.options).some(option => option.value === hint.className);
    const limit = nameControl.maxLength > 0 ? nameControl.maxLength : 60;
    const valid = hint.state === 'valid' && allowed && hint.name.length <= limit;
    const state = { writing: true, name: valid ? hint.name : '', className: valid ? hint.className : '' };
    pairs.set(nameControl, state);
    // Existing controls stay editable; this hint neither starts nor submits.
    write(nameControl, state.name); write(classControl, state.className); state.writing = false;
    const remember = function() {
      if (state.writing) return;
      state.name = nameControl.value; state.className = classControl.value;
    };
    [nameControl, classControl].forEach(control => {
      control.addEventListener('input', remember); control.addEventListener('change', remember);
    });
    if (nameControl.form && nameControl.form === classControl.form) {
      nameControl.form.addEventListener('reset', function() {
        // A normal form reset must not reintroduce a saved sibling's identity.
        root.setTimeout(function() {
          state.writing = true;
          write(nameControl, state.name); write(classControl, state.className); state.writing = false;
        }, 0);
      });
    }
    return true;
  }
  function validatedIdentity(value) {
    if (value && value.state === 'absent') return { state: 'absent' };
    if (!value || value.state === 'invalid' || typeof value.name !== 'string' || typeof value.className !== 'string') return { state: 'invalid' };
    const query = new URLSearchParams();
    query.set('mtt_name', value.name); query.set('mtt_class', value.className);
    return read(query.toString());
  }
  function install(options, targetWindow, explicitIdentity) {
    const config = options || {}, win = targetWindow || root, doc = win.document;
    const hint = explicitIdentity === undefined ? read() : validatedIdentity(explicitIdentity);
    if (hint.state === 'absent') return function() {};
    const appliedLinks = new WeakMap();
    const describeLink = function(value) {
      const mapping = (config.forms || []).find(item => formTarget(value, item, win.location.href));
      if (!mapping) return null;
      const url = formTarget(value, mapping, win.location.href);
      // Identity-only rewrites by this helper or mobile navigation are not a
      // new assignment. All other parameters remain part of its identity.
      url.searchParams.delete(mapping.nameEntry); url.searchParams.delete(mapping.classEntry);
      url.searchParams.delete('usp');
      return { mapping: mapping, key: url.href };
    };
    const linkKey = function(value) {
      const description = describeLink(value);
      if (description) return description.key;
      if (!value) return null;
      try { return 'unmapped:' + new URL(value, win.location.href).href; } catch (_) { return null; }
    };
    const changedAssignmentLinks = function(records) {
      const groups = new Map(), changes = new Map();
      (records || []).forEach(record => {
        if (record.type !== 'attributes' || !appliedLinks.has(record.target)) return;
        if (!groups.has(record.target)) groups.set(record.target, {});
        const group = groups.get(record.target);
        (group[record.attributeName] || (group[record.attributeName] = [])).push(record);
      });
      groups.forEach((group, anchor) => {
        const prior = appliedLinks.get(anchor);
        // Without mobile canonical state, the author's final DOM value wins;
        // an intermediate href that was deliberately reverted is irrelevant.
        if (!anchor.hasAttribute('data-google-form-url')) {
          changes.set(anchor, anchor.getAttribute('href'));
          return;
        }
        const latestChanged = function(attribute) {
          const mutations = group[attribute] || [];
          let selected = null;
          mutations.forEach((record, index) => {
            // A mobile observer can already have restored stale canonical href
            // before this callback. The next record's oldValue preserves the
            // intervening, intentionally assigned URL so it is not lost.
            const value = index + 1 < mutations.length ? mutations[index + 1].oldValue : anchor.getAttribute(attribute);
            const key = linkKey(value);
            if (key && key !== prior.key) selected = value;
          });
          return selected;
        };
        const changed = latestChanged('data-google-form-url') || latestChanged('href');
        if (changed) changes.set(anchor, changed);
      });
      return changes;
    };
    const apply = function(records) {
      const changedLinks = changedAssignmentLinks(Array.isArray(records) ? records : []);
      (config.fieldPairs || []).forEach(pair => {
        fillPair(doc.querySelector(pair.name), doc.querySelector(pair.className), hint);
      });
      doc.querySelectorAll('a[href]').forEach(anchor => {
        const previous = anchor.getAttribute('href');
        // Existing mobile navigation treats this attribute as authoritative.
        // Update it in the same callback, before href observers run.
        const canonical = anchor.getAttribute('data-google-form-url');
        let next = changedLinks.get(anchor) || canonical || previous;
        const description = describeLink(next);
        if (!description) {
          if (changedLinks.has(anchor) && next) {
            // A former Form may become a download or another destination. Keep
            // the authored target, with no prefill or old mobile Form override.
            if (canonical && canonical !== next) anchor.setAttribute('data-google-form-url', next);
            if (previous !== next) anchor.setAttribute('href', next);
            appliedLinks.set(anchor, { key: linkKey(next) });
          }
          return;
        }
        next = formUrl(next, description.mapping, hint, win.location.href);
        if (canonical && next !== canonical) anchor.setAttribute('data-google-form-url', next);
        if (next !== previous) anchor.setAttribute('href', next);
        // Native Forms must open outside the full-page lesson iframe.
        if (anchor.getAttribute('target') !== '_blank') anchor.setAttribute('target', '_blank');
        if (!anchor.relList.contains('noopener')) anchor.relList.add('noopener');
        appliedLinks.set(anchor, { key: description.key });
      });
    };
    const observer = new win.MutationObserver(apply);
    observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true,
      attributeOldValue: true, attributeFilter: ['href', 'data-google-form-url'] });
    // Apply synchronously before the viewer reveals its loaded lesson. The
    // later event covers a caller installing before that lesson is complete.
    apply();
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', apply, { once: true });
    return function() { observer.disconnect(); };
  }
  root.MTTStudentPrefill = Object.freeze({ read: read, formUrl: formUrl, fillPair: fillPair, install: install });
})(window);
