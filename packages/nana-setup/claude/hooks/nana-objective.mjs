/**
 * @module packages/nana-setup/claude/hooks/nana-objective.mjs
 * @purpose Launch the canonical nana objective producer for the active Claude project.
 * @inputs Claude Code project environment and this entry's repository location.
 * @outputs objective producer output or its fail-open marker.
 * @effects process (runs the objective CLI).
 * @errors producer failures become an unavailable marker; the hook exits successfully.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hookProducerConfig, runHookProducer } from "../../lib/hook-producer.mjs";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
runHookProducer(hookProducerConfig("objective", repo));
