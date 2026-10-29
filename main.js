(function () {
  var root = document.documentElement;

  /* ---------- Mobile menu ---------- */
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('mobile-nav');
  btn.addEventListener('click', function () {
    var open = document.body.classList.toggle('menu-open');
    btn.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      document.body.classList.remove('menu-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------- Language switch ---------- */
  var MY = window.I18N_MY || {};
  var EN_EXTRA = window.I18N_EN || {};
  var nodes = document.querySelectorAll('[data-i18n]');
  var metaDesc = document.querySelector('meta[name="description"]');
  var en = { 'meta.title': document.title, 'meta.desc': metaDesc.content };
  nodes.forEach(function (el) { en[el.dataset.i18n] = el.innerHTML; });
  var lang = 'en';

  function t(key) {
    if (lang === 'my' && MY[key] != null) return MY[key];
    return en[key] != null ? en[key] : EN_EXTRA[key];
  }

  function setLang(next) {
    lang = next === 'my' ? 'my' : 'en';
    root.lang = lang;
    nodes.forEach(function (el) {
      var v = t(el.dataset.i18n);
      if (v != null) el.innerHTML = v;
    });
    document.title = t('meta.title');
    metaDesc.content = t('meta.desc');
    document.querySelectorAll('[data-lang-toggle]').forEach(function (b) {
      b.textContent = lang === 'my' ? 'English' : 'မြန်မာ';
    });
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }

  document.querySelectorAll('[data-lang-toggle]').forEach(function (b) {
    b.addEventListener('click', function () { setLang(lang === 'my' ? 'en' : 'my'); });
  });

  var initial = new URLSearchParams(location.search).get('lang');
  if (!initial) { try { initial = localStorage.getItem('lang'); } catch (e) {} }
  if (initial === 'my') setLang('my');

  /* ---------- Contact form ---------- */
  var form = document.getElementById('audit-form');
  var status = form.querySelector('.form-status');
  var submit = form.querySelector('button[type="submit"]');

  function show(key, kind) {
    status.textContent = t(key);
    status.className = 'form-status' + (kind ? ' ' + kind : '');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!form.elements['name'].value.trim() || !form.elements['phone'].value.trim()) { show('form.missing', 'err'); return; }
    submit.disabled = true;
    show('form.sending');
    var data = new FormData(form);
    data.append('lang', lang);
    fetch(form.action, { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return {}; }).then(function (j) { return r.ok && String(j.success) === 'true'; }); })
      .then(function (ok) {
        if (ok) { form.reset(); show('form.ok', 'ok'); }
        else show('form.fail', 'err');
      })
      .catch(function () { show('form.fail', 'err'); })
      .then(function () { submit.disabled = false; });
  });

  /* ---------- Reveal on scroll ---------- */
  var io = 'IntersectionObserver' in window && new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.card, .svc, .steps li, .person, .stats > div').forEach(function (el) {
    if (io) { el.classList.add('reveal'); io.observe(el); }
  });
})();
