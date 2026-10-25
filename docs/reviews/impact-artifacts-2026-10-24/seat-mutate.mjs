#!/usr/bin/env node
// Seat wrong-code pairs for lane impact-artifacts (ordinary), written by the seat 2026-10-24 after build 1 at f5a2927d; re-run at c50dc854 after build 2 widened the fixture.
// They follow the must-meet rows' red cases (R-2820 to R-2823) and the seal.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/impact-artifacts-2026-10-24/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const SH = "scripts/code-map.mjs";
const CF = "packages/nana-pack/lib/runtime-map-config.mjs";
const T = "packages/nana-pack/tests/runtime-map.test.mjs";
const R_2820 = /^R-2820: /; // R-2820
const R_2821 = /^R-2821: /; // R-2821
const R_2822 = /^R-2822: /; // R-2822
const R_2823 = /^R-2823: /; // R-2823
const SEAL = /^seal: the artifact block/; // R-2820 R-2821 R-2822 R-2823
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DECLARED = [
	"(seat) pairs 1 to 9 follow R-2820's red cases; 10 to 15 R-2821's; 16 to 20 R-2822's; 21 to 23 R-2823's; 24 the seal",
	"(seat) declared non-pairs: 'the generator output changed' (the block never edits it; R-1272's prefix check guards it) and 'a changed exit code' (the tail passes the generator's code to process.exit unchanged; no one-line edit inside the block reaches it)",
];

