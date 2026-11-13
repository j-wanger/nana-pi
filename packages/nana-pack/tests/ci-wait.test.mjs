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
 ...['macos-latest','ubuntu-latest','windows-latest'].map(os=>({name:`suite (${os})`,status:'completed',conclusion:os==='macos-latest'?'cancelled':'success',run_attempt:attempt,...(os==='macos-latest'?{runner_id:0,runner_name:'',steps:[]}: {})})),
 ...['macos-latest','windows-latest'].flatMap(os=>['ceiling','floor'].map(pi=>({name:`install-check (${os}, ${pi})`,status:'completed',conclusion:'success',run_attempt:attempt}))),
 {name:'release',status:'completed',conclusion:'skipped',run_attempt:attempt},
].map(j=>({...j,...(extra[j.name]??{})}));
const cancelled = (attempt=1, extra={}) => workflowRun({run_attempt:attempt,conclusion:'failure',path:'.github/workflows/ci.yml',...extra});
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
 const land=ciFixture('capacity-wording');const result=executeCi(land,[cancelled()],{runGh:(_cwd,args)=>({status:0,stdout:args.some(a=>a.includes('/jobs?'))?JSON.stringify({total_count:8,jobs:jobs()}):runList([cancelled()])})});assert.equal(result.code,1);assert.match(result.text,/never started/);assert.match(result.text,new RegExp(`nana-ci-wait --tip ${land.tip}`));
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
 for(const waited of [tip,old]) for(const conclusion of ['failure','cancelled']) {
  let reads=0;
  const f=fake({prs:()=>[pr({headRefOid:++reads===1?waited:head})],runs:()=>[cancelled(1,{conclusion})]});
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

function mainWaitFake({id=101,fail=true,persistent=false,extraPending=false,absent=false,startAttempt=1,failedName='suite (windows-latest)',log='job\tstep\t2026-11-09 FAIL  packages/p/tests/red.test.mjs \t\r\n',logUnavailable=false,suiteLegs=['macos-latest','ubuntu-latest','windows-latest'],failedAttempt=a=>a===1||persistent,runConclusion,releaseStatus,runStatus='completed'}={}) {
 const root=tmpDir(path.join(os.tmpdir(),'main-wait-')),calls=[];
 let time=0,attempt=startAttempt,reads=0;
 const run=()=>workflowRun({id,workflow_id:1,head_sha:tip,head_branch:'main',event:'push',path:'.github/workflows/ci.yml',run_attempt:attempt,status:runStatus,conclusion:runConclusion?.(attempt)??(fail&&failedAttempt(attempt)?'failure':'success')});
 const latestJobs=()=>[
  ...suiteLegs.map((leg,i)=>({id:70+i,name:`suite (${leg})`,status:'completed',conclusion:`suite (${leg})`===failedName&&fail&&failedAttempt(attempt)?'failure':'success',run_attempt:attempt})),
  ...['macos-latest','windows-latest'].flatMap(os=>['floor','ceiling'].map(pi=>({id:80,name:`install-check (${os}, ${pi})`,status:'completed',conclusion:`install-check (${os}, ${pi})`===failedName&&fail&&failedAttempt(attempt)?'failure':'success',run_attempt:attempt}))),
  ...(releaseStatus?[{id:90,name:'release',status:releaseStatus,conclusion:null,run_attempt:attempt}]:[]),
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
   const shard=/^(.*)-shard-(\d+)-of-(\d+)$/.exec(leg);
   fs.writeFileSync(path.join(folder,'record.json'),JSON.stringify({schema:RECORD_SCHEMA,platform:shard?.[1]??leg,...(shard?{filters:[],shard:{index:Number(shard[2]),count:Number(shard[3])}}:{}),exitCode:leg==='windows-latest'&&persistent?1:0,files:[{path:shard?`packages/p/tests/shard-${shard[2]}.test.mjs`:'packages/p/tests/red.test.mjs',label:leg==='windows-latest'&&persistent?'FAIL':'PASS'}]}));
   return {status:0,stdout:''};
  }
  const endpoint=args.at(-1);let body;
  if(endpoint.includes('/jobs?')) {
   const saved=attempt;
   const prior=/\/attempts\/(\d+)\//.exec(endpoint);
   if(prior) attempt=Number(prior[1]);
   const list=endpoint.includes('/runs/202/')?[{name:'check',status:'completed',conclusion:'success',run_attempt:1}]:latestJobs();
   attempt=saved;body={total_count:list.length,jobs:list};
  }
  else if(endpoint.includes('/artifacts?')) body={artifacts:suiteLegs.map((leg,i)=>({id:i+1,name:`suite-record-${leg}-${attempt}`}))};
  else {
   reads++;
   body={workflow_runs:absent?[]:[run(),...(extraPending?[workflowRun({id:202,workflow_id:2,path:'.github/workflows/other.yml',head_sha:tip,head_branch:'main',event:'push',status:reads<3?'in_progress':'completed',conclusion:reads<3?null:'success'})]:[])]};
  }
  return {status:0,stdout:JSON.stringify(body)};
 }};
 return {options,calls,root,runGit,time:()=>time};
}

