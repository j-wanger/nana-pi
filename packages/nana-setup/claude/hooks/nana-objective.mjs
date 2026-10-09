/**
 * @module packages/nana-setup/claude/hooks/nana-objective.mjs
 * @purpose Launch the canonical nana objective producer for the active Claude project.
 * @inputs Claude Code project environment and this entry's repository location.
 * @outputs canonical objective text or the stable unavailable marker.
 * @effects process (spawns the objective producer).
 * @errors producer failures are reported by the shared fail-open launcher.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runHookProducer } from "../../lib/hook-producer.mjs";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const cli = path.join(repo, "packages/nana-pack/bin/nana-objective.mjs");
runHookProducer({ cli, marker: `[nana:objective]\n\n## Objective and current priority (nana)\n\nOBJECTIVE UNAVAILABLE: producer failed (${cli}). Tell the user before spending.\n` });
