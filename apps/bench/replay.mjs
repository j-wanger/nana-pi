#!/usr/bin/env node
/**
 * @module apps/bench/replay.mjs
 * @purpose Expose manual private builder replay render, run, grade, errors and rows commands.
 * @inputs Explicit CLI paths and --go/--smoke flags.
 * @outputs Counts-only stdout and fixed diagnostics with the deciding exit code.
 * @effects disk, process, network (only explicit run --go through the harness)
 * @errors Exit 1 on refused or invalid inputs; no private exception text prints.
 */
import { runReplay } from "./lib/replay.mjs";
process.exitCode = await runReplay(process.argv.slice(2));
