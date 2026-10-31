/**
 * @module packages/nana-pack/lib/profile-store.mjs
 * @purpose Write immutable shape records and derive the profile's effective trust, liveness and bounded display.
 * @inputs Claims, owner quotes, runtime environment, clock, random source, record files and events.
 * @outputs Exclusive-created JSON records/events, normalized IDs and effective state or show text.
 * @effects disk
 * @errors Sealed validation refusals and filesystem failures.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { parseJsonBytes } from './json-text.mjs';
import { readBounded } from './bounded-read.mjs';
import { CANDIDATE_FIELDS } from './memory-making-config.mjs';
import { suiteRecordStamp } from './suite-records.mjs';
import { PROFILE_MEDIUM_SESSIONS, PROFILE_SHOW_BUDGET, PROFILE_LIMITS, PROFILE_SESSION_VARIABLES, PROFILE_STAMP_FORMAT, PROFILE_PATH_POLICY, PROFILE_LAYOUT as L, PROFILE_WORDS as W } from './profile-config.mjs';

/** NFC, folded case and all whitespace collapsed: shared by IDs and quote comparisons. */
export const normalizeProfileText = text => String(text).normalize('NFC').toLowerCase().replace(/\s+/gu,' ').trim();
export const claimId = claim => createHash('sha256').update(normalizeProfileText(claim)).digest('hex');
export function profileStamp(date) {
 return suiteRecordStamp(date)[PROFILE_STAMP_FORMAT]();
}
export function profileSession(env,date) {
 const variable=PROFILE_SESSION_VARIABLES.find(name=>env[name]);
 return {key:variable ? env[variable] : `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`,runtime:variable?.startsWith('CLAUDE')?W.runtimeClaude:W.runtimePi};
}
export function validateProfileSave({kind,claim,quote}) {
 if(!quote?.trim()) throw Error(W.quote);
 if(kind==='decision') throw Error(W.decision);
 if(kind==='open-thread') throw Error(W.openThread);
 if(!W.kinds.includes(kind)) throw Error(W.kind);
 if(!claim?.trim()||claim.length>PROFILE_LIMITS.claim) throw Error(W.claimCap);
 if(quote.length>PROFILE_LIMITS.quote) throw Error(W.quoteCap);
}
function exclusiveJson(dir,folder,id,value,stamp,random) {
 const relative=`${folder}/${id}/${stamp}-${random(PROFILE_PATH_POLICY.randomBytes).toString('hex')}.json`;
 if(!new RegExp(PROFILE_PATH_POLICY.pattern).test(relative)||relative.length>PROFILE_PATH_POLICY.max) throw Error(W.config);
 const target=path.join(dir,relative); fs.mkdirSync(path.dirname(target),{recursive:true,mode:0o700});
 const fd=fs.openSync(target,'wx',0o600);
 try {fs.writeFileSync(fd,`${JSON.stringify(value)}\n`);fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
 return target;
}
export function writeProfileRecord(dir,args,{env=process.env,now=()=>new Date(),random=randomBytes}={}) {
 validateProfileSave(args); const date=now(); const day=date.toISOString().slice(0,10); const session=profileSession(env,date);
 const values={id:claimId(args.claim),type:W.type,kind:args.kind,claim:args.claim,quote:args.quote,context:'',evidence:`${W.evidencePrefix}:${session.runtime}:${session.key}:${day}`,date:day,trust:W.trust[0],source:W.source,roles:[...W.roles],validFrom:day,invalidAt:null,supersedes:[]};
 const record=Object.fromEntries(CANDIDATE_FIELDS.map(field=>[field,values[field]]));
 exclusiveJson(dir,L.records,record.id,record,profileStamp(date),random); return record;
}
export function writeProfileEvent(dir,id,action,{quote,target},{now=()=>new Date(),random=randomBytes}={}) {
 if(!quote?.trim()) throw Error(W.quote); if(quote.length>PROFILE_LIMITS.quote) throw Error(W.quoteCap);
 const stamp=profileStamp(now()); const event={id,action,quote,stamp,...(target?{target}:{})};
 exclusiveJson(dir,L.events,id,event,stamp,random); return event;
}
export function readProfileStore(dir) {
 const read=folder=>{
  const base=path.join(dir,folder); if(!fs.existsSync(base)) return [];
  return fs.readdirSync(base).sort().flatMap(id=>{
   if(!fs.statSync(path.join(base,id)).isDirectory()) return [];
   return fs.readdirSync(path.join(base,id)).sort().filter(n=>n.endsWith('.json')).map(name=>({record:parseJsonBytes(readBounded(path.join(base,id,name))),stamp:name.split('-')[0]}));
  });
 };
 return {recordFiles:read(L.records),events:read(L.events).map(x=>x.record)};
}
/** Stored trust/invalidAt are write-time values; this is the single effective-state reader. */
export function effectiveState(recordFiles,events) {
 const groups=new Map();
 for(const file of recordFiles) {
  const record=file.record??file; const stamp=file.stamp??record.date;
  if(!groups.has(record.id)) groups.set(record.id,[]); groups.get(record.id).push({record,stamp});
 }
 const states=[...groups.values()].map(files=>{
  files.sort((a,b)=>a.stamp.localeCompare(b.stamp)); const first=files[0].record; const sessions=new Set(),seenSessions=new Set(),quotes=new Set();
  for(const {record} of files) {
   // Session keys may themselves contain colons; remove only the fixed prefix/runtime/day.
   const key=record.evidence.split(':').slice(2,-1).join(':'); const quote=normalizeProfileText(record.quote);
   if(!seenSessions.has(key)&&!quotes.has(quote)) sessions.add(key);
   seenSessions.add(key); quotes.add(quote);
  }
  const own=events.filter(e=>e.id===first.id); const high=own.some(e=>e.action==='confirm'&&normalizeProfileText(e.quote)&&!files.some(f=>f.stamp<=e.stamp&&normalizeProfileText(f.record.quote)===normalizeProfileText(e.quote)));
  const trust=high?W.trust[2]:sessions.size>=PROFILE_MEDIUM_SESSIONS?W.trust[1]:W.trust[0];
  return {...first,trust,live:!own.some(e=>e.action==='retract'),stamp:files.at(-1).stamp,repeats:files.length-1,supersedes:[]};
 });
 const byId=new Map(states.map(r=>[r.id,r]));
 const edges=events.filter(e=>e.action==='supersede'&&byId.has(e.id)&&byId.has(e.target));
 const incoming=new Map(states.map(r=>[r.id,edges.filter(e=>e.id===r.id)]));
 // DFS settles chains. On a cycle, the newest supersede's target wins; remaining nodes
 // are suppressed, not all removed. Unrelated retractions remain authoritative.
 const resolved=new Map(); const visiting=[];
 const live=id=>{
  if(resolved.has(id)) return resolved.get(id);
  if(!byId.get(id).live) {resolved.set(id,false);return false;}
  const cycleAt=visiting.indexOf(id);
  if(cycleAt>=0) {
   const cycle=visiting.slice(cycleAt); const newest=edges.filter(e=>cycle.includes(e.id)&&cycle.includes(e.target)).sort((a,b)=>b.stamp.localeCompare(a.stamp)||b.target.localeCompare(a.target))[0];
   for(const node of cycle) resolved.set(node,node===newest.target);
   return resolved.get(id);
  }
  visiting.push(id); const hidden=incoming.get(id).some(e=>live(e.target)); visiting.pop();
  if(!resolved.has(id)) resolved.set(id,!hidden); return resolved.get(id);
 };
 for(const r of states) r.live=live(r.id);
 for(const edge of edges) if(byId.get(edge.target).live) byId.get(edge.target).supersedes.push(edge.id);
 return states;
}
/** Trust first, then newest; reserve a fold line so output never exceeds its whole budget. */
export function show(states) {
 const live=states.filter(r=>r.live).sort((a,b)=>W.trust.indexOf(b.trust)-W.trust.indexOf(a.trust)||String(b.stamp??b.date).localeCompare(String(a.stamp??a.date))||a.id.localeCompare(b.id));
 const competitors=new Map();
 for(const r of live) for(const old of r.supersedes??[]) {if(!competitors.has(old)) competitors.set(old,[]); competitors.get(old).push(r.id);}
 const conflicts=[...competitors].filter(([,ids])=>ids.length>1).map(([old,ids])=>`${W.conflict}${old}: ${ids.sort().join(', ')}\n`);
 const lines=[...conflicts,...live.map(r=>`[${r.trust} ${r.date}] ${r.claim.replace(/\s+/gu,' ').trim()} (${r.id})\n`)];
 if(lines.join('').length<=PROFILE_SHOW_BUDGET) return lines.join('');
 let text='',kept=0;
 for(const line of lines) {
  const fold=`${W.fold}${lines.length-kept}\n`; if(text.length+line.length+fold.length>PROFILE_SHOW_BUDGET) break;
  text+=line; kept++;
 }
 return `${text}${W.fold}${lines.length-kept}\n`;
}
