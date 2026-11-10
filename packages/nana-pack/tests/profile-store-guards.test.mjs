/**
 * @module packages/nana-pack/tests/profile-store-guards.test.mjs
 * @purpose Pin private push-target verification and role refusal before pointer reads.
 * @inputs Synthetic temp homes, local remotes and stubbed gh.
 * @outputs Awaited bounded PASS/FAIL cases.
 * @effects disk, process
 * @errors Failed assertions set exit 1.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { check, fixture, ok, refused, save, root } from './profile-fixture.mjs';
import { USER_KIND_WORDS } from '../lib/profile-config.mjs';
const [, , , fact] = USER_KIND_WORDS;
const config = () => import('../lib/profile-config.mjs');
const init = f => ok(f.run(['init','--dir',f.dir,'--save']));

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

// req: R-4002
await check('profile git detail redacts home and remote URL credentials after the sealed line',async()=>{
 const { runProfile } = await import('../bin/nana-profile.mjs');
 const { gitText, commitProfile } = await import('../lib/profile-sync.mjs');
 const C=await config(),t=fixture();
 const previous={HOME:process.env.HOME,USERPROFILE:process.env.USERPROFILE};
 try {
  process.env.HOME=t.temp;process.env.USERPROFILE=t.temp;
  const stderr=`fatal: cannot open ${path.join(t.temp,'private','index')}\nremote: https://user:token@host/example/profile.git refused`;
  const failed=()=>({status:128,stderr});
  for(const operation of [()=>gitText(failed,t.temp,['status']),()=>commitProfile(t.temp,failed,'fixture'),()=>commitProfile(t.temp,(_dir,args)=>args[0]==='status'?{status:0,stdout:''}:args[0]==='add'?{status:0}:failed(),'fixture')]) {
   assert.throws(operation,e=>e.message===C.PROFILE_WORDS.git&&e.detail===stderr);
  }
  const lines=[];
  const status=runProfile(['init','--dir',t.temp],{agentDir:path.join(t.temp,'agent'),cwd:t.temp,env:{},runGit:failed,error:line=>lines.push(line)});
  assert.equal(status,1);assert.equal(lines[0],C.PROFILE_WORDS.git);
  assert.match(lines[1],/fatal: cannot open ~/);assert.match(lines[1],/https:\/\/host\/example\/profile.git refused/);
  assert.ok(!lines.join('\n').includes(t.temp));assert.ok(!lines.join('\n').includes('user:token'));
  console.log(lines.join('\n'));
  const home='C:\\Users\\fixture',short='C:\\Users\\FIXTUR~1';
  for(const given of [home,short,'']) {
   const detail=`c:/users/fixture/file C:\\Users\\FIXTUR~1/file /c/Users/fixture/file https://host/repo?access_token=hidden&api_key=hidden&secret=hidden&password=hidden&keep=visible`;
   const output=[];
   runProfile(['init','--dir',t.temp],{agentDir:path.join(t.temp,'agent'),env:{},home:given,platform:'win32',realpath:candidate=>{if([home,short].includes(candidate))return home;throw Error('missing');},runGit:()=>({status:128,stderr:detail}),error:line=>output.push(line)});
   assert.equal(output[0],C.PROFILE_WORDS.git);
   assert.ok(!output[1].includes('hidden'));assert.ok(output[1].includes('&keep=visible'));
   if(given) assert.equal(output[1].split('~/file').length-1,3);
   else assert.ok(output[1].startsWith('c:/users/fixture/file '),'empty home leaves non-secret text intact');
  }
 } finally {
  for(const [key,value] of Object.entries(previous)) {if(value===undefined)delete process.env[key];else process.env[key]=value;}
  t.close();
 }
});

// req: R-3410
await check('every profile command refuses under set launcher roles before reading the pointer',async()=>{
 const C=await config(); const t=fixture();
 try {
  const f=t.clone('a'); init(f); ok(save(f,'Private canary claim','Private canary quote'));
  const pointer=path.join(f.agent,'nana-pack.json'); const original=fs.readFileSync(pointer);
  const commands=[['show'],['sync'],['save','--kind',fact,'--claim','Blocked save','--quote','Blocked words'],['confirm','000000000000','--quote','Blocked words'],['retract','000000000000','--quote','Blocked words'],['supersede','000000000000','--kind',fact,'--claim','Blocked replacement','--quote','Blocked words'],['init','--dir',f.dir,'--save']];
  for(const role of ['worker','']) for(const args of commands) {
   const result=f.run(args,{NANA_ROLE:role}); refused(result,C.PROFILE_WORDS.role);
   assert.equal(result.stdout.includes('Private canary'),false);
  }
  fs.writeFileSync(pointer,'not json');
  refused(f.run(['show'],{NANA_ROLE:'worker'}),C.PROFILE_WORDS.role);
  fs.writeFileSync(pointer,original);
  assert.deepEqual(fs.readFileSync(pointer),original);
 } finally {t.close();}
});
