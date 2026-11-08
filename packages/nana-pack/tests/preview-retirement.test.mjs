/**
 * @module packages/nana-pack/tests/preview-retirement.test.mjs
 * @purpose Pins preview retirement while preserving publication, auditing and capture consumers.
 * @inputs Tracked repository files, public audit/report/capture APIs and temporary fixtures.
 * @outputs Eight requirement-tagged checks.
 * @effects disk (reads checkout, writes only OS temporary fixtures), process (read-only checks).
 * @errors Failed assertions set exit 1; each async case has a bounded wait.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { buildAudit } from '../../../scripts/component-audit.mjs';
import { runFirstLook } from '../../../scripts/first-look.mjs';
import { generateReport } from '../../../scripts/product-report.mjs';
import { VIEWPORT_WIDTHS } from '../../../scripts/first-look-config.mjs';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const read = file => fs.readFile(path.join(root, file), 'utf8');
const removed = [path.posix.join('apps', 'hive'), ...['page', 'page-config', 'gesture-check'].map(name => `scripts/${['hive', name].join('-')}.mjs`), ...['assets', 'city', 'page'].map(name => `packages/nana-pack/tests/${['hive', name].join('-')}.test.mjs`)];
const run = (script, ...args) => spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { cwd: root, encoding: 'utf8', timeout: 18000 });
let passed = 0;
async function test(title, fn) {
  if (process.argv[2] && !title.startsWith(process.argv[2])) return;
  let timer;
  try { await Promise.race([fn(), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case exceeded 20 seconds')), 20000); })]); passed++; console.log('PASS', title); }
  catch (error) { process.exitCode = 1; console.log('FAIL', title, error.message); }
  finally { clearTimeout(timer); }
}
async function temporary(fn) { const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'preview-retirement-')); try { await fn(dir); } finally { await fs.rm(dir, { recursive: true, force: true }); } }
const browser = () => ({
  async newPage() { return { async goto() {}, async evaluate() { return []; }, async emulateMedia() {}, async setViewportSize() {}, locator() { return { async ariaSnapshot() { return 'page'; } }; }, async screenshot({ path: file }) { await fs.writeFile(file, 'shot'); }, async close() {} }; }, async close() {},
});
const capture = (args, options = {}) => runFirstLook(args, { browser: async () => browser(), stdout() {}, ...options });
// req: R-3775
await test('R-3775: preview files and live references are gone', async () => {
  for (const file of removed) await assert.rejects(fs.access(path.join(root, file)), file);
  const tracked = spawnSync('git', ['ls-files', '-z'], { cwd: root, encoding: 'utf8' }); assert.equal(tracked.status, 0);
  for (const file of tracked.stdout.split('\0').filter(Boolean)) {
    if (/^(docs\/(plan|reviews|sessions|evidence)\/|research\/)/.test(file)) continue;
    let text; try { text = await read(file); } catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    if (file === 'REQUIREMENTS.md') text = text.split(/\r?\n/).filter(line => !line.includes(' | retired | ') && !/^Artifact: .* · retired:/.test(line)).join('\n');
    for (const gone of removed) assert(!text.includes(gone), `${file} names ${gone}`);
  }
});
// req: R-3776
await test('R-3776: Pages publishes only the product report', async () => {
  const text = await read('.github/workflows/pages.yml');
  assert(!/hive/i.test(text));
  assert(text.includes('node scripts/product-report.mjs --out site/index.html'));
  assert(text.includes('node scripts/identity-scan.mjs --stdin --root . < site/index.html'));
});
// req: R-3777
await test('R-3777: an additional component passes without a city plan', async () => {
  await temporary(async dir => {
    await fs.mkdir(path.join(dir, 'docs/components'), { recursive: true });
    await fs.copyFile(path.join(root, 'docs/components/contract.json'), path.join(dir, 'docs/components/contract.json'));
    const source = JSON.parse(await read('docs/components/nana-pi.json'));
    const base = { ...source.components.find(c => c.status === 'sound'), id: 'baseline-component', features: [], anchors: [], evidence: ['new.mjs'], parts: ['new.mjs'] };
    source.components = [base, { ...base, id: 'new-component' }];
    const result = await buildAudit({ root: dir, source, ledgerText: '', trackedPaths: ['new.mjs'], mappedModules: [], gitRunner: () => ({ status: 1, stdout: '' }) });
    assert.deepEqual(result.problems, []); assert.equal(result.exitCode, 0); assert.equal(result.document.components[1].id, 'new-component');
  });
});
// req: R-3778
await test('R-3778: retirement keeps the repository checks green', async () => {
  const ledger = await read('REQUIREMENTS.md');
  for (const line of ledger.split(/\r?\n/).filter(line => /^\| R-(312\d|313[0-4]|3139|317[0-7]|3187) \|/.test(line))) assert(line.includes(' | retired | '), line);
  for (const [script, args] of [['code-map.mjs', ['--check']], ['readme-check.mjs', []], ['requirements-tree.mjs', []], ['component-audit.mjs', ['--check']], ['requirements-trace.mjs', []]]) {
    const result = run(script, ...args); assert.equal(result.status, 0, `${script}: ${result.stdout}\n${result.stderr}`);
  }
});
// req: R-3779
await test('R-3779: product capture still saves both sides and widths', async () => {
  await temporary(async dir => {
    assert.equal(await capture(['--page', 'product', '--out', dir], { root, mergeBase: 'base', changedPaths: ['scripts/product-report.mjs'], runReport: async (_, out) => { await fs.writeFile(out, 'report'); return `file://${out}`; } }), 0);
    for (const side of ['before', 'after']) for (const width of VIEWPORT_WIDTHS) assert.equal(await fs.readFile(path.join(dir, `${side}-${width}.png`), 'utf8'), 'shot');
    await fs.access(path.join(dir, 'accessibility-diff.txt'));
    assert(!/hive/i.test(await read('scripts/first-look.mjs')));
  });
});
// req: R-3780
await test('R-3780: Pages retains build scan upload and main-only deploy order', async () => {
  const text = await read('.github/workflows/pages.yml');
  assert(!text.includes('component-audit'));
  const positions = ['node scripts/product-report.mjs', 'node scripts/identity-scan.mjs', 'uses: actions/upload-pages-artifact@v3', 'uses: actions/deploy-pages@v4'].map(token => text.indexOf(token));
  assert(positions.every((value, i) => value >= 0 && (!i || value > positions[i - 1])));
  assert.match(text, /path: site\s/); assert.match(text, /if: github.ref == 'refs\/heads\/main'/);
  assert.equal((text.match(/run:/g) ?? []).length, 2);
});
// req: R-3781
await test('R-3781: surviving capture modes write files and retired options never launch', async () => {
  await temporary(async dir => {
    const options = { root: path.join(dir, 'repo') }; const out = path.join(dir, 'out');
    assert.equal(await capture(['--page', 'url', '--before', 'before', '--after', 'after', '--out', out], options), 0);
    for (const side of ['before', 'after']) for (const width of VIEWPORT_WIDTHS) for (const suffix of ['', '-full']) await fs.access(path.join(out, `${side}-${width}${suffix}.png`));
    const refs = path.join(dir, 'refs'); await fs.mkdir(refs); await fs.writeFile(path.join(refs, 'a.png'), 'reference'); const spec = path.join(dir, 'spec.md'); await fs.writeFile(spec, '1. Capture \r\n2. Keep trailing tab\t');
    assert.equal(await capture(['--page', 'url', '--after', 'after', '--reference', refs, '--spec', spec, '--out', out], options), 0);
    for (const file of ['manifest.json', 'side-by-side.html', 'spec.md', 'reference-1.png']) await fs.access(path.join(out, file));
    assert.equal(await capture(['--page', 'desk', '--before', 'before', '--after', 'after'], { ...options, outputDir: out }), 0);
    await fs.access(path.join(out, 'accessibility-diff.txt'));
    for (const args of [['--page', 'hive', '--out', out], ['--page', 'url', '--hive', '--before', 'before', '--after', 'after', '--out', out]]) {
      let launches = 0; assert.equal(await capture(args, { ...options, browser: async () => { launches++; return browser(); } }), 2); assert.equal(launches, 0);
    }
  });
});
// req: R-3782
await test('R-3782: artifact retirement leaves only surviving live cards and readers', async () => {
  const ledger = await read('REQUIREMENTS.md');
  assert.match(ledger, /^Artifact: A-087 .* · retired:/m); assert(!/^Read by: A-087 /m.test(ledger));
  assert.match(ledger, /^Artifact: A-085 .* · CI:/m); assert.match(ledger, /^Read by: A-085 · person:/m);
  assert.match(ledger, /^Read by: A-086 · code: scripts\/component-audit.mjs$/m);
  await temporary(async dir => {
    const out = await generateReport({ root, out: path.join(dir, 'report.html'), readIssues: async () => ({ items: [], url: 'https://example.invalid/issues' }) });
    const html = await fs.readFile(out, 'utf8'); const model = JSON.parse(html.match(/<script[^>]*id="report-data"[^>]*>([\s\S]*?)<\/script>/)[1]);
    const feature = model.features.find(f => f.id === 'FEAT-039');
    assert(!JSON.stringify(feature.artifactLines).includes('A-087'));
    assert(JSON.stringify(feature.artifactLines).includes('A-085')); assert(JSON.stringify(feature.artifactLines).includes('A-086'));
  });
});
if (!process.exitCode) console.log(`${passed} preview retirement checks passed`);
