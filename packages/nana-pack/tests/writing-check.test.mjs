/**
 * @module packages/nana-pack/tests/writing-check.test.mjs
 * @purpose Pins the writing checker: stdin and file labelling with correct per-line numbers, the four always-on checks (banned outside a code span), the two --report-only checks with whole-word verdict/identifier handling, Markdown-aware splitting, the summary's exact shape and cross-file verdict share, one seal per exported config value, and the always-0 exit — plus astra r1's four CLI mutations and an unpinned passive precision/recall fixture
 * @inputs the writing checker CLI (spawned) and its pure functions (imported directly)
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a throwaway temp dir for the multi-file cases), process (spawns the CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate, amended after astra r1 (BLOCK, 6/10) and Fable's Amendment 1 (design-ruling.md,
// 2026-10-04): MUST 2 (whole-word verdict matching), MUST 3 (Markdown-aware splitting),
// MUST 4 (one seal per exported value, nothing else re-literals it), MUST 5 (CLI-level
// assertions so astra's four mutations each turn a named test red), SHOULD 1 (passive
// candidates, whole-word exceptions, an unpinned labelled precision/recall fixture).
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { bannedFindings, checkText, extractBlocks, identifierFindings, lengthFindings, passiveCandidate, passiveFindings, splitSentences, summaryLine, verdictFinding } from "../lib/writing-check.mjs";
import { BANNED_WORDS, IDENTIFIER_CODE_SPAN, IDENTIFIER_PATH, MIN_SENTENCE_WORDS, PASSIVE, PASSIVE_EXCEPTIONS, SENTENCE_CAP, VERDICT_WORDS } from "../lib/writing-config.mjs";

const CLI = fileURLToPath(new URL("../bin/nana-writing.mjs", import.meta.url));

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : (extra ?? ""));
	if (!ok) fails++;
};

function run(args, input) {
	return spawnSync(process.execPath, [CLI, ...args], { input: input ?? "", encoding: "utf8" });
}

/* ======================================================================================
 * Seals (MUST 4) — exactly one assertion per exported policy value. Every other assertion
 * in this file imports the name rather than re-stating the value.
 * ====================================================================================== */
// req: R-744
check("seal: SENTENCE_CAP is 25", SENTENCE_CAP === 25);
check("seal: PASSIVE source and flags", PASSIVE.source === "\\b(?:is|are|was|were|be|been|being)\\s+(\\w{3,}(?:ed|en))\\b" && PASSIVE.flags === "gi");
check("seal: PASSIVE_EXCEPTIONS is exactly the named list", JSON.stringify(PASSIVE_EXCEPTIONS) === JSON.stringify(["need", "speed", "indeed", "green", "wooden", "open", "golden", "even"]));
check("seal: VERDICT_WORDS is exactly the named list", JSON.stringify(VERDICT_WORDS) === JSON.stringify(["LANDED", "DONE", "BLOCKED", "OPEN", "FAILED", "CARRIED", "YOUR CALL"]));
check("seal: BANNED_WORDS is exactly the named list", JSON.stringify(BANNED_WORDS) === JSON.stringify(["dogfood"]));
check("seal: IDENTIFIER_CODE_SPAN source and flags", IDENTIFIER_CODE_SPAN.source === "`[^`]*`" && IDENTIFIER_CODE_SPAN.flags === "g");
check("seal: IDENTIFIER_PATH source and flags", IDENTIFIER_PATH.source === "\\S*\\/\\S+\\.\\w{1,5}" && IDENTIFIER_PATH.flags === "g");
check("seal: MIN_SENTENCE_WORDS is 3", MIN_SENTENCE_WORDS === 3);
// WRITING_INJECT_CAP's one seal lives in writing-injection.test.mjs (R-753) — not duplicated here.

/* --- stdin + exit (R-742, R-750) ----------------------------------------------------- */
{
	const r = run([], "dogfood\n");
	// req: R-742
	check("stdin: a piped text is checked and named -", r.status === 0 && r.stdout.includes('-:1: banned: "dogfood"'), r.stdout);
	// req: R-750
	check("exit: a text with findings exits 0", r.status === 0, String(r.status));
}

