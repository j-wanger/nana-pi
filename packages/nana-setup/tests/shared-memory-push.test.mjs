/**
 * @module packages/nana-setup/tests/shared-memory-push.test.mjs
 * @purpose Pin seat push integration, fallback bytes, deadline and private load measurements.
 * @inputs Synthetic temporary homes, stores, indexes and local git.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Failed cases set exit code one.
 */
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { using } from '../../nana-pack/tests/memory-run-fixture.mjs';
import { check } from '../../nana-pack/tests/profile-fixture.mjs';
import { claimId, exclusiveJsonAt, effectiveState } from '../../nana-pack/lib/profile-store.mjs';
import { readMemoryStore, writeMemoryFile } from '../../nana-pack/lib/memory-store.mjs';
import { PROFILE_LAYOUT } from '../../nana-pack/lib/profile-config.mjs';
import { SHARED_MEMORY_OUTPUT_BUDGET } from '../lib/shared-memory-config.mjs';
import { HOOK_DEADLINE_MS } from '../lib/hook-producer.mjs';
const hook=fileURLToPath(new URL('../claude/hooks/nana-shared-memory.mjs',import.meta.url));
const moduleOf=name=>import(`../../nana-pack/lib/${name}.mjs`);
const day='2026-10-01';
function setup(f) {
 const repo=f.git(f.main,'rev-list','--max-parents=0','HEAD');
 const config=path.join(f.a.agent,'nana-pack.json');const original=JSON.parse(fs.readFileSync(config,'utf8'));
 const set=extra=>fs.writeFileSync(config,JSON.stringify({...original,memoryRepositories:[repo],...extra}));set();
 const shared=path.join(f.temp,'shared');fs.mkdirSync(shared);const idx=path.join(shared,'MEMORY.md');
 const entries=Array.from({length:88},(_,i)=>`- [Synthetic title ${String(i).padStart(3,'0')}](synthetic-long-filename-${i}-padding-for-head.md) — ${'description '.repeat(20)} \t`);
 fs.writeFileSync(idx,entries.join('\r\n')); // CRLF, trailing space/tab, no final newline.
 const log=path.join(f.a.agent,'nana-context-loads.jsonl');
 const run=(extra={},cwd=f.main)=>{const r=spawnSync(process.execPath,[hook],{cwd,env:{...f.a.env,NANA_SHARED_MEMORY_DIR:shared,CLAUDE_PROJECT_DIR:cwd,...extra},input:JSON.stringify({session_id:'synthetic',cwd}),encoding:'utf8',timeout:HOOK_DEADLINE_MS+5000});assert.equal(r.status,0,r.stderr);return r;};
 const loads=()=>fs.readFileSync(log,'utf8').trim().split('\n').map(JSON.parse);
 const put=(label,{profile=false,repository=repo,...extra}={})=>{
  const claim=`CANARY-CLAIM-${label} `+'é'.repeat(600);const r={id:claimId(claim),type:profile?'user':'worker',source:profile?'saved':'extracted',kind:'correction',claim,quote:`CANARY-QUOTE-${label}`,context:'',evidence:`seat:claude-code:${label}:${day}`,date:day,trust:'low',roles:['seat'],validFrom:day,invalidAt:null,supersedes:[],...(!profile?{repository}:{}),...extra};
  if(profile)exclusiveJsonAt(path.join(f.a.dir,'records',r.id,'20261101-a.json'),r);else writeMemoryFile(f.a.dir,repository,'records',r.id,r);
  return r;
 };
 return {repo,set,shared,idx,entries,run,loads,put,log};
}
// req: R-3412
await check('B1: matching records print beside all index titles including an empty store',()=>using(async f=>{
 const s=setup(f);const chosen=[s.put('profile-a',{profile:true}),s.put('profile-b',{profile:true}),s.put('project-a'),s.put('project-b'),s.put('project-c')];
 const hidden=[s.put('foreign',{repository:'f'.repeat(40)}),s.put('retracted'),s.put('superseded'),s.put('invalid',{invalidAt:day}),s.put('unscoped',{profile:true,source:'extracted'})];
 for(const [r,action] of [[hidden[1],'retract'],[hidden[2],'supersede']])writeMemoryFile(f.a.dir,s.repo,'events',r.id,{id:r.id,action,target:chosen[2].id,quote:'Synthetic owner words',stamp:'20261102'});
 const r=s.run();assert.ok(r.stdout.startsWith(`[nana:shared-memory] ${s.idx}`));assert.match(r.stdout,/push 5 of 5/);
 assert.match(r.stdout,/private: never quote these in issues, commits, PRs or HANDOFF/);assert.match(r.stdout,/low trust is unconfirmed; retract only when the owner says a record is wrong: nana-profile retract/);
 for(const v of chosen)assert.ok(r.stdout.includes(v.claim));for(const v of hidden)assert.ok(!r.stdout.includes(v.claim));
 for(const e of s.entries)assert.ok(r.stdout.includes(e.match(/^- \[[^\]]*\]/)[0]));assert.match(r.stdout,/full index:/);assert.ok(r.stdout.length<=SHARED_MEMORY_OUTPUT_BUDGET);assert.equal(r.stderr,'');
 fs.rmSync(path.join(f.a.dir,'records'),{recursive:true});fs.rmSync(path.join(f.a.dir,'projects'),{recursive:true});
 const empty=s.run();assert.match(empty.stdout,/push 0 of 0/);for(const e of s.entries)assert.ok(empty.stdout.includes(e.match(/^- \[[^\]]*\]/)[0]));
 s.set({memoryRepositories:[]});s.put('disabled-project');s.put('still-profile',{profile:true});assert.match(s.run().stdout,/push 1 of 1/);
}));
// req: R-3414
await check('B3: skips preserve bytes and a damaged profile adds only the fixed note',()=>using(async f=>{
 const s=setup(f);const canary=s.put('skip',{profile:true});
 // Leave room for the error note; over-budget index behavior is pinned unchanged separately.
 fs.writeFileSync(s.idx,s.entries.slice(0,2).join('\r\n'));
 const baseline=s.run({NANA_ROLE:'worker'}).stdout;
 const skipped=[['role',{NANA_ROLE:'worker'}],['role',{NANA_ROLE:''}],['ci',{CI:'1'}]];
 for(const [reason,env] of skipped){const r=s.run(env);assert.equal(r.stdout,baseline);assert.ok(!r.stderr.includes(canary.claim));assert.equal(s.loads().at(-1).push.reason,reason);}
 s.set({ownerProfile:undefined});assert.equal(s.run().stdout,baseline);assert.equal(s.loads().at(-1).push.reason,'pointer');s.set();
 fs.renameSync(path.join(f.a.dir,PROFILE_LAYOUT.marker),path.join(f.a.dir,'hidden-marker'));
 assert.equal(s.run().stdout,baseline);assert.equal(s.loads().at(-1).push.reason,'marker');fs.renameSync(path.join(f.a.dir,'hidden-marker'),path.join(f.a.dir,PROFILE_LAYOUT.marker));
 s.set({memoryPush:false});assert.equal(s.run().stdout,baseline);assert.equal(s.loads().at(-1).push.reason,'disabled');s.set();
 const wt=path.join(f.temp,'linked');f.git(f.main,'worktree','add','-b','synthetic-linked',wt);assert.equal(s.run({},wt).stdout,baseline);assert.equal(s.loads().at(-1).push.reason,'worktree');
 exclusiveJsonAt(path.join(f.a.dir,'records','bad','bad.json'),{});fs.writeFileSync(path.join(f.a.dir,'records','bad','bad.json'),'{broken');
 const bad=s.run();assert.equal(bad.stdout,baseline+'[nana:memory] push unavailable: store error\n');assert.equal(bad.stderr,'');assert.equal(s.loads().at(-1).push.reason,'store-error');
}));
// req: R-3415, R-3421
await check('B4: slow git retains index under the deadline with one worktree probe',()=>using(async f=>{
 const {PUSH_TEST_MARGIN_MS}=await moduleOf('memory-bundle-config');const {seatPush}=await moduleOf('memory-push');const s=setup(f);s.put('slow',{profile:true});
 const calls=[];const result=seatPush({...f.deps,deadline:performance.now()+HOOK_DEADLINE_MS,runGit:(_cwd,args,options)=>{calls.push(args);assert.ok(options.timeout<=HOOK_DEADLINE_MS);return {status:0,stdout:args[0]==='rev-parse'?`${f.main}/.git\n${f.main}/.git\n`:'invalid-root'};}});assert.equal(calls.length,2);assert.deepEqual(calls[0],['rev-parse','--absolute-git-dir','--git-common-dir']);assert.equal(result.reason,'repository');
 const stub=path.join(f.temp,'slow-git.mjs');fs.writeFileSync(stub,`setTimeout(()=>{},${HOOK_DEADLINE_MS*3});`);
 const baseline=s.run({NANA_ROLE:'worker'}).stdout;const start=performance.now();const r=s.run({NANA_PROFILE_GIT_COMMAND:JSON.stringify([process.execPath,stub])});
 assert.ok(performance.now()-start<HOOK_DEADLINE_MS+PUSH_TEST_MARGIN_MS);assert.equal(r.stdout,baseline);assert.equal(s.loads().at(-1).push.reason,'deadline');
}));
// req: R-3416
await check('B5: one pure date-cut maker and renderer serve store and replay inputs',()=>using(async f=>{
 const {makeMemoryBundle}=await moduleOf('memory-bundle');const {renderSeatMemory,HEADER}=await moduleOf('memory-render');const s=setup(f);
 const before=s.put('before',{date:'2026-09-30'});const after=s.put('after',{date:'2026-10-02'});const asOf='2026-10-01T12:00:00Z';
 const states=readMemoryStore(f.a.dir);const raw=[before,after].map(r=>({...r,repository:s.repo}));
 const a=makeMemoryBundle(states,{repository:s.repo,asOf});const b=makeMemoryBundle(effectiveState(raw,[]),{repository:s.repo,asOf});assert.deepEqual(a,b);assert.equal(a.delivered.length,1);assert.ok(a.lines.includes(before.claim));assert.ok(!a.lines.includes(after.claim));assert.deepEqual(a,makeMemoryBundle(states,{repository:s.repo,asOf}));
 const candidate={...before,id:claimId('raw'),claim:'Synthetic adapted candidate'};delete candidate.repository;
 assert.equal(makeMemoryBundle(effectiveState([{...candidate,repository:s.repo}],[]),{repository:s.repo,asOf}).delivered.length,1);
 const bundle=makeMemoryBundle(states,{repository:s.repo});assert.equal(renderSeatMemory({header:HEADER(s.idx)+'\n',entries:s.entries,indexPath:s.idx,bundle,budget:SHARED_MEMORY_OUTPUT_BUDGET}),s.run().stdout);
}));
// req: R-3417
await check('B6: one load line measures ids and characters without claim or quote text',()=>using(async f=>{
 const s=setup(f);const records=Array.from({length:15},(_,i)=>s.put(`log-${i}`));
 const base=path.join(f.a.dir,'projects',s.repo.slice(0,16),'records','bad');fs.mkdirSync(base,{recursive:true});fs.writeFileSync(path.join(base,'bad.json'),'{broken');
 const r=s.run();const loads=s.loads();assert.equal(loads.length,1);const line=loads[0];assert.equal(line.printedChars,r.stdout.length);assert.equal(line.push.reason,'ready');assert.equal(line.push.unparseable,1);
 const {makeMemoryBundle}=await moduleOf('memory-bundle');const b=makeMemoryBundle(readMemoryStore(f.a.dir),{repository:s.repo});assert.equal(line.push.chars,b.chars);assert.deepEqual(line.push.delivered,b.delivered);assert.deepEqual(line.push.omitted,b.omitted);assert.ok(b.omitted.length>0);assert.ok([...b.delivered,...b.omitted].every(id=>/^[a-f0-9]{12}$/.test(id)));
 const log=fs.readFileSync(s.log,'utf8');for(const record of records){assert.ok(!log.includes(record.claim));assert.ok(!log.includes(record.quote));}assert.ok(!r.stderr.includes('CANARY'));
}));
