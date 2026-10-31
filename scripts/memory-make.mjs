/**
 * @module scripts/memory-make.mjs
 * @purpose Run the hand-operated private memory candidate maker without model calls.
 * @inputs --repo, --root, --reviews, --project, --from, --to and required --out arguments.
 * @outputs Counts by type and kind, capped-claim count and fixed failure lines.
 * @effects disk (through the maker); process (exit status and output)
 * @errors Invalid inputs or unsafe output paths exit nonzero without source text.
 */
import { runMake } from "../packages/nana-pack/lib/memory-making.mjs";

process.exitCode = await runMake(process.argv.slice(2));
