/**
 * @module packages/nana-pack/tests/ci-wait.test.mjs
 * @purpose Pin CI readiness, cancellation recovery, bounded waiting and its CLI.
 * @inputs Injected Node gh runners, clocks and OS-temp Git repositories.
 * @outputs Awaited bounded requirement-tagged PASS/FAIL cases.
 * @effects disk, process (temporary fixtures only)
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { tmpDir } from "./tmp-dir.mjs";
import { readSuiteRecords } from '../lib/suite-records.mjs';
import { RECORD_SCHEMA, CI_STORE_SUBPATH } from '../lib/suite-records-config.mjs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check } from './profile-fixture.mjs';
import { ciFixture, executeCi, git, workflowRun, runList } from './land-fixtures.mjs';
import * as C from '../lib/land-config.mjs';
import { GH_COMMAND_ENV } from '../lib/suite-records-config.mjs';

const repository = { owner:'example', repo:'fixture' }, tip='a'.repeat(40), branch='remote-head';
const pr = (extra={}) => ({number:7, mergeable:'MERGEABLE', headRefName:branch, headRefOid:tip, headRepository:{name:'fixture'}, headRepositoryOwner:{login:'example'}, ...extra});
const workflowText = fs.readFileSync(new URL('../../../.github/workflows/ci.yml',import.meta.url),'utf8');
const jobs = (attempt=1, extra={}) => [
 ...['macos-latest','ubuntu-latest','windows-latest'].map(os=>({name:`suite (${os})`,status:'completed',conclusion:os==='macos-latest'?'cancelled':'success',run_attempt:attempt})),
 ...['macos-latest','windows-latest'].flatMap(os=>['ceiling','floor'].map(pi=>({name:`install-check (${os}, ${pi})`,status:'completed',conclusion:'success',run_attempt:attempt}))),
 {name:'release',status:'completed',conclusion:'skipped',run_attempt:attempt},
].map(j=>({...j,...(extra[j.name]??{})}));
const cancelled = (attempt=1, extra={}) => workflowRun({run_attempt:attempt,conclusion:'cancelled',path:'.github/workflows/ci.yml',...extra});
function fake({prs=[pr()], runs=()=>[workflowRun()], jobList=r=>jobs(r.run_attempt), log='', fail, slow}={}) {
 let time=0, reads=0; const calls=[], sleeps=[], output=[];
 const options={cwd:process.cwd(),repository,branch,tip,workflowText,env:{GH_HOST:'wrong.invalid',GH_REPO:'wrong/other'},
  now:()=>time, sleep:ms=>{sleeps.push(ms);time+=ms;}, writeLine:l=>output.push(l),
  runGh:(_cwd,args,opts)=>{
   calls.push({args,opts,time}); assert(calls.length<2000,'bounded fake call count');
   slow?.(args,ms=>{time+=ms;},opts);
   if(fail?.(args)) return {status:1,stderr:'injected API failure\r\nmore'};
   let body;
   if(args[0]==='pr') body=typeof prs==='function'?prs():prs;
   else if(args[0]==='run') return {status:0,stdout:args[1]==='view'?log:''};
   else if(args.some(a=>a.includes('/jobs?'))) {
    const endpoint=args.find(a=>a.includes('/jobs?'));
    const attempt=Number(/attempts\/(\d+)/.exec(endpoint)[1]);
    const list=jobList({run_attempt:attempt},endpoint);
    body=Array.isArray(list)?{total_count:list.length,jobs:list}:list;
   } else body=JSON.parse(runList(runs(++reads)));
   return {status:0,stdout:JSON.stringify(body)};
  }};
 return {options,calls,sleeps,output, reruns:()=>calls.filter(c=>c.args[0]==='run'&&c.args[1]==='rerun'), time:()=>time};
}
const api = () => import('../lib/ci-wait.mjs');

// req: R-3720 R-3724
await check('M1: origin-matched remote PR readiness diagnoses absent CI without gating existing runs', async()=>{
 const {ciReadiness,waitForCi}=await api();
 for(const [prs,pattern] of [[[],/no open PR/],[[pr({mergeable:'CONFLICTING'})],/conflicts/],[[pr({mergeable:'UNKNOWN'})],/unknown/i],[[pr({headRefOid:'b'.repeat(40)})],/push the tip/],[[pr(),pr({number:8})],/#7.*#8/],[[pr({headRepositoryOwner:{login:'fork'}})],/no open PR/]]) {
  const f=fake({prs}); const out=await waitForCi(f.options); assert.equal(out.code,1); assert.match(out.text,pattern); assert(!f.calls.some(c=>c.args[0]==='api'));
  const land=ciFixture('diagnosis'); git(land.feature,'config','branch.integration.remote','origin'); git(land.feature,'config','branch.integration.merge',`refs/heads/${branch}`);
  const landPr=prs.map(p=>({...p,headRefOid:p.headRefOid===tip?land.tip:p.headRefOid}));
  const calls=[]; const result=executeCi(land,[],{runGh:(_cwd,args)=>{calls.push(args);return {status:0,stdout:args[0]==='pr'?JSON.stringify(landPr):runList([])};}});
  assert.equal(result.code,1); assert.match(result.text,pattern); assert.match(result.text,new RegExp(`no CI run for ${land.tip.slice(0,8)}`));
  assert.equal(calls.filter(a=>a[0]==='api').length,1); assert.equal(calls.filter(a=>a[0]==='pr').length,1); assert(!calls.some(a=>a[0]==='run'));
 }
 const unknown=fake({prs:[pr({mergeable:'UNKNOWN'})]}); const no=ciReadiness(unknown.options); assert.equal(no.ok,false);assert.match(no.message,/unknown/i);assert.equal(unknown.calls.length,C.CI_READY_READS);assert.deepEqual(unknown.sleeps,Array(C.CI_READY_READS-1).fill(C.CI_READY_DELAY_MS));
 let n=0;const changing=fake({prs:()=>[pr({mergeable:++n===1?'UNKNOWN':'MERGEABLE'})]});assert.equal(ciReadiness(changing.options).ok,true);
 const matched=fake({prs:[pr({headRepositoryOwner:{login:'fork'}}),pr()]});assert.equal(ciReadiness(matched.options).pr.number,7);
 const f=fake();assert.equal(ciReadiness(f.options).ok,true); const a=f.calls[0];assert(a.args.includes('github.com/example/fixture')); assert(a.args.includes(branch)); assert.equal(a.opts.env.GH_HOST,'github.com');
 const skip=ciFixture('no-ci',{workflowOnTip:false});const skipped=executeCi(skip,[],{runGh:()=>{throw Error('no-CI must not call gh');}});assert.equal(skipped.code,0,skipped.text);assert.match(skipped.text,/CI not read/);
 const land=ciFixture('push-no-pr'); const calls=[]; const out=executeCi(land,[workflowRun({event:'push'})],{runGh:(_cwd,args)=>{calls.push(args);return {status:0,stdout:runList([workflowRun({event:'push'})])};}});assert.equal(out.code,0,out.text);assert(!calls.some(a=>a[0]==='pr'));
});

// req: R-3721
await check('M2: capacity retries wait for attempt advancement and stop after two writes per workflow',async()=>{
 const {waitForCi}=await api();
 const f=fake({runs:n=>[cancelled(n<4?1:n<6?2:3)]}); const out=await waitForCi(f.options);
 assert.equal(out.code,1); assert.match(out.text,/3 attempts/); assert.equal(f.reruns().length,2); assert(f.calls.filter(c=>c.args[0]==='api'&&c.args.some(a=>a.includes('/actions/runs?'))).length>=6);
 for(const c of f.reruns()) assert.deepEqual(c.args,['run','rerun','101','--failed','--repo','github.com/example/fixture']);
 const regression=fake({runs:n=>[n===1||n===2||n===4?cancelled():n===3?workflowRun({run_attempt:2,status:'in_progress',conclusion:null}):n===5?cancelled(2):workflowRun({run_attempt:3})]});const resumed=await waitForCi(regression.options);assert.equal(resumed.code,0,resumed.text);assert.equal(regression.reruns().length,2);assert.equal(regression.reruns()[1].time,4*C.CI_POLL_INTERVAL_MS,'a stale earlier attempt after observed advancement cannot receive another write');
 const failed=fake({runs:()=>[cancelled()],fail:a=>a[0]==='run'});const bad=await waitForCi(failed.options);assert.equal(bad.code,1);assert.match(bad.text,/rerun.*injected API failure/);assert.equal(failed.reruns().length,1);assert.equal(failed.output.length,0);
 const pages=fake({runs:n=>[n===1?cancelled():workflowRun({run_attempt:2})],jobList:(r,endpoint)=>endpoint.includes('page=2')?{total_count:101,jobs:jobs(r.run_attempt).slice(1)}:{total_count:101,jobs:[...Array(94)].map((_,i)=>({name:`extra ${i}`,status:'completed',conclusion:'success',run_attempt:r.run_attempt})).concat(jobs(r.run_attempt).slice(0,1))}});
 // Inconsistent total_count must never authorize a write.
 const partial=await waitForCi(pages.options);assert.equal(partial.code,1);assert.equal(pages.reruns().length,0);
 const paged=fake({runs:n=>[n===1?cancelled():workflowRun({run_attempt:2})],jobList:(r,endpoint)=>endpoint.includes('&page=2')?{total_count:101,jobs:jobs(r.run_attempt).slice(1)}:{total_count:101,jobs:[...Array(93)].map((_,i)=>({name:`extra ${i}`,status:'completed',conclusion:'success',run_attempt:r.run_attempt})).concat(jobs(r.run_attempt).slice(0,1))}});
 // Pagination uses total_count, not a short-page heuristic.
 const good=await waitForCi(paged.options);assert.equal(good.code,0,good.text);assert.equal(paged.reruns().length,1);assert(paged.calls.some(c=>c.args.some(a=>a.includes('&page=2'))));
 const two=fake({runs:n=>[n<3?cancelled():workflowRun({run_attempt:2}),n<5?cancelled(1,{workflow_id:2,id:202,name:'other'}):workflowRun({workflow_id:2,id:202,name:'other',run_attempt:2})]});const both=await waitForCi(two.options);assert.equal(both.code,0,both.text);assert.equal(two.reruns().length,2);
});

// req: R-4000
await check('R-4000: UNKNOWN readiness at an unchanged head permits the capacity rerun',async()=>{
 const {waitForCi}=await api();let reads=0;
 const f=fake({prs:()=>[pr({mergeable:++reads===1?'MERGEABLE':'UNKNOWN'})],runs:n=>[n===1?cancelled():workflowRun({run_attempt:2})]});
 const out=await waitForCi(f.options);assert.equal(out.code,0,out.text);assert.equal(f.reruns().length,1);assert.equal(reads,2);
});

// req: R-3722
await check('M3: real PR job lists distinguish advisory Linux failure from blocking failures and partial data',async()=>{
 const {classifyRun,waitForCi}=await api();
 assert.equal(classifyRun(cancelled(),jobs(),{workflowText}),'capacity-cancelled');
 assert.equal(classifyRun(cancelled(),jobs(1,{'release':{conclusion:'neutral'}}),{workflowText}),'capacity-cancelled');
 const linux=jobs(1,{'suite (ubuntu-latest)':{conclusion:'failure'}});assert.equal(classifyRun(cancelled(),linux,{workflowText}),'capacity-cancelled');
 const advisory=fake({runs:n=>[n===1?cancelled():workflowRun({run_attempt:2})],jobList:()=>linux});const recovered=await waitForCi(advisory.options);assert.equal(recovered.code,0,recovered.text);assert.equal(advisory.reruns().length,1);
 for(const text of [workflowText,workflowText.replaceAll('\n','\r\n'),workflowText.split('\n').map(l=>l+' \t').join('\n').trimEnd()]) assert.equal(classifyRun(cancelled(),linux,{workflowText:text}),'capacity-cancelled');
 assert.equal(classifyRun(cancelled(),linux,{workflowText:workflowText.replace('continue-on-error:','disabled:')}),'failed');
 for(const list of [[],jobs(2),jobs(1,{'release':{status:'queued',conclusion:null}}),jobs(1,{'suite (windows-latest)':{conclusion:'failure'}}),jobs(1,{'suite (ubuntu-latest)':{conclusion:'timed_out'}}),jobs(1,{'install-check (macos-latest, floor)':{conclusion:'failure'}})]) {
  assert.equal(classifyRun(cancelled(),list,{workflowText}),'failed');const f=fake({runs:()=>[cancelled()],jobList:()=>list});const out=await waitForCi(f.options);assert.equal(out.code,1);assert.equal(f.reruns().length,0);
 }
 const land=ciFixture('capacity-wording');const result=executeCi(land,[cancelled()],{runGh:(_cwd,args)=>({status:0,stdout:args.some(a=>a.includes('/jobs?'))?JSON.stringify({total_count:8,jobs:jobs()}):runList([cancelled()])})});assert.equal(result.code,1);assert.match(result.text,/capacity-cancelled/);assert.match(result.text,new RegExp(`nana-ci-wait --tip ${land.tip}`));
});

// req: R-3723
await check('M4: one deadline bounds readiness jobs reruns pending absent runs and API failures',async()=>{
 const {waitForCi}=await api();
 for(const status of ['queued','in_progress','absent']) {
  const f=fake({runs:()=>status==='absent'?[]:[workflowRun({status,conclusion:null})]});const out=await waitForCi(f.options);assert.equal(out.code,1);assert.match(out.text,/CI did not finish/);if(status!=='absent') assert.match(out.text,/101/); assert(f.sleeps.every(ms=>ms<=C.CI_POLL_INTERVAL_MS));assert.equal(f.time(),C.CI_WAIT_TIMEOUT_MS);
 }
 for(const phase of ['pr','jobs','rerun']) {
  const f=fake({runs:()=>[cancelled()],slow:(a,advance,opts)=>{if(a[0]===phase || (phase==='jobs'&&a.some(x=>x.includes('/jobs?'))) || (phase==='rerun'&&a[0]==='run')) advance(C.CI_WAIT_TIMEOUT_MS); assert(opts.timeoutMs>0&&opts.timeoutMs<=C.CI_READ_TIMEOUT_MS);}});
  const out=await waitForCi(f.options);assert.equal(out.code,1);assert.match(out.text,/CI did not finish/);assert(f.calls.every(c=>c.time<C.CI_WAIT_TIMEOUT_MS));
 }
 const near=fake({slow:(a,advance,opts)=>{if(a[0]==='pr') advance(C.CI_WAIT_TIMEOUT_MS-7);else {assert.equal(opts.timeoutMs,7);advance(7);}}});const end=await waitForCi(near.options);assert.equal(end.code,1);assert.match(end.text,/CI did not finish/);assert.equal(near.calls.length,2);
 const remaining=fake({prs:()=>[pr({mergeable:'UNKNOWN'})],slow:(_a,advance)=>advance(C.CI_READ_TIMEOUT_MS)});const unknown=await waitForCi(remaining.options);assert.equal(unknown.code,1);assert.match(unknown.text,/unknown/i);
 for(const phase of ['pr','jobs','runs']) {const f=fake({runs:()=>[cancelled()],fail:a=>phase==='pr'?a[0]==='pr':a.some(x=>x.includes(phase==='jobs'?'/jobs?':'/actions/runs?'))}); const out=await waitForCi(f.options);assert.equal(out.code,1);assert.match(out.text,/injected API failure/);assert.equal(f.reruns().length,0);}
});

// req: R-3724
await check('M5: waiter and Node-fake CLI print judgeRuns success lines and rerun notes',async()=>{
 const {waitForCi}=await api();const {judgeRuns}=await import('../lib/land-ci.mjs');
 const f=fake({runs:n=>[n===1?cancelled():workflowRun({run_attempt:2})]});const out=await waitForCi(f.options);assert.equal(out.code,0,out.text);assert(out.text.includes(judgeRuns(runList([workflowRun({run_attempt:2})]),tip,repository).lines[0]));assert.match(out.text,/rerun.*101/);assert.equal(f.output.length,1);
 const fixture=ciFixture('cli');git(fixture.feature,'config','branch.integration.remote','origin');git(fixture.feature,'config','branch.integration.merge',`refs/heads/${branch}`);
 const script=path.join(fixture.root,'fake-gh.mjs'),log=path.join(fixture.root,'calls.jsonl');
 fs.writeFileSync(script,`import fs from 'node:fs'; const a=process.argv.slice(2); fs.appendFileSync(${JSON.stringify(log)},JSON.stringify(a)+'\\n'); const p=${JSON.stringify(pr({headRefOid:fixture.tip}))}; process.stdout.write(JSON.stringify(a[0]==='pr'?[p]:${runList([workflowRun()])}));`);
 const env={...process.env,GH_HOST:'wrong.invalid',GH_REPO:'wrong/other',[GH_COMMAND_ENV]:JSON.stringify([process.execPath,script])};
 const cli=fileURLToPath(new URL('../bin/nana-ci-wait.mjs',import.meta.url));
 const child=spawnSync(process.execPath,[cli,'--tip',fixture.tip],{cwd:fixture.feature,env,encoding:'utf8',timeout:30000});assert.equal(child.status,0,child.stderr+child.stdout);assert.match(child.stdout,/ci: ci run 101/);const calls=fs.readFileSync(log,'utf8').trim().split('\n').map(JSON.parse);assert(calls[0].includes(branch));assert(calls[0].includes('github.com/example/fixture'));
 const invalid=spawnSync(process.execPath,[cli,'--bogus'],{cwd:fixture.feature,env,encoding:'utf8',timeout:30000});assert.equal(invalid.status,2);assert.match(invalid.stderr,/usage/);
});

// req: R-3992
await check('M7: superseded capacity waiters never rerun each other',async()=>{
 const {waitForCi}=await api();
 const old='b'.repeat(40), head='c'.repeat(40);
 for(const waited of [tip,old]) {
  let reads=0;
  const f=fake({prs:()=>[pr({headRefOid:++reads===1?waited:head})],runs:()=>[cancelled()]});
  const out=await waitForCi({...f.options,tip:waited});
  assert.equal(out.code,1);assert.equal(out.text,`ci: superseded at ${waited}: branch now at ${head}\n`);assert.equal(f.reruns().length,0);
  console.log(out.text.trim());
 }
});

// req: R-3993
await check('M8: red lane jobs print FAIL paths across line endings',async()=>{
 const {waitForCi}=await api();
 for(const suffix of ['\n','\r\n',' \t\r\n','']) {
  const f=fake({runs:()=>[workflowRun({conclusion:'failure'})],jobList:()=>[{id:71,name:'suite (macos-latest)',status:'completed',conclusion:'failure',run_attempt:1}],log:`suite\ttest\t2026-11-09T00:00:00Z FAIL  packages/p/tests/red.test.mjs${suffix}`});
  const out=await waitForCi(f.options);assert.equal(out.code,1);assert.match(out.text,/ci: suite \(macos-latest\): packages\/p\/tests\/red.test.mjs/);assert.equal(f.reruns().length,0);
  assert(f.calls.some(c=>c.args.includes('--attempt')&&c.args.includes('71')));
 }
});

function mainWaitFake({id=101,fail=true,persistent=false,extraPending=false,absent=false,startAttempt=1,failedName='suite (windows-latest)',log='job\tstep\t2026-11-09 FAIL  packages/p/tests/red.test.mjs \t\r\n',logUnavailable=false}={}) {
 const root=tmpDir(path.join(os.tmpdir(),'main-wait-')),calls=[];
 let time=0,attempt=startAttempt,reads=0;
 const run=()=>workflowRun({id,workflow_id:1,head_sha:tip,head_branch:'main',event:'push',path:'.github/workflows/ci.yml',run_attempt:attempt,conclusion:fail&&(attempt===1||persistent)?'failure':'success'});
 const latestJobs=()=>[
  ...['macos-latest','ubuntu-latest','windows-latest'].map((leg,i)=>({id:70+i,name:`suite (${leg})`,status:'completed',conclusion:`suite (${leg})`===failedName&&fail&&(attempt===1||persistent)?'failure':'success',run_attempt:attempt})),
  ...['macos-latest','windows-latest'].flatMap(os=>['floor','ceiling'].map(pi=>({id:80,name:`install-check (${os}, ${pi})`,status:'completed',conclusion:`install-check (${os}, ${pi})`===failedName&&fail&&(attempt===1||persistent)?'failure':'success',run_attempt:attempt}))),
 ];
 const runGit=(_root,args)=>({status:0,stdout:args[0]==='remote'?'https://github.com/example/fixture.git':args.includes('--git-common-dir')?root:tip});
 const options={cwd:root,tempRoot:root,sha:tip,env:{GH_REPO:'wrong/other',GH_HOST:'wrong.invalid'},runGit,now:()=>time,sleep:ms=>{time+=ms;},runGh:(_root,args,opts)=>{
  calls.push(args);assert(calls.length<2000);assert(opts.timeoutMs>0&&opts.timeoutMs<=C.CI_READ_TIMEOUT_MS);
  if(args[0]==='repo') return {status:0,stdout:JSON.stringify({nameWithOwner:'example/fixture'})};
  if(args[0]==='run') {
   if(args[1]==='rerun') {attempt++;return {status:0,stdout:''};}
   if(args[1]==='view') return logUnavailable?{status:1,stderr:'recorded log unavailable'}:{status:0,stdout:log};
   const leg=args[args.indexOf('--name')+1].replace('suite-record-','').replace(/-\d+$/,'');
   const folder=args[args.indexOf('--dir')+1];fs.mkdirSync(folder,{recursive:true});
   fs.writeFileSync(path.join(folder,'record.json'),JSON.stringify({schema:RECORD_SCHEMA,platform:leg,exitCode:leg==='windows-latest'&&persistent?1:0,files:[{path:'packages/p/tests/red.test.mjs',label:leg==='windows-latest'&&persistent?'FAIL':'PASS'}]}));
   return {status:0,stdout:''};
  }
  const endpoint=args.at(-1);let body;
  if(endpoint.includes('/jobs?')) {
   const saved=attempt;
   if(endpoint.includes('/attempts/1/')) attempt=1;
   const list=endpoint.includes('/runs/202/')?[{name:'check',status:'completed',conclusion:'success',run_attempt:1}]:latestJobs();
   attempt=saved;body={total_count:list.length,jobs:list};
  }
  else if(endpoint.includes('/artifacts?')) body={artifacts:['macos-latest','ubuntu-latest','windows-latest'].map((leg,i)=>({id:i+1,name:`suite-record-${leg}-${attempt}`}))};
  else {
   reads++;
   body={workflow_runs:absent?[]:[run(),...(extraPending?[workflowRun({id:202,workflow_id:2,path:'.github/workflows/other.yml',head_sha:tip,head_branch:'main',event:'push',status:reads<3?'in_progress':'completed',conclusion:reads<3?null:'success'})]:[])]};
  }
  return {status:0,stdout:JSON.stringify(body)};
 }};
 return {options,calls,root,runGit,time:()=>time};
}

// req: R-3994
await check('M9: main wait covers every workflow retries red once and reports persistent red',async()=>{
 const {waitForMainCi}=await api();
 for(const persistent of [false,true]) {
  const f=mainWaitFake({persistent,extraPending:true});
  const out=await waitForMainCi(f.options);assert.equal(out.code,persistent?1:0,out.text);
  assert.equal(f.calls.filter(a=>a[1]==='rerun').length,1);assert.match(out.text,persistent?/suite \(windows-latest\): red: packages\/p\/tests\/red.test.mjs/:/flake: packages\/p\/tests\/red.test.mjs/);
  assert.match(out.text,/workflow ci run 202 green/);assert(f.time()>=2*C.CI_POLL_INTERVAL_MS);
  assert(f.calls.find(a=>a[0]==='repo').includes('github.com/example/fixture'));
  assert(f.calls.filter(a=>a[0]==='api'&&a.at(-1).includes('/actions/workflows/')).every(a=>a.at(-1).includes(`head_sha=${tip}`)));
  console.log(out.text.trim());
 }
 const green=mainWaitFake({fail:false});delete green.options.sha;
 const out=await waitForMainCi(green.options);assert.equal(out.code,0,out.text);assert.equal(green.calls.filter(a=>a[1]==='rerun').length,0);console.log(out.text.trim());
 const absent=mainWaitFake({absent:true});const no=await waitForMainCi({...absent.options,deadline:17});assert.equal(no.code,1);assert.equal(absent.time(),17);assert.match(no.text,/deadline: no run/);
});

// req: R-3995
await check('M10: successful main retries retain per-file flakes and repeated files need a fix lane',async()=>{
 const {waitForMainCi}=await api();
 const first=mainWaitFake();const out=await waitForMainCi(first.options);assert.equal(out.code,0,out.text);
 const again=mainWaitFake({id:102});const second=await waitForMainCi({...again.options,cwd:first.root,runGit:first.runGit});assert.equal(second.code,0,second.text);assert.match(second.text,/needs fix lane: packages\/p\/tests\/red.test.mjs/);
 const stored=readSuiteRecords({root:first.root,runGit:first.runGit,subpath:CI_STORE_SUBPATH});assert.equal(stored.length,2);assert(stored.every(r=>r.flake.file==='packages/p/tests/red.test.mjs'));
 const duplicate=mainWaitFake({id:102});assert.equal((await waitForMainCi({...duplicate.options,cwd:first.root,runGit:first.runGit})).code,0);
 assert.equal(readSuiteRecords({root:first.root,runGit:first.runGit,subpath:CI_STORE_SUBPATH}).length,2);
});

// req: R-3994 R-3995 R-3999
await check('M11: recorded main rerun prints recovery and restart never requests a third attempt',async()=>{
 const {waitForMainCi}=await api();
 // Condensed replay of the named Windows profile failure; unrelated green jobs are synthetic.
 const recovered=mainWaitFake({id:42718705179,log:'FAIL packages/nana-pack/tests/profile-store.test.mjs\r\n'});
 const out=await waitForMainCi(recovered.options);assert.equal(out.code,0,out.text);
 assert.match(out.text,/green after rerun/);assert.match(out.text,/flake: packages\/nana-pack\/tests\/profile-store.test.mjs/);
 console.log(out.text.trim());
 const greenRestart=mainWaitFake({id:42718705179,startAttempt:2,log:'FAIL packages/nana-pack/tests/profile-store.test.mjs\r\n'});
 const resumed=await waitForMainCi(greenRestart.options);assert.equal(resumed.code,0,resumed.text);
 assert.equal(greenRestart.calls.filter(a=>a[1]==='rerun').length,0);
 assert.match(resumed.text,/flake: packages\/nana-pack\/tests\/profile-store.test.mjs/);
 assert(greenRestart.calls.some(a=>a.at(-1).includes('/attempts/1/jobs?')));
 const kept=readSuiteRecords({root:greenRestart.root,runGit:greenRestart.runGit,subpath:CI_STORE_SUBPATH});
 assert.equal(kept[0].flake.file,'packages/nana-pack/tests/profile-store.test.mjs');
 const restarted=mainWaitFake({id:42718705179,startAttempt:2,persistent:true});
 const red=await waitForMainCi(restarted.options);assert.equal(red.code,1,red.text);
 assert.equal(restarted.calls.filter(a=>a[1]==='rerun').length,0);console.log('restart at attempt 2: 0 reruns');
 const job='install-check (windows-latest, floor)';
 for(const logUnavailable of [false,true]) {
  const install=mainWaitFake({failedName:job,log:'install failed without a test file',logUnavailable});
  const result=await waitForMainCi(install.options);assert.equal(result.code,0,result.text);
  assert.match(result.text,/flake: job: install-check \(windows-latest, floor\)/);
  if(logUnavailable) assert.match(result.text,/log unavailable/);
  const stored=readSuiteRecords({root:install.root,runGit:install.runGit,subpath:CI_STORE_SUBPATH});
  assert.equal(stored[0].flake.file,`job: ${job}`);console.log(result.text.trim());
 }
 const unavailable=mainWaitFake({startAttempt:2,persistent:true,logUnavailable:true});
 const result=await waitForMainCi(unavailable.options);assert.equal(result.code,1,result.text);assert.match(result.text,/log unavailable/);
});
