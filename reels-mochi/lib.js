// Shared Mochi drawing library (extracted from mochi.html) + episode driver.

// ===== Mochi si Kucing Oren — "Senin Pagi" (16 s, 1080x1920, 30 fps) =====
const W = 1080, H = 1920, FPS = 30;
const cv = document.getElementById('c') || document.body.appendChild(Object.assign(document.createElement('canvas'), { id: 'c', width: W, height: H })), ctx = cv.getContext('2d');

// ---------- math / easing ----------
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const prog = (t, a, b) => clamp((t - a) / (b - a));
const eOut = t => 1 - Math.pow(1 - t, 3);
const eIn = t => t * t * t;
const eIO = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const eBack = t => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const eElastic = t => t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * 2 * Math.PI / 3) + 1;
function rng(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- palette (warm) ----------
const C = {
  ink: '#3B1F14', cat: '#F59A3C', catD: '#D46F22', cream: '#FFF1DC', pink: '#F48C86',
  wallA: '#FFD9A8', wallB: '#F5AE72', wood: '#A35A2E', woodD: '#7A3E1E', blanket: '#E8574A',
  blanketD: '#C23E35', yellow: '#FFD23F', white: '#FFFBF3', red: '#E2483D', teal: '#3FA7A0'
};
const FONT = '"Inter Display","Inter",sans-serif';

// ---------- primitives ----------
function rr(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fillStroke(fill, lw = 10, stroke = C.ink) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
function ell(x, y, rx, ry, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); }

// ---------- character: Mochi ----------
function drawCat(o) {
  const { x, y, s = 1, rot = 0, sq = 0, eyes = 'open', mouth = 'smile', run = -1, toast = false,
    blush = true, tail = 0, sweat = 0, shake = 0 } = o;
  ctx.save();
  ctx.translate(x + (shake ? Math.sin(shake * 97) * 6 : 0), y);
  ctx.rotate(rot);
  ctx.scale(s * (1 + sq), s * (1 - sq));
  // tail
  ctx.save();
  ctx.beginPath();
  const tw = Math.sin(tail) * 30;
  ctx.moveTo(130, 70);
  ctx.bezierCurveTo(230, 60, 240 + tw, -40, 200 + tw, -110);
  ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.strokeStyle = C.ink; ctx.stroke();
  ctx.lineWidth = 28; ctx.strokeStyle = C.cat; ctx.stroke();
  ctx.restore();
  // feet
  const feet = [[-75, 140], [75, 140]];
  feet.forEach(([fx, fy], i) => {
    let dx = 0, dy = 0;
    if (run >= 0) { const p = run + i * Math.PI; dx = Math.cos(p) * 40; dy = Math.min(0, Math.sin(p) * 36); }
    ell(fx + dx, fy + dy, 42, 28); fillStroke(C.cat);
  });
  // ears
  [[-1], [1]].forEach(([d]) => {
    ctx.beginPath();
    ctx.moveTo(d * 150, -40); ctx.lineTo(d * 120, -175); ctx.lineTo(d * 40, -125); ctx.closePath();
    fillStroke(C.cat);
    ctx.beginPath();
    ctx.moveTo(d * 128, -70); ctx.lineTo(d * 116, -145); ctx.lineTo(d * 70, -118); ctx.closePath();
    ctx.fillStyle = C.pink; ctx.fill();
  });
  // body (mochi blob)
  ctx.beginPath();
  ctx.moveTo(0, -150);
  ctx.bezierCurveTo(130, -150, 185, -60, 182, 30);
  ctx.bezierCurveTo(180, 120, 110, 160, 0, 160);
  ctx.bezierCurveTo(-110, 160, -180, 120, -182, 30);
  ctx.bezierCurveTo(-185, -60, -130, -150, 0, -150);
  fillStroke(C.cat, 11);
  // belly
  ell(0, 95, 95, 55); ctx.fillStyle = C.cream; ctx.fill();
  // forehead stripes
  ctx.strokeStyle = C.catD; ctx.lineWidth = 14; ctx.lineCap = 'round';
  [[-38, -138, -30, -100], [0, -146, 0, -104], [38, -138, 30, -100]].forEach(([a, b, c, d]) => {
    ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(c, d); ctx.stroke();
  });
  [[-1], [1]].forEach(([d]) => { // side stripes
    ctx.beginPath(); ctx.moveTo(d * 182, 0); ctx.lineTo(d * 150, 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d * 178, 40); ctx.lineTo(d * 146, 42); ctx.stroke();
  });
  // muzzle
  ell(-28, 34, 40, 30); ctx.fillStyle = C.cream; ctx.fill();
  ell(28, 34, 40, 30); ctx.fill();
  // blush
  if (blush) {
    ctx.fillStyle = 'rgba(244,110,110,.55)';
    ell(-105, 30, 30, 17); ctx.fill(); ell(105, 30, 30, 17); ctx.fill();
  }
  // eyes
  ctx.lineWidth = 10; ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
  [[-62], [62]].forEach(([ex]) => {
    const ey = -30;
    if (eyes === 'open') {
      ell(ex, ey, 17, 24); ctx.fillStyle = C.ink; ctx.fill();
      ell(ex + 6, ey - 9, 6, 7); ctx.fillStyle = '#fff'; ctx.fill();
    } else if (eyes === 'closed') {
      ctx.beginPath(); ctx.arc(ex, ey - 8, 22, Math.PI * .15, Math.PI * .85); ctx.stroke();
    } else if (eyes === 'happy') {
      ctx.beginPath(); ctx.arc(ex, ey + 10, 22, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else if (eyes === 'wide') {
      ell(ex, ey, 36, 38); fillStroke('#fff', 9);
      const j = shake ? Math.sin(shake * 53) * 3 : 0;
      ell(ex + j, ey + 2, 11, 11); ctx.fillStyle = C.ink; ctx.fill();
    } else if (eyes === 'flat') {
      ctx.beginPath(); ctx.moveTo(ex - 22, ey); ctx.lineTo(ex + 22, ey); ctx.stroke();
      ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ex - 24, ey - 22); ctx.lineTo(ex + 24, ey - 16); ctx.stroke(); ctx.lineWidth = 10;
    } else if (eyes === 'heart') {
      ctx.save(); ctx.translate(ex, ey); const hb = 1 + Math.sin((shake || 0) * 12) * .12; ctx.scale(.62 * hb, .62 * hb);
      ctx.beginPath(); ctx.moveTo(0, 30); ctx.bezierCurveTo(-60, -10, -40, -60, 0, -30); ctx.bezierCurveTo(40, -60, 60, -10, 0, 30);
      ctx.fillStyle = C.red; ctx.fill(); ctx.lineWidth = 12; ctx.stroke(); ctx.restore(); ctx.lineWidth = 10;
    } else if (eyes === 'sparkle') {
      ell(ex, ey, 24, 28); ctx.fillStyle = C.ink; ctx.fill();
      ell(ex + 8, ey - 10, 9, 10); ctx.fillStyle = '#fff'; ctx.fill();
      ell(ex - 9, ey + 10, 5, 5); ctx.fill();
      ctx.save(); ctx.translate(ex + 30, ey - 34); ctx.rotate((shake || 0) * 3); ctx.fillStyle = C.yellow;
      ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 6 : 18, a = k * Math.PI / 4; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.restore();
    } else if (eyes === 'determined') {
      ell(ex, ey, 17, 22); ctx.fillStyle = C.ink; ctx.fill();
      ell(ex + 6, ey - 8, 6, 7); ctx.fillStyle = '#fff'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(ex - 28 * Math.sign(ex), ey - 50); ctx.lineTo(ex + 22 * Math.sign(ex), ey - 34);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 11; ctx.stroke();
    }
  });
  // nose
  ctx.beginPath(); ctx.moveTo(-13, 14); ctx.lineTo(13, 14); ctx.lineTo(0, 28); ctx.closePath();
  ctx.fillStyle = C.pink; ctx.fill(); ctx.lineWidth = 5; ctx.stroke();
  // mouth
  ctx.lineWidth = 8;
  if (mouth === 'smile') {
    ctx.beginPath(); ctx.arc(-14, 30, 14, Math.PI * .1, Math.PI * .9); ctx.stroke();
    ctx.beginPath(); ctx.arc(14, 30, 14, Math.PI * .1, Math.PI * .9); ctx.stroke();
  } else if (mouth === 'flat') {
    ctx.beginPath(); ctx.moveTo(-16, 46); ctx.lineTo(16, 46); ctx.stroke();
  } else if (mouth === 'o') {
    ell(0, 52, 15, 18); fillStroke('#8A2B22', 7);
  } else if (mouth === 'scream') {
    ctx.beginPath(); ctx.moveTo(-40, 40); ctx.quadraticCurveTo(0, 30, 40, 40);
    ctx.quadraticCurveTo(30, 120, 0, 120); ctx.quadraticCurveTo(-30, 120, -40, 40);
    fillStroke('#8A2B22', 8);
    ell(0, 100, 20, 12); ctx.fillStyle = C.pink; ctx.fill();
  }
  // whiskers
  ctx.lineWidth = 5; ctx.strokeStyle = C.ink;
  [[-1], [1]].forEach(([d]) => {
    ctx.beginPath(); ctx.moveTo(d * 70, 30); ctx.lineTo(d * 125, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(d * 70, 44); ctx.lineTo(d * 125, 50); ctx.stroke();
  });
  // toast in mouth
  if (toast) {
    ctx.save(); ctx.translate(55, 62); ctx.rotate(.25);
    rr(-10, -38, 110, 92, 26); fillStroke('#E9A75A', 9);
    rr(4, -24, 82, 64, 18); ctx.fillStyle = '#FBE0B0'; ctx.fill();
    ctx.restore();
  }
  // sweat drops
  if (sweat > 0) {
    ctx.globalAlpha = sweat;
    [[175, -120, 1], [-185, -90, .8]].forEach(([sx, sy, sc]) => {
      ctx.save(); ctx.translate(sx, sy); ctx.scale(sc, sc);
      ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(22, 5, 0, 18); ctx.quadraticCurveTo(-22, 5, 0, -30);
      fillStroke('#8FD3F5', 6); ctx.restore();
    });
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

// ---------- captions ----------
function caption(text, t, t0, y, opts = {}) {
  const { size = 130, fill = C.white, hi = null, hiColor = C.yellow, rot = -0.03, shake = 0, out = 99 } = opts;
  const p = prog(t, t0, t0 + .35);
  if (p <= 0 || t > out) return;
  const sc = eBack(p);
  const lines = text.split('\n');
  ctx.save();
  ctx.translate(W / 2 + (shake ? Math.sin(t * 90) * shake : 0), y);
  ctx.rotate(rot + Math.sin(t * 2) * .01);
  ctx.scale(sc, sc);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => {
    let fs = size;
    ctx.font = `900 ${fs}px ${FONT}`;
    while (ctx.measureText(ln).width > 960 && fs > 40) { fs -= 4; ctx.font = `900 ${fs}px ${FONT}`; }
    const ly = (i - (lines.length - 1) / 2) * fs * 1.08;
    // shadow
    ctx.lineJoin = 'round'; ctx.miterLimit = 2;
    ctx.lineWidth = fs * .2; ctx.strokeStyle = 'rgba(59,31,20,.55)';
    ctx.strokeText(ln, 8, ly + 12);
    ctx.lineWidth = fs * .2; ctx.strokeStyle = C.ink; ctx.strokeText(ln, 0, ly);
    ctx.fillStyle = (hi !== null && hi.includes(i)) ? hiColor : fill;
    ctx.fillText(ln, 0, ly);
  });
  ctx.restore();
}
function pill(text, x, y, bg, fg, t, t0) {
  const p = eBack(prog(t, t0, t0 + .3)); if (p <= 0) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(p, p);
  ctx.font = `900 46px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = ctx.measureText(text).width + 70;
  rr(-w / 2, -42, w, 84, 42); fillStroke(bg, 8);
  ctx.fillStyle = fg; ctx.fillText(text, 0, 3);
  ctx.restore();
}

// ---------- props ----------
function sunRays(cx, cy, t, color, n = 14, len = 1400, alpha = .18) {
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * .15);
  ctx.fillStyle = color; ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    ctx.rotate(Math.PI * 2 / n);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(len, -90); ctx.lineTo(len, 90); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function bedroom(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, C.wallA); g.addColorStop(1, C.wallB);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // wallpaper dots
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  for (let yy = 0; yy < 1400; yy += 90) for (let xx = (yy / 90 % 2) * 45; xx < W; xx += 90) { ell(xx, yy, 7, 7); ctx.fill(); }
  // window
  ctx.save();
  rr(600, 330, 380, 420, 30); fillStroke('#FFE9B8', 14);
  ctx.save(); rr(600, 330, 380, 420, 30); ctx.clip();
  const sg = ctx.createRadialGradient(830, 470, 10, 830, 470, 300);
  sg.addColorStop(0, '#FFF6D5'); sg.addColorStop(.35, '#FFD07A'); sg.addColorStop(1, '#FFAE63');
  ctx.fillStyle = sg; ctx.fillRect(600, 330, 380, 420);
  ell(830, 480, 70, 70); ctx.fillStyle = '#FFF3C4'; ctx.fill();
  ctx.restore();
  ctx.lineWidth = 12; ctx.strokeStyle = C.ink;
  ctx.beginPath(); ctx.moveTo(790, 330); ctx.lineTo(790, 750); ctx.moveTo(600, 540); ctx.lineTo(980, 540); ctx.stroke();
  ctx.restore();
  // light beam from window
  ctx.save(); ctx.globalAlpha = .16 + Math.sin(t * 1.5) * .03; ctx.fillStyle = '#FFF4C8';
  ctx.beginPath(); ctx.moveTo(600, 330); ctx.lineTo(980, 750); ctx.lineTo(560, 1700); ctx.lineTo(120, 1700); ctx.closePath(); ctx.fill();
  ctx.restore();
  // floor
  ctx.fillStyle = '#C97A45'; ctx.fillRect(0, 1480, W, H - 1480);
  ctx.strokeStyle = 'rgba(59,31,20,.25)'; ctx.lineWidth = 6;
  for (let yy = 1540; yy < H; yy += 80) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
  ctx.fillStyle = C.ink; ctx.fillRect(0, 1472, W, 12);
  // headboard
  rr(330, 880, 720, 420, [60, 60, 0, 0]); fillStroke(C.wood, 12);
  rr(380, 930, 620, 330, 36); fillStroke(C.woodD, 0);
  // mattress
  rr(300, 1240, 780, 150, 30); fillStroke('#FFF6E8', 12);
  // legs
  rr(330, 1380, 40, 100, 10); fillStroke(C.woodD, 10);
  rr(1010, 1380, 40, 100, 10); fillStroke(C.woodD, 10);
  // pillow
  rr(420, 1080, 300, 170, 70); fillStroke(C.white, 12);
  // nightstand
  rr(40, 1230, 230, 250, 20); fillStroke(C.wood, 12);
  rr(70, 1300, 170, 70, 14); fillStroke(C.woodD, 8);
  ell(155, 1335, 12, 12); ctx.fillStyle = C.yellow; ctx.fill();
}
function blanket(t, y0 = 1230, breathe = 0) {
  ctx.beginPath();
  ctx.moveTo(300, y0 + 20 - breathe);
  ctx.bezierCurveTo(500, y0 - 40 - breathe, 800, y0 - 30, 1080, y0 + 10);
  ctx.lineTo(1090, 1420); ctx.bezierCurveTo(800, 1450, 500, 1440, 290, 1420); ctx.closePath();
  fillStroke(C.blanket, 12);
  ctx.save(); ctx.clip();
  ctx.fillStyle = C.blanketD;
  for (let i = 0; i < 8; i++) { rr(300 + i * 110, y0 - 60, 50, 300, 0); ctx.fill(); }
  ctx.restore();
  ctx.beginPath(); ctx.moveTo(300, y0 + 20 - breathe);
  ctx.bezierCurveTo(500, y0 - 40 - breathe, 800, y0 - 30, 1080, y0 + 10);
  ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.stroke();
}
function alarmClock(x, y, s, txt, ringing, t) {
  ctx.save(); ctx.translate(x, y);
  if (ringing) { ctx.rotate(Math.sin(t * 70) * .14); ctx.translate(Math.sin(t * 55) * 6, 0); }
  ctx.scale(s, s);
  // bells
  [[-1], [1]].forEach(([d]) => { ctx.beginPath(); ctx.arc(d * 70, -95, 40, Math.PI, 0); ctx.closePath(); ctx.save(); ctx.translate(0, 0); fillStroke(C.yellow, 9); ctx.restore(); });
  ctx.beginPath(); ctx.moveTo(-60, 90); ctx.lineTo(-85, 130); ctx.moveTo(60, 90); ctx.lineTo(85, 130); ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.stroke();
  ell(0, 0, 120, 112); fillStroke(C.red, 11);
  rr(-90, -45, 180, 90, 18); fillStroke('#2A1A12', 8);
  ctx.fillStyle = ringing && Math.floor(t * 8) % 2 ? '#FF6B5A' : '#FFB347';
  ctx.font = `900 64px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, 0, 4);
  ctx.restore();
  if (ringing) { // ring lines
    ctx.save(); ctx.translate(x, y - 20 * s); ctx.strokeStyle = C.ink; ctx.lineWidth = 10; ctx.lineCap = 'round';
    const k = (t * 6) % 1;
    [[-1], [1]].forEach(([d]) => {
      for (let i = 0; i < 3; i++) {
        const a = -Math.PI / 2 + d * (.6 + i * .35);
        const r1 = 160 * s + k * 20, r2 = 210 * s + k * 20;
        ctx.beginPath(); ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); ctx.stroke();
      }
    });
    ctx.restore();
  }
}
function zzz(t, x, y) {
  ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 3; i++) {
    const k = ((t * .6) + i / 3) % 1;
    ctx.globalAlpha = Math.sin(k * Math.PI);
    ctx.font = `900 ${60 + k * 50}px ${FONT}`;
    const px = x + k * 140 + Math.sin(k * 8) * 20, py = y - k * 220;
    ctx.lineWidth = 12; ctx.strokeStyle = C.ink; ctx.strokeText('Z', px, py);
    ctx.fillStyle = C.white; ctx.fillText('Z', px, py);
  }
  ctx.restore();
}
function heart(x, y, s, col = C.red) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(0, 30);
  ctx.bezierCurveTo(-60, -10, -40, -60, 0, -30);
  ctx.bezierCurveTo(40, -60, 60, -10, 0, 30);
  fillStroke(col, 8); ctx.restore();
}
function speedLines(t, n, seed, color = 'rgba(255,255,255,.75)') {
  const r = rng(seed);
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const yy = r() * H, sp = 2500 + r() * 2500, len = 150 + r() * 350;
    const xx = W + 400 - ((t * sp + r() * 3000) % (W + 800));
    ctx.lineWidth = 4 + r() * 10;
    ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx + len, yy); ctx.stroke();
  }
  ctx.restore();
}
function confetti(t, t0, seed) {
  if (t < t0) return;
  const r = rng(seed), cols = [C.yellow, C.red, C.teal, '#FF8FB1', C.white];
  const dt = t - t0;
  for (let i = 0; i < 90; i++) {
    const x0 = r() * W, vy = 300 + r() * 500, vx = (r() - .5) * 200, sp = r() * 10, c = cols[i % 5];
    const y = -60 - r() * 600 + vy * dt, x = x0 + vx * dt + Math.sin(dt * 3 + i) * 30;
    if (y > H + 50) continue;
    ctx.save(); ctx.translate(x, y); ctx.rotate(dt * sp + i);
    ctx.fillStyle = c; ctx.fillRect(-12, -7, 24, 14 * Math.abs(Math.cos(dt * 6 + i)) + 2);
    ctx.restore();
  }
}
function dust(x, y, t, seed, count = 6) {
  const r = rng(seed);
  for (let i = 0; i < count; i++) {
    const k = ((t * 2.2) + i / count) % 1;
    ctx.globalAlpha = (1 - k) * .9;
    ell(x - k * 260 - r() * 40, y - k * 60 * r(), 26 + k * 50, 22 + k * 40);
    fillStroke('#FFF1DC', 7);
  }
  ctx.globalAlpha = 1;
}

