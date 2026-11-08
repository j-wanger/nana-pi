/**
 * @module packages/nana-pack/tests/lane-push-ci.test.mjs
 * @purpose Pin generated-conflict push CI, duplicate exclusion and event-specific selected Windows coverage.
 * @inputs Workflow expressions, isolated Git fixtures and injected GitHub transport.
 * @outputs Ten awaited bounded requirement-tagged verdicts.
 * @effects disk (OS temp fixtures), process (local Git and fixture Node).
 * @errors Assertions set exit one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { check, fixtureRoot, copyClosure, execute, REPO, TEMP } from './pack-fixtures.mjs';
import { regenerateFixture, executeCleanMerge, artifactGh, git, gitRunner, workflowRun, runList, mergeSnapshot } from './land-fixtures.mjs';
import { ciReadiness, waitForCi } from '../lib/ci-wait.mjs';
import { judgeRuns, requiredCiJobs } from '../lib/land-ci.mjs';
import * as C from '../lib/land-config.mjs';
const workflow = fs.readFileSync(process.env.CI_WORKFLOW_PATH ?? path.join(REPO, '.github/workflows/ci.yml'), 'utf8');
const repository = {owner:'example',repo:'fixture'};
const section = name => workflow.split(`\n  ${name}:\n`)[1]?.split(/\n  [\w-]+:\n/)[0] ?? '';
const expression = (text, key) => text.match(new RegExp(`^ *${key}: \\$\\{\\{ (.+) \\}\\}$`, 'm'))?.[1];
function context(event='push', branch='feat/probe', fork=false) {
 return {github:{event_name:event,ref:`refs/heads/${branch}`,head_ref:branch,sha:'a'.repeat(40),repository:'example/fixture',workflow:'ci',run_id:7,
 event:{pull_request:{number:3,head:{sha:'b'.repeat(40),repo:{full_name:fork?'fork/fixture':'example/fixture'}}}}},fromJSON:JSON.parse,startsWith:(s,p)=>s.startsWith(p)};
}
const evaluate = (expr, ctx) => JSON.parse(JSON.stringify(vm.runInNewContext(expr,ctx)));
const enabled = (name, ctx) => {const expr=section(name).match(/^    if: \$\{\{ (.+) \}\}$/m)?.[1]; return !expr || evaluate(expr,ctx);};
const matrix = ctx => evaluate(expression(section('suite'),'include'),ctx);
const installs = ctx => evaluate(expression(section('install-check'),'os'),ctx);
const realRun = (extra={}) => workflowRun({event:'push',path:'.github/workflows/ci.yml',head_branch:'feat/probe',head_repository:{full_name:'example/fixture'},...extra});
const duplicate = (extra={}) => realRun({id:202,run_number:2,event:'pull_request',display_title:'ci (duplicate feature PR)',...extra});
function waiter(f, runs, {conflict=true, runGit}={}) {
 const branch='feat/probe', tip=f.tip; const calls=[];
 const options={cwd:f.feature,repository,branch,tip,runGit:runGit??((cwd,args)=>args[0]==='fetch'?{status:0}:gitRunner(cwd,args)),
 now:()=>0,sleep:()=>{throw Error('unexpected poll');},runGh:(_cwd,args)=>{calls.push(args);return {status:0,stdout:args[0]==='pr'?JSON.stringify([{number:7,mergeable:conflict?'CONFLICTING':'MERGEABLE',headRefName:branch,headRefOid:tip,headRepository:{name:'fixture'},headRepositoryOwner:{login:'example'}}]):runList(runs)};}};
 git(f.feature,'update-ref','refs/remotes/origin/main',git(f.main,'rev-parse','HEAD'));
 return {options,calls};
}
// req: R-3935
await check('M1: generated-only conflicts wait for exact tip push CI across line transports',async()=>{
 for(const file of C.CLEAN_MERGE_GENERATED_PATHS) for(const transport of ['lf','crlf','space','no-final']) {
  const f=regenerateFixture(`push-${transport}`,[file]);
  const w=waiter(f,[realRun({head_sha:f.tip})],{runGit:(cwd,args)=>{
   if(args[0]==='fetch') return {status:0};
   const r=gitRunner(cwd,args); if(!args.includes('merge-tree'))return r;
   const lines=r.stdout.trimEnd().split('\n');return {...r,stdout:transport==='crlf'?lines.join('\r\n')+'\r\n':transport==='space'?lines.map(l=>l+' \t').join('\n')+'\n':transport==='no-final'?lines.join('\n'):r.stdout};
  }});
  const before=mergeSnapshot(f),out=await waitForCi(w.options); assert.equal(out.code,0,out.text);assert.match(out.text,/\(push\) success/);
  assert(w.calls.some(a=>a.some(x=>x.includes(`head_sha=${f.tip}&`))));assert.deepEqual(mergeSnapshot(f),before);
 }
});
// req: R-3936
await check('M2: real conflicts and failed inspection refuse before a run wait',async()=>{
 for(const mode of ['ordinary','fetch','malformed','unsupported']) {
  const f=regenerateFixture(`refuse-${mode}`);
  if(mode==='ordinary'){fs.writeFileSync(path.join(f.main,'base.txt'),'main conflict\n');git(f.main,'add','base.txt');git(f.main,'commit','-m','main conflict');fs.writeFileSync(path.join(f.feature,'base.txt'),'lane conflict\n');git(f.feature,'add','base.txt');git(f.feature,'commit','-m','lane conflict');f.tip=git(f.feature,'rev-parse','HEAD');}
  const w=waiter(f,[realRun()],{runGit:(cwd,args)=>args[0]==='fetch'?{status:mode==='fetch'?1:0}:args.includes('merge-tree')&&mode==='malformed'?{status:1,stdout:'not a tree\n'}:args[0]==='check-attr'&&mode==='unsupported'?{status:1}:gitRunner(cwd,args)});
  const before=mergeSnapshot(f),out=await waitForCi(w.options);assert.equal(out.code,1,out.text);
  assert.match(out.text,/PR #7 conflicts with main; merge main into the lane; GitHub starts no CI for it/);
  assert(!w.calls.some(a=>a[0]==='api'));assert.deepEqual(mergeSnapshot(f),before);
 }
});
// req: R-3937
await check('M3: push CI lands generated conflicts through regeneration without new review or suite',()=>{
 const f=regenerateFixture('push-land'),out=executeCleanMerge(f,{runs:[realRun({head_sha:f.tip})]});
 assert.equal(out.code,0,out.text);assert.equal(out.suites,0);assert.match(out.text,/\(push\) success/);
 for(const file of C.CLEAN_MERGE_GENERATED_PATHS)assert.equal(fs.readFileSync(path.join(f.main,file),'utf8'),f.expected[file]);
 assert.deepEqual(git(f.main,'show','-s','--format=%P','HEAD').split(' '),[f.tip,f.capturedMain]);
 assert(out.calls.filter(a=>a.at(-1).includes('/actions/runs?')).every(a=>a.at(-1).includes(`head_sha=${f.tip}&`)));
});
// req: R-3938
await check('M4: feature pushes execute while same-repository feature PR duplicates skip',()=>{
 assert.match(workflow,/branches: \[main, ['"]?feat\/\*\*['"]?\]/);
 for(const name of ['suite','install-check','lane-selection']) {assert(enabled(name,context('push')));assert(!enabled(name,context('pull_request')),name);}
 const title=expression(workflow,'run-name');assert(title);assert.equal(evaluate(title,context('pull_request')),'ci (duplicate feature PR)');
});
// req: R-3939
await check('M5: main retains all legs release prerequisites and required Windows gates',()=>{
 const ctx=context('push','main');assert.deepEqual(matrix(ctx).map(x=>x.leg),['macos-latest','ubuntu-latest',...C.CI_WINDOWS_JOBS.filter(n=>n.startsWith('suite (')).map(n=>n.slice(7,-1))]);
 assert.deepEqual(installs(ctx),['macos-latest','windows-latest']);
 const jobs=[...C.CI_LANE_JOBS,...C.CI_WINDOWS_JOBS].map(name=>({name,status:'completed',conclusion:'success'}));
 assert(requiredCiJobs(jobs,{main:true}).ok);for(const name of C.CI_WINDOWS_JOBS)assert(!requiredCiJobs(jobs.filter(j=>j.name!==name),{main:true}).ok);
 const expr=section('release').match(/^    if: (.+)$/m)[1].replaceAll('needs.install-check','needs["install-check"]');
 const needs={suite:{result:'success',outputs:{shard1:'success',shard2:'success',shard3:'success'}},'install-check':{result:'success'}};
 assert(evaluate(expr,{...ctx,needs}));for(const key of ['shard1','shard2','shard3']){const bad=structuredClone(needs);bad.suite.outputs[key]='skipped';assert(!evaluate(expr,{...ctx,needs:bad}));}
});
// req: R-3940
await check('M6: skipped duplicates never decide waiter or land in either event order',async()=>{
 for(const order of [false,true])for(const pass of [false,true])for(const skipped of ['success','skipped']) {
  const f=regenerateFixture('duplicates'),real=realRun({run_number:order?3:1,conclusion:pass?'success':'failure',head_sha:f.tip}),skip=duplicate({conclusion:skipped,head_sha:f.tip});
  const runs=order?[skip,real]:[real,skip],w=waiter(f,runs,{conflict:false});
  const out=await waitForCi(w.options);assert.equal(out.code,pass?0:1,out.text);
  const record={schema:1,platform:'darwin',filters:[],files:[{path:'selected.test.mjs',label:'PASS',seconds:1}],exitCode:0,jobs:4,wallSeconds:1,
   packRun:{complete:true,packs:['land','module'],selection:{changedFrom:'origin/main',changedPaths:[],changedTests:[],module:[]}}};
  const transport=artifactGh(runs,[{run:101,leg:'macos-latest',attempt:1,record}]);
  const land=executeCleanMerge(f,{runs,runGh:(cwd,args,opts)=>args.at(-1).includes('/202/jobs?')?{status:0,stdout:JSON.stringify({jobs:[{name:'suite (macos-latest)',status:'completed',conclusion:'skipped'}]})}:transport(cwd,args,opts)});assert.equal(land.code,pass?0:1,land.text);assert.equal(land.suites,0);
  if(pass){assert.match(land.text,/run 101/);assert(!land.text.includes('run 202'));}else assert.match(land.text,/run 101.*failure/);
 }
 assert.equal(judgeRuns(runList([duplicate()]),'a'.repeat(40),repository).ok,false,'a skipped duplicate alone is not proof');
});
// req: R-3941
await check('M7: feature non-feature and fork PRs each execute one head-tip macOS Linux and install set',()=>{
 for(const [branch,fork] of [['feat/probe',false],['repair',false],['feat/probe',true]]) {
  const events=[context('pull_request',branch,fork),...(!fork&&branch.startsWith('feat/')?[context('push',branch)]:[])];
  const suites=events.filter(ctx=>enabled('suite',ctx)).flatMap(matrix);assert.deepEqual(suites.map(x=>x.os),['macos-latest','ubuntu-latest']);
  assert.deepEqual(events.filter(ctx=>enabled('install-check',ctx)).flatMap(installs),['macos-latest']);
 }
 for(const name of ['suite','install-check','lane-selection','windows-selected'])assert.match(section(name),/ref: \$\{\{ github\.event\.pull_request\.head\.sha \|\| github\.sha \}\}/,name);
 assert.match(section('install-check'),/pi: \[ceiling, floor\]/);
});
// req: R-3942
await check('M8: lane events allocate no Windows shards or installs and cannot release',()=>{
 for(const ctx of [context('push'),context('pull_request'),context('pull_request','repair'),context('pull_request','feat/probe',true)]) {
  assert(matrix(ctx).every(x=>!x.os.startsWith('windows')&&!x.shard));assert.deepEqual(installs(ctx),['macos-latest']);
  const expr=section('release').match(/^    if: (.+)$/m)[1].replaceAll('needs.install-check','needs["install-check"]');assert(!evaluate(expr,{...ctx,needs:{}}));
 }
});
// req: R-3943
await check('M9: Windows reuses changed-from lane packs and skips an empty selection',async()=>{
 const selected=section('windows-selected');assert(selected);assert.match(selected,/runs-on: windows-latest/);assert.doesNotMatch(selected,/--shard=|--pack=land,main|--pack=.*retire/);
 for(const name of ['suite','windows-selected'])assert.match(section(name),/--pack=.*land,module/);
 assert.match(selected,/--changed-from=origin\/main/);
 const expr=expression(selected,'if').replaceAll('needs.lane-selection','needs["lane-selection"]');assert(expr);
 for(const present of ['true','false'])assert.equal(evaluate(expr,{...context(),needs:{'lane-selection':{outputs:{selected:present}}}}),present==='true');
 const prep=section('lane-selection');const body=prep.split('// lane selection begin\n')[1]?.split('// lane selection end')[0];assert(body);
 const file='packages/probe/tests/land.test.mjs',module='packages/probe/tests/module.test.mjs',retire='packages/probe/tests/retire.test.mjs';
 for(const empty of [false,true]) {
  const files=empty?{}:{[file]:'console.log("PASS land");',[module]:'console.log("PASS module");',[retire]:'console.log("FAIL unselected retire"); process.exitCode=1;'};
  const root=fixtureRoot('selection',files,empty?{}:{[file]:'land',[module]:'module',[retire]:'retire'});copyClosure(root,'scripts/test-packs.mjs',new Set(['packages/nana-pack/lib/test-packs-config.mjs']));
  git(root,'init','-b','main');git(root,'config','user.name','Fixture');git(root,'config','user.email','fixture@example.invalid');git(root,'add','.');git(root,'commit','--allow-empty','-m','base');git(root,'update-ref','refs/remotes/origin/main',git(root,'rev-parse','HEAD'));
  const output=path.join(TEMP,`selection-${empty}.txt`);fs.writeFileSync(output,'');
  const {spawnSync}=await import('node:child_process');
  const r=spawnSync(process.execPath,['--input-type=module','-e',body],{cwd:root,env:{...process.env,GITHUB_OUTPUT:output},encoding:'utf8',timeout:30000});assert.equal(r.status,0,r.stderr);
  assert.equal(fs.readFileSync(output,'utf8').trim(),`selected=${!empty}`);
  if(!empty){
   const args=name=>section(name).split('\n').find(l=>l.startsWith('      - run: npm test -- --jobs='))
    .replace(/\$\{\{ (.*?) \}\}/g,(_,expr)=>String(evaluate(expr,{...context(),env:{NANA_CI_JOBS:'4'}}))).split('npm test -- ')[1].trim().split(/\s+/);
   const mac=execute(root,args('suite')),win=execute(root,args('windows-selected'));
   for(const run of [mac,win]){assert.equal(run.status,0,run.out);assert(!run.record.files.some(x=>x.path===retire));assert(run.record.files.some(x=>x.path===file));}
   assert.deepEqual(win.record.files.map(x=>x.path),mac.record.files.map(x=>x.path));assert.deepEqual(win.record.packRun,mac.record.packRun);
  }
 }
});
// req: R-3944
await check('seal: duplicate title and exclusion identity are pinned',()=>{
 assert.equal(C.CI_DUPLICATE_TITLE,'ci (duplicate feature PR)');
 for(const patch of [{event:'push'},{path:'.github/workflows/other.yml'},{head_branch:'repair'},{head_repository:{full_name:'fork/fixture'}},{display_title:'ordinary CI'}]) {
  const out=judgeRuns(runList([realRun({conclusion:'failure'}),duplicate(patch)]),'a'.repeat(40),repository);assert.equal(out.ok,true,JSON.stringify(patch));
 }
});
