/**
 * @module packages/nana-pack/lib/lane-checks.mjs
 * @purpose Run and report bounded project-owned lane checks, distinguishing failures present on the starting commit.
 * @inputs Worktree root, starting commit, sealed child environment, abort signal and injected async process runner.
 * @outputs Promise of an optional lane-check result and pi-worker stderr lines.
 * @effects disk (temporary detached base checkout), process (bounded npm and git children).
 * @errors Check crashes and base checkout failures become report data; cancellation reports stopped.
 */
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { killProcessTree } from './process-tree.mjs';
import { reviewLaunch } from '../bin/review-launch.mjs';
import { parseJsonBytes } from './json-text.mjs';
import { LANE_CHECK_TIMEOUT_MS, LANE_CHECK_OUTPUT_CHARS, LANE_CHECK_GIT_TIMEOUT_MS } from './lane-checks-config.mjs';

function declared(cwd) {
  try {
    const script = parseJsonBytes(readFileSync(join(cwd, 'package.json')))?.scripts?.['check:lane'];
    return typeof script === 'string' && script.trim().length > 0;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

// Unlike the synchronous relay, this runner keeps the worker's signal listeners live.
// Retain only bounded tails, and wait for close after killing the whole process tree.
function runChild(command, args, { cwd, env, timeout, signal, ...options }) {
  return new Promise(resolve => {
    if (signal?.aborted) { resolve({ status: null, signal: signal.reason }); return; }
    let stdout = '', stderr = '', error, stopped, timer;
    const child = spawn(command, args, { ...options, cwd, env, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    const stop = reason => {
      stopped = reason;
      killProcessTree(child.pid, { fallback: name => child.kill(name) });
    };
    const abort = () => stop(signal.reason);
    child.stdout.on('data', data => { stdout = (stdout + data).slice(-LANE_CHECK_OUTPUT_CHARS); });
    child.stderr.on('data', data => { stderr = (stderr + data).slice(-LANE_CHECK_OUTPUT_CHARS); });
    child.on('error', failure => { error = failure; });
    child.once('close', (status, childSignal) => {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
      resolve({ status, signal: stopped ?? childSignal, stdout, stderr, error });
    });
    signal?.addEventListener('abort', abort, { once: true });
    timer = setTimeout(() => {
      error = Object.assign(new Error('lane check timed out'), { code: 'ETIMEDOUT' });
      stop('SIGKILL');
    }, timeout);
  });
}
async function runCheck(cwd, env, run, timeout, signal) {
  const launch = reviewLaunch(['npm', 'run', '-s', 'check:lane'], { cwd, env });
  if (launch.refused) return { status: 'error', check: 'check:lane', output: `npm launch refused: ${launch.refused}` };
  const result = await run(launch.command, launch.args, { ...launch.options, cwd, env, timeout, signal });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-LANE_CHECK_OUTPUT_CHARS);
  const marker = [...output.matchAll(/^check:lane: (fail|error): ([^\r\n]+)/gm)].at(-1);
  const check = marker?.[2].trim() || 'check:lane';
  if (signal?.aborted) return { status: 'stopped', check, output, signal: signal.reason };
  if (result.error || result.signal || result.status === null) return { status: 'error', check, output: `${output}\n${result.error?.code ?? result.signal ?? 'no exit status'}`.trim() };
  if (result.status === 0) return { status: 'pass', check: null, output: '' };
  return { status: marker?.[1] === 'fail' && result.status === 1 ? 'fail' : 'error', check, output };
}

/** No script means no change to the worker's existing output or record shape. */
export async function checkLane({ cwd, base, env, run = runChild, timeout = LANE_CHECK_TIMEOUT_MS, signal }) {
  let folder, checkout, result;
  const git = (args, cleanup = false) => run('git', args, { cwd, env, timeout: LANE_CHECK_GIT_TIMEOUT_MS, signal: cleanup ? undefined : signal });
  const clean = async () => {
    const status = await git(['status', '--porcelain', '--untracked-files=all']);
    if (signal?.aborted) return { status: 'stopped', check: 'check:lane', output: '', signal: signal.reason };
    if (status.error || status.signal || status.status !== 0) return { status: 'error', check: 'uncommitted', output: 'cannot read git status' };
    if (status.stdout?.trim()) return { status: 'uncommitted', check: 'uncommitted', output: status.stdout.slice(-LANE_CHECK_OUTPUT_CHARS) };
  };
  try {
    if (!declared(cwd)) return undefined;
    result = await clean();
    if (result) return result;
    result = await runCheck(cwd, env, run, timeout, signal);
    // A check may itself regenerate tracked files or leave a new file behind.
    if (result.status === 'pass') result = await clean() ?? result;
    if (result.status !== 'fail' || !base) return result;
    folder = mkdtempSync(join(tmpdir(), 'nana-lane-base-'));
    checkout = join(folder, 'base');
    const added = await git(['worktree', 'add', '--detach', checkout, base]);
    if (signal?.aborted) return result = { status: 'stopped', check: result.check, output: result.output, signal: signal.reason };
    if (added.error || added.status !== 0) {
      result.base = { status: 'error', check: null, output: 'cannot create base checkout' };
      return result;
    }
    result.base = declared(checkout) ? await runCheck(checkout, env, run, timeout, signal) : { status: 'absent', check: null, output: '' };
    if (signal?.aborted) { result.status = 'stopped'; result.signal = signal.reason; }
    else if (result.base.status === 'fail' && result.base.check === result.check) result.status = 'red-on-base';
    return result;
  } catch (error) {
    result = { status: 'error', check: 'check:lane', output: error.code ?? 'cannot run lane checks' };
    return result;
  } finally {
    try {
      if (checkout) {
        const removed = await git(['worktree', 'remove', '--force', checkout], true);
        if (removed.error || removed.status !== 0) throw new Error('base checkout removal failed');
      }
      if (folder) rmSync(folder, { recursive: true, force: true });
    } catch {
      if (result) result.cleanupError = 'base checkout cleanup failed; inspect git worktree list';
    }
  }
}

/** Follow the post-build leak scan's one-prefixed-line-per-diagnostic form. */
export function laneCheckLines(result) {
  if (!result) return [];
  const lines = [`pi-worker: lane checks: ${result.status}${result.check ? `: ${result.check}` : ''}`];
  if (result.output) for (const line of result.output.split(/\r\n|\r|\n/)) if (line.trim()) lines.push(`pi-worker: lane checks output: ${line.trimEnd()}`);
  if (result.cleanupError) lines.push(`pi-worker: lane checks cleanup: ${result.cleanupError}`);
  if (result.base?.status === 'error') lines.push(`pi-worker: lane checks base: error: ${result.base.check ?? 'checkout'}: ${result.base.output}`);
  return lines;
}
