(() => {
  const stage = document.getElementById('stage'), ring = document.getElementById('ring'), hint = document.getElementById('hint');
  const panels = [...ring.querySelectorAll('.panel')], N = panels.length;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pos = 0, target = 0, vel = 0, dragging = false, moved = 0, lastX = 0, lastT = 0, snapTimer, mx = 0, my = 0, px = 0, py = 0;
  const sp = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pw')) + 36;
  const soft = v => v < 0 ? v * .3 : v > N - 1 ? N - 1 + (v - (N - 1)) * .3 : v;
  const settle = () => { target = Math.max(0, Math.min(N - 1, Math.round(target))); };
  const hide = () => hint.classList.add('gone');
  const goTo = i => { target = Math.max(0, Math.min(N - 1, i)); hide(); };

  stage.addEventListener('pointerdown', e => { if (e.target.closest('.arrows')) return; dragging = true; moved = 0; vel = 0; lastX = e.clientX; lastT = performance.now(); stage.classList.add('dragging'); });
  addEventListener('pointermove', e => {
    mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5;
    if (!dragging) return;
    const dx = e.clientX - lastX, now = performance.now(), d = dx / sp();
    moved += Math.abs(dx); target = soft(target - d);
    vel = -d / Math.max(now - lastT, 1) * 16; lastX = e.clientX; lastT = now;
    if (moved > 6) hide();
  });
  const release = () => { if (!dragging) return; dragging = false; stage.classList.remove('dragging'); target = soft(target + vel * 9); settle(); };
  addEventListener('pointerup', release); addEventListener('pointercancel', release);

  stage.addEventListener('click', e => {
    const p = e.target.closest('.panel');
    if (moved > 6) { e.preventDefault(); e.stopPropagation(); }
    else if (p && +p.dataset.i !== Math.round(target)) { e.preventDefault(); e.stopPropagation(); goTo(+p.dataset.i); }
  }, true);
  stage.addEventListener('dragstart', e => e.preventDefault());
  stage.addEventListener('wheel', e => {
    if (!(Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey)) return;
    e.preventDefault(); hide(); target = soft(target + (e.deltaX || e.deltaY) / sp() * 1.2);
    clearTimeout(snapTimer); snapTimer = setTimeout(settle, 140);
  }, { passive: false });
  stage.addEventListener('keydown', e => { if (e.key === 'ArrowRight') goTo(Math.round(target) + 1); if (e.key === 'ArrowLeft') goTo(Math.round(target) - 1); });
  document.getElementById('next').onclick = () => goTo(Math.round(target) + 1);
  document.getElementById('prev').onclick = () => goTo(Math.round(target) - 1);

  // Flat wall that slides sideways; panels bend toward the viewer the further they are from the centre
  function frame() {
    pos += (target - pos) * (reduce ? 1 : .1); px += (mx - px) * .05; py += (my - py) * .05;
    const S = sp();
    ring.style.transform = `translateY(-50%) rotateX(${py * -3}deg) rotateY(${px * 2}deg)`;
    panels.forEach((p, i) => {
      const d = i - pos, ad = Math.abs(d), c = Math.max(-2.2, Math.min(2.2, d));
      p.style.transform = `translate3d(${d * S}px,0,${-Math.min(ad, 3) * 110}px) rotateY(${c * 24}deg)`;
      p.style.opacity = Math.max(.3, 1 - ad * .32).toFixed(3);
      p.style.filter = `brightness(${Math.max(.55, 1 - ad * .22).toFixed(3)})`;
    });
    requestAnimationFrame(frame);
  }
  pos = reduce ? 0 : -1.4; target = 0; frame();
})();

