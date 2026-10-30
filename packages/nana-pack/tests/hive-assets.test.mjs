/**
 * @module packages/nana-pack/tests/hive-assets.test.mjs
 * @purpose Pins reusable low-poly assets and the vendored release bytes.
 * @inputs Vendored three.js, asset builders and sealed configuration.
 * @outputs Tagged PASS or FAIL lines.
 * @effects disk (reads vendored bytes)
 * @errors Assertion failures set exit 1.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
let passed = 0;
async function test(title, fn) { let timer; try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case timeout')), 20000); })]); console.log('PASS', title); passed++; } catch (e) { console.log('FAIL', title, e.message); process.exitCode = 1; } finally { clearTimeout(timer); } }
// req: R-3123
await test('R-3123: explicit THREE builders run in Node within sealed triangle budgets', async () => {
  const THREE = await import('../../../apps/hive/vendor/three.module.js');
  const { buildCell } = await import('../../../apps/hive/assets/cell.mjs'); const { buildBee } = await import('../../../apps/hive/assets/bee.mjs'); const { buildHive } = await import('../../../apps/hive/assets/hive.mjs'); const { buildMaterials } = await import('../../../apps/hive/assets/materials.mjs');
  const { CELL_TRIANGLE_BUDGET, BEE_TRIANGLE_BUDGET } = await import('../../../apps/hive/config.mjs'); assert.equal(CELL_TRIANGLE_BUDGET, 120); assert.equal(BEE_TRIANGLE_BUDGET, 160);
  const materials = buildMaterials(THREE);
  const triangles = object => { let n = 0; object.traverse(o => { if (o.isMesh) n += (o.geometry.index?.count ?? o.geometry.attributes.position.count) / 3; }); return n; };
  for (const fill of [0, 0.5, 1]) { const cell = buildCell(THREE, { fill }, materials); assert(cell.isObject3D); assert(triangles(cell) > 0 && triangles(cell) <= CELL_TRIANGLE_BUDGET); }
  const bee = buildBee(THREE, materials); assert(bee.isObject3D); assert(triangles(bee) > 0 && triangles(bee) <= BEE_TRIANGLE_BUDGET);
  const { layout } = await import('../../../apps/hive/layout.mjs'); const fixture = JSON.parse(await fs.readFile(new URL('../../../docs/components/fixture.json', import.meta.url)));
  const hive = buildHive(THREE, layout(fixture), materials); assert(hive.isObject3D); assert.equal(hive.children.filter(c => c.userData.component).length, 5);
});
// req: R-3124
await test('R-3124: three 0.186.1 module and core bytes retain their release hashes and MIT licence', async () => {
  const { THREE_VERSION, VENDOR_SHA256 } = await import('../../../scripts/hive-page-config.mjs'); assert.equal(THREE_VERSION, '0.186.1');
  assert.deepEqual(VENDOR_SHA256, { 'three.module.js': '9052042d676cb0fdc1ddfefe193053f34b7ac0513a616fdac4535d49987812ea', 'three.core.js': '9edde002b066a9a05676a6127f67735b62baf399bdea529f2f7e31657da769e6' });
  for (const [file, sha] of Object.entries(VENDOR_SHA256)) assert.equal(createHash('sha256').update(await fs.readFile(new URL(`../../../apps/hive/vendor/${file}`, import.meta.url))).digest('hex'), sha);
  const license = await fs.readFile(new URL('../../../apps/hive/vendor/LICENSE', import.meta.url), 'utf8'); assert.match(license, /The MIT License/); assert.match(license, /Copyright © 2010-2026 three.js authors/);
});
// req: R-3134
await test('R-3134: visual and serving defaults retain their sealed values and provenance', async () => {
  const { STYLE, STATUS_COLORS, KIND_RIMS } = await import('../../../apps/hive/config.mjs');
  assert.deepEqual(STATUS_COLORS, { sound: '#eeefed', partial: '#b9bcb9', gap: '#454947', absent: '#888d89' });
  assert.deepEqual(KIND_RIMS, { workflow: '#b7bcb8', governance: '#e2e5e1' });
  assert.deepEqual(STYLE, { cellWidth: 2, cellStep: 2.4, chamberGap: 1.8, cellHeight: 1.4, structureHeight: 8, foundationColumns: 3, fov: 40, framePadding: 1.08, cameraElevation: 0.68, pixelPadding: 20, beeScale: 0.16, beeHeight: 8.8, beeSpeed: 0.65, cameraDrift: 0.012, focusEase: 0.025, dragScale: 0.008, minZoom: 0.6, maxZoom: 2.5, pixelRatioCap: 2, shadowMapSize: 4096, port: 0, lighting: { ambient: 0.65, sun: 4.5, position: [-45, 65, 35] } });
  const { CITY, STREETS, LIGHTS, CITY_DISTRICTS, CITY_FORMS, FOOTPRINT_SCALE, OVERVIEW_ELEVATION } = await import('../../../apps/hive/config.mjs');
  assert.equal(FOOTPRINT_SCALE, 1.3); assert.equal(OVERVIEW_ELEVATION, 0.8);
  assert.deepEqual(CITY_DISTRICTS, ['sky', 'park', 'town', 'edge', 'outside']);
  assert.deepEqual(CITY_FORMS, ['tower', 'drafting', 'yard', 'bay', 'eyes', 'stair', 'gate', 'tools', 'lab', 'hall', 'vault', 'theater', 'court', 'records', 'style', 'survey', 'utilities', 'control', 'stage', 'billboard', 'customs', 'freight', 'craft', 'customers', 'neighbour', 'feedback']);
  assert.deepEqual(CITY, { positionGrid: 0.001, clearance: 3, bandGap: 8, parkBands: 3, radialStep: 17, parkBase: 16, fenceGap: 10, ringGap: 10, townGap: 12, edgeGap: 20, outsideGap: 24, skyHeight: 28, bayCount: 4, litBays: 2, vacantBearing: 147, worldHalfExtent: 300, latticeTolerance: 0.08, latticeSpacing: 0.08, latticeFamilies: 1, radiusBandSize: 8, minimumRadiusBands: 3, northTolerance: 5, frontage: 1, doorAngle: 0.35, walkTolerance: 0.002, arcSamples: 72, routingSides: 12, routingMargin: 1, pixelMargin: 0.025, cardOverlap: 0.15, probeOffset: 3 });
  assert.deepEqual(STREETS, { thickness: 0.24, elevation: -0.3, edgeWidth: 0.1, laneWidth: 0.45, dashLength: 0.8, dashGap: 0.8, widths: { avenue: 1.8, local: 0.9, back: 0.9, air: 0.07 }, widthCaps: { avenue: 0.14, local: 0.08 }, kerbHeight: 0.24, depthOffset: -4, ringElevation: 1.6, ringWidth: 1.8 });
  assert.deepEqual(LIGHTS, { minimumGap: 0.5, halfFraction: 0.5, windows: 8, colors: { lit: '#ffffff', half: '#bfc8bf', dark: '#252c28' } });
  const source = await fs.readFile(new URL('../../../apps/hive/config.mjs', import.meta.url), 'utf8'); assert.match(source, /chosen \(2026-10-29, R-3134\)/);
});
// req: R-3134
await test('R-3134: outline density fade retains chosen pixel thresholds', async () => {
  const { OUTLINES } = await import('../../../apps/hive/config.mjs');
  assert.deepEqual(OUTLINES, { opacity: 0.35, fadePixels: 1.5, fullPixels: 5 });
});
if (!process.exitCode) console.log(`${passed} hive asset checks passed`);
