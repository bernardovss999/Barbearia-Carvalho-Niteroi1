/* Barbearia Carvalho — motion & interações (todas as páginas) */
(() => {
  const $ = (s, c = document) => c.querySelector(s), $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const WPP = '5521985019824';
  const page = document.body.dataset.page;
  gsap.registerPlugin(ScrollTrigger);
  window.heroGL = window.heroGL || { reveal: 1, scroll: 0 };

  /* ---------- scroll suave ---------- */
  ScrollTrigger.config({ ignoreMobileResize: true });
  const lenis = new Lenis({ lerp: .085, wheelMultiplier: 1, smoothWheel: !reduce, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(t => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  /* ---------- menu ---------- */
  const nav = $('#nav'), menu = $('#menu'), menuBtn = $('#menuBtn');
  const setMenu = open => {
    menu.classList.toggle('is-open', open); menu.setAttribute('aria-hidden', !open);
    menuBtn.setAttribute('aria-expanded', open); menuBtn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('is-locked', open); open ? lenis.stop() : lenis.start();
    nav.classList.remove('is-hidden');
    if (open && !reduce) {
      gsap.fromTo('.menu__list a', { yPercent: 105 }, { yPercent: 0, duration: 1.1, stagger: .055, ease: 'expo.out', delay: .25 });
      gsap.fromTo('.menu__aside > *', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, stagger: .08, ease: 'expo.out', delay: .45 });
    }
  };
  menuBtn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') { menu.classList.contains('is-open') && setMenu(false); closeLb && closeLb(); } });

  /* ---------- links: âncoras suaves + transição entre páginas ---------- */
  const curtain = $('#curtain'), clogo = $('.curtain__logo');
  let leaving = false;
  const leave = href => {
    if (leaving) return; leaving = true;
    if (menu.classList.contains('is-open')) setMenu(false);
    lenis.stop();
    gsap.timeline({ onComplete: () => location.href = href })
      .set(curtain, { clipPath: 'inset(100% 0% 0% 0%)' })
      .to(curtain, { clipPath: 'inset(0% 0% 0% 0%)', duration: .7, ease: 'power4.inOut' })
      .fromTo(clogo, { opacity: 0, scale: .8, rotate: -12 }, { opacity: 1, scale: 1, rotate: 0, duration: .6, ease: 'expo.out' }, .35);
  };
  $$('a[href]').forEach(a => a.addEventListener('click', e => {
    const href = a.getAttribute('href');
    if (a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || /^(https?:|mailto:|tel:)/.test(href)) return;
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname) {
      if (!url.hash) return;
      const target = $(url.hash); if (!target) return;
      e.preventDefault(); if (menu.classList.contains('is-open')) setMenu(false);
      lenis.scrollTo(target, { duration: 1.5, offset: -110 }); history.replaceState(null, '', url.hash); return;
    }
    if (reduce) return;
    e.preventDefault(); leave(url.href);
  }));
  const pref = new Set();
  $$('a[href^="/"]').forEach(a => ['pointerenter', 'touchstart'].forEach(ev => a.addEventListener(ev, () => {
    const u = a.getAttribute('href').split('#')[0]; if (!u || pref.has(u) || u === location.pathname) return;
    pref.add(u); const l = document.createElement('link'); l.rel = 'prefetch'; l.href = u; document.head.appendChild(l);
  }, { passive: true, once: true })));
  addEventListener('pageshow', e => { if (e.persisted) { leaving = false; lenis.start(); gsap.set(curtain, { clipPath: 'inset(100% 0% 0% 0%)' }); } });

  /* ---------- nav ---------- */
  /* faixa da Sett: o menu fixo começa logo abaixo dela e sobe junto com a rolagem */
  const faixa = $('#settFaixa');
  const faixaH = () => faixa ? faixa.offsetHeight : 0;
  const setFaixa = y => document.documentElement.style.setProperty('--faixa', Math.max(0, faixaH() - y) + 'px');
  setFaixa(0); addEventListener('resize', () => setFaixa(scrollY));
  lenis.on('scroll', ({ scroll }) => setFaixa(scroll));
  const mbar = $('.mbar'); let lastY = 0;
  lenis.on('scroll', ({ scroll }) => {
    nav.classList.toggle('is-solid', scroll > 30);
    if (scroll > lastY + 3 && scroll > 500) nav.classList.add('is-hidden'); else if (scroll < lastY - 3) nav.classList.remove('is-hidden');
    mbar && mbar.classList.toggle('is-on', scroll > innerHeight * .7);
    lastY = scroll;
  });

  /* ---------- formulário → WhatsApp ---------- */
  $$('form.book').forEach(form => {
    const dia = form.querySelector('[name=dia]'); if (dia) dia.min = new Date().toISOString().slice(0, 10);
    const pre = new URLSearchParams(location.search).get('servico');
    if (pre) { const sel = form.querySelector('[name=servico]'); [...sel.options].forEach(o => { if (o.text === pre) sel.value = o.text; }); }
    form.addEventListener('submit', e => {
      e.preventDefault();
      const f = new FormData(form);
      const d = f.get('dia') ? new Date(f.get('dia') + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' }) : '';
      const msg = `Olá! Sou ${f.get('nome')} e quero agendar *${f.get('servico')}* na Barbearia Carvalho${d ? ` para ${d}` : ''}, de preferência à ${String(f.get('periodo')).toLowerCase()}.`;
      window.open(`https://wa.me/${WPP}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
    });
  });

  /* ---------- frases ---------- */
  const qt = $('#quoteText');
  if (qt) {
    const quotes = [['“Não é só sobre cortar cabelo. É sobre transformar.”', 'Jhovane Carvalho'], ['“Cliente satisfeito é a nossa melhor propaganda.”', '@barber_carvalho'], ['“Corte + café = cliente feliz.”', '@barber_carvalho'], ['“Uma nova fase. A mesma dedicação.”', 'Barbearia Carvalho']];
    let qi = 0; const qb = $('#quoteBy');
    const setQ = dir => { qi = (qi + dir + quotes.length) % quotes.length;
      gsap.timeline().to([qt, qb], { opacity: 0, y: -10, duration: .25 }).add(() => { qt.textContent = quotes[qi][0]; qb.textContent = quotes[qi][1]; }).fromTo([qt, qb], { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: .5, ease: 'expo.out' }); };
    $('#qPrev').onclick = () => setQ(-1); $('#qNext').onclick = () => setQ(1);
    setInterval(() => !document.hidden && setQ(1), 7000);
  }

  /* ---------- vídeos: só carregam/tocam quando visíveis ---------- */
  const vio = new IntersectionObserver(es => es.forEach(({ target: v, isIntersecting }) => {
    if (isIntersecting) { if (!v.src) v.src = v.dataset.src; v.play().catch(() => {}); } else v.pause();
  }), { rootMargin: '200px 0px' });
  $$('video[data-src]').forEach(v => vio.observe(v));

  /* ---------- galeria: filtro + lightbox ---------- */
  let closeLb = null;
  const grid = $('#grid');
  if (grid) {
    $$('.filters button').forEach(b => b.addEventListener('click', () => {
      $$('.filters button').forEach(x => x.classList.toggle('is-on', x === b));
      const f = b.dataset.f;
      $$('.g', grid).forEach(g => g.classList.toggle('is-out', f !== 'all' && g.dataset.c !== f));
      ScrollTrigger.refresh();
      if (!reduce) gsap.fromTo($$('.g:not(.is-out)', grid), { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, stagger: .04, ease: 'expo.out' });
    }));
    const lb = $('#lightbox'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
    closeLb = () => { if (lb.hidden) return; lb.hidden = true; lenis.start(); };
    $$('.g', grid).forEach(g => g.addEventListener('click', () => {
      const im = $('img', g); lbImg.src = im.src; lbImg.alt = im.alt; lbCap.textContent = $('figcaption', g).textContent;
      lb.hidden = false; lenis.stop(); $('#lbClose').focus();
      if (!reduce) gsap.fromTo(lbImg, { scale: .9, opacity: 0 }, { scale: 1, opacity: 1, duration: .6, ease: 'expo.out' });
    }));
    $('#lbClose').onclick = closeLb; lb.addEventListener('click', e => e.target === lb && closeLb());
  }

  /* ---------- carrossel de trabalhos: automático, arrastável ---------- */
  const rail = $('#worksRail');
  if (rail) {
    const track = $('.works__track', rail); track.innerHTML += track.innerHTML;
    let x = 0, speed = reduce ? 0 : .55, target = speed, drag = null, half = 0;
    const measure = () => half = track.scrollWidth / 2; measure(); addEventListener('resize', measure);
    rail.addEventListener('pointerenter', () => target = speed * .25);
    rail.addEventListener('pointerleave', () => { target = speed; drag = null; });
    rail.addEventListener('pointerdown', e => { drag = { x: e.clientX, start: x }; rail.setPointerCapture(e.pointerId); });
    rail.addEventListener('pointermove', e => { if (drag) x = drag.start + (e.clientX - drag.x); });
    ['pointerup', 'pointercancel'].forEach(t => rail.addEventListener(t, () => drag = null));
    let vis = false; new IntersectionObserver(([e]) => vis = e.isIntersecting).observe(rail);
    let cur = speed;
    gsap.ticker.add(() => {
      if (!vis) return;
      cur += (target - cur) * .06;
      if (!drag) x -= cur;
      if (x <= -half) x += half; if (x > 0) x -= half;
      track.style.transform = `translate3d(${x}px,0,0)`;
    });
  }

  /* ---------- loader (só na 1ª visita da sessão, na home) ---------- */
  const loader = $('#loader');
  const firstVisit = page === 'home' && !sessionStorage.getItem('bc-visited');
  sessionStorage.setItem('bc-visited', '1');
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' }, paused: true });
  if (!reduce && $('.hero')) {
    window.heroGL.reveal = 0;
    intro.from('.hero__shell', { scale: .97, duration: 1.6 }, 0)
      .from('.hero__title .up', { yPercent: 110, duration: 1.3, stagger: .1 }, .1)
      .from('.hero__h1-wrap', { opacity: 0, y: 20, duration: 1 }, .4)
      .to(window.heroGL, { reveal: 1, duration: 2.2, ease: 'power3.out' }, .2)
      .from('.hero__figure', { yPercent: 6, duration: 1.8 }, .2)
      .from('.tag', { opacity: 0, y: 20, scale: .9, duration: 1, stagger: .12 }, 1.2)
      .from('.hero__stats > *', { opacity: 0, y: 24, duration: 1, stagger: .08 }, .9)
      .from('.hero .book', { opacity: 0, y: 50, duration: 1.4 }, .5)
      .from('.hero__foot', { opacity: 0, duration: 1 }, 1.1);
  } else if (!reduce && $('.phero')) {
    intro.from('.phero__title .up', { yPercent: 110, duration: 1.3, stagger: .12 }, 0)
      .from('.crumbs, .phero .kicker, .phero__lede', { opacity: 0, y: 20, duration: 1, stagger: .08 }, .2)
      .from('.phero__mark', { opacity: 0, rotate: -8, scale: .9, duration: 1.8 }, .1);
  }
  intro.from('.nav > *', { opacity: 0, y: -16, duration: 1, stagger: .07, clearProps: 'opacity,transform' }, .3);

  if (reduce) { loader.remove(); intro.progress(1); }
  else if (firstVisit) {
    document.body.classList.add('is-locked'); lenis.stop();
    const pct = { v: 0 }, pctEl = $('#loaderPct');
    gsap.set(loader, { clipPath: 'inset(0 0 0% 0)' });
    gsap.timeline({ defaults: { ease: 'expo.out' } })
      .to('.loader__mark', { opacity: 1, scale: 1, duration: 1.4 }, 0)
      .to('.loader__word span', { y: 0, duration: 1, stagger: .045 }, .5)
      .to(pct, { v: 100, duration: 1.7, ease: 'power2.inOut', onUpdate: () => pctEl.textContent = String(Math.round(pct.v)).padStart(3, '0') }, 0)
      .to('.loader__word span', { y: '-110%', duration: .55, stagger: .025, ease: 'power3.in' }, 1.8)
      .to('.loader__mark', { scale: .7, opacity: 0, duration: .55, ease: 'power3.in' }, 1.85)
      .to(loader, { clipPath: 'inset(0 0 100% 0)', duration: 1, ease: 'expo.inOut' }, 2.15)
      .add(() => { loader.remove(); document.body.classList.remove('is-locked'); lenis.start(); intro.play(); }, 2.5);
  } else {
    loader.remove();
    // entrada vindo de outra página: cortina sai de cena
    gsap.set(curtain, { clipPath: 'inset(0% 0 0 0)' });
    gsap.set(clogo, { opacity: 1, scale: 1 });
    gsap.timeline()
      .to(clogo, { opacity: 0, scale: 1.08, duration: .45, ease: 'power2.in' })
      .to(curtain, { clipPath: 'inset(0% 0% 100% 0%)', duration: .9, ease: 'power4.inOut' }, .15)
      .add(() => intro.play(), .35);
  }
  if (reduce) return;

  /* ---------- hero (home) ---------- */
  if ($('.hero__figure')) gsap.to(window.heroGL, { scroll: 1, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  if ($('.phero__mark')) gsap.to('.phero__mark', { rotate: 10, yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.phero', start: 'top top', end: 'bottom top', scrub: true } });

  /* ---------- marquee ---------- */
  const mtrack = $('.marquee__track');
  if (mtrack) {
    mtrack.innerHTML += mtrack.innerHTML;
    const mq = gsap.to(mtrack, { xPercent: -50, duration: 34, ease: 'none', repeat: -1 });
    lenis.on('scroll', ({ velocity }) => gsap.to(mq, { timeScale: (1 + Math.min(Math.abs(velocity) / 7, 4)) * (velocity < 0 ? -1 : 1), duration: .4, overwrite: true }));
  }

  /* ---------- títulos e textos ---------- */
  $$('main section:not(.hero):not(.phero) .h2, .ritual__title').forEach(h =>
    gsap.from($$('.up', h), { yPercent: 110, duration: 1.3, stagger: .1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 88%' } }));
  $$('main section:not(.hero):not(.phero) .kicker').forEach(k => gsap.from(k, { opacity: 0, x: -20, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: k, start: 'top 92%' } }));
  $$('[data-words]').forEach(el => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(' ');
    gsap.to($$('.w', el), { color: '#EFE9DD', stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 60%', scrub: true } });
  });
  $$('[data-count]').forEach(el => { const o = { v: 0 }; gsap.to(o, { v: +el.dataset.count, duration: 2, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%' }, onUpdate: () => el.textContent = Math.round(o.v) }); });

  /* ---------- entradas por seção (rodam sozinhas ao aparecer) ---------- */
  const rise = (sel, trig, o = {}) => $(sel) && gsap.from(sel, Object.assign({ y: 60, opacity: 0, duration: 1.2, stagger: .08, ease: 'expo.out', scrollTrigger: { trigger: trig || sel, start: 'top 86%' } }, o));
  rise('main section:not(.hero) .book', null, { rotate: 1.5, y: 80 }); rise('.prices li', '.prices', { stagger: .06 });
  rise('.quote', null, { rotate: -3 }); rise('.member', '.team', { y: 90, stagger: .12 }); rise('.faq details', '.faq__list', { y: 30 });
  rise('.tile', '.contact__info'); rise('.timeline li', '.timeline', { y: 30 }); rise('.outside__card'); rise('.outside__img', null, { y: 100 });
  rise('.filters button', '.filters', { y: 20, stagger: .04 }); rise('.ig-band');
  $$('.g').forEach((g, i) => gsap.from(g, { y: 70, opacity: 0, duration: 1.1, delay: (i % 4) * .06, ease: 'expo.out', scrollTrigger: { trigger: g, start: 'top 94%' } }));
  $$('.visit__photo, .story__img, .local__photo, .local__map, .outside__img, .space__grid .ph, .member__photo').forEach(el =>
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'expo.inOut', scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('.visit__photo img, .story__img img, .space__grid .ph img').forEach(img =>
    gsap.fromTo(img, { yPercent: -6, scale: 1.12 }, { yPercent: 6, scale: 1.12, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
  $$('.cta-band .h2').forEach(h => gsap.from($('.btn', h.parentElement), { y: 30, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%' } }));

  /* ---------- mais que uma barbearia: abre sozinho ao entrar na tela ---------- */
  if ($('.ritual__reels')) {
    const reels = $$('.reel');
    gsap.timeline({ scrollTrigger: { trigger: '.ritual__reels', start: 'top 80%', once: true }, defaults: { ease: 'expo.out' } })
      .fromTo(reels, { clipPath: 'inset(100% 0% 0% 0% round 40px)', y: 80 }, { clipPath: 'inset(0% 0% 0% 0% round 40px)', y: (i, el) => el.classList.contains('reel--main') ? 0 : 0, duration: 1.6, stagger: { each: .14, from: 'center' } })
      .fromTo($$('.reel video'), { scale: 1.3 }, { scale: 1, duration: 2.2, stagger: { each: .14, from: 'center' } }, 0)
      .from($$('.reel figcaption'), { opacity: 0, y: 20, duration: .8, stagger: .1 }, .9)
      .from('.ritual__cta > *', { opacity: 0, y: 30, duration: 1, stagger: .1 }, 1);
    gsap.from('.ritual__arrow', { opacity: 0, y: -30, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ritual__head', start: 'top 80%' } });
  }
  rise('.works__head > *', '.works__head', { y: 30 });
  rise('.works__rail', null, { x: 120, y: 0, duration: 1.6 }); rise('.works .marquee', null, { y: 30 });

  gsap.from('.foot__word', { yPercent: 60, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.foot', start: 'top 85%', end: 'bottom bottom', scrub: true } });

  /* ---------- micro-interações desktop ---------- */
  if (fine) {
    $$('.work, .g').forEach(c => {
      c.addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); c.style.setProperty('--gx', `${e.clientX - r.left}px`); c.style.setProperty('--gy', `${e.clientY - r.top}px`); });
    });
    $$('.btn, .chip, .ico, .tile__ic, .soc').forEach(el => {
      const xT = gsap.quickTo(el, 'x', { duration: .6, ease: 'elastic.out(1,.45)' }), yT = gsap.quickTo(el, 'y', { duration: .6, ease: 'elastic.out(1,.45)' });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); xT((e.clientX - r.left - r.width / 2) * .22); yT((e.clientY - r.top - r.height / 2) * .32); });
      el.addEventListener('pointerleave', () => { xT(0); yT(0); });
    });
  }
  addEventListener('load', () => ScrollTrigger.refresh());
})();
