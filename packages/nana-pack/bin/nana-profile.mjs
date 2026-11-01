#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-profile.mjs
 * @purpose Initialize, save, inspect and sync the seat's private per-machine owner profile.
 * @inputs Subcommands and flags, user-scope ownerProfile, cwd, environment and injectable process/clock seams.
 * @outputs Saved lines, bounded show text and fixed refusal or sync status lines.
 * @effects disk, process, network
 * @errors Exits 1 for local refusals or failed explicit sync; a locally committed save survives a push failure with exit 0.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { piAgentDir } from '../lib/agent-dir.mjs';
import { profileGuard, seatGuard, dailyCounter } from '../lib/profile-guards.mjs';
import { mergeMemory, readMemoryStore, writeMemoryFile } from '../lib/memory-store.mjs';
import { readBounded, BOUNDED_READ_CAP } from '../lib/bounded-read.mjs';
import { parseJsonBytes } from '../lib/json-text.mjs';
import { ghFromEnvironment, ghResult } from '../lib/gh-runner.mjs';
import { writePackConfigMember } from '../lib/pack-config-write.mjs';
import { profileGit, gitText, withProfileLock, recoverProfile, commitProfile, syncProfile } from '../lib/profile-sync.mjs';
import { claimId, readProfileStore, effectiveState, show, validateProfileSave, writeProfileEvent, normalizeProfileText, profileStamp } from '../lib/profile-store.mjs';
import { PROFILE_GIT_TIMEOUT_MS, PROFILE_LIMITS, PROFILE_REMOTE_FORMS, PROFILE_LAYOUT as L, PROFILE_WORDS as W } from '../lib/profile-config.mjs';

