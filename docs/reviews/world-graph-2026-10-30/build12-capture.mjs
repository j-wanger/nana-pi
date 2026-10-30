/**
 * @module docs/reviews/world-graph-2026-10-30/build12-capture.mjs
 * @purpose Captures build 12's scale, mechanisms, retained tour and frame timing outside git.
 * @inputs External output folder and optional --first-look.
 * @outputs PNG frames, poses, timing and phone gesture verdicts.
 * @effects disk (temporary publication and external images), network (loopback), process (Chromium)
 * @errors Browser or acceptance failures exit nonzero.
 */
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildAudit } from '../../../scripts/component-audit.mjs';
import { buildHivePage, serveHive } from '../../../scripts/hive-page.mjs';
import { resolvePlaywright } from '../../../scripts/playwright-resolve.mjs';
import { waitForHive, runFirstLook } from '../../../scripts/first-look.mjs';
import { main as gestures } from '../../../scripts/hive-gesture-check.mjs';
const out = process.argv[2], root = process.cwd();
if (!out || !path.isAbsolute(out) || out.startsWith(root + '/')) throw new Error('external absolute output folder required');
const temp = await mkdtemp(path.join(os.tmpdir(), 'hive-build12-'));
let server, browser;
const beat = setInterval(() => console.log('capture heartbeat', new Date().toISOString()), 30000);
try {
  await mkdir(out, { recursive: true });
  const data = path.join(temp, 'audit.json'); await writeFile(data, JSON.stringify((await buildAudit({ root })).document));
  await buildHivePage(path.join(temp, 'site'), data);
  server = await serveHive(path.join(temp, 'site')); const url = `http://127.0.0.1:${server.address().port}/`;
  browser = await resolvePlaywright(process.env, root).chromium.launch({ args: ['--use-angle=metal'] });
  const records = [];
  const timing = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await timing.goto(`${url}#closing`); await waitForHive(timing, true);
  if (await timing.getAttribute('html', 'data-hive-ready') !== 'webgl') throw new Error('pixel fallback');
  console.log('GPU', await timing.evaluate(() => { const gl = document.querySelector('canvas').getContext('webgl2'), ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown'; }));
  await timing.waitForTimeout(1000);
  const measured = await timing.evaluate(() => new Promise(resolve => {
    const samples = [], start = performance.now(); let previous = start;
    const tick = now => { samples.push(now - previous); previous = now; if (now - start < 10000) requestAnimationFrame(tick); else { samples.sort((a, b) => a - b); resolve({ median: samples[Math.floor(samples.length / 2)], count: samples.length, duration: now - start }); } };
    requestAnimationFrame(tick);
  }));
  console.log('FRAME TIME', JSON.stringify(measured), 'RENDER', await timing.getAttribute('html', 'data-hive-frame-stats')); await writeFile(path.join(out, 'timing.json'), JSON.stringify(measured)); await timing.close();
  if (process.argv.includes('--timing-only')) { if (measured.median >= 33) process.exitCode = 1; }
  else {
    for (const width of [1280, 390]) {
      const folder = path.join(out, String(width)); await mkdir(folder, { recursive: true });
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.on('pageerror', e => { console.log('PAGE ERROR', e.message); process.exitCode = 1; });
      await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') }); await page.clock.pauseAt(new Date('2026-10-30T12:00:01Z'));
      await page.goto(`${url}#overview`); await page.clock.runFor(100); await waitForHive(page, true);
      if (await page.getAttribute('html', 'data-hive-ready') !== 'webgl') throw new Error('pixel fallback');
      const sections = await page.locator('#chapters section').evaluateAll(nodes => nodes.map(n => ({ id: n.id, start: n.offsetTop, height: n.offsetHeight })));
      const save = async name => {
        await page.screenshot({ path: path.join(folder, `${name}.png`), timeout: 30000 });
        const state = await page.evaluate(() => ({ time: performance.now(), stage: document.documentElement.dataset.hiveStage, pose: document.documentElement.dataset.hivePose, target: document.documentElement.dataset.hiveTarget, renderer: document.documentElement.dataset.hiveReady }));
        records.push({ width, name, ...state }); console.log(width, name, JSON.stringify(state));
      };
      const jump = async scroll => { await page.evaluate(y => scrollTo(0, y), scroll); await page.clock.runFor(100); };
      for (const [i, s] of sections.entries()) {
        await jump(s.start + s.height / 2); await save(`chapter-${String(i).padStart(2, '0')}-mid`);
        if (width === 1280 && i >= 2 && i <= 10) for (let f = 0; f < 4; f++) {
          if (f) await page.clock.runFor(500);
          await save(`motion-${String(i).padStart(2, '0')}-${f}`);
        }
      }
      const boundary = sections[4];
      for (const [i, f] of [0.85, 0.89, 0.925, 0.95, 0.98, 1.01].entries()) { await jump(boundary.start + boundary.height * f); await save(`boundary-${i}`); }
      const first = sections[2].start, last = sections[6].start;
      await jump(first);
      await page.evaluate(({ first, last }) => { const start = performance.now(); const tick = now => { const t = Math.min(1, (now - start) / 14000); scrollTo(0, first + (last - first) * t); if (t < 1) requestAnimationFrame(tick); }; requestAnimationFrame(tick); }, { first, last });
      for (let i = 0; i < 8; i++) { if (i) await page.clock.runFor(2000); await save(`scroll-strip-${i}`); }
      await jump(sections[5].start + sections[5].height / 2);
      for (let i = 0; i < 4; i++) { if (i) await page.clock.runFor(500); await save(`idle-${i}`); }
      for (const [i, f] of [0, 0.5, 1].entries()) { await jump(sections[0].height * f); await save(`opening-${i}`); }
      await page.goto(`${url}?still#explore/workshop`); await page.clock.runFor(100); await waitForHive(page, true); await save('explore-selected');
      await page.close();
    }
    await writeFile(path.join(out, 'poses.json'), JSON.stringify(records, null, 2));
    await browser.close(); browser = null;
    if (process.argv.includes('--first-look')) for (const id of ['overview', 'compass', 'drafting-table', 'workshop', 'eyes', 'review-ladder', 'land-gate', 'closing', 'explore']) {
      const code = await runFirstLook(['--page', 'url', '--hive', '--after', `${url}?still#${id}`, '--reference', '/private/tmp/nana-3dmk-ref', '--spec', 'docs/reviews/world-graph-2026-10-30/world-art-spec.md', '--out', path.join(out, `first-look-${id}`)]);
      console.log(`first-look ${id}: exit ${code}`); if (code) throw new Error(`first-look ${id}`);
    }
    const result = await gestures(['--url', url, '--out', path.join(out, 'gestures')]); console.log(`gesture exit ${result}`); if (result) process.exitCode = result;
    if (measured.median >= 33) { console.log('FAIL frame time budget'); process.exitCode = 1; }
  }
} catch (e) { console.error(e.stack); process.exitCode = 1; }
finally { clearInterval(beat); await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); await rm(temp, { recursive: true, force: true }); }
