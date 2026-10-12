#!/usr/bin/env node
// Seat mutation runner for lane cc-hooks-windows (frozen table; CHANGE.md §5 "Mutation pairs").
// For each pair: apply a CODE mutation in a detached scratch worktree of the lane tip, refuse when
// an anchor does not occur exactly once (ANCHOR-MISS = runner bug), syntax-check the mutated
// module, run the named test files with node exactly as scripts/test.mjs does (package-dir cwd,
// fresh HOME/TMPDIR, NANA_* and PI_CODING_AGENT_DIR scrubbed, --experimental-strip-types), and
// print RED / GREEN / WINONLY. hooks-win32-exec.test.mjs runs only on real Windows, so its cases
// are recorded per pair as "windows-leg, not run here", never as green or red.
// Never touches the lane worktree or the main checkout: everything runs in two detached scratch
// worktrees (lane tip, and main for the seat script's golden comparison), removed at the end.
// Usage: node cch-seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const LANE_REPO = "/Users/jwang/nana-pi-wt/cc-hooks-windows";
// The tip under test: SEAT_MUTATE_TIP, else the lane branch head (built at cfa1556 for the first run).
const TIP = process.env.SEAT_MUTATE_TIP || "feat/cc-hooks-windows";
const MAIN_REF = "7e6ce39"; // main = the lane's merge base; golden reference for pair 14's seat script
const HERE = path.dirname(fileURLToPath(import.meta.url));
// Scratch lives under the OS temp folder, never beside this file (which sits inside the lane worktree).
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "cch-seat-mutate-"));
const WT = path.join(SCRATCH, "wt");
const MAIN_WT = path.join(SCRATCH, "main");
const RUNS = path.join(SCRATCH, "runs");
const TIMEOUT_MS = 10 * 60 * 1000;

const SM = "packages/nana-setup/tests/settings-merge.test.mjs";
const WD = "packages/nana-setup/tests/win32-degrade.test.mjs";
const VP = "packages/nana-setup/tests/verifier-pipe.test.mjs";
const IN = "packages/nana-setup/tests/install.test.mjs";
const PG = "packages/nana-pack/tests/pipe-guard.test.mjs";
const TR = "packages/nana-pack/tests/templates-render.test.mjs";
const SV = "docs/reviews/cc-hooks-windows-2026-10-12/seat-verify-hooks.mjs"; // seat acceptance (d): macOS golden
const HW = "packages/nana-setup/tests/hooks-win32-exec.test.mjs"; // Windows leg only — never run here

const SETTINGS = "packages/nana-setup/lib/settings.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const DOCTOR = "packages/nana-setup/lib/doctor.mjs";
const VHOOK = "packages/nana-setup/lib/verifier-hook.mjs";
const PIPE = "packages/nana-pack/lib/pipe-guard.mjs";
const MATRIX = "templates/_shared/working-under-nana-pi.md";
const AGENTS = "AGENTS.md"; // CLAUDE.md is a symlink to it; the R-859 copy of the matrix row

const NEW_CELL = "| PreToolUse Node hook `verifier-pipe.mjs` (matcher `Bash` on macOS and Linux, `Bash\\|PowerShell` on Windows) |";
const OLD_CELL = "| Bash PreToolUse Node hook `verifier-pipe.mjs` |"; // main's cell

