#!/usr/bin/env node
// Seat wrong-code pairs for lane launch-limits-identity (ordinary), written by the seat 2026-10-25 after build 1 at 6ac0931a.
// They follow the must-meet's "Seat wrong-code pairs" list (pairs 1 to 21; 16 and 17 split into one edit each).
// Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/launch-limits-identity-2026-10-25/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const T = "packages/nana-setup/tests/pi-launch-limits.test.mjs";
const BS = "packages/nana-setup/lib/bounded-spawn-child.mjs";
const R_2890 = /^R-2890: /; // R-2890
const R_2891 = /^R-2891: /; // R-2891
const R_2892 = /^R-2892: /; // R-2892
const R_2893 = /^R-2893: /; // R-2893
const R_2894 = /^R-2894: /; // R-2894
const R_2895 = /^R-2895: /; // R-2895
const R_2023 = /^R-2023: /; // R-2023
const R_2484 = /^R-2484: /; // R-2484
const R_2130 = /^R-2130: /; // R-2130
const R_2131 = /^R-2131: /; // R-2131
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const DEADLINE = "const deadline = starts.length ? Math.min(...starts) + HANG_MS - SELF_EXIT_MARGIN_MS : Date.now();";
const VALID = "const valid = records.map((record) => ({";
const PROBE_CATCH = "return error?.code === \"ESRCH\" ? \"gone\" : error?.code ?? \"unknown error\";";
const RUN_CASES = "const runCases = [() => timedStep(\"version\", false, START_ALLOWANCE_MS), () => timedStep(\"version\", true, START_ALLOWANCE_MS), () => timedDoctor(START_ALLOWANCE_MS), () => timedStep(\"install\", false, START_ALLOWANCE_MS)];";

const DECLARED = [
	"(seat) pairs 1 to 21 follow the must-meet's seat wrong-code list in order; pair 16 splits into 16a to 16d and pair 17 into 17a and 17b, one edit each; each names the rows the must-meet says it turns red",
	"(seat) the old kill loops (plan :280 and :187) are gone at this tip, so pairs 1 and 12 put them back where they sat: after the judge's probe loop, and after observeParentKill's wait",
	"(seat) alsoRed lists rows a pair also turns red as a side effect the must-meet does not name: 3 (R-2892, an injected EINVAL or EPERM reads ended), 16a (R-2895, a 3 s allowance against a 2.5 s late child; timing-dependent), 21 (R-2130 and R-2131, the parent-kill path ends through the same killTree)",
	"(Windows-only, not in this table) no must-meet pair is marked Windows-only. R-2300 and R-2303 skip off Windows, so no pair names them; R-2303's start wait reverted to waitFor's default has no macOS red case (must-meet Known limits). The seat runs it on the Windows CI leg if needed",
	"(product) pair 21 is the must-meet's seat-only product mutation in bounded-spawn-child.mjs; every other pair edits the test file alone",
];

