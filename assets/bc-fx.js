/*! BizColab interactive layer — vanilla, no dependencies.
   Counters · card tilt · scroll-drawn timeline · live seat meter · fit-check quiz · confetti.
   Everything is feature-detected by selector, so one file is safe on any page. */
(function () {
  'use strict';
  var RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FINE = window.matchMedia && matchMedia('(hover:hover) and (pointer:fine)').matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  function css(t) { var s = document.createElement('style'); s.textContent = t; document.head.appendChild(s); }
  function ready(f) { if (document.readyState !== 'loading') f(); else document.addEventListener('DOMContentLoaded', f); }
  function inView(els, cb, opt) {
    if (!('IntersectionObserver' in window)) { els.forEach(cb); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); cb(e.target); } }); }, opt || { threshold: .4 });
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------- 1. Counters ---------- */
  function counters() {
    var els = $$('.bcx-strip b').concat($$('#apply .font-display').filter(function (e) { return /^\d+$/.test(e.textContent.trim()); }));
    els.forEach(function (el) {
      var raw = el.textContent, m = raw.match(/^(\s*)(\d+)(.*)$/s); if (!m) return;
      el.setAttribute('data-count-done', '0');
      var n = +m[2], pre = m[1], post = m[3];
      el.style.fontVariantNumeric = 'tabular-nums';
      if (RM || n < 2) return;
      el.textContent = pre + '0' + post;
      inView([el], function () {
        var t0 = performance.now(), d = 1100 + Math.min(n, 100) * 6;
        (function step(t) {
          var p = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - p, 3);
          el.textContent = pre + Math.round(n * e) + post;
          if (p < 1) requestAnimationFrame(step);
        })(t0);
      }, { threshold: .6 });
    });
  }

  /* ---------- 2. Card tilt ---------- */
  function tilt() {
    if (RM || !FINE) return;
    css('.fx-tilt{transition:transform .18s ease-out,box-shadow .25s ease;will-change:transform}.fx-tilt.fx-hot{transition:transform .06s linear;box-shadow:0 18px 40px -18px rgba(10,10,10,.28)}' +
      '.fx-glare{position:absolute;inset:0;border-radius:inherit;pointer-events:none;opacity:0;transition:opacity .25s ease;mix-blend-mode:soft-light}.fx-hot>.fx-glare{opacity:1}');
    $$('#pillars .rounded-3xl, #how .rounded-3xl').forEach(function (c) {
      c.classList.add('fx-tilt'); if (getComputedStyle(c).position === 'static') c.style.position = 'relative';
      var g = document.createElement('span'); g.className = 'fx-glare'; c.appendChild(g);
      c.addEventListener('pointermove', function (e) {
        var r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.classList.add('fx-hot');
        c.style.transform = 'perspective(900px) rotateX(' + ((.5 - y) * 7).toFixed(2) + 'deg) rotateY(' + ((x - .5) * 9).toFixed(2) + 'deg) translateY(-3px)';
        g.style.background = 'radial-gradient(circle at ' + (x * 100).toFixed(0) + '% ' + (y * 100).toFixed(0) + '%,rgba(255,255,255,.9),transparent 55%)';
      });
      c.addEventListener('pointerleave', function () { c.classList.remove('fx-hot'); c.style.transform = ''; });
    });
  }

  /* ---------- 3. Scroll-drawn timeline (How it runs) ---------- */
  function timeline() {
    var sec = $('#how'); if (!sec) return;
    var grid = $('.grid', sec); if (!grid) return;
    var cards = [].slice.call(grid.children); if (cards.length < 4) return;
    css('.fx-tl{display:none;position:relative;height:34px;margin-top:44px}' +
      '@media(min-width:768px){.fx-tl{display:block}}' +
      '.fx-tl-line{position:absolute;left:12.5%;right:12.5%;top:16px;height:2px;background:#e8e8ed;border-radius:2px;overflow:hidden}' +
      '.fx-tl-fill{display:block;height:100%;width:0;background:linear-gradient(90deg,#0071e3,#5e5ce6,#9a4ef6,#ff6f5e);border-radius:2px}' +
      '.fx-tl-dot{position:absolute;top:8px;width:18px;height:18px;margin-left:-9px;border-radius:50%;background:#fff;border:2px solid #d2d2d7;transition:border-color .3s ease,background .3s ease,transform .3s cubic-bezier(.2,.9,.3,1.4)}' +
      '.fx-tl-dot.on{background:var(--c);border-color:var(--c);transform:scale(1.25)}' +
      '.fx-tl+.grid,.fx-tl~.grid{margin-top:8px!important}' +
      '.fx-step{transition:opacity .5s ease,transform .5s cubic-bezier(.2,.7,.2,1)}.fx-step.fx-wait{opacity:.35;transform:translateY(10px)}');
    var colors = ['#0071e3', '#5e5ce6', '#9a4ef6', '#ff6f5e'];
    var tl = document.createElement('div'); tl.className = 'fx-tl'; tl.setAttribute('aria-hidden', 'true');
    tl.innerHTML = '<div class="fx-tl-line"><i class="fx-tl-fill"></i></div>';
    var dots = colors.map(function (c, i) { var d = document.createElement('span'); d.className = 'fx-tl-dot'; d.style.left = (12.5 + i * 25) + '%'; d.style.setProperty('--c', c); tl.appendChild(d); return d; });
    grid.parentNode.insertBefore(tl, grid); grid.style.marginTop = '8px';
    var fill = $('.fx-tl-fill', tl);
    cards.forEach(function (c) { c.classList.add('fx-step'); if (!RM) c.classList.add('fx-wait'); });
    function upd() {
      var r = grid.getBoundingClientRect(), vh = innerHeight;
      var p = RM ? 1 : Math.max(0, Math.min(1, (vh * .78 - r.top) / (r.height + vh * .25)));
      fill.style.width = (p * 100).toFixed(1) + '%';
      dots.forEach(function (d, i) { var on = p >= (i + .35) / 4 - (i === 0 ? .25 : 0); d.classList.toggle('on', on); cards[i].classList.toggle('fx-wait', !on && !RM); });
    }
    var tk = false; addEventListener('scroll', function () { if (!tk) { tk = true; requestAnimationFrame(function () { tk = false; upd(); }); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }

  /* ---------- 4. Live seat meter ---------- */
  function seats() {
    var host = $('#apply'); if (!host) return;
    var anchor = $('.mt-12', host) || $('.rounded-\\[32px\\]', host); if (!anchor) return;
    css('.fx-seats{max-width:42rem;margin:34px auto 0;display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;font-size:14px;color:#1d1d1f}' +
      '.fx-seat-dots{display:flex;gap:7px}.fx-seat-dots i{width:14px;height:14px;border-radius:50%;border:2px solid #0a0a0a;background:transparent;transition:background .3s ease,transform .3s ease}' +
      '.fx-seat-dots i.t{background:#0a0a0a}.fx-seat-dots i.o{border-color:#30d158;background:#30d158;box-shadow:0 0 0 0 rgba(48,209,88,.5);animation:fxp 2.2s ease-out infinite}' +
      '@keyframes fxp{0%{box-shadow:0 0 0 0 rgba(48,209,88,.45)}70%{box-shadow:0 0 0 8px rgba(48,209,88,0)}100%{box-shadow:0 0 0 0 rgba(48,209,88,0)}}' +
      '.fx-seats b{font-weight:600}.fx-seats small{color:#6e6e73;font-size:12.5px}@media(prefers-reduced-motion:reduce){.fx-seat-dots i.o{animation:none}}');
    function draw(d) {
      var total = Math.max(1, +d.total || 6), taken = Math.max(0, Math.min(total, +d.taken || 0)), open = total - taken;
      var el = $('.fx-seats') || document.createElement('div'); el.className = 'fx-seats'; el.setAttribute('role', 'status');
      var dots = ''; for (var i = 0; i < total; i++) dots += '<i class="' + (i < taken ? 't' : 'o') + '"></i>';
      el.innerHTML = '<span class="fx-seat-dots" aria-hidden="true">' + dots + '</span><span><b>' + (open ? open + ' of ' + total + ' seats open' : 'Cohort full') + '</b>' + (d.cohort ? ' &middot; ' + String(d.cohort).replace(/[<>&]/g, '') : '') + '</span>' +
        (d.note ? '<small>' + String(d.note).replace(/[<>&]/g, '') + '</small>' : '');
      if (!el.parentNode) anchor.parentNode.insertBefore(el, anchor);
    }
    draw({ total: 6, taken: 0 });
    fetch('/data/seats.json?' + (Date.now() / 3.6e6 | 0), { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : null; }).then(function (d) { if (d) draw(d); }).catch(function () { });
  }

  /* ---------- 5. Confetti ---------- */
  function confetti(opts) {
    if (RM) return;
    opts = opts || {};
    var c = document.createElement('canvas'); c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999';
    document.body.appendChild(c); var ctx = c.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr; ctx.scale(dpr, dpr);
    var cols = ['#0071e3', '#5e5ce6', '#9a4ef6', '#ff6f5e', '#ffb340', '#30d158'], ps = [], n = opts.count || 150;
    var ox = opts.x != null ? opts.x : innerWidth / 2, oy = opts.y != null ? opts.y : innerHeight * .35;
    for (var i = 0; i < n; i++) { var a = Math.random() * Math.PI * 2, v = 6 + Math.random() * 9; ps.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 5, w: 6 + Math.random() * 6, h: 4 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[i % cols.length], life: 0 }); }
    var t0 = performance.now();
    (function f(t) {
      var dt = t - t0, alive = false; ctx.clearRect(0, 0, innerWidth, innerHeight);
      ps.forEach(function (p) {
        p.vy += .28; p.vx *= .985; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        if (p.y < innerHeight + 20) alive = true;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, 1 - dt / 3600); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
      });
      if (alive && dt < 3600) requestAnimationFrame(f); else c.remove();
    })(t0);
  }
  window.bcConfetti = confetti;
  function confettiHooks() {
    var sp = $('#successPanel');
    if (sp && 'MutationObserver' in window) {
      var fired = false;
      new MutationObserver(function () { if (!fired && getComputedStyle(sp).display !== 'none') { fired = true; setTimeout(confetti, 250); } }).observe(sp, { attributes: true, attributeFilter: ['style', 'class'] });
    }
    if (/thank-you/.test(location.pathname)) setTimeout(confetti, 400);
  }

  /* ---------- 6. Fit-check quiz ---------- */
  var Q = [
    { t: 'Are you a founder or an entrepreneur?', h: 'Running your own business, or about to.', yn: 1 },
    { t: 'Is your business bringing in revenue?', h: 'Any amount counts. We just want something real on the table.', yn: 1 },
    { t: 'Will you give feedback and add value to the group, and take feedback in return?', h: 'It is a two-way room. You get as much as you give.', yn: 1 },
    { t: 'Will you commit to one concrete move each week and report back on it?', h: 'Accountability is the whole point.', yn: 1 },
    { t: 'Are you mainly looking for a course or a step-by-step curriculum?', h: 'There is no curriculum. The agenda is your business.', yn: 1, rev: 1 },
    { t: 'Which session time works best for you?', h: 'Two rooms, fifteen minutes apart, 90 minutes each.', opts: ['Monday \u00b7 5:30\u20137:00 PM Pacific', 'Wednesday \u00b7 5:30\u20137:00 PM Pacific', 'Monday \u00b7 6:45\u20138:15 PM Eastern', 'Wednesday \u00b7 6:45\u20138:15 PM Eastern', 'Not sure yet'] },
    { t: 'What do you most want out of the month?', h: 'Pick the one that matters most right now.', opts: ['Clarity on my #1 problem', 'Honest feedback', 'Accountability', 'Introductions and a network', 'Skills I am missing'] }
  ];

  function quiz() {
    var tr = $$('[data-fitcheck]');
    var host = $('#apply .text-center.max-w-2xl'), anchorBtn = null;
    if (host) {
      css('.fx-fit-link{display:inline-flex;align-items:center;gap:6px;margin-top:18px;font-size:14px;font-weight:600;color:#0a57ff;background:none;border:0;cursor:pointer;padding:8px 4px}.fx-fit-link:hover{text-decoration:underline}');
      anchorBtn = document.createElement('button'); anchorBtn.type = 'button'; anchorBtn.className = 'fx-fit-link'; anchorBtn.setAttribute('data-fitcheck', '');
      anchorBtn.innerHTML = 'Not sure it&rsquo;s for you? Take the 60-second fit check <span aria-hidden="true">&rarr;</span>'; host.appendChild(anchorBtn); tr.push(anchorBtn);
    }
    if (!tr.length) return;
    css('.fx-q{border:0;padding:0;background:transparent;max-width:min(560px,calc(100vw - 24px));width:100%;margin:auto;color:#0a0a0a;font-family:inherit}.fx-q::backdrop{background:rgba(10,10,10,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}' +
      '.fx-q-card{background:#fff;border-radius:28px;padding:30px 28px 26px;box-shadow:0 30px 80px -20px rgba(0,0,0,.45);position:relative;animation:fxqi .35s cubic-bezier(.2,.8,.2,1)}@keyframes fxqi{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:none}}' +
      '.fx-q-x{position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:50%;border:0;background:#f5f5f7;cursor:pointer;font-size:18px;line-height:1;color:#1d1d1f}.fx-q-x:hover{background:#e8e8ed}' +
      '.fx-q-bar{height:3px;background:#e8e8ed;border-radius:3px;overflow:hidden;margin:0 40px 22px 0}.fx-q-bar i{display:block;height:100%;width:0;background:#0a0a0a;border-radius:3px;transition:width .35s ease}' +
      '.fx-q-n{font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:#6e6e73}.fx-q h3{font-size:clamp(21px,3.4vw,26px);line-height:1.2;font-weight:600;letter-spacing:-.02em;margin:10px 0 8px}.fx-q p{font-size:14.5px;line-height:1.55;color:#6e6e73;margin:0}' +
      '.fx-q-a{display:flex;gap:10px;margin-top:24px}.fx-q-a button{flex:1;min-height:52px;border-radius:999px;border:1.5px solid #d2d2d7;background:#fff;font:inherit;font-size:16px;font-weight:600;cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease}' +
      '.fx-q-a button:hover,.fx-q-a button:focus-visible{background:#0a0a0a;border-color:#0a0a0a;color:#fff;outline:none}' +
      '.fx-q-o{display:flex;flex-direction:column;gap:8px;margin-top:20px}.fx-q-o button{min-height:48px;padding:0 18px;border-radius:14px;border:1.5px solid #d2d2d7;background:#fff;font:inherit;font-size:15px;font-weight:600;text-align:left;cursor:pointer;transition:background .15s ease,border-color .15s ease,color .15s ease}.fx-q-o button:hover,.fx-q-o button:focus-visible{background:#0a0a0a;border-color:#0a0a0a;color:#fff;outline:none}' +
      '.fx-q-res{text-align:center;padding:10px 4px 0}.fx-q-badge{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;margin:4px auto 14px;font-size:28px}' +
      '.fx-q-cta{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:52px;padding:0 26px;border-radius:999px;background:#0a0a0a;color:#fff;text-decoration:none;font-weight:600;margin-top:22px;border:0;font:inherit;font-weight:600;cursor:pointer}' +
      '.fx-q-sec{display:block;margin:12px auto 0;background:none;border:0;color:#6e6e73;font:inherit;font-size:13px;cursor:pointer;text-decoration:underline}');
    var dlg = document.createElement('dialog'); dlg.className = 'fx-q'; dlg.setAttribute('aria-label', 'Is BizColab for you?');
    document.body.appendChild(dlg); var i = 0, ans = [];
    function close() { if (dlg.close) dlg.close(); else dlg.removeAttribute('open'); }
    function frame(inner) { dlg.innerHTML = '<div class="fx-q-card"><button class="fx-q-x" type="button" aria-label="Close">&times;</button>' + inner + '</div>'; $('.fx-q-x', dlg).onclick = close; }
    function ask() {
      var q = Q[i], body;
      if (q.opts) body = '<div class="fx-q-o">' + q.opts.map(function (o, k) { return '<button type="button" data-k="' + k + '">' + o + '</button>'; }).join('') + '</div>';
      else body = '<div class="fx-q-a"><button type="button" data-v="1">Yes</button><button type="button" data-v="0">No</button></div>';
      frame('<div class="fx-q-bar"><i style="width:' + (i / Q.length * 100) + '%"></i></div><div class="fx-q-n">Question ' + (i + 1) + ' of ' + Q.length + '</div><h3>' + q.t + '</h3><p>' + q.h + '</p>' + body);
      $$('.fx-q-a button,.fx-q-o button', dlg).forEach(function (b, k) {
        b.onclick = function () { ans[i] = q.opts ? q.opts[+b.getAttribute('data-k')] : b.getAttribute('data-v') === '1'; i++; if (i < Q.length) ask(); else result(); };
        if (k === 0) b.focus();
      });
    }
    function result() {
      var good = 0, total = 0;
      Q.forEach(function (q, k) { if (!q.yn) return; total++; if (q.rev ? !ans[k] : ans[k]) good++; });
      var r = good >= total ? { e: '\u2605', bg: '#e9f9ee', h: 'You\u2019re a fit', p: 'Everything you said is what BizColab is built around. Request a seat and we will take it from there.' }
        : good >= total - 1 ? { e: '\u2713', bg: '#e9f9ee', h: 'Looks like a strong fit', p: 'You hit nearly everything. Apply, or grab 15 minutes with us and we will talk it through.' }
        : { e: '\u2248', bg: '#eef3ff', h: 'Let\u2019s talk it through', p: 'There are a few things worth a conversation, and that is fine. A 15-minute call is the easiest way to see if the room makes sense for you.' };
      var sum = '<p style="margin-top:14px;font-size:13px">' + '<b style="color:#1d1d1f">Your time:</b> ' + ans[5] + '<br><b style="color:#1d1d1f">Most wanted:</b> ' + ans[6] + '</p>';
      frame('<div class="fx-q-res"><div class="fx-q-badge" style="background:' + r.bg + '">' + r.e + '</div><h3>' + r.h + '</h3><p>' + r.p + '</p>' + sum +
        '<a class="fx-q-cta" href="/join/">Request a seat &rarr;</a><a class="fx-q-sec" href="https://calendar.app.google/THqZBmvfREeCDE8k8" target="_blank" rel="noopener">Or book a 15-minute call</a><button class="fx-q-sec" type="button" data-again>Retake</button></div>');
      $('[data-again]', dlg).onclick = function () { i = 0; ans = []; ask(); };
      if (good >= total) setTimeout(function () { confetti({ x: innerWidth / 2, y: innerHeight * .4, count: 120 }); }, 200);
    }
    function open(e) { if (e) e.preventDefault(); i = 0; ans = []; ask(); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); }
    tr.forEach(function (b) { b.addEventListener('click', open); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  }

  ready(function () { try { counters(); tilt(); timeline(); seats(); quiz(); confettiHooks(); } catch (e) { if (window.console) console.warn('bc-fx', e); } });
})();
