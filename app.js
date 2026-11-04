// Desyners. Small and dependency-free: nav state, scroll reveals, the hero idea board, the AI switches,
// the process line and the enquiry form. Nothing runs every frame; loops pause when off screen.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;
  function watch(els, fn, opts) {
    if (!hasIO) { els.forEach(function (el) { fn(el, true); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { fn(e.target, e.isIntersecting, io); }); }, opts);
    els.forEach(function (el) { io.observe(el); });
  }

  // Nav turns solid once the page scrolls
  var nav = document.getElementById('nav');
  function navState() { nav.classList.toggle('solid', scrollY > 20); }
  addEventListener('scroll', navState, { passive: true }); navState();

  // Reveal once, as things scroll in
  watch([].slice.call(document.querySelectorAll('.rv')), function (el, on, io) { if (on) { el.classList.add('in'); io && io.unobserve(el); } }, { threshold: .12 });

  // Looping decoration only runs while its section is on screen
  var loopSections = [].slice.call(document.querySelectorAll('section')).filter(function (s) { return s.querySelector('.loop'); });
  watch(loopSections, function (el, on) { el.classList.toggle('live', on); });

  // Hero: an idea types itself, then the app made from it appears on the phone
  var ideas = [
    { text: 'An app where parents can see exam results', made: 'Android & iOS app + school admin website' },
    { text: 'Online ordering for my shop', made: 'Shop app + website with online orders' },
    { text: 'Track stock across all our branches', made: 'Stock system for phone and desktop' }
  ];
  var typed = document.getElementById('typed'), made = document.getElementById('made'), apps = document.querySelectorAll('.app');
  var hero = document.getElementById('hero'), heroOn = true, step = 0, timer = null;
  function show(i) {
    apps.forEach(function (a, k) { a.classList.toggle('on', k === i); });
    made.textContent = ideas[i].made;
  }
  function run() {
    clearTimeout(timer);
    if (!heroOn) return;
    var idea = ideas[step], n = 0;
    if (reduce) { typed.textContent = idea.text; show(step); step = (step + 1) % ideas.length; timer = setTimeout(run, 6000); return; }
    (function type() {
      if (!heroOn) return;
      typed.textContent = idea.text.slice(0, ++n);
      if (n < idea.text.length) { timer = setTimeout(type, 34); return; }
      show(step);
      step = (step + 1) % ideas.length;
      timer = setTimeout(run, 5200);
    })();
  }
  watch([hero], function (el, on) { var was = heroOn; heroOn = on; if (on && !was) run(); if (!on) clearTimeout(timer); });
  run();

  // AI switches flip on when the list scrolls into view
  var switches = document.getElementById('switches');
  watch([switches], function (el, on, io) { if (on) { el.classList.add('on'); io && io.unobserve(el); } }, { threshold: .35 });

  // Process line fills once
  var steps = document.getElementById('steps');
  watch([steps], function (el, on, io) { if (on) { el.classList.add('in'); io && io.unobserve(el); } }, { threshold: .4 });

  // Messenger on phones: iOS often keeps m.me links in Safari (messenger.com) even with the app installed, so
  // "Message us" offers the app directly (fb-messenger:// on iPhone, an intent link on Android) or the browser.
  var sheet = document.getElementById('msgsheet');
  if (matchMedia('(hover: none) and (pointer: coarse)').matches) {
    var id = '100063980744226', web = 'https://m.me/' + id;
    if (/Android/i.test(navigator.userAgent))   // Chrome opens the app, or falls back to m.me if it isn't installed
      document.getElementById('msg-app').href = 'intent://user-thread/' + id + '#Intent;scheme=fb-messenger;package=com.facebook.orca;S.browser_fallback_url=' + encodeURIComponent(web) + ';end';
    document.querySelectorAll('a[href^="https://m.me/"]:not(#msg-web)').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); sheet.hidden = false; document.getElementById('msg-app').focus(); });
    });
    sheet.addEventListener('click', function (e) { if (e.target.hasAttribute('data-close')) sheet.hidden = true; });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') sheet.hidden = true; });
    document.getElementById('msg-app').addEventListener('click', function () { setTimeout(function () { sheet.hidden = true; }, 600); });
  }

  // Enquiry form -> Web3Forms (email to desyners.mm@gmail.com). If the service is down or slow, nothing typed is
  // lost: the visitor gets a ready-to-send email with their details, plus call and Messenger options.
  var form = document.getElementById('form'), status = document.getElementById('status'), btn = form.querySelector('button');
  var fallback = document.getElementById('fallback'), mailto = document.getElementById('mailto');
  function offerFallback() {
    var f = form.elements;
    var body = 'Name: ' + f.name.value.trim() + '\nPhone / Viber: ' + f.phone.value.trim() + '\nWants to build: ' + f.type.value + '\n\nIdea:\n' + f.idea.value.trim();
    mailto.href = 'mailto:desyners.mm@gmail.com?subject=' + encodeURIComponent('New project idea from desyners.io') + '&body=' + encodeURIComponent(body);
    status.textContent = "Couldn't send through the form."; status.className = 'status err';
    fallback.hidden = false;
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.elements.name.value.trim() || !form.elements.phone.value.trim()) {
      status.textContent = 'Please add your name and phone number.'; status.className = 'status err'; return;
    }
    btn.disabled = true; status.textContent = 'Sending…'; status.className = 'status'; fallback.hidden = true;
    var ctl = window.AbortController ? new AbortController() : null;
    var timeout = ctl && setTimeout(function () { ctl.abort(); }, 15000);   // don't leave people waiting on a stuck service
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && j.success === true; }); })
      .then(function (ok) {
        if (ok) { form.reset(); status.textContent = "Thanks! We'll be in touch soon."; status.className = 'status ok'; }
        else offerFallback();
      })
      .catch(offerFallback)
      .then(function () { clearTimeout(timeout); btn.disabled = false; });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
