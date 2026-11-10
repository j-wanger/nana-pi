/**
 * @module packages/nana-pack/tests/lane-checks.test.mjs
 * @purpose Pin builder-stop run-and-report, base-red classification and bounded crash reporting without model calls.
 * @inputs Lane-check APIs, pi-worker, fake builders and temporary git worktrees.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (OS temporary fixtures), process (bounded git, npm and fake worker children).
 * @errors Assertions set exit 1.
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from './fake-pi.mjs';
import { withinCaseLimit } from './report-fixtures.mjs';
import { checkLane, laneCheckLines } from '../lib/lane-checks.mjs';
import { buildEndRecord } from '../lib/build-records.mjs';

const worker = fileURLToPath(new URL('../bin/pi-worker.mjs', import.meta.url));
let failures = 0;
async function check(title, action) {
  try { await withinCaseLimit(title, action); console.log('PASS', title); }
  catch (error) { failures++; console.log('FAIL', title, error.message); }
}
function fixture(action, baseSource = null) {
  const root = tmpDir(join(tmpdir(), 'lane-checks-'));
  const repo = join(root, 'repo'), lane = join(root, 'lane'), bin = join(root, 'bin'), agent = join(root, 'agent');
  fs.mkdirSync(repo); fs.mkdirSync(bin); fs.mkdirSync(agent);
  const env = { ...process.env, HOME: root, USERPROFILE: root, PI_CODING_AGENT_DIR: agent, CLAUDE_CONFIG_DIR: root, PATH: `${bin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}` };
  function git(...args) {
    const r = spawnSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd: repo, env, encoding: 'utf8', timeout: 10000 });
    assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
  }
  git('init', '-q', '-b', 'main');
  fs.writeFileSync(join(repo, 'seed'), 'fixture');
  const put = (cwd, source) => {
    fs.writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { 'check:lane': 'node check.cjs' } }));
    fs.writeFileSync(join(cwd, 'check.cjs'), source);
  };
  if (baseSource !== null) put(repo, baseSource);
  git('add', '.'); git('commit', '-qm', 'fixture');
  const base = git('rev-parse', 'HEAD');
  git('worktree', 'add', '-qb', 'feat/checks', lane);
  const brief = join(root, 'brief.md'), out = join(root, 'report.md'), calls = join(root, 'calls');
  fs.writeFileSync(brief, 'Card: fix\nServes: roadmap step 3: exercise lane checks.\n');
  const body = `require('node:fs').appendFileSync(${JSON.stringify(calls)}, 'call\\n'); console.log('builder report');`;
  if (process.platform === 'win32') writeFakePi(bin, body);
  else fs.writeFileSync(join(bin, 'pi'), `#!${process.execPath}\n${body}\n`, { mode: 0o755 });
  const launch = () => {
    const r = spawnSync(process.execPath, [worker, '--lane', 'checks', '--brief', brief, '--out', out, '--poll', '0.05'], { cwd: lane, env, encoding: 'utf8', timeout: 20000 });
    assert.equal(r.error, undefined);
    assert.equal(spawnSync('git', ['branch', '--show-current'], { cwd: lane, env, encoding: 'utf8', timeout: 10000 }).stdout.trim(), 'feat/checks');
    assert.equal(spawnSync('git', ['rev-parse', 'HEAD'], { cwd: lane, env, encoding: 'utf8', timeout: 10000 }).stdout.trim(), base);
    const records = fs.readFileSync(join(repo, '.git', 'nana', 'build-records.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(fs.readFileSync(calls, 'utf8').trim().split('\n').length, 1, 'never start a second builder');
    return { ...r, end: records.at(-1), report: fs.readFileSync(out, 'utf8') };
  };
  try { return action({ lane, env, base, put, launch }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const red = "console.error('lost-round output'); console.error('check:lane: fail: test-packs'); process.exitCode=1;";

// req: R-3997
await check('R-3997: successful fake lane builders run checks before recording pass or named failure without another builder', () => {
  fixture(({ lane, put, launch }) => {
    put(lane, "console.log('check:lane: pass');");
    const r = launch(); assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /pi-worker: lane checks: pass/); assert.equal(r.end.laneChecks.status, 'pass');
    assert.equal(r.end.outcome, 'ok');
  });
  fixture(({ lane, put, launch }) => {
    put(lane, red); const r = launch(); assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /pi-worker: lane checks: fail: test-packs/);
    assert.match(r.report, /lost-round output/); assert.equal(r.end.laneChecks.check, 'test-packs');
    assert.equal(r.end.laneChecks.base.status, 'absent'); assert.equal(r.end.outcome, 'failed');
  });
  fixture(({ launch }) => {
    const r = launch(); assert.equal(r.status, 0, r.stderr);
    assert.equal(Object.hasOwn(r.end, 'laneChecks'), false); assert.doesNotMatch(r.stderr, /lane checks:/);
  });
});

// req: R-3998
await check('R-3998: a named check already red on the starting commit reports red-on-base without another builder', () => fixture(({ launch }) => {
  const r = launch(); assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /pi-worker: lane checks: red-on-base: test-packs/);
  assert.equal(r.end.laneChecks.status, 'red-on-base'); assert.equal(r.end.laneChecks.base.check, 'test-packs');
}, red));

// req: R-3997
await check('lane check crashes and deadlines report error; diagnostics accept CRLF, trailing blanks and no final newline', () => {
  fixture(({ lane, env, base, put }) => {
    put(lane, "throw Error('runner crash');");
    const crash = checkLane({ cwd: lane, env, base }); assert.equal(crash.status, 'error');
    assert.match(crash.output, /runner crash/); assert.equal(crash.base, undefined);
    put(lane, 'setInterval(()=>{},1000);');
    const timeout = checkLane({ cwd: lane, env, base, timeout: 100 });
    assert.equal(timeout.status, 'error'); assert.match(timeout.output, /ETIMEDOUT/);
    for (const ending of ['\n', '\r\n', '']) {
      const output = `detail \t${ending || '\n'}check:lane: fail: readme-check \t${ending}`;
      const r = checkLane({ cwd: lane, env, base: null, run: () => ({ status: 1, stdout: output, stderr: '' }) });
      assert.equal(r.check, 'readme-check'); assert.equal(r.status, 'fail');
      assert.deepEqual(laneCheckLines(r), ['pi-worker: lane checks: fail: readme-check', 'pi-worker: lane checks output: detail', 'pi-worker: lane checks output: check:lane: fail: readme-check']);
      const end = buildEndRecord({ build: 'fixture', startedAt: new Date().toISOString() }, { found: {}, laneChecks: r });
      assert.deepEqual(end.laneChecks, r);
    }
  });
});
process.exitCode = failures ? 1 : 0;