/* --- files, with correct PER-LINE numbers (R-743) ------------------------------------- */
// astra r1 MUST 5 mutation: force every CLI finding's line number to 1. Two files, each
// with a banned word on a DIFFERENT, non-1 line, so that mutation cannot pass silently.
{
	const td = tmpDir(path.join(os.tmpdir(), "nana-writing-"));
	const f1 = path.join(td, "a.md");
	const f2 = path.join(td, "b.md");
	fs.writeFileSync(f1, "plain line one\ndogfood here\nplain line three\n");
	fs.writeFileSync(f2, "one\ntwo\nthree\ndogfood on line four\n");
	const r = run([f1, f2]);
	const ok = r.status === 0 && r.stdout.includes(`${f1}:2: banned: "dogfood"`) && r.stdout.includes(`${f2}:4: banned: "dogfood"`);
	// req: R-743
	check("files: two files, findings carry path:line (different, non-1 lines)", ok, r.stdout);
	fs.rmSync(td, { recursive: true, force: true });
}

/* --- length (R-744) and its seal ------------------------------------------------------- */
{
	const sentence = `${Array.from({ length: 26 }, (_, i) => `w${i}`).join(" ")}.`;
	const findings = lengthFindings(splitSentences(sentence));
	// req: R-744
	check("length: a 26-word sentence is reported with its count", findings.length === 1 && findings[0].detail === `26 words (cap ${SENTENCE_CAP})`, JSON.stringify(findings));
}

/* --- passive candidates (R-745): whole-word exceptions, catching real passives --------- */
{
	const findings = passiveFindings(splitSentences("The file was edited by the worker."));
	// req: R-745
	check('passive: "was edited by" is reported', findings.length === 1 && findings[0].detail.includes("edited") && findings[0].detail.startsWith("passive candidate:"), JSON.stringify(findings));
}
{
	// Both in ONE input, so the test cannot pass merely because passive detection is off:
	// the exception sentence must be silent AND the plain sentence must still be reported.
	// "indeed" (unlike "needed" — see below) is a genuine exception: it is not a participle.
	const text = "This is indeed a good plan overall. The report was written by the committee.";
	const findings = passiveFindings(splitSentences(text));
	const ok = findings.length === 1 && findings[0].detail.includes("written") && !findings[0].detail.toLowerCase().includes("indeed");
	// req: R-745
	check('passive: "is indeed" exception is silent while "was written" (non-exception) is reported', ok, JSON.stringify(findings));
}
{
	// astra r1 SHOULD 1: the old PREFIX match wrongly excused "is needed" because "needed"
	// starts with "need". The exception is now whole-word, so "needed" itself is caught.
	const findings = passiveFindings(splitSentences("The evidence is needed by Jake for the review."));
	// req: R-745
	check('passive: "is needed" (the genuine passive astra found missed) is now caught', findings.length === 1 && findings[0].detail.includes("needed"), JSON.stringify(findings));
}
{
	// astra r1's two false positives, now excepted whole-word.
	const greenOk = passiveCandidate("Jake is green with envy today.") === null;
	const woodenOk = passiveCandidate("The desk was wooden and old.") === null;
	// req: R-745
	check("passive: \"is green\" and \"was wooden\" (astra r1's false positives) are excepted", greenOk && woodenOk, JSON.stringify({ greenOk, woodenOk }));
}

/* --- banned, outside a code span (R-746) ------------------------------------------------ */
{
	const findings = bannedFindings("Dogfooding this plan again today.");
	// req: R-746
	check("banned: Dogfooding is reported once", findings.length === 1 && findings[0].detail === '"Dogfood"', JSON.stringify(findings));
}
{
	// Amendment 1 §A3: a quoted word is a mention, not a use — outside a code span only.
	const findings = bannedFindings("Jake banned `dogfood` here.");
	// req: R-746
	check("banned: a banned word INSIDE a code span is not reported (a mention, not a use)", findings.length === 0, JSON.stringify(findings));
}
// astra r1 MUST 5 mutation: report only the first banned occurrence per line. Three on
// ONE line, via the CLI (not just the pure function), so a CLI-layer regression is caught too.
{
	const r = run([], "dogfood and more dogfood and dogfood\n");
	const bannedLines = r.stdout.split("\n").filter((l) => l.includes(": banned:"));
	// req: R-746
	check("banned (CLI): every occurrence on one line is reported, not just the first", bannedLines.length === 3, r.stdout);
}

