/**
 * @module packages/nana-pack/tests/memory-bundle.test.mjs
 * @purpose Pin ranked whole-line memory selection and its sealed configuration.
 * @inputs Synthetic effective records and exported bundle configuration.
 * @outputs Awaited PASS/FAIL cases.
 * @effects process
 * @errors Failed assertions set exit code one.
 */
import assert from 'node:assert/strict';
import { check } from './profile-fixture.mjs';
const load = () => import('../lib/memory-bundle.mjs');
const config = () => import('../lib/memory-bundle-config.mjs');
const record = (id, extra={}) => ({id:id.toString(16).padStart(12,'0').padEnd(64,'0'),live:true,source:'extracted',repository:'repo',trust:'low',date:'2026-10-01',kind:'decision',claim:`Synthetic ${id}`, ...extra});

// req: R-3413
await check('B2: parts ranking exact record budget and decimal header boundaries', async () => {
 const {makeMemoryBundle, memoryRecordLine}=await load(); const {PUSH_BUDGET}=await config();
 const records=[...Array.from({length:40},(_,i)=>record(i,{claim:`Decision ${i} `+'x'.repeat(150)})),record(100,{repository:undefined,source:'saved',kind:'preference'}),record(101,{repository:undefined,source:'saved',kind:'preference'})];
 const bundle=makeMemoryBundle(records,{repository:'repo'});
 assert.deepEqual(bundle.delivered.slice(0,2),records.slice(-2).map(r=>r.id.slice(0,12)));
 assert.match(bundle.text,/left out 0 profile, \d+ project/); assert.ok(bundle.omitted.length>0); assert.ok(bundle.chars<=PUSH_BUDGET);
 const mixed=[record(1,{trust:'high'}),record(11,{trust:'medium'}),record(2,{source:'saved',kind:'preference'}),record(3,{kind:'correction'}),record(4,{kind:'decision',date:'2026-10-02'}),record(5,{kind:'decision',date:'2026-10-01'}),record(6,{kind:'preference'}),record(7,{kind:'lesson'}),record(8,{kind:'fact'}),record(9,{kind:'thinking'}),record(10,{kind:'other'})];
 assert.deepEqual(makeMemoryBundle(mixed.toReversed(),{repository:'repo'}).delivered,mixed.map(r=>r.id.slice(0,12)));
 assert.equal(memoryRecordLine(record(99,{claim:' Synthetic\r\nclaim\t😀 '})),`- [low 2026-10-01 decision] Synthetic claim 😀 (${record(99).id.slice(0,12)})\n`);
 const sized=(id,n)=>{const r=record(id,{claim:''});r.claim='é'.repeat(n-memoryRecordLine(r).length);return r;};
 const exact=[sized(1,PUSH_BUDGET/2),sized(2,PUSH_BUDGET/2)];
 const full=makeMemoryBundle(exact,{repository:'repo'});assert.equal(full.chars,PUSH_BUDGET);assert.equal(full.delivered.length,2);
 exact[1].claim+='x';const folded=makeMemoryBundle(exact,{repository:'repo'});assert.equal(folded.delivered.length,1);assert.equal(folded.lines,memoryRecordLine(exact[0]));assert.equal(folded.omitted.length,1);
 for(const n of [999,1000]) {const b=makeMemoryBundle([sized(1,n)],{repository:'repo'});assert.equal(b.chars,n);assert.ok(b.text.includes(`${n} of ${PUSH_BUDGET} chars`));assert.equal(b.delivered.length,1);}
});
// req: R-3418
await check('B7: seal push budget',async()=>assert.equal((await config()).PUSH_BUDGET,4000));
// req: R-3419
await check('B7: seal part and source order',async()=>{const c=await config();assert.deepEqual(c.PUSH_PART_ORDER,['profile','project']);assert.deepEqual(c.PUSH_SOURCE_ORDER,['saved','extracted']);});
// req: R-3420
await check('B7: seal kind order',async()=>assert.deepEqual((await config()).PUSH_KIND_ORDER,['correction','decision','preference','lesson','fact','thinking']));
// req: R-3421
await check('B7: seal per-call git timeout',async()=>assert.equal((await config()).PUSH_GIT_TIMEOUT_MS,1000));
// req: R-3412
await check('seal printed id length',async()=>assert.equal((await config()).PUSH_ID_CHARS,12));
// req: R-3415
await check('seal deadline test margin',async()=>assert.equal((await config()).PUSH_TEST_MARGIN_MS,1500));
