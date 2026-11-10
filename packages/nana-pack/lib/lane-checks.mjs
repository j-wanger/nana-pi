/**
 * @module packages/nana-pack/lib/lane-checks.mjs
 * @purpose Run and report bounded project-owned lane checks, distinguishing failures present on the starting commit.
 * @inputs Worktree root, starting commit, sealed child environment and injected process runner.
 * @outputs Optional lane-check result and pi-worker stderr lines.
 * @effects disk (temporary detached base checkout), process (bounded npm and git children).
 * @errors Check crashes and base checkout failures become report data, never builder prompts.
 */
import { readFileSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { boundedSpawnSync } from '../../nana-setup/lib/bounded-spawn.mjs';
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
function runCheck(cwd, env, run, timeout) {
  const launch = reviewLaunch(['npm', 'run', '-s', 'check:lane'], { cwd, env });
  if (launch.refused) return { status: 'error', check: 'check:lane', output: `npm launch refused: ${launch.refused}` };
  const result = run(launch.command, launch.args, { ...launch.options, cwd, env, timeout });
  const output = `${result.stdout ?? ''}${result.stderr ?? ''}`.slice(-LANE_CHECK_OUTPUT_CHARS);
  const marker = [...output.matchAll(/^check:lane: (fail|error): ([^\r\n]+)/gm)].at(-1);
  const check = marker?.[2].trim() || 'check:lane';
  if (result.error || result.signal || result.status === null) return { status: 'error', check, output: `${output}\n${result.error?.code ?? result.signal ?? 'no exit status'}`.trim() };
  if (result.status === 0) return { status: 'pass', check: null, output: '' };
  return { status: marker?.[1] === 'fail' && result.status === 1 ? 'fail' : 'error', check, output };
}

/** No script means no change to the worker's existing output or record shape. */
export function checkLane({ cwd, base, env, run = boundedSpawnSync, timeout = LANE_CHECK_TIMEOUT_MS }) {
  let folder, checkout, result;
  const git = args => run('git', args, { cwd, env, timeout: LANE_CHECK_GIT_TIMEOUT_MS });
  try {
    if (!declared(cwd)) return undefined;
    result = runCheck(cwd, env, run, timeout);
    if (result.status !== 'fail' || !base) return result;
    folder = mkdtempSync(join(tmpdir(), 'nana-lane-base-'));
    checkout = join(folder, 'base');
    const added = git(['worktree', 'add', '--detach', checkout, base]);
    if (added.error || added.status !== 0) {
      result.base = { status: 'error', check: null, output: 'cannot create base checkout' };
      return result;
    }
    result.base = declared(checkout) ? runCheck(checkout, env, run, timeout) : { status: 'absent', check: null, output: '' };
    if (result.base.status === 'fail' && result.base.check === result.check) result.status = 'red-on-base';
    return result;
  } catch (error) {
    result = { status: 'error', check: 'check:lane', output: error.code ?? 'cannot run lane checks' };
    return result;
  } finally {
    try {
      if (checkout) {
        const removed = git(['worktree', 'remove', '--force', checkout]);
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
