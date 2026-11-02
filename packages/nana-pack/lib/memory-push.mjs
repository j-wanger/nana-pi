/**
 * @module packages/nana-pack/lib/memory-push.mjs
 * @purpose Assemble seat memory from the private store under role, repository and deadline guards.
 * @inputs Agent directory, environment, cwd, process-clock deadline, clock and git runner.
 * @outputs Bundle or fixed skip reason with damaged-project count and no exception text.
 * @effects disk, process
 * @errors All failures become fixed reasons; a valid store read failure is store-error.
 */
import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { piAgentDir } from './agent-dir.mjs';
import { canonicalCwd } from './adoption.mjs';
import { resolveProfile } from '../bin/nana-profile.mjs';
import { profileGit } from './profile-sync.mjs';
import { readBounded } from './bounded-read.mjs';
import { parseJsonBytes } from './json-text.mjs';
import { readMemoryStore, resolveMemoryRepository } from './memory-store.mjs';
import { makeMemoryBundle } from './memory-bundle.mjs';
import { PROFILE_LAYOUT } from './profile-config.mjs';
import { OPT_IN_MEMBER } from './memory-run-config.mjs';
import { PUSH_GIT_TIMEOUT_MS } from './memory-bundle-config.mjs';
import { HOOK_DEADLINE_MS } from '../../nana-setup/lib/hook-producer.mjs';

export function seatPush({agentDir=piAgentDir(),env=process.env,cwd=process.cwd(),deadline=HOOK_DEADLINE_MS,clock=()=>performance.now(),runGit,asOf}={}) {
 let unparseable=0;
 const skip=reason=>({reason,unparseable});
 if(env.NANA_ROLE!==undefined)return skip('role');
 if(env.CI)return skip('ci');
 if(clock()>=deadline)return skip('deadline');
 try {
  const resolved=resolveProfile(agentDir);if(!resolved.ok)return skip('pointer');
  const config=parseJsonBytes(readBounded(path.join(agentDir,'nana-pack.json')));
  if(config.memoryPush===false)return skip('disabled');
  const dir=resolved.pointer.dir;if(!fs.existsSync(path.join(dir,PROFILE_LAYOUT.marker)))return skip('marker');
  const runner=runGit??profileGit(env);
  const git=(root,args)=>{
   const left=Math.floor(deadline-clock());if(left<=0)throw Error('deadline');
   const result=runner(root,args,{timeout:Math.min(PUSH_GIT_TIMEOUT_MS,left),windowsHide:true});
   if(clock()>=deadline||result.error?.code==='ETIMEDOUT')throw Error('deadline');
   return result;
  };
  // Same canonical comparison as seatGuard, with both paths returned in one process.
  const probe=git(cwd,['rev-parse','--absolute-git-dir','--git-common-dir']);
  if(probe.error||probe.status!==0)return skip('repository');
  const dirs=String(probe.stdout??'').trim().split(/\r?\n/u);
  if(dirs.length!==2)return skip('repository');
  const [own,common]=dirs.map(p=>canonicalCwd(path.resolve(cwd,p)));
  if(path.relative(own,common)!=='')return skip('worktree');
  const enabled=config[OPT_IN_MEMBER]??[];
  if(!Array.isArray(enabled)||enabled.some(id=>typeof id!=='string'))return skip('repository');
  let repository;
  try {repository=resolveMemoryRepository(cwd,{runGit:git,enabled});}
  catch(e){return skip(e.message==='deadline'?'deadline':'repository');}
  try {
   const states=readMemoryStore(dir,{onUnparseable:()=>unparseable++});
   const bundle=makeMemoryBundle(states,{repository:enabled.includes(repository)?repository:undefined,asOf});
   if(clock()>=deadline)return skip('deadline');
   return {bundle,reason:'ready',unparseable};
  } catch {return skip(clock()>=deadline?'deadline':'store-error');}
 }catch(error){return skip(error.message==='deadline'?'deadline':'unavailable');}
}
