/**
 * hero-slider.js
 * 5-slide premium hero carousel for the homepage. Autoplay, prev/next,
 * keyboard, touch swipe and pause/resume. No-ops entirely on pages
 * without [data-hero-slider].
 *
 * Autoplay always runs by default, even when the browser/OS reports
 * prefers-reduced-motion: reduce — some Windows setups report this
 * unintentionally, and it was silently disabling autoplay entirely.
 * The slide transition itself still respects that preference (see
 * main.css), and the visible pause button always lets a visitor stop
 * it, which satisfies the same accessibility goal without surprising
 * anyone who never touches the pause button.
 */
(function (window, document) {
  'use strict';

  var root = document.querySelector('[data-hero-slider]');
  if (!root) return;

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
  var userPaused = false;
  var hovered = false;
  var hoverResumeTimer = null;
  // A visitor's cursor often just rests over the hero while they read it —
  // that must never look like a broken/frozen slider. Pausing on hover is
  // still honoured for a few seconds, then autoplay resumes anyway even if
  // the cursor never actually leaves.
  var HOVER_RESUME_MS = 4000;

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
    return !userPaused && !hovered;
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
  // the visitor explicitly paused it via the pause button. If the cursor
  // simply stays put over the slider, autoplay resumes anyway after
  // HOVER_RESUME_MS so it never looks stuck.
  function onHoverStart() {
    hovered = true;
    stopTimer();
    window.clearTimeout(hoverResumeTimer);
    hoverResumeTimer = window.setTimeout(function () {
      hovered = false;
      startTimer();
    }, HOVER_RESUME_MS);
  }
  function onHoverEnd() {
    hovered = false;
    window.clearTimeout(hoverResumeTimer);
    startTimer();
  }
  root.addEventListener('mouseenter', onHoverStart);
  root.addEventListener('mouseleave', onHoverEnd);
  root.addEventListener('focusin', onHoverStart);
  root.addEventListener('focusout', onHoverEnd);

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
