/**
 * @module packages/nana-pack/tests/lane-watcher.test.mjs
 * @purpose Pin conservative lane-lock release when a hard-kill watcher cannot prove the recorded builder is gone.
 * @inputs lane-watcher's exported core and OS-temp lane folders and locks
 * @outputs one requirement-tagged PASS/FAIL check
 * @effects disk (OS-temp fixtures)
 * @errors a missing module or failed assertion prints the named failure and exits nonzero
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import { tmpDir } from "./tmp-dir.mjs";

const CASE_LIMIT_MS = 5_000; // test-only: bounds each injected cleanup case.
const ROOT = tmpDir(path.join(os.tmpdir(), "lane-watcher-test-"));
let failures = 0;
const check = (title, ok, detail = "") => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
	if (!ok) failures++;
};
const bounded = (promise) => Promise.race([
	promise,
	new Promise((_, reject) => setTimeout(() => reject(new Error(`case exceeded ${CASE_LIMIT_MS} ms`)), CASE_LIMIT_MS)),
]);

let cleanLane;
let loadError = null;
try { ({ cleanLane } = await import("../lib/lane-watcher.mjs")); }
catch (error) { loadError = error; }

const observations = [];
if (cleanLane) {
	for (const item of [
		{ name: "darwin survivor", platform: "darwin", launch: "direct", alive: true, waitForExit: false, keepsLock: true },
		{ name: "win32 cmd gone", platform: "win32", launch: "cmd", alive: false, waitForExit: true, keepsLock: true },
		{ name: "win32 direct gone", platform: "win32", launch: "direct", alive: false, waitForExit: true, keepsLock: false },
	]) {
		const folder = path.join(ROOT, item.name.replaceAll(" ", "-"));
		const lock = `${folder}.lock`;
		fs.mkdirSync(folder, { recursive: true });
		fs.writeFileSync(path.join(folder, "builder.pid"), JSON.stringify({ pid: 77, launch: item.launch }));
		fs.writeFileSync(path.join(folder, "builder-settings.json"), "secret");
		fs.writeFileSync(path.join(folder, "builder-prompt.md"), "prompt");
		fs.writeFileSync(lock, "66\n");
		let kills = 0;
		try {
			await bounded(cleanLane({ folder, lock, workerPid: 66, build: "missing", commonDir: ROOT }, {
				platform: item.platform,
				alive: (pid) => pid === 77 && item.alive,
				processStartedAt: () => new Date(0),
				killTree: () => { kills++; return true; },
				waitForExit: async () => item.waitForExit,
			}));
			observations.push({ name: item.name, folderGone: !fs.existsSync(folder), lock: fs.existsSync(lock) ? fs.readFileSync(lock, "utf8") : null, kills });
		} catch (error) {
			observations.push({ name: item.name, error: error?.stack ?? String(error) });
		}
	}
}

// req: R-2727
check("R-2727: a watcher whose recorded builder still runs after the stop wait, or whose Windows builder ran through cmd.exe, keeps the lane lock and removes the temp files",
	!loadError && observations.length === 3 && observations.every((item, index) => item.folderGone && (item.lock === "66\n") === [true, true, false][index]) && observations[0]?.kills === 1 && observations[1]?.kills === 0 && observations[2]?.kills === 0,
	JSON.stringify({ loadError: loadError?.message, observations }));

console.log(failures ? `${failures} FAILED` : "all passed");
process.exit(failures ? 1 : 0);
