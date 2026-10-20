/**
 * @module packages/nana-setup/tests/settings-lock.test.mjs
 * @purpose Prove printed settings-lock removal commands execute safely and doctor reports a leftover lock with the same repairs.
 * @inputs The nana-setup CLI, SETTINGS_LOCK_NAME, temporary home and sentinel fixtures, /bin/sh, cmd.exe and Windows PowerShell.
 * @outputs PASS, FAIL or named SKIP lines for R-2081 through R-2085 and a final failure-count summary.
 * @effects disk (temporary fixtures), process (runs nana-setup and the platform shells).
 * @errors Failed assertions print their observed output and make the test process exit nonzero.
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { PI_SUBAGENTS_FLOOR } from "../lib/doctor.mjs";
import { SETTINGS_LOCK_NAME } from "../lib/settings-lock.mjs";
import { withPiStub } from "./stub-pi.mjs";
import { tmpDir } from "./tmp-dir.mjs";

// Chosen 2026-10-20: each local shell or CLI case must finish well below hosted CI's job timeout.
const CASE_TIMEOUT_MS = 30_000;
const cli = fileURLToPath(new URL("../bin/nana-setup.mjs", import.meta.url));
const root = tmpDir(path.join(os.tmpdir(), "nana-settings-lock-test-"));
const neutralCwd = path.join(root, "neutral-cwd");
fs.mkdirSync(neutralCwd, { recursive: true });
let failures = 0;
const check = (title, pass, detail = "") => {
	console.log(pass ? "PASS" : "FAIL", title, pass ? "" : detail);
	if (!pass) failures++;
};
const skip = (title, reason) => console.log("SKIP", title, "—", reason);

function fixtureHome(name, { subagents = true } = {}) {
	const home = path.join(root, name);
	fs.mkdirSync(path.join(home, ".pi", "agent", "nana-knowledge"), { recursive: true });
	fs.writeFileSync(path.join(home, ".pi", "agent", "nana-knowledge", "sources.json"), '{"roots":[]}');
	if (subagents) {
		const packageDir = path.join(home, ".pi", "agent", "npm", "node_modules", "pi-subagents");
		fs.mkdirSync(packageDir, { recursive: true });
		fs.writeFileSync(path.join(packageDir, "package.json"), JSON.stringify({ name: "pi-subagents", version: PI_SUBAGENTS_FLOOR }));
	}
	return home;
}

function cleanEnv(home, extra = {}) {
	const env = { ...process.env, HOME: home, USERPROFILE: home, ...extra };
	for (const name of ["PI_CODING_AGENT_DIR", "CLAUDE_CONFIG_DIR", "NANA_SHARED_MEMORY_DIR", "NANA_KNOWLEDGE_HOME", "NANA_SETUP_PLATFORM"]) delete env[name];
	return { ...env, ...extra };
}

function run(args, { home, extraEnv = {}, cwd = neutralCwd }) {
	const invoke = () => spawnSync(process.execPath, [cli, ...args], {
		cwd,
		env: cleanEnv(home, extraEnv),
		encoding: "utf8",
		timeout: CASE_TIMEOUT_MS,
	});
	return args[0] === "doctor" ? withPiStub(invoke) : invoke();
}

function snapshot(directory) {
	const entries = [];
	const visit = (current, relative = "") => {
		for (const name of fs.readdirSync(current).sort()) {
			const absolute = path.join(current, name);
			const child = relative ? `${relative}/${name}` : name;
			const stat = fs.lstatSync(absolute);
			if (stat.isSymbolicLink()) entries.push([child, "link", fs.readlinkSync(absolute)]);
			else if (stat.isDirectory()) {
				entries.push([child, "directory"]);
				visit(absolute, child);
			} else if (stat.isFile()) entries.push([child, "file", fs.readFileSync(absolute).toString("base64")]);
			else entries.push([child, "other"]);
		}
	};
	visit(directory);
	return JSON.stringify(entries);
}

function lockPath(home) {
	return path.join(home, ".claude", SETTINGS_LOCK_NAME);
}

function writeLock(home) {
	fs.mkdirSync(path.dirname(lockPath(home)), { recursive: true });
	fs.writeFileSync(lockPath(home), JSON.stringify({ pid: 4242, at: Date.now() - 90_000 }));
}

function commandLine(stderr, prefix) {
	return stderr.split(/\r?\n/).find((line) => line.trimStart().startsWith(prefix));
}

function shellFixture(name) {
	const sentinel = path.join(root, `${name}-sentinel`);
	fs.mkdirSync(sentinel, { recursive: true });
	for (const file of ["nana", "lock", "q", "é", "1"]) fs.writeFileSync(path.join(sentinel, file), `${file}\n`);
	return sentinel;
}

function exercisePrintedCommand({ home, prefix, spawn }) {
	const sentinel = shellFixture(prefix.replace(/\W+/g, "-"));
	const homeBefore = snapshot(home);
	const sentinelBefore = snapshot(sentinel);
	writeLock(home);
	const install = run(["install", "--home", home], { home });
	const line = commandLine(install.stderr, prefix);
	const shell = line ? spawn(line, sentinel) : { status: null, stdout: "", stderr: "command line missing" };
	return {
		pass: install.status === 2 && Boolean(line) && shell.status === 0 && !fs.existsSync(lockPath(home)) && snapshot(home) === homeBefore && snapshot(sentinel) === sentinelBefore,
		detail: `install ${install.status}\n${install.stderr}\nline ${JSON.stringify(line)}\nshell ${shell.status}\n${shell.stdout ?? ""}\n${shell.stderr ?? ""}`,
	};
}

const awkwardHome = fixtureHome("nana lock 'q' ’ é $x `b` [1]");
fs.mkdirSync(path.join(awkwardHome, ".claude"), { recursive: true });

if (process.platform === "win32") {
	skip("R-2081: on macOS and Linux, the rm line install prints for a held lock, run by /bin/sh, removes the lock under an awkward home path and changes no other file", "install prints Windows removal commands on win32");
} else {
	const result = exercisePrintedCommand({
		home: awkwardHome,
		prefix: "rm ",
		spawn: (line, cwd) => spawnSync("/bin/sh", ["-c", line], { cwd, env: { PATH: "/usr/bin:/bin" }, encoding: "utf8", timeout: CASE_TIMEOUT_MS }),
	});
	// req: R-2081
	check("R-2081: on macOS and Linux, the rm line install prints for a held lock, run by /bin/sh, removes the lock under an awkward home path and changes no other file", result.pass, result.detail);
}

if (process.platform !== "win32") {
	skip("R-2082: on Windows, the Command Prompt line install prints for a held lock, run by cmd.exe, removes the lock under an awkward home path and changes no other file", "cmd.exe is required and exists only on Windows");
} else {
	const comspec = process.env.ComSpec ?? path.win32.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "cmd.exe");
	const result = exercisePrintedCommand({
		home: awkwardHome,
		prefix: "del ",
		spawn: (line, cwd) => spawnSync(comspec, ["/d", "/v:off", "/s", "/c", `"${line}"`], { cwd, encoding: "utf8", windowsVerbatimArguments: true, timeout: CASE_TIMEOUT_MS }),
	});
	// req-candidate: R-2082 (Windows only; becomes req: when the Windows CI leg passes it)
	check("R-2082: on Windows, the Command Prompt line install prints for a held lock, run by cmd.exe, removes the lock under an awkward home path and changes no other file", result.pass, result.detail);
}

if (process.platform !== "win32") {
	skip("R-2083: on Windows, the PowerShell line install prints for a held lock, run by Windows PowerShell, removes the lock under an awkward home path and changes no other file", "Windows PowerShell is required and exists only on Windows");
} else {
	const result = exercisePrintedCommand({
		home: awkwardHome,
		prefix: "Remove-Item ",
		spawn: (line, cwd) => spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(line, "utf16le").toString("base64")], { cwd, encoding: "utf8", timeout: CASE_TIMEOUT_MS }),
	});
	// req-candidate: R-2083 (Windows only; becomes req: when the Windows CI leg passes it)
	check("R-2083: on Windows, the PowerShell line install prints for a held lock, run by Windows PowerShell, removes the lock under an awkward home path and changes no other file", result.pass, result.detail);
}

function platformModes() {
	return process.platform === "win32"
		? [{ name: "native win32", env: {} }]
		: [{ name: `native ${process.platform}`, env: {} }, { name: "forced win32", env: { NANA_SETUP_PLATFORM: "win32" } }];
}

function doctorLockResult(mode, index) {
	const home = fixtureHome(`doctor-row-${index}`);
	const installed = run(["install", "--home", home], { home, extraEnv: mode.env });
	writeLock(home);
	const held = run(["install", "--home", home], { home, extraEnv: mode.env });
	const doctor = run(["doctor", "--home", home], { home, extraEnv: mode.env });
	const row = doctor.stdout.split(/\r?\n/).find((line) => line.trimStart().startsWith("✗ settings lock"));
	const commands = held.stderr.split(/\r?\n/).filter((line) => {
		const trimmed = line.trimStart();
		return trimmed.startsWith("rm ") || trimmed.startsWith("del ") || trimmed.startsWith("Remove-Item ");
	}).map((line) => line.trim());
	return {
		pass: installed.status === 0 && held.status === 2 && doctor.status === 1 && Boolean(row) && row.includes(lockPath(home)) && row.includes("pid 4242") && /\b\d+s ago\b/.test(row) && commands.length === (mode.env.NANA_SETUP_PLATFORM === "win32" || process.platform === "win32" ? 2 : 1) && commands.every((command) => row.includes(command)),
		detail: `${mode.name}\ninstall ${installed.status}\nheld ${held.status}\n${held.stderr}\ndoctor ${doctor.status}\n${doctor.stdout}\n${doctor.stderr}`,
	};
}

const doctorRows = platformModes().map(doctorLockResult);
// req: R-2084
check("R-2084: while the settings lock exists, doctor marks a settings lock row ✗ naming the lock, its pid and age, and every removal command install prints", doctorRows.every((result) => result.pass), doctorRows.map((result) => result.detail).join("\n---\n"));

function summaryLockResult(mode, index) {
	const freshHome = fixtureHome(`doctor-summary-fresh-${index}`);
	writeLock(freshHome);
	const freshDoctor = run(["doctor", "--home", freshHome], { home: freshHome, extraEnv: mode.env });
	const installedHome = fixtureHome(`doctor-summary-installed-${index}`);
	const installed = run(["install", "--home", installedHome], { home: installedHome, extraEnv: mode.env });
	writeLock(installedHome);
	const installedDoctor = run(["doctor", "--home", installedHome], { home: installedHome, extraEnv: mode.env });
	const last = (result) => result.stdout.split(/\r?\n/).filter((line) => line.trim()).at(-1)?.trim() ?? "";
	const freshLast = last(freshDoctor);
	const installedLast = last(installedDoctor);
	return {
		pass: installed.status === 0 && freshDoctor.status === 1 && installedDoctor.status === 1 && [freshLast, installedLast].every((line) => line.includes("fix by hand as each ✗ line says:") && line.includes("settings lock")),
		detail: `${mode.name}\nfresh ${freshDoctor.status}: ${freshLast}\ninstalled ${installed.status}, doctor ${installedDoctor.status}: ${installedLast}\n${freshDoctor.stdout}\n${installedDoctor.stdout}`,
	};
}

const doctorSummaries = platformModes().map(summaryLockResult);
// req: R-2085
check("R-2085: while the settings lock exists, doctor's last line lists settings lock among the rows to fix by hand, on a fresh home and on an installed one", doctorSummaries.every((result) => result.pass), doctorSummaries.map((result) => result.detail).join("\n---\n"));

console.log(`${failures ? "FAIL" : "PASS"} summary: ${failures} failures`);
process.exitCode = failures ? 1 : 0;