// ---------- transitions (overlays) ----------
function flash(t, t0, d = .3) { const k = prog(t, t0, t0 + d); if (k <= 0 || k >= 1) return; ctx.fillStyle = `rgba(255,248,230,${1 - k})`; ctx.fillRect(0, 0, W, H); }
function swipe(t, t0, d = .4) { // diagonal panels sweep
  const k = prog(t, t0 - d / 2, t0 + d / 2); if (k <= 0 || k >= 1) return;
  const cols = [C.yellow, C.cat, C.red];
  cols.forEach((c, i) => {
    const kk = clamp(k * 1.3 - i * .12);
    const x = lerp(-W * 2.2, W * 1.4, eIO(kk));
    ctx.save(); ctx.translate(x, 0); ctx.rotate(-.18);
    ctx.fillStyle = c; ctx.fillRect(0, -400, W * 1.1, H + 800);
    ctx.fillStyle = C.ink; ctx.fillRect(W * 1.1, -400, 16, H + 800);
    ctx.restore();
  });
}
function iris(t, t0, cx, cy, d = .4) {
  const k = prog(t, t0 - d, t0 + d); if (k <= 0 || k >= 1) return;
  const maxR = 1250;
  const r = k < .5 ? lerp(maxR, 0, eIn(k * 2)) : lerp(0, maxR, eOut((k - .5) * 2));
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, Math.max(r, 0.1), 0, Math.PI * 2, true);
  ctx.fillStyle = C.ink; ctx.fill('evenodd');
  ctx.restore();
}

