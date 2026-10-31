/**
 * @module packages/nana-pack/tests/profile-sync.test.mjs
 * @purpose Pin append-only cross-machine convergence and offline concurrent recovery.
 * @inputs Synthetic temp clones, local bare remotes and stubbed gh.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Failed assertions set exit 1.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import assert from 'node:assert/strict';
import { check,fixture,ok,files,records,save } from './profile-fixture.mjs';
// req: R-3235
await check('two machines converge without a merge',async()=>{
 const C=await import('../lib/profile-config.mjs'); const S=await import('../lib/profile-store.mjs'); const t=fixture();
 try {
  const a=t.clone('a'); ok(a.run(['init','--dir',a.dir,'--save'])); const b=t.clone('b'); ok(b.run(['init','--dir',b.dir,'--save'])); t.git(b.dir,'config','core.autocrlf','true');
  fs.renameSync(t.bare,`${t.bare}.away`);
  for(const f of [a,b]) {for(let i=0;i<3;i++) ok(save(f,`${path.basename(f.dir)} claim ${i}`)); ok(save(f,'Shared claim',`${path.basename(f.dir)} new words`,{CLAUDE_SESSION_ID:path.basename(f.dir)}));}
  fs.renameSync(`${t.bare}.away`,t.bare);
  ok(a.run(['sync'])); ok(b.run(['sync'])); ok(a.run(['sync']));
  for(const f of [a,b]) {
   assert.equal(records(f.dir).length,8); assert.equal(S.effectiveState(records(f.dir),[]).filter(r=>r.live).length,7);
   assert.equal(records(f.dir).filter(r=>r.claim==='Shared claim').length,2); assert.equal(t.git(f.dir,'status','--porcelain'),'');
   const paths=t.git(f.dir,'ls-files').split('\n'); for(const p of paths) {assert.match(p,new RegExp(C.PROFILE_PATH_POLICY.pattern));assert.ok(p.length<=C.PROFILE_PATH_POLICY.max);}
   assert.equal(new Set(paths.map(x=>x.toLowerCase())).size,paths.length);
   const gitdir=t.git(f.dir,'rev-parse','--absolute-git-dir'); assert.equal(fs.existsSync(path.join(gitdir,'rebase-merge')),false);
  }
  const left=files(a.dir).map(p=>fs.readFileSync(p)); const right=files(b.dir).map(p=>fs.readFileSync(p)); assert.deepEqual(left,right);
 } finally {t.close();}
});
// req: R-3236
await check('offline contention and a stopped rebase lose nothing',async()=>{
 const C=await import('../lib/profile-config.mjs'); const t=fixture();
 try {
  const a=t.clone('a'); ok(a.run(['init','--dir',a.dir,'--save'])); const b=t.clone('b'); ok(b.run(['init','--dir',b.dir,'--save']));
  fs.renameSync(t.bare,`${t.bare}.away`); const head=t.git(a.dir,'rev-parse','HEAD'); const out=ok(save(a,'Offline claim')); assert.ok(out.includes(`${C.PROFILE_WORDS.notPushed}offline`)); assert.equal(out.includes(t.temp),false); assert.equal(out.includes(a.remote),false); assert.notEqual(t.git(a.dir,'rev-parse','HEAD'),head); assert.notEqual(a.run(['sync']).status,0);
  fs.renameSync(`${t.bare}.away`,t.bare); ok(a.run(['sync'])); ok(b.run(['sync'])); assert.equal(records(b.dir).length,1);
  const runs=await Promise.all([a.asyncRun(['save','--kind','fact','--claim','Concurrent one','--quote','One']),a.asyncRun(['save','--kind','fact','--claim','Concurrent two','--quote','Two'])]); runs.forEach(ok); assert.equal(t.git(a.dir,'status','--porcelain'),''); ok(b.run(['sync'])); assert.equal(records(b.dir).length,3);
  // Stop a genuine rebase on an unrelated file; sync must abort before touching the store.
  fs.writeFileSync(path.join(a.dir,'outside'),'base'); t.git(a.dir,'add','outside');t.git(a.dir,'commit','-m','base'); const base=t.git(a.dir,'rev-parse','HEAD');
  t.git(a.dir,'checkout','-b','other'); fs.writeFileSync(path.join(a.dir,'outside'),'other');t.git(a.dir,'commit','-am','other');
  t.git(a.dir,'checkout','main');fs.writeFileSync(path.join(a.dir,'outside'),'main');t.git(a.dir,'commit','-am','main');
  const {spawnSync}=await import('node:child_process'); const stopped=spawnSync('git',['rebase','other'],{cwd:a.dir,env:t.env,encoding:'utf8'}); assert.notEqual(stopped.status,0); assert.ok(base);
  const recovered=ok(a.run(['sync'])); assert.ok(recovered.includes(C.PROFILE_WORDS.recovered)); assert.equal(records(a.dir).length,3); assert.equal(t.git(a.dir,'status','--porcelain'),'');
 } finally {t.close();}
});
