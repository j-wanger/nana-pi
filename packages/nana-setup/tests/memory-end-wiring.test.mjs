/**
 * @module packages/nana-setup/tests/memory-end-wiring.test.mjs
 * @purpose Pin SessionEnd install, repair, removal and live install-check dispatch.
 * @inputs Scratch homes and injected install-check subprocesses.
 * @outputs Awaited bounded PASS/FAIL case.
 * @effects disk, process
 * @errors Assertion failures set exit code one.
 */
import assert from 'node:assert/strict';
import { tmpDir } from "./tmp-dir.mjs";
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { check } from '../../nana-pack/tests/profile-fixture.mjs';
import { resolveLayout, repoRoot } from '../lib/paths.mjs';
import { install } from '../lib/steps.mjs';
import { uninstall } from '../lib/uninstall.mjs';
import { hookLinkRows, hookSettingsRows } from '../lib/hook-health.mjs';
import { staleNotice } from '../lib/stale-copies.mjs';
import { runInstallCheck } from '../lib/install-check.mjs';
import { HOOKS } from '../lib/install-check-config.mjs';
// req: R-3353
await check('R-3353: SessionEnd install repair remove and check preserve foreign hooks',async()=>{
 const td=tmpDir(path.join(os.tmpdir(),'memory-wiring-')),previous=process.env.NANA_SETUP_PLATFORM;
 try {
  const C=await import('../lib/memory-end-config.mjs');
  for(const platform of ['darwin','linux','win32']){
   process.env.NANA_SETUP_PLATFORM=platform;const layout=resolveLayout({home:path.join(td,platform)});
   fs.mkdirSync(layout.knowledgeHome,{recursive:true});fs.writeFileSync(path.join(layout.knowledgeHome,'index.db'),'fixture');
   const foreign={type:'command',command:'echo foreign'};fs.mkdirSync(layout.claudeHome,{recursive:true});fs.writeFileSync(layout.claudeSettings,JSON.stringify({hooks:{SessionEnd:[{hooks:[foreign]}]}}));
   install(layout);const read=()=>JSON.parse(fs.readFileSync(layout.claudeSettings,'utf8'));let settings=read();
   const entry=structuredClone(settings.hooks.SessionEnd[0].hooks[1]);assert.ok(entry);assert.equal(settings.hooks.SessionEnd.length,1);assert.equal(settings.hooks.SessionEnd[0].matcher,undefined);assert.equal(entry.timeout,C.MEMORY_END_TIMEOUT_SECONDS);
   if(platform==='win32'){assert.equal(entry.command,'node');assert.deepEqual(entry.args,[`${repoRoot}/packages/nana-setup/claude/hooks/${C.MEMORY_END_ENTRY.file}`]);}
   else assert.ok(entry.command.includes(`${layout.hooksDir}/${C.MEMORY_END_ENTRY.file}`));
   assert.ok(hookSettingsRows(layout,settings).find(r=>r.label==='settings SessionEnd memory making').ok);
   const before=fs.readFileSync(layout.claudeSettings,'utf8');install(layout);assert.equal(fs.readFileSync(layout.claudeSettings,'utf8'),before);
   if(platform==='win32'){
    settings.hooks.SessionEnd[0].hooks[1].args=[path.join(td,'missing','packages/nana-setup/claude/hooks',C.MEMORY_END_ENTRY.file).replaceAll('\\','/')];fs.writeFileSync(layout.claudeSettings,JSON.stringify(settings));
    install(layout);settings=read();assert.equal(settings.hooks.SessionEnd.flatMap(g=>g.hooks).length,2);assert.deepEqual(settings.hooks.SessionEnd[0].hooks[1],entry);
   }else{
    assert.ok(hookLinkRows(layout).find(r=>r.label===`hook ${C.MEMORY_END_ENTRY.file}`).ok);fs.unlinkSync(path.join(layout.hooksDir,C.MEMORY_END_ENTRY.file));
    assert.ok(staleNotice(hookLinkRows(layout).filter(r=>!r.ok).map(r=>r.label)).includes(C.MEMORY_END_ENTRY.file));install(layout);uninstall(layout);
    assert.deepEqual(read().hooks.SessionEnd,[{hooks:[foreign]}]);assert.equal(fs.existsSync(path.join(layout.hooksDir,C.MEMORY_END_ENTRY.file)),false);
   }
  }
  // The check invokes only synthetic hook subprocesses. Other rows may fail; changing
  // this hook must change only its own judgment, never inherit the CI shortcut.
  process.env.NANA_SETUP_PLATFORM='linux';
  for(const mode of ['good','output','exit']){
   const home=path.join(td,`check-${mode}`);let calls=0;
   const result=await runInstallCheck({root:repoRoot,home,platformName:'linux',env:{PATH:process.env.PATH,CI:'1',NANA_ROLE:'worker'},exists:fs.existsSync,spawn:async(command,args,options)=>{
    if(args.includes('install')){const layout=resolveLayout({home});fs.mkdirSync(layout.knowledgeHome,{recursive:true});fs.writeFileSync(path.join(layout.knowledgeHome,'index.db'),'fixture');install(layout);return {status:0,stdout:'',stderr:''};}
    if(String(args).includes('nana-memory-end.mjs')){calls++;assert.equal(options.env.CI,undefined);assert.equal(options.env.NANA_ROLE,undefined);const input=JSON.parse(options.input);assert.equal(input.cwd,path.join(home,'project'));assert.equal(typeof input.transcript_path,'string');const script=path.join(home,'hook-fixture.mjs');fs.writeFileSync(script,mode==='output'?"console.log('wrong');":mode==='exit'?'process.exit(1);':'');return spawnSync(process.execPath,[script],{encoding:'utf8',env:options.env,timeout:options.timeout});}
    return {status:0,stdout:'',stderr:''};
   }});
   assert.equal(calls,1);assert.ok(result.lines.some(line=>line.startsWith(`${mode==='good'?'PASS':'FAIL'} hook memory making`)),result.lines.join('\n'));
   if(mode==='good')globalThis.memoryCheckFailures=result.lines.filter(l=>l.startsWith('FAIL'));
   else assert.deepEqual(result.lines.filter(l=>l.startsWith('FAIL')&&!l.startsWith('FAIL hook memory making')),globalThis.memoryCheckFailures);
  }
  assert.ok(HOOKS.some(h=>h.event==='SessionEnd'));
 }finally{if(previous===undefined)delete process.env.NANA_SETUP_PLATFORM;else process.env.NANA_SETUP_PLATFORM=previous;fs.rmSync(td,{recursive:true,force:true});}
});