// req: R-4410 R-4411 R-4412
await check('never-started replay: recorded macOS queue cancels rerun without a flake and cancelled or started jobs stay red',async()=>{
 const {classifyRun,waitForCi,waitForMainCi}=await api();
 const recorded=JSON.parse(fs.readFileSync(new URL('fixtures/ci-never-started/jobs.json',import.meta.url),'utf8')).runs;
 function replay(id,{root=tmpDir(path.join(os.tmpdir(),'never-started-')),start=1,amend=()=>{},moved=false}={}) {
  const attempts=structuredClone(recorded[id]);amend(attempts);
  let attempt=start,time=0,prReads=0;const calls=[];
  const current=()=>attempts[attempt];
  const runGit=(_root,args)=>({status:0,stdout:args[0]==='remote'?'https://github.com/example/fixture.git':args.includes('--git-common-dir')?root:current().run.head_sha});
  const options={cwd:root,tempRoot:root,repository,branch,tip:current().run.head_sha,sha:current().run.head_sha,workflowText,env:{},runGit,now:()=>time,sleep:ms=>{time+=ms;},runGh:(_root,args)=>{
   calls.push(args);assert(calls.length<2000,'bounded recorded replay');
   const endpoint=args.at(-1);let body;
   if(args[0]==='pr') body=[pr({headRefOid:moved&&++prReads>1?'b'.repeat(40):current().run.head_sha})];
   else if(args[0]==='repo') body={nameWithOwner:'example/fixture'};
   else if(args[0]==='run') {
    if(args[1]==='rerun') {attempt++;assert(attempts[attempt],'fixture must contain the next attempt');return {status:0,stdout:''};}
    if(args[1]==='view') return {status:1,stderr:'log not found'};
    assert.equal(args[1],'download');
    const leg=args[args.indexOf('--name')+1].replace('suite-record-','').replace(/-\d+$/,'');
    const shard=/^(.*)-shard-(\d+)-of-(\d+)$/.exec(leg);
    const folder=args[args.indexOf('--dir')+1];fs.mkdirSync(folder,{recursive:true});
    fs.writeFileSync(path.join(folder,'record.json'),JSON.stringify({schema:RECORD_SCHEMA,platform:shard?.[1]??leg,filters:[],...(shard?{shard:{index:Number(shard[2]),count:Number(shard[3])}}:{}),exitCode:0,files:[{path:`tests/${leg}.test.mjs`,label:'PASS'}]}));
    return {status:0,stdout:''};
   } else if(endpoint.includes('/jobs?')) {
    const prior=/\/attempts\/(\d+)\//.exec(endpoint),list=attempts[prior?Number(prior[1]):attempt].jobs;
    body={total_count:list.length,jobs:list};
   } else if(endpoint.includes('/artifacts?')) body={artifacts:current().jobs.filter(job=>job.name.startsWith('suite (')&&job.conclusion==='success').map((job,i)=>({id:i+1,name:`suite-record-${job.name.slice(7,-1)}-${attempt}`,created_at:job.completed_at}))};
   else body={total_count:1,workflow_runs:[current().run]};
   return {status:0,stdout:JSON.stringify(body)};
  }};
  return {options,root,runGit,calls,reruns:()=>calls.filter(a=>a[1]==='rerun')};
 }
 const shared=tmpDir(path.join(os.tmpdir(),'never-started-shared-'));
 for(const [id,count] of [['43255126326',2],['43282727877',1],['43462490949',2],['43470799556',2]]) {
  const f=replay(id,{root:shared}),out=await waitForMainCi(f.options);
  console.log(`recorded ${id}: ${out.text.trim()}`);
  assert.equal(out.code,0,out.text);assert.equal(f.reruns().length,count);
  assert.match(out.text,/never started/);assert.match(out.text,/after never-started job \(1\/2\)/);
  if(count===2) assert.match(out.text,/after never-started job \(2\/2\)/);
  assert.match(out.text,/green after rerun/);assert.doesNotMatch(out.text,/flake:|needs fix lane:/);
  assert.equal(readSuiteRecords({root:shared,runGit:f.runGit,subpath:CI_STORE_SUBPATH}).length,0);
  assert(!f.calls.some(a=>a[0]==='run'&&a[1]==='view'));
 }
 const exhausted=replay('43462490949',{amend:a=>{a[3]={run:{...a[2].run,run_attempt:3},jobs:a[2].jobs.map(job=>({...job,run_attempt:3}))};}});
 const red=await waitForMainCi(exhausted.options);assert.equal(red.code,1);assert.equal(exhausted.reruns().length,2);
 assert.match(red.text,/workflow ci run 43462490949 red: never started/);assert.doesNotMatch(red.text,/flake:/);
 assert(!exhausted.calls.some(a=>a[0]==='run'&&a[1]==='view'));
 const restarted=replay('43462490949',{start:2});assert.equal((await waitForMainCi(restarted.options)).code,0);assert.equal(restarted.reruns().length,1);
 for(const id of ['43463117630','43377827876','39627442234']) {
  const f=replay(id),out=await waitForCi(f.options),recover=id==='43463117630';
  assert.equal(out.code,recover?0:1,out.text);assert.equal(f.reruns().length,recover?2:0);
  assert.equal(classifyRun(recorded[id][1].run,recorded[id][1].jobs,{workflowText}),recover?'capacity-cancelled':'failed');
  if(recover) assert.match(out.text,/after never-started attempt 2: .*\(2\/2\)/);
 }
 const bound=replay('43463117630',{amend:a=>{a[3]={run:{...a[2].run,run_attempt:3},jobs:a[2].jobs.map(job=>({...job,run_attempt:3}))};}});
 const stopped=await waitForCi(bound.options);assert.equal(stopped.code,1);assert.equal(bound.reruns().length,2);assert.match(stopped.text,/never started after 3 attempts: install-check/);
 const cancelled=replay('43462490949',{amend:a=>{a[1].run.conclusion='cancelled';}});
 assert.equal(classifyRun({...recorded['43462490949'][1].run,conclusion:'cancelled'},recorded['43462490949'][1].jobs,{workflowText}),'failed');
 const cancelOut=await waitForMainCi(cancelled.options);assert.equal(cancelOut.code,1);assert.equal(cancelled.reruns().length,0);assert.match(cancelOut.text,/run 43462490949 .* red$/m);assert.match(cancelOut.text,/cancelled main run; nothing to post/);
 const superseded=replay('43377827876',{moved:true}),out=await waitForCi(superseded.options);assert.match(out.text,/ci: superseded/);assert.equal(superseded.reruns().length,0);
 const original=recorded['43462490949'][1],bad=original.jobs.find(job=>job.conclusion==='cancelled');
 for(const patch of [{runner_name:undefined},{runner_name:null},{runner_id:undefined},{runner_id:null},{runner_id:1},{runner_name:'runner'},{steps:undefined},{steps:null},{steps:[{}]}]) {
  assert.equal(classifyRun(original.run,original.jobs.map(job=>job===bad?{...job,...patch}:job),{workflowText}),'failed');
 }
 const land=ciFixture('recorded-never-started');
 const refusal=executeCi(land,[recorded['43463117630'][1].run],{runGh:(_cwd,args)=>({status:0,stdout:args.some(a=>a.includes('/jobs?'))?JSON.stringify({total_count:7,jobs:recorded['43463117630'][1].jobs}):runList([recorded['43463117630'][1].run])})});
 assert.equal(refusal.code,1);assert.match(refusal.text,/\(never started\)/);assert.match(refusal.text,/nana-ci-wait --tip/);
 const cancelledRun={...recorded['43463117630'][1].run,conclusion:'cancelled'};
 const cancelledLand=executeCi(land,[cancelledRun],{runGh:(_cwd,args)=>({status:0,stdout:args.some(a=>a.includes('/jobs?'))?JSON.stringify({total_count:7,jobs:recorded['43463117630'][1].jobs}):runList([cancelledRun])})});
 assert.equal(cancelledLand.code,1);assert.match(cancelledLand.text,/is cancelled; run gh run rerun/);assert.doesNotMatch(cancelledLand.text,/\(never started\)/);
});

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

