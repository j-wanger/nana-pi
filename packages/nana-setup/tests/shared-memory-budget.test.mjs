/**
 * @module packages/nana-setup/tests/shared-memory-budget.test.mjs
 * @purpose Pin the shared-memory hook's bounded, structure-preserving index output.
 * @inputs The shared-memory hook, its sealed output configuration, and generated throwaway indexes.
 * @outputs PASS/FAIL lines for seven requirement checks and exit 1 when any check fails.
 * @effects disk (temporary homes and indexes), process (runs the Node hook).
 * @errors A failed check prints FAIL; unexpected fixture or process errors propagate.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { SHARED_MEMORY_OUTPUT_BUDGET, SHARED_MEMORY_TRIM_MARK } from "../lib/shared-memory-config.mjs";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const hook = path.join(pkg, "claude", "hooks", "nana-shared-memory.mjs");
const project = path.join(os.tmpdir(), "made-up-orchid-project");
let fails = 0;
const check = (name, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

function runFixture(label, entries, eol = "\n", existingHome) {
	const home = existingHome ?? tmpDir(path.join(os.tmpdir(), `nana-budget-${label}-`));
	const shared = path.join(home, ".claude", "nana-memory", "shared");
	const idx = path.join(shared, "MEMORY.md");
	fs.mkdirSync(shared, { recursive: true });
	fs.writeFileSync(idx, ["# Made-up shared index", "", ...entries].join(eol));
	const result = spawnSync(process.execPath, [hook], {
		encoding: "utf8",
		input: "",
		timeout: 5000,
		env: { PATH: process.env.PATH, HOME: home, USERPROFILE: home, CLAUDE_PROJECT_DIR: project },
	});
	if (result.error) throw result.error;
	if (result.status !== 0) throw new Error(`${label}: hook exited ${result.status}: ${result.stderr}`);
	return { ...result, home, idx, entries };
}

const headOf = (line) => line.match(/^- \[[^\]]*\]\([^)]*\)/)?.[0] ?? line;
const outputEntries = (run) => run.stdout.split("\n").filter((line) => /^- \[/.test(line));
const lastLine = (run) => run.stdout.trimEnd().split("\n").at(-1);
const escaped = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const countFor = (sampleLength) => Math.ceil((SHARED_MEMORY_OUTPUT_BUDGET * 1.5) / sampleLength);

// Fixture A: CRLF source lines with descriptions around 200 characters.
const aSample = "- [Amber 0000](amber-0000.md) — " + "a".repeat(200) + " ";
const aEntries = Array.from({ length: countFor(aSample.length + 2) }, (_, i) =>
	`- [Amber ${String(i).padStart(4, "0")}](amber-${String(i).padStart(4, "0")}.md) — ${"a".repeat(200)}${i % 2 ? " " : "\t"}`,
);
const fixtureA = runFixture("a", aEntries, "\r\n");

// Fixture D: each six-line group has four short, one long and one very long description.
const dDescriptionLengths = [20, 20, 20, 20, 200, 700];
const dSampleLength = dDescriptionLengths.reduce((sum, length, i) => sum + `- [Dahlia ${i}](dahlia-${i}.md) — ${"d".repeat(length)}\n`.length, 0);
const dGroups = Math.ceil((SHARED_MEMORY_OUTPUT_BUDGET * 1.5) / dSampleLength);
const dEntries = Array.from({ length: dGroups * dDescriptionLengths.length }, (_, i) => {
	const length = dDescriptionLengths[i % dDescriptionLengths.length];
	return `- [Dahlia ${String(i).padStart(4, "0")}](dahlia-${String(i).padStart(4, "0")}.md) — ${"d".repeat(length)}`;
});
const fixtureD = runFixture("d", dEntries);
const dPrinted = outputEntries(fixtureD);
const dPairs = dPrinted.map((line, i) => ({ source: dEntries[i], line, head: headOf(dEntries[i]) }));
const dShortened = dPairs.filter(({ source, line }) => line !== source && line.endsWith(SHARED_MEMORY_TRIM_MARK));
const dWhole = dPairs.filter(({ source, line }) => line === source);
const dPrefixLengths = dShortened.map(({ line, head }) => line.slice(head.length, -SHARED_MEMORY_TRIM_MARK.length).length);
const dCommonLength = dPrefixLengths[0];
const dOrderAndCuts = dPrinted.length === dEntries.length
	&& dPairs.every(({ line, head }) => line.startsWith(head))
	&& dWhole.length > 0
	&& dShortened.length > 0
	&& dPrefixLengths.every((length) => length === dCommonLength)
	&& dWhole.every(({ source, head }) => source.slice(head.length).length <= dCommonLength)
	&& dShortened.every(({ source, head }) => source.slice(head.length).length > dCommonLength)
	&& fixtureD.stdout.length + dShortened.length + 2 * String(dEntries.length).length > SHARED_MEMORY_OUTPUT_BUDGET;
// req: R-2341
check("R-2341: over budget, every entry prints and only the longest descriptions are cut, all to the longest length that fits", dOrderAndCuts, `printed=${dPrinted.length}/${dEntries.length} whole=${dWhole.length} shortened=${dShortened.length} lengths=${[...new Set(dPrefixLengths)]} output=${fixtureD.stdout.length}`);

// Fixture E: astral descriptions have opposite parity so a common cut meets a surrogate boundary.
const eSample = "- [Elm 0000](elm-0000.md) — " + "😀".repeat(180);
const eCount = countFor(eSample.length + 1);
const eEntries = Array.from({ length: eCount }, (_, i) =>
	`- [Elm ${String(i).padStart(4, "0")}](elm-${String(i).padStart(4, "0")}.md) — ${(i % 2 ? "x" : "") + "😀".repeat(180)}`,
);
const fixtureE = runFixture("e", eEntries);
const ePrinted = outputEntries(fixtureE);
const eShortened = ePrinted.map((line, i) => ({ line, source: eEntries[i], head: headOf(eEntries[i]) })).filter(({ line, source }) => line !== source);
const eWholeCharacters = eShortened.length > 0 && eShortened.every(({ line, source, head }) =>
	line.startsWith(head)
	&& line.endsWith(SHARED_MEMORY_TRIM_MARK)
	&& !line.includes("�")
	&& source.slice(head.length).startsWith(line.slice(head.length, -SHARED_MEMORY_TRIM_MARK.length)),
);
// req: R-2342
check("R-2342: a shortened line keeps its whole title and link and ends on a whole character before the trim mark", eWholeCharacters, `shortened=${eShortened.length} replacement=${fixtureE.stdout.includes("�")}`);

// Fixture B: long heads cannot all fit even after descriptions are removed.
const bSample = `- [${"B".repeat(96)} 0000](bluebell-0000.md) — brief`;
const bEntries = Array.from({ length: countFor(bSample.length + 1) }, (_, i) =>
	`- [${"B".repeat(96)} ${String(i).padStart(4, "0")}](bluebell-${String(i).padStart(4, "0")}.md) — brief`,
);
const fixtureB = runFixture("b", bEntries);
const bPrinted = outputEntries(fixtureB);
const bLeadingWholeLines = bPrinted.length > 0
	&& bPrinted.length < bEntries.length
	&& bPrinted.every((line, i) => line === headOf(bEntries[i]) + SHARED_MEMORY_TRIM_MARK)
	&& !fixtureB.stdout.includes(headOf(bEntries[bPrinted.length]));
// req: R-2343
check("R-2343: when titles alone overflow the budget, leading entries print and trailing entries are left out whole", bLeadingWholeLines, `printed=${bPrinted.length}/${bEntries.length}`);

// Fixture F: 60-character titles fill the budget without, but not with, the required fold line.
const fixtureFEmpty = runFixture("f-empty", []);
const fHead = `- [${"F".repeat(60)}](f.md)`;
const fZeroLineLength = fHead.length + SHARED_MEMORY_TRIM_MARK.length + 1;
const fCount = Math.floor((SHARED_MEMORY_OUTPUT_BUDGET - fixtureFEmpty.stdout.length) / fZeroLineLength);
const fEntries = Array.from({ length: fCount }, () => `${fHead} — brief`);
const fixtureF = runFixture("f-boundary", fEntries, "\n", fixtureFEmpty.home);

// Fixture G: a symlinked project path adds the self-heal note to an over-budget index.
const gHome = tmpDir(path.join(os.tmpdir(), "nana-budget-g-"));
const gProjects = path.join(gHome, ".claude", "projects");
const gExternal = tmpDir(path.join(os.tmpdir(), "nana-budget-g-external-"));
fs.mkdirSync(path.dirname(gProjects), { recursive: true });
fs.symlinkSync(gExternal, gProjects);
const fixtureG = runFixture("g-note", aEntries, "\n", gHome);

const budgetLengths = [fixtureA, fixtureB, fixtureF, fixtureG].map(({ stdout }) => stdout.length);
// req: R-2340
check("R-2340: an over-budget CRLF index prints at most the output budget", budgetLengths.every((length) => length <= SHARED_MEMORY_OUTPUT_BUDGET), `lengths=${budgetLengths.join(",")}`);

function foldHasCounts(run, shortened, total, leftOut) {
	const fold = lastLine(run);
	const beforePath = fold.slice(0, fold.lastIndexOf(run.idx));
	return new RegExp(`\\b${shortened}\\b.*\\b${total}\\b.*\\b${leftOut}\\b`).test(beforePath)
		&& fold.endsWith(run.idx);
}
const foldsDescribeDAndB = foldHasCounts(fixtureD, dShortened.length, dEntries.length, 0)
	&& foldHasCounts(fixtureB, bPrinted.length, bEntries.length, bEntries.length - bPrinted.length)
	&& new RegExp(`${escaped(fixtureD.idx)}$`).test(lastLine(fixtureD))
	&& new RegExp(`${escaped(fixtureB.idx)}$`).test(lastLine(fixtureB));
// req: R-2344
check("R-2344: a trimmed index ends with a line naming the shortened and left-out counts and the full index path", foldsDescribeDAndB, `D=${lastLine(fixtureD)} B=${lastLine(fixtureB)}`);

// Fixture C: learn this temporary home's header length, then fill output exactly to the budget.
const fixtureCEmpty = runFixture("c-empty", []);
const cHead = "- [Clover](clover.md)";
const cDescription = " — " + "c".repeat(SHARED_MEMORY_OUTPUT_BUDGET - fixtureCEmpty.stdout.length - cHead.length - " — ".length - 1);
const cLine = cHead + cDescription;
const fixtureC = runFixture("c-exact", [cLine], "\n", fixtureCEmpty.home);
// req: R-2345
check("R-2345: an index whose output is exactly the budget prints every line unchanged with no fold line", fixtureC.stdout === fixtureCEmpty.stdout + cLine + "\n" && fixtureC.stdout.length === SHARED_MEMORY_OUTPUT_BUDGET, `length=${fixtureC.stdout.length} last=${lastLine(fixtureC)}`);

// req: R-2346
check("R-2346: seal: SHARED_MEMORY_OUTPUT_BUDGET is 9,000 characters", SHARED_MEMORY_OUTPUT_BUDGET === 9000, SHARED_MEMORY_OUTPUT_BUDGET);

console.log(`INFO output lengths: A=${fixtureA.stdout.length} D=${fixtureD.stdout.length}`);
process.exit(fails);
