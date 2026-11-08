/**
 * @module packages/nana-setup/tests/install-check-builder-env.test.mjs
 * @purpose Pin builder environment isolation and its real gate consequence.
 * @inputs Shared launcher definitions, installed pi loader, temporary sandbox fixtures.
 * @outputs Sequential PASS/FAIL cases and exit status.
 * @effects disk, process
 * @errors Failed assertions set exit code one; each async case has a deadline.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import * as config from '../lib/install-check-config.mjs';
import * as worker from '../../nana-pack/bin/worker-config.mjs';
import { credentialStripEnv } from '../../nana-pack/lib/credential-strip.mjs';
import { buildEnvironment } from '../lib/install-check.mjs';
import { findPiRoot } from '../../nana-pack/tests/pi-install.mjs';

const cases = [];
const check = (title, fn) => cases.push({ title, fn });
// req: R-3713
check('builder boundary is removed in every key casing', () => {
  for (const platform of ['win32', 'darwin', 'linux']) {
    for (const key of ['NANA_WORKTREE_ROOT', 'nana_worktree_root', 'Nana_Worktree_Root']) {
      const env = buildEnvironment({ [key]: 'caller-lane' }, os.tmpdir(), platform);
      assert.ok(!Object.keys(env).some(name => name.toUpperCase() === 'NANA_WORKTREE_ROOT'));
    }
  }
});

// req: R-3714
check('sanitized builder fixture passes real gate', async () => {
  const original = { ...process.env };
  const base = tmpDir(path.join(os.tmpdir(), 'install-builder-'));
  try {
    const home = path.join(base, 'home');
    const project = path.join(home, 'project');
    const lane = path.join(base, 'lane');
    for (const dir of [project, lane, path.join(home, 'tmp'), path.join(home, '.pi', 'agent')]) fs.mkdirSync(dir, { recursive: true });
    const { root } = findPiRoot();
    const { createJiti } = await import(pathToFileURL(path.join(root, 'node_modules/jiti/lib/jiti.mjs')).href);
    const jiti = createJiti(import.meta.url, { moduleCache: false, alias: { '@earendil-works/pi-coding-agent': path.join(root, 'dist/index.js') } });
    const load = async rel => jiti.import(fileURLToPath(new URL(rel, import.meta.url)), { default: true });
    const gate = await load('../../nana-pack/extensions/nana-gate.ts');
    const { acceptedTempRoots, within } = await jiti.import(fileURLToPath(new URL('../../nana-pack/lib/gate-temp-roots.ts', import.meta.url)));
    const source = { ...original, NANA_WORKTREE_ROOT: lane };
    const env = buildEnvironment(source, home);
    const setEnv = value => { for (const key of Object.keys(process.env)) delete process.env[key]; Object.assign(process.env, value); };
    setEnv(env);
    const roots = acceptedTempRoots({ platform: process.platform, env, home, tmpdir: os.tmpdir() });
    if (process.platform !== 'win32') roots.push(fs.realpathSync('/tmp'));
    const exempt = roots.some(root => within(root, fs.realpathSync(project)));
    console.log(`M2 portable branch: ${exempt ? 'temp-exempt; both allowed' : 'non-exempt; leaked boundary blocked'}`);
    const token = 'builder-environment-fixture';
    const target = path.join(project, 'install-check-write.txt');
    const ctx = { cwd: project, hasUI: false, isProjectTrusted: () => true, signal: new AbortController().signal };
    const exercise = async value => {
      setEnv(value);
      const handlers = {};
      gate({ on: (name, fn) => { handlers[name] = fn; } });
      const verdict = await handlers.tool_call({ toolName: 'write', input: { path: target } }, ctx);
      const event = { toolName: 'write', input: { path: target }, isError: !!verdict?.block, content: [{ type: 'text', text: verdict?.reason ?? 'written' }] };
      if (!event.isError) fs.writeFileSync(target, token);
      return { blocked: event.isError };
    };
    const clean = await exercise(env);
    assert.equal(clean.blocked, false);
    const leaked = await exercise({ ...env, NANA_WORKTREE_ROOT: lane });
    assert.equal(leaked.blocked, !exempt);
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, original);
    fs.rmSync(base, { recursive: true, force: true });
  }
});

// req: R-3715
check('every shared builder and credential addition has a sealed decision', () => {
  assert.equal(typeof worker.builderChildEnv, 'function');
  const definitions = [worker.builderChildEnv({}, 'fixture-lane'), worker.builderChildEnv({ runtime: worker.CLAUDE_CODE_RUNTIME }, 'fixture-lane')];
  for (const definition of definitions) assert.ok(Object.isFrozen(definition));
  const kept = config.KEPT_CALLER_ENV;
  assert.deepEqual(kept, ['CLAUDE_CODE_DISABLE_AUTO_MEMORY', 'BASH_DEFAULT_TIMEOUT_MS', 'BASH_MAX_TIMEOUT_MS', 'GIT_CONFIG_PARAMETERS', 'GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_\\d+', 'GIT_CONFIG_VALUE_\\d+', 'GIT_ASKPASS', 'SSH_ASKPASS', 'GIT_TERMINAL_PROMPT', 'GCM_INTERACTIVE']);
  assert.ok(Object.isFrozen(kept));
  const names = new Set([...definitions.flatMap(Object.keys), ...Object.keys(worker.CLAUDE_BUILDER_CHILD_ENV), ...Object.keys(credentialStripEnv({})), ...Object.keys(credentialStripEnv({ GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'fixture.key', GIT_CONFIG_VALUE_0: 'fixture' }))]);
  for (const name of names) {
    assert.ok(config.OVERRIDE_ENV.includes(name) || kept.some(pattern => new RegExp(`^(?:${pattern})$`).test(name)), `unclassified child variable: ${name}`);
  }
});

let failures = 0;
for (const { title, fn } of cases) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case deadline exceeded')), 30000); })]);
    console.log('PASS', title);
  } catch (error) { failures++; console.log('FAIL', title, error.message); }
  finally { clearTimeout(timer); }
}
console.log(`${cases.length - failures}/${cases.length} passed`);
process.exitCode = failures ? 1 : 0;
