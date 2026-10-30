/**
 * @module docs/reviews/world-graph-2026-10-30/build11-capture.mjs
 * @purpose Records build 11's real-data chapter, boundary and gesture frames outside git.
 * @inputs Optional external output folder and --first-look flag.
 * @outputs Screenshots and measured poses; capture and gesture exit codes.
 * @effects disk (OS temporary site and external frames), network (loopback), process (Chromium)
 * @errors Failed browser checks set a nonzero exit code.
 */
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { buildAudit } from '../../../scripts/component-audit.mjs';
import { buildHivePage, serveHive } from '../../../scripts/hive-page.mjs';
import { resolvePlaywright } from '../../../scripts/playwright-resolve.mjs';
import { waitForHive, runFirstLook } from '../../../scripts/first-look.mjs';
import { main as gestures } from '../../../scripts/hive-gesture-check.mjs';
const out = process.argv[2] ?? '/tmp/world-graph-build11-round1', root = process.cwd();
const temp = await mkdtemp(path.join(os.tmpdir(), 'hive-build11-'));
let server, browser;
const beat = setInterval(() => console.log('capture heartbeat', new Date().toISOString()), 30000);
try {
  await mkdir(out, { recursive: true });
  const data = path.join(temp, 'audit.json'); await writeFile(data, JSON.stringify((await buildAudit({ root })).document));
  await buildHivePage(path.join(temp, 'site'), data);
  server = await serveHive(path.join(temp, 'site')); const url = `http://127.0.0.1:${server.address().port}/`;
  if (process.argv.includes('--first-look')) for (const id of ['overview', 'compass', 'drafting-table', 'workshop', 'eyes', 'review-ladder', 'land-gate', 'closing', 'explore']) {
    const code = await runFirstLook(['--page', 'url', '--hive', '--after', `${url}?still#${id}`, '--reference', '/private/tmp/nana-3dmk-ref', '--spec', 'docs/reviews/world-graph-2026-10-30/world-art-spec.md', '--out', path.join(out, `first-look-${id}`)]);
    console.log(`first-look ${id}: exit ${code}`); if (code) throw new Error(`first-look ${id}`);
  }
  browser = await resolvePlaywright(process.env, root).chromium.launch();
  const records = [];
  for (const width of [390, 1280]) {
    const folder = path.join(out, String(width)); await mkdir(folder, { recursive: true });
    const page = await browser.newPage({ viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    page.on('pageerror', e => console.log('PAGE ERROR', e.message));
    await page.goto(`${url}?still#overview`); await waitForHive(page, true);
    if (await page.getAttribute('html', 'data-hive-ready') !== 'webgl') throw new Error('pixel fallback');
    const sections = await page.locator('#chapters section').evaluateAll(nodes => nodes.map(n => ({ id: n.id, start: n.offsetTop, height: n.offsetHeight })));
    const save = async (name, scroll) => {
      await page.evaluate(y => scrollTo(0, y), scroll); await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(folder, `${name}.png`) });
      const state = await page.evaluate(() => ({ stage: document.documentElement.dataset.hiveStage, pose: document.documentElement.dataset.hivePose, target: document.documentElement.dataset.hiveTarget, cards: [...document.querySelectorAll('.card:not([hidden])')].map(n => ({ id: n.id, opacity: getComputedStyle(n).opacity, top: n.getBoundingClientRect().top })) }));
      records.push({ width, name, scroll, ...state }); console.log(width, name, JSON.stringify(state));
    };
    for (const [i, s] of sections.entries()) {
      await page.emulateMedia({ reducedMotion: 'no-preference' });
      await page.goto(`${url}#${s.id}`); await waitForHive(page, true);
      await save(`chapter-${String(i).padStart(2, '0')}-mid`, s.start + s.height / 2);
      await page.goto(`${url}?still#${s.id}`); await waitForHive(page, true);
      await page.screenshot({ path: path.join(folder, `anchor-${String(i).padStart(2, '0')}.png`) });
    }
    await page.goto(`${url}?still#overview`); await waitForHive(page, true);
    const roofs = await page.evaluate(async () => {
      const THREE = await import('./vendor/three.module.js'), { prepare } = await import('./runtime.mjs');
      const { buildHive } = await import('./assets/hive.mjs'), { buildMaterials } = await import('./assets/materials.mjs'), { STYLE } = await import('./config.mjs');
      const [data, plan] = await Promise.all(['components.json', 'city.json'].map(p => fetch(p).then(r => r.json())));
      const model = prepare(data, plan).scene, hive = buildHive(THREE, model, buildMaterials(THREE)); hive.updateMatrixWorld(true);
      const pose = JSON.parse(document.documentElement.dataset.hivePose), camera = new THREE.PerspectiveCamera(STYLE.fov, innerWidth / innerHeight, 0.1, 10000);
      camera.position.set(...pose.position); camera.lookAt(...pose.target);
      const targetPixel = JSON.parse(document.documentElement.dataset.hiveTarget);
      camera.setViewOffset(innerWidth, innerHeight, 0, innerHeight / 2 - targetPixel[1], innerWidth, innerHeight); camera.updateMatrixWorld();
      const canvas = document.querySelector('canvas'), copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height;
      const ctx = copy.getContext('2d'); ctx.drawImage(canvas, 0, 0);
      return hive.children.filter(o => o.userData.place && model.chambers.find(n => n.id === o.userData.place)?.component).map(lot => {
        let roof; lot.traverse(o => { if (o.userData.roofLight) roof = o; });
        const p = new THREE.Vector3(0, 0.5, 0).applyMatrix4(roof.matrixWorld).project(camera), x = (p.x + 1) / 2 * innerWidth, y = (1 - p.y) / 2 * innerHeight;
        const rgb = [...ctx.getImageData(Math.round(x / innerWidth * canvas.width), Math.round(y / innerHeight * canvas.height), 1, 1).data].slice(0, 3);
        return { id: lot.userData.place, status: model.chambers.find(n => n.id === lot.userData.place).material.status, x, y, rgb };
      });
    });
    console.log(`roof pixels ${width}: ${JSON.stringify(roofs)}`);
    const lit = roofs.filter(p => p.status === 'sound' && p.rgb.every(v => v >= 215)), dark = roofs.filter(p => p.status === 'absent' && p.rgb.every(v => v <= 80));
    console.log(`roof distinction ${width}: ${lit.length} lit (${lit.map(p => p.id)}), ${dark.length} dark (${dark.map(p => p.id)})`);
    if (width === 1280 && (lit.length < 3 || dark.length < 2)) throw new Error('roof pixels do not distinguish three lit and two dark places');
    const boundary = sections[4];
    for (const [i, fraction] of [0.85, 0.89, 0.925, 0.95, 0.98, 1.01].entries()) await save(`boundary-${i}`, boundary.start + boundary.height * fraction);
    await page.goto(`${url}?still#compass`); await waitForHive(page, true);
    await page.evaluate(({ start, end }) => {
      const began = performance.now();
      const tick = now => { const t = Math.min(1, (now - began) / 14000); scrollTo(0, start + (end - start) * t); if (t < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }, { start: sections[2].start, end: sections[6].start });
    for (let i = 0; i < 8; i++) {
      const target = 2 + 4 * i / 7;
      await page.waitForFunction(s => Number(document.documentElement.dataset.hiveStage) >= s - 0.002, target, { timeout: 20000 });
      await page.screenshot({ path: path.join(folder, `scroll-strip-${i}.png`) });
      records.push({ width, name: `scroll-strip-${i}`, ...await page.evaluate(() => ({ stage: document.documentElement.dataset.hiveStage, pose: document.documentElement.dataset.hivePose })) });
    }
    await page.goto(`${url}#workshop`); await waitForHive(page, true); await page.evaluate(y => scrollTo(0, y), sections[5].start + sections[5].height * 0.45);
    for (let i = 0; i < 4; i++) { await page.waitForTimeout(500); await save(`idle-${i}`, await page.evaluate(() => scrollY)); }
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto(url); await waitForHive(page, true);
    for (const [i, f] of [0, 0.5, 1].entries()) await save(`opening-${i}`, sections[0].height * f);
    await page.goto(`${url}?still#explore/workshop`); await waitForHive(page, true); await page.screenshot({ path: path.join(folder, 'explore-selected.png') });
    await page.close();
  }
  await writeFile(path.join(out, 'poses.json'), JSON.stringify(records, null, 2));
  const result = await gestures(['--url', url, '--out', path.join(out, 'gestures')]); console.log(`gesture exit ${result}`); process.exitCode = result;
} catch (e) { console.error(e.stack); process.exitCode = 1; }
finally { clearInterval(beat); await browser?.close(); if (server) await new Promise(resolve => server.close(resolve)); await rm(temp, { recursive: true, force: true }); }
