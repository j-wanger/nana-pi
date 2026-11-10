/**
 * @module packages/nana-pack/tests/lane-checks.test.mjs
 * @purpose Pin committed-tip checks, one same-session repair, base comparison and check-phase stopping without model calls.
 * @inputs Lane-check APIs, pi-worker, fake builders and temporary git worktrees.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk (OS temporary fixtures), process (bounded git, npm and fake worker children).
 * @errors Assertions set exit 1.
 */
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from './fake-pi.mjs';
import { withinCaseLimit } from './report-fixtures.mjs';
import { checkLane, laneCheckLines } from '../lib/lane-checks.mjs';
import { buildEndRecord } from '../lib/build-records.mjs';
import { pidAlive, killProcessTree } from '../lib/process-tree.mjs';

const worker = fileURLToPath(new URL('../bin/pi-worker.mjs', import.meta.url));
let failures = 0;
async function check(title, action) {
  try { await withinCaseLimit(title, action); console.log('PASS', title); }
  catch (error) { failures++; console.log('FAIL', title, error.message); }
}
async function fixture(action, baseSource = null, { first = '', afterCommit = '', repair = '' } = {}) {
  const root = tmpDir(join(tmpdir(), 'lane-checks-'));
  const repo = join(root, 'repo'), lane = join(root, 'lane'), bin = join(root, 'bin'), agent = join(root, 'agent');
  fs.mkdirSync(repo); fs.mkdirSync(bin); fs.mkdirSync(agent);
  const env = { ...process.env, HOME: root, USERPROFILE: root, PI_CODING_AGENT_DIR: agent, CLAUDE_CONFIG_DIR: root, PATH: `${bin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}` };
  const gitArgs = ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false'];
  function gitAt(cwd, ...args) {
    const r = spawnSync('git', [...gitArgs, ...args], { cwd, env, encoding: 'utf8', timeout: 10000 });
    assert.equal(r.status, 0, r.stderr); return r.stdout.trim();
  }
  const git = (...args) => gitAt(lane, ...args);
  gitAt(repo, 'init', '-q', '-b', 'main');
  fs.writeFileSync(join(repo, 'seed'), 'fixture');
  const put = (cwd, source) => {
    fs.writeFileSync(join(cwd, 'package.json'), JSON.stringify({ scripts: { 'check:lane': 'node check.cjs' } }));
    fs.writeFileSync(join(cwd, 'check.cjs'), source);
  };
  if (baseSource !== null) put(repo, typeof baseSource === 'function' ? baseSource(root) : baseSource);
  gitAt(repo, 'add', '.'); gitAt(repo, 'commit', '-qm', 'fixture');
  const base = gitAt(repo, 'rev-parse', 'HEAD');
  gitAt(repo, 'worktree', 'add', '-qb', 'feat/checks', lane);
  const brief = join(root, 'brief.md'), out = join(root, 'report.md'), calls = join(root, 'calls');
  fs.writeFileSync(brief, 'Card: fix\nServes: roadmap step 3: exercise lane checks.\n');
  const message = join(root, 'commit-message'); fs.writeFileSync(message, 'fixture build\n');
  const body = `
    const fs = require('node:fs'); const cp = require('node:child_process');
    const args = process.argv.slice(2), session = args[args.indexOf('--session') + 1];
    const resumed = fs.existsSync(${JSON.stringify(calls)});
    const git = (...a) => cp.execFileSync('git', [...${JSON.stringify(gitArgs)}, ...a], { encoding: 'utf8' }).trim();
    const commit = () => { git('add', '.'); git('commit', '-qF', ${JSON.stringify(message)}); };
    const stdin = fs.readFileSync(0, 'utf8');
    fs.appendFileSync(${JSON.stringify(calls)}, JSON.stringify({ args, session, stdin }) + '\\n');
    if (!resumed) {
      fs.writeFileSync(session, JSON.stringify({ type: 'session', cwd: process.cwd() }) + '\\n');
      fs.writeFileSync('built-tip', 'built'); ${first}
      commit(); ${afterCommit}
    } else {
      if (!fs.existsSync(session)) throw Error('not the original session');
      ${repair}
    }
    console.log(resumed ? 'repair report' : 'builder report');
  `;
  if (process.platform === 'win32') writeFakePi(bin, body);
  else fs.writeFileSync(join(bin, 'pi'), `#!${process.execPath}\n${body}\n`, { mode: 0o755 });
  const args = [worker, '--lane', 'checks', '--brief', brief, '--out', out, '--poll', '0.05'];
  const records = () => fs.readFileSync(join(repo, '.git', 'nana', 'build-records.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
  const readCalls = () => fs.readFileSync(calls, 'utf8').trim().split('\n').map(JSON.parse);
  const launch = () => {
    const r = spawnSync(process.execPath, args, { cwd: lane, env, encoding: 'utf8', timeout: 20000 });
    assert.equal(r.error, undefined);
    assert.equal(git('branch', '--show-current'), 'feat/checks');
    assert.notEqual(git('rev-parse', 'HEAD'), base, 'the fake builder must commit');
    assert.equal(git('show', 'HEAD:built-tip'), 'built', 'the fake builder commits its tip marker');
    return { ...r, end: records().at(-1), calls: readCalls(), report: fs.readFileSync(out, 'utf8') };
  };
  const commit = () => { git('add', '.'); git('commit', '-qF', message); };
  try { return await action({ root, repo, lane, env, base, put, launch, args, records, readCalls, git, commit }); }
  finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const red = "console.error('lost-round output'); console.error('check:lane: fail: test-packs'); process.exitCode=1;";
const pass = "if (!require('node:fs').existsSync('built-tip')) throw Error('checked the base, not the tip'); console.log('check:lane: pass');";

// req: R-3997
await check('R-3997: successful fake lane builders check their committed tip and record pass or named failure', async () => {
  await fixture(({ lane, put, launch }) => {
    put(lane, pass);
    const r = launch(); assert.equal(r.status, 0, r.stderr);
    assert.match(r.stderr, /pi-worker: lane checks: pass/); assert.equal(r.end.laneChecks.status, 'pass');
    assert.equal(r.end.outcome, 'ok'); assert.equal(r.calls.length, 1);
  });
  await fixture(({ lane, put, launch }) => {
    put(lane, red); const r = launch(); assert.equal(r.status, 1, r.stderr);
    assert.match(r.stderr, /pi-worker: lane checks: fail: test-packs/);
    assert.match(r.report, /lost-round output/); assert.equal(r.end.laneChecks.check, 'test-packs');
    assert.equal(r.end.laneChecks.base.status, 'absent'); assert.equal(r.end.outcome, 'failed');
  });
  await fixture(({ launch }) => {
    const r = launch(); assert.equal(r.status, 0, r.stderr);
    assert.equal(Object.hasOwn(r.end, 'laneChecks'), false); assert.doesNotMatch(r.stderr, /lane checks:/);
    assert.equal(r.calls.length, 1);
  });
});

// req: R-3998
await check('R-3998: a named check already red on the starting commit reports red-on-base without another builder', () => fixture(({ launch }) => {
  const r = launch(); assert.equal(r.status, 1, r.stderr);
  assert.match(r.stderr, /pi-worker: lane checks: red-on-base: test-packs/);
  assert.equal(r.end.laneChecks.status, 'red-on-base'); assert.equal(r.end.laneChecks.base.check, 'test-packs');
  assert.equal(r.calls.length, 1);
}, red));

// req: R-3997
await check('lane check crashes and deadlines report error; diagnostics accept CRLF, trailing blanks and no final newline', async () => {
  await fixture(async ({ lane, env, base, put, commit, launch }) => {
    put(lane, "throw Error('runner crash');"); commit();
    const crash = await checkLane({ cwd: lane, env, base }); assert.equal(crash.status, 'error');
    assert.match(crash.output, /runner crash/); assert.equal(crash.base, undefined);
    // Error is not a model-repair request.
    const r = launch(); assert.equal(r.calls.length, 1); assert.equal(r.end.laneChecks.status, 'error');
    put(lane, 'setInterval(()=>{},1000);'); commit();
    const timeout = await checkLane({ cwd: lane, env, base, timeout: 100 });
    assert.equal(timeout.status, 'error'); assert.match(timeout.output, /ETIMEDOUT/);
    for (const ending of ['\n', '\r\n', '']) {
      const output = `detail \t${ending || '\n'}check:lane: fail: readme-check \t${ending}`;
      const r = await checkLane({ cwd: lane, env, base: null, run: (command) => command === 'git' ? { status: 0, stdout: '' } : { status: 1, stdout: output, stderr: '' } });
      assert.equal(r.check, 'readme-check'); assert.equal(r.status, 'fail');
      assert.deepEqual(laneCheckLines(r), ['pi-worker: lane checks: fail: readme-check', 'pi-worker: lane checks output: detail', 'pi-worker: lane checks output: check:lane: fail: readme-check']);
      const end = buildEndRecord({ build: 'fixture', startedAt: new Date().toISOString() }, { found: {}, laneChecks: r });
      assert.deepEqual(end.laneChecks, r);
    }
  });
});

// req: R-4003
await check('R-4003: tracked and untracked changes fail before the lane script runs', () => fixture(({ lane, put, launch }) => {
  put(lane, "throw Error('dirty tree script must not run');");
  const r = launch(); assert.equal(r.status, 1, r.stderr);
  assert.equal(r.end.laneChecks.status, 'uncommitted');
  assert.match(r.end.laneChecks.output, /seed/); assert.match(r.end.laneChecks.output, /new file/);
  assert.doesNotMatch(r.stderr, /dirty tree script must not run/);
}, null, { afterCommit: "fs.writeFileSync('seed', 'changed'); fs.writeFileSync('new file', 'untracked');" }));

// req: R-4004
await check('R-4004: one same-session resume repairs a named failure or dirty single-quote test and commits a clean passing tip', async () => {
  for (const dirty of [false, true]) await fixture(({ lane, put, launch, git }) => {
    put(lane, dirty
      ? `const fs=require('node:fs'); if (fs.readFileSync('added-test.mjs','utf8').includes("'./tmp-dir.mjs'")) { console.error('single-quote temp helper'); console.error('check:lane: fail: test-runner'); process.exitCode=1; }`
      : red);
    const r = launch(); assert.equal(r.status, 0, r.stderr);
    assert.equal(r.calls.length, 2);
    assert.equal(r.calls[0].session, r.calls[1].session);
    assert.equal(r.calls[1].stdin, '');
    const prompt = r.calls[1].args[r.calls[1].args.indexOf('-p') + 1];
    assert.match(prompt, dirty ? /uncommitted.*Fix/s : /test-packs.*Fix/s);
    assert.match(prompt, dirty ? /leftover.txt/ : /lost-round output/);
    assert.match(prompt, /commit.*stop/);
    assert.equal(r.end.laneChecks.initial.status, dirty ? 'uncommitted' : 'fail');
    assert.equal(r.end.laneChecks.resumed, true); assert.equal(r.end.laneChecks.resume.ok, true);
    assert.equal(r.end.laneChecks.status, 'pass'); assert.equal(r.end.outcome, 'ok');
    assert.match(r.stderr, /pi-worker: lane checks: pass/);
    assert.equal(git('status', '--porcelain'), '');
    assert.match(r.report, /builder report[\s\S]*repair report/);
    if (dirty) assert.equal(git('show', 'HEAD:added-test.mjs'), 'import { tmpDir } from "./tmp-dir.mjs";');
  }, null, {
    first: dirty ? `fs.writeFileSync('added-test.mjs', "import { tmpDir } from './tmp-dir.mjs';\\n");` : '',
    afterCommit: dirty ? "fs.writeFileSync('leftover.txt', 'must commit');" : '',
    repair: dirty
      ? `fs.writeFileSync('added-test.mjs', 'import { tmpDir } from "./tmp-dir.mjs";\\n'); commit();`
      : `fs.writeFileSync('check.cjs', ${JSON.stringify(pass)}); commit();`,
  });
});

// req: R-4005
await check('R-4005: a second failure ends the build without a second resume', () => fixture(({ lane, put, launch }) => {
  put(lane, red); const r = launch(); assert.equal(r.status, 1, r.stderr);
  assert.equal(r.calls.length, 2); assert.equal(r.calls[0].session, r.calls[1].session);
  assert.equal(r.end.laneChecks.initial.status, 'fail'); assert.equal(r.end.laneChecks.status, 'fail');
  assert.equal(r.end.laneChecks.resumed, true); assert.equal(r.end.outcome, 'failed');
  assert.equal((r.stderr.match(/lane checks: fail: test-packs/g) ?? []).length, 2);
}));

// req: R-4006
await check('R-4006: a stop during tip or base checks kills the check tree and removes the base checkout', async () => {
  for (const onBase of [false, true]) await fixture(async ({ root, repo, lane, env, put, args, records, readCalls }) => {
    const marker = join(root, 'check-started');
    if (!onBase) put(lane, checkSource(root, false));
    const stopFile = join(root, 'stop');
    if (process.platform === 'win32') {
      const preload = join(root, 'signal.cjs');
      fs.writeFileSync(preload, `const fs=require('node:fs'); const t=setInterval(()=>{if(fs.existsSync(${JSON.stringify(stopFile)})){clearInterval(t);process.emit('SIGTERM');}},20);t.unref();`);
      args.unshift('--import', pathToFileURL(preload).href);
    }
    const child = spawn(process.execPath, args, { cwd: lane, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = ''; child.stderr.on('data', data => { stderr += data; }); child.stdout.resume();
    const ended = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
    let checkPids;
    try {
      const deadline = Date.now() + 15000;
      while (!fs.existsSync(marker) && child.exitCode === null && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
      assert.ok(fs.existsSync(marker), stderr);
      checkPids = JSON.parse(fs.readFileSync(marker, 'utf8'));
      assert.equal(checkPids.cwd === fs.realpathSync(lane), !onBase);
      // Windows has no POSIX signal delivery: exercise its handler with a local event.
      if (process.platform === 'win32') fs.writeFileSync(stopFile, 'stop');
      else child.kill('SIGTERM');
      const result = await Promise.race([ended, new Promise((_, reject) => { const t=setTimeout(()=>reject(Error('worker did not stop')),10000); t.unref(); })]);
      assert.equal(result.code, 143, stderr);
      const end = records().at(-1); assert.equal(end.outcome, 'stopped'); assert.equal(end.signal, 'SIGTERM');
      assert.equal(end.laneChecks.status, 'stopped');
      const deadline2 = Date.now() + 5000;
      while ((pidAlive(checkPids.pid) || pidAlive(checkPids.child)) && Date.now() < deadline2) await new Promise(resolve => setTimeout(resolve, 20));
      assert.equal(pidAlive(checkPids.pid), false); assert.equal(pidAlive(checkPids.child), false);
      if (onBase) assert.equal(fs.existsSync(checkPids.cwd), false);
      const worktrees = spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: repo, env, encoding: 'utf8' });
      assert.equal(worktrees.status, 0); assert.equal((worktrees.stdout.match(/^worktree /gm) ?? []).length, 2);
      assert.equal(readCalls().length, 1);
    } finally {
      if (child.exitCode === null && child.signalCode === null) killProcessTree(child.pid, { fallback: signal => child.kill(signal) });
      if (checkPids) killProcessTree(checkPids.pid);
    }
  }, onBase ? root => checkSource(root, true) : null);
  function checkSource(root, onBase) {
    return `${onBase ? `if (require('node:fs').existsSync('built-tip')) { ${red} } else ` : ''}{
      const cp=require('node:child_process'), fs=require('node:fs');
      const child=cp.spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {stdio:'ignore'});
      fs.writeFileSync(${JSON.stringify(join(root, 'check-started'))}, JSON.stringify({cwd:process.cwd(), pid:process.pid, child:child.pid}));
      setInterval(()=>{},1000);
    }`;
  }
});
process.exitCode = failures ? 1 : 0;
