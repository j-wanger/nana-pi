/**
 * @module packages/nana-pack/tests/writing-check.test.mjs
 * @purpose Pins the writing checker: stdin and file labelling, the four always-on checks, the two --report-only checks, the summary line's exact shape, and the always-0 exit.
 * @inputs the writing checker CLI (spawned) and its pure functions (imported directly)
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a throwaway temp dir for the two-file case), process (spawns the CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { bannedFindings, checkText, identifierFindings, lengthFindings, passiveFindings, splitSentences, summaryLine } from "../lib/writing-check.mjs";
import { SENTENCE_CAP } from "../lib/writing-config.mjs";

const CLI = fileURLToPath(new URL("../bin/nana-writing.mjs", import.meta.url));

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

function run(args, input) {
	return spawnSync(process.execPath, [CLI, ...args], { input: input ?? "", encoding: "utf8" });
}

/* --- stdin + exit (R-742, R-750) ----------------------------------------------------- */
{
	const r = run([], "dogfood\n");
	// req: R-742
	check("stdin: a piped text is checked and named -", r.status === 0 && r.stdout.includes('-:1: banned: "dogfood"'), r.stdout);
	// req: R-750
	check("exit: a text with findings exits 0", r.status === 0, String(r.status));
}

/* --- files (R-743) -------------------------------------------------------------------- */
{
	const td = fs.mkdtempSync(path.join(os.tmpdir(), "nana-writing-"));
	const f1 = path.join(td, "a.md");
	const f2 = path.join(td, "b.md");
	fs.writeFileSync(f1, "dogfood\n");
	fs.writeFileSync(f2, "dogfood dogfood\n");
	const r = run([f1, f2]);
	const ok = r.status === 0 && r.stdout.includes(`${f1}:1: banned: "dogfood"`) && r.stdout.includes(`${f2}:1: banned: "dogfood"`);
	// req: R-743
	check("files: two files, findings carry path:line", ok, r.stdout);
	fs.rmSync(td, { recursive: true, force: true });
}

/* --- length (R-744) and its seal ------------------------------------------------------- */
{
	const sentence = `${Array.from({ length: 26 }, (_, i) => `w${i}`).join(" ")}.`;
	const findings = lengthFindings(splitSentences(sentence));
	// req: R-744
	check("length: a 26-word sentence is reported with its count", findings.length === 1 && findings[0].detail === "26 words (cap 25)", JSON.stringify(findings));
	// req: R-744
	check("seal: SENTENCE_CAP is 25", SENTENCE_CAP === 25);
}

/* --- passive (R-745) -------------------------------------------------------------------- */
{
	const findings = passiveFindings(splitSentences("The file was edited by the worker."));
	// req: R-745
	check('passive: "was edited by" is reported', findings.length === 1 && findings[0].detail.includes("edited"), JSON.stringify(findings));
}
{
	const findings = passiveFindings(splitSentences("The budget is needed for this work."));
	// req: R-745
	check('passive: "is needed" exception is not reported', findings.length === 0, JSON.stringify(findings));
}

/* --- banned (R-746) --------------------------------------------------------------------- */
{
	const findings = bannedFindings("Dogfooding this plan again today.");
	// req: R-746
	check("banned: Dogfooding is reported once", findings.length === 1 && findings[0].detail === '"Dogfood"', JSON.stringify(findings));
}

/* --- report: verdict (R-747) ------------------------------------------------------------ */
{
	const r1 = checkText("-", "LANDED. The install is done.", { report: true });
	const r2 = checkText("-", "The work went well.", { report: true });
	// req: R-747
	check('report: "LANDED." passes, "The work went well." is reported', r1.stats.verdict === "yes" && r2.stats.verdict === "no", JSON.stringify([r1.stats.verdict, r2.stats.verdict]));
}

/* --- report: identifiers (R-748) --------------------------------------------------------- */
{
	const findings = identifierFindings("Run `pi-review` here. See packages/nana-pack/bin/nana-writing.mjs for details.");
	// req: R-748
	check("report: a backtick span and a path are two findings", findings.length === 2, JSON.stringify(findings));
}

/* --- summary (R-749) --------------------------------------------------------------------- */
{
	const text = "LANDED. The file was edited by the worker and dogfood remains in `pi-review` today.";
	const r = checkText("-", text, { report: true });
	const line = summaryLine([r]);
	const exact = line === "summary sentences=1 words=13 over=0 passive=1 banned=1 verdict=yes identifiers=1";
	// req: R-749
	check("summary: last line parses and the counts match", exact, line);
}

process.exit(fails);
