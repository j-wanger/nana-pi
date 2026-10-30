/**
 * @module packages/nana-pack/tests/hive-graph.test.mjs
 * @purpose Pins the recorded graph, loop source, published geometry, tour and safe gesture boundary.
 * @inputs Shared graph modules and OS temporary git fixtures.
 * @outputs Tagged PASS and FAIL lines.
 * @effects disk (temporary fixtures), process (bounded CLI children)
 * @errors Failed assertions set exit 1.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = async p => JSON.parse(await fs.readFile(path.join(root, p), 'utf8'));
const fixture = await read('docs/components/fixture.json');
const fixtureLoop = { contract: 'nana-component-loop', version: 1, spine: ['workshop', 'review-hall', 'land-gate'], attachments: [{ id: 'library', role: 'support', stage: 'workshop' }, { id: 'key-cabinet', role: 'outside', stage: 'outside' }] };
let passed = 0;
async function test(title, fn) { let timer; try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case timeout')), 60000); })]); passed++; console.log('PASS', title); } catch (e) { console.log('FAIL', title, e.stack); process.exitCode = 1; } finally { clearTimeout(timer); } }
const run = (args, options = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 30000, ...options });
const git = (dir, args) => { const r = spawnSync('git', args, { cwd: dir, encoding: 'utf8', timeout: 10000 }); assert.equal(r.status, 0, r.stderr); return r.stdout; };
const temp = () => fs.mkdtemp(path.join(os.tmpdir(), 'nana-graph-'));
async function fixtureRepo(dir) {
  await fs.mkdir(path.join(dir, 'docs/components'), { recursive: true });
  const components = fixture.components.map((c, i) => ({ ...c, parts: i === 2 ? ['b.mjs'] : [`${['a','b','c','d','e'][i]}.mjs`], features: i < 2 ? ['FEAT-001'] : [] }));
  const source = { ...fixture, components };
  for (const [name, text] of Object.entries({ 'a.mjs': "import './b.mjs'; import './b.mjs';", 'b.mjs': "import './d.mjs';", 'c.mjs': '', 'd.mjs': '', 'e.mjs': '' })) await fs.writeFile(path.join(dir, name), text);
  await fs.writeFile(path.join(dir, 'code-map.config.json'), JSON.stringify({ roots: ['.'], moduleExtensions: ['.mjs'], packages: [{ id: 'fixture', prefix: '' }], layers: [{ id: 'all', title: 'Fixture', blurb: 'Fixture modules.', match: '.*' }], mapPath: 'map.md', runner: 'npm run', exempt: [] }));
  await fs.writeFile(path.join(dir, 'docs/components/nana-pi.json'), JSON.stringify(source));
  await fs.writeFile(path.join(dir, 'docs/components/loop.json'), JSON.stringify(fixtureLoop));
  const ledger = '# Requirements\n\n## CAP-01 · Fixture\nPurpose: A fixture.\nKind: product\nDeliverables: R-9001\nMade by: R-9001 · build: a.mjs\nRead by: R-9001 · code: d.mjs\nRead by: R-9001 · person: a person\n\n### FEAT-001 · Writer\nPurpose: Write.\nStatus: active\nArtifact: A-001 · Data · tracked: a.mjs · build: a.mjs\n\n### FEAT-002 · Reader\nPurpose: Read.\nStatus: active\nReads: A-001 · e.mjs\nReads: A-001 · missing.mjs\n';
  // Honest text variations: CRLF, trailing blanks, and no final newline.
  await fs.writeFile(path.join(dir, 'REQUIREMENTS.md'), ledger.trimEnd().split('\n').map(l => l + ' \t').join('\r\n'));
  git(dir, ['init', '-b', 'main']); git(dir, ['config', 'user.name', 'Fixture']); git(dir, ['config', 'user.email', 'fixture@example.invalid']); git(dir, ['add', '.']); git(dir, ['commit', '-m', 'fixture']);
  return source;
}
// req: R-3170
await test('R-3170: graph counts recorded sources in their own units through shared parsers', async () => {
  const { buildGraph, main } = await import('../../../scripts/component-graph.mjs');
  const { parseLedger } = await import('../../../scripts/requirements-tree.mjs');
  const { deliverableClaims, deliverableReportLines } = await import('../../../scripts/deliverables.mjs');
  const dir = await temp();
  try {
    await fixtureRepo(dir);
    const out = path.join(dir, 'graph.json'); let text = '';
    assert.equal(await main(['--root', dir, '--out', out], { stdout: { write: s => { text += s; } } }), 0, text);
    const graph = JSON.parse(await fs.readFile(out));
    assert.deepEqual(graph.edges, [
      { from: 'key-cabinet', to: 'review-hall', source: 'import', count: 1 },
      { from: 'land-gate', to: 'workshop', source: 'loop', count: 1, declared: false },
      { from: 'library', to: 'review-hall', source: 'import', count: 1 },
      { from: 'review-hall', to: 'land-gate', source: 'loop', count: 1, declared: true },
      { from: 'workshop', to: 'key-cabinet', source: 'import', count: 1 },
      { from: 'workshop', to: 'land-gate', source: 'artifact', count: 1 },
      { from: 'workshop', to: 'library', source: 'feature', count: 1 },
      { from: 'workshop', to: 'library', source: 'import', count: 1 },
      { from: 'workshop', to: 'review-hall', source: 'join', count: 1 },
      { from: 'workshop', to: 'review-hall', source: 'loop', count: 1, declared: false },
    ]);
    const parsed = parseLedger(await fs.readFile(path.join(dir, 'REQUIREMENTS.md'), 'utf8'));
    const claims = deliverableClaims(parsed, parsed.headings.find(h => h.id === 'CAP-01')).get('R-9001');
    assert.deepEqual(claims.map(c => c.paths), [['a.mjs'], ['d.mjs'], []]);
    assert(graph.edges.every(e => e.from !== e.to));
    const tracked = await buildGraph({ root }); assert.deepEqual(tracked.problems, []);
    for (const edge of tracked.document.edges) assert(tracked.document.nodes.some(n => n.id === edge.from) && tracked.document.nodes.some(n => n.id === edge.to));
    for (const line of tracked.lines) console.log(line);
    const parsedReal = parseLedger(await fs.readFile(path.join(root, 'REQUIREMENTS.md'), 'utf8'));
    const old = spawnSync('git', ['show', '57167e92:scripts/deliverables.mjs'], { cwd: root, encoding: 'utf8' }); assert.equal(old.status, 0);
    const previousSource = old.stdout.replace(/from "([^"]+)"/g, (_, specifier) => `from ${JSON.stringify(new URL(specifier, pathToFileURL(path.join(root, 'scripts/deliverables.mjs'))).href)}`);
    const previous = await import(`data:text/javascript;base64,${Buffer.from(previousSource).toString('base64')}`);
    assert.deepEqual(deliverableReportLines(parsedReal, root), previous.deliverableReportLines(parsedReal, root));
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
// req: R-3171
await test('R-3171: loop drift and incompatible graph pairs refuse before output without changing v1', async () => {
  const { checkLoop, buildGraph } = await import('../../../scripts/component-graph.mjs');
  const { prepare } = await import('../../../apps/hive/runtime.mjs');
  for (const [change, id] of [
    [l => l.attachments.pop(), 'key-cabinet'], [l => l.attachments.push(l.attachments[0]), 'library'],
    [l => l.spine.push('unknown'), 'unknown'], [l => { l.attachments[0].stage = 'library'; }, 'library'],
    [l => { l.spine = ['workshop', 'review-hall']; }, 'spine'],
    ...['edges', 'x', 'count'].map(k => [l => { l.attachments[0][k] = 1; }, 'library']),
  ]) { const loop = structuredClone(fixtureLoop); change(loop); assert(checkLoop(loop, fixture.components).some(s => s.includes(id)), id); }
  const graph = (await buildGraph({ root, source: fixture, loop: fixtureLoop, imports: { modules: new Map() }, ledgerText: '', trackedPaths: [] })).document;
  const dir = await temp();
  try {
    const bad = { ...graph, nodes: graph.nodes.slice(1) }; await fs.writeFile(path.join(dir, 'bad.json'), JSON.stringify(bad));
    const out = path.join(dir, 'out'); const result = run([path.join(root, 'scripts/hive-page.mjs'), '--out', out, '--data', path.join(root, 'docs/components/fixture.json'), '--graph', path.join(dir, 'bad.json')]);
    assert.equal(result.status, 1); assert.equal(result.stderr.trim(), 'hive-page: graph nodes must match the components'); await assert.rejects(fs.access(out));
    assert.deepEqual(prepare(fixture, bad), { scene: null, error: 'hive: graph nodes must match the components' });
    for (const file of ['contract.json', 'fixture.json']) { const before = spawnSync('git', ['show', `57167e92:docs/components/${file}`], { cwd: root }); assert.equal(before.status, 0); assert.deepEqual(await fs.readFile(path.join(root, 'docs/components', file)), before.stdout); }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
// req: R-3172
await test('R-3172: published loop geometry matches goldens and sealed bounds clearance and attachments', async () => {
  const cfg = await import('../../../scripts/component-graph-config.mjs');
  const { settle, insidePolygon, crossings } = await import('../../../scripts/component-graph-layout.mjs');
  assert.deepEqual(cfg.SPRING, { iterations: 240, idealLength: 40, repulsion: 90, anchor: 0.9, attachment: 0.8, centring: 0.001, cooling: 0.96, temperature: 1, weightScale: 9 });
  assert.equal(cfg.ATTACH_RADIUS, 28); assert.equal(cfg.WORLD_HALF_EXTENT, 160); assert.equal(cfg.POSITION_GRID, 0.001); assert.equal(cfg.CLEARANCE, 3);
  assert.deepEqual(cfg.LOOP_ELLIPSE, [45, 75]); assert.equal(cfg.LOOP_START, -Math.PI / 2); assert.equal(cfg.ATTACH_DISTANCE, 19); assert.deepEqual(cfg.OUTSIDE_PLOT, [-95, -90, 18]);
  assert.deepEqual(cfg.ROUTING, { sides: 8, margin: 1, crossingPenalty: 1000 });
  const { FOOTPRINT_SCALE, OVERVIEW_ELEVATION } = await import('../../../apps/hive/config.mjs'); assert.equal(FOOTPRINT_SCALE, 1.3); assert.equal(OVERVIEW_ELEVATION, 1.35);
  assert.equal(cfg.OVERVIEW_CROSSING_CAP, 12); assert.equal(cfg.LOOP_CROSSING_CAP, 2);
  assert.equal(cfg.LOOP_PATH, 'docs/components/loop.json');
  const cases = [await read('docs/components/graph-fixture.json'), await read('packages/nana-pack/tests/fixtures/hive-graph-base.json')];
  for (const graph of cases) {
    const got = settle(graph.nodes.map(({ x, z, ...n }) => n), graph.edges, graph.spine);
    assert.deepEqual(got, graph.nodes);
    const spine = graph.spine.map(id => got.find(n => n.id === id));
    const centre = { x: spine.reduce((s, n) => s + n.x, 0) / spine.length, z: spine.reduce((s, n) => s + n.z, 0) / spine.length };
    const angles = spine.map(n => Math.atan2(n.z - centre.z, n.x - centre.x)); let turns = 0;
    assert.equal(crossings(spine.map((n, i) => ({ class: 'loop', path: [[n.x, n.z], [spine[(i + 1) % spine.length].x, spine[(i + 1) % spine.length].z]] }))).loop, 0);
    for (let i = 0; i < angles.length; i++) turns += (angles[(i + 1) % angles.length] - angles[i] + Math.PI * 2) % (Math.PI * 2);
    assert(Math.abs(turns - Math.PI * 2) < 0.01);
    for (const [i, a] of got.entries()) {
      assert(Math.max(Math.abs(a.x), Math.abs(a.z)) <= cfg.WORLD_HALF_EXTENT);
      for (const b of got.slice(i + 1)) assert(Math.hypot(a.x - b.x, a.z - b.z) >= a.radius + b.radius + cfg.CLEARANCE - cfg.POSITION_GRID * 2, `${a.id}/${b.id}`);
      if (a.role === 'support' || a.role === 'gate') { const stage = got.find(n => n.id === a.stage); assert(Math.hypot(a.x - stage.x, a.z - stage.z) <= cfg.ATTACH_RADIUS); assert(!insidePolygon(a, spine)); }
      if (a.role === 'outside') { const i = got.filter(n => n.role === 'outside').findIndex(n => n.id === a.id); assert.deepEqual([a.x, a.z], [cfg.OUTSIDE_PLOT[0], cfg.OUTSIDE_PLOT[1] + i * cfg.OUTSIDE_PLOT[2]]); }
    }
    const variant = structuredClone(graph); variant.edges = []; variant.nodes = variant.nodes.concat([0, 1].map(i => ({ id: `outside-${i}`, role: 'outside', stage: 'outside', radius: 4 })));
    assert(settle(variant.nodes, [], variant.spine).every(n => Math.max(Math.abs(n.x), Math.abs(n.z)) <= cfg.WORLD_HALF_EXTENT));
  }
});
// req: R-3173
await test('R-3173: typed roads avoid third footprints and meet the base crossing caps', async () => {
  const { roads, crossings, segmentDistance } = await import('../../../scripts/component-graph-layout.mjs');
  const cfg = await import('../../../scripts/component-graph-config.mjs');
  const { buildHive } = await import('../../../apps/hive/assets/hive.mjs'); const THREE = await import('../../../apps/hive/vendor/three.module.js');
  const { buildMaterials } = await import('../../../apps/hive/assets/materials.mjs'); const { layout } = await import('../../../apps/hive/layout.mjs');
  const base = await read('packages/nana-pack/tests/fixtures/hive-graph-base.json');
  const small = await read('docs/components/graph-fixture.json');
  for (const graph of [small, base, { ...small, edges: small.nodes.flatMap((a, i) => small.nodes.slice(i + 1).map(b => ({ from: a.id, to: b.id, source: 'import', count: 1 }))) }, { ...small, edges: small.nodes.slice(1).map(n => ({ from: small.nodes[0].id, to: n.id, source: 'artifact', count: 1 })) }]) {
    const result = roads(graph.nodes, graph.edges, graph.spine); const pairs = new Set();
    for (const road of result) { const order = ['loop', 'artifact', 'spur', 'import', 'feature']; const kinds = road.sources.map(s => s.source === 'join' ? 'artifact' : s.source); assert.equal(road.class, order.find(k => kinds.includes(k))); assert(!pairs.has(road.id)); pairs.add(road.id); assert(road.sources.length); for (const n of graph.nodes.filter(n => n.id !== road.from && n.id !== road.to)) for (let i = 1; i < road.path.length; i++) assert(segmentDistance(n, road.path[i - 1], road.path[i]) >= n.radius - cfg.POSITION_GRID * 2, `${road.id} hits ${n.id}`); }
    const expectedPairs = new Set(graph.edges.map(e => [e.from, e.to].sort().join('/')));
    for (const n of graph.nodes.filter(n => ['support', 'gate'].includes(n.role))) expectedPairs.add([n.id, n.stage].sort().join('/'));
    const outside = graph.nodes.filter(n => n.role === 'outside');
    outside.forEach((n, i) => expectedPairs.add([i ? outside[i - 1].id : graph.spine.at(-1), n.id].sort().join('/')));
    assert.deepEqual([...pairs].sort(), [...expectedPairs].sort());
    for (const road of result) {
      assert.equal(road.id, [road.from, road.to].sort().join('/'));
      for (const source of road.sources) if (source.source !== 'spur') assert(graph.edges.some(e => JSON.stringify(e) === JSON.stringify(source)));
    }
    for (const e of graph.edges) { const r = result.find(r => [r.from, r.to].includes(e.from) && [r.from, r.to].includes(e.to)); assert(r); assert(r.sources.some(s => s.from === e.from && s.to === e.to && s.source === e.source && s.count === e.count)); }
  }
  for (const graph of [small, base]) for (const [i, from] of graph.spine.entries()) { const to = graph.spine[(i + 1) % graph.spine.length], edge = graph.edges.find(e => e.source === 'loop' && e.from === from && e.to === to); assert(edge); assert(graph.roads.some(r => r.class === 'loop' && r.id === [from, to].sort().join('/') && r.sources.some(s => s.source === 'loop' && s.declared === edge.declared))); }
  const counts = crossings(base.roads); assert(counts.overview <= cfg.OVERVIEW_CROSSING_CAP, JSON.stringify(counts)); assert(counts.loop <= cfg.LOOP_CROSSING_CAP, JSON.stringify(counts));
  const hive = buildHive(THREE, layout(fixture, small), buildMaterials(THREE)); const expected = small.roads.filter(r => ['loop', 'artifact', 'spur'].includes(r.class));
  assert.deepEqual(hive.children.filter(o => o.userData.road && o.visible).map(o => o.userData.road).sort(), expected.map(r => r.id).sort());
  const { visibleRoads } = await import('../../../apps/hive/roads.mjs');
  for (const n of base.nodes) assert.deepEqual(visibleRoads(base.roads, n.id).map(r => r.id), base.roads.filter(r => ['loop', 'artifact', 'spur'].includes(r.class) || [r.from, r.to].includes(n.id)).map(r => r.id));
  const source = await fs.readFile(path.join(root, 'apps/hive/assets/hive.mjs'), 'utf8'); assert(!source.includes('perimeter') && !source.includes('walkway'));
});
// req: R-3174
await test('R-3174: numbered tour anchors frame structures and walk roads at every viewport', async () => {
  const { tour, tourPose, chapterProgress } = await import('../../../apps/hive/tour.mjs'); const { layout } = await import('../../../apps/hive/layout.mjs');
  const { VIEWPORT_WIDTHS, VIEWPORT_HEIGHT } = await import('../../../scripts/first-look-config.mjs'); const THREE = await import('../../../apps/hive/vendor/three.module.js');
  const { segmentDistance } = await import('../../../scripts/component-graph-layout.mjs');
  const graph = await read('docs/components/graph-fixture.json'); const model = layout(fixture, graph); const chapters = tour(model, graph);
  assert.deepEqual(chapters.filter(c => c.component).map(c => c.component), ['workshop', 'library', 'review-hall', 'land-gate', 'key-cabinet']);
  const { textLayer } = await import('../../../apps/hive/text-layer.mjs'); const text = textLayer(fixture, '#library', 'webgl', 'plain', chapters);
  assert.deepEqual(text.rail.map(r => r.chapter), ['01:WORKSHOP', '01.1:LIBRARY', '02:REVIEW HALL', '03:LAND GATE', '10.1:KEY CABINET']);
  assert.deepEqual(text.cards.map(c => c.chapter), chapters.filter(c => c.component).map(c => c.number));
  const source = await fs.readFile(path.join(root, 'apps/hive/main.mjs'), 'utf8'); assert(source.includes('`${ch.number} ${c.name}`')); assert.match(source, /progress = chapterIndex; scrollTo/);
  for (const width of VIEWPORT_WIDTHS) for (const [i, chapter] of chapters.entries()) {
    const aspect = width / VIEWPORT_HEIGHT, pose = tourPose(chapters, i, aspect);
    assert.equal(chapterProgress(chapters, `#${chapter.id}`), i);
    if (chapter.component) {
      const bounds = model.chambers.find(c => c.id === chapter.component).bounds;
      const cam = new THREE.PerspectiveCamera(pose.fov, aspect, 0.1, 10000); cam.position.set(...pose.position); cam.lookAt(...pose.target); cam.updateMatrixWorld();
      for (const x of [bounds.min[0], bounds.max[0]]) for (const y of [bounds.min[1], bounds.max[1]]) for (const z of [bounds.min[2], bounds.max[2]]) { const p = new THREE.Vector3(x, y, z).project(cam); assert(Math.abs(p.x) < 1 && Math.abs(p.y) < 1); }
    }
    if (i && chapter.walk.length > 1) for (const t of [0.25, 0.5, 0.75]) { const mid = tourPose(chapters, i - 1 + t, aspect); assert(chapter.walk.slice(1).some((p, j) => segmentDistance({ x: mid.target[0], z: mid.target[2] }, chapter.walk[j], p) < 0.001)); assert.deepEqual(tourPose(chapters, i - 1 + t, aspect, true), tourPose(chapters, Math.round(i - 1 + t), aspect)); }
  }
});
// req: R-3175
await test('R-3175: real gesture binding never enters or changes hash on phone taps swipes or pinches', async () => {
  const { explore, bindGestures } = await import('../../../apps/hive/explore.mjs'); const { NAVIGATION } = await import('../../../apps/hive/config.mjs');
  assert.deepEqual(NAVIGATION, { tapTolerance: 10, doubleTapMs: 350, sectionHeight: 100, roadWidths: { loop: 0.7, artifact: 0.32, spur: 0.2, import: 0.12, feature: 0.08 }, overviewClasses: ['loop', 'artifact', 'spur'] });
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
  unbind(); const main = await fs.readFile(path.join(root, 'apps/hive/main.mjs'), 'utf8'); assert(!/canvas\.addEventListener\(['"]pointer/.test(main)); assert.equal((main.match(/location\.hash\s*=/g) ?? []).length, 1);
});
// req: R-3176
await test('R-3176: publisher ships paired graphs and Pages derives and scans them in order', async () => {
  const { buildHivePage } = await import('../../../scripts/hive-page.mjs'); const dir = await temp();
  try {
    const out = path.join(dir, 'site'); await buildHivePage(out); assert.deepEqual(JSON.parse(await fs.readFile(path.join(out, 'graph.json'))), await read('docs/components/graph-fixture.json'));
    const graph = await read('docs/components/graph-fixture.json'); graph.nodes[0].x += 1;
    const input = path.join(dir, 'custom.json'); await fs.writeFile(input, JSON.stringify(graph));
    await buildHivePage(path.join(dir, 'custom'), path.join(root, 'docs/components/fixture.json'), input);
    assert.deepEqual(JSON.parse(await fs.readFile(path.join(dir, 'custom/graph.json'))), graph);
    for (const flag of ['--data', '--graph']) { const r = run([path.join(root, 'scripts/hive-page.mjs'), '--out', path.join(dir, flag.slice(2)), flag, 'missing.json']); assert.equal(r.status, 2); assert.equal(r.stderr.trim(), 'hive-page: --data and --graph go together; make the graph with node scripts/component-graph.mjs --out <file>'); }
    const workflow = await fs.readFile(path.join(root, '.github/workflows/pages.yml'), 'utf8'); const steps = ['component-audit.mjs --out', 'component-graph.mjs --out', 'hive-page.mjs --out site/hive --data', '< site/hive/components.json', '< site/hive/graph.json', 'actions/upload-pages-artifact']; let at = -1;
    for (const step of steps) { const next = workflow.indexOf(step); assert(next > at, step); at = next; }
    assert.match(workflow, /hive-page\.mjs[^\n]+ --graph /);
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
if (!process.exitCode) console.log(`${passed} hive graph checks passed`);
