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
    [q => { q.places[0].part = 'missing'; }, 'unknown part'],
    [q => { q.roads[0].built = 'yes'; }, 'road: built must be true or false'],
    [q => { q.journey[0].flows = ['x>y']; }, 'unknown flow'],
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
  assert(m.houses.length >= 20);
  assert.deepEqual([...new Set(m.houses.map(h => h.type))].sort(), ['pitched', 'terrace', 'two-storey', 'row-three', 'yard'].sort());
  for (const h of m.houses) {
    const road = m.roads.find(r => r.id === h.street); assert(road.id.startsWith('local/'));
    assert(Math.abs(Math.hypot(...h.face) - 1) < 1e-8);
    assert(h.height >= 4 && h.height <= 5.2);
    const nearest = road.path.reduce((a, p) => Math.hypot(p[0] - h.x, p[1] - h.z) < Math.hypot(a[0] - h.x, a[1] - h.z) ? p : a);
    assert((nearest[0] - h.x) * h.face[0] + (nearest[1] - h.z) * h.face[1] > 0);
  }
  for (const hex of [false, true]) {
    const houses = Array.from({ length: 25 }, (_, i) => ({ x: i % 5 * 12 + (hex && Math.floor(i / 5) % 2 ? 6 : 0), z: Math.floor(i / 5) * (hex ? 12 * Math.sqrt(3) / 2 : 12) }));
    assert(cityShapeProblems({ ...m, houses }).some(s => s.includes('lattice')), 'house lattice control');
  }
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
      if (road.class !== 'air') { assert(!meshes(object).some(o => o.userData.dash)); const decks = meshes(object).filter(o => o.userData.roadSurface); assert(decks.every(o => o.castShadow && o.material.isMeshStandardMaterial)); assert(object.children.some(o => o.isLineSegments)); }
      if (road.id.startsWith('ring-')) assert(meshes(object).some(o => o.userData.pier));
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
    const { RETURNS } = await import('../../../apps/hive/config.mjs');
    assert.equal(RETURNS.widthFraction, 0.3);
    assert.deepEqual([RETURNS.dimFraction, RETURNS.builtOffset, RETURNS.unbuiltOffset, RETURNS.height, RETURNS.thickness], [0.25, -0.2, 0.2, 0.06, 0.04]);
    const { animateHive } = await import('../../../apps/hive/assets/hive.mjs'); animateHive(scene, 1, false);
    const ribbons = scene.children.filter(o => o.userData.returnRibbon);
    assert.equal(ribbons.length, m.handoffs.filter(r => r.kind !== 'forward').length);
    const shared = new Map();
    for (const object of ribbons) {
      const meta = object.userData.returnRibbon, handoff = m.handoffs.find(r => `${r.from}>${r.to}` === meta.flow);
      assert(object.visible, meta.flow); assert(meta.width >= RETURNS.widthFraction * STREETS.laneWidth);
      assert.deepEqual(meta.path, handoff.path);
      assert.equal(meta.offset, handoff.built ? RETURNS.builtOffset : RETURNS.unbuiltOffset);
      const pieces = meshes(object); assert(pieces.length > 0, meta.flow);
      assert(pieces.every(o => o.material.color.equals((handoff.built ? materials.windows.lit : materials.windows.dark).color)), meta.flow);
      for (let i = 1; i < handoff.path.length; i++) {
        const a = handoff.path[i - 1], b = handoff.path[i]; if (a.join() === b.join()) continue;
        const drawn = m.roads.some(r => (handoff.kind === 'air' ? r.class === 'air' : r.class !== 'air') && r.path.slice(1).some((p, j) => [r.path[j].join(), p.join()].sort().join('/') === [[a[0], a[2]].join(), [b[0], b[2]].join()].sort().join('/')));
        assert(drawn, `${meta.flow}: ribbon leaves drawn street`);
        const key = [a.join(), b.join()].sort().join('/'), occupants = shared.get(key) ?? [];
        assert(!occupants.some(v => v.built !== handoff.built && v.offset === meta.offset), `${meta.flow}: coincident built and unbuilt`);
        occupants.push({ built: handoff.built, offset: meta.offset }); shared.set(key, occupants);
      }
      assert(pieces.every(o => o.userData.returnPiece?.dashed === !handoff.built));
      if (!handoff.built) assert(pieces.every(o => o.geometry.parameters.depth <= STREETS.dashLength + 1e-6));
      else assert.equal(pieces.length, handoff.path.slice(1).filter((p, i) => p.join() !== handoff.path[i].join()).length);
    }
    const baseline = layout(data, { ...(await plan()), roads: (await plan()).roads.filter(r => r.kind === 'forward') });
    const avenues = model => model.roads.filter(r => r.class === 'avenue').flatMap(r => r.path.slice(1).map((b, i) => [r.path[i].join(), b.join()].sort().join('/'))).sort();
    assert.deepEqual(avenues(m), avenues(baseline), 'returns add no avenues');
    const forward = m.handoffs.filter(r => r.kind === 'forward'); let paths = 0;
    const walk = (id, visited) => { if (id === 'customers') { paths++; assert(visited.indexOf('land-gate') > 0); assert(visited.indexOf('customs') > visited.indexOf('land-gate')); return; } for (const r of forward.filter(r => r.from === id)) if (!visited.includes(r.to)) walk(r.to, [...visited, r.to]); };
    walk('drafting', ['drafting']); assert(paths > 0);
  }
});
// req: R-3174
await test('R-3174: request journey frames fourteen narrated chapters', async () => {
  const { tour, tourPose, chapterProgress } = await import('../../../apps/hive/tour.mjs'); const { layout } = await import('../../../apps/hive/layout.mjs');
  const { CITY, NARRATION, RETURNS } = await import('../../../apps/hive/config.mjs'); const { VIEWPORT_HEIGHT } = await import('../../../scripts/first-look-config.mjs');
  assert.deepEqual([NARRATION.chapterWords, NARRATION.sentenceWords], [40, 24]);
  assert.equal(NARRATION.unbuiltLegend, 'Dark dashed roads are returns not built yet.');
  assert.deepEqual([NARRATION.phoneFrameFraction, NARRATION.desktopFrameFraction], [0.28, 0.65]); const THREE = await import('../../../apps/hive/vendor/three.module.js');
  const p = await plan(), data = await audit(), m = layout(data, p), chapters = tour(m, p);
  assert.deepEqual(chapters.filter(c => !c.visit).map(c => c.id), ['overview', 'signal', 'compass', 'drafting-table', 'queue', 'workshop', 'eyes', 'review-ladder', 'land-gate', 'identity-scan', 'release-route', 'customers', 'library', 'closing']);
  assert.equal(chapters.length, 14);
  for (const [i, ch] of chapters.entries()) { assert.equal(ch.name, p.journey[i].title); assert.equal(ch.text, p.journey[i].text); assert(ch.text.length > 20); }
  const { textLayer: narration } = await import('../../../apps/hive/text-layer.mjs');
  for (const ch of chapters) { const card = narration(data, `#${ch.id}`, 'webgl', 'plain', chapters).cards.find(c => c.id === ch.id); assert.equal(card.voices.plain, ch.text); }
  const { textLayer } = await import('../../../apps/hive/text-layer.mjs'); const text = textLayer(data, '#workshop', 'webgl', 'plain', chapters);
  assert.deepEqual(text.rail.map(r => r.href), chapters.map(c => `#${c.id}`)); for (const [i, r] of text.rail.entries()) assert(r.chapter.startsWith(`${chapters[i].number} ${chapters[i].name.toUpperCase()}`));
  const source = await fs.readFile(path.join(root, 'apps/hive/main.mjs'), 'utf8'); assert.match(source, /stageAtScroll/);
  const { buildHive, emphasizeReturns } = await import('../../../apps/hive/assets/hive.mjs'), { buildMaterials } = await import('../../../apps/hive/assets/materials.mjs'), { batchStatic } = await import('../../../apps/hive/assets/parts.mjs');
  const scene = batchStatic(THREE, buildHive(THREE, m, buildMaterials(THREE)), m);
  for (const c of chapters) {
    assert(c.text.trim().split(/\s+/).length <= NARRATION.chapterWords, c.id);
    for (const sentence of c.text.split(/[.!?]+/).filter(s => s.trim())) assert(sentence.trim().split(/\s+/).length <= NARRATION.sentenceWords, c.id);
    emphasizeReturns(scene, c.flows);
    for (const o of scene.children.filter(o => o.userData.returnRibbon)) for (const mesh of meshes(o)) assert.equal(mesh.material.opacity, c.flows.includes(o.userData.returnRibbon.flow) ? 1 : RETURNS.dimFraction);
  }
  for (const width of [1280, 390]) for (const [i, c] of chapters.entries()) {
    const aspect = width / VIEWPORT_HEIGHT, pose = tourPose(chapters, i, aspect); assert.equal(chapterProgress(chapters, `#${c.id}`), i);
    const cam = new THREE.PerspectiveCamera(pose.fov, aspect, 0.1, 10000); cam.position.set(...pose.position); cam.lookAt(...pose.target); cam.updateMatrixWorld();
    const { viewCentreOffset } = await import('../../../apps/hive/camera.mjs');
    const top = width === 390 ? 170 : 100, bottom = width === 390 ? 448 : 160;
    cam.setViewOffset(width, VIEWPORT_HEIGHT, 0, viewCentreOffset(VIEWPORT_HEIGHT, top, bottom), width, VIEWPORT_HEIGHT); cam.updateMatrixWorld();
    for (const id of [...new Set([c.place, ...c.visits, ...c.flows.flatMap(f => f.split('>'))].filter(Boolean))]) {
      const bounds = m.chambers.find(n => n.id === id).bounds;
      for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]]) for (const z of [bounds.min[2], bounds.max[2]]) { const v = new THREE.Vector3(x, y, z).project(cam); assert(Math.abs(v.x) < 1 && (1 - v.y) / 2 * VIEWPORT_HEIGHT > top && (1 - v.y) / 2 * VIEWPORT_HEIGHT < VIEWPORT_HEIGHT - bottom, `${c.id}/${id}/${width}`); }
    }
    if (i) for (const t of [0.25, 0.5, 0.75]) {
      const mid = tourPose(chapters, i - 1 + t, aspect);
      assert.deepEqual(tourPose(chapters, i - 1 + t, aspect, true), mid);
      assert(mid.position.every(Number.isFinite));
      const before = tourPose(chapters, i - 1 + t - CITY.positionGrid, aspect);
      const distance = Math.hypot(...tourPose(chapters, i, aspect).target.map((v, j) => v - tourPose(chapters, i - 1, aspect).target[j]));
      // Smoothstep's derivative is at most 1.5; the front-load warp at most 1 + bias.
      const { TOUR_SCROLL } = await import('../../../apps/hive/config.mjs');
      assert(Math.hypot(...mid.target.map((v, j) => v - before.target[j])) <= distance * 1.5 * (1 + TOUR_SCROLL.cameraTravelBias) / TOUR_SCROLL.cameraTravelFraction * CITY.positionGrid + 1e-7);
    }
  }
});
// req: R-3174
await test('R-3174: scroll position maps to continuous stage without short-input dead zones', async () => {
  const { stageAtScroll, chapterSpans, scrollAtStage, cardBlend, tour, tourPose } = await import('../../../apps/hive/tour.mjs');
  const { layout } = await import('../../../apps/hive/layout.mjs');
  const chapters = tour(layout(await audit(), await plan()), await plan()), spans = chapterSpans(chapters, 1280 / 900);
  assert.equal(spans.length, 14); assert(spans.at(-1).end >= 14 && spans.at(-1).end <= 21);
  const { TOUR_SCROLL } = await import('../../../apps/hive/config.mjs');
  for (const [i, span] of spans.entries()) {
    const a = tourPose(chapters, i, 1280 / 900), b = tourPose(chapters, Math.min(i + 1, chapters.length - 1), 1280 / 900);
    const travel = Math.hypot(...a.target.map((v, j) => b.target[j] - v)) + Math.hypot(...a.position.map((v, j) => b.position[j] - v));
    assert(Math.abs(span.end - span.start - TOUR_SCROLL.readingScreens - Math.min(TOUR_SCROLL.travelCap, travel / TOUR_SCROLL.travelScale)) < 1e-8);
  }
  for (let i = 0; i < 14; i++) { const y = scrollAtStage(i, 900, spans); assert(Math.abs(stageAtScroll(y, 900, spans) - i) < 1e-8); }
  let previous = -1;
  for (let y = 0; y <= 7200; y += 10) { const s = stageAtScroll(y, 900, spans); assert(s >= previous); previous = s; }
  assert.equal(cardBlend(2.84, 14).mix, 0);
  assert(Math.abs(cardBlend(2.925, 14).mix - 0.5) < 1e-8);
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
await test('R-3174: eased scroll settles within half a second then holds for two seconds', async () => {
  const config = await import('../../../apps/hive/config.mjs');
  assert.deepEqual(config.TOUR_SCROLL, { readingScreens: 1, travelCap: 0.5, travelScale: 100, crossFade: 0.15, holdCheckMs: 2000, slidePx: 12, opacityThreshold: 0.05, followSeconds: 0.15, settleSeconds: 0.5, fadeBuckets: 32, cameraStepBound: 0.12, cameraTravelFraction: 0.5, cameraTravelBias: 0.3 });
  const { followStage } = await import('../../../apps/hive/tour.mjs');
  for (const hz of [30, 60, 120]) for (const target of [0, 3.8, 13]) {
    let state = { stage: 2, velocity: 0, target: 2, quiet: 0 };
    for (let i = 0; i < hz / 2 + 1; i++) {
      const before = state.stage; state = followStage(state, target, 1 / hz);
      assert(state.stage >= Math.min(before, target) && state.stage <= Math.max(before, target), 'never overshoots or reverses away from the page');
      if (!i && target !== 2) assert.notEqual(state.stage, target, 'short input eases rather than jumping');
    }
    assert.equal(state.stage, target);
    const settled = structuredClone(state);
    for (let i = 0; i < hz * config.TOUR_SCROLL.holdCheckMs / 1000; i++) state = followStage(state, target, 1 / hz);
    assert.equal(state.stage, settled.stage); assert.equal(state.velocity, 0);
    state = followStage(state, 1, 1 / hz); const reversed = state.stage;
    state = followStage(state, 9, 1 / hz); assert(state.stage >= Math.min(reversed, 9) && state.stage <= Math.max(reversed, 9), 'new direction discards opposing momentum');
  }
  assert.equal(config.MOTION, undefined);
  const { tour, tourPose } = await import('../../../apps/hive/tour.mjs'), { layout } = await import('../../../apps/hive/layout.mjs');
  const chapters = tour(layout(await audit(), await plan()), await plan()), progress = 3.43, pose = tourPose(chapters, progress, 1.4);
  const source = await fs.readFile(path.join(root, 'apps/hive/main.mjs'), 'utf8');
  const handler = source.slice(source.indexOf('  const scrollProgress ='), source.indexOf('  const readHash ='));
  assert(!/reading\(|frame\(|setPose\(|getBoundingClientRect|offsetTop/.test(handler));
  assert.match(source, /followStage/); assert.match(source, /fadeBuckets/);
  const draw = source.slice(source.indexOf('  const draw = () => {'), source.indexOf('  // Readiness'));
  for (const now of [100, 100 + config.TOUR_SCROLL.holdCheckMs]) {
    const env = { performance: { now: () => now }, flight: null, mode: 'tour', settled: false, lastInput: 0, MOTION: { idleMs: 400 }, opening: null, initialized: true, progress, targetStage: progress, chapterIndex: 3, chapters, aspect: () => 1.4, tourPose, blendPose: (await import('../../../apps/hive/camera.mjs')).blendPose, desired: structuredClone(pose), current: structuredClone(pose), setPose: p => { env.desired = p; }, introduction: {}, root: { dataset: {} }, animationStep: () => ({ beePhase: now / 1000 }), still: false, preference: { matches: false }, renderer: null, drawPixel: () => {}, ctx: null, raster: {}, labelNodes: [], entered: null };
    // Run the actual frame body with an injected clock and pixel draw boundary, not a second scroll implementation.
    const result = new Function('env', `with(env) { ${draw}; draw(); return { pose: desired, stage: progress }; }`)(env);
    assert.deepEqual(result, { pose, stage: progress });
  }
});
// req: R-3172
await test('R-3172: dense town scale retains chosen lot and housing dimensions', async () => {
  const { DENSITY } = await import('../../../apps/hive/config.mjs');
  assert.deepEqual(DENSITY, { build11Houses: 30, footprint: 0.82, houseStep: 11, houseWidth: 6, houseDepth: 5, houseHeight: 4, heightVariation: 1.2, blockGap: 7, setback: 4, types: ['pitched', 'terrace', 'two-storey', 'row-three', 'yard'] });
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
      const strips = meshes(object).filter(o => o.userData.roofLight); assert.equal(strips.length, 1);
      assert.equal(strips[0].material, expected ? n.material.status === 'sound' ? materials.windows.lit : materials.windows.half : materials.windows.dark);
      assert(strips[0].scale.x >= n.radius * 0.9 && strips[0].scale.z >= n.radius * 0.25);
      const a = meshes(lit), b = meshes(dark); assert.equal(a.length, b.length); a.forEach((o, i) => { assert.equal(o.geometry.type, b[i].geometry.type); assert.deepEqual(o.geometry.parameters, b[i].geometry.parameters); if (!o.userData.window && !o.userData.roofLight && !o.userData.beacon) { assert.equal(o.material.color.getHex(), b[i].material.color.getHex()); assert.equal(o.material.side, b[i].material.side); } });
    }
    for (const id of ['bay-3', 'bay-4', 'neighbour', 'feedback']) assert.equal(m.chambers.find(n => n.id === id).material.status, 'absent');
    if (data !== fixture) { for (const id of ['night-depot', 'vault']) assert.equal(m.chambers.find(n => n.id === id).material.status, 'absent'); for (const id of ['theater', 'control', 'test-lab', 'stage']) assert(['partial', 'gap'].includes(m.chambers.find(n => n.id === id).material.status)); }
  }
  const { textLayer } = await import('../../../apps/hive/text-layer.mjs'), { tour } = await import('../../../apps/hive/tour.mjs');
  for (const data of [await audit(), fixture]) {
    const p = await plan(), m = layout(data, p), chapters = tour(m, p);
    for (const n of m.chambers.filter(n => n.part)) {
      const parent = data.components.find(c => c.id === n.part);
      const capped = p.roads.some(r => r.from === n.id && r.built === false);
      assert.equal(n.material.status, !parent ? 'absent' : capped && parent.status === 'sound' ? 'partial' : parent.status, n.id);
      const cards = textLayer(data, '#', 'webgl', 'work', chapters, 'explore').cards;
      const card = cards.find(c => c.id === n.id); assert(card, n.id);
      assert(!/absent|No gap recorded/.test(card.voices.technical + card.voices.work), n.id);
      for (const road of p.roads.filter(r => r.from === n.id && r.built === false)) assert(card.voices.work.includes(`Not built yet: ${road.from} → ${road.to}`));
    }
    for (const ch of chapters) {
      const card = textLayer(data, `#${ch.id}`, 'webgl', 'work', chapters).cards.find(c => c.id === ch.id);
      for (const flow of ch.flows) { const r = p.roads.find(r => `${r.from}>${r.to}` === flow); if (!r.built) assert(card.voices.work.includes(`Not built yet: ${r.from} → ${r.to}`), ch.id); }
    }
  }
  for (const mode of ['tour', 'explore']) { const legend = textLayer(fixture, '#', 'webgl', 'plain', null, mode).landing.legend; assert.match(legend, /lit.*half-lit.*dark/i); assert.equal(legend.split('.').filter(Boolean).length, 2); assert(legend.includes('Dark dashed roads are returns not built yet.')); }
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
// req: R-3174
await test('R-3174: card boundary never overlaps readable text and slides upward', async () => {
  const { cardBlend } = await import('../../../apps/hive/tour.mjs');
  for (let s = 0; s < 14; s += 0.001) {
    const b = cardBlend(s, 14);
    assert([b.outOpacity, b.inOpacity].filter(o => o > 0.05).length <= 1, `overlap at ${s}`);
    assert(b.outOpacity >= 0 && b.inOpacity >= 0);
  }
  const before = cardBlend(2.85, 14), middle = cardBlend(2.925, 14), after = cardBlend(2.9999, 14);
  assert(Math.abs(before.outOpacity - 1) < 1e-8); assert.equal(before.inOpacity, 0);
  assert(middle.outOpacity < 1e-8 && middle.inOpacity < 1e-8);
  assert(after.inOpacity > 0.99); assert(after.outY < before.outY); assert(after.inY < middle.inY);
});
// req: R-3174
await test('R-3174: every chapter keeps a reading screen at desktop and phone widths', async () => {
  const { chapterSpans, tour } = await import('../../../apps/hive/tour.mjs'), { layout } = await import('../../../apps/hive/layout.mjs');
  const chapters = tour(layout(await audit(), await plan()), await plan());
  for (const width of [1280, 390]) for (const span of chapterSpans(chapters, width / 900)) {
    assert(span.end - span.start >= 0.8); assert(span.end - span.start <= 1.50000001);
  }
});
// req: R-3174
await test('R-3174: opening is a scroll-driven flat plan ending at the tower', async () => {
  const { openingState, tour, tourPose } = await import('../../../apps/hive/tour.mjs'), { layout } = await import('../../../apps/hive/layout.mjs');
  const chapters = tour(layout(await audit(), await plan()), await plan());
  const a = openingState(chapters, 0, 1.4), b = openingState(chapters, 0.5, 1.4), c = openingState(chapters, 1, 1.4);
  assert.equal(a.planOpacity, 1); assert.equal(a.cityScale, 0); assert.equal(b.cityScale, 0.5);
  assert.equal(c.planOpacity, 0); assert.equal(c.cityScale, 1); assert.deepEqual(c.pose, tourPose(chapters, 1, 1.4));
  assert.deepEqual(openingState(chapters, 0, 1.4, true).pose, tourPose(chapters, 0, 1.4));
  assert.notDeepEqual(a.pose, b.pose); assert.deepEqual(b, openingState(chapters, 0.5, 1.4));
  const source = await fs.readFile(path.join(root, 'apps/hive/main.mjs'), 'utf8');
  assert.match(source, /drawPlan/); assert.match(source, /openingState/); assert.match(source, /Scroll to enter/);
  const { pixel } = await import('../../../apps/hive/pixel.mjs');
  const list = pixel(layout(await audit(), await plan()));
  assert(list.plan.streets.some(s => s.width > list.plan.streets.find(s => s.class === 'local' && !s.id.startsWith('ring-')).width));
  assert(list.plan.lots.length > chapters.length, 'includes simple house footprints, not only lot bounds');
  assert(list.plan.lots.every(points => points.length >= 4));
});
// req: R-3174
await test('R-3174: phone chapter targets project above the card and below the header', async () => {
  const { viewCentreOffset } = await import('../../../apps/hive/camera.mjs'), { tour, tourPose } = await import('../../../apps/hive/tour.mjs'), { layout } = await import('../../../apps/hive/layout.mjs');
  const THREE = await import('../../../apps/hive/vendor/three.module.js');
  const chapters = tour(layout(await audit(), await plan()), await plan()), width = 390, height = 900, header = 170;
  for (const cardHeight of [180, 360]) for (let i = 0; i < chapters.length; i++) for (const fraction of [0, 0.5]) {
    const pose = tourPose(chapters, i + fraction, width / height), anchor = tourPose(chapters, i, width / height), bottom = cardHeight + 88;
    assert.deepEqual(pose.target, anchor.target, 'the reading half of the span holds its subject');
    const camera = new THREE.PerspectiveCamera(pose.fov, width / height, 0.1, 10000);
    camera.position.set(...pose.position); camera.lookAt(...pose.target);
    camera.setViewOffset(width, height, 0, viewCentreOffset(height, header, bottom), width, height); camera.updateMatrixWorld();
    const p = new THREE.Vector3(...pose.target).project(camera), y = (1 - p.y) / 2 * height;
    assert(y > header && y < height - bottom, `${chapters[i].id}: ${y}`);
    assert(Math.abs(y - (header + height - bottom) / 2) < 1e-7);
  }
});
// req: R-3172
await test('R-3172: whole-city housing retains the build-11 floor with one instance batch per house type', async () => {
  const { layout } = await import('../../../apps/hive/layout.mjs'), { DENSITY } = await import('../../../apps/hive/config.mjs');
  const THREE = await import('../../../apps/hive/vendor/three.module.js'), { buildHive } = await import('../../../apps/hive/assets/hive.mjs'), { buildMaterials } = await import('../../../apps/hive/assets/materials.mjs'), { batchStatic } = await import('../../../apps/hive/assets/parts.mjs');
  assert.equal(DENSITY.build11Houses, 30);
  const m = layout(await audit(), await plan()); assert(m.houses.length >= DENSITY.build11Houses);
  const scene = batchStatic(THREE, buildHive(THREE, m, buildMaterials(THREE)), m), instances = [];
  scene.traverse(o => { if (o.isInstancedMesh && o.userData.housingInstances) instances.push(o); });
  assert.equal(instances.length, DENSITY.types.length);
  assert.equal(instances.reduce((sum, o) => sum + o.count, 0), m.houses.length);
  assert(m.roads.some(r => r.id.startsWith('local/block-')), 'blocks fill the belt between existing town spokes');
  for (const o of instances) { assert(o.geometry.attributes.color); assert(o.castShadow && o.receiveShadow); }
});
// req: R-3174
await test('R-3174: opening title keeps an opaque calm band while the plan fades', async () => {
  const source = await fs.readFile(path.join(root, 'apps/hive/main.mjs'), 'utf8'), html = await fs.readFile(path.join(root, 'apps/hive/index.html'), 'utf8');
  assert.match(source, /opening\.style\.opacity = '1'/);
  assert.match(source, /drawing\.style\.opacity = String\(intro\.planOpacity\)/);
  assert.match(source, /title\.style\.opacity = prompt\.style\.opacity = String\(intro\.planOpacity\)/);
  assert.match(html, /\.invitation\{[^}]*background:var\(--bg\)/);
});
// req: R-3122
await test('R-3122: bay jib reaches over the opening and lowers a crate into it each loop', async () => {
  const THREE = await import('../../../apps/hive/vendor/three.module.js'), { layout } = await import('../../../apps/hive/layout.mjs'), { buildHive, animateHive } = await import('../../../apps/hive/assets/hive.mjs'), { buildMaterials } = await import('../../../apps/hive/assets/materials.mjs');
  const m = layout(await audit(), await plan()), scene = buildHive(THREE, m, buildMaterials(THREE)), bay = scene.children.find(o => o.userData.place === 'bay-1');
  let rig; bay.traverse(o => { if (o.userData.mechanism?.job === 'bay') rig = o; });
  const { parts: p } = rig.userData.mechanism;
  assert(p.boom.children.some(o => o.userData.jibBrace), 'triangular jib silhouette');
  assert(rig.position.x < 0 && Math.abs(rig.position.z) < m.chambers.find(n => n.id === 'bay-1').radius / 2);
  const poses = [];
  for (const time of [0, 1, 2, 3, 4]) { animateHive(scene, time, false); scene.updateMatrixWorld(true); poses.push(p.load.getWorldPosition(new THREE.Vector3()).sub(bay.position).toArray()); }
  assert.deepEqual(poses[0], poses[4]);
  assert(Math.max(...poses.map(p => p[1])) - Math.min(...poses.map(p => p[1])) > 3);
  assert(poses.some(p => Math.abs(p[0]) < 2 && Math.abs(p[2]) < 3 && p[1] < 3), 'load enters open roof');
});
// req: R-3122 R-3173
await test('R-3122: sheet runner bay carriers and outbound truck travel between places after batching', async () => {
  const THREE = await import('../../../apps/hive/vendor/three.module.js'), { layout } = await import('../../../apps/hive/layout.mjs'), { buildHive, animateHive } = await import('../../../apps/hive/assets/hive.mjs'), { buildMaterials } = await import('../../../apps/hive/assets/materials.mjs'), { batchStatic } = await import('../../../apps/hive/assets/parts.mjs');
  const m = layout(await audit(), await plan()), scene = batchStatic(THREE, buildHive(THREE, m, buildMaterials(THREE)), m), travelers = [];
  scene.traverse(o => { if (o.userData.carryPath || o.userData.outbound) travelers.push(o); });
  assert(travelers.some(o => o.userData.role === 'runner'));
  for (const n of m.chambers.filter(n => n.form === 'bay' && n.material.status === 'sound')) assert(travelers.some(o => o.userData.role === 'builder' && o.userData.resident.place === n.id));
  const truck = travelers.find(o => o.userData.outbound); assert(truck?.userData.traffic?.truck);
  const packet = scene.children.find(o => o.userData.packet?.returning); assert(packet, 'return packet');
  const points = packet.userData.packet.points, at = id => m.chambers.find(n => n.id === id);
  assert.deepEqual([points[0][0], points[0][2]], at('land-gate').front);
  assert.deepEqual([points.at(-1)[0], points.at(-1)[2]], at('drafting').front);
  assert.deepEqual(packet.userData.packet.flows, ['ladder>ledger', 'ledger>drafting']);
  const edgeKey = (a, b) => [[a[0], a[2]].join(), [b[0], b[2]].join()].sort().join('/');
  const allowed = m.handoffs.filter(r => r.built && r.kind !== 'forward').flatMap(r => r.path.slice(1).map((b, i) => edgeKey(r.path[i], b)));
  const connector = m.handoffs.find(r => r.from === 'ladder' && r.to === 'land-gate').path;
  const connectorEdges = connector.slice(1).map((b, i) => edgeKey(connector[i], b));
  for (let i = 1; i < points.length; i++) { if (points[i].join() === points[i - 1].join()) continue; const edge = edgeKey(points[i - 1], points[i]); assert(allowed.includes(edge) || connectorEdges.includes(edge), 'packet leaves built return or gate connector'); }
  animateHive(scene, 1, false); const start = packet.position.toArray(); assert(packet.visible); animateHive(scene, 1.5, false); assert(packet.visible); assert.notDeepEqual(packet.position.toArray(), start);
  const gate = m.chambers.find(n => n.id === 'land-gate');
  assert(truck.userData.traffic.points.some(p => p[1] > gate.z) && truck.userData.traffic.points.some(p => p[1] < gate.z));
  for (const o of travelers) { animateHive(scene, 0, false); const a = o.position.toArray(); animateHive(scene, 0.5, false); assert.notDeepEqual(o.position.toArray(), a); }
});
// req: R-3187
await test('R-3187: every claimed flow matches one working code line and no text revives a retired claim', async () => {
  const table = [
    ['ledger', 'bay-1', 'back', true, 'packages/nana-pack/bin/pi-worker.mjs', /promptParts\.push\([^;]*readFileSync\(knownBugPath\)/],
    ['ledger', 'drafting', 'back', true, 'packages/nana-pack/prompts/planner.md', /Read the feature's known-bug file when one exists/],
    ['survey', 'drafting', 'back', true, 'packages/nana-pack/prompts/planner.md', /Run `npm run map:search -- "<need>"` for each part of the lane/],
    ['court', 'drafting', 'back', true, 'packages/nana-pack/prompts/planner.md', /^2\. `\$HOME\/nana-pi\/packages\/nana-pack\/rules\/nana-rulings\.md`/m],
    ['ladder', 'ledger', 'back', true, 'packages/nana-pack/prompts/review-standard.md', /the seat records them as known bugs/],
    ['land-gate', 'archive', 'back', true, 'packages/nana-pack/bin/nana-land.mjs', /const kept = appendLandRecord\(common, end\)/],
    ['watchtower', 'tower', 'back', true, 'packages/nana-pack/lib/frontier-summary-config.mjs', /export const MAIN_CI_COMMAND_PREFIX = .*nana-main-ci\.mjs/],
    ['theater', 'tower', 'air', true, 'packages/nana-setup/lib/settings.mjs', /event: "UserPromptSubmit", label: "UserPromptSubmit knowledge pull"/],
    ['archive', 'drafting', 'back', false, 'packages/nana-knowledge/lib/sources.ts', /exclude:\s*\["node_modules", "raw", "reviews"\]/],
    ['customers', 'freight', 'back', false, null, 'No template drift checker'],
    ['customers', 'tower', 'air', false, null, 'Owner brings feedback by hand'],
    ['theater', 'bay-1', 'air', null, 'packages/nana-knowledge/lib/hook.ts', /NANA_ROLE === "worker"\) return none\("worker-role"\)/],
    ['theater', 'bay-2', 'air', null, 'packages/nana-knowledge/lib/hook.ts', /NANA_ROLE === "worker"\) return none\("worker-role"\)/],
    ['inspection', 'theater', 'back', null, 'packages/nana-knowledge/lib/sources.ts', /exclude:\s*\["node_modules", "raw", "reviews"\]/],
  ];
  const p = await plan(), key = r => `${r.from}>${r.to}`, expected = table.filter(r => r[3] !== null).map(([from, to, kind, built]) => ({ from, to, kind, built }));
  assert.deepEqual(p.roads.filter(r => r.kind !== 'forward').map(({ from, to, kind, built }) => ({ from, to, kind, built })).sort((a, b) => key(a).localeCompare(key(b))), expected.sort((a, b) => key(a).localeCompare(key(b))), 'declared flows differ from working code');
  for (const [from, to, , built, file, pattern] of table) {
    const road = `${from}/${to}`;
    if (built === null) assert(!p.roads.some(r => r.from === from && r.to === to), `${road}: flow the code lacks`);
    if (!file) continue;
    const source = await fs.readFile(path.join(root, file), 'utf8');
    const check = input => {
      const stripped = /\.(mjs|ts)$/.test(file) ? input.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\r\n]*/g, '') : input;
      const matches = [...stripped.matchAll(new RegExp(pattern.source, pattern.flags + 'g'))];
      assert.equal(matches.length, 1, `${road}: evidence line missing or duplicated`);
    };
    for (const variant of [source, source.replace(/\r?\n/g, '\r\n'), source.replace(/\r?\n/g, ' \t\n'), source.trimEnd()]) {
      check(variant);
      const broken = variant.split(/\r?\n/).filter(line => !new RegExp(pattern.source, pattern.flags).test(line)).join('\n');
      assert.throws(() => check(broken), new RegExp(`${road}: evidence line missing`));
    }
  }
  for (const ch of p.journey) for (const flow of ch.flows) assert(p.roads.some(r => key(r) === flow), `${ch.id}: unknown flow ${flow}`);
  const library = p.journey.find(ch => ch.id === 'library');
  for (const built of [false, true]) assert(library.flows.some(f => p.roads.some(r => key(r) === f && r.built === built)));
  const { layout } = await import('../../../apps/hive/layout.mjs'), { tour } = await import('../../../apps/hive/tour.mjs'), { textLayer } = await import('../../../apps/hive/text-layer.mjs');
  const data = await audit(), m = layout(data, p), chapters = tour(m, p);
  const edges = m.handoffs.filter(r => r.kind === 'back' && r.built).flatMap(r => r.path.slice(1).map((b, i) => [[r.path[i][0], r.path[i][2]].join(), [b[0], b[2]].join()].sort().join('/')));
  for (const r of m.roads.filter(r => r.class === 'back')) for (let i = 1; i < r.path.length; i++) assert(edges.includes([r.path[i - 1].join(), r.path[i].join()].sort().join('/')), `${r.id}: undeclared drawn back road`);
  const strings = [await fs.readFile(path.join(root, 'apps/hive/README.md'), 'utf8')];
  for (const mode of ['tour', 'explore']) for (const voice of ['plain', 'technical', 'work']) {
    const model = textLayer(data, '#', 'webgl', voice, chapters, mode); strings.push(model.landing.text, model.landing.legend, ...model.cards.flatMap(c => Object.values(c.voices)));
  }
  for (const retired of [/broadcasts the memory/i, /findings return to the library/i, /feedback (rises|becomes|starts)/i]) for (const text of strings) assert(!retired.test(text), `retired claim: ${retired}`);
});
if (!process.exitCode) console.log(`${passed} hive city checks passed`);
