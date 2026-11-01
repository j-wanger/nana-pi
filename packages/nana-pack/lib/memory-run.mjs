/**
 * @module packages/nana-pack/lib/memory-run.mjs
 * @purpose Sweep pending enabled project units with bounded spend and a quiet detached land starter.
 * @inputs Repository identity, profile pointer, roots, runner, git, clock, environment and spawner seams.
 * @outputs Immutable private memory, count-only health, bounded token ledger and fixed starter line.
 * @effects disk, process, network
 * @errors Run failures leave unfinished units pending and expose only fixed words.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomUUID, randomBytes } from 'node:crypto';
import { spawn as spawnDefault } from 'node:child_process';
import { spawnMemory } from './memory-start.mjs';
import { unitsIn, sourceFiles, reviewUnits, resolveEvidence, defaultMemoryRepo } from './memory-making.mjs';
import { extractShaped } from './memory-shaping.mjs';
import { projectStore, repositoryFolder, ensureRepository, readMemoryFiles, writeMemoryFile, mergeMemory, unitKey } from './memory-store.mjs';
import { gitCommonDir } from './suite-records.mjs';
import { exclusiveJson, profileStamp } from './profile-store.mjs';
import { releaseLaneLock } from './lane-lock.mjs';
import { pidAlive } from './process-tree.mjs';
import { withProfileLock, gitText, recoverProfile, commitProfile, fetchProfile, rebaseProfile, pushProfile, profileGit } from './profile-sync.mjs';
import { resolveProfile } from '../bin/nana-profile.mjs';
import { piAgentDir } from './agent-dir.mjs';
import { TIMEOUT_MS } from './memory-shaping-config.mjs';
import { PROFILE_WORDS } from './profile-config.mjs';
import { MERGE_LOCK_WAIT_MS, START_INSTANT, RUN_TOKEN_CAP, RUN_CALL_CAP, DAY_TOKEN_CAP, UNKNOWN_USAGE_CHARGE, MAX_RUN_MS, EVIDENCE_CAP, STORE_LAYOUT as L, RUN_LAYOUT as R, WORDS as W, OPT_IN_MEMBER, laneFolderPattern } from './memory-run-config.mjs';

/** Creation time bounds pid reuse; release retains the precedent's pid-owned check. */
export function acquireMemoryLock(file,{now=()=>new Date(),alive=pidAlive,host=os.hostname()}={}) {
 const owner={pid:process.pid,host,createdAt:now().getTime(),nonce:randomUUID()};
 for(let attempt=0;attempt<2;attempt++) {
  try {fs.writeFileSync(file,JSON.stringify(owner),{flag:'wx',mode:0o600});return ()=>releaseLaneLock(file,owner.pid,{readFile:target=>{const current=JSON.parse(fs.readFileSync(target,'utf8'));return current.nonce===owner.nonce?String(current.pid):'';}});}
  catch(e) {
   if(e.code!=='EEXIST') throw e;
   try {const previous=JSON.parse(fs.readFileSync(file,'utf8'));if(now().getTime()-previous.createdAt>MAX_RUN_MS||!alive(previous.pid)) {fs.rmSync(file);continue;}} catch {if(now().getTime()-fs.statSync(file).mtimeMs>MAX_RUN_MS) {fs.rmSync(file);continue;}}
   return null;
  }
 }
 return null;
}
function atomicJson(file,value) {
 const scratch=`${file}.${randomUUID()}.tmp`;
 try {fs.writeFileSync(scratch,JSON.stringify(value),{flag:'wx',mode:0o600});fs.renameSync(scratch,file);}finally{fs.rmSync(scratch,{force:true});}
}
/** A reservation survives a killed caller conservatively; only a completed call settles it. */
export function dayReservation(gitdir,{now=()=>new Date(),dayCap=DAY_TOKEN_CAP,charge=UNKNOWN_USAGE_CHARGE}={}) {
 const file=path.join(gitdir,R.dayLedger),lock=path.join(gitdir,R.dayLock);
 const change=fn=>{const release=acquireMemoryLock(lock,{now});if(!release)return false;try{
  const date=now().toISOString().slice(0,10);let ledger={date,tokens:0};
  try {const previous=JSON.parse(fs.readFileSync(file,'utf8'));if(previous.date===date) ledger=previous;}catch(e){if(e.code!=='ENOENT')throw e;}
  if(!Number.isFinite(ledger.tokens)||ledger.tokens<0)throw Error(W.failed);
  const next=fn(ledger);if(!next)return false;atomicJson(file,next);return true;
 }finally{release();}};
 return {reserve:()=>{const date=now().toISOString().slice(0,10);if(!change(ledger=>ledger.tokens+charge<=dayCap?{...ledger,tokens:ledger.tokens+charge}:null))return null;
  return tokens=>change(ledger=>ledger.date===date?{...ledger,tokens:Math.max(0,ledger.tokens-charge+tokens)}:ledger);
 }};
}
/** Trigger source first; all discovered pending transcripts are revisited on every invocation. */
export async function pendingUnits({repoRoot,projectsRoot,session,lane,dir,repository,runGit}) {
 const seen=new Set(readMemoryFiles(dir,repository,L.seen).flatMap(file=>file.map(row=>row.key))),found=new Set(),units=[];
 const add=unit=>{const key=unitKey(unit.evidence);if(!seen.has(key)&&!found.has(key)){found.add(key);units.push(unit);}};
 const reviewsRoot=path.join(repoRoot,'docs','reviews');
 const reviews=lanePattern=>{
  const allowedFiles=new Set();
  // Bound each Git response to one needed folder, not the lifetime review corpus.
  if(fs.existsSync(reviewsRoot)) for(const folder of fs.readdirSync(reviewsRoot,{withFileTypes:true})) {
   if(!folder.isDirectory()||(lanePattern&&!lanePattern.test(folder.name)))continue;
   const tracked=gitText(runGit,repoRoot,['ls-tree','-r','--name-only','refs/heads/main','--',`docs/reviews/${folder.name}/`]);
   for(const file of tracked.split(/\r?\n/u).map(n=>n.trim()).filter(Boolean))allowedFiles.add(file);
  }
  return reviewUnits({reviewsRoot,from:START_INSTANT.slice(0,10),lanePattern,allowedFiles,repoRoot});
 };
 if(lane) for(const unit of reviews(laneFolderPattern(lane))) add(unit);
 if(session&&fs.existsSync(session)) for await(const unit of unitsIn(session,{since:START_INSTANT})) add(unit);
 for(const {file} of sourceFiles({repoRoot,projectsRoot})) for await(const unit of unitsIn(file,{since:START_INSTANT})) add(unit);
 if(!lane) for(const unit of reviews()) add(unit);
 else {
  // Remembered land requests distinguish pending earlier lands from an unrelated prefix folder.
  const requests=path.join(gitCommonDir(dir,{runGit}),R.sources,repositoryFolder(repository),'run'),lanes=new Set();
  if(fs.existsSync(requests)) for(const file of fs.readdirSync(requests).sort()) {
   try {const request=JSON.parse(fs.readFileSync(path.join(requests,file),'utf8'));if(request.lane!==lane)lanes.add(request.lane);}catch{}
  }
  for(const previous of lanes) for(const unit of reviews(laneFolderPattern(previous))) add(unit);
 }
 return units;
}
export function lastMemoryRun(dir,repository,{runGit=profileGit()}={}) {
 let local=null;try {local=JSON.parse(fs.readFileSync(path.join(gitCommonDir(dir,{runGit}),R.lastRun.replace('<id>',repositoryFolder(repository))),'utf8'));}catch{}
 const runs=readMemoryFiles(dir,repository,L.runs);if(local)runs.unshift(local);
 return runs.sort((a,b)=>b.time.localeCompare(a.time))[0]??null;
}
/** Machine-local only; malformed content is an error rather than another machine's success. */
export function localMemoryRun(dir,repository,{runGit=profileGit()}={}) {
 const file=path.join(gitCommonDir(dir,{runGit}),R.lastRun.replace('<id>',repositoryFolder(repository)));
 let run;try {run=JSON.parse(fs.readFileSync(file,'utf8'));}catch(error){if(error.code==='ENOENT')return null;throw error;}
 if(!run||!Number.isFinite(Date.parse(run.time))||!Object.values(W).includes(run.outcome))throw Error(W.failed);
 return run;
}
export function healthWords(run,now=()=>new Date()) {
 return run?`${Math.max(0,Math.floor((now().getTime()-Date.parse(run.time))/1000))}s ${run.outcome}`:`${W.never} ${W.unknown}`;
}
/** Model work holds only the repository lock; clone ownership covers local Git and immutable writes. */
export async function makeMemory(options) {
 const {dir,repository,pointer,runGit,now=()=>new Date()}=options,gitdir=gitCommonDir(dir,{runGit});
 const started=now().getTime(),lock=path.join(gitdir,R.runLock.replace('<id>',repositoryFolder(repository)));
 if(options.lane)exclusiveJson(gitdir,`${R.sources}/${repositoryFolder(repository)}`,'run',{lane:options.lane},profileStamp(now()),randomBytes);
 const health={time:now().toISOString(),outcome:W.busy,sent:0,done:0,pending:0,unsent:0,unknownUsage:0,tokens:0};
 const keepLocal=()=>atomicJson(path.join(gitdir,R.lastRun.replace('<id>',repositoryFolder(repository))),health);
 const release=acquireMemoryLock(lock,{now});if(!release) {keepLocal();return health;}
 try {
  let fetched,branch;
  // A stopped rebase can detach HEAD: recover under ownership before fetch reads the branch.
  try {
   withProfileLock(dir,runGit,()=>recoverProfile(dir,runGit,()=>{},{now}),{waitMs:0});
   fetched=fetchProfile(pointer,runGit);
   branch=fetched.branch??gitText(runGit,dir,['symbolic-ref','--short','HEAD']);
   // Network is outside ownership; recover again in case another writer stopped meanwhile.
   withProfileLock(dir,runGit,()=>{recoverProfile(dir,runGit,()=>{},{now});commitProfile(dir,runGit,'Keep private memory');if(fetched.ok&&!rebaseProfile(dir,branch,runGit).ok)throw Error(W.failed);},{waitMs:0});
  }catch(error) {health.outcome=error.message===PROFILE_WORDS.locked?W.busy:W.failed;keepLocal();return health;}
  const repoRoot=defaultMemoryRepo(options.repoRoot,{runGit:root=>runGit(root,['rev-parse','--git-common-dir'])}),units=await pendingUnits({...options,repoRoot});
  if(!units.length) {health.outcome=W.complete;keepLocal();return health;}
  const reservation=dayReservation(gitdir,{now,dayCap:options.caps?.dayTokens??DAY_TOKEN_CAP});let settle=null;
  const result=await extractShaped({...options,unitSource:units,runModel:options.runModel,caps:{tokens:RUN_TOKEN_CAP,calls:RUN_CALL_CAP,...options.caps,unknownCharge:UNKNOWN_USAGE_CHARGE},beforeCall:()=>{
   if(now().getTime()-started+TIMEOUT_MS>MAX_RUN_MS)return false;
   settle=reservation.reserve();return Boolean(settle);
  },afterCall:tokens=>{if(settle)settle(tokens);settle=null;}});
  health.sent=result.counts.ownerTurns+result.counts.reviewTitles-result.counts.skipped-result.counts.unsent+result.counts.failed;
  health.unsent=result.counts.unsent;health.unknownUsage=result.counts.unknownUsage;health.tokens=result.tokens;
  health.outcome=result.counts.failed?W.failed:result.counts.unsent?W.cap:result.counts.unclassified?W.malformed:W.complete;
  // Resolve only records that the merge actually stores; copies never include no-record turns.
  const evidence=new Map();for(const record of result.records) evidence.set(record.id,await resolveEvidence(record.evidence,{repoRoot,projectsRoot:options.projectsRoot,reviewsRoot:path.join(repoRoot,'docs','reviews')},record));
  let sha;
  try {withProfileLock(dir,runGit,()=>{
   recoverProfile(dir,runGit,()=>{},{now});commitProfile(dir,runGit,'Keep private memory');
   if(fetched.ok&&!rebaseProfile(dir,branch,runGit).ok)throw Error(W.failed);
   ensureRepository(dir,repository);const copies={};
   for(const candidate of result.records) {const record=mergeMemory(dir,candidate,{repository,now});const resolved=evidence.get(candidate.id);if(record&&resolved?.status==='resolved')copies[record.evidence]=resolved.texts.map(text=>text.slice(0,EVIDENCE_CAP));}
   if(Object.keys(copies).length)writeMemoryFile(dir,repository,L.units,'run',copies,{now});
   if(result.states.length)writeMemoryFile(dir,repository,L.seen,'run',result.states,{now});
   health.done=result.states.length;health.pending=units.length-result.states.length;
   writeMemoryFile(dir,repository,L.runs,'run',health,{now});commitProfile(dir,runGit,'Make project memory');sha=gitText(runGit,dir,['rev-parse','HEAD']);
  },{waitMs:MERGE_LOCK_WAIT_MS});}catch(error) {health.outcome=error.message===W.collision?W.collision:error.message===PROFILE_WORDS.locked?W.busy:W.mergeFailed;health.done=0;health.pending=units.length;}
  const pushed=sha?pushProfile(pointer,branch,sha,runGit):null;
  keepLocal();return {...health,...(pushed?{push:pushed}:{})};
 }catch {health.outcome=W.failed;keepLocal();return health;}
 finally{release();}
}
/** Only the CLI land boundary passes this starter; library lands default to no-op. */
export function startMemory({repo,lane},{env=process.env,spawn=spawnDefault,home=os.homedir(),agentDir=piAgentDir(),now=()=>new Date(),runGit=profileGit(env)}={}) {
 if(env.CI||env.NANA_ROLE!==undefined)return W.notStarted;
 let last=null;
 try {const resolved=resolveProfile(agentDir);if(resolved.ok) {
  const roots=gitText(runGit,repo,['rev-list','--max-parents=0','HEAD']).split(/\r?\n/u);const config=JSON.parse(fs.readFileSync(path.join(agentDir,'nana-pack.json'),'utf8'));
  const repository=roots.find(id=>config[OPT_IN_MEMBER]?.includes(id));if(repository)last=lastMemoryRun(resolved.pointer.dir,repository,{runGit});
 }}catch{}
 if(!spawnMemory(['make','--repo',repo,'--lane',lane],{env,spawn,home}))return W.notStarted;
 return `${W.started}; last ${healthWords(last,now)}`;
}
