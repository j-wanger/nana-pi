/**
 * @module docs/reviews/world-graph-2026-10-30/build13-capture.mjs
 * @purpose Records Metal scroll measurements and visual evidence for build 13 outside git.
 * @inputs External output folder and --measure-only or --capture-only.
 * @outputs Scroll telemetry, chapter frames, thirty slow-scroll frames and phone gestures.
 * @effects disk (OS temp fixtures and external images), network (loopback), process (Chromium)
 * @errors Refuses pixel fallback or an internal output folder; failed gestures exit nonzero.
 */
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { buildAudit } from '../../../scripts/component-audit.mjs';
import { buildHivePage, serveHive } from '../../../scripts/hive-page.mjs';
import { resolvePlaywright } from '../../../scripts/playwright-resolve.mjs';
import { waitForHive, runFirstLook } from '../../../scripts/first-look.mjs';
import { main as gestures, measureScrolling } from '../../../scripts/hive-gesture-check.mjs';
const out = process.argv[2], root = process.cwd();
if (!out || !path.isAbsolute(out) || out.startsWith(root + '/')) throw new Error('external absolute output required');
const temp = await mkdtemp(path.join(os.tmpdir(), 'hive-build13-'));
let server, browser;
const beat = setInterval(() => console.log('capture heartbeat', new Date().toISOString()), 30000);
try {
  await mkdir(out, { recursive: true });
  const data = path.join(temp, 'audit.json'); await writeFile(data, JSON.stringify((await buildAudit({ root })).document));
  await buildHivePage(path.join(temp, 'site'), data);
  if (process.argv.includes('--baseline')) {
    const files = execFileSync('git', ['ls-tree', '-r', '--name-only', '1499688d', 'apps/hive'], { encoding: 'utf8' }).trim().split('\n');
    for (const file of files.filter(f => !f.endsWith('/README.md'))) await writeFile(path.join(temp, 'site', file.slice('apps/hive/'.length)), execFileSync('git', ['show', `1499688d:${file}`], { maxBuffer: 16 * 1024 * 1024 }));
  }
  server = await serveHive(path.join(temp, 'site')); const url = `http://127.0.0.1:${server.address().port}/`;
  browser = await resolvePlaywright(process.env, root).chromium.launch({ args: ['--use-angle=metal'] });
  if (!process.argv.includes('--capture-only')) await measureScrolling(browser, url, path.join(out, 'scroll'));
  if (!process.argv.includes('--measure-only')) {
    const records = [];
    for (const width of process.argv.includes('--gestures-only') ? [] : [1280, 390]) {
      const folder = path.join(out, String(width)); await mkdir(folder, { recursive: true });
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.on('pageerror', e => { console.log('PAGE ERROR', e.message); process.exitCode = 1; });
      await page.goto(`${url}#overview`); await waitForHive(page, true);
      await page.clock.install({ time: new Date('2026-10-30T12:00:00Z') }); await page.clock.pauseAt(new Date('2026-10-30T12:00:01Z'));
      if (await page.getAttribute('html', 'data-hive-ready') !== 'webgl') throw new Error('pixel fallback');
      const sections = await page.locator('#chapters section').evaluateAll(nodes => nodes.map(n => ({ id: n.id, start: n.offsetTop, height: n.offsetHeight })));
      const save = async name => {
        await page.screenshot({ path: path.join(folder, `${name}.png`) });
        records.push({ width, name, ...await page.evaluate(() => ({ time: performance.now(), stage: document.documentElement.dataset.hiveStage, pose: document.documentElement.dataset.hivePose })) });
      };
      const jump = async y => { await page.evaluate(y => scrollTo(0, y), y); await page.clock.runFor(600); };
      for (const [i, s] of sections.entries()) {
        await jump(s.start + s.height / 2); await save(`chapter-${String(i).padStart(2, '0')}-mid`);
        if (width === 1280 && i >= 2 && i <= 10) for (let f = 0; f < 4; f++) { if (f) await page.clock.runFor(500); await save(`motion-${String(i).padStart(2, '0')}-${f}`); }
      }
      for (const [i, f] of [0, 0.5, 1].entries()) { await jump(sections[0].height * f); await save(`opening-${i}`); }
      const boundary = sections[4];
      for (const [i, f] of [0.85, 0.89, 0.925, 0.95, 0.98, 1.01].entries()) { await jump(boundary.start + boundary.height * f); await save(`boundary-${i}`); }
      await jump(sections[4].start + sections[4].height * 0.8);
      await page.evaluate(() => { const start = performance.now(), first = scrollY; const tick = now => { scrollTo(0, first + Math.min(2000, now - start) * 0.2); if (now - start < 2000) requestAnimationFrame(tick); }; requestAnimationFrame(tick); });
      for (let i = 0; i < 30; i++) { await page.clock.runFor(2000 / 30); await save(`slow-scroll-${String(i).padStart(2, '0')}`); }
      await jump(sections[5].start + sections[5].height / 2);
      for (let i = 0; i < 4; i++) { if (i) await page.clock.runFor(500); await save(`idle-${i}`); }
      await page.clock.resume(); await page.goto(`${url}?still#explore/workshop`); await waitForHive(page, true); await save('explore-selected'); await page.close();
    }
    await writeFile(path.join(out, 'poses.json'), JSON.stringify(records, null, 2));
    if (process.argv.includes('--first-look')) for (const id of ['overview', 'compass', 'drafting-table', 'workshop', 'eyes', 'review-ladder', 'land-gate', 'closing', 'explore']) {
      const code = await runFirstLook(['--page', 'url', '--hive', '--after', `${url}?still#${id}`, '--reference', '/private/tmp/nana-3dmk-ref', '--spec', 'docs/reviews/world-graph-2026-10-30/world-art-spec.md', '--out', path.join(out, `first-look-${id}`)]);
      console.log(`first-look ${id}: exit ${code}`); if (code) throw new Error(`first-look ${id}`);
    }
    const result = await gestures(['--url', url, '--out', path.join(out, 'gestures'), ...(process.argv.includes('--scroll-check') ? ['--scroll'] : [])]); console.log(`gesture exit ${result}`); if (result) process.exitCode = result;
  }
} finally { clearInterval(beat); await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); await rm(temp, { recursive: true, force: true }); }