/* --- report: verdict, whole word/phrase (R-747) ----------------------------------------- */
{
	const r1 = checkText("-", "LANDED. The install is done.", { report: true });
	const r2 = checkText("-", "The work went well.", { report: true });
	// req: R-747
	check('report: "LANDED." passes, "The work went well." is reported', r1.stats.verdict === true && r2.stats.verdict === false, JSON.stringify([r1.stats.verdict, r2.stats.verdict]));
}
{
	// astra r1 MUST 2, four cases, through the pure function AND the CLI below.
	// req: R-747
	check('verdict: "I reopened the case." does NOT pass (OPEN is a substring, not a whole word)', verdictFinding("I reopened the case.") !== null);
	// req: R-747
	check("verdict: empty input does NOT pass", verdictFinding("") !== null && verdictFinding(null) !== null);
	// req: R-747
	check('verdict: "DONE." (list marker stripped) passes', verdictFinding(splitSentences("1. DONE. I checked the file.")[0]?.text) === null);
	// req: R-747
	check('verdict: "YOUR CALL" matches as the two-word phrase it is', verdictFinding("YOUR CALL on this one.") === null);
}
// astra r1 MUST 2 / MUST 5, via the CLI (catches "CLI ignores --report" AND the four cases).
{
	const r = run(["--report"], "I reopened the case.\n");
	// req: R-747
	check("verdict (CLI): \"I reopened the case.\" --report gives verdict=0/1 (acceptance #11)", r.stdout.includes("verdict=0/1"), r.stdout);
}
{
	const r = run(["--report"], "");
	// req: R-747
	check("verdict (CLI): empty input --report does not read as passing", !r.stdout.includes("verdict=1/1") && r.stdout.includes("verdict="), r.stdout);
}
{
	const r = run(["--report"], "1. DONE. I checked the file.\n");
	// req: R-747
	check("verdict (CLI): a numbered list item's marker is stripped before the verdict check", r.stdout.includes("verdict=1/1"), r.stdout);
}
{
	const r = run(["--report"], "# Heading\n\nDONE. All good.\n");
	// req: R-747
	check("verdict (CLI): a heading does not stop the verdict check from reaching the next prose sentence", r.stdout.includes("verdict=1/1"), r.stdout);
}

/* --- report: identifiers (R-748) --------------------------------------------------------- */
{
	const findings = identifierFindings("Run `pi-review` here. See packages/nana-pack/bin/nana-writing.mjs for details.");
	// req: R-748
	check("report: a backtick span and a path are two findings", findings.length === 2, JSON.stringify(findings));
}
{
	// astra r1 MUST 5 mutation: make the CLI ignore --report entirely. With --report, an
	// identifier line AND a verdict line must both appear; neither would if --report were ignored.
	const r = run(["--report"], "Run `pi-review` for this.\n");
	const ok = r.stdout.includes(": identifier: `pi-review`") && r.stdout.includes(": verdict:");
	// req: R-748
	check("report (CLI): --report is honoured — identifier AND verdict lines both appear", ok, r.stdout);
}
{
	// Without --report, neither report-only check runs — the contrapositive, same input.
	const r = run([], "Run `pi-review` for this.\n");
	// req: R-748
	check("report (CLI): without --report, no identifier or verdict line appears", !r.stdout.includes(": identifier:") && !r.stdout.includes(": verdict:"), r.stdout);
}

