/**
 * @module packages/nana-pack/lib/ci-wait.mjs
 * @purpose Wait immutable lane or main CI, diagnosing failures and recovering bounded cancellations or main reds.
 * @inputs Origin repository, remote head and tip, injected git and gh, monotonic clock, sleep and tip workflow text.
 * @outputs Readiness, run classifications and bounded waiter verdicts with failure files, supersession, flake, success and rerun lines.
 * @effects process, network (through injected git and gh), disk (clone CI records); timer waits
 * @errors Invalid evidence, API failures and expiry return named refusals, never success.
 */
import { spawnSync } from 'node:child_process';
import { ghDefault, ghEnvironment, ghResult } from './gh-runner.mjs';
import { githubRepoOf, judgeRuns } from './land-ci.mjs';
import { failedJobFiles, mainCi, recordMainFlakes } from './main-ci.mjs';
import {
 CI_HOST, CI_DONE_STATUS, CI_PASS_CONCLUSION, CI_READ_TIMEOUT_MS, CI_RUNS_PATH, CI_RUNS_PAGE_SIZE, CI_CANCEL_RERUNS,
 CI_READY_READS, CI_READY_DELAY_MS, CI_POLL_INTERVAL_MS, CI_WAIT_TIMEOUT_MS,
 CI_PR_FIELDS, CI_JOBS_PATH, CI_ADVISORY_WORKFLOW, CI_ADVISORY_JOB, CI_ADVISORY_RULE,
 CHILD_OUTPUT_MAX_BYTES, MAIN_REF, MAIN_CI_RED_RERUNS,
} from './land-config.mjs';

const sleepSync = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,ms);
const sleepAsync = ms => new Promise(resolve=>setTimeout(resolve,ms));
const repoName = r => `${r.owner}/${r.repo}`;
const endpoint = (pattern,r) => pattern.replace('<owner>',r.owner).replace('<repo>',r.repo);
const targetedEnv = env => ({...ghEnvironment(env),GH_HOST:CI_HOST});
const expired = () => new Error('CI did not finish before the wait deadline');

/** One clock/deadline covers all reads, writes and sleeps, including readiness. */
function budget({now=()=>performance.now(),deadline,runGh=ghDefault(),cwd=process.cwd(),env=process.env}={}) {
 const end=deadline??now()+CI_WAIT_TIMEOUT_MS;
 const remaining=()=>Math.floor(end-now());
 const call=args=>{
  const left=remaining();if(left<1) throw expired();
  const result=ghResult(runGh,cwd,args,{env:targetedEnv(env),timeoutMs:Math.min(CI_READ_TIMEOUT_MS,left)});
  if(remaining()<1) throw expired();
  if(!result.ok) throw new Error(result.reason);
  return result.stdout;
 };
 return {call,remaining,deadline:end};
}

