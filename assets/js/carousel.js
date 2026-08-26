/**
 * carousel.js
 * One reusable multi-item carousel used for every "row of cards that slides"
 * section on the site: Featured Products, Machinery (flip cards), Certifications
 * and Our Partners. Configure it entirely through data attributes on the
 * [data-carousel] element — no per-section JS needed:
 *
 *   data-per-view="products"      one of the keys in PER_VIEW below
 *   data-autoplay="3500"          autoplay interval in ms (omit/0 to disable)
 *
 * Behaviour: autoplay, prev/next buttons, dot pagination, touch swipe,
 * pause on hover/focus, and full prefers-reduced-motion support (autoplay
 * off, instant page changes).
 */
(function (window, document) {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SWIPE_THRESHOLD = 40;

  // Cards visible at once, by breakpoint, per carousel type.
  var PER_VIEW = {
    products: { desktop: 4, tablet: 2, mobile: 1 },
    machines: { desktop: 3, tablet: 2, mobile: 1 },
    certificates: { desktop: 3, tablet: 2, mobile: 1 },
    partners: { desktop: 5, tablet: 3, mobile: 2 }
  };

  function itemsPerView(type) {
    var cfg = PER_VIEW[type] || PER_VIEW.products;
    var w = window.innerWidth;
    if (w >= 1024) return cfg.desktop;
    if (w >= 640) return cfg.tablet;
    return cfg.mobile;
  }

  function initCarousel(root) {
    var type = root.getAttribute('data-per-view') || 'products';
    var autoplayMs = parseInt(root.getAttribute('data-autoplay') || '0', 10);
    var viewport = root.querySelector('.carousel__viewport');
    var track = root.querySelector('[data-carousel-track]');
    var items = Array.prototype.slice.call(track.children);
    var prevBtn = root.querySelector('[data-carousel-prev]');
    var nextBtn = root.querySelector('[data-carousel-next]');
    var dotsWrap = root.querySelector('[data-carousel-dots]');

    if (!items.length) return;

    var perView = 1;
    var page = 0;
    var pageCount = 1;
    var timer = null;
    var hovered = false;

    function gapPx() {
      var styles = window.getComputedStyle(track);
      return parseFloat(styles.columnGap || styles.gap || '0') || 0;
    }

    function layout() {
      perView = Math.min(itemsPerView(type), items.length);
      var gap = gapPx();
      var viewportWidth = viewport.getBoundingClientRect().width;
      if (viewportWidth <= 0) {
        // Not laid out yet (e.g. still hidden behind a reveal animation) —
        // try again next frame instead of computing a broken 0/negative width.
        window.requestAnimationFrame(layout);
        return;
      }
      var itemWidth = (viewportWidth - gap * (perView - 1)) / perView;
      root.style.setProperty('--carousel-item-w', itemWidth + 'px');

      pageCount = Math.max(1, Math.ceil(items.length / perView));
      page = Math.min(page, pageCount - 1);
      renderDots();
      goToPage(page, true);
    }

    function renderDots() {
      dotsWrap.innerHTML = '';
      for (var i = 0; i < pageCount; i++) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'carousel__dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
        (function (index) {
          dot.addEventListener('click', function () { goToPage(index); restartAutoplay(); });
        })(i);
        dotsWrap.appendChild(dot);
      }
    }

    function updateDots() {
      Array.prototype.forEach.call(dotsWrap.children, function (dot, i) {
        dot.classList.toggle('is-active', i === page);
      });
      if (prevBtn) prevBtn.disabled = pageCount <= 1 && page === 0;
      if (nextBtn) nextBtn.disabled = pageCount <= 1 && page === 0;
    }

    function goToPage(index, instant) {
      page = (index + pageCount) % pageCount;
      var gap = gapPx();
      var itemWidth = parseFloat(root.style.getPropertyValue('--carousel-item-w')) || 0;
      var offset = page * perView * (itemWidth + gap);
      if (instant) track.classList.add('is-dragging'); // reuse to kill transition instantly
      track.style.transform = 'translateX(-' + offset + 'px)';
      if (instant) {
        void track.offsetWidth;
        track.classList.remove('is-dragging');
      }
      updateDots();
    }

    function next() { goToPage(page + 1); }
    function prev() { goToPage(page - 1); }

    function startAutoplay() {
      if (!autoplayMs || prefersReducedMotion || hovered || pageCount <= 1) return;
      stopAutoplay();
      timer = window.setInterval(next, autoplayMs);
    }
    function stopAutoplay() {
      if (timer) { window.clearInterval(timer); timer = null; }
    }
    function restartAutoplay() { stopAutoplay(); startAutoplay(); }

    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restartAutoplay(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restartAutoplay(); });

    root.addEventListener('mouseenter', function () { hovered = true; stopAutoplay(); });
    root.addEventListener('mouseleave', function () { hovered = false; startAutoplay(); });
    root.addEventListener('focusin', function () { hovered = true; stopAutoplay(); });
    root.addEventListener('focusout', function () { hovered = false; startAutoplay(); });

    // Touch / swipe.
    var touchStartX = null;
    viewport.addEventListener('touchstart', function (event) {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    viewport.addEventListener('touchend', function (event) {
      if (touchStartX === null) return;
      var deltaX = event.changedTouches[0].clientX - touchStartX;
      touchStartX = null;
      if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
      if (deltaX < 0) next(); else prev();
      restartAutoplay();
    }, { passive: true });

    var resizeTimer = null;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 150);
    });

    layout();
    startAutoplay();
  }

  // Flip cards rely on :hover / :focus-within for the 3D flip, which touch
  // devices can't trigger — so a tap toggles the same .is-flipped class.
  function initFlipCards() {
    document.addEventListener('click', function (event) {
      var card = event.target.closest('.flip-card');
      if (!card) return;
      if (event.target.closest('a, button')) return; // let real links/buttons work
      if (!window.matchMedia('(hover: none)').matches) return; // desktop already has hover
      card.classList.toggle('is-flipped');
    });
  }

  function init() {
    var carousels = document.querySelectorAll('[data-carousel]');
    // Each carousel is initialized in its own try/catch: if one carousel's
    // markup or data is malformed, it must never stop the others (or the
    // hero slider / flip cards) from starting.
    carousels.forEach(function (root) {
      try {
        initCarousel(root);
      } catch (err) {
        window.console && window.console.error('[carousel] failed to init', root, err);
      }
    });
    initFlipCards();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
