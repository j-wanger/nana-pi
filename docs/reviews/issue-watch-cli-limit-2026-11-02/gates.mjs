// Build-only gate capture; --verify writes outside the checkout after commit.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const folder = 'docs/reviews/issue-watch-cli-limit-2026-11-02/';
const verify = process.argv.includes('--verify');
const log = verify ? path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'watch-gates-')), 'gates.txt') : folder + 'gates.txt';
fs.writeFileSync(log, 'Seat gates; runtime paths redacted.\n');
const commands = [
 ['scripts/code-map.mjs', '--check'],
 ['scripts/readme-check.mjs'],
 ['scripts/requirements-trace.mjs'],
 ['scripts/requirements-tree.mjs', '--check'],
 ['scripts/known-bugs.mjs', '--root', '.'],
 ['scripts/identity-scan.mjs', '--root', '.'],
 ['scripts/lane-class.mjs', '--root', '.', '--base', 'origin/main'],
];
if (verify) commands.unshift(...['issue-watch', 'frontier-summary', 'test-runner'].map(name => [`packages/nana-pack/tests/${name}.test.mjs`]));
for (const args of commands) {
 const r = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 300000 });
 const safe = `${r.stdout ?? ''}${r.stderr ?? ''}`.replaceAll(process.cwd(), '<worktree>').replaceAll(process.cwd().replaceAll('\\', '/'), '<worktree>');
 fs.appendFileSync(log, `node ${args.join(' ')}\nexit ${r.status}\n${safe}\n`);
 console.log(`node ${args.join(' ')}: exit ${r.status}`);
 if (r.status !== 0) { console.log(safe); process.exit(1); }
 if (args[0].includes('lane-class') && r.stdout.trim() !== 'ordinary') throw Error('wrong lane class');
}
console.log(verify ? 'Last-commit gates PASS; full output saved outside checkout.' : 'Gates PASS; see gates.txt');
