/**
 * @module packages/nana-knowledge/tests/unreadable-root.test.mjs
 * @purpose Pin that unreadable roots and folders retain indexed rows and are reported by build and status.
 * @inputs Temporary article roots, POSIX modes or Windows deny ACLs, and the knowledge build and CLI modules.
 * @outputs PASS/FAIL/SKIP lines for unreadable and missing path behavior, with exit 1 when a check fails.
 * @effects disk (temporary roots and index), database (temporary SQLite index), process (spawns the CLI and sets test homes).
 * @errors A failed check prints FAIL; unsupported permission denial prints declared SKIPs; unexpected errors fail the run.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";

const td = tmpDir(path.join(os.tmpdir(), "nk-unreadable-"));
const profile = path.join(td, "profile");
const home = path.join(td, "knowledge-home");
const rootA = path.join(td, "a");
const rootB = path.join(td, "b");
const locked = path.join(rootB, "locked");
const keep = path.join(rootB, "keep");
const missing = path.join(td, "missing");
fs.mkdirSync(profile, { recursive: true });
fs.mkdirSync(rootA, { recursive: true });
fs.mkdirSync(locked, { recursive: true });
fs.mkdirSync(keep, { recursive: true });
process.env.HOME = profile;
process.env.USERPROFILE = profile;
process.env.NANA_KNOWLEDGE_HOME = home;

fs.mkdirSync(home, { recursive: true });
fs.writeFileSync(path.join(rootA, "one.md"), "# Root kept\nrootkeepsignal\n");
fs.writeFileSync(path.join(keep, "two.md"), "# Visible kept\nvisiblekeepsignal\n");
fs.writeFileSync(path.join(locked, "three.md"), "# Folder kept\nfolderkeepsignal\n");
const gone = path.join(rootB, "gone.md");
fs.writeFileSync(gone, "# Deleted\ndeletedpurgesignal\n");
fs.writeFileSync(path.join(home, "sources.json"), JSON.stringify({
	roots: [
		{ path: rootA, kind: "articles" },
		{ path: rootB, kind: "articles" },
		{ path: missing, kind: "articles" },
	],
}));

const { build } = await import(new URL("../lib/build.ts", import.meta.url).href);
const { openDb } = await import(new URL("../lib/db.ts", import.meta.url).href);
const { search } = await import(new URL("../lib/query.ts", import.meta.url).href);

async function within(promise, label) {
	let timer;
	try {
		return await Promise.race([
			promise,
			new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label} timed out`)), 10_000); }),
		]);
	} finally {
		clearTimeout(timer);
	}
}

await within(build(), "initial build");
fs.rmSync(gone);

function deny(dir) {
	if (process.platform === "win32") {
		const result = spawnSync("icacls", [dir, "/deny", "*S-1-1-0:(RD)"], { encoding: "utf8" });
		return result.status === 0 ? null : `icacls deny failed for ${dir}: ${result.stderr || result.stdout || result.error?.message || `exit ${result.status}`}`;
	}
	try { fs.chmodSync(dir, 0o000); return null; }
	catch (err) { return `chmod failed for ${dir}: ${err instanceof Error ? err.message : String(err)}`; }
}

function denialProbe(dir) {
	try { fs.statSync(dir); }
	catch (err) { return `stat failed for ${dir}: ${err instanceof Error ? err.message : String(err)}`; }
	try { fs.readdirSync(dir); return `readdir unexpectedly succeeded for ${dir}`; }
	catch { return null; }
}

function restore(dir) {
	if (process.platform === "win32") {
		spawnSync("icacls", [dir, "/remove:d", "*S-1-1-0"], { encoding: "utf8" });
		return;
	}
	try { fs.chmodSync(dir, 0o755); } catch { /* best effort for temp cleanup */ }
}

let buildRun;
let statusRun;
let denialReason = null;
try {
	const setupProblems = [deny(rootA), deny(locked)].filter(Boolean);
	const probeProblems = [denialProbe(rootA), denialProbe(locked)].filter(Boolean);
	denialReason = [...setupProblems, ...probeProblems].join("; ") || null;
	const cli = fileURLToPath(new URL("../bin/nana-knowledge.ts", import.meta.url));
	const options = { encoding: "utf8", env: { ...process.env, NODE_NO_WARNINGS: "1" }, timeout: 10_000 };
	buildRun = spawnSync(process.execPath, [cli, "build"], options);
	statusRun = spawnSync(process.execPath, [cli, "status"], options);

	const db = await within(openDb(path.join(home, "index.db"), {}), "open index after denied build");
	const rootRowsKept = search(db, "rootkeepsignal", 5).length === 1;
	const folderRowsKept = search(db, "folderkeepsignal", 5).length === 1;
	const deletedRowPurged = search(db, "deletedpurgesignal", 5).length === 0;
	db.close();
	const buildLines = buildRun.stdout.split(/\r?\n/);
	const statusLines = statusRun.stdout.split(/\r?\n/);
	const rootBuildLine = buildLines.find((line) => line.includes(rootA) && line.includes("UNREADABLE"));
	const folderBuildLine = buildLines.find((line) => line.includes(locked) && line.includes("UNREADABLE"));
	const rootStatusLine = statusLines.find((line) => line.endsWith(rootA));
	const missingBuildLine = buildLines.find((line) => line.includes(missing) && line.includes("MISSING"));
	const missingStatusLine = statusLines.find((line) => line.endsWith(missing));

	let fails = 0;
	const check = (name, ok, skipReason = null) => {
		if (skipReason) { console.log(`SKIP ${name} — ${skipReason}`); return; }
		console.log(ok ? "PASS" : "FAIL", name);
		if (!ok) fails++;
	};

	// req: R-1910
	check("R-1910: a root that exists but cannot be listed keeps its rows searchable", buildRun.status === 0 && rootRowsKept, denialReason);
	// req: R-1911
	check("R-1911: a folder that cannot be listed keeps its rows while a file deleted elsewhere under the root is purged", buildRun.status === 0 && folderRowsKept && deletedRowPurged, denialReason);
	// req: R-1912
	check("R-1912: build names an unlistable root and an unlistable folder UNREADABLE and exits 0", buildRun.status === 0 && rootBuildLine === `  ${rootA}  UNREADABLE (skipped, rows kept)` && folderBuildLine === `  ${locked}  UNREADABLE (skipped, rows kept)`, denialReason);
	// req: R-1913
	check("R-1913: status marks a root that cannot be listed UNREADABLE, not ok", statusRun.status === 0 && rootStatusLine?.includes("UNREADABLE") && !rootStatusLine?.includes("ok"), denialReason);
	// req: R-883
	check("R-883: build names a missing root MISSING and status marks it MISS, both exiting 0", buildRun.status === 0 && statusRun.status === 0 && missingBuildLine === `  ${missing}  MISSING (skipped, rows kept)` && missingStatusLine?.includes("MISS") && !missingStatusLine?.includes("ok"));

	process.exitCode = fails;
} finally {
	restore(rootA);
	restore(locked);
}
