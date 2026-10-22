#!/usr/bin/env node
// Seat wrong-code pairs for lane ci-jobs (ordinary lane), written by the seat 2026-10-22 after build 1, on the shared
// runner, at tip bf1b9d3f; re-run at c46d85f3 after build 2 with c13 and c14 for R-2577. They are the must-meet's "Evidence and seat steps" pairs. Run from the worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/ci-jobs-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const CI = ".github/workflows/ci.yml";
const T = "packages/nana-pack/tests/ci-workflow.test.mjs";
const R_1313 = /^R-1313: /; // R-1313
const R_2556 = /^R-2556: /; // R-2556
const R_2557 = /^R-2557: /; // R-2557
const R_2558 = /^R-2558: /; // R-2558
const R_2577 = /^R-2577: /; // R-2577
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const LINUX_STEP = "      - run: npm test -- --jobs=${{ env.NANA_CI_JOBS }}\n        if: matrix.os != 'windows-latest'\n";
const WIN_STEP = "      - run: npm test -- --verbose --jobs=${{ env.NANA_CI_JOBS }}\n        if: matrix.os == 'windows-latest'\n";
const JOBS_KEY = '      NANA_CI_JOBS: "4"\n';
const LIMIT_KEY = '      NANA_TEST_TIMEOUT_MS: "900000"\n';

const DECLARED = [
	"(amendment) c13 and c14: the warm-up step removed; the warm-up step after the suite steps",
	"(plan) c1 to c12 are the must-meet's pairs: a step without --jobs; npm test --jobs with no --; a literal job count; a third npm test step without it; NANA_CI_JOBS at 3; no chosen above it; the limit in the workflow env; the limit inline in a run line; the limit in a step env; the limit at 600000; no chosen above the limit; the Windows step without --verbose",
];

const PAIRS = [
	{ n: "c1", name: "a step without --jobs", edits: [one(CI, LINUX_STEP, "      - run: npm test\n        if: matrix.os != 'windows-latest'\n")], tests: [T], expectRed: [R_2556] },
	{ n: "c2", name: "npm test --jobs with no separator", edits: [one(CI, LINUX_STEP, "      - run: npm test --jobs=${{ env.NANA_CI_JOBS }}\n        if: matrix.os != 'windows-latest'\n")], tests: [T], expectRed: [R_2556] },
	{ n: "c3", name: "a literal job count in a step", edits: [one(CI, LINUX_STEP, "      - run: npm test -- --jobs=4\n        if: matrix.os != 'windows-latest'\n")], tests: [T], expectRed: [R_2556] },
	{ n: "c4", name: "a third npm test step without --jobs", edits: [one(CI, WIN_STEP, WIN_STEP + "      - run: npm test -- --verbose\n        if: matrix.os == 'macos-latest'\n")], tests: [T], expectRed: [R_2556] },
	{ n: "c5", name: "NANA_CI_JOBS at 3", edits: [one(CI, JOBS_KEY, '      NANA_CI_JOBS: "3"\n')], tests: [T], expectRed: [R_2557] },
	{ n: "c6", name: "no chosen comment above the job count", edits: [one(CI, "      # chosen; measured clean at 4 against 1 in probe run 39761155058\n", "      # measured clean at 4 against 1 in probe run 39761155058\n")], tests: [T], expectRed: [R_2557] },
	{ n: "c7", name: "the limit in the workflow-level env", edits: [one(CI, LIMIT_KEY, ""), one(CI, "\nenv:\n", '\nenv:\n  NANA_TEST_TIMEOUT_MS: "900000"\n')], tests: [T], expectRed: [R_2558] },
	{ n: "c8", name: "the limit inline in a run line", edits: [one(CI, LINUX_STEP, "      - run: NANA_TEST_TIMEOUT_MS=900000 npm test -- --jobs=${{ env.NANA_CI_JOBS }}\n        if: matrix.os != 'windows-latest'\n")], tests: [T], expectRed: [R_2558] },
	{ n: "c9", name: "the limit in a step env", edits: [one(CI, WIN_STEP, WIN_STEP.replace("        if:", "        env:\n          NANA_TEST_TIMEOUT_MS: \"900000\"\n        if:"))], tests: [T], expectRed: [R_2558] },
	{ n: "c10", name: "the limit at 600000", edits: [one(CI, LIMIT_KEY, '      NANA_TEST_TIMEOUT_MS: "600000"\n')], tests: [T], expectRed: [R_2558] },
	{ n: "c11", name: "no chosen comment above the limit", edits: [one(CI, "      # chosen; about twice review-ledger's", "      # about twice review-ledger's")], tests: [T], expectRed: [R_2558] },
	{ n: "c12", name: "the Windows step without --verbose", edits: [one(CI, WIN_STEP, "      - run: npm test -- --jobs=${{ env.NANA_CI_JOBS }}\n        if: matrix.os == 'windows-latest'\n")], tests: [T], expectRed: [R_1313] },
	{ n: "c13", name: "the warm-up step removed", edits: [one(CI, "      - run: uvx copier --version\n", "")], tests: [T], expectRed: [R_2577] },
	{ n: "c14", name: "the warm-up step after the suite steps", edits: [one(CI, "      - run: uvx copier --version\n", ""), one(CI, WIN_STEP, WIN_STEP + "      - run: uvx copier --version\n")], tests: [T], expectRed: [R_2577] },
];

process.exitCode = await runMutations({ lane: "ci-jobs", self: import.meta.url, tip: "c46d85f3", declared: DECLARED, pairs: PAIRS });
