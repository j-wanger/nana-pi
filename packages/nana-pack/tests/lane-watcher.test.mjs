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

const r2726Folder = path.join(ROOT, "r2726-repeated-hour");
const r2726Lock = `${r2726Folder}.lock`;
fs.mkdirSync(r2726Folder, { recursive: true });
fs.writeFileSync(path.join(r2726Folder, "builder.pid"), JSON.stringify({ pid: 77, launch: "direct" }));
fs.writeFileSync(r2726Lock, "66\n");
const r2726Now = Date.parse("2026-11-01T06:30:00.000Z");
const r2726RecordAt = Date.parse("2026-11-01T05:50:00.000Z");
fs.utimesSync(path.join(r2726Folder, "builder.pid"), r2726RecordAt / 1000, r2726RecordAt / 1000);
let r2726Kills = 0;
let r2726PsArgs = null;
const r2726ElapsedCases = [
	{ output: "30:00\n", elapsedMs: 30 * 60_000 },
	{ output: "00:30:00\n", elapsedMs: 30 * 60_000 },
	{ output: "1-00:30:00\n", elapsedMs: 24 * 60 * 60_000 + 30 * 60_000 },
];
const r2726ElapsedResults = [];
const priorTz = process.env.TZ;
process.env.TZ = "America/New_York";
try {
	if (cleanLane) await bounded(cleanLane({ folder: r2726Folder, lock: r2726Lock, workerPid: 66, build: "missing", commonDir: ROOT }, {
		platform: "darwin",
		alive: (pid) => pid === 77,
		now: () => r2726Now,
		run: (_command, args) => {
			r2726PsArgs = args;
			return { status: 0, stdout: args.includes("etime=") ? "00:30:00\n" : "Sun Nov  1 01:00:00 2026\n" };
		},
		killTree: () => { r2726Kills++; return true; },
		waitForExit: async () => false,
	}));
	for (const [index, item] of r2726ElapsedCases.entries()) {
		const folder = path.join(ROOT, `r2726-etime-${index}`);
		const lock = `${folder}.lock`;
		fs.mkdirSync(folder, { recursive: true });
		const pidFile = path.join(folder, "builder.pid");
		fs.writeFileSync(pidFile, JSON.stringify({ pid: 77, launch: "direct" }));
		fs.writeFileSync(lock, "66\n");
		const recordedAt = r2726Now - item.elapsedMs - 10 * 60_000;
		fs.utimesSync(pidFile, recordedAt / 1000, recordedAt / 1000);
		let kills = 0;
		await bounded(cleanLane({ folder, lock, workerPid: 66, build: "missing", commonDir: ROOT }, {
			platform: "darwin", alive: (pid) => pid === 77, now: () => r2726Now,
			run: (_command, args) => ({ status: 0, stdout: args.includes("etime=") ? item.output : "" }),
			killTree: () => { kills++; return true; }, waitForExit: async () => false,
		}));
		const olderFolder = path.join(ROOT, `r2726-etime-older-${index}`);
		const olderLock = `${olderFolder}.lock`;
		fs.mkdirSync(olderFolder, { recursive: true });
		const olderPidFile = path.join(olderFolder, "builder.pid");
		fs.writeFileSync(olderPidFile, JSON.stringify({ pid: 77, launch: "direct" }));
		fs.writeFileSync(olderLock, "66\n");
		const olderRecordAt = r2726Now - item.elapsedMs + 10 * 60_000;
		fs.utimesSync(olderPidFile, olderRecordAt / 1000, olderRecordAt / 1000);
		let olderKills = 0;
		await bounded(cleanLane({ folder: olderFolder, lock: olderLock, workerPid: 66, build: "missing", commonDir: ROOT }, {
			platform: "darwin", alive: (pid) => pid === 77, now: () => r2726Now,
			run: (_command, args) => ({ status: 0, stdout: args.includes("etime=") ? item.output : "" }),
			killTree: () => { olderKills++; return true; }, waitForExit: async () => false,
		}));
		r2726ElapsedResults.push({ output: item.output.trim(), kills, lock: fs.existsSync(lock), olderKills, olderLock: fs.existsSync(olderLock) });
	}
} finally {
	if (priorTz === undefined) delete process.env.TZ;
	else process.env.TZ = priorTz;
}
// req: R-2726
check("R-2726: in the repeated local hour, etime and the injected clock show a builder started after its record, so the watcher does not signal it",
	!loadError && r2726Kills === 0 && r2726PsArgs?.includes("etime=") && fs.existsSync(r2726Lock) && r2726ElapsedResults.length === r2726ElapsedCases.length && r2726ElapsedResults.every((item) => item.kills === 0 && item.lock && item.olderKills === 1 && item.olderLock),
	JSON.stringify({ loadError: loadError?.message, kills: r2726Kills, args: r2726PsArgs, lock: fs.existsSync(r2726Lock), elapsed: r2726ElapsedResults }));

// req: R-2727
check("R-2727: a watcher whose recorded builder still runs after the stop wait, or whose Windows builder ran through cmd.exe, keeps the lane lock and removes the temp files",
	!loadError && observations.length === 3 && observations.every((item, index) => item.folderGone && (item.lock === "66\n") === [true, true, false][index]) && observations[0]?.kills === 1 && observations[1]?.kills === 0 && observations[2]?.kills === 0,
	JSON.stringify({ loadError: loadError?.message, observations }));

console.log(failures ? `${failures} FAILED` : "all passed");
process.exit(failures ? 1 : 0);
