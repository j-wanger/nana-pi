/**
 * @module packages/nana-pack/tests/profile-fixture.mjs
 * @purpose Build isolated synthetic profile clones and run the profile CLI without network access.
 * @inputs Temporary filesystem and local git.
 * @outputs Fixture paths, CLI and git runners, and record readers.
 * @effects disk, process
 * @errors Throws on failed fixture commands.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { parseJsonBytes } from '../lib/json-text.mjs';
import { USER_KIND_WORDS } from '../lib/memory-making-config.mjs';
import { GH_COMMAND_ENV } from '../lib/suite-records-config.mjs';
import { TEMP_REMOVE_RETRIES, TEMP_REMOVE_RETRY_DELAY_MS } from '../lib/test-runner-config.mjs';
import { tmpDir } from "./tmp-dir.mjs";
export const root = fileURLToPath(new URL('../../..', import.meta.url));
export const cli = path.join(root, 'packages/nana-pack/bin/nana-profile.mjs');
export function fixture() {
 const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), 'profile-fixture-')));
 const env = { ...process.env, HOME: temp, USERPROFILE: temp, GIT_CONFIG_GLOBAL: path.join(temp, 'gitconfig'), GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', GIT_AUTHOR_NAME: 'Example', GIT_AUTHOR_EMAIL: 'example@example.invalid', GIT_COMMITTER_NAME: 'Example', GIT_COMMITTER_EMAIL: 'example@example.invalid' };
 for (const key of Object.keys(env)) if (key.startsWith('NANA_') || key.startsWith('GIT_CONFIG_KEY_') || key.startsWith('GIT_CONFIG_VALUE_') || ['GIT_DIR','GIT_WORK_TREE','GIT_CONFIG_COUNT','CLAUDE_SESSION_ID','PI_SESSION_ID','PI_SESSION_FILE'].includes(key)) delete env[key];
 const gh = path.join(temp, 'gh.mjs');
 fs.writeFileSync(gh, 'process.stdout.write(JSON.stringify({isPrivate:process.env.PROFILE_TEST_GH!=="public"})); process.exitCode=process.env.PROFILE_TEST_GH==="failed"?1:0;');
 env[GH_COMMAND_ENV] = JSON.stringify([process.execPath, gh]);
 const git = (cwd, ...args) => { const r = spawnSync('git', args, { cwd, env, encoding:'utf8', timeout:20000 }); assert.equal(r.status, 0, `${args}: ${r.stderr}`); return r.stdout.trim(); };
 const bare = path.join(temp, 'remote.git'); git(temp, 'init','--bare','--initial-branch=main',bare);
 // Keep the observed GitHub URL while rewriting actual transport to the bare fixture.
 const gitStub=path.join(temp,'git.mjs');
 fs.writeFileSync(gitStub, `import {spawnSync} from 'node:child_process'; const args=process.argv.slice(2); const r=spawnSync('git',args,{encoding:'utf8'}); if(args[0]==='remote'&&args[1]==='get-url'&&process.env.PROFILE_TEST_RAW_URL!=='1'&&r.stdout.trim()===${JSON.stringify(bare)}) r.stdout='https://github.com/example/profile.git\\n'; process.stdout.write(r.stdout??''); process.stderr.write(r.stderr??''); process.exitCode=r.status??1;`);
 env.NANA_PROFILE_GIT_COMMAND=JSON.stringify([process.execPath,gitStub]);
 const main = path.join(temp,'seat'); git(temp,'init','--initial-branch=main',main); fs.writeFileSync(path.join(main,'seed'),'seed'); git(main,'add','seed'); git(main,'commit','-m','seed');
 const clones = [];
 const clone = (name) => {
  const dir = path.join(temp,name); git(temp,'clone',bare,dir);
  const agent = path.join(temp,`${name}-agent`); fs.mkdirSync(agent);
  const e = { ...env, PI_CODING_AGENT_DIR:agent, CLAUDE_SESSION_ID:'session-1' };
  const remote = 'https://github.com/example/profile.git';
  git(dir,'remote','set-url','origin',remote); git(dir,'config',`url.${bare}.insteadOf`,remote);
  const run = (args, extra={}, cwd=main) => spawnSync(process.execPath,[cli,...args],{ cwd, env:{...e,...extra},encoding:'utf8',timeout:30000 });
  const asyncRun = (args,extra={}) => new Promise((resolve,reject) => {
   const child = spawn(process.execPath,[cli,...args],{cwd:main,env:{...e,...extra}}); let stdout='',stderr=''; const timer=setTimeout(()=>{child.kill();reject(Error('CLI timeout'));},30000);
   child.stdout.on('data',x=>stdout+=x); child.stderr.on('data',x=>stderr+=x); child.on('error',reject); child.on('close',status=>{clearTimeout(timer);resolve({status,stdout,stderr});});
  });
  const f={dir,agent,env:e,remote,run,asyncRun}; clones.push(f); return f;
 };
 return { temp,env,main,bare,git,clone,clones,close:()=>fs.rmSync(temp,{recursive:true,force:true,maxRetries:TEMP_REMOVE_RETRIES,retryDelay:TEMP_REMOVE_RETRY_DELAY_MS}) };
}
export function ok(r) { assert.equal(r.status,0,r.stderr||r.stdout); return r.stdout; }
export function refused(r,line) { assert.notEqual(r.status,0); assert.equal(r.stderr.trim(),line); }
export function files(dir,folder='records') {
 const base=path.join(dir,folder); if(!fs.existsSync(base)) return [];
 return fs.readdirSync(base).sort().filter(id=>fs.statSync(path.join(base,id)).isDirectory()).flatMap(id=>fs.readdirSync(path.join(base,id)).sort().filter(n=>n.endsWith('.json')).map(n=>path.join(base,id,n)));
}
export const records = dir => files(dir).map(f=>parseJsonBytes(fs.readFileSync(f)));
export const save = (f,claim,quote='Use a calm palette.',extra={})=>f.run(['save','--kind',USER_KIND_WORDS[2],'--claim',claim,'--quote',quote],extra);
export async function check(name,fn) {
 let timer;
 try { await Promise.race([Promise.resolve().then(fn),new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('case timeout')),120000);})]); console.log('PASS',name); }
 catch(e) { console.log('FAIL',name,e.stack); process.exitCode=1; }
 finally { clearTimeout(timer); }
}
