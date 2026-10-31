/**
 * @module packages/nana-pack/tests/context-anatomy.test.mjs
 * @purpose Pin role-shaped context delivery and its private load baseline.
 * @inputs Temporary homes, linked repositories, fake children and delivery modules.
 * @outputs Ten bounded, awaited requirement checks.
 * @effects disk (OS temporary fixtures), process (git, launchers and hooks)
 * @errors Failed assertions set a nonzero exit status.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { writeFakePi } from './fake-pi.mjs';
import { tmpDir } from "./tmp-dir.mjs";
import { realPath } from '../lib/real-path.mjs';
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
    assert.deepEqual(JSON.parse(r.call.settingsText), { claudeMdExcludes: JSON.parse(r.call.settingsText).claudeMdExcludes, apiKeyHelper: 'helper', env: { HTTPS_PROXY: 'proxy', CLAUDE_CODE_GIT_BASH_PATH: 'bash', CLAUDE_CODE_USE_BEDROCK: '1', CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1', NANA_ROLE: 'reviewer', NANA_HANDOFF: 'off' } });
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
for (const c of cases) {
  if(process.env.CONTEXT_CASE && !c.title.startsWith(process.env.CONTEXT_CASE))continue;
  let timer;
  try { await Promise.race([c.fn(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('case time limit')),limit);})]); console.log('PASS',c.title); }
  catch(e){ console.log('FAIL',c.title,e.stack);process.exitCode=1; }
  finally{clearTimeout(timer);}
}
