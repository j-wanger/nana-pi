#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-writing.mjs
 * @purpose Report-only CLI over the writing checker: stdin or named files, four checks always, two more under --report, one summary line, exit 0 always.
 * @inputs argv (paths, --report); stdin when no path is given; each named file's bytes
 * @outputs stdout: one `<file>:<line>: <check>: <detail>` line per finding, then one `summary …` line; always exits 0 (R-750)
 * @effects disk (reads each named file; reads stdin when no path is given)
 * @errors none thrown for a finding — an unreadable file prints one `<file>:0: error: …` line and is otherwise skipped; always exits 0
 */
// nana-writing — report-only, never blocks (design-ruling.md, 2026-10-04, §3).
//   node bin/nana-writing.mjs [--report] [file...]
// With no file, reads stdin (named "-" in the output). `--report` turns on the two checks
// that only matter for a message addressed to Jake: a verdict word in the first sentence,
// and identifiers (a backtick span, or a slash path) — see
// packages/nana-pack/rules/nana-writing.md and packages/nana-pack/README.md.
import * as fs from "node:fs";
import { checkText, summaryLine } from "../lib/writing-check.mjs";

const argv = process.argv.slice(2);
const report = argv.includes("--report");
const paths = argv.filter((a) => a !== "--report");

function readStdin() {
	try {
		return fs.readFileSync(0, "utf8");
	} catch {
		return "";
	}
}

const inputs =
	paths.length > 0
		? paths.map((p) => {
				try {
					return { label: p, text: fs.readFileSync(p, "utf8") };
				} catch (err) {
					return { label: p, text: null, error: err.message };
				}
			})
		: [{ label: "-", text: readStdin() }];

for (const inp of inputs) {
	if (inp.text === null) console.log(`${inp.label}:0: error: ${inp.error}`);
}

const results = inputs.filter((inp) => inp.text !== null).map((inp) => checkText(inp.label, inp.text, { report }));
for (const r of results) {
	for (const f of r.findings) console.log(`${r.label}:${f.line}: ${f.check}: ${f.detail}`);
}
console.log(summaryLine(results));
// R-750: this CLI is report-only — it exits 0 whatever it finds, always.
process.exitCode = 0;
