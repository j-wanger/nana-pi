/**
 * @module scripts/memory-replay.mjs
 * @purpose Run the four hand-operated memory replay commands with sealed Claude adapters.
 * @inputs plan --labels --candidates --root --seed --out; screen/run --in --expect; decide --in --case-set --sheet --blind-agree.
 * @outputs Counts-only lines and explicit private plans, run rows or blind sheets.
 * @effects process (isolated Claude children); disk (private outputs); network (Claude only)
 * @errors Invalid inputs return nonzero with fixed diagnostics.
 */
import { pathToFileURL } from 'node:url';
import { createRunner } from './memory-shape-runners.mjs';
import { runReplayCommand } from '../packages/nana-pack/lib/memory-replay.mjs';
import * as C from '../packages/nana-pack/lib/memory-replay-config.mjs';

export function replayRunners({ spawn, create = createRunner } = {}) {
 return {
  runReplay: create({ runner: C.REPLAY_RUNNER, model: C.REPLAY_MODEL, effort: C.REPLAY_EFFORT, budgetUsd: C.REPLAY_DOLLARS, timeoutMs: C.TIMEOUT_MS, maxBuffer: C.MAX_BUFFER, spawn }),
  runJudge: create({ runner: C.JUDGE_RUNNER, model: C.JUDGE_MODEL, effort: C.JUDGE_EFFORT, budgetUsd: C.JUDGE_DOLLARS, timeoutMs: C.TIMEOUT_MS, maxBuffer: C.MAX_BUFFER, spawn }),
 };
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await runReplayCommand(process.argv.slice(2), replayRunners());
