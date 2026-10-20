/**
 * @module packages/nana-setup/claude/hooks/nana-adoption.mjs
 * @purpose Launch the canonical nana adoption and stale-copy producers for the active Claude project.
 * @inputs Claude Code project environment and this entry's repository location.
 * @outputs adoption and stale-copy output, or each producer's fail-open marker.
 * @effects process (runs the adoption and stale-copy CLIs).
 * @errors producer failures become unavailable markers; a stdout error, such as a reader that closed it, is ignored and the hook exits 0.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { hookProducerConfig, runHookProducer } from "../../lib/hook-producer.mjs";

// R-1941: Ignore every stdout error so a closed hook reader cannot fail the hook.
process.stdout.on("error", () => {});

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
runHookProducer(hookProducerConfig("adoption", repo));
runHookProducer(hookProducerConfig("stale-copies", repo));
