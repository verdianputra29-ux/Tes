// Render mochi.html to JPEG frames: node render.js <outDir> [stepEvery]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const out = process.argv[2] || 'frames';
  const step = +(process.argv[3] || 1);
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('file://' + path.resolve(__dirname, 'mochi.html') + '?render');
  await page.evaluate(() => document.fonts.load('900 100px "Inter Display"'));
  const total = await page.evaluate(() => window.DUR * window.FPS);
  for (let i = 0; i < total; i += step) {
    const url = await page.evaluate(i => { window.render(i / window.FPS); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, i);
    fs.writeFileSync(path.join(out, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
  }
  await browser.close();
  console.log('frames:', total);
})();