// req: R-3995
await check('M12: attempt 4 restart records the Windows file first failing at attempt 3',async()=>{
 const {waitForMainCi}=await api();
 for(const suffix of ['\n','\r\n',' \t\r\n','']) {
  // Run 43093486745: attempt 1 lost suite records, attempt 3 failed this shard, attempt 4 passed.
  const f=mainWaitFake({id:43093486745,startAttempt:4,
   suiteLegs:['macos-latest','ubuntu-latest',...Array.from({length:3},(_,i)=>`windows-latest-shard-${i+1}-of-3`)],
   failedName:'suite (windows-latest-shard-2-of-3)',failedAttempt:a=>a===3,
   runConclusion:a=>a===4?'success':'failure',
   log:`suite\tstep\t2026-11-11 FAIL packages/nana-pack/tests/lane-push-ci.test.mjs${suffix}`});
  const out=await waitForMainCi(f.options);
  const stored=()=>readSuiteRecords({root:f.root,runGit:f.runGit,subpath:CI_STORE_SUBPATH});
  console.log(`attempt-4 replay: ${out.text.trim()}; flake records: ${stored().length}`);
  assert.equal(out.code,0,out.text);assert.match(out.text,/green after rerun/);
  assert.match(out.text,/flake: packages\/nana-pack\/tests\/lane-push-ci.test.mjs/);
  assert.equal(stored().length,1);assert.equal(stored()[0].flake.file,'packages/nana-pack/tests/lane-push-ci.test.mjs');
  for(const a of [1,2,3]) assert(f.calls.some(args=>args.at(-1).includes(`/attempts/${a}/jobs?`)));
  assert.equal(f.calls.filter(a=>a[1]==='rerun').length,0);
  assert.equal((await waitForMainCi(f.options)).code,0);
  assert.equal(stored().length,1,'restarted waiters retain one record per identity');
 }
});

