#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/build-report.mjs
 * @purpose Print clone-shared build records as build, lane, and total lines.
 * @inputs argv (--repo <path>, --lane <name>), repository identity from repoKeyOf, and the bounded build ledger.
 * @outputs One stdout line per build, one per selected lane, and one total line.
 * @effects process (git repository lookup), disk (bounded ledger and matching session reads)
 * @errors Exit 1 on invalid arguments, a non-repository --repo, or an unreadable/over-cap ledger.
 */
import * as path from "node:path";

import { buildRecordsPath, buildReportLines, readBuildLedger } from "../lib/build-records.mjs";
import { repoKeyOf } from "./review-round.mjs";

const args = process.argv.slice(2);
let repoPath = process.cwd();
let lane = null;
let invalid = false;
for (let index = 0; index < args.length; index += 2) {
	const flag = args[index];
	const value = args[index + 1];
	if ((flag !== "--repo" && flag !== "--lane") || !value || value.startsWith("-") || (flag === "--repo" && repoPath !== process.cwd()) || (flag === "--lane" && lane !== null)) invalid = true;
	else if (flag === "--repo") repoPath = value;
	else lane = value;
}
if (invalid || args.length % 2 !== 0) {
	process.stderr.write("build-report: usage: build-report.mjs [--repo <path>] [--lane <name>]\n");
	process.exit(1);
}
let common;
try { common = repoKeyOf(path.resolve(repoPath)).replace(/^git:/, ""); }
catch {
	process.stderr.write(`build-report: --repo is not a git repository: ${repoPath}\n`);
	process.exit(1);
}
try {
	const ledger = readBuildLedger(buildRecordsPath(common));
	const report = buildReportLines(ledger.records, { badLines: ledger.badLines, lane });
	process.stdout.write(`${report.lines.join("\n")}\n`);
} catch (error) {
	process.stderr.write(`build-report: ${error.message}\n`);
	process.exit(1);
}
