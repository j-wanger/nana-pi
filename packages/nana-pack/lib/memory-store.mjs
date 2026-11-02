/**
 * @module packages/nana-pack/lib/memory-store.mjs
 * @purpose Merge saved and extracted claims into one immutable private store and retain narrow evidence.
 * @inputs Private clone path, repository root id, candidates and injected clock/random source.
 * @outputs Live states, exclusive records/events/seen/evidence/run files and repository collision refusals.
 * @effects disk
 * @errors Filesystem failures and fixed collision refusal.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { claimId, readProfileStore, readProfileJson, effectiveState, exclusiveJson, exclusiveJsonAt, writeProfileRecord, profileStamp } from './profile-store.mjs';
import { gitText } from './profile-sync.mjs';
import { STORE_LAYOUT as L, STORE_FIELDS, FOLDER_ID_LENGTH, WORDS as W } from './memory-run-config.mjs';
/** Shared root-commit selection, moved from nana-memory; making opt-in wins among roots. */
export function resolveMemoryRepository(repoRoot,{runGit,enabled=[]}) {
 const roots=gitText(runGit,repoRoot,['rev-list','--max-parents=0','HEAD']).split(/\r?\n/u).sort();
 if(!roots.length||roots.some(id=>! /^[0-9a-f]{40,64}$/u.test(id)))throw Error(W.unavailable);
 return roots.find(id=>enabled.includes(id))??roots[0];
}
export const unitKey=evidence=>evidence.split('+')[0];
export const repositoryFolder=id=>id.slice(0,FOLDER_ID_LENGTH);
export const projectStore=(dir,id)=>path.join(dir,L.projects,repositoryFolder(id));
export function ensureRepository(dir,id) {
 const base=projectStore(dir,id),file=path.join(base,L.repository);fs.mkdirSync(base,{recursive:true,mode:0o700});
 try {exclusiveJsonAt(file,{repository:id});}
 catch(e) {if(e.code!=='EEXIST') throw e;if(JSON.parse(fs.readFileSync(file,'utf8')).repository!==id) throw Error(W.collision);}
 return base;
}
export function writeMemoryFile(dir,repository,folder,id,value,{now=()=>new Date(),random=randomBytes}={}) {
 return exclusiveJson(dir,`${L.projects}/${repositoryFolder(repository)}/${folder}`,id,value,profileStamp(now()),random);
}
/** The existing profile reader handles the identical records/events layout in each area. */
export function readMemoryStore(dir,{onUnparseable=()=>{}}={}) {
 const areas=[readProfileStore(dir)],base=path.join(dir,L.projects);
 if(fs.existsSync(base)) for(const name of fs.readdirSync(base)) if(fs.statSync(path.join(base,name)).isDirectory()) areas.push(readProfileStore(path.join(base,name),{onUnparseable}));
 return effectiveState(areas.flatMap(a=>a.recordFiles),areas.flatMap(a=>a.events));
}
export function readMemoryFiles(dir,repository,folder,{onUnparseable=()=>{}}={}) {
 const base=path.join(projectStore(dir,repository),folder);if(!fs.existsSync(base)) return [];
 return fs.readdirSync(base).sort().flatMap(id=>fs.statSync(path.join(base,id)).isDirectory()?fs.readdirSync(path.join(base,id)).sort().filter(n=>n.endsWith('.json')).flatMap(n=>{
  const value=readProfileJson(path.join(base,id,n),{onUnparseable});return value===undefined?[]:[value];
 }):[]);
}
/** Count damaged project files across every area that a seat merge may encounter. */
export function countUnparseableMemoryFiles(dir) {
 let count=0;const onUnparseable=()=>count++;
 readMemoryStore(dir,{onUnparseable});const base=path.join(dir,L.projects);
 if(fs.existsSync(base))for(const repository of fs.readdirSync(base))if(fs.statSync(path.join(base,repository)).isDirectory())
  for(const folder of [L.seen,L.units,L.runs])readMemoryFiles(dir,repository,folder,{onUnparseable});
 return count;
}
/** Caller holds the clone lock. Saved words win; extracted repeats by claim or unit are NOOP. */
export function mergeMemory(dir,input,{saved=false,repository,now=()=>new Date(),random=randomBytes,env=process.env}={}) {
 const states=readMemoryStore(dir).filter(r=>r.live),normalized=claimId(input.claim);
 const matches=states.filter(r=>claimId(r.claim)===normalized);
 if(saved) {
  const record=writeProfileRecord(dir,input,{env,now,random});
  for(const previous of matches.filter(r=>r.source==='extracted')) {
   const event={id:previous.id,action:'supersede',target:record.id,quote:record.quote,stamp:profileStamp(now())};
   writeMemoryFile(dir,previous.repository,L.events,previous.id,event,{now,random});
  }
  return record;
 }
 if(matches.length||states.some(r=>r.source==='extracted'&&r.repository===repository&&unitKey(r.evidence)===unitKey(input.evidence))) return null;
 ensureRepository(dir,repository);
 const values={...input,subject:W.project,scope:W.scope,repository};
 const record=Object.fromEntries(STORE_FIELDS.map(field=>[field,values[field]]));
 writeMemoryFile(dir,repository,L.records,record.id,record,{now,random});return record;
}
export function copiedEvidence(dir,pointer) {
 const base=path.join(dir,L.projects);if(!fs.existsSync(base)) return null;
 for(const folder of fs.readdirSync(base)) {
  const file=path.join(base,folder,L.repository);if(!fs.existsSync(file)) continue;
  const {repository}=JSON.parse(fs.readFileSync(file,'utf8'));
  for(const copy of readMemoryFiles(dir,repository,L.units)) if(copy[pointer]) return {status:'resolved',texts:copy[pointer]};
 }
 return null;
}
