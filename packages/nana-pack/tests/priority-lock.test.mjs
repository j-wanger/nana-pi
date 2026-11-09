/**
 * @module packages/nana-pack/tests/priority-lock.test.mjs
 * @purpose Pin refusal of cross-repository lane builds under the user priority lock.
 * @inputs Real pi-worker entry and temporary git repositories and agent config.
 * @outputs One named PASS/FAIL check.
 * @effects disk (OS temp fixtures), process (bounded git and worker subprocesses)
 * @errors Assertion failure exits nonzero.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";

const temp = tmpDir(path.join(tmpdir(), 'priority-lock-'));
const worker = fileURLToPath(new URL('../bin/pi-worker.mjs', import.meta.url));
const git = (cwd, ...args) => {
  const result = spawnSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', ...args], { cwd, encoding: 'utf8', timeout: 10_000 });
  assert.equal(result.status, 0, result.stderr);
};
const check = (title, run) => {
  try { run(); console.log(`PASS ${title}`); }
  catch (error) { console.error(`FAIL ${title}: ${error.message}`); process.exitCode = 1; }
};
// req: R-3985
check('R-3985: a lock on repository A refuses a lane in repository B before spawn', () => {
  const a = path.join(temp, 'a'), b = path.join(temp, 'b'), lane = path.join(temp, 'lane');
  const agent = path.join(temp, 'agent');
  for (const repo of [a, b]) {
    fs.mkdirSync(repo);
    git(repo, 'init', '-q');
    git(repo, 'commit', '--allow-empty', '-qm', 'seed');
  }
  git(b, 'worktree', 'add', '-qb', 'feat/locked', lane);
  fs.mkdirSync(agent);
  const config = path.join(agent, 'nana-pack.json');
  fs.writeFileSync(config, JSON.stringify({ priorityLock: { repo: a, since: '2026-11-09' } }));
  const brief = path.join(temp, 'brief.md');
  fs.writeFileSync(brief, 'Serves: roadmap step 3: fixture.\nCard: fix\n');
  // Trap any non-git subprocess: wrong code cannot start a real model or read user settings.
  const marker = path.join(temp, 'spawned');
  const preload = path.join(temp, 'trap.cjs');
  fs.writeFileSync(preload, `const cp = require('node:child_process');
const fs = require('node:fs');
for (const name of ['spawn', 'spawnSync', 'execFileSync']) {
  const original = cp[name];
  cp[name] = function(command, ...args) {
    if (command !== 'git') { fs.writeFileSync(${JSON.stringify(marker)}, String(command)); throw new Error('worker spawn trapped'); }
    return original.call(this, command, ...args);
  };
}
require('node:module').syncBuiltinESMExports();
`);
  const result = spawnSync(process.execPath, ['--require', preload, worker, '--lane', 'locked', '--brief', brief, '--out', path.join(temp, 'out.md')], {
    cwd: lane, encoding: 'utf8', timeout: 10_000,
    env: { ...process.env, HOME: temp, USERPROFILE: temp, PI_CODING_AGENT_DIR: agent },
  });
  assert.equal(result.status, 1, result.stderr);
  assert.ok(result.stderr.includes(`lane refused: priority lock holds ${a} since 2026-11-09; the owner releases it in ${config}`), result.stderr);
  assert.equal(fs.existsSync(marker), false, 'a worker subprocess started');
});
