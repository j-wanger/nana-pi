#!/usr/bin/env node
// Plan-of-record wrong-code pairs. Never imported or launched by a suite test.
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";
const LC = "packages/nana-pack/lib/land-ci.mjs";
const NL = "packages/nana-pack/bin/nana-land.mjs";
const LR = "packages/nana-pack/lib/land-records.mjs";
const CFG = "packages/nana-pack/lib/land-config.mjs";
const SRC = "packages/nana-pack/lib/land-records-config.mjs";
const P = "packages/nana-pack/prompts/builder-preamble.md";
const T = "packages/nana-pack/tests/land-ci-suite.test.mjs";
const W = "packages/nana-pack/tests/worker-lane.test.mjs";
const R = "packages/nana-pack/tests/test-runner.test.mjs";
const titles = {
  3430: "R-3430: passing same-platform full-suite CI replaces the local suite and records its source",
  3431: "R-3431: unproven full-suite CI falls back once, while a carried rerun leg qualifies",
  3432: "R-3432: changed workflow or runner forces local coverage, but other scripts do not",
  3433: "R-3433: whole-run records carry the actual path filters, empty for an unfiltered run",
  3434: "R-3434: unreadable, absent, unfinished and unsuccessful CI refuse before any suite",
  3435: "R-3435: land readers distinguish CI, local and legacy suite times without changing old lines",
  3436: "R-3436: the preamble runs the full suite unless AGENTS says CI covers it, and contains none of the replaced lines",
};
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });
const pair = (n, name, edits, row, test = T) => ({ n, name, edits, tests: [test], expectRed: [titles[row]] });
const nonzero = 'if (response?.status !== 0) throw new Error(`gh CI read failed (exit ${response?.status ?? response?.signal ?? "unknown"})${firstErrorLine ? `: ${firstErrorLine}` : ""}`);';
const passing = { workflow_id: 1, name: "ci", id: 101, run_number: 1, run_attempt: 1, event: "pull_request", status: "completed", conclusion: "success", path: ".github/workflows/ci.yml" };
const pairs = [
  pair("1", "passing workflow runs skip without record proof", [one(LC, 'export function proveCiSuite(result, runs, platform) {', 'export function proveCiSuite(result, runs, platform) { return { ok: true, records: result?.parsed ?? [] };')], 3431),
  pair("2a", "accept a filtered record", [one(LC, '!Array.isArray(record.filters) || record.filters.length !== 0', '!Array.isArray(record.filters)')], 3431),
  pair("2b", "accept an old record without filters", [one(LC, '!Array.isArray(record.filters) || record.filters.length !== 0', 'record.filters !== undefined && (!Array.isArray(record.filters) || record.filters.length !== 0)')], 3431),
  pair("3", "accept zero final files", [one(LC, 'if (finalFiles(record).length === 0)', 'if (false)')], 3431),
  pair("4a", "accept another platform", [one(LC, ' || item.record?.platform !== platform', '')], 3431),
  pair("4b", "ignore the injected proof platform", [one(NL, '}, verdict.runs, platform);', '}, verdict.runs, process.platform);')], 3430),
  pair("5a", "accept a superseded run", [one(LC, '!judged.has(String(item.run?.id)) || ', '')], 3431),
  pair("5b", "keep an earlier passing attempt over a failed later one", [one(LC, 'item.attempt > prior.attempt', 'item.attempt < prior.attempt')], 3431),
  pair("6", "ignore the changed-path list", [one(LC, 'const changed = linesOf(changedPaths).some', 'const changed = false && linesOf(changedPaths).some')], 3432),
  pair("rename", "restore rename detection for changed paths", [one(NL, '"diff", "--no-renames", "--name-only"', '"diff", "--name-only"')], 3432),
  pair("7a", "turn an unreadable run list into a local fallback", [one(NL, nonzero, `if (response?.status !== 0) response = { status: 0, stdout: ${JSON.stringify(JSON.stringify({ total_count: 1, workflow_runs: [passing] }))} };`)], 3434),
  pair("7b", "allow cancelled CI to fall back or substitute", [one(LC, 'if (bad.length) {', 'if (bad.length && !bad.every((run) => run.conclusion === "cancelled")) {')], 3434),
  pair("8a", "record CI suite time as zero instead of null", [one(NL, 'suiteMs: lifecycle.suiteMs,', 'suiteMs: lifecycle.suite === "ci" ? 0 : lifecycle.suiteMs,')], 3430),
  pair("8b", "render a legacy end record differently", [one(LR, 'end.suite === "ci" ? "suite ci"', '(end.suite === undefined || end.suite === "ci") ? "suite ci"')], 3435),
  pair("9", "restore the reversed CI full-suite default", [one(P, "Run the repository's full suite unless its `AGENTS.md` says CI covers it", "Run the repository's full suite only where its `AGENTS.md` says CI does not cover it")], 3436, W),
  pair("runner", "omit the runner filter field", [one("scripts/test.mjs", '\n\t\t\tfilters,', '')], 3433, R),
  { n: "seals", name: "retune every new declared contract value", edits: [
    one(CFG, 'CI_RUN_LIST_RETRIES = 1;', 'CI_RUN_LIST_RETRIES = 2;'),
    one(CFG, 'Object.freeze([".github/workflows/", "scripts/test.mjs"])', 'Object.freeze([".github/workflows/"])'),
    one(CFG, 'SUITE_LINE_PREFIX = "suite:";', 'SUITE_LINE_PREFIX = "tests:";'),
    one(CFG, 'SUITE_CHANGED_REASON = "the lane changes the CI workflow or test runner";', 'SUITE_CHANGED_REASON = "changed";'),
    one(SRC, 'LAND_SUITE_SOURCES = Object.freeze(["ci", "local"]);', 'LAND_SUITE_SOURCES = Object.freeze(["ci"]);'),
  ], tests: [T], expectRed: ["seal: CI suite prefix, fallback paths and one run-list retry are declared once"] },
];
process.exitCode = await runMutations({ lane: "ci-suite", self: import.meta.url, tip: "HEAD", declared: ["Plan pairs 1–9, split where the plan names alternatives; runner filter and new seals are also broken."], pairs });
