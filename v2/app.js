(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const store = { get(k){ try { return localStorage.getItem(k); } catch { return null; } }, set(k,v){ try { localStorage.setItem(k,v); } catch {} } };

  /* ---------- i18n (same JSON files + same storage key as the original site) ---------- */
  const langs = ['ba', 'de', 'en', 'tr'];
  const cache = {};
  let current = store.get('language');
  if (!langs.includes(current)) current = 'de';
  const fetchJSON = async (l, tries = 3) => {
    for (let i = 0; i < tries; i++) {
      try { const r = await fetch(`../${l}.json`, { cache: 'force-cache' }); if (r.ok) return await r.json(); } catch {}
      await new Promise(r => setTimeout(r, 300 * (i + 1)));
    }
    return null;
  };
  const load = async l => {
    if (cache[l]) return cache[l];
    const d = await fetchJSON(l) || (l !== 'en' && await fetchJSON('en')) || {};
    return d.hero_text ? (cache[l] = d) : d;
  };

  function applyText(d) {
    $$('[data-i18n]').forEach(el => { const v = d[el.dataset.i18n]; if (v != null) el.innerHTML = v; });
    $$('[data-i18n-list]').forEach(el => {
      const parts = (d[el.dataset.i18nList] || '').split('•').map(s => s.trim()).filter(Boolean);
      if (el.dataset.mode === 'chips') el.innerHTML = parts.map((p, i) => `<span class="chip" style="--i:${i}">${p}</span>`).join('');
      else {
        const html = parts.map(p => `<span>${p}</span>`).join('');
        el.innerHTML = html + html + html + html;
      }
    });
    splitSlogan();
    document.documentElement.lang = ({ ba: 'bs', de: 'de', en: 'en', tr: 'tr' })[current];
    $$('.lang-menu button').forEach(b => b.classList.toggle('on', b.dataset.lang === current));
    const cur = $('.lang-cur'); if (cur) cur.textContent = current.toUpperCase();
  }
  async function setLang(l, animate) {
    current = l; store.set('language', l);
    const d = await load(l);
    const main = $('main') || document.body;
    if (animate && !reduce) {
      main.style.transition = 'opacity .25s'; main.style.opacity = 0;
      await new Promise(r => setTimeout(r, 260));
      applyText(d);
      main.style.opacity = 1;
    } else applyText(d);
    revealSlogan();
  }

  /* ---------- slogan word-by-word ---------- */
  function splitSlogan() {
    const el = $('.slogan'); if (!el) return;
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
  }
  const wio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('lit'); wio.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
  function revealSlogan() { $$('.slogan .w').forEach((w, i) => { w.style.transitionDelay = (i * 60) + 'ms'; wio.observe(w); }); }

  /* ---------- preloader ---------- */
  const pre = $('.preloader');
  const done = () => {
    if (!pre || pre.classList.contains('done')) return;
    pre.classList.add('done'); document.body.classList.remove('loading');
  };
  document.body.classList.add('loading');
  Promise.all([setLang(current, false), new Promise(r => setTimeout(r, 900))]).finally(done);
  setTimeout(done, 4000);

  /* ---------- hero letters + typewriter ---------- */
  const ht = $('.hero-title');
  if (ht) ht.innerHTML = [...ht.textContent.trim()].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('');
  const tw = $('.typer');
  if (tw) {
    const word = 'DESIGN SERVICES'; let i = 0, del = false;
    const tick = () => {
      i += del ? -1 : 1; tw.textContent = word.slice(0, i);
      let t = del ? 55 : 120;
      if (!del && i === word.length) { del = true; t = 2200; }
      else if (del && i === 0) { del = false; t = 600; }
      setTimeout(tick, t);
    };
    setTimeout(tick, 2600);
  }

  /* ---------- scroll: progress, nav, active link, reveal ---------- */
  const bar = $('.progress'), nav = $('.nav');
  const links = $$('.links a[href^="#"]');
  let ticking = false;
  function onScroll() {
    ticking = false;
    bar.style.transform = `scaleX(${scrollY / (document.documentElement.scrollHeight - innerHeight || 1)})`;
    nav.classList.toggle('scrolled', scrollY > 40);
  }
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();
  const sio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id)); }), { rootMargin: '-40% 0px -55% 0px' });
  $$('main section[id]').forEach(s => sio.observe(s));

  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal').forEach(el => io.observe(el));
  setTimeout(() => $$('.reveal:not(.in)').forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }), 2500);

  /* ---------- mobile menu + language dropdown ---------- */
  const burger = $('.burger'), menu = $('.links');
  burger.addEventListener('click', () => { burger.classList.toggle('open'); menu.classList.toggle('open'); });
  menu.addEventListener('click', e => { if (e.target.closest('a')) { burger.classList.remove('open'); menu.classList.remove('open'); } });
  const lang = $('.lang');
  $('.lang-btn').addEventListener('click', e => { e.stopPropagation(); lang.classList.toggle('open'); });
  document.addEventListener('click', () => lang.classList.remove('open'));
  $$('.lang-menu button').forEach(b => b.addEventListener('click', () => { lang.classList.remove('open'); if (b.dataset.lang !== current) setLang(b.dataset.lang, true); }));

  /* ---------- 3D tilt cards (desktop only) ---------- */
  if (fine && !reduce) {
    $$('.card').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
        c.style.setProperty('--ry', (x - .5) * 12 + 'deg'); c.style.setProperty('--rx', (.5 - y) * 12 + 'deg');
      });
      c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- gallery lightbox ---------- */
  const shots = $$('.row .shot:not([data-clone])');
  const lb = $('.lightbox');
  if (lb) {
    const img = $('img', lb), cnt = $('.lb-count', lb); let idx = 0;
    const srcs = shots.map(s => s.querySelector('img').dataset.full);
    const show = i => { idx = (i + srcs.length) % srcs.length; img.style.opacity = 0; setTimeout(() => { img.src = srcs[idx]; img.style.opacity = 1; }, 180); cnt.textContent = `${idx + 1} / ${srcs.length}`; };
    const open = i => { show(i); lb.classList.add('open'); };
    const close = () => lb.classList.remove('open');
    document.addEventListener('click', e => { const s = e.target.closest('.shot'); if (s) open(+s.dataset.i); });
    $('.lb-prev').onclick = e => { e.stopPropagation(); show(idx - 1); };
    $('.lb-next').onclick = e => { e.stopPropagation(); show(idx + 1); };
    $('.lb-close').onclick = close; lb.addEventListener('click', e => { if (e.target === lb) close(); });
    addEventListener('keydown', e => { if (!lb.classList.contains('open')) return; if (e.key === 'Escape') close(); if (e.key === 'ArrowLeft') show(idx - 1); if (e.key === 'ArrowRight') show(idx + 1); });
  }

  /* ---------- form: return to the matching success page on whatever host serves this ---------- */
  const next = $('input[name="_next"]');
  if (next) next.value = new URL('success.html', location.href).href;
})();
