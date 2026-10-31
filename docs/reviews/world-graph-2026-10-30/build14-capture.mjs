/**
 * @module docs/reviews/world-graph-2026-10-30/build14-capture.mjs
 * @purpose Records build-14 city frames and retained Metal scroll/phone measurements outside git.
 * @inputs External absolute output directory and optional --measure.
 * @outputs Chapter PNGs, half-second motion strips, poses and measurement JSON.
 * @effects disk (OS temp publication and external frames), network (loopback), process (Chromium)
 * @errors Refuses pixel fallback; failed gestures exit nonzero.
 */
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildAudit } from '../../../scripts/component-audit.mjs';
import { buildHivePage, serveHive } from '../../../scripts/hive-page.mjs';
import { resolvePlaywright } from '../../../scripts/playwright-resolve.mjs';
import { waitForHive } from '../../../scripts/first-look.mjs';
import { main as gestures, measureScrolling } from '../../../scripts/hive-gesture-check.mjs';
import { TOUR_SCROLL } from '../../../apps/hive/config.mjs';
const out = process.argv[2], root = process.cwd();
if (!out || !path.isAbsolute(out) || out.startsWith(root + '/') || out.startsWith('/private/tmp/nana-3dmk-')) throw new Error('external output required');
const temp = await mkdtemp(path.join(os.tmpdir(), 'hive-build14-'));
let server, browser;
const beat = setInterval(() => console.log('capture heartbeat', new Date().toISOString()), 30000);
try {
  await mkdir(out, { recursive: true });
  const data = path.join(temp, 'audit.json'); await writeFile(data, JSON.stringify((await buildAudit({ root })).document));
  await buildHivePage(path.join(temp, 'site'), data);
  server = await serveHive(path.join(temp, 'site')); const url = `http://127.0.0.1:${server.address().port}/`;
  browser = await resolvePlaywright(process.env, root).chromium.launch({ args: ['--use-angle=metal'] });
  if (process.argv.includes('--measure')) {
    const results = await measureScrolling(browser, url, path.join(out, 'scroll'));
    if (results.some(r => r.p95Ms >= 20 || r.maxTaskMs > 50 || r.maxRelativeStep >= TOUR_SCROLL.cameraStepBound || r.reversals || r.stageReversals || r.settleError || !r.idle)) throw new Error('retained scroll gate failed');
  }
  const records = [];
  for (const width of [1280, 390]) {
    const folder = path.join(out, String(width)); await mkdir(folder, { recursive: true });
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    page.on('pageerror', e => { console.log('PAGE ERROR', e.message); process.exitCode = 1; });
    await page.goto(`${url}#closing`); await waitForHive(page, true);
    const wholeCity = await page.evaluate(() => new Promise(resolve => { const samples = [], start = performance.now(); let previous = start; const tick = now => { samples.push(now - previous); previous = now; if (now - start < 10000) requestAnimationFrame(tick); else { samples.sort((a, b) => a - b); resolve({ frames: samples.length, medianMs: samples[Math.floor(samples.length / 2)], p95Ms: samples[Math.floor(samples.length * 0.95)] }); } }; requestAnimationFrame(tick); }));
    console.log('WHOLE CITY', width, JSON.stringify(wholeCity));
    await writeFile(path.join(folder, 'whole-city.json'), JSON.stringify(wholeCity, null, 2));
    await page.goto(`${url}#overview`); await waitForHive(page, true);
    if (await page.getAttribute('html', 'data-hive-ready') !== 'webgl') throw new Error('pixel fallback');
    await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') }); await page.clock.pauseAt(new Date('2026-10-30T12:00:01Z'));
    const sections = await page.locator('#chapters section').evaluateAll(nodes => nodes.map(n => ({ id: n.id, start: n.offsetTop, height: n.offsetHeight })));
    const save = async name => { await page.screenshot({ path: path.join(folder, `${name}.png`) }); records.push({ width, name, ...await page.evaluate(() => ({ time: performance.now(), stage: document.documentElement.dataset.hiveStage, pose: document.documentElement.dataset.hivePose })) }); };
    const jump = async y => { await page.evaluate(y => scrollTo(0, y), y); await page.clock.runFor(600); };
    for (const [i, s] of sections.entries()) {
      await jump(s.start + s.height / 2); await save(`chapter-${String(i).padStart(2, '0')}-mid`);
      if (i === 13 || width === 1280 && i >= 2 && i <= 10) {
        const images = [];
        for (let f = 0; f < 4; f++) { if (f) await page.clock.runFor(500); const name = `motion-${String(i).padStart(2, '0')}-${f}`; await save(name); images.push(await page.screenshot()); }
        const strip = await browser.newPage();
        await strip.setContent('<canvas></canvas>');
        const bytes = await strip.evaluate(async images => { const canvas = document.querySelector('canvas'), loaded = await Promise.all(images.map(src => new Promise(resolve => { const image = new Image(); image.onload = () => resolve(image); image.src = src; }))); canvas.width = loaded[0].width * 4; canvas.height = loaded[0].height; const ctx = canvas.getContext('2d'); loaded.forEach((image, i) => ctx.drawImage(image, i * image.width, 0)); return canvas.toDataURL().split(',')[1]; }, images.map(b => `data:image/png;base64,${b.toString('base64')}`));
        await writeFile(path.join(folder, `strip-${String(i).padStart(2, '0')}.png`), Buffer.from(bytes, 'base64')); await strip.close();
      }
    }
    for (const [i, f] of [0, 0.25, 0.5, 0.75, 1].entries()) { await jump(sections[0].height * f); await save(`opening-${i}`); }
    await jump(sections[4].start + sections[4].height * 0.8);
    for (let i = 0; i < 30; i++) { await page.evaluate(y => scrollTo(0, y), sections[4].start + sections[4].height * 0.8 + i * 2000 / 30 * 0.2); await page.clock.runFor(2000 / 30); await save(`slow-scroll-${String(i).padStart(2, '0')}`); }
    await page.clock.resume(); await page.goto(`${url}?still#explore/workshop`); await waitForHive(page, true); await save('explore-selected'); await page.close();
  }
  await writeFile(path.join(out, 'poses.json'), JSON.stringify(records, null, 2));
  const result = await gestures(['--url', url, '--out', path.join(out, 'gestures'), ...(process.argv.includes('--scroll-check') ? ['--scroll'] : [])]); console.log(`gesture exit ${result}`); if (result) process.exitCode = result;
} finally { clearInterval(beat); await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); await rm(temp, { recursive: true, force: true }); }
