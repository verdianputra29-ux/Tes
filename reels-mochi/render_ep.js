// Render an episode page to JPEG frames + its sound timeline.
// Usage: node render_ep.js ep2.html <outDir> [stepEvery]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [html, out = 'frames', stepArg = '1'] = process.argv.slice(2);
  const step = +stepArg;
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, html) + '?render');
  await page.evaluate(() => Promise.all([document.fonts.load('900 100px "Inter Display"'), document.fonts.load('700 40px "Inter Display"')]));
  const meta = await page.evaluate(() => ({ dur: window.EP.dur, fps: window.FPS, sfx: window.EP.sfx || [], music: window.EP.music || [] }));
  fs.writeFileSync(path.join(out, 'timeline.json'), JSON.stringify(meta));
  const total = Math.round(meta.dur * meta.fps);
  for (let i = 0; i < total; i += step) {
    const url = await page.evaluate(i => { window.render(i / window.FPS); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, i);
    fs.writeFileSync(path.join(out, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await browser.close();
  if (errors.length) { console.error('page errors:', errors); process.exit(1); }
  console.log(html, 'frames:', total);
})();