// req: R-4220
await check('M13: a concluded main run does not wait for its queued release job',async()=>{
 const {waitForMainCi}=await api();
 for(const releaseStatus of ['queued','waiting']) {
  const f=mainWaitFake({id:43093486745,startAttempt:3,persistent:true,releaseStatus});
  const out=await waitForMainCi({...f.options,deadline:17});
  console.log(`concluded-run replay (${releaseStatus}): ${out.text.trim()}; elapsed: ${f.time()}`);
  assert.equal(out.code,1,out.text);assert.doesNotMatch(out.text,/CI did not finish/);
  assert.match(out.text,/workflow ci run 43093486745 red/);assert.equal(f.time(),0);
  assert.equal(f.calls.filter(a=>a[1]==='rerun').length,0);
 }
 const active=mainWaitFake({runStatus:'in_progress',releaseStatus:'in_progress'});
 const pending=await waitForMainCi({...active.options,deadline:17});
 assert.match(pending.text,/CI did not finish/);assert.equal(active.time(),17);
});

// req: R-3723
await check('network replay: lane and main waiters poll through gh failures within the original budget',async()=>{
 const {waitForCi,waitForMainCi}=await api();
 const failures=[
  ...['\n','\r\n',' \t\r\n',''].map(suffix=>({status:1,stderr:`net/http: TLS handshake timeout${suffix}`})),
  {error:Object.assign(new Error('timeout'),{code:'ETIMEDOUT'}),nanaTimeoutMs:C.CI_READ_TIMEOUT_MS},
  ...['connection reset by peer','i/o timeout','lookup api.github.com: no such host','dial tcp: connection refused'].map(stderr=>({status:1,stderr})),
 ];
 for(const failure of failures) for(const main of [false,true]) {
  const f=main?mainWaitFake({fail:false}):fake(), original=f.options.runGh;
  let left=4;
  f.options.runGh=(...args)=>left-->0?failure:original(...args);
  const out=await (main?waitForMainCi:waitForCi)(f.options);
  assert.equal(out.code,0,out.text);assert(f.time()>=4*C.CI_POLL_INTERVAL_MS);assert(f.time()<C.CI_WAIT_TIMEOUT_MS);
  assert(!f.calls.some(c=>(c.args??c)[1]==='rerun'));
 }
 for(const phase of ['/jobs?','/artifacts?','download']) {
  const f=mainWaitFake({fail:false}), original=f.options.runGh;let left=2;
  f.options.runGh=(root,args,opts)=>args.some(a=>a.includes(phase))&&(phase!=='download'||args.includes('suite-record-macos-latest-1'))&&left-->0?failures[0]:original(root,args,opts);
  const out=await waitForMainCi(f.options);assert.equal(out.code,0,out.text);assert.equal(left<1,true);assert(f.time()>=2*C.CI_POLL_INTERVAL_MS);
 }
 for(const main of [false,true]) {
  const f=main?mainWaitFake({fail:false}):fake();let calls=0;
  f.options.runGh=()=>({status:1,stderr:++calls===1?'connection reset by peer':'net/http: TLS handshake timeout'});
  const out=await (main?waitForMainCi:waitForCi)({...f.options,deadline:2*C.CI_POLL_INTERVAL_MS+7});
  assert.equal(out.code,1);assert.match(out.text,/CI did not finish.*last gh error:.*TLS handshake timeout/);assert.doesNotMatch(out.text,/last gh error:.*connection reset/);
  assert.equal(f.time(),2*C.CI_POLL_INTERVAL_MS+7);assert.equal(calls,3);
 }
});
