#!/usr/bin/env node
// Seat wrong-code pairs for lane land-reads-ci (gate lane: a land tool), written by the seat 2026-10-22 after build 1, on
// the shared runner, at tip 3d2953dc. They are the must-meet's seventeen pairs in its order. Run from the worktree root on
// macOS:   SEAT_MUTATE_OUT=<file> node docs/reviews/land-reads-ci-2026-10-22/seat-mutate.mjs
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const LIB = "packages/nana-pack/lib/land-ci.mjs";
const LAND = "packages/nana-pack/bin/nana-land.mjs";
const T = "packages/nana-pack/tests/land.test.mjs";
const R_2586 = /^R-2586: /; // R-2586
const R_2587 = /^R-2587: /; // R-2587
const R_2588 = /^R-2588: /; // R-2588
const R_2589 = /^R-2589: /; // R-2589
const R_2590 = /^R-2590: /; // R-2590
const R_2591 = /^R-2591: /; // R-2591
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

const BAD = "const bad = [...newest.values()].filter((run) => run.status !== CI_DONE_STATUS || run.conclusion !== CI_PASS_CONCLUSION);";
const ARGS = "const args = [\"api\", \"--hostname\", CI_HOST, `${apiPath}?head_sha=${tip}&per_page=${CI_RUNS_PAGE_SIZE}`];";
const LS_TREE = 'git(runGit, tree, "ls-tree", "-z", "--name-only", tip, "--", `${CI_WORKFLOW_DIR}/`)';
const STATUS = "if (response?.status !== 0) throw new Error(`gh CI read failed (exit ${response?.status ?? response?.signal ?? \"unknown\"})${firstErrorLine ? `: ${firstErrorLine}` : \"\"}`);";
const GREEN = "'{\"total_count\":1,\"workflow_runs\":[{\"workflow_id\":1,\"name\":\"ci\",\"id\":1,\"run_number\":1,\"run_attempt\":1,\"event\":\"push\",\"status\":\"completed\",\"conclusion\":\"success\"}]}'";

const DECLARED = [
	"(plan) p1 to p17 follow the must-meet's wrong-code list in order",
	"(seat) p8 reads a failed gh call as a passing run list, the shape of 'CI does not apply' that still lands",
];