/* --- summary (R-749), incl. the cross-file verdict share ---------------------------------- */
{
	const text = "LANDED. The file was edited by the worker and dogfood remains in `pi-review` today.";
	const r = checkText("-", text, { report: true });
	const line = summaryLine([r]);
	const exact = line === "summary sentences=1 words=13 over=0 passive=1 banned=1 verdict=1/1 identifiers=1";
	// req: R-749
	check("summary: last line parses and the counts match", exact, line);
}
{
	// SHOULD 2: one pass + one fail must read as the SHARE, not the first reading.
	const pass = checkText("a", "LANDED.", { report: true });
	const fail = checkText("b", "The work went well.", { report: true });
	const line = summaryLine([pass, fail]);
	// req: R-749
	check("summary: one pass + one fail reads as verdict=1/2, not the first reading alone", line.includes("verdict=1/2"), line);
}
{
	// req: R-749
	check("summary: outside --report, verdict reads n/a", summaryLine([checkText("-", "Plain text here.", { report: false })]).includes("verdict=n/a"));
}
// astra r1 MUST 5 mutation: remove the CLI's summary output entirely.
{
	const r = run([], "plain text\n");
	// req: R-749
	check("summary (CLI): the output ends with a summary line", /^summary /m.test(r.stdout), r.stdout);
}

/* ======================================================================================
 * Markdown-aware splitting (MUST 3) — the fixtures Amendment 1 §A2 asked to pin before
 * the baseline.
 * ====================================================================================== */
{
	const words26 = `${Array.from({ length: 26 }, (_, i) => `w${i}`).join(" ")}.`;
	const oneLine = words26;
	const wrapped = `${words26.split(" ").slice(0, 13).join(" ")}\n${words26.split(" ").slice(13).join(" ")}`;
	const same = summaryLine([checkText("a", oneLine)]) === summaryLine([checkText("b", wrapped)]);
	check("markdown: a 26-word sentence, one line or wrapped to two, gives an identical summary", same, JSON.stringify([summaryLine([checkText("a", oneLine)]), summaryLine([checkText("b", wrapped)])]));
}
{
	const fixture = [
		"# A heading",
		"",
		"| a | b |",
		"| --- | --- |",
		"",
		"```",
		"some code with a period. and dogfood here",
		"```",
		"",
		"1. first item text here",
		"2. second item text here",
		"",
		"A normal paragraph sentence stands alone here.",
	].join("\n");
	const sentences = splitSentences(fixture);
	const ok = sentences.length === 3 && sentences.every((s) => !s.text.startsWith("#") && !s.text.startsWith("|") && !s.text.includes("some code"));
	check("markdown: heading + table + fence + list gives the sentence count of the prose alone", ok, JSON.stringify(sentences));
	check("markdown: the fenced banned word is never reported (every check skips a fence)", bannedFindings(fixture).length === 0, JSON.stringify(bannedFindings(fixture)));
}
{
	const { bannedLines } = extractBlocks("# Heading with dogfood\n\n| dogfood | b |\n");
	const headingHit = bannedLines.some((l) => l.text.includes("# Heading"));
	const tableHit = bannedLines.some((l) => l.text.startsWith("| dogfood"));
	check("markdown: the banned scan still reads a heading and a table row", headingHit && tableHit);
}

/* ======================================================================================
 * astra r2 MUST 2 — a sentence's line is its first RETAINED character, not the untrimmed
 * slice start (a soft wrap's joining space sat on the PRECEDING line). CLI fixtures, exact
 * line numbers, for both a length finding and a passive finding starting after a wrap.
 * ====================================================================================== */
{
	const words26 = Array.from({ length: 26 }, (_, i) => `w${i}`).join(" ");
	const r = run([], `DONE.\n${words26}.\n`);
	// req: R-743
	check("line (CLI): a length finding starting after a soft-wrapped boundary gets line 2, not 1", r.stdout.includes("-:2: length: 26 words") && !r.stdout.includes("-:1: length:"), r.stdout);
}
{
	const r = run([], "DONE.\nThe file was edited by Jake.\n");
	// req: R-743
	check("line (CLI): a passive finding starting after a soft-wrapped boundary gets line 2, not 1 (astra r2 repro)", r.stdout.includes("-:2: passive:") && !r.stdout.includes("-:1: passive:"), r.stdout);
}

