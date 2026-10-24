#!/usr/bin/env node
// Seat wrong-code pairs for lane land-ci-timings (land tool), written for the seat 2026-10-23 after build 1, at tip 14c4c849.
// They are the draft's pairs 1 to 18 (plan-draft.md) and the attack's 19 to 30 (plan-attack.md), as must-meet.md adjusts
// them: no Made-by line or ci-runs artifact name, the store name through storeSuiteRecord's pid option, pair 7 fully
// caught (S3) and pair 25 caught by the spy in R-2752 (S4). Four seat pairs (S1 to S4) probe code points no listed pair
// reaches. Run from the lane worktree root, with CLAUDE_CONFIG_DIR unset and a scratch TMPDIR:
//   SEAT_MUTATE_DRY=1 node docs/reviews/land-ci-timings-2026-10-23/seat-mutate.mjs
//   SEAT_MUTATE_OUT=<file> node docs/reviews/land-ci-timings-2026-10-23/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const NL = "packages/nana-pack/bin/nana-land.mjs";
const LCR = "packages/nana-pack/lib/land-ci-records.mjs";
const CR = "packages/nana-pack/lib/ci-records.mjs";
const SR = "packages/nana-pack/lib/suite-records.mjs";
const TM = "scripts/test.mjs";
const T_LCR = "packages/nana-pack/tests/land-ci-records.test.mjs";
const T_TR = "packages/nana-pack/tests/test-runner.test.mjs";
const T_CR = "packages/nana-pack/tests/ci-records.test.mjs";
const T_LAND = "packages/nana-pack/tests/land.test.mjs";

