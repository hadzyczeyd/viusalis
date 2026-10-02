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
  function revealSlogan() {
    const el = $('.slogan'); if (!el) return;
    const words = $$('.w', el);
    const r = el.getBoundingClientRect(), vh = innerHeight;
    const p = Math.min(1, Math.max(0, (vh * .85 - r.top) / (vh * .55 + r.height)));
    words.forEach((w, i) => w.classList.toggle('lit', i / words.length < p));
  }

  /* ---------- preloader ---------- */
  const pre = $('.preloader');
  const done = () => {
    if (!pre || pre.classList.contains('done')) return;
    pre.classList.add('done'); document.body.classList.remove('loading');
  };
  document.body.classList.add('loading');
  Promise.all([setLang(current, false), new Promise(r => setTimeout(r, 1300))]).finally(done);
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
  const sections = $$('main section[id]');
  const links = $$('.links a[href^="#"]');
  function onScroll() {
    const h = document.documentElement;
    bar.style.transform = `scaleX(${scrollY / (h.scrollHeight - innerHeight || 1)})`;
    nav.classList.toggle('scrolled', scrollY > 40);
    let cur = sections[0] && sections[0].id;
    sections.forEach(s => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = s.id; });
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    revealSlogan();
  }
  let ticking = false;
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();

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

  /* ---------- custom cursor ---------- */
  if (fine && !reduce) {
    document.body.classList.add('has-cursor');
    const dot = $('.cursor-dot'), ring = $('.cursor-ring');
    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; dot.style.transform = `translate(${mx}px,${my}px)`; });
    (function loop() { rx += (mx - rx) * .15; ry += (my - ry) * .15; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(loop); })();
    document.addEventListener('mouseover', e => ring.classList.toggle('hover', !!e.target.closest('a,button,.shot,.card,input,textarea')));
  }

  /* ---------- magnetic buttons + 3D tilt cards ---------- */
  if (fine && !reduce) {
    $$('.btn').forEach(b => {
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); b.style.setProperty('--x', (e.clientX - r.left - r.width / 2) * .25 + 'px'); b.style.setProperty('--y', (e.clientY - r.top - r.height / 2) * .35 + 'px'); });
      b.addEventListener('mouseleave', () => { b.style.setProperty('--x', '0px'); b.style.setProperty('--y', '0px'); });
    });
    $$('.card').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        c.style.setProperty('--mx', x * 100 + '%'); c.style.setProperty('--my', y * 100 + '%');
        c.style.setProperty('--ry', (x - .5) * 12 + 'deg'); c.style.setProperty('--rx', (.5 - y) * 12 + 'deg');
      });
      c.addEventListener('mouseleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
  }

  /* ---------- constellation canvas ---------- */
  const cv = $('#constellation');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d'); let W, H, pts = [], mouse = { x: -999, y: -999 };
    const size = () => { const r = cv.parentElement.getBoundingClientRect(); const dpr = Math.min(devicePixelRatio || 1, 2); W = cv.width = r.width * dpr; H = cv.height = r.height * dpr; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr); W /= dpr; H /= dpr;
      const n = Math.round(Math.min(innerWidth < 760 ? 38 : 90, W * H / 14000)); pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .45, vy: (Math.random() - .5) * .45, r: Math.random() * 1.8 + .6 })); };
    size(); addEventListener('resize', size);
    cv.parentElement.addEventListener('mousemove', e => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
    cv.parentElement.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });
    let visible = true; new IntersectionObserver(e => visible = e[0].isIntersecting).observe(cv);
    document.addEventListener('visibilitychange', () => visible = !document.hidden);
    (function draw() {
      requestAnimationFrame(draw); if (!visible) return;
      ctx.clearRect(0, 0, W, H);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy; if (p.x < 0 || p.x > W) p.vx *= -1; if (p.y < 0 || p.y > H) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 140) { p.x += dx / d * 1.6; p.y += dy / d * 1.6; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fillStyle = 'rgba(255,193,7,.85)'; ctx.fill();
      }
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < 130) { ctx.strokeStyle = `rgba(255,193,7,${(1 - d / 130) * .35})`; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
      }
      for (const p of pts) { const d = Math.hypot(p.x - mouse.x, p.y - mouse.y); if (d < 180) { ctx.strokeStyle = `rgba(5,200,185,${(1 - d / 180) * .6})`; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); } }
    })();
  }

  /* ---------- gallery lightbox ---------- */
  const shots = $$('.row .shot:not([data-clone])');
  const lb = $('.lightbox');
  if (lb) {
    const img = $('img', lb), cnt = $('.lb-count', lb); let idx = 0;
    const srcs = shots.map(s => s.querySelector('img').getAttribute('src'));
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
