/**
 * @module packages/nana-setup/tests/memory-end-hook.test.mjs
 * @purpose Pin the quiet bounded SessionEnd starter and real detached survival.
 * @inputs Synthetic streams, injected spawns and temporary fixture CLIs.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import { tmpDir } from "./tmp-dir.mjs";
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Readable, PassThrough } from 'node:stream';
import { EventEmitter } from 'node:events';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { check as boundedCheck } from '../../nana-pack/tests/profile-fixture.mjs';
const check = async (name, fn) => { if (!process.env.MEMORY_CASE || name.startsWith(process.env.MEMORY_CASE+':')) await boundedCheck(name, fn); };
const hook = fileURLToPath(new URL('../claude/hooks/nana-memory-end.mjs', import.meta.url));
const td = tmpDir(path.join(os.tmpdir(), 'memory-end-'));
const env = { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, HOME: td, USERPROFILE: td, PI_CODING_AGENT_DIR: td };
const load = () => import('../claude/hooks/nana-memory-end.mjs');
const config = () => import('../lib/memory-end-config.mjs');
const raw = (extra={}) => JSON.stringify({transcript_path:'synthetic.jsonl',cwd:td,...extra});
const runChild = (file, input, open=false) => new Promise((resolve,reject)=>{
 const started=Date.now(), child=spawn(process.execPath,[file],{env,detached:process.platform!=='win32',stdio:['pipe','pipe','pipe']});
 let stdout='',stderr='';const timer=setTimeout(()=>{child.kill('SIGKILL');reject(Error('hook did not self-exit'));},5000);
 child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.stdin.on('error',()=>{});
 child.on('error',reject);child.on('close',code=>{clearTimeout(timer);resolve({code,stdout,stderr,ms:Date.now()-started});});
 if(!open)child.stdin.end(input);
});
try {
 // req: R-3350
 await check('R-3350: session and land share one quiet hidden starter',async()=>{
  const {runMemoryEndHook}=await load();const {startMemory}=await import('../../nana-pack/lib/memory-run.mjs');
  const calls=[];let errors=0,unrefs=0;
  const start=(bin,args,options)=>{calls.push({bin,args,options});return {on:(event,fn)=>{assert.equal(event,'error');errors++;fn();},unref:()=>unrefs++};};
  for(const reason of ['clear','resume','logout','prompt_input_exit','other'])await runMemoryEndHook({input:Readable.from([raw({reason})]),env,spawn:start,home:td});
  assert.equal(calls.length,5);
  for(const call of calls){assert.equal(call.bin,process.execPath);assert.equal(call.args[0],fileURLToPath(new URL('../../nana-pack/bin/nana-memory.mjs',import.meta.url)));assert.deepEqual(call.args.slice(1),['make','--repo',td,'--session','synthetic.jsonl']);assert.deepEqual(call.options,{detached:true,stdio:'ignore',windowsHide:true,cwd:td,env});}
  await runMemoryEndHook({input:Readable.from([raw({cwd:path.join(td,'removed')})]),env:{...env,CLAUDE_PROJECT_DIR:td},spawn:start,home:td});assert.equal(calls.at(-1).args[3],td);
  await runMemoryEndHook({input:Readable.from([raw({cwd:path.join(td,'removed')})]),env,spawn:start,home:td});assert.equal(calls.length,6);
  startMemory({repo:td,lane:'demo'},{env,spawn:start,home:td,agentDir:td});assert.deepEqual(calls.at(-1).options,calls[0].options);assert.deepEqual(calls.at(-1).args.slice(1),['make','--repo',td,'--lane','demo']);assert.equal(errors,7);assert.equal(unrefs,7);
 });
 // req: R-3351
 await check('R-3351: guards deadline errors and open stdin stay quiet',async()=>{
  const {runMemoryEndHook}=await load();const {MEMORY_STDIN_DEADLINE_MS}=await config();let spawns=0;
  const start=()=>{spawns++;return {on(){},unref(){}};};
  for(const over of [{CI:'1'},{NANA_ROLE:'worker'},{NANA_ROLE:'reviewer'},{NANA_ROLE:''}])await runMemoryEndHook({input:Readable.from([raw()]),env:{...env,...over},spawn:start});
  for(const text of ['', '{', '{}',raw({transcript_path:1}),raw({transcript_path:null})])await runMemoryEndHook({input:Readable.from([text]),env,spawn:start});
  const tty=Readable.from([raw()]);tty.isTTY=true;await runMemoryEndHook({input:tty,env,spawn:start});assert.equal(spawns,0);
  let fire,delay;const input=new PassThrough();const pending=runMemoryEndHook({input,env,spawn:start,setTimer:(fn,ms)=>{fire=fn;delay=ms;return 1;},clearTimer:()=>{}});
  for(let i=0;i<100&&!fire;i++)await new Promise(r=>setImmediate(r));assert.equal(delay,MEMORY_STDIN_DEADLINE_MS);fire();await pending;input.destroy();assert.equal(spawns,0);
  await runMemoryEndHook({input:Readable.from([raw()]),env,spawn:()=>{throw Error('synthetic');}});
  await runMemoryEndHook({input:Readable.from([raw()]),env,spawn:()=>{const child=new EventEmitter();child.unref=()=>queueMicrotask(()=>child.emit('error',Error('synthetic')));return child;}});
  for(const text of ['', '{', '{}',raw({transcript_path:1})]){const r=await runChild(hook,text);assert.deepEqual([r.code,r.stdout,r.stderr],[0,'','']);}
  const held=await runChild(hook,'',true);assert.deepEqual([held.code,held.stdout,held.stderr],[0,'','']);assert.ok(held.ms<5000);
 });
 // req: R-3352
 await check('R-3352: broken checkout exits silently',async()=>{
  const isolated=path.join(td,'isolated.mjs');fs.copyFileSync(hook,isolated);const r=await runChild(isolated,raw());assert.deepEqual([r.code,r.stdout,r.stderr],[0,'','']);
 });
 // req: R-3355
 await check('R-3355: run survives hook exit and timeout descendant kill',async()=>{
  const {MEMORY_END_TIMEOUT_SECONDS}=await config();const tree=path.join(td,'tree');
  for(const [source,target] of [[hook,'packages/nana-setup/claude/hooks/nana-memory-end.mjs'],[fileURLToPath(new URL('../lib/shared-memory-input.mjs',import.meta.url)),'packages/nana-setup/lib/shared-memory-input.mjs'],[fileURLToPath(new URL('../lib/memory-end-config.mjs',import.meta.url)),'packages/nana-setup/lib/memory-end-config.mjs'],[fileURLToPath(new URL('../../nana-pack/lib/memory-start.mjs',import.meta.url)),'packages/nana-pack/lib/memory-start.mjs']]){const dest=path.join(tree,target);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(source,dest);}
  const cli=path.join(tree,'packages/nana-pack/bin/nana-memory.mjs'),marker=path.join(td,'marker'),spawned=path.join(td,'spawned');fs.mkdirSync(path.dirname(cli),{recursive:true});
  fs.writeFileSync(cli,`import fs from 'node:fs';fs.writeFileSync(${JSON.stringify(spawned)},String(Date.now()));setTimeout(()=>fs.writeFileSync(${JSON.stringify(marker)},'finished'),3000);`);
  const child=spawn(process.execPath,[path.join(tree,'packages/nana-setup/claude/hooks/nana-memory-end.mjs')],{env,detached:process.platform!=='win32',stdio:['pipe','pipe','pipe']});
  let exit=null,stdout='',stderr='';child.on('exit',code=>{exit={code,at:Date.now()};});child.stdout.on('data',x=>stdout+=x);child.stderr.on('data',x=>stderr+=x);child.stdin.end(raw());
  await new Promise(r=>setTimeout(r,MEMORY_END_TIMEOUT_SECONDS*1000));
  if(process.platform==='win32')spawnSync('taskkill',['/PID',String(child.pid),'/T','/F'],{windowsHide:true,timeout:3000});
  else {const ps=spawnSync('ps',['-A','-o','pid=,ppid='],{encoding:'utf8',timeout:3000});const rows=ps.stdout.trim().split(/\r?\n/).map(s=>s.trim().split(/\s+/).map(Number));const ids=new Set([child.pid]);let size;do{size=ids.size;for(const [pid,ppid]of rows)if(ids.has(ppid))ids.add(pid);}while(ids.size!==size);try{process.kill(-child.pid,'SIGKILL');}catch{}for(const pid of ids)try{process.kill(pid,'SIGKILL');}catch{}}
  const deadline=Date.now()+10000;while(!fs.existsSync(marker)&&Date.now()<deadline)await new Promise(r=>setTimeout(r,50));
  assert.ok(fs.existsSync(spawned),'fixture must start even in CI');assert.ok(exit,'hook exited before timeout kill');assert.equal(exit.code,0);assert.ok(exit.at-Number(fs.readFileSync(spawned,'utf8'))<500,'spawn last, exit immediately');assert.equal(stdout,'');assert.equal(stderr,'');assert.ok(fs.existsSync(marker),'detached run finished');
 });
 // req: R-3358
 await check('R-3358: seal entry timeout',async()=>assert.equal((await config()).MEMORY_END_TIMEOUT_SECONDS,1.5));
 // req: R-3359
 await check('R-3359: seal stdin deadline',async()=>assert.equal((await config()).MEMORY_STDIN_DEADLINE_MS,300));
 // req: R-3360
 await check('R-3360: seal hook identity',async()=>assert.deepEqual((await config()).MEMORY_END_ENTRY,{event:'SessionEnd',file:'nana-memory-end.mjs',statusMessage:'nana: memory'}));
} finally {fs.rmSync(td,{recursive:true,force:true});}
