#!/usr/bin/env node
// Seat wrong-code pairs for lane ci-timing-records (ordinary), written by the seat 2026-10-22 after build 1, on the
// shared runner, at tip 56def663. They are the must-meet's fifteen pairs in its order. Run from the worktree root on
// macOS:   SEAT_MUTATE_OUT=<file> node docs/reviews/ci-timing-records-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CI = ".github/workflows/ci.yml";
const LIB = "packages/nana-pack/lib/ci-records.mjs";
const SR = "packages/nana-pack/lib/suite-records.mjs";
const T_WF = "packages/nana-pack/tests/ci-workflow.test.mjs";
const T_REC = "packages/nana-pack/tests/ci-records.test.mjs";
const R_1530 = /^R-1530: /; // R-1530
const R_2631 = /^R-2631: /; // R-2631
const R_2632 = /^R-2632: /; // R-2632
const R_2633 = /^R-2633: /; // R-2633
const R_2634 = /^R-2634: /; // R-2634
const R_2635 = /^R-2635: /; // R-2635
const R_2637 = /^R-2637: /; // R-2637
const R_2638 = /^R-2638: /; // R-2638
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const UPLOAD_IF = "      - uses: actions/upload-artifact@v4\n        if: ${{ !cancelled() }}\n        continue-on-error: true\n";
const NAME = "          name: suite-record-${{ matrix.os }}-${{ github.run_attempt }}";
const PATH_LINE = "          path: ${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}";
const WIN_STEP = "        if: matrix.os == 'windows-latest'\n        env:\n          NANA_SUITE_RECORD_FILE: ${{ runner.temp }}/${{ env.NANA_CI_RECORD_NAME }}\n";
const POSIX_IF = "        if: matrix.os != 'windows-latest'\n";
const SORT = "printed.sort((left, right) => idCompare(left.run.id, right.run.id) || left.leg.localeCompare(right.leg) || left.attempt - right.attempt);";

const DECLARED = [
	"(plan) p1 to p15 follow the must-meet's wrong-code list in order",
	"(seat) p8 keeps each run's newest attempt per leg after the sort; p13 drops the start-time half of the left-no-record test",
];

const PAIRS = [
	{ n: "p1", name: "upload with the default if", edits: [
		one(CI, UPLOAD_IF, "      - uses: actions/upload-artifact@v4\n        continue-on-error: true\n"),
	], tests: [T_WF], expectRed: [R_2632] },
	{ n: "p2", name: "artifact name without the run attempt", edits: [
		one(CI, NAME, "          name: suite-record-${{ matrix.os }}"),
	], tests: [T_WF], expectRed: [R_2632] },
	{ n: "p3", name: "upload path not the knob path", edits: [
		one(CI, PATH_LINE, "          path: nana-suite-record.json"),
	], tests: [T_WF], expectRed: [R_2632] },
	{ n: "p4", name: "if-no-files-found: error", edits: [
		one(CI, PATH_LINE, `${PATH_LINE}\n          if-no-files-found: error`),
	], tests: [T_WF], expectRed: [R_2632] },
	{ n: "p5", name: "the knob on the non-Windows step only", edits: [
		one(CI, WIN_STEP, "        if: matrix.os == 'windows-latest'\n"),
	], tests: [T_WF], expectRed: [R_2631] },
	{ n: "p6", name: "continue-on-error moved onto an npm test step", edits: [
		one(CI, UPLOAD_IF, "      - uses: actions/upload-artifact@v4\n        if: ${{ !cancelled() }}\n"),
		one(CI, POSIX_IF, `${POSIX_IF}        continue-on-error: true\n`),
	], tests: [T_WF], expectRed: [R_1530, R_2632] },
	{ n: "p7", name: "no workflow-path filter", edits: [
		one(LIB, "const runs = runsResult.values.filter((run) => run?.path === CI_WORKFLOW_RUN_PATH)", "const runs = runsResult.values.filter((run) => run)"),
	], tests: [T_REC], expectRed: [R_2634] },
	{ n: "p8", name: "only the newest attempt per leg kept", edits: [
		one(LIB, SORT, `${SORT}\n\tprinted.splice(0, printed.length, ...new Map(printed.map((item) => [\`\${item.run.id} \${item.leg}\`, item])).values());`),
	], tests: [T_REC], expectRed: [R_2634] },
	{ n: "p9", name: "every artifact downloaded into one folder", edits: [
		one(LIB, "const folder = path.join(downloadRoot, `${run.id}-${artifact.id}`);", "const folder = downloadRoot;"),
	], tests: [T_REC], expectRed: [R_2634] },
	{ n: "p10", name: "the revision passed unresolved", edits: [
		one(LIB, "const sha = resolved.value;", "const sha = revision;"),
	], tests: [T_REC], expectRed: [R_2634] },
	{ n: "p11", name: "unnamed failures left out of FAIL", edits: [
		one(SR, "FAIL: final.filter((file) => file.label === \"FAIL\").length + (record?.unnamedFailures ?? []).length,", "FAIL: final.filter((file) => file.label === \"FAIL\").length,"),
	], tests: [T_REC], expectRed: [R_2633] },
	{ n: "p12", name: "slowest list ascending", edits: [
		one(LIB, ".sort((left, right) => Number(right.seconds) - Number(left.seconds) ||", ".sort((left, right) => Number(left.seconds) - Number(right.seconds) ||"),
	], tests: [T_REC], expectRed: [R_2635] },
	{ n: "p13", name: "legs matched to artifacts by attempt alone", edits: [
		one(LIB, "if (attempt > newest.identity.attempt && timeOf(job.started_at) > timeOf(newest.value.created_at))", "if (attempt > newest.identity.attempt)"),
	], tests: [T_REC], expectRed: [R_2637] },
	{ n: "p14", name: "a running leg reported as missing", edits: [
		one(LIB, "if (job.status !== \"completed\") { problems.push(`run ${run.id} ${leg}: still running (${job.status ?? \"unknown\"})`); continue; }", "/* running legs not told apart */"),
	], tests: [T_REC], expectRed: [R_2637] },
	{ n: "p15", name: "only gh status 1 treated as failure", edits: [
		one(LIB, "if (result?.status !== 0) {", "if (result?.status === 1) {"),
	], tests: [T_REC], expectRed: [R_2638] },
];

process.exitCode = await runMutations({ lane: "ci-timing-records", self: import.meta.url, tip: "56def663", declared: DECLARED, pairs: PAIRS });
