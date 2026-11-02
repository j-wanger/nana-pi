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
function fake({prs=[pr()], runs=()=>[workflowRun()], jobList=r=>jobs(r.run_attempt), fail, slow}={}) {
 let time=0, reads=0; const calls=[], sleeps=[], output=[];
 const options={cwd:process.cwd(),repository,branch,tip,workflowText,env:{GH_HOST:'wrong.invalid',GH_REPO:'wrong/other'},
  now:()=>time, sleep:ms=>{sleeps.push(ms);time+=ms;}, writeLine:l=>output.push(l),
  runGh:(_cwd,args,opts)=>{
   calls.push({args,opts,time}); assert(calls.length<2000,'bounded fake call count');
   slow?.(args,ms=>{time+=ms;},opts);
   if(fail?.(args)) return {status:1,stderr:'injected API failure\r\nmore'};
   let body;
   if(args[0]==='pr') body=typeof prs==='function'?prs():prs;
   else if(args[0]==='run') return {status:0,stdout:''};
   else if(args.some(a=>a.includes('/jobs?'))) {
    const endpoint=args.find(a=>a.includes('/jobs?'));
    const attempt=Number(/attempts\/(\d+)/.exec(endpoint)[1]);
    const list=jobList({run_attempt:attempt},endpoint);
    body=Array.isArray(list)?{total_count:list.length,jobs:list}:list;
   } else body=JSON.parse(runList(runs(++reads)));
   return {status:0,stdout:JSON.stringify(body)};
  }};
 return {options,calls,sleeps,output, reruns:()=>calls.filter(c=>c.args[0]==='run'), time:()=>time};
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

// req: R-3725
await check('M6: CI wait policy values and API vocabulary are sealed once',async()=>{
 await api();
 assert.equal(C.CI_CANCEL_RERUNS,2);assert.equal(C.CI_READY_READS,3);assert.equal(C.CI_READY_DELAY_MS,1000);assert.equal(C.CI_POLL_INTERVAL_MS,10000);assert.equal(C.CI_WAIT_TIMEOUT_MS,7200000);
 assert.equal(C.CI_PR_FIELDS,'number,mergeable,headRefName,headRefOid,headRepository,headRepositoryOwner');
 assert.equal(C.CI_JOBS_PATH,'repos/<owner>/<repo>/actions/runs/<run>/attempts/<attempt>/jobs');
 assert.equal(C.CI_ADVISORY_WORKFLOW,'.github/workflows/ci.yml');assert.equal(C.CI_ADVISORY_JOB,'suite (ubuntu-latest)');assert.equal(String(C.CI_ADVISORY_RULE),String(/^  suite:[ \t]*\r?\n(?:(?:    [^\r\n]*|[ \t]*|    #[^\r\n]*)\r?\n)*?    continue-on-error: \$\{\{ matrix\.os == 'ubuntu-latest' \}\}[ \t]*(?:\r?\n|$)/m));
});
