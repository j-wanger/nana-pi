#!/usr/bin/env node
/**
 * @module packages/nana-setup/claude/hooks/nana-memory-end.mjs
 * @purpose Hand a seat's ending session to detached making and exit quietly at once.
 * @inputs Bounded SessionEnd stdin, environment and injected spawn, home and timer seams.
 * @outputs No stdout or stderr; CLI exits zero.
 * @effects process, disk (checks project folder existence)
 * @errors All read, import and start failures are quiet no-ops.
 */
import { realpathSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export async function runMemoryEndHook({input=process.stdin,env=process.env,spawn,home,setTimer=setTimeout,clearTimer=clearTimeout}={}) {
 let timer;
 try {
  const [{readHookInput},{MEMORY_STDIN_DEADLINE_MS},{spawnMemory}]=await Promise.all([
   import('../../lib/shared-memory-input.mjs'),import('../../lib/memory-end-config.mjs'),import('../../../nana-pack/lib/memory-start.mjs'),
  ]);
  const text=await Promise.race([readHookInput(input),new Promise(resolve=>{timer=setTimer(()=>resolve(null),MEMORY_STDIN_DEADLINE_MS);})]);
  clearTimer(timer);timer=undefined;
  if(env.CI||env.NANA_ROLE!==undefined||!text)return;
  const parsed=JSON.parse(text);if(typeof parsed?.transcript_path!=='string'||!parsed.transcript_path)return;
  const folder=value=>{try{return typeof value==='string'&&statSync(value).isDirectory();}catch{return false;}};
  const repo=folder(parsed.cwd)?parsed.cwd:folder(env.CLAUDE_PROJECT_DIR)?env.CLAUDE_PROJECT_DIR:null;
  if(!repo)return;
  // Last act: never await a child, its close, or the still-open stdin stream here.
  spawnMemory(['make','--repo',repo,'--session',parsed.transcript_path],{env,spawn,home});
 }catch{/* SessionEnd must never make exit noisy. */}
 finally{if(timer!==undefined)clearTimer(timer);}
}
if(process.argv[1]&&realpathSync(process.argv[1])===realpathSync(fileURLToPath(import.meta.url))) {
 await runMemoryEndHook();
 process.exit(0);
}
