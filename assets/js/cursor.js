/**
 * cursor.js
 * A small custom cursor effect for devices with a real mouse: a dot that
 * tracks the pointer exactly, plus a ring that follows with a slight,
 * smooth lag and grows over links, buttons and cards. No-ops entirely on
 * touch/coarse-pointer devices and under prefers-reduced-motion (a
 * moving cursor effect is exactly the kind of motion that preference
 * asks to skip — unlike slider autoplay, this has no content or
 * navigation impact if disabled).
 */
(function (window, document) {
  'use strict';

  if (window.matchMedia('(pointer: coarse)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var HOVER_SELECTOR = 'a, button, .btn, [role="button"], input, textarea, select, .product-card, .flip-card, .carousel__dot';

  function init() {
    var dot = document.createElement('div');
    dot.className = 'cursor-dot';
    var ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.documentElement.classList.add('has-custom-cursor');

    var mouseX = -100, mouseY = -100;
    var ringX = -100, ringY = -100;
    var visible = false;

    document.addEventListener('mousemove', function (event) {
      mouseX = event.clientX;
      mouseY = event.clientY;
      dot.style.transform = 'translate(' + mouseX + 'px,' + mouseY + 'px)';
      if (!visible) {
        visible = true;
        dot.classList.add('is-visible');
        ring.classList.add('is-visible');
      }
    });
    document.addEventListener('mouseleave', function () {
      visible = false;
      dot.classList.remove('is-visible');
      ring.classList.remove('is-visible');
    });

    function raf() {
      // Ease the ring toward the pointer for a soft trailing feel.
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      ring.style.transform = 'translate(' + ringX + 'px,' + ringY + 'px)';
      window.requestAnimationFrame(raf);
    }
    window.requestAnimationFrame(raf);

    document.addEventListener('mouseover', function (event) {
      if (event.target.closest && event.target.closest(HOVER_SELECTOR)) {
        ring.classList.add('is-hovering');
      }
    });
    document.addEventListener('mouseout', function (event) {
      if (event.target.closest && event.target.closest(HOVER_SELECTOR)) {
        ring.classList.remove('is-hovering');
      }
    });

    document.addEventListener('mousedown', function () { ring.classList.add('is-active'); });
    document.addEventListener('mouseup', function () { ring.classList.remove('is-active'); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window, document);
