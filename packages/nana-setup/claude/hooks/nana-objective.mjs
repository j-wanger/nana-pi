/**
 * @module packages/nana-setup/claude/hooks/nana-objective.mjs
 * @purpose Launch the canonical nana objective producer for the active Claude project.
 * @inputs Claude Code project environment and this entry's repository location.
 * @outputs objective producer output or its fail-open marker.
 * @effects process (runs the objective CLI).
 * @errors producer failures become an unavailable marker; a stdout error, such as a reader that closed it, is ignored and the hook exits 0.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hookProducerConfig, runHookProducer } from "../../lib/hook-producer.mjs";

// R-1940: Ignore every stdout error so a closed hook reader cannot fail the hook.
process.stdout.on("error", () => {});

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
runHookProducer(hookProducerConfig("objective", repo));
