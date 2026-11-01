#!/usr/bin/env node
/**
 * @module scripts/memory-run.mjs
 * @purpose Supply the existing isolated model adapter at the automatic-memory command boundary.
 * @inputs Automatic-memory command arguments and the process environment.
 * @outputs Fixed counts-only command output and exit status.
 * @effects disk, process, network
 * @errors The command returns fixed refusals; model failures remain pending.
 */
import { runMemory } from '../packages/nana-pack/bin/nana-memory.mjs';
import { createRunner } from './memory-shape-runners.mjs';
process.exitCode=await runMemory(process.argv.slice(2),{runModel:createRunner()});
