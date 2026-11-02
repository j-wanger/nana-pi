#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-curate.mjs
 * @purpose Propose, show and record owner decisions on private memory curation.
 * @inputs Subcommands, active agent pointer, cwd, environment, clock, git and injected proposer.
 * @outputs Counts-only results or an explicitly private review queue and fixed refusals.
 * @effects disk, process, network
 * @errors Refusals exit 1; failed transport preserves committed work with a not-synced word.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { piAgentDir } from '../lib/agent-dir.mjs';
import { resolveProfile } from './nana-profile.mjs';
import { profileGuard, seatGuard } from '../lib/profile-guards.mjs';
import { profileGit, gitText, withProfileLock, recoverProfile, commitProfile, fetchProfile, rebaseProfile, syncProfile } from '../lib/profile-sync.mjs';
import { readMemoryStore, writeStateEvent } from '../lib/memory-store.mjs';
import { dayReservation } from '../lib/memory-run.mjs';
import { PROFILE_LAYOUT, PROFILE_LIMITS, PROFILE_WORDS as P } from '../lib/profile-config.mjs';
import { alreadyDecided, staleProposal, readCuration, writeCuration, pendingQueue, proposalIds, proposeCuration, countsLine, sizeLine, renderQueue } from '../lib/memory-curation.mjs';
import { LAYOUT, WORDS as W } from '../lib/memory-curation-config.mjs';
function parse(argv) {
 const [command,...args]=argv;if(!['propose','queue','accept','reject'].includes(command))throw Error(W.usage);
 let quote;const prefixes=[];
 for(let i=0;i<args.length;i++) {
  if(args[i]==='--quote'&&command==='accept'&&quote===undefined&&args[i+1]!==undefined)quote=args[++i];
  else if(!args[i].startsWith('--'))prefixes.push(args[i].toLowerCase());else throw Error(W.usage);
 }
 if(['accept','reject'].includes(command)) {
  if(!prefixes.length)throw Error(W.usage);
  if(new Set(prefixes).size!==prefixes.length||prefixes.some(id=>! /^[a-f0-9]{12,64}$/u.test(id)))throw Error(W.unknown);
  if(command==='accept'&&!quote?.trim())throw Error(P.quote);
  if(quote?.length>PROFILE_LIMITS.quote)throw Error(P.quoteCap);
 }else if(prefixes.length)throw Error(W.usage);
 return {command,prefixes,quote};
}
export async function runCurate(argv,{runModel,agentDir=piAgentDir(),env=process.env,cwd=process.cwd(),runGit=profileGit(env),now=()=>new Date(),stdout=s=>process.stdout.write(s),stderr=s=>process.stderr.write(s)}={}) {
 let notSynced=false;
 const suffix=()=>notSynced?`; ${W.notSynced}`:'';
 try {
  if(env.NANA_ROLE!==undefined)throw Error(P.role);if(env.CI)throw Error(W.ci);
  const args=parse(argv),resolved=resolveProfile(agentDir);if(!resolved.ok)throw Error(resolved.problem);
  const pointer=resolved.pointer,dir=pointer.dir;
  if(profileGuard(dir,runGit)!==pointer.verifiedPushUrl)throw Error(P.config);
  if(!fs.existsSync(path.join(dir,PROFILE_LAYOUT.marker)))throw Error(P.marker);
  seatGuard(pointer,cwd,env,runGit);
  // Read before any recovery commit so damaged profile JSON refuses without writes.
  readMemoryStore(dir);
  let gitdir;
  const locked=fn=>withProfileLock(dir,runGit,current=>{gitdir=current;return fn();},{waitMs:0});
  locked(()=>{recoverProfile(dir,runGit,()=>{},{now});commitProfile(dir,runGit,'Keep private memory');});
  const fetched=fetchProfile(pointer,runGit);notSynced=!fetched.ok;
  locked(()=>{recoverProfile(dir,runGit,()=>{},{now});commitProfile(dir,runGit,'Keep private memory');if(fetched.ok&&!rebaseProfile(dir,fetched.branch,runGit).ok)throw Error(P.git);});
  const sync=()=>{try{if(!syncProfile(pointer,{runGit}).ok)notSynced=true;}catch{notSynced=true;}};
  if(args.command==='queue') {
   const states=readMemoryStore(dir),data=readCuration(dir),queue=pendingQueue(states,data.proposals,data.decisions);
   const tail=queue.stale||data.bad||notSynced?`${W.queue} stale ${queue.stale}; bad ${data.bad}${suffix()}\n`:'';
   stdout(renderQueue(states,queue.pending,{tail}));
   return 0;
  }
  if(args.command==='propose') {
   const result=await proposeCuration(readMemoryStore(dir),{runModel,reservation:dayReservation(gitdir,{now}),writeBatch:batch=>locked(()=>{
    recoverProfile(dir,runGit,()=>{},{now});commitProfile(dir,runGit,'Keep private memory');
    const states=readMemoryStore(dir),data=readCuration(dir),existing=new Set(data.proposals.map(p=>p.key));
    const held=new Set(pendingQueue(states,data.proposals,data.decisions).pending.flatMap(proposalIds));let proposals=0,decided=0;
    for(const proposal of batch) {
     if(staleProposal(proposal,states)||alreadyDecided(proposal,data.decisions)||existing.has(proposal.key)||proposalIds(proposal).some(id=>held.has(id))){decided++;continue;}
     writeCuration(dir,LAYOUT.proposals,proposal,{now});existing.add(proposal.key);for(const id of proposalIds(proposal))held.add(id);proposals++;
    }
    commitProfile(dir,runGit,'Propose private memory curation');return {proposals,decided,bad:data.bad};
   })});
   if(!result.ok){stdout((result.unavailable?W.unavailable:W.repliesRejected)+'\n');return 1;}
   locked(sync);
   const states=readMemoryStore(dir),data=readCuration(dir),queue=pendingQueue(states,data.proposals,data.decisions);
   stdout(countsLine(result.counts)+suffix()+'\n'+sizeLine(states,queue.pending)+'\n');return 0;
  }
  const keys=locked(()=>{
   recoverProfile(dir,runGit,()=>{},{now});commitProfile(dir,runGit,'Keep private memory');
   const states=readMemoryStore(dir),data=readCuration(dir),unique=[...new Map(data.proposals.map(p=>[p.key,p])).values()];
   const selected=args.prefixes.map(prefix=>{const matches=unique.filter(p=>p.key.startsWith(prefix));if(matches.length!==1)throw Error(W.unknown);return matches[0];});
   // Validate every decision before the first exclusive-create or event write.
   for(const proposal of selected) {
    if(alreadyDecided(proposal,data.decisions))throw Error(W.decided);
    if(staleProposal(proposal,states))throw Error(W.stale);
   }
   const named=selected.flatMap(proposalIds);
   if(args.command==='accept'&&new Set(named).size!==named.length)throw Error(W.usage);
   if(args.command==='accept')for(const proposal of selected) {
    if(proposal.op==='merge')for(const id of proposal.drop)writeStateEvent(dir,states.find(r=>r.id===id),'supersede',{target:proposal.keep,quote:args.quote},{now});
    else {
     const target=states.find(r=>r.id===proposal.id);
     for(const id of new Set([target.id,...target.absorbed]))writeStateEvent(dir,states.find(r=>r.id===id),'retract',{quote:args.quote},{now});
    }
   }
   for(const proposal of selected)writeCuration(dir,LAYOUT.decisions,{key:proposal.key,action:args.command,proposal},{now});
   commitProfile(dir,runGit,'Decide private memory curation');sync();return selected.map(p=>p.key.slice(0,12));
  });
  stdout(`${args.command==='accept'?W.accepted:W.rejected} ${keys.length}; ${keys.join(' ')}${suffix()}\n`);return 0;
 }catch(error){
  const word=error?.message,known=[...Object.values(P),...Object.values(W)].filter(v=>typeof v==='string');
  stderr(`${known.includes(word)?word:P.git}${suffix()}\n`);return 1;
 }
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url))) {
 const cli=fileURLToPath(new URL('../../../scripts/memory-curate.mjs',import.meta.url));
 const child=spawnSync(process.execPath,[cli,...process.argv.slice(2)],{stdio:'inherit',windowsHide:true});process.exitCode=child.status??1;
}