/** Read local origin/upstream identity; explicit branch overrides the remote head, never GH_REPO. */
export function ciTarget({cwd=process.cwd(),branch,repo,tip,runGit=(root,args)=>spawnSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:CHILD_OUTPUT_MAX_BYTES})}={}) {
 const git=(...args)=>{const r=runGit(cwd,args);if(r.error||r.status!==0) throw new Error(`git ${args.join(' ')} failed; set --branch to the origin head ref`);return String(r.stdout??'').trim();};
 const repository=githubRepoOf(git('remote','get-url','origin'));
 if(!repository) throw new Error('origin is not a github.com repository');
 if(repo && repo.replace(/^github\.com\//,'')!==repoName(repository)) throw new Error('--repo must match origin');
 if(!branch) {
  const local=git('branch','--show-current');
  if(git('config','--get',`branch.${local}.remote`)!=='origin') throw new Error('upstream is not origin; set --branch');
  const ref=git('config','--get',`branch.${local}.merge`);
  if(!ref.startsWith('refs/heads/')) throw new Error('upstream is not a remote head; set --branch');
  branch=ref.slice('refs/heads/'.length);
 }
 if(!branch || branch.startsWith('-')) throw new Error('invalid remote branch; set --branch');
 if(!/^[a-f0-9]{40,64}$/i.test(tip??'')) throw new Error('--tip needs a full commit SHA');
 return {repository,branch,tip};
}

/** Synchronous for the one-read land gate; only the waiter uses readiness retries. */
export function ciReadiness(options={}) {
 const {repository,branch,tip,reads=CI_READY_READS,sleep=sleepSync}=options;
 try {
  const b=options.budget??budget(options);
  for(let i=0;i<reads;i++) {
   const body=JSON.parse(b.call(['pr','list','--head',branch,'--state','open','--limit',String(CI_RUNS_PAGE_SIZE),'--json',CI_PR_FIELDS,'--repo',`${CI_HOST}/${repoName(repository)}`]));
   if(!Array.isArray(body)) throw new Error('PR response is not a list');
   const matches=body.filter(p=>p?.headRefName===branch && p.headRepository?.name?.toLowerCase()===repository.repo.toLowerCase() && p.headRepositoryOwner?.login?.toLowerCase()===repository.owner.toLowerCase());
   if(matches.length===0) return {ok:false,message:`no open PR for ${branch} in ${repoName(repository)}; open a PR for this origin head; CI runs only on pull requests`};
   if(matches.length!==1 || body.length>=CI_RUNS_PAGE_SIZE) return {ok:false,message:`ambiguous open PRs for ${branch}: ${matches.map(p=>`#${p.number}`).join(', ')}; select one origin head PR`};
   const p=matches[0];
   if(p.headRefOid!==tip) return {ok:false,head:p.headRefOid,message:`PR #${p.number} head is ${p.headRefOid}, not ${tip}; push the tip`};
   if(p.mergeable==='CONFLICTING') return {ok:false,message:`PR #${p.number} conflicts with main; merge main into the lane; GitHub starts no PR CI for it`};
   if(p.mergeable==='MERGEABLE') return {ok:true,pr:p};
   if(p.mergeable!=='UNKNOWN') throw new Error(`PR #${p.number} has unreadable mergeability`);
   if(i+1===reads) return {ok:false,unknown:true,message:`PR #${p.number} mergeability is unknown; retry nana-ci-wait after GitHub computes it`};
   const ms=Math.min(CI_READY_DELAY_MS,b.remaining());if(ms<1) throw expired();sleep(ms);
  }
  throw new Error('readiness has no reads');
 } catch(error) {return {ok:false,message:error.message};}
}

/** Success follows the run conclusion; recovery needs complete attempt-matched evidence. */
export function classifyRun(run,jobs,{workflowText='',complete=true}={}) {
 if(run.status!==CI_DONE_STATUS) return 'pending';
 if(run.conclusion===CI_PASS_CONCLUSION) return 'passed';
 if(!complete || !Array.isArray(jobs) || jobs.length===0) return 'failed';
 const advisory=run.path===CI_ADVISORY_WORKFLOW && CI_ADVISORY_RULE.test(workflowText);
 let cancelled=false;
 for(const job of jobs) {
  if(!job || job.status!==CI_DONE_STATUS || job.run_attempt!==run.run_attempt) return 'failed';
  if(job.conclusion==='cancelled') {cancelled=true;continue;}
  if([CI_PASS_CONCLUSION,'skipped','neutral'].includes(job.conclusion)) continue;
  if(job.conclusion==='failure' && advisory && job.name===CI_ADVISORY_JOB && run.conclusion==='cancelled') continue;
  return 'failed';
 }
 return cancelled ? 'capacity-cancelled' : 'failed';
}

/** Return every job from the exact attempt, failing closed on a partial or changing collection. */
export function ciRunJobs(run,options={}) {
 const b=options.budget??budget(options),jobs=[];let total;
 for(let page=1;;page++) {
  const api=options.latest
   ? `repos/${repoName(options.repository)}/actions/runs/${run.id}/jobs`
   : endpoint(CI_JOBS_PATH,options.repository).replace('<run>',run.id).replace('<attempt>',run.run_attempt);
  const body=JSON.parse(b.call(['api','--hostname',CI_HOST,`${api}?${options.latest?'filter=latest&':''}per_page=${CI_RUNS_PAGE_SIZE}&page=${page}`]));
  if(!Number.isSafeInteger(body?.total_count)||body.total_count<0||!Array.isArray(body.jobs)||(total!==undefined&&total!==body.total_count)) throw new Error('CI jobs are incomplete');
  total=body.total_count;jobs.push(...body.jobs);
  if(jobs.length>total || (jobs.length<total && !body.jobs.length)) throw new Error('CI jobs are incomplete');
  if(jobs.length===total) return jobs;
 }
}

/** Wait outside nana-land; never retry an observed attempt twice or mask a genuine red. */
export async function waitForCi(options={}) {
 const {repository,tip,sleep=sleepAsync,writeLine=()=>{}}=options;
 const b=budget(options), notes=[], states=new Map();let last=[];
 const finish=(code,text)=>({code,text:[...notes,text].filter(Boolean).join('\n')+'\n'});
 const pause=async ms=>{const delay=Math.min(ms,b.remaining());if(delay<1) throw expired();await sleep(delay);if(b.remaining()<1) throw expired();};
 try {
  // Share the same budget but await readiness pauses rather than blocking the command's event loop.
  for(let i=0;;i++) {
   const ready=ciReadiness({...options,reads:1,budget:b});
   if(ready.ok) break;
   if(!ready.unknown || i+1>=CI_READY_READS) return finish(1,ready.message);
   await pause(CI_READY_DELAY_MS);
  }
  for(;;) {
   const api=endpoint(CI_RUNS_PATH,repository);
   const raw=b.call(['api','--hostname',CI_HOST,`${api}?head_sha=${tip}&per_page=${CI_RUNS_PAGE_SIZE}`]);
   const verdict=judgeRuns(raw,tip,repository);
   if(!verdict.runs) return finish(1,verdict.message);
   last=verdict.runs;
   // An accepted rerun must be observed at a greater attempt before even a success can decide.
   const awaiting=last.some(run=>{const s=states.get(String(run.workflow_id));return s?.waiting && String(run.id)===s.id && run.run_attempt<=s.attempt;});
   if(verdict.ok && !awaiting) return finish(0,verdict.lines.join('\n'));
   for(const run of last) {
    const key=String(run.workflow_id);const state=states.get(key)??{count:0,requested:new Set()};states.set(key,state);
    const identity=`${run.id}/${run.run_attempt}`;
    if(state.requested.has(identity)) continue;
    if(state.waiting && String(run.id)===state.id && run.run_attempt<=state.attempt) continue;
    state.waiting=false;
    if(run.status!==CI_DONE_STATUS||run.conclusion===CI_PASS_CONCLUSION) continue;
    const jobs=ciRunJobs(run,{...options,budget:b});
    const kind=classifyRun(run,jobs,{workflowText:options.workflowText});
    if(kind!=='capacity-cancelled') {
     const lines=[];
     for(const job of jobs.filter(j=>j.status===CI_DONE_STATUS && ![CI_PASS_CONCLUSION,'skipped','neutral'].includes(j.conclusion))) {
      try {
       const files=failedJobFiles(run,job,{repository:repoName(repository),call:b.call});
       lines.push(`ci: ${job.name}: ${files.length?files.join(', '):job.conclusion}`);
      } catch(error) {lines.push(`ci: ${job.name}: ${job.conclusion}; log unavailable: ${error.message}`);}
     }
     return finish(1,[verdict.message,...lines].join('\n'));
    }
    if(state.count>=CI_CANCEL_RERUNS) return finish(1,`${verdict.message}; capacity-cancelled after ${state.count+1} attempts`);
    // Re-read the remote PR immediately before any write: an old waiter must not cancel its successor.
    const ready=ciReadiness({...options,reads:1,budget:b});
    const head=ready.pr?.headRefOid ?? ready.head;
    if(head && head!==tip) return finish(1,`ci: superseded at ${tip}: branch now at ${head}`);
    if(!ready.ok && !ready.unknown) return finish(1,ready.message);
    try {b.call(['run','rerun',String(run.id),'--failed','--repo',`${CI_HOST}/${repoName(repository)}`]);}
    catch(error) {return finish(1,`rerun ${run.id} failed: ${error.message}`);}
    state.requested.add(identity);
    state.count++;state.id=String(run.id);state.attempt=run.run_attempt;state.waiting=true;
    const note=`ci: rerun ${run.id} after capacity-cancelled attempt ${run.run_attempt} (${state.count}/${CI_CANCEL_RERUNS})`;
    notes.push(note);writeLine(note);
   }
   await pause(CI_POLL_INTERVAL_MS);
  }
 } catch(error) {
  const unfinished=last.length?last.map(r=>`${r.name} run ${r.id} attempt ${r.run_attempt} (${r.status})`).join('; '):`no run for ${tip}`;
  return finish(1,`${error.message}${error.message.includes('CI did not finish')?`: ${unfinished}`:''}`);
 }
}

/** Wait every main push workflow at one immutable commit, then emit the ordinary main report. */
export async function waitForMainCi(options={}) {
 const {cwd=process.cwd(),sleep=sleepAsync,writeLine=()=>{}}=options;
 const b=budget(options), lines=[], states=new Map();let last=[];
 const line=text=>{lines.push(text);writeLine(text);};
 const logFiles=(run,job,repository)=>{
  try {return failedJobFiles(run,job,{repository:repoName(repository),call:b.call});}
  catch(error) {line(`Main CI: ${job.name}: log unavailable: ${error.message}`);return [];}
 };
 const finish=code=>({code,text:lines.join('\n')+'\n'});
 try {
  const runGit=(root,args)=>{
   const left=b.remaining();if(left<1) throw expired();
   const settings={timeoutMs:Math.min(CI_READ_TIMEOUT_MS,left)};
   const result=options.runGit?options.runGit(root,args,settings):spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:settings.timeoutMs,maxBuffer:CHILD_OUTPUT_MAX_BYTES});
   if(b.remaining()<1) throw expired();
   return result;
  };
  let sha=options.sha;
  if(!sha) {
   const r=runGit(cwd,['rev-parse','--verify',`${MAIN_REF}^{commit}`]);
   if(r.error||r.status!==0) throw new Error('local main does not resolve to a commit; set --sha');
   sha=String(r.stdout??'').trim();
  }
  const {repository}=ciTarget({cwd,branch:'main',tip:sha,runGit});
  // Pin the final report's repo lookup too; ambient GH_REPO must not redirect it.
  const runGh=(_root,args)=>({status:0,stdout:b.call(args[0]==='repo'&&args[1]==='view'?['repo','view',`${CI_HOST}/${repoName(repository)}`,...args.slice(2)]:args)});
  for(;;) {
   const body=JSON.parse(b.call(['api','--hostname',CI_HOST,`${endpoint(CI_RUNS_PATH,repository)}?head_sha=${sha}&event=push&branch=main&per_page=${CI_RUNS_PAGE_SIZE}`]));
   if(!Array.isArray(body.workflow_runs)||body.workflow_runs.length>=CI_RUNS_PAGE_SIZE) throw new Error('main workflow runs are unreadable or incomplete');
   const newest=new Map();
   for(const run of body.workflow_runs.filter(r=>r.head_sha===sha&&r.event==='push'&&r.head_branch==='main')) {
    if(!Number.isSafeInteger(run.id)||!Number.isSafeInteger(run.run_attempt)||!run.path) throw new Error('main run identity is unreadable');
    const key=run.workflow_id??run.path, prior=newest.get(key);
    if(!prior||run.id>prior.id||(run.id===prior.id&&run.run_attempt>prior.run_attempt)) newest.set(key,run);
   }
   last=[...newest.values()];
   let pending=!last.length, red=false;
   for(const run of last) {
    const key=String(run.id), state=states.get(key)??{count:0,failures:new Map()};states.set(key,state);
    if(state.waiting && run.run_attempt<=state.attempt) {pending=true;continue;}
    if(run.status!==CI_DONE_STATUS) {pending=true;continue;}
    state.waiting=false;
    const jobs=ciRunJobs(run,{...options,repository,budget:b,latest:true});
    if(run.run_attempt>1 && !state.failures.size && !state.recovered) {
     for(let attempt=1;attempt<run.run_attempt;attempt++) {
      const earlier={...run,run_attempt:attempt};
      const prior=ciRunJobs(earlier,{...options,repository,budget:b});
      for(const job of prior.filter(job=>job.run_attempt===attempt&&job.status===CI_DONE_STATUS&&![CI_PASS_CONCLUSION,'skipped','neutral'].includes(job.conclusion))) {
       state.failures.set(job.name,[...new Set([...(state.failures.get(job.name)??[]),...logFiles(earlier,job,repository)])]);
      }
     }
     state.recovered=true;
    }
    for(const [name,files] of state.failures) {
     const job=jobs.find(job=>job.name===name);
     if(job?.status===CI_DONE_STATUS&&job.conclusion===CI_PASS_CONCLUSION) {
      recordMainFlakes(run,new Map([[name,files]]),{cwd,runGit,writeLine:line});
      state.recovered=true;
      line(`Main CI: ${name}: green after rerun`);
      state.failures.delete(name);
     }
    }
    const failed=jobs.filter(job=>job.status===CI_DONE_STATUS&&![CI_PASS_CONCLUSION,'skipped','neutral'].includes(job.conclusion));
    if(failed.length && run.run_attempt<=MAIN_CI_RED_RERUNS) {
     for(const job of failed) {
      const files=logFiles(run,job,repository);
      state.failures.set(job.name,files);
      line(`Main CI: ${job.name}: red${files.length?': '+files.join(', '):''}`);
     }
     b.call(['run','rerun',String(run.id),'--failed','--repo',`${CI_HOST}/${repoName(repository)}`]);
     state.count++;state.attempt=run.run_attempt;state.waiting=true;pending=true;
     line(`Main CI: rerun ${run.id} at ${sha} (${state.count}/${MAIN_CI_RED_RERUNS})`);
     continue;
    }
    if(failed.length||run.conclusion!==CI_PASS_CONCLUSION) red=true;
    if(!state.reported) {
     for(const job of failed) {
      const files=logFiles(run,job,repository);
      line(`Main CI: ${job.name}: red${files.length?': '+files.join(', '):''}`);
     }
     line(`Main CI: workflow ${run.name??run.path} run ${run.id} ${failed.length||run.conclusion!==CI_PASS_CONCLUSION?'red':run.run_attempt>1?'green after rerun':'green'}`);
     state.reported=true;
    }
   }
   if(!pending) {
    const report=mainCi({...options,cwd,runGit,runGh,expectedSha:sha,atSha:true,writeLine:line});
    return finish(red||report.code!==0||report.red?1:0);
   }
   const delay=Math.min(CI_POLL_INTERVAL_MS,b.remaining());if(delay<1) throw expired();
   await sleep(delay);if(b.remaining()<1) throw expired();
  }
 } catch(error) {
  line(`Main CI: ${error.message}${error.message.includes('CI did not finish')?': '+(last.map(r=>`${r.name??r.path} run ${r.id} attempt ${r.run_attempt} (${r.status})`).join('; ')||'no run'):''}`);
  return finish(1);
 }
}
