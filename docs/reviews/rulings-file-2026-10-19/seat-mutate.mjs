#!/usr/bin/env node
// Seat wrong-code pairs for lane rulings-file (install + hook lane), written by the seat 2026-10-19 after build 1
// (743c568), on the shared runner. One pair per product site the lane changed: each reverts that site to today's
// main behaviour or to the obvious wrong implementation (must-meet.md R-1410 to R-1418; the builder's own tries).
// Product code only; no test is edited. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/rulings-file-2026-10-19/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const RT = "packages/nana-pack/tests/rulings.test.mjs";
const IT = "packages/nana-setup/tests/rulings-install.test.mjs";
const SM = "packages/nana-setup/tests/state-manifest.test.mjs";
const UN = "packages/nana-setup/tests/uninstall.test.mjs";
const EXT = "packages/nana-pack/extensions/nana-rulings.ts";
const CFG = "packages/nana-pack/lib/rulings-config.mjs";
const MD = "packages/nana-pack/rules/nana-rulings.md";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const PATHS = "packages/nana-setup/lib/paths.mjs";
const DOC = "packages/nana-setup/lib/doctor.mjs";
const MAN = "packages/nana-setup/lib/state-manifest.mjs";

const T1410 = "an installed rulings file reaches the nana-rulings section on every session_start reason";
const T1411 = "a missing, empty, directory, FIFO, over-cap or invalid-UTF-8 rulings file yields the one-line unavailable marker, never a throw or a hang";
const TBOUND = "boundary: a file of exactly RULINGS_READ_CAP bytes injects whole and RULINGS_READ_CAP + 1 bytes gets the marker";
const TLEAK = "no fixture text leaks into the unavailable marker";
const TSEAL = "seal: RULINGS_READ_CAP is 8192";
const T1412 = "install places nana-rulings.md in the pi agent dir (link on POSIX, byte-equal copy on win32)";
const T1413 = "install places nana-rulings.md in the Claude rules folder (link on POSIX, byte-equal copy on win32)";
const T1414 = "doctor marks pi nana-rulings.md ✗ when missing, a POSIX copy or a stale win32 copy, and ✓ after install";
const T1415 = "the rulings file names no owner and no work project";
const T1416 = "every ruling is one bullet that opens with its date";
const T1417 = "the rulings file names no model, leaving the lineup to the roster";
const T1418 = "the rulings file opens with the scope sentence for builders and reviewers";
const SM_LAYOUT = "every resolved layout path except declared containers is inventoried";
const SM_INSTALL = "every path created by install maps to a nana-setup-owned manifest row";
const UN_DRY = "dry-run lists manifest pieces without writes and repeated uninstall is empty";
const UN_ROUND = "install --desk then uninstall restores the independent home snapshot";
const UN_CONTEXT = "released context entry is retired by install and its link is removed on uninstall";
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const LAST_BULLET = "- 2026-10-17: Development is feature-first.";
const SCOPE = "These rulings guide the seat, the session that plans lanes and launches builders and reviewers; a builder or reviewer acts only within its brief and reads them as background.";

const DECLARED = [
	"(a) RULINGS_FILE, RULINGS_HEADING, RULINGS_SECTION and RULINGS_UNAVAILABLE are read by name in both tests, so a retune of one is green by design; only RULINGS_READ_CAP is sealed, and C1 retunes it",
	"(b) E13 probes R-1411's clause that the marker names the file and `nana-setup install`; the row's checks pin the prefix, one line and the cap number, so the seat expects E13 to survive",
	"(c) no pair for doctor's Claude-rules row of the rulings file (it rides the existing CLAUDE_RULES loop; no must-meet test reads it), the README and package descriptions, or the code map",
	"(d) every pair runs on macOS; win32 shapes run through NANA_SETUP_PLATFORM=win32, and the FIFO case runs here",
];

