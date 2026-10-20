/**
 * @module packages/nana-setup/tests/win32-degrade.test.mjs
 * @purpose Pins that on Windows every posix-only install step SAYS it skipped instead of failing, driven through the platform seam rather than by patching process.platform
 * @inputs bin/nana-setup.mjs with NANA_SETUP_PLATFORM set to win32, lib/paths.mjs, and throwaway --home directories
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (throwaway home layouts and copied rule files), process (sets NANA_SETUP_PLATFORM, spawns the installer CLI)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: on Windows every posix-only step SAYS it skipped instead of failing. The repo rule is
// cross-platform or degrade gracefully — an installer that throws on win32 is the failure mode.
// NANA_SETUP_PLATFORM is the seam (lib/paths.mjs); process.platform is never monkey-patched, so
// sibling packages and the node runtime behave normally.
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const { PI_SUBAGENTS_FLOOR } = await import(new URL("../lib/doctor.mjs", import.meta.url).href);
const { CLAUDE_CODE_EXEC_FLOOR, WIN_VERIFIER_MATCHER, desiredHooks, shq } = await import(new URL("../lib/settings.mjs", import.meta.url).href);
const { PI_REVIEW_BIN, PI_WORKER_BIN, NANA_LAND_BIN, NANA_SETUP_BIN } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { renderWinShims } = await import(new URL("../lib/win-shims.mjs", import.meta.url).href);
const { findGitBash } = await import(new URL("../lib/install-check.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const tmps = [];
function freshHome() {
	const td = tmpDir(path.join(os.tmpdir(), "nana-setup-win-"));
	tmps.push(td);
	fs.mkdirSync(path.join(td, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(td, ".pi", "agent", "nana-knowledge", "sources.json"), JSON.stringify({ roots: [] }));
	// doctor's pi-subagents version check (R-364) reads a vendor package nana-setup never
	// installs — seed it at the floor so this fixture reads as an already-set-up machine.
	const subagentsDir = path.join(td, ".pi", "agent", "npm", "node_modules", "pi-subagents");
	fs.mkdirSync(subagentsDir, { recursive: true });
	fs.writeFileSync(path.join(subagentsDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	return td;
}
const run = (args, env = {}, cwd = process.cwd()) => {
	const invoke = () => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", env: { ...process.env, ...env } });
	return args[0] === "doctor" ? withPiStub(invoke) : invoke();
};

const home = freshHome();
const binDir = path.join(home, ".local", "bin");
fs.mkdirSync(binDir, { recursive: true });
const handWritten = path.join(binDir, "pi-worker.cmd");
fs.writeFileSync(handWritten, "@echo hand-written\r\n");
const r = run(["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
check("win32 install exits 0", r.status === 0, r.stderr);

const lines = r.stdout.split("\n");
const line = (label) => lines.find((l) => l.includes(label)) ?? "";
const pathBins = new Map([
	["pi-review", PI_REVIEW_BIN],
	["pi-worker", PI_WORKER_BIN],
	["nana-land", NANA_LAND_BIN],
	["nana-setup", NANA_SETUP_BIN],
]);
const expectedShimFiles = [...pathBins].flatMap(([name, source]) => {
	const rendered = renderWinShims(source, binDir);
	return [[path.join(binDir, name), rendered.sh], [path.join(binDir, `${name}.cmd`), rendered.cmd]];
});
const shimFileState = (file) => {
	try { return { file, bytes: fs.readFileSync(file), mtimeMs: fs.statSync(file).mtimeMs }; }
	catch { return null; }
};
const firstShimState = expectedShimFiles.map(([file]) => shimFileState(file));
const secondPathInstall = run(["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
const allHelp = [...pathBins.keys()].every((name) => {
	const shim = path.join(binDir, name);
	const shExecutable = process.platform === "win32"
		? findGitBash(String(process.env.Path ?? process.env.PATH ?? "").split(";"))
		: "/bin/sh";
	if (!shExecutable) return false;
	const shRun = spawnSync(shExecutable, [shim, "--help"], { encoding: "utf8", timeout: 30_000 });
	if (!/(?:usage|nana-setup —)/i.test(`${shRun.stdout}${shRun.stderr}`)) return false;
	if (process.platform !== "win32") return true;
	const cmdRun = spawnSync(process.env.ComSpec ?? "cmd.exe", ["/d", "/s", "/c", `""${shim}.cmd" "--help""`], { encoding: "utf8", windowsVerbatimArguments: true, timeout: 30_000 });
	return /(?:usage|nana-setup —)/i.test(`${cmdRun.stdout}${cmdRun.stderr}`);
});
const backup = fs.readdirSync(binDir).find((name) => /^pi-worker\.cmd\.bak-\d{8}(?:-\d+)?$/.test(name));
const exactAndUnchanged = expectedShimFiles.every(([file, bytes]) => shimFileState(file)?.bytes.equals(Buffer.from(bytes))) && firstShimState.every((before) => {
	if (!before) return false;
	const after = shimFileState(before.file);
	return after?.bytes.equals(before.bytes) && after.mtimeMs === before.mtimeMs;
});
// req: R-1610
check("win32 install leaves an sh and a .cmd shim for each PATH command, rewriting only what differs and backing up a hand-written file", expectedShimFiles.length === 8 && exactAndUnchanged && allHelp && secondPathInstall.status === 0 && [...pathBins.keys()].every((name) => /unchanged/.test(secondPathInstall.stdout.split("\n").find((row) => row.includes(`PATH ${name}`)) ?? "")) && backup && fs.readFileSync(path.join(binDir, backup), "utf8") === "@echo hand-written\r\n", secondPathInstall.stdout);
// R-1051: the five Node hook settings entries are wired on win32 now, in exec form — not skipped.
for (const label of ["settings SessionStart objective", "settings SessionStart adoption", "settings SessionStart shared-memory", "settings SessionStart roster notice"]) {
	check(`win32: ${label} is created, not skipped`, line(label).includes("created"), line(label));
}
check("win32: no hooks directory is created", !fs.existsSync(path.join(home, ".claude", "hooks")));
check("win32: no launchd plist", !fs.existsSync(path.join(home, "Library", "LaunchAgents", "com.nana.pi-desk.plist")));

/* the pieces that DO work on Windows still run */
const soul = path.join(home, ".claude", "rules", "nana-soul.md");
// req: R-350
check("win32: nana-soul.md is installed as a copy", fs.lstatSync(soul).isFile() && !fs.lstatSync(soul).isSymbolicLink());
// req: R-350
check("win32: the copy matches the repo file", fs.readFileSync(soul, "utf8") === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-soul.md"), "utf8"));
const seat = path.join(home, ".claude", "rules", "nana-seat.md");
const seatLstat = (() => { try { return fs.lstatSync(seat); } catch { return null; } })();
const seatMatches = (() => { try { return fs.readFileSync(seat, "utf8") === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-seat.md"), "utf8"); } catch { return false; } })();
// req: R-350
check("win32: nana-seat.md is installed as a copy matching the repo file", Boolean(seatLstat?.isFile()) && !seatLstat?.isSymbolicLink() && seatMatches);
check("win32: the private rule is still seeded", fs.existsSync(path.join(home, ".claude", "rules", "nana-personal.md")));
check("win32: the pi config is still seeded", fs.existsSync(path.join(home, ".pi", "agent", "nana-pack.json")));
check("win32: the knowledge index is still built", fs.existsSync(path.join(home, ".pi", "agent", "nana-knowledge", "index.db")));
const settings = JSON.parse(fs.readFileSync(path.join(home, ".claude", "settings.json"), "utf8"));
const cmds = settings.hooks.UserPromptSubmit.flatMap((g) => g.hooks.map((h) => h.command));
// final review r1 astra SHOULD 7: all five hooks are now wired on win32 — this check only ever
// examined UserPromptSubmit, which still carries exactly the one knowledge entry (no twin); the
// title used to claim the opposite ("only the knowledge hook is wired") from when the other four
// were skipped there. Renamed; see test-title-map.json.
// req: R-1051
check("win32: UserPromptSubmit carries exactly the one knowledge entry, no twin", cmds.length === 1 && JSON.stringify(settings.hooks.UserPromptSubmit).includes("nana-knowledge.ts"));
// req: R-1050
check("win32: no bash hooks in settings", !JSON.stringify(settings).includes("bash "));
// R-985, R-1053: the verifier-pipe hook IS wired on win32 now, matcher Bash|PowerShell.
const allEntries = Object.values(settings.hooks).flatMap((groups) => groups.flatMap((g) => g.hooks.map((h) => ({ group: g, hook: h }))));
const win32Wanted = desiredHooks({ hooksDir: path.join(home, ".claude", "hooks"), repoRoot: repo, platform: "win32" });
const hookScriptNames = win32Wanted.filter((w) => fs.existsSync(path.join(pkg, "claude", "hooks", w.spec.script))).map((w) => w.spec.script);
const printedLabels = (output) => output.split("\n").flatMap((row) => row.match(/^\s*\S\s(.+?)\s{2,}/)?.[1] ?? []);
const printsNoHookFileRows = (output) => {
	const labels = printedLabels(output);
	return hookScriptNames.length === 5 && hookScriptNames.every((script) => labels.every((label) => !label.includes(script))) && win32Wanted.every((w) => labels.includes(`settings ${w.label}`));
};
// req: R-1860
check("win32 install prints no row labelled with a Claude Code hook script", printsNoHookFileRows(r.stdout), r.stdout);
for (const w of win32Wanted) {
	const found = allEntries.filter(({ hook }) => JSON.stringify(hook).includes(w.marker.replace(" hook", "")));
	// req: R-1050
	check(`win32: exactly one ${w.label} entry, exec form (command "node", args array, no shell key)`, found.length === 1 && found[0].hook.command === "node" && Array.isArray(found[0].hook.args) && !("shell" in found[0].hook), JSON.stringify(found));
	// req: R-1051
	check(`win32: ${w.label} args[0] is absolute, exists, and ends with the entry's script`, path.isAbsolute(found[0]?.hook.args?.[0] ?? "") && fs.existsSync(found[0]?.hook.args?.[0] ?? "") && (found[0]?.hook.args?.[0] ?? "").endsWith(w.spec.script));
}
// req: R-1053
check("win32: the verifier group's matcher is Bash-or-PowerShell", allEntries.find(({ hook }) => JSON.stringify(hook).includes("verifier-pipe.mjs"))?.group?.matcher === WIN_VERIFIER_MATCHER);
check("WIN_VERIFIER_MATCHER is Bash-or-PowerShell", WIN_VERIFIER_MATCHER === "Bash|PowerShell");

/* doctor agrees, and does not fail on what the platform cannot have */
const doctorCwd = tmpDir(path.join(os.tmpdir(), "nana-setup-doctor-cwd-"));
tmps.push(doctorCwd);
const doc = run(["doctor", "--home", home], { NANA_SETUP_PLATFORM: "win32" }, doctorCwd);
// req: R-937
check("win32 doctor exits 0", doc.status === 0, doc.stdout);
// req: R-937
check("win32 doctor prints no ✗", !doc.stdout.includes("✗"));
// req: R-1861
check("win32 doctor prints no row labelled with a Claude Code hook script", printsNoHookFileRows(doc.stdout), doc.stdout);
// req: R-937
check("win32 doctor marks the desk service as skipped", /desk service\s+skipped \(win32\)/.test(doc.stdout));
const healthyPathRows = [...pathBins.keys()].every((name) => new RegExp(`✓ PATH ${name}\\b`).test(doc.stdout));
const nanaLandCmd = path.join(binDir, "nana-land.cmd");
const nanaLandCmdPresent = fs.existsSync(nanaLandCmd);
if (nanaLandCmdPresent) fs.unlinkSync(nanaLandCmd);
const missingLand = run(["doctor", "--home", home], { NANA_SETUP_PLATFORM: "win32" }, doctorCwd);
run(["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
fs.writeFileSync(path.join(binDir, "pi-worker"), renderWinShims(PI_REVIEW_BIN, binDir).sh);
const wrongWorker = run(["doctor", "--home", home], { NANA_SETUP_PLATFORM: "win32" }, doctorCwd);
// req: R-1615
check("win32 doctor reads each PATH command ✓ only when both its shims are this checkout's", nanaLandCmdPresent && healthyPathRows && missingLand.status === 1 && /✗ PATH nana-land/.test(missingLand.stdout) && wrongWorker.status === 1 && /✗ PATH pi-worker/.test(wrongWorker.stdout), `${doc.stdout}\n${missingLand.stdout}\n${wrongWorker.stdout}`);
run(["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
for (const w of win32Wanted) {
	// req: R-1055
	check(`win32 doctor: settings ${w.label} is ✓`, new RegExp(`✓ settings ${w.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(doc.stdout), doc.stdout);
}
// req: R-1057
check("win32 doctor: node for the objective hook runs (not skipped)", /✓ node for the objective hook/.test(doc.stdout), doc.stdout);
// final review r1 (sol MUST 3, astra MUST 4): the note's full MEANING, not only the version
// string — the floor itself, and that doctor never runs `claude --version` to check it.
// req: R-1060
check("win32 doctor: a note names the Claude Code exec-form floor", doc.stdout.includes(CLAUDE_CODE_EXEC_FLOOR) && /need Claude Code 2\.1\.139 or later/.test(doc.stdout) && /claude --version.*never run/.test(doc.stdout), doc.stdout);
// req: R-1060
check("CLAUDE_CODE_EXEC_FLOOR is 2.1.139", CLAUDE_CODE_EXEC_FLOOR === "2.1.139");

/* --- final review r2 (sol MUST 2, astra MUST 1): the note above says doctor never runs `claude`
   — prove it by recording any invocation, rather than only reading the printed claim. A `claude`
   (and `claude.cmd`) stub sits first on PATH; it appends to a file if it is ever run. The file
   staying absent after doctor runs is the proof, checked on forced win32 and on the host
   platform the real `run` platform seam does not force (sol r2 MUST 2, astra r2 MUST 1). ------ */
{
	const claudeStubHome = freshHome();
	const claudeStubDir = tmpDir(path.join(os.tmpdir(), "nana-doctor-claude-stub-"));
	tmps.push(claudeStubDir);
	const recordFile = path.join(claudeStubDir, "claude-invoked.txt");
	fs.writeFileSync(path.join(claudeStubDir, "claude"), `#!/bin/sh\nprintf '%s\\n' "$*" >> ${shq(recordFile)}\necho 1.0.0\n`);
	fs.chmodSync(path.join(claudeStubDir, "claude"), 0o755);
	fs.writeFileSync(path.join(claudeStubDir, "claude.cmd"), `@echo off\r\necho %* >> "${recordFile}"\r\necho 1.0.0\r\n`);
	const withClaudeStubFirst = (invoke) => {
		const saved = process.env.PATH;
		process.env.PATH = `${claudeStubDir}${path.delimiter}${saved || ""}`;
		try { return invoke(); } finally { if (saved === undefined) delete process.env.PATH; else process.env.PATH = saved; }
	};
	// claudeStubHome is a throwaway, never-installed home — doctor is expected to print plenty of
	// ✗ against it (that is not this test's question); only whether it ever shells out to
	// `claude` is. Each run spawns successfully (no ENOENT from spawnSync itself), which is all
	// the status check here needs to establish.
	const forcedWin32Doc = withClaudeStubFirst(() => run(["doctor", "--home", claudeStubHome], { NANA_SETUP_PLATFORM: "win32" }));
	// req: R-1060
	check("win32 doctor never invokes a recording claude stub on PATH (forced win32)", typeof forcedWin32Doc.status === "number" && !fs.existsSync(recordFile), forcedWin32Doc.stdout);
	const hostPlatformDoc = withClaudeStubFirst(() => run(["doctor", "--home", claudeStubHome], {}));
	// req: R-1060
	check("doctor never invokes a recording claude stub on PATH (host platform)", typeof hostPlatformDoc.status === "number" && !fs.existsSync(recordFile), hostPlatformDoc.stdout);
}

/* re-running is still idempotent under the win32 branch */
const again = run(["install", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
check("win32: second install reports nothing to do", again.stdout.includes("nothing to do"));

/* --- the copy path owes the same no-destruction guarantee as the symlink path --------- */
{
	const collide = freshHome();
	fs.mkdirSync(path.join(collide, ".claude", "rules"), { recursive: true });
	fs.writeFileSync(path.join(collide, ".claude", "rules", "nana-soul.md"), "# my own soul\n");
	const r = run(["install", "--home", collide], { NANA_SETUP_PLATFORM: "win32" });
	const baks = fs.readdirSync(path.join(collide, ".claude", "rules")).filter((f) => f.includes(".bak-"));
	// req: R-350
	check("win32 collision: a backup is written", baks.length === 1, baks.join(","));
	// req: R-350
	check("win32 collision: the backup keeps the old content", fs.readFileSync(path.join(collide, ".claude", "rules", baks[0]), "utf8") === "# my own soul\n");
	check("win32 collision: the target now holds the repo copy", fs.readFileSync(path.join(collide, ".claude", "rules", "nana-soul.md"), "utf8") === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-soul.md"), "utf8"));
	check("win32 collision: the backup is reported", r.stdout.includes("backed up"), r.stdout);
}
{
	// never write THROUGH a symlink: that would overwrite whatever it points at
	const linked = freshHome();
	fs.mkdirSync(path.join(linked, ".claude", "rules"), { recursive: true });
	const decoy = path.join(linked, "decoy.md");
	fs.writeFileSync(decoy, "DECOY\n");
	fs.symlinkSync(decoy, path.join(linked, ".claude", "rules", "nana-soul.md"));
	const r = run(["install", "--home", linked], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-350
	check("win32 symlink: the link's target is untouched", fs.readFileSync(decoy, "utf8") === "DECOY\n");
	check("win32 symlink: the target is now a regular file", fs.lstatSync(path.join(linked, ".claude", "rules", "nana-soul.md")).isFile() && !fs.lstatSync(path.join(linked, ".claude", "rules", "nana-soul.md")).isSymbolicLink());
	check("win32 symlink: it holds the repo copy", fs.readFileSync(path.join(linked, ".claude", "rules", "nana-soul.md"), "utf8") === fs.readFileSync(path.join(pkg, "claude", "rules", "nana-soul.md"), "utf8"));
	check("win32 symlink: the replacement is reported", /replaced a symlink/.test(r.stdout), r.stdout);
}

/* --- every hook label is repaired in place when its checkout has moved, not just knowledge
   (R-1056, R-1059) — doctor (R-1055) is checked for every label too, not one representative ---- */
for (const w of win32Wanted) {
	const h2 = freshHome();
	// POSIX path.isAbsolute rejects a `C:\` form, so this forced-win32-on-POSIX fixture uses a
	// POSIX-shaped absolute path, as the seat acceptance script's own stale seeds do.
	const missingTarget = `/gone/checkout/packages/${w.spec.script === "nana-knowledge.ts" ? "nana-knowledge/bin" : "nana-setup/claude/hooks"}/${w.spec.script}`;
	const extra = w.spec.args ?? [];
	// An installer-written entry always carries its own statusMessage (R-1061, R-653, R-923), so
	// this stale fixture must too — otherwise installerTarget correctly reads it as not ours.
	const staleEntry = { type: "command", command: "node", args: [missingTarget, ...extra], timeout: 5, statusMessage: w.entry.statusMessage };
	const group = w.matcher ? { matcher: w.matcher, hooks: [staleEntry] } : { hooks: [staleEntry] };
	fs.mkdirSync(path.join(h2, ".claude"), { recursive: true });
	fs.writeFileSync(path.join(h2, ".claude", "settings.json"), JSON.stringify({ hooks: { [w.event]: [group] } }, null, 2) + "\n");
	const preDoc = run(["doctor", "--home", h2], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-1055
	check(`win32 doctor: a stale ${w.label} target reads ✗`, new RegExp(`✗ settings ${w.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(preDoc.stdout), preDoc.stdout);
	const r = run(["install", "--home", h2], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-1056
	check(`win32: stale ${w.label} install exits 0`, r.status === 0, r.stdout + r.stderr);
	const after = JSON.parse(fs.readFileSync(path.join(h2, ".claude", "settings.json"), "utf8"));
	// a minimal single-entry seed also triggers install to add the other five missing entries,
	// so the "no twin" proof is that exactly ONE entry under this event still names this script.
	const matching = after.hooks[w.event].flatMap((g) => g.hooks).filter((h) => JSON.stringify(h).includes(w.spec.script));
	const repaired = matching[0];
	// req: R-1056
	check(`win32: stale ${w.label} is repaired in place to this checkout, no twin`, matching.length === 1 && repaired.command === "node" && Array.isArray(repaired.args) && path.isAbsolute(repaired.args[0]) && fs.existsSync(repaired.args[0]), JSON.stringify(repaired));
	const doc2 = run(["doctor", "--home", h2], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-1055
	check(`win32 doctor: settings ${w.label} reads ✓ after repair`, new RegExp(`✓ settings ${w.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(doc2.stdout), doc2.stdout);
}

/* --- final review r1 (sol MUST 3, astra MUST 4): R-1055's two clauses — "under the expected
   event and matcher" and "every target resolves inside the checkout" — each get a case the
   per-label happy/missing loop above never exercises: a correctly-targeted entry sitting under
   the WRONG matcher, one under the WRONG event, a target that EXISTS but resolves outside the
   checkout (distinct from the missing-target case above, which never reaches the
   resolves-inside-checkout branch), and a healthy entry beside a stale duplicate under the same
   event (every target must resolve, not just one) ----------------------------------------------- */
{
	const h2 = freshHome();
	const verifierWanted = win32Wanted.find((w) => w.label === "PreToolUse verifier pipe");
	fs.mkdirSync(path.join(h2, ".claude"), { recursive: true });
	fs.writeFileSync(path.join(h2, ".claude", "settings.json"), JSON.stringify({ hooks: { PreToolUse: [{ matcher: "Bash", hooks: [verifierWanted.entry] }] } }, null, 2) + "\n");
	const doc = run(["doctor", "--home", h2], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-1055
	check("win32 doctor: a correctly-targeted entry under the wrong matcher reads ✗", new RegExp(`✗ settings ${verifierWanted.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(doc.stdout), doc.stdout);
}
{
	const h2 = freshHome();
	const objWanted = win32Wanted.find((w) => w.label === "SessionStart objective");
	fs.mkdirSync(path.join(h2, ".claude"), { recursive: true });
	fs.writeFileSync(path.join(h2, ".claude", "settings.json"), JSON.stringify({ hooks: { Stop: [{ hooks: [objWanted.entry] }] } }, null, 2) + "\n");
	const doc = run(["doctor", "--home", h2], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-1055
	check("win32 doctor: a correctly-targeted entry under the wrong event reads ✗", new RegExp(`✗ settings ${objWanted.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(doc.stdout), doc.stdout);
}
{
	const h2 = freshHome();
	const objWanted = win32Wanted.find((w) => w.label === "SessionStart objective");
	const outsideDir = tmpDir(path.join(os.tmpdir(), "nana-setup-outside-"));
	tmps.push(outsideDir);
	// Forward-slash suffix, not path.join: on real Windows path.join gives an ALL-backslash
	// path, which targetFromArgv's `endsWith('/' + script)` check (and the real installer's own
	// win32 paths — CHANGE §3, native root + `/` suffix) would read as not invoking the script
	// at all, making this fixture invisible rather than "outside the checkout" (sol MUST 3 /
	// astra MUST 4 case, windows-leg fix).
	const outsideTarget = `${outsideDir}/nana-objective.mjs`;
	fs.writeFileSync(outsideTarget, "// exists, but not the checkout's copy\n");
	fs.mkdirSync(path.join(h2, ".claude"), { recursive: true });
	const outsideEntry = { ...objWanted.entry, args: [outsideTarget] };
	fs.writeFileSync(path.join(h2, ".claude", "settings.json"), JSON.stringify({ hooks: { SessionStart: [{ hooks: [outsideEntry] }] } }, null, 2) + "\n");
	const doc = run(["doctor", "--home", h2], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-1055
	check("win32 doctor: a target that exists but resolves outside the checkout reads ✗", new RegExp(`✗ settings ${objWanted.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(doc.stdout), doc.stdout);
}
{
	const h2 = freshHome();
	const objWanted = win32Wanted.find((w) => w.label === "SessionStart objective");
	const outsideDir = tmpDir(path.join(os.tmpdir(), "nana-setup-outside2-"));
	tmps.push(outsideDir);
	// Forward-slash suffix — see the note above; the "good" entry here already names a real,
	// visible target, so this fixture must be a SECOND real, VISIBLE target, not an invisible one.
	const outsideTarget = `${outsideDir}/nana-objective.mjs`;
	fs.writeFileSync(outsideTarget, "// exists, but not the checkout's copy\n");
	fs.mkdirSync(path.join(h2, ".claude"), { recursive: true });
	const duplicateEntry = { ...objWanted.entry, args: [outsideTarget] };
	fs.writeFileSync(path.join(h2, ".claude", "settings.json"), JSON.stringify({ hooks: { SessionStart: [{ hooks: [objWanted.entry, duplicateEntry] }] } }, null, 2) + "\n");
	const doc = run(["doctor", "--home", h2], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-1055
	check("win32 doctor: a good entry beside a stale duplicate under the same event reads ✗", new RegExp(`✗ settings ${objWanted.label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(doc.stdout), doc.stdout);
}

/* --- the earlier win32 knowledge form, pointing at a missing checkout, is moved to exec form
   in place even though only its form (not its health) is wrong (R-1059) --------------------- */
{
	const h2 = freshHome();
	fs.mkdirSync(path.join(h2, ".claude"), { recursive: true });
	// Today's real win32 knowledge target: the root in its own native separators, the suffix in
	// forward slashes — the exact mixed string desiredHooks() itself builds (CHANGE.md §3), not
	// path.join's fully-backslashed result, which the win32-legacy recognizer would not match.
	const healthyLegacy = { type: "command", command: `node ${shq(`${repo}/packages/nana-knowledge/bin/nana-knowledge.ts`)} hook`, timeout: 5, statusMessage: "nana: knowledge pull" };
	fs.writeFileSync(path.join(h2, ".claude", "settings.json"), JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [healthyLegacy] }] } }, null, 2) + "\n");
	const r = run(["install", "--home", h2], { NANA_SETUP_PLATFORM: "win32" });
	// req: R-1059
	check("win32: install over the earlier win32 form exits 0", r.status === 0, r.stdout + r.stderr);
	const after = JSON.parse(fs.readFileSync(path.join(h2, ".claude", "settings.json"), "utf8"));
	const entries = after.hooks.UserPromptSubmit[0].hooks;
	// req: R-1059
	check("win32: a healthy earlier-form knowledge entry is moved to exec form in place, no twin", entries.length === 1 && entries[0].command === "node" && Array.isArray(entries[0].args) && entries[0].args[1] === "hook", JSON.stringify(entries));
}

/* the seam does not leak: a normal run on this machine still links */
if (process.platform !== "win32") {
	const posix = freshHome();
	run(["install", "--home", posix]);
	check("seam does not leak: a normal run links the hooks", fs.lstatSync(path.join(posix, ".claude", "hooks", "nana-objective.mjs")).isSymbolicLink());
} else console.log("SKIP seam does not leak: a normal run links the hooks — a Windows install links no hook files");

for (const t of tmps) fs.rmSync(t, { recursive: true, force: true });
process.exit(fails);
