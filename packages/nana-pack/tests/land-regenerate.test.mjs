/**
 * @module packages/nana-pack/tests/land-regenerate.test.mjs
 * @purpose Pin generated-only merge regeneration, private checkout boundaries and the sealed generator contract.
 * @inputs Real temporary Git repositories, actual generators and injected generator contracts.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { check } from './profile-fixture.mjs';
import { regenerateFixture, computeCleanMerge, mergeSnapshot, commit, git, gitRunner, generatorRun, separateGeneratedHunks } from './land-fixtures.mjs';
import * as C from '../lib/land-config.mjs';

const outputs=['docs/code-map.md','docs/requirements-tree.md'];
const refresh=f=>{f.tip=git(f.feature,'rev-parse','HEAD');f.capturedMain=git(f.main,'rev-parse','HEAD');};
const registrations=f=>git(f.main,'worktree','list','--porcelain');
const refuse=(f, reason, options={})=>{
 const before=mergeSnapshot(f), registered=registrations(f);
 const out=computeCleanMerge(f,options);
 assert.equal(out.code,1,out.text); assert.match(out.text,reason);
 assert.deepEqual(mergeSnapshot(f),before); assert.equal(registrations(f),registered); assert.equal(out.suites,0);
 return out;
};
const injected=(write,check='process.exit(0)')=>[{path:outputs[0],write:['-e',write],check:['-e',check]}];
const writeOutput=`require('node:fs').writeFileSync('docs/code-map.md','rebuilt\\n');`;
const observe=()=>{
 const dirs=[];
 return {dirs,runGenerator:(argv,cwd,options)=>{dirs.push(cwd);return generatorRun(cwd,argv,options);}};
};
const cleaned=o=>{assert(o.dirs.length>0,'generator reached');for(const dir of o.dirs)assert(!fs.existsSync(dir),dir);};

// req: R-3706, R-3831
await check('M1: generated-only conflicts land actual generator bytes and preserve the merged sources',()=>{
 for(const conflicts of [[outputs[0]],[outputs[1]],outputs]) {
  const f=regenerateFixture('m1',conflicts), registered=registrations(f), source=git(f.feature,'rev-parse','HEAD');
  const out=computeCleanMerge(f); assert.equal(out.code,0,out.text); assert.equal(out.suites,0);
  assert.equal(git(f.feature,'rev-parse','HEAD'),source);assert.equal(git(f.feature,'status','--porcelain'),'');
  assert.equal(registrations(f).replace(/HEAD [0-9a-f]+/g,'HEAD'),registered.replace(/HEAD [0-9a-f]+/g,'HEAD'));
  for(const file of outputs)assert.equal(gitRunner(f.main,['show',`${out.tree}:${file}`]).stdout,f.expected[file]);
  const sourceEntries=(dir,tree)=>git(dir,'ls-tree','-r',tree).split(/\r?\n/).filter(line=>!outputs.includes(line.split('\t')[1]));
  assert.deepEqual(sourceEntries(f.main,out.tree),sourceEntries(f.oracle,'HEAD'));
  assert.match(out.text,/regenerated:/);for(const file of conflicts)assert(out.text.includes(file));
 }
});

// req: R-3707
await check('M2: non-contract and rename conflicts refuse while contract modify-delete regenerates',()=>{
 for(const mixed of [false,true]) {
  const f=regenerateFixture('m2',mixed?outputs:[]);
  commit(f.feature,'base.txt','lane\n','lane conflict');commit(f.main,'base.txt','main\n','main conflict');refresh(f);
  refuse(f,/merge conflict.*base.txt/);
 }
 const renamed=regenerateFixture('m2-rename');
 for(const [dir,destination] of [[renamed.main,'docs/renamed.md'],[renamed.feature,'docs/other.md']]) {
  fs.writeFileSync(path.join(dir,outputs[0]),git(dir,'show',`${renamed.base}:${outputs[0]}`)+'\n');
  git(dir,'add',outputs[0]);git(dir,'mv',outputs[0],destination);git(dir,'commit','-m','rename destination');
 }
 refresh(renamed);
 refuse(renamed,/merge conflict.*docs\/renamed.md/);
 const deleted=regenerateFixture('m2-delete',[outputs[0]]);
 git(deleted.main,'rm',outputs[0]);git(deleted.main,'commit','-m','delete generated');refresh(deleted);
 const out=computeCleanMerge(deleted);assert.equal(out.code,0,out.text);
 assert.equal(gitRunner(deleted.main,['show',`${out.tree}:${outputs[0]}`]).stdout,deleted.expected[outputs[0]]);
});

// req: R-3708
await check('M3: failed timed-out and post-write checks refuse and remove only owned temporary state',()=>{
 for(const kind of ['fail','timeout','check']) {
  const f=regenerateFixture(`m3-${kind}`,[outputs[0]]),o=observe();
  // Keep an unrelated stale registration: cleanup must never prune it.
  const stale=path.join(f.root,'stale');git(f.main,'worktree','add','--detach',stale,f.base);fs.rmSync(stale,{recursive:true,force:true});
  const write=kind==='fail'?'process.exit(7)':kind==='timeout'?'setTimeout(()=>{},60000)':writeOutput;
  refuse(f,kind==='check'?/generatorCheck/:/generatorFailed/,{generatorContract:injected(write,kind==='check'?'process.exit(8)':'process.exit(0)'),generatorTimeoutMs:kind==='timeout'?20:C.GENERATOR_TIMEOUT_MS,runGenerator:o.runGenerator});
  cleaned(o);
 }
});

// req: R-3709
await check('M4: scope guard catches tracked index-only untracked ignored and configured escapes',()=>{
 for(const kind of ['write','delete','untracked','ignored','index','staged','output','root','target']) {
  const f=regenerateFixture(`m4-${kind}`,[outputs[0]]),o=observe();let effect='';
  if(kind==='ignored'){commit(f.feature,'.gitignore','ignored.tmp\n','ignore');effect="require('node:fs').writeFileSync('ignored.tmp','extra');";}
  if(kind==='write')effect="require('node:fs').writeFileSync('base.txt','extra');";
  if(kind==='delete')effect="require('node:fs').unlinkSync('base.txt');";
  if(kind==='untracked')effect="require('node:fs').writeFileSync('extra.tmp','extra');";
  if(kind==='index')effect="require('node:child_process').execFileSync('git',['update-index','--force-remove','base.txt']);";
  if(kind==='staged')effect="require('node:fs').writeFileSync('base.txt','extra');require('node:child_process').execFileSync('git',['add','base.txt']);";
  if(['output','root'].includes(kind)) {
   const config=JSON.parse(fs.readFileSync(path.join(f.feature,'code-map.config.json'),'utf8'));
   if(kind==='output')config.mapPath='../escape.md';else config.roots=['../escape'];
   commit(f.feature,'code-map.config.json',JSON.stringify(config),'escaping config');
  }
  if(kind==='target')commit(f.feature,'scripts/requirements-tree.mjs',fs.readFileSync(path.join(f.feature,'scripts/requirements-tree.mjs'),'utf8').replace('const target = resolve(REPO_ROOT, "docs/requirements-tree.md")','const target = resolve(REPO_ROOT, "../escape.md")'),'escaping target');
  refresh(f);
  const out=refuse(f,/generatorScope/,{generatorContract:injected(writeOutput+effect),runGenerator:o.runGenerator});
  if(['output','root','target'].includes(kind))assert.equal(o.dirs.length,0,'guard runs before generator');
  else {cleaned(o);assert(out.text.includes(kind==='ignored'?'ignored.tmp':kind==='untracked'?'extra.tmp':'base.txt'),out.text);}
 }
});

// req: R-3710
await check('M5: sealed Node argv ignores npm scripts and replaces decoys across line transports',()=>{
 for(const transport of ['crlf','space','no-final']) {
  const f=regenerateFixture(`m5-${transport}`,[outputs[0]]),o=observe();
  commit(f.feature,'package.json',JSON.stringify({scripts:{map:'node -e "require(\'fs\').writeFileSync(\'npm-ran\',\'bad\')"'}}),'npm decoy');refresh(f);
  const out=computeCleanMerge(f,{runGenerator:(argv,cwd,options)=>{
   assert(C.GENERATOR_CONTRACT.some(entry=>[entry.write,entry.check].some(value=>JSON.stringify(value)===JSON.stringify(argv))));
   assert.equal(options.shell,false);assert.equal(options.timeout,C.GENERATOR_TIMEOUT_MS);
   return o.runGenerator(argv,cwd,options);
  },runGit:(cwd,args)=>{
   const r=gitRunner(cwd,args);if(!args.includes('merge-tree'))return r;
   const lines=r.stdout.trimEnd().split(/\r?\n/);
   return {...r,stdout:transport==='crlf'?lines.join('\r\n')+'\r\n':transport==='space'?lines.map(x=>x+' \t').join('\n')+'\n':lines.join('\n')};
  }});
  assert.equal(out.code,0,out.text);cleaned(o);
  assert.equal(gitRunner(f.main,['show',`${out.tree}:${outputs[0]}`]).stdout,f.expected[outputs[0]]);assert(!fs.existsSync(path.join(f.main,'npm-ran')));
 }
});

// req: R-3829
await check('both-sides clean generator failures timeout and scope changes refuse unchanged',()=>{
 for(const kind of ['failure','timeout','scope']) {
  const f=regenerateFixture(`both-${kind}`,[]),o=observe();
  assert.equal(separateGeneratedHunks(f).status,0);
  const write=kind==='failure'?'process.exit(7)':kind==='timeout'?'setTimeout(()=>{},60000)':writeOutput+"require('node:fs').writeFileSync('base.txt','extra');";
  refuse(f,kind==='scope'?/generatorScope/:/generatorFailed/,{generatorContract:injected(write),generatorTimeoutMs:kind==='timeout'?20:C.GENERATOR_TIMEOUT_MS,runGenerator:o.runGenerator});
  cleaned(o);
 }
});

// req: R-3833
await check('mixed conflict and clean both-sides outputs land both generator oracles',()=>{
 const f=regenerateFixture('mixed',[outputs[0]]);
 assert.equal(separateGeneratedHunks(f,[outputs[1]]).status,1);
 const out=computeCleanMerge(f);assert.equal(out.code,0,out.text);assert.equal(out.suites,0);
 for(const file of outputs)assert.equal(gitRunner(f.main,['show',`${out.tree}:${file}`]).stdout,f.expected[file]);
 const sourceEntries=(dir,tree)=>git(dir,'ls-tree','-r',tree).split(/\r?\n/).filter(line=>!outputs.includes(line.split('\t')[1]));
 assert.deepEqual(sourceEntries(f.main,out.tree),sourceEntries(f.oracle,'HEAD'));
});

// req: R-3711
await check('M6: generator contract argv timeout and refusal vocabulary are sealed',()=>{
 assert.deepEqual(C.GENERATOR_CONTRACT,[
  {path:'docs/code-map.md',write:['scripts/code-map.mjs','--write'],check:['scripts/code-map.mjs','--check']},
  {path:'docs/requirements-tree.md',write:['scripts/requirements-tree.mjs','--write'],check:['scripts/requirements-tree.mjs','--check']},
 ]);
 assert.equal(C.GENERATOR_TIMEOUT_MS,30000);
 assert.deepEqual(C.GENERATOR_REASONS,{generatorFailed:'generatorFailed',generatorCheck:'generatorCheck',generatorScope:'generatorScope'});
 assert(Object.isFrozen(C.GENERATOR_CONTRACT));assert(Object.isFrozen(C.GENERATOR_REASONS));
 for(const entry of C.GENERATOR_CONTRACT)for(const value of [entry,entry.write,entry.check])assert(Object.isFrozen(value));
});