const PAIRS = [
	{ n: "C1", name: "RULINGS_READ_CAP retuned to 4096", edits: [
		one(CFG, "export const RULINGS_READ_CAP = 8192;", "export const RULINGS_READ_CAP = 4096;"),
	], tests: [RT], expectRed: [TSEAL] },
	{ n: "E1", name: "the extension reads the shipped pack file instead of the agent-dir copy", edits: [
		one(EXT, "const filePath = path.join(agentDir, RULINGS_FILE);", "const filePath = path.join(import.meta.dirname, \"..\", \"rules\", RULINGS_FILE);"),
	], tests: [RT], expectRed: [T1410, T1411, TBOUND] },
	{ n: "E2", name: "the default agent dir ignores PI_CODING_AGENT_DIR (always <HOME>/.pi/agent)", edits: [
		one(EXT, "export function buildBlock(agentDir: string = piAgentDir()): string {", "export function buildBlock(agentDir: string = path.join(process.env.HOME ?? \"\", \".pi\", \"agent\")): string {"),
	], tests: [RT], expectRed: [T1410] },
	{ n: "E3", name: "the file is read on the startup reason only", edits: [
		one(EXT, "pi.on(\"session_start\", async (_event, _ctx) => {", "pi.on(\"session_start\", async (_event, _ctx) => {\n\t\tif ((_event as any)?.reason !== \"startup\") return;"),
	], tests: [RT], expectRed: [T1410] },
	{ n: "E4", name: "the first read is cached, so a reload never re-reads the file", edits: [
		one(EXT, "block = buildBlock(opts.agentDir);", "block = block ?? buildBlock(opts.agentDir);"),
	], tests: [RT], expectRed: [T1410] },
	{ n: "E5", name: "an unreadable file injects nothing instead of the marker", edits: [
		one(EXT, "return marker(causeFor(err, false), filePath);", "return \"\";"),
	], tests: [RT], expectRed: [T1411, TBOUND] },
	{ n: "E6", name: "an empty file is accepted and injects a bare heading", edits: [
		one(EXT, "if (bytes.length === 0) return marker(causeFor(null, true), filePath);", ""),
	], tests: [RT], expectRed: [T1411] },
	{ n: "E7", name: "off by one below the cap: a file of exactly the cap is refused", edits: [
		one(EXT, "bytes = readBounded(filePath, RULINGS_READ_CAP);", "bytes = readBounded(filePath, RULINGS_READ_CAP - 1);"),
	], tests: [RT], expectRed: [TBOUND] },
	{ n: "E8", name: "off by one above the cap: a file one byte over the cap injects", edits: [
		one(EXT, "bytes = readBounded(filePath, RULINGS_READ_CAP);", "bytes = readBounded(filePath, RULINGS_READ_CAP + 1);"),
	], tests: [RT], expectRed: [T1411, TBOUND, TLEAK] },
	{ n: "E9", name: "invalid UTF-8 is decoded lossily and injected", edits: [
		one(EXT, "new TextDecoder(\"utf-8\", { fatal: true })", "new TextDecoder(\"utf-8\", { fatal: false })"),
	], tests: [RT], expectRed: [T1411] },
	{ n: "E10", name: "an unbounded readFileSync truncated at the cap, nana-writing's way", edits: [
		one(EXT, "import { readBounded } from \"../lib/bounded-read.mjs\";", "import { readFileSync } from \"node:fs\";"),
		one(EXT, "bytes = readBounded(filePath, RULINGS_READ_CAP);", "bytes = readFileSync(filePath).subarray(0, RULINGS_READ_CAP);"),
	], tests: [RT], expectRed: [T1411, TBOUND, TLEAK] },
	{ n: "E11", name: "the file is injected without its heading", edits: [
		one(EXT, "return `${RULINGS_HEADING}\\n\\n${text}`;", "return text;"),
	], tests: [RT], expectRed: [T1410, TBOUND] },
	{ n: "E12", name: "the over-cap cause omits the cap", edits: [
		one(EXT, "return `larger than ${RULINGS_READ_CAP} bytes`;", "return \"too large\";"),
	], tests: [RT], expectRed: [TBOUND] },
	{ n: "E13", name: "the marker names neither the file nor nana-setup install", edits: [
		one(EXT, "${cause} at ${displayPath}. Tell the user; they restore it with \\`nana-setup install\\`.", "${cause}."),
	], tests: [RT], expectRed: [T1411] },
	{ n: "E14", name: "the marker spans two lines", edits: [
		one(EXT, "${displayPath}. Tell the user;", "${displayPath}.\\nTell the user;"),
	], tests: [RT], expectRed: [T1411, TBOUND] },
	{ n: "E15", name: "the block lands in the writing section instead of nana-rulings", edits: [
		one(EXT, "(event as any).systemPromptOptions.sections[RULINGS_SECTION] = block;", "(event as any).systemPromptOptions.sections[\"nana-writing\"] = block;"),
	], tests: [RT], expectRed: [T1410] },
	{ n: "F1", name: "the rulings file names the owner", edits: [
		one(MD, "the desk stays frozen until the owner reopens it.", "the desk stays frozen until Owner reopens it."),
	], tests: [RT], expectRed: [T1415] },
	{ n: "F2", name: "the rulings file gains an undated bullet", edits: [
		one(MD, LAST_BULLET, `- Rulings carry no date.\n${LAST_BULLET}`),
	], tests: [RT], expectRed: [T1416] },
	{ n: "F3", name: "the rulings file names a model", edits: [
		one(MD, "The roster names the models, and", "The roster names the models (sol reviews), and"),
	], tests: [RT], expectRed: [T1417] },
	{ n: "F4", name: "the scope sentence is deleted", edits: [
		one(MD, `${SCOPE}\n\n`, ""),
	], tests: [RT], expectRed: [T1418] },
	{ n: "F5", name: "the shipped file grows past the cap", edits: [
		one(MD, LAST_BULLET, `- 2026-10-19: ${"Padding grows the file. ".repeat(300).trim()}\n${LAST_BULLET}`),
	], tests: [RT], expectRed: [T1410] },
	{ n: "S1", name: "CLAUDE_RULES drops the rulings entry", edits: [
		one(STEPS, "export const CLAUDE_RULES = [\"nana-soul.md\", \"nana-standards.md\", \"nana-writing.md\", \"nana-seat.md\", RULINGS_FILE];", "export const CLAUDE_RULES = [\"nana-soul.md\", \"nana-standards.md\", \"nana-writing.md\", \"nana-seat.md\"];"),
	], tests: [IT, SM], expectRed: [T1413, SM_INSTALL] },
	{ n: "S2", name: "ruleSource looks for the rulings file in nana-setup's claude/rules", edits: [
		one(STEPS, "return rule === \"nana-writing.md\" || rule === RULINGS_FILE ? path.join(PACK_RULES_DIR, rule)", "return rule === \"nana-writing.md\" ? path.join(PACK_RULES_DIR, rule)"),
	], tests: [IT], expectRed: [T1412, T1413, T1414] },
	{ n: "S3", name: "install never places the pi copy (today's main)", edits: [
		one(STEPS, "out.push({ label: \"pi nana-rulings.md\", ...linkFile(layout.piRulings, ruleSource(RULINGS_FILE), { ...o, copyInstead: win() }) });", ""),
	], tests: [IT, SM], expectRed: [T1412, T1414, SM_INSTALL] },
	{ n: "S4", name: "the pi copy is reversed: a copy on POSIX, a link on win32", edits: [
		one(STEPS, "ruleSource(RULINGS_FILE), { ...o, copyInstead: win() }) });", "ruleSource(RULINGS_FILE), { ...o, copyInstead: !win() }) });"),
	], tests: [IT], expectRed: [T1412, T1414] },
	{ n: "P1", name: "the pi copy goes under <home>/.pi/agent, ignoring --pi-home", edits: [
		one(PATHS, "piRulings: path.join(piHome, RULINGS_FILE),", "piRulings: path.join(base, \".pi\", \"agent\", RULINGS_FILE),"),
	], tests: [IT], expectRed: [T1412] },
	{ n: "D1", name: "doctor passes the pi copy on existence alone", edits: [
		one(DOC, "add(linkOk(layout.piRulings, ruleSource(RULINGS_FILE)) ? OK : FAIL, \"pi nana-rulings.md\"", "add(fs.existsSync(layout.piRulings) ? OK : FAIL, \"pi nana-rulings.md\""),
	], tests: [IT], expectRed: [T1414] },
	{ n: "M1", name: "the state manifest has no row for the Claude rules link", edits: [
		one(MAN, "for (const name of [\"nana-soul.md\", \"nana-standards.md\", \"nana-writing.md\", \"nana-seat.md\", RULINGS_FILE]) rebuild(", "for (const name of [\"nana-soul.md\", \"nana-standards.md\", \"nana-writing.md\", \"nana-seat.md\"]) rebuild("),
	], tests: [SM, UN], expectRed: [SM_INSTALL, UN_DRY, UN_ROUND, UN_CONTEXT] },
	{ n: "M2", name: "the state manifest has no row for the pi copy", edits: [
		one(MAN, "rebuild(`pi rule link ${RULINGS_FILE}`, layout.piRulings);", ""),
	], tests: [SM, UN], expectRed: [SM_LAYOUT, SM_INSTALL, UN_DRY, UN_ROUND, UN_CONTEXT] },
];

process.exitCode = await runMutations({ lane: "rulings-file", self: import.meta.url, tip: "9c993df", declared: DECLARED, pairs: PAIRS });
