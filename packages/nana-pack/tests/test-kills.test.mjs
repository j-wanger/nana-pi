/**
 * @module packages/nana-pack/tests/test-kills.test.mjs
 * @purpose Pin owned test cleanup and refuse unowned test signal routes.
 * @inputs Injected process seams, pid-file fixtures and repository test source.
 * @outputs Bounded awaited requirement-tagged PASS/FAIL cases.
 * @effects disk (reads test source and OS temporary fixtures), process (stubbed signals only).
 * @errors Assertions set exit 1.
 */
import assert from "node:assert/strict";
import { ChildProcess } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { fileIdentity, killOwned, startTime } from "./process-tree-helper.mjs";
import { tmpDir } from "./tmp-dir.mjs";
import { withinCaseLimit } from "./report-fixtures.mjs";

async function check(title, action) {
	try { await withinCaseLimit(title, action); console.log("PASS", title); }
	catch (error) { console.log("FAIL", title, error.stack); process.exitCode = 1; }
}

// req: R-4370
await check("R-4370: test signals require live child or recorded ownership independently for every member", () => {
	const calls = [], commands = [], queries = [];
	const token = "Sun Nov  1 06:30:00 2026 GMT";
	const seams = {
		kill: (...args) => calls.push(args),
		run: (...args) => { commands.push(args); return { status: 0 }; },
		starts: pids => { queries.push(pids); return new Map(pids.map(pid => [pid, token])); },
		platform: "darwin",
	};
	const child = new ChildProcess(); child.pid = 42; child.exitCode = 0;
	assert.deepEqual(killOwned(child, { ...seams, tree: true, platform: "win32" }), []);
	assert.deepEqual(commands, []); assert.deepEqual(calls, []);
	child.exitCode = null;
	assert.deepEqual(killOwned(child, { ...seams, tree: true, platform: "win32" }), [42]);
	assert.equal(commands.length, 1);
	assert.deepEqual(commands[0].slice(0, 2), ["task" + "kill", ["/T", "/F", "/PID", "42"]]);
	assert.deepEqual(killOwned({ pid: 43, start: "different" }, seams), []);
	assert.deepEqual(killOwned({ pid: 43, start: token }, seams), [43]);
	assert.equal(calls.length, 1);
	const at = startTime(token, { platform: "darwin" });
	assert.equal(at, Date.UTC(2026, 10, 1, 6, 30));
	assert.equal(startTime("621355968010000000", { platform: "win32" }), 1000);
	assert.deepEqual(killOwned({ pid: 44, recordedAt: at - 1 }, seams), []);
	assert.deepEqual(killOwned({ pid: 44, recordedAt: at + 1 }, seams), [44]);
	assert.equal(calls.length, 2);
	child.exitCode = 0; queries.length = 0;
	assert.deepEqual(killOwned(child, { ...seams, members: [null, { pid: 45, start: token }] }), [45]);
	assert.deepEqual(queries, [[45]]);
	queries.length = 0;
	assert.deepEqual(killOwned({ pid: 46, start: token }, { ...seams, members: [{ pid: 47, start: token }] }), [46, 47]);
	assert.deepEqual(queries, [[46, 47]]);
	for (const target of [null, 42, { pid: -1, start: token }]) assert.deepEqual(killOwned(target, seams), []);
	const root = tmpDir(path.join(os.tmpdir(), "test-kills-")), file = path.join(root, "pid");
	try {
		assert.equal(fileIdentity(file), null);
		for (const text of ["", "42x", "42 43", "0"]) {
			fs.writeFileSync(file, text); assert.equal(fileIdentity(file), null);
		}
		for (const ending of ["\n", "\r\n", " \t", ""]) {
			fs.writeFileSync(file, `42${ending}`);
			assert.deepEqual(fileIdentity(file), { pid: 42, recordedAt: fs.statSync(file).mtimeMs });
		}
	} finally { fs.rmSync(root, { recursive: true, force: true }); }
});

