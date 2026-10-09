/**
 * @module packages/nana-setup/claude/hooks/nana-adoption.mjs
 * @purpose Launch the canonical nana adoption reader for the active Claude project.
 * @inputs Claude Code project environment and this entry's repository location.
 * @outputs canonical adoption text or the stable unavailable marker.
 * @effects process (spawns the adoption reader).
 * @errors producer failures are reported by the shared fail-open launcher.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runHookProducer } from "../../lib/hook-producer.mjs";
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
const cli = path.join(repo, "packages/nana-pack/bin/nana-adoption.mjs");
runHookProducer({ cli, marker: `[nana:adoption]\nADOPTION UNAVAILABLE: reader failed (${cli}).\n` });
