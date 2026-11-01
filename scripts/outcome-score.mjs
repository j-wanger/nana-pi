/**
 * @module scripts/outcome-score.mjs
 * @purpose Run the private counts-only outcome accuracy scorer.
 * @inputs Required --rows and --labels JSONL files.
 * @outputs Per-kind accuracy, Wilson lower bounds and unscored or bar markers.
 * @effects disk (explicit inputs); process (output and exit status)
 * @errors Invalid inputs exit nonzero with a fixed diagnostic.
 */
import { runOutcomeScore } from "../packages/nana-pack/lib/outcome-score.mjs";
process.exitCode = await runOutcomeScore(process.argv.slice(2));
