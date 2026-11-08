/**
 * @module packages/nana-pack/tests/records-move.test.mjs
 * @purpose Pin protected record derivation and whole-folder preservation on temporary git repositories.
 * @inputs Synthetic tracked references, dated commits and records policy.
 * @outputs Awaited bounded PASS or FAIL cases.
 * @effects disk, process
 * @errors Assertions set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpDir } from "./tmp-dir.mjs";
import { check } from './profile-fixture.mjs';
import { deriveProtected, checkRecords, POLICY } from '../../../scripts/records-move.mjs';
import { checkReviewArchive, REPO_ROOT } from '../../../scripts/readme-check.mjs';
import { produceObjective } from '../lib/objective.ts';

function fixture(fn) {
 const root=tmpDir(path.join(os.tmpdir(),'records-move-'));
 const git=(...args)=>{const r=spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:20000,env:{...process.env,GIT_AUTHOR_NAME:'Example',GIT_AUTHOR_EMAIL:'example@example.invalid',GIT_COMMITTER_NAME:'Example',GIT_COMMITTER_EMAIL:'example@example.invalid',GIT_AUTHOR_DATE:'2026-10-20T12:00:00Z',GIT_COMMITTER_DATE:args.find(a=>a.startsWith('--date='))?.slice(7)??'2026-10-20T12:00:00Z'}});assert.equal(r.status,0,r.stderr);return r.stdout.trim();};
 const put=(file,text)=>{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),text);};
 try {git('init','--initial-branch=main');return fn({root,git,put});} finally {fs.rmSync(root,{recursive:true,force:true});}
}
// req: R-3928, R-3929
await check('M1: derive protections and reject missing or excess folders',()=>{
 if(fs.existsSync(path.join(REPO_ROOT,'docs/reviews/README.md')))assert.deepEqual(checkRecords(REPO_ROOT).problems,[]);
 return fixture(({root,git,put})=>{
 const names=['full-2026-10-01','bare-2026-10-01','tranche1-2026-09-28','tranche2-2026-09-28','unique-2026-10-01','recent-2026-10-01','discard-2026-10-01','ci-packs-2026-11-08','ambiguous-a','ambiguous-b','windows-2026-10-01'];
 for(const name of names)put(`docs/reviews/${name}/common.md`,'record');
 put('docs/reviews/unique-2026-10-01/only-here.txt','unique');
 put('docs/sessions/archive.md','discard-2026-10-01');
 put('docs/reviews/ambiguous-a/notes.md','discard-2026-10-01');
 put('refs.md','seed');git('add','.');git('commit','-m','old');
 put('docs/reviews/recent-2026-10-01/common.md','recent');git('add','.');git('commit','--date=2026-11-02T12:00:00Z','-m','recent');
 const policy={...POLICY,baseline:git('rev-parse','HEAD')};
 for(const [eol,final] of [['\r\n',true],['\n',false]]) {
  put('refs.md',['docs/reviews/full-2026-10-01/common.md','bare-2026-10-01','tranche{1,2}-2026-09-28','only-here.txt','common.md','docs\\reviews\\windows-2026-10-01\\common.md'].map(s=>s+' \t').join(eol)+(final?eol:''));
  const result=deriveProtected(root,policy);
  assert.deepEqual([...result.protected.keys()].sort(),names.filter(n=>!['discard-2026-10-01','ci-packs-2026-11-08','ambiguous-a','ambiguous-b'].includes(n)).sort());
 }
 assert.ok(checkRecords(root,policy).problems.some(p=>p.includes('unprotected')&&p.includes('discard-')));
 assert.ok(checkRecords(root,policy).problems.some(p=>p.includes('unprotected')&&p.includes('ci-packs-')));
 git('rm','-r','-q','--','docs/reviews/discard-2026-10-01','docs/reviews/ambiguous-a','docs/reviews/ambiguous-b','docs/reviews/ci-packs-2026-11-08');
 assert.deepEqual(checkRecords(root,policy).problems,[]);
 git('rm','-r','-q','--','docs/reviews/bare-2026-10-01');
 assert.ok(checkRecords(root,policy).problems.some(p=>p.includes('missing')&&p.includes('bare-')));
 });
});
// req: R-3929
await check('folders created after the pre-move commit pass',()=>fixture(({root,git,put})=>{
 put('seed.md','baseline');git('add','.');git('commit','-m','before');
 const policy={...POLICY,baseline:git('rev-parse','HEAD')};
 put('docs/reviews/packs-win-skip/record.md','new record');git('add','.');git('commit','-m','after');
 assert.deepEqual(checkRecords(root,policy).problems,[]);
}));
// req: R-3930
await check('M2: protected folders keep all tracked paths and blobs',()=>fixture(({root,git,put})=>{
 put('docs/reviews/kept-2026-10-01/a.md','first');put('docs/reviews/kept-2026-10-01/b.md','second');put('refs.md','kept-2026-10-01');git('add','.');git('commit','-m','before');
 const policy={...POLICY,baseline:git('rev-parse','HEAD')};
 assert.deepEqual(checkRecords(root,policy).problems,[]);
 put('docs/reviews/kept-2026-10-01/a.md','changed');git('add','.');
 assert.ok(checkRecords(root,policy).problems.some(p=>p.includes('changed')));
 git('checkout',policy.baseline,'--','docs/reviews');git('rm','-q','--','docs/reviews/kept-2026-10-01/b.md');
 assert.ok(checkRecords(root,policy).problems.some(p=>p.includes('changed')));
 git('checkout',policy.baseline,'--','docs/reviews');put('docs/reviews/kept-2026-10-01/c.md','extra');git('add','.');
 assert.ok(checkRecords(root,policy).problems.some(p=>p.includes('changed')));
}));
// req: R-3931
await check('M3: archive README command lists and reads removed records',()=>{
 const text=fs.readFileSync(path.join(REPO_ROOT,'docs/reviews/README.md'),'utf8');
 assert.match(text,/git show [a-f0-9]{40}:docs\/reviews\//u);
 assert.deepEqual(checkReviewArchive(REPO_ROOT),[]);
 fixture(({root,put})=>{
  put('docs/reviews/README.md',text.replaceAll(/\b[a-f0-9]{40}\b/gu,'0'.repeat(40)));
  assert.ok(checkReviewArchive(root).length>0,'an unreadable archive must fail');
 });
});
// req: R-3933
await check('M5: objective prints the full code-lines priority',()=>fixture(({root,put})=>{
 const text=fs.readFileSync(path.join(REPO_ROOT,'OBJECTIVE.md'),'utf8');
 const priority=text.split(/\r?\n/u).find(line=>line.startsWith('**Current priority'));
 assert.ok(priority.includes('net code lines removed from packages, apps, scripts and templates since 2026-11-07'));
 put('OBJECTIVE.md',text);
 const output=produceObjective(root,{path:null});
 assert.equal(output.unavailable,false);
 assert.ok(output.text.includes(priority),'full priority survives the output cap');
}));
// req: R-3934
await check('records policy seal',()=>{
 assert.equal(POLICY.baseline,'3c3bd610853bd00bcaac5dab61528eb0eb4714f7');
 assert.equal(POLICY.since,'2026-11-01');
});
