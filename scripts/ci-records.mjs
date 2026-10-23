#!/usr/bin/env node
/**
 * @module scripts/ci-records.mjs
 * @purpose Print CI suite-record totals and slowest files for one revision.
 * @inputs An optional revision and the CI-record gh command environment override.
 * @outputs CI record and missing-input lines with a success code only when one record prints.
 * @effects process (runs git and gh through the pack reader), network (through gh), disk (temporary artifact downloads).
 * @errors Named revision, origin, gh, run, artifact, record, and cleanup failures return or retain the reader's code.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";

import { ghDefault } from "../packages/nana-pack/bin/nana-land.mjs";
import { readCiRecords } from "../packages/nana-pack/lib/ci-records.mjs";
import { CI_READ_TIMEOUT_MS } from "../packages/nana-pack/lib/land-config.mjs";
import { GH_COMMAND_ENV, GH_OUTPUT_MAX_BYTES } from "../packages/nana-pack/lib/suite-records-config.mjs";

function ghFromEnvironment(env) {
	const text = env[GH_COMMAND_ENV];
	if (!text) return ghDefault({ timeoutMs: CI_READ_TIMEOUT_MS, maxBuffer: GH_OUTPUT_MAX_BYTES });
	let command;
	try { command = JSON.parse(text); }
	catch (error) { return () => ({ error: new Error(`${GH_COMMAND_ENV} must be a JSON array of strings: ${error.message}`), status: null }); }
	if (!Array.isArray(command) || command.length === 0 || command.some((part) => typeof part !== "string")) return () => ({ error: new Error(`${GH_COMMAND_ENV} must be a JSON array of strings`), status: null });
	return (cwd, args, { env: childEnv = env } = {}) => spawnSync(command[0], [...command.slice(1), ...args], {
		cwd,
		env: childEnv,
		stdio: ["ignore", "pipe", "pipe"],
		encoding: "utf8",
		timeout: CI_READ_TIMEOUT_MS,
		maxBuffer: GH_OUTPUT_MAX_BYTES,
	});
}

export function main(argv = process.argv.slice(2), gh = ghFromEnvironment(process.env)) {
	return readCiRecords(argv, { runGh: gh });
}

const invokedDirectly = process.argv[1] && fs.existsSync(process.argv[1]) && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exitCode = main().code;
