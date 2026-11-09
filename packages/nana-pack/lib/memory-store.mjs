/**
 * @module packages/nana-pack/lib/memory-store.mjs
 * @purpose Preserve profile saves and events over existing profile and project records.
 * @inputs Private clone path, saved claims, existing records and injected clock/random source.
 * @outputs Live states and exclusive profile records or area-local events.
 * @effects disk
 * @errors Filesystem failures propagate to the profile command boundary.
 */
import fs from 'node:fs';
import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { claimId, readProfileStore, effectiveState, exclusiveJson, writeProfileRecord, profileStamp } from './profile-store.mjs';
import { STORE_LAYOUT as L, FOLDER_ID_LENGTH } from './memory-run-config.mjs';

export function writeMemoryFile(dir,repository,folder,id,value,{now=()=>new Date(),random=randomBytes}={}) {
 return exclusiveJson(dir,`${L.projects}/${repository.slice(0,FOLDER_ID_LENGTH)}/${folder}`,id,value,profileStamp(now()),random);
}
/** Existing project areas use the same record/event reader as the root profile. */
export function readMemoryStore(dir,{onUnparseable=()=>{}}={}) {
 const areas=[readProfileStore(dir)],base=path.join(dir,L.projects);
 if(fs.existsSync(base)) for(const name of fs.readdirSync(base)) if(fs.statSync(path.join(base,name)).isDirectory()) areas.push(readProfileStore(path.join(base,name),{onUnparseable}));
 return effectiveState(areas.flatMap(a=>a.recordFiles),areas.flatMap(a=>a.events));
}
/** Caller holds the clone lock; a saved profile claim supersedes matching extracted records. */
export function mergeMemory(dir,input,{now=()=>new Date(),random=randomBytes,env=process.env}={}) {
 const normalized=claimId(input.claim);
 const matches=readMemoryStore(dir).filter(r=>r.live&&claimId(r.claim)===normalized&&r.source==='extracted');
 const record=writeProfileRecord(dir,input,{env,now,random});
 for(const previous of matches) {
  const event={id:previous.id,action:'supersede',target:record.id,quote:record.quote,stamp:profileStamp(now())};
  writeMemoryFile(dir,previous.repository,L.events,previous.id,event,{now,random});
 }
 return record;
}