const PAIRS = [
	{ n: "p1", name: "only the first run returned is judged", edits: [
		one(LIB, "for (const run of body.workflow_runs) {", "for (const run of body.workflow_runs.slice(0, 1)) {"),
	], tests: [T], expectRed: [R_2586] },
	{ n: "p2", name: "any green run passes", edits: [
		one(LIB, BAD, "const bad = body.workflow_runs.some((run) => run.status === CI_DONE_STATUS && run.conclusion === CI_PASS_CONCLUSION) ? [] : [...newest.values()];"),
	], tests: [T], expectRed: [R_2586] },
	{ n: "p3", name: "the newest run is the lowest run_number", edits: [
		one(LIB, "run.run_number > prior.run_number", "run.run_number < prior.run_number"),
	], tests: [T], expectRed: [R_2588] },
	{ n: "p4", name: "jobs read for the run's attempts", edits: [
		one(LAND, "const verdict = judgeRuns(response.stdout, tip);", "const jobs = runGh(main, [\"api\", \"--hostname\", CI_HOST, `${apiPath}/1/attempts/1/jobs`], { env: process.env });\n\t\t\tif (jobs?.status === 0 && /failure/.test(String(jobs.stdout))) throw new Error(\"a job failed\");\n\t\t\tconst verdict = judgeRuns(response.stdout, tip);"),
	], tests: [T], expectRed: [R_2588] },
	{ n: "p5", name: "completed with neutral, skipped or null passes", edits: [
		one(LIB, BAD, "const bad = [...newest.values()].filter((run) => run.status !== CI_DONE_STATUS || ![\"success\", \"neutral\", \"skipped\", null].includes(run.conclusion));"),
	], tests: [T], expectRed: [R_2586] },
	{ n: "p6", name: "the conclusion judged without the status", edits: [
		one(LIB, BAD, "const bad = [...newest.values()].filter((run) => run.conclusion !== CI_PASS_CONCLUSION);"),
	], tests: [T], expectRed: [R_2587] },
	{ n: "p7", name: "an empty run list passes", edits: [
		one(LIB, "if (body.workflow_runs.length === 0) return { ok: false,", "if (body.workflow_runs.length === 0) return { ok: true, lines: [] }; if (false) return { ok: false,"),
	], tests: [T], expectRed: [R_2587] },
	{ n: "p8", name: "a failed gh call read as passing", edits: [
		one(LAND, STATUS, `if (response?.status !== 0) response.stdout = ${GREEN};`),
	], tests: [T], expectRed: [R_2589] },
	{ n: "p9", name: "the CI read after the suite", edits: [
		one(LAND, 'const remoteNames = git(runGit, main, "remote");', 'runCommand(suite, tree, { env: { ...process.env, [LAND_TIP_ENV]: tip } });\n\t\tconst remoteNames = git(runGit, main, "remote");'),
	], tests: [T], expectRed: [R_2586] },
	{ n: "p10", name: "the eight-digit tip asked for", edits: [
		one(LAND, ARGS, "const args = [\"api\", \"--hostname\", CI_HOST, `${apiPath}?head_sha=${tip.slice(0, 8)}&per_page=${CI_RUNS_PAGE_SIZE}`];"),
	], tests: [T], expectRed: [R_2591] },
	{ n: "p11", name: "--hostname dropped", edits: [
		one(LAND, ARGS, "const args = [\"api\", `${apiPath}?head_sha=${tip}&per_page=${CI_RUNS_PAGE_SIZE}`];"),
	], tests: [T], expectRed: [R_2591] },
	{ n: "p12", name: "scope read from main instead of the tip", edits: [
		one(LAND, LS_TREE, 'git(runGit, main, "ls-tree", "-z", "--name-only", "HEAD", "--", `${CI_WORKFLOW_DIR}/`)'),
	], tests: [T], expectRed: [R_2590] },
	{ n: "p13", name: "the host check matches a substring", edits: [
		one(LIB, "const match = GITHUB_REMOTE.exec(String(url ?? \"\").trim());\n\treturn match ? { owner: match[1], repo: match[2] } : null;", "const text = String(url ?? \"\").trim();\n\tconst match = GITHUB_REMOTE.exec(text);\n\treturn match ? { owner: match[1], repo: match[2] } : (/github\\.com/i.test(text) ? { owner: \"example\", repo: \"fixture\" } : null);"),
	], tests: [T], expectRed: [R_2590] },
	{ n: "p14", name: "any file under .github/workflows, nested ones included, counts", edits: [
		one(LAND, LS_TREE, 'git(runGit, tree, "ls-tree", "-r", "-z", "--name-only", tip, "--", `${CI_WORKFLOW_DIR}/`)'),
		one(LIB, "path.posix.dirname(file) === CI_WORKFLOW_DIR && CI_WORKFLOW_EXTENSIONS.includes(path.posix.extname(file))", "file.startsWith(`${CI_WORKFLOW_DIR}/`)"),
	], tests: [T], expectRed: [R_2590] },
	{ n: "p15", name: "every origin-read failure read as no origin", edits: [
		one(LAND, 'const remoteNames = git(runGit, main, "remote");', 'let remoteNames = ""; try { remoteNames = git(runGit, main, "remote"); } catch { remoteNames = ""; }'),
		one(LAND, 'const originUrl = hasOrigin ? git(runGit, main, "remote", "get-url", CI_REMOTE) : "";', 'let originUrl = ""; try { originUrl = hasOrigin ? git(runGit, main, "remote", "get-url", CI_REMOTE) : ""; } catch { originUrl = ""; }'),
	], tests: [T], expectRed: [R_2589] },
	{ n: "p16", name: "runs grouped by name, not workflow_id", edits: [
		one(LIB, "const key = String(run.workflow_id);", "const key = String(run.name);"),
	], tests: [T], expectRed: [R_2586] },
	{ n: "p17", name: "the default runner passes no timeout", edits: [
		one(LAND, "encoding: \"utf8\", timeout: timeoutMs, maxBuffer }", "encoding: \"utf8\", maxBuffer }"),
	], tests: [T], expectRed: [R_2589] },
];

process.exitCode = await runMutations({ lane: "land-reads-ci", self: import.meta.url, tip: "3d2953dc", declared: DECLARED, pairs: PAIRS });
