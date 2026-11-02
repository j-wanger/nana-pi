/**
 * @module packages/nana-pack/tests/memory-curation.test.mjs
 * @purpose Pin owner-gated curation with synthetic private stores and stub proposers only.
 * @inputs OS temporary clones and injected model replies.
 * @outputs Awaited bounded PASS/FAIL titles without record text.
 * @effects disk, process
 * @errors Failed cases set exit 1 without exposing fixture content.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { using, now } from './memory-run-fixture.mjs';
import { files } from './profile-fixture.mjs';
import { shape } from '../lib/memory-making.mjs';
import { writeProfileRecord, exclusiveJson, profileStamp } from '../lib/profile-store.mjs';
import { readMemoryStore, writeMemoryFile, ensureRepository, countUnparseableMemoryFiles, copiedEvidence } from '../lib/memory-store.mjs';
import { commitProfile, syncProfile } from '../lib/profile-sync.mjs';
import { PROFILE_SHOW_BUDGET, PROFILE_WORDS as P } from '../lib/profile-config.mjs';
import { RUN_LAYOUT, DAY_TOKEN_CAP } from '../lib/memory-run-config.mjs';
async function check(title, fn) {
 let timer;
 try { await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('deadline')),120000);})]); console.log('PASS',title); }
 catch { console.log('FAIL',title); process.exitCode=1; }
 finally { clearTimeout(timer); }
}
const config=()=>import('../lib/memory-curation-config.mjs');
const library=()=>import('../lib/memory-curation.mjs');
const reason=()=>String.fromCharCode(955).repeat(20);
const quote=()=>String.fromCharCode(937).repeat(50);
function seed(f,n,{saved=false,q=quote(),length=50,repository='a'.repeat(40),date='2026-11-01',profileExtracted=false}={}) {
 const claim=String.fromCharCode(1024+n).repeat(length);
 if(saved) return writeProfileRecord(f.a.dir,{kind:'preference',claim,quote:q},{env:f.a.env,now});
 const record={...shape('user','decision',q,'',`claude-code:synthetic#${n}+seat`,date,{claim}).record,...(profileExtracted?{}:{repository})};
 if(profileExtracted){exclusiveJson(f.a.dir,'records',record.id,record,profileStamp(now()),size=>Buffer.alloc(size,n));return record;}
 ensureRepository(f.a.dir,repository);writeMemoryFile(f.a.dir,repository,'records',record.id,record,{now});return record;
}
const committed=f=>commitProfile(f.a.dir,f.runGit,'Synthetic fixture');
const proposals=f=>files(f.a.dir,'projects/curation/proposals').map(file=>JSON.parse(fs.readFileSync(file)));
const stub=fn=>async input=>({ok:true,usage:{tokens:100,cost:0.01},text:JSON.stringify({proposals:fn(JSON.parse(input.prompt))})});
const retire=(id,extra={})=>({op:'retire',id,class:'one-off',reason:reason(),...extra});
const merge=(keep,drop)=>({op:'merge',keep,drop,reason:reason()});
async function command(f,args,over={}) {
 const {runCurate}=await import('../bin/nana-curate.mjs');let output='',error='';
 const code=await runCurate(args,{...f.deps,stdout:s=>output+=s,stderr:s=>error+=s,...over});return {code,output,error};
}
function snapshot(dir) {
 const walk=base=>!fs.existsSync(base)?[]:fs.readdirSync(base,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(base,e.name)):[path.join(base,e.name)]);
 return Object.fromEntries(walk(dir).filter(file=>!file.includes(`${path.sep}.git${path.sep}`)&&/(?:records|events)[/\\]/u.test(path.relative(dir,file))).map(file=>[path.relative(dir,file),fs.readFileSync(file).toString('hex')]));
}
// Immutable manifest includes curation files as well as every area-local record/event.
function chainManifest(dir) {
 const walk=base=>fs.readdirSync(base,{withFileTypes:true}).flatMap(e=>e.name==='.git'?[]:e.isDirectory()?walk(path.join(base,e.name)):[path.join(base,e.name)]);
 return Object.fromEntries(walk(dir).filter(file=>/(?:^|[/\\])(?:records|events|proposals|decisions)[/\\]/u.test(path.relative(dir,file))).map(file=>[path.relative(dir,file),fs.readFileSync(file).toString('hex')]));
}
function preserves(dir,before) {
 const after=chainManifest(dir);for(const [file,bytes] of Object.entries(before))assert.equal(after[file],bytes,'immutable manifest entry');return after;
}
async function persist(f,p) {
 const L=await library(),C=await config();const proposal={...p,group:readMemoryStore(f.a.dir).filter(r=>r.live).map(r=>r.id).sort()};proposal.key=L.proposalKey(proposal);
 L.writeCuration(f.a.dir,C.LAYOUT.proposals,proposal,{now});committed(f);return proposal;
}
async function acceptChain(f,p) {
 const before=chainManifest(f.a.dir),result=await command(f,['accept',p.key,'--quote',quote()]);assert.equal(result.code,0,'chain accept');
 const after=preserves(f.a.dir,before),added=Object.keys(after).filter(file=>!(file in before)&&/(?:^|[/\\])events[/\\]/u.test(file));
 const states=readMemoryStore(f.a.dir);
 const actual=added.map(file=>{const e=JSON.parse(Buffer.from(after[file],'hex'));return {id:e.id,action:e.action,...(e.target?{target:e.target}:{}),quote:e.quote};}).sort((a,b)=>a.id.localeCompare(b.id));
 const ids=p.op==='merge'?p.drop:[p.id,...(states.find(r=>r.id===p.id)?.absorbed??[])];
 // Retirement expectations are supplied before liveness changes by the caller.
 const expected=(p.expectedIds??ids).map(id=>({id,action:p.op==='merge'?'supersede':'retract',...(p.op==='merge'?{target:p.keep}:{}),quote:quote()})).sort((a,b)=>a.id.localeCompare(b.id));
 assert.deepEqual(actual,expected,'exact accepted event payloads');return after;
}
async function chain(f,n=4) {
 const rows=Array.from({length:n},(_,i)=>seed(f,100+i));committed(f);
 for(let i=1;i<n;i++){const p=await persist(f,merge(rows[i].id,[rows[i-1].id]));await acceptChain(f,p);}
 return rows;
}
// req: R-3560
await check('shared owner words reach the proposer together',()=>using(async f=>{
 const C=await config();const seen=[];
 const a=seed(f,1,{saved:true}),b=seed(f,2),unrelated=seed(f,3,{q:String.fromCharCode(1200).repeat(50)});
 for(let i=0;i<C.BATCH_RECORDS+1;i++) seed(f,10+i,{date:new Date(Date.UTC(2026,0,C.BATCH_RECORDS+1-i)).toISOString().slice(0,10),q:String.fromCharCode(1400+i).repeat(C.QUOTE_SPAN_CHARS)+' '+String.fromCharCode(1401+i).repeat(C.QUOTE_SPAN_CHARS)});
 committed(f);
 const result=await command(f,['propose'],{runModel:stub(rows=>{seen.push(rows);return [];})});
 assert.equal(result.code,0);assert.equal(seen.length,2);
 const pair=seen.find(rows=>rows.some(r=>r.claim===a.claim));const left=pair.find(r=>r.claim===a.claim),right=pair.find(r=>r.claim===b.claim);
 assert.equal(left.group,right.group);assert.notEqual(pair.find(r=>r.claim===unrelated.claim)?.group,left.group);
 const chain=seen.flat().filter(r=>![a.claim,b.claim,unrelated.claim].includes(r.claim));assert.equal(chain.length,C.BATCH_RECORDS+1);
 assert.deepEqual(chain.map(r=>r.date),[...chain.map(r=>r.date)].sort());
 assert.equal(new Set(seen.flat().filter(r=>![a.claim,b.claim].includes(r.claim)).map(r=>r.group)).has(left.group),false);
 assert.equal(seen[0].length,C.BATCH_RECORDS);assert.ok(result.output.includes('split 1'));
}));
// req: R-3561
await check('propose leaves live memory unchanged and writable',()=>using(async f=>{
 const C=await config();const a=seed(f,1,{saved:true}),b=seed(f,2),c=seed(f,3);committed(f);
 const before=readMemoryStore(f.a.dir),bytes=snapshot(f.a.dir),bad=countUnparseableMemoryFiles(f.a.dir),copy=copiedEvidence(f.a.dir,'absent');
 const result=await command(f,['propose'],{runModel:stub(rows=>[merge(rows.find(r=>r.claim===b.claim).id,[rows.find(r=>r.claim===a.claim).id]),retire(rows.find(r=>r.claim===c.claim).id)])});
 assert.equal(result.code,0);assert.equal(proposals(f).length,2);assert.deepEqual(readMemoryStore(f.a.dir),before);assert.deepEqual(snapshot(f.a.dir),bytes);
 assert.equal(countUnparseableMemoryFiles(f.a.dir),bad);assert.deepEqual(copiedEvidence(f.a.dir,'absent'),copy);assert.equal(f.git(f.a.dir,'status','--porcelain'),'');
 assert.equal(result.output,`${C.WORDS.counts} proposals 2; batches 1; rejected 0; dropped 0; decided 0; split 0; unsent 0; tokens 100; cost 0.01; bad 0\n${C.WORDS.size} profile 1 records ${a.claim.length} chars -> 1 records ${a.claim.length} chars; project 2 records ${b.claim.length+c.claim.length} chars -> 0 records 0 chars\n`);
 for(const secret of [a.claim,b.quote,reason()]) assert.equal(result.output.includes(secret),false);
 assert.equal(proposals(f).find(p=>p.op==='merge').keep,a.id);
 assert.equal(f.profile(['save','--kind','preference','--claim',String.fromCharCode(1600).repeat(20),'--quote',quote()]).code,0);
 assert.equal(C.LAYOUT.root,'projects/curation');
 for(const folder of [C.LAYOUT.proposals,C.LAYOUT.decisions]){const dir=path.join(f.a.dir,C.LAYOUT.root,folder,'partial');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'partial.json'),folder===C.LAYOUT.proposals?'{':'{}');}
 committed(f);const damaged=await command(f,['queue']);assert.equal(damaged.code,0);assert.ok(damaged.output.includes('bad 2'));
 assert.equal(countUnparseableMemoryFiles(f.a.dir),bad);assert.deepEqual(copiedEvidence(f.a.dir,'absent'),copy);
}));
// req: R-3562
await check('queue shows bounded numbered private decisions',()=>using(async f=>{
 const C=await config(),L=await library();const a=seed(f,1,{saved:true,length:600}),b=seed(f,2,{length:500}),c=seed(f,3,{length:20});committed(f);
 await command(f,['propose'],{runModel:stub(rows=>rows.map(r=>retire(r.id)))});
 const queued=await command(f,['queue']);assert.equal(queued.code,0);
 assert.ok(queued.output.startsWith(C.WORDS.privacy+'\n'+L.sizeLine(readMemoryStore(f.a.dir),proposals(f))+'\n'));
 assert.ok(queued.output.indexOf(a.id.slice(0,12))<0); // queue identifies proposals, not record ids
 const pending=L.pendingQueue(readMemoryStore(f.a.dir),proposals(f),[]).pending;
 assert.ok(queued.output.includes(`1. ${pending[0].key.slice(0,12)} retire one-off`));assert.ok(queued.output.includes(C.WORDS.cut));
 assert.ok(queued.output.includes(a.claim.slice(0,C.QUEUE_CLAIM_CAP)));assert.ok(queued.output.includes('saved'));assert.ok(queued.output.includes(a.date));assert.ok(queued.output.includes(reason()));assert.ok(queued.output.includes('absorbed 0'));
 const states=readMemoryStore(f.a.dir),many=Array.from({length:30},(_,i)=>({...pending[0],key:i.toString(16).padStart(64,'0')}));
 const text=L.renderQueue(states,many);assert.ok(text.length<=PROFILE_SHOW_BUDGET);assert.ok(text.includes(C.WORDS.fold));
 const huge={...pending[0],op:'merge',keep:a.id,drop:Array.from({length:30},()=>b.id)};
 assert.ok(L.renderQueue(states,[huge]).includes(`1. ${huge.key.slice(0,12)}`));assert.ok(L.renderQueue(states,[huge]).length>PROFILE_SHOW_BUDGET);
 assert.ok(c);
}));
// req: R-3563
await check('accept writes owner events atomically and refuses stale prefixes',()=>using(async f=>{
 const C=await config();const a=seed(f,1,{saved:true}),b=seed(f,2),c=seed(f,3);committed(f);const bytes=snapshot(f.a.dir);
 await command(f,['propose'],{runModel:stub(rows=>[merge(rows.find(r=>r.claim===a.claim).id,[rows.find(r=>r.claim===b.claim).id]),retire(rows.find(r=>r.claim===c.claim).id)])});
 const ps=proposals(f),keys=ps.map(p=>p.key);
 const L=await library();const ambiguous={...ps[0],key:ps[0].key.slice(0,12)+(ps[0].key.slice(12)==='0'.repeat(52)?'1':'0').repeat(52)};
 L.writeCuration(f.a.dir,C.LAYOUT.proposals,ambiguous,{now});committed(f);const head=f.git(f.a.dir,'rev-parse','HEAD');
 assert.equal((await command(f,['accept',keys[0].slice(0,12),'--quote',quote()])).error.trim(),C.WORDS.unknown);
 assert.equal((await command(f,['accept',keys[0],ambiguous.key,'--quote',quote()])).error.trim(),C.WORDS.usage);assert.equal(f.git(f.a.dir,'rev-parse','HEAD'),head);
 for(const args of [['accept',...keys],['accept',keys[0],'ffffffffffff','--quote',quote()]]) {assert.equal((await command(f,args)).code,1);assert.equal(f.git(f.a.dir,'rev-parse','HEAD'),head);}
 assert.equal((await command(f,['accept',...keys,'--quote',quote()])).code,0);assert.equal(f.git(f.a.dir,'rev-list','--count',`${head}..HEAD`),'1');
 let states=readMemoryStore(f.a.dir);assert.equal(states.find(r=>r.id===a.id).live,true);for(const r of [b,c])assert.equal(states.find(s=>s.id===r.id).live,false);
 const events=files(f.a.dir,'projects/'+b.repository.slice(0,16)+'/events').map(file=>JSON.parse(fs.readFileSync(file)));
 assert.ok(events.some(e=>e.id===b.id&&e.target===a.id&&e.quote===quote()));
 assert.equal((await command(f,['accept',keys[0],'--quote',quote()])).code,1);
 await command(f,['propose'],{runModel:stub(rows=>[retire(rows.find(r=>r.claim===a.claim).id)])});
 const survivor=proposals(f).find(p=>p.op==='retire'&&p.id===a.id);assert.ok((await command(f,['queue'])).output.includes('absorbed 1'));assert.equal((await command(f,['accept',survivor.key.slice(0,12),'--quote',quote()])).code,0);
 states=readMemoryStore(f.a.dir);assert.equal(states.filter(r=>r.live).length,0);assert.equal(files(f.a.dir,'events').length,1);
 for(const [file,hex] of Object.entries(bytes))assert.equal(fs.readFileSync(path.join(f.a.dir,file)).toString('hex'),hex);
 assert.equal(f.git(f.a.dir,'status','--porcelain'),'');assert.equal(f.profile(['save','--kind','preference','--claim',String.fromCharCode(1700).repeat(20),'--quote',quote()]).code,0);
 // A second clone retracts a live target before this clone fetches.
 const d=seed(f,4);committed(f);await command(f,['propose'],{runModel:stub(rows=>[retire(rows.find(r=>r.claim===d.claim).id)])});
 const stale=proposals(f).find(p=>p.id===d.id);const other=f.clone('other');delete other.env.CI;
 assert.equal(f.profile(['init','--dir',other.dir,'--save','--unverified-remote'],{agentDir:other.agent,env:other.env}).code,0);
 assert.equal(f.profile(['retract',d.id,'--quote',quote()],{agentDir:other.agent,env:other.env}).code,0);
 const refused=await command(f,['accept',stale.key.slice(0,12),'--quote',quote()]);assert.equal(refused.code,1);assert.equal(refused.error.trim(),C.WORDS.stale);
 const profileDrop=seed(f,6,{profileExtracted:true}),projectKeep=seed(f,7);committed(f);
 await command(f,['propose'],{runModel:stub(rows=>[merge(rows.find(r=>r.claim===projectKeep.claim).id,[rows.find(r=>r.claim===profileDrop.claim).id])])});
 const cross=proposals(f).find(p=>p.keep===projectKeep.id);assert.equal((await command(f,['accept',cross.key.slice(0,12),'--quote',quote()])).code,0);
 assert.ok(files(f.a.dir,'events').map(file=>JSON.parse(fs.readFileSync(file))).some(e=>e.id===profileDrop.id&&e.target===projectKeep.id&&e.quote===quote()));
 // A failed fetch is disclosed, not presented as a synced review.
 fs.renameSync(f.bare,`${f.bare}.away`);const offline=await command(f,['queue']);assert.ok(offline.output.includes(C.WORDS.notSynced));fs.renameSync(`${f.bare}.away`,f.bare);
}));
// req: R-3564
await check('rejected subsets stay rejected across machines',()=>using(async f=>{
 const a=seed(f,1),b=seed(f,2),c=seed(f,3),d=seed(f,4,{q:String.fromCharCode(1800).repeat(50)});committed(f);
 const proposer=stub(rows=>[merge(rows.find(r=>r.claim===a.claim).id,rows.filter(r=>[b.claim,c.claim].includes(r.claim)).map(r=>r.id)),retire(rows.find(r=>r.claim===d.claim).id)]);
 assert.equal((await command(f,['propose'],{runModel:proposer})).code,0);
 const keys=proposals(f).map(p=>p.key.slice(0,12));assert.equal((await command(f,['reject',...keys])).code,0);assert.equal(f.git(f.a.dir,'status','--porcelain'),'');
 assert.equal(f.profile(['save','--kind','preference','--claim',String.fromCharCode(2000).repeat(20),'--quote',quote()]).code,0);
 const subset=stub(rows=>[merge(rows.find(r=>r.claim===b.claim).id,[rows.find(r=>r.claim===a.claim).id]),retire(rows.find(r=>r.claim===d.claim).id,{class:'dated'})]);
 const result=await command(f,['propose'],{runModel:subset});assert.equal(result.code,0);assert.ok(result.output.includes('decided 2'));assert.equal(proposals(f).length,2);
 const other=f.clone('other');delete other.env.CI;assert.equal(f.profile(['init','--dir',other.dir,'--save','--unverified-remote'],{agentDir:other.agent,env:other.env}).code,0);
 const second=await command(f,['propose'],{agentDir:other.agent,env:other.env,runModel:subset});assert.equal(second.code,0);assert.ok(second.output.includes('decided 2'));
 const q=await command(f,['queue'],{agentDir:other.agent,env:other.env});assert.equal(/\n1\. /u.test(q.output),false);
}));
// req: R-3565
await check('bad models fail closed and proposal validation is independent',()=>using(async f=>{
 const C=await config();const rows=Array.from({length:14},(_,i)=>seed(f,i,{saved:[0,10,11].includes(i)}));committed(f);
 const no=async()=>({ok:false}),junk=async()=>({ok:true,text:'not json'}),array=async()=>({ok:true,text:'[]'});
 for(const runModel of [undefined,async()=>{throw Error('private');},no,junk,array]) {
  const result=await command(f,['propose'],{runModel});assert.equal(result.code,1);assert.equal(proposals(f).length,0);assert.ok([C.WORDS.unavailable,C.WORDS.repliesRejected].includes(result.output.trim()));assert.equal(result.error,'');
 }
 const invalid=stub(input=>{
  const id=n=>input.find(r=>r.claim===rows[n].claim).id;
  return [merge(id(1),[id(0)]),retire('r9999'),merge(id(2),[id(2)]),retire([id(3),id(4)]),retire(id(5),{class:'unknown'}),retire(id(6),{reason:''}),retire(id(7)),retire(id(7)),retire(id(8)),retire(id(9),{reason:reason().repeat(C.REASON_CAP)}),merge(id(10),[id(11)])];
 });
 const result=await command(f,['propose'],{runModel:invalid});assert.equal(result.code,0);assert.equal(proposals(f).length,2);assert.ok(result.output.includes('dropped 9'));assert.equal(proposals(f).find(p=>p.op==='merge').keep,rows[0].id);
 const allBad=await command(f,['propose'],{runModel:stub(()=>[retire('r9999')])});assert.equal(allBad.code,1);assert.equal(allBad.output.trim(),C.WORDS.repliesRejected);assert.equal(proposals(f).length,2);
 // No lock held across model work; a seat save can acquire it.
 assert.equal((await command(f,['propose'],{runModel:async input=>{assert.equal(f.profile(['save','--kind','preference','--claim',String.fromCharCode(1900).repeat(20),'--quote',quote()]).code,0);return stub(()=>[])(input);}})).code,0);
 const initial=readMemoryStore(f.a.dir).length;for(let i=0;i<C.BATCH_RECORDS*C.CALL_CAP+1-initial;i++)seed(f,20+i);committed(f);let calls=0;
 const cap=await command(f,['propose'],{runModel:stub(()=>{calls++;return [];})});assert.equal(calls,C.CALL_CAP);assert.ok(cap.output.includes('unsent 1'));
 const gitdir=f.git(f.a.dir,'rev-parse','--absolute-git-dir');fs.writeFileSync(path.join(gitdir,RUN_LAYOUT.dayLedger),JSON.stringify({date:now().toISOString().slice(0,10),tokens:DAY_TOKEN_CAP}));calls=0;
 const day=await command(f,['propose'],{runModel:stub(()=>{calls++;return [];})});assert.equal(calls,0);assert.equal(day.code,1);
}));
// req: R-3566
await check('all commands honor profile and seat refusals',()=>using(async f=>{
 const C=await config();let calls=0;const runModel=stub(()=>{calls++;return [];});
 const run=async(over,word)=>{for(const args of [['propose'],['queue'],['accept','abcdef123456','--quote',quote()],['reject','abcdef123456']]){const r=await command(f,args,{runModel,...over});assert.equal(r.code,1);assert.equal(r.error.trim(),word);}};
 await run({env:{...f.a.env,NANA_ROLE:''}},P.role);await run({env:{...f.a.env,NANA_ROLE:'worker'}},P.role);await run({env:{...f.a.env,CI:'1'}},C.WORDS.ci);
 const wt=path.join(f.temp,'linked');f.git(f.main,'worktree','add','-b','linked',wt);await run({cwd:wt},P.worktree);
 const pointer=path.join(f.a.agent,'nana-pack.json'),raw=fs.readFileSync(pointer);fs.writeFileSync(pointer,'{}');await run({},P.pointer);fs.writeFileSync(pointer,raw);
 const marker=path.join(f.a.dir,'.nana-profile');fs.renameSync(marker,marker+'.away');await run({},P.marker);fs.renameSync(marker+'.away',marker);
 const dir=path.join(f.a.dir,'records','broken');fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'broken.json'),'{');await run({},P.git);assert.equal(calls,0);
}));
// req: R-3698
await check('merge chains keep earlier drops out of live queue and sizes',()=>using(async f=>{
 const L=await library(),C=await config();let previous=chainManifest(f.a.dir);const rows=[];
 for(let i=0;i<4;i++) {
  rows.push(seed(f,100+i));committed(f);
  if(i)await acceptChain(f,await persist(f,merge(rows[i].id,[rows[i-1].id])));
  previous=preserves(f.a.dir,previous);
  const states=readMemoryStore(f.a.dir);assert.deepEqual(states.filter(r=>r.live).map(r=>r.id),[rows[i].id],'only newest keep live');
  const p=await persist(f,retire(rows[i].id));const queue=await command(f,['queue']);assert.equal(queue.code,0);
  for(const old of rows.slice(0,-1))assert.equal(queue.output.includes(old.claim),false,'queue excludes earlier drops');
  assert.equal(L.sizeLine(states,[p]),`${C.WORDS.size} profile 0 records 0 chars -> 0 records 0 chars; project 1 records 50 chars -> 0 records 0 chars`,'chain size forecast');
 }
}));
// req: R-3699
await check('retirement takes absorbed chains but stops at retractions',async()=>{
 await using(async f=>{
  const rows=await chain(f),p=await persist(f,retire(rows[3].id));
  assert.ok((await command(f,['queue'])).output.includes('absorbed 3'),'transitive absorbed count');
  await acceptChain(f,{...p,expectedIds:rows.map(r=>r.id)});assert.equal(readMemoryStore(f.a.dir).filter(r=>r.live).length,0,'whole chain retired');
 });
 await using(async f=>{
  const {writeStateEvent}=await import('../lib/memory-store.mjs'),L=await library(),C=await config();const [a,b,c]=await chain(f,3);
  writeStateEvent(f.a.dir,b,'retract',{quote:quote()},{now});committed(f);
  const states=readMemoryStore(f.a.dir);assert.deepEqual(states.filter(r=>r.live).map(r=>r.id).sort(),[a.id,c.id].sort(),'retract cuts chain');
  const p=await persist(f,retire(c.id));assert.ok((await command(f,['queue'])).output.includes('absorbed 0'),'cut absorbed count');
  assert.equal(L.sizeLine(states,[p]),`${C.WORDS.size} profile 0 records 0 chars -> 0 records 0 chars; project 2 records 100 chars -> 1 records 50 chars`,'cut size forecast');
  await acceptChain(f,{...p,expectedIds:[c.id]});assert.deepEqual(readMemoryStore(f.a.dir).filter(r=>r.live).map(r=>r.id),[a.id],'independent predecessor survives retirement');
 });
});
// req: R-3701
await check('accept manifests survive both clone sync orders',async()=>{
 for(const reverse of [false,true])await using(async f=>{
  const [a,b,c]=[seed(f,100),seed(f,101),seed(f,102)];committed(f);const ab=await persist(f,merge(b.id,[a.id])),bc=await persist(f,merge(c.id,[b.id]));
  assert.equal(syncProfile({dir:f.a.dir,verifiedPushUrl:f.bare},{runGit:f.runGit}).ok,true);
  const other=f.clone('other');delete other.env.CI;
  assert.equal(f.profile(['init','--dir',other.dir,'--save','--unverified-remote'],{agentDir:other.agent,env:other.env}).code,0);
  // Refuse transport only: both owners can honestly accept from their offline snapshots.
  const offline=(cwd,args)=>['fetch','push'].includes(args[0])?{status:1,stdout:'',stderr:''}:f.runGit(cwd,args);
  const baseline=chainManifest(f.a.dir);
  assert.equal((await command(f,['accept',ab.key,'--quote',quote()],{runGit:offline})).code,0);
  assert.equal((await command(f,['accept',bc.key,'--quote',quote()],{agentDir:other.agent,env:other.env,runGit:offline})).code,0);
  const left=preserves(f.a.dir,baseline),right=preserves(other.dir,baseline);
  for(const [manifest,id,target] of [[left,a.id,b.id],[right,b.id,c.id]]) {
   const events=Object.keys(manifest).filter(file=>!(file in baseline)&&/(?:^|[/\\])events[/\\]/u.test(file)).map(file=>JSON.parse(Buffer.from(manifest[file],'hex')));
   assert.deepEqual(events.map(e=>({id:e.id,action:e.action,target:e.target,quote:e.quote})),[{id,action:'supersede',target,quote:quote()}],'offline exact event payload');
  }
  const order=reverse?[other,f.a]:[f.a,other];
  for(const clone of [...order,order[0]])assert.equal(syncProfile({dir:clone.dir,verifiedPushUrl:f.bare},{runGit:f.runGit}).ok,true,'clone sync');
  const union={...left,...right};for(const clone of [f.a,other]){
   assert.deepEqual(chainManifest(clone.dir),union,'synced manifest union');
   assert.deepEqual(readMemoryStore(clone.dir).filter(r=>r.live).map(r=>r.id),[c.id],'synced chain survivor');
  }
 });
});
// req: R-3702
await check('persisted stale chain endpoints refuse without writes',async()=>{
 for(const scenario of ['keep','drop','retract','old-chain'])await using(async f=>{
  const [a,b,c,d]=[seed(f,100),seed(f,101),seed(f,102),seed(f,103)];committed(f);
  const p=await persist(f,scenario==='drop'?merge(d.id,[a.id]):scenario==='old-chain'?merge(a.id,[c.id]):merge(a.id,[d.id]));
  if(scenario==='retract'){
   const {writeStateEvent}=await import('../lib/memory-store.mjs');writeStateEvent(f.a.dir,a,'retract',{quote:quote()},{now});committed(f);
  }else{
   await acceptChain(f,await persist(f,merge(b.id,[a.id])));
   await acceptChain(f,await persist(f,merge(c.id,[b.id])));
  }
  const before=chainManifest(f.a.dir),head=f.git(f.a.dir,'rev-parse','HEAD'),result=await command(f,['accept',p.key,'--quote',quote()]);
  assert.equal(result.code,1,`stale ${scenario} refuses`);assert.equal(result.error.trim(),(await config()).WORDS.stale,`stale ${scenario} word`);
  assert.deepEqual(chainManifest(f.a.dir),before,'stale writes nothing');assert.equal(f.git(f.a.dir,'rev-parse','HEAD'),head,'stale makes no commit');
 });
});
// req: R-3568
await check('seal: quote span and boundary',async()=>{const C=await config(),L=await library();assert.equal(C.QUOTE_SPAN_CHARS,30);const rows=n=>[{id:'a',live:true,quote:'X'.repeat(n)},{id:'b',live:true,quote:'x'.repeat(n)+' \t'}];assert.equal(L.groupRecords(rows(29)).length,2);assert.equal(L.groupRecords(rows(30)).length,1);});
// req: R-3569
await check('seal: batch records',async()=>assert.equal((await config()).BATCH_RECORDS,60));
// req: R-3570
await check('seal: call cap',async()=>assert.equal((await config()).CALL_CAP,2));
// req: R-3571
await check('seal: token cap',async()=>assert.equal((await config()).TOKEN_CAP,200000));
// req: R-3572
await check('seal: queue claim cap',async()=>assert.equal((await config()).QUEUE_CLAIM_CAP,300));
// req: R-3573
await check('seal: reason cap',async()=>assert.equal((await config()).REASON_CAP,600));
// req: R-3574
await check('seal: retirement classes',async()=>assert.deepEqual((await config()).RETIRE_CLASSES,['one-off','dated','covered','superseded']));
// req: R-3575
await check('seal: system prompt hash',async()=>assert.equal(createHash('sha256').update((await config()).SYSTEM_PROMPT).digest('hex'),'bec06fa37683a2d468bd20dd143d690595b4b3830f615741d18bbc6c571d5dfa'));
// req: R-3576
await check('seal: curation command pattern',async()=>assert.equal((await config()).COMMAND_PATTERN.source,'(?:^|[\\s/\\\\])(?:memory:curate|nana-curate\\.mjs)(?=\\s|$)'));
// req: R-3577
await check('seal: curation layout and words',async()=>{
 const C=await config();assert.deepEqual(C.FIELDS,{merge:['drop','keep','op','reason'],retire:['class','id','op','reason'],proposal:['group','key'],decision:['action','key','proposal']});assert.deepEqual(C.LAYOUT,{root:'projects/curation',proposals:'proposals',decisions:'decisions'});
 assert.deepEqual(C.WORDS,{privacy:'Private memory: never quote these in issues, commits, PRs or HANDOFF.',unavailable:'curate: no proposals: model unavailable',repliesRejected:'curate: no proposals: replies rejected',ci:'curate refused: CI',usage:'curate refused: invalid command',unknown:'curate refused: unknown or ambiguous proposal',decided:'curate refused: already decided',stale:'curate refused: stale proposal',notSynced:'not synced',cut:'… [cut]',fold:'curate: proposals left out: ',counts:'curate:',size:'curate size:',accepted:'curate: accepted',rejected:'curate: rejected',queue:'curate queue:'});
});