const PAIRS = [
	{ n: "1", name: "the block keys on the raw argument", edits: [one(SH, "const paths = resolveImpactPaths(argv.slice(1), root, graph);", "const paths = argv.slice(1);")], tests: [T], expectRed: [R_2820] },
	{ n: "2", name: "readers of a different artifact are listed", edits: [one(SH, "reads.reads.filter((item) => item.id === entry.id && item.featureId !== entry.featureId)", "reads.reads.filter((item) => item.featureId !== entry.featureId)")], tests: [T], expectRed: [R_2820] },
	{ n: "3", name: "a reader is dropped", edits: [one(SH, "for (const reader of read.readers) {", "for (const reader of read.readers.slice(0, 1)) {")], tests: [T], expectRed: [R_2820] },
	{ n: "4", name: "the import-path mark is inverted", edits: [one(SH, "${radius.has(reader) ? \"\" : ` ${ARTIFACT_NO_IMPORT_PATH}`}", "${radius.has(reader) ? ` ${ARTIFACT_NO_IMPORT_PATH}` : \"\"}")], tests: [T], expectRed: [R_2820] },
	{ n: "5", name: "the radius is the union over all named files", edits: [one(SH, "const radius = new Set([file, ...impact(graph, [file]).callers, ...impact(graph, [file]).callees]);", "const radius = new Set([...paths, ...impact(graph, paths).callers, ...impact(graph, paths).callees]);")], tests: [T], expectRed: [R_2820] },
	{ n: "6", name: "a dash is printed when a reader exists", edits: [one(SH, "out.push(`    ${ARTIFACT_READ_BY}: ${readers.join(\"; \") || \"—\"}`);", "out.push(`    ${ARTIFACT_READ_BY}: —`);")], tests: [T], expectRed: [R_2820] },
	{ n: "7", name: "the maker feature is missing", edits: [one(SH, "out.push(`  ${ARTIFACT_WRITES} ${entry.id} ${entry.name} · ${entry.featureId} · ${entry.run}`);", "out.push(`  ${ARTIFACT_WRITES} ${entry.id} ${entry.name} · ${entry.run}`);")], tests: [T], expectRed: [R_2820] },
	{ n: "8", name: "the file is listed as its own reader", edits: [one(SH, "if (reader === file) continue;", "void 0;")], tests: [T], expectRed: [R_2820] },
	{ n: "9", name: "a reader keeps only its first feature", edits: [one(SH, "byPath.get(reader).add(read.featureId);", "if (!byPath.get(reader).size) byPath.get(reader).add(read.featureId);")], tests: [T], expectRed: [R_2820] },
	{ n: "10", name: "reads keep Reads-line order", edits: [one(SH, ".sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));", ".sort(() => 0);")], tests: [T], expectRed: [R_2821] },
	{ n: "11", name: "a read ID repeats", edits: [one(SH, "const readIds = [...new Set(reads.reads.filter((entry) => entry.readers.includes(file)).map((entry) => entry.id))]", "const readIds = [...reads.reads.filter((entry) => entry.readers.includes(file)).map((entry) => entry.id)]")], tests: [T], expectRed: [R_2821] },
	{ n: "12", name: "a written ID repeats on the reads line", edits: [one(SH, ".filter((id) => !writes.some((entry) => entry.id === id))", ".filter(() => true)")], tests: [T], expectRed: [R_2821] },
	{ n: "13", name: "the star is inverted", edits: [one(SH, "return `${id}${entry.writers.some((writer) => radius.has(writer)) ? \"\" : ARTIFACT_STAR}`;", "return `${id}${entry.writers.some((writer) => radius.has(writer)) ? ARTIFACT_STAR : \"\"}`;")], tests: [T], expectRed: [R_2821] },
	{ n: "14", name: "a retired ID is starred", edits: [one(SH, "if (!entry?.live) return `${id} ${ARTIFACT_NO_LIVE_ENTRY}`;", "if (!entry) return `${id} ${ARTIFACT_NO_LIVE_ENTRY}`;")], tests: [T], expectRed: [R_2821] },
	{ n: "15", name: "an unknown ID throws", edits: [one(SH, "if (!entry?.live) return `${id} ${ARTIFACT_NO_LIVE_ENTRY}`;", "if (entry && !entry.live) return `${id} ${ARTIFACT_NO_LIVE_ENTRY}`;")], tests: [T], expectRed: [R_2821] },
	{ n: "16", name: "the block prints after the runtime block", edits: [one(SH, "\t\tprocess.stdout.write(await artifactBlock(REPO_ROOT, argv));\n\t\tprintRuntimeBlock(REPO_ROOT, argv);", "\t\tprintRuntimeBlock(REPO_ROOT, argv);\n\t\tprocess.stdout.write(await artifactBlock(REPO_ROOT, argv));")], tests: [T], expectRed: [R_2822] },
	{ n: "17", name: "the closing note is missing", edits: [one(SH, "out.push(ARTIFACT_CLOSING_NOTE);", "void 0;")], tests: [T], expectRed: [R_2822] },
	{ n: "18", name: "the closing note prints per file", edits: [one(SH, "out.push(`${ARTIFACT_HEADING} ${file} (${ids.size}):`);", "out.push(ARTIFACT_CLOSING_NOTE); out.push(`${ARTIFACT_HEADING} ${file} (${ids.size}):`);")], tests: [T], expectRed: [R_2822] },
	{ n: "19", name: "a file with no link prints only its heading", edits: [one(SH, "if (!ids.size) out.push(`  ${ARTIFACT_NONE} ${file}`);", "void 0;")], tests: [T], expectRed: [R_2822] },
	{ n: "20", name: "the default loader cannot load", edits: [one(SH, "import(\"./deliverables.mjs\")", "import(\"./deliverable.mjs\")")], tests: [T], expectRed: [R_2822] },
	{ n: "21", name: "a failure throws", edits: [one(SH, "return `\\n${ARTIFACT_NOTE_PREFIX} ${error instanceof Error ? error.message : String(error)}\\n`;", "throw error;")], tests: [T], expectRed: [R_2823] },
	{ n: "22", name: "an unusable ledger is not caught", edits: [one(SH, "if (problem) return `\\n${ARTIFACT_NOTE_PREFIX} ${problem}\\n`;", "if (false) return `\\n${ARTIFACT_NOTE_PREFIX} ${problem}\\n`;")], tests: [T], expectRed: [R_2823] },
	{ n: "23", name: "an unusable ledger prints two notes", edits: [one(SH, "if (problem) return `\\n${ARTIFACT_NOTE_PREFIX} ${problem}\\n`;", "if (problem) return `\\n${ARTIFACT_NOTE_PREFIX} ${problem}\\n${ARTIFACT_NOTE_PREFIX} ${problem}\\n`;")], tests: [T], expectRed: [R_2823] },
	{ n: "24", name: "the star label changes", edits: [one(CF, "export const ARTIFACT_STAR = \"*\";", "export const ARTIFACT_STAR = \"+\";")], tests: [T], expectRed: [SEAL] },
];

process.exitCode = await runMutations({ lane: "impact-artifacts", self: import.meta.url, tip: "c50dc854", declared: DECLARED, pairs: PAIRS });
