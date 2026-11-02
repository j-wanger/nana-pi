#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-ci-wait.mjs
 * @purpose Run the bounded CI waiter for an origin tip and remote branch.
 * @inputs argv (--tip, --branch, --repo), repository cwd and injected Node gh command environment.
 * @outputs CI verdict lines and process exit code zero only for all-passed CI.
 * @effects process, network (through waitForCi)
 * @errors Invalid arguments exit two; unreadable identity or refused CI exits one.
 */
import { spawnSync } from 'node:child_process';
import { ciTarget, waitForCi } from '../lib/ci-wait.mjs';
import { ghFromEnvironment } from '../lib/gh-runner.mjs';
import { CI_ADVISORY_WORKFLOW, CI_READ_TIMEOUT_MS, CHILD_OUTPUT_MAX_BYTES } from '../lib/land-config.mjs';

const options={};
try {
 const args=process.argv.slice(2);
 for(let i=0;i<args.length;i++) {
  const key=args[i];
  if(!['--tip','--branch','--repo'].includes(key) || options[key.slice(2)]!==undefined || !args[i+1] || args[i+1].startsWith('--')) throw new Error('usage: nana-ci-wait --tip <sha> [--branch <remote head>] [--repo <owner/repo>]');
  options[key.slice(2)]=args[++i];
 }
 if(!options.tip) throw new Error('usage: nana-ci-wait --tip <sha> [--branch <remote head>] [--repo <owner/repo>]');
} catch(error) {process.stderr.write(`${error.message}\n`);process.exitCode=2;}
if(!process.exitCode) {
 try {
  const target=ciTarget(options);
  const workflow=spawnSync('git',['show',`${target.tip}:${CI_ADVISORY_WORKFLOW}`],{encoding:'utf8',timeout:CI_READ_TIMEOUT_MS,maxBuffer:CHILD_OUTPUT_MAX_BYTES});
  const result=await waitForCi({...target,workflowText:workflow.status===0?workflow.stdout:'',runGh:ghFromEnvironment(process.env)});
  process.stdout.write(result.text);process.exitCode=result.code;
 } catch(error) {process.stderr.write(`${error.message}\n`);process.exitCode=1;}
}