/* ======================================================================================
 * astra r2 MUST 3 — four more surviving mutations, each with a fixture that distinguishes
 * the correct clause from the mutated one.
 * ====================================================================================== */
{
	// (a) R-744 "every sentence": mutating the checker to report only the FIRST over-cap
	// sentence must be caught — two, in separate paragraphs, both over cap.
	const words26 = Array.from({ length: 26 }, (_, i) => `w${i}`).join(" ");
	const text = `${words26} first.\n\n${words26} second.`;
	const findings = lengthFindings(splitSentences(text));
	// req: R-744
	check("markdown: every over-cap sentence is reported, not just the first", findings.length === 2, JSON.stringify(findings));
}
{
	// (b) R-748 "over prose blocks only": mutating identifierFindings to scan headings,
	// tables and fences too must be caught — one prose identifier, three non-prose ones
	// that must NOT be counted.
	const text = [
		"# A heading with `code` and path/to/file.md",
		"",
		"| a `code` cell | b |",
		"| --- | --- |",
		"",
		"```",
		"a fenced `code` span and path/to/file.md",
		"```",
		"",
		"A prose sentence with one `real` identifier here.",
	].join("\n");
	const findings = identifierFindings(text);
	// req: R-748
	check("markdown: identifiers in a heading, a table and a fence are never counted (prose only)", findings.length === 1 && findings[0].detail === "`real`", JSON.stringify(findings));
}
{
	// (c) R-749 "end its output": the summary must be the LAST line, and UNIQUE — a
	// mutation printing a trailer after it, or a second summary line, must be caught.
	const r = run([], "plain text\n");
	const lines = r.stdout.split("\n").filter((l) => l.length > 0);
	const summaryLines = lines.filter((l) => /^summary /.test(l));
	// req: R-749
	check("summary (CLI): the summary is the LAST line and appears exactly once", lines.length > 0 && /^summary /.test(lines[lines.length - 1]) && summaryLines.length === 1, r.stdout);
}

/* ======================================================================================
 * Unpinned diagnostic (SHOULD 1): astra r1's labelled set, grown here to 24 sentences
 * (12 true passive, 12 non-passive — 10 active progressives + 2 copular descriptions).
 * Prints precision/recall. Pins NO number — a floor would be a tunable with no
 * provenance, and the check is report-only.
 * ====================================================================================== */
{
	const labelled = [
		// true passive (12) — astra r1's five misses included; some remain misses here too
		// (an irregular participle like "sent"/"done"/"read" never matches the -ed/-en shape,
		// and an adverb between the auxiliary and the participle is not bridged) — that is
		// the measured limitation this fixture exists to show, not to hide.
		["The message was sent by Jake.", true],
		["The task is done by Jake.", true],
		["The evidence is needed by Jake.", true],
		["The build was carefully tested by Jake.", true],
		["The rule is read by every worker.", true],
		["The file was edited by the worker.", true],
		["The plan was approved by Jake.", true],
		["The report was written by the committee.", true],
		["The code was reviewed by sol.", true],
		["The budget was reduced by half.", true],
		["The change was requested by Jake.", true],
		["The draft was finished by the team.", true],
		// non-passive (12): 10 active progressives, 2 copular descriptions
		["The team is working on the fix.", false],
		["Jake was reading the report.", false],
		["The worker is writing the code now.", false],
		["She was running the tests all night.", false],
		["The build is passing every check.", false],
		["Jake was eating lunch during the call.", false],
		["The desk is standing in the corner.", false],
		["The team was planning the next sprint.", false],
		["The reviewer is checking the diff.", false],
		["Jake was watching the build finish.", false],
		["Jake is green with envy today.", false],
		["The desk was wooden and old.", false],
	];
	let tp = 0;
	let fp = 0;
	let fn = 0;
	let tn = 0;
	for (const [text, isPassive] of labelled) {
		const flagged = passiveCandidate(text) !== null;
		if (isPassive && flagged) tp++;
		else if (isPassive && !flagged) fn++;
		else if (!isPassive && flagged) fp++;
		else tn++;
	}
	const precision = tp + fp > 0 ? tp / (tp + fp) : 1;
	const recall = tp + fn > 0 ? tp / (tp + fn) : 1;
	console.log(`passive candidate diagnostic (astra r1 labelled set, grown to ${labelled.length}): TP=${tp} FP=${fp} FN=${fn} TN=${tn} precision=${(precision * 100).toFixed(1)}% recall=${(recall * 100).toFixed(1)}%`);
}

process.exit(fails);
