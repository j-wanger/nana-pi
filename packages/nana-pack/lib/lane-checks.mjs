/**
 * @module packages/nana-pack/lib/lane-checks.mjs
 * @purpose Run and report bounded project-owned lane checks, distinguishing failures present on the starting commit.
 * @inputs Worktree root, starting commit, sealed child environment, abort signal and injected async process runner.
 * @outputs Promise of an optional lane-check result and pi-worker stderr lines.
 * @effects disk (temporary detached base checkout), process (bounded npm and git children).
 * @errors Check crashes and base checkout failures become report data; cancellation reports stopped.
 */
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { boundedSpawn } from '../../nana-setup/lib/bounded-spawn.mjs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
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

async function runCheck(cwd, env, run, timeout, signal) {
  const launch = reviewLaunch(['npm', 'run', '-s', 'check:lane'], { cwd, env });
  if (launch.refused) return { status: 'error', check: 'check:lane', output: `npm launch refused: ${launch.refused}` };
  const result = await run(launch.command, launch.args, { ...launch.options, cwd, env, timeout, signal });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-LANE_CHECK_OUTPUT_CHARS);
  const marker = [...output.matchAll(/^check:lane: (fail|error): ([^\r\n]+)/gm)].at(-1);
  const check = marker?.[2].trim() || 'check:lane';
  const relayExit = result.relayExitError ? { relayExitError: result.relayExitError } : {};
  if (signal?.aborted) return { status: 'stopped', check, output, signal: signal.reason, ...relayExit };
  if (result.error || result.signal || result.status === null) return { status: 'error', check, output: `${output}\n${result.error?.code ?? result.signal ?? 'no exit status'}`.trim(), ...relayExit };
  if (result.status === 0) return { status: 'pass', check: null, output: '' };
  return { status: marker?.[1] === 'fail' && result.status === 1 ? 'fail' : 'error', check, output };
}

/** No script means no change to the worker's existing output or record shape. */
export async function checkLane({ cwd, base, env, run = boundedSpawn, timeout = LANE_CHECK_TIMEOUT_MS, signal }) {
  let folder, checkout, result;
  const git = (args, cleanup = false) => run('git', args, { cwd, env, timeout: LANE_CHECK_GIT_TIMEOUT_MS, signal: cleanup ? undefined : signal });
  const clean = async () => {
    const status = await git(['status', '--porcelain', '--untracked-files=all']);
    if (signal?.aborted) return { status: 'stopped', check: 'check:lane', output: '', signal: signal.reason, ...(status.relayExitError ? { relayExitError: status.relayExitError } : {}) };
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
    // Like removal, let git finish its metadata transaction even when a stop is pending.
    const added = await git(['worktree', 'add', '--detach', checkout, base], true);
    if (signal?.aborted) return result = { status: 'stopped', check: result.check, output: result.output, signal: signal.reason, ...(added.relayExitError ? { relayExitError: added.relayExitError } : {}) };
    if (added.error || added.status !== 0) {
      result.base = { status: 'error', check: null, output: 'cannot create base checkout' };
      return result;
    }
    result.base = declared(checkout) ? await runCheck(checkout, env, run, timeout, signal) : { status: 'absent', check: null, output: '' };
    if (signal?.aborted) {
      result.status = 'stopped'; result.signal = signal.reason;
      if (result.base.relayExitError) result.relayExitError = result.base.relayExitError;
    }
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
  if (result.relayExitError) lines.push(`pi-worker: lane checks relay: ${result.relayExitError}`);
  if (result.cleanupError) lines.push(`pi-worker: lane checks cleanup: ${result.cleanupError}`);
  if (result.base?.status === 'error') lines.push(`pi-worker: lane checks base: error: ${result.base.check ?? 'checkout'}: ${result.base.output}`);
  return lines;
}
