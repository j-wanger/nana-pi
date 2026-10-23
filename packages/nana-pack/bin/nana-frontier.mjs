#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-frontier.mjs
 * @purpose Reports structural drift in a HANDOFF frontier without changing the document.
 * @inputs a HANDOFF path, optional --today YYYY-MM-DD clock and optional --strict flag
 * @outputs one file:line finding per issue followed by a summary; strict mode sets failure status
 * @effects disk (reads the named HANDOFF)
 * @errors unreadable input and malformed options or dates are reported; errors exit nonzero only in strict mode
 */
import * as fs from "node:fs";
import { checkFrontier, frontierSummaryLine, isDate } from "../lib/frontier-check.mjs";

const args = process.argv.slice(2);
let strict = args.includes("--strict");
let today = new Date().toISOString().slice(0, 10);
let file = null;
for (let i = 0; i < args.length; i++) {
	if (args[i] === "--strict") strict = true;
	else if (args[i] === "--today" && args[i + 1]) today = args[++i];
	else if (args[i].startsWith("--today=")) today = args[i].slice(8);
	else if (args[i].startsWith("-")) {
		console.error(`unknown option: ${args[i]}`);
		process.exit(strict ? 1 : 0);
	} else if (file === null) file = args[i];
	else {
		console.error("expected one HANDOFF path");
		process.exit(strict ? 1 : 0);
	}
}
if (!isDate(today)) {
	console.error(`invalid --today date: ${today}`);
	process.exit(strict ? 1 : 0);
}
if (!file) {
	console.error("usage: nana-frontier.mjs [--strict] [--today YYYY-MM-DD] <HANDOFF.md>");
	process.exit(strict ? 1 : 0);
}
let text;
try {
	text = fs.readFileSync(file, "utf8");
} catch (error) {
	console.log(`${file}:0: error: ${error.message}`);
	console.log("summary findings=1");
	process.exit(strict ? 1 : 0);
}
const result = checkFrontier(text, today);
for (const finding of result.findings) console.log(`${file}:${finding.line}: ${finding.kind}: ${finding.detail}`);
console.log(frontierSummaryLine(result));
process.exitCode = strict && result.findings.length > 0 ? 1 : 0;
