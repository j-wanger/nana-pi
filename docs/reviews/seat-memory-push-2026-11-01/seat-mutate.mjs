#!/usr/bin/env node
// Lane-only wrong-code table; suite tests never import, run or copy this file.
import { runMutations } from '../../../packages/nana-pack/lib/mutation-runner.mjs';
const B='packages/nana-pack/lib/memory-bundle.mjs';
const C='packages/nana-pack/lib/memory-bundle-config.mjs';
const P='packages/nana-pack/lib/memory-push.mjs';
const H='packages/nana-setup/claude/hooks/nana-shared-memory.mjs';
const BT='packages/nana-pack/tests/memory-bundle.test.mjs';
const HT='packages/nana-setup/tests/shared-memory-push.test.mjs';
const edit=(file,anchor,replacement)=>({file,anchor,replacement,times:1});
const pair=(n,name,tests,title,edits,also=[])=>({n,name,tests,expectRed:[title],edits,alsoRed:also});
const pairs=[
 pair('B1','drop repository isolation',[HT],'B1: matching records print beside all index titles including an empty store',[edit(B,'r.repository===repository','r.repository!==undefined')]),
 pair('B2','drop saved-source priority',[BT],'B2: parts ranking exact record budget and decimal header boundaries',[edit(B,'rank(PUSH_SOURCE_ORDER,a.source)-rank(PUSH_SOURCE_ORDER,b.source)||','')]),
 pair('B3','read memory under launcher roles',[HT],'B3: skips preserve bytes and a damaged profile adds only the fixed note',[edit(P,"if(env.NANA_ROLE!==undefined)return skip('role');","if(false)return skip('role');")],['B4: slow git retains index under the deadline with one worktree probe']),
 pair('B4','ignore per-call deadline in real git',[HT],'B4: slow git retains index under the deadline with one worktree probe',[edit('packages/nana-pack/lib/profile-sync.mjs','timeout:Math.min(timeout,PROFILE_GIT_TIMEOUT_MS)','timeout:PROFILE_GIT_TIMEOUT_MS')]),
 pair('B5','cut by merge stamp not evidence day',[HT],'B5: one pure date-cut maker and renderer serve store and replay inputs',[edit(B,'r.date<=day',"String(r.stamp??r.date).slice(0,10)<=day")],['B1: matching records print beside all index titles including an empty store','B6: one load line measures ids and characters without claim or quote text']),
 pair('B6','leak claims into the load log',[HT],'B6: one load line measures ids and characters without claim or quote text',[edit(H,"push: { reason: push.reason,","push: { text: push.bundle?.lines, reason: push.reason,")]),
 pair('B7-budget','retune record cap',[BT],'B7: seal push budget',[edit(C,'PUSH_BUDGET = 4000','PUSH_BUDGET = 4002')]),
 pair('B7-parts','reverse parts',[BT],'B7: seal part and source order',[edit(C,"['profile','project']","['project','profile']")],['B2: parts ranking exact record budget and decimal header boundaries']),
 pair('B7-kinds','retune kind priority',[BT],'B7: seal kind order',[edit(C,"['correction','decision','preference','lesson','fact','thinking']","['decision','correction','preference','lesson','fact','thinking']")],['B2: parts ranking exact record budget and decimal header boundaries']),
 pair('B7-git','retune git limit',[BT],'B7: seal per-call git timeout',[edit(C,'PUSH_GIT_TIMEOUT_MS = 1000','PUSH_GIT_TIMEOUT_MS = 1001')]),
 pair('id','retune printed prefix',[BT],'seal printed id length',[edit(C,'PUSH_ID_CHARS = 12','PUSH_ID_CHARS = 13')],['B2: parts ranking exact record budget and decimal header boundaries']),
 pair('margin','retune test margin',[BT],'seal deadline test margin',[edit(C,'PUSH_TEST_MARGIN_MS = 1500','PUSH_TEST_MARGIN_MS = 1501')]),
];
process.exitCode=await runMutations({lane:'seat-memory-push',branch:'feat/seat-memory-push',self:import.meta.url,tip:process.env.SEAT_MUTATE_TIP||'HEAD',pairs});