// Exact titles (seat-titles.mjs); the runner matches a FAIL line that is the title or starts with the title and a space.
const R_2750 = "R-2750: after the merge, its containment check and outside the ledger lock, the land reads the tip's CI records from github.com in its gh environment and prints the reader's lines";
const R_2751 = "R-2751: each CI record read at a land is kept once in the clone's ci-runs store with its tip, run, attempt, leg, event and time, never among local suite records";
const R_2752 = "R-2752: the ci-runs store keeps only the newest CI_RECORDS_KEEP records";
const R_2753 = "R-2753: the run record names the default per-file time limit the runner applied";
const R_2754 = "R-2754: a land notes each CI file at or above its share of the record's own per-file limit, slowest first and capped";
const R_2755 = "R-2755: a CI-record failure after the merge is one land note and the land still succeeds";
const R_2756 = "R-2756: the CI-record read starts no gh call past its budget and gives each call a whole-millisecond limit within the time left";
// Older titles, by prefix (no trailing anchor: a FAIL line carries the error after the title).
const R_2590 = /^R-2590: /; // land.test.mjs: a repository or tip without GitHub CI skips the CI read
const R_2633 = /^R-2633: /; // ci-records.test.mjs: a runner record reads back through the fake download
const R_2634 = /^R-2634: /; // ci-records.test.mjs: carries the reader-level host-qualified --repo assertion (M1)
const R_2635 = /^R-2635: /; // ci-records.test.mjs: slowest files, through the fake download
const R_2637 = /^R-2637: /; // ci-records.test.mjs: legs with no readable record, through the fake download
const R_2638 = /^R-2638: /; // ci-records.test.mjs: exit 0 when a record printed, through the fake download
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// packages/nana-pack/bin/nana-land.mjs
const GH_PARAMS = "return (cwd, args, { env = process.env, timeoutMs: callTimeoutMs = timeoutMs } = {}) => {";
const GH_GUARD = "\t\tif (!Number.isInteger(callTimeoutMs) || callTimeoutMs < 1) {\n\t\t\tconst error = Object.assign(new RangeError(\"gh timeout must be a positive whole number of milliseconds\"), { code: \"ERR_OUT_OF_RANGE\" });\n\t\t\treturn { status: null, signal: null, stdout: \"\", stderr: \"\", error, nanaTimeoutMs: callTimeoutMs };\n\t\t}\n";
const GH_SPAWN = "\t\ttry { return { ...spawnSync(\"gh\", args, { cwd, env, stdio: [\"ignore\", \"pipe\", \"pipe\"], encoding: \"utf8\", timeout: callTimeoutMs, maxBuffer }), nanaTimeoutMs: callTimeoutMs }; }\n\t\tcatch (error) { return { status: null, signal: null, stdout: \"\", stderr: \"\", error, nanaTimeoutMs: callTimeoutMs }; }\n";
const GH_RAW = "\t\treturn { ...spawnSync(\"gh\", args, { cwd, env, stdio: [\"ignore\", \"pipe\", \"pipe\"], encoding: \"utf8\", timeout: callTimeoutMs, maxBuffer }), nanaTimeoutMs: callTimeoutMs };\n";
const LET_PASSED = "\t\tlet ciReadPassed = false;\n";
const SUITE_START = "\t\tconst suiteResult = runCommand(suite, tree, { env: { ...process.env, [LAND_TIP_ENV]: tip } });\n";
const LOCK_END = "\t\t\tif (git(runGit, main, \"rev-parse\", \"refs/heads/main\") !== tip) throw new Error(\"main ref does not equal landed tip after merge\");\n\t\t});\n";
const POST_MERGE = "\t\tif (git(runGit, main, \"branch\", \"--show-current\") !== \"main\") throw new Error(\"main checkout is not on branch main after merge\");\n";
const RECORDS_GATE = "\t\tif (ciReadPassed) {\n";
const WRAP = "runGh: (cwd, args, options = {}) => runGh(cwd, args, { ...options, env: ghEnvironment(process.env) }),";
const KEEP_ARG = "\t\t\t\t\tkeep: CI_RECORDS_KEEP,\n";
const KEEP_CALL = "\t\t\t\tconst result = keepCiRecords({\n\t\t\t\t\tmain,\n\t\t\t\t\ttip,\n\t\t\t\t\t" + WRAP + "\n\t\t\t\t\tbudgetMs: CI_RECORDS_BUDGET_MS,\n" + KEEP_ARG + "\t\t\t\t\tshare: CI_SLOW_SHARE,\n\t\t\t\t});\n";
const RESULT_CHECK = "\t\t\t\tif (!result || !Array.isArray(result.lines) || !Array.isArray(result.notes)) throw new Error(\"CI-record keeper returned a malformed result\");\n\t\t\t\trecordLines = [...result.lines]; recordNotes = [...result.notes];\n";
const NL_CATCH = "\t\t\t} catch (error) { recordNotes = [`${LAND_NOTE_PREFIX} note: CI records failed: ${error?.message ?? \"unknown error\"}`]; }\n";
const LET_RECORDS = "\t\tlet recordLines = [], recordNotes = [];\n";
const CI_TEXT = "${ciLines.length ? `${ciLines.join(\"\\n\")}\\n` : \"\"}";
const RECORD_TEXT = "${recordLines.length ? `${recordLines.join(\"\\n\")}\\n` : \"\"}";
// The records call moved to an earlier place in runLand; the guarded call site then only takes its result.
const EARLY = "if (ciReadPassed) earlyRecords = keepCiRecords({ main, tip, runGh: (cwd, args, options = {}) => runGh(cwd, args, { ...options, env: ghEnvironment(process.env) }), budgetMs: CI_RECORDS_BUDGET_MS, keep: CI_RECORDS_KEEP, share: CI_SLOW_SHARE });";
const movedRead = (anchor, placed) => [
	one(NL, LET_PASSED, "\t\tlet ciReadPassed = false, earlyRecords = null;\n"),
	one(NL, anchor, placed),
	one(NL, KEEP_CALL, "\t\t\t\tconst result = earlyRecords;\n"),
];

// packages/nana-pack/lib/land-ci-records.mjs
const BUDGET_CHECK = "\t\t\tif (!(remaining >= 1)) { budgetStopped = true; return timeoutResult(budgetMs); }\n";
const CALL_LIMIT = "const timeoutMs = Math.min(CI_READ_TIMEOUT_MS, Math.ceil(remaining));";
const RECORDED_AT = "\t\t\t\t\trecordedAt,\n";
const CI_FIELDS = "ci: { run: item.run.id, attempt: item.attempt, leg: item.leg, event: item.run.event, artifact: item.artifact },";
const STORE_CALL = "storeRecord(stored, { root: main, subpath: CI_STORE_SUBPATH, now: () => created, pid: `${item.run.id}-${item.leg}-${item.attempt}`, keep });";
const RECORD_LOOP = "for (const item of result.parsed) {";
const STORE_CATCH = "} catch (error) { storeProblems.push(reasonOf(error)); }";
const NOTE_LIMIT = "const limitSeconds = Number(item.record?.fileTimeoutMs) / 1000;";
const BUDGET_FAILURE = "\t\tif (budgetStopped) failures.push(`not read: stopped at the ${numberText(budgetMs / 1000)} s budget`);\n";
const READ_FAILURE = "\t\telse if (result.code !== 0 || result.records === 0) failures.push(`not read: ${withoutRecordPrefix(lines.at(-1)) || \"no readable record\"}`);\n";
const ONE_NOTE = "\t\tif (failures.length) notes.push(`${LAND_NOTE_PREFIX} note: CI records ${failures.join(\"; \")}`);\n";

