/**
 * @module packages/nana-pack/tests/lane-write-guard.test.mjs
 * @purpose Pins the opt-in lane write boundary across traversal, symlink, missing-target, and unset-root cases.
 * @inputs nana-gate, temporary worktree and outside directories
 * @outputs named PASS/FAIL/SKIP checks
 * @effects disk (fixtures under home, OS temp or /var/tmp), process (environment)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
const worktree = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "lane-root-")));
const contained = (parent, child) => { const rel = path.relative(parent, child); return rel === "" || (!rel.startsWith(`..${path.sep}`) && rel !== ".."); };
const tempRoot = fs.realpathSync(os.tmpdir()), tmpAlias = process.platform === "win32" ? tempRoot : fs.realpathSync("/tmp");
// chosen: the runner's HOME sits under /tmp on Linux, and /var/tmp is outside both permitted temp roots.
const OUTSIDE_FIXTURE_PARENTS = process.platform === "win32" ? [os.homedir()] : [os.homedir(), "/var/tmp"];
const outsideSkipReason = "no writable fixture parent outside the lane and both permitted temp roots";
let outside = null;
for (const parent of OUTSIDE_FIXTURE_PARENTS) {
	let real;
	try { real = fs.realpathSync(parent); } catch { continue; }
	if ([worktree, tempRoot, tmpAlias].some((root) => contained(root, real))) continue;
	try {
		const base = tmpDir(path.join(real, "lane-guard-outside-"));
		const candidate = path.join(base, "outside");
		fs.mkdirSync(candidate);
		outside = candidate;
		break;
	} catch { continue; }
}
const outsideAvailable = outside !== null;
if (!outsideAvailable) outside = path.join(os.homedir(), "lane-guard-missing", "outside");
const link = path.join(worktree, "escape"); fs.symlinkSync(outside, link, "dir");
const dangling = path.join(worktree, "dangling-outside"); fs.symlinkSync(path.join(outside, "missing-file"), dangling);
const loopA = path.join(worktree, "loop-a"), loopB = path.join(worktree, "loop-b");
fs.symlinkSync(loopB, loopA); fs.symlinkSync(loopA, loopB);
process.env.HOME = worktree; process.env.USERPROFILE = worktree;
const ext = (await import("../extensions/nana-gate.ts")).default;
let handler; ext({ on: (event, fn) => { if (event === "tool_call") handler = fn; } });
const ctx = { cwd: worktree, hasUI: false };
const call = async (toolName, target) => (await handler({ toolName, input: toolName === "bash" ? { command: target } : { path: target } }, ctx))?.block === true;
const check = (title, ok, skip = null) => {
	if (skip !== null) { console.log(`SKIP ${title}: ${skip}`); return; }
	console.log(ok ? "PASS" : "FAIL", title);
	if (!ok) process.exitCode = 1;
};
process.env.NANA_WORKTREE_ROOT = worktree;
// req: R-962
check("parent traversal outside lane is blocked", outsideAvailable && await call("write", path.relative(worktree, path.join(outside, "not-created/deep/file.txt"))), outsideAvailable ? null : outsideSkipReason);
// req: R-962
check("symlink escape outside lane is blocked", outsideAvailable && await call("edit", "escape/not-created/deep/file.txt"), outsideAvailable ? null : outsideSkipReason);
// req: R-962
check("dangling in-lane symlink to missing outside target is blocked", await call("write", "dangling-outside"));
// req: R-962
check("symlink loop is blocked", await call("edit", "loop-a"));
// req: R-962
check("temporary output remains allowed", !(await call("write", path.join(os.tmpdir(), "nana-lane-safe.txt"))));
// req: R-962
check("bash writes stay explicitly outside this gate guard", !(await call("bash", "printf x > ../outside.txt")));
process.env.NANA_WORKTREE_ROOT = "";
// req: R-962
check("empty worktree root changes no existing path decision", !(await call("write", "../outside-unset.txt")));
delete process.env.NANA_WORKTREE_ROOT;
// req: R-962
check("unset worktree root leaves outside edit behavior unchanged", !(await call("edit", "../outside-unset-again.txt")));
// req: R-962
check("ordinary sessions leave an unresolvable symlink target unchanged", !(await call("edit", "dangling-outside")));
