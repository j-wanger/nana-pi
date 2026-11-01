/**
 * @module packages/nana-pack/tests/memory-session-end.test.mjs
 * @purpose Pin honest push status, machine-local health and store-free empty runs.
 * @inputs Synthetic local bare remotes, transcripts, clocks and Git seams.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { check as boundedCheck } from './profile-fixture.mjs';
import { using, pair, now } from './memory-run-fixture.mjs';
import { repositoryFolder, writeMemoryFile } from '../lib/memory-store.mjs';
import { pushProfile } from '../lib/profile-sync.mjs';
import { resolveLayout } from '../../nana-setup/lib/paths.mjs';
import { diagnose } from '../../nana-setup/lib/doctor.mjs';
import { DOCTOR_NOTES } from '../../nana-setup/lib/install-check-config.mjs';
import * as C from '../lib/memory-run-config.mjs';
const check=async(name,fn)=>{if(!process.env.MEMORY_CASE||name.startsWith(process.env.MEMORY_CASE+':'))await boundedCheck(name,fn);};
const ahead=f=>f.git(f.a.dir,'rev-list','--count','refs/remotes/origin/main..HEAD');
// req: R-3354
await check('R-3354: push words and compare-and-swap tracking stay honest',()=>using(async f=>{
 await f.command(['enable']);f.transcript(pair('first','SYNTHETIC_OWNER_CANARY first'));
 const made=await f.command(['make']);assert.equal(made.code,0,made.output);assert.match(made.output,/; pushed\n$/);assert.equal(ahead(f),'0');assert.ok(!made.output.includes('CANARY'));
 const reject=path.join(f.bare,'hooks','pre-receive');fs.writeFileSync(reject,'#!/bin/sh\nexit 1\n',{mode:0o755});f.transcript(pair('second'),'second');
 const refused=await f.command(['make']);assert.match(refused.output,/not pushed: rejected/);assert.equal(ahead(f),'1');assert.match((await f.command(['status'])).output,/unpushed 1/);
 fs.rmSync(reject);const synced=f.profile(['sync']);assert.equal(synced.code,0,synced.output);assert.equal(ahead(f),'0');assert.match((await f.command(['status'])).output,/unpushed 0/);
 assert.equal(f.profile(['save','--kind','correction','--claim','A synthetic saved claim','--quote','Synthetic words']).code,0);assert.equal(ahead(f),'0');
 // Interleave a later fetch/commit/push immediately before the first CAS.
 const pointer=JSON.parse(fs.readFileSync(path.join(f.a.agent,'nana-pack.json'),'utf8')).ownerProfile;
 const original=f.git(f.a.dir,'rev-parse','HEAD');let moved=null,updates=0;
 const late=(cwd,args)=>{
  if(args[0]==='update-ref'){
   updates++;fs.writeFileSync(path.join(f.a.dir,'records','late-fixture'),'synthetic');f.git(f.a.dir,'add','.');f.git(f.a.dir,'commit','-m','later save');moved=f.git(f.a.dir,'rev-parse','HEAD');f.git(f.a.dir,'push','origin','main');
  }
  return f.runGit(cwd,args);
 };
 assert.deepEqual(pushProfile(pointer,'main',original,late),{ok:true});assert.equal(updates,1);assert.equal(f.git(f.a.dir,'rev-parse','refs/remotes/origin/main'),moved);assert.equal(ahead(f),'0');assert.equal(f.git(f.bare,'rev-parse','main'),moved);
 const failedRef=(cwd,args)=>args[0]==='update-ref'?{status:1,stderr:'synthetic'}:f.runGit(cwd,args);assert.deepEqual(pushProfile(pointer,'main',moved,failedRef),{ok:true});
 let refCalls=0;const failedPush=(cwd,args)=>{if(args[0]==='update-ref')refCalls++;return args[0]==='push'?{status:1,stderr:'rejected SYNTHETIC_OWNER_CANARY'}:f.runGit(cwd,args);};assert.deepEqual(pushProfile(pointer,'main',moved,failedPush),{ok:false,reason:'rejected'});assert.equal(refCalls,0);
}));
// req: R-3356
await check('R-3356: doctor and status use only local count-only making health',()=>using(async f=>{
 const layout=resolveLayout({home:f.temp,piHome:f.a.agent});const opts={projectDir:f.main,releaseRepo:f.main,runGit:f.runGit,memory:{runGit:f.runGit,now},pi:{spawn:()=>({status:0,stdout:'1.0.2'})}};
 const note=()=>{const all=diagnose(layout,opts);assert.ok(!JSON.stringify(all).includes('CANARY'));const rows=all.filter(r=>r.label==='memory making');assert.equal(rows.length,1);assert.equal(rows[0].status,'note');assert.ok(!JSON.stringify(rows).includes('CANARY'));return rows[0].detail;};
 assert.equal(note(),'not enabled');await f.command(['enable']);assert.match(note(),/enabled 1; last never/);
 assert.equal(f.profile(['save','--kind','correction','--claim','SYNTHETIC_OWNER_CANARY','--quote','Synthetic quoted words']).code,0);
 const id=f.git(f.main,'rev-list','--max-parents=0','HEAD'),local=path.join(f.a.dir,'.git',C.RUN_LAYOUT.lastRun.replace('<id>',repositoryFolder(id)));
 fs.writeFileSync(local,JSON.stringify({time:new Date(now().getTime()-60000).toISOString(),outcome:C.WORDS.complete}));
 writeMemoryFile(f.a.dir,id,C.STORE_LAYOUT.runs,'remote',{time:now().toISOString(),outcome:C.WORDS.failed},{now});
 const detail=note();assert.match(detail,/enabled 1; last 60s memory: complete; unpushed 0/);assert.ok(!detail.includes(id));assert.ok(!detail.includes(repositoryFolder(id)));assert.match((await f.command(['status'])).output,/last 60s memory: complete/);
 fs.writeFileSync(local,'{');assert.equal(note(),'unreadable');fs.rmSync(local);assert.match(note(),/last never/);
 const saved=opts.memory;opts.memory={runGit:()=>({status:1}),now};assert.equal(note(),'unreadable');opts.memory=saved;
 const configFile=path.join(f.a.agent,'nana-pack.json'),cfg=JSON.parse(fs.readFileSync(configFile,'utf8'));cfg.ownerProfile.dir=path.join(f.temp,'missing');fs.writeFileSync(configFile,JSON.stringify(cfg));assert.equal(note(),'unreadable');
 delete cfg.ownerProfile;fs.writeFileSync(configFile,JSON.stringify(cfg));assert.equal(note(),'not enabled');
 for(const platform of ['darwin','linux','win32'])assert.ok(DOCTOR_NOTES[platform].includes('memory making'));
}));
// req: R-3357
await check('R-3357: empty runs leave HEAD store and remote unchanged',()=>using(async f=>{
 await f.command(['enable']);const before=f.git(f.a.dir,'rev-parse','HEAD'),files=f.git(f.a.dir,'ls-files'),remote=f.git(f.bare,'rev-parse','main');let pushes=0;
 const runGit=(cwd,args)=>{if(args[0]==='push')pushes++;return f.runGit(cwd,args);};
 const result=await f.command(['make'],{runGit});assert.equal(result.code,0,result.output);assert.equal(f.git(f.a.dir,'rev-parse','HEAD'),before);assert.equal(f.git(f.a.dir,'ls-files'),files);assert.equal(f.git(f.a.dir,'status','--porcelain'),'');assert.equal(f.git(f.bare,'rev-parse','main'),remote);assert.equal(pushes,0);
 const id=f.git(f.main,'rev-list','--max-parents=0','HEAD');assert.ok(fs.existsSync(path.join(f.a.dir,'.git',C.RUN_LAYOUT.lastRun.replace('<id>',repositoryFolder(id)))));
 f.transcript(pair('one'));await f.command(['make'],{runGit});assert.notEqual(f.git(f.a.dir,'rev-parse','HEAD'),before);assert.equal(pushes,1);
}));
// req: R-3361
await check('R-3361: seal push vocabulary',async()=>{
 const {PROFILE_WORDS}=await import('../lib/profile-config.mjs');assert.equal(C.PUSH_WORDS.pushed,'pushed');assert.equal(PROFILE_WORDS.notPushed,'not pushed: ');assert.equal(C.PUSH_WORDS.unpushed,'unpushed');assert.deepEqual(PROFILE_WORDS.reasons,['offline','auth','rejected','mismatch','locked']);
});
// req: R-3362
await check('R-3362: seal doctor vocabulary',async()=>assert.deepEqual((await import('../../nana-setup/lib/memory-end-config.mjs')).MEMORY_MAKING_NOTE,{label:'memory making',disabled:'not enabled',never:'never',unreadable:'unreadable'}));
