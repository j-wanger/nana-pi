#!/usr/bin/env node
/**
 * @module scripts/hive-gesture-check.mjs
 * @purpose Measures phone selection and scroll safety through a served hive's real browser wiring.
 * @inputs CLI --url and --out, optional Playwright resolved through the shared resolver.
 * @outputs Four PASS/FAIL checks and a phone screenshot outside the repository.
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
export async function main(argv = process.argv.slice(2), { env = process.env, print = console.log } = {}) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) { if (['--url', '--out'].includes(argv[i]) && argv[i + 1] && !opts[argv[i]]) opts[argv[i]] = argv[++i]; else { print('Usage: hive-gesture-check.mjs --url <url> --out <folder outside git>'); return 2; } }
  if (!opts['--url'] || !opts['--out'] || !outsideRepo(process.cwd(), path.resolve(opts['--out']))) { print('Usage: hive-gesture-check.mjs --url <url> --out <folder outside git>'); return 2; }
  let browser, failed = 0;
  const check = (ok, title) => { print(`${ok ? 'PASS' : 'FAIL'} ${title}`); if (!ok) failed++; };
  try {
    const playwright = resolvePlaywright(env, process.cwd()); if (!playwright) throw new Error('Playwright unavailable');
    browser = await playwright.chromium.launch(); const page = await browser.newPage({ viewport: { width: VIEWPORT_WIDTHS[0], height: VIEWPORT_HEIGHT }, hasTouch: true, reducedMotion: 'reduce' });
    const base = opts['--url'].replace(/#.*$/, ''), state = () => page.evaluate(() => ({ pose: document.documentElement.dataset.hivePose, chapter: document.documentElement.dataset.hiveChapter, selection: document.documentElement.dataset.hiveSelection, hash: location.hash, scroll: scrollY }));
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
    let anchors = true;
    for (const id of ['drafting-table', 'review-ladder', 'notice-board']) {
      await page.evaluate(id => document.getElementById(id).scrollIntoView(), id); await page.waitForTimeout(100); const scrolled = await state();
      await page.goto(`${base}#${id}`); await waitForHive(page, true); const linked = await state(); anchors &&= scrolled.chapter === id && scrolled.pose === linked.pose;
    }
    check(anchors, 'scroll reaches the same three poses as chapter hashes');
    await mkdir(opts['--out'], { recursive: true }); await page.screenshot({ path: path.join(opts['--out'], 'gesture-380.png') });
    print(`gesture checks: ${4 - failed} passed, ${failed} failed`); return failed ? 1 : 0;
  } catch (error) { print(`hive-gesture-check: ${error.message}`); return 1; }
  finally { await browser?.close(); }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = await main();
