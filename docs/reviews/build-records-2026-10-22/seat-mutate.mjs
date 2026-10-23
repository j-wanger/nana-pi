#!/usr/bin/env node
// Seat wrong-code pairs for lane build-records (ordinary lane), written by the seat 2026-10-22 after build 1, on the
// shared runner, at tip 7804e7ed (baseline red: R-2598 failed under the runner's long temp folder), re-run at cb2d3f0a after build 2. They are the must-meet's nineteen pairs in its order. p13 uses the real-path half of
// the planned pair: macOS temp folders resolve through /private, while a missing ":" replacement can only show on Windows.
// Run from the worktree root on macOS:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/build-records-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LIB = "packages/nana-pack/lib/build-records.mjs";
const WORKER = "packages/nana-pack/bin/pi-worker.mjs";
const T = "packages/nana-pack/tests/build-records.test.mjs";
const RT = "packages/nana-pack/tests/build-report.test.mjs";
const R_2596 = /^R-2596: /; // R-2596
const R_2597 = /^R-2597: /; // R-2597
const R_2598 = /^R-2598: /; // R-2598
const R_2599 = /^R-2599: /; // R-2599
const R_2600 = /^R-2600: /; // R-2600
const R_2601 = /^R-2601: /; // R-2601
const R_2602 = /^R-2602: /; // R-2602
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const LOCK_AND_START = "acquireLaneLock(laneGitDir);\n\tkeepBuildStart(w.outPath);";
const END_CALL = "if (buildStartKept) keepBuildEnd(r, outputError);";
const NO_MATCH = "const noMatch = () => ({ usage: emptyUsage(), cost: null, costReason: `no matching session in ${folder}`, sessions: [], sessionBadLines: 0, durationMs: null, lastAt: null });";

const DECLARED = [
	"(plan) p1 to p19 follow the must-meet's wrong-code list in order",
	"(seat) p13 keeps only the real-path half of the planned pair, as the header says",
];

