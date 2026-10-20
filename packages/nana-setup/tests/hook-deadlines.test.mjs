/**
 * @module packages/nana-setup/tests/hook-deadlines.test.mjs
 * @purpose Prove session-start hooks replace hung producer output with markers before their installed limit.
 * @inputs Copied canonical hooks and launcher library, checkout hook metadata, and live or hung producer stubs.
 * @outputs PASS/FAIL checks for adoption and objective hook deadline behavior.
 * @effects disk (creates a throwaway checkout), process (spawns copied hooks and producer stubs).
 * @errors A watchdog kills an over-limit hook; failed checks set a nonzero process exit code.
 */
import { spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { hookProducerConfig } from "../lib/hook-producer.mjs";
import { desiredHooks } from "../lib/settings.mjs";
import { tmpDir } from "./tmp-dir.mjs";

const checkoutRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const root = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "nana-hook-deadlines-")));
const tempHome = path.join(root, "home");
const hooksDir = path.join(root, "packages", "nana-setup", "claude", "hooks");
const copiedLib = path.join(root, "packages", "nana-setup", "lib");
const STUB_HANG_MS = 30_000; // Chosen to outlast both the hook limit and the test watchdog.
const CASE_LIMIT_MS = 15_000; // Chosen to bound a broken hook while allowing the installed 5 s limit.

fs.mkdirSync(tempHome, { recursive: true });
fs.mkdirSync(path.dirname(hooksDir), { recursive: true });
fs.cpSync(path.join(checkoutRoot, "packages", "nana-setup", "claude", "hooks"), hooksDir, { recursive: true });
fs.cpSync(path.join(checkoutRoot, "packages", "nana-setup", "lib"), copiedLib, { recursive: true });

const stubPaths = {
	adoption: path.join(root, "packages", "nana-pack", "bin", "nana-adoption.mjs"),
	"stale-copies": path.join(root, "packages", "nana-setup", "bin", "stale-copies.mjs"),
	objective: path.join(root, "packages", "nana-pack", "bin", "nana-objective.mjs"),
};
const hungStub = `process.stdout.write("PARTIAL\\n");\nsetTimeout(() => {}, ${STUB_HANG_MS});\n`;
const liveLine = "STALE COPY OK\n";
const liveStub = `process.stdout.write(${JSON.stringify(liveLine)});\n`;
const writeStub = (name, source) => {
	fs.mkdirSync(path.dirname(stubPaths[name]), { recursive: true });
	fs.writeFileSync(stubPaths[name], source);
};

const installedLimit = (label) => {
	const hook = desiredHooks({ hooksDir, repoRoot: root, platform: process.platform }).find((candidate) => candidate.label === label);
	return hook.entry.timeout * 1000;
};
const runHook = (hookName) => new Promise((resolve) => {
	const startedAt = Date.now();
	const child = spawn(process.execPath, [path.join(hooksDir, hookName)], {
		cwd: root,
		env: { ...process.env, CLAUDE_PROJECT_DIR: root, HOME: tempHome, USERPROFILE: tempHome },
		stdio: ["ignore", "pipe", "pipe"],
	});
	let stdout = "";
	let stderr = "";
	let spawnError = "";
	let timedOut = false;
	child.stdout.setEncoding("utf8").on("data", (chunk) => { stdout += chunk; });
	child.stderr.setEncoding("utf8").on("data", (chunk) => { stderr += chunk; });
	child.on("error", (error) => { spawnError = String(error); });
	const watchdog = setTimeout(() => {
		timedOut = true;
		child.kill("SIGKILL");
	}, CASE_LIMIT_MS);
	child.on("close", (code, signal) => {
		clearTimeout(watchdog);
		resolve({ code, signal, stdout, stderr: stderr || spawnError, timedOut, elapsed: Date.now() - startedAt });
	});
});

let failures = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", `${title}${ok || !detail ? "" : ` — ${detail}`}`);
	if (!ok) failures++;
};

writeStub("adoption", hungStub);
writeStub("stale-copies", liveStub);
let result = await runHook("nana-adoption.mjs");
let expected = hookProducerConfig("adoption", root).marker + liveLine;
// req: R-2010
check("adoption hook prints its marker and the stale-copy output when the adoption producer hangs", result.code === 0 && !result.timedOut && result.stdout === expected, `code=${String(result.code)} elapsed=${result.elapsed} stdout=${JSON.stringify(result.stdout)} stderr=${JSON.stringify(result.stderr)}`);

writeStub("adoption", hungStub);
writeStub("stale-copies", hungStub);
result = await runHook("nana-adoption.mjs");
expected = hookProducerConfig("adoption", root).marker + hookProducerConfig("stale-copies", root).marker;
// req: R-2011
check("adoption hook prints both markers before its installed limit when both producers hang", result.code === 0 && !result.timedOut && result.stdout === expected && result.elapsed < installedLimit("SessionStart adoption"), `code=${String(result.code)} elapsed=${result.elapsed} limit=${installedLimit("SessionStart adoption")} stdout=${JSON.stringify(result.stdout)} stderr=${JSON.stringify(result.stderr)}`);

writeStub("objective", hungStub);
result = await runHook("nana-objective.mjs");
expected = hookProducerConfig("objective", root).marker;
// req: R-2012
check("objective hook prints its marker before its installed limit when its producer hangs", result.code === 0 && !result.timedOut && result.stdout === expected && result.elapsed < installedLimit("SessionStart objective"), `code=${String(result.code)} elapsed=${result.elapsed} limit=${installedLimit("SessionStart objective")} stdout=${JSON.stringify(result.stdout)} stderr=${JSON.stringify(result.stderr)}`);

if (failures) process.exitCode = 1;
