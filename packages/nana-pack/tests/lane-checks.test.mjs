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
import { processStarts, windowsProcesses } from './process-tree-helper.mjs';
import { CASE_LIMIT_MS, withinCaseLimit } from './report-fixtures.mjs';
import { checkLane, laneCheckLines } from '../lib/lane-checks.mjs';
import { LANE_CHECK_PASS_FILE } from '../lib/test-runner-config.mjs';
import { buildEndRecord } from '../lib/build-records.mjs';
import { pidAlive, killProcessTree } from '../lib/process-tree.mjs';
import { boundedSpawn, RELAY_BACKSTOP_MS, RELAY_PARENT_POLL_MS, RELAY_SIGNAL_GRACE_MS, RELAY_SETTLE_MS } from '../../nana-setup/lib/bounded-spawn.mjs';

function identify(pids) {
  const distinct = [...new Set(pids)];
  const starts = processStarts(distinct, { strict: true });
  const missing = distinct.filter(pid => !starts.has(pid));
  if (missing.length) throw new Error(`no start token for running pid ${missing.join(', ')}`);
  return starts;
}
function survivors(identities) {
  const running = [...identities.keys()].filter(pid => pidAlive(pid));
  const starts = processStarts(running, { strict: true });
  return { pids: running.filter(pid => starts.get(pid) === identities.get(pid)), running, starts };
}
const worker = fileURLToPath(new URL('../bin/pi-worker.mjs', import.meta.url));
let failures = 0;
async function check(title, action) {
  try { await withinCaseLimit(title, action); console.log('PASS', title); }
  catch (error) {
    failures++; console.log('FAIL', title, error.stack ?? error);
    if (error.cleanupError) console.log('cleanup also failed:', error.cleanupError.stack ?? error.cleanupError);
  }
}
async function fixture(action, baseSource = null, { first = '', afterCommit = '', repair = '', remove = fs.rmSync } = {}) {
  const root = tmpDir(join(tmpdir(), 'lane-checks-'));
  const repo = join(root, 'repo'), lane = join(root, 'lane'), bin = join(root, 'bin'), agent = join(root, 'agent');
  fs.mkdirSync(repo); fs.mkdirSync(bin); fs.mkdirSync(agent);
  const env = { ...process.env, HOME: root, USERPROFILE: root, PI_CODING_AGENT_DIR: agent, CLAUDE_CONFIG_DIR: root, PATH: `${bin}${process.platform === 'win32' ? ';' : ':'}${process.env.PATH}` };
  // Record all Node descendants, including watcher hops and detached pipe holders.
  const processRecords = join(root, 'processes'); fs.mkdirSync(processRecords);
  const recorder = join(root, 'record-process.cjs');
  fs.writeFileSync(recorder, `const fs=require('node:fs'), path=require('node:path');
    const file=path.join(${JSON.stringify(processRecords)}, String(process.pid));
    fs.writeFileSync(file+'.tmp', JSON.stringify({pid:process.pid, role:process.argv[1] || 'node', at:Date.now()}));
    fs.renameSync(file+'.tmp', file);`);
  env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ''} --require ${JSON.stringify(recorder)}`;
  const tracked = new Map();
  const refresh = (pid, role) => {
    const added = new Map();
    for (const name of fs.readdirSync(processRecords)) {
      if (!/^[1-9]\d*$/.test(name)) continue;
      const member = JSON.parse(fs.readFileSync(join(processRecords, name), 'utf8'));
      if (!tracked.has(member.pid)) added.set(member.pid, member);
    }
    if (pid && !tracked.has(pid) && !added.has(pid)) added.set(pid, { pid, role });
    const starts = processStarts([...added.keys()]);
    for (const member of added.values()) {
      const start = starts.get(member.pid) ?? null;
      const startedAt = process.platform === 'win32'
        ? (Number(start) - 621355968000000000) / 10000
        : Date.parse(start);
      // A late first refresh must not adopt a process born after the record was written.
      // Explicit track-only members have no record time and retain token matching.
      const foreign = member.at !== undefined && startedAt > member.at;
      tracked.set(member.pid, { ...member, start: member.at === undefined || startedAt <= member.at ? start : null, foreign });
    }
  };
  const track = (pid, role) => refresh(pid, role);
  const liveProcesses = () => {
    refresh();
    const members = [...tracked.values()].filter(member => !member.foreign && pidAlive(member.pid));
    const starts = processStarts(members.map(member => member.pid));
    // Teardown waits on an unreadable identity but never signals it.
    return members.filter(member => !member.start || !starts.has(member.pid) || starts.get(member.pid) === member.start);
  };
  const killRecorded = (pid, signal = 'SIGKILL', tree = true) => {
    refresh();
    const member = tracked.get(pid);
    if (member?.start && !member.foreign && processStarts([pid]).get(pid) === member.start) {
      if (tree) killProcessTree(pid, { signal, fallback: signal => { try { process.kill(pid, signal); } catch {} } });
      else { try { process.kill(pid, signal); } catch {} }
    }
  };
  const awaitExit = async () => {
    const deadline = Date.now() + RELAY_SIGNAL_GRACE_MS + RELAY_BACKSTOP_MS;
    while (liveProcesses().length && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
    return liveProcesses();
  };
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
  let actionError;
  try { return await action({ root, repo, lane, env, base, put, launch, args, records, readCalls, git, commit, track, killRecorded }); }
  catch (error) { actionError = error; throw error; }
  finally {
    try {
      for (const member of await awaitExit()) killRecorded(member.pid);
      remove(root, { recursive: true, force: true });
    }
    catch (cleanupError) {
      if (actionError) actionError.cleanupError = cleanupError;
      else throw cleanupError;
    }
  }
}
// req: R-3996
await check('R-3996: unchanged content reuses a full pass and edits force checks', () => fixture(({ root, lane, env, git, commit }) => {
  // Keep script/hash probes outside the lane, without editing this repository.
  const runner = join(root, 'scripts/check-lane.mjs');
  fs.mkdirSync(join(root, 'scripts'));
  fs.mkdirSync(join(root, 'packages/nana-pack/lib'), { recursive: true });
  fs.copyFileSync(new URL('../../../scripts/check-lane.mjs', import.meta.url), runner);
  fs.copyFileSync(new URL('../lib/test-runner-config.mjs', import.meta.url), join(root, 'packages/nana-pack/lib/test-runner-config.mjs'));
  const source = fs.readFileSync(runner, 'utf8');
  const record = join(git('rev-parse', '--absolute-git-dir'), LANE_CHECK_PASS_FILE);
  const preload = join(root, 'checks-preload.cjs');
  const mode = join(root, 'check-mode');
  // Exercise the real cache and git index, but never re-run project checks from a suite test.
  fs.writeFileSync(preload, `const cp=require('node:child_process'), fs=require('node:fs');
    const original=cp.spawnSync;
    if(fs.existsSync(${JSON.stringify(mode)}) && fs.readFileSync(${JSON.stringify(mode)},'utf8')==='node')
      Object.defineProperty(process,'version',{value:'v0.0.0-fixture'});
    cp.spawnSync=(command,args,options)=> {
      if(command!==process.execPath) return original(command,args,options);
      const mode=fs.existsSync(${JSON.stringify(mode)}) ? fs.readFileSync(${JSON.stringify(mode)},'utf8') : '';
      return mode==='crash' ? {status:null,signal:'SIGTERM'} : {status:mode==='fail'?1:0};
    };
    require('node:module').syncBuiltinESMExports();`);
  const run = (...args) => {
    const result = spawnSync(process.execPath, ['--require', preload, runner, ...args], { cwd: lane, env, encoding: 'utf8', timeout: 10000 });
    assert.equal(result.error, undefined);
    return result;
  };
  const full = (...args) => { const r=run(...args); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /running: requirements-trace/); assert.match(r.stdout, /check:lane: pass/); return r; };
  const reuse = () => { const started=Date.now(); const r=run(); assert.equal(r.status, 0, r.stderr); assert.match(r.stdout, /^check:lane: reusing pass recorded at .+; content key [a-f0-9]{64}\n$/); assert.ok(Date.now()-started<10000); return r; };
  full(); reuse();
  assert.equal(git('status', '--porcelain'), '', 'cache must stay outside the tree');
  fs.writeFileSync(join(lane, 'seed'), 'edited'); full(); reuse();
  fs.writeFileSync(join(lane, 'new file'), 'untracked'); full();
  commit(); reuse();
  full('--fresh'); reuse();
  for (const modeName of ['fail', 'crash']) {
    fs.writeFileSync(mode, modeName);
    const r=run('--fresh'); assert.equal(r.status, modeName==='fail'?1:2);
    assert.match(r.stderr, new RegExp(`check:lane: ${modeName==='fail'?'fail':'error'}: requirements-trace`));
    assert.equal((r.stdout.match(/check:lane: running:/g) ?? []).length, 1, 'stop at the first failed check');
    assert.equal(fs.existsSync(record), false, 'failures and crashes leave no pass record');
    fs.rmSync(mode); full(); reuse();
  }
  // A local exclude must not remove an already tracked file from the content key.
  fs.appendFileSync(git('rev-parse', '--git-path', 'info/exclude'), '\nseed\n');
  reuse(); fs.writeFileSync(join(lane, 'seed'), 'ignored but tracked'); full(); reuse();
  commit(); reuse();
  fs.writeFileSync(mode, 'node'); full(); reuse();
  fs.rmSync(mode); full(); reuse();
  fs.writeFileSync(runner, source + '\n// script hash probe\n'); full(); reuse();
  fs.writeFileSync(runner, source.replace('const checks = [', "const checks = [\n  ['fixture check', ['fixture.mjs']],")); full(); reuse();
  fs.writeFileSync(runner, source); full(); reuse();
  git('update-ref', 'refs/heads/main', 'HEAD'); full(); reuse();
  // Hold main and content fixed, changing only HEAD history so its merge base moves.
  const main = git('commit-tree', 'HEAD^{tree}', '-p', 'HEAD', '-m', 'same-tree main');
  git('update-ref', 'refs/heads/main', main); full(); reuse();
  const head = git('commit-tree', 'HEAD^{tree}', '-p', main, '-m', 'same-tree lane');
  git('update-ref', 'HEAD', head); full(); reuse();
  assert.equal(git('diff', '--cached'), '', 'temporary index must not stage files');
}));

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
  await fixture(async ({ root, lane, env, base, put, commit, launch }) => {
    put(lane, "throw Error('runner crash');"); commit();
    const crash = await checkLane({ cwd: lane, env, base }); assert.equal(crash.status, 'error');
    assert.match(crash.output, /runner crash/); assert.equal(crash.base, undefined);
    // Error is not a model-repair request.
    const r = launch(); assert.equal(r.calls.length, 1); assert.equal(r.end.laneChecks.status, 'error');
    const marker = join(root, 'deadline-check-started');
    put(lane, `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'ready'); setInterval(()=>{},1000);`); commit();
    let watcher;
    const ready = new Promise(resolve => {
      watcher = fs.watch(root, () => {
        if (fs.existsSync(marker)) { watcher.close(); resolve(); }
      });
    });
    try {
      const timeout = await checkLane({ cwd: lane, env, base, timeout: 100, signal: AbortSignal.timeout(CASE_LIMIT_MS),
        run: (command, args, options) => boundedSpawn(command, args, { ...options, ...(args.some(arg => arg.includes('check:lane')) ? { timeoutStart: ready } : {}) }),
      });
      assert.ok(fs.existsSync(marker), 'the deadline must stop a started check, not its preload');
      assert.equal(timeout.status, 'error'); assert.match(timeout.output, /ETIMEDOUT/);
    } finally { watcher.close(); }
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
    assert.match(prompt, /Fix your own change so the named check passes/);
    assert.match(prompt, /Do not edit a check, a test, a checker script or their configuration to make the check pass/);
    assert.match(prompt, /If you believe the check itself is wrong, stop without that edit and say so in your report/);
    assert.match(prompt, /commit.*stop/);
    const changedFiles = dirty ? ['added-test.mjs', 'leftover.txt'] : ['check.cjs'];
    assert.deepEqual(r.end.laneChecks.resume.changedFiles, changedFiles);
    assert.ok(r.stderr.includes(`pi-worker: lane checks: resume changed files: ${JSON.stringify(changedFiles)}\n`));
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

// req: R-4022
await check('fixture cleanup keeps an action error with its cleanup error attached or reports cleanup alone', async () => {
  for (const ending of ['\n', '\r\n', '']) {
    const starts = processStarts([42], { run: () => ({ stdout: ` 42 native-start-token \t${ending}` }) });
    assert.equal(starts.get(42), process.platform === 'win32' ? 'native-start-token' : 'native-start-token GMT');
    const utcStarts = processStarts([42], { platform: 'darwin', run: (command, args, options) => {
      assert.equal(options.env.TZ, 'UTC');
      return { stdout: ` 42 Sun Nov  1 06:30:00 2026 \t${ending}` };
    } });
    assert.equal(Date.parse(utcStarts.get(42)), Date.UTC(2026, 10, 1, 6, 30), 'UTC lstart tokens parse to the same epoch in every zone');
  }
  assert.throws(() => processStarts([42], { strict: true, run: () => ({ error: { code: 'ETIMEDOUT' } }) }), /process identity query failed: ETIMEDOUT/);
  assert.throws(() => processStarts([42], { strict: true, run: () => ({ status: 3221225794, stdout: '' }) }), /process identity query failed: status 3221225794/);
  assert.deepEqual(processStarts([42], { strict: true, run: () => ({ status: 1, stdout: '' }) }), new Map());
  const actionError = new Error('check tree is alive'), cleanupError = new Error('cleanup is busy');
  const remove = (root, options) => { fs.rmSync(root, options); throw cleanupError; };
  await assert.rejects(fixture(() => { throw actionError; }, null, { remove }), error => error === actionError && error.cleanupError === cleanupError);
  await assert.rejects(fixture(() => {}, null, { remove }), error => error === cleanupError);
  // Replay a pid reused before the first refresh: this child is not a fixture descendant.
  const unrelated = spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], { env: { ...process.env, NODE_OPTIONS: '' }, stdio: 'ignore' });
  const ended = new Promise(resolve => { unrelated.once('exit', resolve); unrelated.once('error', resolve); });
  try {
    await new Promise((resolve, reject) => { unrelated.once('spawn', resolve); unrelated.once('error', reject); });
    await fixture(({ root }) => {
      fs.writeFileSync(join(root, 'processes', String(unrelated.pid)), JSON.stringify({ pid: unrelated.pid, role: 'unrelated', at: Date.now() - 60000 }));
    });
    // Reap a killed child before checking: an unreaped POSIX pid still answers signal 0.
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(unrelated.exitCode === null && unrelated.signalCode === null && pidAlive(unrelated.pid), 'fixture cleanup killed an unrelated process with a reused recorded pid');
  } finally {
    if (unrelated.exitCode === null && unrelated.signalCode === null) unrelated.kill('SIGKILL');
    await ended;
  }
});

// req: R-4022
await check('R-4022: a stop during tip or base checks kills the check tree and removes the base checkout', async () => {
  for (const { onBase, relayDelay = 0 } of [
    { onBase: false }, { onBase: true },
    { onBase: false, relayDelay: 2 * RELAY_SIGNAL_GRACE_MS },
    { onBase: true, relayDelay: RELAY_BACKSTOP_MS + 2 * RELAY_SIGNAL_GRACE_MS },
  ]) await fixture(async ({ root, repo, lane, env, put, args, records, readCalls, track, killRecorded }) => {
    const actual = (assertion, value) => `onBase=${onBase}, relayDelay=${relayDelay}: ${assertion}; actual=${JSON.stringify(value)}`;
    const marker = join(root, 'check-started');
    if (!onBase) put(lane, checkSource(root, false));
    const stopFile = join(root, 'stop');
    const exitMarker = join(root, 'relay-exiting');
    if (relayDelay) {
      const preload = join(root, 'relay-exit.cjs');
      fs.writeFileSync(preload, `if(process.argv[1]?.endsWith('bounded-spawn-child.mjs')) {
        const exit=process.exit.bind(process); let pending=false;
        process.exit=code=>{
          if(code!==143) return exit(code);
          if(pending) return; pending=true;
          require('node:fs').writeFileSync(${JSON.stringify(exitMarker)}, String(Date.now()));
          setTimeout(()=>{require('node:fs').writeFileSync(${JSON.stringify(`${exitMarker}.done`)}, String(Date.now()));exit(code);}, ${relayDelay});
        };
      }`);
      env.NODE_OPTIONS = `${env.NODE_OPTIONS ?? ''} --require ${JSON.stringify(preload)}`;
    }
    if (process.platform === 'win32') {
      const preload = join(root, 'signal.cjs');
      fs.writeFileSync(preload, `const fs=require('node:fs'); const t=setInterval(()=>{if(fs.existsSync(${JSON.stringify(stopFile)})){clearInterval(t);process.emit('SIGTERM');}},20);t.unref();`);
      args.unshift('--import', pathToFileURL(preload).href);
    }
    const child = spawn(process.execPath, args, { cwd: lane, env, stdio: ['ignore', 'pipe', 'pipe'] });
    track(child.pid, 'worker');
    let stderr = ''; child.stderr.on('data', data => { stderr += data; }); child.stdout.resume();
    const ended = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })));
    let checkPids;
    try {
      const deadline = Date.now() + 15000;
      while (!fs.existsSync(marker) && child.exitCode === null && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 20));
      assert.ok(fs.existsSync(marker), actual('check-started marker exists', { exists: fs.existsSync(marker), stderr }));
      checkPids = JSON.parse(fs.readFileSync(marker, 'utf8'));
      track(child.pid, 'worker');
      for (const member of checkPids.pids) track(member.pid, member.role);
      const identities = identify(checkPids.pids.map(member => member.pid));
      assert.equal(checkPids.cwd === lane, !onBase, actual('check cwd matches lane', { cwd: checkPids.cwd, lane }));
      assert.ok(checkPids.pids.some(member => member.role === 'check'), actual('check pid recorded', checkPids.pids));
      assert.ok(checkPids.pids.some(member => member.role === 'child'), actual('child pid recorded', checkPids.pids));
      if (process.platform === 'win32' && checkPids.parentsReadable) {
        assert.ok(checkPids.pids.some(member => member.role === 'npm'), actual('npm node parent recorded', checkPids.pids));
        assert.ok(checkPids.pids.some(member => member.role === 'cmd.exe'), actual('cmd.exe parent recorded', checkPids.pids));
        assert.ok(checkPids.pids.some(member => member.role === 'relay'), actual('relay parent recorded', checkPids.pids));
      }
      // Windows has no POSIX signal delivery: exercise its handler with a local event.
      if (process.platform === 'win32') fs.writeFileSync(stopFile, 'stop');
      else killRecorded(child.pid, 'SIGTERM', false);
      const result = await Promise.race([ended, new Promise((_, reject) => { const t=setTimeout(()=>reject(Error('worker did not stop')),10000); t.unref(); })]);
      assert.equal(result.code, 143, actual('worker exit code', { ...result, stderr }));
      const end = records().at(-1); assert.equal(end.outcome, 'stopped', actual('build outcome', end.outcome)); assert.equal(end.signal, 'SIGTERM', actual('build signal', end.signal));
      assert.equal(end.laneChecks.status, 'stopped', actual('lane check status', end.laneChecks.status));
      const exitBound = RELAY_SIGNAL_GRACE_MS + RELAY_BACKSTOP_MS;
      if (relayDelay > exitBound) {
        assert.match(end.laneChecks.relayExitError, /did not exit within its signal grace plus backstop/, actual('relay exit bound error', end.laneChecks.relayExitError));
        assert.match(stderr, /lane checks relay:.*did not exit/, actual('relay exit diagnostic', stderr));
      } else assert.equal(end.laneChecks.relayExitError, undefined, actual('no relay exit error', end.laneChecks));
      if (relayDelay) {
        assert.ok(fs.existsSync(exitMarker), actual('relay entered delayed exit', fs.existsSync(exitMarker)));
        if (relayDelay < exitBound) {
          assert.ok(fs.existsSync(`${exitMarker}.done`), actual('relay exit marker exists before end record', fs.existsSync(`${exitMarker}.done`)));
          const relayEndedAt = Number(fs.readFileSync(`${exitMarker}.done`, 'utf8'));
          assert.ok(Date.parse(end.endedAt) >= relayEndedAt, actual('end record follows relay exit', { endedAt: end.endedAt, relayEndedAt }));
        } else assert.equal(fs.existsSync(`${exitMarker}.done`), false, actual('relay forced down at exit bound', fs.existsSync(`${exitMarker}.done`)));
      }
      assert.equal(end.laneChecks.cleanupError, undefined, actual('no cleanup error', end.laneChecks));
      const deadline2 = Date.now() + 5000;
      let remaining = survivors(identities);
      while (remaining.pids.length && Date.now() < deadline2) {
        await new Promise(resolve => setTimeout(resolve, 20));
        remaining = survivors(identities);
      }
      const members = [...new Map(checkPids.pids.map(member => [member.pid, member])).values()];
      const reused = members.filter(member => remaining.running.includes(member.pid) && !remaining.pids.includes(member.pid));
      let holders = [], holdersUnread = false;
      if (reused.length && process.platform === 'win32') {
        try { holders = windowsProcesses(); } catch { holdersUnread = true; }
      }
      for (const member of reused) {
        const holder = holders.find(row => row.pid === member.pid);
        const start = remaining.starts.get(member.pid);
        if (process.platform === 'win32' && holdersUnread) {
          console.log(`R-4022 note: ${member.role} pid ${member.pid} holder unread (start ${start ?? 'unreadable'})`);
        } else if (process.platform === 'win32' ? !holder && !start : !start) {
          console.log(`R-4022 note: ${member.role} pid ${member.pid} exited during the identity query`);
        } else {
          console.log(`R-4022 note: ${member.role} pid ${member.pid} now belongs to another process (${holder?.name ?? 'name unread'}, start ${start ?? 'unreadable'})`);
        }
      }
      for (const member of members) {
        const start = remaining.pids.includes(member.pid) ? identities.get(member.pid) : undefined;
        assert.equal(start, undefined, actual(`${member.role} pid ${member.pid} survived the stop`, start));
      }
      if (onBase) assert.equal(fs.existsSync(checkPids.cwd), false, actual('base checkout still exists', fs.existsSync(checkPids.cwd)));
      const worktrees = spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: repo, env, encoding: 'utf8' });
      assert.equal(worktrees.status, 0, actual('git worktree list exit code', { status: worktrees.status, stderr: worktrees.stderr }));
      const worktreeCount = (worktrees.stdout.match(/^worktree /gm) ?? []).length;
      assert.equal(worktreeCount, 2, actual('remaining worktree count', worktreeCount));
      const callCount = readCalls().length;
      assert.equal(callCount, 1, actual('builder call count', callCount));
    } finally {
      if (child.exitCode === null && child.signalCode === null) killRecorded(child.pid);
      if (checkPids) for (const member of checkPids.pids) killRecorded(member.pid);
    }
  }, onBase ? root => checkSource(root, true) : null);
  function checkSource(root, onBase) {
    return `${onBase ? `if (require('node:fs').existsSync('built-tip')) { ${red} } else ` : ''}{
      const cp=require('node:child_process'), fs=require('node:fs');
      const child=cp.spawn(process.execPath, ['-e', 'setInterval(()=>{},1000)'], {stdio:'ignore'});
      const pids=[{pid:process.pid,role:'check'},{pid:child.pid,role:'child'},{pid:process.ppid,role:'parent'}];
      let parentsReadable=false;
      if(process.platform==='win32') {
        const query=cp.spawnSync('powershell', ['-NoProfile','-Command', 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine | ConvertTo-Json -Compress'], {encoding:'utf8',windowsHide:true,timeout:10000});
        if(query.status===0) {
          const rows=JSON.parse(query.stdout), seen=new Set(), parents=[];
          let pid=process.ppid;
          while(pid && !seen.has(pid)) {
            seen.add(pid);
            const row=rows.find(item=>item.ProcessId===pid);
            if(!row || !/^(node|cmd)[.]exe$/i.test(row.Name)) break;
            const relay=String(row.CommandLine).includes('bounded-spawn-child.mjs');
            const role=relay?'relay':/npm-cli[.]js/i.test(row.CommandLine)?'npm':row.Name;
            parents.push({pid,role});
            if(relay) {parentsReadable=true;pids.push(...parents);break;}
            pid=row.ParentProcessId;
          }
        }
      }
      const marker=${JSON.stringify(join(root, 'check-started'))};
      fs.writeFileSync(marker+'.tmp', JSON.stringify({cwd:process.cwd(),pids,parentsReadable}));
      fs.renameSync(marker+'.tmp', marker);
      setInterval(()=>{},1000);
    }`;
  }
});
// req: R-4004
await check('resume rename diagnostics list both test paths', () => fixture(({ lane, put, launch, git }) => {
  put(lane, pass);
  git('config', 'diff.renames', 'true');
  const r = launch(); assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(r.end.laneChecks.resume.changedFiles, ['original-test.mjs', 'renamed-test.mjs', 'seed']);
  assert.match(r.stderr, /resume changed files: \["original-test.mjs","renamed-test.mjs","seed"\]/);
  assert.match(git('diff', '--name-status', 'HEAD~1', 'HEAD'), /R100\s+original-test.mjs\s+renamed-test.mjs/);
}, null, {
  first: "fs.writeFileSync('original-test.mjs', '// unchanged test content\\n');",
  afterCommit: "fs.writeFileSync('seed', 'uncommitted');",
  repair: "fs.renameSync('original-test.mjs', 'renamed-test.mjs'); commit();",
}));

// req: R-4022
await check('stop during base checkout add lets git finish before removing its worktree entry', () => fixture(async ({ repo, lane, env, base }) => {
  const controller = new AbortController();
  let added = false;
  const run = async (command, args, options) => {
    if (command === 'git' && args[0] === 'worktree' && args[1] === 'add') {
      added = true;
      // Abort exactly at the add boundary; it must not interrupt git's locked metadata transaction.
      controller.abort('SIGTERM');
      assert.equal(options.signal, undefined, 'base checkout add: git must not receive the abort signal');
    }
    return boundedSpawn(command, args, options);
  };
  const result = await checkLane({ cwd: lane, env, base, signal: controller.signal, run });
  assert.equal(added, true, 'base checkout add: add boundary was reached');
  assert.equal(result.status, 'stopped', 'base checkout add: check status');
  assert.equal(result.cleanupError, undefined, 'base checkout add: cleanup error');
  const trees = spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: repo, env, encoding: 'utf8', timeout: 10000 });
  assert.equal(trees.status, 0, `base checkout add: worktree list failed: ${trees.stderr}`);
  assert.equal((trees.stdout.match(/^worktree /gm) ?? []).length, 2, 'base checkout add: only main and lane worktrees remain');
}, red));

// req: R-3997
await check('a check with an escaped output-pipe holder still returns at the relay deadline', () => fixture(async ({ root, lane, env, put, commit, track, killRecorded }) => {
  const marker = join(root, 'pipe-holder');
  const holder = `const fs=require('node:fs'), marker=${JSON.stringify(marker)};
    fs.writeFileSync(marker+'.tmp', String(process.pid)); fs.renameSync(marker+'.tmp', marker); setTimeout(()=>{},15000);`;
  put(lane, `const cp=require('node:child_process');
    cp.spawn(process.execPath, ['-e', ${JSON.stringify(holder)}], {detached:true, stdio:['ignore',1,2]}).unref();`);
  commit();
  let watcher, started;
  const ready = new Promise(resolve => {
    watcher = fs.watch(root, () => {
      if (!fs.existsSync(marker)) return;
      started = Date.now(); watcher.close(); resolve();
    });
  });
  const controller = new AbortController();
  const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(CASE_LIMIT_MS)]);
  const running = checkLane({ cwd: lane, env, signal, timeout: 100,
    run: (command, args, options) => boundedSpawn(command, args, { ...options, ...(args.some(arg => arg.includes('check:lane')) ? { timeoutStart: ready } : {}) }),
  });
  try {
    const result = await running;
    assert.ok(started, 'the fixture must actually start its pipe holder');
    assert.equal(result.status, 'error'); assert.match(result.output, /ETIMEDOUT/);
    assert.ok(Date.now() - started < RELAY_SETTLE_MS + 2000, 'pipe holder delayed the relay result');
  } finally {
    watcher.close(); controller.abort('SIGTERM');
    await running;
    if (fs.existsSync(marker)) {
      const pid = Number(fs.readFileSync(marker, 'utf8'));
      track(pid, 'pipe-holder'); killRecorded(pid);
    }
  }
}));

// req: R-3997
await check('off Windows, a hard-killed check caller leaves no running check tree', async () => {
  if (process.platform === 'win32') { console.log('SKIP parent-death relay polling is POSIX-only'); return; }
  await fixture(async ({ root, lane, env, put, commit, track, killRecorded }) => {
    const marker = join(root, 'orphan-check');
    put(lane, `const cp=require('node:child_process'), fs=require('node:fs');
      const child=cp.spawn(process.execPath, ['-e', 'setTimeout(()=>{},15000)'], {stdio:'ignore'});
      const marker=${JSON.stringify(marker)};
      fs.writeFileSync(marker+'.tmp', JSON.stringify({pid:process.pid, child:child.pid}));
      fs.renameSync(marker+'.tmp', marker); setTimeout(()=>{},15000);`);
    commit();
    const module = new URL('../lib/lane-checks.mjs', import.meta.url).href;
    const caller = spawn(process.execPath, ['--input-type=module', '-e', `import {checkLane} from ${JSON.stringify(module)}; await checkLane({cwd:process.cwd(),env:process.env,timeout:10000});`], { cwd: lane, env, stdio: 'ignore' });
    track(caller.pid, 'caller');
    const ended = new Promise(resolve => caller.once('exit', resolve));
    let pids;
    try {
      const startDeadline = Date.now() + 5000;
      while (!fs.existsSync(marker) && caller.exitCode === null && Date.now() < startDeadline) await new Promise(resolve => setTimeout(resolve, 20));
      assert.ok(fs.existsSync(marker), 'check did not start'); pids = JSON.parse(fs.readFileSync(marker, 'utf8'));
      track(caller.pid, 'caller'); track(pids.pid, 'check'); track(pids.child, 'child');
      const identities = identify([pids.pid, pids.child]);
      killRecorded(caller.pid); await ended;
      const deadline = Date.now() + RELAY_PARENT_POLL_MS + RELAY_SIGNAL_GRACE_MS + 2000;
      let remaining = survivors(identities);
      while (remaining.pids.length && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 20));
        remaining = survivors(identities);
      }
      assert.deepEqual(remaining.pids, []);
    } finally {
      if (caller.exitCode === null && caller.signalCode === null) killRecorded(caller.pid);
      if (pids) for (const pid of [pids.pid, pids.child]) killRecorded(pid);
    }
  });
});
process.exitCode = failures ? 1 : 0;
