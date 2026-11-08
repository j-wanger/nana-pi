/**
 * @module packages/nana-pack/tests/leak-scan.test.mjs
 * @purpose Pin the leak guard's must-meet cases, round-one fixes and per-file byte seal.
 * @inputs Injected digests and machine paths, shipped guidance, and OS-temp git ranges and fake builders.
 * @outputs Awaited bounded PASS/FAIL cases with no matched text in diagnostics.
 * @effects disk (OS-temp fixtures only), process (bounded git, CLI and fake worker children)
 * @errors Assertions set a nonzero exit; fixture failures throw.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from './fake-pi.mjs';
import { buildRecordsPath, buildReportLines, buildEndRecord } from '../lib/build-records.mjs';
import { runBuildReport } from '../bin/build-report.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const temp = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), 'leak-guard-')));
const word = 'quux';
const config = { wordDigests: [createHash('sha256').update(word).digest('hex')], wordLengths: [4], allowlist: [{path:'outside.log',counts:[1],reason:'byte-pinned'}] };
let failures = 0, serial = 0, detail;
// Never print assertion messages or child output: either can contain matched text.
function safeDetail(value) {
  if (typeof value === 'string') {
    for (const secret of [word, temp, os.homedir(), os.tmpdir(), process.env.HOME, process.env.USERPROFILE].filter(Boolean)) value=value.replaceAll(secret,'<redacted>');
    return value.replace(/[A-Za-z]:[\\/][^\s"']*/g,'<machine-path>').replace(/\/(?:[^\s/"']+\/)+[^\s"']*/g,'<machine-path>');
  }
  if (Array.isArray(value)) return value.map(safeDetail);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,safeDetail(item)]));
  return value;
}
async function check(title, fn) {
  let timer;
  const started=Date.now(); detail={};
  try {
    await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => {timer=setTimeout(()=>reject(Error('case limit')), 60000);})]);
    assert.ok(Date.now()-started<=60000,'case exceeded limit');
    console.log('PASS', title);
  } catch (error) {
    failures++;
    console.log('FAIL', title, JSON.stringify(safeDetail({error:error.code ?? error.name,operator:error.operator,actual:error.actual,expected:error.expected,detail,at:error.stack?.split('\n').filter(line=>line.trimStart().startsWith('at ')).slice(0,2)})));
  }
  finally { clearTimeout(timer); }
}
function run(command, args, cwd, options={}) {
  const r=spawnSync(command,args,{cwd,encoding:'utf8',timeout:20000,...options});
  detail={...detail,child:{exit:r.status,signal:r.signal,error:r.error?.code}};
  assert.equal(r.error,undefined); return r;
}
function git(cwd,...args) {
  const r=run('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false',...args],cwd);
  assert.equal(r.status,0); return r.stdout.trim();
}
function put(cwd,file,text) {fs.mkdirSync(path.dirname(path.join(cwd,file)),{recursive:true});fs.writeFileSync(path.join(cwd,file),text);}
function commit(cwd) {git(cwd,'add','.');git(cwd,'commit','-qm','fixture');return git(cwd,'rev-parse','HEAD');}
function fixture() {const cwd=path.join(temp,`repo-${++serial}`);fs.mkdirSync(cwd);git(cwd,'init','-q','-b','main');put(cwd,'outside.log',word);const base=commit(cwd);return {cwd,base};}
const api=()=>import('../lib/leak-scan.mjs');
const cli=()=>import('../bin/leak-scan.mjs');
const options=f=>({...f,tip:'HEAD',config,home:'/home/ab',tmp:'/scratch/fixture',platform:'linux'});
let identity, forms, workerRuns;
// req: R-3748
await check('M1: exact preamble sentence and chained seat bullet',()=>{
  const preamble=fs.readFileSync(path.join(root,'packages/nana-pack/prompts/builder-preamble.md'),'utf8');
  const sentence='Committed logs and evidence use repo-relative paths, ~ or $TMPDIR, never an absolute home or temp path.';
  assert.ok(preamble.split('Before you report\n')[1].split('Report shape:')[0].includes(sentence));
  const bullet='- Before pushing a lane branch, run `node "$HOME/nana-pi/packages/nana-pack/bin/leak-scan.mjs" --base main --tip HEAD` chained with `&&` to the push; on a hit, fix the commit before any push.';
  assert.equal(fs.readFileSync(path.join(root,'packages/nana-setup/claude/rules/nana-seat.md'),'utf8').split(bullet).length,2);
});
// req: R-3749
await check('M2: identity range has no outside allowlist bleed',async()=>{
  const f=fixture();put(f.cwd,'r2-a.log',`${word} \t\r\n${word} \t`);const tip=commit(f.cwd);
  identity={...options(f),tip};
  assert.deepEqual((await api()).scanCommitRange(identity),{hits:[{path:'r2-a.log',commit:git(f.cwd,'rev-parse','--short',tip),kind:'identity',wordIndex:0,count:2}],skipped:[]});
});
// req: R-3750
await check('M3: tip blobs range deletions and new rename paths',async()=>{
  const {scanCommitRange}=await api();const f=fixture();
  put(f.cwd,'deleted.log',word);put(f.cwd,'old.log',word);const base=commit(f.cwd);
  put(f.cwd,'committed.log',word);put(f.cwd,'clean.log','clean');fs.unlinkSync(path.join(f.cwd,'deleted.log'));git(f.cwd,'mv','old.log','new.log');
  const tip=commit(f.cwd);put(f.cwd,'committed.log','fixed');put(f.cwd,'clean.log',word);
  assert.deepEqual(scanCommitRange({...options(f),base,tip}).hits,[{path:'committed.log',commit:git(f.cwd,'rev-parse','--short',tip),kind:'identity',wordIndex:0,count:1},{path:'new.log',commit:git(f.cwd,'rev-parse','--short',tip),kind:'identity',wordIndex:0,count:1}]);
});
// req: R-3751
await check('M4: literal home and temp forms honor suffix boundaries',async()=>{
  const {scanCommitRange}=await api();forms=[];
  for(const [platform,home,text] of [
    ['linux','/home/ab','/home/ab/x'],['linux','/home/ab','/home/ab"'],
    ['linux','/home/ab','/home/ab \t\r\n'],['linux','/home/ab','/home/ab'],
    ['win32','C:\\Users\\ab','C:\\Users\\ab\\x'],['win32','C:\\Users\\ab','C:/Users/ab/x'],
    ['win32','C:\\Users\\ab','/c/Users/ab/x'],['win32','C:\\Users\\ab','c:\\uSERS\\AB\\x'],
  ]) {
    const f=fixture();put(f.cwd,'forms.log',text);const tip=commit(f.cwd);const opts={...options(f),tip,platform,home};forms.push(opts);
    assert.deepEqual(scanCommitRange(opts),{hits:[{path:'forms.log',commit:git(f.cwd,'rev-parse','--short',tip),kind:'home',count:1}],skipped:[]});
  }
  const f=fixture();put(f.cwd,'negative.log','/home/abc/x ~/x $HOME/x');put(f.cwd,'temp.log','/scratch/fixture/x');commit(f.cwd);
  assert.deepEqual(scanCommitRange(options(f)).hits,[{path:'temp.log',commit:git(f.cwd,'rev-parse','--short','HEAD'),kind:'temp',count:1}]);
});
// req: R-3751
await check('M4: Windows given and real spellings each count once',async()=>{
  const {scanCommitRange}=await api();
  const short='C:\\Users\\FIXTUR~1', long='C:\\Users\\fixture-user';
  for (const [given,real] of [[short,long],[long,short]]) {
    for (const kind of ['home','temp']) {
      for (const spelling of [given,real]) {
        for (const text of [spelling+'\\log',spelling.replaceAll('\\','/')+'/log',`/c/${spelling.slice(3).replaceAll('\\','/')}/log \t\r\n`]) {
          const f=fixture();put(f.cwd,'alias.log',text);commit(f.cwd);
          detail={kind,given:given===short?'short':'long',real:real===short?'short':'long',normalized:text.replaceAll('\\','/').replaceAll(short.replaceAll('\\','/'),'<short>').replaceAll(long.replaceAll('\\','/'),'<long>').replaceAll('/c/Users/','<msys>/')};
          const opts={...options(f),platform:'win32',[kind==='home'?'home':'tmp']:given,realPath:value=>value===given?real:value};
          assert.deepEqual(scanCommitRange(opts),{hits:[{path:'alias.log',commit:git(f.cwd,'rev-parse','--short','HEAD'),kind,count:1}],skipped:[]});
        }
      }
    }
  }
});
// req: R-3751 R-3835 R-3837
await check('M4: every platform matches given and real machine roots once',async()=>{
  const {scanCommitRange,machineCount}=await api();
  for (const platform of ['darwin','linux','win32']) {
    for (const kind of ['home','temp']) {
      for (const [given,real] of [['/var/folders/fixture/T','/private/var/folders/fixture/T'],['/private/var/folders/fixture/T','/var/folders/fixture/T']]) {
        for (const spelling of [given,real]) {
          for (const ending of ['',' \t\r\n']) {
            // The matcher owns spelling semantics; repeated git setup must not consume the case's deadline.
            assert.equal(machineCount(spelling+'/log'+ending,given,platform,value=>value===given?real:value),1);
          }
        }
      }
    }
    // Keep the default's given spelling too, rather than canonicalizing it before matching.
    for (const spelling of [os.tmpdir(),'/resolved/temp-fixture']) {
      const f=fixture();put(f.cwd,'default.log',spelling+'/log');commit(f.cwd);
      const result=scanCommitRange({...options(f),platform,home:'',tmp:undefined,realPath:value=>value===os.tmpdir()?'/resolved/temp-fixture':value});
      assert.equal(result.hits.length,1);assert.equal(result.hits[0].kind,'temp');assert.equal(result.hits[0].count,1);
    }
  }
});
// req: R-3750
await check('M3: history retains removed leaks from the merge-base',async()=>{
  const {scanCommitRange,leakScanLines}=await api();const f=fixture();
  put(f.cwd,'old-public.log',word);commit(f.cwd);
  git(f.cwd,'checkout','-qb','lane');
  put(f.cwd,'cleaned.log',word+' \t\r\n');put(f.cwd,'deleted.log',word);const leaking=commit(f.cwd);
  put(f.cwd,'cleaned.log','clean');fs.unlinkSync(path.join(f.cwd,'deleted.log'));const tip=commit(f.cwd);
  git(f.cwd,'checkout','main');put(f.cwd,'old-public.log','clean');commit(f.cwd);
  const result=scanCommitRange({...options(f),base:'main',tip});
  const short=git(f.cwd,'rev-parse','--short',leaking);
  assert.deepEqual(result,{hits:[{path:'cleaned.log',commit:short,kind:'identity',wordIndex:0,count:1},{path:'deleted.log',commit:short,kind:'identity',wordIndex:0,count:1}],skipped:[]});
  assert.ok(leakScanLines(result).includes(`leak: cleaned.log (${short}): identity word 0 ×1`));
  let usage='';assert.equal((await cli()).runLeakScan([],{stderr:{write:s=>usage+=s}}),2);
  assert.ok(usage.includes('merge-base'));
});
// req: R-3753
await check('M6: CLI blocks hits and unread skips and rejects unknown refs',async()=>{
  const {LEAK_FILE_MAX_BYTES}=await import('../lib/leak-scan-config.mjs');
  const f=fixture();const env={...process.env,HOME:path.join(temp,'synthetic-home'),USERPROFILE:path.join(temp,'synthetic-home')};
  const command=path.join(root,'packages/nana-pack/bin/leak-scan.mjs');
  const invoke=(base,extra={})=>run(process.execPath,[command,'--base',base,'--tip','HEAD'],f.cwd,{env,...extra});
  let r=invoke(f.base);detail={subcase:'clean range',expectedExit:0,actualExit:r.status};assert.equal(r.status,0);
  put(f.cwd,'home.log',env.HOME+'/log');commit(f.cwd);r=invoke(f.base);detail={subcase:'home hit',expectedExit:1,actualExit:r.status};assert.equal(r.status,1);assert.ok(r.stdout.includes(`leak: home.log (${git(f.cwd,'rev-parse','--short','HEAD')}): home path ×1`));
  const base=git(f.cwd,'rev-parse','HEAD');put(f.cwd,'large.log',Buffer.alloc(LEAK_FILE_MAX_BYTES+1,120));commit(f.cwd);
  const marker=path.join(temp,'blob-reads');const preload=path.join(temp,'read-probe.mjs');
  fs.writeFileSync(preload,`import cp from 'node:child_process';import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const original=cp.execFileSync;cp.execFileSync=(cmd,args,opts)=>{if(args.includes('cat-file')&&(args.includes('blob')||args.includes('-p')))fs.appendFileSync(${JSON.stringify(marker)},JSON.stringify(args)+'\\n');return original(cmd,args,opts)};syncBuiltinESMExports();`);
  r=run(process.execPath,['--import',pathToFileURL(preload).href,command,'--base',base,'--tip','HEAD'],f.cwd,{env});
  detail={subcase:'unread over-cap skip',expectedExit:1,actualExit:r.status};assert.equal(r.status,1);assert.ok(r.stdout.includes(`leak scan skipped: large.log (${git(f.cwd,'rev-parse','--short','HEAD')}):`));assert.equal(fs.existsSync(marker),false);
  r=invoke('unknown-fixture-ref');detail={subcase:'unknown ref',expectedExit:2,actualExit:r.status};assert.equal(r.status,2);assert.ok(r.stderr.includes('unavailable'));
});
// req: R-3754
await check('M7: lane end warns after build line without changing outcome or exit',async()=>{
  const f=fixture(), lane=path.join(temp,'lane'), bin=path.join(temp,'bin'), agent=path.join(temp,'agent'), home=path.join(temp,'private-home');
  for(const p of [bin,agent,home])fs.mkdirSync(p);
  git(f.cwd,'worktree','add','-qb','feat/fixture',lane);
  const brief=path.join(temp,'brief.md');fs.writeFileSync(brief,'Precedent:\n- outside.log\n');
  fs.writeFileSync(path.join(agent,'nana-pack.json'),JSON.stringify({roster:{scout:null,builder:{provider:'fixture',model:'fixture',thinking:null},largerBuilder:null,reviewer:{provider:'fixture',model:'fixture',thinking:null},land:null}}));
  const body=`const fs=require('node:fs'),cp=require('node:child_process');fs.writeFileSync('build.log',process.env.FIXTURE_LEAK==='yes'?(process.platform==='win32'?process.env.USERPROFILE:process.env.HOME)+'/log ${word}':'clean');for(const args of [['add','build.log'],['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit','--allow-empty','-qm','build']]){if(cp.spawnSync('git',args).status!==0)process.exit(2)}console.log('built');`;
  if(process.platform==='win32')writeFakePi(bin,body);else fs.writeFileSync(path.join(bin,'pi'),`#!${process.execPath}\n${body}`,{mode:0o755});
  const preload=path.join(temp,'scan-failure.mjs');
  fs.writeFileSync(preload,`import cp from 'node:child_process';import {syncBuiltinESMExports} from 'node:module';const original=cp.execFileSync;cp.execFileSync=(cmd,args,opts)=>{if(args[0]==='diff-tree')throw Error('fixture failure');return original(cmd,args,opts)};syncBuiltinESMExports();`);
  workerRuns=[];
  const ledger=buildRecordsPath(path.resolve(lane,git(lane,'rev-parse','--git-common-dir')));
  for(const mode of ['clean','leak','failure']) {
    const env={...process.env,HOME:home,USERPROFILE:home,PI_CODING_AGENT_DIR:agent,PI_CODING_AGENT_SESSION_DIR:path.join(temp,'sessions'),PATH:bin+path.delimiter+process.env.PATH,FIXTURE_LEAK:mode==='leak'?'yes':'no'};
    const r=run(process.execPath,[...(mode==='failure'?['--import',pathToFileURL(preload).href]:[]),path.join(root,'packages/nana-pack/bin/pi-worker.mjs'),'--poll','60','--out',path.join(temp,'out.md'),'--lane','fixture','--brief',brief],lane,{env});
    const end=fs.readFileSync(ledger,'utf8').trim().split('\n').map(JSON.parse).at(-1);workerRuns.push({r,end,home});
    detail={mode,exit:r.status,outcome:end.outcome,recordExit:end.exit,leaks:end.leaks};
    assert.equal(r.status,0);assert.equal(end.outcome,'ok');assert.equal(end.exit,0);
  }
  const [clean,leak,failure]=workerRuns;
  detail={runs:workerRuns.map(({r,end})=>({exit:r.status,outcome:end.outcome,leaks:end.leaks}))};
  assert.deepEqual(clean.end.leaks,{hits:[],skipped:[]});assert.deepEqual(leak.end.leaks.hits.filter(hit=>hit.kind==='home').map(hit=>({kind:hit.kind,count:hit.count})),[{kind:'home',count:1}]);
  const line=`pi-worker: leak: build.log (${leak.end.leaks.hits.find(hit=>hit.kind==='home').commit}): home path ×1`;assert.ok(leak.r.stderr.includes(line));const endIndex=leak.r.stderr.indexOf('pi-worker: build record:');assert.ok(endIndex>=0);assert.ok(leak.r.stderr.indexOf(line)>endIndex);
  assert.equal(typeof failure.end.leaks.unavailable,'string');assert.equal(failure.r.stderr.split('pi-worker: leak scan unavailable:').length,2);
});
// req: R-3752
await check('M5: CLI worker and record never echo matched text',async()=>{
  const {runLeakScan}=await cli();assert.ok(identity&&forms?.length&&workerRuns?.length);
  for(const opts of [identity,...forms]) {
    let text='';assert.equal(runLeakScan(['--base',opts.base,'--tip',opts.tip],{...opts,stdout:{write:s=>text+=s},stderr:{write:s=>text+=s}}),1);
    assert.ok(!text.includes(word)&&!text.includes(opts.home));
    const leaks=(await api()).scanCommitRange(opts);
    const record=buildEndRecord({build:'fixture',startedAt:'2026-01-01T00:00:00Z'},{leaks,found:{usage:{},cost:0,costReason:null,sessions:[],sessionBadLines:0}});
    assert.ok(!JSON.stringify(record).includes(opts.home)&&!JSON.stringify(record).includes(word));
  }
  for(const {r,end,home} of workerRuns) {
    const text=r.stderr+JSON.stringify(end);assert.ok(!text.includes(home)&&!text.includes(word));
  }
});
// req: R-3755
await check('M8: build report lines ignore optional leak metadata',()=>{
  const f=fixture();const start={v:1,kind:'start',build:'fixture',lane:'fixture',startedAt:'2026-01-01T00:00:00Z'};
  const end=buildEndRecord(start,{endedAt:'2026-01-01T00:01:00Z',outcome:'ok',exit:0,found:{usage:{},cost:0,costReason:null,sessions:[],sessionBadLines:0}});
  const common=path.join(f.cwd,'.git');const file=buildRecordsPath(common);fs.mkdirSync(path.dirname(file),{recursive:true});
  const render=leaks=>{fs.writeFileSync(file,[start,{...end,...leaks}].map(JSON.stringify).join('\r\n')+' \t');let text='';assert.equal(runBuildReport([],{cwd:f.cwd,stdout:{write:s=>text+=s}}),0);return text;};
  const withLeaks={leaks:{hits:[{path:'r2-a.log',kind:'identity',wordIndex:0,count:2}],skipped:[]}};
  assert.deepEqual(buildReportLines([start,end]).lines,buildReportLines([start,{...end,...withLeaks}]).lines);
  assert.equal(render({}),render(withLeaks));
});
// req: R-3756
await check('seal: leak file cap is 4194304 bytes',async()=>assert.equal((await import('../lib/leak-scan-config.mjs')).LEAK_FILE_MAX_BYTES,4194304));
fs.rmSync(temp,{recursive:true,force:true});process.exitCode=failures?1:0;