// packages/nana-pack/lib/suite-records.mjs
const DIR_JOIN = "return path.join(commonDir, ...subpath.split(\"/\"));";
const PRUNE_ORDER = "\t\t.filter((entry) => entry.endsWith(\".json\"))\n\t\t.sort()\n\t\t.reverse();\n";
const SLOW_LIMIT = "const limitSeconds = Number(record?.fileTimeoutMs) / 1000;";
const SLOW_FILTER = "file.label !== \"SKIP\" && Number(file.seconds) >= share * limitSeconds";
const SLOW_SORT = "\t\t.sort((left, right) => Number(right.seconds) - Number(left.seconds) || String(left.path).localeCompare(String(right.path)))\n";
const SLOW_CAP = "\t\t.slice(0, SLOWEST_LIST_MAX);\n";

// packages/nana-pack/lib/ci-records.mjs
const HOST_REPO = "\"--repo\", `${CI_HOST}/${repository.owner}/${repository.repo}`";
const PARSED_RETURN = "return { code: 0, records: printed.length, parsed: printed };";

// scripts/test.mjs
const RECORD_LIMIT = "\t\t\tfileTimeoutMs: TIMEOUT_MS,\n";

const DECLARED = [
	"(plan) pairs 1 to 18 follow plan-draft.md's list and 19 to 30 plan-attack.md's table, with must-meet.md's decisions: no Made-by line or ci-runs artifact name, so no pair touches deliverables; the store name goes through storeSuiteRecord's pid option (N1), so no pair edits a suffix option",
	"(seat) pairs 1, 2 and 26 move the one records call (the guarded call site then takes the moved call's result): before the suite (1), inside the review-ledger lock after the merge (2), and after the lock but before the post-merge checks, containment and release status (26)",
	"(seat) pair 5 is split: 5a the lib drops the CI_STORE_SUBPATH option, 5b suiteRecordsDir ignores every subpath; 6 is split by field: 6a recordedAt, 6b ci.event, 6c ci.attempt",
	"(seat) pair 7 is the clock half (the store name stamped by now()); its process-id half is pair 24, not run twice",
	"(seat) pair 9 is the shared writer's prune keeping the oldest names; its 'sorts by the clock' half is pair 7, because the prune sorts by name and only the name's stamp carries the time",
	"(seat) pair 10 is split: 10a the record omits fileTimeoutMs, 10b it writes the runner's 300 s default instead of the environment's value",
	"(seat) pair 12 is split: 12a slowFiles judges against a fixed 900 s, 12b the land note's text uses a fixed 900 s; 13 is split: 13a SKIP judged, 13b no cap, 13c fastest first",
	"(seat) pair 16 is split: 16a no CI records note at all, 16b one note per reader problem line (case b has a download-failure line and the closing line)",
	"(seat) pair 20 is split: 20a the lib passes the unrounded remainder, 20b ghDefault loses both its integer guard and its catch, so a fraction reaches spawnSync and throws",
	"(seat) pair 21 makes ghDefault ignore the per-call limit; R-2756's default-runner case (fractional limit, empty PATH) then gets ENOENT or a started gh instead of ERR_OUT_OF_RANGE",
	"(seat) pair 22 names R-2750 (GH_HOST preset) and R-2634 (the reader-level --repo assertion); R-2633, R-2635, R-2637 and R-2638 also fail because ci-records.test.mjs's fake gh now expects the host-qualified repository",
	"(seat) pair 25 is split: 25a nana-land passes keep: Infinity (the spy, as must-meet S4 decides), 25b the lib forwards keep: Infinity to the shared writer, which only a keepLandCiRecords call with a small keep could catch",
	"(seat) pair 28 sends the budget note straight to notes and lets the read-failure branch run too, so a spent budget prints two CI records notes",
	"(seat) S1 removes only ghDefault's integer guard and keeps its catch: a fraction then still becomes an ERR_OUT_OF_RANGE error result from spawnSync, and the guard's only distinct case is a 0 ms limit, which spawnSync treats as no limit",
	"(seat) S2 reads records when CI did not apply (the ciReadPassed gate ignored); S3 has the reader return no parsed records on success; S4 prints the reader's lines before the ci: lines",
	"(non-pair) the lib's 'ci record: kept <n> of <m> records' line: no must-meet row or test names it",
	"(non-pair) N2's strip of the reader's own 'ci record:' prefix inside the note: every R-2755 note pattern still matches a doubled prefix, and no row names the strip",
	"(non-pair) N9, a Windows rename over an open file, and FEAT-031's EBUSY prune: Windows-only, and the runner runs on macOS",
	"(non-pair) the reader's temp-folder cleanup failure: one reader line, no note, unchanged by this lane",
];

