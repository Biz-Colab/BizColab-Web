/*! BizColab shared site nav. To change the menu, edit LINKS below — every page picks it up.
   Usage on a page: <link rel="stylesheet" href="/assets/site-nav.css"> in <head>,
   then <script src="/assets/site-nav.js"></script> as the first thing inside <body>.
   Add data-nav="overlay" to <body> to float over a hero (homepage). */
(function () {
  'use strict';
  if (document.getElementById('bcxNav')) return;
  var LINKS = [
    ['/#how', 'How it works'],
    ['/#cohort', 'The cohort'],
    ['/audit/', 'Business audit'],
    ['/advisory/', 'Advisory'],
    ['/plans/', 'Plans'],
    ['/compare/', 'Compare'],
    ['/reviews/', 'Reviews'],
    ['/#faq', 'FAQ']
  ];
  var CTA = ['/join/', 'Join'];
  var path = location.pathname.replace(/index\.html$/, '');
  var links = LINKS.map(function (l) {
    var cur = l[0].indexOf('#') < 0 && l[0] === path ? ' aria-current="page"' : '';
    return '<a href="' + l[0] + '"' + cur + '>' + l[1] + '</a>';
  }).join('');
  var html =
    '<header class="bcx-nav" id="bcxNav"><div class="bcx-nav-in">' +
    '<a class="bcx-logo" href="/">BizColab<span>.</span></a>' +
    '<nav class="bcx-links" aria-label="Main">' + links + '</nav>' +
    '<a class="bcx-nav-btn" href="' + CTA[0] + '">' + CTA[1] + '</a>' +
    '<button class="bcx-burger" id="bcxBurger" aria-label="Menu" aria-expanded="false"><i></i></button>' +
    '</div></header>';
  var s = document.currentScript;
  if (s && s.parentNode) s.insertAdjacentHTML('beforebegin', html);
  else document.body.insertAdjacentHTML('afterbegin', html);

  var n = document.getElementById('bcxNav'), b = document.getElementById('bcxBurger');
  function t(o) { n.classList.toggle('open', o); b.setAttribute('aria-expanded', o); }
  b.addEventListener('click', function () { t(!n.classList.contains('open')); });
  n.querySelectorAll('.bcx-links a').forEach(function (a) { a.addEventListener('click', function () { t(false); }); });
  document.addEventListener('click', function (e) { if (!n.contains(e.target)) t(false); });

  /* Overlay pages (homepage): the bar floats over the hero, hides as you scroll down,
     and comes back the moment you scroll up, so anchor jumps never strand the reader. */
  if (document.body && document.body.getAttribute('data-nav') === 'overlay') {
    var last = window.scrollY, ticking = false;
    function onScroll() {
      var y = window.scrollY;
      if (y < 80 || y < last - 4) n.classList.remove('bcx-hide');
      else if (y > last + 4 && !n.classList.contains('open')) n.classList.add('bcx-hide');
      last = y; ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  }
})();
