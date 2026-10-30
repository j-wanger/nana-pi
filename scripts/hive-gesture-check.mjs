#!/usr/bin/env node
/**
 * @module scripts/hive-gesture-check.mjs
 * @purpose Measures phone selection and scroll safety through a served hive's real browser wiring.
 * @inputs CLI --url and --out, optional Playwright resolved through the shared resolver.
 * @outputs Nine PASS/FAIL checks, measured wheel stages, chapter overlap and street pixels, and an external phone screenshot.
 * @effects network (served page), disk (external screenshot), process (browser)
 * @errors Missing browser or failed checks exit 1; malformed options exit 2.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolvePlaywright } from './playwright-resolve.mjs';
import { waitForHive } from './first-look.mjs';
import { VIEWPORT_WIDTHS, VIEWPORT_HEIGHT } from './first-look-config.mjs';
import { outsideRepo } from './reader-common.mjs';
import { CITY } from '../apps/hive/config.mjs';
export async function main(argv = process.argv.slice(2), { env = process.env, print = console.log } = {}) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) { if (['--url', '--out'].includes(argv[i]) && argv[i + 1] && !opts[argv[i]]) opts[argv[i]] = argv[++i]; else { print('Usage: hive-gesture-check.mjs --url <url> --out <folder outside git>'); return 2; } }
  if (!opts['--url'] || !opts['--out'] || !outsideRepo(process.cwd(), path.resolve(opts['--out']))) { print('Usage: hive-gesture-check.mjs --url <url> --out <folder outside git>'); return 2; }
  let browser, failed = 0;
  const check = (ok, title) => { print(`${ok ? 'PASS' : 'FAIL'} ${title}`); if (!ok) failed++; };
  try {
    const playwright = resolvePlaywright(env, process.cwd()); if (!playwright) throw new Error('Playwright unavailable');
    browser = await playwright.chromium.launch(); const page = await browser.newPage({ viewport: { width: VIEWPORT_WIDTHS[0], height: VIEWPORT_HEIGHT }, hasTouch: true, reducedMotion: 'reduce' });
    const base = opts['--url'].replace(/#.*$/, ''), state = () => page.evaluate(() => ({ pose: document.documentElement.dataset.hivePose, chapter: document.documentElement.dataset.hiveChapter, stage: Number(document.documentElement.dataset.hiveStage), selection: document.documentElement.dataset.hiveSelection, hash: location.hash, scroll: scrollY }));
    await page.goto(`${base}#explore`); await waitForHive(page, true); const before = await state();
    // Search the canvas, not the picker or an overlay. Each successful tap uses actual hit testing.
    let selected = false;
    const picks = await page.locator('.label[data-pick-x]').evaluateAll(nodes => nodes.map(n => ({ x: Number(n.dataset.pickX), y: Number(n.dataset.pickY) })));
    for (const p of picks) { if (selected) break; if (p.x <= 0 || p.x >= VIEWPORT_WIDTHS[0] || p.y < 180 || p.y > 700) continue; await page.touchscreen.tap(p.x, p.y); selected = Boolean((await state()).selection); }
    for (let y = 200; y < 650 && !selected; y += 30) for (let x = 30; x < VIEWPORT_WIDTHS[0] - 30 && !selected; x += 30) { await page.touchscreen.tap(x, y); selected = Boolean((await state()).selection); }
    const after = await state(); check(selected && before.pose === after.pose && before.hash === after.hash, 'explore tap selects without pose or hash change');
    await page.goto(base); await waitForHive(page, true); const tourBefore = await state(); await page.touchscreen.tap(190, 450); const tourAfter = await state(); check(JSON.stringify(tourBefore) === JSON.stringify(tourAfter), 'tour tap changes nothing');
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 650 }] });
    for (let y = 600; y >= 100; y -= 50) { await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y }] }); await page.waitForTimeout(20); }
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(300);
    const swiped = await state(); check(swiped.scroll > tourAfter.scroll && swiped.chapter !== tourAfter.chapter && swiped.selection === tourAfter.selection && swiped.hash === tourAfter.hash, 'tour swipe scrolls to a chapter without selection or hash change');
    await page.goto(base); await waitForHive(page, true);
    const ticks = [];
    await page.mouse.move(190, 450);
    for (let i = 0; i < 40; i++) { await page.mouse.wheel(0, 100); await page.waitForTimeout(60); ticks.push((await state()).stage); }
    check(ticks.every((s, i) => s > (ticks[i - 1] ?? 0)) && ticks.at(-1) >= 3, '40 single 100px wheel ticks advance monotonically to chapter 3');
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
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.mouse.wheel(0, 100); await page.waitForTimeout(100);
    // The phone picker invokes the same flight as a rail click.
    await page.selectOption('select', '#workshop'); await page.waitForTimeout(100);
    const flying = (await state()).stage < 4.9;
    await page.waitForTimeout(4400);
    check(flying && (await state()).chapter === 'workshop' && Math.abs((await state()).stage - 5) < 0.01, 'rail or picker click mid-scroll lands on requested chapter');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let anchors = true;
    for (const id of ['drafting-table', 'review-ladder', 'release-route']) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id); await page.waitForTimeout(100); const scrolled = await state();
      await page.goto(`${base}#${id}`); await waitForHive(page, true); const linked = await state(); anchors &&= scrolled.chapter === id && scrolled.pose === linked.pose;
    }
    check(anchors, 'scroll reaches the same three poses as chapter hashes');
    await page.goto(`${base}#overview`); await waitForHive(page, true);
    const order = await page.evaluate(() => JSON.parse(document.documentElement.dataset.hiveChapters));
    const sequence = []; let overlap = true;
    for (const id of order) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id);
      await page.waitForFunction(id => document.documentElement.dataset.hiveChapter === id, id, { timeout: 3000 });
      const sample = await page.evaluate(() => {
        const root = document.documentElement, box = JSON.parse(root.dataset.hivePlaceBox), card = document.querySelector('.card.active')?.getBoundingClientRect();
        const intersection = box && card ? Math.max(0, Math.min(box.right, card.right) - Math.max(box.left, card.left)) * Math.max(0, Math.min(box.bottom, card.bottom) - Math.max(box.top, card.top)) : 0;
        return { chapter: root.dataset.hiveChapter, overlap: box ? intersection / ((box.right - box.left) * (box.bottom - box.top)) : 0 };
      });
      sequence.push(sample.chapter); overlap &&= sample.overlap <= CITY.cardOverlap;
      print(`scroll ${sample.chapter}: card overlap ${sample.overlap.toFixed(4)}`);
    }
    check(JSON.stringify(sequence) === JSON.stringify(order) && overlap, 'full phone scroll visits every chapter in order with bounded card overlap');
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
    await mkdir(opts['--out'], { recursive: true }); await page.screenshot({ path: path.join(opts['--out'], 'gesture-380.png') });
    print(`gesture checks: ${9 - failed} passed, ${failed} failed`); return failed ? 1 : 0;
  } catch (error) { print(`hive-gesture-check: ${error.message}`); return 1; }
  finally { await browser?.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
