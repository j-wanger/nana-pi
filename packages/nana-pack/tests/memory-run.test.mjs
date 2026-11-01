/**
 * @module packages/nana-pack/tests/memory-run.test.mjs
 * @purpose Pin the eight automatic-memory must-meets with synthetic, local-only fixtures.
 * @inputs Temporary homes and bare remotes, injected classifier, clock and spawner.
 * @outputs Awaited bounded PASS or FAIL cases.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { check } from './profile-fixture.mjs';
import { using, memoryFixture, now, entry, pair, ask, runner, allText } from './memory-run-fixture.mjs';
import * as C from '../lib/memory-run-config.mjs';
import { repositoryFolder, readMemoryStore } from '../lib/memory-store.mjs';
import { resolveEvidence } from '../lib/memory-making.mjs';
import { startMemory } from '../lib/memory-run.mjs';
import { runLand } from '../bin/nana-land.mjs';
import { withReviewLedgerLock } from '../bin/review-round.mjs';
import { repo, commit, git, gitRunner, reviewTip } from './land-fixtures.mjs';
import { landRecordsPath } from '../lib/land-records.mjs';

const runPath=f=>path.join(f.a.dir,'.git',C.RUN_LAYOUT.runLock.replace('<id>',git(f.main,'rev-list','--max-parents=0','HEAD').slice(0,C.FOLDER_ID_LENGTH)));
const enabled=async f=>{const result=await f.command(['enable']);assert.equal(result.code,0,result.output);};
// req: R-3290
await check('R-3290: each owner and ask unit is made once',()=>using(async f=>{
 await enabled(f);let entries=[...pair('one'),...pair('two'),...ask()];const file=f.transcript(entries);const calls=[];
 const make=()=>f.command(['make','--session',file],{runModel:runner(calls)});
 assert.equal((await make()).code,0);assert.equal(f.states().length,3);assert.equal(calls.flat().length,2);
 await make();assert.equal(calls.length,1);assert.equal(f.states().length,3);
 entries.push(...pair('three'),...pair('four'));f.transcript(entries);await make();assert.deepEqual(calls.at(-1).map(u=>u.owner),['Synthetic claim three.','Synthetic claim four.']);
 f.transcript(entries,'fork');await make();assert.equal(calls.length,2);assert.equal(f.states().length,5);
}));
// req: R-3291
await check('R-3291: pending units survive busy caps failures and stale locks',()=>using(async f=>{
 await enabled(f);const file=f.transcript(pair('a'));const lock=runPath(f);fs.mkdirSync(path.dirname(lock),{recursive:true});
 fs.writeFileSync(lock,JSON.stringify({pid:process.pid,host:'synthetic',createdAt:now().getTime()}));
 assert.match((await f.command(['make','--session',file])).output,/busy/);fs.rmSync(lock);
 let calls=0;const fail=async()=>{calls++;return {ok:false,usage:{tokens:10,cost:0}};};
 await f.command(['make','--session',file],{caps:{tokens:0},runModel:fail});assert.equal(calls,0);
 await f.command(['make','--session',file],{runModel:fail});assert.equal(calls,1);assert.equal(f.states().length,0);
 let status=await f.command(['status']);assert.match(status.output,/failed/);assert.match(status.output,/pending 1/);
 const second=f.transcript(pair('b'),'b');const sent=[];await f.command(['make','--session',second],{runModel:runner(sent)});assert.equal(sent.flat().length,2);
 f.transcript(pair('malformed'),'m');await f.command(['make'],{runModel:async()=>({ok:true,text:'not json',usage:{tokens:10,cost:0.01}})});
 calls=0;await f.command(['make'],{runModel:fail});assert.equal(calls,0);
 for(const owner of [{pid:2147483647,createdAt:now().getTime()},{pid:process.pid,createdAt:now().getTime()-C.MAX_RUN_MS-1}]) {
  fs.writeFileSync(lock,JSON.stringify({...owner,host:'synthetic'}));f.transcript(pair(`stale-${owner.pid}`),'stale');const sent=[];
  await f.command(['make','--lane','demo'],{runModel:runner(sent)});assert.equal(sent.flat().length,1);assert.equal(fs.existsSync(lock),false);
 }
 status=await f.command(['status']);assert.match(status.output,/pending 0/);
 // A later, different land also drains review units left by an earlier capped land.
 f.review('deferred-a-2026-11-01','Deferred synthetic review');f.review('later-b-2026-11-01','Later synthetic review');f.git(f.main,'add','.');f.git(f.main,'commit','-m','synthetic landed reviews');
 await f.command(['make','--lane','deferred-a'],{caps:{tokens:0}});
 const reviewCalls=[];await f.command(['make','--lane','later-b'],{runModel:runner(reviewCalls)});
 assert.deepEqual(reviewCalls.flat().map(u=>u.title),['Later synthetic review','Deferred synthetic review']);
}));
// req: R-3292
await check('R-3292: known and unknown usage obey run and shared day caps',()=>using(async f=>{
 await enabled(f);f.transcript(Array.from({length:35},(_,i)=>pair(`u${i}`)).flat());
 const calls=[];await f.command(['make'],{runModel:runner(calls,{usage:null})});assert.equal(calls.length,2);assert.match((await f.command(['status'])).output,/pending 15/);
 const ledger=path.join(f.a.dir,'.git',C.RUN_LAYOUT.dayLedger);let day=JSON.parse(fs.readFileSync(ledger));assert.equal(day.tokens,C.UNKNOWN_USAGE_CHARGE*2);
 const known=[];await f.command(['make'],{caps:{calls:1},runModel:runner(known)});assert.equal(known.length,1);
 fs.writeFileSync(ledger,JSON.stringify({date:now().toISOString().slice(0,10),tokens:C.DAY_TOKEN_CAP}));const full=[];await f.command(['make'],{runModel:runner(full)});assert.equal(full.length,0);
 // Different repositories share the clone's reservation ledger while a call is in flight.
 const other=repo(f.temp,'other');await f.command(['enable','--repo',other]);f.transcript(Array.from({length:20},(_,i)=>pair(`v${i}`)).flat(),'other',other);
 fs.writeFileSync(ledger,JSON.stringify({date:now().toISOString().slice(0,10),tokens:C.DAY_TOKEN_CAP-C.UNKNOWN_USAGE_CHARGE}));
 let release,entered;const started=new Promise(r=>entered=r);const waiting=new Promise(r=>release=r);let total=0;
 const slow=async input=>{total++;entered();await waiting;return runner([],{usage:null})(input);};
 const first=f.command(['make'],{runModel:slow});await started;
 await f.command(['make','--repo',other],{runModel:async()=>{total++;return {ok:false};}});release();await first;
 assert.equal(total,1);day=JSON.parse(fs.readFileSync(ledger));assert.equal(day.tokens,C.DAY_TOKEN_CAP);
}));
// req: R-3293
await check('R-3293: only enabled post-start main sources use a stable root key',()=>using(async f=>{
 const forbidden=f.transcript(pair('not-enabled'));let calls=[];assert.match((await f.command(['make'],{runModel:runner(calls)})).output,/not enabled/);assert.equal(calls.length,0);
 await enabled(f);const id=git(f.main,'rev-list','--max-parents=0','HEAD');
 for(const [index,[eol,final]] of [['\r\n',true],['\n',false]].entries()) {
  f.transcript([...pair(`old${index}`,'OLD',{timestamp:'2026-10-31T18:15:59Z'}),...pair(`new${index}`,`NEW${index}`,{timestamp:C.START_INSTANT})],index?'a-no-final':'a',f.main,{eol,final});
 }
 f.review('memory-2026-11-01','Exact lane');f.review('memory-shaper-2026-11-01','Other lane');f.review('memory-2026-10-30','Old review');
 f.git(f.main,'add','.');f.git(f.main,'commit','-m','landed reviews');
 const wt=path.join(f.temp,'linked');f.git(f.main,'worktree','add','-b','feat/memory',wt);f.review('memory-2026-11-02','UNLANDED',wt);
 calls=[];await f.command(['make','--lane','memory','--repo',wt],{runModel:runner(calls)});
 assert.equal(calls[0][0].title,'Exact lane');assert.deepEqual(calls.flat().filter(u=>u.owner).map(u=>u.owner).sort(),['NEW0','NEW1']);assert.ok(!JSON.stringify(calls).includes('UNLANDED'));assert.ok(!JSON.stringify(calls).includes('Other lane'));
 const clone=path.join(f.temp,'clone');f.git(f.temp,'clone',f.main,clone);await f.command(['make','--repo',clone]);assert.equal(fs.readdirSync(path.join(f.a.dir,C.STORE_LAYOUT.projects)).length,1);
 const imported=repo(f.temp,'imported');f.git(f.main,'fetch',imported,'main');f.git(f.main,'merge','--allow-unrelated-histories','--no-edit','FETCH_HEAD');await f.command(['make']);
 assert.equal(fs.readdirSync(path.join(f.a.dir,C.STORE_LAYOUT.projects))[0],id.slice(0,C.FOLDER_ID_LENGTH));
 const shallow=path.join(f.temp,'shallow');f.git(f.temp,'clone','--depth','1',`file://${f.main}`,shallow);
 calls=[];assert.match((await f.command(['make','--repo',shallow],{runModel:runner(calls)})).output,/shallow/);assert.equal(calls.length,0);assert.match((await f.command(['enable','--repo',shallow])).output,/shallow/);
 assert.ok(forbidden);
}));
// req: R-3294
await check('R-3294: two machines and seat saves converge without machine files',()=>using(async f=>{
 await enabled(f);f.transcript(pair('first'));let saved;
 await f.command(['make'],{runModel:async input=>{saved=f.profile(['save','--kind','correction','--claim','Seat while model waits','--quote','Synthetic seat words']);assert.equal(saved.code,0,saved.output);return runner()(input);}});
 const b=f.clone('machine-b');f.git(b.dir,'fetch','origin');f.git(b.dir,'checkout','-B','main','origin/main');
 fs.copyFileSync(path.join(f.a.agent,'nana-pack.json'),path.join(b.agent,'nana-pack.json'));const config=JSON.parse(fs.readFileSync(path.join(b.agent,'nana-pack.json')));config.ownerProfile.dir=b.dir;fs.writeFileSync(path.join(b.agent,'nana-pack.json'),JSON.stringify(config));
 const offlineGit=(cwd,args)=>args[0]==='push'?{status:1,stderr:'synthetic offline'}:f.runGit(cwd,args);
 f.transcript(pair('second'),'second');await f.command(['make'],{agentDir:b.agent,runGit:offlineGit});
 f.transcript(pair('third'),'third');await f.command(['make'],{runGit:offlineGit});
 for(const agentDir of [f.a.agent,b.agent,f.a.agent]) {const saved=f.profile(['save','--kind','correction','--claim',`Save ${agentDir===b.agent?'b':'a'}`,'--quote','Synthetic quoted words'],{agentDir});assert.equal(saved.code,0,saved.output);assert.ok(!saved.output.includes('not pushed'));}
 const stale=path.join(f.a.dir,'.git','index.lock');fs.writeFileSync(stale,'');const old=new Date(now().getTime()-C.STALE_INDEX_LOCK_MS-1);fs.utimesSync(stale,old,old);
 assert.equal(f.profile(['save','--kind','correction','--claim','After interrupted git','--quote','Synthetic'],{now}).code,0);
 assert.equal(f.profile(['save','--kind','correction','--claim','Outside repo','--quote','Synthetic'],{cwd:f.temp}).code,0);
 const tracked=f.git(f.a.dir,'ls-files');assert.ok(!/nana-memory|run\.lock|day\.json|scratch/.test(tracked));
 const held=path.join(f.a.dir,'.git','nana-profile.lock');fs.writeFileSync(held,String(process.pid));f.transcript(pair('held'),'held');let calls=[];
 const busy=await f.command(['make'],{runModel:runner(calls)});assert.match(busy.output,/busy/);fs.rmSync(held);await f.command(['make'],{runModel:runner(calls)});assert.equal(calls.flat().length,1);
}));
// req: R-3295
await check('R-3295: one live normalized claim prefers the seat in either order',()=>using(async f=>{
 await enabled(f);const save=claim=>f.profile(['save','--kind','correction','--claim',claim,'--quote','Synthetic owner quote']);
 assert.equal(save('Prefer Calm Colors').code,0);f.transcript(pair('saved-first',' prefer  calm colors '));await f.command(['make']);
 assert.equal(f.states().filter(r=>r.claim.toLowerCase().includes('calm')).length,1);
 f.transcript(pair('extracted-first','Keep synthetic boundaries'),'b');await f.command(['make']);assert.equal(save('KEEP synthetic boundaries').code,0);
 let matching=f.states().filter(r=>r.claim.toLowerCase().includes('boundaries'));assert.equal(matching.length,1);assert.equal(matching[0].source,'saved');
 const file=f.transcript(pair('retry','Only one retry record'),'retry');await f.command(['make','--session',file],{runModel:async()=>({ok:false})});await f.command(['make','--session',file]);await f.command(['make','--session',file]);matching=f.states().filter(r=>r.claim==='Only one retry record');assert.equal(matching.length,1);
}));
// req: R-3296
await check('R-3296: narrow private evidence survives deletion without public text',()=>using(async f=>{
 await enabled(f);const owner='SYNTHETIC_OWNER_CANARY '+ 'x'.repeat(C.EVIDENCE_CAP*2),secret='SYNTHETIC_UNUSED_SECRET';
 const file=f.transcript([...pair('kept',owner),...pair('none',secret)]);let calls=0;
 const result=await f.command(['make'],{runModel:async input=>{calls++;const units=JSON.parse(input.prompt.slice(input.prompt.indexOf('[')));return {ok:true,usage:{tokens:100,cost:0.01},text:JSON.stringify({units:units.map((u,i)=>({id:u.id,kind:i?'none':'correction',claim:i?'':'Keep the synthetic claim'}))})};}});
 assert.equal(calls,1);fs.rmSync(file);const records=f.states();assert.equal(records.length,1);
 for(const record of records) {const resolved=await resolveEvidence(record.evidence,{repoRoot:f.main,projectsRoot:f.deps.projectsRoot,reviewsRoot:path.join(f.main,'docs/reviews'),storeDir:f.a.dir},record);assert.equal(resolved.status,'resolved');assert.equal(resolved.texts[0],owner.slice(0,C.EVIDENCE_CAP));assert.equal(resolved.texts.length,2);assert.ok(resolved.texts.every(t=>t.length<=C.EVIDENCE_CAP));}
 assert.ok(!allText(f.a.dir).includes(secret));assert.ok(!result.output.includes('CANARY'));assert.ok(!allText(f.main).includes('CANARY'));
 const project=path.join(f.a.dir,'projects',repositoryFolder(git(f.main,'rev-list','--max-parents=0','HEAD')));assert.ok(!allText(path.join(project,'runs')).includes('CANARY'));
 f.transcript(pair('ci',secret));assert.match((await f.command(['make'],{env:{...f.deps.env,CI:'1'},projectsRoot:{toString(){throw Error('read forbidden');}}})).output,/ci/);
}));
// req: R-3297
await check('R-3297: land starts making only after the final merge and cannot alter its verdict',async()=>{
 const f=memoryFixture();try {
  for(const mode of ['normal','broken-ledger','throw','refused','no-lane','default']) {
   const main=repo(f.temp,`land-${mode}`),tree=path.join(f.temp,`tree-${mode}`);git(main,'worktree','add','-b',mode==='no-lane'?'other':'feat/demo',tree);
   const base=git(main,'rev-parse','HEAD'),tip=commit(tree,'next.txt','next','next'),home=path.join(f.temp,`home-${mode}`),reviewed=[`${reviewTip(tree,home)}=item`];
   if(mode==='broken-ledger') {const ledger=landRecordsPath(path.join(main,'.git'));fs.mkdirSync(path.dirname(ledger),{recursive:true});fs.mkdirSync(ledger);}
   let locked=false,calls=0;const lock=(...args)=>withReviewLedgerLock(args[0],x=>{locked=true;try{return args[1](x);}finally{locked=false;}});
   const options={main,tree,reviewed,suite:'injected',home,runGit:gitRunner,now,withReviewLedgerLock:lock,runCommand:()=>({status:mode==='refused'?1:0,stdout:'',stderr:''}),readReleaseStatus:()=>({line:'ready'})};
   const baseline=runLand(options);if(mode!=='broken-ledger')fs.rmSync(landRecordsPath(path.join(main,'.git')),{force:true});git(main,'reset','--hard',base);const out=runLand({...options,...(mode==='default'?{}:{startMemory:input=>{calls++;assert.equal(locked,false);assert.equal(git(main,'rev-parse','main'),tip);assert.deepEqual(input,{repo:main,lane:'demo'});if(mode==='throw') throw Error('SYNTHETIC_OWNER_CANARY');return 'memory: started; last never unknown';}})});
   assert.equal(out.code,baseline.code);if(['refused','no-lane','default'].includes(mode)) {assert.equal(calls,0);assert.equal(out.text,baseline.text);}else{assert.equal(calls,1);assert.equal(out.text,baseline.text+(mode==='throw'?C.WORDS.notStarted:'memory: started; last never unknown')+'\n');}
  }
  let spawns=0,unrefs=0;const spawn=(bin,args,options)=>{spawns++;assert.equal(bin,process.execPath);assert.ok(args.includes('--repo'));assert.ok(args.includes('--lane'));assert.equal(options.detached,true);assert.equal(options.windowsHide,true);assert.equal(options.stdio,'ignore');assert.equal(options.cwd,f.temp);return {on:(event,fn)=>{assert.equal(event,'error');fn();},unref:()=>unrefs++};};
  for(const env of [{CI:'1'},{NANA_ROLE:'seat'},{NANA_ROLE:''}]) startMemory({repo:f.main,lane:'demo'},{env,home:f.temp,spawn,agentDir:f.a.agent,now});assert.equal(spawns,0);
  startMemory({repo:f.main,lane:'demo'},{env:{},home:f.temp,spawn,agentDir:f.a.agent,now});assert.equal(spawns,1);assert.equal(unrefs,1);
 }finally{f.close();}
});
