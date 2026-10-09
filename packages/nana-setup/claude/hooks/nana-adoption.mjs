/**
 * @module packages/nana-setup/claude/hooks/nana-adoption.mjs
 * @purpose Launch the canonical nana adoption reader for the active Claude project.
 * @inputs Claude Code project environment and this entry's repository location.
 * @outputs adoption reader output or its fail-open marker.
 * @effects process (runs the adoption CLI).
 * @errors producer failures become an unavailable marker; the hook exits successfully.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hookProducerConfig, runHookProducer } from "../../lib/hook-producer.mjs";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
runHookProducer(hookProducerConfig("adoption", repo));
