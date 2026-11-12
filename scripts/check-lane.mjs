#!/usr/bin/env node
/**
 * @module scripts/check-lane.mjs
 * @purpose Run the project-owned builder-stop checks in order, naming the first failure.
 * @inputs Current worktree files, main and its HEAD merge base, Node version and canonical check commands.
 * @outputs Check output and a final check:lane pass, fail or error line.
 * @effects process (sequential Node and git children), disk (temporary index and worktree-local git pass record).
 * @errors Exit 1 on a red check and 2 on a crashed check runner.
 */
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import { join } from 'node:path';
import { CHANGED_TESTS_FROM_FLAG, JOBS_FLAG, SUITE_JOBS, LANE_CHECK_FRESH_FLAG, LANE_CHECK_PASS_FILE } from '../packages/nana-pack/lib/test-runner-config.mjs';

// Keep this list here: each reason identifies the recorded round this check answers.
const checks = [
  ['requirements-trace', ['scripts/requirements-trace.mjs']], // shared requirement evidence rail
  ['requirements-tree --check', ['scripts/requirements-tree.mjs', '--check']], // helper-start 95138872
  ['map:check', ['scripts/code-map.mjs', '--check']], // cut-a dbe250c0
  ['readme:check', ['scripts/readme-check.mjs']], // helper-start 4f103106, command/path claims
  ['templates-working', ['scripts/test.mjs', 'templates-working.test.mjs']], // start-budget: includes AGENTS.md, excluded from name matching
  ['test-packs', ['scripts/test.mjs', 'test-packs']], // waking 5f317d5b
  ['code-map-launch', ['scripts/test.mjs', 'code-map-launch.test.mjs']], // cut-a dbe250c0
  ['requirements-deliverables', ['scripts/test.mjs', 'requirements-deliverables.test.mjs']], // cut-a dbe250c0
  ['requirements-cap-kinds', ['scripts/test.mjs', 'requirements-cap-kinds.test.mjs']], // desk-cut 0b576c7c
  ['readme-check', ['scripts/test.mjs', 'readme-check.test.mjs']], // helper-start 4f103106, AGENTS wording pin
  ['known-bugs', ['scripts/test.mjs', 'known-bugs.test.mjs']], // feature-file contract, shared stop rail
  ['test-runner', ['scripts/test.mjs', 'test-runner.test.mjs']], // seat-waits 9b04f14a
  ['changed/name-matched tests', ['scripts/test.mjs', `${CHANGED_TESTS_FROM_FLAG}main`, `${JOBS_FLAG}${SUITE_JOBS}`]], // knowledge-query, records-out, win-class, diet1 missed text readers
];
// Use a separate index: never stage the builder's files or trust index stat caches.
function git(args, env = process.env) {
  const result = spawnSync('git', args, { cwd: process.cwd(), env, encoding: 'utf8' });
  if (result.error || result.signal || result.status !== 0) throw Error('cannot compute lane content key');
  return result.stdout.trim();
}
function contentKey(gitDir) {
  const folder = fs.mkdtempSync(join(gitDir, 'lane-check-index-'));
  try {
    const env = { ...process.env, GIT_INDEX_FILE: join(folder, 'index') };
    git(['read-tree', 'HEAD'], env);
    git(['add', '-A'], env);
    const tree = git(['write-tree'], env);
    const main = git(['rev-parse', '--verify', 'refs/heads/main^{commit}']);
    const base = git(['merge-base', main, 'HEAD']);
    return createHash('sha256').update(JSON.stringify({
      tree, main, base, node: process.version, checks,
      script: fs.readFileSync(new URL(import.meta.url), 'utf8'),
    })).digest('hex');
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
}
let gitDir, recordPath, key;
try {
  gitDir = git(['rev-parse', '--absolute-git-dir']);
  recordPath = join(gitDir, LANE_CHECK_PASS_FILE);
  key = contentKey(gitDir);
  if (!process.argv.includes(LANE_CHECK_FRESH_FLAG)) {
    const record = JSON.parse(fs.readFileSync(recordPath, 'utf8'));
    if (record.key === key && typeof record.passedAt === 'string' && Number.isFinite(Date.parse(record.passedAt))) {
      console.log(`check:lane: reusing pass recorded at ${record.passedAt}; content key ${key}`);
      process.exit(0);
    }
  }
} catch { /* Missing record or key failure: always run the full rail. */ }
// A fresh failure must not leave an earlier pass reusable.
if (recordPath) {
  try { fs.rmSync(recordPath, { force: true }); }
  catch { key = undefined; }
}
for (const [name, args] of checks) {
  console.log(`check:lane: running: ${name}`);
  const started = Date.now();
  const result = spawnSync(process.execPath, args, { cwd: process.cwd(), stdio: 'inherit' });
  console.log(`check:lane: wall: ${name}: ${((Date.now() - started) / 1000).toFixed(1)}s`);
  if (result.error || result.signal || result.status === null) {
    console.error(`check:lane: error: ${name}`);
    process.exit(2);
  }
  if (result.status !== 0) {
    console.error(`check:lane: fail: ${name}`);
    process.exit(1);
  }
}
// Never bless edits made during the checks, or a run whose key could not be computed.
if (key) {
  let temporary;
  try {
    if (contentKey(gitDir) === key) {
      temporary = `${recordPath}.${process.pid}.tmp`;
      fs.writeFileSync(temporary, JSON.stringify({ key, passedAt: new Date().toISOString() }) + '\n');
      fs.renameSync(temporary, recordPath);
    }
  } catch { /* Cache errors do not change the checks' result. */ }
  finally { if (temporary) { try { fs.rmSync(temporary, { force: true }); } catch {} } }
}
console.log('check:lane: pass');
