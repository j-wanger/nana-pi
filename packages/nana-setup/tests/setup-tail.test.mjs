/**
 * @module packages/nana-setup/tests/setup-tail.test.mjs
 * @purpose Pin setup-tail project readiness and retained trust behavior.
 * @inputs Setup CLI, pack trust reader and OS temporary projects.
 * @outputs PASS/FAIL lines.
 * @effects disk, process
 * @errors Failed assertions set exit status 1.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { resolveLayout } from '../lib/paths.mjs';
import { diagnose, STATUS } from '../lib/doctor.mjs';
import { withPiStub } from './stub-pi.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { findPiRoot } from '../../nana-pack/tests/pi-install.mjs';

const repo = path.resolve(fileURLToPath(new URL('../../..', import.meta.url)));
const cli = path.join(repo, 'packages/nana-setup/bin/nana-setup.mjs');
const piRoot = findPiRoot().root;
const cases = [];
const check = (title, fn) => cases.push({ title, fn });
function fixture(fn) {
  const root = tmpDir(path.join(os.tmpdir(), 'setup-tail-'));
  const dir = path.join(root, 'project');
  const home = path.join(root, 'home');
  fs.mkdirSync(dir);
  const run = (...args) => spawnSync(process.execPath, [cli, ...args, '--home', home], { encoding: 'utf8', timeout: 15000 });
  return Promise.resolve().then(() => fn({ root, dir, home, run })).finally(() => fs.rmSync(root, { recursive: true, force: true }));
}

// req: R-3886
check('M2: project needs no postEdit and preserves a legacy file', () => fixture(async ({ dir, run }) => {
  assert.equal(run('project', dir).status, 0);
  const config = path.join(dir, '.pi/nana-pack.json');
  assert.equal(fs.existsSync(config), false);
  const empty = run('project', dir, '--check');
  assert.equal(empty.status, 0, empty.stdout + empty.stderr);
  assert.doesNotMatch(empty.stdout, /postEdit|post-edit/i);
  fs.mkdirSync(path.dirname(config), { recursive: true });
  const bytes = '{ "postEdit": {"commands": []}}\r\n';
  fs.writeFileSync(config, bytes);
  assert.equal(run('project', dir).status, 0);
  assert.equal(run('trust', dir, '--yes').status, 0);
  const legacy = run('project', dir, '--check');
  assert.equal(legacy.status, 0, legacy.stdout + legacy.stderr);
  assert.doesNotMatch(legacy.stdout, /postEdit|post-edit/i);
  assert.equal(fs.readFileSync(config, 'utf8'), bytes);
}));

// req: R-3891
check('M7: gate plus legacy bytes and project doctor gate trust survive', () => fixture(async ({ dir, home, run }) => {
  const file = path.join(dir, '.pi/nana-pack.json');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const bytes = '{"gate":{"extraPatterns":["setup_tail_probe"]}, "postEdit":{"commands":[]}}\r\n';
  fs.writeFileSync(file, bytes);
  assert.equal(run('project', dir).status, 0);
  assert.equal(fs.readFileSync(file, 'utf8'), bytes);
  const before = run('project', dir, '--check');
  assert.equal(before.status, 1);
  assert.match(before.stdout, /! project trust.*nana-setup trust/);
  const layout = resolveLayout({ home });
  const doctor = () => withPiStub(() => diagnose(layout, { projectDir: dir })).find(r => r.label === 'project trust');
  assert.equal(doctor()?.status, STATUS.WARN);
  const original = process.env.PI_CODING_AGENT_DIR;
  process.env.PI_CODING_AGENT_DIR = layout.piHome;
  try {
    const pi = await import(pathToFileURL(path.join(piRoot, 'dist/index.js')).href);
    const config = await import('../../nana-pack/lib/config.ts');
    config.usePiTrustModule(pi);
    const ctx = { cwd: dir, hasUI: false, isProjectTrusted: () => true };
    const handlers = new Map();
    const gate = (await import('../../nana-pack/extensions/nana-gate.ts')).default;
    gate({ on: (event, handler) => handlers.set(event, handler) });
    const probe = () => handlers.get('tool_call')({ toolName: 'bash', input: { command: 'echo setup_tail_probe' } }, ctx);
    await handlers.get('session_start')({ reason: 'startup' }, ctx);
    assert.equal(await probe(), undefined);
    await config.primeNanaTrust(ctx);
    assert.equal(config.loadConfig(ctx).gate.extraPatterns.includes('setup_tail_probe'), false);
    assert.equal(run('trust', dir, '--yes').status, 0);
    await config.primeNanaTrust(ctx);
    assert.equal(config.loadConfig(ctx).gate.extraPatterns.includes('setup_tail_probe'), true);
    await handlers.get('session_start')({ reason: 'startup' }, ctx);
    assert.equal((await probe())?.block, true);
    const after = run('project', dir, '--check');
    assert.equal(after.status, 0, after.stdout + after.stderr);
    assert.notEqual(doctor()?.status, STATUS.WARN);
    assert.equal(fs.readFileSync(file, 'utf8'), bytes);
  } finally {
    if (original === undefined) delete process.env.PI_CODING_AGENT_DIR;
    else process.env.PI_CODING_AGENT_DIR = original;
  }
}));

let failures = 0;
for (const { title, fn } of cases) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case deadline')), 60000); })]);
    console.log('PASS', title);
  } catch (error) { failures++; console.log('FAIL', title, error.message); }
  finally { clearTimeout(timer); }
}
process.exitCode = failures ? 1 : 0;