// Frozen table. `file/anchor/replacement` is the primary edit; `more` holds further edits the same
// wrong code needs in other places. `expectRed`: substrings of FAIL titles the CHANGE says go red.
// `winRed`: the Windows-leg cases the CHANGE also names (hooks-win32-exec.test.mjs) — not run here.
const PAIRS = [
	{ n: "19", name: "lex PowerShell as Bash (drop the dialect branch in liveText)", file: PIPE,
		anchor: '\tif (dialect === "powershell") return liveTextPowerShell(String(command ?? ""));\n', replacement: "",
		tests: [PG], expectRed: ["a backtick escapes a pipe outside any string", "here-string hides its pipe", "here-string with no subexpression hides its pipe", "block comment hides its pipe", "recovery after a backtick-escaped double quote"] },
	{ n: "20", name: "$( ) inside double quotes and expandable here-strings is inactive", file: PIPE,
		anchor: "if (hereString === '\"' && ch === \"$\" && source[i + 1] === \"(\") {", replacement: "if (false) {",
		more: [{ file: PIPE, anchor: '\t\t\tif (ch === "$" && source[i + 1] === "(") {', replacement: "\t\t\tif (false) {" }],
		tests: [PG], expectRed: ["subexpression inside a double-quoted string is live", "subexpression inside an expandable here-string is live"] },
	{ n: "22", name: "end a double-quoted string at a backtick-escaped quote", file: PIPE,
		anchor: "\t\tif (quote === '\"') {\n\t\t\tif (ch === \"`\" && i + 1 < source.length) {",
		replacement: "\t\tif (quote === '\"') {\n\t\t\tif (ch === \"`\" && i + 1 < source.length && source[i + 1] !== '\"') {",
		tests: [PG], expectRed: ["recovery after a backtick-escaped double quote", "(backtick form)"] },
	{ n: "23", name: "\"\" inside a double-quoted string closes it (wrong state reset)", file: PIPE,
		anchor: "\t\t\tif (ch === '\"' && source[i + 1] === '\"') { text += \"  \"; i++; atLineStart = false; continue; }",
		replacement: "\t\t\tif (ch === '\"' && source[i + 1] === '\"') { quote = \"\"; text += \"  \"; i++; atLineStart = false; continue; }",
		tests: [PG], expectRed: ["recovery after a doubled double quote", "(doubled form)"] },
	{ n: "24", name: "treat every here-string as single-quoted", file: PIPE,
		anchor: "\t\t\thereString = source[i + 1];", replacement: "\t\t\thereString = \"'\";",
		tests: [PG], expectRed: ["subexpression inside an expandable here-string is live"] },
	{ n: "21", name: "leave the matrix cell as \"Bash PreToolUse\" (template and its AGENTS copy)", file: MATRIX,
		anchor: NEW_CELL, replacement: OLD_CELL, more: [{ file: AGENTS, anchor: NEW_CELL, replacement: OLD_CELL }],
		tests: [VP, TR], expectRed: ["runtime matrix declares verifier-pipe surfaces", "shared runtime matrix declares four runtime surfaces"] },
	{ n: "1", name: "restore the win32 knowledge-only filter in stepSettings", file: STEPS,
		anchor: "\t\tconst repo = mergeRepoHooks(settings, { repoRoot, wanted, platform: platformValue });\n\t\tconst toAppend = wanted.filter((w) => !repo[w.label]?.found);",
		replacement: "\t\tconst ported = new Set([\"nana-objective.mjs\", \"nana-adoption.mjs\", \"nana-shared-memory.mjs\", \"verifier-pipe.mjs\"]);\n\t\tconst applicable = win() ? wanted.filter((w) => !ported.has(w.spec.script) && w.label !== \"PreToolUse verifier pipe\") : wanted;\n\t\tconst repo = mergeRepoHooks(settings, { repoRoot, wanted: applicable, platform: platformValue });\n\t\tconst toAppend = applicable.filter((w) => !repo[w.label]?.found);",
		tests: [WD, SM], expectRed: ["exec form (command \"node\", args array, no shell key)", "is created, not skipped"],
		winRed: ["every Windows spawn case (objective, adoption, shared memory, verifier)"] },
	{ n: "2", name: "write shell form on win32 (node ${shq(path)}, no args)", file: SETTINGS,
		anchor: "? { type: \"command\", command: \"node\", args: [target], timeout: 5, statusMessage }",
		replacement: "? { type: \"command\", command: `node ${shq(target)}`, timeout: 5, statusMessage }",
		more: [
			{ file: SETTINGS, anchor: "? { type: \"command\", command: \"node\", args: [verifierPipeTarget], timeout: 5, statusMessage: \"nana: verifier pipe\" }",
				replacement: "? { type: \"command\", command: `node ${shq(verifierPipeTarget)}`, timeout: 5, statusMessage: \"nana: verifier pipe\" }" },
			{ file: SETTINGS, anchor: "? { type: \"command\", command: \"node\", args: [knowledgeCli, \"hook\"], timeout: 5, statusMessage: \"nana: knowledge pull\" }",
				replacement: "? { type: \"command\", command: `node ${shq(knowledgeCli)} hook`, timeout: 5, statusMessage: \"nana: knowledge pull\" }" },
		],
		tests: [SM, WD], expectRed: ["every entry is exec form with no shell key", "exec form (command \"node\", args array, no shell key)"],
		winRed: ["harness exec-shape check before spawning"] },
	{ n: "3", name: "quote the path inside args ('<path>')", file: SETTINGS,
		anchor: "args: [target]", replacement: "args: [shq(target)]",
		more: [
			{ file: SETTINGS, anchor: "args: [verifierPipeTarget]", replacement: "args: [shq(verifierPipeTarget)]" },
			{ file: SETTINGS, anchor: "args: [knowledgeCli, \"hook\"]", replacement: "args: [shq(knowledgeCli), \"hook\"]" },
		],
		tests: [SM, WD], expectRed: ["args[0] is absolute, exists, and ends with the entry's script", "name packages/nana-setup/claude/hooks/"],
		winRed: ["every Windows spawn case (node receives the quotes)"] },
	{ n: "4a", name: "use matcher Bash on win32 (desiredHooks)", file: SETTINGS,
		anchor: "matcher: win32 ? WIN_VERIFIER_MATCHER : \"Bash\",", replacement: "matcher: \"Bash\",",
		tests: [SM, WD], expectRed: ["verifier group's matcher"],
		winRed: ["the verifier group's matcher is Bash-or-PowerShell (literal)"] },
	{ n: "4b", name: "use matcher Bash on win32 (retune WIN_VERIFIER_MATCHER)", file: SETTINGS,
		anchor: "export const WIN_VERIFIER_MATCHER = \"Bash|PowerShell\";", replacement: "export const WIN_VERIFIER_MATCHER = \"Bash\";",
		tests: [SM, WD], expectRed: ["WIN_VERIFIER_MATCHER is Bash-or-PowerShell"],
		winRed: ["the verifier group's matcher is Bash-or-PowerShell (literal)"] },
	{ n: "5", name: "decideHook rejects PowerShell", file: VHOOK,
		anchor: "(tool !== \"Bash\" && tool !== \"PowerShell\")", replacement: "tool !== \"Bash\"",
		tests: [VP], expectRed: ["decideHook judges a PowerShell event"],
		winRed: ["verifier: PowerShell masked pipe gives an ask"] },
	{ n: "6", name: "bash dialect for PowerShell", file: VHOOK,
		anchor: "tool === \"PowerShell\" ? \"powershell\" : \"bash\"", replacement: "\"bash\"",
		tests: [VP], expectRed: ["decideHook judges a PowerShell event"],
		winRed: ["verifier: PowerShell masked pipe gives an ask"] },
	{ n: "7a", name: "drop the exec branch of entryInvokes (hasHook reads command only)", file: SETTINGS,
		anchor: "\tif (platform === \"win32\" && hook && typeof hook === \"object\" && \"args\" in hook && hook.args !== undefined) {\n\t\tif (!Array.isArray(hook.args) || !hook.args.every((a) => typeof a === \"string\")) return false;\n\t\treturn targetFromArgv([hook.command, ...hook.args], spec, false) !== null;\n\t}\n\treturn commandInvokes(hook?.command, spec);",
		replacement: "\treturn commandInvokes(hook?.command, spec);",
		tests: [SM, WD], expectRed: ["hasHook on win32 finds an exec-form entry", "hand-written exec-form variant is kept byte for byte, no twin", "win32 doctor prints no ✗"] },
	{ n: "7b", name: "hasHook reads command only (entryInvokes intact)", file: SETTINGS,
		anchor: "g.hooks.some((h) => entryInvokes(h, spec, platform))", replacement: "g.hooks.some((h) => commandInvokes(h?.command, spec))",
		tests: [SM, WD], expectRed: ["hasHook on win32 finds an exec-form entry", "hand-written exec-form variant is kept byte for byte, no twin", "win32 doctor prints no ✗"] },
	{ n: "8", name: "entryInvokes skips a leading VAR=value word in exec form", file: SETTINGS,
		anchor: "\t\treturn targetFromArgv([hook.command, ...hook.args], spec, false) !== null;",
		replacement: "\t\treturn targetFromArgv([hook.command, ...hook.args], spec, true) !== null;",
		tests: [SM], expectRed: ["NODE_NO_WARNINGS=1 with node in args reads as not installed"] },
	{ n: "9", name: "narrow installerTarget back to the prefixed form only", file: SETTINGS,
		anchor: "\tif (!win32) return null;\n", replacement: "\treturn null;\n",
		tests: [SM, WD], expectRed: ["is repaired in place to this checkout, no twin", "healthy earlier-form knowledge entry is moved to exec form", "accepts the earlier win32 knowledge form", "accepts the R-1050 exec form"],
		winRed: ["the stale knowledge entry was replaced in place (real mixed-separator entry)"] },
	{ n: "9b", name: "installerTarget drops only the earlier win32 knowledge form (bug 4)", file: SETTINGS,
		anchor: "return { target, form: \"win32-legacy\" };", replacement: "return null;",
		tests: [SM, WD], expectRed: ["accepts the earlier win32 knowledge form", "healthy earlier-form knowledge entry is moved to exec form"],
		winRed: ["the stale knowledge entry was replaced in place (real mixed-separator entry)"] },
	{ n: "10", name: "repair only stale entries on win32 (drop R-1059)", file: SETTINGS,
		anchor: "if (item.healthy && (!win32 || item.form === \"win32-exec\")) continue;", replacement: "if (item.healthy) continue;",
		tests: [WD], expectRed: ["healthy earlier-form knowledge entry is moved to exec form"] },
	{ n: "11", name: "doctor uses hasHook alone on win32", file: DOCTOR,
		anchor: "\t\t\tconst healthy = present && resolves;", replacement: "\t\t\tconst healthy = present;",
		tests: [WD], expectRed: ["target reads ✗"] },
	{ n: "12", name: "skip the Node floor check on win32 again", file: DOCTOR,
		anchor: "\t{\n\t\tconst r = spawnSync(\"node\", [\"-p\", \"process.versions.node\"], { encoding: \"utf8\" });",
		replacement: "\tif (win) add(NOTE, \"node for the objective hook\", \"skipped (win32)\");\n\telse {\n\t\tconst r = spawnSync(\"node\", [\"-p\", \"process.versions.node\"], { encoding: \"utf8\" });",
		tests: [WD], expectRed: ["node for the objective hook runs (not skipped)"] },
	{ n: "13a", name: "drop the floor note row on win32", file: DOCTOR,
		anchor: "\tif (win) add(NOTE, \"Claude Code hooks floor\", `need Claude Code ${CLAUDE_CODE_EXEC_FLOOR} or later (not checked here — \\`claude --version\\` is never run)`);\n",
		replacement: "",
		tests: [WD], expectRed: ["a note names the Claude Code exec-form floor"],
		winRed: ["doctor: a note names the Claude Code exec-form floor (2.1.139)"] },
	{ n: "13b", name: "retune CLAUDE_CODE_EXEC_FLOOR", file: SETTINGS,
		anchor: "export const CLAUDE_CODE_EXEC_FLOOR = \"2.1.139\";", replacement: "export const CLAUDE_CODE_EXEC_FLOOR = \"2.1.140\";",
		tests: [SM, WD, TR], expectRed: ["CLAUDE_CODE_EXEC_FLOOR is 2.1.139", "three front doors carry one identical scoped platform claim"] },
	{ n: "14", name: "send POSIX through exec form", file: SETTINGS,
		anchor: "\t\t\tentry: win32\n", replacement: "\t\t\tentry: true\n",
		more: [
			{ file: SETTINGS, anchor: "\tconst verifierPipeEntry = win32\n", replacement: "\tconst verifierPipeEntry = true\n" },
			{ file: SETTINGS, anchor: "\tconst knowledgeEntry = win32\n", replacement: "\tconst knowledgeEntry = true\n" },
		],
		tests: [SM, IN, SV], expectRed: ["darwin: settings.json equals main's", "POSIX desiredHooks deep-equals today's fixture"] },
	{ n: "15", name: "accept the win32-only forms on POSIX", file: SETTINGS,
		anchor: "\tif (!win32) return null;\n", replacement: "\n",
		tests: [SM], expectRed: ["installerTarget on POSIX rejects the two win32-only forms"] },
	{ n: "16", name: "removeInstallerHooks compares command only", file: SETTINGS,
		anchor: "const index = matching.findIndex((item) => JSON.stringify(canonical(item.entry)) === JSON.stringify(canonical(entry)));",
		replacement: "const index = matching.findIndex((item) => item.entry.command === entry?.command);",
		tests: [SM], expectRed: ["keeps the entry whose args differ"] },
	{ n: "17", name: "read exec form on POSIX too (drop the platform gate in entryInvokes)", file: SETTINGS,
		anchor: "export function entryInvokes(hook, spec, platform) {\n\tif (platform === \"win32\" && hook",
		replacement: "export function entryInvokes(hook, spec, platform) {\n\tif (hook",
		tests: [SM], expectRed: ["POSIX reads a copied Windows exec fragment as not installed", "reads as commandInvokes reads its command (POSIX)"] },
	{ n: "18a", name: "installerTarget accepts a win32 shell form carrying args (earlier win32 form)", file: SETTINGS,
		anchor: "\tif (isKnowledge && !hasArgs) {", replacement: "\tif (isKnowledge && (!hasArgs || hook.command !== \"node\")) {",
		tests: [SM], expectRed: ["installerTarget on win32 rejects a shell form carrying args"] },
	{ n: "18b", name: "installerTarget accepts a win32 shell form carrying args (POSIX prefixed form)", file: SETTINGS,
		anchor: "\tif (isKnowledge && !(win32 && hasArgs)) {", replacement: "\tif (isKnowledge) {",
		tests: [SM], expectRed: ["installerTarget on win32 rejects a shell form carrying args"] },
	// 25-26: the kept status-message gate (CHANGE §3 "the timeout and status-message gate stays"), added by
	// the seat after build 1 dropped it. Injected at the top of installerTarget so they apply however the
	// gate is written.
	{ n: "25", name: "drop the status-message gate (every entry reads as carrying the wanted row's status)", file: SETTINGS,
		anchor: "export function installerTarget(hook, wanted, platform) {\n",
		replacement: "export function installerTarget(hook, wanted, platform) {\n\tif (hook && typeof hook === \"object\") hook = { ...hook, statusMessage: wanted.entry.statusMessage };\n",
		tests: [SM, WD], expectRed: ["status message"] },
	{ n: "26", name: "accept a missing status message as the installer's own", file: SETTINGS,
		anchor: "export function installerTarget(hook, wanted, platform) {\n",
		replacement: "export function installerTarget(hook, wanted, platform) {\n\tif (hook && typeof hook === \"object\" && hook.statusMessage === undefined) hook = { ...hook, statusMessage: wanted.entry.statusMessage };\n",
		tests: [SM, WD], expectRed: ["no status message"] },
];

