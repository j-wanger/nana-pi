/**
 * @module packages/nana-pack/tests/land-clean-merge-race.test.mjs
 * @purpose Pin clean-merge checkout races, changing CI snapshots and cooperating lands.
 * @inputs Temporary synthetic Git repositories, injected Git and CI calls.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { check } from './profile-fixture.mjs';
import { cleanMergeFixture, executeCleanMerge, mergeSnapshot, commit, git, gitRunner, tree, workflowRun, runList } from './land-fixtures.mjs';
import * as C from '../lib/land-config.mjs';

// req: R-3694
await check('M7: checkout and CI races refuse, cooperating lands serialize and rerun safely', () => {
 for(const kind of ['main','source','dirt','branch','queued','failed','identity']) {
  const f=cleanMergeFixture(`m7-${kind}`); let ready=false, fired=false, expected=mergeSnapshot(f), lists=0;
  const out=executeCleanMerge(f,{
   afterGh:(args,_calls,result)=>{
    if(args[0]==='run'&&args[1]==='download') ready=true;
    if(args.at(-1).includes('/actions/runs?')) {
     lists++;
     if(lists===3 && ['queued','failed','identity'].includes(kind)) {
      fired=true;
      return {status:0,stdout:runList([workflowRun(kind==='queued'?{run_attempt:2,status:'queued',conclusion:null}:kind==='failed'?{conclusion:'failure'}:{id:102,run_number:2})])};
     }
    }
    return result;
   },
   runGit:(cwd,args)=>{
    if(ready&&!fired&&!['queued','failed','identity'].includes(kind)) {
     fired=true;
     if(kind==='main') commit(f.main,'racer.txt','racer\n','racer main');
     if(kind==='source') commit(f.feature,'racer.txt','racer\n','racer source');
     if(kind==='dirt') fs.writeFileSync(path.join(f.main,'base.txt'),'racer dirt\n');
     if(kind==='branch') git(f.main,'checkout','-b','other');
     expected=mergeSnapshot(f);
    }
    return gitRunner(cwd,args);
   },
  });
  assert(fired,`${kind} injection must run`); assert.equal(out.code,1,out.text); assert.equal(out.suites,0);
  assert.deepEqual(mergeSnapshot(f),expected,kind);
  if(['queued','failed','identity'].includes(kind)) assert(out.text.includes(C.CLEAN_MERGE_REASONS.ciChanged),out.text);
 }
 const first=cleanMergeFixture('m7-two');
 const second={...first,feature:tree(first.main,'second'),reviewed:null};
 // Second lane branches from the original common base, not captured main.
 git(second.feature,'reset','--hard',first.base);
 second.tip=commit(second.feature,'second.txt','second\n','second lane');
 let firstOut, mergedFirst;
 const secondOut=executeCleanMerge(second,{afterGh:args=>{
  if(!firstOut&&args[0]==='run'&&args[1]==='download') {
   firstOut=executeCleanMerge(first); assert.equal(firstOut.code,0,firstOut.text);
   mergedFirst=git(first.main,'rev-parse','HEAD');
  }
 }});
 assert(firstOut,'first land must run during second CI read'); assert.equal(secondOut.code,1,secondOut.text);
 assert.equal(git(first.main,'rev-parse','HEAD'),mergedFirst);
 assert.equal(git(second.feature,'rev-parse','HEAD'),second.tip);
 assert.equal(git(first.main,'status','--porcelain'),''); assert.equal(git(second.feature,'status','--porcelain'),'');
 const retry=executeCleanMerge(second); assert.equal(retry.code,0,retry.text);
 assert.deepEqual(git(first.main,'show','-s','--format=%P','HEAD').split(' '),[second.tip,mergedFirst]);
});
