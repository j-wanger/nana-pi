#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-memory.mjs
 * @purpose Enable, run and inspect automatic memory for the current repository without exposing text.
 * @inputs Command flags, active agent directory, profile pointer and injected machine seams.
 * @outputs Exit codes and fixed count-only enable, run and status lines.
 * @effects disk, process, network
 * @errors Fixed refusals never print raw exceptions, paths or claims.
 */
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { piAgentDir } from '../lib/agent-dir.mjs';
import { memoryArgs, defaultMemoryRepo } from '../lib/memory-making.mjs';
import { profileGit, gitText, unpushedProfile } from '../lib/profile-sync.mjs';
import { profileGuard } from '../lib/profile-guards.mjs';
import { resolveProfile } from './nana-profile.mjs';
import { writePackConfigMember } from '../lib/pack-config-write.mjs';
import { makeMemory, pendingUnits, localMemoryRun, healthWords } from '../lib/memory-run.mjs';
import { countUnparseableMemoryFiles } from '../lib/memory-store.mjs';
import { PROFILE_WORDS } from '../lib/profile-config.mjs';
import { WORDS as W, PUSH_WORDS, OPT_IN_MEMBER } from '../lib/memory-run-config.mjs';
import { LANE_NAME_PATTERN } from '../lib/land-config.mjs';

export async function runMemory(argv,{agentDir=piAgentDir(),env=process.env,cwd=process.cwd(),runGit=profileGit(env),now=()=>new Date(),projectsRoot=path.join(os.homedir(),'.claude','projects'),stdout=s=>process.stdout.write(s),stderr=s=>process.stderr.write(s),runModel,caps}={}) {
 const say=word=>{stdout(word+'\n');return 0;};
 try {
  // No profile, repository or transcript reads happen under CI or launcher roles.
  if(env.CI)return say(W.ci);if(env.NANA_ROLE!==undefined)return say(W.role);
  const [command,...rest]=argv;if(!['enable','make','status'].includes(command))throw Error(W.invalid);
  const args=memoryArgs(rest,command==='make'?['repo','session','lane']:['repo']);
  if(args.lane&&!LANE_NAME_PATTERN.test(args.lane))throw Error(W.invalid);
  const repoRoot=defaultMemoryRepo(args.repo?path.resolve(args.repo):cwd,{runGit:root=>runGit(root,['rev-parse','--git-common-dir'])});
  if(gitText(runGit,repoRoot,['rev-parse','--is-shallow-repository'])==='true')return say(W.shallow);
  const roots=gitText(runGit,repoRoot,['rev-list','--max-parents=0','HEAD']).split(/\r?\n/u).sort();
  if(!roots.length||roots.some(id=>! /^[0-9a-f]{40,64}$/u.test(id)))return say(W.unavailable);
  let config={};try{config=JSON.parse(fs.readFileSync(path.join(agentDir,'nana-pack.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw Error(W.invalid);}
  const enabled=config[OPT_IN_MEMBER]??[];if(!Array.isArray(enabled)||enabled.some(id=>typeof id!=='string'))throw Error(W.invalid);
  const repository=roots.find(id=>enabled.includes(id))??roots[0];
  if(command==='enable') {const written=writePackConfigMember(agentDir,OPT_IN_MEMBER,[...new Set([...enabled,repository])]);if(!written.ok)throw Error(W.invalid);return say(W.enabled);}
  if(!enabled.includes(repository))return say(W.disabled);
  const resolved=resolveProfile(agentDir);if(!resolved.ok)return say(W.pointer);
  const pointer=resolved.pointer,dir=pointer.dir;
  if(profileGuard(dir,runGit)!==pointer.verifiedPushUrl)return say(W.pointer);
  const options={repoRoot,repository,dir,pointer,runGit,now,projectsRoot,session:args.session,lane:args.lane,runModel,caps};
  if(command==='status') {const units=await pendingUnits(options),last=localMemoryRun(dir,repository,{runGit});return say(`${W.status}; last ${healthWords(last,now)}; ${W.pending} ${units.length}; ${W.unparseable} ${countUnparseableMemoryFiles(dir)}; ${PUSH_WORDS.unpushed} ${unpushedProfile(dir,{runGit})??W.unknown}`);}
  const result=await makeMemory(options);
  return say(`${result.outcome}; sent ${result.sent}; done ${result.done}; pending ${result.pending}; unsent ${result.unsent}; unknown ${result.unknownUsage}; tokens ${result.tokens}${result.push?`; ${result.push.ok?PUSH_WORDS.pushed:PROFILE_WORDS.notPushed+result.push.reason}`:''}`);
 }catch(error) {stderr(`${Object.values(W).includes(error.message)?error.message:W.failed}\n`);return 1;}
}
if(process.argv[1]&&fs.realpathSync(process.argv[1])===fs.realpathSync(fileURLToPath(import.meta.url))) {
 // The scripts layer owns the model adapter; importing this CLI never starts it.
 const cli=fileURLToPath(new URL('../../../scripts/memory-run.mjs',import.meta.url));
 const child=spawnSync(process.execPath,[cli,...process.argv.slice(2)],{stdio:'inherit',windowsHide:true});
 process.exitCode=child.status??1;
}
