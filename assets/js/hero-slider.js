/**
 * hero-slider.js
 * 5-slide premium hero carousel for the homepage. Autoplay, prev/next,
 * keyboard, touch swipe, pause/resume, and full prefers-reduced-motion
 * support. No-ops entirely on pages without [data-hero-slider].
 */
(function (window, document) {
  'use strict';

  var root = document.querySelector('[data-hero-slider]');
  if (!root) return;

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var AUTOPLAY_MS = 6000;
  var SWIPE_THRESHOLD = 40;

  var slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide]'));
  var dots = Array.prototype.slice.call(root.querySelectorAll('[data-slide-dot]'));
  var prevBtn = root.querySelector('[data-slide-prev]');
  var nextBtn = root.querySelector('[data-slide-next]');
  var pauseBtn = root.querySelector('[data-slide-pause]');
  var counterEl = root.querySelector('[data-slide-current]');
  var iconPause = pauseBtn ? pauseBtn.querySelector('[data-icon-pause]') : null;
  var iconPlay = pauseBtn ? pauseBtn.querySelector('[data-icon-play]') : null;

  if (slides.length < 2) return;

  var index = 0;
  var timer = null;
  var userPaused = prefersReducedMotion;
  var hovered = false;

  function restartDotProgress(dot) {
    dot.classList.remove('is-active');
    void dot.offsetWidth; // force reflow so the CSS transition restarts
    dot.classList.add('is-active');
  }

  function render() {
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === index);
    });
    dots.forEach(function (dot, i) {
      var active = i === index;
      dot.setAttribute('aria-current', active ? 'true' : 'false');
      if (active) restartDotProgress(dot);
      else dot.classList.remove('is-active');
    });
    if (counterEl) counterEl.textContent = String(index + 1).padStart(2, '0');
  }

  function goTo(i) {
    index = (i + slides.length) % slides.length;
    render();
  }

  function next() { goTo(index + 1); }
  function prev() { goTo(index - 1); }

  function shouldAutoplay() {
    return !prefersReducedMotion && !userPaused && !hovered;
  }

  function stopTimer() {
    if (timer) { window.clearInterval(timer); timer = null; }
  }

  function startTimer() {
    stopTimer();
    if (!shouldAutoplay()) return;
    timer = window.setInterval(next, AUTOPLAY_MS);
  }

  function setPausedUI(paused) {
    if (!pauseBtn) return;
    pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pauseBtn.setAttribute('aria-label', paused ? 'Resume autoplay' : 'Pause autoplay');
    if (iconPause) iconPause.hidden = paused;
    if (iconPlay) iconPlay.hidden = !paused;
  }

  if (prevBtn) prevBtn.addEventListener('click', function () { prev(); startTimer(); });
  if (nextBtn) nextBtn.addEventListener('click', function () { next(); startTimer(); });
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { goTo(i); startTimer(); });
  });

  if (pauseBtn) {
    setPausedUI(userPaused);
    pauseBtn.addEventListener('click', function () {
      userPaused = !userPaused;
      setPausedUI(userPaused);
      startTimer();
    });
  }

  // Pause on hover/focus anywhere in the slider; resume on leave, unless
  // the visitor explicitly paused it via the pause button.
  root.addEventListener('mouseenter', function () { hovered = true; stopTimer(); });
  root.addEventListener('mouseleave', function () { hovered = false; startTimer(); });
  root.addEventListener('focusin', function () { hovered = true; stopTimer(); });
  root.addEventListener('focusout', function () { hovered = false; startTimer(); });

  // Keyboard: left/right arrows while focus is anywhere in the slider.
  root.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowLeft') { prev(); startTimer(); }
    else if (event.key === 'ArrowRight') { next(); startTimer(); }
  });

  // Touch swipe.
  var touchStartX = null;
  root.addEventListener('touchstart', function (event) {
    touchStartX = event.changedTouches[0].clientX;
  }, { passive: true });
  root.addEventListener('touchend', function (event) {
    if (touchStartX === null) return;
    var deltaX = event.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX < 0) next(); else prev();
    startTimer();
  }, { passive: true });

  render();
  startTimer();
})(window, document);
