#!/usr/bin/env node
// Seat wrong-code pairs for lane install-check-builder (ordinary), written by the seat 2026-10-23 after build 1, at tip 96214696.
// They are the draft's pairs 1 to 28 with pairs 4, 6 and 7 applied to install-check.mjs (must-meet S-5), and the
// must-meet's pairs 29 to 34. Run from the lane worktree root:
//   SEAT_MUTATE_OUT=<file> node docs/reviews/install-check-builder-2026-10-23/seat-mutate.mjs
import fs from "node:fs";
import { runMutations } from "../../../packages/nana-pack/lib/mutation-runner.mjs";

const IC = "packages/nana-setup/lib/install-check.mjs";
const CFG = "packages/nana-setup/lib/install-check-config.mjs";
const T_IC = "packages/nana-setup/tests/install-check.test.mjs";
const R_2681 = /^pi-worker launch: off win32, /; // R-2681
const R_2682 = /^pi-worker launch: on win32, /; // R-2682
const R_2683 = /^pi-worker lines: /; // R-2683
const R_2684 = /^pi-worker record: /; // R-2684
const R_2685 = /^pi-worker ledger: /; // R-2685
const R_2686 = /^pi-worker lock: /; // R-2686
const R_2687 = /^pi-worker exit: /; // R-2687
const PIN = /^pin R-2681 to R-2687: /; // R-2681 to R-2687
const PIN_1071 = /^pin R-1071: the override list/; // R-1071
const FILES = /^checklist: the check writes only the objective lines and one MEMORY\.md line/; // R-1072
const one = (file, anchor, replacement) => ({ file, anchor, replacement, times: 1 });

// p34 moves the whole build block, read from the file, to just before the hook rows.
const SOURCE = fs.readFileSync(IC, "utf8");
const BLOCK_START = SOURCE.indexOf('  const buildRuns = platformName === "win32" ? PI_BUILD.runs.win32 : PI_BUILD.runs.default;\n');
const BLOCK_TAIL = "    report(run.label, judged.code, judged.passed, judged.detail);\n  }\n";
const BLOCK = SOURCE.slice(BLOCK_START, SOURCE.indexOf(BLOCK_TAIL, BLOCK_START) + BLOCK_TAIL.length);
const HOOK_ROWS = '  const settingsPath = path.join(home, ".claude", "settings.json");\n  let settings = {};';

const LOOP = "  for (const run of buildRuns) {";
const LOCK_IF = 'if (typeof starts[0]?.lock !== "string" || comparablePath(starts[0].lock, platformName) !== comparablePath(expectedLock, platformName) || lockExists) {';
const EXIT_TAIL = '${outputLine || stderrLine ? `; ${outputLine || stderrLine}` : ""}';

const DECLARED = [
	"(plan) p1 to p28 follow the draft's wrong-code list in order, with p4, p6 and p7 applied to install-check.mjs (must-meet S-5), so p7 names R-2681 alone; p29 to p34 are the must-meet's",
	"(seat) p28b changes a second sealed value, the end record's outcome, beside p28's --max-secs at the build timeout",
	"(seat) p30 names R-2683, whose PASS lines catch the default builder in the start record; R-2685's check judges ledger text directly, so it stays green",
	"(seat) p34 survives, confirmed at pair time: the stub roster-notice hook prints a fixed notice whatever the roster, and no row pins the block's place, so it is a FEAT-015 known bug",
];

