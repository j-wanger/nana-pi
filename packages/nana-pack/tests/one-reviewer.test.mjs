/**
 * @module packages/nana-pack/tests/one-reviewer.test.mjs
 * @purpose Pin legacy roster compatibility and one-reviewer guidance.
 * @inputs Roster modules, rules and a locally committed pre-lane resolver.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (OS temporary fixtures), process (git reads and roster children).
 * @errors Assertions or child timeouts fail the owning case.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { validateRosterShape, formatRosterLines } from '../bin/nana-roster.mjs';
import { rosterNotice } from '../lib/roster-notice.mjs';
import { gitShow } from './git-fixtures.mjs';
import { tmpDir } from "./tmp-dir.mjs";

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

// req: R-3763
await test('M7: all role guidance states one reviewer plus CI and the shared marker stays identical', () => {
  const shared = fs.readFileSync(path.join(root, 'templates/_shared/working-under-nana-pi.md'), 'utf8').trimEnd();
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  const marker = agents.split('<!-- nana:working-under-nana-pi begin -->\n')[1].split('\n<!-- nana:working-under-nana-pi end -->')[0];
  assert.equal(marker.trimEnd(), shared);
  for (const text of [shared, marker, fs.readFileSync(path.join(root, 'packages/nana-setup/claude/rules/nana-seat.md'), 'utf8')]) {
    assert.match(text, /[Ee]very lane gets one reviewer plus CI/);
    assert.doesNotMatch(text, /land reviewer|seat land review|\bchecker\b|wrong-code pairs|mutation runner|lane class/i);
  }
});
