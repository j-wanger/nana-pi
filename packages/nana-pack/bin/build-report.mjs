#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/build-report.mjs
 * @purpose Print clone-shared build and land records as attempt, lane, and total lines.
 * @inputs argv (--repo <path>, --lane <name>), repository identity from repoKeyOf, and bounded build and land ledgers.
 * @outputs Build lines followed by land attempt, lane, total, or unavailable lines; runBuildReport for bounded tests.
 * @effects process (git repository lookup), disk (bounded ledger and matching session reads)
 * @errors Return/exit 1 on invalid arguments, a non-repository --repo, or an unreadable/over-cap build ledger; land-ledger failures report with exit 0.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { buildRecordsPath, buildReportLines, readBuildLedger } from "../lib/build-records.mjs";
import { BUILD_LEDGER_READ_MAX_BYTES } from "../lib/build-records-config.mjs";
import { landRecordsPath, landReportLines, readLandLedger } from "../lib/land-records.mjs";
import { LAND_LEDGER_READ_MAX_BYTES } from "../lib/land-records-config.mjs";
import { repoKeyOf } from "./review-round.mjs";

/** Run the report with injectable writers and ledger cap; return the process status. */
export function runBuildReport(args, {
	cwd = process.cwd(),
	stdout = process.stdout,
	stderr = process.stderr,
	ledgerReadMaxBytes = BUILD_LEDGER_READ_MAX_BYTES,
	landLedgerReadMaxBytes = LAND_LEDGER_READ_MAX_BYTES,
} = {}) {
	let repoPath = cwd;
	let lane = null;
	let invalid = false;
	for (let index = 0; index < args.length; index += 2) {
		const flag = args[index];
		const value = args[index + 1];
		if ((flag !== "--repo" && flag !== "--lane") || !value || value.startsWith("-") || (flag === "--repo" && repoPath !== cwd) || (flag === "--lane" && lane !== null)) invalid = true;
		else if (flag === "--repo") repoPath = value;
		else lane = value;
	}
	if (invalid || args.length % 2 !== 0) {
		stderr.write("build-report: usage: build-report.mjs [--repo <path>] [--lane <name>]\n");
		return 1;
	}
	let common;
	try { common = repoKeyOf(path.resolve(cwd, repoPath)).replace(/^git:/, ""); }
	catch {
		stderr.write(`build-report: --repo is not a git repository: ${repoPath}\n`);
		return 1;
	}
	let buildLines;
	try {
		const ledger = readBuildLedger(buildRecordsPath(common), { maxBytes: ledgerReadMaxBytes });
		buildLines = buildReportLines(ledger.records, { badLines: ledger.badLines, lane }).lines;
	} catch (error) {
		stderr.write(`build-report: ${error.message}\n`);
		return 1;
	}
	const lines = [...buildLines];
	try {
		const ledger = readLandLedger(landRecordsPath(common), { maxBytes: landLedgerReadMaxBytes });
		if (ledger.records.length || ledger.badLines) lines.push(...landReportLines(ledger.records, { badLines: ledger.badLines, lane }).lines);
	} catch (error) {
		lines.push(`land records unavailable: ${error.message}`);
	}
	stdout.write(`${lines.join("\n")}\n`);
	return 0;
}

function isMain() {
	if (!process.argv[1]) return false;
	try {
		const invoked = process.platform === "win32" ? fs.realpathSync.native(process.argv[1]) : fs.realpathSync(process.argv[1]);
		const module = process.platform === "win32" ? fs.realpathSync.native(fileURLToPath(import.meta.url)) : fs.realpathSync(fileURLToPath(import.meta.url));
		return process.platform === "win32" ? invoked.toLowerCase() === module.toLowerCase() : invoked === module;
	} catch { return path.resolve(process.argv[1]) === fileURLToPath(import.meta.url); }
}
if (isMain()) process.exitCode = runBuildReport(process.argv.slice(2));
