/**
 * @module packages/nana-pack/tests/context-anatomy.test.mjs
 * @purpose Pin role-shaped context delivery and its private load baseline.
 * @inputs Temporary homes, linked repositories, fake children and delivery modules.
 * @outputs Bounded, awaited requirement checks for shaped delivery and pi context measurements.
 * @effects disk (OS temporary fixtures), process (git, launchers and hooks)
 * @errors Failed assertions set a nonzero exit status.
 */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeFakePi } from './fake-pi.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { realPath } from '../lib/real-path.mjs';
import { credentialStripEnv } from '../lib/credential-strip.mjs';
import { SHARED_MEMORY_OUTPUT_BUDGET } from '../../nana-setup/lib/shared-memory-config.mjs';
const pack = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(pack, '../..');
const temp = realPath(tmpDir(path.join(os.tmpdir(), 'context-anatomy-')));
const limit = 90_000;
let serial = 0;
const rows = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
const write = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
const git = (cwd, ...args) => { const r = spawnSync('git', ['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd, encoding: 'utf8', timeout: 10_000 }); assert.equal(r.status, 0, r.stderr); return r.stdout.trim(); };
function fixture(inHome = false) {
  const dir = path.join(temp, String(++serial));
  const repo = path.join(dir, 'repo'), lane = path.join(dir, inHome ? 'home/lane' : 'lane'), home = path.join(dir, 'home'), agent = path.join(home, '.pi/agent'), bin = path.join(dir, 'bin');
  for (const p of [repo, home, agent, bin]) fs.mkdirSync(p, { recursive: true });
  write(path.join(repo, 'seed'), 'seed\n');
  git(repo, 'init', '-q', '-b', 'main'); git(repo, 'add', 'seed'); git(repo, 'commit', '-qm', 'seed'); git(repo, 'worktree', 'add', '-qb', 'feat/alpha', lane);
  const roster = { scout: null, builder: { provider: 'fake', model: 'small', thinking: null }, largerBuilder: { runtime: 'claude-code', model: 'fable' }, reviewer: { runtime: 'claude-code', model: 'fable' }, land: null };
  write(path.join(agent, 'nana-pack.json'), JSON.stringify({ roster }));
  const record = path.join(dir, 'child.jsonl');
  const body = `const fs=require('node:fs'); const a=process.argv.slice(2); const after=f=>a[a.indexOf(f)+1];
const read=p=>{try{return fs.readFileSync(p,'utf8')}catch{return p}};
const prompts=[];for(let i=0;i<a.length;i++)if(a[i]==='--append-system-prompt')prompts.push({source:a[++i],text:read(a[i])});
const s=a.includes('--settings')?after('--settings'):null;const p=a.includes('--append-system-prompt-file')?after('--append-system-prompt-file'):null;
function done(stdin=''){fs.appendFileSync(process.env.RECORD,JSON.stringify({argv:a,cwd:process.cwd(),settings:s,settingsText:s?read(s):null,prompt:p?read(p):null,prompts,stdin})+'\\n');if(process.env.HOLD)setTimeout(()=>process.exit(0),4000);else {console.log('Review complete.\\nVERDICT: LAND');process.exit(Number(process.env.CHILD_EXIT||0));}}
if(a.includes('-p')&&!p&&!prompts.length){let t='';process.stdin.on('data',c=>t+=c);process.stdin.on('end',()=>done(t));}else done();`;
  const script = path.join(bin, 'fake.cjs'); write(script, body);
  if (process.platform === 'win32') { write(path.join(bin, 'claude.cmd'), `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`); writeFakePi(bin, body); }
  else for (const name of ['claude', 'pi']) { write(path.join(bin, name), `#!${process.execPath}\nrequire(${JSON.stringify(script)});\n`); fs.chmodSync(path.join(bin, name), 0o755); }
  const env = { ...process.env, HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: agent, PATH: `${bin}${path.delimiter}${process.env.PATH}`, RECORD: record };
  delete env.CLAUDE_CONFIG_DIR;
  const brief = path.join(lane, 'brief.md');
  const briefText = 'Feature: FEAT-006 · Fixture\r\nTouch `quoted needle` and `-p`. \t\r\n\r\n## Precedent\r\n- seed';
  write(brief, briefText);
  const bug = path.join(lane, 'docs/known-bugs/FEAT-006.md');
  const log = path.join(agent, 'nana-context-loads.jsonl');
  return { dir, repo, lane, home, agent, bin, env, brief, briefText, bug, log, record };
}
function args(f, launcher, extra = []) {
  const out = path.join(f.dir, `out-${++serial}.md`);
  if (launcher === 'pi-worker') return ['--lane', 'alpha', '--brief', f.brief, '--out', out, '--poll', '0.05', ...(extra.includes('--lane-size') ? [] : ['--lane-size','small']), ...extra];
  if (launcher === 'claude-review') return ['--item', `item-${path.basename(f.dir)}`, '--tree', f.lane, '--brief', f.brief, '--out', out, ...extra];
  return ['--item', `item-${path.basename(f.dir)}`, '--out', out, '--poll', '0.05', '--retries', '0', '--', '--provider', 'fake', '--model', 'small', '--append-system-prompt', f.brief, '-p', 'review', ...extra];
}
function launch(f, launcher, extra = [], env = f.env) {
  const r = spawnSync(process.execPath, [path.join(pack, 'bin', `${launcher}.mjs`), ...args(f, launcher, extra)], { cwd: f.lane, env, encoding: 'utf8', timeout: 20_000 });
  return { ...r, call: rows(f.record).at(-1) };
}
const good = (r) => assert.equal(r.status, 0, r.stderr);
const cap = async () => (await import('../lib/known-bug-digest-config.mjs')).KNOWN_BUG_DIGEST_CHARS;
function over(capacity, newline = '\n') {
  const header = `# Known bugs — 你好${newline}${newline}Context unchanged. \t${newline}${newline}`;
  const lines = Array.from({ length: 150 }, (_, i) => `- bug ${i}: ${i === 2 ? 'quoted needle' : 'ordinary'} ${'é你'.repeat(50)} \t`);
  assert.ok((header + lines.join(newline)).length > capacity * 2);
  return { header, lines, text: header + lines.join(newline) };
}
const cases = [];
const test = (title, fn) => cases.push({ title, fn });
// req: R-3210
test('R-3210: reviewer isolation and configured effort preserve exact argv order', async () => {
  for (const [settings, effort] of [[{ effortLevel: 'xhigh' }, 'xhigh'], [{ effortLevel: 'xhigh', modelSettings: { fable: { effortLevel: 'medium' } } }, 'medium'], [{}, null]]) {
    const f = fixture(); write(path.join(f.home, '.claude/settings.json'), JSON.stringify(settings));
    const r = launch(f, 'claude-review'); good(r);
    const expected = ['-p', '--model', 'fable', '--allowedTools', 'Read,Grep,Glob,Bash', '--disallowedTools', 'Edit,Write,NotebookEdit', '--setting-sources', 'project,local', '--settings', r.call.settings, '--strict-mcp-config', ...(effort ? ['--effort', effort] : [])];
    assert.deepEqual(r.call.argv, expected); assert.ok(path.relative(f.lane, r.call.settings).startsWith('..'));
  }
});
// req: R-3219 R-2560 R-2646
test('R-3219: both Claude launchers exclude ancestor memory while keeping tree instructions eligible', async () => {
  const { CLAUDE_ANCESTOR_MEMORY_PATHS } = await import('../bin/worker-config.mjs');
  assert.deepEqual(CLAUDE_ANCESTOR_MEMORY_PATHS, ['CLAUDE.md', 'CLAUDE.local.md', '.claude/CLAUDE.md', '.claude/rules/**']);
  for (const launcher of ['claude-review', 'pi-worker']) {
    const f = fixture(true);
    write(path.join(f.home, '.claude/rules/marker.md'), 'ANCESTOR_RULE_MARKER');
    write(path.join(f.home, 'CLAUDE.md'), 'ANCESTOR_CLAUDE_MARKER');
    write(path.join(f.lane, 'AGENTS.md'), 'TREE_AGENTS_MARKER');
    write(path.join(f.lane, 'CLAUDE.md'), '@AGENTS.md\nTREE_CLAUDE_MARKER');
    write(path.join(f.home, '.claude/settings.json'), JSON.stringify({ claudeMdExcludes: ['**'] }));
    const r = launch(f, launcher, launcher === 'pi-worker' ? ['--lane-size', 'larger'] : []); good(r);
    const exclusions = JSON.parse(r.call.settingsText).claudeMdExcludes;
    assert.ok(Array.isArray(exclusions), 'flag settings must exclude ancestor memory');
    const expected = [];
    for (let ancestor = path.dirname(f.lane);; ancestor = path.dirname(ancestor)) {
      for (const suffix of ['CLAUDE.md', 'CLAUDE.local.md', '.claude/CLAUDE.md', '.claude/rules/**']) expected.push(path.join(ancestor, suffix).split(path.sep).join('/'));
      if (ancestor === path.dirname(ancestor)) break;
    }
    assert.deepEqual(exclusions, expected);
    assert.ok(exclusions.includes(`${f.home.split(path.sep).join('/')}/.claude/rules/**`));
    assert.equal(r.call.cwd, f.lane);
    assert.ok(!exclusions.some(p => p.startsWith(f.lane.split(path.sep).join('/') + '/')));
    assert.ok(r.call.argv.includes('--settings')); assert.ok(!r.call.argv.includes('--bare')); assert.ok(!r.call.argv.includes('--safe-mode'));
    assert.equal(fs.readFileSync(path.join(f.lane, 'CLAUDE.md'), 'utf8'), '@AGENTS.md\nTREE_CLAUDE_MARKER');
  }
});
// req: R-3211
test('R-3211: reviewer carries only allowed settings and cleans normal failure and signal exits', async () => {
  const { CLAUDE_CARRY_ENV_NAMES } = await import('../bin/worker-config.mjs');
  for (const name of ['CLAUDE_CODE_GIT_BASH_PATH', 'CLAUDE_CODE_USE_BEDROCK', 'CLAUDE_CODE_USE_VERTEX', 'AWS_REGION', 'AWS_PROFILE', 'CLOUD_ML_REGION', 'ANTHROPIC_VERTEX_PROJECT_ID', 'ANTHROPIC_MODEL', 'ANTHROPIC_DEFAULT_OPUS_MODEL', 'ANTHROPIC_DEFAULT_SONNET_MODEL', 'ANTHROPIC_DEFAULT_HAIKU_MODEL']) assert.ok(CLAUDE_CARRY_ENV_NAMES.includes(name), name);
  for (const failure of [false, true]) {
    const f = fixture(); write(path.join(f.home, '.claude/settings.json'), JSON.stringify({ apiKeyHelper: 'helper', hooks: {}, mcpServers: {}, permissions: {}, env: { HTTPS_PROXY: 'proxy', CLAUDE_CODE_GIT_BASH_PATH: 'bash', CLAUDE_CODE_USE_BEDROCK: '1', FOO: 'no' } }));
    const r = launch(f, 'claude-review', [], { ...f.env, CHILD_EXIT: failure ? '1' : '0' });
    assert.equal(r.status, failure ? 1 : 0, r.stderr);
    assert.deepEqual(JSON.parse(r.call.settingsText), { claudeMdExcludes: JSON.parse(r.call.settingsText).claudeMdExcludes, apiKeyHelper: 'helper', env: { HTTPS_PROXY: 'proxy', CLAUDE_CODE_GIT_BASH_PATH: 'bash', CLAUDE_CODE_USE_BEDROCK: '1', CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1', NANA_ROLE: 'reviewer', NANA_HANDOFF: 'off', ...credentialStripEnv(f.env) } });
    assert.match(r.stderr, /^claude-review: claude settings carry:/m); assert.ok(!fs.existsSync(r.call.settings));
  }
  const f = fixture();
  const child = spawn(process.execPath, [path.join(pack, 'bin/claude-review.mjs'), ...args(f, 'claude-review')], { cwd: f.lane, env: { ...f.env, HOLD: '1' }, stdio: 'ignore' });
  const closed = new Promise(resolve => child.once('close', resolve));
  const deadline = Date.now() + 15_000;
  while (!rows(f.record).length && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 25));
  const call = rows(f.record)[0]; assert.ok(call); child.kill('SIGTERM'); await closed;
  // Windows uses the detached cleanup watcher because SIGTERM cannot run JS handlers there.
  const cleanupDeadline=Date.now()+10_000;
  while(fs.existsSync(call.settings)&&Date.now()<cleanupDeadline) await new Promise(resolve=>setTimeout(resolve,25));
  assert.ok(!fs.existsSync(call.settings));
  const refused = fixture(); const before = fs.readdirSync(os.tmpdir()).filter(n=>n.startsWith('nana-claude-review-'));
  fs.rmSync(refused.brief); assert.equal(launch(refused, 'claude-review').status, 1);
  assert.deepEqual(fs.readdirSync(os.tmpdir()).filter(n=>n.startsWith('nana-claude-review-')), before);
  const denied=fixture(), deniedArgs=args(denied,'claude-review'); deniedArgs[deniedArgs.indexOf('--out')+1]=path.join(denied.lane,'seed');
  const refusal=spawnSync(process.execPath,[path.join(pack,'bin/claude-review.mjs'),...deniedArgs],{cwd:denied.lane,env:denied.env,encoding:'utf8',timeout:20_000});
  assert.equal(refusal.status,1);assert.ok(!refusal.stderr.includes('claude settings carry:'));assert.equal(rows(denied.record).length,0);
});
// req: R-3211
test('R-3211: cloud carry preserves settings-only logins without exposing values', async () => {
  const { CLAUDE_CARRY_KEYS, CLAUDE_CARRY_ENV_NAMES } = await import('../bin/worker-config.mjs');
  const bedrock = ['CLAUDE_CODE_USE_BEDROCK', 'AWS_REGION', 'AWS_BEARER_TOKEN_BEDROCK', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY', 'AWS_SESSION_TOKEN', 'AWS_PROFILE', 'ANTHROPIC_BEDROCK_BASE_URL', 'CLAUDE_CODE_SKIP_BEDROCK_AUTH'];
  const vertex = ['CLAUDE_CODE_USE_VERTEX', 'ANTHROPIC_VERTEX_BASE_URL', 'ANTHROPIC_VERTEX_PROJECT_ID', 'CLOUD_ML_REGION', 'CLAUDE_CODE_SKIP_VERTEX_AUTH', 'GOOGLE_APPLICATION_CREDENTIALS'];
  for (const name of [...bedrock, ...vertex, 'CLAUDE_CODE_USE_FOUNDRY']) assert.ok(CLAUDE_CARRY_ENV_NAMES.includes(name), name);
  for (const key of ['awsAuthRefresh', 'awsCredentialExport', 'gcpAuthRefresh']) assert.ok(CLAUDE_CARRY_KEYS.includes(key), key);
  for (const launcher of ['claude-review', 'pi-worker']) {
    for (const [names, helpers] of [[bedrock, ['awsAuthRefresh', 'awsCredentialExport']], [vertex, ['gcpAuthRefresh']]]) {
      const f = fixture();
      const env = Object.fromEntries(names.map(name => [name, `PRIVATE-${name}-value`]));
      const keys = Object.fromEntries(helpers.map(key => [key, `PRIVATE-${key}-command`]));
      env.CLAUDE_CODE_USE_FOUNDRY = 'PRIVATE-foundry-value';
      write(path.join(f.home, '.claude/settings.json'), JSON.stringify({ ...keys, env, hooks: { private: 'never carry' }, permissions: { private: true } }));
      // No login is inherited from the shell: the only source is the user's settings file.
      const childEnv = { ...f.env };
      for (const name of CLAUDE_CARRY_ENV_NAMES) delete childEnv[name];
      const r = launch(f, launcher, launcher === 'pi-worker' ? ['--lane-size', 'larger'] : [], childEnv); good(r);
      const carried = JSON.parse(r.call.settingsText);
      for (const [name, value] of Object.entries(env)) assert.equal(carried.env[name], value, `${launcher}: ${name}`);
      for (const [key, value] of Object.entries(keys)) assert.equal(carried[key], value, `${launcher}: ${key}`);
      assert.ok(!Object.hasOwn(carried, 'hooks')); assert.ok(!Object.hasOwn(carried, 'permissions'));
      const visible = r.stdout + r.stderr + fs.readFileSync(f.log, 'utf8');
      for (const value of [...Object.values(env), ...Object.values(keys)]) assert.ok(!visible.includes(value), 'private carry value exposed');
    }
  }
});
// req: R-3212
test('R-3212: over-cap builder context keeps header brief matches and maximal whole tail in both runtimes', async () => {
  const capacity = await cap();
  for (const newline of ['\n', '\r\n']) {
    const f = fixture(), data = over(capacity, newline); write(f.bug, data.text);
    const pi = launch(f, 'pi-worker'); good(pi); const delivered = pi.call.prompts[2].text;
    const claude = launch(f, 'pi-worker', ['--lane-size', 'larger']); good(claude);
    assert.ok(delivered.length - data.header.length <= capacity); assert.ok(delivered.startsWith(data.header)); assert.ok(delivered.includes(data.lines[2])); assert.ok(delivered.includes(data.lines.at(-1)));
    assert.ok(claude.call.prompt.endsWith(delivered)); assert.ok(path.relative(f.lane, pi.call.prompts[2].source).startsWith('..'));
    const kept = delivered.split(/\r?\n/).filter(l=>l.startsWith('- ')); for (const line of kept) assert.ok(data.lines.includes(line));
    const omitted = data.lines.length - kept.length;
    assert.ok(delivered.endsWith(`${omitted} known-bug lines omitted for size; read the whole file docs/known-bugs/FEAT-006.md before you report the known bugs your change touches.`));
    const next = data.lines.filter(l=>!kept.includes(l)).at(-1); assert.ok(delivered.length - data.header.length + next.length + newline.length > capacity);
    const loads = rows(f.log); const part = loads[0].parts.find(p=>p.name==='known bugs'); assert.equal(part.fullChars, data.text.length); assert.equal(part.deliveredChars, delivered.length);
  }
  const { digestKnownBugs } = await import('../lib/known-bug-digest.mjs');
  for (const newline of ['\n', '\r\n']) {
    const header = '# Huge header ' + '你'.repeat(capacity + 1) + ' \t' + newline + newline;
    const line = '- fits after header \t';
    const source = 'docs/known-bugs/FEAT-006.md';
    const text = header + line + newline + '- ' + 'é'.repeat(capacity * 2);
    const result = digestKnownBugs(text, source);
    assert.ok(result.text.startsWith(header + line + newline));
    assert.ok(result.text.length - header.length <= capacity);
    assert.ok(result.text.endsWith(`1 known-bug lines omitted for size; read the whole file ${source} before you report the known bugs your change touches.`));
    assert.equal(digestKnownBugs(header.trimEnd(), source).text, header.trimEnd());
  }
});
// req: R-3213
test('R-3213: exactly-at-cap non-ASCII builder files pass unchanged at the original pi path', async () => {
  const capacity = await cap(), f = fixture(); const text = '# 你好\r\n\r\n- ' + 'é'.repeat(capacity - '# 你好\r\n\r\n- '.length - 2) + ' \t'; write(f.bug, text);
  assert.equal(text.length, capacity); assert.ok(Buffer.byteLength(text)>capacity);
  const pi = launch(f, 'pi-worker'); good(pi); assert.equal(pi.call.prompts[2].source, f.bug); assert.equal(pi.call.prompts[2].text, text);
  const claude = launch(f, 'pi-worker', ['--lane-size', 'larger']); good(claude); assert.ok(claude.call.prompt.endsWith(text));
});
// req: R-3214
test('R-3214: both reviewers share known bugs with a lead fallback ordered shares and no empty heading', async () => {
  const { reviewKnownBugSection, digestKnownBugs } = await import('../lib/known-bug-digest.mjs');
  const { KNOWN_BUG_SECTION_LEAD, KNOWN_BUG_SECTION_HEADING } = await import('../lib/known-bug-digest-config.mjs');
  const capacity = await cap(), f = fixture(); const short = '# Small\n\n- tiny ' + 'é'.repeat(Math.floor(capacity/6)) + '\n'; write(f.bug, short);
  const big = over(capacity).text; write(path.join(f.lane, 'docs/known-bugs/FEAT-007.md'), big);
  const section = reviewKnownBugSection(f.lane, 'FEAT-006 · first\r\nFEAT-007 · next \t', f.briefText);
  assert.ok(section.text.includes(KNOWN_BUG_SECTION_LEAD)); assert.equal(section.parts.length, 2);
  assert.ok(section.parts[1].deliveredChars > Math.floor(capacity/2)); assert.ok(section.parts.reduce((n,p)=>n+p.deliveredChars,0) - '# Small\n\n'.length - over(capacity).header.length <= capacity);
  const cr = launch(f, 'claude-review'); good(cr); const pr = launch(f, 'pi-review'); good(pr);
  const piText = pr.call.prompts.at(-1).text; const expected = reviewKnownBugSection(f.lane, null, f.briefText).text;
  assert.equal(piText, expected); assert.ok(cr.call.stdin.includes(expected)); assert.ok(cr.call.stdin.indexOf(expected)<cr.call.stdin.indexOf('## Review standard'));
  write(f.brief, 'No feature.\n'); const empty = launch(f, 'pi-review'); good(empty); assert.ok(!empty.call.prompts.some(p=>p.text.includes(KNOWN_BUG_SECTION_HEADING)));
  assert.equal(reviewKnownBugSection(f.lane, 'FEAT-999 · missing', 'No feature').text, null);
  const one = '# Header\n\n- ' + '你'.repeat(capacity * 2);
  const headerOnly = digestKnownBugs(one, 'docs/known-bugs/FEAT-007.md', '', Math.floor(capacity/2)).text;
  assert.ok(headerOnly.startsWith('# Header\n\n1 known-bug lines omitted')); assert.ok(!headerOnly.includes('- 你'));
  const m = fixture();
  const ledger = '# CAP-01 · Test\nPurpose: Test\n\n## FEAT-006 · First\nPurpose: First\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | One. | untested | — |\n\n## FEAT-007 · Second\nPurpose: Second\nStatus: active\n\n| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-002 | Two. | untested | — |\n';
  write(path.join(m.repo,'REQUIREMENTS.md'), ledger); git(m.repo,'add','REQUIREMENTS.md'); git(m.repo,'commit','-qm','ledger'); git(m.lane,'merge','--ff-only','main');
  write(path.join(m.lane,'REQUIREMENTS.md'),ledger.replace('One.','One changed.').replace('Two.','Two changed.')); git(m.lane,'add','REQUIREMENTS.md'); git(m.lane,'commit','-qm','movement');
  write(m.bug,short); write(path.join(m.lane,'docs/known-bugs/FEAT-007.md'),big);
  const mc=launch(m,'claude-review');good(mc);const mp=launch(m,'pi-review');good(mp);
  const movementText=mp.call.prompts.find(p=>p.text.startsWith('## Tree movement'))?.text; assert.ok(movementText);
  const moved=reviewKnownBugSection(m.lane,movementText,m.briefText).text;
  assert.equal(mp.call.prompts.at(-1).text,moved);assert.ok(mc.call.stdin.includes(moved)); assert.ok(mc.call.stdin.indexOf('## Tree movement')<mc.call.stdin.indexOf(moved));
});
// req: R-3215
test('R-3215: launchers log once before outcomes with exact part counts and default-home resolution', async () => {
  for (const launcher of ['pi-worker', 'claude-review', 'pi-review']) {
    const f = fixture(); write(f.bug, '# Bugs\n\n- bug\n');
    const r = launch(f, launcher, [], { ...f.env, CHILD_EXIT: '1' }); assert.equal(r.status, 1, r.stderr);
    const log = rows(f.log); assert.equal(log.length, 1); const e = log[0]; assert.equal(e.v,1); assert.equal(e.launcher,launcher); assert.equal(e.role,launcher==='pi-worker'?'worker':'reviewer'); assert.ok(Date.parse(e.at)); assert.ok(e.cwd); assert.ok(e.model); assert.ok(e.runtime); assert.ok(e.lane||e.item);
    const part = e.parts.find(p=>p.name==='brief'); assert.equal(part.fullChars,f.briefText.length); assert.equal(part.deliveredChars,f.briefText.length); assert.equal(part.source,f.brief);
    for (const p of e.parts) { assert.equal(typeof p.source,'string'); assert.ok(Number.isInteger(p.fullChars)); assert.ok(Number.isInteger(p.deliveredChars)); }
    const known=e.parts.find(p=>p.name==='known bugs'); assert.equal(known.fullChars, '# Bugs\n\n- bug\n'.length); assert.equal(known.deliveredChars, known.fullChars);
    if (launcher==='pi-worker') { const pre=e.parts.find(p=>p.name==='preamble'); assert.equal(pre.deliveredChars,r.call.prompts[0].text.length); assert.equal(pre.fullChars,pre.deliveredChars); }
    else { const standard=e.parts.find(p=>p.name==='standard'); assert.equal(standard.fullChars,fs.readFileSync(path.join(pack,'prompts/review-standard.md'),'utf8').length); assert.equal(standard.deliveredChars,standard.fullChars); }
    if (launcher==='claude-review') { const settings=e.parts.find(p=>p.name==='settings'); assert.equal(settings.fullChars,0); assert.equal(settings.deliveredChars,r.call.settingsText.length); assert.ok(Object.hasOwn(e,'effort')); }
  }
  const f = fixture(), env = { ...f.env }; delete env.PI_CODING_AGENT_DIR;
  good(launch(f,'claude-review',[],env)); assert.equal(rows(f.log).length,1);
  fs.rmSync(f.log); const r = spawnSync(process.execPath,[path.join(pack,'bin/pi-worker.mjs'),'--out',path.join(f.dir,'plain.md'),'--poll','0.05','--','-p','plain'],{cwd:f.lane,env:f.env,encoding:'utf8',timeout:20_000}); assert.equal(r.status,0,r.stderr); assert.ok(!fs.existsSync(f.log));
});
// req: R-3216
test('R-3216: failed unsafe and unavailable logging cannot alter launcher or hook delivery', async () => {
  const { appendContextLoad } = await import('../lib/context-load-log.mjs');
  for (const launcher of ['pi-worker','claude-review','pi-review']) {
    const f=fixture(); const first=launch(f,launcher); good(first);
    fs.rmSync(f.log); fs.mkdirSync(f.log); const bad=launch(f,launcher); good(bad);
    const normalize = c=>({argv:c.argv.map(v=>v.replace(/nana-(?:claude-review|movement|review|lane-preamble)-[^/\\]+/g,'TEMP').replace(/pi-(?:worker|review)-a\d+-\d+/g,'SESSION')),stdin:c.stdin,prompt:c.prompt,prompts:c.prompts.map(p=>p.text.replace(/nana-review-[^/\\ ]+/g,'TEMP'))});
    assert.deepEqual(normalize(bad.call),normalize(first.call)); assert.equal(bad.stderr.split('\n').filter(l=>l.startsWith('nana context load skipped:')).length,1);
    write(path.join(f.lane,'.pi-agent/nana-pack.json'),fs.readFileSync(path.join(f.agent,'nana-pack.json')));
    const relative=launch(f,launcher,[],{...f.env,PI_CODING_AGENT_DIR:'.pi-agent'});
    // Review roster defaults to pi when relative; give it a safe fixture roster without permitting a log.
    good(relative);assert.match(relative.stderr,/cwd-relative/);
    assert.ok(!fs.existsSync(path.join(f.lane,'.pi-agent/nana-context-loads.jsonl')));
  }
  const f=fixture(), notes=[]; const result=appendContextLoad({launcher:'test'},{file:path.join(f.lane,'log.jsonl'),relative:false,warn:t=>notes.push(t)}); assert.equal(result.ok,false); assert.equal(notes.length,1); assert.ok(!fs.existsSync(path.join(f.lane,'log.jsonl')));
  const h=hookFixture(); const a=runHook(h); assert.equal(a.status,0,a.stderr); fs.rmSync(h.log); fs.mkdirSync(h.log); const b=runHook(h); assert.equal(b.status,0); assert.equal(b.stdout,a.stdout); assert.match(b.stderr,/nana context load skipped:/);
  const copy=path.join(h.dir,'copy'); fs.cpSync(path.join(root,'packages/nana-setup'),path.join(copy,'packages/nana-setup'),{recursive:true});
  const missing=runHook(h,path.join(copy,'packages/nana-setup/claude/hooks/nana-shared-memory.mjs')); assert.equal(missing.status,0); assert.equal(missing.stdout,a.stdout); assert.match(missing.stderr,/nana context load skipped:/);
});
function hookFixture() {
  const f=fixture(); const shared=path.join(f.home,'.claude/nana-memory/shared');
  const entries=Array.from({length:100},(_,i)=>`- [entry ${i}](entry-${i}.md) ${'你é'.repeat(150)} \t`);
  write(path.join(shared,'MEMORY.md'),'# Index\r\n'+entries.join('\r\n'));
  return {...f,entries,env:{...f.env,CLAUDE_PROJECT_DIR:f.lane,NANA_SHARED_MEMORY_DIR:shared}};
}
function runHook(f,script=path.join(root,'packages/nana-setup/claude/hooks/nana-shared-memory.mjs')) {return spawnSync(process.execPath,[script],{cwd:f.lane,env:f.env,input:JSON.stringify({session_id:'session-fixture',cwd:f.lane}),encoding:'utf8',timeout:10_000});}
// req: R-3217
test('R-3217: seat memory log names whole shortened and omitted entries without changing stdout', async () => {
  const f=hookFixture(); const r=runHook(f); assert.equal(r.status,0,r.stderr); assert.ok(r.stdout.length<=SHARED_MEMORY_OUTPUT_BUDGET);
  const e=rows(f.log)[0]; assert.equal(e.launcher,'nana-shared-memory'); assert.equal(e.sessionId,'session-fixture'); assert.equal(e.cwd,f.lane); assert.equal(e.printedChars,r.stdout.length); assert.ok(e.fullChars>e.printedChars);
  const fold=/([0-9]+) of ([0-9]+) entries shortened, ([0-9]+) left out/.exec(r.stdout); assert.ok(fold);
  assert.equal(e.shortened.length,Number(fold[1])); assert.equal(e.whole.length+e.shortened.length+e.omitted.length,Number(fold[2])); assert.equal(e.omitted.length,Number(fold[3]));
  assert.deepEqual([...e.whole,...e.shortened,...e.omitted].sort(),f.entries.map((_,i)=>`entry-${i}.md`).sort());
});
// req: R-3218
test('R-3218: known-bug digest seal is 6000 UTF-16 units', async()=>assert.equal(await cap(),6000));
// A real package layout, but only a recording executable: no test starts a model session.
function stubContext(f, source = `export function loadProjectContextFiles() { return [{path:'/SENTINEL/A/AGENTS.md',content:'A'.repeat(1234)},{path:'/SENTINEL/B/AGENTS.md',content:'B'.repeat(56)}]; }`) {
  // Match Node's spawned Windows environment: no duplicate Path/PATH keys in direct loader calls.
  for (const key of Object.keys(f.env)) if (key !== 'PATH' && key.toLowerCase() === 'path') delete f.env[key];
  const pkg = path.join(f.bin, 'node_modules/@earendil-works/pi-coding-agent');
  const metadata = { name: '@earendil-works/pi-coding-agent', version: '9.9.9-stub', bin: { pi: 'cli.cjs' }, type: 'module' };
  const body = fs.readFileSync(path.join(f.bin, 'fake.cjs'), 'utf8');
  write(path.join(pkg, 'package.json'), JSON.stringify(metadata));
  write(path.join(pkg, 'cli.cjs'), `#!${process.execPath}\n${body}`);
  write(path.join(pkg, 'dist/index.js'), source);
  if (process.platform !== 'win32') {
    fs.rmSync(path.join(f.bin, 'pi'));
    fs.chmodSync(path.join(pkg, 'cli.cjs'), 0o755);
    fs.symlinkSync(path.join(pkg, 'cli.cjs'), path.join(f.bin, 'pi'));
  }
  return pkg;
}
function alteredWorker(f, oldText, newText) {
  const checkout=path.join(f.dir,'checkout'), copy=path.join(checkout,'packages','nana-pack');
  // Preserve the checkout-relative scanner dependency used by the lane-end warning.
  write(path.join(checkout,'scripts','identity-scan.mjs'),fs.readFileSync(path.join(root,'scripts','identity-scan.mjs')));
  write(path.join(checkout,'identity-scan.config.json'),fs.readFileSync(path.join(root,'identity-scan.config.json')));
  for(const dir of ['lib','prompts']) fs.cpSync(path.join(pack,dir),path.join(copy,dir),{recursive:true});
  for(const file of ['pi-worker.mjs','pi-watchdog.mjs','worker-config.mjs','nana-roster.mjs','review-launch.mjs']) write(path.join(copy,'bin',file),fs.readFileSync(path.join(pack,'bin',file)));
  const script=path.join(copy,'bin/pi-worker.mjs'), source=fs.readFileSync(script,'utf8');
  assert.ok(source.includes(oldText)); write(script,source.replace(oldText,newText));
  return script;
}
function launchWorkerScript(f, script) {
  return spawnSync(process.execPath,[script,...args(f,'pi-worker')],{cwd:f.lane,env:f.env,encoding:'utf8',timeout:20_000});
}
const fileParts = e => e.parts.filter(p => p.name === 'context file');
const normalizeCall = c => JSON.parse(JSON.stringify(c).replace(/nana-lane-preamble-[^/\\\\]+/g,'TEMP').replace(/pi-worker-a\d+-\d+/g,'SESSION'));
// req: R-3726
test('R-3726: lane load delegates to the located package export in order without content', async () => {
  const f=fixture(); stubContext(f); good(launch(f,'pi-worker'));
  const e=rows(f.log)[0]; assert.equal(e.piVersion,'9.9.9-stub');
  assert.deepEqual(fileParts(e), [
    {name:'context file',source:'/SENTINEL/A/AGENTS.md',fullChars:1234,deliveredChars:1234},
    {name:'context file',source:'/SENTINEL/B/AGENTS.md',fullChars:56,deliveredChars:56},
  ]);
  const text=fs.readFileSync(f.log,'utf8'); assert.ok(!text.includes('A'.repeat(1234))); assert.ok(!text.includes('B'.repeat(56)));
  const { piContextLoad } = await import('../lib/pi-context-load.mjs');
  const checked = { piVersion: '9.9.9-stub', parts: fileParts(e) };
  stubContext(f, `import {writeSync} from 'node:fs'; writeSync(1, ${JSON.stringify(JSON.stringify({...checked, signal:'SIGTERM', content:'PRIVATE', parts:checked.parts.map(p=>({...p,content:'PRIVATE',extra:true}))}))}); process.exit(0);`);
  assert.deepEqual(await piContextLoad({cwd:f.lane,env:f.env,args:[]}), checked, 'discard child extras at both levels');
});
// req: R-3727 R-3808 R-3812
test('R-3727: installed pi chooses AGENTS over CLAUDE in the same directory', async () => {
  const { locatePiPackage }=await import('../lib/pi-package.mjs');
  const found=locatePiPackage();
  if(found.refused) { console.log(`SKIP R-3727: installed pi unavailable: ${found.refused}`); return; }
  const { piContextLoad }=await import('../lib/pi-context-load.mjs');
  const f=fixture(); const text='# Instructions\r\nKeep spaces. \t\r\nNo final newline \t';
  write(path.join(f.lane,'AGENTS.md'),text); write(path.join(f.lane,'CLAUDE.md'),'not selected');
  // Choice is semantic, not a test of the production deadline (pinned separately).
  const result=await piContextLoad({cwd:f.lane,env:{...f.env,PATH:process.env.PATH},args:[],
    schedule: () => null, cancel: () => {},
    start: (_command, argv, options) => spawn(process.execPath, ['--import', 'data:text/javascript,await new Promise(r=>setTimeout(r,3500))', fileURLToPath(new URL('../lib/pi-context-measure.mjs', import.meta.url)), argv[1]], options),
  });
  assert.equal(result.piVersion,found.packageJson.version);
  assert.deepEqual(result.parts.filter(p=>path.dirname(p.source)===f.lane),[{name:'context file',source:path.join(f.lane,'AGENTS.md'),fullChars:text.length,deliveredChars:text.length}]);
  assert.ok(!result.parts.some(p=>p.name.startsWith('context files: unavailable')));
});
// req: R-3728
test('R-3728: context measurement resolves the child agent dir and relative cwd', async () => {
  const { piContextLoad }=await import('../lib/pi-context-load.mjs');
  const f=fixture(); stubContext(f, `import {readFileSync} from 'node:fs'; import {join} from 'node:path'; export function loadProjectContextFiles({cwd,agentDir}) { return [{path:join(agentDir,'AGENTS.md'),content:readFileSync(join(agentDir,'AGENTS.md'),'utf8')}]; }`);
  const agent=path.join(f.lane,'child-agent'), text='# child\r\nOnly child. \t'; write(path.join(agent,'AGENTS.md'),text);
  assert.ok(!fs.existsSync(path.join(f.agent,'AGENTS.md')));
  // Inject only the sealed child env at the launch boundary; keep the parent on f.agent.
  const script=alteredWorker(f,'childEnv = spec.env;',`childEnv = {...spec.env, PI_CODING_AGENT_DIR:${JSON.stringify(agent)}};`);
  good(launchWorkerScript(f,script));
  assert.deepEqual(fileParts(rows(f.log)[0]),[{name:'context file',source:path.join(agent,'AGENTS.md'),fullChars:text.length,deliveredChars:text.length}]);
  for(const childDir of [agent,'child-agent']) {
    const result=await piContextLoad({cwd:f.lane,env:{...f.env,PI_CODING_AGENT_DIR:childDir},args:[]});
    assert.deepEqual(result.parts,[{name:'context file',source:path.join(agent,'AGENTS.md'),fullChars:text.length,deliveredChars:text.length}]);
  }
});
// req: R-3729
test('R-3729: pi review logs the child checkout context and reviewer slot', async () => {
  for(const role of ['final','sol']) {
    const f=fixture(); stubContext(f, `import {readFileSync} from 'node:fs'; import {join} from 'node:path'; export function loadProjectContextFiles({cwd}) { return [{path:join(cwd,'AGENTS.md'),content:readFileSync(join(cwd,'AGENTS.md'),'utf8')}]; }`);
    const text='# Checkout\r\nRead here. \t'; write(path.join(f.lane,'AGENTS.md'),text);
    const a=args(f,'pi-review'); a.splice(a.indexOf('--'),0,'--role',role);
    const result=spawnSync(process.execPath,[path.join(pack,'bin/pi-review.mjs'),...a],{cwd:f.lane,env:f.env,encoding:'utf8',timeout:20_000}); good(result);
    const call=rows(f.record).at(-1), e=rows(f.log)[0];
    assert.equal(e.cwd,f.lane); assert.equal(e.childCwd,realPath(call.cwd)); assert.notEqual(e.childCwd,e.cwd); assert.equal(e.slot,'reviewer');
    assert.deepEqual(fileParts(e),[{name:'context file',source:path.join(realPath(call.cwd),'AGENTS.md'),fullChars:text.length,deliveredChars:text.length}]);
  }
});
// req: R-3730
test('R-3730: both pi lane sizes log the selected roster slot', async () => {
  for(const [size,slot] of [['small','builder'],['larger','largerBuilder']]) {
    const f=fixture(); stubContext(f);
    const config=JSON.parse(fs.readFileSync(path.join(f.agent,'nana-pack.json'),'utf8')); config.roster.largerBuilder={provider:'fake',model:'large',thinking:null}; write(path.join(f.agent,'nana-pack.json'),JSON.stringify(config));
    good(launch(f,'pi-worker',['--lane-size',size])); assert.equal(rows(f.log)[0].slot,slot);
  }
});
// req: R-3731
test('R-3731: disabled context is measured without files for worker and review args', async () => {
  const { piContextLoad }=await import('../lib/pi-context-load.mjs');
  for(const flag of ['--no-context-files','-nc']) {
    const f=fixture(); stubContext(f, `export function loadProjectContextFiles() { throw new Error('disabled loader must not run'); }`);
    const args=['--provider','fake',flag,'-p','work'], before=[...args];
    const result=await piContextLoad({cwd:f.lane,env:f.env,args});
    assert.deepEqual(args,before); assert.deepEqual(result.parts,[{name:'context files: disabled (-nc)',source:'argv',fullChars:0,deliveredChars:0}]);
    // Worker args are sealed: inject the flag at preparation, not through a new delivery option.
    const script=alteredWorker(f,"if (entry.runtime !== CLAUDE_CODE_RUNTIME) return [",`if (entry.runtime !== CLAUDE_CODE_RUNTIME) return [${JSON.stringify(flag)},`);
    good(launchWorkerScript(f,script));
    const worker=rows(f.log)[0]; assert.deepEqual(worker.parts.filter(p=>p.name.startsWith('context file')),result.parts); assert.ok(rows(f.record)[0].argv.includes(flag));
    good(launch(f,'pi-review',[flag])); const e=rows(f.log).at(-1); assert.deepEqual(e.parts.filter(p=>p.name.startsWith('context file')),result.parts); assert.ok(rows(f.record).at(-1).argv.includes(flag));
  }
});
// req: R-3732
test('R-3732: unavailable pi context preserves launch delivery and other parts', async () => {
  const f=fixture(), pkg=stubContext(f); const first=launch(f,'pi-worker'); good(first);
  write(path.join(pkg,'dist/index.js'),'export const noLoader = true;');
  const missing=launch(f,'pi-worker'); good(missing);
  assert.deepEqual(normalizeCall(missing.call),normalizeCall(first.call));
  const e=rows(f.log).at(-1); assert.ok(e.parts.some(p=>p.name==='brief')); assert.ok(e.parts.some(p=>p.name==='preamble'));
  assert.deepEqual(e.parts.filter(p=>p.name.startsWith('context file')),[{name:'context files: unavailable (missing loadProjectContextFiles export)',source:'pi',fullChars:0,deliveredChars:0}]);
  const {piContextLoad}=await import('../lib/pi-context-load.mjs');
  const absent=await piContextLoad({cwd:f.lane,env:{...f.env,PATH:path.join(f.dir,'absent')},args:[]}); assert.match(absent.parts[0].name,/^context files: unavailable \(.+\)$/);
  write(path.join(pkg,'dist/index.js'),`export function loadProjectContextFiles() { throw new Error('PRIVATE-CONTENT'); }`);
  const thrown=launch(f,'pi-worker'); good(thrown); const line=rows(f.log).at(-1); assert.match(line.parts.at(-1).name,/^context files: unavailable \(.+\)$/); assert.ok(!JSON.stringify(line).includes('PRIVATE-CONTENT'));
});
// req: R-3732 R-3809 R-3812
test('R-3732: stalled measurement is killed and both launchers proceed within the deadline', async () => {
  const { pidAlive } = await import('../lib/process-tree.mjs');
  for (const [launcher, stall] of [['pi-worker', 'await new Promise(() => {});'], ['pi-review', 'export async function loadProjectContextFiles() { await new Promise(() => {}); }']]) {
    const f = fixture(), pidFile = path.join(f.dir, 'measurement.json');
    const pkg = stubContext(f);
    const timedLaunch = async () => {
      const started = performance.now();
      const child = spawn(process.execPath, [path.join(pack,'bin',`${launcher}.mjs`), ...args(f,launcher)], {cwd:f.lane,env:f.env,stdio:['ignore','ignore','pipe'],timeout:20_000,killSignal:'SIGKILL'});
      let stderr = ''; child.stderr.on('data', chunk => { stderr += chunk; });
      const status = await new Promise((resolve, reject) => { child.once('error',reject); child.once('close',resolve); });
      good({status,stderr});
      return performance.now() - started;
    };
    // Compare delivery, not elapsed time; the controlled-timer case pins the deadline.
    const baselineMs = await timedLaunch();
    // An unrelated child scheduling delay must not count against the measurement deadline.
    const body = fs.readFileSync(path.join(f.bin, 'fake.cjs'), 'utf8');
    write(path.join(f.bin, 'fake.cjs'), `Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,3000);\n${body}`);
    // Windows fake pi has its own installed body.
    write(path.join(pkg, 'cli.cjs'), `#!${process.execPath}\nAtomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,3000);\n${body}`);
    write(path.join(pkg,'dist/index.js'), `import {writeFileSync} from 'node:fs'; writeFileSync(${JSON.stringify(pidFile)}, JSON.stringify({pid:process.pid})); setInterval(()=>{},1000); ${stall}`);
    const stalledMs = await timedLaunch();
    assert.equal(rows(f.record).length, 2, 'both launches must proceed');
    console.log(`TIMING ${launcher}: baseline ${Math.round(baselineMs)} ms, stalled ${Math.round(stalledMs)} ms, added ${Math.round(stalledMs - baselineMs)} ms`);
    const delivery = call => JSON.parse(JSON.stringify(normalizeCall(call)).replace(/nana-review-\d+-[A-Za-z0-9]+/g, 'CHECKOUT').replace(/pi-review-a\d+-\d+/g, 'SESSION'));
    assert.deepEqual(delivery(rows(f.record)[1]), delivery(rows(f.record)[0]), 'timeout must preserve child delivery');
    assert.deepEqual(rows(f.log).at(-1).parts.filter(p => p.name.startsWith('context file')), [{name:'context files: unavailable (timed out)',source:'pi',fullChars:0,deliveredChars:0}]);
    const {pid} = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
    const stoppedBy = Date.now() + 1000;
    while (pidAlive(pid) && Date.now() < stoppedBy) await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(pidAlive(pid), false, 'measurement child survived timeout');
  }
});
// req: R-3732
test('R-3732: oversized measurement is killed and both launchers proceed without exhausting memory', async () => {
  const { PI_CONTEXT_OUTPUT_MAX_BYTES } = await import('../bin/worker-config.mjs');
  const { pidAlive } = await import('../lib/process-tree.mjs');
  for (const launcher of ['pi-worker', 'pi-review']) {
    const f = fixture(), pidFile = path.join(f.dir, 'measurement.json');
    stubContext(f, `import {writeSync,writeFileSync} from 'node:fs';
writeFileSync(${JSON.stringify(pidFile)}, JSON.stringify({pid:process.pid}));
const chunk=Buffer.alloc(${PI_CONTEXT_OUTPUT_MAX_BYTES}, 120);
for(let sent=0;sent<128*1024*1024;) {
  try { sent+=writeSync(1,chunk); } catch(e) { if(e.code!=='EAGAIN')throw e; await new Promise(r=>setTimeout(r,1)); }
}
setInterval(()=>{},1000); export function loadProjectContextFiles(){return [];}`);
    const r = launch(f, launcher, [], {...f.env, NODE_OPTIONS:'--max-old-space-size=64'});
    good(r);
    assert.ok(r.call, 'real child must launch despite oversized measurement');
    const e = rows(f.log).at(-1);
    assert.ok(e.parts.some(p=>p.name==='brief'));
    assert.deepEqual(e.parts.filter(p=>p.name.startsWith('context file')), [{name:'context files: unavailable (output too large)',source:'pi',fullChars:0,deliveredChars:0}]);
    const {pid} = JSON.parse(fs.readFileSync(pidFile, 'utf8'));
    const stoppedBy = Date.now() + 1000;
    while (pidAlive(pid) && Date.now() < stoppedBy) await new Promise(resolve => setTimeout(resolve, 20));
    assert.equal(pidAlive(pid), false, 'measurement child survived overflow');
  }
});
// req: R-3732
test('R-3732: context measurement output seal is 1 MiB', async () => {
  assert.equal((await import('../bin/worker-config.mjs')).PI_CONTEXT_OUTPUT_MAX_BYTES, 1_048_576);
});
// req: R-3813 R-3812
test('R-3813: controlled deadline kills at 3000 ms but not at 2999 ms', async () => {
  const { piContextLoad } = await import('../lib/pi-context-load.mjs');
  let now = 0, due, callback, killed = false, settled = false;
  const child = new EventEmitter();
  child.stdout = new PassThrough(); child.unref = () => {};
  child.kill = signal => { assert.equal(signal, 'SIGKILL'); killed = true; };
  const result = piContextLoad({ cwd: temp, env: {}, args: [], start: () => child,
    schedule: (fn, ms) => { callback = fn; due = now + ms; return 1; }, cancel: () => {},
  }).then(value => { settled = true; return value; });
  const advance = async ms => { now += ms; if (due <= now) callback(); await Promise.resolve(); };
  await advance(2999); assert.equal(killed, false); assert.equal(settled, false);
  await advance(1); assert.equal(killed, true); assert.equal(settled, true);
  assert.deepEqual((await result).parts, [{name:'context files: unavailable (timed out)',source:'pi',fullChars:0,deliveredChars:0}]);
  assert.equal(child.stdout.destroyed, true);
});
// req: R-3732
test('R-3732: context measurement deadline seal is 3000 ms', async () => {
  assert.equal((await import('../bin/worker-config.mjs')).PI_CONTEXT_TIMEOUT_MS, 3000);
});
// req: R-3729 R-3315 R-3336
test('R-3729: real review loads count by source cwd and name context statuses', async () => {
  const { measureOutcomes } = await import('../lib/outcome-meter.mjs');
  const { projectKey } = await import('../../nana-setup/lib/project-key.mjs');
  const f = fixture(), reviewTemp = path.join(f.dir, 'review-temp'); fs.mkdirSync(reviewTemp);
  stubContext(f); good(launch(f, 'pi-review', [], {...f.env, TMPDIR:reviewTemp, TMP:reviewTemp, TEMP:reviewTemp}));
  const e = rows(f.log)[0];
  const projectsRoot = path.join(f.dir, 'projects'), session = 'fixture';
  const at = offset => new Date(Date.parse(e.at) + offset).toISOString();
  write(path.join(projectsRoot, projectKey(f.lane), `${session}.jsonl`), [
    {type:'assistant',uuid:'seat',sessionId:session,isSidechain:false,timestamp:at(-2000),message:{role:'assistant',content:'Which fixture?'}},
    {type:'user',uuid:'owner',sessionId:session,isSidechain:false,timestamp:at(-1000),message:{role:'user',content:'Fixture answer.'}},
  ].map(JSON.stringify).join('\n'));
  for (const name of ['context files: disabled (-nc)', 'context files: unavailable (timed out)', 'context files: unavailable (pi entry import failed)']) fs.appendFileSync(f.log, JSON.stringify({...e,parts:[{name,deliveredChars:0}]})+'\n');
  const result = await measureOutcomes({repoRoot:f.lane,projectsRoot,candidates:[],loadFile:f.log,tempRoot:reviewTemp,runModel:()=>assert.fail('no model call')});
  assert.ok(result.lines.includes('test loads 0'), result.lines.join('\n'));
  for (const [part, count] of [['context file',1],['context files: disabled (-nc)',1],['context files: unavailable',2]]) assert.ok(result.lines.includes(`1 context reviewer pi-review part ${part} too few loads ${count}`), result.lines.join('\n'));
  assert.ok(!result.lines.some(line => line.includes('other-')));
});
for (const c of cases) {
  if(process.env.CONTEXT_CASE && !c.title.startsWith(process.env.CONTEXT_CASE))continue;
  let timer;
  try { await Promise.race([c.fn(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('case time limit')),limit);})]); console.log('PASS',c.title); }
  catch(e){ console.log('FAIL',c.title,e.stack);process.exitCode=1; }
  finally{clearTimeout(timer);}
}
