// Starts each service mockup when it scrolls into view and drives the scripted parts
// (the chatbot conversation and the counters). CSS handles the looping motion.
(function () {
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function chat(el) {
    var msgs = el.querySelectorAll('.msg'), timers = [];
    function run() {
      msgs.forEach(function (m) { m.classList.remove('on'); if (m.classList.contains('typing')) m.style.display = ''; });
      var t = 300;
      msgs.forEach(function (m) {
        var hold = m.classList.contains('typing') ? 1100 : 900;
        timers.push(setTimeout(function () {
          m.classList.add('on');
          if (m.classList.contains('typing')) timers.push(setTimeout(function () { m.style.display = 'none'; }, hold - 100));
        }, t));
        t += hold;
      });
      timers.push(setTimeout(run, t + 2600));
    }
    if (reduce) { msgs.forEach(function (m) { if (m.classList.contains('typing')) m.style.display = 'none'; else m.classList.add('on'); }); return; }
    run();
  }

  function count(el) {
    el.querySelectorAll('[data-to]').forEach(function (n) {
      var to = +n.dataset.to, from = +(n.dataset.from || 0), t0 = null, fmt = function (v) { return Math.round(v).toLocaleString('en-US'); };
      if (reduce) { n.textContent = fmt(to); return; }
      (function step(ts) {
        if (t0 === null) t0 = ts;
        var k = Math.min((ts - t0) / 1800, 1);
        n.textContent = fmt(from + (to - from) * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(step);
        else if (n.dataset.tick) setInterval(function () { to += +n.dataset.tick; n.textContent = fmt(to); }, 1400);
      })(performance.now());
    });
  }

  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var el = e.target;
      el.classList.toggle('play', e.isIntersecting);
      if (e.isIntersecting && !el.dataset.started) {
        el.dataset.started = 1;
        if (el.classList.contains('m-chat')) chat(el);
        count(el);
      }
    });
  }, { threshold: .25 });
  document.querySelectorAll('.mock').forEach(function (m) { io ? io.observe(m) : m.classList.add('play'); });
})();
