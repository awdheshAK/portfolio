/**
 * navigation.js
 * Header scroll state, full-screen navigation panel (open/close, focus trap,
 * ESC to close), desktop hover-driven image cards, and mobile accordion
 * submenus. Written in vanilla JS + a light touch of jQuery 4.0.0 for DOM
 * convenience, per the project's stack requirements.
 */
(function (window, document, $) {
  'use strict';

  var MJO = (window.MJO = window.MJO || {});

  var header = document.querySelector('[data-header]');
  var nav = document.querySelector('[data-site-nav]');
  var toggleBtn = document.querySelector('[data-menu-toggle]');
  var closeBtn = document.querySelector('[data-menu-close]');
  var navItems = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-nav-item]')) : [];
  var navCards = nav ? Array.prototype.slice.call(nav.querySelectorAll('[data-nav-card]')) : [];
  var defaultCard = nav ? nav.querySelector('[data-nav-card="default"]') : null;

  var isOpen = false;
  var lastFocusedElement = null;
  var MOBILE_BREAKPOINT = 992;

  /* ---------------------------------------------------------------------
     Header scroll state — IntersectionObserver on a 1px sentinel instead
     of a scroll listener, so there is zero scroll-handler cost.
     ------------------------------------------------------------------- */
  function initHeaderScrollState() {
    // Only the homepage's transparent-over-hero header needs a scroll
    // state at all — every interior page's header is solid by default in
    // CSS (.site-header), so there is nothing to observe there.
    if (!header || !header.classList.contains('site-header--overlay')) return;

    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.insertBefore(sentinel, document.body.firstChild);

    if (!('IntersectionObserver' in window)) {
      header.classList.add('is-scrolled');
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      },
      { rootMargin: '-1px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(sentinel);
  }

  /* ---------------------------------------------------------------------
     Focus trap
     ------------------------------------------------------------------- */
  function getFocusable(container) {
    return Array.prototype.slice.call(
      container.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(function (el) {
      return el.offsetParent !== null;
    });
  }

  function trapFocus(event) {
    if (event.key !== 'Tab' || !nav) return;
    var focusable = getFocusable(nav);
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ---------------------------------------------------------------------
     Open / close
     ------------------------------------------------------------------- */
  function openNav() {
    if (isOpen || !nav) return;
    isOpen = true;
    lastFocusedElement = document.activeElement;

    document.documentElement.classList.add('nav-open');
    document.body.classList.add('nav-open');
    header.classList.add('nav-open');

    nav.classList.add('is-open');
    nav.removeAttribute('inert');
    nav.setAttribute('aria-hidden', 'false');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Close menu');

    MJO.stopScroll && MJO.stopScroll();

    document.addEventListener('keydown', onKeydown);

    window.setTimeout(function () {
      if (closeBtn) closeBtn.focus();
    }, 60);
  }

  function closeNav() {
    if (!isOpen || !nav) return;
    isOpen = false;

    document.documentElement.classList.remove('nav-open');
    document.body.classList.remove('nav-open');
    header.classList.remove('nav-open');

    nav.classList.remove('is-open');
    nav.setAttribute('aria-hidden', 'true');
    nav.setAttribute('inert', '');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Open menu');

    MJO.startScroll && MJO.startScroll();

    document.removeEventListener('keydown', onKeydown);

    navItems.forEach(function (item) {
      item.classList.remove('is-expanded');
    });

    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeNav();
      return;
    }
    trapFocus(event);
  }

  /* ---------------------------------------------------------------------
     Desktop image-card swap on hover / focus
     ------------------------------------------------------------------- */
  function setActiveCard(key) {
    if (!navCards.length) return;
    var target = null;
    navCards.forEach(function (card) {
      var match = card.getAttribute('data-nav-card') === key;
      card.classList.toggle('is-active', match);
      if (match) target = card;
    });
    if (!target && defaultCard) defaultCard.classList.add('is-active');
  }

  function initCardSwap() {
    if (!navCards.length) return;
    navItems.forEach(function (item) {
      var link = item.querySelector('[data-nav-link]');
      if (!link) return;
      var key = link.getAttribute('data-card');
      if (!key) return;

      link.addEventListener('mouseenter', function () { setActiveCard(key); });
      link.addEventListener('focus', function () { setActiveCard(key); });
    });

    nav.addEventListener('mouseleave', function () { setActiveCard('default'); });
  }

  /* ---------------------------------------------------------------------
     Mobile accordion submenus
     ------------------------------------------------------------------- */
  function initAccordion() {
    navItems.forEach(function (item, index) {
      var link = item.querySelector('[data-nav-link]');
      var sublist = item.querySelector('[data-nav-sublist]');
      if (!link || !sublist) return;

      var subId = 'nav-sublist-' + index;
      sublist.id = subId;
      link.setAttribute('aria-controls', subId);
      link.setAttribute('aria-expanded', 'false');

      link.addEventListener('click', function (event) {
        if (window.innerWidth > MOBILE_BREAKPOINT) return; // desktop uses hover
        event.preventDefault();
        var expanded = item.classList.toggle('is-expanded');
        link.setAttribute('aria-expanded', String(expanded));
      });
    });
  }

  /* ---------------------------------------------------------------------
     Init
     ------------------------------------------------------------------- */
  function init() {
    initHeaderScrollState();

    if (!nav || !toggleBtn) return;

    toggleBtn.addEventListener('click', function () {
      if (isOpen) closeNav(); else openNav();
    });
    if (closeBtn) closeBtn.addEventListener('click', closeNav);

    // Close the panel when a click actually results in navigation. Links
    // that own a submenu act as mobile accordion triggers instead (handled
    // in initAccordion, which calls preventDefault) so they're excluded
    // from that case only on narrow viewports.
    $(nav).on('click', '.site-nav__link, .site-nav__sublist a', function () {
      var hasSublist = this.hasAttribute('aria-controls');
      var isMobileAccordionTrigger = hasSublist && window.innerWidth <= MOBILE_BREAKPOINT;
      if (isMobileAccordionTrigger) return;
      closeNav();
    });

    initCardSwap();
    initAccordion();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document, window.jQuery);