const PAIRS = [
	{ n: "p1", name: "main's code: no build runs", edits: [
		one(IC, LOOP, "  for (const run of []) {"),
	], tests: [T_IC], expectRed: [R_2681, R_2682, R_2683] },
	{ n: "p2", name: "off win32, pi-worker launched by bare name", edits: [
		one(IC, '    if (form === "path") return invoke(path.join(home, ".local", "bin", name), args,', '    if (form === "path") return invoke(name === "pi-worker" ? name : path.join(home, ".local", "bin", name), args,'),
	], tests: [T_IC], expectRed: [R_2681] },
	{ n: "p3", name: "the build starts from the review repository", edits: [
		one(IC, "{ cwd: worktree, timeout: SPAWN_TIMEOUT_MS.build,", "{ cwd: reviewRepo, timeout: SPAWN_TIMEOUT_MS.build,"),
	], tests: [T_IC], expectRed: [R_2681] },
	{ n: "p4", name: "the worktree's branch without feat/", edits: [
		one(IC, "    const branch = `${PI_BUILD.branchPrefix}${run.lane}`;", "    const branch = run.lane;"),
	], tests: [T_IC], expectRed: [R_2681] },
	{ n: "p5", name: "the output file written inside the worktree", edits: [
		one(IC, "    const outputPath = path.join(buildOut, `${run.lane}.md`);", "    const outputPath = path.join(worktree, `${run.lane}.md`);"),
	], tests: [T_IC], expectRed: [R_2681] },
	{ n: "p6", name: "PI_OFFLINE dropped from the launch environment", edits: [
		one(IC, "env: { ...childEnv, ...PI_BUILD.env } });", "env: childEnv });"),
	], tests: [T_IC], expectRed: [R_2681] },
	{ n: "p7", name: "--max-secs dropped from the launcher arguments", edits: [
		one(IC, '"--out", outputPath, ...PI_BUILD.launcherArgs];', '"--out", outputPath, ...PI_BUILD.launcherArgs.slice(0, 2)];'),
	], tests: [T_IC], expectRed: [R_2681] },
	{ n: "p8", name: "on win32, the cmd form runs node pi-worker.mjs", edits: [
		one(IC, '      const launch = winCommand(path.join(home, ".local", "bin", `${name}.cmd`), args, { comspec: childEnv.ComSpec });', '      const launch = name === "pi-worker" ? { command: process.execPath, args: [path.join(root, "packages", "nana-pack", "bin", "pi-worker.mjs"), ...args], options: {} } : winCommand(path.join(home, ".local", "bin", `${name}.cmd`), args, { comspec: childEnv.ComSpec });'),
	], tests: [T_IC], expectRed: [R_2682] },
	{ n: "p9", name: "on win32, the Git Bash form names the bin path", edits: [
		one(IC, '    const commandLine = [name, ...args].map(shellQuote).join(" ");', '    const commandLine = [path.join(home, ".local", "bin", name), ...args].map(shellQuote).join(" ");'),
	], tests: [T_IC], expectRed: [R_2682] },
	{ n: "p10", name: "on win32, both runs share one lane and worktree", edits: [
		one(IC, LOOP, "  for (const run of buildRuns.map((item) => ({ ...item, lane: buildRuns[0].lane }))) {"),
	], tests: [T_IC], expectRed: [R_2682] },
	{ n: "p11", name: "the judge reads only the exit status", edits: [
		one(IC, '  if (typeof outputText !== "string") return { passed: false, code: "missing-report"', '  return { passed: true, code: null, detail: "" };\n  if (typeof outputText !== "string") return { passed: false, code: "missing-report"'),
	], tests: [T_IC], expectRed: [R_2683] },
	{ n: "p12", name: "the judge reads only the last non-blank line", edits: [
		one(IC, "if (reportLines.at(-2) !== PI_REVIEW.answer || reportLines.at(-1) !== PI_REVIEW.verdictLine)", "if (reportLines.at(-1) !== PI_REVIEW.verdictLine)"),
	], tests: [T_IC], expectRed: [R_2683] },
	{ n: "p13", name: "the preamble condition dropped", edits: [
		one(IC, 'if (typeof preamble !== "string" || !preamble || !system.includes(preamble)) return', "if (false) return"),
	], tests: [T_IC], expectRed: [R_2684] },
	{ n: "p14", name: "the preamble rendered without its placeholders filled", edits: [
		one(IC, 'const preamble = typeof preambleSource === "string" ? preambleSource.replaceAll(PI_BUILD.preamble.worktree, canonicalWorktree).replaceAll(PI_BUILD.preamble.branch, branch) : null;', 'const preamble = typeof preambleSource === "string" ? preambleSource : null;'),
	], tests: [T_IC], expectRed: [R_2684] },
	{ n: "p15", name: "the brief condition dropped", edits: [
		one(IC, 'if (typeof brief !== "string" || !brief || !system.includes(brief)) return', "if (false) return"),
	], tests: [T_IC], expectRed: [R_2684] },
	{ n: "p16", name: "the writing-tag condition dropped", edits: [
		one(IC, 'if (!system.includes(PI_TURN.writingTag)) return { passed: false, code: "writing", detail: `worker', 'if (false) return { passed: false, code: "writing", detail: `worker'),
	], tests: [T_IC], expectRed: [R_2684] },
	{ n: "p17", name: "the role condition dropped", edits: [
		one(IC, "if (record.role !== PI_BUILD.role) return", "if (false) return"),
	], tests: [T_IC], expectRed: [R_2684] },
	{ n: "p18", name: "the record not removed before each run", edits: [
		one(IC, "    fs.writeFileSync(briefPath, brief);\n    fs.rmSync(reviewRecordPath, { force: true });", "    fs.writeFileSync(briefPath, brief);"),
	], tests: [T_IC], expectRed: [R_2684] },
	{ n: "p19", name: "the ledger judge counts any lane", edits: [
		one(IC, "row?.kind === PI_BUILD.recordKinds.start && row?.lane === lane)", "row?.kind === PI_BUILD.recordKinds.start)"),
	], tests: [T_IC], expectRed: [R_2685] },
	{ n: "p20", name: "the ledger judge ignores the end's outcome and exit", edits: [
		one(IC, " || ends[0]?.outcome !== PI_BUILD.outcome || ends[0]?.exit !== 0) {", ") {"),
	], tests: [T_IC], expectRed: [R_2685] },
	{ n: "p21", name: "the ledger judge does not join by build id", edits: [
		one(IC, "row?.kind === PI_BUILD.recordKinds.end && row?.build === starts[0]?.build)", "row?.kind === PI_BUILD.recordKinds.end)"),
	], tests: [T_IC], expectRed: [R_2685] },
	{ n: "p22", name: "the ledger judge ignores the start's provider and model", edits: [
		one(IC, " || starts[0]?.provider !== PI_REVIEW.provider || starts[0]?.model !== PI_REVIEW.model", ""),
	], tests: [T_IC], expectRed: [R_2685] },
	{ n: "p23", name: "the lock judge checks only that the named file is gone", edits: [
		one(IC, LOCK_IF, "if (lockExists) {"),
	], tests: [T_IC], expectRed: [R_2686] },
	{ n: "p24", name: "the lock judge dropped", edits: [
		one(IC, LOCK_IF, "if (false) {"),
	], tests: [T_IC], expectRed: [R_2686] },
	{ n: "p25", name: "the exit detail gives the status only", edits: [
		one(IC, EXIT_TAIL, ""),
	], tests: [T_IC], expectRed: [R_2687] },
	{ n: "p26", name: "the exit detail always from stderr", edits: [
		one(IC, EXIT_TAIL, '${stderrLine ? `; ${stderrLine}` : ""}'),
	], tests: [T_IC], expectRed: [R_2687] },
	{ n: "p27", name: "the exit detail always from the output file", edits: [
		one(IC, EXIT_TAIL, '${outputLine ? `; ${outputLine}` : ""}'),
	], tests: [T_IC], expectRed: [R_2687] },
	{ n: "p28", name: "--max-secs at the build timeout", edits: [
		one(CFG, 'launcherArgs: ["--lane-size", "small", "--max-secs", "120"]', 'launcherArgs: ["--lane-size", "small", "--max-secs", "180"]'),
	], tests: [T_IC], expectRed: [PIN] },
	{ n: "p28b", name: "the sealed end outcome changed", edits: [
		one(CFG, '  outcome: "ok",', '  outcome: "done",'),
	], tests: [T_IC], expectRed: [PIN] },
	{ n: "p29", name: "the settings edit skipped", edits: [
		one(IC, "    fs.writeFileSync(piSettingsPath, `${JSON.stringify({ ...piSettings, ", "    void (`${JSON.stringify({ ...piSettings, "),
	], tests: [T_IC], expectRed: [R_2683] },
	{ n: "p30", name: "the roster edit skipped", edits: [
		one(IC, "    fs.writeFileSync(packConfigPath, `${JSON.stringify({ ...packConfig, roster: PI_BUILD.roster }", "    void (`${JSON.stringify({ ...packConfig, roster: PI_BUILD.roster }"),
	], tests: [T_IC], expectRed: [R_2683] },
	{ n: "p31", name: "the settings edit writes only extensions, dropping packages", edits: [
		one(IC, "JSON.stringify({ ...piSettings, [PI_BUILD.settings.key]:", "JSON.stringify({ [PI_BUILD.settings.key]:"),
	], tests: [T_IC], expectRed: [R_2684] },
	{ n: "p32", name: "a missing nana-pack.json still launches the build", edits: [
		one(IC, "  } catch {\n    buildSetupError = \"temporary home's roster or pi settings could not be edited\";\n  }", "  } catch {}"),
	], tests: [T_IC], expectRed: [R_2683] },
	{ n: "p33", name: "PI_CODING_AGENT_SESSION_DIR left out of OVERRIDE_ENV", edits: [
		one(CFG, '"PI_CODING_AGENT_DIR", "PI_CODING_AGENT_SESSION_DIR", ', '"PI_CODING_AGENT_DIR", '),
	], tests: [T_IC], expectRed: [PIN_1071] },
	{ n: "p34", name: "the build block before the hook rows", edits: [
		one(IC, BLOCK, ""),
		one(IC, HOOK_ROWS, `${BLOCK}${HOOK_ROWS}`),
	], tests: [T_IC], expectRed: [FILES] },
];

process.exitCode = await runMutations({ lane: "install-check-builder", self: import.meta.url, tip: "96214696", declared: DECLARED, pairs: PAIRS });
