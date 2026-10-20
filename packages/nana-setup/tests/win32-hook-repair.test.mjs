/**
 * @module packages/nana-setup/tests/win32-hook-repair.test.mjs
 * @purpose Pin Windows repair of POSIX installer hook settings while preserving owner look-alikes.
 * @inputs nana-setup CLI, desired hook fixtures, the repository layout, and throwaway homes.
 * @outputs PASS/FAIL lines for the eight repair checks and exit 1 when any check fails.
 * @effects disk (throwaway home layouts), process (spawns install and doctor with forced win32).
 * @errors A failed check prints its observed detail; unexpected setup or filesystem errors propagate.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const { PI_SUBAGENTS_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { repoRoot } = await import(new URL("../lib/paths.mjs", import.meta.url).href);
const { WIN_VERIFIER_MATCHER, desiredHooks } = await import(new URL("../lib/settings.mjs", import.meta.url).href);

let fails = 0;
function check(name, ok, extra) {
	console.log(ok ? "PASS" : "FAIL", name, ok ? "" : extra ?? "");
	if (!ok) fails++;
}

function freshHome() {
	const home = tmpDir(path.join(os.tmpdir(), "nana-win-hook-repair-"));
	fs.mkdirSync(path.join(home, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	const subagents = path.join(home, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagents, { recursive: true });
	fs.writeFileSync(path.join(subagents, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	return home;
}

function run(args, env = {}) {
	const invoke = () => spawnSync(process.execPath, [cli, ...args], {
		encoding: "utf8",
		env: { ...process.env, NANA_SETUP_PLATFORM: "win32", ...env },
	});
	return args[0] === "doctor" ? withPiStub(invoke) : invoke();
}

const sourceHooksDir = "/Users/someone/.claude/hooks";
const sourceRepoRoot = "/Users/someone/nana-pi";
const posixWanted = desiredHooks({ hooksDir: sourceHooksDir, repoRoot: sourceRepoRoot });
const winWanted = desiredHooks({ hooksDir: sourceHooksDir, repoRoot, platform: "win32" });
const byLabel = (wanted, label) => wanted.find((item) => item.label === label);
const clone = (value) => JSON.parse(JSON.stringify(value));
const canonical = (value) => Array.isArray(value)
	? value.map(canonical)
	: value && typeof value === "object"
		? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]))
		: value;
const sortedEqual = (actual, expected) => JSON.stringify(canonical(actual)) === JSON.stringify(canonical(expected));
const byteEqual = (actual, expected) => JSON.stringify(actual) === JSON.stringify(expected);
const settingsPath = (home) => path.join(home, ".claude", "settings.json");
function seed(home, settings) {
	fs.mkdirSync(path.join(home, ".claude"), { recursive: true });
	fs.writeFileSync(settingsPath(home), JSON.stringify(settings, null, 2) + "\n");
}
const regexEscape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const foreignSession = { type: "command", command: "echo session-owner", timeout: 17, statusMessage: "owner session" };
const foreignBeforeVerifier = { type: "command", command: "echo verifier-before", timeout: 10, statusMessage: "owner before" };
const foreignAfterVerifier = { type: "command", command: "echo verifier-after", timeout: 11, statusMessage: "owner after" };
const sessionLabels = ["SessionStart objective", "SessionStart adoption", "SessionStart shared-memory", "SessionStart roster notice"];
const carriedSession = sessionLabels.map((label) => clone(byLabel(posixWanted, label).entry));
const carriedVerifier = clone(byLabel(posixWanted, "PreToolUse verifier pipe").entry);
const carriedKnowledge = clone(byLabel(posixWanted, "UserPromptSubmit knowledge pull").entry);

const f1Home = freshHome();
seed(f1Home, {
	hooks: {
		SessionStart: [{ hooks: [carriedSession[0], foreignSession, carriedSession[1], carriedSession[2], carriedSession[3]] }],
		PreToolUse: [{ matcher: "Bash", hooks: [foreignBeforeVerifier, carriedVerifier, foreignAfterVerifier] }],
		UserPromptSubmit: [{ hooks: [carriedKnowledge] }],
	},
});
const f1Install = run(["install", "--home", f1Home]);
const f1After = JSON.parse(fs.readFileSync(settingsPath(f1Home), "utf8"));
const f1Session = f1After.hooks.SessionStart[0].hooks;
const expectedSessionIndexes = [0, 2, 3, 4];
const f1SessionRepaired = sessionLabels.every((label, index) => sortedEqual(f1Session[expectedSessionIndexes[index]], byLabel(winWanted, label).entry));
// req: R-1880
check("win32 install: carried shell-form SessionStart entries become exec form in place", f1Install.status === 0 && f1SessionRepaired && byteEqual(f1Session[1], foreignSession), `${f1Install.stdout}\n${JSON.stringify(f1After.hooks.SessionStart)}`);

const f1VerifierGroups = f1After.hooks.PreToolUse;
const f1VerifierEntries = f1VerifierGroups.flatMap((group) => group.hooks.filter((entry) => JSON.stringify(entry).includes("verifier-pipe.mjs")).map((entry) => ({ group, entry })));
const f1VerifierExpected = byLabel(winWanted, "PreToolUse verifier pipe").entry;
const f1VerifierOne = f1VerifierEntries.length === 1 && f1VerifierEntries[0].group.matcher === WIN_VERIFIER_MATCHER && f1VerifierEntries[0].group.hooks.indexOf(f1VerifierEntries[0].entry) === 0 && sortedEqual(f1VerifierEntries[0].entry, f1VerifierExpected);
// req: R-1881
check("win32 install: a shell-form verifier under Bash ends as one exec-form verifier under WIN_VERIFIER_MATCHER", f1VerifierOne, JSON.stringify(f1VerifierGroups));

const f2Home = freshHome();
seed(f2Home, { hooks: { PreToolUse: [
	{ matcher: "Bash", hooks: [clone(carriedVerifier)] },
	{ matcher: WIN_VERIFIER_MATCHER, hooks: [clone(f1VerifierExpected)] },
] } });
const f2Install = run(["install", "--home", f2Home]);
const f2After = JSON.parse(fs.readFileSync(settingsPath(f2Home), "utf8"));
const f2VerifierEntries = f2After.hooks.PreToolUse.flatMap((group) => group.hooks.filter((entry) => JSON.stringify(entry).includes("verifier-pipe.mjs")).map((entry) => ({ group, entry })));
const f2VerifierOne = f2Install.status === 0 && f2VerifierEntries.length === 1 && f2VerifierEntries[0].group.matcher === WIN_VERIFIER_MATCHER && sortedEqual(f2VerifierEntries[0].entry, f1VerifierExpected);
// req: R-1881
check("win32 install: a Bash verifier beside a WIN_VERIFIER_MATCHER verifier ends as one", f2VerifierOne, `${f2Install.stdout}\n${JSON.stringify(f2After.hooks.PreToolUse)}`);

const f1Bash = f1After.hooks.PreToolUse.find((group) => group.matcher === "Bash");
const f1BashPreserved = f1Bash?.matcher === "Bash" && byteEqual(f1Bash.hooks, [foreignBeforeVerifier, foreignAfterVerifier]);
// req: R-1882
check("win32 install: the Bash group keeps its matcher and other entries when the verifier moves", f1BashPreserved, JSON.stringify(f1After.hooks.PreToolUse));

const f5Home = freshHome();
const f5OwnerEmpty = { matcher: "Bash", owner: "keep-empty", hooks: [] };
seed(f5Home, { hooks: { PreToolUse: [
	clone(f5OwnerEmpty),
	{ matcher: "Bash", hooks: [clone(carriedVerifier)] },
] } });
const f5Install = run(["install", "--home", f5Home]);
const f5After = JSON.parse(fs.readFileSync(settingsPath(f5Home), "utf8"));
const f5BashGroups = f5After.hooks.PreToolUse.filter((group) => group.matcher === "Bash");
// req: R-1886
check("win32 install: preserves an owner-empty Bash group but drops the group its verifier move empties", f5Install.status === 0 && f5BashGroups.length === 1 && byteEqual(f5BashGroups[0], f5OwnerEmpty), `${f5Install.stdout}\n${JSON.stringify(f5After.hooks.PreToolUse)}`);

const f6Home = freshHome();
seed(f6Home, { hooks: {
	SessionStart: [{ hooks: sessionLabels.map((label) => clone(byLabel(winWanted, label).entry)) }],
	PreToolUse: [
		{ matcher: WIN_VERIFIER_MATCHER, hooks: [clone(f1VerifierExpected)] },
		{ matcher: "Bash", hooks: [clone(carriedVerifier)] },
	],
	UserPromptSubmit: [{ hooks: [clone(byLabel(winWanted, "UserPromptSubmit knowledge pull").entry)] }],
} });
const f6Before = fs.readFileSync(settingsPath(f6Home));
const f6Install = run(["install", "--home", f6Home]);
const f6AfterBytes = fs.readFileSync(settingsPath(f6Home));
const f6After = JSON.parse(f6AfterBytes);
const f6VerifierEntries = f6After.hooks.PreToolUse.flatMap((group) => group.hooks.filter((entry) => JSON.stringify(entry).includes("verifier-pipe.mjs")).map((entry) => ({ group, entry })));
const f6MovedAndWritten = f6Install.status === 0 && !f6AfterBytes.equals(f6Before) && f6VerifierEntries.length === 1 && f6VerifierEntries[0].group.matcher === WIN_VERIFIER_MATCHER && !f6After.hooks.PreToolUse.some((group) => group.matcher === "Bash" && group.hooks.some((entry) => JSON.stringify(entry).includes("verifier-pipe.mjs")));
// req: R-1887
check("win32 install: a move-only verifier repair is written", f6MovedAndWritten, `${f6Install.stdout}\n${JSON.stringify(f6After.hooks.PreToolUse)}`);

const f7Home = freshHome();
const f7OwnerLookalike = { ...clone(f1VerifierExpected), timeout: 10 };
const f7Carried = { ...clone(carriedVerifier), ownerKey: { keep: "this value" } };
seed(f7Home, { hooks: {
	SessionStart: [{ hooks: sessionLabels.map((label) => clone(byLabel(winWanted, label).entry)) }],
	PreToolUse: [
		{ matcher: "Bash", hooks: [clone(f7Carried)] },
		{ matcher: WIN_VERIFIER_MATCHER, hooks: [clone(f7OwnerLookalike)] },
	],
	UserPromptSubmit: [{ hooks: [clone(byLabel(winWanted, "UserPromptSubmit knowledge pull").entry)] }],
} });
const f7Install = run(["install", "--home", f7Home]);
const f7After = JSON.parse(fs.readFileSync(settingsPath(f7Home), "utf8"));
const f7WinGroup = f7After.hooks.PreToolUse.find((group) => group.matcher === WIN_VERIFIER_MATCHER);
const f7ExpectedMoved = { ...f7Carried, command: f1VerifierExpected.command, args: f1VerifierExpected.args };
// req: R-1888
// req: R-1889
check("win32 install: an owner verifier look-alike stays before nana's moved verifier with its extra key", f7Install.status === 0 && f7WinGroup?.hooks.length === 2 && byteEqual(f7WinGroup.hooks[0], f7OwnerLookalike) && byteEqual(f7WinGroup.hooks[1], f7ExpectedMoved), `${f7Install.stdout}\n${JSON.stringify(f7After.hooks.PreToolUse)}`);

const f1Doctor = run(["doctor", "--home", f1Home]);
const f1BeforeSecond = fs.readFileSync(settingsPath(f1Home));
const f1Second = run(["install", "--home", f1Home]);
const f1AfterSecond = fs.readFileSync(settingsPath(f1Home));
const f1SecondLines = f1Second.stdout.split("\n");
const allSixUnchanged = winWanted.every((wanted) => f1SecondLines.some((line) => line.includes(`settings ${wanted.label}`) && line.includes("already wired")));
// req: R-1883
check("win32 install: a second install over the repaired home reports all six settings rows unchanged", f1Second.status === 0 && allSixUnchanged && f1AfterSecond.equals(f1BeforeSecond), f1Second.stdout);

const allSixHealthy = winWanted.every((wanted) => new RegExp(`✓ settings ${regexEscape(wanted.label)}\\b`).test(f1Doctor.stdout));
const f1KnowledgeAtIndex = sortedEqual(f1After.hooks.UserPromptSubmit[0].hooks[0], byLabel(winWanted, "UserPromptSubmit knowledge pull").entry);
// req: R-1884
check("win32 doctor: all six settings rows read ✓ after one install over the carried home", allSixHealthy && f1KnowledgeAtIndex, f1Doctor.stdout);

const f3Home = freshHome();
const f3Foreign = { type: "command", command: "echo knowledge-owner", timeout: 8, statusMessage: "owner knowledge" };
const f3Unquoted = { ...clone(carriedKnowledge), command: `NODE_NO_WARNINGS=1 node ${sourceRepoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts hook` };
seed(f3Home, { hooks: { UserPromptSubmit: [{ hooks: [f3Foreign, f3Unquoted] }] } });
const f3Install = run(["install", "--home", f3Home]);
const f3After = JSON.parse(fs.readFileSync(settingsPath(f3Home), "utf8"));
const f3Entries = f3After.hooks.UserPromptSubmit[0].hooks;
const f3Repaired = f3Install.status === 0 && f3Entries.length === 2 && byteEqual(f3Entries[0], f3Foreign) && sortedEqual(f3Entries[1], byLabel(winWanted, "UserPromptSubmit knowledge pull").entry);
// req: R-1885
check("win32 install: the first installer's unquoted knowledge entry becomes exec form in place", f3Repaired, `${f3Install.stdout}\n${JSON.stringify(f3Entries)}`);

const objective = clone(byLabel(posixWanted, "SessionStart objective").entry);
const f4ObjectiveLookalikes = [
	{ ...clone(objective), timeout: 10 },
	{ ...clone(objective), statusMessage: "nana: another objective" },
	{ ...clone(objective), command: `node \"${sourceHooksDir}/nana-objective.mjs\"` },
	{ ...clone(objective), command: "node '/Users/someone/custom/nana-objective.mjs'" },
];
const f4Verifier = { ...clone(carriedVerifier), timeout: 10 };
const f4Knowledge = { ...clone(carriedKnowledge), command: `NODE_NO_WARNINGS=1 node \"${sourceRepoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts\" hook` };
const f4Home = freshHome();
seed(f4Home, { hooks: {
	SessionStart: [{ hooks: clone(f4ObjectiveLookalikes) }],
	PreToolUse: [{ matcher: "Bash", hooks: [clone(f4Verifier)] }],
	UserPromptSubmit: [{ hooks: [clone(f4Knowledge)] }],
} });
const f4Install = run(["install", "--home", f4Home]);
const f4After = JSON.parse(fs.readFileSync(settingsPath(f4Home), "utf8"));
const f4Preserved = f4Install.status === 0 && byteEqual(f4After.hooks.SessionStart[0].hooks.slice(0, f4ObjectiveLookalikes.length), f4ObjectiveLookalikes) && byteEqual(f4After.hooks.PreToolUse.find((group) => group.matcher === "Bash")?.hooks, [f4Verifier]) && byteEqual(f4After.hooks.UserPromptSubmit[0].hooks, [f4Knowledge]);
// req: R-653
check("win32 install: shell-form look-alikes (timeout, message, quoting, folder) stay byte-identical", f4Preserved, `${f4Install.stdout}\n${JSON.stringify(f4After.hooks)}`);

console.log(`SUMMARY  PASS=${11 - fails} FAIL=${fails} SKIP=0`);
process.exit(fails);
