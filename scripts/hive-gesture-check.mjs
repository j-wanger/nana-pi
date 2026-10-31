#!/usr/bin/env node
/**
 * @module scripts/hive-gesture-check.mjs
 * @purpose Measures phone selection and scroll safety through a served hive's real browser wiring.
 * @inputs CLI --url and --out, optional --scroll and Playwright resolved through the shared resolver.
 * @outputs Phone gesture checks and optional Metal scroll telemetry at both widths with external screenshots and JSON.
 * @effects network (served page), disk (external screenshot), process (browser)
 * @errors Missing browser or failed checks exit 1; malformed options exit 2.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePlaywright } from './playwright-resolve.mjs';
import { waitForHive } from './first-look.mjs';
import { VIEWPORT_HEIGHT } from './first-look-config.mjs';
import { outsideRepo } from './reader-common.mjs';
import { CITY, TOUR_SCROLL } from '../apps/hive/config.mjs';
// Seat-only measurement; suite tests never import or execute this browser driver.
export async function measureScrolling(browser, base, out, { instrument = true } = {}) {
  await mkdir(out, { recursive: true });
  const results = [];
  for (const width of [1280, 390]) for (const input of ['ticks', 'smooth']) {
    const page = await browser.newPage({ viewport: { width, height: VIEWPORT_HEIGHT } });
    if (instrument) await page.route('**/main.mjs', async route => {
      const response = await route.fetch(); let source = await response.text();
      source = source.replace('const reading = () => {', 'const reading = () => { window.probe.readings++;');
      source = source.replace('const draw = () => {', 'const draw = () => { window.probe.draws++;');
      source = source.replaceAll('renderer.shadowMap.needsUpdate = true;', 'renderer.shadowMap.needsUpdate = true; window.probe.shadows++;');
      source = source.replaceAll('renderer.render(scene, camera);', 'window.probe.renders++; renderer.render(scene, camera);');
      source = source.replace('renderText(document, stories, textLayer', 'window.probe.textUpdates++; renderText(document, stories, textLayer');
      source = source.replace('for (const [i, chapter] of chapters.entries())', 'window.probe.fades++; for (const [i, chapter] of chapters.entries())');
      await route.fulfill({ response, body: source });
    });
    if (instrument) await page.route('**/three.core.js', async route => {
      const response = await route.fetch(), source = await response.text();
      await route.fulfill({ response, body: source.replace(/(class BufferGeometry extends EventDispatcher[\s\S]*?super\(\);)/, '$1\nwindow.probe.geometries++;') });
    });
    await page.addInitScript(() => {
      window.probe = { readings: 0, textUpdates: 0, fades: 0, draws: 0, renders: 0, shadows: 0, layouts: 0, buffers: 0, geometries: 0, tasks: [] };
      const rect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function (...args) { window.probe.layouts++; return rect.apply(this, args); };
      const buffer = WebGL2RenderingContext.prototype.bufferData;
      WebGL2RenderingContext.prototype.bufferData = function (...args) { window.probe.buffers++; return buffer.apply(this, args); };
      new PerformanceObserver(list => window.probe.tasks.push(...list.getEntries().map(e => e.duration))).observe({ type: 'longtask', buffered: true });
    });
    await page.goto(`${base.replace(/#.*$/, '')}#overview`); await waitForHive(page, true);
    if (await page.getAttribute('html', 'data-hive-ready') !== 'webgl') throw new Error('scroll measurement refuses pixel fallback');
    const gpu = await page.evaluate(() => { const gl = document.querySelector('canvas').getContext('webgl2'), ext = gl.getExtension('WEBGL_debug_renderer_info'); return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'unknown'; });
    await page.waitForTimeout(1500);
    // Real short wheel ticks; the other case is one uninterrupted ten-second page scroll.
    await page.mouse.move(width / 2, 450);
    await page.evaluate(input => {
      window.probe.samples = []; window.probe.tasks = [];
      window.probe.startCounts = { ...window.probe }; delete window.probe.startCounts.startCounts;
      const start = performance.now(), end = document.getElementById('release-route').offsetTop;
      let previous = start;
      window.probe.done = new Promise(resolve => {
        const tick = now => {
          const root = document.documentElement;
          window.probe.samples.push({ ms: now - previous, time: now - start, stage: Number(root.dataset.hiveStage), target: Number(root.dataset.hiveTargetStage ?? root.dataset.hiveStage), pose: JSON.parse(root.dataset.hivePose), cpu: JSON.parse(root.dataset.hiveFrameStats).cpuMs, scroll: scrollY }); previous = now;
          if (input === 'smooth' && now - start <= 10000) scrollTo(0, end * Math.min(1, (now - start) / 10000));
          if (now - start < 11000) requestAnimationFrame(tick); else resolve();
        }; requestAnimationFrame(tick);
      });
    }, input);
    if (input === 'ticks') {
      const start = Date.now();
      for (let i = 0; i < 100; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(Math.max(0, start + (i + 1) * 100 - Date.now())); }
    }
    await page.evaluate(() => window.probe.done);
    const raw = await page.evaluate(() => window.probe);
    const samples = raw.samples.filter(s => s.time > 100 && s.time <= 10000), times = samples.map(s => s.ms).sort((a, b) => a - b);
    let maxStep = 0, maxWorldStep = 0, reversals = 0, stageReversals = 0, previousDelta;
    for (let i = 1; i < samples.length; i++) {
      const a = samples[i - 1], b = samples[i], delta = b.pose.position.map((v, j) => v - a.pose.position[j]), step = Math.hypot(...delta);
      maxWorldStep = Math.max(maxWorldStep, step); maxStep = Math.max(maxStep, step / Math.hypot(...a.pose.position.map((v, j) => v - a.pose.target[j])));
      if (previousDelta && step > 0.005 && Math.hypot(...previousDelta) > 0.005 && delta.reduce((s, v, j) => s + v * previousDelta[j], 0) < -0.0001) reversals++;
      // A chapter reading hold separates camera legs. Do not compare the new
      // leg's bearing with the bearing before a stationary reading interval.
      previousDelta = step > 0.005 ? delta : undefined;
      if (b.stage < a.stage - 1e-8) stageReversals++;
    }
    const settled = raw.samples.find(s => s.time >= 10500), end = raw.samples.at(-1);
    const result = { width, input, gpu, frames: samples.length, p95Ms: times[Math.floor(times.length * 0.95)], maxTaskMs: Math.max(0, ...raw.tasks), maxWorldStep, maxRelativeStep: maxStep, reversals, stageReversals, settleError: Math.abs(settled.stage - settled.target), idle: settled.stage === end.stage && JSON.stringify(settled.pose) === JSON.stringify(end.pose), counts: Object.fromEntries(['readings', 'textUpdates', 'fades', 'draws', 'renders', 'shadows', 'layouts', 'buffers', 'geometries'].map(k => [k, raw[k] - raw.startCounts[k]])) };
    results.push(result); console.log('SCROLL', JSON.stringify(result));
    await writeFile(path.join(out, `${width}-${input}.json`), JSON.stringify({ result, samples: raw.samples }, null, 2)); await page.close();
  }
  await writeFile(path.join(out, 'summary.json'), JSON.stringify(results, null, 2)); return results;
}
export async function main(argv = process.argv.slice(2), { env = process.env, print = console.log } = {}) {
  const opts = {};
  const usage = 'Usage: hive-gesture-check.mjs --url <url> --out <folder outside git> [--scroll]';
  for (let i = 0; i < argv.length; i++) { if (argv[i] === '--scroll' && !opts.scroll) { opts.scroll = true; continue; } if (['--url', '--out'].includes(argv[i]) && argv[i + 1] && !opts[argv[i]]) opts[argv[i]] = argv[++i]; else { print(usage); return 2; } }
  if (!opts['--url'] || !opts['--out'] || !outsideRepo(process.cwd(), path.resolve(opts['--out']))) { print(usage); return 2; }
  let browser, failed = 0, checked = 0;
  const check = (ok, title) => { checked++; print(`${ok ? 'PASS' : 'FAIL'} ${title}`); if (!ok) failed++; };
  try {
    const playwright = resolvePlaywright(env, process.cwd()); if (!playwright) throw new Error('Playwright unavailable');
    browser = await playwright.chromium.launch({ args: ['--use-angle=metal'] }); const phoneWidth = 390; const page = await browser.newPage({ viewport: { width: phoneWidth, height: VIEWPORT_HEIGHT }, hasTouch: true, reducedMotion: 'reduce' });
    const base = opts['--url'].replace(/#.*$/, ''), state = () => page.evaluate(() => ({ pose: document.documentElement.dataset.hivePose, chapter: document.documentElement.dataset.hiveChapter, stage: Number(document.documentElement.dataset.hiveStage), selection: document.documentElement.dataset.hiveSelection, hash: location.hash, scroll: scrollY }));
    await page.goto(`${base}#explore`); await waitForHive(page, true); const before = await state();
    // Search the canvas, not the picker or an overlay. Each successful tap uses actual hit testing.
    let selected = false;
    const picks = await page.locator('.label[data-pick-x]').evaluateAll(nodes => nodes.map(n => ({ x: Number(n.dataset.pickX), y: Number(n.dataset.pickY) })));
    for (const p of picks) { if (selected) break; if (p.x <= 0 || p.x >= phoneWidth || p.y < 180 || p.y > 700) continue; await page.touchscreen.tap(p.x, p.y); selected = Boolean((await state()).selection); }
    for (let y = 200; y < 650 && !selected; y += 30) for (let x = 30; x < phoneWidth - 30 && !selected; x += 30) { await page.touchscreen.tap(x, y); selected = Boolean((await state()).selection); }
    const after = await state(); check(selected && before.pose === after.pose && before.hash === after.hash, 'explore tap selects without pose or hash change');
    await page.goto(base); await waitForHive(page, true); const tourBefore = await state(); await page.touchscreen.tap(190, 450); const tourAfter = await state(); check(JSON.stringify(tourBefore) === JSON.stringify(tourAfter), 'tour tap changes nothing');
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 650 }] });
    for (let y = 600; y >= 100; y -= 50) { await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] }); await page.waitForTimeout(20); }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(300);
    const swiped = await state(); check(swiped.scroll > tourAfter.scroll && swiped.stage > tourAfter.stage && swiped.selection === tourAfter.selection && swiped.hash === tourAfter.hash, 'tour swipe advances continuous stage without selection or hash change');
    await page.goto(base); await waitForHive(page, true);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const idleCheck = async title => {
      await page.waitForTimeout(TOUR_SCROLL.settleSeconds * 1000); const early = await state();
      await page.waitForTimeout(TOUR_SCROLL.holdCheckMs); const late = await state();
      print(`${title} settled: ${JSON.stringify(early)}`); print(`${title} after 2s still: ${JSON.stringify(late)}`);
      check(early.pose === late.pose && early.stage === late.stage && early.scroll === late.scroll, `${title}: stage and camera hold for 2s after settling`);
    };
    const ticks = [];
    await page.mouse.move(190, 450);
    for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); ticks.push((await state()).stage); }
    check(ticks.every((s, i) => s >= (ticks[i - 1] ?? 0)) && ticks.at(-1) >= 3, '60 single 100px wheel ticks advance monotonically');
    await idleCheck('wheel stop');
    print(`wheel stages: ${ticks.map(s => s.toFixed(3)).join(' ')}`);
    await page.goto(base); await waitForHive(page, true);
    let swipes = true;
    for (let i = 0; i < 5; i++) {
      const a = await state();
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 450 }] });
      for (let y = 440; y >= 390; y -= 10) { await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] }); await page.waitForTimeout(40); }
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(100);
      swipes &&= (await state()).pose !== a.pose;
    }
    check(swipes, 'five short 60px touch swipes each change camera');
    await idleCheck('touch stop');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.mouse.wheel(0, 100); await page.waitForTimeout(100);
    // Native smooth page scrolling is the only driver; there is no separate camera flight.
    await page.selectOption('select', '#workshop'); await page.waitForTimeout(100);
    const travelling = Math.abs((await state()).stage - 5) > 0.01;
    await page.waitForTimeout(4400);
    check(travelling && (await state()).chapter === 'workshop' && Math.abs((await state()).stage - 5) < 0.01, 'rail or picker click smoothly scrolls to requested chapter');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let anchors = true;
    for (const id of ['drafting-table', 'review-ladder', 'release-route']) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id); await page.waitForTimeout(100); const scrolled = await state();
      await page.goto(`${base}#${id}`); await waitForHive(page, true); const linked = await state(); anchors &&= scrolled.chapter === id && scrolled.pose === linked.pose;
    }
    check(anchors, 'scroll reaches the same three poses as chapter hashes');
    await page.goto(`${base}#overview`); await waitForHive(page, true);
    const order = await page.evaluate(() => JSON.parse(document.documentElement.dataset.hiveChapters));
    const sequence = []; let overlap = true, framed = true, readable = true, readingSpans = true;
    for (const id of order) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id);
      await page.waitForFunction(id => document.documentElement.dataset.hiveChapter === id, id, { timeout: 3000 });
      const sample = await page.evaluate(() => {
        const root = document.documentElement, box = JSON.parse(root.dataset.hivePlaceBox), card = document.querySelector('.card.active')?.getBoundingClientRect();
        const intersection = box && card ? Math.max(0, Math.min(box.right, card.right) - Math.max(box.left, card.left)) * Math.max(0, Math.min(box.bottom, card.bottom) - Math.max(box.top, card.top)) : 0;
        const target = JSON.parse(root.dataset.hiveTarget), header = document.querySelector('.chapter-picker').getBoundingClientRect().bottom;
        const opacityCount = [...document.querySelectorAll('.card:not([hidden])')].filter(c => Number(getComputedStyle(c).opacity) > 0.05).length;
        const section = document.getElementById(root.dataset.hiveChapter);
        return { chapter: root.dataset.hiveChapter, targetY: target[1], header, cardTop: card?.top ?? innerHeight, opacityCount, screens: section.getBoundingClientRect().height / innerHeight, overlap: box ? intersection / ((box.right - box.left) * (box.bottom - box.top)) : 0 };
      });
      sequence.push(sample.chapter); overlap &&= sample.overlap <= CITY.cardOverlap;
      framed &&= sample.targetY > sample.header && sample.targetY < sample.cardTop;
      readable &&= sample.opacityCount <= 1; readingSpans &&= sample.screens >= 0.8;
      print(`scroll ${sample.chapter}: card overlap ${sample.overlap.toFixed(4)}`);
    }
    check(JSON.stringify(sequence) === JSON.stringify(order) && overlap, 'full phone scroll visits every chapter in order with bounded card overlap');
    check(framed, 'all 390px chapter targets project between header and card');
    check(readable && readingSpans, 'one readable card and at least 0.8 reading screens per phone chapter');
    const boundary = await page.locator('#queue').evaluate(n => ({ start: n.offsetTop, height: n.offsetHeight }));
    for (let i = 0; i <= 30; i++) {
      await page.evaluate(y => scrollTo(0, y), boundary.start + boundary.height * (0.85 + i / 30 * 0.15)); await page.waitForTimeout(30);
      readable &&= await page.locator('.card:not([hidden])').evaluateAll(nodes => nodes.filter(n => Number(getComputedStyle(n).opacity) > 0.05).length <= 1);
    }
    check(readable, '31 samples across one boundary never overlap readable cards');
    await page.goto(`${base}#overview`); await waitForHive(page, true);
    const pixels = await page.evaluate(() => {
      const canvas = document.querySelector('canvas'), rect = canvas.getBoundingClientRect(), copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height;
      const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0);
      const luminance = p => {
        const rgba = ctx.getImageData(Math.floor(p[0] / rect.width * canvas.width), Math.floor(p[1] / rect.height * canvas.height), 1, 1).data;
        const rgb = [...rgba].slice(0, 3).map(v => { const s = v / 255; return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
        return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
      };
      return JSON.parse(document.documentElement.dataset.hiveStreetSamples).map(s => ({ street: luminance(s.street), ground: luminance(s.ground) }));
    });
    pixels.forEach((p, i) => print(`street pixel ${i + 1}: ${p.street.toFixed(4)} / ground ${p.ground.toFixed(4)}`));
    check(pixels.length === 5 && pixels.every(p => p.street - p.ground >= CITY.pixelMargin), 'five street pixels are lighter than their neighbouring ground');
    await mkdir(opts['--out'], { recursive: true }); await page.screenshot({ path: path.join(opts['--out'], 'gesture-390.png') });
    if (opts.scroll) for (const r of await measureScrolling(browser, base, path.join(opts['--out'], 'scroll'))) {
      check(r.p95Ms < 20 && r.maxTaskMs <= 50, `${r.width}/${r.input}: p95 below 20ms and no task above 50ms`);
      check(r.maxRelativeStep < TOUR_SCROLL.cameraStepBound && r.reversals === 0 && r.stageReversals === 0, `${r.width}/${r.input}: bounded camera steps without reversal`);
      check(r.settleError === 0 && r.idle, `${r.width}/${r.input}: exact page target after settling`);
    }
    print(`gesture checks: ${checked - failed} passed, ${failed} failed`); return failed ? 1 : 0;
  } catch (error) { print(`hive-gesture-check: ${error.message}`); return 1; }
  finally { await browser?.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
