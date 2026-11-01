/**
 * @module packages/nana-pack/tests/profile-store-guards.test.mjs
 * @purpose Pin the seat guard, trust, retract and supersede, and pointer checks of the profile store.
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
import { USER_KIND_WORDS } from '../lib/memory-making-config.mjs';
const [, , preference, fact] = USER_KIND_WORDS;
const config = () => import('../lib/profile-config.mjs');
const store = () => import('../lib/profile-store.mjs');
const init = f => ok(f.run(['init','--dir',f.dir,'--save']));

// req: R-3231 R-3454
await check('only a seat on an enabled machine may write',async()=>{
 const C=await config(); const t=fixture();
 try {
  const f=t.clone('a'); init(f); ok(save(f,'Seed')); const id=records(f.dir)[0].id;
  const commands=[['save','--kind',fact,'--claim','Other','--quote','New words'],['confirm',id,'--quote','Yes explicitly'],['retract',id,'--quote','Drop it'],['supersede',id,'--kind',fact,'--claim','Replacement','--quote','Replace it']];
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
  // Git for Windows may print different long/short/case spellings for one git directory.
  // A junction supplies that honest alias on every host without writing this repository.
  const alias=path.join(t.temp,'git-directory-alias'); fs.symlinkSync(t.git(t.main,'rev-parse','--absolute-git-dir'),alias,'junction');
  try {
   const {runProfile}=await import('../bin/nana-profile.mjs'); const {profileGit}=await import('../lib/profile-sync.mjs'); const base=profileGit(f.env); const output=[];
   const runGit=(cwd,args)=>cwd===t.main&&args.join(' ')==='rev-parse --absolute-git-dir'?{status:0,stdout:`${alias}\n`}:base(cwd,args);
   const code=runProfile(['save','--kind',fact,'--claim','Alias main checkout','--quote','The same checkout is allowed'],{agentDir:f.agent,env:f.env,cwd:t.main,runGit,log:x=>output.push(x),error:x=>output.push(x)});
   assert.equal(code,0,output.join('\n'));
  } finally {fs.unlinkSync(alias);}
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
  ok(a.run(['confirm',id,'--quote','Yes keep it'])); refused(a.run(['supersede',id,'--claim','New palette','--kind',preference]),C.PROFILE_WORDS.quote);
  ok(a.run(['supersede',id,'--claim','New palette','--kind',preference,'--quote','Now use green'])); let shown=ok(a.run(['show'])); assert.match(shown,/New palette/); assert.equal(shown.includes('Old palette'),false);
  const newer=records(a.dir).find(r=>r.claim==='New palette').id; ok(a.run(['retract',newer,'--quote','Forget green'])); assert.equal(ok(a.run(['show'])).includes('New palette'),false); assert.match(ok(a.run(['show'])),/Old palette/);
  // A real two-clone offline cycle, followed by two concurrent replacements.
  ok(save(a,'Cycle one','First cycle words')); ok(save(a,'Cycle two','Second cycle words'));
  const cycleOne=S.claimId('Cycle one'),cycleTwo=S.claimId('Cycle two');
  const b=t.clone('b'); init(b); ok(a.run(['supersede',cycleTwo,'--claim','Cycle one','--kind',preference,'--quote','One again']));
  ok(b.run(['supersede',cycleOne,'--claim','Cycle two','--kind',preference,'--quote','Two again']));
  ok(a.run(['sync'])); ok(b.run(['sync'])); ok(a.run(['sync']));
  const live=S.effectiveState(records(a.dir),files(a.dir,'events').map(x=>parseJsonBytes(fs.readFileSync(x)))).filter(r=>r.live&&[cycleOne,cycleTwo].includes(r.id)); assert.equal(live.length,1); assert.equal(live[0].id,cycleTwo);
  ok(a.run(['supersede',cycleTwo,'--claim','Alternative one','--kind',fact,'--quote','First alternative']));
  ok(b.run(['supersede',cycleTwo,'--claim','Alternative two','--kind',fact,'--quote','Second alternative'])); ok(a.run(['sync'])); ok(b.run(['sync'])); ok(a.run(['sync']));
  shown=ok(a.run(['show'])); assert.match(shown,/Alternative one/); assert.match(shown,/Alternative two/); assert.ok(shown.includes(C.PROFILE_WORDS.conflict));
  const base=(claim,date,session,quote)=>({id:S.claimId(claim),claim,quote,date,evidence:`${C.PROFILE_WORDS.evidencePrefix}:${C.PROFILE_WORDS.runtimePi}:${session}:${date}`,supersedes:[]});
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
