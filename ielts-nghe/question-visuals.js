/* One viewer for all source diagrams; never overlays answers or replaces content. */
(() => {
  'use strict';
  let dialog;
  let opener;
  let fitWidth;
  function resizeImage(width) {
    const pan = dialog.querySelector('.visual-pan');
    const image = pan.querySelector('img');
    const previousWidth = image.getBoundingClientRect().width || width;
    const x = (pan.scrollLeft + pan.clientWidth / 2) / previousWidth;
    const y = (pan.scrollTop + pan.clientHeight / 2) / previousWidth;
    image.style.setProperty('--visual-width', width + 'px');
    pan.scrollTo(x * width - pan.clientWidth / 2, y * width - pan.clientHeight / 2);
  }
  function show(image, button) {
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'question-visual-dialog';
      dialog.setAttribute('aria-label', 'Hình đề bài phóng to');
      dialog.innerHTML = '<header><strong>Hình đề bài</strong><button type="button" data-close>Đóng ✕</button></header><div class="visual-toolbar"><button type="button" data-minus aria-label="Thu nhỏ">−</button><button type="button" data-plus aria-label="Phóng to">+</button><button type="button" data-fit>Vừa màn hình</button></div><p>Bấm + để xem rõ chi tiết, cuộn ngang/dọc để xem các phần của hình.</p><div class="visual-pan"><img alt=""></div>';
      document.body.append(dialog);
      dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
      dialog.querySelector('[data-plus]').addEventListener('click', () => resizeImage(Math.min(4000, dialog.querySelector('img').getBoundingClientRect().width * 1.5)));
      dialog.querySelector('[data-minus]').addEventListener('click', () => resizeImage(Math.max(fitWidth, dialog.querySelector('img').getBoundingClientRect().width / 1.5)));
      dialog.querySelector('[data-fit]').addEventListener('click', () => resizeImage(fitWidth));
      dialog.addEventListener('close', () => opener?.isConnected && opener.focus());
    }
    opener = button;
    const enlarged = dialog.querySelector('img');
    enlarged.src = image.currentSrc || image.src;
    enlarged.alt = image.alt;
    enlarged.style.setProperty('--visual-width', '100%');
    dialog.showModal();
    fitWidth = Math.min(dialog.querySelector('.visual-pan').clientWidth, innerHeight * .62 * image.naturalWidth / image.naturalHeight, image.naturalWidth);
    resizeImage(fitWidth);
    dialog.querySelector('.visual-pan').scrollTo(0, 0);
  }
  function enhance() {
    document.querySelectorAll('img[src*="question-assets/"]').forEach(image => {
      if (image.dataset.zoomReady || image.closest('.question-visual-dialog')) return;
      image.dataset.zoomReady = 'true';
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'question-visual-zoom';
      button.textContent = 'Phóng to hình đề bài';
      button.addEventListener('click', () => show(image, button));
      image.after(button);
    });
  }
  enhance();
  new MutationObserver(enhance).observe(document.getElementById('content') || document.body, {childList:true,subtree:true});
})();