/** Like resolveRoster, read only this member and refuse dangling links and malformed bytes. */
export function resolveProfile(agentDir) {
 const file=path.join(agentDir,'nana-pack.json'); let raw;
 try { raw=parseJsonBytes(readBounded(file,BOUNDED_READ_CAP)); }
 catch(e) {
  if(e.code==='ENOENT') {try {fs.lstatSync(file);return {ok:false,problem:W.config};}catch{return {ok:false,problem:W.pointer};}}
  return {ok:false,problem:W.config};
 }
 if(raw===null||typeof raw!=='object'||Array.isArray(raw)) return {ok:false,problem:W.config};
 const pointer=raw.ownerProfile;
 if(pointer===undefined) return {ok:false,problem:W.pointer};
 if(!pointer||typeof pointer.dir!=='string'||!path.isAbsolute(pointer.dir)||typeof pointer.verifiedPushUrl!=='string'||!pointer.verifiedPushUrl) return {ok:false,problem:W.config};
 return {ok:true,pointer};
}
function parse(args) {
 const [command,...rest]=args; const positional=[]; const flags={};
 const values=['--dir','--kind','--claim','--quote']; const toggles=['--save','--unverified-remote'];
 for(let i=0;i<rest.length;i++) {
  const word=rest[i];
  if(values.includes(word)) {if(flags[word]!==undefined||rest[i+1]===undefined) throw Error(W.usage);flags[word]=rest[++i];}
  else if(toggles.includes(word)) {flags[word]=true;}
  else if(word.startsWith('--')) throw Error(W.usage); else positional.push(word);
 }
 const allowed={init:['--dir','--save','--unverified-remote'],save:['--kind','--claim','--quote'],confirm:['--quote'],retract:['--quote'],supersede:['--kind','--claim','--quote'],sync:[],show:[]};
 if(!allowed[command]||Object.keys(flags).some(k=>!allowed[command].includes(k))||positional.length!==(['confirm','retract','supersede'].includes(command)?1:0)) throw Error(W.usage);
 return {command,id:positional[0],dir:flags['--dir'],save:!!flags['--save'],unverifiedRemote:!!flags['--unverified-remote'],kind:flags['--kind'],claim:flags['--claim'],quote:flags['--quote']};
}
function layout(dir,runGit) {
 const initialized=fs.existsSync(path.join(dir,L.marker));
 if(initialized) return;
 if(gitText(runGit,dir,['status','--porcelain'])) throw Error(W.dirty);
 for(const [name,text] of [[L.marker,'Private append-only profile\n'],['.gitattributes',L.attributes],['readme.md',L.readme],[`${L.records}/.keep`,''],[`${L.events}/.keep`,'']]) {
  const target=path.join(dir,name);fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
  fs.writeFileSync(target,text,{flag:'wx',mode:0o600});
 }
 gitText(runGit,dir,['add','--',L.marker,'.gitattributes','readme.md',L.records,L.events]);
 gitText(runGit,dir,['commit','-m','Initialize private profile']);
}
export function runProfile(args,{agentDir=piAgentDir(),env=process.env,cwd=process.cwd(),runGit=profileGit(env),runGh=ghFromEnvironment(env,{timeoutMs:PROFILE_GIT_TIMEOUT_MS}),now=()=>new Date(),log=console.log,error=console.error}={}) {
 try {
  if(env.NANA_ROLE!==undefined) throw Error(W.role);
  const p=parse(args);
  if(p.command==='init') {
   if(!p.dir) throw Error(W.pointer); const dir=fs.realpathSync(path.resolve(p.dir));
   const current=resolveProfile(agentDir); if(!current.ok&&current.problem!==W.pointer) throw Error(current.problem);
   const url=profileGuard(dir,runGit);
   if(!p.unverifiedRemote) {
    const repo=PROFILE_REMOTE_FORMS.map(form=>new RegExp(form).exec(url)?.[1]).find(Boolean);
    if(!repo) throw Error(W.private);
    const checked=ghResult(runGh,dir,['repo','view',repo,'--json','isPrivate'],{env,timeoutMs:PROFILE_GIT_TIMEOUT_MS});
    let privateRepo=false;try {privateRepo=checked.ok&&parseJsonBytes(Buffer.from(checked.stdout)).isPrivate===true;}catch{}
    if(!privateRepo) throw Error(W.private);
   }
   const pointer={dir,verifiedPushUrl:url,unverifiedRemote:p.unverifiedRemote,save:p.save};
   withProfileLock(dir,runGit,()=>{
    recoverProfile(dir,runGit,log,{now});layout(dir,runGit);
    const result=syncProfile(pointer,{runGit,log});if(!result.ok) throw Error(`${W.notPushed}${result.reason}`);
    fs.mkdirSync(agentDir,{recursive:true,mode:0o700}); const written=writePackConfigMember(agentDir,'ownerProfile',pointer);if(!written.ok) throw Error(W.config);
   });
   log(W.initialized); return 0;
  }
  const resolved=resolveProfile(agentDir); if(!resolved.ok) throw Error(resolved.problem);const pointer=resolved.pointer;const dir=pointer.dir;
  profileGuard(dir,runGit); if(!fs.existsSync(path.join(dir,L.marker))) throw Error(W.marker);
  if(p.command==='show') {const input=readProfileStore(dir);const text=show(effectiveState(input.recordFiles,input.events));if(text) log(text.replace(/\n$/,''));return 0;}
  if(p.command!=='sync') seatGuard(pointer,cwd,env,runGit);
  return withProfileLock(dir,runGit,gitdir=>{
   recoverProfile(dir,runGit,log,{now});
   if(p.command==='sync') {const result=syncProfile(pointer,{runGit,log});if(!result.ok) {error(`${W.notPushed}${result.reason}`);return 1;}log(W.synced);return 0;}
   const input=readProfileStore(dir);
   const memory=readMemoryStore(dir); const targets=p.command==='save'?[]:memory.filter(r=>r.id.startsWith(p.id.toLowerCase()));
   if(p.command!=='save'&&(!/^[a-f0-9]{12,}$/i.test(p.id)||targets.length!==1)) throw Error(W.unknown);
   const previous=p.command==='save'?undefined:targets[0]; const id=previous?.id;
   if(['confirm','retract'].includes(p.command)) {
    if(!p.quote?.trim()) throw Error(W.quote);
    const quotes=previous?.repository?[normalizeProfileText(previous.quote)]:input.recordFiles.filter(x=>x.record.id===id).map(x=>normalizeProfileText(x.record.quote));
    if(p.command==='confirm'&&quotes.includes(normalizeProfileText(p.quote))) throw Error(W.repeatedQuote);
    // Check unrelated changes before exclusive-create; refused commands leave no record.
    commitProfile(dir,runGit,'Keep profile records');
    if(previous.repository) {
     const date=now(),stamp=profileStamp(date);
     writeMemoryFile(dir,previous.repository,L.events,id,{id,action:p.command,quote:p.quote,stamp},{now:()=>date});
    } else writeProfileEvent(dir,id,p.command,{quote:p.quote},{now});
   } else {
    validateProfileSave(p);
    const {file,counter}=dailyCounter(gitdir,now);if(counter.count>=PROFILE_LIMITS.daily) throw Error(W.dailyCap);
    if(p.command==='supersede'&&claimId(p.claim)===id) throw Error(W.usage);
    commitProfile(dir,runGit,'Keep profile records');
    const record=mergeMemory(dir,p,{env,now,saved:true});
    if(p.command==='supersede') {
     if(previous.repository) {
      const date=now(),stamp=profileStamp(date);
      writeMemoryFile(dir,previous.repository,L.events,id,{id,action:'supersede',quote:p.quote,target:record.id,stamp},{now:()=>date});
     } else writeProfileEvent(dir,id,'supersede',{quote:p.quote,target:record.id},{now});
    }
    commitProfile(dir,runGit,'Save owner profile');
    fs.writeFileSync(file,JSON.stringify({...counter,count:counter.count+1}),{mode:0o600});
    log(`${W.saved}${record.claim} (${record.id})`);
   }
   commitProfile(dir,runGit,'Keep owner profile event');
   try {const result=syncProfile(pointer,{runGit,log});if(!result.ok)log(`${W.notPushed}${result.reason}`);}catch {log(`${W.notPushed}${W.reasons[0]}`);}
   return 0;
  });
 } catch(e) {
  const message=String(e?.message??''); const known=Object.values(W).some(v=>typeof v==='string'&&v===message)||W.reasons.some(r=>message===`${W.notPushed}${r}`);
  error(known?message:W.git);return 1;
 }
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url))) process.exitCode=runProfile(process.argv.slice(2));
