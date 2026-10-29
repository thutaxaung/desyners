// Shared behaviour for the design options: smooth scroll, nav state, magnetic buttons, contact form.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  window.DESY = { reduce: reduce, fine: fine };

  // Smooth scrolling (Lenis) wired into GSAP's ticker so ScrollTrigger stays in sync.
  if (!reduce && window.Lenis) {
    var lenis = new Lenis({ lerp: 0.09 });
    window.DESY.lenis = lenis;
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
      gsap.ticker.lagSmoothing(0);
    } else {
      (function raf(t) { lenis.raf(t); requestAnimationFrame(raf); })(0);
    }
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href');
        if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, { offset: -70 }); }
      });
    });
  }

  var nav = document.querySelector('.nav');
  if (nav) addEventListener('scroll', function () { nav.classList.toggle('scrolled', scrollY > 30); }, { passive: true });

  // Magnetic buttons
  if (fine && !reduce) document.querySelectorAll('.btn').forEach(function (b) {
    b.addEventListener('pointermove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * .25) + 'px,' + ((e.clientY - r.top - r.height / 2) * .35) + 'px)';
    });
    b.addEventListener('pointerleave', function () { b.style.transform = ''; });
  });

  // Contact form -> FormSubmit
  var form = document.querySelector('.form');
  if (form) {
    var status = form.querySelector('.form-status'), btn = form.querySelector('button');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.elements['name'].value.trim() || !form.elements['phone'].value.trim()) {
        status.textContent = 'Please enter your name and phone number.'; status.className = 'form-status err'; return;
      }
      btn.disabled = true; status.textContent = 'Sending…'; status.className = 'form-status';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && String(j.success) === 'true'; }); })
        .then(function (ok) {
          if (ok) { form.reset(); status.textContent = "Thank you! We'll get back to you shortly."; status.className = 'form-status ok'; }
          else { status.textContent = "Couldn't send. Please call 09 795 757 666 or message us on Messenger."; status.className = 'form-status err'; }
        })
        .catch(function () { status.textContent = "Couldn't send. Please call 09 795 757 666."; status.className = 'form-status err'; })
        .then(function () { btn.disabled = false; });
    });
  }

  // Count-up numbers
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target, to = +el.dataset.count, t0 = null;
        io.unobserve(el);
        if (reduce) { el.textContent = to; return; }
        (function step(ts) {
          if (t0 === null) t0 = ts;
          var k = Math.min((ts - t0) / 1400, 1);
          el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
          if (k < 1) requestAnimationFrame(step);
        })(performance.now());
      });
    }, { threshold: .5 });
    counters.forEach(function (c) { io.observe(c); });
  }
})();
