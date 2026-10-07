/**
 * @module docs/reviews/writing-trial-2026-10-04/extract.mjs
 * @purpose Provides the trial's stable command-line entrypoint to the shared extractor.
 * @inputs Command-line arguments passed to the extractor.
 * @outputs The extractor's JSON summary or private preservation manifest.
 * @effects process (delegates read-only transcript scan and optional requested private output)
 * @errors Invalid arguments and output failures exit nonzero.
 */
import { runExtractor } from "../../../packages/nana-pack/lib/writing-trial-extractor.mjs";

try {
	runExtractor(process.argv);
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
}
