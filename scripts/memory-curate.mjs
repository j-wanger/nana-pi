#!/usr/bin/env node
/**
 * @module scripts/memory-curate.mjs
 * @purpose Supply the existing isolated model adapter at the manual curation boundary.
 * @inputs Curation arguments and process environment.
 * @outputs Private queue or count-only results and exit status.
 * @effects disk, process, network
 * @errors The curation command returns fixed refusals without model exception text.
 */
import { runCurate } from '../packages/nana-pack/bin/nana-curate.mjs';
import { createRunner } from './memory-shape-runners.mjs';
process.exitCode=await runCurate(process.argv.slice(2),{runModel:createRunner()});
