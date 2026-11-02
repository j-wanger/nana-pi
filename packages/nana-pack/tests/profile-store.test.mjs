/**
 * @module packages/nana-pack/tests/profile-store.test.mjs
 * @purpose Pin quoted saves and the sealed values; the guards, trust, effective-liveness and pointer checks live in profile-store-guards.test.mjs.
 * @inputs Synthetic temp homes, local remotes and stubbed gh.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Failed assertions set exit 1.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { check, fixture, ok, refused, files, save, root } from './profile-fixture.mjs';
import { parseJsonBytes } from '../lib/json-text.mjs';
import { CANDIDATE_FIELDS, SOURCE_WORDS, USER_KIND_WORDS, ROLES, STARTING_STATE } from '../lib/memory-making-config.mjs';
import { resolveEvidence } from '../lib/memory-making.mjs';
const [, decision, preference, fact] = USER_KIND_WORDS;
const config = () => import('../lib/profile-config.mjs');
const store = () => import('../lib/profile-store.mjs');
const init = f => ok(f.run(['init','--dir',f.dir,'--save']));

// req: R-3230 R-3454
await check('a save writes one shape record into the private clone and nowhere else', async()=>{
 const C=await config(); const S=await store(); const t=fixture();
 try {
  const f=t.clone('a'); init(f); const before=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout;
  const claim='Prefer cool colours.\r\nKeep borders quiet. \t'; const quote='Please keep blue.\r\nNo loud borders. \t';
  const out=ok(save(f,claim,quote)); const list=files(f.dir); assert.equal(list.length,1);
  const r=parseJsonBytes(fs.readFileSync(list[0])); const date=new Date().toISOString().slice(0,10);
  const expected={id:S.claimId(claim),type:C.PROFILE_WORDS.type,kind:preference,claim,quote,context:'',evidence:`${C.PROFILE_WORDS.evidencePrefix}:${C.PROFILE_WORDS.runtimeClaude}:session-1:${date}`,date,trust:STARTING_STATE.trust,source:SOURCE_WORDS[1],roles:ROLES.user,validFrom:date,invalidAt:null,supersedes:[]};
  assert.deepEqual(await resolveEvidence(r.evidence,{},r),{status:'resolved',texts:[quote]});
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
  const guide=fs.readFileSync(path.join(root,'packages/nana-setup/claude/rules/nana-seat.md'),'utf8'); assert.match(guide,/confirm only on an explicit owner yes/); assert.match(guide,/both the private profile and today's shared memory/); assert.match(guide,/Saved:/);
 } finally {t.close();}
});

// req: R-3237
await check('seal: PROFILE_MEDIUM_SESSIONS is 3',async()=>assert.equal((await config()).PROFILE_MEDIUM_SESSIONS,3));
// req: R-3238
await check('seal: PROFILE_SHOW_BUDGET is 4000',async()=>assert.equal((await config()).PROFILE_SHOW_BUDGET,4000));
// req: R-3239
await check('seal: PROFILE_GIT_TIMEOUT_MS is 15000',async()=>assert.equal((await config()).PROFILE_GIT_TIMEOUT_MS,15000));
// req: R-3240
await check('seal: PROFILE_LOCK_WAIT_MS covers 28 Git steps',async()=>{
 const C=await config(); assert.equal(C.PROFILE_LOCKED_GIT_STEPS,28); assert.equal(C.PROFILE_LOCK_WAIT_MS,420000);
 assert.ok(C.PROFILE_LOCK_WAIT_MS>=C.PROFILE_GIT_TIMEOUT_MS*C.PROFILE_LOCKED_GIT_STEPS);
});
// req: R-3241
await check('seal: PROFILE_LOCK_STALE_MS is 120000',async()=>assert.equal((await config()).PROFILE_LOCK_STALE_MS,120000));
// req: R-3242
await check('seal: PROFILE_PUSH_RETRIES is 1',async()=>assert.equal((await config()).PROFILE_PUSH_RETRIES,1));
// req: R-3243
await check('seal: PROFILE_LIMITS',async()=>assert.deepEqual((await config()).PROFILE_LIMITS,{daily:40,claim:1200,quote:4000}));
// req: R-3244
await check('seal: PROFILE_SESSION_VARIABLES',async()=>assert.deepEqual((await config()).PROFILE_SESSION_VARIABLES,['CLAUDE_SESSION_ID','PI_SESSION_ID','PI_SESSION_FILE']));
// req: R-3245
await check('seal: PROFILE_STAMP_FORMAT',async()=>assert.equal((await config()).PROFILE_STAMP_FORMAT,'toLowerCase'));
// req: R-3246
await check('seal: PROFILE_PATH_POLICY',async()=>assert.deepEqual((await config()).PROFILE_PATH_POLICY,{pattern:'^[a-z0-9._/-]+$',max:180,outputBytes:1048576,randomBytes:12}));
// req: R-3247
await check('seal: PROFILE_REMOTE_FORMS',async()=>assert.deepEqual((await config()).PROFILE_REMOTE_FORMS,['^https://github\\.com/([^/]+/[^/]+?)(?:\\.git)?$','^git@github\\.com:([^/]+/[^/]+?)(?:\\.git)?$','^ssh://git@(?:github\\.com|ssh\\.github\\.com:443)/([^/]+/[^/]+?)(?:\\.git)?$']));
// req: R-3248
await check('seal: PROFILE_LAYOUT',async()=>assert.deepEqual((await config()).PROFILE_LAYOUT,{records:'records',events:'events',marker:'.nana-profile',lock:'nana-profile.lock',counter:'nana-profile-day.json',attributes:'* -text\n',readme:'Private owner profile. Records are append-only JSON; use nana-profile, never edit records by hand.\n'}));
// req: R-3249
await check('seal: PROFILE_WORDS',async()=>assert.deepEqual((await config()).PROFILE_WORDS,{
 initialized:'profile: initialized',synced:'profile: synced',saved:'Saved: ',notPushed:'not pushed: ',unverified:'profile: unverified remote',recovered:'profile: aborted stopped rebase',fold:'[nana:owner-profile] records left out: ',conflict:'[nana:owner-profile] competing superseders: ',
 quote:'profile refused: --quote is required',decision:'profile refused: decision belongs in nana-rulings.md',openThread:'profile refused: open-thread belongs in GitHub issues',kind:'profile refused: unsupported kind',claimCap:'profile refused: claim exceeds cap',quoteCap:'profile refused: quote exceeds cap',dailyCap:'profile refused: daily save cap',role:'profile refused: NANA_ROLE is set',worktree:'profile refused: linked worktree',disabled:'profile refused: saving is not enabled on this machine',pointer:'profile refused: run init --dir <clone>',private:'profile refused: push target is not verified private; use --unverified-remote explicitly',checkout:'profile refused: nana-pi checkout or push target',marker:'profile refused: missing store marker',repeatedQuote:'profile refused: confirmation needs new owner words',unknown:'profile refused: unknown record',locked:'profile refused: locked',dirty:'profile refused: clone has changes outside the store',git:'profile refused: git failed',config:'profile refused: invalid user configuration',usage:'profile refused: invalid command or flags',
 gitCommandEnv:'NANA_PROFILE_GIT_COMMAND',source:SOURCE_WORDS[1],type:'user',roles:ROLES.user,trust:[STARTING_STATE.trust,'medium','high'],kinds:USER_KIND_WORDS,reasons:['offline','auth','rejected','mismatch','locked'],evidencePrefix:'seat',runtimePi:'pi',runtimeClaude:'claude-code'
}));
