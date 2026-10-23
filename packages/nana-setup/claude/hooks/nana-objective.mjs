/**
 * @module packages/nana-setup/claude/hooks/nana-objective.mjs
 * @purpose Launch the canonical objective and frontier producers for the active Claude project under one output budget.
 * @inputs Claude Code project environment and this entry's repository location.
 * @outputs objective output followed by frontier output, or each producer's fail-open marker.
 * @effects process (runs the objective and frontier CLIs).
 * @errors producer failures become unavailable markers; a stdout error, such as a reader that closed it, is ignored and the hook exits 0.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { FRONTIER_HOOK_BUDGET, hookProducerConfig, runHookProducer } from "../../lib/hook-producer.mjs";

// R-1940: Ignore every stdout error so a closed hook reader cannot fail the hook.
process.stdout.on("error", () => {});

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const objectiveLength = runHookProducer(hookProducerConfig("objective", repo));
runHookProducer({ ...hookProducerConfig("frontier", repo), args: ["--max", String(FRONTIER_HOOK_BUDGET - objectiveLength)] });