// ── plumbing ────────────────────────────────────────────────────────────────────────────────
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });
const git = (...args) => sh("git", args);
const count = (hay, needle) => hay.split(needle).length - 1;
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR";
const BASE_ENV = (() => {
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k)) delete e[k];
	const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${c}`] = "0";
	e.GIT_CONFIG_COUNT = String(c + 1);
	return e;
})();
let runSeq = 0;

function addWorktree(dir, ref) {
	if (fs.existsSync(dir)) { git("-C", LANE_REPO, "worktree", "remove", "--force", dir); fs.rmSync(dir, { recursive: true, force: true }); }
	git("-C", LANE_REPO, "worktree", "prune");
	const r = git("-C", LANE_REPO, "worktree", "add", "--detach", dir, ref);
	if (r.status !== 0) throw new Error(`worktree add ${ref} failed: ${r.stderr}`);
}
function removeWorktree(dir) {
	git("-C", LANE_REPO, "worktree", "remove", "--force", dir);
	fs.rmSync(dir, { recursive: true, force: true });
	git("-C", LANE_REPO, "worktree", "prune");
}
function resetWorktree() {
	git("-C", WT, "checkout", "--", ".");
	git("-C", WT, "clean", "-fdq"); // only the scratch worktree; tests may leave untracked files
	const st = git("-C", WT, "status", "--porcelain");
	if (st.stdout.trim()) throw new Error(`scratch worktree not clean after reset:\n${st.stdout}`);
}

/** Run one test file the way scripts/test.mjs does; resolve { code, out, timedOut, secs }. */
function runTest(rel) {
	const file = path.join(WT, rel);
	const isPkgTest = /\/tests\//.test(rel);
	const cwd = isPkgTest ? path.dirname(path.dirname(file)) : WT;
	const id = ++runSeq;
	const home = path.join(RUNS, `home-${id}`);
	const tmp = path.join(RUNS, `tmp-${id}`);
	fs.mkdirSync(home, { recursive: true });
	fs.mkdirSync(tmp, { recursive: true });
	const env = { ...BASE_ENV, HOME: home, USERPROFILE: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
	if (rel === SV) env.SEAT_MAIN = MAIN_WT;
	const t0 = Date.now();
	return new Promise((resolve) => {
		const child = spawn(process.execPath, ["--experimental-strip-types", file], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
		let out = "";
		child.stdout.on("data", (d) => { out += d; });
		child.stderr.on("data", (d) => { out += d; });
		let timedOut = false;
		const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch {} }, TIMEOUT_MS);
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			fs.rmSync(home, { recursive: true, force: true });
			fs.rmSync(tmp, { recursive: true, force: true });
			resolve({ code: code ?? (signal ? 128 : 1), out, timedOut, secs: ((Date.now() - t0) / 1000).toFixed(1) });
		});
	});
}
const failLines = (out) => out.split("\n").filter((l) => /^(FAIL|MISS) /.test(l)).map((l) => l.replace(/^(FAIL|MISS) +/, "").trim());
const short = (s, n = 110) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

let logFile = null;
const log = (line) => { console.log(line); if (logFile) fs.appendFileSync(logFile, line + "\n"); };

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
logFile = process.env.SEAT_MUTATE_OUT || null;
if (logFile) fs.writeFileSync(logFile, "");

fs.rmSync(RUNS, { recursive: true, force: true });
fs.mkdirSync(RUNS, { recursive: true });
const tipSha = git("-C", LANE_REPO, "rev-parse", TIP).stdout.trim();
const mainSha = git("-C", LANE_REPO, "rev-parse", MAIN_REF).stdout.trim();
log(`seat-mutate: lane cc-hooks-windows, tip ${tipSha}, golden main ${mainSha}, node ${process.version}, ${new Date().toISOString()}`);
addWorktree(WT, tipSha);
const needMain = pairs.some((p) => p.tests.includes(SV));
if (needMain) addWorktree(MAIN_WT, mainSha);

const tally = { red: 0, survived: 0, winonly: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
try {
	// Baseline: every named runnable file, unmutated, must exit 0.
	const files = [...new Set(pairs.flatMap((p) => p.tests))];
	let baselineOk = true;
	for (const rel of files) {
		const r = await runTest(rel);
		const fl = failLines(r.out);
		const ok = r.code === 0 && !r.timedOut && fl.length === 0;
		log(`BASELINE ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${r.out.split("\n").filter((l) => /^(PASS|ok) +/.test(l)).length} PASS, ${fl.length} FAIL, ${r.secs}s)${ok ? "" : " — " + fl.slice(0, 3).map((t) => short(t)).join(" | ")}`);
		if (!ok) baselineOk = false;
	}
	log(`BASELINE windows-only, not run here: ${HW}`);
	resetWorktree();
	if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); process.exitCode = 2; }
	else {
		for (const p of pairs) {
			resetWorktree();
			const edits = [{ file: p.file, anchor: p.anchor, replacement: p.replacement }, ...(p.more ?? [])];
			let miss = null;
			for (const e of edits) {
				const abs = path.join(WT, e.file);
				const text = fs.readFileSync(abs, "utf8");
				const c = count(text, e.anchor);
				if (c !== 1) { miss = `${e.file}: anchor occurs ${c}× — ${short(JSON.stringify(e.anchor), 80)}`; break; }
				fs.writeFileSync(abs, text.replace(e.anchor, () => e.replacement));
			}
			if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
			const diff = git("-C", WT, "diff", "--stat").stdout.trim().split("\n").pop();
			let bad = null;
			for (const f of new Set(edits.map((e) => e.file))) {
				if (!/\.(mjs|js)$/.test(f)) continue;
				const chk = sh(process.execPath, ["--check", path.join(WT, f)]);
				if (chk.status !== 0) { bad = `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`; break; }
			}
			if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
			if (!p.tests.length) { tally.winonly++; log(`WINONLY ${p.n} ${p.name}`); continue; }
			tally.runnable++;
			const allFails = [];
			const passTitles = [];
			const crashed = [];
			for (const rel of p.tests) {
				const r = await runTest(rel);
				const fl = failLines(r.out);
				passTitles.push(...r.out.split("\n").filter((l) => /^(PASS|ok) +/.test(l)).map((l) => l.replace(/^(PASS|ok) +/, "").trim()));
				allFails.push(...fl.map((t) => ({ rel, t })));
				// An uncaught throw ends the file early: checks after it never print, so a named case
				// that is absent from the output was NOT green — it was never reached.
				const thrown = r.out.split("\n").find((l) => /^[A-Za-z]*Error\b[^\n]*:/.test(l));
				if (thrown) crashed.push(`${path.basename(rel)} THREW (later checks never ran): ${short(thrown, 120)}`);
				else if ((r.code !== 0 || r.timedOut) && fl.length === 0) crashed.push(`${path.basename(rel)} exit ${r.code}${r.timedOut ? " (timeout)" : ""}: ${short(r.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
			}
			const matched = allFails.filter(({ t }) => p.expectRed.some((s) => t.includes(s)));
			const failed = (s) => allFails.some(({ t }) => t.includes(s));
			const missedExpect = p.expectRed.filter((s) => !failed(s) && passTitles.some((t) => t.includes(s)));
			const notReached = p.expectRed.filter((s) => !failed(s) && !passTitles.some((t) => t.includes(s)));
			const win = p.winRed?.length ? `; windows-leg, not run here: ${p.winRed.join("; ")}` : "";
			const extra = `${missedExpect.length ? `; named but GREEN: ${missedExpect.map((s) => JSON.stringify(s)).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map((s) => JSON.stringify(s)).join(", ")}` : ""}; ${allFails.length} FAIL total (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}${win}`;
			if (matched.length) {
				tally.red++;
				log(`RED ${p.n} ${p.name} — ${matched.slice(0, 3).map(({ rel, t }) => `[${path.basename(rel)}] ${short(t)}`).join(" | ")}${extra}`);
			} else if (allFails.length || crashed.length) {
				tally.red++;
				log(`RED ${p.n} ${p.name} — (no named case) ${allFails.slice(0, 3).map(({ rel, t }) => `[${path.basename(rel)}] ${short(t)}`).join(" | ")}${extra}`);
			} else {
				tally.survived++;
				log(`GREEN ${p.n} ${p.name} — SURVIVED${extra}`);
			}
		}
	}
} finally {
	resetWorktree();
	removeWorktree(WT);
	if (needMain) removeWorktree(MAIN_WT);
	fs.rmSync(SCRATCH, { recursive: true, force: true });
}
log(`seat-mutate: ${tally.red}/${tally.runnable} red, ${tally.survived} survived, ${tally.winonly} windows-only${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}`);
if (tally.anchorMiss || tally.syntax) process.exitCode = 3;
