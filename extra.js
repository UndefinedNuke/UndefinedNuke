/* Idea form + digital-rain that "draws" the three-head logo */
(() => {
  const WEBHOOK = ''; // optional: paste a Discord webhook URL to receive ideas silently
  const TG = 'Lirrise', MAIL = 'officaljobcore@gmail.com';
  const root = document.documentElement, ru = () => root.lang === 'ru';
  const f = document.getElementById('ideaForm'), st = document.getElementById('st'), ih = document.getElementById('ih'), it = document.getElementById('it');
  const T = { ph: ['@username или ссылка', 'Ваша идея: что мне сделать?'], ph0: ['@username', 'Your idea: what should I build?'],
    ok: ['Отправлено, спасибо!', 'Sent, thank you!'], tg: ['Открыл Telegram: осталось нажать «Отправить». Текст скопирован.', 'Telegram opened: just press Send. Text copied.'],
    mail: ['Открыл почту, осталось отправить письмо.', 'Mail app opened, just hit send.'], err: ['Не вышло отправить, попробуйте через Telegram.', 'Could not send, try Telegram.'] };
  const L = k => T[k][ru() ? 0 : 1];
  const ph = () => { const p = ru() ? T.ph : T.ph0; ih.placeholder = p[0]; it.placeholder = p[1]; };
  ph(); new MutationObserver(ph).observe(root, { attributes: true, attributeFilter: ['lang'] });
  const msg = () => `💡 Idea\nFrom: ${f.pl.value} ${ih.value.trim()}\n\n${it.value.trim()}`;
  f.addEventListener('submit', async e => {
    e.preventDefault(); const m = msg();
    if (WEBHOOK) { try { const r = await fetch(WEBHOOK, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: m.slice(0, 1900) }) }); if (!r.ok) throw 0; st.textContent = L('ok'); f.reset(); } catch { st.textContent = L('err'); } return; }
    try { navigator.clipboard.writeText(m); } catch {}
    open(`https://t.me/${TG}?text=${encodeURIComponent(m)}`, '_blank', 'noopener'); st.textContent = L('tg');
  });
  document.getElementById('viaMail').onclick = () => { if (!f.reportValidity()) return; location.href = `mailto:${MAIL}?subject=${encodeURIComponent('Idea from ' + ih.value.trim())}&body=${encodeURIComponent(msg())}`; st.textContent = L('mail'); };

  // ---- digital rain
  const c = document.getElementById('rain'), x = c.getContext('2d'), sec = c.parentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches, CH = '01', CW = 14, CHh = 16;
  let W, H, cols, rows, drops, lv, mask, vis = false, tick = 0;
  const img = new Image(); img.src = getComputedStyle(root).getPropertyValue('--logo').replace(/^url\(|\)$/g, '').replace(/["']/g, '').trim();
  function size() {
    const d = Math.min(devicePixelRatio || 1, 2); W = sec.clientWidth; H = sec.clientHeight;
    c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
    cols = Math.ceil(W / CW); rows = Math.ceil(H / CHh);
    drops = Array.from({ length: cols }, () => ({ y: Math.random() * rows, v: .25 + Math.random() * .5 }));
    lv = new Float32Array(cols * rows); mask = new Uint8Array(cols * rows);
    if (!img.complete) return;
    const o = document.createElement('canvas'); o.width = cols; o.height = rows; const q = o.getContext('2d');
    const s = Math.min(rows * .85, cols * (W < 820 ? .8 : .42) * 227 / 260), w = s * 260 / 227, cx = W < 820 ? cols / 2 : cols * .26;
    q.drawImage(img, cx - w / 2, rows / 2 - s / 2, w, s);
    const a = q.getImageData(0, 0, cols, rows).data; for (let i = 0; i < cols * rows; i++) mask[i] = a[i * 4 + 3] > 110;
  }
  function draw() {
    x.clearRect(0, 0, W, H); x.font = '12px ui-monospace,Consolas,monospace'; x.textAlign = 'center';
    const col = getComputedStyle(root).getPropertyValue('--hk').trim() || '#8fd3a8', light = root.dataset.theme === 'light';
    x.fillStyle = col;
    for (let i = 0; i < cols; i++) {
      const d = drops[i]; if (!reduce) { d.y += d.v * .35; if (d.y > rows + 12) { d.y = -Math.random() * 10; d.v = .25 + Math.random() * .5; } }
      const h = d.y | 0;
      for (let r = 0; r < rows; r++) {
        const k = r * cols + i, dist = h - r, tr = dist >= 0 && dist < 14 ? 1 - dist / 14 : 0;
        if (mask[k]) { if (dist >= 0 && dist < 3) lv[k] = Math.min(1, lv[k] + .5); else lv[k] = Math.max(.12, lv[k] - .004); }
        const a = Math.max(mask[k] ? lv[k] : 0, tr * .5, reduce && mask[k] ? .8 : 0);
        if (a < .04) continue; x.globalAlpha = Math.min(1, a * (light ? 1.2 : 1));
        x.fillText(CH[(k * 7 + (tick >> 3) * (mask[k] ? 1 : 3)) % 2], i * CW + CW / 2, r * CHh + 12);
      }
    }
    x.globalAlpha = 1; tick++;
  }
  (function loop() { if (vis) draw(); if (!reduce) requestAnimationFrame(loop); })();
  new IntersectionObserver(es => { vis = es[0].isIntersecting; if (reduce && vis) draw(); }).observe(sec);
  img.onload = size; size(); addEventListener('resize', size);
})();
