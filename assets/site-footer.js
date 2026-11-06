/*! BizColab shared site footer. Edit LINKS and SOCIAL below; every page that loads this picks it up.
   Usage: <link rel="stylesheet" href="/assets/site-footer.css"> in <head>,
   then <script src="/assets/site-footer.js"></script> where the footer should render (end of <body>). */
(function () {
  'use strict';
  if (document.getElementById('bcxFoot')) return;
  var LINKS = [
    ['/#how', 'How it works'],
    ['/#cohort', 'The cohort'],
    ['/audit/', 'Deep Audit'],
    ['/advisory/', 'Advisory'],
    ['/plans/', 'Plans'],
    ['/compare/', 'Compare'],
    ['/reviews/', 'Reviews']
  ];
  var IG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1 0-1.5.2-1.9.3-.5.2-.8.4-1.1.7-.3.3-.6.6-.7 1.1-.1.4-.3.8-.3 1.9C3.2 9.3 3.2 9.6 3.2 12s0 3.5.1 4.7c0 1.1.2 1.5.3 1.9.2.5.4.8.7 1.1.3.3.6.6 1.1.7.4.1.8.3 1.9.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1 0 1.5-.2 1.9-.3.5-.2.8-.4 1.1-.7.3-.3.6-.6.7-1.1.1-.4.3-.8.3-1.9.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-1.1-.2-1.5-.3-1.9-.2-.5-.4-.8-.7-1.1-.3-.3-.6-.6-1.1-.7-.4-.1-.8-.3-1.9-.3C15.5 4 15.1 4 12 4zm0 3a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4zm5.2-3.1a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"/></svg>';
  var LI = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.4 2H3.6C2.7 2 2 2.7 2 3.6v16.8c0 .9.7 1.6 1.6 1.6h16.8c.9 0 1.6-.7 1.6-1.6V3.6c0-.9-.7-1.6-1.6-1.6zM8 19H5V9.5h3V19zM6.5 8.2a1.7 1.7 0 1 1 0-3.4 1.7 1.7 0 0 1 0 3.4zM19 19h-3v-4.6c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V19h-3V9.5h2.9v1.3h.1c.4-.8 1.4-1.6 2.9-1.6 3.1 0 3.6 2 3.6 4.6V19z"/></svg>';
  var MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm1 2.4V17h16V7.4l-8 5.3-8-5.3zM4.6 7l7.4 4.9L19.4 7H4.6z"/></svg>';
  var SOCIAL = [
    ['https://www.instagram.com/bizcolab/', 'Instagram', IG],
    ['https://www.linkedin.com/company/bizcolabteam/', 'LinkedIn', LI],
    ['mailto:michael@bizcolab.com', 'michael@bizcolab.com', MAIL]
  ];
  var links = LINKS.map(function (l) { return '<li><a href="' + l[0] + '">' + l[1] + '</a></li>'; }).join('');
  var social = SOCIAL.map(function (s) {
    var ext = s[0].indexOf('http') === 0 ? ' target="_blank" rel="noopener"' : '';
    return '<li><a href="' + s[0] + '"' + ext + '>' + s[2] + s[1] + '</a></li>';
  }).join('');
  var html =
    '<footer class="bcx-foot" id="bcxFoot"><div class="bcx-foot-in">' +
    '<div class="bcx-foot-grid">' +
    '<div><a class="bcx-foot-logo" href="/">BizColab<span>.</span></a>' +
    '<p class="bcx-foot-tag">Empowering entrepreneurs through collaboration. Small rooms of founders, honest questions, real next steps.</p>' +
    '<p class="bcx-foot-city">Los Angeles</p></div>' +
    '<div><h4>Explore</h4><ul>' + links + '</ul></div>' +
    '<div><h4>Connect</h4><ul>' + social + '</ul></div>' +
    '</div>' +
    '<div class="bcx-foot-bar"><span>&copy; ' + new Date().getFullYear() + ' BizColab</span><span><a href="/privacy/">Privacy</a><a href="mailto:michael@bizcolab.com">Contact</a></span></div>' +
    '</div></footer>';
  var s = document.currentScript;
  if (s && s.parentNode) s.insertAdjacentHTML('beforebegin', html);
  else document.body.insertAdjacentHTML('beforeend', html);
})();
