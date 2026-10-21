/**
 * @module packages/nana-pack/tests/known-bugs.test.mjs
 * @purpose Pins the repository known-bug pointer and the known-bug ledger checker against lifecycle, naming, and read-window cases.
 * @inputs this repository's HANDOFF.md and known-bug folder, the known-bug checker, and temporary ledgers and known-bug entries
 * @outputs named PASS/FAIL checks and a nonzero test exit when an assertion fails
 * @effects disk (OS temporary fixtures)
 * @errors failed assertions are reported and cause exit 1
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { KNOWN_BUGS_DIR, UNPLACED_FILE, checkKnownBugs } from "../../../scripts/known-bugs.mjs";
import { READ_WINDOW_BYTES, READ_WINDOW_LINES } from "../lib/frontier-config.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
let fails = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (!ok) fails++;
};

function handoffKnownBugsValid(text) {
	const lines = (text.startsWith("\ufeff") ? text.slice(1) : text).split(/\r?\n/);
	const headings = [];
	let fence = null;
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line);
		if (marker) {
			if (!fence) fence = { char: marker[1][0], length: marker[1].length };
			else if (marker[1][0] === fence.char && marker[1].length >= fence.length) fence = null;
			continue;
		}
		if (fence) continue;
		const heading = /^ {0,3}(#{1,6})[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line);
		if (heading) headings.push({ index, level: heading[1].length, title: heading[2].trim() });
	}
	if (headings.some((heading) => heading.title === "Carried residuals")) return false;
	const known = headings.filter((heading) => heading.title === "Known bugs");
	if (known.length !== 1) return false;
	const start = known[0];
	const stop = headings.find((heading) => heading.index > start.index && heading.level <= start.level)?.index ?? lines.length;
	const body = lines.slice(start.index + 1, stop);
	return body.some((line) => line.includes(KNOWN_BUGS_DIR)) && !body.some((line) => /^\s*(?:[-*+] |\d+[.)] )/.test(line));
}

{
	const repository = fs.readFileSync(path.join(REPO, "HANDOFF.md"), "utf8");
	const windowsPass = `# Handoff\r\n\r\n\`\`\`md\r\n## Carried residuals\r\n\`\`\`\r\n\r\n## Known bugs \t\r\nKnown bugs live in ${KNOWN_BUGS_DIR}. \t`;
	const listControl = `## Known bugs\n${KNOWN_BUGS_DIR}\n- one finding`;
	const carriedControl = `## Known bugs\n${KNOWN_BUGS_DIR}\n## Carried residuals\nold`;
	const landedOnlyControl = `## Landed\n${KNOWN_BUGS_DIR}\n## Known bugs\nNo list here.`;
	// req: R-2505
	check("R-2505: this repository's HANDOFF.md points to the known-bugs folder from a Known bugs section with no list item and has no Carried residuals heading",
		handoffKnownBugsValid(repository) && handoffKnownBugsValid(windowsPass) &&
		!handoffKnownBugsValid(listControl) && !handoffKnownBugsValid(carriedControl) && !handoffKnownBugsValid(landedOnlyControl));
}

function makeRoot(label, ledger) {
	const root = tmpDir(path.join(os.tmpdir(), `known-bugs-${label}-`));
	fs.mkdirSync(path.join(root, KNOWN_BUGS_DIR), { recursive: true });
	if (ledger !== null) fs.writeFileSync(path.join(root, "REQUIREMENTS.md"), ledger);
	return root;
}
function touchEntries(root, entries) {
	for (const entry of entries) {
		const target = path.join(root, KNOWN_BUGS_DIR, entry);
		if (entry.endsWith("/")) fs.mkdirSync(target, { recursive: true });
		else fs.writeFileSync(target, "entry\n");
	}
}

{
	const ledger = "\ufeff" + [
		"## FEAT-001 · Active", "Purpose: active fixture", "Status: active \t",
		"## FEAT-002 · Frozen", "Purpose: frozen fixture", "Status: frozen (x)",
		"## FEAT-003 · Retired", "Purpose: retired fixture", "Status: retired (FEAT-001)",
		"## FEAT-004 · Proposed", "Purpose: proposed fixture", "Status: proposed",
	].join("\r\n");
	const root = makeRoot("names", ledger);
	const passing = ["FEAT-001.md", "FEAT-002.md", UNPLACED_FILE];
	const reported = ["FEAT-003.md", "FEAT-004.md", "FEAT-099.md", "SUB-005.md", "notes.md", "nested/"];
	touchEntries(root, [...passing, ...reported]);
	const actual = checkKnownBugs({ root }).nameFindings.map((finding) => finding.name).sort();
	const lowercase = makeRoot("lowercase", ledger);
	touchEntries(lowercase, ["feat-001.md"]);
	const uppercaseExtension = makeRoot("uppercase-extension", ledger);
	touchEntries(uppercaseExtension, ["FEAT-001.MD"]);
	const flat = makeRoot("flat", "| ID | Requirement | Status | Evidence |\r\n|---|---|---|---|\r\n| R-001 | One shall hold. | implemented | — |");
	touchEntries(flat, [UNPLACED_FILE, "FEAT-001.md"]);
	const absent = makeRoot("absent", null);
	touchEntries(absent, [UNPLACED_FILE, "FEAT-001.md"]);
	// req: R-2506
	check("R-2506: a known-bug entry named for a missing, proposed or retired feature, or not named for a feature, is reported",
		JSON.stringify(actual) === JSON.stringify(reported.map((name) => name.replace(/\/$/, "")).sort()) &&
		JSON.stringify(checkKnownBugs({ root: lowercase }).nameFindings.map((finding) => finding.name)) === JSON.stringify(["feat-001.md"]) &&
		JSON.stringify(checkKnownBugs({ root: uppercaseExtension }).nameFindings.map((finding) => finding.name)) === JSON.stringify(["FEAT-001.MD"]) &&
		JSON.stringify(checkKnownBugs({ root: flat }).nameFindings.map((finding) => finding.name)) === JSON.stringify(["FEAT-001.md"]) &&
		JSON.stringify(checkKnownBugs({ root: absent }).nameFindings.map((finding) => finding.name)) === JSON.stringify(["FEAT-001.md"]),
		actual.join(", "));
	for (const fixture of [root, lowercase, uppercaseExtension, flat, absent]) fs.rmSync(fixture, { recursive: true, force: true });
}

{
	const features = ["FEAT-001", "FEAT-002", "FEAT-003", "FEAT-004"];
	const ledger = features.flatMap((feature) => [`## ${feature} · Size fixture`, "Purpose: size fixture", "Status: active"]).join("\n");
	const root = makeRoot("sizes", ledger);
	const bugDir = path.join(root, KNOWN_BUGS_DIR);
	const byteText = `\ufeff${"é".repeat((READ_WINDOW_BYTES - 2) / 2)}`;
	const lineText = Array.from({ length: READ_WINDOW_LINES + 1 }, (_, index) => index % 2 ? "x \t" : "x ").join("\r\n");
	const exactBytesText = "x".repeat(READ_WINDOW_BYTES);
	const exactLinesText = Array.from({ length: READ_WINDOW_LINES }, (_, index) => index % 2 ? "x \t" : "x ").join("\r\n");
	fs.writeFileSync(path.join(bugDir, `${features[0]}.md`), byteText);
	fs.writeFileSync(path.join(bugDir, `${features[1]}.md`), lineText);
	fs.writeFileSync(path.join(bugDir, `${features[2]}.md`), exactBytesText);
	fs.writeFileSync(path.join(bugDir, `${features[3]}.md`), exactLinesText);
	const sizes = checkKnownBugs({ root }).sizeLines;
	const byName = new Map(sizes.map((finding) => [finding.name, finding]));
	// req: R-2507
	check("R-2507: a known-bug file over the read window in bytes or in lines is reported with its counts",
		Buffer.byteLength(byteText) === READ_WINDOW_BYTES + 1 && byteText.length < READ_WINDOW_BYTES &&
		byName.get(`${features[0]}.md`)?.bytes === READ_WINDOW_BYTES + 1 && byName.get(`${features[0]}.md`)?.lines === 1 &&
		byName.get(`${features[1]}.md`)?.bytes === Buffer.byteLength(lineText) && byName.get(`${features[1]}.md`)?.lines === READ_WINDOW_LINES + 1 &&
		!byName.has(`${features[2]}.md`) && !byName.has(`${features[3]}.md`) && sizes.length === 2,
		JSON.stringify(sizes));
	fs.rmSync(root, { recursive: true, force: true });
}

{
	const result = checkKnownBugs({ root: REPO });
	const entries = fs.readdirSync(path.join(REPO, KNOWN_BUGS_DIR));
	// req: R-2508
	check("R-2508: this repository's known-bugs folder holds feature files and gets no name finding",
		entries.some((name) => /^FEAT-\d{3}\.md$/.test(name)) && result.nameFindings.length === 0,
		JSON.stringify(result.nameFindings));
	for (const line of result.sizeLines) console.log(`SIZE ${line.name} bytes=${line.bytes} lines=${line.lines}`);
}

if (fails) process.exitCode = 1;
