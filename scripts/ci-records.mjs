#!/usr/bin/env node
/**
 * @module scripts/ci-records.mjs
 * @purpose Print CI suite-record totals and slowest files for one revision.
 * @inputs An optional revision and the CI-record gh command environment override.
 * @outputs CI record and missing-input lines with a success code only when one record prints.
 * @effects process (runs git and gh through the pack reader), network (through gh), disk (temporary artifact downloads).
 * @errors Named revision, origin, gh, run, artifact, record, and cleanup failures return or retain the reader's code.
 */
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { ghFromEnvironment } from "../packages/nana-pack/lib/gh-runner.mjs";
import { readCiRecords } from "../packages/nana-pack/lib/ci-records.mjs";
import { CI_READ_TIMEOUT_MS } from "../packages/nana-pack/lib/land-config.mjs";
import { GH_OUTPUT_MAX_BYTES } from "../packages/nana-pack/lib/suite-records-config.mjs";

export function main(argv = process.argv.slice(2), gh = ghFromEnvironment(process.env, { timeoutMs: CI_READ_TIMEOUT_MS, maxBuffer: GH_OUTPUT_MAX_BYTES })) {
	return readCiRecords(argv, { runGh: gh });
}

const invokedDirectly = process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exitCode = main().code;
