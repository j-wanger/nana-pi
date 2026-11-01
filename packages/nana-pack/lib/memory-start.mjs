/**
 * @module packages/nana-pack/lib/memory-start.mjs
 * @purpose Start one guarded detached memory CLI shared by land and SessionEnd.
 * @inputs CLI argument array, environment, spawner and home seams.
 * @outputs Boolean start result; no output.
 * @effects process
 * @errors Synchronous launch failures return false; asynchronous errors are consumed.
 */
import { spawn as spawnDefault } from 'node:child_process';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
export function spawnMemory(args,{env=process.env,spawn=spawnDefault,home=os.homedir()}={}) {
 if(env.CI||env.NANA_ROLE!==undefined)return false;
 try {
  const cli=fileURLToPath(new URL('../bin/nana-memory.mjs',import.meta.url));
  const child=spawn(process.execPath,[cli,...args],{detached:true,stdio:'ignore',windowsHide:true,cwd:home,env});
  child.on('error',()=>{});child.unref();return true;
 }catch{return false;}
}
