/**
 * @module scripts/memory-score.mjs
 * @purpose Run the hand-operated counts-only memory scorer.
 * @inputs Required --candidates and --labels private JSONL file paths.
 * @outputs Recall, precision, false-per-owner-turn and unlabelled counts.
 * @effects disk (through the scorer); process (exit status and output)
 * @errors Invalid inputs exit nonzero with a fixed message.
 */
import { runScore } from "../packages/nana-pack/lib/memory-score.mjs";

process.exitCode = await runScore(process.argv.slice(2));