// ---------- color grading ----------
const grain = document.createElement('canvas'); grain.width = 540; grain.height = 960;
(() => { const g = grain.getContext('2d'), d = g.createImageData(540, 960), r = rng(99);
  for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (r() - .5) * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0); })();
function grade(t) {
  ctx.save();
  ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,145,60,.45)'; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'multiply';
  const v = ctx.createRadialGradient(W / 2, H / 2, H * .3, W / 2, H / 2, H * .75);
  v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(150,70,30,.55)');
  ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = 'rgba(60,20,0,.08)'; ctx.fillRect(0, 0, W, H); // lifted blacks
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = .07;
  const f = Math.floor(t * FPS), ox = (f * 137) % 540, oy = (f * 251) % 960;
  ctx.translate(-ox, -oy); ctx.scale(2, 2);
  for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) ctx.drawImage(grain, a * 540, b * 960);
  ctx.restore();
}


// ======================= extra props for episodes =======================
function skyView(x, y, w, h, view, t) {
  if (view === 'rainbow') {
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#9FD8F0'); g.addColorStop(1, '#FFE7B8');
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ['#E2483D', '#F59A3C', '#FFD23F', '#6CC07A', '#3FA7A0', '#7C6CD9'].forEach((c, i) => {
      ctx.beginPath(); ctx.arc(x + w / 2, y + h + 40, 300 - i * 22, Math.PI, 0); ctx.lineWidth = 22; ctx.strokeStyle = c; ctx.stroke();
    });
    ell(x + w - 70, y + 80, 50, 50); ctx.fillStyle = '#FFF3C4'; ctx.fill();
  } else if (view === 'night') {
    ctx.fillStyle = '#3A2A55'; ctx.fillRect(x, y, w, h);
    ell(x + w - 100, y + 100, 50, 50); ctx.fillStyle = '#FFF3C4'; ctx.fill();
  } else {
    const sg = ctx.createRadialGradient(x + w * .6, y + 150, 10, x + w * .6, y + 150, 300);
    sg.addColorStop(0, '#FFF6D5'); sg.addColorStop(.35, '#FFD07A'); sg.addColorStop(1, '#FFAE63');
    ctx.fillStyle = sg; ctx.fillRect(x, y, w, h);
    ell(x + w * .6, y + 150, 70, 70); ctx.fillStyle = '#FFF3C4'; ctx.fill();
  }
}
function room(t, o = {}) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, o.wallA || C.wallA); g.addColorStop(1, o.wallB || C.wallB);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.22)';
  for (let yy = 0; yy < 1400; yy += 90) for (let xx = (yy / 90 % 2) * 45; xx < W; xx += 90) { ell(xx, yy, 7, 7); ctx.fill(); }
  if (o.window !== false) {
    const wx = o.wx ?? 600, wy = o.wy ?? 330;
    rr(wx, wy, 380, 420, 30); fillStroke('#FFE9B8', 14);
    ctx.save(); rr(wx, wy, 380, 420, 30); ctx.clip(); skyView(wx, wy, 380, 420, o.view || 'sun', t); ctx.restore();
    rr(wx, wy, 380, 420, 30); fillStroke(null, 14);
    ctx.lineWidth = 12; ctx.strokeStyle = C.ink;
    ctx.beginPath(); ctx.moveTo(wx + 190, wy); ctx.lineTo(wx + 190, wy + 420); ctx.moveTo(wx, wy + 210); ctx.lineTo(wx + 380, wy + 210); ctx.stroke();
  }
  ctx.fillStyle = '#C97A45'; ctx.fillRect(0, 1480, W, H - 1480);
  ctx.strokeStyle = 'rgba(59,31,20,.25)'; ctx.lineWidth = 6;
  for (let yy = 1540; yy < H; yy += 80) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
  ctx.fillStyle = C.ink; ctx.fillRect(0, 1472, W, 12);
}
function calendar(x, y, s, txt, sub) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-120, -130, 240, 260, 22); fillStroke(C.white, 10);
  rr(-120, -130, 240, 70, [22, 22, 0, 0]); fillStroke(C.red, 10);
  ctx.fillStyle = C.white; ctx.font = `900 34px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(sub, 0, -94);
  ctx.fillStyle = C.ink; ctx.font = `900 130px ${FONT}`; ctx.fillText(txt, 0, 40);
  ctx.restore();
}
function desk(y = 1300) {
  rr(60, y, 960, 46, 14); fillStroke(C.wood, 11);
  rr(110, y + 40, 40, 190, 8); fillStroke(C.woodD, 9); rr(930, y + 40, 40, 190, 8); fillStroke(C.woodD, 9);
}
function laptop(x, y, s, open, screenFn) { // y = base level
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (open) {
    rr(-230, -330, 460, 300, 22); fillStroke('#4A3A34', 11);
    ctx.save(); rr(-210, -312, 420, 262, 12); ctx.clip(); ctx.fillStyle = '#FFF6E8'; ctx.fillRect(-210, -312, 420, 262);
    ctx.translate(0, -181); if (screenFn) screenFn(); ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(-260, -30); ctx.lineTo(260, -30); ctx.lineTo(290, 0); ctx.lineTo(-290, 0); ctx.closePath(); fillStroke('#7A6A62', 10);
  if (!open) { rr(-235, -52, 470, 26, 10); fillStroke('#4A3A34', 9); }
  ctx.restore();
}
function phone(x, y, s, rot, screenFn) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-110, -200, 220, 400, 36); fillStroke('#3B2B26', 10);
  ctx.save(); rr(-94, -182, 188, 362, 24); ctx.clip(); ctx.fillStyle = '#FFF6E8'; ctx.fillRect(-94, -182, 188, 362);
  if (screenFn) screenFn(); ctx.restore();
  ctx.restore();
}
function notif(x, y, title, body, t, t0, color = C.teal, w = 920, icon = '!', sc = 1) {
  const p = prog(t, t0, t0 + .3); if (p <= 0) return;
  ctx.save(); ctx.translate(x, y - (1 - eOut(p)) * 60); ctx.globalAlpha = Math.min(1, p * 2); ctx.scale(sc * lerp(.85, 1, eBack(p)), sc * lerp(.85, 1, eBack(p)));
  rr(-w / 2 + 8, -78 + 12, w, 156, 34); ctx.fillStyle = 'rgba(59,31,20,.35)'; ctx.fill();
  rr(-w / 2, -78, w, 156, 34); fillStroke(C.white, 9);
  ell(-w / 2 + 82, 0, 46, 46); fillStroke(color, 8);
  ctx.fillStyle = C.white; ctx.font = `900 50px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(icon, -w / 2 + 82, 3);
  ctx.textAlign = 'left'; ctx.fillStyle = C.ink; ctx.font = `900 40px ${FONT}`; ctx.fillText(title, -w / 2 + 150, -26);
  ctx.font = `700 38px ${FONT}`; ctx.fillStyle = '#6B4A3A'; ctx.fillText(body, -w / 2 + 150, 28);
  ctx.restore();
}
function bill(x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-110, -56, 220, 112, 12); fillStroke('#EE7A6E', 8);
  ell(0, 0, 38, 38); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fill();
  ctx.fillStyle = C.ink; ctx.font = `900 30px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('100RB', -50, -28); ctx.fillText('100RB', 50, 30);
  ctx.restore();
}
function moneyRain(t, t0, seed, n = 26, up = false) {
  if (t < t0) return; const r = rng(seed), dt = t - t0;
  for (let i = 0; i < n; i++) {
    const x0 = r() * W, sp = 500 + r() * 600, y0 = up ? 1200 + r() * 400 : -150 - r() * 900, ph = r() * 6;
    const y = up ? y0 - sp * 1.6 * dt * dt * 1.4 - sp * dt * .4 : y0 + sp * dt;
    bill(x0 + Math.sin(dt * 3 + ph) * 60, y, .7 + r() * .3, Math.sin(dt * 4 + ph) * .6);
  }
}
function wallet(x, y, s, open) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  rr(-120, -70, 240, 140, 22); fillStroke('#8A5230', 10);
  if (open) { ctx.save(); ctx.translate(120, -70); ctx.rotate(.5); rr(0, -70, 200, 70, 20); fillStroke('#A0653E', 10); ctx.restore(); rr(-104, -56, 208, 50, 10); fillStroke('#5A3322', 7); }
  else { rr(-120, -70, 240, 70, [22, 22, 8, 8]); fillStroke('#A0653E', 10); ell(90, -2, 14, 14); fillStroke(C.yellow, 6); }
  ctx.restore();
}
function moth(x, y, t, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const f = Math.abs(Math.sin(t * 30));
  [[-1], [1]].forEach(([d]) => { ctx.save(); ctx.scale(d, .4 + f * .6); ell(30, -10, 34, 26, -.3); fillStroke('#CFC2B5', 6); ctx.restore(); });
  ell(0, 0, 12, 28); fillStroke('#8C7B6E', 6);
  ctx.restore();
}
function noodleCup(x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let k = 0; k < 20; k++) { const yy = -150 - k * 9, xx = -50 + i * 50 + Math.sin(k * .5 + t * 5 + i) * 14; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.globalAlpha = .7; ctx.stroke(); ctx.globalAlpha = 1; }
  ell(0, -120, 120, 30); fillStroke('#F2C24E', 9);
  ctx.strokeStyle = '#D99A2B'; ctx.lineWidth = 6; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.arc(i * 28, -122, 12, 0, Math.PI); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(-120, -120); ctx.lineTo(120, -120); ctx.lineTo(90, 100); ctx.lineTo(-90, 100); ctx.closePath(); fillStroke(C.white, 10);
  ctx.beginPath(); ctx.moveTo(-112, -60); ctx.lineTo(112, -60); ctx.lineTo(104, 0); ctx.lineTo(-104, 0); ctx.closePath(); fillStroke(C.red, 0);
  ctx.fillStyle = C.white; ctx.font = `900 46px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('MI', 0, -30);
  ctx.restore();
}
function chipsBag(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.beginPath(); ctx.moveTo(-90, -120); ctx.lineTo(90, -120); ctx.lineTo(110, 110); ctx.lineTo(-110, 110); ctx.closePath(); fillStroke(C.yellow, 9);
  ell(0, 0, 60, 46); fillStroke('#F2A93B', 7);
  ctx.fillStyle = C.ink; ctx.font = `900 34px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('KRIPIK', 0, 2);
  ctx.restore();
}
function saladBowl(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  [[-60, -40, '#6CC07A'], [0, -60, '#4FA35E'], [60, -40, '#6CC07A'], [-25, -70, '#E2483D'], [35, -75, '#FFD23F']].forEach(([a, b, c]) => { ell(a, b, 46, 34); fillStroke(c, 7); });
  ctx.beginPath(); ctx.moveTo(-140, -30); ctx.lineTo(140, -30); ctx.quadraticCurveTo(130, 90, 0, 90); ctx.quadraticCurveTo(-130, 90, -140, -30); fillStroke(C.white, 10);
  ctx.restore();
}
function martabak(x, y, s, t, glow = 0, lid = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  if (glow > 0) { sunRays(0, -40, t * 4, '#FFF6C8', 12, 700, .35 * glow); const g = ctx.createRadialGradient(0, -40, 10, 0, -40, 380); g.addColorStop(0, `rgba(255,246,200,${.9 * glow})`); g.addColorStop(1, 'rgba(255,246,200,0)'); ctx.fillStyle = g; ctx.fillRect(-400, -440, 800, 800); }
  if (lid) { ctx.save(); ctx.translate(-190, -60); ctx.rotate(-.35); rr(0, -170, 380, 170, 14); fillStroke('#E8C79A', 10); ctx.restore(); }
  rr(-200, -60, 400, 140, 14); fillStroke('#E8C79A', 10);
  for (let i = 0; i < 4; i++) { rr(-180 + i * 92, -50, 84, 70, 10); fillStroke('#F2B544', 7); ctx.fillStyle = '#5A3322'; ctx.fillRect(-170 + i * 92, -30, 64, 14); }
  ctx.restore();
  if (glow > 0) for (let i = 0; i < 6; i++) { const a = t * 2 + i, rr2 = 260 * s; ctx.save(); ctx.translate(x + Math.cos(a) * rr2, y - 60 + Math.sin(a * 1.3) * rr2 * .6); ctx.rotate(t * 3 + i); ctx.fillStyle = C.yellow; ctx.beginPath(); for (let k = 0; k < 8; k++) { const r = k % 2 ? 8 : 24, an = k * Math.PI / 4; ctx.lineTo(Math.cos(an) * r, Math.sin(an) * r); } ctx.closePath(); ctx.fill(); ctx.restore(); }
}
function growl(x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = C.ink; ctx.lineWidth = 9; ctx.lineCap = 'round';
  [-1, 1].forEach(d => { for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let k = 0; k <= 10; k++) { const xx = d * (150 + i * 34), yy = -60 + k * 12; ctx.lineTo(xx + Math.sin(k * 1.4 + t * 30) * 8 * d, yy); } ctx.stroke(); } });
  ctx.restore();
}
function bubble(x, y, w, h, text, size = 48, tailX = 0, tailY = 1) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 40);
  ctx.moveTo(tailX - 40, tailY * h / 2 - 2); ctx.lineTo(tailX + 30, tailY * (h / 2 + 70)); ctx.lineTo(tailX + 40, tailY * h / 2 - 2);
  fillStroke(C.white, 10);
  ctx.fillStyle = C.white; ctx.fillRect(tailX - 34, tailY > 0 ? h / 2 - 12 : -h / 2 - 2, 70, 14);
  ctx.fillStyle = C.ink; ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  text.split('\n').forEach((ln, i, a) => ctx.fillText(ln, 0, (i - (a.length - 1) / 2) * size * 1.15));
  ctx.restore();
}
function street(t, o = {}) {
  const k = o.gloom || 0, scroll = o.scroll ?? 1;
  const g = ctx.createLinearGradient(0, 0, 0, 1300);
  const mix = (a, b) => { const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16); const c = s => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, k)); return `rgb(${c(16)},${c(8)},${c(0)})`; };
  g.addColorStop(0, mix('#FF9B5E', '#6E6A8A')); g.addColorStop(.6, mix('#FFC98A', '#9C93A6')); g.addColorStop(1, mix('#FFE7B8', '#C9B9AE'));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (k < .9) { ctx.globalAlpha = 1 - k; sunRays(780, 700, t, '#FFF2C2', 16, 1500, .22); ell(780, 700, 150, 150); ctx.fillStyle = '#FFF0B8'; ctx.fill(); ctx.globalAlpha = 1; }
  const bcol = ['#E58A55', '#D9784A', '#EE9C62'];
  for (let i = 0; i < 9; i++) {
    const bw = 200 + (i * 53) % 90, bh = 380 + (i * 137) % 340;
    const bx = ((i * 240 - t * 500 * scroll) % 2160 + 2160) % 2160 - 300;
    rr(bx, 1300 - bh, bw, bh, [16, 16, 0, 0]); fillStroke(bcol[i % 3], 9);
    ctx.fillStyle = 'rgba(255,240,200,.75)';
    for (let wy = 1300 - bh + 40; wy < 1260; wy += 80) for (let wx = bx + 30; wx < bx + bw - 40; wx += 60) ctx.fillRect(wx, wy, 30, 40);
  }
  if (k > 0) { ctx.fillStyle = `rgba(70,60,90,${.35 * k})`; ctx.fillRect(0, 0, W, 1300); }
  ctx.fillStyle = '#6B4A3A'; ctx.fillRect(0, 1300, W, H - 1300);
  ctx.fillStyle = C.ink; ctx.fillRect(0, 1294, W, 12);
  ctx.fillStyle = '#FFD98C';
  for (let i = 0; i < 6; i++) { const dx = ((i * 260 - t * 1800 * scroll) % 1560 + 1560) % 1560 - 200; rr(dx, 1560, 150, 26, 13); ctx.fill(); }
  ctx.fillStyle = '#8A6450'; ctx.fillRect(0, 1300, W, 70);
}
function darkCloud(x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.beginPath(); ctx.arc(-130, 20, 90, 0, 7); ctx.arc(-20, -40, 120, 0, 7); ctx.arc(120, 0, 100, 0, 7); ctx.arc(0, 60, 110, 0, 7);
  ctx.fillStyle = '#7C7690'; ctx.fill(); ctx.restore();
}
function rain(t, amt, seed = 3) {
  if (amt <= 0) return; const r = rng(seed);
  ctx.save(); ctx.strokeStyle = 'rgba(200,225,255,.75)'; ctx.lineCap = 'round';
  for (let i = 0; i < 160 * amt; i++) {
    const x0 = r() * (W + 300), sp = 1800 + r() * 900, ph = r() * 3000;
    const y = ((t * sp + ph) % (H + 300)) - 150, x = x0 - (y + 150) * .25;
    ctx.lineWidth = 4 + r() * 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 18, y + 70); ctx.stroke();
  }
  ctx.restore();
}
function splashes(t, y, seed = 4) {
  const r = rng(seed);
  for (let i = 0; i < 10; i++) {
    const k = ((t * 2.5) + r()) % 1, x = r() * W;
    ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(x, y + r() * 400, 20 + k * 60, 6 + k * 14, 0, 0, 7);
    ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(220,235,255,.9)'; ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function glitch(t, amt) {
  if (amt <= 0) return; const r = rng(Math.floor(t * 20) + 1);
  for (let i = 0; i < 9 * amt; i++) {
    const y = r() * H, h = 20 + r() * 120, dx = (r() - .5) * 160 * amt;
    ctx.drawImage(cv, 0, y, W, h, dx, y, W, h);
    ctx.fillStyle = r() < .5 ? 'rgba(63,167,160,.25)' : 'rgba(226,72,61,.25)'; ctx.fillRect(0, y, W, h * .3);
  }
}
function lightning(t, t0) { const k = prog(t, t0, t0 + .35); if (k <= 0 || k >= 1) return; ctx.fillStyle = `rgba(255,255,240,${(Math.sin(k * 18) > 0 ? .8 : .25) * (1 - k)})`; ctx.fillRect(0, 0, W, H); }
function endCard(t, t0, l1, l2) {
  const p = eBack(prog(t, t0, t0 + .4)); if (p <= 0) return;
  ctx.save(); ctx.translate(W / 2, 1690); ctx.scale(p, p);
  rr(-440, -95, 880, 190, 40); fillStroke(C.ink, 0);
  ctx.font = `900 50px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = C.yellow; ctx.fillText(l1, 0, -34); ctx.fillStyle = C.white; ctx.fillText(l2, 0, 30);
  ctx.restore();
}
function epPill(t, n, title) { pill(`Eps. ${n} • ${title}`, W / 2, 250, C.ink, C.yellow, t, .05); }
function zoomAt(z, cx = W / 2, cy = H / 2) { ctx.translate(cx, cy); ctx.scale(z, z); ctx.translate(-cx, -cy); }


