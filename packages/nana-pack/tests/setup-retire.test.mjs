/**
 * @module packages/nana-pack/tests/setup-retire.test.mjs
 * @purpose Pin adoption discovery and legacy configuration compatibility during setup retirement.
 * @inputs Real pi resource discovery, temporary homes and repositories, real adoption hook.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (OS temporary fixtures), process (bounded hook child).
 * @errors Assertions and case deadlines fail the run.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { findPiRoot } from './pi-install.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { withinCaseLimit } from './report-fixtures.mjs';
import { verifierPipeReason } from '../lib/pipe-guard.mjs';
import { buildGraph, collectModules, loadConfig } from '../../../scripts/code-map.mjs';

const piRoot = findPiRoot().root;
const root = fileURLToPath(new URL('../../../', import.meta.url));
let failures = 0;
async function test(title, body) {
  try { await withinCaseLimit(title, body); console.log('PASS', title); }
  catch (error) { failures++; console.log('FAIL', title, error.stack); }
}
async function fixture(body) {
  const base = fs.realpathSync(tmpDir(path.join(os.tmpdir(), 'setup-retire-')));
  const old = Object.fromEntries(['HOME', 'USERPROFILE', 'PI_CODING_AGENT_DIR', 'NANA_TEST_TEMP_ROOTS', 'NANA_HANDOFF'].map(k => [k, process.env[k]]));
  const home = path.join(base, 'home');
  const agent = path.join(home, '.pi', 'agent');
  const cwd = path.join(base, 'project');
  fs.mkdirSync(agent, { recursive: true });
  fs.mkdirSync(path.join(cwd, '.git'), { recursive: true });
  fs.mkdirSync(path.join(cwd, '.pi'));
  Object.assign(process.env, { HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: agent, NANA_TEST_TEMP_ROOTS: '' });
  delete process.env.NANA_HANDOFF;
  try { await body({ base, home, agent, cwd }); }
  finally {
    for (const [k, v] of Object.entries(old)) v === undefined ? delete process.env[k] : process.env[k] = v;
    fs.rmSync(base, { recursive: true, force: true });
  }
}

// req: R-3800
await test('M2: real pi discovery loads the pack without retired extensions', () => fixture(async ({ agent, cwd }) => {
  const pi = await import(pathToFileURL(path.join(piRoot, 'dist', 'index.js')).href);
  const loader = new pi.DefaultResourceLoader({ cwd, agentDir: agent, settingsManager: pi.SettingsManager.inMemory({ packages: [root] }), noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true });
  await loader.reload();
  const loaded = loader.getExtensions();
  assert.deepEqual(loaded.errors, []);
  const names = loaded.extensions.map(e => path.basename(e.path));
  for (const name of ['nana-handoff.ts', 'nana-post-edit.ts', 'nana-notify.ts']) {
    assert.ok(!names.includes(name), name);
    assert.ok(!fs.existsSync(path.join(root, 'packages/nana-pack/extensions', name)), name);
  }
  assert.ok(names.includes('nana-adoption.ts') && names.includes('nana-gate.ts'));
}));

// req: R-3801
await test('M3: real discovery journals one canonical root per day and the real hook lists only unadopted roots', () => fixture(async ({ base, agent, cwd }) => {
  const pi = await import(pathToFileURL(path.join(piRoot, 'dist', 'index.js')).href);
  const journal = path.join(agent, 'nana-journal.jsonl');
  const projectJournal = path.join(base, 'project.jsonl');
  fs.writeFileSync(path.join(agent, 'nana-pack.json'), JSON.stringify({ handoff: { enabled: false } }));
  fs.writeFileSync(path.join(cwd, '.pi', 'settings.json'), '{}');
  fs.writeFileSync(path.join(cwd, '.pi', 'nana-pack.json'), JSON.stringify({ journal: { path: projectJournal } }));
  const loader = new pi.DefaultResourceLoader({ cwd, agentDir: agent, settingsManager: pi.SettingsManager.inMemory({ packages: [root] }), noSkills: true, noPromptTemplates: true, noThemes: true, noContextFiles: true });
  await loader.reload();
  const loaded = loader.getExtensions();
  assert.deepEqual(loaded.errors, []);
  const producers = loaded.extensions.filter(e => /nana-(adoption|handoff)\.ts$/.test(e.path));
  assert.equal(producers.length, 1);
  const fire = async dir => {
    const ctx = { cwd: dir, hasUI: false, isProjectTrusted: () => true };
    for (const extension of producers) for (const handler of extension.handlers.get('session_start') ?? []) await handler({ reason: 'startup' }, ctx);
  };
  const sub = path.join(cwd, 'src'); fs.mkdirSync(sub);
  const events = () => fs.existsSync(journal) ? fs.readFileSync(journal, 'utf8').split('\n').filter(Boolean).map(JSON.parse).filter(e => e.event === 'directory_unadopted') : [];
  const hook = () => {
    const result = spawnSync(process.execPath, [path.join(root, 'packages/nana-setup/claude/hooks/nana-adoption.mjs')], { cwd: base, input: '{}', encoding: 'utf8', env: process.env, timeout: 10_000 });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  await fire(cwd); await fire(sub);
  assert.deepEqual(events().map(e => e.cwd), [cwd]);
  assert.ok(!fs.existsSync(projectJournal) || !fs.readFileSync(projectJournal, 'utf8').includes('directory_unadopted'));
  assert.ok(hook().includes(cwd));
  const RealDate = Date;
  const future = RealDate.now() + 25 * 3_600_000;
  globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [future])); } static now() { return future; } };
  try { await fire(sub); await fire(cwd); assert.deepEqual(events().map(e => e.cwd), [cwd, cwd]); }
  finally { globalThis.Date = RealDate; }
  const adopted = path.join(base, 'adopted');
  fs.mkdirSync(path.join(adopted, '.git'), { recursive: true });
  fs.writeFileSync(path.join(adopted, 'OBJECTIVE.md'), 'Adopted.\n');
  await fire(adopted);
  assert.equal(events().filter(e => e.cwd === adopted).length, 0);
  assert.ok(!hook().includes(adopted));
}));

// req: R-3804
await test('M6: both scopes ignore legacy blocks without warnings errors or gate fallback', () => fixture(async ({ agent, cwd }) => {
  const { loadConfig, usePiTrustModule } = await import('../lib/config.ts');
  usePiTrustModule({ hasTrustRequiringProjectResources: () => true, ProjectTrustStore: class { get() { return true; } } });
  const notices = [];
  const ctx = { cwd, isProjectTrusted: () => true, hasUI: true, ui: { notify: (...args) => notices.push(args) } };
  const file = path.join(agent, 'nana-pack.json');
  for (const legacy of [null, 7, [], { enabled: false, path: [], staleAfterDays: -1, commands: null }, { commands: [{ match: '.*', run: 'old check' }] }]) {
    fs.writeFileSync(file, JSON.stringify({ postEdit: legacy, handoff: legacy, gate: { extraPatterns: ['user-deny'] } }));
    fs.writeFileSync(path.join(cwd, '.pi', 'nana-pack.json'), JSON.stringify({ postEdit: legacy, handoff: legacy, gate: { protectedPaths: ['project-deny'] } }));
    const config = loadConfig(ctx);
    assert.equal(config.gate.stopReason, null);
    assert.deepEqual(config.gate.extraPatterns, ['user-deny']);
    assert.deepEqual(config.gate.protectedPaths, ['project-deny']);
    assert.ok(!('handoff' in config) && !('postEdit' in config));
  }
  assert.deepEqual(notices, []);
  assert.ok(!fs.existsSync(path.join(agent, 'nana-journal.jsonl')));
}));
// req: R-3802
await test('M4: pi gate imports the shared pipe predicate which blocks masking and allows standalone verification', () => {
  // Exercise the same public predicate nana-gate imports, not a nested suite.
  assert.match(verifierPipeReason('npm test | tail -5 && git commit -m checked'), /pipeline/i);
  assert.equal(verifierPipeReason('npm test && git commit -m checked'), null);

  // Check the import edge through the code map, independent of runner layout.
  const config = loadConfig(root);
  const graph = buildGraph(collectModules(root, config), config);
  assert.ok(graph.modules.get('packages/nana-pack/extensions/nana-gate.ts').callees
    .includes('packages/nana-pack/lib/pipe-guard.mjs'));
});
// req: R-3805
await test('M7: active docs retired rows artifacts and component status pass the contract checks', () => {
  const read = name => fs.readFileSync(path.join(root, name), 'utf8');
  const pack = read('packages/nana-pack/README.md');
  const setup = read('packages/nana-setup/README.md');
  const agents = read('AGENTS.md');
  const shared = read('templates/_shared/working-under-nana-pi.md');
  for (const text of [pack, setup, agents, shared]) {
    assert.ok(!/`nana-(handoff|post-edit|notify)`|pi install npm:pi-subagents@/.test(text));
  }
  assert.ok(!agents.includes('and the handoff path'));
  assert.ok(!shared.includes('configured checks run after successful edits'));
  assert.ok(!setup.includes('The Node PreToolUse hook'));
  assert.ok(!setup.includes('sets one failing post-edit command'));
  const ledger = read('REQUIREMENTS.md');
  for (const id of ['R-084', 'R-122', 'R-984', 'R-360', 'R-361', 'R-363', 'R-364', 'R-2480', 'R-2481', 'R-2486']) {
    assert.match(ledger.split('\n').find(line => line.startsWith(`| ${id} |`)) ?? '', /\| retired \|/);
  }
  for (const id of ['A-002', 'A-065', 'A-066']) assert.match(ledger.split('\n').find(line => line.startsWith(`Artifact: ${id} `)) ?? '', /· retired:/);
  const setupComponent = JSON.parse(read('docs/components/nana-pi.json')).components.find(c => c.id === 'setup');
  assert.equal(setupComponent.status, 'sound');
  assert.equal(setupComponent.gap, null);
  for (const [script, args] of [['code-map.mjs', ['--check']], ['readme-check.mjs', []], ['requirements-tree.mjs', []], ['component-audit.mjs', ['--check']]]) {
    const result = spawnSync(process.execPath, [path.join(root, 'scripts', script), ...args], { cwd: root, encoding: 'utf8', timeout: 15_000 });
    assert.equal(result.status, 0, `${script}: ${result.stdout}${result.stderr}`);
  }
});
process.exitCode = failures ? 1 : 0;
