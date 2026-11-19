// Render YouTube channel assets (avatar, banner, thumbnail) reusing Mochi's drawing code from mochi.html.
// Usage: node channel-assets.js [outDir]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');

const ASSETS = {
  avatar: [800, 800],
  banner: [2560, 1440],
  thumbnail_eps1: [1280, 720],
};

(async () => {
  const out = process.argv[2] || path.join(__dirname, 'channel');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.resolve(__dirname, 'mochi.html') + '?render');
  await page.evaluate(() => document.fonts.load('900 100px "Inter Display"'));

  for (const [name, [w, h]] of Object.entries(ASSETS)) {
    const url = await page.evaluate(({ name, w, h }) => {
      cv.width = w; cv.height = h;
      const T = (txt, x, y, size, fill, opts = {}) => {
        ctx.save(); ctx.translate(x, y); ctx.rotate(opts.rot || 0);
        ctx.font = `900 ${size}px ${FONT}`; ctx.textAlign = opts.align || 'center'; ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round'; ctx.lineWidth = size * .22;
        ctx.strokeStyle = 'rgba(59,31,20,.5)'; ctx.strokeText(txt, size * .06, size * .09);
        ctx.strokeStyle = C.ink; ctx.strokeText(txt, 0, 0);
        ctx.fillStyle = fill; ctx.fillText(txt, 0, 0); ctx.restore();
      };
      const warmBg = (cx, cy, r) => {
        const g = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
        g.addColorStop(0, '#FFE9B8'); g.addColorStop(.55, '#FFB86E'); g.addColorStop(1, '#F08A45');
        ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
        sunRays(cx, cy, 0.3, '#FFF4CF', 18, Math.max(w, h), .28);
      };
      const tint = () => { // same warm grade as the reel
        ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,145,60,.35)'; ctx.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'multiply';
        const v = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .35, w / 2, h / 2, Math.max(w, h) * .75);
        v.addColorStop(0, 'rgba(255,255,255,0)'); v.addColorStop(1, 'rgba(150,70,30,.45)');
        ctx.fillStyle = v; ctx.fillRect(0, 0, w, h); ctx.restore();
      };
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, w, h);

      if (name === 'avatar') {
        warmBg(400, 420, 600);
        drawCat({ x: 375, y: 425, s: 1.2, eyes: 'happy', mouth: 'smile', tail: 1.2 });
        tint();
      }

      if (name === 'banner') {
        warmBg(1280, 720, 1500);
        // skyline along the bottom (outside the safe area, visible on TV/desktop)
        const bcol = ['#E58A55', '#D9784A', '#EE9C62'];
        for (let i = 0; i < 16; i++) {
          const bw = 150 + (i * 53) % 80, bh = 200 + (i * 137) % 260, bx = i * 165 - 20;
          rr(bx, 1440 - bh, bw, bh + 20, [14, 14, 0, 0]); fillStroke(bcol[i % 3], 8);
          ctx.fillStyle = 'rgba(255,240,200,.7)';
          for (let wy = 1440 - bh + 30; wy < 1420; wy += 60) for (let wx = bx + 22; wx < bx + bw - 30; wx += 46) ctx.fillRect(wx, wy, 22, 30);
        }
        confetti(0.9, 0, 5);
        // safe area: x 507..2053, y 508..931 (1546x423)
        drawCat({ x: 760, y: 735, s: .95, eyes: 'happy', mouth: 'smile', tail: 1, rot: -.06 });
        T('MOCHI', 1440, 640, 190, C.yellow, { rot: -.03 });
        T('SI KUCING OREN', 1440, 790, 108, C.white, { rot: -.03 });
        ctx.save(); ctx.translate(1440, 872); ctx.rotate(-.03);
        ctx.font = `900 33px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const tag = 'ANIMASI LUCU • RELATE BANGET • EPISODE BARU TIAP MINGGU';
        const tw = ctx.measureText(tag).width + 60;
        rr(-tw / 2, -28, tw, 56, 28); fillStroke(C.ink, 0);
        ctx.fillStyle = '#FFE9C9'; ctx.fillText(tag, 0, 2); ctx.restore();
        tint();
      }

      if (name === 'thumbnail_eps1') {
        warmBg(900, 330, 1100);
        alarmClock(1080, 470, 1.05, '07:45', true, 0.07);
        drawCat({ x: 420, y: 470, s: 1.2, eyes: 'wide', mouth: 'scream', sweat: 1, tail: 1, rot: -.08 });
        T('TELAT LAGI?!', 640, 120, 132, C.yellow, { rot: -.04 });
        ctx.save(); ctx.translate(1070, 655); ctx.rotate(.05);
        rr(-170, -42, 340, 84, 20); fillStroke(C.red, 8);
        ctx.font = `900 50px ${FONT}`; ctx.fillStyle = C.white; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('SENIN PAGI', 0, 3); ctx.restore();
        tint();
      }
      return cv.toDataURL('image/png');
    }, { name, w, h });
    fs.writeFileSync(path.join(out, `${name}.png`), Buffer.from(url.split(',')[1], 'base64'));
    console.log('wrote', name);
  }
  await browser.close();
})();
