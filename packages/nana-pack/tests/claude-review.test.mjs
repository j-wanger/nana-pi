/**
 * @module packages/nana-pack/tests/claude-review.test.mjs
 * @purpose Pin the Claude Code review launcher from roster selection through prompt assembly, ledger admission, platform launch and exit pass-through.
 * @inputs bin/claude-review.mjs, prompts/review-standard.md, temporary git trees, temporary HOME rosters, and fake claude commands on PATH.
 * @outputs named PASS/FAIL checks, with one Windows-only skip off win32.
 * @effects disk (temporary homes, repositories, pack copies, outputs and fake-command records), process (spawns launchers, git and fake Claude Code commands).
 * @errors failed checks or timed-out launcher cases exit nonzero; unexpected setup errors throw.
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PACK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CLAUDE_REVIEW = path.join(PACK, "bin", "claude-review.mjs");
const LEDGER = path.join(PACK, "bin", "review-ledger.mjs");
const STANDARD = path.join(PACK, "prompts", "review-standard.md");
const CASE_TIMEOUT_MS = 30_000;
const temp = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "claude-review-test-")));
let fails = 0;
const check = (name, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail);
	if (!ok) fails++;
};
const git = (cwd, ...args) => spawnSync("git", ["-c", "user.name=test", "-c", "user.email=test@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8", timeout: CASE_TIMEOUT_MS });
const makeRepo = (name) => {
	const repo = path.join(temp, name);
	fs.mkdirSync(repo, { recursive: true });
	for (const args of [["init", "-q", "-b", "main"], ["config", "core.autocrlf", "false"]]) {
		const r = git(repo, ...args);
		if (r.status !== 0) throw new Error(r.stderr);
	}
	fs.writeFileSync(path.join(repo, "seed.txt"), "seed\n");
	if (git(repo, "add", "seed.txt").status !== 0 || git(repo, "commit", "-qm", "seed").status !== 0) throw new Error("cannot seed repository");
	return repo;
};
const piEntry = (model = "gpt-5.6-sol") => ({ provider: "openai-codex", model, thinking: null });
const claudeEntry = (model) => ({ runtime: "claude-code", model });
const roster = (reviewer = claudeEntry("fable")) => ({
	scout: null,
	builder: { provider: "openai-codex", model: "gpt-6-luna", thinking: "high" },
	largerBuilder: claudeEntry("sonnet"),
	reviewer,
	land: null,
});
let homeCount = 0;
const makeHome = (label, rosterValue = roster()) => {
	const home = path.join(temp, `home-${++homeCount}-${label}`);
	const agent = path.join(home, ".pi", "agent");
	fs.mkdirSync(agent, { recursive: true });
	fs.writeFileSync(path.join(agent, "nana-pack.json"), JSON.stringify({ roster: rosterValue }));
	return { home, agent };
};
const rows = (file) => {
	try { return fs.readFileSync(file, "utf8").split(/\r?\n/).filter(Boolean).map(JSON.parse); }
	catch { return []; }
};
const ledgerState = (home, item) => ({
	rounds: rows(path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl")).filter((row) => row.kind === "round" && row.item === item),
	reservations: (() => { try { return fs.readdirSync(path.join(home, ".pi", "agent", "review-ledger.reservations")); } catch { return []; } })(),
});
const writeFakeClaude = (dir, record) => {
	fs.mkdirSync(dir, { recursive: true });
	const script = path.join(dir, "fake-claude.cjs");
	fs.writeFileSync(script, `const fs = require("node:fs");
let stdin = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => { stdin += chunk; });
process.stdin.on("end", () => {
  if (process.env.CLAUDE_RECORD) fs.appendFileSync(process.env.CLAUDE_RECORD, JSON.stringify({ argv: process.argv.slice(2), cwd: process.cwd(), role: process.env.NANA_ROLE, handoff: process.env.NANA_HANDOFF, stdin }) + "\\n");
  process.stdout.write(process.env.CLAUDE_ANSWER ?? "Review complete.\\nVERDICT: LAND\\n");
  process.exit(Number(process.env.CLAUDE_EXIT ?? "0"));
});
`);
	if (process.platform === "win32") {
		fs.writeFileSync(path.join(dir, "claude.cmd"), `@echo off\r\n"${process.execPath}" "${script}" %*\r\n`);
	} else {
		fs.writeFileSync(path.join(dir, "claude"), `#!${process.execPath}\nrequire(${JSON.stringify(script)});\n`);
		fs.chmodSync(path.join(dir, "claude"), 0o755);
	}
	return record;
};
const baseEnv = ({ home, agent }, bin, record, extra = {}) => ({
	...process.env,
	HOME: home,
	USERPROFILE: home,
	PI_CODING_AGENT_DIR: agent,
	PATH: `${bin}${path.delimiter}${process.env.PATH ?? ""}`,
	CLAUDE_RECORD: record,
	...extra,
});
const runLauncher = ({ launcher = CLAUDE_REVIEW, cwd, tree, brief = "brief.md", out, item, env, extra = [] }) => spawnSync(process.execPath, [launcher, "--item", item, ...(tree === null ? [] : ["--tree", tree]), "--brief", brief, "--out", out, ...extra], {
	cwd,
	env,
	encoding: "utf8",
	timeout: CASE_TIMEOUT_MS,
});
const commitChange = (repo, text) => {
	fs.writeFileSync(path.join(repo, "state.txt"), text);
	const add = git(repo, "add", "state.txt");
	const commit = git(repo, "commit", "-qm", text.trim());
	if (add.status !== 0 || commit.status !== 0) throw new Error(`${add.stderr}\n${commit.stderr}`);
};
const noStack = (text) => !/\n\s+at .+:\d+:\d+/.test(text ?? "");

{
	const item = "claude-main";
	const repo = makeRepo("main-tree");
	const outside = path.join(temp, "outside-main");
	fs.mkdirSync(outside);
	const brief = path.join(repo, "brief.md");
	fs.writeFileSync(brief, "Review the named revision.\n");
	const home = makeHome("main");
	const fakeBin = path.join(temp, "fake-main");
	const record = writeFakeClaude(fakeBin, path.join(temp, "main-record.jsonl"));
	const out = path.join(temp, "main-out.md");
	const answer = "Looks correct.\nVERDICT: LAND\n";
	const result = runLauncher({ cwd: outside, tree: repo, out, item, env: baseEnv(home, fakeBin, record, { CLAUDE_ANSWER: answer }), extra: ["--role", "final"] });
	const calls = rows(record);
	const state = ledgerState(home.home, item);
	// req: R-2560
	check("R-2560: claude-review starts the roster's Claude Code reviewer and records its round",
		result.status === 0 && calls.length === 1 &&
		JSON.stringify(calls[0].argv) === JSON.stringify(["-p", "--model", "fable", "--allowedTools", "Read,Grep,Glob,Bash", "--disallowedTools", "Edit,Write,NotebookEdit"]) &&
		calls[0].role === "reviewer" && calls[0].handoff === "off" && fs.realpathSync(calls[0].cwd) === fs.realpathSync(repo) &&
		fs.readFileSync(out, "utf8") === answer && state.rounds.length === 1 && state.rounds[0].model === "fable" && state.rounds[0].role === "final",
		JSON.stringify({ result, calls, state }));
}

{
	const item = "claude-prompt";
	const repo = makeRepo("prompt-tree");
	const briefRelative = `brief folder/review \"quote\" and apostrophe's.md`;
	const brief = path.join(repo, briefRelative);
	fs.mkdirSync(path.dirname(brief), { recursive: true });
	const briefText = "Brief first.\r\nKeep trailing space. \n";
	fs.writeFileSync(brief, briefText);
	const home = makeHome("prompt");
	const fakeBin = path.join(temp, "fake-prompt");
	const record = writeFakeClaude(fakeBin, path.join(temp, "prompt-record.jsonl"));
	const out = path.join(temp, "prompt-out.md");
	const result = runLauncher({ cwd: temp, tree: repo, brief: briefRelative, out, item, env: baseEnv(home, fakeBin, record) });
	const prompt = rows(record)[0]?.stdin ?? "";
	const standardText = fs.readFileSync(STANDARD, "utf8");
	const heading = "## Review standard";
	const sentence = `Review item ${item} in ${path.resolve(repo)}. Work read-only: do not edit files. The last line of your answer must be exactly VERDICT: LAND or VERDICT: SEND-BACK, with no Markdown formatting; write no other verdict line.`;
	const expected = `${briefText}\n\n${heading}\n\n${standardText}\n\n${sentence}\n`;
	const standardCount = prompt.split(standardText).length - 1;
	// req: R-2561
	check("R-2561: claude-review sends the brief, the review standard once, then the reviewer sentence",
		result.status === 0 && prompt === expected && standardCount === 1 && prompt.indexOf(briefText) === 0 && prompt.indexOf(standardText) > prompt.indexOf(briefText) &&
		prompt.endsWith(`${sentence}\n`) && sentence.includes("read-only: do not edit files") && sentence.includes("exactly VERDICT: LAND or VERDICT: SEND-BACK") && sentence.includes("write no other verdict line"),
		JSON.stringify({ status: result.status, stderr: result.stderr, prompt, expected, standardCount }));
}

{
	const item = "claude-refused";
	const repo = makeRepo("refused-tree");
	fs.writeFileSync(path.join(repo, "brief.md"), "Review.\n");
	const fakeBin = path.join(temp, "fake-refused");
	const record = writeFakeClaude(fakeBin, path.join(temp, "refused-record.jsonl"));
	const piHome = makeHome("pi-reviewer", roster(piEntry()));
	const piResult = runLauncher({ cwd: temp, tree: repo, out: path.join(temp, "pi-refused-out.md"), item, env: baseEnv(piHome, fakeBin, record) });
	const badHome = makeHome("bad-roster");
	const badFile = path.join(badHome.agent, "nana-pack.json");
	fs.writeFileSync(badFile, "{\"roster\": ");
	const badResult = runLauncher({ cwd: temp, tree: repo, out: path.join(temp, "bad-refused-out.md"), item, env: baseEnv(badHome, fakeBin, record) });
	const piState = ledgerState(piHome.home, item);
	const badState = ledgerState(badHome.home, item);
	// req: R-2562
	check("R-2562: a pi reviewer in the roster is refused before admission",
		piResult.status === 1 && /roster\.reviewer/.test(piResult.stderr) && /pi-review/.test(piResult.stderr) && /nana-roster set reviewer claude-code/.test(piResult.stderr) &&
		badResult.status === 1 && badResult.stderr.includes(badFile) && noStack(badResult.stderr) && !fs.existsSync(record) &&
		piState.rounds.length === 0 && piState.reservations.length === 0 && badState.rounds.length === 0 && badState.reservations.length === 0,
		JSON.stringify({ piResult, badResult, piState, badState }));
}

{
	const title = "R-2564: Windows: claude-review starts a claude.cmd shim with a multi-line quoted brief on stdin and records a round";
	if (process.platform !== "win32") console.log(`SKIP ${title} — Windows leg only`);
	else {
		const item = "claude-windows";
		const repo = makeRepo("windows-tree");
		const briefText = "Quoted \"text\" with 100% and bang!\r\nUnicode · —\r\ntrailing tab\t";
		fs.writeFileSync(path.join(repo, "brief.md"), briefText);
		const home = makeHome("windows");
		const fakeBin = path.join(temp, "fake-windows");
		const record = writeFakeClaude(fakeBin, path.join(temp, "windows-record.jsonl"));
		const result = runLauncher({ cwd: temp, tree: repo, out: path.join(temp, "windows-out.md"), item, env: baseEnv(home, fakeBin, record) });
		const calls = rows(record);
		const state = ledgerState(home.home, item);
		// req: R-2564
		check("R-2564: Windows: claude-review starts a claude.cmd shim with a multi-line quoted brief on stdin and records a round", result.status === 0 && calls.length === 1 && calls[0].stdin.startsWith(briefText) && calls[0].stdin.includes("\r\n") && calls[0].stdin.includes("· —") && state.rounds.length === 1, JSON.stringify({ result, calls, state }));
	}
}

{
	const repo = makeRepo("outcome-tree");
	fs.writeFileSync(path.join(repo, "brief.md"), "Review outcome.\n");
	const fakeBin = path.join(temp, "fake-outcome");
	const record = writeFakeClaude(fakeBin, path.join(temp, "outcome-record.jsonl"));
	const noClaudeHome = makeHome("no-claude");
	const pathWithoutClaude = (process.env.PATH ?? "").split(path.delimiter).filter((dir) => {
		if (!dir) return false;
		const names = process.platform === "win32" ? ["claude.exe", "claude.com", "claude.cmd", "claude.bat"] : ["claude"];
		return !names.some((name) => fs.existsSync(path.join(dir, name)));
	}).join(path.delimiter);
	const missingOut = path.join(temp, "missing-claude-out.md");
	const missing = runLauncher({ cwd: temp, tree: repo, out: missingOut, item: "outcome-missing", env: { ...baseEnv(noClaudeHome, fakeBin, record), PATH: pathWithoutClaude } });

	const formattedHome = makeHome("formatted");
	const formattedOut = path.join(temp, "formatted-out.md");
	const formattedAnswer = "Review body.\n[VERDICT: LAND]\n";
	const formatted = runLauncher({ cwd: temp, tree: repo, out: formattedOut, item: "outcome-formatted", env: baseEnv(formattedHome, fakeBin, record, { CLAUDE_ANSWER: formattedAnswer }) });

	const plainHome = makeHome("plain");
	const plainOut = path.join(temp, "plain-out.md");
	const plainAnswer = "Review body.\nVERDICT: LAND\n";
	const plain = runLauncher({ cwd: temp, tree: repo, out: plainOut, item: "outcome-plain", env: baseEnv(plainHome, fakeBin, record, { CLAUDE_ANSWER: plainAnswer }) });

	const refusedHome = makeHome("large-refusal");
	const trackedOut = path.join(repo, "tracked-out.md");
	fs.writeFileSync(trackedOut, "original\n");
	git(repo, "add", "tracked-out.md");
	git(repo, "commit", "-qm", "track output");
	fs.writeFileSync(path.join(repo, "large.md"), "x".repeat(256 * 1024));
	const large = runLauncher({ cwd: temp, tree: repo, brief: "large.md", out: trackedOut, item: "outcome-large", env: baseEnv(refusedHome, fakeBin, record) });

	const missingText = fs.existsSync(missingOut) ? fs.readFileSync(missingOut, "utf8") : "";
	// req: R-2565
	check("R-2565: claude-review passes review-ledger's outcome through",
		missing.status === 1 && /review-ledger: cannot start claude:/.test(missing.stderr) && missingText.startsWith("cannot start claude:") && ledgerState(noClaudeHome.home, "outcome-missing").rounds.length === 0 &&
		formatted.status === 1 && /verdict unread/i.test(formatted.stderr) && fs.readFileSync(formattedOut, "utf8") === formattedAnswer &&
		plain.status === 0 && fs.readFileSync(plainOut, "utf8") === plainAnswer &&
		large.status === 1 && fs.readFileSync(trackedOut, "utf8") === "original\n" && !/EPIPE|write after end/i.test(large.stderr) && noStack(large.stderr),
		JSON.stringify({ missing, missingText, formatted, plain, large }));
}

{
	const item = "claude-over-cap";
	const repo = makeRepo("over-cap-tree");
	fs.writeFileSync(path.join(repo, "brief.md"), "Review cap.\n");
	const home = makeHome("over-cap");
	const fakeBin = path.join(temp, "fake-over-cap");
	const record = writeFakeClaude(fakeBin, path.join(temp, "over-cap-record.jsonl"));
	const env = baseEnv(home, fakeBin, record);
	const seeded = [];
	for (let i = 1; i <= 3; i++) {
		commitChange(repo, `state ${i}\n`);
		seeded.push(runLauncher({ cwd: temp, tree: repo, out: path.join(temp, `cap-${i}.md`), item, env }));
	}
	commitChange(repo, "state 4\n");
	const refused = runLauncher({ cwd: temp, tree: repo, out: path.join(temp, "cap-refused.md"), item, env });
	const reason = "confirmation round on the final tip after fixes to named findings or a merge of current main";
	const admitted = runLauncher({ cwd: temp, tree: repo, out: path.join(temp, "cap-admitted.md"), item, env, extra: ["--over-cap", reason] });
	const state = ledgerState(home.home, item);
	// req: R-2566
	check("R-2566: --over-cap reaches the ledger",
		seeded.every((result) => result.status === 0) && refused.status === 1 && /over the cap/.test(refused.stderr) && admitted.status === 0 && state.rounds.length === 4 && state.rounds.at(-1)?.overCap === reason,
		JSON.stringify({ seeded, refused, admitted, state }));
}

{
	const item = "claude-inputs";
	const repo = makeRepo("inputs-tree");
	fs.writeFileSync(path.join(repo, "good.md"), "Review input.\n");
	fs.mkdirSync(path.join(repo, "brief-dir"));
	fs.writeFileSync(path.join(repo, "blank.md"), " \r\n\t");
	const fakeBin = path.join(temp, "fake-inputs");
	const record = writeFakeClaude(fakeBin, path.join(temp, "inputs-record.jsonl"));
	const cases = [];
	const runInputCase = (label, { launcher = CLAUDE_REVIEW, tree = repo, brief = "good.md", standardMutation } = {}) => {
		const home = makeHome(`input-${label}`);
		let actualLauncher = launcher;
		if (standardMutation) {
			const copy = path.join(temp, `pack-copy-${label}`);
			for (const dir of ["bin", "lib", "prompts"]) fs.cpSync(path.join(PACK, dir), path.join(copy, dir), { recursive: true });
			standardMutation(path.join(copy, "prompts", "review-standard.md"));
			actualLauncher = path.join(copy, "bin", "claude-review.mjs");
		}
		const result = runLauncher({ launcher: actualLauncher, cwd: temp, tree, brief, out: path.join(temp, `input-${label}.md`), item, env: baseEnv(home, fakeBin, record) });
		const state = ledgerState(home.home, item);
		cases.push({ label, result, state });
		return { result, state };
	};
	const missingTree = runInputCase("missing-tree", { tree: null });
	const missingBrief = runInputCase("missing-brief", { brief: "missing.md" });
	const directoryBrief = runInputCase("directory-brief", { brief: "brief-dir" });
	const blankBrief = runInputCase("blank-brief", { brief: "blank.md" });
	const missingStandard = runInputCase("missing-standard", { standardMutation: (file) => fs.rmSync(file) });
	const directoryStandard = runInputCase("directory-standard", { standardMutation: (file) => { fs.rmSync(file); fs.mkdirSync(file); } });
	const blankStandard = runInputCase("blank-standard", { standardMutation: (file) => fs.writeFileSync(file, " \r\n\t") });
	const allRefused = cases.every(({ result, state }) => result.status === 1 && noStack(result.stderr) && state.rounds.length === 0 && state.reservations.length === 0);
	// req: R-2567
	check("R-2567: a missing, directory or blank brief or standard is refused before admission",
		allRefused && /--tree/.test(missingTree.result.stderr) && /missing\.md/.test(missingBrief.result.stderr) && /brief-dir/.test(directoryBrief.result.stderr) && /blank\.md/.test(blankBrief.result.stderr) &&
		[missingStandard, directoryStandard, blankStandard].every(({ result }) => /review-standard\.md/.test(result.stderr)) && !fs.existsSync(record),
		JSON.stringify(cases));
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
