/**
 * @module packages/nana-setup/tests/shared-link-state.test.mjs
 * @purpose Pins sharedLinkState's no-error contract: a readlink failure on a confirmed symlink reads as "absent", never throws — proven both as a deterministic unit check and as a true base reproduction of the original race
 * @inputs lib/project-key.mjs sharedLinkState, a throwaway home, an injected readlinkSync failure (the seam sharedLinkState's 4th arg adds), and — for the true reproduction — a global spy on fs.lstatSync installed via require('fs') + syncBuiltinESMExports()
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a throwaway home, real project memory dirs and real symlinks, removed on exit); process-global (lstatSync is monkeypatched and restored within a single synchronous call, via node:module's syncBuiltinESMExports)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: project-key.mjs's own header says "@errors none — a missing or unreadable link reads
// as 'absent'" (line 11). lstat failures were caught; readlinkSync failures were not (claim,
// pi-1.0-2026-10-04 review) — a symlink that disappears between the two calls, or one that
// cannot be read for any other reason, threw past that contract and crashed doctor.
//
// Correction (astra r1 SHOULD, 2026-10-04): an earlier version of this file claimed Node's ESM
// `import * as fs from "node:fs"` binding is frozen and cannot be reached from outside the
// module. That is false — mutating the CommonJS `require("fs")` exports object and then calling
// `syncBuiltinESMExports()` (node:module) re-syncs the ESM binding every consumer, including
// project-key.mjs, reads through. The section below uses exactly that to reproduce the ORIGINAL
// bug for real: the real native readlinkSync throwing after a real lstatSync, with no seam and
// no injected argument — the genuine base-vs-branch difference, not a stand-in for it.
//
// The OTHER section (the injected 4th-argument test) is kept as a narrower, fully deterministic
// unit check of the catch branch itself — astra r1 ruled the seam reasonable to keep, consistent
// with install.test.mjs's `afterTempWrite` precedent for this package. It is not, on its own, a
// reproduction against the true base commit (ae15067): that commit's 3-argument function simply
// ignores a 4th call argument and reads the real, healthy link, so running this test's injected
// scenario against ae15067 returns "linked", not a throw. The TRUE reproduction below is the one
// that actually discriminates base from branch.
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
 *
 * Patch installation AND the first syncBuiltinESMExports() call live INSIDE the protected try
 * (astra r2 MUST 1): if that sync call itself throws — e.g. because something else on the
 * process installed a throwing getter on an unrelated fs export — `finally` still runs and
 * still restores the CJS binding, rather than leaking the spy because the throw happened
 * before a try block existed to catch it.
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

/* --- setup-failure regression (astra r2 MUST 1): if syncBuiltinESMExports() itself throws, --
   neither the CJS nor the ESM lstatSync binding may leak the spy ------------------------------ */
{
	const originalLstatSync = fsCjs.lstatSync;
	const statSyncDescriptor = Object.getOwnPropertyDescriptor(fsCjs, "statSync");
	Object.defineProperty(fsCjs, "statSync", {
		configurable: true,
		get() {
			throw new Error("other builtin spy getter");
		},
	});

	let threw = false;
	try {
		withLinkDeletedRightAfterLstat("/nonexistent-path-never-reached", () => {});
	} catch {
		threw = true;
	}
	check("setup-failure: syncBuiltinESMExports threw as expected (the hostile getter is still installed)", threw);
	check("setup-failure: the CJS lstatSync binding did not leak the spy", fsCjs.lstatSync === originalLstatSync);
	check("setup-failure: the ESM lstatSync binding did not leak the spy", fs.lstatSync === originalLstatSync);

	Object.defineProperty(fsCjs, "statSync", statSyncDescriptor);
	syncBuiltinESMExports(); // the hostile getter is gone now — this call is expected to succeed
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

/* --- deterministic unit check of the catch branch, via the injected seam --------------------- */
{
	const projectPath = path.join(home, "seam-project");
	const memDir = projectMemoryDir(projectsDir, projectPath);
	fs.mkdirSync(memDir, { recursive: true });
	fs.symlinkSync(sharedMemoryDir, path.join(memDir, "shared"));

	function readlinkFailureIsAbsent() {
		try {
			return (
				sharedLinkState(projectsDir, projectPath, sharedMemoryDir, {
					readlinkSync: () => {
						throw Object.assign(new Error("ENOENT: injected — simulates the link vanishing between lstat and readlink"), { code: "ENOENT" });
					},
				}) === "absent"
			);
		} catch {
			return false; // the current (pre-fix) code throws past this point — that is the bug
		}
	}
	// req: R-377
	check("deterministic unit check (injected seam): a readlink failure on a confirmed symlink reads 'absent', not a throw", readlinkFailureIsAbsent());
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
	check("TRUE reproduction (no seam, real fs): the link vanishing between lstat and readlink does not throw", !threw);
	// req: R-377
	check("... and the real production call (no injected argument) returns 'absent'", value === "absent");
}

fs.rmSync(home, { recursive: true, force: true });
process.exit(fails);
