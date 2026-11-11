/**
 * @module packages/nana-setup/tests/shared-link-state.test.mjs
 * @purpose Pins sharedLinkState's no-error contract: a readlink failure on a confirmed symlink reads as "absent", never throws — proven as a true base reproduction of the original race
 * @inputs lib/project-key.mjs sharedLinkState, a throwaway home and a global spy on fs.lstatSync installed via require('fs') + syncBuiltinESMExports()
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a throwaway home, real project memory dirs and real symlinks, removed on exit); process-global (lstatSync is monkeypatched and restored within a single synchronous call, via node:module's syncBuiltinESMExports)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Reproduce the link disappearing between real lstat and readlink calls.
// Sync the CommonJS fs patch into ESM and restore it after the production call.
import { tmpDir } from "./tmp-dir.mjs";
import { createRequire } from "node:module";
import { syncBuiltinESMExports } from "node:module";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { sharedLinkState, projectMemoryDir } = await import(new URL("../lib/project-key.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const require = createRequire(import.meta.url);
const fsCjs = require("fs");

/**
 * Let the REAL lstatSync run on `targetPath` and capture its genuine result, then delete
 * `targetPath` before returning it — so the very next readlinkSync on that path hits a real
 * ENOENT, the same as if another process had removed the link between the two syscalls. No
 * seam, no injected argument: this patches the actual fs.lstatSync every module (including
 * project-key.mjs) calls. Restored immediately after, success or throw.
 */
function withLinkDeletedRightAfterLstat(targetPath, fn) {
	let origLstat;
	try {
		origLstat = fsCjs.lstatSync;
		let armed = true;
		fsCjs.lstatSync = (...args) => {
			const result = origLstat.apply(fsCjs, args);
			if (armed && args[0] === targetPath) {
				armed = false;
				fsCjs.unlinkSync(targetPath);
			}
			return result;
		};
		syncBuiltinESMExports();
		return fn();
	} finally {
		fsCjs.lstatSync = origLstat;
		syncBuiltinESMExports();
	}
}

const home = tmpDir(path.join(os.tmpdir(), "nana-shared-link-state-"));
const projectsDir = path.join(home, ".claude", "projects");
const sharedMemoryDir = path.join(home, ".claude", "nana-memory", "shared");
fs.mkdirSync(sharedMemoryDir, { recursive: true });

/* --- baseline: a real, readable, correctly-targeted symlink reads 'linked' ------------------- */
{
	const projectPath = path.join(home, "some-project");
	const memDir = projectMemoryDir(projectsDir, projectPath);
	fs.mkdirSync(memDir, { recursive: true });
	const link = path.join(memDir, "shared");
	fs.symlinkSync(sharedMemoryDir, link);
	check("baseline: a real, readable, correctly-targeted symlink reads 'linked'", sharedLinkState(projectsDir, projectPath, sharedMemoryDir) === "linked");
}

/* --- TRUE base reproduction: the real production call, no seam, the link genuinely vanishes -- */
{
	const projectPath = path.join(home, "true-repro-project");
	const memDir = projectMemoryDir(projectsDir, projectPath);
	fs.mkdirSync(memDir, { recursive: true });
	const link = path.join(memDir, "shared");
	fs.symlinkSync(sharedMemoryDir, link);

	let threw = false;
	let value;
	try {
		value = withLinkDeletedRightAfterLstat(link, () => sharedLinkState(projectsDir, projectPath, sharedMemoryDir));
	} catch {
		threw = true;
	}
	// req: R-377
	check("TRUE reproduction (no seam, real fs): the link vanishing between lstat and readlink does not throw", !threw && value === "absent");
}

fs.rmSync(home, { recursive: true, force: true });
process.exit(fails);
