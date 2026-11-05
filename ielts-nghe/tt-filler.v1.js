/* Ms Trang Trieu Education — IELTS NGHE: filler answers ("...", "???", "xxx", "k biết") count as blank.
   Loaded in <head>, before the page's own script, so its "answered" checks can use window.ttFilled.
   It never changes answers, scores or submissions; it only decides what counts as "filled in". */
(function () {
  'use strict';
  if (window.ttFilled) return;
  var FILL_WORDS = ['k biet', 'ko biet', 'kh biet', 'khong biet', 'kbiet', 'kb', 'chiu', 'bo qua', 'idk', 'dunno', 'no idea', 'skip', 'pass', 'asdf', 'qwerty', 'abcd', 'xyz', 'blank', 'null', 'undefined'];
  var ROMAN = /^(i{1,3}|iv|vi{0,3}|ix|xi{0,2})$/i;
  function flat(v) { return String(v).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function isFiller(v) {
    var t = String(v == null ? '' : v).trim();
    if (!t) return false;
    if (!/[\p{L}\p{N}]/u.test(t)) return true;
    if (ROMAN.test(t)) return false;
    var p = flat(t);
    if (FILL_WORDS.indexOf(p) >= 0) return true;
    return /^(.)\1{2,}$/.test(p.replace(/ /g, ''));
  }
  window.TTFiller = window.TTFiller || { isFiller: isFiller };
  window.ttFilled = function (v) { var t = String(v == null ? '' : v).trim(); return !!t && !isFiller(t); };

  var bar = null;
  function onInput(e) {
    var el = e.target; if (!el || el.tagName !== 'INPUT' || el.type === 'hidden' || el.type === 'radio' || el.type === 'checkbox') return;
    el.classList.toggle('tt-filler-input', isFiller(el.value));
    var any = document.querySelector('.tt-filler-input');
    if (any && !bar) { bar = document.createElement('div'); bar.className = 'tt-filler-bar'; bar.innerHTML = 'Câu trả lời kiểu <b>"…", "???", "xxx"</b> được tính là <b>bỏ trống</b> — em chưa nộp được bài.'; document.body.appendChild(bar); }
    if (!any && bar) { bar.remove(); bar = null; }
  }
  var css = '.tt-filler-input{outline:2px solid #e0533d!important;background:#fff4f1!important}' +
    '.tt-filler-bar{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;background:#0b1238;color:#fff;font-weight:700;font-size:14px;padding:10px 16px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.3);pointer-events:none;max-width:calc(100vw - 32px);text-align:center;font-family:inherit}.tt-filler-bar b{color:#f2b51c}';
  function start() { var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st); document.addEventListener('input', onInput, true); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
