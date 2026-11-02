#!/usr/bin/env node
/**
 * @module apps/bench/anatomy.mjs
 * @purpose Expose the builder anatomy CLI with an isolated model runner for labelling.
 * @inputs argv: segment --repo --sessions --out; report --in; sample --in --seed --n --out; agree --in --a --b; assemble --in --context --drop --stage --out; label --in --out or --resume.
 * @outputs Counts-only stdout and private files through runAnatomy.
 * @effects disk, process (read-only git and isolated Claude), network (label only)
 * @errors Exit 1 on unsafe output, invalid arguments or failed reads/writes.
 */
import { runAnatomy } from "./lib/anatomy.mjs";
import { LABEL_MODEL, LABEL_EFFORT } from "./lib/anatomy-config.mjs";
import { DOLLAR_CAP } from "../../packages/nana-pack/lib/memory-shaping-config.mjs";
import { createRunner } from "../../scripts/memory-shape-runners.mjs";
process.exitCode = await runAnatomy(process.argv.slice(2), { runModel: createRunner({ runner: "claude", model: LABEL_MODEL, effort: LABEL_EFFORT, budgetUsd: DOLLAR_CAP }) });
