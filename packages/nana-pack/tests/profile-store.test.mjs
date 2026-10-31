/**
 * @module packages/nana-pack/tests/profile-store.test.mjs
 * @purpose Pin quoted saves, seat guards, trust, effective liveness, private initialization and sealed values.
 * @inputs Synthetic temp homes, local remotes and stubbed gh.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Failed assertions set exit 1.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { check, fixture, ok, refused, files, records, save, root } from './profile-fixture.mjs';
import { parseJsonBytes } from '../lib/json-text.mjs';
const config = () => import('../lib/profile-config.mjs');
const store = () => import('../lib/profile-store.mjs');
const init = f => ok(f.run(['init','--dir',f.dir,'--save']));

// req: R-3230
await check('a save writes one shape record into the private clone and nowhere else', async()=>{
 const C=await config(); const { CANDIDATE_FIELDS }=await import('../lib/memory-making-config.mjs'); const S=await store(); const t=fixture();
 try {
  const f=t.clone('a'); init(f); const before=spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout;
  const claim='Prefer cool colours.\r\nKeep borders quiet. \t'; const quote='Please keep blue.\r\nNo loud borders. \t';
  const out=ok(save(f,claim,quote)); const list=files(f.dir); assert.equal(list.length,1);
  const r=parseJsonBytes(fs.readFileSync(list[0])); const date=new Date().toISOString().slice(0,10);
  const expected={id:S.claimId(claim),type:'user',kind:'preference',claim,quote,context:'',evidence:`seat:claude-code:session-1:${date}`,date,trust:'low',source:'saved',roles:['seat'],validFrom:date,invalidAt:null,supersedes:[]};
  assert.deepEqual(Object.keys(r),CANDIDATE_FIELDS); assert.deepEqual(r,expected); assert.equal(out.includes(`${C.PROFILE_WORDS.saved}${claim} (${r.id})`),true);
  assert.equal(t.git(f.dir,'status','--porcelain'),''); assert.equal(t.git(f.dir,'ls-files','records').split('\n').filter(p=>p.endsWith('.json')).length,1);
  assert.equal(spawnSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).stdout,before);
  const count=()=>files(f.dir).length;
  for(const [args,line] of [
   [['save','--kind','preference','--claim','x'],C.PROFILE_WORDS.quote],
   [['save','--kind','decision','--claim','x','--quote','y'],C.PROFILE_WORDS.decision],
   [['save','--kind','open-thread','--claim','x','--quote','y'],C.PROFILE_WORDS.openThread],
   [['save','--kind','fact','--claim','x'.repeat(C.PROFILE_LIMITS.claim+1),'--quote','y'],C.PROFILE_WORDS.claimCap],
   [['save','--kind','fact','--claim','x','--quote','y'.repeat(C.PROFILE_LIMITS.quote+1)],C.PROFILE_WORDS.quoteCap]]) {
    const n=count(); const head=t.git(f.dir,'rev-parse','HEAD'); refused(f.run(args),line); assert.equal(count(),n); assert.equal(t.git(f.dir,'rev-parse','HEAD'),head);
  }
  for(let i=1;i<C.PROFILE_LIMITS.daily;i++) ok(save(f,`Daily synthetic claim ${i}`));
  refused(save(f,'Over limit'),C.PROFILE_WORDS.dailyCap); assert.equal(count(),C.PROFILE_LIMITS.daily);
  const guide=fs.readFileSync(path.join(root,'packages/nana-setup/claude/rules/nana-seat.md'),'utf8'); assert.match(guide,/confirm only on an explicit owner yes/); assert.match(guide,/both the private profile and today's shared memory/); assert.match(guide,/Saved:/);
 } finally {t.close();}
});

// req: R-3231
await check('only a seat on an enabled machine may write',async()=>{
 const C=await config(); const t=fixture();
 try {
  const f=t.clone('a'); init(f); ok(save(f,'Seed')); const id=records(f.dir)[0].id;
  const commands=[['save','--kind','fact','--claim','Other','--quote','New words'],['confirm',id,'--quote','Yes explicitly'],['retract',id,'--quote','Drop it'],['supersede',id,'--kind','fact','--claim','Replacement','--quote','Replace it']];
  const pointer=path.join(f.agent,'nana-pack.json'); const enabled=fs.readFileSync(pointer); const raw=JSON.parse(enabled);
  const wt=path.join(t.temp,'linked'); t.git(t.main,'worktree','add','-b','linked',wt);
  for(const args of commands) {
   const head=t.git(f.dir,'rev-parse','HEAD'); const n=files(f.dir).length+files(f.dir,'events').length;
   refused(f.run(args,{NANA_ROLE:'builder'}),C.PROFILE_WORDS.role);
   refused(f.run(args,{},wt),C.PROFILE_WORDS.worktree);
   for(const value of [false,undefined]) { const p=structuredClone(raw); p.ownerProfile.save=value; fs.writeFileSync(pointer,JSON.stringify(p)); refused(f.run(args),C.PROFILE_WORDS.disabled); }
   fs.writeFileSync(pointer,'{}'); refused(f.run(args),C.PROFILE_WORDS.pointer); fs.rmSync(pointer); refused(f.run(args),C.PROFILE_WORDS.pointer); fs.writeFileSync(pointer,enabled);
   assert.equal(t.git(f.dir,'rev-parse','HEAD'),head); assert.equal(files(f.dir).length+files(f.dir,'events').length,n);
  }
  ok(save(f,'Allowed from main'));
 } finally {t.close();}
});

// req: R-3232
await check('trust rises only on the owner words across sessions',async()=>{
 const C=await config(); const S=await store(); const t=fixture();
 try {
  const f=t.clone('a'); init(f); const claim='Prefer headings'; ok(save(f,claim,'One'));
  for(let i=0;i<3;i++) ok(save(f,claim,`Same session ${i}`));
  const state=()=>S.effectiveState(records(f.dir),files(f.dir,'events').map(x=>parseJsonBytes(fs.readFileSync(x))));
  assert.equal(state()[0].trust,'low');
  for(let i=0;i<C.PROFILE_MEDIUM_SESSIONS;i++) ok(save(f,claim,'One',{CLAUDE_SESSION_ID:`echo-${i}`}));
  assert.equal(state()[0].trust,'low');
  for(let i=1;i<C.PROFILE_MEDIUM_SESSIONS;i++) ok(save(f,claim,`Fresh words ${i}`,{CLAUDE_SESSION_ID:`fresh-${i}`}));
  assert.equal(state()[0].trust,'medium'); assert.equal(new Set(records(f.dir).map(r=>r.id)).size,1);
  const id=state()[0].id; refused(f.run(['confirm',id]),C.PROFILE_WORDS.quote); refused(f.run(['confirm',id,'--quote','One']),C.PROFILE_WORDS.repeatedQuote);
  ok(f.run(['confirm',id,'--quote','Yes, that is my preference.'])); assert.equal(state()[0].trust,'high');
 } finally {t.close();}
});

// req: R-3233
await check('retract and supersede hide the right records',async()=>{
 const C=await config(); const S=await store(); const t=fixture();
 try {
  const a=t.clone('a'); init(a); ok(save(a,'Old palette')); let id=records(a.dir)[0].id;
  ok(a.run(['confirm',id,'--quote','Yes keep it'])); refused(a.run(['supersede',id,'--claim','New palette','--kind','preference']),C.PROFILE_WORDS.quote);
  ok(a.run(['supersede',id,'--claim','New palette','--kind','preference','--quote','Now use green'])); let shown=ok(a.run(['show'])); assert.match(shown,/New palette/); assert.equal(shown.includes('Old palette'),false);
  const newer=records(a.dir).find(r=>r.claim==='New palette').id; ok(a.run(['retract',newer,'--quote','Forget green'])); assert.equal(ok(a.run(['show'])).includes('New palette'),false); assert.match(ok(a.run(['show'])),/Old palette/);
  // A real two-clone offline cycle, followed by two concurrent replacements.
  ok(save(a,'Cycle one','First cycle words')); ok(save(a,'Cycle two','Second cycle words'));
  const cycleOne=S.claimId('Cycle one'),cycleTwo=S.claimId('Cycle two');
  const b=t.clone('b'); init(b); ok(a.run(['supersede',cycleTwo,'--claim','Cycle one','--kind','preference','--quote','One again']));
  ok(b.run(['supersede',cycleOne,'--claim','Cycle two','--kind','preference','--quote','Two again']));
  ok(a.run(['sync'])); ok(b.run(['sync'])); ok(a.run(['sync']));
  const live=S.effectiveState(records(a.dir),files(a.dir,'events').map(x=>parseJsonBytes(fs.readFileSync(x)))).filter(r=>r.live&&[cycleOne,cycleTwo].includes(r.id)); assert.equal(live.length,1); assert.equal(live[0].id,cycleTwo);
  ok(a.run(['supersede',cycleTwo,'--claim','Alternative one','--kind','fact','--quote','First alternative']));
  ok(b.run(['supersede',cycleTwo,'--claim','Alternative two','--kind','fact','--quote','Second alternative'])); ok(a.run(['sync'])); ok(b.run(['sync'])); ok(a.run(['sync']));
  shown=ok(a.run(['show'])); assert.match(shown,/Alternative one/); assert.match(shown,/Alternative two/); assert.ok(shown.includes(C.PROFILE_WORDS.conflict));
  const base=(claim,date,session,quote)=>({id:S.claimId(claim),claim,quote,date,evidence:`seat:pi:${session}:${date}`,supersedes:[]});
  const rs=[base('High','2026-10-01','h','h'),...Array.from({length:C.PROFILE_MEDIUM_SESSIONS},(_,i)=>base('Medium','2026-10-02',String(i),`q${i}`)),base('Low','2026-10-03','l','l')];
  const ev=[{id:S.claimId('High'),action:'confirm',quote:'yes',stamp:'20261004t000000000z'}]; const view=S.show(S.effectiveState(rs,ev)); assert.ok(view.indexOf('[high 2026-10-01]')<view.indexOf('[medium 2026-10-02]')); assert.ok(view.indexOf('[medium 2026-10-02]')<view.indexOf('[low 2026-10-03]'));
  const many=Array.from({length:100},(_,i)=>({...base(`Long ${i} ${'x'.repeat(300)}`,'2026-10-01',String(i),'q'),trust:'low',live:true})); const bounded=S.show(many); assert.ok(bounded.length<=C.PROFILE_SHOW_BUDGET); assert.ok(bounded.includes(C.PROFILE_WORDS.fold));
 } finally {t.close();}
});

// req: R-3234
await check('the pointer is configuration and the push target stays verified private',async()=>{
 const C=await config(); const t=fixture();
 try {
  const a=t.clone('a'); const p=path.join(a.agent,'nana-pack.json'); const original={roster:{sentinel:['unchanged']},objective:{enabled:false}};
  fs.writeFileSync(p,JSON.stringify(original)); init(a); const raw=JSON.parse(fs.readFileSync(p)); assert.deepEqual(raw.roster,original.roster); assert.deepEqual(raw.objective,original.objective); assert.deepEqual(JSON.parse(fs.readFileSync(`${p}.bak`)),original); assert.equal(raw.ownerProfile.dir,a.dir); assert.equal(raw.ownerProfile.verifiedPushUrl,a.remote); assert.equal(raw.ownerProfile.save,true);
  assert.ok(fs.existsSync(path.join(a.dir,C.PROFILE_LAYOUT.marker))); assert.equal(fs.readFileSync(path.join(a.dir,'.gitattributes'),'utf8'),C.PROFILE_LAYOUT.attributes); const head=t.git(a.dir,'rev-parse','HEAD'); init(a); assert.equal(t.git(a.dir,'rev-parse','HEAD'),head);
  const b=t.clone('b'); ok(b.run(['init','--dir',b.dir])); assert.equal(JSON.parse(fs.readFileSync(path.join(b.agent,'nana-pack.json'))).ownerProfile.save,false);
  // Local bare URLs are deliberately unrecognised: the gh checks below use a separate push URL.
  const c=t.clone('c'); t.git(c.dir,'remote','set-url','--push','origin','https://github.com/example/other.git');
  for(const mode of ['public','failed']) refused(c.run(['init','--dir',c.dir],{PROFILE_TEST_GH:mode}),C.PROFILE_WORDS.private);
  const {GH_COMMAND_ENV}=await import('../lib/suite-records-config.mjs'); refused(c.run(['init','--dir',c.dir],{[GH_COMMAND_ENV]:JSON.stringify([path.join(t.temp,'missing-gh')])}),C.PROFILE_WORDS.private);
  t.git(c.dir,'remote','set-url','--push','origin','git@personal-alias:example/profile.git'); refused(c.run(['init','--dir',c.dir]),C.PROFILE_WORDS.private);
  refused(a.run(['init','--dir',root]),C.PROFILE_WORDS.checkout);
  const repoUrl=spawnSync('git',['remote','get-url','--push','origin'],{cwd:root,encoding:'utf8'}).stdout.trim(); t.git(c.dir,'remote','set-url','--push','origin',repoUrl); refused(c.run(['init','--dir',c.dir]),C.PROFILE_WORDS.checkout);
  c.env.PROFILE_TEST_RAW_URL='1'; t.git(c.dir,'remote','set-url','--push','origin',t.bare); ok(c.run(['init','--dir',c.dir,'--unverified-remote'])); assert.equal(JSON.parse(fs.readFileSync(path.join(c.agent,'nana-pack.json'))).ownerProfile.unverifiedRemote,true); assert.match(ok(c.run(['sync'])),new RegExp(C.PROFILE_WORDS.unverified));
  t.git(a.dir,'remote','set-url','--push','origin',path.join(t.temp,'changed.git')); assert.ok(ok(save(a,'Keep local on mismatch')).includes(`${C.PROFILE_WORDS.notPushed}mismatch`)); assert.notEqual(a.run(['sync']).status,0); assert.equal(t.git(a.dir,'status','--porcelain'),'');
 } finally {t.close();}
});

// req: R-3237
await check('seal: PROFILE_MEDIUM_SESSIONS is 3',async()=>assert.equal((await config()).PROFILE_MEDIUM_SESSIONS,3));
// req: R-3238
await check('seal: PROFILE_SHOW_BUDGET is 4000',async()=>assert.equal((await config()).PROFILE_SHOW_BUDGET,4000));
// req: R-3239
await check('seal: PROFILE_GIT_TIMEOUT_MS is 15000',async()=>assert.equal((await config()).PROFILE_GIT_TIMEOUT_MS,15000));
// req: R-3240
await check('seal: PROFILE_LOCK_WAIT_MS is 5000',async()=>assert.equal((await config()).PROFILE_LOCK_WAIT_MS,5000));
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
 gitCommandEnv:'NANA_PROFILE_GIT_COMMAND',source:'saved',type:'user',roles:['seat'],trust:['low','medium','high'],kinds:['preference','correction','fact','thinking'],reasons:['offline','auth','rejected','mismatch','locked'],evidencePrefix:'seat',runtimePi:'pi',runtimeClaude:'claude-code'
}));
