// Render every segment of compile.html: animated ones to <out>/seg_<name>/ (frames + timeline.json),
// still panels to <out>/<name>.png. Usage: node render_comp.js <outDir> [onlySegment] [stepEvery]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [out, only, stepArg = '1'] = process.argv.slice(2);
  const step = +stepArg;
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, 'compile.html') + '?render');
  await page.evaluate(() => Promise.all([document.fonts.load('900 100px "Inter Display"')]));
  const segs = await page.evaluate(() => Object.entries(window.SEGMENTS).map(([k, s]) => ({ name: k, dur: s.dur, still: !!s.still, sfx: s.sfx || [], music: s.music || [] })));
  for (const s of segs) {
    if (only && s.name !== only) continue;
    if (s.still) {
      const url = await page.evaluate(n => { window.renderSeg(n, 0); return document.getElementById('c').toDataURL('image/png'); }, s.name);
      fs.mkdirSync(out, { recursive: true });
      fs.writeFileSync(path.join(out, s.name + '.png'), Buffer.from(url.split(',')[1], 'base64'));
      continue;
    }
    const dir = path.join(out, 'seg_' + s.name); fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'timeline.json'), JSON.stringify({ dur: s.dur, sfx: s.sfx, music: s.music }));
    const total = Math.round(s.dur * 30);
    for (let i = 0; i < total; i += step) {
      const url = await page.evaluate(([n, t]) => { window.renderSeg(n, t); return document.getElementById('c').toDataURL('image/jpeg', 0.93); }, [s.name, i / 30]);
      fs.writeFileSync(path.join(dir, `f${String(i).padStart(4, '0')}.jpg`), Buffer.from(url.split(',')[1], 'base64'));
    }
  }
  await browser.close();
  if (errors.length) { console.error('page errors:', errors); process.exit(1); }
  console.log('segments rendered');
})();
