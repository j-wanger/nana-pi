#!/usr/bin/env node
// Seat wrong-code pairs for lane report-at-land (ordinary), written for the seat 2026-10-23 after build 1, at tip 4722da58.
// They are the draft's pairs 1 to 19 (plan-draft.md; pair 20 drops with R-2746), the must-meet's 21, 22, 23 and 25,
// and two seat pairs (S1, S2). Pair 24 is a declared non-pair.
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/report-at-land-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const TL = "scripts/test-locked.mjs";
const PR = "scripts/product-report.mjs";
const DL = "scripts/deliverables.mjs";
const SR = "packages/nana-pack/lib/suite-records.mjs";
const T_LAND = "packages/nana-pack/tests/runtime-land.test.mjs";
const T_DEL = "packages/nana-pack/tests/requirements-deliverables.test.mjs";
const T_PR = "packages/nana-pack/tests/product-report.test.mjs";
const T_SR = "packages/nana-pack/tests/suite-records.test.mjs";
const R_2740 = /^R-2740: /; // R-2740
const R_2741 = /^R-2741: /; // R-2741
const R_2742 = /^R-2742: /; // R-2742
const R_2743 = /^R-2743: /; // R-2743
const R_2744 = /^R-2744: /; // R-2744
const R_2745 = /^R-2745: /; // R-2745
const R_2552 = /^R-2552: /; // R-2552, the land prefix on record lines
const UNTRACKED_PATH = /^a maker or reader path not tracked at HEAD gets one note naming the row and the path/; // the older not-tracked check
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// scripts/test-locked.mjs
const PREDICATE = 'return filters.length === 0 && env[HAND_MEASURE_ENV] === undefined && typeof landTip === "string" && landTip.length > 0 && landTip === head;';
const CODE_GUARD = "\tif (decidingCode !== 0) return;\n";
const PAGE_GUARD = "\tif (!isLandRun({ filters, env, head })) return;\n";
const PAGE_OUT = 'const out = path.join(gitCommonDir(cwd), ...LAND_REPORT_SUBPATH.split("/"));';
const WROTE_NOTE = "note(`product report: wrote ${written} for ${head.slice(0, 8)}`);";
const NOT_WRITTEN_NOTE = "note(`product report not written: ${reason}`);";
const FOLD = 'String(error?.message ?? "unknown error").replace(/\\r\\n?|\\n/g, "; ")';
const CATCH = "\t} catch (error) {\n\t\tconst reason = " + FOLD + ";\n\t\t" + NOT_WRITTEN_NOTE + "\n\t}\n";
const WIN_RECORD = "\t\t\tif (!stopping) finishRecord(code);\n\t\t\tif (!stopping) await writeLandReport({ filters, env, cwd, decidingCode: code });\n";
const WIN_WRITE = "\t\t\tif (!stopping) await writeLandReport({ filters, env, cwd, decidingCode: code });\n";
const RERUN_WRITE = "\t\t\tawait writeLandReport({ filters, env, cwd, decidingCode: finalCode });\n";
const MEASURED_RECORD = "\t\tif (coverageRecordError) recordProblem(coverageRecordError.message);\n\t\telse finishRecord(coverageCode, coverageRecord);\n";
const MEASURED_WRITE = "\t\tawait writeLandReport({ filters, env, cwd, decidingCode: coverageCode });\n";
const COVERAGE_RUN = "\t\tconst coverageCode = await runCommand([], coverageEnv, cwd);\n\t\tif (stopping) {\n\t\t\tif (termination) await termination;\n\t\t\treturn signalExitCode ?? 1;\n\t\t}\n";
const TRIGGER = "const land = isLandRun({ env, head: facts.tip });";

// packages/nana-pack/lib/suite-records.mjs
const COMMON_DIR = 'const common = gitText(root, ["rev-parse", "--git-common-dir"], runGit);';

// scripts/deliverables.mjs
const EXEMPT = 'if (!local || local.maker !== run || !codePaths.includes(local.writer)) addPath(row, artifact, field.line, "artifact");';

// scripts/product-report.mjs
const SUITE_READER = "records: readSuiteRecords({ root, runGit }).map((record) => ({ tip: record.tip, time: record.recordedAt })) }),";
const BUILD_READER = 'return { records: [...ledger.records].reverse().filter((record) => record.kind === "end").map((record) => ({ tip: record.tip, time: record.endedAt })) };';
const BUILD_CATCH = "    } catch { return { records: [], problem: BUILD_LEDGER_UNREADABLE }; }\n";
const IN_HISTORY = "const newest = readable.find((record) => history.has(record.tip));";
const RECORD_DAYS = "wholeDays(headEpoch, recorded.getTime() / 1000)";
const RECORD_SHALLOW = "    if (shallow) {\n      for (const artifact of recordArtifacts) ages.set(artifact, unknownAge(SHALLOW_CLONE_REASON));\n";

