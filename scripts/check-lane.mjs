#!/usr/bin/env node
/**
 * @module scripts/check-lane.mjs
 * @purpose Run the project-owned builder-stop checks in order, naming the first failure.
 * @inputs Current worktree files and the canonical Node check commands.
 * @outputs Check output and a final check:lane pass, fail or error line.
 * @effects process (sequential Node check children).
 * @errors Exit 1 on a red check and 2 on a crashed check runner.
 */
import { spawnSync } from 'node:child_process';
import { CHANGED_TESTS_FROM_FLAG, JOBS_FLAG, SUITE_JOBS } from '../packages/nana-pack/lib/test-runner-config.mjs';

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
console.log('check:lane: pass');
