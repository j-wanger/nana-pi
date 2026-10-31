/**
 * @module scripts/memory-shape.mjs
 * @purpose Run the hand-operated private model memory shaper with the sealed runner.
 * @inputs --repo, --root, --reviews, --project, --from, --to, --until and required --out arguments.
 * @outputs Counts-only unit, spend, cut and classification readings with fixed failure lines.
 * @effects disk (private candidates); process and network (isolated model runner)
 * @errors Invalid inputs or unsafe output exit nonzero without private text.
 */
import { runShape } from "../packages/nana-pack/lib/memory-shaping.mjs";
import { createRunner } from "./memory-shape-runners.mjs";

process.exitCode = await runShape(process.argv.slice(2), { runModel: createRunner() });
