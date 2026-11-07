/**
 * @module apps/desk/test/buffer-caps.test.mjs
 * @purpose Retain the app data-command output-cap regression after desk-route retirement.
 * @inputs The app host, temporary manifest and flooding data command.
 * @outputs Bounded awaited TAP case.
 * @effects disk (temporary fixtures), process (host and data child), network (loopback).
 * @errors Assertions and timeouts fail the case.
 */
import assert from 'node:assert/strict';
import { test } from './test-case.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";

// req: R-432
await test('app data output is capped on size, reaped and leaves the listener usable', { timeout: 20000 }, async () => {
 const home = tmpDir(path.join(os.tmpdir(), 'desk-buffers-'));
 const apps = path.join(home, 'apps'); fs.mkdirSync(apps);
 const pidFile = path.join(home, 'pid'), cap = 64 * 1024;
 const flood = `require('node:fs').writeFileSync(${JSON.stringify(pidFile)},String(process.pid));setInterval(()=>process.stdout.write('z'.repeat(32768)),1);`;
 fs.writeFileSync(path.join(apps, 'app.json'), JSON.stringify({ port: 0, cwd: home, tools: ['read'], data: { huge: [process.execPath,'-e',flood], small: [process.execPath,'-e',"console.log('{\"ok\":true}')"] } }));
 const server = spawn(process.execPath, [fileURLToPath(new URL('../server.mjs', import.meta.url))], { env: { ...process.env, HOME: home, USERPROFILE: home, DESK_APPS_DIR: apps, DESK_PORT: '0', DESK_DATA_OUTPUT_CAP: String(cap) }, stdio: ['ignore','pipe','pipe'] });
 let log = ''; server.stdout.on('data', c => { log += c; }); server.stderr.on('data', c => { log += c; });
 const pause = ms => new Promise(r => setTimeout(r, ms));
 try {
  let base; const deadline = Date.now()+5000;
  while (!base && Date.now()<deadline) { const m=log.match(/app app → http:\/\/127\.0\.0\.1:(\d+)/); if(m) base=`http://127.0.0.1:${m[1]}`; else await pause(20); }
  assert.ok(base, log);
  const post = route => fetch(base+route, { method:'POST',headers:{'content-type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000) });
  assert.equal((await post('/api/data/small').then(r=>r.json())).ok,true);
  const started=Date.now(), response=await post('/api/data/huge');
  assert.equal(response.status,500); assert.match((await response.json()).error,new RegExp(`data output exceeded cap \\(${cap} bytes\\)`));
  assert.ok(Date.now()-started<10000);
  const pid=Number(fs.readFileSync(pidFile,'utf8'));
  const gone=()=>{try{process.kill(pid,0);return false;}catch(e){return e.code==='ESRCH';}};
  for(let i=0;i<100&&!gone();i++) await pause(20);
  assert.ok(gone(),'data child reaped'); assert.equal((await post('/api/data/small').then(r=>r.json())).ok,true);
 } finally {
  const exited=new Promise(r=>server.once('exit',r)); server.kill();
  let timer; await Promise.race([exited,new Promise(r=>{timer=setTimeout(()=>{server.kill('SIGKILL');r();},5000);})]); clearTimeout(timer);
 }
});
