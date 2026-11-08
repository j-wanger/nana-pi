/**
 * @module packages/nana-setup/tests/win32-hook-repair.test.mjs
 * @purpose Pin Windows repair of POSIX installer hook settings while preserving owner look-alikes.
 * @inputs nana-setup CLI, desired hook fixtures, the repository layout, and throwaway homes.
 * @outputs PASS/FAIL lines for the fourteen repair checks and exit 1 when any check fails.
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
const { hookSettingsRows } = await import(new URL("../lib/hook-health.mjs", import.meta.url).href);
const { repoRoot } = await import(new URL("../lib/paths.mjs", import.meta.url).href);
const { desiredHooks, retiredKnowledgeHook } = await import(new URL("../lib/settings.mjs", import.meta.url).href);

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
	fs.writeFileSync(path.join(subagents, "package.json"), JSON.stringify({ name: "pi-subagents", version: "0.75.0" }));
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
function seedDeepSettings(home, depth, entry) {
	fs.mkdirSync(path.join(home, ".claude"), { recursive: true });
	const nestedValue = '{"next":'.repeat(depth) + '"leaf"' + "}".repeat(depth);
	const entryPrefix = JSON.stringify(entry).slice(0, -1);
	fs.writeFileSync(settingsPath(home), `{"hooks":{"SessionStart":[{"hooks":[${entryPrefix},"owner":${nestedValue}}]}]}}`);
}
const regexEscape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const settingsLine = (output, label) => output.split("\n").find((line) => new RegExp(`[✓✗] settings ${regexEscape(label)}\\s`).test(line));

const foreignSession = { type: "command", command: "echo session-owner", timeout: 17, statusMessage: "owner session" };
const foreignBeforeVerifier = { type: "command", command: "echo verifier-before", timeout: 10, statusMessage: "owner before" };
const foreignAfterVerifier = { type: "command", command: "echo verifier-after", timeout: 11, statusMessage: "owner after" };
const sessionLabels = ["SessionStart objective", "SessionStart adoption", "SessionStart shared-memory", "SessionStart roster notice"];
const carriedSession = sessionLabels.map((label) => clone(byLabel(posixWanted, label).entry));
const carriedVerifier = { type: "command", command: "node '/Users/someone/.claude/hooks/verifier-pipe.mjs'", timeout: 5, statusMessage: "nana: verifier pipe" }; // historical fixture
const WIN_VERIFIER_MATCHER = "Bash|PowerShell"; // historical fixture only
const carriedKnowledge = clone(retiredKnowledgeHook({ repoRoot: sourceRepoRoot }).entry);

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

// Retain the surviving owner-preservation half of the former verifier-move case.
const f7Home = freshHome();
const f7OwnerLookalike = { type: 'command', command: 'node', args: [`${repoRoot}/packages/nana-setup/claude/hooks/verifier-pipe.mjs`], timeout: 10, statusMessage: 'nana: verifier pipe' };
const f7Carried = { ...clone(carriedVerifier), ownerKey: { keep: 'this value' } };
const f7Groups = [{ matcher: 'Bash', hooks: [f7Carried] }, { matcher: WIN_VERIFIER_MATCHER, hooks: [f7OwnerLookalike] }];
seed(f7Home, { hooks: { PreToolUse: clone(f7Groups) } });
const f7Install = run(['install', '--home', f7Home]);
const f7After = JSON.parse(fs.readFileSync(settingsPath(f7Home), 'utf8'));
// req: R-1888 R-1889
check('win32 install: owner verifier look-alikes and their extra keys stay byte-identical', f7Install.status === 0 && byteEqual(f7After.hooks.PreToolUse, f7Groups), f7Install.stdout);

const f1Doctor = run(["doctor", "--home", f1Home]);
const f1BeforeSecond = fs.readFileSync(settingsPath(f1Home));
const f1Second = run(["install", "--home", f1Home]);
const f1AfterSecond = fs.readFileSync(settingsPath(f1Home));
const f1SecondLines = f1Second.stdout.split("\n");
const allSixUnchanged = winWanted.every((wanted) => f1SecondLines.some((line) => line.includes(`settings ${wanted.label}`) && line.includes("already wired")));
// req: R-1883
check("win32 install: a second install over the repaired home reports all four settings rows unchanged", f1Second.status === 0 && allSixUnchanged && f1AfterSecond.equals(f1BeforeSecond), f1Second.stdout);

const allSixHealthy = winWanted.every((wanted) => new RegExp(`✓ settings ${regexEscape(wanted.label)}\\b`).test(f1Doctor.stdout));
const f1KnowledgeAtIndex = f1After.hooks.UserPromptSubmit === undefined;
// req: R-1884
check("win32 doctor: all four settings rows read ✓ after one install over the carried home", allSixHealthy && f1KnowledgeAtIndex, f1Doctor.stdout);

const f3Home = freshHome();
const f3Foreign = { type: "command", command: "echo knowledge-owner", timeout: 8, statusMessage: "owner knowledge" };
const f3Unquoted = { ...clone(carriedKnowledge), command: `NODE_NO_WARNINGS=1 node ${sourceRepoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts hook` };
seed(f3Home, { hooks: { UserPromptSubmit: [{ hooks: [f3Foreign, f3Unquoted] }] } });
const f3Install = run(["install", "--home", f3Home]);
const f3After = JSON.parse(fs.readFileSync(settingsPath(f3Home), "utf8"));
const f3Entries = f3After.hooks.UserPromptSubmit[0].hooks;
const f3Repaired = f3Install.status === 0 && f3Entries.length === 1 && byteEqual(f3Entries[0], f3Foreign);
// req: R-1885
check("win32 install: the first installer's unquoted knowledge entry is retired", f3Repaired, `${f3Install.stdout}\n${JSON.stringify(f3Entries)}`);

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

const adviceDeadRoot = "C:\\Users\\someone/custom";
const adviceDeadPaths = [
	`${adviceDeadRoot}/nana-objective.mjs`,
	`${adviceDeadRoot}/nana-adoption.mjs`,
	`${adviceDeadRoot}/nana-shared-memory.mjs`,
	`${adviceDeadRoot}/nana-roster-notice.mjs`,
	`${adviceDeadRoot}/verifier-pipe.mjs`,
	`${adviceDeadRoot}/nana-knowledge.ts`,
];
const vEntries = sessionLabels.map((label, index) => ({ ...clone(byLabel(winWanted, label).entry), args: [adviceDeadPaths[index]] }));
const vKnowledge = { ...clone(retiredKnowledgeHook({ repoRoot, platform: 'win32' }).entry), args: [adviceDeadPaths[5], "hook"] };
const vHome = freshHome();
seed(vHome, { hooks: {
	SessionStart: [{ hooks: vEntries }],
	UserPromptSubmit: [{ hooks: [vKnowledge] }],
} });
const vInstall = run(["install", "--home", vHome]);
const vDoctor = run(["doctor", "--home", vHome]);
const slashPath = (value) => value.replaceAll("\\", "/");
const installCommand = (wanted) => [wanted.entry.command, ...wanted.entry.args].map(slashPath).join(" ");
const safeRoute = "remove that entry by hand, then run nana-setup install";
const vRowsRepairByHand = winWanted.every((wanted, index) => {
	const line = settingsLine(vDoctor.stdout, wanted.label);
	const editRoute = `to edit instead, run ${installCommand(wanted)}`;
	return line?.trimStart().startsWith("✗ ") && line.includes(slashPath(adviceDeadPaths[index])) && !line.slice(line.indexOf("install leaves")).includes("\\") && line.includes(safeRoute) && line.includes(editRoute) && line.indexOf(safeRoute) < line.indexOf(editRoute);
});
const f4Doctor = run(["doctor", "--home", f4Home]);
const f4ObjectiveLine = settingsLine(f4Doctor.stdout, "SessionStart objective");
const spacedCheckoutRoot = "C:/Users/Jane Doe/nana-pi";
const spacedWanted = desiredHooks({ hooksDir: sourceHooksDir, repoRoot: spacedCheckoutRoot, platform: "win32" });
const spacedDeadPath = "C:/Users/old/custom/nana-objective.mjs";
const spacedSettings = { hooks: { SessionStart: [{ hooks: [{ ...clone(objective), command: `node '${spacedDeadPath}'`, timeout: 10 }] }] } };
const oldPlatform = process.env.NANA_SETUP_PLATFORM;
process.env.NANA_SETUP_PLATFORM = "win32";
let spacedObjectiveLine;
try {
	spacedObjectiveLine = hookSettingsRows({ hooksDir: sourceHooksDir }, spacedSettings, null, { repoRoot: spacedCheckoutRoot })
		.find((row) => row.label === "settings SessionStart objective")?.detail;
} finally {
	if (oldPlatform === undefined) delete process.env.NANA_SETUP_PLATFORM;
	else process.env.NANA_SETUP_PLATFORM = oldPlatform;
}
const spacedTarget = byLabel(spacedWanted, "SessionStart objective").entry.args[0];
const spacedEditRoute = `to edit instead, run node "${spacedTarget}"`;
// req: R-2410
check("win32 doctor: after install, a ✗ settings row names each dead entry install leaves and its hand repair", vInstall.status === 0 && vRowsRepairByHand && f4ObjectiveLine?.trimStart().startsWith("✗ ") && f4ObjectiveLine.includes("/Users/someone/custom/nana-objective.mjs") && f4ObjectiveLine.includes("by hand") && spacedObjectiveLine?.includes(spacedDeadPath) && spacedObjectiveLine.includes(spacedEditRoute) && !spacedObjectiveLine.includes(`run node ${spacedTarget}`), `${vInstall.stdout}\n${vDoctor.stdout}\n${f4Doctor.stdout}\n--- spaced checkout ---\n${spacedObjectiveLine}`);

const guardHome = freshHome();
const guardObjectivePath = "C:/Users/other/custom/nana-objective.mjs";
const guardObjectiveLookalike = { ...clone(carriedSession[0]), command: `node '${guardObjectivePath}'`, timeout: 10 };
seed(guardHome, { hooks: {
	SessionStart: [{ hooks: [...clone(carriedSession), guardObjectiveLookalike] }],
	PreToolUse: [{ matcher: "Bash", hooks: [clone(carriedVerifier)] }],
	UserPromptSubmit: [{ hooks: [clone(carriedKnowledge)] }],
} });
const guardDoctor = run(["doctor", "--home", guardHome]);
const guardLines = winWanted.filter(wanted => wanted.event !== 'SessionEnd').map((wanted) => settingsLine(guardDoctor.stdout, wanted.label));
const guardInstallerPaths = [
	...sessionLabels.map((label) => `${sourceHooksDir}/${byLabel(posixWanted, label).spec.script}`),
	`${sourceHooksDir}/verifier-pipe.mjs`,
	`${sourceRepoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts`,
];
// req: R-2411
check("win32 doctor: a ✗ settings row names an entry install leaves but never one install repairs", guardLines.every((line, index) => line?.trimStart().startsWith("✗ ") && !line.includes(guardInstallerPaths[index])) && guardLines[0].includes(guardObjectivePath) && guardLines[0].includes(safeRoute) && guardLines.slice(1).every((line) => !line.includes("by hand")), guardDoctor.stdout);

const shapeDeadPath = "C:/Users/someone/refused/nana-objective.mjs";
const shapeDeadEntry = { ...clone(carriedSession[0]), command: `node '${shapeDeadPath}'`, timeout: 10 };
const acceptedHome = freshHome();
seed(acceptedHome, { hooks: { SessionStart: [{ hooks: [clone(shapeDeadEntry)] }] } });
const acceptedDoctor = run(["doctor", "--home", acceptedHome]);
const acceptedLines = winWanted.map((wanted) => settingsLine(acceptedDoctor.stdout, wanted.label));
const refusedHome = freshHome();
seed(refusedHome, { hooks: {
	SessionStart: [{ hooks: [clone(shapeDeadEntry)] }],
	UserPromptSubmit: "not a list",
} });
const refusedDoctor = run(["doctor", "--home", refusedHome]);
const refusedLines = winWanted.map((wanted) => settingsLine(refusedDoctor.stdout, wanted.label));
const nestedHome = freshHome();
seedDeepSettings(nestedHome, 3_000, shapeDeadEntry);
const nestedDoctor = run(["doctor", "--home", nestedHome]);
const nestedLines = winWanted.map((wanted) => settingsLine(nestedDoctor.stdout, wanted.label));
const noInspectionCrash = (result) => result.status === 1 && !result.stderr.includes("TypeError") && !result.stderr.includes("RangeError");
// req: R-2412
check("win32 doctor: only an accepted settings shape gets dead-entry advice without inspection crashes", acceptedLines.every((line) => line?.trimStart().startsWith("✗ ")) && acceptedLines[0].includes(shapeDeadPath) && acceptedLines[0].includes(safeRoute) && refusedLines.every((line) => line?.trimStart().startsWith("✗ ") && !line.includes(safeRoute)) && nestedLines.every((line) => line?.trimStart().startsWith("✗ ") && !line.includes(safeRoute)) && !refusedLines[0].includes(shapeDeadPath) && !nestedLines[0].includes(shapeDeadPath) && [acceptedDoctor, refusedDoctor, nestedDoctor].every(noInspectionCrash), `${acceptedDoctor.stdout}\n${acceptedDoctor.stderr}\n--- refused shape ---\n${refusedDoctor.stdout}\n${refusedDoctor.stderr}\n--- deeply nested ---\n${nestedDoctor.stdout}\n${nestedDoctor.stderr}`);

console.log(`SUMMARY  PASS=${9 - fails} FAIL=${fails} SKIP=0`);
process.exit(fails);
