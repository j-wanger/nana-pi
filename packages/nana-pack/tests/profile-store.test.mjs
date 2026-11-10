/**
 * @module packages/nana-pack/tests/profile-store.test.mjs
 * @purpose Pin quoted saves and sealed values; privacy guards live in profile-store-guards.test.mjs.
 * @inputs Synthetic temp homes, local remotes and stubbed gh.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Failed assertions set exit 1.
 */
import * as fs from 'node:fs';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { check, fixture, ok, refused, files, save, root } from './profile-fixture.mjs';
import { parseJsonBytes } from '../lib/json-text.mjs';
import { CANDIDATE_FIELDS, SOURCE_WORDS, USER_KIND_WORDS, ROLES, STARTING_STATE } from '../lib/profile-config.mjs';
const [, decision, preference, fact] = USER_KIND_WORDS;
const config = () => import('../lib/profile-config.mjs');
const store = () => import('../lib/profile-store.mjs');
const init = f => ok(f.run(['init','--dir',f.dir,'--save']));

// req: R-3230
await check('a save writes one shape record into the private clone and nowhere else', async()=>{
 const C=await config(); const S=await store(); const t=fixture();
 try {
  const f=t.clone('a'); init(f); const before=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout;
  const claim='Prefer cool colours.\r\nKeep borders quiet. \t'; const quote='Please keep blue.\r\nNo loud borders. \t';
  const out=ok(save(f,claim,quote)); const list=files(f.dir); assert.equal(list.length,1);
  const r=parseJsonBytes(fs.readFileSync(list[0])); const date=new Date().toISOString().slice(0,10);
  const expected={id:S.claimId(claim),type:C.PROFILE_WORDS.type,kind:preference,claim,quote,context:'',evidence:`${C.PROFILE_WORDS.evidencePrefix}:${C.PROFILE_WORDS.runtimeClaude}:session-1:${date}`,date,trust:STARTING_STATE.trust,source:SOURCE_WORDS[1],roles:ROLES.user,validFrom:date,invalidAt:null,supersedes:[]};
  assert.deepEqual(Object.keys(r),CANDIDATE_FIELDS); assert.deepEqual(r,expected); assert.equal(out.includes(`${C.PROFILE_WORDS.saved}${claim} (${r.id})`),true);
  assert.equal(t.git(f.dir,'status','--porcelain'),''); assert.equal(t.git(f.dir,'ls-files','records').split('\n').filter(p=>p.endsWith('.json')).length,1);
  assert.equal(spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout,before);
  const count=()=>files(f.dir).length;
  for(const [args,line] of [
   [['save','--kind',preference,'--claim','x'],C.PROFILE_WORDS.quote],
   [['save','--kind',decision,'--claim','x','--quote','y'],C.PROFILE_WORDS.decision],
   [['save','--kind','open-thread','--claim','x','--quote','y'],C.PROFILE_WORDS.openThread],
   [['save','--kind',fact,'--claim','x'.repeat(C.PROFILE_LIMITS.claim+1),'--quote','y'],C.PROFILE_WORDS.claimCap],
   [['save','--kind',fact,'--claim','x','--quote','y'.repeat(C.PROFILE_LIMITS.quote+1)],C.PROFILE_WORDS.quoteCap]]) {
    const n=count(); const head=t.git(f.dir,'rev-parse','HEAD'); refused(f.run(args),line); assert.equal(count(),n); assert.equal(t.git(f.dir,'rev-parse','HEAD'),head);
  }
  for(let i=1;i<C.PROFILE_LIMITS.daily;i++) ok(save(f,`Daily synthetic claim ${i}`));
  refused(save(f,'Over limit'),C.PROFILE_WORDS.dailyCap); assert.equal(count(),C.PROFILE_LIMITS.daily);
 } finally {t.close();}
});

// req: R-3240
await check('seal: PROFILE_LOCK_WAIT_MS covers 28 Git steps',async()=>{
 const C=await config(); assert.equal(C.PROFILE_LOCKED_GIT_STEPS,28); assert.equal(C.PROFILE_LOCK_WAIT_MS,420000);
 assert.ok(C.PROFILE_LOCK_WAIT_MS>=C.PROFILE_GIT_TIMEOUT_MS*C.PROFILE_LOCKED_GIT_STEPS);
});
// req: R-3247
await check('seal: PROFILE_REMOTE_FORMS',async()=>assert.deepEqual((await config()).PROFILE_REMOTE_FORMS,['^https://github\\.com/([^/]+/[^/]+?)(?:\\.git)?$','^git@github\\.com:([^/]+/[^/]+?)(?:\\.git)?$','^ssh://git@(?:github\\.com|ssh\\.github\\.com:443)/([^/]+/[^/]+?)(?:\\.git)?$']));
