// Capture the brief's touched-test and seat-check commands without local path diagnostics.
import * as fs from 'node:fs';
import * as os from 'node:os';
import { spawnSync } from 'node:child_process';
const folder = 'docs/reviews/credential-gate-variants-2026-11-02/';
const clean = (text) => text.split(process.cwd()).join('<worktree>').split(process.cwd().replaceAll('\\', '/')).join('<worktree>').split(os.tmpdir()).join('<temp>');
if (process.argv.includes('--clean-wrong')) {
  const file = folder + 'wrong-code.txt';
  const text = fs.readFileSync(file, 'utf8');
  fs.writeFileSync(file, clean(text).replaceAll(/\(node:\d+\)/g, '(node)'));
  process.exit(0);
}
const tests = [...new Set([
  'credential-gate.test.mjs', 'credential-strip.test.mjs', 'gate-survives-mutation.test.mjs', 'test-runner.test.mjs',
  ...fs.readdirSync('packages/nana-pack/tests').filter((name) => /^(gate-|config-gate).*\.test\.mjs$/.test(name)),
  'config-project-gate-fallback.test.mjs', 'agent-dir-config.test.mjs', 'agent-dir-hostile.test.mjs',
  'bounded-read.test.mjs', 'display-surfaces.test.mjs', 'lane-write-guard.test.mjs', 'pack-config-utf16.test.mjs', 'pipe-guard.test.mjs',
])];
const commands = process.argv.includes('--seat') ? [
  ['npm', ['run', 'map:check']], ['npm', ['run', 'readme:check']],
  ['node', ['scripts/requirements-trace.mjs']], ['node', ['scripts/requirements-tree.mjs', '--check']],
  ['node', ['scripts/known-bugs.mjs', '--root', '.']], ['node', ['scripts/identity-scan.mjs', '--root', '.']],
] : tests.map((name) => ['node', ['packages/nana-pack/tests/' + name]]);
const file = process.argv.includes('--verify') ? os.tmpdir() + '/credential-variants-tip-checks.txt' : folder + (process.argv.includes('--seat') ? 'build-1-seat-checks.txt' : 'build-1-green.txt');
fs.writeFileSync(file, '');
let failed = 0;
for (const [bin, args] of commands) {
  const env = { ...process.env, NODE_NO_WARNINGS: '1' };
  // Match the suite's child isolation: fixture edits must not inherit the live lane guard.
  delete env.NANA_WORKTREE_ROOT;
  const result = spawnSync(bin === 'node' ? process.execPath : bin, args, {
    encoding: 'utf8', shell: bin === 'npm' && process.platform === 'win32', timeout: 180_000,
    maxBuffer: 32 * 1024 * 1024, env,
  });
  const output = clean(`${result.stdout ?? ''}${result.stderr ?? ''}`);
  fs.appendFileSync(file, `$ ${bin} ${args.join(' ')}\n${output}\nEXIT ${result.status}${result.error ? ' ' + result.error.code : ''}\n\n`);
  console.log(`${bin} ${args.join(' ')}: exit ${result.status}`);
  if (result.status !== 0) failed++;
}
console.log(`${commands.length} commands, ${failed} failed`);
process.exitCode = failed ? 1 : 0;
