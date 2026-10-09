/**
 * @module packages/nana-pack/tests/pi-install.mjs
 * @purpose Resolve the real installed pi package consistently for pack tests.
 * @inputs DESK_PI_ROOT, npm global-root discovery, and the pi executable on PATH.
 * @outputs The validated @earendil-works/pi-coding-agent package root.
 * @effects process (runs npm or PATH lookup commands), disk (reads package metadata).
 * @errors Throws an Error naming each candidate that could not be resolved.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

const PACKAGE_NAME = "@earendil-works/pi-coding-agent";
const packageAt = (dir) => {
	try {
		return JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")).name === PACKAGE_NAME;
	} catch { return false; }
};

/** Find and validate the pi package, treating DESK_PI_ROOT as an exclusive override. */
export function findPiRoot() {
	const tried = [];
	if (process.env.DESK_PI_ROOT) {
		const dir = path.resolve(process.env.DESK_PI_ROOT);
		tried.push(`DESK_PI_ROOT=${dir}`);
		if (packageAt(dir)) return dir;
		throw new Error(`pi package not found at ${tried.join("; ")}`);
	}
	const npm = spawnSync("npm", ["root", "-g"], { encoding: "utf8", windowsHide: true });
	const globalRoot = npm.status === 0 ? npm.stdout.trim() : "";
	const globalPackage = globalRoot ? path.join(globalRoot, "@earendil-works", "pi-coding-agent") : "";
	tried.push(`npm root -g${globalPackage ? ` -> ${globalPackage}` : ` (unavailable${npm.error ? `: ${npm.error.message}` : ""})`}`);
	if (globalPackage && packageAt(globalPackage)) return globalPackage;
	const lookup = process.platform === "win32"
		? spawnSync("where", ["pi"], { encoding: "utf8", windowsHide: true })
		: spawnSync("sh", ["-c", "command -v pi"], { encoding: "utf8", windowsHide: true });
	const executable = lookup.status === 0 ? lookup.stdout.trim().split(/\r?\n/)[0] : "";
	let resolved = "";
	try { if (executable) resolved = fs.realpathSync(executable); } catch {}
	tried.push(`realpath of pi on PATH${resolved ? ` -> ${resolved}` : " (unavailable)"}`);
	for (let dir = resolved ? path.dirname(resolved) : ""; dir; dir = path.dirname(dir)) {
		if (packageAt(dir)) return dir;
		const parent = path.dirname(dir);
		if (parent === dir) break;
	}
	throw new Error(`pi package not found; locations tried: ${tried.join("; ")}`);
}
