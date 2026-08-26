/**
 * lightbox.js
 * Full-screen sliding image gallery for product detail pages. Clicking the
 * main product image opens an overlay showing every image in that
 * product's gallery, with its own auto-slide, prev/next, thumbnail strip,
 * swipe and keyboard support — the same interaction pattern as every other
 * slider on the site. No-ops on any page without a [data-gallery] block.
 */
(function (window, document) {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var AUTOPLAY_MS = 4500;
  var HOVER_RESUME_MS = 4000;
  var SWIPE_THRESHOLD = 40;

  function initLightbox(mediaRoot) {
    var lightbox = mediaRoot.querySelector('[data-lightbox]');
    var openTrigger = mediaRoot.querySelector('[data-lightbox-open]');
    var inlineThumbs = Array.prototype.slice.call(mediaRoot.querySelectorAll('[data-gallery-thumb]'));
    if (!lightbox || !openTrigger || !inlineThumbs.length) return;

    var sources = inlineThumbs.map(function (t) { return t.getAttribute('data-gallery-src'); });
    var stageImg = lightbox.querySelector('[data-lightbox-image]');
    var thumbsWrap = lightbox.querySelector('[data-lightbox-thumbs]');
    var prevBtn = lightbox.querySelector('[data-lightbox-prev]');
    var nextBtn = lightbox.querySelector('[data-lightbox-next]');
    var closeEls = Array.prototype.slice.call(lightbox.querySelectorAll('[data-lightbox-close]'));

    var index = 0;
    var timer = null;
    var hovered = false;
    var hoverResumeTimer = null;
    var lastFocused = null;

    // Build the lightbox's own thumbnail strip from the same image list as
    // the inline gallery thumbnails, so there is only one place the actual
    // list of images is written (the server-rendered inline thumbs).
    var lightboxThumbs = sources.map(function (src, i) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lightbox__thumb';
      var img = document.createElement('img');
      img.src = src;
      img.alt = '';
      img.loading = 'lazy';
      btn.appendChild(img);
      btn.addEventListener('click', function () { goTo(i); restartTimer(); });
      li.appendChild(btn);
      thumbsWrap.appendChild(li);
      return btn;
    });

    function render() {
      stageImg.src = sources[index];
      lightboxThumbs.forEach(function (t, i) { t.classList.toggle('is-active', i === index); });
    }
    function goTo(i) { index = (i + sources.length) % sources.length; render(); }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }

    function stopTimer() { if (timer) { window.clearInterval(timer); timer = null; } }
    function startTimer() {
      stopTimer();
      if (prefersReducedMotion || hovered || sources.length < 2) return;
      timer = window.setInterval(next, AUTOPLAY_MS);
    }
    function restartTimer() { stopTimer(); startTimer(); }

    function onHoverStart() {
      hovered = true;
      stopTimer();
      window.clearTimeout(hoverResumeTimer);
      hoverResumeTimer = window.setTimeout(function () { hovered = false; startTimer(); }, HOVER_RESUME_MS);
    }
    function onHoverEnd() {
      hovered = false;
      window.clearTimeout(hoverResumeTimer);
      startTimer();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowLeft') { prev(); restartTimer(); }
      else if (event.key === 'ArrowRight') { next(); restartTimer(); }
    }

    function open(startIndex) {
      lastFocused = document.activeElement;
      goTo(startIndex || 0);
      lightbox.hidden = false;
      document.body.classList.add('lightbox-open');
      startTimer();
      document.addEventListener('keydown', onKeydown);
      window.requestAnimationFrame(function () {
        if (closeEls[0] && closeEls[0].focus) closeEls[0].focus();
      });
    }
    function close() {
      lightbox.hidden = true;
      document.body.classList.remove('lightbox-open');
      stopTimer();
      document.removeEventListener('keydown', onKeydown);
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    openTrigger.addEventListener('click', function () { open(0); });
    closeEls.forEach(function (el) { el.addEventListener('click', close); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restartTimer(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restartTimer(); });

    lightbox.addEventListener('mouseenter', onHoverStart);
    lightbox.addEventListener('mouseleave', onHoverEnd);
    lightbox.addEventListener('focusin', onHoverStart);
    lightbox.addEventListener('focusout', onHoverEnd);

    var touchStartX = null;
    lightbox.addEventListener('touchstart', function (event) {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    lightbox.addEventListener('touchend', function (event) {
      if (touchStartX === null) return;
      var deltaX = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
      if (deltaX < 0) next(); else prev();
      restartTimer();
    }, { passive: true });
  }

  function init() {
    document.querySelectorAll('[data-gallery]').forEach(function (root) {
      try {
        initLightbox(root);
      } catch (err) {
        window.console && window.console.error('[lightbox] failed to init', root, err);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
