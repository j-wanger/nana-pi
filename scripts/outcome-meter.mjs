/**
 * @module scripts/outcome-meter.mjs
 * @purpose Run the hand-operated outcome meter with an explicitly sealed Claude runner.
 * @inputs Required --candidates, --root and --out; optional --repo, --project and --load-log.
 * @outputs Counts-only measurement lines and private meter rows.
 * @effects process (isolated Claude child); disk (explicit private output); network (Claude)
 * @errors Invalid inputs exit nonzero with fixed diagnostics.
 */
import { pathToFileURL } from "node:url";
import { createRunner } from "./memory-shape-runners.mjs";
import { runMeter } from "../packages/nana-pack/lib/outcome-meter.mjs";
import { JUDGE_RUNNER, JUDGE_MODEL, JUDGE_EFFORT, DOLLAR_CAP, TIMEOUT_MS, MAX_BUFFER } from "../packages/nana-pack/lib/outcome-meter-config.mjs";
export function meterRunner({ spawn } = {}) {
 return createRunner({ runner: JUDGE_RUNNER, model: JUDGE_MODEL, effort: JUDGE_EFFORT, budgetUsd: DOLLAR_CAP, timeoutMs: TIMEOUT_MS, maxBuffer: MAX_BUFFER, spawn });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await runMeter(process.argv.slice(2), { runModel: meterRunner() });
