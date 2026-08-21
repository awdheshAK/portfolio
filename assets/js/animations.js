/**
 * animations.js
 * Scroll-reveal system (IntersectionObserver), page-load entrance sequence,
 * and an opt-in stat counter — used only where real numeric data is wired
 * up via data-count-to. All motion respects prefers-reduced-motion.
 */
(function (window, document) {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     Scroll reveals
     ------------------------------------------------------------------- */
  function initScrollReveals() {
    // Hero items are handled by initHeroEntrance() on load, not on scroll.
    var items = Array.prototype.slice
      .call(document.querySelectorAll('[data-reveal]'))
      .filter(function (el) { return !el.closest('.hero'); });
    if (!items.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);

          window.setTimeout(function () {
            el.classList.add('is-visible');
          }, delay);

          observer.unobserve(el);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    items.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Stat counters — only activates on elements carrying a real numeric
     data-count-to value; placeholder stats ("[XX]+") are left untouched.
     ------------------------------------------------------------------- */
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count-to'));
    if (isNaN(target)) return;

    if (prefersReducedMotion) {
      el.textContent = target;
      return;
    }

    var duration = 1400;
    var start = null;
    var suffix = el.getAttribute('data-count-suffix') || '';

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + suffix;
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  function initStatCounters() {
    var stats = Array.prototype.slice.call(document.querySelectorAll('[data-count-to]'));
    if (!stats.length || !('IntersectionObserver' in window)) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );

    stats.forEach(function (el) { observer.observe(el); });
  }

  /* ---------------------------------------------------------------------
     Hero entrance sequence — CSS handles the actual transform/opacity via
     [data-reveal]; this just triggers it a beat after load so the page
     doesn't feel like it's animating before paint has settled.
     ------------------------------------------------------------------- */
  function initHeroEntrance() {
    var hero = document.querySelector('.hero');
    if (!hero) return;
    var items = Array.prototype.slice.call(hero.querySelectorAll('[data-reveal]'));
    if (!items.length) return;

    if (prefersReducedMotion) {
      items.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    window.requestAnimationFrame(function () {
      window.setTimeout(function () {
        items.forEach(function (el) {
          var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
          window.setTimeout(function () { el.classList.add('is-visible'); }, delay);
        });
      }, 120);
    });
  }

  function initHeroParallax() {
    var heroImage = document.querySelector('[data-hero-image]');
    if (!heroImage || prefersReducedMotion) return;
    // Settle the initial 1.08x scale (set in CSS) back to 1x for a subtle
    // one-time reveal zoom-out — no scroll listener involved.
    window.requestAnimationFrame(function () {
      heroImage.style.transform = 'scale(1)';
    });
  }

  function init() {
    initHeroEntrance();
    initHeroParallax();
    initScrollReveals();
    initStatCounters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
