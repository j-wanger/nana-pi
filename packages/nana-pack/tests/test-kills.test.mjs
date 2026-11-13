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
	child.kill = (...args) => { calls.push(args); return true; };
	assert.deepEqual(killOwned(child, { ...seams, tree: true, platform: "win32" }), []);
	assert.deepEqual(commands, []); assert.deepEqual(calls, []);
	child.exitCode = null; child.signalCode = "SIGKILL";
	for (const options of [{ group: true }, { group: true, platform: "win32" }, { tree: true, platform: "win32" }]) {
		assert.deepEqual(killOwned(child, { ...seams, ...options }), []);
		assert.deepEqual(commands, []); assert.deepEqual(calls, []); assert.deepEqual(queries, []);
	}
	child.signalCode = null;
	assert.deepEqual(killOwned(child, { ...seams, tree: true, platform: "win32" }), [42]);
	assert.equal(commands.length, 1);
	assert.deepEqual(commands[0].slice(0, 2), [["task", "kill"].join(""), ["/T", "/F", "/PID", "42"]]);
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
const treeCommand = ["task", "kill"].join("");
// Every exception names one source occurrence, never an entire test module.
const productTest = "packages/nana-pack/tests/process-tree.test.mjs";
const allowedSites = [
	{ file: productTest, text: "killProcessTree(parent.pid)", reason: "live spawned ChildProcess owned by this case" },
	...[
		{ context: `const ${treeCommand}Calls = [];`, reason: "declaration of the stub command-call collector" },
		{ context: `${treeCommand}Calls.push(`, reason: "stub pushes into the command-call collector" },
		{ context: `...${treeCommand}Calls,`, reason: "assertion reads the stub command-call collector" },
	].map(entry => ({ file: productTest, text: treeCommand, ...entry })),
	...[`"POSIX must not start ${treeCommand}"`, `"${treeCommand}"`,
		`"R-2657: on Windows both forms start ${treeCommand} /T /F /PID once without a shell, signal no group, call the fallback once when ${treeCommand} cannot start or exits non-zero, and contain a throwing fallback"`,
		`"R-2658: a pid of 0, 1, -1, 1.5, NaN, null or undefined signals nothing, starts no ${treeCommand} and calls no fallback"`,
		`"R-2657: Windows ${treeCommand} reaches a real child tree without a shell"`,
		`"SKIP R-2657: Windows ${treeCommand} reaches a real child tree without a shell"`,
	].flatMap(text => [...text.matchAll(new RegExp(`\\b${treeCommand}`, "gi"))].map(match => ({ file: productTest, text: match[0], context: text, reason: "stub assertion or report text, not a command launch" }))),
	{ file: "packages/nana-pack/tests/worker-claude.test.mjs", text: treeCommand, context: `"R-2721: Windows: ${treeCommand} /F /T of pi-worker's tree while a directly launched builder runs leaves no temp file, no lane lock and no watcher"`, reason: "report title, not a command launch" },
];
function signalSites(source) {
	const hits = [];
	const add = (index, text) => { if (!hits.some(hit => hit.index === index)) hits.push({ index, text }); };
	const callPattern = new RegExp(`\\b${signalCall.replace(".", "\\.")}\\s*\\(|(?<![\\w$.])${bareCall}\\s*\\(`, "g");
	for (const match of source.matchAll(callPattern)) {
		const { args, end } = callArguments(source, match.index + match[0].lastIndexOf("("));
		if (args[1] !== "0" && args[0] !== "process.pid") add(match.index, source.slice(match.index, end));
	}
	const processAccess = new RegExp(`\\bprocess\\s*(?:\\??\\.\\s*${bareCall}\\b|(?:\\?\\.)?\\[\\s*["'\x60]${bareCall}["'\x60]\\s*\\])`, "g");
	for (const match of source.matchAll(processAccess)) {
		const rest = source.slice(match.index + match[0].length);
		// A direct call was handled above; other accesses can alias or bind the signal route.
		if (/^\s*\(/.test(rest) && match[0] === signalCall) continue;
		if (/^\s*\(/.test(rest)) {
			const open = match.index + match[0].length + rest.indexOf("(");
			const { args } = callArguments(source, open);
			if (args[1] === "0" || args[0] === "process.pid") continue;
		}
		// Passing the function as an injected default does not itself signal anything.
		if (/\bkill\s*=\s*$/.test(source.slice(0, match.index)) && /^\s*[,})]/.test(rest)) continue;
		add(match.index, match[0]);
	}
	for (const match of source.matchAll(/\bimport\s*\{([^}]+)\}\s*from\s*["'][^"']*process-tree\.mjs["']/g)) {
		for (const binding of match[1].split(",")) {
			const [name, alias] = binding.trim().split(/\s+as\s+/);
			if (!["kill" + "ProcessTree", "kill" + "ProcessTreeNoWait", "kill" + "Tree", "signal" + "TreeTargets"].includes(name)) continue;
			for (const call of source.matchAll(new RegExp(`\\b${alias ?? name}\\s*\\(`, "g"))) {
				const { args, end } = callArguments(source, call.index + call[0].lastIndexOf("("));
				// Product seam tests inject their signalling and launcher functions.
				if (/\b(?:kill|run|start)\s*:/.test(args[1] ?? "")) continue;
				add(call.index, source.slice(call.index, end));
			}
		}
	}
	for (const match of source.matchAll(/\b(?:import\s+\*\s+as\s+\w+\s+from\s*["'][^"']*process-tree\.mjs["']|(?:import|require)\s*\(\s*["'][^"']*process-tree\.mjs["']\s*\))/g)) add(match.index, match[0]);
	// Raw source avoids quote pairing shifted by apostrophes in comments.
	for (const match of source.matchAll(new RegExp(`\\b${treeCommand}`, "gi"))) add(match.index, match[0]);
	const destructured = new RegExp(`\\b(?:const|let|var)\\s*\\{[^}]*\\b${bareCall}\\s*(?::[^,}]+)?[^}]*\\}\\s*=\\s*process\\b`, "g");
	for (const match of source.matchAll(destructured)) add(match.index, match[0]);
	// Keep the string pass only for command names split across concatenated literals.
	const strings = /(["'`])(?:\\[\s\S]|(?!\1)[^\\])*?\1/g;
	const concatenated = /(["'])(?:[^"'\\]|\\.)*\1(?:\s*\+\s*(["'])(?:[^"'\\]|\\.)*\2)+/g;
	for (const match of source.matchAll(concatenated)) {
		const text = [...match[0].matchAll(strings)].map(part => part[0].slice(1, -1)).join("");
		if (text.toLowerCase().includes(treeCommand) && !new RegExp(`\\b${treeCommand}`, "i").test(match[0])) add(match.index, match[0]);
	}
	const commandName = new RegExp(`\\b${["TASK", "KILL_COMMAND"].join("")}\\b`, "g");
	for (const match of source.matchAll(commandName)) add(match.index, match[0]);
	const shell = new RegExp(`(?:/bin/${bareCall}\\b|\\b${bareCall}\\s+(?:-(?:[0-9]+|[A-Z]+)\\b|[0-9]+\\b|["']?\\$)|\\b${["p" + bareCall, bareCall + "all", "Stop" + "-Process"].join("|")}\\b)`, "gi");
	for (const match of source.matchAll(shell)) add(match.index, match[0]);
	const shellConcat = new RegExp(`["'\x60]${bareCall}\\s+["'\x60]\\s*\\+`, "gi");
	for (const match of source.matchAll(shellConcat)) add(match.index, match[0]);
	const dotNet = new RegExp(`\\.${"Ki" + "ll"}\\s*\\(`, "g");
	for (const match of source.matchAll(dotNet)) add(match.index, match[0]);
	const spawned = new RegExp(`\\b(?:spawn(?:Sync)?|exec(?:File)?(?:Sync)?)\\s*\\(\\s*(["'])${bareCall}\\1`, "g");
	for (const match of source.matchAll(spawned)) add(match.index, match[0]);
	return hits.sort((a, b) => a.index - b.index);
}

function scanProblems(root, allowlist = allowedSites) {
	const problems = [], seen = new Set();
	for (const file of testSources(root)) {
		if (file === "packages/nana-pack/tests/process-tree-helper.mjs") continue;
		const source = fs.readFileSync(path.join(root, file), "utf8");
		for (const hit of signalSites(source)) {
			const lineStart = source.lastIndexOf("\n", hit.index - 1) + 1;
			const lineEnd = source.indexOf("\n", hit.index);
			const lineText = source.slice(lineStart, lineEnd < 0 ? source.length : lineEnd);
			const allowed = allowlist.find(entry => !seen.has(entry) && entry.file === file && entry.text === hit.text
				&& (!entry.context || lineText.includes(entry.context)));
			if (allowed) { seen.add(allowed); continue; }
			const line = source.slice(0, hit.index).split("\n").length;
			problems.push(`${file}:${line}:${hit.text}`);
		}
	}
	for (const entry of allowlist) if (!seen.has(entry)) problems.push(`${entry.file}: allowed signal no longer occurs: ${entry.text} (${entry.reason})`);
	return problems;
}

// req: R-4371
await check("R-4371: test-kill scan rejects unowned signals and stale exceptions", () => {
	const scratch = tmpDir(path.join(os.tmpdir(), "test-kill-scan-"));
	const file = "packages/probe/tests/route.mjs";
	try {
		fs.mkdirSync(path.dirname(path.join(scratch, file)), { recursive: true });
		const treePath = "../lib/process-tree.mjs";
		const routes = [
			`spawn("prefix ${treeCommand}.exe /T")`,
			`exec(\`prefix ${treeCommand} /T\`)`,
			`spawn("${treeCommand.slice(0, 2)}" + "${treeCommand.slice(2)}.exe")`,
			`spawn(${["TASK", "KILL_COMMAND"].join("")})`,
			`import * as tree from "${treePath}";`,
			`const tree = await import("${treePath}");`,
			`const tree = require("${treePath}");`,
			`${signalCall}.call(process, 42, "SIGKILL")`,
			`process?.${bareCall}(42, "SIGKILL")`,
			`process[\`${bareCall}\`](42, "SIGKILL")`,
			`const { ${bareCall}: stop } = process; stop(42);`,
			`exec("${bareCall} " + pid)`,
			`spawnSync("${treeCommand}.exe", [])`,
			`spawnSync("${treeCommand.toUpperCase()}", [])`,
			`${signalCall}.apply(process, [42, "SIGKILL"])`,
			`process["${bareCall}"](42, "SIGKILL")`,
			`const stop = ${signalCall}; stop(42, "SIGKILL")`,
			`exec('${bareCall} 42')`, `exec('${bareCall} "$pid"')`,
			`exec('/bin/${bareCall} 42')`, `exec('Get-Process -Id 42 | % { $_.${"Ki" + "ll"}(42) }')`,
			`import { ${"kill" + "ProcessTree"} as stop } from "${treePath}"; stop(42);`,
		];
		for (const route of routes) for (const ending of ["\n", "\r\n", " \t\n", ""]) {
			fs.writeFileSync(path.join(scratch, file), `// fixture's route${ending || "\n"}${route}${ending}`);
			const hits = scanProblems(scratch, []);
			assert.ok(hits.length > 0 && hits.every(hit => hit.startsWith(`${file}:2:`)), `missed route: ${route}`);
		}
		const text = `${signalCall}(42, "SIGKILL")`;
		const exception = [{ file, text, reason: "scratch owned call" }];
		fs.writeFileSync(path.join(scratch, file), text);
		assert.deepEqual(scanProblems(scratch, exception), []);
		fs.writeFileSync(path.join(scratch, file), `${text};\n${text}`);
		assert.equal(scanProblems(scratch, exception).length, 1, "one exception must not cover two occurrences");
		fs.writeFileSync(path.join(scratch, file), "");
		assert.equal(scanProblems(scratch, exception).length, 1, "stale exception must fail");
	} finally { fs.rmSync(scratch, { recursive: true, force: true }); }
	const root = fileURLToPath(new URL("../../../", import.meta.url));
	const problems = scanProblems(root);
	assert.deepEqual(problems, [], `${problems.length} unowned or stale signal calls\n${problems.join("\n")}`);
});
