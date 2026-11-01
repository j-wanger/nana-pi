/**
 * @module packages/nana-pack/tests/memory-run-recovery.test.mjs
 * @purpose Pin torn-file recovery, timeout headroom and brief local merge-lock contention.
 * @inputs Synthetic temporary clones, injected clocks and models, and a lock-release worker.
 * @outputs Awaited bounded PASS or FAIL cases.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Worker } from 'node:worker_threads';
import { once } from 'node:events';
import { check } from './profile-fixture.mjs';
import { using, now, pair, runner } from './memory-run-fixture.mjs';
import { repositoryFolder, writeMemoryFile } from '../lib/memory-store.mjs';
import * as C from '../lib/memory-run-config.mjs';
import { TIMEOUT_MS } from '../lib/memory-shaping-config.mjs';

async function recover(f,folder,text) {
 await f.command(['enable']);const calls=[];
 f.transcript(pair('done'));assert.match((await f.command(['make'],{runModel:runner(calls)})).output,/memory: complete/);
 const repository=f.git(f.main,'rev-list','--max-parents=0','HEAD');
 const damaged=path.join(f.a.dir,'projects',repositoryFolder(repository),folder,'torn','20261102-aa.json');
 fs.mkdirSync(path.dirname(damaged),{recursive:true});fs.writeFileSync(damaged,text);
 const saved=f.profile(['save','--kind','correction','--claim','Synthetic seat save after damage','--quote','Synthetic owner quote']);
 assert.equal(saved.code,0,saved.output);
 f.transcript(pair('later'),'later');
 const later=await f.command(['make'],{runModel:runner(calls)});assert.equal(later.code,0,later.output);assert.match(later.output,/memory: complete; sent 1; done 1; pending 0/);
 await f.command(['make'],{runModel:runner(calls)});assert.deepEqual(calls.flat().map(u=>u.owner),['Synthetic claim done.','Synthetic claim later.']);
 const status=await f.command(['status']);assert.equal(status.code,0,status.output);assert.match(status.output,/pending 0; unparseable 1\n$/);
 return repository;
}
// req: R-3291
// req: R-3294
await check('R-3291: torn records do not block saves or repeat done units',()=>using(async f=>{
 const repository=await recover(f,C.STORE_LAYOUT.records,'{"id":"torn","cla');
 // Abrupt exit after opening/writing must never expose a partial final JSON name.
 const storeUrl=new URL('../lib/profile-store.mjs',import.meta.url).href;
 const isolated=path.join(f.temp,'interrupted');
 const child=spawnSync(process.execPath,['--input-type=module','-e',`import fs from 'node:fs'; import {syncBuiltinESMExports} from 'node:module'; import {exclusiveJson} from ${JSON.stringify(storeUrl)}; const write=fs.writeFileSync; fs.writeFileSync=(fd)=>{write(fd,'{');process.exit(73);}; syncBuiltinESMExports(); exclusiveJson(${JSON.stringify(isolated)},'records','torn',{synthetic:true},'20261102',()=>Buffer.from('aa','hex'));`],{env:f.env,timeout:10000});
 assert.equal(child.status,73);const names=fs.readdirSync(path.join(isolated,'records','torn'));assert.equal(names.filter(n=>n.endsWith('.json')).length,0,'a kill must not publish torn JSON');
 const options={now,random:()=>Buffer.from('aa','hex')};
 const file=writeMemoryFile(f.a.dir,repository,C.STORE_LAYOUT.units,'exclusive',{synthetic:1},options);
 assert.throws(()=>writeMemoryFile(f.a.dir,repository,C.STORE_LAYOUT.units,'exclusive',{synthetic:2},options),{code:'EEXIST'});
 assert.deepEqual(JSON.parse(fs.readFileSync(file)),{synthetic:1});
 // A failure inside the merge is not clone-lock contention and must say so.
 f.transcript(pair('merge-error'),'merge-error');let merging=false;
 const result=await f.command(['make'],{runModel:async input=>{merging=true;return runner()(input);},runGit:(cwd,args)=>merging&&args[0]==='status'?{status:1,stderr:'SYNTHETIC_PRIVATE_ERROR'}:f.runGit(cwd,args)});
 assert.equal(result.code,0,result.output);assert.match(result.output,/^memory: merge failed;/);assert.ok(!result.output.includes('PRIVATE'));
}));
// req: R-3291
await check('R-3291: empty seen files do not block saves or repeat done units',()=>using(f=>recover(f,C.STORE_LAYOUT.seen,'')));
// req: R-3303
await check('R-3303: calls reserve their full timeout before starting',async()=>{
 for(const delta of [-1,0,1]) await using(async f=>{
  await f.command(['enable']);f.transcript(pair('clock'));let time=now().getTime();const calls=[];
  const result=await f.command(['make'],{now:()=>new Date(time),runGit:(cwd,args)=>{if(args[0]==='fetch')time=now().getTime()+C.MAX_RUN_MS-TIMEOUT_MS+delta;return f.runGit(cwd,args);},runModel:runner(calls)});
  assert.equal(result.code,0,result.output);assert.equal(calls.length,delta<=0?1:0,`timeout headroom delta ${delta}`);
  assert.match(result.output,delta<=0?/memory: complete/:/memory: capped/);
 });
});
// req: R-3294
await check('R-3294: local merge waits for a brief seat lock',()=>using(async f=>{
 await f.command(['enable']);f.transcript(pair('brief-lock'));let worker,exited;const calls=[];
 try {
  const result=await f.command(['make'],{runModel:async input=>{
   const lock=path.join(f.a.dir,'.git','nana-profile.lock');fs.writeFileSync(lock,String(process.pid));
   worker=new Worker(`const {parentPort,workerData}=require('node:worker_threads');const fs=require('node:fs');parentPort.postMessage('ready');setTimeout(()=>fs.rmSync(workerData,{force:true}),100);`,{eval:true,workerData:lock});
   exited=once(worker,'exit');await once(worker,'message');return runner(calls)(input);
  }});
  await exited;assert.equal(result.code,0,result.output);assert.match(result.output,/memory: complete; sent 1; done 1; pending 0/);
  await f.command(['make'],{runModel:runner(calls)});assert.equal(calls.length,1);
 }finally{if(worker)await worker.terminate();}
}));
