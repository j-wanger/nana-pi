/**
 * @module packages/nana-pack/tests/memory-run-seals.test.mjs
 * @purpose Pin each automatic making tunable to its requirement contract.
 * @inputs Sealed configuration and temporary local-only fixtures.
 * @outputs Awaited PASS or FAIL lines.
 * @effects disk, process
 * @errors Assertions set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { check } from './profile-fixture.mjs';
import { using } from './memory-run-fixture.mjs';
import * as C from '../lib/memory-run-config.mjs';
import { repositoryFolder, ensureRepository, writeMemoryFile } from '../lib/memory-store.mjs';
import { TIMEOUT_MS } from '../lib/memory-shaping-config.mjs';
import { PROFILE_GIT_TIMEOUT_MS, PROFILE_PATH_POLICY } from '../lib/profile-config.mjs';
import { CLAIM_CAP } from '../lib/memory-making-config.mjs';
// req: R-3298
await check('R-3298: seal start instant',()=>assert.equal(C.START_INSTANT,'2026-10-31T18:16:00Z'));
// req: R-3299
await check('R-3299: seal run tokens',()=>assert.equal(C.RUN_TOKEN_CAP,200000));
// req: R-3300
await check('R-3300: seal run calls',()=>assert.equal(C.RUN_CALL_CAP,20));
// req: R-3301
await check('R-3301: seal day tokens',()=>assert.equal(C.DAY_TOKEN_CAP,1000000));
// req: R-3302
await check('R-3302: seal unknown charge',()=>assert.equal(C.UNKNOWN_USAGE_CHARGE,100000));
// req: R-3303
await check('R-3303: seal derived run time',()=>assert.equal(C.MAX_RUN_MS,(C.RUN_CALL_CAP+1)*TIMEOUT_MS));
// req: R-3304
await check('R-3304: seal derived index age',()=>assert.equal(C.STALE_INDEX_LOCK_MS,2*PROFILE_GIT_TIMEOUT_MS));
// req: R-3305
await check('R-3305: seal evidence cap',()=>{assert.equal(C.EVIDENCE_CAP,1200);assert.equal(C.EVIDENCE_CAP,CLAIM_CAP);});
// req: R-3306
await check('R-3306: seal UTC boundary',()=>assert.equal(C.DAY_BOUNDARY,'UTC'));
// req: R-3307
await check('R-3307: seal root folder length and collision refusal',()=>using(async f=>{
 assert.equal(C.FOLDER_ID_LENGTH,16);const id='a'.repeat(64);assert.equal(repositoryFolder(id),'a'.repeat(16));ensureRepository(f.a.dir,id);
 assert.throws(()=>ensureRepository(f.a.dir,'a'.repeat(16)+'b'.repeat(48)),{message:C.WORDS.collision});
}));
// req: R-3308
await check('R-3308: seal safe immutable store layout for a 64 hex root',()=>using(async f=>{
 assert.deepEqual(C.STORE_LAYOUT,{projects:'projects',repository:'repository.json',records:'records',events:'events',seen:'seen',units:'units',runs:'runs'});
 assert.deepEqual(C.RUN_LAYOUT,{runLock:'nana-memory-<id>.lock',dayLedger:'nana-memory-day.json',dayLock:'nana-memory-day.lock',lastRun:'nana-memory-<id>-last.json',sources:'nana-memory-sources'});
 const id='a'.repeat(64);ensureRepository(f.a.dir,id);const file=writeMemoryFile(f.a.dir,id,C.STORE_LAYOUT.records,'b'.repeat(64),{synthetic:true});
 const relative=path.relative(f.a.dir,file).split(path.sep).join('/');assert.ok(relative.length<=PROFILE_PATH_POLICY.max);assert.match(relative,new RegExp(PROFILE_PATH_POLICY.pattern));assert.equal(JSON.parse(fs.readFileSync(path.join(f.a.dir,'projects',repositoryFolder(id),'repository.json'))).repository,id);
}));
// req: R-3309
await check('R-3309: seal project record fields',()=>assert.deepEqual(C.STORE_FIELDS,['id','type','kind','claim','quote','context','evidence','date','trust','source','roles','validFrom','invalidAt','supersedes','subject','scope','repository']));
// req: R-3340
await check('R-3340: seal opt-in member',()=>assert.equal(C.OPT_IN_MEMBER,'memoryRepositories'));
// req: R-3341
await check('R-3341: seal fixed words',()=>assert.deepEqual(C.WORDS,{
 enabled:'memory: enabled',disabled:'memory: not enabled',shallow:'memory: shallow',unavailable:'memory: unavailable',ci:'memory: ci',role:'memory: role',busy:'memory: busy',failed:'memory: failed',cap:'memory: capped',complete:'memory: complete',malformed:'memory: unclassified',pointer:'memory: profile unavailable',collision:'memory: repository collision',invalid:'memory: invalid command',notStarted:'memory: not started',started:'memory: started',status:'memory: status',never:'never',unknown:'unknown',pending:'pending',done:'done',skipped:'skipped',unclassified:'unclassified',project:'project',scope:'local'
}));
// req: R-3342
await check('R-3342: seal anchored escaped lane folder pattern',()=>{assert.equal(C.LANE_FOLDER_SUFFIX,'-\\d{4}-\\d{2}-\\d{2}$');assert.equal(C.laneFolderPattern('memory.x').source,'^memory\\.x-\\d{4}-\\d{2}-\\d{2}$');});
