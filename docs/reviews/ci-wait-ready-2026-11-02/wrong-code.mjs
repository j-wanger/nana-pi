/**
 * @module docs/reviews/ci-wait-ready-2026-11-02/wrong-code.mjs
 * @purpose Record manual wrong-code pairs without changing repository code or assertions.
 * @inputs Current lane source and OS temporary storage.
 * @outputs Appended mutation results in the lane's wrong-code record.
 * @effects disk, process (isolated Node tests)
 * @errors Surviving mutations or failed corrected runs set exit code one.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const out=path.join(root,'docs/reviews/ci-wait-ready-2026-11-02/wrong-code.txt');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ci-wait-mutations-'));
const clean=text=>String(text).replaceAll(root,'<worktree>/').replaceAll(temp,'<mutation-temp>');
const log=text=>fs.appendFileSync(out,clean(text));
try {
 for(const directory of ['packages/nana-pack','packages/nana-setup','scripts','.github']) fs.cpSync(path.join(root,directory),path.join(temp,directory),{recursive:true});
 const module='packages/nana-pack/lib/ci-wait.mjs', land='packages/nana-pack/bin/nana-land.mjs',config='packages/nana-pack/lib/land-config.mjs';
 const source=new Map([module,land,config].map(p=>[p,fs.readFileSync(path.join(temp,p),'utf8')]));
 const mutations=[
  ['skip readiness',module,'const ready=ciReadiness({...options,reads:1,budget:b});','const ready={ok:true};','M1:'],
  ['rerun regardless of blocking jobs',module,"const kind=classifyRun(run,jobs,{workflowText:options.workflowText});","const kind='capacity-cancelled';",'M3:'],
  ['no rerun cap',module,'if(state.count>=CI_CANCEL_RERUNS)','if(false)','M2:'],
  ['capacity is success',module,"if(kind!=='capacity-cancelled')","if(kind==='capacity-cancelled') return finish(0,'wrong capacity pass');\n    if(kind!=='capacity-cancelled')",'M2:'],
  ['unbounded wait',module,'deadline??now()+CI_WAIT_TIMEOUT_MS','deadline??Infinity','M4:'],
  ['forget requested attempt identities',module,'if(state.requested.has(identity)) continue;','', 'M2:'],
  ['CLI always red','packages/nana-pack/bin/nana-ci-wait.mjs','process.exitCode=result.code','process.exitCode=1','M5:'],
  ['wrong rerun seal',config,'CI_CANCEL_RERUNS = 2','CI_CANCEL_RERUNS = 3','M6:'],
  ['remove land attempt identity guard',land,'if (JSON.stringify(identities(latest.runs)) !== JSON.stringify(identities(judgedRuns)))','if (false)','CI wait:'],
 ];
 for(const [name,file,oldText,newText,title] of mutations) {
  const full=path.join(temp,file),original=source.get(file)??fs.readFileSync(full,'utf8');
  if(!original.includes(oldText)) throw Error(`missing mutation target ${name}`);
  fs.writeFileSync(full,original.replace(oldText,newText));
  const test=title==='CI wait:'?'land-clean-merge-race':'ci-wait';
  const bad=spawnSync(process.execPath,[`packages/nana-pack/tests/${test}.test.mjs`],{cwd:temp,encoding:'utf8',timeout:180000});
  log(`\nMUTATION ${name}\nCOMMAND node packages/nana-pack/tests/${test}.test.mjs\n${bad.stdout??''}${bad.stderr??''}\nEXIT ${bad.status}\n`);
  if(bad.status!==1 || !bad.stdout?.includes(`FAIL ${title}`)) {process.exitCode=1;log('PAIR FAILED: expected cited check to reject wrong code\n');}
  fs.writeFileSync(full,original);
  const good=spawnSync(process.execPath,[`packages/nana-pack/tests/${test}.test.mjs`],{cwd:temp,encoding:'utf8',timeout:180000});
  log(`CORRECTED ${name}\n${good.stdout??''}${good.stderr??''}\nEXIT ${good.status}\n`);
  if(good.status!==0) process.exitCode=1;
  console.log(`${name}: wrong ${bad.status}, corrected ${good.status}`);
 }
} finally {fs.rmSync(temp,{recursive:true,force:true});}
