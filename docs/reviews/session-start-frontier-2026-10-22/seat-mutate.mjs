#!/usr/bin/env node
// Seat wrong-code pairs for lane session-start-frontier (hook lane), written by the seat 2026-10-22 after build 1, on the
// shared runner, at tip c3cf37db. They are the must-meet's eighteen pairs, with one swap: the planned pair 10 (lines split
// on \n only) is an equivalent mutant here, because every title is trimmed and the heading pattern absorbs a trailing \r,
// so p10 is instead "the unavailable line without the path" (R-2611 asserts the path). Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/session-start-frontier-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LIB = "packages/nana-pack/lib/frontier-summary.mjs";
const CHECK = "packages/nana-pack/lib/frontier-check.mjs";
const ADOPT = "packages/nana-pack/lib/adoption.mjs";
const EXT = "packages/nana-pack/extensions/nana-frontier-summary.ts";
const HOOK = "packages/nana-setup/claude/hooks/nana-objective.mjs";
const HT = "packages/nana-setup/tests/frontier-hook.test.mjs";
const ST = "packages/nana-pack/tests/frontier-summary.test.mjs";
const GT = "packages/nana-pack/tests/frontier-golden.test.mjs";
const DT = "packages/nana-setup/tests/hook-deadlines.test.mjs";
const R_2606 = /^R-2606: /; // R-2606
const R_2607 = /^R-2607: /; // R-2607
const R_2608 = /^R-2608: /; // R-2608
const R_2609 = /^R-2609: /; // R-2609
const R_2610 = /^R-2610: /; // R-2610
const R_2611 = /^R-2611: /; // R-2611
const R_2612 = /^R-2612: /; // R-2612
const R_2613 = /^R-2613: /; // R-2613
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const ROOT = "const root = repoRootOf(canonical) ?? canonical;";
const HOOK_CALLS = 'const objectiveLength = runHookProducer(hookProducerConfig("objective", repo));\nrunHookProducer({ ...hookProducerConfig("frontier", repo), args: ["--max", String(FRONTIER_HOOK_BUDGET - objectiveLength)] });';
const UNAVAILABLE = "return `${FRONTIER_HEADING}\\n${FRONTIER_UNAVAILABLE} ${readFailureCause(error, BOUNDED_READ_CAP)} (${promptPath(file)}).\\n`;";

const DECLARED = [
	"(plan) p1 to p18 follow the must-meet's wrong-code list in order; p10 is swapped as the header says",
	"(seat) p3 changes the shared root walk in adoption.mjs to accept only a .git folder, and runs only the frontier files",
];

