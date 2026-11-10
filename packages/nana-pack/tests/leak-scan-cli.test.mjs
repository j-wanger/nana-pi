/**
 * @module packages/nana-pack/tests/leak-scan-cli.test.mjs
 * @purpose Pin the leak guard's must-meet cases, round-one fixes and per-file byte seal.
 * @inputs Injected digests and machine paths, shipped guidance, and OS-temp git ranges and fake builders.
 * @outputs Awaited bounded PASS/FAIL cases with no matched text in diagnostics.
 * @effects disk (OS-temp fixtures only), process (bounded git, CLI and fake worker children)
 * @errors Assertions set a nonzero exit; fixture failures throw.
 */
import assert from 'node:assert/strict';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { tmpDir } from "./tmp-dir.mjs";
import { writeFakePi } from './fake-pi.mjs';
import { buildRecordsPath, buildReportLines, buildEndRecord } from '../lib/build-records.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const temp = tmpDir(path.join(os.tmpdir(), 'leak-guard-'));
const word = 'quux';
const config = { wordDigests: [createHash('sha256').update(word).digest('hex')], wordLengths: [4], allowlist: [{path:'outside.log',counts:[1],reason:'byte-pinned'}] };
let failures = 0, serial = 0, detail;
// Never print assertion messages or child output: either can contain matched text.
function safeDetail(value) {
  if (typeof value === 'string') {
    for (const secret of [word, temp, os.homedir(), os.tmpdir(), process.env.HOME, process.env.USERPROFILE].filter(Boolean)) value=value.replaceAll(secret,'<redacted>');
    return value.replace(/[A-Za-z]:[\\/][^\s"']*/g,'<machine-path>').replace(/\/(?:[^\s/"']+\/)+[^\s"']*/g,'<machine-path>');
  }
  if (Array.isArray(value)) return value.map(safeDetail);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,safeDetail(item)]));
  return value;
}
async function check(title, fn) {
  let timer;
  const started=Date.now(); detail={};
  try {
    await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => {timer=setTimeout(()=>reject(Error('case limit')), 60000);})]);
    assert.ok(Date.now()-started<=60000,'case exceeded limit');
    console.log('PASS', title);
  } catch (error) {
    failures++;
    console.log('FAIL', title, JSON.stringify(safeDetail({error:error.code ?? error.name,operator:error.operator,actual:error.actual,expected:error.expected,detail,at:error.stack?.split('\n').filter(line=>line.trimStart().startsWith('at ')).slice(0,2)})));
  }
  finally { clearTimeout(timer); }
}
function run(command, args, cwd, options={}) {
  const r=spawnSync(command,args,{cwd,encoding:'utf8',timeout:20000,...options});
  detail={...detail,child:{exit:r.status,signal:r.signal,error:r.error?.code}};
  assert.equal(r.error,undefined); return r;
}
function git(cwd,...args) {
  const r=run('git',['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false',...args],cwd);
  assert.equal(r.status,0); return r.stdout.trim();
}
function put(cwd,file,text) {fs.mkdirSync(path.dirname(path.join(cwd,file)),{recursive:true});fs.writeFileSync(path.join(cwd,file),text);}
function commit(cwd) {git(cwd,'add','.');git(cwd,'commit','-qm','fixture');return git(cwd,'rev-parse','HEAD');}
function fixture() {const cwd=path.join(temp,`repo-${++serial}`);fs.mkdirSync(cwd);git(cwd,'init','-q','-b','main');put(cwd,'outside.log',word);const base=commit(cwd);return {cwd,base};}
const api=()=>import('../lib/leak-scan.mjs');
const cli=()=>import('../bin/leak-scan.mjs');
const options=f=>({...f,tip:'HEAD',config,home:'/home/ab',tmp:'/scratch/fixture',platform:'linux'});
let identity, forms, workerRuns;
// req: R-3753
await check('M6: CLI blocks hits and unread skips and rejects unknown refs',async()=>{
  const {LEAK_FILE_MAX_BYTES}=await import('../lib/leak-scan-config.mjs');
  const f=fixture();const env={...process.env,HOME:path.join(temp,'synthetic-home'),USERPROFILE:path.join(temp,'synthetic-home')};
  const command=path.join(root,'packages/nana-pack/bin/leak-scan.mjs');
  const invoke=(base,extra={})=>run(process.execPath,[command,'--base',base,'--tip','HEAD'],f.cwd,{env,...extra});
  let r=invoke(f.base);detail={subcase:'clean range',expectedExit:0,actualExit:r.status};assert.equal(r.status,0);
  put(f.cwd,'home.log',env.HOME+'/log');commit(f.cwd);r=invoke(f.base);detail={subcase:'home hit',expectedExit:1,actualExit:r.status};assert.equal(r.status,1);assert.ok(r.stdout.includes(`leak: home.log (${git(f.cwd,'rev-parse','--short','HEAD')}): home path ×1`));
  const base=git(f.cwd,'rev-parse','HEAD');put(f.cwd,'large.log',Buffer.alloc(LEAK_FILE_MAX_BYTES+1,120));commit(f.cwd);
  const marker=path.join(temp,'blob-reads');const preload=path.join(temp,'read-probe.mjs');
  fs.writeFileSync(preload,`import cp from 'node:child_process';import fs from 'node:fs';import {syncBuiltinESMExports} from 'node:module';const original=cp.execFileSync;cp.execFileSync=(cmd,args,opts)=>{if(args.includes('cat-file')&&(args.includes('blob')||args.includes('-p')))fs.appendFileSync(${JSON.stringify(marker)},JSON.stringify(args)+'\\n');return original(cmd,args,opts)};syncBuiltinESMExports();`);
  r=run(process.execPath,['--import',pathToFileURL(preload).href,command,'--base',base,'--tip','HEAD'],f.cwd,{env});
  detail={subcase:'unread over-cap skip',expectedExit:1,actualExit:r.status};assert.equal(r.status,1);assert.ok(r.stdout.includes(`leak scan skipped: large.log (${git(f.cwd,'rev-parse','--short','HEAD')}):`));assert.equal(fs.existsSync(marker),false);
  r=invoke('unknown-fixture-ref');detail={subcase:'unknown ref',expectedExit:2,actualExit:r.status};assert.equal(r.status,2);assert.ok(r.stderr.includes('unavailable'));
});

fs.rmSync(temp,{recursive:true,force:true});process.exitCode=failures?1:0;