const PAIRS = [
	{ n: "p1", name: "the start record written only at the end, after pi ran", edits: [
		one(WORKER, LOCK_AND_START, "acquireLaneLock(laneGitDir);"),
		one(WORKER, END_CALL, "keepBuildStart(w.outPath);\n\tif (buildStartKept) keepBuildEnd(r, outputError);"),
	], tests: [T], expectRed: [R_2596] },
	{ n: "p2", name: "the start record written before the lock", edits: [
		one(WORKER, LOCK_AND_START, "keepBuildStart(w.outPath);\n\tacquireLaneLock(laneGitDir);"),
	], tests: [T], expectRed: [R_2596] },
	{ n: "p3", name: "the ledger under the pi agent folder instead of the common folder", edits: [
		one(LIB, 'return path.join(commonDir, ...BUILD_RECORDS_SUBPATH.split("/"));', 'return path.join(piAgentDir(), ...BUILD_RECORDS_SUBPATH.split("/"));'),
	], tests: [T, RT], expectRed: [R_2596] },
	{ n: "p4", name: "HEAD's short id instead of the full id", edits: [
		one(WORKER, "try { tip = git('rev-parse', 'HEAD'); } catch { tip = null; }", "try { tip = git('rev-parse', '--short', 'HEAD'); } catch { tip = null; }"),
	], tests: [T], expectRed: [R_2596] },
	{ n: "p5", name: "pid recorded as process.ppid", edits: [
		one(WORKER, "pid: process.pid,", "pid: process.ppid,"),
	], tests: [T], expectRed: [R_2596] },
	{ n: "p6", name: "slot always builder", edits: [
		one(WORKER, "selectedSlot = builderLabel === LARGER_BUILDER_LABEL ? 'largerBuilder' : 'builder';", "selectedSlot = 'builder';"),
	], tests: [T], expectRed: [R_2596] },
	{ n: "p7", name: "an end record only on success", edits: [
		one(WORKER, END_CALL, "if (buildStartKept && r.ok) keepBuildEnd(r, outputError);"),
	], tests: [T], expectRed: [R_2597] },
	{ n: "p8", name: "the end record without the build id, paired by lane", edits: [
		one(WORKER, "build: buildStart.build,", "build: buildStart.lane,"),
	], tests: [T], expectRed: [R_2597] },
	{ n: "p9", name: "usage summed from assistant messages only", edits: [
		one(LIB, 'if (entry.type === "message" && MESSAGE_ROLES.has(entry.message?.role)) addUsage(sum, entry.message?.usage);\n\t\t\telse if (ENTRY_TYPES.has(entry.type)) addUsage(sum, entry.usage);', 'if (entry.type === "message" && entry.message?.role === "assistant") addUsage(sum, entry.message?.usage);'),
	], tests: [T], expectRed: [R_2598] },
	{ n: "p10", name: "cost recomputed from tokens", edits: [
		one(LIB, "cost: costTotal(sum),", "cost: (sum.input + sum.output) / 1e6,"),
	], tests: [T], expectRed: [R_2598] },
	{ n: "p11", name: "a missing session recorded as cost 0", edits: [
		one(LIB, NO_MATCH, "const noMatch = () => ({ usage: emptyUsage(), cost: 0, costReason: null, sessions: [], sessionBadLines: 0, durationMs: null, lastAt: null });"),
	], tests: [T], expectRed: [R_2598] },
	{ n: "p12", name: "sessions matched without the start-time filter", edits: [
		one(LIB, "if (stamp === null || stamp < started || stamp >= ended) continue;", "if (stamp === null || stamp >= ended) continue;"),
	], tests: [T], expectRed: [R_2598] },
	{ n: "p13", name: "the session folder encoded from the real-path cwd", edits: [
		one(WORKER, "sessionDir: buildSessionDir(process.cwd()),", "sessionDir: buildSessionDir(fsReal(process.cwd())),"),
	], tests: [T], expectRed: [R_2598] },
	{ n: "p14", name: "PI_CODING_AGENT_SESSION_DIR used without pi's normalization", edits: [
		one(LIB, "if (envValue) return path.resolve(cwd, piNormalizePath(envValue));", "if (envValue) return envValue;"),
	], tests: [T], expectRed: [R_2598] },
	{ n: "p15", name: "a failed start append stops the build", edits: [
		one(WORKER, "const kept = appendBuildRecord(laneCommonDir, buildStart);", "const kept = appendBuildRecord(laneCommonDir, buildStart);\n\tif (!kept.ok) process.exit(1);"),
	], tests: [T], expectRed: [R_2599] },
	{ n: "p16", name: "the report counting end lines as builds", edits: [
		one(LIB, "const view = byBuild.get(record.build);\n\t\t\tif (!view || view.end) { badLines++; continue; }", "const view = byBuild.get(record.build);\n\t\t\tif (!view) { starts.push({ start: { ...record, lane: record.lane ?? \"unknown\", sessionDir: \"\", startedAt: record.endedAt }, end: record }); continue; }\n\t\t\tif (view.end) { badLines++; continue; }"),
	], tests: [RT], expectRed: [R_2600] },
	{ n: "p17", name: "the report stopping at a torn line", edits: [
		one(LIB, "try { record = JSON.parse(line); } catch { badLines++; continue; }", "try { record = JSON.parse(line); } catch { badLines++; break; }"),
	], tests: [RT], expectRed: [R_2600] },
	{ n: "p18", name: "an unpaired start counted as ok", edits: [
		one(LIB, 'view.outcome = "no end";', 'view.outcome = "ok";'),
	], tests: [RT], expectRed: [R_2601] },
	{ n: "p19", name: "the lane line rendered before this build's end record is appended", edits: [
		one(WORKER, "laneLine = renderLaneLine(readBuildLedger(buildRecordsPath(laneCommonDir), { maxBytes: BUILD_LEDGER_READ_MAX_BYTES }).records, lane);", "laneLine = renderLaneLine(readBuildLedger(buildRecordsPath(laneCommonDir), { maxBytes: BUILD_LEDGER_READ_MAX_BYTES }).records.slice(0, -1), lane);"),
	], tests: [T], expectRed: [R_2602] },
];

process.exitCode = await runMutations({ lane: "build-records", self: import.meta.url, tip: "2a459ac9", declared: DECLARED, pairs: PAIRS });