const DECLARED = [
	"(plan) pairs 1 to 19 follow plan-draft.md's list; 21, 22, 23 and 25 are the must-meet's; pair 20 and every pair naming R-2746 or product-report's own age drop with M2",
	"(plan) pair 24, a plain writeFile with no rename, is a declared non-pair: no honest test can interrupt a write between its bytes",
	"(seat) pairs 6, 7 and 21 each drop one clause from the shared predicate isLandRun, which the page guard and the suite record's trigger both call (M1); pair 8 instead replaces the page guard with the prototype's tip-equals-HEAD test",
	"(seat) pair 3 edits the lifted gitCommonDir in suite-records.mjs (S6), which the page path, the suite store and the build-records age all use; pair 22 edits only the page path line",
	"(seat) pair 9: the whole-run-fail branch returns before any write call, so only R-2741's always-fail case can catch an ignored exit code",
	"(seat) pair 19: R-2745's unreadable-ledger case renders through generateReport with no catch around it, so the wrong version ends product-report.test.mjs inside that case before its check line prints",
	"(seat) N3, the stop-flag re-check after the report build, is a declared non-pair: the report module is imported, not injected, so no honest test can land a signal inside the build",
	"(seat) N6's temporary-file removal after a failed rename is a declared non-pair: no must-meet row covers a leftover temporary file, and R-2742's folder case checks only the note and the exit code",
	"(seat) the draft's load-failure path (a report module that fails to import) is a declared non-pair: it is a listed known limit with no test",
];

