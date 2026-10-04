/**
 * @module packages/nana-setup/tests/shared-link-state.test.mjs
 * @purpose Pins sharedLinkState's no-error contract: a readlink failure on a confirmed symlink reads as "absent", never throws
 * @inputs lib/project-key.mjs sharedLinkState, a throwaway home, and an injected readlinkSync failure (the test seam sharedLinkState's 4th arg adds for exactly this)
 * @outputs PASS/FAIL lines per check on stdout, and exit 1 when any check fails
 * @effects disk (a throwaway home, a real project memory dir and a real symlink, removed on exit)
 * @errors a failed check prints FAIL with the observed value and the run exits 1; an unexpected throw propagates and fails the run
 */
// Gate: project-key.mjs's own header says "@errors none — a missing or unreadable link reads
// as 'absent'" (line 11). lstat failures were caught; readlinkSync failures were not (claim,
// pi-1.0-2026-10-04 review) — a symlink that disappears between the two calls, or one that
// cannot be read for any other reason, threw past that contract and crashed doctor.
//
// Node's ESM `import * as fs from "node:fs"` namespace is frozen (verified: neither
// reassignment nor Object.defineProperty nor mutating the CJS exports object through
// createRequire reaches it), so there is no way to force a readlink failure on the module's
// OWN fs binding from outside it. The fix adds a 4th, optional readlinkSync parameter
// (defaulting to the real fs.readlinkSync — no production caller passes it) purely as a test
// seam, matching nana-standards' "inject resources with side effects at the module boundary".
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const { sharedLinkState, projectMemoryDir } = await import(new URL("../lib/project-key.mjs", import.meta.url).href);

let fails = 0;
const check = (n, ok, extra) => {
	console.log(ok ? "PASS" : "FAIL", n, ok ? "" : extra ?? "");
	if (!ok) fails++;
};

const home = fs.mkdtempSync(path.join(os.tmpdir(), "nana-shared-link-state-"));
const projectsDir = path.join(home, ".claude", "projects");
const sharedMemoryDir = path.join(home, ".claude", "nana-memory", "shared");
const projectPath = path.join(home, "some-project");
const memDir = projectMemoryDir(projectsDir, projectPath);
fs.mkdirSync(memDir, { recursive: true });
fs.mkdirSync(sharedMemoryDir, { recursive: true });
const link = path.join(memDir, "shared");
fs.symlinkSync(sharedMemoryDir, link);

check("baseline: a real, readable, correctly-targeted symlink reads 'linked'", sharedLinkState(projectsDir, projectPath, sharedMemoryDir) === "linked");

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
check("a readlink failure on a confirmed symlink reads 'absent', not a throw", readlinkFailureIsAbsent());

fs.rmSync(home, { recursive: true, force: true });
process.exit(fails);
