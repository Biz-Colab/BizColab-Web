/*! BizColab section nav — sticky "you are here" bar with scroll-spy.
   Usage: add data-nav="Label" (and an id) to each <section>; load this file with <script src="/assets/secnav.js" defer>.
   Optional on <body>: data-secnav-after="hero" (reveal after that element leaves view; default 240px). Skips pages that already ship .anchors or .subnav. */
(function () {
  'use strict';
  if (window.__bcSecNav || document.querySelector('.anchors,.subnav')) return;
  var secs = [].slice.call(document.querySelectorAll('[data-nav]'));
  if (secs.length < 3) return;
  window.__bcSecNav = true;

  var css = '' +
    '.bsn{position:fixed;left:0;right:0;z-index:90;background:rgba(255,255,255,.9);-webkit-backdrop-filter:saturate(180%) blur(14px);backdrop-filter:saturate(180%) blur(14px);' +
    'border-bottom:1px solid rgba(0,0,0,.09);transform:translateY(-110%);opacity:0;pointer-events:none;transition:transform .35s cubic-bezier(.2,.8,.2,1),opacity .25s ease;font-family:inherit}' +
    '.bsn.on{transform:none;opacity:1;pointer-events:auto}' +
    '.bsn-in{position:relative;max-width:1180px;margin:0 auto;padding:0 20px;display:flex;align-items:center;gap:2px;overflow-x:auto;scrollbar-width:none;-webkit-overflow-scrolling:touch;' +
    '-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 18px),transparent 100%);mask-image:linear-gradient(90deg,transparent 0,#000 18px,#000 calc(100% - 18px),transparent 100%)}' +
    '.bsn-in::-webkit-scrollbar{display:none}' +
    '.bsn a{flex:0 0 auto;display:inline-flex;align-items:center;gap:7px;padding:12px 11px;font-size:12.5px;line-height:1;font-weight:600;letter-spacing:-.005em;color:#6e6e73;text-decoration:none;white-space:nowrap;border-radius:8px;transition:color .15s ease,background .15s ease}' +
    '.bsn a:hover{color:#0a0a0a;background:rgba(0,0,0,.05)}' +
    '.bsn a:focus-visible{outline:2px solid #0a57ff;outline-offset:-2px}' +
    '.bsn a.cur{color:#0a0a0a}' +
    '.bsn-n{font-size:10px;font-weight:700;color:#aeaeb2;font-variant-numeric:tabular-nums;transition:color .15s ease}' +
    '.bsn a.cur .bsn-n{color:#0a57ff}' +
    '.bsn-ind{position:absolute;bottom:0;left:0;height:2px;width:0;background:#0a0a0a;border-radius:2px;transition:left .3s cubic-bezier(.2,.8,.2,1),width .3s cubic-bezier(.2,.8,.2,1)}' +
    '.bsn-bar{position:absolute;left:0;bottom:-1px;height:1px;width:0;background:#0a57ff;opacity:.55}' +
    '.bsn.dk{background:rgba(10,10,10,.86);border-bottom-color:rgba(255,255,255,.12)}' +
    '.bsn.dk a{color:#a1a1a6}.bsn.dk a:hover{color:#fff;background:rgba(255,255,255,.08)}.bsn.dk a.cur{color:#fff}.bsn.dk .bsn-ind{background:#fff}.bsn.dk .bsn-n{color:#6e6e73}.bsn.dk a.cur .bsn-n{color:#7aa7ff}' +
    '@media(max-width:600px){.bsn-in{padding:0 12px}.bsn a{padding:12px 9px;font-size:12px}}' +
    '@media(prefers-reduced-motion:reduce){.bsn,.bsn-ind{transition:none}}' +
    '@media print{.bsn{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  var nav = document.createElement('nav'); nav.className = 'bsn'; nav.setAttribute('aria-label', 'On this page');
  var inn = document.createElement('div'); inn.className = 'bsn-in';
  var links = secs.map(function (s, i) {
    if (!s.id) s.id = 'sec-' + (i + 1);
    var a = document.createElement('a'); a.href = '#' + s.id;
    a.innerHTML = '<span class="bsn-n">' + (i < 9 ? '0' : '') + (i + 1) + '</span>' + s.getAttribute('data-nav').replace(/&/g, '&amp;').replace(/</g, '&lt;');
    inn.appendChild(a); return a;
  });
  var ind = document.createElement('span'); ind.className = 'bsn-ind'; ind.setAttribute('aria-hidden', 'true'); inn.appendChild(ind);
  var bar = document.createElement('span'); bar.className = 'bsn-bar'; bar.setAttribute('aria-hidden', 'true');
  nav.appendChild(inn); nav.appendChild(bar); document.body.appendChild(nav);

  var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hdr = null;
  function findHeader() {
    var c = [].slice.call(document.querySelectorAll('.topbar,.bcx-bar,nav,header,[class*="topbar"],[class*="navbar"]')).filter(function (x) { return x !== nav; });
    for (var i = 0; i < c.length; i++) {
      var p = getComputedStyle(c[i]).position;
      if ((p === 'fixed' || p === 'sticky') && c[i].getBoundingClientRect().top <= 1 && c[i].offsetHeight < 140) return c[i];
    }
    return null;
  }
  function topOffset() {
    if (!hdr || !document.contains(hdr)) hdr = findHeader();
    if (hdr) { var b = hdr.getBoundingClientRect().bottom; return Math.max(0, Math.round(b)); }
    return 0;
  }
  // dark-page detection
  function lum(c) { var m = c.match(/[\d.]+/g); if (!m) return 1; if (m.length > 3 && +m[3] === 0) return 1; return (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255; }
  function theme() {
    var y = topOffset() + 30, els = document.elementsFromPoint(Math.round(innerWidth / 2), Math.min(innerHeight - 1, y + 60)), l = 1;
    for (var i = 0; i < els.length; i++) { if (nav.contains(els[i])) continue; var bg = getComputedStyle(els[i]).backgroundColor; if (bg && !/rgba?\(.*,\s*0\)$|transparent/.test(bg)) { l = lum(bg); break; } }
    nav.classList.toggle('dk', l < 0.35);
  }

  // align the first tab with the page's content column (mode of left-aligned section headings)
  function align() {
    if (innerWidth < 760) { inn.style.maxWidth = ''; inn.style.margin = ''; inn.style.paddingLeft = ''; return; }
    var counts = {}, best = 0, bl = null;
    secs.forEach(function (s) {
      var h = s.querySelector('h2,h1'); if (!h) return;
      var cs = getComputedStyle(h); if (cs.textAlign === 'center') return;
      var l = Math.round(h.getBoundingClientRect().left); if (l < 24 || l > innerWidth / 2) return;
      counts[l] = (counts[l] || 0) + 1; if (counts[l] > best) { best = counts[l]; bl = l; }
    });
    if (bl !== null) { inn.style.maxWidth = 'none'; inn.style.margin = '0'; inn.style.paddingLeft = Math.max(12, bl - 11) + 'px'; }
  }
  var cur = -1, afterEl = null, ticking = false, thresholdY = 240;
  var aft = document.body.getAttribute('data-secnav-after');
  if (aft) afterEl = document.querySelector(aft.charAt(0) === '.' || aft.charAt(0) === '#' ? aft : '.' + aft + ',#' + aft);

  function place() {
    var a = links[cur]; if (!a) { ind.style.width = '0'; return; }
    ind.style.left = a.offsetLeft + 'px'; ind.style.width = a.offsetWidth + 'px';
    var l = a.offsetLeft - inn.scrollLeft;
    if (l < 24 || l + a.offsetWidth > inn.clientWidth - 24) inn.scrollTo({ left: Math.max(0, a.offsetLeft - 40), behavior: rm ? 'auto' : 'smooth' });
  }
  function update() {
    ticking = false;
    var off = topOffset(), y = window.scrollY, h = document.documentElement;
    var barH = nav.offsetHeight || 40;
    nav.style.top = off + 'px';
    var show = afterEl ? afterEl.getBoundingClientRect().bottom < off + 40 : y > thresholdY;
    // hide again once past the last section's end (e.g. footer) — keep it simple: always visible once shown
    nav.classList.toggle('on', show);
    var probe = off + barH + 90, idx = -1;
    for (var i = 0; i < secs.length; i++) { if (secs[i].getBoundingClientRect().top <= probe) idx = i; }
    if (window.innerHeight + y >= h.scrollHeight - 4) idx = secs.length - 1;
    if (idx !== cur) {
      cur = idx;
      links.forEach(function (a, k) { var on = k === cur; a.classList.toggle('cur', on); if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
      place();
    }
    var max = h.scrollHeight - h.clientHeight; bar.style.width = (max > 0 ? Math.min(100, y / max * 100) : 0) + '%';
    if (show) theme();
  }
  function req() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', req, { passive: true });
  window.addEventListener('resize', function () { align(); req(); place(); });
  window.addEventListener('load', function () { align(); req(); place(); });

  inn.addEventListener('click', function (e) {
    var a = e.target.closest ? e.target.closest('a') : null; if (!a) return;
    var i = links.indexOf(a); if (i < 0) return; e.preventDefault();
    var t = secs[i], top = t.getBoundingClientRect().top + window.scrollY - (topOffset() + (nav.offsetHeight || 40)) + 1;
    window.scrollTo({ top: top, behavior: rm ? 'auto' : 'smooth' });
    if (history.replaceState) history.replaceState(null, '', '#' + t.id);
  });
  // deep links: land below the sticky chrome
  if (location.hash.length > 1) {
    window.addEventListener('load', function () {
      var t = document.getElementById(decodeURIComponent(location.hash.slice(1))); if (t && secs.indexOf(t) > -1) setTimeout(function () { window.scrollTo(0, t.getBoundingClientRect().top + window.scrollY - (topOffset() + 44)); }, 60);
    });
  }
  align(); update();
})();
