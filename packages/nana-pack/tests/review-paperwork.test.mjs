/**
 * @module packages/nana-pack/tests/review-paperwork.test.mjs
 * @purpose Pin the ten review-paperwork must-meets with isolated recording reviewers and land fixtures.
 * @inputs Real launchers, temporary stores, synthetic Claude/pi commands and injected CI responses.
 * @outputs Ten awaited PASS/FAIL cases and nonzero status on failure.
 * @effects disk (OS temporary fixtures), process (bounded git and fake reviewer processes)
 * @errors Assertions or per-case deadlines fail the case.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from './fake-pi.mjs';
import { repo, tree, commit, git, ciFixture, ensureCiReview, workflowRun, runList, gitRunner } from './land-fixtures.mjs';
const root = fileURLToPath(new URL('../../../', import.meta.url));
const pack = process.env.NANA_TEST_PAPERWORK_PACK ?? path.join(root, 'packages/nana-pack');
const { runLand } = await import(pathToFileURL(path.join(pack, 'bin/nana-land.mjs')));
const store = await import(pathToFileURL(path.join(pack, 'bin/review-round.mjs')));
const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), 'review paperwork ')));
const cases = [];
const test = (title, fn) => cases.push({ title, fn });
const write = (p, text) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); };
const read = p => fs.readFileSync(p, 'utf8');
const rows = p => fs.existsSync(p) ? read(p).split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
const good = r => assert.equal(r.status, 0, r.stderr);
let serial = 0;
function fixture() {
  const dir = path.join(temp, String(++serial)); fs.mkdirSync(dir);
  const checkout = repo(dir, 'spaced checkout');
  const home = path.join(dir, 'home'), agent = path.join(home, '.pi/agent'), bin = path.join(dir, 'fake bin');
  const brief = path.join(checkout, 'brief folder/review.md'), out = path.join(dir, 'out folder/review.md'), record = path.join(dir, 'calls.jsonl');
  write(brief, 'Feature: FEAT-007 · Fixture\r\nReview `base.txt`. \t');
  git(checkout, 'add', '.'); git(checkout, 'commit', '-m', 'brief');
  fs.mkdirSync(path.dirname(out), { recursive: true });
  write(path.join(agent, 'nana-pack.json'), JSON.stringify({ roster: { scout: null, builder: { provider: 'fixture', model: 'fixture', thinking: null }, reviewer: { runtime: 'claude-code', model: 'fable' } } }));
  const body = `const fs=require('node:fs');let text='';process.stdin.on('data',c=>text+=c);process.stdin.on('end',()=>{
const argv=process.argv.slice(2), settings=argv.includes('--settings')?argv[argv.indexOf('--settings')+1]:null;
fs.appendFileSync(process.env.RECORD,JSON.stringify({argv,stdin:text,ppid:process.ppid,settings,settingsText:settings?fs.readFileSync(settings,'utf8'):null})+'\\n');
function done(){process.stdout.write(process.env.ANSWER||'Review done.\\nVERDICT: LAND\\n');process.exitCode=Number(process.env.CHILD_STATUS||0);}
function poll(){if(process.env.RELEASE&&!fs.existsSync(process.env.RELEASE))setTimeout(poll,20);else done();}poll();});`;
  const script = path.join(bin, 'fixture.cjs'); write(script, body);
  if (process.platform === 'win32') write(path.join(bin, 'claude.cmd'), `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`);
  else { write(path.join(bin, 'claude'), `#!${process.execPath}\nrequire(${JSON.stringify(script)});\n`); fs.chmodSync(path.join(bin, 'claude'), 0o755); }
  const piBody = `const fs=require('node:fs');const argv=process.argv.slice(2);const prompts=[];for(let i=0;i<argv.length;i++)if(argv[i]==='--append-system-prompt'){const v=argv[++i];prompts.push(fs.existsSync(v)?fs.readFileSync(v,'utf8'):v);}fs.appendFileSync(process.env.RECORD,JSON.stringify({argv,prompts})+'\\n');console.log('Review done.\\nVERDICT: LAND');`;
  if (process.platform === 'win32') writeFakePi(bin, piBody);
  else { write(path.join(bin, 'pi'), `#!${process.execPath}\n${piBody}`); fs.chmodSync(path.join(bin, 'pi'), 0o755); }
  const env = { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: agent, CLAUDE_CONFIG_DIR: path.join(home, '.claude'), PATH: `${bin}${path.delimiter}${process.env.PATH}`, RECORD: record };
  return { dir, checkout, home, agent, bin, brief, out, record, env, item: 'fixture' };
}
function argv(f, launcher = 'claude-review', extra = []) {
  const common = ['--item', f.item, '--tree', f.checkout, '--out', f.out];
  return [path.join(pack, 'bin', `${launcher}.mjs`), ...common, ...(launcher === 'claude-review' ? ['--brief', f.brief, ...extra] : ['--retries', '0', ...extra, '--', '--append-system-prompt', f.brief, '-p', 'review'])];
}
const launch = (f, launcher = 'claude-review', extra = [], env = f.env) => spawnSync(process.execPath, argv(f, launcher, extra), { cwd: f.dir, env, encoding: 'utf8', timeout: 25_000 });
const tally = f => rows(store.ledgerPaths(f.home).tally);
function seedLegacy(f) {
  const legacy = [
    { v: 1, kind: 'round', repo: 'path:/old/mac checkout', item: 'old', revision: 'old-a', round: 9, overCap: 'historic reason', text: { sha256: 'a'.repeat(64), bytes: 42 } },
    { v: 2, kind: 'round', repo: 'path:C:\\old checkout\\.git', item: 'old', revision: 'old-b', round: 10, override: 'historic', verdict: 'LAND' },
  ];
  // Each record may carry trailing blanks, but an empty physical record is invalid.
  write(store.ledgerPaths(f.home).tally, legacy.map(r => JSON.stringify(r) + ' \t').join('\r\n'));
  return read(store.ledgerPaths(f.home).tally);
}
function appendLegacySeparator(f) { fs.appendFileSync(store.ledgerPaths(f.home).tally, '\r\n'); }
function land(f, reviewed = [`${git(f.feature, 'rev-parse', 'HEAD')}=item`], options = {}) {
  return runLand({ tree: f.feature, main: f.main, home: f.home, suite: 'fixture', reviewed, runCommand: () => ({ status: 0 }), runGh: () => ({ status: 0, stdout: runList([workflowRun({ path: '.github/workflows/ci.yml' })]) }), keepLandCiRecords: () => ({ lines: [], notes: [] }), ...options });
}
// req: R-3765
test('M1: Claude launches alone and records verified v2 with child status', async () => {
  const f = fixture(); const r = launch(f); good(r);
  const row = tally(f).at(-1), call = rows(f.record)[0];
  assert.equal(row.v, 2); assert.equal(row.verdict, 'LAND'); assert.notEqual(row.unverified, true); assert.equal(row.revision, git(f.checkout, 'rev-parse', 'HEAD'));
  if (process.platform !== 'win32') assert.equal(call.ppid, r.pid, 'no ledger intermediary');
  assert.equal(JSON.parse(read(path.join(pack, 'package.json'))).bin['review-ledger'], undefined);
  assert.equal(fs.existsSync(path.join(pack, 'bin/review-ledger.mjs')), false);
  const failed = launch(f, 'claude-review', [], { ...f.env, CHILD_STATUS: '7' }); assert.equal(failed.status, 7, failed.stderr);
});
// req: R-3766
test('M2: both prompts omit movement and use only the brief feature known bugs', async () => {
  for (const newline of ['\r\n', '\n']) {
    const f = fixture();
    write(path.join(f.checkout, 'REQUIREMENTS.md'), '# CAP-01 · Fixture\nPurpose: Test\n\n## FEAT-006 · Changed\nPurpose: Test\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | Fixture. | planned | |\n');
    git(f.checkout, 'add', '.'); git(f.checkout, 'commit', '-m', 'ledger');
    write(path.join(f.checkout, 'REQUIREMENTS.md'), read(path.join(f.checkout, 'REQUIREMENTS.md')).replace('Fixture.', 'Changed.'));
    git(f.checkout, 'add', '.'); git(f.checkout, 'commit', '-m', 'changed row');
    write(f.brief, `Feature: FEAT-007 · Fixture${newline}Review. \t`);
    write(path.join(f.checkout, 'docs/known-bugs/FEAT-007.md'), `# Bugs${newline}${newline}- BRIEF_BUG \t`);
    write(path.join(f.checkout, 'docs/known-bugs/FEAT-006.md'), '# Bugs\n\n- OTHER_BUG\n');
    good(launch(f)); good(launch(f, 'pi-review'));
    const calls = rows(f.record), claude = calls[0].stdin, pi = calls[1].prompts.join('\n');
    for (const prompt of [claude, pi]) { assert.ok(prompt.includes('BRIEF_BUG \t')); assert.ok(!prompt.includes('OTHER_BUG')); assert.ok(!prompt.includes('## Tree movement')); assert.ok(!prompt.includes('tree movement:')); }
  }
});
// req: R-3767 R-2566
test('M3: both launchers record fourth revisions and refuse removed flag', async () => {
  for (const launcher of ['claude-review', 'pi-review']) {
    const f = fixture();
    for (let i = 0; i < 4; i++) { commit(f.checkout, 'base.txt', `${i}\n`, `revision ${i}`); good(launch(f, launcher)); }
    assert.equal(tally(f).length, 4);
    const r = launch(f, launcher, ['--over-cap', 'old reason']); assert.notEqual(r.status, 0); assert.match(r.stderr, /round caps were removed/i); assert.equal(tally(f).length, 4);
  }
});
// req: R-3768
test('M4: land needs LAND coverage plus CI but no kept texts', async () => {
  const f = ciFixture('paperwork-land'); ensureCiReview(f);
  fs.rmSync(store.ledgerPaths(f.home).texts, { recursive: true });
  const r = land(f); assert.equal(r.code, 0, r.text); assert.doesNotMatch(r.text, /review text relied on|kept.*text|pre-store/i); assert.equal(git(f.main, 'rev-parse', 'HEAD'), f.tip);
  for (const kind of ['no-land', 'non-land', 'in-flight', 'uncovered']) {
    const g = ciFixture(`paperwork-${kind}`); ensureCiReview(g); const before = git(g.main, 'rev-parse', 'HEAD');
    if (kind === 'no-land') write(store.ledgerPaths(g.home).tally, '');
    if (kind === 'non-land') { const a = store.admit(['--item', 'other', '--tree', g.feature], { home: g.home }); assert.ok(a.ok); assert.ok(store.complete(a.res, '', { home: g.home, text: 'VERDICT: SEND-BACK' }).ok); }
    if (kind === 'in-flight') assert.ok(store.admit(['--item', 'live', '--tree', g.feature], { home: g.home }).ok);
    if (kind === 'uncovered') commit(g.feature, 'later.txt', 'later\n', 'uncovered');
    const refused = land(g, g.reviewed); assert.equal(refused.code, 1, refused.text); assert.equal(git(g.main, 'rev-parse', 'HEAD'), before);
    assert.match(refused.text, kind === 'no-land' ? /no verified/ : kind === 'non-land' ? /non-LAND/ : kind === 'in-flight' ? /in flight/ : /uncovered/);
  }
});
// req: R-3769
test('M5: both launchers and land preserve old store records and path spellings', async () => {
  const f = fixture(), original = seedLegacy(f);
  assert.equal(store.readRounds(f.home).length, 2); appendLegacySeparator(f);
  good(launch(f)); good(launch(f, 'pi-review')); assert.ok(read(store.ledgerPaths(f.home).tally).startsWith(original));
  const g = ciFixture('paperwork-legacy'); ensureCiReview(g);
  const oldRows = tally(f).slice(0, 2); fs.appendFileSync(store.ledgerPaths(g.home).tally, oldRows.map(JSON.stringify).join('\r\n'));
  const before = read(store.ledgerPaths(g.home).tally); assert.equal(land(g).code, 0); assert.equal(read(store.ledgerPaths(g.home).tally), before);
});
// req: R-3770
test('M6: removed paths are gone and git report clients share the rehomed runner', async () => {
  for (const p of ['bin/review-ledger.mjs', 'lib/review-movement.mjs', 'lib/review-movement-config.mjs']) assert.equal(fs.existsSync(path.join(pack, p)), false, p);
  assert.equal(fs.existsSync(path.join(root, 'scripts/requirements-moved.mjs')), false);
  const helpers = await import(pathToFileURL(path.join(root, 'scripts/git-runner.mjs')));
  assert.equal(helpers.MAX_GIT_BUFFER, 64 * 1024 * 1024);
  for (const name of ['component-audit', 'deliverables', 'product-report']) assert.match(read(path.join(root, `scripts/${name}.mjs`)), /from ["']\.\/git-runner\.mjs["']/);
  const actual = helpers.defaultGit(root, ['status', '--porcelain']); const expected = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8', maxBuffer: helpers.MAX_GIT_BUFFER });
  assert.equal(actual.status, expected.status); assert.equal(actual.stdout, expected.stdout); assert.equal(actual.stderr, expected.stderr);
});
// req: R-3771
test('M7: rules drop paperwork and shared marker remains equal', async () => {
  for (const rel of ['templates/_shared/working-under-nana-pi.md', 'AGENTS.md', 'OBJECTIVE.md', 'templates/_shared/OBJECTIVE.md', 'packages/nana-setup/claude/rules/nana-seat.md', 'packages/nana-pack/README.md', 'packages/nana-pack/skills/requirements/SKILL.md']) {
    assert.doesNotMatch(read(path.join(root, rel)), /review-ledger keep|tree[ -]movement|three rounds|capped at three|over.cap reason|confirmation round over cap|Review corpus:/i, rel);
  }
  const agents = read(path.join(root, 'AGENTS.md'));
  assert.equal(agents.split('<!-- nana:working-under-nana-pi begin -->\n')[1].split('<!-- nana:working-under-nana-pi end -->')[0], read(path.join(root, 'templates/_shared/working-under-nana-pi.md')));
});
// req: R-3772
test('M8: changed HEAD refuses Claude LAND and releases with legacy records intact', async () => {
  const f = fixture(); const original = seedLegacy(f); appendLegacySeparator(f);
  const admittedHead = git(f.checkout, 'rev-parse', 'HEAD'), release = path.join(f.dir, 'release');
  const child = spawn(process.execPath, argv(f), { cwd: f.dir, env: { ...f.env, RELEASE: release }, stdio: ['ignore', 'ignore', 'pipe'], timeout: 25_000, killSignal: 'SIGKILL' });
  let stderr = ''; child.stderr.on('data', c => stderr += c);
  const closed = new Promise((resolve, reject) => { child.once('error', reject); child.once('close', resolve); });
  const deadline = Date.now() + 15_000;
  while (!rows(f.record).length && Date.now() < deadline && child.exitCode === null) await new Promise(r => setTimeout(r, 20));
  assert.equal(rows(f.record).length, 1, stderr);
  const now = commit(f.checkout, 'base.txt', 'changed\n', 'changed while reviewing'); write(release, 'go');
  assert.notEqual(await closed, 0, stderr);
  assert.ok(tally(f).filter(r => [admittedHead, now].includes(r.revision)).every(r => r.unverified === true || r.verdict !== 'LAND'));
  assert.equal(fs.readdirSync(store.ledgerPaths(f.home).resDir).length, 0); assert.ok(read(store.ledgerPaths(f.home).tally).startsWith(original));
  const main = tree(f.checkout, 'main-copy'); git(main, 'checkout', '--detach');
  // Use the fixture's original main checkout and a lane source to exercise real refusal.
  git(f.checkout, 'checkout', '-b', 'feat/drift'); git(main, 'checkout', 'main');
  const refused = runLand({ tree: f.checkout, main, home: f.home, suite: 'fixture', reviewed: [`${now}=fixture`], runCommand: () => ({ status: 0 }) });
  assert.equal(refused.code, 1); assert.match(refused.text, /no verified/);
});
// req: R-3773
test('M9: final locked check catches non-LAND or reservation introduced during CI', async () => {
  for (const kind of ['non-land', 'reservation']) {
    const f = ciFixture(`paperwork-final-${kind}`); ensureCiReview(f); const before = git(f.main, 'rev-parse', 'HEAD'); let injected = false, merges = 0;
    const r = land(f, f.reviewed, {
      runGit: (cwd, args) => { if (args[0] === 'merge') merges++; return gitRunner(cwd, args); },
      runGh: () => { if (!injected) { injected = true; const a = store.admit(['--item', 'late', '--tree', f.feature], { home: f.home }); assert.ok(a.ok); if (kind === 'non-land') assert.ok(store.complete(a.res, '', { home: f.home, text: 'VERDICT: SEND-BACK' }).ok); } return { status: 0, stdout: runList([workflowRun({ path: '.github/workflows/ci.yml' })]) }; },
    });
    assert.ok(injected); assert.equal(r.code, 1, r.text); assert.match(r.text, kind === 'non-land' ? /non-LAND/ : /in flight/); assert.equal(merges, 0); assert.equal(git(f.main, 'rev-parse', 'HEAD'), before);
  }
});
// req: R-3774
test('M10: native Claude shim keeps spaced argv prompt and sealed settings with cleanup', async () => {
  const f = fixture();
  write(path.join(f.home, '.claude/settings.json'), JSON.stringify({ env: { GIT_CONFIG_PARAMETERS: "'credential.helper=fixture-hostile'", GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'credential.helper', GIT_CONFIG_VALUE_0: 'fixture-hostile', GIT_ASKPASS: 'fixture-hostile', SSH_ASKPASS: 'fixture-hostile' } }));
  const text = 'Feature: FEAT-007 · Fixture\r\nQuotes "100%" and bang!\r\nTrailing tab\t'; write(f.brief, text);
  const settingsTemp = path.join(f.dir, 'settings folder'); fs.mkdirSync(settingsTemp);
  Object.assign(f.env, { TMPDIR: settingsTemp, TEMP: settingsTemp, TMP: settingsTemp });
  const r = launch(f); good(r); const call = rows(f.record)[0];
  assert.ok(call.stdin.startsWith(text)); assert.equal(call.argv[call.argv.indexOf('--model') + 1], 'fable'); assert.equal(call.argv[call.argv.indexOf('--settings') + 1], call.settings);
  assert.ok(call.settings.includes(' '), 'settings path inherits spaced temp root');
  const effective = JSON.parse(call.settingsText).env;
  assert.equal(effective.GIT_ASKPASS, ''); assert.equal(effective.SSH_ASKPASS, ''); assert.equal(effective.GIT_TERMINAL_PROMPT, '0'); assert.equal(effective.GCM_INTERACTIVE, 'never');
  assert.ok(effective.GIT_CONFIG_PARAMETERS.endsWith("'credential.helper=' 'core.askPass='"));
  const n = Number(effective.GIT_CONFIG_COUNT); assert.equal(effective[`GIT_CONFIG_KEY_${n - 2}`], 'credential.helper'); assert.equal(effective[`GIT_CONFIG_VALUE_${n - 2}`], ''); assert.equal(effective[`GIT_CONFIG_KEY_${n - 1}`], 'core.askPass'); assert.equal(effective[`GIT_CONFIG_VALUE_${n - 1}`], '');
  assert.equal(tally(f).at(-1).verdict, 'LAND'); assert.ok(!fs.existsSync(call.settings)); assert.ok(!fs.existsSync(path.dirname(call.settings)));
  if (process.platform !== 'win32') console.log('  Windows claude.cmd execution awaits the Windows CI leg; native sealing exercised here.');
});
let failures = 0;
for (const { title, fn } of cases) {
  if (process.env.NANA_TEST_PAPERWORK_CASE && !title.startsWith(process.env.NANA_TEST_PAPERWORK_CASE + ':')) continue;
  let timer;
  try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case limit')), 90_000); })]); console.log('PASS', title); }
  catch (error) { failures++; console.log('FAIL', title, error.message); }
  finally { clearTimeout(timer); }
}
fs.rmSync(temp, { recursive: true, force: true });
process.exitCode = failures ? 1 : 0;
