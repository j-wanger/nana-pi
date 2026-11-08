/**
 * @module packages/nana-pack/tests/child-context.test.mjs
 * @purpose Pin trimmed child guidance, retained guards and complete launch context counts.
 * @inputs Real extensions and launchers, fake runtime executables and OS-temp instruction trees.
 * @outputs Six awaited requirement checks with per-case limits.
 * @effects disk (temporary fixtures), process (bounded git and fake runtime launches)
 * @errors Failed assertions set exit 1.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from './fake-pi.mjs';
import { LAUNCHER_ROLES } from '../lib/frontier-summary-config.mjs';
const pack = fileURLToPath(new URL('../', import.meta.url));
const temp = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), 'child-context-')));
const write = (file, text) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); };
const rows = file => fs.existsSync(file) ? fs.readFileSync(file, 'utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse) : [];
let serial = 0;
function fixture() {
  const dir = path.join(temp, String(++serial)), repo = path.join(dir, 'repo'), lane = path.join(dir, 'lane');
  const home = path.join(dir, 'home'), agent = path.join(home, '.pi/agent'), bin = path.join(dir, 'bin');
  for (const d of [repo, home, agent, bin]) fs.mkdirSync(d, { recursive: true });
  const git = (...args) => { const r = spawnSync('git', ['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false', ...args], { cwd: repo, encoding: 'utf8', timeout: 10_000 }); assert.equal(r.status, 0, r.stderr); };
  git('init','-q','-b','main'); write(path.join(repo,'seed'), 'seed'); git('add','seed'); git('commit','-qm','seed'); git('worktree','add','-qb','feat/example',lane);
  const roster = { scout: null, builder: { provider: 'fake', model: 'fake', thinking: null }, reviewer: { runtime: 'claude-code', model: 'fable' }, adversary: null, largerBuilder: { runtime: 'claude-code', model: 'fable' } };
  write(path.join(agent,'nana-pack.json'), JSON.stringify({ roster, journal: { enabled: false } }));
  write(path.join(agent,'nana-rulings.md'), '# Rulings\r\nRuling text. \t');
  write(path.join(lane,'OBJECTIVE.md'), '# Objective\n\n**Objective:** Test child context.\n');
  const brief = path.join(lane,'brief.md'); write(brief,'Feature: FEAT-013 · Fixture\nPrecedent:\n- seed\n');
  const capture = path.join(dir,'calls.jsonl'), log = path.join(agent,'nana-context-loads.jsonl');
  const factories = ['nana-objective','nana-rulings','nana-writing'];
  const moduleSource = factories.map((name,i) => `import e${i} from ${JSON.stringify(pathToFileURL(path.join(pack,'extensions',name+'.ts')).href)};`).join('\n') + `
export function loadProjectContextFiles(){return [];}
export class DefaultResourceLoader {
 constructor(options){this.options=options;}
 async reload(){this.extensions=${JSON.stringify(factories)}.map((name,i)=>{const handlers=new Map();[e0,e1,e2][i]({on:(key,fn)=>handlers.set(key,[fn])});return {path:name+'.ts',resolvedPath:name+'.ts',handlers};});}
 getExtensions(){return {extensions:this.options.noExtensions?[]:this.extensions,errors:[]};}
}
`;
  const pkg = path.join(bin,'node_modules/@earendil-works/pi-coding-agent');
  write(path.join(pkg,'package.json'), JSON.stringify({ name:'@earendil-works/pi-coding-agent', version:'9.9.9-fixture',type:'module',bin:{pi:'cli.cjs'} }));
  write(path.join(pkg,'dist/index.js'), moduleSource);
  const body = `const fs=require('node:fs'); const {pathToFileURL}=require('node:url');
(async()=>{const a=process.argv.slice(2),prompts=[];
for(let i=0;i<a.length;i++)if(a[i]==='--append-system-prompt')prompts.push(fs.existsSync(a[i+1])?fs.readFileSync(a[++i],'utf8'):a[++i]);
const gate=await import(${JSON.stringify(pathToFileURL(path.join(pack,'extensions/nana-gate.ts')).href)});
const h={};if(!a.includes('-ne')&&!a.includes('--no-extensions'))gate.default({on:(n,f)=>h[n]=f});
const ctx={cwd:process.cwd(),hasUI:false,isProjectTrusted:()=>false};
if(h.session_start)await h.session_start({reason:'startup'},ctx);
const refusals=[];for(const toolName of ['bash','powershell'])refusals.push(h.tool_call?await h.tool_call({toolName,input:{command:'git credential fill'}},ctx):null);
const text=a.includes('--append-system-prompt-file')?fs.readFileSync(a[a.indexOf('--append-system-prompt-file')+1],'utf8'):null;
let sections=null;if(!a.includes('--append-system-prompt-file')&&!a.includes('--settings')){const {DefaultResourceLoader}=await import(${JSON.stringify(pathToFileURL(path.join(pkg,'dist/index.js')).href)});if(DefaultResourceLoader){const loader=new DefaultResourceLoader({});await loader.reload();const event={systemPromptOptions:{sections:{}}};for(const ext of loader.getExtensions().extensions)for(const fn of ext.handlers.get('session_start')??[])await fn({reason:'startup'},ctx);for(const ext of loader.getExtensions().extensions)for(const fn of ext.handlers.get('before_agent_start')??[])await fn(event,ctx);sections=event.systemPromptOptions.sections;}}
fs.appendFileSync(process.env.CC_CAPTURE,JSON.stringify({a,prompts,text,sections,role:process.env.NANA_ROLE,refusals})+'\\n');
console.log('VERDICT: LAND\\nReview complete.');})();`;
  write(path.join(pkg,'cli.cjs'), `#!${process.execPath}\n${body}`);
  if (process.platform === 'win32') { writeFakePi(bin, body); write(path.join(bin,'claude.cmd'), `@echo off\r\n"${process.execPath}" "${path.join(pkg,'cli.cjs')}" %*\r\n`); }
  else { fs.chmodSync(path.join(pkg,'cli.cjs'),0o755); fs.symlinkSync(path.join(pkg,'cli.cjs'),path.join(bin,'pi')); fs.symlinkSync(path.join(pkg,'cli.cjs'),path.join(bin,'claude')); }
  const env = { ...process.env, HOME:home, USERPROFILE:home, PI_CODING_AGENT_DIR:agent, PATH:`${bin}${path.delimiter}${process.env.PATH}`, CC_CAPTURE:capture };
  delete env.CLAUDE_CONFIG_DIR; delete env.NANA_ROLE;
  return { dir,lane,home,agent,bin,brief,env,capture,log,roster,pkg };
}
function launch(f, kind, claude = false) {
  const out = path.join(f.dir, `out-${++serial}`);
  const args = kind === 'pi-worker' ? ['--lane','example','--lane-size',claude?'larger':'small','--brief',f.brief,'--out',out,'--poll','0.05']
    : kind === 'slot' ? ['--slot','adversary','--brief',f.brief,'--out',out,'--poll','0.05']
    : kind === 'claude-review' ? ['--item',`item-${serial}`,'--tree',f.lane,'--brief',f.brief,'--out',out]
    : ['--item',`item-${serial}`,'--out',out,'--poll','0.05','--','--provider','fake','--model','fake','--append-system-prompt',f.brief,'-p','review'];
  const r=spawnSync(process.execPath,[path.join(pack,'bin',kind==='slot'?'pi-worker.mjs':kind+'.mjs'),...args],{cwd:f.lane,env:f.env,encoding:'utf8',timeout:25_000});
  assert.equal(r.status,0,r.stderr); return rows(f.capture).at(-1);
}
async function compose(file, f, role, opts = {}) {
  if(role===null)delete process.env.NANA_ROLE;else process.env.NANA_ROLE=role;
  const h={}; (await import(new URL('../extensions/'+file+'.ts',import.meta.url))).default({on:(key,fn)=>h[key]=fn},opts);
  const ctx={cwd:f.lane,hasUI:false,isProjectTrusted:()=>false};
  await h.session_start({reason:'startup'},ctx);
  const event={systemPromptOptions:{sections:{}}}; await h.before_agent_start(event,ctx); return event.systemPromptOptions.sections;
}
const cases=[]; const test=(title,fn)=>cases.push({title,fn});
// req: R-3915
test('M1: launcher roles omit rulings and no-role sessions retain exact text',async()=>{
 const f=fixture();process.env.PI_CODING_AGENT_DIR=f.agent;
 const expected='## Standing rulings (nana)\n\n'+fs.readFileSync(path.join(f.agent,'nana-rulings.md'),'utf8');
 assert.equal((await compose('nana-rulings',f,null))['nana-rulings'],expected);
 for(const role of LAUNCHER_ROLES)assert.equal((await compose('nana-rulings',f,role))['nana-rulings'],undefined);
 assert.equal((await compose('nana-rulings',f,null))['nana-rulings'],expected);
});
// req: R-3916
test('M2: launcher roles omit writing while seats retain the rule and live disable',async()=>{
 const f=fixture();process.env.PI_CODING_AGENT_DIR=f.agent;
 const expected=(await import('../extensions/nana-writing.ts')).buildBlock().block;
 assert.equal((await compose('nana-writing',f,null))['nana-writing'],expected);
 for(const role of LAUNCHER_ROLES)assert.equal((await compose('nana-writing',f,role))['nana-writing'],undefined);
 write(path.join(f.agent,'nana-pack.json'),JSON.stringify({writing:{enabled:false}}));
 assert.equal((await compose('nana-writing',f,null))['nana-writing'],undefined);
});
// req: R-3917
test('M3: real lane argv delivers the committed-file privacy rule',async()=>{
 const f=fixture(), call=launch(f,'pi-worker');
 assert.ok(call.prompts.join('\n').includes("Committed files carry no owner name and nothing about the owner's work."));
});
// req: R-3918
test('M4: every pi child path keeps extensions and credential refusal',async()=>{
 for(const kind of ['pi-worker','slot','pi-review']){
  const f=fixture();
  for(const fallback of kind==='slot'?[true,false]:[true]){
   if(!fallback){f.roster.adversary=f.roster.builder;write(path.join(f.agent,'nana-pack.json'),JSON.stringify({roster:f.roster}));}
   const call=launch(f,kind);
   assert.ok(LAUNCHER_ROLES.includes(call.role));
   assert.ok(!call.a.some(arg=>['-ne','--no-extensions','--bare'].includes(arg)));
   for(const result of call.refusals){assert.equal(result?.block,true);assert.match(result.reason,/credential rule/);}
  }
 }
});
// req: R-3919
test('M5: pi logs composed sections including zero skips and unavailable measurements',async()=>{
 for(const kind of ['pi-worker','slot','pi-review']){
  const f=fixture();
  write(path.join(f.agent,'nana-rulings.md'),fs.readFileSync(path.join(pack,'rules/nana-rulings.md'),'utf8'));
  const call=launch(f,kind);const line=rows(f.log).at(-1);
  if(kind==='pi-worker')console.log('DELIVERED builder',JSON.stringify(line.parts.map(({name,fullChars,deliveredChars})=>({name,fullChars,deliveredChars}))));
  for(const name of ['nana-objective','nana-rulings','nana-writing','nana-install-stale','nana-project-stale']){
   const part=line.parts.find(p=>p.name===name);assert.ok(part, name);
   if(name==='nana-objective')assert.ok(part.deliveredChars>0);else assert.equal(part.deliveredChars,0,name);
  }
  for(const part of line.parts.filter(p=>p.name.startsWith('nana-')))assert.equal(part.deliveredChars,(call.sections[part.name]??'').length);
  write(path.join(f.pkg,'dist/index.js'),'export function loadProjectContextFiles(){return [];}');
  launch(f,kind);for(const part of rows(f.log).at(-1).parts.filter(p=>p.name.startsWith('nana-')))assert.equal(part.deliveredChars,'unavailable');
  assert.equal(rows(f.log).at(-1).parts.filter(p=>p.name.startsWith('nana-')).length,5);
 }
});
// req: R-3920
test('M6: both Claude launchers log all instruction surfaces imports and unreadable files',async()=>{
 for(const kind of ['pi-worker','claude-review'])for(const newline of ['\n','\r\n']){
  const f=fixture();
  if(newline==='\r\n'){f.home=f.dir;f.env.HOME=f.dir;f.env.USERPROFILE=f.dir;}
  const files=new Map([
   ['CLAUDE.md',`@AGENTS.md \t${newline}@missing.md${newline}@unreadable.md`],['AGENTS.md',`# Imported 你好${newline}@nested.md \t`],['nested.md','Nested. \t'],
   ['CLAUDE.local.md','Local.'],['.claude/CLAUDE.md','Dot folder.'],['.claude/rules/one.md','One.'],['.claude/rules/nested/two.md','Two.'],['.claude/rules/paths.md',`---${newline}paths: [src/**]${newline}---${newline}Conditional. \t`],
  ]);
  for(const [file,text]of files)write(path.join(f.lane,file),text);
  fs.mkdirSync(path.join(f.lane,'unreadable.md'));
  write(path.join(f.home,'.claude/CLAUDE.md'),'User.');write(path.join(f.home,'.claude/rules/user.md'),'User rule.');
  launch(f,kind,true);const parts=rows(f.log).at(-1).parts.filter(p=>p.name==='Claude instruction');
  for(const [file,text]of files){const part=parts.find(p=>p.source===path.join(f.lane,file));assert.ok(part,file);assert.equal(part.fullChars,text.length);assert.equal(part.deliveredChars,file.endsWith('/paths.md')?'unavailable':text.length);}
  for(const name of ['missing.md','unreadable.md'])assert.equal(parts.find(p=>p.source===path.join(f.lane,name)).deliveredChars,'unavailable');
  for(const [suffix,text]of [['CLAUDE.md','User.'],['rules/user.md','User rule.']]){const part=parts.find(p=>p.source===path.join(f.home,'.claude',suffix));assert.ok(part,suffix);assert.equal(part.fullChars,text.length);assert.equal(part.deliveredChars,newline==='\r\n'?0:text.length);}
 }
});
const original={...process.env};
try { for(const c of cases){if(process.env.CHILD_CONTEXT_CASE&&!c.title.startsWith(process.env.CHILD_CONTEXT_CASE))continue;let timer;try{await Promise.race([Promise.resolve().then(c.fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('case limit')),90_000);})]);console.log('PASS',c.title);}catch(e){console.log('FAIL',c.title,e.stack);process.exitCode=1;}finally{clearTimeout(timer);}} }
finally {process.env=original;fs.rmSync(temp,{recursive:true,force:true});}
