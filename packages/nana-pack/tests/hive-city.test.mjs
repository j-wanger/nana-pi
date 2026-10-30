/**
 * @module packages/nana-pack/tests/hive-city.test.mjs
 * @purpose Pins the hand city, radial shape, drawn streets, request journey, lights and safe gestures.
 * @inputs Shared city modules, tracked plan, audit, controls and temporary publication folders.
 * @outputs Tagged PASS and FAIL lines.
 * @effects disk (OS temporary fixtures), process (bounded CLI children)
 * @errors Failed assertions set exit 1.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = async p => JSON.parse(await fs.readFile(path.join(root, p), 'utf8'));
const fixture = await read('docs/components/fixture.json');
let passed = 0;
async function test(title, fn) { let timer; try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case timeout')), 60000); })]); passed++; console.log('PASS', title); } catch (e) { console.log('FAIL', title, e.stack); process.exitCode = 1; } finally { clearTimeout(timer); } }
const run = args => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 30000 });
const audit = async () => (await (await import('../../../scripts/component-audit.mjs')).buildAudit({ root })).document;
const city = () => import('../../../apps/hive/city.mjs');
const plan = () => read('apps/hive/city.json');
const lum = color => color.r * 0.2126 + color.g * 0.7152 + color.b * 0.0722;
const meshes = object => { const result = []; object.traverse(o => { if (o.isMesh) result.push(o); }); return result; };
// req: R-3171
await test('R-3171: one city plan names drift both ways and refuses malformed sources before output', async () => {
  const { checkCityPlan } = await city(), p = await plan(), data = await audit();
  const { prepare } = await import('../../../apps/hive/runtime.mjs');
  assert.deepEqual(checkCityPlan(p, data.components), []);
  const placed = p.places.filter(n => n.component).map(n => n.component);
  assert.deepEqual([...placed].sort(), data.components.map(c => c.id).sort());
  for (const [change, expected] of [
    [q => q.places.push({ ...q.places[0], id: 'duplicate' }), 'duplicate placement'],
    [q => { q.places[0].district = 'wrong'; }, 'unknown district'],
    [q => { q.places[0].form = 'wrong'; }, 'unknown form'],
    [q => { q.journey[1].place = 'missing'; }, 'unknown place'],
    [q => q.journey[2].visits.push('missing'), 'unknown place'],
    [q => { q.journey[2].component = 'missing'; }, 'unknown component'],
    [q => { q.roads[0].to = 'missing'; }, 'unknown place'],
    [q => { q.residents[0].place = 'missing'; }, 'unknown place'],
    [q => q.journey.push({ ...q.journey[2], id: 'duplicate-visit' }), 'visited twice'],
    ...['x', 'coordinate', 'radius', 'count'].map(k => [q => { q.places[0][k] = 1; }, 'hand source']),
  ]) {
    const q = structuredClone(p); change(q); assert(checkCityPlan(q, data.components).some(s => s.includes(expected)), expected);
    const result = prepare(data, q); assert.equal(result.scene, null); assert.match(result.error, /^hive: /); assert.equal(result.error.split('\n').length, 1);
  }
  const absent = placed.filter(id => !fixture.components.some(c => c.id === id));
  const problems = checkCityPlan(p, fixture.components);
  assert.deepEqual(problems.filter(s => s.endsWith(': not in audit')).sort(), absent.map(id => `${id}: not in audit`).sort());
  assert.deepEqual(problems.filter(s => s.endsWith(': no place yet')), ['review-hall: no place yet']);
  assert.equal(problems.length, absent.length + 1);
  const prepared = prepare(fixture, p); assert.equal(prepared.error, null);
  for (const id of absent) { const lot = prepared.scene.chambers.find(c => c.component === id); assert.equal(lot.material.status, 'absent'); assert.equal(lot.note, 'Not in audit'); }
  const { CITY } = await import('../../../apps/hive/config.mjs');
  const vacant = prepared.scene.chambers.find(c => c.component === 'review-hall'); assert.equal(vacant.note, 'No place yet'); assert.equal(vacant.bearing, CITY.vacantBearing);
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'nana-city-'));
  try {
    const { buildHivePage } = await import('../../../scripts/hive-page.mjs'); const out = path.join(dir, 'site'); await buildHivePage(out);
    assert.deepEqual(await read('apps/hive/city.json'), JSON.parse(await fs.readFile(path.join(out, 'city.json')))); await assert.rejects(fs.access(path.join(out, 'graph.json')));
    for (const args of [['--graph', 'x'], ['--layout', 'x']]) { const target = path.join(dir, args[0].slice(2)); const r = run([path.join(root, 'scripts/hive-page.mjs'), '--out', target, ...args]); assert.equal(r.status, 2); assert.match(r.stderr, /^Usage: hive-page /); await assert.rejects(fs.access(target)); }
    for (const file of ['contract.json', 'fixture.json']) { const r = spawnSync('git', ['show', `57167e92:docs/components/${file}`], { cwd: root }); assert.equal(r.status, 0); assert.deepEqual(await fs.readFile(path.join(root, 'docs/components', file)), r.stdout); }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
// req: R-3172
await test('R-3172: radial city separates districts and rejects grid and ring controls', async () => {
  const { cityLayout, cityShapeProblems, roundPosition } = await city(); const { CITY } = await import('../../../apps/hive/config.mjs'); const p = await plan(), data = await audit();
  const m = cityLayout(data, p); assert.deepEqual(m, cityLayout(data, p)); assert.deepEqual(cityShapeProblems(m), []);
  const at = id => m.places.find(n => n.id === id), radius = n => Math.hypot(n.x, n.z);
  assert.deepEqual([at('tower').x, at('tower').z], [0, 0]);
  assert(Math.hypot(at('yard').x, at('yard').z) > at('tower').radius + at('yard').radius);
  for (const n of m.places) {
    assert(Math.max(Math.abs(n.x), Math.abs(n.z)) + n.radius <= CITY.worldHalfExtent, n.id);
    assert.equal(n.x, roundPosition(n.x)); assert.equal(n.z, roundPosition(n.z));
    if (n.district === 'park' && n.id !== 'land-gate') assert(radius(n) + n.radius < m.fenceRadius, n.id);
    if (['town', 'edge'].includes(n.district)) assert(radius(n) - n.radius > m.ringRadius, n.id);
    for (const b of m.places.filter(b => b.id > n.id && b.district !== 'sky' && n.district !== 'sky')) assert(Math.hypot(n.x - b.x, n.z - b.z) >= n.radius + b.radius + CITY.clearance - CITY.positionGrid * 2, `${n.id}/${b.id}`);
  }
  assert.equal(at('tower').district, 'park'); assert.equal(at('tower').z, 0); assert.equal(at('land-gate').z, -m.fenceRadius);
  assert(at('customs').z < -m.townOuterRadius); assert(at('freight').z < at('customs').z); assert(at('customers').z < at('freight').z);
  assert(Math.abs(at('billboard').bearing) <= CITY.northTolerance); assert.deepEqual(at('billboard').face, [0, -1]);
  assert(!at('signal'), 'signals are not buildings');
  const core = ['drafting', 'yard', 'bay-1', 'inspection', 'ladder'].map(at);
  assert(core.every(n => Math.hypot(n.x, n.z) > at('tower').radius + n.radius));
  assert(core.every((n, i) => !i || n.bearing < core[i - 1].bearing), 'halls ring the plaza in journey order');
  const q = structuredClone(p); q.places.push({ id: 'new-hall', name: 'New hall', district: 'park', bearing: 68, form: 'hall', component: null });
  assert(cityLayout(data, q).fenceRadius > m.fenceRadius);
  const t = structuredClone(p); t.places.push({ id: 'new-town', name: 'New town lot', district: 'town', bearing: 90, form: 'hall', component: null });
  assert(cityLayout(data, t).townOuterRadius > m.townOuterRadius);
  const controls = await read('packages/nana-pack/tests/fixtures/hive-city-controls.json'); assert.equal(controls.length, 4);
  for (const control of controls) {
    assert.deepEqual(Object.keys(control.positions).sort(), data.components.map(c => c.id).sort());
    const controlled = cityLayout(data, p, control.positions);
    assert(cityShapeProblems(controlled).some(s => s.includes(control.problem)), control.name);
  }
});
// req: R-3173
await test('R-3173: scene streets match pale narrow connected frontage and the single outbound gate', async () => {
  const { segmentDistance, visibleRoads } = await city(); const { layout } = await import('../../../apps/hive/layout.mjs'); const { CITY, STREETS } = await import('../../../apps/hive/config.mjs');
  const THREE = await import('../../../apps/hive/vendor/three.module.js'); const { buildHive } = await import('../../../apps/hive/assets/hive.mjs'); const { buildMaterials } = await import('../../../apps/hive/assets/materials.mjs');
  for (const data of [await audit(), fixture]) {
    const m = layout(data, await plan()), materials = buildMaterials(THREE), scene = buildHive(THREE, m, materials); scene.updateMatrixWorld(true);
    for (const lot of scene.children.filter(o => o.userData.place)) { const n = m.chambers.find(c => c.id === lot.userData.place); assert.deepEqual(lot.position.toArray(), [n.x, n.y, n.z]); }
    const ground = meshes(scene).find(o => o.userData.ground); assert(ground);
    const segments = meshes(scene).filter(o => o.userData.streetSegment);
    assert.deepEqual(segments.map(o => o.userData.streetSegment), m.roads.filter(r => r.class !== 'air').flatMap(r => r.path.slice(1).map((b, i) => ({ road: r.id, a: r.path[i], b }))));
    for (const o of meshes(scene).filter(o => o.userData.roadSurface)) { assert(lum(o.material.color) > lum(ground.material.color)); assert(![materials.ink, materials.status.gap].includes(o.material)); }
    const widths = m.chambers.map(c => c.radius * 2).sort((a, b) => a - b), median = widths[Math.floor(widths.length / 2)];
    for (const key of ['avenue', 'local']) assert(STREETS.widths[key] <= median * STREETS.widthCaps[key]);
    for (const o of meshes(scene).filter(o => o.userData.kerb)) assert(o.geometry.parameters.height <= STREETS.kerbHeight);
    for (const road of m.roads) {
      const object = scene.children.find(o => o.userData.road === road.id); assert(object);
      if (road.class === 'back') { const dashes = meshes(object).filter(o => o.userData.dash); assert(dashes.length > 1); assert(dashes.every(o => o.userData.length <= STREETS.dashLength + CITY.positionGrid)); }
      if (road.kind === 'forward') assert(!meshes(object).some(o => o.userData.dash));
      if (road.class === 'air') { assert(!visibleRoads(m.roads).includes(road)); assert(visibleRoads(m.roads, road.chapter).includes(road)); }
      for (const n of m.chambers.filter(n => n.district !== 'sky' && ![road.from, road.to].includes(n.id))) for (let i = 1; i < road.path.length && road.class !== 'air'; i++) assert(segmentDistance(n, road.path[i - 1], road.path[i]) >= n.radius - CITY.positionGrid * 2, `${road.id} enters ${n.id}`);
    }
    for (const n of m.chambers.filter(n => n.district !== 'sky')) {
      const candidates = m.roads.filter(r => r.class !== 'air' && (r.district === n.district || r.class === 'avenue'));
      assert(candidates.some(r => r.path.slice(1).some((b, i) => segmentDistance({ x: n.door[0], z: n.door[1] }, r.path[i], b) <= CITY.frontage + CITY.positionGrid)), n.id);
      const [x, z] = n.front; const length = Math.hypot(x - n.door[0], z - n.door[1]); const dot = ((x - n.door[0]) * n.face[0] + (z - n.door[1]) * n.face[1]) / length;
      assert(dot >= Math.cos(CITY.doorAngle), `${n.id}: door normal`);
    }
    // Union actual street vertices, including junctions, rather than road IDs.
    const graph = new Map(); const key = p => p.join(',');
    for (const r of m.roads.filter(r => r.class !== 'air')) for (let i = 1; i < r.path.length; i++) { const a = key(r.path[i - 1]), b = key(r.path[i]); if (!graph.has(a)) graph.set(a, new Set()); if (!graph.has(b)) graph.set(b, new Set()); graph.get(a).add(b); graph.get(b).add(a); }
    const seen = new Set(), queue = [graph.keys().next().value]; while (queue.length) { const a = queue.shift(); if (seen.has(a)) continue; seen.add(a); queue.push(...graph.get(a)); } assert.equal(seen.size, graph.size);
    const crossings = new Map();
    for (const r of m.roads.filter(r => r.class !== 'air')) for (let i = 1; i < r.path.length; i++) {
      const a = r.path[i - 1], b = r.path[i], ra = Math.hypot(...a), rb = Math.hypot(...b);
      if ((ra < m.fenceRadius && rb > m.fenceRadius) || (ra > m.fenceRadius && rb < m.fenceRadius)) {
        const name = (a[1] + b[1]) > 0 ? 'entry' : 'land-gate'; crossings.set(`${a}/${b}`, name); if (r.kind === 'back') assert.equal(name, 'entry');
      }
    }
    assert.deepEqual([...crossings.values()].sort(), ['entry', 'land-gate']);
    for (const handoff of m.handoffs.filter(r => r.kind !== 'air')) for (let i = 1; i < handoff.path.length; i++) {
      const a = [handoff.path[i - 1][0], handoff.path[i - 1][2]], b = [handoff.path[i][0], handoff.path[i][2]];
      if (a.join() === b.join()) continue;
      assert(m.roads.some(r => r.class !== 'air' && r.path.slice(1).some((end, j) => [r.path[j].join(), end.join()].sort().join('/') === [a.join(), b.join()].sort().join('/'))), `${handoff.from}/${handoff.to}: drawn handoff`);
    }
    const forward = m.handoffs.filter(r => r.kind === 'forward'); let paths = 0;
    const walk = (id, visited) => { if (id === 'customers') { paths++; assert(visited.indexOf('land-gate') > 0); assert(visited.indexOf('customs') > visited.indexOf('land-gate')); return; } for (const r of forward.filter(r => r.from === id)) if (!visited.includes(r.to)) walk(r.to, [...visited, r.to]); };
    walk('drafting', ['drafting']); assert(paths > 0);
  }
});
// req: R-3174
await test('R-3174: request journey frames fourteen narrated chapters', async () => {
  const { tour, tourPose, chapterProgress } = await import('../../../apps/hive/tour.mjs'); const { layout } = await import('../../../apps/hive/layout.mjs');
  const { CITY } = await import('../../../apps/hive/config.mjs'); const { VIEWPORT_WIDTHS, VIEWPORT_HEIGHT } = await import('../../../scripts/first-look-config.mjs'); const THREE = await import('../../../apps/hive/vendor/three.module.js');
  const p = await plan(), data = await audit(), m = layout(data, p), chapters = tour(m, p);
  assert.deepEqual(chapters.filter(c => !c.visit).map(c => c.id), ['overview', 'signal', 'compass', 'drafting-table', 'queue', 'workshop', 'eyes', 'review-ladder', 'land-gate', 'identity-scan', 'release-route', 'customers', 'library', 'closing']);
  assert.equal(chapters.length, 14);
  for (const [i, ch] of chapters.entries()) { assert.equal(ch.name, p.journey[i].title); assert.equal(ch.text, p.journey[i].text); assert(ch.text.length > 20); }
  const { textLayer: narration } = await import('../../../apps/hive/text-layer.mjs');
  for (const ch of chapters) { const card = narration(data, `#${ch.id}`, 'webgl', 'plain', chapters).cards.find(c => c.id === ch.id); assert.equal(card.voices.plain, ch.text); }
  const { textLayer } = await import('../../../apps/hive/text-layer.mjs'); const text = textLayer(data, '#workshop', 'webgl', 'plain', chapters);
  assert.deepEqual(text.rail.map(r => r.href), chapters.map(c => `#${c.id}`)); for (const [i, r] of text.rail.entries()) assert(r.chapter.startsWith(`${chapters[i].number} ${chapters[i].name.toUpperCase()}`));
  const source = await fs.readFile(path.join(root, 'apps/hive/main.mjs'), 'utf8'); assert.match(source, /stageAtScroll/);
  for (const width of VIEWPORT_WIDTHS) for (const [i, c] of chapters.entries()) {
    const aspect = width / VIEWPORT_HEIGHT, pose = tourPose(chapters, i, aspect); assert.equal(chapterProgress(chapters, `#${c.id}`), i);
    const cam = new THREE.PerspectiveCamera(pose.fov, aspect, 0.1, 10000); cam.position.set(...pose.position); cam.lookAt(...pose.target); cam.updateMatrixWorld();
    for (const id of [c.place, ...(c.visit ? [chapters.find(s => s.id === c.step).place] : [])].filter(Boolean)) {
      const bounds = m.chambers.find(n => n.id === id).bounds;
      for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]]) for (const z of [bounds.min[2], bounds.max[2]]) { const v = new THREE.Vector3(x, y, z).project(cam); assert(Math.abs(v.x) < 1 && Math.abs(v.y) < 1, `${c.id}/${width}`); }
    }
    if (i) for (const t of [0.25, 0.5, 0.75]) {
      const mid = tourPose(chapters, i - 1 + t, aspect);
      assert.deepEqual(tourPose(chapters, i - 1 + t, aspect, true), mid);
      assert(mid.position.every(Number.isFinite));
      const before = tourPose(chapters, i - 1 + t - CITY.positionGrid, aspect);
      assert(Math.hypot(...mid.target.map((v, j) => v - before.target[j])) < 1);
    }
  }
});
// req: R-3174
await test('R-3174: scroll position maps to continuous stage without short-input dead zones', async () => {
  const { stageAtScroll } = await import('../../../apps/hive/tour.mjs');
  assert.equal(typeof stageAtScroll, 'function');
  assert.equal(stageAtScroll(-100, 1000, 14), 0);
  assert.equal(stageAtScroll(15000, 1000, 14), 13);
  assert.equal(stageAtScroll(1, 1000, 14), 0.001);
  const stages = Array.from({ length: 40 }, (_, i) => stageAtScroll((i + 1) * 100, 1000, 14));
  stages.forEach((s, i) => { assert.equal(s, (i + 1) / 10); assert(s > (stages[i - 1] ?? 0)); });
  assert(stages.at(-1) >= 3);
  for (let i = 0; i < 5; i++) assert(stageAtScroll((i + 1) * 60, 1000, 14) > stageAtScroll(i * 60, 1000, 14));
  const { blendPose } = await import('../../../apps/hive/camera.mjs');
  const a = { target: [0, 0, 0], position: [0, 0, 10], fov: 40 }, b = { ...a, position: [0, 0, 40] };
  assert(Math.abs(blendPose(a, b, 0.5).position[2] - 20) < 1e-8, 'distance blends logarithmically');
  const distant = { ...a, target: [100, 0, 0], position: [100, 0, 10] }, mid = blendPose(a, distant, 0.5);
  assert.deepEqual(mid.target, [50, 0, 0]);
  assert(Math.hypot(...mid.position.map((v, i) => v - mid.target[i])) > 90, 'distant target move pulls back at midpoint');
});
// req: R-3174
await test('R-3174: motion clocks pin idle and distance-scaled flight limits', async () => {
  const { MOTION } = await import('../../../apps/hive/config.mjs');
  assert.deepEqual(MOTION, { idleMs: 400, flightMinMs: 1600, flightMaxMs: 4200, openingMs: 4000 });
});
// req: R-3172
await test('R-3172: dense town scale retains chosen lot and housing dimensions', async () => {
  const { DENSITY } = await import('../../../apps/hive/config.mjs');
  assert.deepEqual(DENSITY, { footprint: 0.82, houseStep: 12, houseWidth: 8, houseDepth: 7, houseHeight: 5, heightVariation: 4 });
});
// req: R-3177
await test('R-3177: window lights follow audit status and dark target forms stay complete', async () => {
  const { layout } = await import('../../../apps/hive/layout.mjs'); const { LIGHTS } = await import('../../../apps/hive/config.mjs'); const THREE = await import('../../../apps/hive/vendor/three.module.js');
  const { buildMaterials } = await import('../../../apps/hive/assets/materials.mjs'), { buildHive } = await import('../../../apps/hive/assets/hive.mjs'), { buildDistrict } = await import('../../../apps/hive/assets/district.mjs');
  const materials = buildMaterials(THREE); assert(lum(materials.windows.lit.color) - lum(materials.windows.dark.color) >= LIGHTS.minimumGap); assert(lum(materials.windows.half.color) > lum(materials.windows.dark.color) && lum(materials.windows.half.color) < lum(materials.windows.lit.color));
  for (const data of [await audit(), fixture]) {
    const m = layout(data, await plan()), scene = buildHive(THREE, m, materials);
    for (const n of m.chambers) {
      const object = scene.children.find(o => o.userData.place === n.id), windows = meshes(object).filter(o => o.userData.window); assert(windows.length > 0, n.id);
      const expected = n.material.status === 'sound' ? windows.length : ['partial', 'gap'].includes(n.material.status) ? Math.round(windows.length * LIGHTS.halfFraction) : 0;
      assert.equal(windows.filter(o => o.material !== materials.windows.dark).length, expected, n.id);
      const lit = buildDistrict(THREE, { ...n, material: { ...n.material, status: 'sound' } }, materials), dark = buildDistrict(THREE, { ...n, material: { ...n.material, status: 'absent' } }, materials);
      const a = meshes(lit), b = meshes(dark); assert.equal(a.length, b.length); a.forEach((o, i) => { assert.equal(o.geometry.type, b[i].geometry.type); assert.deepEqual(o.geometry.parameters, b[i].geometry.parameters); if (!o.userData.window) { assert.equal(o.material.color.getHex(), b[i].material.color.getHex()); assert.equal(o.material.side, b[i].material.side); } });
    }
    for (const id of ['bay-3', 'bay-4', 'neighbour', 'feedback']) assert.equal(m.chambers.find(n => n.id === id).material.status, 'absent');
    if (data !== fixture) { for (const id of ['night-depot', 'vault']) assert.equal(m.chambers.find(n => n.id === id).material.status, 'absent'); for (const id of ['theater', 'control', 'test-lab', 'stage']) assert(['partial', 'gap'].includes(m.chambers.find(n => n.id === id).material.status)); }
  }
  const { textLayer } = await import('../../../apps/hive/text-layer.mjs'); const legend = textLayer(fixture, '#', 'webgl').landing.legend; assert.match(legend, /lit.*half-lit.*dark/i); assert.equal(legend.split('.').filter(Boolean).length, 1);
});
// req: R-3175
await test('R-3175: real gesture binding never enters or changes hash on phone taps swipes or pinches', async () => {
  const { explore, bindGestures } = await import('../../../apps/hive/explore.mjs'); const { NAVIGATION } = await import('../../../apps/hive/config.mjs');
  assert.deepEqual(NAVIGATION, { tapTolerance: 10, doubleTapMs: 350, sectionHeight: 100, roadWidths: { loop: 3.6, spur: 0.8, artifact: 0.12, import: 0.08, feature: 0.06 }, overviewClasses: ['loop', 'spur'] });
  const { textLayer } = await import('../../../apps/hive/text-layer.mjs');
  const landing = textLayer(fixture, '#', 'webgl', 'plain', null, 'explore');
  assert.equal(landing.active, null); assert.match(landing.landing.text, /Tap a building/); assert.deepEqual(landing.landing.actions, ['tour']);
  const target = new EventTarget(), effects = []; let state = { mode: 'tour', selected: null, zoom: 1 };
  const reduce = event => { const result = explore(state, event); state = result.state; return result.effects; };
  const unbind = bindGestures(target, reduce, effect => effects.push(effect), () => 'workshop');
  let now = 1000;
  const send = (type, pointerId, x, y) => { const e = new Event(type); Object.assign(e, { pointerId, clientX: x, clientY: y, now }); now += 10; target.dispatchEvent(e); };
  const tap = drift => { send('pointerdown', 1, 100, 100); send('pointermove', 1, 100, 100 + drift); send('pointerup', 1, 100, 100 + drift); };
  tap(0); tap(40); assert.deepEqual(effects, []);
  state.mode = 'explore'; tap(8); assert.deepEqual(effects, [{ type: 'select', id: 'workshop' }]); effects.length = 0;
  now += 500; tap(40); assert(effects.length > 0 && effects.every(e => e.type === 'orbit')); effects.length = 0;
  now += 500; send('pointerdown', 1, 100, 100); send('pointerdown', 2, 200, 100); send('pointermove', 2, 5000, 100); send('pointerup', 2, 5000, 100); send('pointerup', 1, 100, 100); assert(effects.every(e => e.type === 'zoom')); assert(state.zoom >= 0.6 && state.zoom <= 2.5);
  effects.length = 0; now += 500; tap(0); tap(0); assert.equal(effects.filter(e => e.type === 'select').length, 1); assert(effects.every(e => e.type === 'select'));
  const entered = reduce({ type: 'enter', id: 'workshop' }); assert.deepEqual(entered, [{ type: 'hash', value: '#enter/workshop' }]); assert.deepEqual(reduce({ type: 'back' }), [{ type: 'hash', value: '#explore' }]); assert.deepEqual(reduce({ type: 'tour' }), [{ type: 'hash', value: '#workshop' }]);
  unbind(); const main = await fs.readFile(path.join(root, 'apps/hive/main.mjs'), 'utf8'); assert(!/canvas\.addEventListener\(['"]pointer/.test(main)); assert.equal((main.match(/location\.hash\s*=/g) ?? []).length, 0); assert.match(main, /history\.pushState/);
});
if (!process.exitCode) console.log(`${passed} hive city checks passed`);