const PAIRS = [
	{ n: "1", name: "the judge SIGKILLs each pid it reads alive", edits: [one(T, "\tconst invalid = seen.find((item) => item.problem)?.problem;\n", "\tfor (const item of seen) if (item.last === \"alive\") { try { process.kill(item.record.pid, \"SIGKILL\"); } catch { /* gone */ } }\n\tconst invalid = seen.find((item) => item.problem)?.problem;\n")], tests: [T], expectRed: [R_2890, R_2893] },
	{ n: "2", name: "the verdict drops the pid list and probe results", edits: [one(T, "details: seen.map(({ record, problem, first, last }) => ({ pid: record?.pid, args: record?.args, atOffset: record?.at - (starts.length ? Math.min(...starts) : judgeStartedAt), first: problem ?? first, last: problem ?? last }))", "details: []")], tests: [T], expectRed: [R_2890] },
	{ n: "3", name: "ended comes from the record count, not the probes", edits: [one(T, "const ended = !judgedTooLate && seen.length > 0 && seen.every((item) => item.ended && !item.problem);", "const ended = !judgedTooLate && seen.length > 0 && !invalid;")], tests: [T], expectRed: [R_2890], alsoRed: [R_2892] },
	{ n: "4", name: "the judge ignores at", edits: [one(T, DEADLINE, "const deadline = Infinity;")], tests: [T], expectRed: [R_2891] },
	{ n: "5", name: "the deadline drops the self-exit margin", edits: [one(T, DEADLINE, "const deadline = starts.length ? Math.min(...starts) + HANG_MS : Date.now();")], tests: [T], expectRed: [R_2891] },
	{ n: "6", name: "the judge skips a record with no at", edits: [one(T, VALID, "const valid = records.filter((record) => Number.isFinite(record?.at)).map((record) => ({")], tests: [T], expectRed: [R_2891] },
	{ n: "7", name: "the probe keeps the old polarity, any code but EPERM reads gone", edits: [one(T, PROBE_CATCH, "return error?.code === \"EPERM\" ? \"EPERM\" : \"gone\";")], tests: [T], expectRed: [R_2892] },
	{ n: "8", name: "the probe reads EPERM as gone", edits: [one(T, PROBE_CATCH, "return error?.code === \"ESRCH\" || error?.code === \"EPERM\" ? \"gone\" : error?.code ?? \"unknown error\";")], tests: [T], expectRed: [R_2892] },
	{ n: "9", name: "the judge drops records without a positive integer pid and ppid", edits: [one(T, VALID, "const valid = records.filter((record) => Number.isInteger(record?.pid) && record.pid > 0 && Number.isInteger(record?.ppid) && record.ppid > 0).map((record) => ({")], tests: [T], expectRed: [R_2892] },
	{ n: "10", name: "the verdict omits the error code", edits: [one(T, "seen.find((item) => !item.ended)?.last ?? \"stopped\"", "(seen.some((item) => !item.ended) ? \"not ended\" : \"stopped\")")], tests: [T], expectRed: [R_2892] },
	{ n: "11", name: "R-2303's wrapper cleanup keeps process.kill(child.pid)", edits: [one(T, "\tchild.kill(\"SIGKILL\");\n\tconst observed = {", "\tprocess.kill(child.pid, \"SIGKILL\");\n\tconst observed = {")], tests: [T], expectRed: [R_2893] },
	{ n: "12", name: "observeParentKill's failure-path kill loop is back", edits: [one(T, "\tconst elapsed = Date.now() - killedAt;\n\treturn { started: Boolean(started), pids: beforeKill", "\tconst elapsed = Date.now() - killedAt;\n\tif (!dead) for (const pid of beforeKill) { try { process.kill(pid, \"SIGKILL\"); } catch { /* gone */ } }\n\treturn { started: Boolean(started), pids: beforeKill")], tests: [T], expectRed: [R_2893] },
	{ n: "13", name: "the judge calls its injected kill with SIGKILL on a live pid", edits: [one(T, "\t\t\titem.last = result;\n", "\t\t\titem.last = result;\n\t\t\tif (result === \"alive\") kill(item.record.pid, \"SIGKILL\");\n")], tests: [T], expectRed: [R_2893, R_2890] },
	{ n: "14", name: "an unused tree-kill helper import", edits: [one(T, "import { tmpDir } from \"./tmp-dir.mjs\";\n", "import { tmpDir } from \"./tmp-dir.mjs\";\nimport { killWorkerTree } from \"../../nana-pack/tests/process-tree-helper.mjs\";\n")], tests: [T], expectRed: [R_2893] },
	{ n: "15", name: "R-2023 runs taskkill over recorded pids", edits: [one(T, "\t\tafterSelfExit = unended.map(", "\t\tif (process.platform === \"win32\") for (const { pid } of unended) spawnSync(\"taskkill\", [\"/PID\", String(pid), \"/F\"]);\n\t\tafterSelfExit = unended.map(")], tests: [T], expectRed: [R_2893] },
	{ n: "16a", name: "the start allowance at 3 s", edits: [one(T, "const START_ALLOWANCE_MS = 6_000;", "const START_ALLOWANCE_MS = 3_000;")], tests: [T], expectRed: [R_2894], alsoRed: [R_2895] },
	{ n: "16b", name: "the start allowance at 7 s", edits: [one(T, "const START_ALLOWANCE_MS = 6_000;", "const START_ALLOWANCE_MS = 7_000;")], tests: [T], expectRed: [R_2894] },
	{ n: "16c", name: "the self-exit margin at 0", edits: [one(T, "const SELF_EXIT_MARGIN_MS = 1_000;", "const SELF_EXIT_MARGIN_MS = 0;")], tests: [T], expectRed: [R_2894] },
	{ n: "16d", name: "the start allowance folded into the parent-kill bound", edits: [one(T, "const PARENT_KILL_BOUND_MS = RELAY_PARENT_POLL_MS", "const PARENT_KILL_BOUND_MS = START_ALLOWANCE_MS + RELAY_PARENT_POLL_MS")], tests: [T], expectRed: [R_2894, R_2484] },
	{ n: "17a", name: "observeParentKill keeps waitFor's default start wait", edits: [one(T, "await waitForStart(() => readPids(fixture.pids).length >= 3);", "await waitFor(() => readPids(fixture.pids).length >= 3);")], tests: [T], expectRed: [R_2895] },
	{ n: "17b", name: "observeParentKill's start wait uses LIMIT_MS", edits: [one(T, "await waitForStart(() => readPids(fixture.pids).length >= 3);", "await waitFor(() => readPids(fixture.pids).length >= 3, LIMIT_MS);")], tests: [T], expectRed: [R_2895] },
	{ n: "18", name: "the hang body ignores CHILD_DELAY_MS", edits: [one(T, "Number.isFinite(delay) && delay > 0 ? delay : 0);", "0);")], tests: [T], expectRed: [R_2895] },
	{ n: "19", name: "R-2023 runs all four launches, then judges", edits: [one(T, "\tfor (const runCase of runCases) {\n\t\tconst run = runCase();\n\t\tconst records = readPidRecords(run.pids);\n\t\tconst returnedAt = Date.now();\n", "\tconst runs = runCases.map((runCase) => ({ run: runCase(), returnedAt: Date.now() }));\n\tfor (const { run, returnedAt } of runs) {\n\t\tconst records = readPidRecords(run.pids);\n")], tests: [T], expectRed: [R_2023] },
	{ n: "20", name: "R-2023's runs use LIMIT_MS, not the start allowance", edits: [one(T, RUN_CASES, "const runCases = [() => timedStep(\"version\", false, LIMIT_MS), () => timedStep(\"version\", true, LIMIT_MS), () => timedDoctor(LIMIT_MS), () => timedStep(\"install\", false, LIMIT_MS)];")], tests: [T], expectRed: [R_2023] },
	{ n: "21", name: "the relay's killTree kills only its direct child (product)", edits: [one(BS, "\tkillProcessTree(child.pid, { fallback: (signal) => { try { child.kill(signal); } catch {} } });", "\ttry { child.kill(\"SIGKILL\"); } catch {}")], tests: [T], expectRed: [R_2023], alsoRed: [R_2130, R_2131] },
];

process.exitCode = await runMutations({ lane: "launch-limits-identity", self: import.meta.url, tip: "6ac0931a", declared: DECLARED, pairs: PAIRS });
