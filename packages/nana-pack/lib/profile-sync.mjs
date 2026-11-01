/**
 * @module packages/nana-pack/lib/profile-sync.mjs
 * @purpose Serialize profile writers and synchronize append-only git commits with a guarded push target.
 * @inputs Clone pointer, environment, optional git runner, clock and log sink.
 * @outputs Bounded git results, lock-scoped results and sync success or sealed reason.
 * @effects disk, process, network
 * @errors Throws sealed refusal lines for local failures; sync returns classified transport failure.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { spawnSync } from 'node:child_process';
import { STALE_INDEX_LOCK_MS, STORE_LAYOUT } from './memory-run-config.mjs';
import { releaseLaneLock } from './lane-lock.mjs';
import { PROFILE_GIT_TIMEOUT_MS, PROFILE_PATH_POLICY, PROFILE_LOCK_WAIT_MS, PROFILE_LOCK_STALE_MS, PROFILE_PUSH_RETRIES, PROFILE_LAYOUT as L, PROFILE_WORDS as W } from './profile-config.mjs';

/** Like the gh seam, a command array permits fully local cross-platform fixtures. */
export function profileGit(env = process.env) {
 let command=['git'];
 if(env[W.gitCommandEnv]) { command=JSON.parse(env[W.gitCommandEnv]); if(!Array.isArray(command)||!command.length||command.some(x=>typeof x!=='string')) throw Error(W.git); }
 return (cwd,args)=>spawnSync(command[0],[...command.slice(1),...args],{cwd,env,encoding:'utf8',timeout:PROFILE_GIT_TIMEOUT_MS,maxBuffer:PROFILE_PATH_POLICY.outputBytes,stdio:['ignore','pipe','pipe']});
}
export function gitText(runGit,dir,args) {
 const r=runGit(dir,args); if(r.error||r.status!==0) throw Error(W.git); return String(r.stdout??'').trim();
}
/** Keep the precedent's pid-owned release; acquisition waits and evicts only old dead writers. */
export function withProfileLock(dir,runGit,fn,{waitMs=PROFILE_LOCK_WAIT_MS}={}) {
 const gitdir=gitText(runGit,dir,['rev-parse','--absolute-git-dir']); const lock=path.join(gitdir,L.lock); const start=Date.now();
 while(true) {
  try { const fd=fs.openSync(lock,'wx',0o600); try {fs.writeFileSync(fd,String(process.pid));fs.fsyncSync(fd);} finally {fs.closeSync(fd);} break; }
  catch(e) {
   if(e.code!=='EEXIST') throw Error(W.locked);
   try {
    const pid=Number(fs.readFileSync(lock,'utf8').trim()); let dead=false;
    try {process.kill(pid,0);} catch(err) {dead=err.code==='ESRCH';}
    if(dead&&Date.now()-fs.statSync(lock).mtimeMs>PROFILE_LOCK_STALE_MS) {releaseLaneLock(lock,pid);continue;}
   } catch {}
   const left=waitMs-(Date.now()-start); if(left<=0) throw Error(W.locked);
   Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,Math.min(left,PROFILE_LOCK_WAIT_MS/100));
  }
 }
 try {return fn(gitdir);} finally {releaseLaneLock(lock);}
}
/** Abort a stopped rebase before a writer can commit onto its detached HEAD. */
export function recoverProfile(dir,runGit,log=()=>{},{now=()=>new Date()}={}) {
 const gitdir=gitText(runGit,dir,['rev-parse','--absolute-git-dir']);
 const indexLock=path.join(gitdir,'index.lock');
 try { if(now().getTime()-fs.statSync(indexLock).mtimeMs>STALE_INDEX_LOCK_MS) fs.rmSync(indexLock); } catch(e) { if(e.code!=='ENOENT') throw e; }
 if(['rebase-merge','rebase-apply'].some(n=>fs.existsSync(path.join(gitdir,n)))) {gitText(runGit,dir,['rebase','--abort']);log(W.recovered);}
}
/** Never accidentally include unrelated staged changes in a private-record commit. */
export function commitProfile(dir,runGit,message) {
 const result=runGit(dir,['status','--porcelain','-z']); if(result.error||result.status!==0) throw Error(W.git);
 const status=String(result.stdout??'');
 // -z reports unquoted paths; status codes occupy the first three bytes.
 const entries=status ? status.split('\0').filter(Boolean) : [];
 for(let i=0;i<entries.length;i++) {
  const entry=entries[i]; const name=entry.slice(3);
  if(![L.records,L.events,STORE_LAYOUT.projects].some(folder=>name.startsWith(`${folder}/`))) throw Error(W.dirty);
  if(/[RC]/.test(entry.slice(0,2))) throw Error(W.dirty);
 }
 gitText(runGit,dir,['add','--',...[L.records,L.events,STORE_LAYOUT.projects].filter(folder=>fs.existsSync(path.join(dir,folder)))]);
 const diff=runGit(dir,['diff','--cached','--quiet']);
 if(diff.status===1) gitText(runGit,dir,['commit','-m',message]); else if(diff.status!==0||diff.error) throw Error(W.git);
}
function reason(result) {
 const text=String(result?.stderr??'');
 if(/auth|permission|denied|could not read username/i.test(text)) return W.reasons[1];
 if(/rejected|non-fast-forward|fetch first/i.test(text)) return W.reasons[2];
 return W.reasons[0];
}
/** Fetch without holding the clone lock; only the verified push target may receive records. */
export function fetchProfile(pointer,runGit) {
 if(gitText(runGit,pointer.dir,['remote','get-url','--push','origin'])!==pointer.verifiedPushUrl) return {ok:false,reason:W.reasons[3]};
 const branch=gitText(runGit,pointer.dir,['symbolic-ref','--short','HEAD']);
 const fetched=runGit(pointer.dir,['fetch','origin']);
 return fetched.error||fetched.status!==0 ? {ok:false,reason:reason(fetched),branch} : {ok:true,branch};
}
/** Reconcile only an already-fetched ref while the caller holds the clone lock. */
export function rebaseProfile(dir,branch,runGit) {
 const remote=runGit(dir,['rev-parse','--verify',`refs/remotes/origin/${branch}`]);
 if(remote.status===0&&!remote.error) {
  const rebased=runGit(dir,['rebase',`refs/remotes/origin/${branch}`]);
  if(rebased.error||rebased.status!==0) {runGit(dir,['rebase','--abort']);return {ok:false,reason:W.reasons[2]};}
 }
 return {ok:true};
}
/** Push a captured commit after releasing the clone lock, never a moving HEAD. */
export function pushProfile(pointer,branch,sha,runGit) {
 if(gitText(runGit,pointer.dir,['remote','get-url','--push','origin'])!==pointer.verifiedPushUrl) return {ok:false,reason:W.reasons[3]};
 const pushed=runGit(pointer.dir,['push',pointer.verifiedPushUrl,`${sha}:refs/heads/${branch}`]);
 return !pushed.error&&pushed.status===0 ? {ok:true} : {ok:false,reason:reason(pushed)};
}
/** Caller owns the clone lock; retry only a rejected push, never expose stderr. */
export function syncProfile(pointer,{runGit=profileGit(),log=()=>{}}={}) {
 const {dir}=pointer;
 if(pointer.unverifiedRemote) log(W.unverified);
 if(gitText(runGit,dir,['remote','get-url','--push','origin'])!==pointer.verifiedPushUrl) return {ok:false,reason:W.reasons[3]};
 recoverProfile(dir,runGit,log);
 commitProfile(dir,runGit,'Keep profile records');
 const branch=gitText(runGit,dir,['symbolic-ref','--short','HEAD']);
 for(let attempt=0;attempt<=PROFILE_PUSH_RETRIES;attempt++) {
  const fetched=fetchProfile(pointer,runGit); if(!fetched.ok) return fetched;
  const rebased=rebaseProfile(dir,branch,runGit); if(!rebased.ok) return rebased;
  const pushed=pushProfile(pointer,branch,'HEAD',runGit);
  if(pushed.ok) return {ok:true};
  const why=pushed.reason; if(why!==W.reasons[2]||attempt===PROFILE_PUSH_RETRIES) return {ok:false,reason:why};
 }
 return {ok:false,reason:W.reasons[2]};
}
