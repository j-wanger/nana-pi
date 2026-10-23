#!/usr/bin/env node
// Seat wrong-code pairs for lane project-drift-notice (hook lane), written by the seat 2026-10-22 after build 1, on the
// shared runner, at tip e1ac980f. They are the must-meet's fifteen pairs in its order. Run from the worktree root on
// macOS:   SEAT_MUTATE_OUT=<file> node docs/reviews/project-drift-notice-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LIB = "packages/nana-setup/lib/stale-copies.mjs";
const REGION = "packages/nana-setup/lib/working-region.mjs";
const BIN = "packages/nana-setup/bin/stale-copies.mjs";
const RULINGS = "packages/nana-pack/extensions/nana-rulings.ts";
const T = "packages/nana-setup/tests/project-stale.test.mjs";
const R_2623 = /^R-2623: /; // R-2623
const R_2624 = /^R-2624: /; // R-2624
const R_2625 = /^R-2625: /; // R-2625
const R_2626 = /^R-2626: /; // R-2626
const R_2627 = /^R-2627: /; // R-2627
const R_2628 = /^R-2628: /; // R-2628
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const ROOT = "const root = repoRootOf(session);";
const VERDICT = "if (regionVerdict(text, readSharedWorking()) !== \"differs\") return \"\";";
const EARLY_WRITE = "const projectNotice = projectStaleLine(sessionDir);\nif (projectNotice) process.stdout.write(`${projectNotice}\\n`);\n";
const GATE = "if (hasAdoptionInstallRecord(layout, settings)) {";

const DECLARED = [
	"(plan) p1 to p15 follow the must-meet's wrong-code list in order",
	"(seat) p7 skips the dismissal-marker guard, one of the four D2 guards the plan lists",
	"(seat) p11 has the Claude producer await checkProject whole before its line: checkProject is async, so the sync lib cannot call it; run 1's import-only form was too weak (loading project.mjs spawns nothing)",
];

const PAIRS = [
	{ n: "p1", name: "the producer judges process.cwd(), not --cwd", edits: [
		one(BIN, "const sessionDir = cwdIndex >= 0 ? process.argv[cwdIndex + 1] : undefined;", "const sessionDir = process.cwd();"),
	], tests: [T], expectRed: [R_2623] },
	{ n: "p2", name: "no walk to the repository root", edits: [
		one(LIB, ROOT, "const root = fs.existsSync(path.join(session, \".git\")) ? session : null;"),
	], tests: [T], expectRed: [R_2623] },
	{ n: "p3", name: "the root rendered with no quote or span check", edits: [
		one(LIB, "if (!root.includes('\"') && printable(root)) {", "if (true) {"),
	], tests: [T], expectRed: [R_2623] },
	{ n: "p4", name: "no CRLF normalisation", edits: [
		one(REGION, "const actual = text.slice(begins[0].end, ends[0].start).replace(/\\r\\n/g, \"\\n\");", "const actual = text.slice(begins[0].end, ends[0].start);"),
	], tests: [T], expectRed: [R_2624] },
	{ n: "p5", name: "markers found by a line scan that ignores fences", edits: [
		one(REGION, "const markers = markerLines(text);", "const markers = [...text.matchAll(/^(<!-- nana:working-under-nana-pi (?:begin|end) -->)\\r?(?:\\n|$)/gm)].map((m) => ({ marker: m[1], start: m.index, end: m.index + m[0].length }));"),
	], tests: [T], expectRed: [R_2624] },
	{ n: "p6", name: "a symlinked AGENTS.md followed", edits: [
		one(LIB, "const stat = fs.lstatSync(agents);", "const stat = fs.statSync(agents);"),
	], tests: [T], expectRed: [R_2624] },
	{ n: "p7", name: "the dismissal-marker guard skipped", edits: [
		one(LIB, "fs.lstatSync(path.join(root, MARKER));\n\t\t\treturn \"\";", "fs.lstatSync(path.join(root, MARKER));"),
	], tests: [T], expectRed: [R_2624] },
	{ n: "p8", name: "invalid UTF-8 decoded loosely and counted as differs", edits: [
		one(LIB, "new TextDecoder(\"utf-8\", { fatal: true, ignoreBOM: true })", "new TextDecoder(\"utf-8\", { fatal: false, ignoreBOM: true })"),
	], tests: [T], expectRed: [R_2624] },
	{ n: "p9", name: "a second comparison that collapses blank lines", edits: [
		one(LIB, VERDICT, "if (regionVerdict(text.replace(/\\n{2,}/g, \"\\n\"), readSharedWorking().replace(/\\n{2,}/g, \"\\n\")) !== \"differs\") return \"\";"),
	], tests: [T], expectRed: [R_2628] },
	{ n: "p10", name: "the root found with git rev-parse --show-toplevel", edits: [
		one(LIB, ROOT, "const root = (() => { const r = process.getBuiltinModule(\"node:child_process\").spawnSync(\"git\", [\"rev-parse\", \"--show-toplevel\"], { cwd: session, encoding: \"utf8\" }); return r.status === 0 ? canonicalCwd(r.stdout.trim()) : null; })();"),
	], tests: [T], expectRed: [R_2627] },
	{ n: "p11", name: "the producer runs checkProject on the session folder whole", edits: [
		one(BIN, "const projectNotice = projectStaleLine(sessionDir);", "await (await import(\"../lib/project.mjs\")).checkProject(sessionDir);\nconst projectNotice = projectStaleLine(sessionDir);"),
	], tests: [T], expectRed: [R_2627] },
	{ n: "p12", name: "no role guard", edits: [
		one(LIB, "if (LAUNCHER_ROLES.includes(env?.NANA_ROLE)) return \"\";", "if (false) return \"\";"),
	], tests: [T], expectRed: [R_2626] },
	{ n: "p13", name: "the pi line computed once per process", edits: [
		one(RULINGS, "projectStale = projectStaleLine(ctx?.cwd);", "projectStale ||= projectStaleLine(ctx?.cwd);"),
	], tests: [T], expectRed: [R_2625] },
	{ n: "p14", name: "the pi section set to an empty string when no line", edits: [
		one(RULINGS, "if (projectStale) (event as any).systemPromptOptions.sections[PROJECT_STALE_SECTION] = projectStale;", "(event as any).systemPromptOptions.sections[PROJECT_STALE_SECTION] = projectStale;"),
	], tests: [T], expectRed: [R_2625] },
	{ n: "p15", name: "the project-stale line computed after the install-record gate", edits: [
		one(BIN, EARLY_WRITE, ""),
		one(BIN, GATE, `${GATE}\n\tconst projectNotice = projectStaleLine(sessionDir);\n\tif (projectNotice) process.stdout.write(\`\${projectNotice}\\n\`);`),
	], tests: [T], expectRed: [R_2623] },
];

process.exitCode = await runMutations({ lane: "project-drift-notice", self: import.meta.url, tip: "e1ac980f", declared: DECLARED, pairs: PAIRS });
