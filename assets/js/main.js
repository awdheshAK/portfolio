/**
 * main.js
 * Final orchestration step, loaded last. Handles small page-wide details
 * that don't belong in a dedicated module (footer year, external-link
 * hardening). Navigation, smooth-scroll, animations and analytics each
 * self-initialize in their own files.
 */
(function (window, document, $) {
  'use strict';

  function setFooterYear() {
    var el = document.querySelector('[data-current-year]');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // Any same-origin-unaware external link (target="_blank") gets
  // rel="noopener" as a safety net, even if a template omits it.
  function hardenExternalLinks() {
    $('a[target="_blank"]').each(function () {
      var rel = (this.getAttribute('rel') || '').split(/\s+/);
      if (rel.indexOf('noopener') === -1) rel.push('noopener');
      this.setAttribute('rel', rel.join(' ').trim());
    });
  }

  function init() {
    setFooterYear();
    hardenExternalLinks();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document, window.jQuery);