/* ================= Scratch-card intro ================= */
(() => {
  const c = document.getElementById('scratch'), skip = document.getElementById('skip');
  const x = c.getContext('2d'); let W, H, dpr, done = false, touched = false, R;
  document.body.classList.add('locked');

  function paint() {
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; R = Math.max(26, Math.min(W, H) * .055);
    c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    const g = x.createLinearGradient(0, 0, W, H);
    ['#8d8f96', '#d9dbe0', '#9a9ca3', '#eceef2', '#8a8c93'].forEach((col, i, a) => g.addColorStop(i / (a.length - 1), col));
    x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.globalAlpha = .12;
    for (let i = 0; i < 900; i++) { x.fillStyle = Math.random() < .5 ? '#fff' : '#000'; x.fillRect(Math.random() * W, Math.random() * H, 1.5, 40 * Math.random()); }
    x.globalAlpha = 1;
    x.fillStyle = '#23242a'; x.textAlign = 'center'; x.font = `300 ${Math.min(W * .09, 78)}px Fraunces, Georgia, serif`;
    x.fillText('UndefinedNuke', W / 2, H / 2 - 6);
    x.font = `400 ${Math.min(W * .035, 16)}px "Instrument Sans", sans-serif`;
    x.fillText('Scratch to enter', W / 2, H / 2 + 28);
  }
  const dot = (px, py) => { x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(px, py, R, 0, 7); x.fill(); x.globalCompositeOperation = 'source-over'; };
  const line = (a, b) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (R * .4)) || 1; for (let i = 0; i <= n; i++) dot(a[0] + (b[0] - a[0]) * i / n, a[1] + (b[1] - a[1]) * i / n); };

  function cleared() {
    const d = x.getImageData(0, 0, c.width, c.height).data, s = 24 * dpr; let t = 0, k = 0;
    for (let yy = 0; yy < c.height; yy += s) for (let xx = 0; xx < c.width; xx += s) { t++; if (d[((yy | 0) * c.width + (xx | 0)) * 4 + 3] < 20) k++; }
    return k / t;
  }
  function finish() {
    if (done) return; done = true; c.classList.add('done'); skip.classList.add('gone');
    document.body.classList.remove('locked'); setTimeout(() => c.remove(), 1100);
  }

  let last = null, down = false, tick = 0;
  c.addEventListener('pointerdown', e => { down = touched = true; last = [e.clientX, e.clientY]; dot(...last); });
  c.addEventListener('pointermove', e => {
    if (!down) return; const p = [e.clientX, e.clientY]; line(last, p); last = p;
    if (++tick % 8 === 0 && cleared() > .5) finish();
  });
  addEventListener('pointerup', () => { down = false; if (!done && cleared() > .5) finish(); });
  skip.addEventListener('click', finish);

  // Auto-scratch demo if the visitor does nothing
  setTimeout(() => {
    if (touched || done) return;
    const rows = Math.ceil(H / (R * 1.5)); let r = 0, p = 0, prev = null;
    (function step() {
      if (touched || done) return;
      const dir = r % 2 ? -1 : 1, px = dir > 0 ? p * W : W - p * W, py = r * R * 1.5 + R * .5 + Math.sin(p * 14) * R * .4, cur = [px, py];
      if (prev) line(prev, cur); prev = cur; p += .035;
      if (p > 1) { p = 0; r++; prev = null; }
      if (r >= rows) return finish();
      if (r % 2 === 0 && p === 0 && cleared() > .5) return finish();
      requestAnimationFrame(step);
    })();
  }, 3500);

  paint(); addEventListener('resize', () => { if (!done) paint(); });
})();

