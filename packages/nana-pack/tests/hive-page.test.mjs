/**
 * @module packages/nana-pack/tests/hive-page.test.mjs
 * @purpose Pins hive data layout, reading, rendering and local publication.
 * @inputs Pure hive modules, fixture and CLI in temporary folders.
 * @outputs Tagged PASS and FAIL lines.
 * @effects disk (OS temporary fixtures), network (loopback test server), process (CLI children)
 * @errors Failed cases set exit 1.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const fixture = JSON.parse(await fs.readFile(path.join(root, 'docs/components/fixture.json')));
const app = (name) => import(new URL(`../../../apps/hive/${name}.mjs`, import.meta.url));
let passed = 0;
async function test(title, fn) { let timer; try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case timeout')), 20000); })]); console.log('PASS', title); passed++; } catch (e) { console.log('FAIL', title, e.message); process.exitCode = 1; } finally { clearTimeout(timer); } }
const temporary = () => fs.mkdtemp(path.join(os.tmpdir(), 'nana-hive-test-'));
const build = (args) => spawnSync(process.execPath, [path.join(root, 'scripts/hive-page.mjs'), ...args], { encoding: 'utf8', timeout: 10000 });
async function files(dir, prefix = '') { const result = []; for (const e of await fs.readdir(dir, { withFileTypes: true })) { const rel = prefix + e.name; if (e.isDirectory()) result.push(...await files(path.join(dir, e.name), rel + '/')); else result.push(rel); } return result.sort(); }

// req: R-3120
await test('R-3120: layout is deterministic, ordered and non-overlapping with a separate homes ring', async () => {
  const { layout } = await app('layout');
  const many = structuredClone(fixture); many.components = Array.from({ length: 40 }, (_, i) => ({ ...fixture.components[i % 5], id: `component-${i}`, kind: i % 2 ? 'governance' : 'workflow', features: Array.from({ length: 5 }, (_, j) => ({ id: `FEAT-${String(j).padStart(3, '0')}`, label: 'feature', rows: 2, implemented: 1 })) }));
  for (const data of [fixture, many]) {
    const got = layout(data); assert.deepEqual(got, layout(data)); assert.deepEqual(got.chambers.map(c => c.id), data.components.map(c => c.id));
    const cells = got.chambers.flatMap(c => c.cells);
    for (const [i, a] of cells.entries()) for (const b of cells.slice(i + 1)) assert(Math.hypot(a.x - b.x, a.z - b.z) >= got.cellWidth, 'cells overlap');
    got.chambers.forEach((c, i) => { assert.equal(c.cells.length, Math.max(1, data.components[i].features.length)); if (!data.components[i].features.length) assert.equal(c.cells[0].dark, true); });
    const works = got.chambers.filter(c => c.kind === 'workflow');
    for (const g of got.chambers.filter(c => c.kind === 'governance')) for (const w of works) assert(Math.hypot(g.x, g.z) - g.radius > Math.hypot(w.x, w.z) + w.radius);
  }
});
// req: R-3121
await test('R-3121: honey ratios and material keys follow every contract status and kind', async () => {
  const { layout } = await app('layout'); const { STATUS_COLORS, KIND_RIMS } = await app('assets/materials');
  const contract = JSON.parse(await fs.readFile(path.join(root, 'docs/components/contract.json')));
  assert.deepEqual(Object.keys(STATUS_COLORS), contract.statuses); assert.deepEqual(Object.keys(KIND_RIMS), contract.kinds);
  const chambers = layout(fixture).chambers;
  assert.deepEqual(chambers.flatMap(c => c.cells.map(f => f.fill)), [0.9, 0.75, 1, 0, 11 / 12, 0]);
  chambers.forEach((c, i) => assert.deepEqual(c.material, { status: fixture.components[i].status, kind: fixture.components[i].kind }));
});
// req: R-3122
await test('R-3122: activity gives capped recent and in-flight bees', async () => {
  const { bees } = await app('layout'); const { BEE_CAP } = await app('config'); assert.equal(BEE_CAP, 12);
  assert.deepEqual(bees(fixture.components[0]).map(b => b.kind), ['inFlight', 'recent', 'recent', 'recent']);
  assert.deepEqual(bees(fixture.components[1]), []);
  assert.equal(bees({ activity: { recentCommits: 100, inFlight: 100 } }).length, BEE_CAP);
  assert.equal(bees({ activity: { recentCommits: 100, inFlight: 2 } }).filter(b => b.kind === 'inFlight').length, 2);
});
// req: R-3125
await test('R-3125: camera stops frame every chamber corner at phone and desktop aspects', async () => {
  const { layout } = await app('layout'); const { focus } = await app('camera');
  const THREE = await import('../../../apps/hive/vendor/three.module.js'); const model = layout(fixture); assert.equal(model.chambers.length, fixture.components.length);
  for (const aspect of [380 / 1000, 1280 / 800]) {
    for (const chamber of model.chambers) {
      const pose = focus(model, chamber.id, aspect); assert.deepEqual(pose, focus(model, chamber.id, aspect));
      assert.deepEqual(pose.target, chamber.bounds.min.map((v, i) => (v + chamber.bounds.max[i]) / 2));
      const camera = new THREE.PerspectiveCamera(pose.fov, aspect, 0.1, 10000); camera.position.set(...pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld();
      for (const x of [chamber.bounds.min[0], chamber.bounds.max[0]]) for (const y of [chamber.bounds.min[1], chamber.bounds.max[1]]) for (const z of [chamber.bounds.min[2], chamber.bounds.max[2]]) { const p = new THREE.Vector3(x, y, z).project(camera); assert(Math.abs(p.x) < 1 && Math.abs(p.y) < 1 && Math.abs(p.z) < 1); }
    }
    assert.deepEqual(focus(model, 'unknown', aspect), focus(model, null, aspect));
  }
});
// req: R-3126
await test('R-3126: rail order and active cards retain the complete component story', async () => {
  const { textLayer, renderText } = await app('text-layer'); const model = textLayer(fixture, '#library', 'pixel');
  assert.deepEqual(model.rail.map(r => r.href), ['#workshop', '#library', '#key-cabinet', '#review-hall', '#land-gate']);
  assert.equal(model.active, 'library'); const card = model.cards.find(c => c.active);
  assert.equal(card.name, 'Library');
  for (const value of [fixture.components[1].metaphor, 'workflow', 'gap', fixture.components[1].gap, fixture.components[1].ask.question, '6 of 8', '4 of 4']) assert(card.text.includes(value));
  assert.equal(textLayer(fixture, '#unknown', 'webgl').active, null); assert.equal(model.cards.length, 5); assert.equal(model.renderer, 'Renderer: pixel');
  const node = (tag) => ({ tag, children: [], attrs: {}, textContent: '', append(...xs) { this.children.push(...xs); }, setAttribute(k, v) { this.attrs[k] = v; }, replaceChildren(...xs) { this.children = xs; } });
  const container = node('main'); renderText({ createElement: node }, container, model);
  const flatten = n => [n, ...n.children.flatMap(flatten)]; const nodes = flatten(container);
  assert.equal(nodes.filter(n => n.tag === 'article').length, 6); assert.deepEqual(nodes.filter(n => n.tag === 'a').map(n => n.attrs.href), model.rail.map(r => r.href));
  const content = n => n.textContent + n.children.map(content).join('');
  for (const text of Object.values(card.voices)) assert(nodes.some(n => n.tag === 'p' && content(n) === text));
});
// req: R-3127
await test('R-3127: renderer choice falls back and incompatible data gives one error without a scene', async () => {
  const { chooseRenderer, prepare } = await app('runtime');
  assert.equal(chooseRenderer(() => null, ''), 'pixel'); assert.equal(chooseRenderer(() => ({}), ''), 'webgl'); assert.equal(chooseRenderer(() => ({}), '?view=pixel'), 'pixel');
  for (const bad of [{ ...fixture, contract: 'other' }, { ...fixture, version: 2 }]) { const got = prepare(bad); assert.equal(got.scene, null); assert.match(got.error, /^hive: incompatible component contract$/); assert.equal(got.error.split('\n').length, 1); }
});
// req: R-3128
await test('R-3128: pixel draw list fills one coloured hex per cell inside its sealed grid', async () => {
  const { layout } = await app('layout'); const { pixel } = await app('pixel'); const { PIXEL_WIDTH, PIXEL_HEIGHT } = await app('config'); const { STATUS_COLORS } = await app('assets/materials');
  assert.equal(PIXEL_WIDTH, 320); assert.equal(PIXEL_HEIGHT, 240);
  const model = layout(fixture); const list = pixel(model); const cells = model.chambers.flatMap(c => c.cells.map(f => ({ ...f, status: c.material.status })));
  assert.equal(list.hexes.length, cells.length);
  list.hexes.forEach((hex, i) => { assert.equal(hex.fill, cells[i].fill); assert.equal(hex.color, STATUS_COLORS[cells[i].status]); assert.equal(hex.points.length, 6); hex.points.forEach(([x, y]) => assert(x >= 0 && x < PIXEL_WIDTH && y >= 0 && y < PIXEL_HEIGHT)); });
});
// req: R-3129
await test('R-3129: ready marks once after drawing and still or reduced motion freezes animation', async () => {
  const { firstFrame, animationStep } = await app('runtime');
  for (const renderer of ['webgl', 'pixel']) { const calls = []; const frame = firstFrame(renderer, () => calls.push('draw'), r => calls.push(r)); frame(); frame(); assert.deepEqual(calls, ['draw', renderer, 'draw']); }
  for (const mode of [{ still: true }, { reduced: true }]) assert.deepEqual(animationStep(1, mode), animationStep(2, mode));
  assert.notDeepEqual(animationStep(1, {}), animationStep(2, {}));
});
// req: R-3130
await test('R-3130: builder copies exact app bytes and supplied data and refuses incompatible input atomically', async () => {
  const dir = await temporary(); try {
    const expected = (await files(path.join(root, 'apps/hive'))).filter(f => f !== 'README.md');
    for (const custom of [false, true]) {
      const out = path.join(dir, `out-${custom}`); const data = { ...fixture, project: custom ? 'custom' : 'fixture' }; const input = path.join(dir, 'input.json'); await fs.writeFile(input, JSON.stringify(data));
      const result = build(['--out', out, ...(custom ? ['--data', input] : [])]); assert.equal(result.status, 0, result.stderr);
      assert.deepEqual(await files(out), [...expected, 'components.json'].sort());
      for (const file of expected) assert.deepEqual(await fs.readFile(path.join(out, file)), await fs.readFile(path.join(root, 'apps/hive', file)));
      assert.deepEqual(JSON.parse(await fs.readFile(path.join(out, 'components.json'))), data);
    }
    for (const [field, value] of [['contract', 'other'], ['version', 2]]) { const input = path.join(dir, 'bad.json'); const out = path.join(dir, 'bad-out'); await fs.writeFile(input, JSON.stringify({ ...fixture, [field]: value })); const result = build(['--out', out, '--data', input]); assert.equal(result.status, 1); assert.equal(result.stderr.trim(), `hive-page: document: ${field} must equal ${fixture[field]}`); await assert.rejects(fs.access(out)); }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
// req: R-3139
await test('R-3139: builder refuses contract problems by their first name before creating output', async () => {
  const { checkComponentData } = await import('../../../scripts/component-contract.mjs');
  const contract = JSON.parse(await fs.readFile(path.join(root, 'docs/components/contract.json')));
  const dir = await temporary();
  try {
    const badCases = [
      { ...fixture, project: '' },
      { ...fixture, components: [] },
      { ...fixture, components: [{ ...fixture.components[0], status: 'unknown' }] },
      { ...fixture, components: [{ ...fixture.components[0], parts: ['../outside'] }] },
      { ...fixture, components: [{ ...fixture.components[0], activity: { recentCommits: -1, inFlight: 0 } }] },
    ];
    for (const [i, bad] of badCases.entries()) {
      const input = path.join(dir, `bad-${i}.json`), out = path.join(dir, `out-${i}`);
      await fs.writeFile(input, JSON.stringify(bad));
      const result = build(['--out', out, '--data', input]);
      assert.equal(result.status, 1);
      assert.equal(result.stderr.trim(), `hive-page: ${checkComponentData(bad, contract)[0]}`);
      assert.equal(result.stderr.trim().split('\n').length, 1);
      await assert.rejects(fs.access(out));
    }
  } finally { await fs.rm(dir, { recursive: true, force: true }); }
});
// req: R-3132
await test('R-3132: serve binds loopback and contains raw and encoded traversal paths', async () => {
  const { serveHive } = await import('../../../scripts/hive-page.mjs'); const dir = await temporary(); let server;
  try {
    const out = path.join(dir, 'site'); assert.equal(build(['--out', out]).status, 0); await fs.writeFile(path.join(dir, 'package.json'), 'outside');
    const lines = []; server = await serveHive(out, 0, line => lines.push(line)); const url = new URL(lines[0].split(' ').at(-1)); assert.equal(url.hostname, '127.0.0.1'); assert.equal(server.address().address, '127.0.0.1');
    assert.equal((await fetch(url)).status, 200);
    const http = await import('node:http');
    for (const requestPath of ['/../package.json', '/%2e%2e/package.json', '/..%2fpackage.json']) {
      const status = await new Promise((resolve, reject) => { const req = http.get({ hostname: url.hostname, port: url.port, path: requestPath }, res => { res.resume(); resolve(res.statusCode); }); req.on('error', reject); }); assert.equal(status, 404);
    }
  } finally { if (server) await new Promise(resolve => server.close(resolve)); await fs.rm(dir, { recursive: true, force: true }); }
});
if (!process.exitCode) console.log(`${passed} hive page checks passed`);