const PAIRS = [
	{ n: "1", name: "the records read runs before the suite", edits: movedRead(SUITE_START, `\t\t${EARLY}\n${SUITE_START}`), tests: [T_LCR], expectRed: [R_2750] },
	{ n: "2", name: "the records read runs inside the ledger lock callback, after the merge", edits: movedRead(LOCK_END, LOCK_END.replace("\t\t});\n", `\t\t\t${EARLY}\n\t\t});\n`)), tests: [T_LCR], expectRed: [R_2750] },
	{ n: "3", name: "the wrapper forwards the reader's env instead of ghEnvironment", edits: [
		one(NL, WRAP, "runGh: (cwd, args, options = {}) => runGh(cwd, args, options),"),
	], tests: [T_LCR], expectRed: [R_2750] },
	{ n: "4", name: "the reader's lines are dropped from the success text", edits: [
		one(NL, RECORD_TEXT, ""),
	], tests: [T_LCR], expectRed: [R_2750] },
	{ n: "5a", name: "the lib stores without the CI_STORE_SUBPATH option, so records go to suite-runs", edits: [
		one(LCR, STORE_CALL, STORE_CALL.replace("subpath: CI_STORE_SUBPATH, ", "")),
	], tests: [T_LCR], expectRed: [R_2751], alsoRed: [R_2755] },
	{ n: "5b", name: "suiteRecordsDir ignores the subpath, so every store is suite-runs", edits: [
		one(SR, DIR_JOIN, "return path.join(commonDir, ...STORE_SUBPATH.split(\"/\"));"),
	], tests: [T_LCR], expectRed: [R_2751] },
	{ n: "6a", name: "the stored record lacks the artifact time", edits: [
		one(LCR, RECORDED_AT, ""),
	], tests: [T_LCR], expectRed: [R_2751] },
	{ n: "6b", name: "the stored record lacks the run event", edits: [
		one(LCR, CI_FIELDS, CI_FIELDS.replace(" event: item.run.event,", "")),
	], tests: [T_LCR], expectRed: [R_2751] },
	{ n: "6c", name: "the stored record lacks the attempt", edits: [
		one(LCR, CI_FIELDS, CI_FIELDS.replace(" attempt: item.attempt,", "")),
	], tests: [T_LCR], expectRed: [R_2751] },
	{ n: "7", name: "the store name is stamped by the clock, not the artifact time", edits: [
		one(LCR, STORE_CALL, STORE_CALL.replace("now: () => created", "now: () => new Date()")),
	], tests: [T_LCR], expectRed: [R_2751] },
	{ n: "8", name: "the land prunes with the local store's 300", edits: [
		one(NL, KEEP_ARG, "\t\t\t\t\tkeep: 300,\n"),
	], tests: [T_LCR], expectRed: [R_2752] },
	{ n: "9", name: "the shared writer's prune keeps the oldest names", edits: [
		one(SR, PRUNE_ORDER, "\t\t.filter((entry) => entry.endsWith(\".json\"))\n\t\t.sort();\n"),
	], tests: [T_LCR], expectRed: [R_2752] },
	{ n: "10a", name: "the runner's record omits fileTimeoutMs", edits: [
		one(TM, RECORD_LIMIT, ""),
	], tests: [T_TR], expectRed: [R_2753] },
	{ n: "10b", name: "the runner's record names the 300 s default, not the environment's limit", edits: [
		one(TM, RECORD_LIMIT, "\t\t\tfileTimeoutMs: 5 * 60 * 1000,\n"),
	], tests: [T_TR], expectRed: [R_2753] },
	{ n: "11", name: "the share compares with > instead of >=", edits: [
		one(SR, SLOW_FILTER, SLOW_FILTER.replace(">=", ">")),
	], tests: [T_LCR], expectRed: [R_2754] },
	{ n: "12a", name: "slowFiles judges against a fixed 900 s limit", edits: [
		one(SR, SLOW_LIMIT, "const limitSeconds = 900;"),
	], tests: [T_LCR], expectRed: [R_2754] },
	{ n: "12b", name: "the slow note's share and limit use a fixed 900 s", edits: [
		one(LCR, NOTE_LIMIT, "const limitSeconds = 900;"),
	], tests: [T_LCR], expectRed: [R_2754] },
	{ n: "13a", name: "SKIP files are judged", edits: [
		one(SR, SLOW_FILTER, "Number(file.seconds) >= share * limitSeconds"),
	], tests: [T_LCR], expectRed: [R_2754] },
	{ n: "13b", name: "the notes per record are not capped", edits: [
		one(SR, SLOW_SORT + SLOW_CAP, SLOW_SORT.replace(/\n$/, ";\n")),
	], tests: [T_LCR], expectRed: [R_2754] },
	{ n: "13c", name: "the notes come fastest first", edits: [
		one(SR, SLOW_SORT, SLOW_SORT.replace("Number(right.seconds) - Number(left.seconds)", "Number(left.seconds) - Number(right.seconds)")),
	], tests: [T_LCR], expectRed: [R_2754] },
	{ n: "14", name: "a record without a limit is judged against the runner's 300 s default", edits: [
		one(SR, SLOW_LIMIT, "const limitSeconds = Number(record?.fileTimeoutMs ?? 300_000) / 1000;"),
	], tests: [T_LCR], expectRed: [R_2754] },
	{ n: "15", name: "a records failure is not caught, so the land reports refused: after the merge", edits: [
		one(NL, NL_CATCH, "\t\t\t} finally { /* pair 15: no catch */ }\n"),
	], tests: [T_LCR], expectRed: [R_2755] },
	{ n: "16a", name: "a records failure prints no note", edits: [
		one(LCR, ONE_NOTE, ""),
	], tests: [T_LCR], expectRed: [R_2755], alsoRed: [R_2756] },
	{ n: "16b", name: "a records failure prints one note per reader problem line", edits: [
		one(LCR, READ_FAILURE, "\t\telse if (result.code !== 0 || result.records === 0) for (const line of lines) failures.push(`not read: ${withoutRecordPrefix(line)}`);\n"),
		one(LCR, ONE_NOTE, "\t\tfor (const failure of failures) notes.push(`${LAND_NOTE_PREFIX} note: CI records ${failure}`);\n"),
	], tests: [T_LCR], expectRed: [R_2755] },
	{ n: "17", name: "no budget: calls keep starting after it is spent", edits: [
		one(LCR, BUDGET_CHECK, ""),
	], tests: [T_LCR], expectRed: [R_2756] },
	{ n: "18", name: "each call keeps the full per-call limit", edits: [
		one(LCR, CALL_LIMIT, "const timeoutMs = CI_READ_TIMEOUT_MS;"),
	], tests: [T_LCR], expectRed: [R_2756] },
	{ n: "19", name: "the budget check is elapsed > budget, so the boundary call starts with a 0 ms limit", edits: [
		one(LCR, BUDGET_CHECK, "\t\t\tif (remaining < 0) { budgetStopped = true; return timeoutResult(budgetMs); }\n"),
	], tests: [T_LCR], expectRed: [R_2756] },
	{ n: "20a", name: "the lib passes an unrounded fractional remainder", edits: [
		one(LCR, CALL_LIMIT, "const timeoutMs = Math.min(CI_READ_TIMEOUT_MS, remaining);"),
	], tests: [T_LCR], expectRed: [R_2756] },
	{ n: "20b", name: "ghDefault hands a fractional limit straight to spawnSync, with no guard and no catch", edits: [
		one(NL, GH_GUARD + GH_SPAWN, GH_RAW),
	], tests: [T_LCR], expectRed: [R_2756] },
	{ n: "21", name: "ghDefault ignores the per-call limit and keeps its 30 s default", edits: [
		one(NL, GH_PARAMS, "return (cwd, args, { env = process.env } = {}) => { const callTimeoutMs = timeoutMs;"),
	], tests: [T_LCR], expectRed: [R_2756] },
	{ n: "22", name: "the download keeps --repo owner/repo with no github.com host", edits: [
		one(CR, HOST_REPO, "\"--repo\", `${repository.owner}/${repository.repo}`"),
	], tests: [T_LCR, T_CR], expectRed: [R_2750, R_2634], alsoRed: [R_2633, R_2635, R_2637, R_2638] },
	{ n: "23", name: "the store keeps only the newest attempt per leg", edits: [
		one(LCR, RECORD_LOOP, "for (const item of result.parsed.filter((entry) => !result.parsed.some((other) => other.run.id === entry.run.id && other.leg === entry.leg && other.attempt > entry.attempt))) {"),
	], tests: [T_LCR], expectRed: [R_2751] },
	{ n: "24", name: "the store name ends in the process id", edits: [
		one(LCR, STORE_CALL, STORE_CALL.replace("pid: `${item.run.id}-${item.leg}-${item.attempt}`", "pid: process.pid")),
	], tests: [T_LCR], expectRed: [R_2751] },
	{ n: "25a", name: "the land prunes with keep: Infinity", edits: [
		one(NL, KEEP_ARG, "\t\t\t\t\tkeep: Infinity,\n"),
	], tests: [T_LCR], expectRed: [R_2752] },
	{ n: "25b", name: "the lib forwards keep: Infinity to the shared writer, so the store never prunes", edits: [
		one(LCR, STORE_CALL, STORE_CALL.replace(", keep });", ", keep: Infinity });")),
	], tests: [T_LCR], expectRed: [R_2752] },
	{ n: "26", name: "the records read sits after the lock but before the post-merge checks, containment and release status", edits: movedRead(POST_MERGE, `\t\t${EARLY}\n${POST_MERGE}`), tests: [T_LCR], expectRed: [R_2750] },
	{ n: "27", name: "the guard wraps only the call; a malformed result is used outside it", edits: [
		one(NL, LET_RECORDS, "\t\tlet recordLines = [], recordNotes = [], keptResult = null;\n"),
		one(NL, RESULT_CHECK + NL_CATCH, "\t\t\t\tkeptResult = result;\n" + NL_CATCH + "\t\t\tif (keptResult) { recordLines = [...keptResult.lines]; recordNotes = [...keptResult.notes]; }\n"),
	], tests: [T_LCR], expectRed: [R_2755] },
	{ n: "28", name: "a spent budget with code 1 prints two CI records notes", edits: [
		one(LCR, BUDGET_FAILURE, "\t\tif (budgetStopped) notes.push(`${LAND_NOTE_PREFIX} note: CI records not read: stopped at the ${numberText(budgetMs / 1000)} s budget`);\n"),
		one(LCR, READ_FAILURE, READ_FAILURE.replace("\t\telse if", "\t\tif")),
	], tests: [T_LCR], expectRed: [R_2756] },
	{ n: "29", name: "one unparseable artifact time stops the remaining records being stored", edits: [
		one(LCR, STORE_CATCH, "} catch (error) { storeProblems.push(reasonOf(error)); break; }"),
	], tests: [T_LCR], expectRed: [R_2755] },
	{ n: "30", name: "the notes are capped before they are sorted", edits: [
		one(SR, SLOW_SORT + SLOW_CAP, SLOW_CAP.replace(/;\n$/, "\n") + SLOW_SORT.replace(/\n$/, ";\n")),
	], tests: [T_LCR], expectRed: [R_2754] },
	{ n: "S1", name: "ghDefault drops only its integer guard, keeping its catch", edits: [
		one(NL, GH_GUARD, ""),
	], tests: [T_LCR], expectRed: [R_2756] },
	{ n: "S2", name: "the land reads CI records when CI did not apply (the ciReadPassed gate ignored)", edits: [
		one(NL, RECORDS_GATE, "\t\tif (true) {\n"),
	], tests: [T_LAND], expectRed: [R_2590] },
	{ n: "S3", name: "the reader returns no parsed records on success", edits: [
		one(CR, PARSED_RETURN, "return { code: 0, records: printed.length, parsed: [] };"),
	], tests: [T_LCR], expectRed: [R_2751, R_2754], alsoRed: [R_2755] },
	{ n: "S4", name: "the reader's lines print before the ci: lines", edits: [
		one(NL, CI_TEXT + RECORD_TEXT, RECORD_TEXT + CI_TEXT),
	], tests: [T_LCR], expectRed: [R_2750] },
];

process.exitCode = await runMutations({ lane: "land-ci-timings", self: import.meta.url, tip: "14c4c849", declared: DECLARED, pairs: PAIRS });
