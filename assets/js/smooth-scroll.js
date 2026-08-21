/**
 * smooth-scroll.js
 * Lenis-powered smooth scrolling + native anchor-link handling.
 * Exposes window.MJO.lenis and window.MJO.scrollTo() for other modules
 * (navigation.js needs to pause/resume scrolling while the menu is open).
 */
(function (window, document) {
  'use strict';

  var MJO = (window.MJO = window.MJO || {});
  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  var isNarrowViewport = window.innerWidth < 768;
  var reduceSmoothing = isCoarsePointer || isNarrowViewport;

  var lenis = null;

  function initLenis() {
    if (typeof window.Lenis !== 'function') return null;

    if (prefersReducedMotion) {
      // Respect reduced motion: skip custom smoothing entirely and let the
      // browser's native (instant) scrolling take over.
      return null;
    }

    return new window.Lenis({
      duration: reduceSmoothing ? 0.7 : 1.15,
      easing: function (t) {
        return Math.min(1, 1 - Math.pow(2, -10 * t));
      },
      orientation: 'vertical',
      smoothWheel: true,
      // Touch devices keep native momentum scrolling — overriding it feels
      // laggy and fights the OS's own inertia.
      syncTouch: false,
      touchMultiplier: reduceSmoothing ? 1 : 1.4,
      wheelMultiplier: 1
    });
  }

  function raf(time) {
    if (lenis) lenis.raf(time);
    window.requestAnimationFrame(raf);
  }

  function bindAnchorLinks() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      var target = document.querySelector(hash);
      if (!target) return; // let the browser handle unknown fragments normally

      event.preventDefault();
      MJO.scrollTo(target, { offset: -84 });

      if (history.pushState) {
        history.pushState(null, '', hash);
      }
    });
  }

  MJO.scrollTo = function (target, options) {
    options = options || {};
    if (lenis) {
      lenis.scrollTo(target, {
        offset: options.offset || 0,
        duration: options.duration
      });
      return;
    }
    // Fallback for reduced-motion / Lenis-unavailable environments.
    var el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.scrollY + (options.offset || 0);
    window.scrollTo({ top: top, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  };

  MJO.stopScroll = function () {
    if (lenis) lenis.stop();
  };

  MJO.startScroll = function () {
    if (lenis) lenis.start();
  };

  function init() {
    lenis = initLenis();
    MJO.lenis = lenis;
    window.requestAnimationFrame(raf);
    bindAnchorLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
