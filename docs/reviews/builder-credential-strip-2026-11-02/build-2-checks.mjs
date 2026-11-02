// Local acceptance checks; the suite never imports this evidence script.
import { spawnSync } from 'node:child_process';
const checks = [
  ['npm', ['run', 'map:check']],
  ['npm', ['run', 'readme:check']],
  ['node', ['scripts/requirements-trace.mjs']],
  ['node', ['scripts/requirements-tree.mjs', '--check']],
  ['node', ['scripts/known-bugs.mjs', '--root', '.']],
  ['node', ['scripts/identity-scan.mjs', '--root', '.']],
];
let failed = false;
for (const [command, args] of checks) {
  console.log(`command: ${command} ${args.join(' ')}`);
  const result = command === 'npm' && process.platform === 'win32'
    ? spawnSync(process.env.ComSpec, ['/d', '/s', '/c', `npm ${args.join(' ')}`], { encoding: 'utf8', timeout: 60_000 })
    : spawnSync(command === 'node' ? process.execPath : command, args, { encoding: 'utf8', timeout: 60_000 });
  process.stdout.write((result.stdout ?? '') + (result.stderr ?? ''));
  console.log(`exit: ${result.status ?? result.error?.code ?? result.signal}`);
  if (result.status !== 0) failed = true;
}
const diff = spawnSync('git', ['diff', process.argv[2] ?? 'HEAD', '--unified=0', '--', 'README.md', 'docs/known-bugs/FEAT-006.md'], { encoding: 'utf8', timeout: 10_000 });
console.log(`new prose diff exit: ${diff.status}`);
const prose = (diff.stdout ?? '').split('\n').filter(line => line.startsWith('+') && !line.startsWith('+++')).map(line => line.slice(1)).join('\n');
console.log('command: nana-writing on new README and NOTE lines');
const writing = spawnSync(process.execPath, ['packages/nana-pack/bin/nana-writing.mjs'], { input: prose, encoding: 'utf8', timeout: 10_000 });
process.stdout.write((writing.stdout ?? '') + (writing.stderr ?? ''));
console.log(`exit: ${writing.status}`);
if (diff.status !== 0 || writing.status !== 0 || !writing.stdout?.includes('over=0 passive=0 banned=0')) failed = true;
process.exitCode = failed ? 1 : 0;
