/**
 * @module packages/nana-pack/tests/credential-strip.test.mjs
 * @purpose Pin M1-M3 and M5-M7 using isolated credential programs and synthetic model children.
 * @inputs Checkout launchers, temporary HOME/config/helper/askpass and fake pi/Claude commands.
 * @outputs Tagged PASS/FAIL results containing fixture booleans only.
 * @effects disk (OS temp fixtures), process (bounded git and fake model children)
 * @errors Assertion failures set exit 1; fixture setup failures throw.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from './fake-pi.mjs';
import { CLAUDE_CODE_SUBAGENT_MODELS } from '../bin/worker-config.mjs';
import { RUN_ALONE } from '../lib/test-runner-config.mjs';
import { reviewLaunch } from '../bin/review-launch.mjs';
import { resolveLayout } from '../../nana-setup/lib/paths.mjs';
import { stepPath } from '../../nana-setup/lib/steps.mjs';

const pack = fileURLToPath(new URL('../', import.meta.url));
const root = path.resolve(pack, '../..');
const temp = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), 'credential-strip-')));
// chosen: fixture cases must finish well before the suite's per-file watchdog.
const CASE_MS = 30_000;
// chosen: a fixture credential lookup must neither prompt nor outlast its parent case.
const PROBE_MS = 3_000;
let failures = 0;
async function check(title, fn) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('case limit')), CASE_MS); })]);
    console.log('PASS', title);
  } catch (error) { failures++; console.log('FAIL', title, error.message); }
  finally { clearTimeout(timer); }
}
const home = path.join(temp, 'home'), bin = path.join(temp, 'bin'), repo = path.join(temp, 'repo'), lane = path.join(temp, 'lane');
const agent = path.join(home, '.pi/agent'), claude = path.join(home, '.claude');
for (const dir of [home, bin, repo, agent, claude]) fs.mkdirSync(dir, { recursive: true });
const envBase = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^(GIT_|GCM_|SSH_ASKPASS|NANA_|PI_CODING_AGENT_DIR|CLAUDE_CONFIG_DIR)/i.test(key)));
const base = { ...envBase, HOME: home, USERPROFILE: home, XDG_CONFIG_HOME: path.join(home, '.config'), PI_CODING_AGENT_DIR: agent, CLAUDE_CONFIG_DIR: claude, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: path.join(home, '.gitconfig'), PATH: `${bin}${path.delimiter}${process.env.PATH}`, GIT_TERMINAL_PROMPT: '0' };
function run(command, args, env = base, cwd = repo, options = {}) {
  const r = spawnSync(command, args, { ...options, env, cwd, encoding: 'utf8', timeout: CASE_MS });
  assert.equal(r.error, undefined, r.error?.code);
  return r;
}
function git(...args) {
  const r = run('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args]);
  assert.equal(r.status, 0, 'fixture git setup');
  return r.stdout.trim();
}
fs.writeFileSync(base.GIT_CONFIG_GLOBAL, '');
git('init', '-q', '-b', 'main');
fs.writeFileSync(path.join(repo, 'seed'), 'fixture\n');
fs.writeFileSync(path.join(repo, 'brief.md'), 'Serves: roadmap step 3: exercise isolation.\nValidation: fixture run.\nFixture review.\n\nPrecedent:\n- seed\n');
git('add', 'seed', 'brief.md'); git('commit', '-qm', 'fixture'); git('worktree', 'add', '-qb', 'feat/fixture', lane);
const program = path.join(temp, 'program.cjs'), marker = path.join(temp, 'invoked');
fs.writeFileSync(program, `require('node:fs').appendFileSync(process.env.FIXTURE_MARKER, process.argv[2] + '\\n');\nif(process.argv[2] === 'helper') process.stdout.write('username=fixture\\npassword=fixture-only\\n'); else process.stdout.write('fixture-only\\n');\n`);
const slash = (p) => p.replaceAll('\\', '/');
const helper = `!"${slash(process.execPath)}" "${slash(program)}" helper`;
const askpass = path.join(temp, 'askpass.sh');
fs.writeFileSync(askpass, `#!/bin/sh\nexec "${slash(process.execPath)}" "${slash(program)}" askpass\n`, { mode: 0o755 });
const probe = path.join(temp, 'probe.cjs'), record = path.join(temp, 'record.json');
fs.writeFileSync(probe, `const fs=require('node:fs'), {spawnSync}=require('node:child_process');
const argv=process.argv.slice(2), at=argv.indexOf('--settings');
const project=JSON.parse(fs.readFileSync(process.env.FIXTURE_PROJECT,'utf8')).env;
const flag=at<0?null:JSON.parse(fs.readFileSync(argv[at+1],'utf8')).env;
function sample(env){
 fs.rmSync(process.env.FIXTURE_MARKER,{force:true});
 const r=spawnSync('git',['credential','fill'],{env,encoding:'utf8',timeout:${PROBE_MS},input:'protocol=https\\nhost=github.com\\nusername=fixture\\n\\n'});
 const cfg=spawnSync('git',['config','--get','core.autocrlf'],{env,encoding:'utf8',timeout:${PROBE_MS}});
 return {password:/^password=/m.test(r.stdout||''),fixture:/password=fixture-only/m.test(r.stdout||''),invoked:fs.existsSync(process.env.FIXTURE_MARKER),bounded:!r.error,config:(cfg.stdout||'').trim()};
}
const raw=sample(process.env), effective=process.env.FIXTURE_CLAUDE?sample({...process.env,...project,...(flag??{})}):raw;
fs.writeFileSync(process.env.FIXTURE_RECORD,JSON.stringify({raw,effective,flag:!!flag}));
process.stdout.write('Fixture complete.\\nVERDICT: LAND\\n');
`);
const modelBody = `require(${JSON.stringify(probe)});`;
if (process.platform === 'win32') {
  writeFakePi(bin, modelBody);
  fs.writeFileSync(path.join(bin, 'claude.cmd'), `@echo off\r\n"${process.execPath}" "${probe}" %*\r\n`);
} else {
  for (const name of ['pi', 'claude']) fs.writeFileSync(path.join(bin, name), `#!${process.execPath}\n${modelBody}\n`, { mode: 0o755 });
}
const roster = { scout: null, builder: { provider: 'fixture', model: 'fixture', thinking: null }, largerBuilder: { runtime: 'claude-code', model: CLAUDE_CODE_SUBAGENT_MODELS[0] }, reviewer: { runtime: 'claude-code', model: CLAUDE_CODE_SUBAGENT_MODELS[0] }, land: null };
fs.writeFileSync(path.join(agent, 'nana-pack.json'), JSON.stringify({ roster }));
const project = path.join(claude, 'settings.json');
let serial = 0;
const records = [];
function fixture(route) {
  fs.writeFileSync(base.GIT_CONFIG_GLOBAL, '');
  const env = { ...base, FIXTURE_MARKER: marker, FIXTURE_RECORD: record, FIXTURE_PROJECT: project };
  const unrelated = route === 'counted' ? { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'core.autocrlf', GIT_CONFIG_VALUE_0: 'input' } : { GIT_CONFIG_PARAMETERS: "'core.autocrlf=true'" };
  Object.assign(env, unrelated);
  if (route === 'global') fs.writeFileSync(base.GIT_CONFIG_GLOBAL, `[credential]\n\thelper = ${JSON.stringify(helper)}\n`);
  if (route === 'parameters') env.GIT_CONFIG_PARAMETERS += ` 'credential.helper=${helper}'`;
  if (route === 'counted') Object.assign(env, { GIT_CONFIG_COUNT: '2', GIT_CONFIG_KEY_1: 'credential.helper', GIT_CONFIG_VALUE_1: helper });
  if (route === 'git-askpass') env.GIT_ASKPASS = askpass;
  if (route === 'core-askpass') env.GIT_CONFIG_PARAMETERS += ` 'core.askPass=${slash(askpass)}'`;
  if (route === 'ssh-askpass') env.SSH_ASKPASS = askpass;
  fs.writeFileSync(project, JSON.stringify({ env: { GIT_CONFIG_PARAMETERS: `'credential.helper=${helper}'`, GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'credential.helper', GIT_CONFIG_VALUE_0: helper, GIT_ASKPASS: askpass, SSH_ASKPASS: askpass } }));
  fs.mkdirSync(path.join(lane, '.claude'), { recursive: true });
  fs.writeFileSync(path.join(lane, '.claude/settings.json'), fs.readFileSync(project));
  return env;
}
const layout = resolveLayout({ home });
fs.mkdirSync(layout.binDir, { recursive: true });
assert.ok(stepPath(layout, { dryRun: false }).every((row) => row.status !== 'PROBLEM'));
console.log(`  installed temporary PATH launchers: ${process.platform}; fixture helper and askpass only`);
const routes = ['global', 'parameters', 'counted', 'git-askpass', 'core-askpass', 'ssh-askpass'];
function matrix(entries) {
  for (const entry of entries) for (const route of routes) {
    const env = fixture(route);
    fs.rmSync(record, { force: true });
    // Positive control is deliberately unstripped but uses only the isolated fixture config.
    assert.equal(run(process.execPath, [probe], env).status, 0);
    const parent = JSON.parse(fs.readFileSync(record));
    assert.equal(parent.raw.fixture, true, `${entry}/${route}: parent fixture password`);
    assert.equal(parent.raw.invoked, true, `${entry}/${route}: parent fixture invoked`);
    fs.rmSync(record);
    if (entry.includes('claude')) env.FIXTURE_CLAUDE = '1';
    const out = path.join(temp, `out-${++serial}.md`);
    let args, cwd = lane;
    if (entry === 'plain-worker') args = ['pi-worker.mjs', '--poll', '60', '--out', out, '--', '-p', 'fixture'];
    if (entry === 'pi-worker' || entry === 'claude-worker') args = ['pi-worker.mjs', '--poll', '60', '--out', out, '--lane', 'fixture', '--brief', path.join(repo, 'brief.md'), '--lane-size', entry === 'claude-worker' ? 'larger' : 'small'];
    if (entry === 'pi-review') { cwd = repo; args = ['pi-review.mjs', '--poll', '60', '--retries', '0', '--out', out, '--tree', repo, '--item', `fixture-${serial}`, '--', '-p', 'fixture']; }
    if (entry === 'claude-review') args = ['claude-review.mjs', '--out', out, '--tree', lane, '--brief', path.join(repo, 'brief.md'), '--item', `fixture-${serial}`];
    const installed = args[0] === 'pi-worker.mjs' || args[0] === 'pi-review.mjs';
    const target = installed ? path.join(layout.binDir, args[0].replace('.mjs', process.platform === 'win32' ? '.cmd' : '')) : null;
    const launch = installed ? reviewLaunch([target, ...args.slice(1)], { env, cwd }) : { command: process.execPath, args: [path.join(pack, 'bin', args[0]), ...args.slice(1)] };
    assert.equal(launch.refused, undefined, 'temporary installed launcher resolves');
    const result = run(launch.command, launch.args, env, cwd, launch.options);
    assert.equal(result.status, 0, `${entry}/${route}: launcher exit: ${result.stderr}`);
    const child = JSON.parse(fs.readFileSync(record));
    records.push({ entry, route, child, expectedConfig: parent.raw.config });
    for (const [kind, sample] of Object.entries(child).filter(([key]) => key !== 'flag')) {
      assert.deepEqual([sample.password, sample.invoked, sample.bounded], [false, false, true], `${entry}/${route}/${kind}: password, invocation, bounded`);
    }
    assert.equal(child.flag, entry.includes('claude'), `${entry}/${route}: settings route`);
    console.log(`  fixture ${entry}/${route}: parent password=true; child password=false; helper/askpass=false`);
  }
}

// req: R-3660
await check('M1: builder children suppress fixture credential dispatch', () => matrix(['plain-worker', 'pi-worker', 'claude-worker']));
// req: R-3661
await check('M2: reviewer entry points suppress fixture credential dispatch', () => {
  assert.equal(RUN_ALONE['packages/nana-pack/tests/credential-strip.test.mjs'], 'load-sensitive fixture credential probes bounded by 3000 ms');
  matrix(['pi-review', 'claude-review']);
});
// req: R-3662
await check('M3: unrelated inherited git configuration keeps its effect', async () => {
  const { credentialStripEnv } = await import('../lib/credential-strip.mjs');
  for (const route of ['parameters', 'counted']) {
    const env = fixture(route);
    const parent = run('git', ['config', '--get', 'core.autocrlf'], env);
    const child = run('git', ['config', '--get', 'core.autocrlf'], { ...env, ...credentialStripEnv(env) });
    assert.equal(child.status, 0); assert.equal(child.stdout, parent.stdout);
  }
  for (const { entry, route, child, expectedConfig } of records) for (const sample of [child.raw, child.effective]) assert.equal(sample.config, expectedConfig, `${entry}/${route}`);
});
// req: R-3664
await check('M5: shipped builder guidance assigns pushes to the seat', () => {
  const preamble = fs.readFileSync(path.join(pack, 'prompts/builder-preamble.md'), 'utf8');
  assert.ok(preamble.includes('Do not push; the seat pushes after verifying; report the tip'));
  assert.ok(preamble.includes("the branch, the tip's full SHA and the seat checks run on it"));
  for (const file of ['packages/nana-pack/prompts/builder-preamble.md', 'packages/nana-pack/rules/nana-rulings.md', 'templates/_shared/working-under-nana-pi.md', 'AGENTS.md', 'README.md']) {
    assert.doesNotMatch(fs.readFileSync(path.join(root, file), 'utf8'), /Builders (?:run touched tests, )?push|push your last commit|the pushed branch|Push with plain git push/i);
  }
});
// req: R-3665
await check('M6: dated CI ruling and shared working pattern agree', () => {
  const shared = fs.readFileSync(path.join(root, 'templates/_shared/working-under-nana-pi.md'), 'utf8');
  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  assert.equal(agents.split('<!-- nana:working-under-nana-pi begin -->\n')[1].split('<!-- nana:working-under-nana-pi end -->')[0], shared);
});
// req: R-3666
await check('M7: credential strip configuration seal', async () => {
  const c = await import('../lib/credential-strip-config.mjs');
  assert.equal(CASE_MS, 30_000); assert.equal(PROBE_MS, 3_000);
  assert.deepEqual(c.CREDENTIAL_CONFIG_RESETS, [['credential.helper', ''], ['core.askPass', '']]);
  assert.deepEqual(c.CREDENTIAL_ENV, { GIT_ASKPASS: '', SSH_ASKPASS: '', GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'never' });
  assert.deepEqual(c.GIT_CONFIG_ENV, { parameters: 'GIT_CONFIG_PARAMETERS', count: 'GIT_CONFIG_COUNT', key: 'GIT_CONFIG_KEY_', value: 'GIT_CONFIG_VALUE_' });
});
fs.rmSync(temp, { recursive: true, force: true });
process.exitCode = failures ? 1 : 0;
