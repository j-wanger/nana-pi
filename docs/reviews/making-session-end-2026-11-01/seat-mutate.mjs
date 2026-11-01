#!/usr/bin/env node
// Lane-only mutation table. Never imported, run or copied by a suite test.
import { fileURLToPath } from 'node:url';
import { runMutations } from '../../../packages/nana-pack/lib/mutation-runner.mjs';
const H='packages/nana-setup/claude/hooks/nana-memory-end.mjs';
const S='packages/nana-pack/lib/memory-start.mjs';
const C='packages/nana-setup/lib/memory-end-config.mjs';
const R='packages/nana-pack/lib/memory-run.mjs';
const P='packages/nana-pack/lib/profile-sync.mjs';
const D='packages/nana-setup/lib/doctor.mjs';
const HT='packages/nana-setup/tests/memory-end-hook.test.mjs';
const WT='packages/nana-setup/tests/memory-end-wiring.test.mjs';
const MT='packages/nana-pack/tests/memory-session-end.test.mjs';
const edit=(file,anchor,replacement,times=1)=>({file,anchor,replacement,times});
const pair=(n,name,tests,rows,edits,also=[])=>({n,name,tests,expectRed:rows.map(row=>new RegExp(`^${row}:`)),alsoRed:also.map(row=>new RegExp(`^${row}:`)),edits});
const guard=(from,to)=>[edit(H,from,to),edit(S,from,to)];
const pairs=[
 pair('1-hidden','drop hidden Windows spawn',[HT],['R-3350'],[edit(S,'windowsHide:true','windowsHide:false')]),
 pair('1-cwd','drop removed-folder fallback',[HT],['R-3350'],[edit(H,'folder(env.CLAUDE_PROJECT_DIR)?env.CLAUDE_PROJECT_DIR:null','null')]),
 pair('2-role','guard only workers',[HT],['R-3351'],guard("env.NANA_ROLE!==undefined","env.NANA_ROLE==='worker'")),
 pair('2-empty-role','treat empty role as unset',[HT],['R-3351'],guard('env.NANA_ROLE!==undefined','Boolean(env.NANA_ROLE)')),
 pair('2-ci','drop CI guard',[HT],['R-3351'],guard('env.CI||','')),
 pair('2-transcript','accept non-string transcript',[HT],['R-3351'],[edit(H,"if(typeof parsed?.transcript_path!=='string'||!parsed.transcript_path)return;","if(!parsed?.transcript_path)return;")]),
 pair('2-deadline','read stdin without deadline',[HT],['R-3351'],[edit(H,'const text=await Promise.race([readHookInput(input),new Promise(resolve=>{timer=setTimer(()=>resolve(null),MEMORY_STDIN_DEADLINE_MS);})]);','const text=await readHookInput(input);')]),
 pair('2-exit','wait for stdin after return',[HT],['R-3351'],[edit(H,' process.exit(0);',' process.exitCode=0;')]),
 pair('3-import','statically import a nana module',[HT],['R-3352'],[edit(H,"import { realpathSync, statSync } from 'node:fs';","import '../../../nana-pack/lib/memory-start.mjs';\nimport { realpathSync, statSync } from 'node:fs';")]),
 pair('4-timeout','retune timeout to one second',[HT],['R-3358'],[edit(C,'MEMORY_END_TIMEOUT_SECONDS = 1.5','MEMORY_END_TIMEOUT_SECONDS = 1')]),
 pair('4-repair','recognize only timeout five',[WT],['R-3353'],[edit('packages/nana-setup/lib/settings.mjs','hook?.timeout !== w.entry.timeout','hook?.timeout !== 5',2),edit('packages/nana-setup/lib/settings.mjs','hook?.timeout === w.entry.timeout','hook?.timeout === 5')]),
 pair('4-check-ci','inherit CI during check',[WT],['R-3353'],[edit('packages/nana-setup/lib/install-check-config.mjs',"removeEnv: ['CI']","removeEnv: []")]),
 pair('5-cas','update tracking ref without old value',[MT],['R-3354'],[edit(P,"['update-ref','-m','push',ref,sha,old]","['update-ref','-m','push',ref,sha]")]),
 pair('5-push-failure','advance ref even when push failed',[MT],['R-3354'],[edit(P,"if(pushed.error||pushed.status!==0)return {ok:false,reason:reason(pushed)};","if(pushed.error||pushed.status!==0){runGit(pointer.dir,['update-ref','-m','push',ref,sha,old]);return {ok:false,reason:reason(pushed)};}")]),
 pair('5-ref-result','report successful push as failed on refused ref update',[MT],['R-3354'],[edit(P,"try {runGit(pointer.dir,['update-ref','-m','push',ref,sha,old]);}","try {const r=runGit(pointer.dir,['update-ref','-m','push',ref,sha,old]);if(r.status!==0)return {ok:false,reason:'rejected'};}")]),
 pair('5-result','drop push outcome from make line',[MT],['R-3354'],[edit(R,'return {...health,...(pushed?{push:pushed}:{})};','return health;')]),
 pair('6-wait','wait after spawning while descendants remain attached',[HT],['R-3355'],[edit(H,"spawnMemory(['make','--repo',repo,'--session',parsed.transcript_path],{env,spawn,home});","spawnMemory(['make','--repo',repo,'--session',parsed.transcript_path],{env,spawn,home});\n  await new Promise(resolve=>setTimeout(resolve,3000));")]),
 pair('7-local','doctor reads newest run across machines',[MT],['R-3356'],[edit(D,'import { localMemoryRun, healthWords }','import { lastMemoryRun as localMemoryRun, healthWords }')]),
 pair('7-note','making error fails doctor',[MT],['R-3356'],[edit(D,'add(NOTE, MEMORY_MAKING_NOTE.label, making);','add(making === MEMORY_MAKING_NOTE.unreadable ? FAIL : NOTE, MEMORY_MAKING_NOTE.label, making);')]),
 pair('8-empty','commit an empty run',[MT],['R-3357'],[edit(R,'if(!units.length) {health.outcome=W.complete;keepLocal();return health;}','if(false) {health.outcome=W.complete;keepLocal();return health;}')]),
 pair('seal-deadline','retune stdin deadline',[HT],['R-3359'],[edit(C,'MEMORY_STDIN_DEADLINE_MS = 300','MEMORY_STDIN_DEADLINE_MS = 301')]),
 pair('seal-entry','change status message',[HT],['R-3360'],[edit(C,"statusMessage:'nana: memory'","statusMessage:'nana: changed'")]),
 pair('seal-push','change push word',[MT],['R-3361'],[edit('packages/nana-pack/lib/memory-run-config.mjs',"pushed:'pushed'","pushed:'sent'")],['R-3354']),
 pair('seal-note','change doctor label',[MT],['R-3362','R-3356'],[edit(C,"label:'memory making'","label:'making'")]),
];
await runMutations({lane:'making-session-end',branch:'feat/making-session-end',self:fileURLToPath(import.meta.url),tip:process.env.SEAT_MUTATE_TIP||'HEAD',pairs});
