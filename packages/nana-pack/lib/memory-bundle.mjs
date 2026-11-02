/**
 * @module packages/nana-pack/lib/memory-bundle.mjs
 * @purpose Select and render whole ranked profile and project memory lines without store effects.
 * @inputs Effective states, repository, optional evidence-day cut and record-line budget.
 * @outputs Bundle text, lines, character count and delivered/omitted id prefixes.
 * @effects none
 * @errors Invalid record shapes may throw to the caller's store-error fallback.
 */
import { PROFILE_WORDS } from './profile-config.mjs';
import { PUSH_BUDGET, PUSH_PART_ORDER, PUSH_SOURCE_ORDER, PUSH_KIND_ORDER, PUSH_ID_CHARS, PUSH_WORDS } from './memory-bundle-config.mjs';
export const memoryRecordLine = r => `- [${r.trust} ${r.date} ${r.kind}] ${r.claim.replace(/\s+/gu,' ').trim()} (${r.id.slice(0,PUSH_ID_CHARS)})\n`;
const rank=(list,value)=>{const i=list.indexOf(value);return i<0?list.length:i;};
export function makeMemoryBundle(states,{repository,asOf=new Date().toISOString(),budget=PUSH_BUDGET}={}) {
 const day=String(asOf).slice(0,10);
 const part=r=>r.repository===undefined&&r.source==='saved'?'profile':repository!==undefined&&r.repository===repository?'project':null;
 const records=states.filter(r=>r.live&&part(r)&&r.date<=day&&(!r.invalidAt||String(r.invalidAt).slice(0,10)>day)).sort((a,b)=>
  rank(PUSH_PART_ORDER,part(a))-rank(PUSH_PART_ORDER,part(b))||
  PROFILE_WORDS.trust.indexOf(b.trust)-PROFILE_WORDS.trust.indexOf(a.trust)||
  rank(PUSH_SOURCE_ORDER,a.source)-rank(PUSH_SOURCE_ORDER,b.source)||
  rank(PUSH_KIND_ORDER,a.kind)-rank(PUSH_KIND_ORDER,b.kind)||
  b.date.localeCompare(a.date)||String(b.stamp??'').localeCompare(String(a.stamp??''))||a.id.localeCompare(b.id));
 let lines='';const kept=[],left=[];
 // Whole leading lines within each part, as show does. The project part may use a
 // remainder too small for the next profile line, but never precedes a kept profile.
 for(const name of PUSH_PART_ORDER) {
  let full=false;
  for(const record of records.filter(r=>part(r)===name)) {
   const line=memoryRecordLine(record);
   if(full||lines.length+line.length>budget){left.push(record);full=true;}else{lines+=line;kept.push(record);}
  }
 }
 const header=`[nana:memory] push ${kept.length} of ${records.length} records, ${lines.length} of ${PUSH_BUDGET} chars; ${PUSH_WORDS.privacy}\n`;
 const fold=left.length?`[nana:memory] left out ${left.filter(r=>part(r)==='profile').length} profile, ${left.filter(r=>part(r)==='project').length} project\n`:'';
 return {text:header+lines+fold,lines,chars:lines.length,delivered:kept.map(r=>r.id.slice(0,PUSH_ID_CHARS)),omitted:left.map(r=>r.id.slice(0,PUSH_ID_CHARS))};
}