function wallClock(x, y, r, minutes) { // analog clock; minutes since 12:00
  ctx.save(); ctx.translate(x, y);
  ell(0, 0, r, r); fillStroke(C.white, 10);
  ctx.strokeStyle = C.ink; ctx.lineCap = 'round';
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(Math.sin(a) * r * .78, -Math.cos(a) * r * .78); ctx.lineTo(Math.sin(a) * r * .9, -Math.cos(a) * r * .9); ctx.stroke(); }
  const ha = minutes / 720 * Math.PI * 2, ma = minutes / 60 * Math.PI * 2;
  ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ha) * r * .5, -Math.cos(ha) * r * .5); ctx.stroke();
  ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.sin(ma) * r * .75, -Math.cos(ma) * r * .75); ctx.stroke();
  ell(0, 0, 10, 10); ctx.fillStyle = C.red; ctx.fill();
  ctx.restore();
}
function withCatColors(cat, catD, fn) { const a = C.cat, b = C.catD; C.cat = cat; C.catD = catD; try { fn(); } finally { C.cat = a; C.catD = b; } }


function sofa(x, y) {
  rr(x - 330, y - 200, 660, 200, 50); fillStroke('#C2563E', 11);
  rr(x - 380, y - 120, 760, 170, 40); fillStroke('#D96A50', 11);
  rr(x - 420, y - 160, 110, 220, 40); fillStroke('#C2563E', 11); rr(x + 310, y - 160, 110, 220, 40); fillStroke('#C2563E', 11);
}
function door(x, y, ring, open = 0) {
  ctx.save(); if (ring) ctx.translate(Math.sin(ring * 80) * 5, 0);
  if (open > 0) { rr(x - 150, y - 560, 300, 560, [20, 20, 0, 0]); fillStroke('#2A1A12', 11); }
  ctx.save(); ctx.translate(x - 150, 0); ctx.scale(1 - open * .75, 1); ctx.translate(-(x - 150), 0);
  rr(x - 150, y - 560, 300, 560, [20, 20, 0, 0]); fillStroke(C.wood, 11);
  rr(x - 115, y - 520, 230, 220, 12); fillStroke(C.woodD, 7); rr(x - 115, y - 270, 230, 230, 12); fillStroke(C.woodD, 7);
  ell(x + 105, y - 280, 14, 14); fillStroke(C.yellow, 6);
  ctx.restore(); ctx.restore();
}
function shelves(y0 = 380) { // shop shelves with colorful products
  const cols = ['#E2483D', '#3FA7A0', '#FFD23F', '#7C6CD9', '#6CC07A', '#F2A93B'];
  for (let r = 0; r < 3; r++) {
    const y = y0 + r * 260;
    rr(40, y + 170, 1000, 30, 8); fillStroke(C.wood, 8);
    for (let i = 0; i < 9; i++) { const h = 90 + ((i * 37 + r * 11) % 60); rr(70 + i * 108, y + 170 - h, 86, h, 10); fillStroke(cols[(i + r * 2) % 6], 6); }
  }
}
function npcCat(x, y, s, col, colD, o = {}) { withCatColors(col, colD, () => drawCat({ x, y, s, eyes: 'open', mouth: 'flat', tail: 1, blush: false, ...o })); }
const NPC = [['#B9A8A0', '#8E7C74'], ['#F3EDE4', '#D8CBB8'], ['#8A6450', '#6B4A3A'], ['#6E6A72', '#504C56'], ['#E9C08A', '#C99A5E']];
function dumbbell(x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  rr(-90, -10, 180, 20, 8); fillStroke('#9C9C9C', 7);
  [-1, 1].forEach(d => { rr(d * 90 - 22, -45, 44, 90, 12); fillStroke('#3B2B26', 8); });
  ctx.restore();
}
function plate(x, y, s, fill) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ell(0, 0, 170, 48); fillStroke(C.white, 9);
  if (fill === 'rice') { ctx.beginPath(); ctx.arc(0, -10, 110, Math.PI, 0); fillStroke('#FFF8EC', 8); ell(-40, -60, 30, 16); ctx.fillStyle = '#F2A93B'; ctx.fill(); ell(50, -50, 34, 14); ctx.fillStyle = '#6CC07A'; ctx.fill(); }
  if (fill === 'burnt') { ctx.beginPath(); ctx.moveTo(-90, -10); ctx.lineTo(-60, -80); ctx.lineTo(-10, -60); ctx.lineTo(30, -100); ctx.lineTo(80, -50); ctx.lineTo(100, -10); ctx.closePath(); fillStroke('#2A1A12', 8); }
  ctx.restore();
}
function smoke(t, x, y, amt, seed = 2) {
  if (amt <= 0) return; const r = rng(seed);
  for (let i = 0; i < 12 * amt; i++) {
    const k = ((t * .5) + r()) % 1;
    ctx.globalAlpha = (1 - k) * .75 * Math.min(1, amt);
    ell(x + (r() - .5) * 200 + Math.sin(t * 2 + i) * 40, y - k * 700, 50 + k * 90, 40 + k * 70);
    ctx.fillStyle = '#8C8C8C'; ctx.fill();
  }
  ctx.globalAlpha = 1;
}
function flames(t, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  [['#E2483D', 1], ['#F59A3C', .7], ['#FFD23F', .4]].forEach(([c, k]) => {
    ctx.beginPath(); ctx.moveTo(-120 * k, 0);
    for (let i = 0; i <= 6; i++) { const xx = -120 * k + i * 40 * k, hh = (120 + Math.sin(t * 20 + i * 2) * 40) * k; ctx.quadraticCurveTo(xx + 10 * k, -hh, xx + 20 * k, i % 2 ? -hh * .5 : 0); }
    ctx.lineTo(120 * k, 0); ctx.closePath(); ctx.fillStyle = c; ctx.fill();
  });
  ctx.restore();
}
function chatScreen(msgs, header, t) { // inside phone() local coords (-94..94, -182..180)
  ctx.fillStyle = '#EFE6D8'; ctx.fillRect(-94, -182, 188, 362);
  ctx.fillStyle = C.teal; ctx.fillRect(-94, -182, 188, 44);
  ctx.fillStyle = C.white; ctx.font = `900 18px ${FONT}`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(header, -80, -160);
  let y = -120;
  msgs.forEach(([txt, mine, col]) => {
    ctx.font = `700 14px ${FONT}`; const w = Math.min(150, ctx.measureText(txt).width + 20);
    const x = mine ? 84 - w : -84;
    rr(x, y, w, 30, 10); ctx.fillStyle = col || (mine ? '#D9F2C7' : C.white); ctx.fill();
    ctx.fillStyle = C.ink; ctx.fillText(txt, x + 10, y + 15, w - 16); y += 38;
  });
}
function nextTag(t, dur) {
  const t0 = dur - 2.6; if (t < t0) return;
  const p = eBack(prog(t, t0, t0 + .35));
  ctx.save(); ctx.translate(W / 2, 1545); ctx.scale(p, p); ctx.rotate(-.02);
  ctx.font = `900 40px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const txt = 'EPS. BERIKUTNYA: BESOK JAM 3 SORE!', w = ctx.measureText(txt).width + 60;
  rr(-w / 2, -40, w, 80, 40); fillStroke(C.yellow, 8);
  ctx.fillStyle = C.ink; ctx.fillText(txt, 0, 3); ctx.restore();
}


function hookBand(t, text) { // big attention hook during the first ~1.6 s
  if (!text || t > 1.7) return;
  const pin = lerp(.88, 1, eBack(prog(t, 0, .25))), out = eIn(prog(t, 1.35, 1.7));
  ctx.save(); ctx.translate(W / 2 + out * -W * 1.2, 820); ctx.rotate(-.035); ctx.scale(pin, pin);
  const lines = text.split('\n'); let fs = 92; ctx.font = `900 ${fs}px ${FONT}`;
  while (Math.max(...lines.map(l => ctx.measureText(l).width)) > 900 && fs > 50) { fs -= 4; ctx.font = `900 ${fs}px ${FONT}`; }
  const h = lines.length * fs * 1.12 + 70;
  rr(-500 + 12, -h / 2 + 14, 1000, h, 34); ctx.fillStyle = 'rgba(59,31,20,.45)'; ctx.fill();
  rr(-500, -h / 2, 1000, h, 34); fillStroke(C.yellow, 12);
  ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  lines.forEach((ln, i) => ctx.fillText(ln, 0, (i - (lines.length - 1) / 2) * fs * 1.12 + 4));
  ctx.restore();
}

// ======================= episode driver =======================
// EP = { dur, scenes: [[t0, t1, fn(t, lt)]...], fx(t), sfx: [[name, t, opts]...], music: [[t0, t1, gain]...], key }
function runEpisode(EP) {
  window.EP = EP; window.DUR = EP.dur; window.FPS = FPS;
  window.render = t => {
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    const sc = EP.scenes.find(s => t >= s[0] && t < s[1]) || EP.scenes[EP.scenes.length - 1];
    ctx.save(); sc[2](t, t - sc[0]); ctx.restore();
    if (EP.fx) { ctx.save(); EP.fx(t); ctx.restore(); }
    if (EP.next !== false) { ctx.save(); nextTag(t, EP.dur); ctx.restore(); }
    grade(t);
    if (EP.hook) { ctx.save(); hookBand(t, EP.hook); ctx.restore(); }
    // no fade-from-black at the start (first frame must grab attention) and no fade-out (clean loop);
    // episodes without a hook keep the old fades
    if (!EP.hook) { const fi = prog(t, 0, .25), fo = prog(t, EP.dur - .35, EP.dur);
      if (fi < 1 || fo > 0) { ctx.fillStyle = `rgba(30,12,5,${Math.max(1 - fi, fo)})`; ctx.fillRect(0, 0, W, H); } }
  };
  if (!location.search.includes('render')) {
    document.fonts.ready.then(() => { const st = performance.now(); (function loop() { window.render(((performance.now() - st) / 1000) % EP.dur); requestAnimationFrame(loop); })(); });
  }
}
