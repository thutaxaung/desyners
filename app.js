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

  // Enquiry form -> FormSubmit (email to desyners.mm@gmail.com)
  var form = document.getElementById('form'), status = document.getElementById('status'), btn = form.querySelector('button');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.elements.name.value.trim() || !form.elements.phone.value.trim()) {
      status.textContent = 'Please add your name and phone number.'; status.className = 'status err'; return;
    }
    btn.disabled = true; status.textContent = 'Sending…'; status.className = 'status';
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && String(j.success) === 'true'; }); })
      .then(function (ok) {
        if (ok) { form.reset(); status.textContent = "Thanks! We'll be in touch soon."; status.className = 'status ok'; }
        else { status.textContent = "Couldn't send. Please call 09 795 757 666 or message us on Messenger."; status.className = 'status err'; }
      })
      .catch(function () { status.textContent = "Couldn't send. Please call 09 795 757 666."; status.className = 'status err'; })
      .then(function () { btn.disabled = false; });
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
