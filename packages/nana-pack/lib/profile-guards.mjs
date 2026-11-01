/**
 * @module packages/nana-pack/lib/profile-guards.mjs
 * @purpose Share profile checkout, seat and daily-save guards between private writers.
 * @inputs Clone path, cwd, environment, git runner and clock.
 * @outputs Guarded push URL or daily counter state.
 * @effects disk, process
 * @errors Sealed profile refusals.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalCwd } from './adoption.mjs';
import { gitCommonDir } from './suite-records.mjs';
import { gitText } from './profile-sync.mjs';
import { parseJsonBytes } from './json-text.mjs';
import { readBounded } from './bounded-read.mjs';
import { PROFILE_LAYOUT as L, PROFILE_WORDS as W } from './profile-config.mjs';
const checkout=fileURLToPath(new URL('../../..',import.meta.url));
export function seatGuard(pointer,cwd,env,runGit) {
 if(env.NANA_ROLE!==undefined) throw Error(W.role);
 const a=runGit(cwd,['rev-parse','--absolute-git-dir']); const b=runGit(cwd,['rev-parse','--git-common-dir']);
 if(a.status===0&&b.status===0) {
  const gitDir=canonicalCwd(path.resolve(cwd,a.stdout.trim())); const commonDir=canonicalCwd(path.resolve(cwd,b.stdout.trim()));
  // Native relative compares drive-letter/case variants on Windows; realpath resolves aliases.
  if(path.relative(gitDir,commonDir)!=='') throw Error(W.worktree);
 }
 if(pointer.save!==true) throw Error(W.disabled);
}
export function profileGuard(dir,runGit) {
 let common,own;
 try {common=fs.realpathSync(gitCommonDir(dir,{runGit}));own=fs.realpathSync(gitCommonDir(checkout,{runGit}));} catch {throw Error(W.git);}
 const inside=(base,target)=>{const relative=path.relative(base,target);return !relative||(!relative.startsWith(`..${path.sep}`)&&relative!=='..'&&!path.isAbsolute(relative));};
 if(inside(own,common)||inside(checkout,common)||inside(path.dirname(own),common)) throw Error(W.checkout);
 const remote=gitText(runGit,dir,['remote','get-url','--push','origin']); const ownUrl=runGit(checkout,['remote','get-url','--push','origin']);
 if(ownUrl.status===0&&remote===ownUrl.stdout.trim()) throw Error(W.checkout);
 return remote;
}
export function dailyCounter(gitdir,now) {
 const file=path.join(gitdir,L.counter); const date=now().toISOString().slice(0,10); let counter={date,count:0};
 try {const previous=parseJsonBytes(readBounded(file));if(previous.date===date) counter=previous;} catch(e) {if(e.code!=='ENOENT') throw Error(W.config);}
 if(!Number.isInteger(counter.count)||counter.count<0) throw Error(W.config);
 return {file,counter};
}
