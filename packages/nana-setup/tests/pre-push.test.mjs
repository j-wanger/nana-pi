/**
 * @module packages/nana-setup/tests/pre-push.test.mjs
 * @purpose Pin the pre-push identity/privacy safety line with installed hooks in scratch clones only.
 * @inputs Scratch source repositories, bare remotes, planted identity digests and bounded git pushes.
 * @outputs Awaited bounded PASS/FAIL cases without matched text or machine paths.
 * @effects disk (OS-temp fixtures only), process (bounded git and hook children)
 * @errors Assertions set exit 1; child output is never printed.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { tmpDir } from './tmp-dir.mjs';
import { stepPrePush, PRE_PUSH_MARKER } from '../lib/steps.mjs';
import { runPrePush } from '../../nana-pack/bin/leak-scan.mjs';
import { scanCommitRange } from '../../nana-pack/lib/leak-scan.mjs';
import { LEAK_FILE_MAX_BYTES } from '../../nana-pack/lib/leak-scan-config.mjs';

const root = fileURLToPath(new URL('../../../',import.meta.url));
const temp = tmpDir(path.join(os.tmpdir(),'pre-push-'));
const word = 'quux';
const config = {wordDigests:[createHash('sha256').update(word).digest('hex')],wordLengths:[word.length],allowlist:[]};
const zero = '0'.repeat(40);
let failures = 0, serial = 0;
async function check(title, fn) {
  let timer;
  try {
    await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error()),60000);})]);
    console.log('PASS',title);
  } catch { failures++; console.log('FAIL',title); }
  finally { clearTimeout(timer); }
}
function run(cwd,args,env={}) {
  const result=spawnSync('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','-c','tag.gpgsign=false',...args],{cwd,encoding:'utf8',timeout:20000,env:{...process.env,...env}});
  assert.equal(result.error,undefined);
  return result;
}
function git(cwd,...args) {const result=run(cwd,args);assert.equal(result.status,0);return result.stdout.trim();}
function put(cwd,file,text) {const target=path.join(cwd,file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,text);}
function commit(cwd,text='clean',options=[]) {put(cwd,'fixture.log',text);git(cwd,'add','.');git(cwd,...options,'commit','--allow-empty','-qm','fixture');return git(cwd,'rev-parse','HEAD');}
function fixture() {
  const folder=path.join(temp,`fixture-${++serial}`), source=path.join(folder,'source'), bare=path.join(folder,'remote.git'), cwd=path.join(folder,"checkout $literal's");
  fs.mkdirSync(source,{recursive:true});git(source,'init','-q','-b','main');
  for (const file of ['packages/nana-pack/bin/leak-scan.mjs','packages/nana-pack/lib/leak-scan.mjs','packages/nana-pack/lib/leak-scan-config.mjs','packages/nana-pack/lib/real-path.mjs','scripts/identity-scan.mjs']) put(source,file,fs.readFileSync(path.join(root,file)));
  put(source,'identity-scan.config.json',JSON.stringify(config));
  const base=commit(source);
  git(source,'init','--bare','-q',bare);git(source,'remote','add','origin',bare);git(source,'push','-q','origin','main');git(source,'--git-dir',bare,'symbolic-ref','HEAD','refs/heads/main');
  git(source,'clone','-q',bare,cwd);
  const home=path.join(folder,'private-home');fs.mkdirSync(home);
  const hook=path.join(cwd,'.git','hooks','pre-push');
  return {cwd,base,bare,hook,home};
}
function install(f) {const result=stepPrePush({repository:f.cwd});assert.equal(result[0].status,'created');}
function push(f,...args) {return run(f.cwd,['push','origin',...args],{HOME:f.home,USERPROFILE:f.home});}
function diagnostics(result) {return `${result.stdout}\n${result.stderr}`.split(/\r?\n/).filter(line=>line.startsWith('leak'));}
function blocked(result,kind='identity word 0') {
  assert.equal(result.status,1);
  const lines=diagnostics(result);
  assert.ok(lines.some(line=>line.startsWith('leak: ') && line.includes(kind)));
  assert.ok(lines.every(line=>!line.includes(word) && !line.includes(temp) && !line.includes(os.homedir())));
}
function pre(f,input,remote='origin') {
  let text=''; const stream={write:value=>text+=value};
  const status=runPrePush([remote],{cwd:f.cwd,input,config,home:'/private-home-fixture',tmp:'/scratch-fixture',stdout:stream,stderr:stream});
  return {status,text};
}
try {
  // req: R-4020
  await check('hook install without an explicit repository skips all repository writes',()=>{
    assert.deepEqual(stepPrePush(),[{label:'git pre-push leak scan',status:'skipped',detail:'no repository explicitly named'}]);
  });
  // req: R-4017
  await check('setup shim quotes literal paths and preserves foreign hooks and worktrees',()=>{
    const f=fixture();install(f);
    const shim=fs.readFileSync(f.hook,'utf8');
    assert.equal(shim.split('\n').length,4);assert.ok(shim.startsWith(`#!/bin/sh\n${PRE_PUSH_MARKER}\n`));assert.ok(!shim.includes('\r'));
    assert.ok(shim.includes("'\\''"));assert.ok(shim.includes('$literal'));
    if (process.platform!=='win32') assert.equal(fs.statSync(f.hook).mode&0o777,0o755);
    assert.equal(stepPrePush({repository:f.cwd})[0].status,'unchanged');
    const lane=path.join(path.dirname(f.cwd),'lane');git(f.cwd,'worktree','add','-qb','lane',lane);
    assert.match(stepPrePush({repository:lane})[0].detail,/linked worktree/);assert.equal(fs.readFileSync(f.hook,'utf8'),shim);
    fs.writeFileSync(f.hook,'#!/bin/sh\nexit 0\n');
    assert.match(stepPrePush({repository:f.cwd})[0].detail,/no setup marker/);assert.equal(fs.readFileSync(f.hook,'utf8'),'#!/bin/sh\nexit 0\n');
    git(f.cwd,'config','core.hooksPath',path.join(temp,'foreign-hooks'));
    assert.match(stepPrePush({repository:f.cwd})[0].detail,/core.hooksPath/);
  });
  // req: R-4018
  await check('installed hook blocks planted blob author and annotated tag identity without echoing it',()=>{
    const f=fixture();install(f);
    commit(f.cwd,word);blocked(push(f,'main'));git(f.cwd,'reset','--hard',f.base);
    commit(f.cwd,'clean',['-c',`user.name=${word}`]);const author=push(f,'main');blocked(author);assert.ok(diagnostics(author).some(line=>line.includes('(commit metadata)')));git(f.cwd,'reset','--hard',f.base);
    commit(f.cwd);assert.equal(push(f,'main').status,0);
    git(f.cwd,'tag','-a','message-tag','-m',word);const tag=push(f,'message-tag');blocked(tag);assert.ok(diagnostics(tag).some(line=>line.includes('(tag metadata)')));assert.ok(diagnostics(tag).some(line=>line.includes('0 commits scanned')));
    git(f.cwd,'-c',`user.name=${word}`,'tag','-a','tagger-tag','-m','fixture');blocked(push(f,'tagger-tag'));
  });
  // req: R-4018 R-4021
  await check('installed hook allows clean commit new branch and delete with visible range counts',()=>{
    const f=fixture();install(f);commit(f.cwd);
    const clean=push(f,'main');assert.equal(clean.status,0);assert.ok(diagnostics(clean).some(line=>line.includes('1 commits scanned')));
    const branch=push(f,'HEAD:refs/heads/new-branch');assert.equal(branch.status,0);assert.ok(diagnostics(branch).some(line=>line.includes('0 commits scanned')));
    const deletion=push(f,':refs/heads/new-branch');assert.equal(deletion.status,0);assert.deepEqual(diagnostics(deletion),['leak scan ref 1: deletion skipped']);
  });
  // req: R-4019
  await check('commit author committer and full message use shared identity and machine path counters',()=>{
    const f=fixture();
    const identity={GIT_AUTHOR_NAME:word,GIT_AUTHOR_EMAIL:`${word}@example.invalid`,GIT_COMMITTER_NAME:word,GIT_COMMITTER_EMAIL:`${word}@example.invalid`};
    put(f.cwd,'fixture.log','clean');git(f.cwd,'add','.');
    const result=run(f.cwd,['commit','--allow-empty','-qm',`fixture\n\n${word}\n/private-home-fixture/log\n/scratch-fixture/log \t\r\n`],identity);assert.equal(result.status,0);
    const scanned=scanCommitRange({cwd:f.cwd,base:f.base,tip:'HEAD',config,home:'/private-home-fixture',tmp:'/scratch-fixture'});
    assert.deepEqual(scanned.hits.map(({path,kind,count})=>({path,kind,count})),[{path:'(commit metadata)',kind:'identity',count:5},{path:'(commit metadata)',kind:'home',count:1},{path:'(commit metadata)',kind:'temp',count:1}]);
    assert.ok(!JSON.stringify(scanned).includes(word));
  });
  // req: R-4021
  await check('pre-push handles CRLF trailing blanks and final lines and refuses unscannable ranges',()=>{
    const f=fixture();const tip=commit(f.cwd);
    for (const ending of ['\n',' \t\r\n','']) {
      const r=pre(f,`refs/heads/main ${tip} refs/heads/main ${f.base}${ending}`);assert.equal(r.status,0);assert.match(r.text,/1 commits scanned/);
    }
    assert.equal(pre(f,`refs/heads/new ${tip} refs/heads/new ${zero}`).status,0);
    const missing=pre(f,`refs/heads/new ${tip} refs/heads/new ${zero}`,'absent');assert.equal(missing.status,2);assert.match(missing.text,/no local remote commit or remote main base/);
    const blob=git(f.cwd,'rev-parse','HEAD:fixture.log');
    const unsupported=pre(f,`refs/tags/blob ${blob} refs/tags/blob ${zero}`);assert.equal(unsupported.status,2);assert.match(unsupported.text,/unsupported pushed object type/);
    git(f.cwd,'tag','-a','blob-tag',blob,'-m','fixture');const tag=git(f.cwd,'rev-parse','blob-tag');assert.equal(pre(f,`refs/tags/blob-tag ${tag} refs/tags/blob-tag ${zero}`).status,2);
    assert.equal(pre(f,'malformed \t\r\n').status,2);
    put(f.cwd,'oversized.log','x'.repeat(LEAK_FILE_MAX_BYTES+1));git(f.cwd,'add','.');git(f.cwd,'commit','-qm','fixture');
    const skip=pre(f,`refs/heads/main ${git(f.cwd,'rev-parse','HEAD')} refs/heads/main ${tip}`);assert.equal(skip.status,1);assert.match(skip.text,/leak scan skipped:/);
  });
} finally { fs.rmSync(temp,{recursive:true,force:true}); }
process.exitCode=failures?1:0;
