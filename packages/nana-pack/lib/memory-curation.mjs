/**
 * @module packages/nana-pack/lib/memory-curation.mjs
 * @purpose Derive private owner-review proposals and a bounded queue without changing live memory.
 * @inputs Effective states, immutable proposals/decisions, injected model, day reservation and batch writer.
 * @outputs Grouped batches, validated proposals, private queue text and count-only size/spend lines.
 * @effects disk (private curation files); network (injected runner only)
 * @errors Invalid replies fail closed; filesystem failures propagate to the fixed-word boundary.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash, randomBytes } from 'node:crypto';
import { normalizeProfileText, exclusiveJson, profileStamp, readProfileJson } from './profile-store.mjs';
import { PROFILE_SHOW_BUDGET, PROFILE_WORDS } from './profile-config.mjs';
import { OWNER_CAP } from './memory-shaping-config.mjs';
import { UNKNOWN_USAGE_CHARGE } from './memory-run-config.mjs';
import * as C from './memory-curation-config.mjs';

/** Union by any shared normalized span, including transitive chains across areas. */
export function groupRecords(states) {
 const live=states.filter(r=>r.live),parent=live.map((_,i)=>i),spans=new Map();
 const root=i=>{while(parent[i]!==i){parent[i]=parent[parent[i]];i=parent[i];}return i;};
 live.forEach((record,i)=>{
  const quote=normalizeProfileText(record.quote);
  for(let j=0;j+C.QUOTE_SPAN_CHARS<=quote.length;j++) {
   const span=quote.slice(j,j+C.QUOTE_SPAN_CHARS);
   if(spans.has(span))parent[root(i)]=root(spans.get(span));else spans.set(span,i);
  }
 });
 const groups=new Map();live.forEach((r,i)=>{const key=root(i);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(r);});
 return [...groups.values()].map(g=>g.sort((a,b)=>String(a.date).localeCompare(String(b.date))||a.id.localeCompare(b.id))).sort((a,b)=>b.length-a.length||a[0].id.localeCompare(b[0].id));
}
/** Oversize groups go first, in date-ordered pieces; the final piece may share a batch. */
export function batchRecords(groups) {
 const batches=[];let batch=[],split=0;
 groups.forEach((group,i)=>{
  if(group.length>C.BATCH_RECORDS)split++;
  for(let start=0;start<group.length;start+=C.BATCH_RECORDS){
   const piece=group.slice(start,start+C.BATCH_RECORDS).map(r=>({...r,group:`g${i+1}`}));
   if(batch.length+piece.length>C.BATCH_RECORDS){batches.push(batch);batch=[];}
   batch.push(...piece);
  }
 });
 if(batch.length)batches.push(batch);return {batches,split};
}
export const proposalIds=p=>p.op==='merge'?[p.keep,...p.drop]:[p.id];
export const proposalKey=p=>createHash('sha256').update(JSON.stringify([p.op,...proposalIds(p).sort(),...(p.op==='retire'?p.group:[])])).digest('hex');
const hex=id=>typeof id==='string'&&/^[a-f0-9]{64}$/u.test(id);
const reasonOK=r=>typeof r==='string'&&r.trim().length>0&&r.length<=C.REASON_CAP;
function storedProposal(p) {
 return p&&hex(p.key)&&reasonOK(p.reason)&&Array.isArray(p.group)&&p.group.every(hex)&&
  (p.op==='merge'?hex(p.keep)&&Array.isArray(p.drop)&&p.drop.length>0&&p.drop.every(hex)&&!p.drop.includes(p.keep)&&new Set(p.drop).size===p.drop.length:p.op==='retire'&&hex(p.id)&&C.RETIRE_CLASSES.includes(p.class));
}
/** Syntax and shape damage is counted; readers never treat a partial decision as an acceptance. */
export function readCuration(dir) {
 let bad=0;const read=(folder,valid)=>{
  const base=path.join(dir,C.LAYOUT.root,folder);if(!fs.existsSync(base))return [];
  return fs.readdirSync(base).sort().flatMap(key=>{
   const group=path.join(base,key);if(!fs.statSync(group).isDirectory())return [];
   return fs.readdirSync(group).sort().filter(n=>n.endsWith('.json')).flatMap(name=>{
    const row=readProfileJson(path.join(group,name),{onUnparseable:()=>bad++});
    if(row===undefined)return [];if(!valid(row)){bad++;return [];}return [row];
   });
  });
 };
 const proposals=read(C.LAYOUT.proposals,storedProposal);
 const decisions=read(C.LAYOUT.decisions,d=>d&&Object.keys(d).sort().join(',')===C.FIELDS.decision.join(',')&&['accept','reject'].includes(d.action)&&storedProposal(d.proposal)&&d.key===d.proposal.key);
 return {proposals,decisions,bad};
}
export function writeCuration(dir,folder,value,{now=()=>new Date(),random=randomBytes}={}) {
 return exclusiveJson(dir,`${C.LAYOUT.root}/${folder}`,value.key,value,profileStamp(now()),random);
}
export const staleProposal=(p,states)=>proposalIds(p).some(id=>!states.some(r=>r.id===id&&r.live));
/** Rejecting a merge forbids its subsets; a retirement needs a genuinely new group member. */
export function alreadyDecided(p,decisions) {
 return decisions.some(d=>d.key===p.key||(d.action==='reject'&&d.proposal.op===p.op&&
  (p.op==='merge'?proposalIds(p).every(id=>proposalIds(d.proposal).includes(id)):p.id===d.proposal.id&&p.group.every(id=>d.proposal.group.includes(id)))));
}
export function pendingQueue(states,proposals,decisions) {
 let stale=0,decided=0;const unique=new Map();for(const p of proposals)if(!unique.has(p.key))unique.set(p.key,p);
 const pending=[...unique.values()].filter(p=>{if(alreadyDecided(p,decisions)){decided++;return false;}if(staleProposal(p,states)){stale++;return false;}return true;});
 const freed=p=>proposalIds(p).filter(id=>id!==p.keep).reduce((n,id)=>n+(states.find(r=>r.id===id)?.claim.length??0),0);
 pending.sort((a,b)=>freed(b)-freed(a)||a.key.localeCompare(b.key));return {pending,stale,decided};
}
/** Each invalid proposal is dropped independently; overlaps invalidate all participants. */
export function validateProposals(text,batch,groups) {
 let reply;try{reply=JSON.parse(text);}catch{return null;}
 if(!reply||Array.isArray(reply)||!Array.isArray(reply.proposals))return null;
 const locals=new Map(batch.map((r,i)=>[`r${i+1}`,r])),mentions=new Map();
 const ids=p=>p?.op==='merge'?[p.keep,...(Array.isArray(p.drop)?p.drop:[])]:[p?.id];
 reply.proposals.forEach((p,index)=>{for(const id of new Set(ids(p))) {if(!mentions.has(id))mentions.set(id,[]);mentions.get(id).push(index);}});
 let dropped=0;const proposals=[];
 reply.proposals.forEach(p=>{
  const named=ids(p);let valid=p&&reasonOK(p.reason)&&named.every(id=>locals.has(id)&&mentions.get(id).length===1);
  if(p?.op==='merge')valid=valid&&Array.isArray(p.drop)&&p.drop.length>0&&!p.drop.includes(p.keep)&&new Set(named).size===named.length&&Object.keys(p).sort().join(',')===C.FIELDS.merge.join(',');
  else valid=valid&&p?.op==='retire'&&C.RETIRE_CLASSES.includes(p.class)&&Object.keys(p).sort().join(',')===C.FIELDS.retire.join(',');
  if(!valid){dropped++;return;}
  const records=named.map(id=>locals.get(id)),saved=records.filter(r=>r.source===PROFILE_WORDS.source);
  if(p.op==='merge'&&saved.length>1){dropped++;return;}
  const group=[...new Set(records.flatMap(r=>groups.find(g=>g.some(x=>x.id===r.id)).map(x=>x.id)))].sort();
  const keep=saved[0]?.id??locals.get(p.keep)?.id;
  const proposal=p.op==='merge'?{op:p.op,keep,drop:records.map(r=>r.id).filter(id=>id!==keep).sort(),reason:p.reason.trim(),group}:{op:p.op,id:records[0].id,class:p.class,reason:p.reason.trim(),group};
  proposals.push({...proposal,key:proposalKey(proposal)});
 });
 return {proposals,dropped};
}
export const REPLY_SCHEMA={type:'object',required:['proposals'],additionalProperties:false,properties:{proposals:{type:'array',items:{oneOf:[
 {type:'object',required:['op','keep','drop','reason'],additionalProperties:false,properties:{op:{const:'merge'},keep:{type:'string'},drop:{type:'array',items:{type:'string'}},reason:{type:'string',maxLength:C.REASON_CAP}}},
 {type:'object',required:['op','id','class','reason'],additionalProperties:false,properties:{op:{const:'retire'},id:{type:'string'},class:{enum:C.RETIRE_CLASSES},reason:{type:'string',maxLength:C.REASON_CAP}}}
]}}}};
/** The caller reserves day tokens and persists each completed batch under a short clone lock. */
export async function proposeCuration(states,{runModel,reservation,writeBatch}={}) {
 const groups=groupRecords(states),{batches,split}=batchRecords(groups);
 const counts={proposals:0,batches:0,rejected:0,dropped:0,decided:0,split,unsent:0,tokens:0,cost:0,bad:0};
 let validBatches=0;const noRunner=typeof runModel!=='function';let unavailable=noRunner;
 for(const batch of batches) {
  if(noRunner){counts.unsent++;continue;}
  if(counts.batches>=C.CALL_CAP||counts.tokens+UNKNOWN_USAGE_CHARGE>C.TOKEN_CAP){counts.unsent++;continue;}
  const settle=reservation.reserve();if(!settle){counts.unsent++;continue;}
  let result;counts.batches++;
  const input=batch.map((r,i)=>({id:`r${i+1}`,area:r.repository??'profile',kind:r.kind,source:r.source,date:r.date,claim:r.claim,quote:r.quote.slice(0,OWNER_CAP),group:r.group}));
  try{result=await runModel({system:C.SYSTEM_PROMPT,prompt:JSON.stringify(input),schema:REPLY_SCHEMA});}catch{result=null;}
  const known=Number.isFinite(result?.usage?.tokens)&&result.usage.tokens>=0,tokens=known?result.usage.tokens:UNKNOWN_USAGE_CHARGE;
  settle(tokens);counts.tokens+=tokens;
  const cost=result?.usage?.cost;
  counts.cost=counts.cost===null||!known||!Number.isFinite(cost)||cost<0||(tokens>0&&cost===0)?null:counts.cost+cost;
  const reply=result?.ok?validateProposals(result.text,batch,groups):null;
  if(!reply){counts.rejected++;if(!result?.ok)unavailable=true;continue;}
  if(reply.proposals.length||reply.dropped===0)validBatches++;
  counts.dropped+=reply.dropped;
  const written=await writeBatch(reply.proposals);counts.proposals+=written.proposals;counts.decided+=written.decided;counts.bad=Math.max(counts.bad,written.bad);
 }
 return {counts,ok:validBatches>0||batches.length===0,unavailable};
}
export function countsLine(c) {
 return `${C.WORDS.counts} proposals ${c.proposals}; batches ${c.batches}; rejected ${c.rejected}; dropped ${c.dropped}; decided ${c.decided}; split ${c.split}; unsent ${c.unsent}; tokens ${c.tokens}; cost ${c.cost??'unknown'}; bad ${c.bad}`;
}
export function sizeLine(states,pending=[]) {
 const removed=new Set(pending.flatMap(p=>p.op==='merge'?p.drop:[p.id,...(states.find(r=>r.id===p.id)?.supersedes??[])]));
 const part=(repository,after)=>{const rows=states.filter(r=>r.live&&Boolean(r.repository)===repository&&(!after||!removed.has(r.id)));return `${rows.length} records ${rows.reduce((n,r)=>n+r.claim.length,0)} chars`;};
 return `${C.WORDS.size} profile ${part(false,false)} -> ${part(false,true)}; project ${part(true,false)} -> ${part(true,true)}`;
}
/** The first decision is always visible, even when it alone exceeds the shared display budget. */
export function renderQueue(states,pending,{tail=''}={}) {
 const clean=s=>String(s).replace(/\s+/gu,' ').trim();
 const entry=(p,i)=>{
  const target=states.find(r=>r.id===p.id);
  const lines=[`${i+1}. ${p.key.slice(0,12)} ${p.op}${p.op==='retire'?` ${p.class}; absorbed ${target?.supersedes.length??0}`:''}`];
  for(const id of proposalIds(p)) {
   const r=states.find(s=>s.id===id);if(!r)continue;
   const claim=clean(r.claim),capped=claim.length>C.QUEUE_CLAIM_CAP?claim.slice(0,C.QUEUE_CLAIM_CAP)+C.WORDS.cut:claim;
   lines.push(`  ${id===p.keep?'keep':p.op==='merge'?'drop':'retire'} [${clean(r.source)} ${clean(r.date)}] ${capped}`);
  }
  lines.push(`  reason: ${clean(p.reason)}`);return lines.join('\n')+'\n';
 };
 let text=C.WORDS.privacy+'\n'+sizeLine(states,pending)+'\n',kept=0;
 for(const [i,p] of pending.entries()) {
  const line=entry(p,i),fold=C.WORDS.fold+(pending.length-i)+'\n';
  if(i>0&&text.length+line.length+fold.length+tail.length>PROFILE_SHOW_BUDGET)break;
  text+=line;kept++;
 }
 if(kept<pending.length)text+=C.WORDS.fold+(pending.length-kept)+'\n';return text+tail;
}
