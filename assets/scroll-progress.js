/*! BizColab scroll-progress line — thin blue-to-orange bar pinned to the top of the viewport.
   Vanilla, no dependencies. Hidden on pages that don't scroll. */
(function () {
  'use strict';
  if (document.getElementById('bc-scroll-progress')) return;
  var bar = document.createElement('div');
  bar.id = 'bc-scroll-progress';
  bar.setAttribute('aria-hidden', 'true');
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;height:3px;z-index:2147483000;pointer-events:none;' +
    'background:linear-gradient(90deg,#0071e3,#ff9f0a);transform-origin:0 50%;transform:scaleX(0);opacity:0;transition:opacity .2s';
  var ticking = false;
  function paint() {
    ticking = false;
    var d = document.documentElement;
    var max = d.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(1, Math.max(0, (window.pageYOffset || d.scrollTop) / max)) : 0;
    bar.style.transform = 'scaleX(' + p + ')';
    bar.style.opacity = max > 0 ? '1' : '0';
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  function init() {
    document.body.appendChild(bar);
    paint();
    window.addEventListener('scroll', req, { passive: true });
    window.addEventListener('resize', req);
    window.addEventListener('load', req);
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
