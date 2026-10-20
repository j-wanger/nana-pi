/**
 * @module packages/nana-setup/tests/install-overlap.test.mjs
 * @purpose Prove one install holds its single settings lock through every shared, pi and PATH file step, while a competing install stops and the knowledge build runs after release.
 * @inputs lib/steps.mjs install, lib/paths.mjs resolveLayout, the nana-setup CLI, a throwaway home with one tiny knowledge source, and process-global spies installed through CommonJS builtins plus syncBuiltinESMExports
 * @outputs Four PASS/FAIL lines on stdout, observed overlap values on failure, and exit 1 when any check fails
 * @effects disk, process
 * @errors A failed contract check prints FAIL with its observations; unexpected setup errors are captured as the first install's throw so all four checks still report
 */
import { createRequire } from "node:module";
import { syncBuiltinESMExports } from "node:module";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const { resolveLayout } = await import(new URL("../lib/paths.mjs", import.meta.url).href);
const { install, KNOWLEDGE_CLI } = await import(new URL("../lib/steps.mjs", import.meta.url).href);
const { settingsLockPath } = await import(new URL("../lib/settings-lock.mjs", import.meta.url).href);

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const require = createRequire(import.meta.url);
const fsCjs = require("fs");
const childProcessCjs = require("child_process");

let fails = 0;
const check = (title, ok, observed) => {
	console.log(ok ? "PASS" : "FAIL", title, ok ? "" : JSON.stringify(observed));
	if (!ok) fails++;
};

const home = tmpDir(path.join(os.tmpdir(), "nana-marzipan-overlap-"));
const layout = resolveLayout({ home });
fs.mkdirSync(layout.knowledgeHome, { recursive: true });
const source = path.join(home, "quokka-notes");
fs.mkdirSync(source, { recursive: true });
fs.writeFileSync(path.join(source, "pebble.md"), "# Pebble\nA tiny made-up knowledge source.\n");
fs.writeFileSync(path.join(layout.knowledgeHome, "sources.json"), JSON.stringify({ roots: [{ path: source, kind: "articles" }] }));

const lock = settingsLockPath(layout.claudeSettings);
const laterTargets = [
	path.join(layout.sharedMemoryDir, "MEMORY.md"),
	layout.piPackConfig,
	layout.piObjective,
	layout.piRulings,
	layout.subagentConfig,
	layout.reviewerAgent,
	...(["pi-review", "pi-worker", "nana-land", "nana-setup"].map((name) => path.join(layout.binDir, name))),
].map((target) => path.resolve(target));
const targetLooks = new Map(laterTargets.map((target) => [target, []]));

const originalLstatSync = fsCjs.lstatSync;
const originalOpenSync = fsCjs.openSync;
const originalSpawnSync = childProcessCjs.spawnSync;
let lockOpenCount = 0;
let overlapWrapFired = false;
let knowledgeWrapFired = false;
let knowledgeLockPresent = null;
let second = null;
let firstResults = null;
let firstThrow = null;

try {
	fsCjs.openSync = (...args) => {
		if (path.resolve(String(args[0])) === path.resolve(lock)) lockOpenCount++;
		return originalOpenSync.apply(fsCjs, args);
	};
	fsCjs.lstatSync = (...args) => {
		let result;
		let error;
		try {
			result = originalLstatSync.apply(fsCjs, args);
		} catch (caught) {
			error = caught;
		}
		const lookedAt = path.resolve(String(args[0]));
		if (targetLooks.has(lookedAt)) targetLooks.get(lookedAt).push(fs.existsSync(lock));
		if (lookedAt === path.resolve(path.join(layout.binDir, "pi-review")) && !overlapWrapFired) {
			overlapWrapFired = true;
			second = originalSpawnSync(process.execPath, [cli, "install", "--home", home], {
				encoding: "utf8",
				env: { ...process.env, HOME: home, USERPROFILE: home },
			});
		}
		if (error) throw error;
		return result;
	};
	childProcessCjs.spawnSync = (...args) => {
		if (args[0] === process.execPath && Array.isArray(args[1]) && path.resolve(String(args[1][0])) === path.resolve(KNOWLEDGE_CLI) && args[1][1] === "build") {
			knowledgeWrapFired = true;
			knowledgeLockPresent = fs.existsSync(lock);
		}
		return originalSpawnSync.apply(childProcessCjs, args);
	};
	syncBuiltinESMExports();
	try {
		firstResults = install(layout);
	} catch (error) {
		firstThrow = error;
	}
} finally {
	fsCjs.lstatSync = originalLstatSync;
	fsCjs.openSync = originalOpenSync;
	childProcessCjs.spawnSync = originalSpawnSync;
	syncBuiltinESMExports();
}

const observations = () => ({
	overlapWrapFired,
	second: second && { status: second.status, stderr: second.stderr, stdout: second.stdout },
	firstThrow: firstThrow && { name: firstThrow.name, code: firstThrow.code, message: firstThrow.message },
	firstPathRows: firstResults?.filter((row) => row.label.startsWith("PATH ")),
	lockOpenCount,
	targetLooks: Object.fromEntries([...targetLooks].map(([target, looks]) => [path.relative(home, target), looks])),
	knowledgeWrapFired,
	knowledgeLockPresent,
});

// req: R-2260
check("R-2260: a second install started at the first install's PATH step exits 2 naming the held settings lock",
	overlapWrapFired && second?.status === 2 && second.stderr.includes(lock) && second.stderr.includes("locked by another nana-setup run"), observations());

const pathRows = firstResults?.filter((row) => ["PATH pi-review", "PATH pi-worker", "PATH nana-land", "PATH nana-setup"].includes(row.label));
// req: R-2261
check("R-2261: the first install finishes with no problem row and all four PATH rows created when a second install starts at its PATH step",
	overlapWrapFired && !firstThrow && !firstResults?.some((row) => row.status === "problem") && pathRows?.length === 4 && pathRows.every((row) => row.status === "created"), observations());

const everyTargetLookHeld = [...targetLooks.values()].every((looks) => looks.length > 0 && looks.every(Boolean));
// req: R-2262
check("R-2262: the settings lock, taken once, is present at every look of a shared memory, pi config, subagent, reviewer or PATH target",
	lockOpenCount > 0 && targetLooks.size === 10 && everyTargetLookHeld && lockOpenCount === 1, observations());

// req: R-2263
check("R-2263: the settings lock is gone when install starts the knowledge build",
	knowledgeWrapFired && knowledgeLockPresent === false, observations());

process.exitCode = fails;