// Split at top-level commas, not inside nested calls, arrays, objects or strings.
function callArguments(source, open) {
	const args = []; let start = open + 1, depth = 0, quote = null;
	for (let i = start; i < source.length; i++) {
		const char = source[i];
		if (quote) {
			if (char === "\\") i++;
			else if (char === quote) quote = null;
			continue;
		}
		if (["'", '"', "`"].includes(char)) { quote = char; continue; }
		if ("([{".includes(char)) depth++;
		else if (")]}".includes(char)) {
			if (!depth && char === ")") { args.push(source.slice(start, i).trim()); return { args, end: i + 1 }; }
			depth--;
		} else if (char === "," && !depth) { args.push(source.slice(start, i).trim()); start = i + 1; }
	}
	return { args: [], end: open + 1 };
}
function testSources(root) {
	const files = [];
	const take = dir => {
		if (!fs.existsSync(path.join(root, dir))) return;
		for (const entry of fs.readdirSync(path.join(root, dir), { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
			if (entry.isDirectory()) { if (!["fixture", "fixtures"].includes(entry.name)) take(`${dir}/${entry.name}`); }
			else if (/\.(?:mjs|cjs|js)$/.test(entry.name)) files.push(`${dir}/${entry.name}`);
		}
	};
	for (const pkg of fs.readdirSync(path.join(root, "packages")).sort()) take(`packages/${pkg}/tests`);
	take("apps/bench/test");
	return files;
}

// Keep the scan's own vocabulary split, as in the launch-limits source check.
const signalCall = ["process", "kill"].join(".");
const bareCall = "ki" + "ll";
const treeCommand = "task" + "kill";
const pendingFile = "packages/nana-setup/tests/pi-launch-limits.test.mjs";
const pendingReason = "R-2893 pins this file's kill shapes; follow-up lane";
const pending = [
	'group ? -child.pid : child.pid, "SIGKILL"',
	'relayPid, "SIGINT"',
	'-child.pid, "SIGINT"',
	'relayPid, "SIGKILL"',
].map(args => ({ file: pendingFile, text: `${signalCall}(${args})`, reason: pendingReason }));
const permanent = new Set([
	"packages/nana-pack/tests/process-tree-helper.mjs", // The ownership boundary.
	"packages/nana-pack/tests/process-tree.test.mjs", // Product stubs and its live spawned child.
]);
function signalSites(source) {
	const hits = [];
	const add = (index, text) => { if (!hits.some(hit => hit.index === index)) hits.push({ index, text }); };
	const callPattern = new RegExp(`\\b${signalCall.replace(".", "\\.")}\\s*\\(|(?<![\\w$.])${bareCall}\\s*\\(`, "g");
	for (const match of source.matchAll(callPattern)) {
		const { args, end } = callArguments(source, match.index + match[0].lastIndexOf("("));
		if (args[1] !== "0" && args[0] !== "process.pid") add(match.index, source.slice(match.index, end));
	}
	const imported = ["kill" + "ProcessTree", "kill" + "ProcessTreeNoWait", "kill" + "Tree", "signal" + "TreeTargets"];
	for (const match of source.matchAll(/import\s*\{[^}]*\}\s*from\s*["'][^"']*process-tree\.mjs["']/g)) {
		if (imported.some(name => new RegExp(`\\b${name}\\b`).test(match[0]))) add(match.index, match[0]);
	}
	const quoted = new RegExp(`["']${treeCommand}["']`, "g");
	for (const match of source.matchAll(quoted)) add(match.index, match[0]);
	const shell = new RegExp(`\\b(?:${bareCall}\\s+-(?:[0-9]+|[A-Z]+)\\b|${bareCall}\\s+\\$|${["p" + bareCall, bareCall + "all", "Stop" + "-Process"].join("|")})`, "gi");
	for (const match of source.matchAll(shell)) add(match.index, match[0]);
	const dotNet = new RegExp(`\\.${"Ki" + "ll"}\\s*\\(\\s*\\)`, "g");
	for (const match of source.matchAll(dotNet)) add(match.index, match[0]);
	const spawned = new RegExp(`\\b(?:spawn(?:Sync)?|exec(?:File)?(?:Sync)?)\\s*\\(\\s*(["'])${bareCall}\\1`, "g");
	for (const match of source.matchAll(spawned)) add(match.index, match[0]);
	return hits.sort((a, b) => a.index - b.index);
}

// req: R-4371
await check("R-4371: test-kill scan rejects unowned signals and stale pending entries", () => {
	const root = fileURLToPath(new URL("../../../", import.meta.url));
	const problems = [], seen = new Set();
	for (const file of testSources(root)) {
		if (permanent.has(file)) continue;
		const source = fs.readFileSync(path.join(root, file), "utf8");
		for (const hit of signalSites(source)) {
			const allowed = pending.find(entry => entry.file === file && entry.text === hit.text);
			if (allowed) { seen.add(allowed); continue; }
			const line = source.slice(0, hit.index).split("\n").length;
			problems.push(`${file}:${line}:${hit.text}`);
		}
	}
	for (const entry of pending) if (!seen.has(entry)) problems.push(`${entry.file}: pending signal no longer occurs: ${entry.text} (${entry.reason})`);
	assert.deepEqual(problems, [], `${problems.length} unowned or stale signal calls\n${problems.join("\n")}`);
});
