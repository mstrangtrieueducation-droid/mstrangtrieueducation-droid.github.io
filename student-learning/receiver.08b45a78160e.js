/* Configured program families: per-page identity only; no storage or parent-token access. */
(function(root) {
  'use strict';
  const pairs = new WeakMap();
  const installations = new WeakMap();
  const CLASS_PATTERN = /^(?:(KIDS|FIGHTER|IELTS) ([1-9]\d{0,2})|(TA)([1-9]\d{0,2}))$/;
  function allowedClassNames(options) {
    if (options && Object.prototype.hasOwnProperty.call(options, 'classFamilies')) {
      const families = options.classFamilies;
      if (!Array.isArray(families) || !families.length ||
          families.some(value => !['KIDS', 'FIGHTER', 'IELTS', 'TA'].includes(value)) ||
          new Set(families).size !== families.length) return null;
      return { has: value => { const match = CLASS_PATTERN.exec(value); return !!match && families.includes(match[1] || match[3]); } };
    }
    const values = options && options.allowedClasses;
    if (!Array.isArray(values) || !values.length || values.length > 100 ||
        values.some(value => typeof value !== 'string' || !/^KIDS [1-9]\d*$/.test(value)) ||
        new Set(values).size !== values.length) return null;
    return new Set(values);
  }
  function nameLimit(options) {
    const limit = options && options.maxNameLength;
    return limit === undefined ? 60 : Number.isInteger(limit) && limit > 0 && limit <= 120 ? limit : 0;
  }
  function normalizedName(value, limit) {
    if (typeof value !== 'string' || /[\u0000-\u001f\u007f-\u009f]/.test(value)) return null;
    const result = value.normalize('NFC').trim().replace(/\s+/g, ' ');
    return result && result.length <= limit ? result : null;
  }
  function canonicalClass(value) {
    const compact = String(value || '').trim().toUpperCase().replace(/\s+/g, '');
    const match = /^(KIDS|FIGHTER|IELTS|TA)([1-9]\d{0,2})$/.exec(compact);
    return match ? match[1] + (match[1] === 'TA' ? '' : ' ') + match[2] : null;
  }
  function selectedIdentity(hint, mapping) {
    if (!hint || hint.state !== 'valid') return hint || { state: 'invalid' };
    if (!mapping || mapping.nameSource === undefined || mapping.nameSource === 'name') return hint;
    if (mapping.nameSource !== 'englishName') return { state: 'invalid' };
    const name = hint.englishName || (/^KIDS /.test(hint.className) ? hint.name : '');
    return name ? { ...hint, name: name } : { state: 'invalid' };
  }
  function read(search, options) {
    const query = new URLSearchParams(search === undefined ? root.location.search : search);
    const names = query.getAll('mtt_name'), classes = query.getAll('mtt_class'), englishNames = query.getAll('mtt_english');
    if (!names.length && !classes.length && !englishNames.length) return { state: 'absent' };
    const allowedClasses = allowedClassNames(options);
    const limit = nameLimit(options), name = normalizedName(names[0], limit);
    const englishName = englishNames.length ? normalizedName(englishNames[0], limit) : undefined;
    const className = String(classes[0] || '').trim();
    if (names.length !== 1 || classes.length !== 1 || /[\u0000-\u001f\u007f-\u009f]/.test(String(classes[0] || '')) || !name || englishNames.length > 1 ||
        (englishNames.length && !englishName) || !allowedClasses || !allowedClasses.has(className)) {
      return { state: 'invalid' };
    }
    return englishName ? { state: 'valid', name: name, className: className, englishName: englishName } : { state: 'valid', name: name, className: className };
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
    let hint = selectedIdentity(incoming || read(), mapping);
    if (hint.state === 'absent') return value;
    const url = formTarget(value, mapping, baseUrl);
    if (!url) return value;
    let classValue = hint.className;
    if (hint.state === 'valid' && mapping.classValues) {
      classValue = mapping.classValues[hint.className];
      if (typeof classValue !== 'string' || canonicalClass(classValue) !== hint.className) hint = { state: 'invalid' };
    } else if (hint.state === 'valid' && mapping.classFormat !== undefined) {
      if (mapping.classFormat === 'title') classValue = hint.className.replace(/^FIGHTER /, 'Fighter ').replace(/^KIDS /, 'Kids ');
      else if (mapping.classFormat !== 'canonical') hint = { state: 'invalid' };
    }
    if (hint.state === 'valid') {
      url.searchParams.set('usp', 'pp_url');
      url.searchParams.set(mapping.nameEntry, hint.name);
      url.searchParams.set(mapping.classEntry, classValue);
    } else {
      url.searchParams.delete(mapping.nameEntry);
      url.searchParams.delete(mapping.classEntry);
    }
    return url.href;
  }
  function resolveFormRedirect(value, config, hint, baseUrl) {
    const rules = config && config.legacyRedirects;
    if (!rules || !hint || hint.state === 'absent' || !Array.isArray(rules.paths) || !Array.isArray(rules.routes)) return null;
    try {
      const base = new URL(baseUrl || root.location.href), url = new URL(value, base);
      if (url.protocol !== 'https:' || url.origin !== base.origin ||
          !rules.paths.some(path => path === url.pathname || path === url.pathname + '/')) return null;
      const code = String(url.searchParams.get(rules.queryKey || 'code') || '').trim().toUpperCase();
      const route = rules.routes.find(item => typeof item.codePattern === 'string' && item.codePattern.length <= 180 &&
        item.codePattern.startsWith('^') && item.codePattern.endsWith('$') && new RegExp(item.codePattern).test(code));
      if (!route || !/^entry\.\d+$/.test(route.assignmentEntry || '')) return null;
      const mapping = (config.forms || []).find(item => item.formId === route.formId && formTarget(route.url, item, base.href));
      if (!mapping || route.assignmentEntry === mapping.nameEntry || route.assignmentEntry === mapping.classEntry) return null;
      const destination = new URL(route.url);
      Object.entries(rules.destinationParams || {}).forEach(([key, entry]) => destination.searchParams.set(key, entry));
      destination.searchParams.set(route.assignmentEntry, code);
      return formUrl(destination.href, mapping, hint, base.href);
    } catch (_) { return null; }
  }
  function write(control, value) {
    const win = control.ownerDocument.defaultView;
    const proto = control.tagName === 'SELECT' ? win.HTMLSelectElement.prototype : win.HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    setter.call(control, value);
    control.dispatchEvent(new win.Event('input', { bubbles: true }));
    control.dispatchEvent(new win.Event('change', { bubbles: true }));
  }
  function fillPair(nameControl, classControl, incoming, mapping, onEdit, onRegister) {
    const hint = selectedIdentity(incoming || read(), mapping);
    if (hint.state === 'absent' || !nameControl || !classControl || pairs.has(nameControl)) return false;
    if (!/^(?:INPUT|SELECT)$/.test(classControl.tagName) || nameControl.tagName !== 'INPUT') return false;
    const matches = classControl.tagName !== 'SELECT' ? [hint.className] : Array.from(classControl.options).filter(option => {
      if (option.disabled || !option.value) return false;
      const value = canonicalClass(option.value), label = canonicalClass(option.textContent);
      return (value || label) === hint.className && !(value && label && value !== label);
    }).map(option => option.value);
    const allowed = new Set(matches).size === 1;
    const limit = nameControl.maxLength > 0 ? nameControl.maxLength : 120;
    const valid = hint.state === 'valid' && allowed && hint.name.length <= limit;
    const state = { writing: true, disposed: false, name: valid ? hint.name : '', className: valid ? matches[0] : '' };
    pairs.set(nameControl, state);
    // Existing controls stay editable; this hint neither starts nor submits.
    write(nameControl, state.name); write(classControl, state.className); state.writing = false;
    const remember = function() {
      if (state.writing || state.disposed) return;
      state.name = nameControl.value; state.className = classControl.value;
      if (onEdit) onEdit(nameControl, classControl);
    };
    [nameControl, classControl].forEach(control => {
      control.addEventListener('input', remember); control.addEventListener('change', remember);
    });
    const form = nameControl.form && nameControl.form === classControl.form ? nameControl.form : null;
    let reset = null;
    if (form) {
      reset = function() {
        // A normal form reset must not reintroduce a saved sibling's identity.
        root.setTimeout(function() {
          if (state.disposed) return;
          state.writing = true;
          write(nameControl, state.name); write(classControl, state.className); state.writing = false;
        }, 0);
      };
      form.addEventListener('reset', reset);
    }
    state.cleanup = function() {
      state.disposed = true;
      [nameControl, classControl].forEach(control => {
        control.removeEventListener('input', remember); control.removeEventListener('change', remember);
      });
      if (form && reset) form.removeEventListener('reset', reset);
      if (pairs.get(nameControl) === state) pairs.delete(nameControl);
    };
    if (onRegister) onRegister(state);
    return true;
  }
  function validatedIdentity(value, options) {
    if (value && value.state === 'absent') return { state: 'absent' };
    if (!value || value.state === 'invalid' || typeof value.name !== 'string' || typeof value.className !== 'string') return { state: 'invalid' };
    const query = new URLSearchParams();
    query.set('mtt_name', value.name); query.set('mtt_class', value.className);
    if (value.englishName !== undefined) {
      if (typeof value.englishName !== 'string') return { state: 'invalid' };
      query.set('mtt_english', value.englishName);
    }
    return read(query.toString(), options);
  }
  function install(options, targetWindow, explicitIdentity) {
    const config = options || {}, win = targetWindow || root, doc = win.document;
    let hint = explicitIdentity === undefined ? read(undefined, config) : validatedIdentity(explicitIdentity, config);
    const previousInstall = installations.get(doc);
    let bindingKey = null;
    try { bindingKey = JSON.stringify({ identity: hint, config: config }); } catch (_) {}
    if (previousInstall && bindingKey && previousInstall.bindingKey === bindingKey) {
      previousInstall.resume();
      return previousInstall.disconnect;
    }
    if (previousInstall) previousInstall.retire();
    if (hint.state === 'absent') return function() {};
    const registrations = [];
    let active = false, retired = false;
    const identityState = { name: hint.name || '', className: hint.className || '' };
    if (hint.englishName) identityState.englishName = hint.englishName;
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
      if (!active || retired) return;
      const changedLinks = changedAssignmentLinks(Array.isArray(records) ? records : []);
      (config.fieldPairs || []).forEach(pair => {
        if (pair.pathPrefixes !== undefined && (!Array.isArray(pair.pathPrefixes) || !pair.pathPrefixes.length ||
            pair.pathPrefixes.some(prefix => typeof prefix !== 'string' || !prefix.startsWith('/') || prefix.startsWith('//')) ||
            !pair.pathPrefixes.some(prefix => win.location.pathname.startsWith(prefix)))) return;
        fillPair(doc.querySelector(pair.name), doc.querySelector(pair.className), hint, pair, function(nameControl, classControl) {
          const className = canonicalClass(classControl.value) || (classControl.tagName === 'SELECT' ? canonicalClass(classControl.selectedOptions[0]?.textContent) : null);
          if (pair.nameSource === 'englishName') {
            identityState.englishName = nameControl.value;
            if (/^KIDS /.test(className || '')) identityState.name = nameControl.value;
          } else {
            if (normalizedName(identityState.name, nameLimit(config)) !== normalizedName(nameControl.value, nameLimit(config))) delete identityState.englishName;
            identityState.name = nameControl.value;
          }
          identityState.className = className || '';
          hint = validatedIdentity(identityState, config);
          apply();
        }, state => registrations.push(state));
      });
      doc.querySelectorAll('a[href]').forEach(anchor => {
        const previous = anchor.getAttribute('href');
        // Existing mobile navigation treats this attribute as authoritative.
        // Update it in the same callback, before href observers run.
        const canonical = anchor.getAttribute('data-google-form-url');
        let next = changedLinks.get(anchor) || canonical || previous;
        next = resolveFormRedirect(next, config, hint, win.location.href) || next;
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
    const disconnect = function() { active = false; observer.disconnect(); };
    const resume = function() {
      if (retired) return;
      active = true;
      observer.observe(doc.documentElement, { childList: true, subtree: true, attributes: true,
        attributeOldValue: true, attributeFilter: ['href', 'data-google-form-url'] });
      // BFcache restoration reconnects this closure, including intentional edits.
      apply();
      if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', apply, { once: true });
    };
    const installation = { bindingKey: bindingKey, disconnect: disconnect, resume: resume, retire: function() {
      retired = true; disconnect();
      doc.removeEventListener('DOMContentLoaded', apply);
      registrations.forEach(state => state.cleanup());
      if (installations.get(doc) === installation) installations.delete(doc);
    } };
    installations.set(doc, installation);
    resume();
    return disconnect;
  }
  root.MTTStudentPrefill = Object.freeze({ read: read, formUrl: formUrl, resolveFormRedirect: resolveFormRedirect, fillPair: fillPair, install: install });
})(window);