const PAIRS = [
	{ n: "p1", name: "the hook runs the frontier producer before the objective producer", edits: [
		one(HOOK, HOOK_CALLS, 'runHookProducer({ ...hookProducerConfig("frontier", repo), args: ["--max", String(FRONTIER_HOOK_BUDGET)] });\nrunHookProducer(hookProducerConfig("objective", repo));'),
	], tests: [HT], expectRed: [R_2606] },
	{ n: "p2", name: "the producer reads <cwd>/HANDOFF.md, not the repository root's", edits: [
		one(LIB, ROOT, "const root = canonical;"),
	], tests: [HT], expectRed: [R_2606] },
	{ n: "p3", name: "the root walk accepts only a .git folder", edits: [
		one(ADOPT, 'if (present(path.join(dir, ".git"))) return dir;', 'if (fs.statSync(path.join(dir, ".git"), { throwIfNoEntry: false })?.isDirectory()) return dir;'),
	], tests: [HT], expectRed: [R_2606] },
	{ n: "p4", name: "nothing printed outside a repository", edits: [
		one(LIB, ROOT, "const root = repoRootOf(canonical);\n\tif (root === null) return null;"),
	], tests: [HT], expectRed: [R_2606] },
	{ n: "p5", name: "every list item under Next is listed, nested sub-items included", edits: [
		one(LIB, ".filter((entry) => listLead.test(entry.text[0]) && !/^\\s/.test(entry.text[0]))", ".filter(() => true)"),
	], tests: [ST], expectRed: [R_2607] },
	{ n: "p6", name: "titles from every Next-named heading", edits: [
		one(CHECK, "const nextEntries = nextHeading ? entriesBetween(nextHeading.index + 1, nextEnd) : [];", "const nextEntries = headings.filter((heading) => isNamed(heading.title, NEXT_SECTION_NAME)).flatMap((heading) => entriesBetween(heading.index + 1, heading.end));"),
	], tests: [ST], expectRed: [R_2607] },
	{ n: "p7", name: "the title keeps its bold marks", edits: [
		one(LIB, "const bold = /^\\*\\*(.+?)\\*\\*/.exec(content)?.[1];", "const bold = undefined;"),
	], tests: [ST], expectRed: [R_2607] },
	{ n: "p8", name: "asks in file order, not blocking first", edits: [
		one(LIB, "const asks = [...ASK_KIND_ORDER, null].flatMap((kind) => rawAsks.filter((ask) => kind === null ? ask.tag === null : ask.tag?.kind === kind));", "const asks = rawAsks;"),
	], tests: [ST], expectRed: [R_2607] },
	{ n: "p9", name: "an untitled ask is dropped", edits: [
		one(LIB, "const rawAsks = splitOpenSection(text).map(", "const rawAsks = splitOpenSection(text).filter((entry) => entry.title).map("),
	], tests: [ST], expectRed: [R_2607] },
	{ n: "p10", name: "the unavailable line without the path", edits: [
		one(LIB, UNAVAILABLE, "return `${FRONTIER_HEADING}\\n${FRONTIER_UNAVAILABLE} ${readFailureCause(error, BOUNDED_READ_CAP)}.\\n`;"),
	], tests: [ST], expectRed: [R_2611] },
	{ n: "p11", name: "the summary line rebuilt in the new lib with split(\" \")", edits: [
		one(LIB, "const result = checkFrontier(text, today);", 'const result = { ...checkFrontier(text, today), wordCount: text.split(" ").length };'),
	], tests: [ST], expectRed: [R_2608] },
	{ n: "p12", name: "a title rendered raw", edits: [
		one(LIB, "const cleanTitle = (title) => promptText(title, FRONTIER_TITLE_CAP);", "const cleanTitle = (title) => title;"),
	], tests: [ST], expectRed: [R_2609] },
	{ n: "p13", name: "titles chosen in display order, so a long Next pushes blocking asks out", edits: [
		one(LIB, '...asks.filter((ask) => ask.tag?.kind === "blocking"),\n\t\t...next,\n\t\t...asks.filter((ask) => ask.tag?.kind !== "blocking"),', "...next,\n\t\t...asks,"),
	], tests: [ST], expectRed: [R_2609] },
	{ n: "p14", name: "only worker is silenced", edits: [
		one(LIB, "if (LAUNCHER_ROLES.includes(env?.NANA_ROLE)) return null;", 'if (env?.NANA_ROLE === "worker") return null;'),
	], tests: [ST], expectRed: [R_2610] },
	{ n: "p15", name: "an unreadable file reads as absent", edits: [
		one(LIB, 'if (error?.code === "ENOENT") return null;', "return null;"),
	], tests: [ST], expectRed: [R_2611] },
	{ n: "p16", name: "the extension computes the block once and keeps it across a reload", edits: [
		one(EXT, "\t\tblock = null;\n\t\ttry {", "\t\tif (block) return;\n\t\ttry {"),
	], tests: [GT], expectRed: [R_2612] },
	{ n: "p17", name: "the hook writes both blocks with no shared budget", edits: [
		one(HOOK, 'args: ["--max", String(FRONTIER_HOOK_BUDGET - objectiveLength)] });', "args: [] });"),
	], tests: [DT], expectRed: [R_2613] },
	{ n: "p18", name: "the frontier producer spawned outside runHookProducer and its limit", edits: [
		one(HOOK, 'runHookProducer({ ...hookProducerConfig("frontier", repo), args: ["--max", String(FRONTIER_HOOK_BUDGET - objectiveLength)] });', 'const { spawnSync } = await import("node:child_process");\nprocess.stdout.write(spawnSync(process.execPath, [hookProducerConfig("frontier", repo).cli, "--cwd", process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), "--max", String(FRONTIER_HOOK_BUDGET - objectiveLength)], { encoding: "utf8" }).stdout ?? "");'),
	], tests: [DT], expectRed: [R_2613] },
];

process.exitCode = await runMutations({ lane: "session-start-frontier", self: import.meta.url, tip: "c3cf37db", declared: DECLARED, pairs: PAIRS });