const PAIRS = [
	{ n: "1", name: "the measured pass writes the page before finishRecord", edits: [
		one(TL, MEASURED_RECORD + MEASURED_WRITE, MEASURED_WRITE + MEASURED_RECORD),
	], tests: [T_LAND], expectRed: [R_2740] },
	{ n: "2", name: "the page is written right after the coverage run, before the map write", edits: [
		one(TL, COVERAGE_RUN, COVERAGE_RUN + MEASURED_WRITE),
		one(TL, MEASURED_RECORD + MEASURED_WRITE, MEASURED_RECORD),
	], tests: [T_LAND], expectRed: [R_2740] },
	{ n: "3", name: "the common-directory helper asks git for --git-dir", edits: [
		one(SR, COMMON_DIR, 'const common = gitText(root, ["rev-parse", "--git-dir"], runGit);'),
	], tests: [T_LAND], expectRed: [R_2740] },
	{ n: "4", name: "the Windows branch does not write", edits: [
		one(TL, WIN_WRITE, ""),
	], tests: [T_LAND], expectRed: [R_2740] },
	{ n: "5", name: "the coverage-fail, plain-rerun-pass path does not write", edits: [
		one(TL, RERUN_WRITE, ""),
	], tests: [T_LAND], expectRed: [R_2740] },
	{ n: "6", name: "the land predicate drops the no-filter clause, so a filtered run writes", edits: [
		one(TL, PREDICATE, 'return env[HAND_MEASURE_ENV] === undefined && typeof landTip === "string" && landTip.length > 0 && landTip === head;'),
	], tests: [T_LAND], expectRed: [R_2741] },
	{ n: "7", name: "the land predicate drops the HEAD check, so a wrong tip on the Windows branch writes", edits: [
		one(TL, PREDICATE, 'return filters.length === 0 && env[HAND_MEASURE_ENV] === undefined && typeof landTip === "string" && landTip.length > 0;'),
	], tests: [T_LAND], expectRed: [R_2741] },
	{ n: "8", name: "the page guard is the prototype's tip-equals-HEAD test, so a hand measure writes", edits: [
		one(TL, PAGE_GUARD, "\tif (env[LAND_TIP_ENV] !== head) return;\n"),
	], tests: [T_LAND], expectRed: [R_2741] },
	{ n: "9", name: "the write ignores the deciding exit code, so a failing run writes", edits: [
		one(TL, CODE_GUARD, ""),
	], tests: [T_LAND], expectRed: [R_2741] },
	{ n: "10", name: "the report error is not caught, so the outer catch returns 1", edits: [
		one(TL, CATCH, "\t} finally { /* pair 10: no catch */ }\n"),
	], tests: [T_LAND], expectRed: [R_2742] },
	{ n: "11", name: "the raw multi-line error is printed as is", edits: [
		one(TL, FOLD, 'String(error?.message ?? "unknown error")'),
	], tests: [T_LAND], expectRed: [R_2742] },
	{ n: "12", name: "the two product report notes lack the [nana-land] prefix", edits: [
		one(TL, WROTE_NOTE, "console.log(`product report: wrote ${written} for ${head.slice(0, 8)}`);"),
		one(TL, NOT_WRITTEN_NOTE, "console.log(`product report not written: ${reason}`);"),
	], tests: [T_LAND], expectRed: [R_2740, R_2742], alsoRed: [R_2741] },
	{ n: "13", name: "only runtime-map is exempt, as on main", edits: [
		one(DL, EXEMPT, 'if (artifact !== RUNTIME_MAP_ARTIFACT) addPath(row, artifact, field.line, "artifact");'),
	], tests: [T_DEL], expectRed: [R_2743] },
	{ n: "14", name: "every untracked artifact is exempt", edits: [
		one(DL, EXEMPT, "void local;"),
	], tests: [T_DEL], expectRed: [R_2743], alsoRed: [UNTRACKED_PATH] },
	{ n: "15", name: "the newest record is taken whether or not HEAD contains it", edits: [
		one(PR, IN_HISTORY, "const newest = readable[0];"),
	], tests: [T_PR], expectRed: [R_2744, R_2745] },
	{ n: "16", name: "record days count to now instead of HEAD's commit time", edits: [
		one(PR, RECORD_DAYS, "wholeDays(Date.now() / 1000, recorded.getTime() / 1000)"),
	], tests: [T_PR], expectRed: [R_2744, R_2745] },
	{ n: "17", name: "the store ages skip the shallow-clone check", edits: [
		one(PR, RECORD_SHALLOW, "    if (false) {\n      for (const artifact of recordArtifacts) ages.set(artifact, unknownAge(SHALLOW_CLONE_REASON));\n"),
	], tests: [T_PR], expectRed: [R_2744, R_2745] },
	{ n: "18", name: "the build age takes the last ledger line whatever its kind or tip", edits: [
		one(PR, BUILD_READER, "return { records: [...ledger.records].reverse().slice(0, 1).map((record) => ({ tip: record.tip, time: record.endedAt ?? record.startedAt })) };"),
	], tests: [T_PR], expectRed: [R_2745] },
	{ n: "19", name: "an unreadable build ledger throws and stops the page", edits: [
		one(PR, BUILD_CATCH, "    } finally { /* pair 19: no catch */ }\n"),
	], tests: [T_PR], expectRed: [R_2745] },
	{ n: "21", name: "the land predicate drops the hand-measure clause", edits: [
		one(TL, PREDICATE, 'return filters.length === 0 && typeof landTip === "string" && landTip.length > 0 && landTip === head;'),
	], tests: [T_LAND], expectRed: [R_2741] },
	{ n: "22", name: "the page path is joined under the working directory's .git", edits: [
		one(TL, PAGE_OUT, 'const out = path.join(cwd, ".git", ...LAND_REPORT_SUBPATH.split("/"));'),
	], tests: [T_LAND], expectRed: [R_2740] },
	{ n: "23", name: "the map exempts every name in it whatever the maker", edits: [
		one(DL, EXEMPT, 'if (!local) addPath(row, artifact, field.line, "artifact");'),
	], tests: [T_DEL], expectRed: [R_2743] },
	{ n: "25", name: "the suite-runs reader keeps only the newest record by time, not the newest in HEAD's history", edits: [
		one(PR, SUITE_READER, "records: readSuiteRecords({ root, runGit }).map((record) => ({ tip: record.tip, time: record.recordedAt })).filter((record) => Number.isFinite(Date.parse(record.time))).sort((x, y) => Date.parse(y.time) - Date.parse(x.time)).slice(0, 1) }),"),
	], tests: [T_PR], expectRed: [R_2744] },
	{ n: "S1", name: "the suite record's trigger and prefix go back to the inline tip test instead of isLandRun", edits: [
		one(TL, TRIGGER, "const land = landTip === facts.tip;"),
	], tests: [T_LAND, T_SR], expectRed: [R_2552] },
	{ n: "S2", name: "the Windows branch writes the page before finishRecord", edits: [
		one(TL, WIN_RECORD, "\t\t\tif (!stopping) await writeLandReport({ filters, env, cwd, decidingCode: code });\n\t\t\tif (!stopping) finishRecord(code);\n"),
	], tests: [T_LAND], expectRed: [R_2740] },
];

process.exitCode = await runMutations({ lane: "report-at-land", self: import.meta.url, tip: "4722da58", declared: DECLARED, pairs: PAIRS });