/* ================= Snake that follows page scroll ================= */
(() => {
  const c = document.getElementById('snake'), x = c.getContext('2d');
  const N = 46, SEG = 9; let W, H, dpr, seg = [], alpha = 0, hx = 0, hy = 0, t = 0, was = false;
  const size = () => { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener('resize', size);

  function frame() {
    const max = document.documentElement.scrollHeight - innerHeight, y = scrollY, p = max > 0 ? y / max : 0;
    const on = p > .004 && p < .985;                       // appears when scrolling starts, vanishes at the very end
    const tx = W - (W < 700 ? 24 : 44) + Math.sin(y * .012) * (W < 700 ? 10 : 22), ty = 60 + p * (H - 120);
    if (on && !was) { hx = tx; hy = -40; seg = Array.from({ length: N }, () => [hx, hy]); }
    was = on; alpha += ((on ? 1 : 0) - alpha) * (on ? .12 : .08); t += .05;
    x.clearRect(0, 0, W, H);
    if (alpha < .01) return requestAnimationFrame(frame);

    hx += (tx - hx) * .14; hy += (ty - hy) * .14;
    seg[0] = [hx + Math.sin(t * 2) * 2, hy + Math.cos(t * 1.6) * 2];
    for (let i = 1; i < N; i++) {                          // each segment trails the previous one
      const a = seg[i - 1], b = seg[i], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
      b[0] = a[0] + dx / d * SEG; b[1] = a[1] + dy / d * SEG + .35;
      b[0] += Math.sin(t * 2 + i * .5) * .35;
    }
    x.globalAlpha = alpha; x.lineCap = 'round';
    for (let i = N - 1; i > 0; i--) {
      const w = 2 + (1 - i / N) * 9;
      x.strokeStyle = `rgba(${216 - i},${210 - i},${196 - i},${.25 + .75 * (1 - i / N)})`; x.lineWidth = w;
      x.beginPath(); x.moveTo(...seg[i]); x.lineTo(...seg[i - 1]); x.stroke();
    }
    const h = seg[0], n = seg[2], ang = Math.atan2(h[1] - n[1], h[0] - n[0]);
    x.shadowColor = 'rgba(216,210,196,.6)'; x.shadowBlur = 14; x.fillStyle = '#ece8dc';
    x.beginPath(); x.arc(h[0], h[1], 7, 0, 7); x.fill(); x.shadowBlur = 0;
    x.fillStyle = '#08090c';
    for (const s of [-1, 1]) { x.beginPath(); x.arc(h[0] + Math.cos(ang) * 2.5 - Math.sin(ang) * 3 * s, h[1] + Math.sin(ang) * 2.5 + Math.cos(ang) * 3 * s, 1.3, 0, 7); x.fill(); }
    x.strokeStyle = '#c9544a'; x.lineWidth = 1.2; x.beginPath();
    const tl = 7 + Math.sin(t * 6) * 2; x.moveTo(h[0] + Math.cos(ang) * 7, h[1] + Math.sin(ang) * 7);
    x.lineTo(h[0] + Math.cos(ang) * (7 + tl), h[1] + Math.sin(ang) * (7 + tl)); x.stroke();
    x.globalAlpha = 1; requestAnimationFrame(frame);
  }
  frame();
})();

/* ================= SaaS layer: nav, effects ================= */
(() => {
  const $ = (s, r = document) => [...r.querySelectorAll(s)], body = document.body;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, fine = matchMedia('(pointer:fine)').matches;

  // Menu
  const burger = document.getElementById('burger'), menu = document.getElementById('menu');
  const setMenu = o => { body.classList.toggle('menu-open', o); burger.setAttribute('aria-expanded', o); menu.setAttribute('aria-hidden', !o); };
  burger.onclick = () => setMenu(!body.classList.contains('menu-open'));
  $('#menu a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && setMenu(false));

  // Scroll progress bar
  const bar = document.getElementById('bar');
  addEventListener('scroll', () => { const m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${m > 0 ? scrollY / m : 0})`; }, { passive: true });

  // Reveal on scroll + counters
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; e.target.classList.add('in'); io.unobserve(e.target);
    const n = e.target.querySelector('[data-n]'); if (!n) return;
    const end = +n.dataset.n, s = n.dataset.s || '', t0 = performance.now();
    (function up(t) { const k = Math.min((t - t0) / 1400, 1); n.textContent = Math.round(end * (1 - Math.pow(1 - k, 3))) + s; if (k < 1) requestAnimationFrame(up); })(t0);
  }), { threshold: .2 });
  $('.feat,.tl li,.term,.stat,.faq details,.card,.sec h2,.sec .sub,.contact h2,.contact .sub').forEach((el, i) => { el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 90 + 'ms'; io.observe(el); });

  // Spotlight follows the pointer inside cards
  addEventListener('pointermove', e => {
    const el = e.target.closest && e.target.closest('.spot,.card'); if (!el) return;
    const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px');
  });

  // Terminal typing demo
  const term = document.getElementById('term'), lines = term.dataset.lines.split('|');
  new IntersectionObserver((es, o) => { if (!es[0].isIntersecting) return; o.disconnect();
    if (reduce) { term.innerHTML = lines.join('\n').replace(/\[ok\]/g, '<span class="ok">ok</span>'); return; }
    let l = 0, ch = 0, out = '';
    (function t() { if (l >= lines.length) return; const ln = lines[l];
      if (ch < ln.length) { out += ln[ch++]; } else { out += '\n'; l++; ch = 0; }
      term.innerHTML = out.replace(/\[ok\]/g, '<span class="ok">ok</span>'); setTimeout(t, ln[ch - 1] === ' ' ? 10 : 22); })();
  }, { threshold: .5 }).observe(term);

  // Back to top
  const top = document.getElementById('top');
  top.onclick = () => scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  addEventListener('scroll', () => top.classList.toggle('show', scrollY > innerHeight * .8), { passive: true });

  if (!fine || reduce) return;

  // Cursor ring
  const ring = Object.assign(document.createElement('div'), { id: 'curring' }); body.append(ring);
  let cx = 0, cy = 0, rx = 0, ry = 0;
  addEventListener('pointermove', e => { cx = e.clientX; cy = e.clientY; ring.classList.toggle('big', !!e.target.closest('a,button,summary,.panel')); });
  (function f() { rx += (cx - rx) * .18; ry += (cy - ry) * .18; ring.style.transform = `translate(${rx}px,${ry}px)`; requestAnimationFrame(f); })();

  // Magnetic buttons
  $('.magnet,.actions a').forEach(b => {
    b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px,${(e.clientY - r.top - r.height / 2) * .35}px)`; });
    b.addEventListener('pointerleave', () => b.style.transform = '');
  });

  // Text scramble on the name
  const G = '!<>-_\\/[]{}=+*^?#abcdefxyz';
  function scramble(el) {
    const txt = el.dataset.t || (el.dataset.t = el.textContent); let f = 0;
    (function s() { el.textContent = [...txt].map((c, i) => i < f / 2 ? c : G[Math.random() * G.length | 0]).join(''); if (++f <= txt.length * 2) requestAnimationFrame(s); else el.textContent = txt; })();
  }
  const name = document.querySelector('.name'), logo = document.querySelector('.logo');
  [name, logo].forEach(el => el.addEventListener('pointerenter', () => scramble(el)));
  setTimeout(() => scramble(name), 1200);

  // 3D tilt on hover for the centred project panel
  $('.panel-inner').forEach(p => {
    p.style.transition = 'transform .25s';
    p.addEventListener('pointermove', e => { const r = p.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; p.style.transform = `rotateX(${-y * 8}deg) rotateY(${x * 10}deg)`; });
    p.addEventListener('pointerleave', () => p.style.transform = '');
  });
})();

/* ================= Language + theme switch ================= */
(() => {
  const root = document.documentElement, $ = s => [...document.querySelectorAll(s)];
  const get = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
  const put = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
  let lang = get('lang') || ((navigator.language || '').toLowerCase().startsWith('ru') ? 'ru' : 'en');
  let theme = get('theme') || 'dark';
  const lb = document.getElementById('lang'), tb = document.getElementById('theme');
  $('[data-ru]').forEach(el => el.dataset.en = el.textContent);
  function apply() {
    root.dataset.theme = theme; root.lang = lang;
    $('[data-ru]').forEach(el => el.textContent = lang === 'ru' ? el.dataset.ru : el.dataset.en);
    lb.textContent = lang === 'ru' ? 'EN' : 'RU'; tb.textContent = theme === 'dark' ? '☀' : '☾';
  }
  lb.onclick = () => { lang = lang === 'ru' ? 'en' : 'ru'; put('lang', lang); apply(); };
  tb.onclick = () => { theme = theme === 'dark' ? 'light' : 'dark'; put('theme', theme); apply(); };
  apply();
})();
