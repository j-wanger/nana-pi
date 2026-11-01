/**
 * @module scripts/outcome-compare.mjs
 * @purpose Compare two private outcome runs by repeat-item identity.
 * @inputs Required --rows and --against JSONL files.
 * @outputs Per-kind repeat counts and shared-over-union agreement.
 * @effects disk (explicit inputs); process (output and exit status)
 * @errors Invalid inputs exit nonzero with a fixed diagnostic.
 */
import { runOutcomeCompare } from "../packages/nana-pack/lib/outcome-score.mjs";
process.exitCode = await runOutcomeCompare(process.argv.slice(2));
