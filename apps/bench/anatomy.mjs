#!/usr/bin/env node
/**
 * @module apps/bench/anatomy.mjs
 * @purpose Expose the zero-spend builder anatomy CLI.
 * @inputs argv: segment --repo --sessions --out; report --in; sample --in --seed --n --out; agree --in --a --b; assemble --in --context --drop --stage --out.
 * @outputs Counts-only JSON and private files through runAnatomy.
 * @effects disk, process (read-only git)
 * @errors Exit 1 on unsafe output, invalid arguments or failed reads/writes.
 */
import { runAnatomy } from "./lib/anatomy.mjs";
process.exitCode = await runAnatomy(process.argv.slice(2));
