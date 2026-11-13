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
