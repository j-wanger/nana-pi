/**
 * @module packages/nana-pack/tests/one-reviewer.test.mjs
 * @purpose Pin retirement of extra reviewers while preserving legacy rosters and ordinary launches.
 * @inputs Roster modules, launcher copies, rules and a locally committed pre-lane resolver.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (OS temporary fixtures), process (git reads and fake launcher children).
 * @errors Assertions or child timeouts fail the owning case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { LEGACY_ROSTER_SLOTS } from '../bin/worker-config.mjs';
import { validateRosterShape, formatRosterLines } from '../bin/nana-roster.mjs';
import { rosterNotice } from '../lib/roster-notice.mjs';
import { ledgerRepo } from './ledger-repo.mjs';
import { gitShow } from './git-fixtures.mjs';
import { writeFakePi } from './fake-pi.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { withPathPrepended } from './env-path.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const pack = path.join(root, 'packages/nana-pack');
const entry = (model, thinking = 'high') => ({ provider: 'openai', model, thinking });
const roster = { scout: null, builder: entry('builder'), reviewer: entry('reviewer', null) };
async function test(title, body) {
  const dir = tmpDir(path.join(os.tmpdir(), 'one-reviewer-'));
  let timer;
  try {
    await Promise.race([Promise.resolve().then(() => body(dir)), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case timeout')), 120_000); })]);
    console.log('PASS', title);
  } catch (error) { console.log('FAIL', title, error.message); process.exitCode = 1; }
  finally { clearTimeout(timer); fs.rmSync(dir, { recursive: true, force: true }); }
}
function run(script, args, dir, env = {}) {
  const result = spawnSync(process.execPath, [script, ...args], { cwd: dir, env: { ...process.env, ...env, HOME: dir, USERPROFILE: dir, PI_CODING_AGENT_DIR: dir, PI_SESSION_ID: '', CLAUDE_CONFIG_DIR: path.join(dir, '.claude') }, encoding: 'utf8', timeout: 30_000 });
  assert.equal(result.error, undefined);
  return result;
}
function launchFixture(dir) {
  const copied = path.join(dir, 'packages', 'nana-pack');
  fs.mkdirSync(path.join(dir, 'scripts'), { recursive: true });
  fs.copyFileSync(path.join(root, 'scripts/identity-scan.mjs'), path.join(dir, 'scripts/identity-scan.mjs'));
  for (const folder of ['bin', 'lib', 'prompts']) fs.cpSync(path.join(pack, folder), path.join(copied, folder), { recursive: true });
  const setupLib = path.resolve(copied, '../nana-setup/lib');
  fs.mkdirSync(setupLib, { recursive: true });
  for (const file of ['stale-copies-config.mjs', 'claude-config-home.mjs']) fs.copyFileSync(path.resolve(pack, '../nana-setup/lib', file), path.join(setupLib, file));
  const repo = path.join(dir, 'repo');
  const fixture = ledgerRepo(repo);
  assert.equal(fixture.git('init', '-q', '-b', 'main').status, 0);
  fs.writeFileSync(path.join(repo, 'seed'), 'seed'); fixture.commit('seed');
  fs.writeFileSync(path.join(repo, 'brief.md'), 'Review the revision.');
  const bin = path.join(dir, 'fake-bin'); fs.mkdirSync(bin);
  const record = path.join(dir, 'children.jsonl');
  const body = `const fs=require('node:fs'); fs.appendFileSync(${JSON.stringify(record)},JSON.stringify(process.argv.slice(2))+'\\n'); process.stdin.resume(); process.stdin.on('end',()=>process.stdout.write('Review complete.\\nVERDICT: LAND\\n'));`;
  if (process.platform === 'win32') {
    writeFakePi(bin, body);
    fs.writeFileSync(path.join(bin, 'fake.cjs'), body);
    fs.writeFileSync(path.join(bin, 'claude.cmd'), `@echo off\r\n"${process.execPath}" "${path.join(bin, 'fake.cjs')}" %*\r\n`);
  } else for (const name of ['pi', 'claude']) fs.writeFileSync(path.join(bin, name), `#!${process.execPath}\n${body}`, { mode: 0o755 });
  // The pi watchdog supplies no stdin; its fake must emit immediately.
  const piBody = body.replace("process.stdin.resume(); process.stdin.on('end',()=>", '').replace(/\);$/, ';');
  if (process.platform === 'win32') writeFakePi(bin, piBody);
  else fs.writeFileSync(path.join(bin, 'pi'), `#!${process.execPath}\n${piBody}`, { mode: 0o755 });
  const env = withPathPrepended(process.env, bin);
  return { copied, repo, record, env, calls: () => fs.existsSync(record) ? fs.readFileSync(record, 'utf8').trim().split('\n').map(JSON.parse) : [] };
}

// req: R-3757
await test('seal: legacy roster keys are land and checker', () => {
  assert.deepEqual(LEGACY_ROSTER_SLOTS, ['land', 'checker']);
});

// req: R-3757
await test('M1: legacy keys are ignored and writes remain readable by the pre-lane resolver', dir => {
  const modern = validateRosterShape(roster);
  assert.ok(modern.roster, modern.problem);
  const legacy = { ...roster, land: entry('old-land'), checker: { runtime: 'claude-code', model: 'opus' } };
  const old = validateRosterShape(legacy);
  assert.ok(old.roster, old.problem);
  assert.deepEqual(formatRosterLines(modern.roster, 'same'), formatRosterLines(old.roster, 'same'));
  assert.ok(!formatRosterLines(old.roster, 'same').some(line => /^(land|checker):/.test(line)));
  const oldPack = path.join(dir, 'old');
  for (const relative of ['bin/nana-roster.mjs', 'bin/worker-config.mjs', 'lib/bounded-read.mjs', 'lib/agent-dir.mjs', 'lib/json-text.mjs']) {
    fs.mkdirSync(path.dirname(path.join(oldPack, relative)), { recursive: true });
    fs.writeFileSync(path.join(oldPack, relative), gitShow('89afbe55', `packages/nana-pack/${relative}`));
  }
  for (const [label, value] of [['absent', null], ['legacy', legacy]]) {
    const agent = path.join(dir, label); fs.mkdirSync(agent);
    if (value) fs.writeFileSync(path.join(agent, 'nana-pack.json'), JSON.stringify({ lanes: 7, other: { keep: true }, roster: value }));
    const changed = run(path.join(pack, 'bin/nana-roster.mjs'), ['set', 'builder', 'openai', 'new-builder', 'low'], agent);
    assert.equal(changed.status, 0, changed.stderr);
    const written = JSON.parse(fs.readFileSync(path.join(agent, 'nana-pack.json'), 'utf8'));
    assert.deepEqual(written.roster.land, value?.land ?? null);
    assert.equal(Object.hasOwn(written.roster, 'checker'), Boolean(value));
    if (value) { assert.deepEqual(written.roster.checker, legacy.checker); assert.deepEqual(written.other, { keep: true }); assert.equal(written.lanes, 7); }
    for (const role of ['largerBuilder', 'planner', 'adversary']) assert.equal(Object.hasOwn(written.roster, role), false);
    const resolved = run(path.join(oldPack, 'bin/nana-roster.mjs'), [], agent);
    assert.equal(resolved.status, 0, resolved.stderr);
    assert.match(resolved.stdout, /builder: openai new-builder low/);
  }
});

// req: R-3758
await test('M2: roster notice names only the surviving roles and lanes', () => {
  const valid = validateRosterShape({ ...roster, land: entry('old-land'), checker: entry('old-checker') });
  assert.ok(valid.roster, valid.problem);
  const line = rosterNotice({ ok: true, roster: valid.roster, source: 'default', lanes: { limit: 4 } }, 'nana-pack.json', false);
  for (const name of ['builder', 'reviewer', 'planner', 'adversary', 'lanes']) assert.ok(line.includes(name), line);
  assert.doesNotMatch(line, /\b(?:land|checker)\b/);
});

// req: R-3759
await test('M3: both Node review launchers refuse land before children or reservations and retain plain reviews', dir => {
  const f = launchFixture(dir);
  const refusals = [];
  const childLog = path.join(dir, 'spawned.jsonl');
  const preload = path.join(dir, 'watch-children.cjs');
  fs.writeFileSync(preload, `const cp=require('node:child_process'),fs=require('node:fs'); for(const method of ['spawn','spawnSync','execFileSync']) { const original=cp[method]; cp[method]=function(...args) { fs.appendFileSync(${JSON.stringify(childLog)},method+'\\n'); return original.apply(this,args); }; } require('node:module').syncBuiltinESMExports();`);
  const noChildEnv = { ...f.env, NODE_OPTIONS: `${f.env.NODE_OPTIONS ?? ''} --require ${JSON.stringify(preload)}` };
  for (const name of ['pi-review', 'claude-review']) {
    fs.writeFileSync(path.join(dir, 'nana-pack.json'), JSON.stringify({ roster: { ...roster, reviewer: name === 'claude-review' ? { runtime: 'claude-code', model: 'opus' } : roster.reviewer, land: entry('wrong-land') } }));
    const args = ['--item', name, '--tree', f.repo, '--out', path.join(dir, `${name}.md`), ...(name === 'claude-review' ? ['--brief', 'brief.md'] : [] )];
    const tail = name === 'pi-review' ? ['--', '-p', '--provider', 'openai', '--model', 'reviewer', 'go'] : [];
    const result = run(path.join(f.copied, 'bin', `${name}.mjs`), [...args, '--role', 'land', ...tail], dir, noChildEnv);
    refusals.push({ name, status: result.status, stderr: result.stderr });
  }
  assert.ok(refusals.every(result => result.status !== 0 && /one reviewer/i.test(result.stderr)), JSON.stringify(refusals));
  assert.equal(f.calls().length, 0);
  assert.equal(fs.existsSync(childLog), false, 'refused review must start no child, including git');
  assert.equal(fs.existsSync(path.join(dir, 'review-ledger.rounds.jsonl')), false);
  assert.ok(!fs.existsSync(path.join(dir, 'review-ledger.reservations')) || fs.readdirSync(path.join(dir, 'review-ledger.reservations')).length === 0);
  for (const name of ['pi-review', 'claude-review']) {
    fs.writeFileSync(path.join(dir, 'nana-pack.json'), JSON.stringify({ roster: { ...roster, reviewer: name === 'claude-review' ? { runtime: 'claude-code', model: 'opus' } : roster.reviewer } }));
    const result = run(path.join(f.copied, 'bin', `${name}.mjs`), ['--item', name, '--tree', f.repo, '--out', path.join(dir, `${name}.md`), ...(name === 'claude-review' ? ['--brief', 'brief.md'] : ['--', '-p', '--provider', 'openai', '--model', 'reviewer', 'go'])], dir, f.env);
    assert.equal(result.status, 0, result.stderr);
  }
  assert.equal(f.calls().length, 2);
  assert.ok(f.calls()[0].includes('reviewer'));
  assert.ok(f.calls()[1].includes('opus'));
  const load = fs.readFileSync(path.join(dir, 'nana-context-loads.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  assert.equal(load.find(row => row.launcher === 'pi-review').slot, 'reviewer');
});

// req: R-3760
await test('M4: checker is refused naming surviving slots and adversary still launches', dir => {
  const f = launchFixture(dir);
  fs.writeFileSync(path.join(dir, 'nana-pack.json'), JSON.stringify({ roster: { ...roster, land: entry('wrong-land'), checker: entry('wrong-checker') } }));
  const args = ['--brief', path.join(f.repo, 'brief.md'), '--out', path.join(dir, 'worker.md')];
  const refused = run(path.join(f.copied, 'bin/pi-worker.mjs'), ['--slot', 'checker', ...args], dir, f.env);
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /scout, planner or adversary/);
  assert.equal(f.calls().length, 0);
  const accepted = run(path.join(f.copied, 'bin/pi-worker.mjs'), ['--slot', 'adversary', ...args], dir, f.env);
  assert.equal(accepted.status, 0, accepted.stderr);
  assert.equal(f.calls().length, 1);
  assert.ok(f.calls()[0].includes('builder'));
});

// req: R-3763
await test('M7: all role guidance states one reviewer plus CI and the shared marker stays identical', () => {
  const shared = fs.readFileSync(path.join(root, 'templates/_shared/working-under-nana-pi.md'), 'utf8').trimEnd();
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  const marker = agents.split('<!-- nana:working-under-nana-pi begin -->\n')[1].split('\n<!-- nana:working-under-nana-pi end -->')[0];
  assert.equal(marker.trimEnd(), shared);
  for (const text of [shared, marker, fs.readFileSync(path.join(root, 'packages/nana-setup/claude/rules/nana-seat.md'), 'utf8'), fs.readFileSync(path.join(root, 'packages/nana-setup/claude/rules/nana-soul.md'), 'utf8')]) {
    assert.match(text, /[Ee]very lane gets one reviewer plus CI/);
    assert.doesNotMatch(text, /land reviewer|seat land review|\bchecker\b|wrong-code pairs|mutation runner|lane class/i);
  }
});

// req: R-3764
await test('M8: dated one-reviewer ruling replaces independent check and checker-slot rulings', () => {
  const text = fs.readFileSync(path.join(pack, 'rules/nana-rulings.md'), 'utf8');
  assert.match(text, /2026-11-07: Every lane gets one reviewer plus CI/);
  assert.doesNotMatch(text, /2026-10-16: Each install, hook or gate lane gets one independent check/);
  assert.doesNotMatch(text, /2026-11-02:[^\n]*checker/);
  assert.match(text, /A blocking question carries a one-word default/);
});
