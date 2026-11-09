/**
 * @module packages/nana-pack/lib/ci-wait.mjs
 * @purpose Diagnose missing tip CI and recover bounded capacity-cancelled workflow attempts.
 * @inputs Origin repository, remote head and tip, injected git and gh, monotonic clock, sleep and tip workflow text.
 * @outputs Readiness, run classifications and bounded waiter verdicts with success and rerun lines.
 * @effects process, network (through injected git and gh), disk (fetched refs and merge-tree objects); timer waits
 * @errors Invalid evidence, API failures and expiry return named refusals, never success.
 */
import { spawnSync } from 'node:child_process';
import { cleanMergeTree } from '../bin/nana-land.mjs';
import { ghDefault, ghEnvironment, ghResult } from './gh-runner.mjs';
import { githubRepoOf, judgeRuns } from './land-ci.mjs';
import {
 CI_HOST, CI_DONE_STATUS, CI_PASS_CONCLUSION, CI_READ_TIMEOUT_MS, CI_RUNS_PATH, CI_RUNS_PAGE_SIZE, CI_CANCEL_RERUNS,
 CI_READY_READS, CI_READY_DELAY_MS, CI_POLL_INTERVAL_MS, CI_WAIT_TIMEOUT_MS,
 CI_PR_FIELDS, CI_JOBS_PATH, CI_ADVISORY_WORKFLOW, CI_ADVISORY_JOB, CI_ADVISORY_RULE,
 CHILD_OUTPUT_MAX_BYTES,
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
   if(p.headRefOid!==tip) return {ok:false,message:`PR #${p.number} head is ${p.headRefOid}, not ${tip}; push the tip`};
   if(p.mergeable==='CONFLICTING') {
    const refusal={ok:false,message:`PR #${p.number} conflicts with main; merge main into the lane; GitHub starts no CI for it`};
    if(!branch.startsWith('feat/')) return refusal;
    try {
     const cwd=options.cwd??process.cwd();
     const runGit=(root,args)=>{
      const left=b.remaining();if(left<1) throw expired();
      const settings={timeoutMs:Math.min(CI_READ_TIMEOUT_MS,left)};
      const r=options.runGit?options.runGit(root,args,settings):spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:settings.timeoutMs,maxBuffer:CHILD_OUTPUT_MAX_BYTES});
      if(b.remaining()<1) throw expired();
      return r;
     };
     // Refresh the base rather than blessing a stale remote-tracking ref.
     const fetched=runGit(cwd,['fetch','--no-tags','--no-recurse-submodules','origin','+refs/heads/main:refs/remotes/origin/main']);
     if(fetched.error||fetched.status!==0) return refusal;
     cleanMergeTree(runGit,cwd,tip,'refs/remotes/origin/main',{inspectOnly:true});
     return {ok:true,pr:p};
    } catch {return refusal;}
   }
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
  const api=endpoint(CI_JOBS_PATH,options.repository).replace('<run>',run.id).replace('<attempt>',run.run_attempt);
  const body=JSON.parse(b.call(['api','--hostname',CI_HOST,`${api}?per_page=${CI_RUNS_PAGE_SIZE}&page=${page}`]));
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
    if(kind!=='capacity-cancelled') return finish(1,verdict.message);
    if(state.count>=CI_CANCEL_RERUNS) return finish(1,`${verdict.message}; capacity-cancelled after ${state.count+1} attempts`);
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
