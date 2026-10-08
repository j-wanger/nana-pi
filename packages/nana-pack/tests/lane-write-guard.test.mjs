/**
 * @module packages/nana-pack/tests/lane-write-guard.test.mjs
 * @purpose Pins the opt-in lane write boundary across traversal, symlink, missing-target, and unset-root cases.
 * @inputs nana-gate, temporary worktree and outside directories
 * @outputs named PASS/FAIL checks
 * @effects disk (OS temp fixtures), process (environment)
 * @errors failed assertions exit nonzero
 */
import { tmpDir } from "./tmp-dir.mjs";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const worktree = fs.realpathSync(tmpDir(path.join(os.tmpdir(), "lane-root-")));
const outside = fs.realpathSync(repoRoot);
const link = path.join(worktree, "escape"); fs.symlinkSync(outside, link, "dir");
process.env.HOME = worktree; process.env.USERPROFILE = worktree;
const ext = (await import("../extensions/nana-gate.ts")).default;
let handler; ext({ on: (event, fn) => { if (event === "tool_call") handler = fn; } });
const ctx = { cwd: worktree, hasUI: false };
const call = async (toolName, target) => (await handler({ toolName, input: toolName === "bash" ? { command: target } : { path: target } }, ctx))?.block === true;
const check = (title, ok) => { console.log(ok ? "PASS" : "FAIL", title); if (!ok) process.exitCode = 1; };
process.env.NANA_WORKTREE_ROOT = worktree;
// req: R-962
check("parent traversal outside lane is blocked", await call("write", `${path.relative(worktree, outside)}/not-created/deep/file.txt`));
// req: R-962
check("symlink escape outside lane is blocked", await call("edit", "escape/not-created/deep/file.txt"));
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
