// Run only fixture tests and local checks; keep portable evidence without home paths.
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
const [file, ...args] = process.argv.slice(2);
if (file === '--normalize') {
  for (const name of args) {
    const target = new URL(name, import.meta.url);
    writeFileSync(target, readFileSync(target, 'utf8').replace(/[ \t]+$/gm, ''));
  }
  console.log(`normalized ${args.length} evidence files; trailing output whitespace only`);
  process.exit(0);
}
const env = { ...process.env };
delete env.NANA_WORKTREE_ROOT;
let scratch;
if (args[0] === '--baseline') {
  args.shift();
  scratch = mkdtempSync(join(tmpdir(), 'credential-baseline-'));
  const archive = spawnSync('git', ['archive', '--format=tar', `--output=${join(scratch, 'baseline.tar')}`, 'HEAD']);
  console.log(`baseline archive exit: ${archive.status}`);
  if (archive.status !== 0) process.exit(1);
  const extract = spawnSync('tar', ['-xf', 'baseline.tar'], { cwd: scratch });
  console.log(`baseline extract exit: ${extract.status}`);
  if (extract.status !== 0) process.exit(1);
  args[0] = join(scratch, args[0]);
}
const result = spawnSync(process.execPath, args, { env, encoding: 'utf8', timeout: 600_000, maxBuffer: 16 * 1024 * 1024 });
let text = `command: node ${args.join(' ')}\nNANA_WORKTREE_ROOT: cleared\n${result.stdout ?? ''}${result.stderr ?? ''}`;
for (const [source, label] of [[resolve('.'), '<worktree>'], [tmpdir(), '<temp>'], [homedir(), '<home>'], [process.env.ProgramFiles, '<program-files>']]) {
  if (!source) continue;
  for (const variant of [source, source.replaceAll('\\', '/'), source.replaceAll('\\', '\\\\')]) text = text.split(variant).join(label);
}
text += `\nexit: ${result.status ?? result.error?.code ?? result.signal}\n`;
text = text.replace(/[ \t]+$/gm, '');
writeFileSync(new URL(file, import.meta.url), text);
if (scratch) rmSync(scratch, { recursive: true, force: true });
console.log(text.split('\n').filter(line => /^(PASS  |FAIL  |Total|exit:|summary|command:)/.test(line)).join('\n'));
process.exitCode = result.status ?? 1;
