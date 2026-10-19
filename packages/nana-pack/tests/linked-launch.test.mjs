/**
 * @module packages/nana-pack/tests/linked-launch.test.mjs
 * @purpose Pin that five command entry points exit and print the same whether started by their
 *  real checkout path or through a symlinked or junctioned link to that checkout, so a detached
 *  checkout reached through the OS temp folder's own link (macOS /var, a reviewer's worktree)
 *  cannot read a silent exit 0 as a real pass.
 * @inputs scripts/requirements-moved.mjs, scripts/requirements-tree.mjs,
 *  scripts/requirement-rows.mjs, scripts/product-report.mjs and
 *  packages/nana-pack/bin/nana-roster.mjs, spawned by real path and through one link to the
 *  checkout root built under the OS temp directory.
 * @outputs PASS/FAIL lines for each marked assertion and a non-zero exit when any fails.
 * @effects disk (makes and removes one symlink/junction to the checkout root, inside its own
 *  mkdtemp folder; separate scratch directories under the OS temp directory for cwd, HOME and
 *  agent-dir fixtures), process (spawns node as a child, by real path and through the link)
 * @errors A failed check prints its reason and exits non-zero.
 */
import { spawnSync } from "node:child_process";
import { realpathSync, rmdirSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { tmpDirUnmanaged } from "./tmp-dir.mjs";

let fails = 0;
const check = (name, ok, why = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : why); if (!ok) fails++; };

// Required (must-meet.md, probed): a path under the OS temp folder is itself a link on macOS
// (/var -> /private/var), so the "direct" run must use the checkout's REAL path or it is silent
// too — that is the reviewer's own case (pi-review's detached checkout sits under os.tmpdir()).
const realRoot = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));

// The link sits in its own mkdtemp folder, never handed to tmpDir's registered recursive
// removal, so nothing in the suite's cleanup ever walks through the link into the real checkout.
const linkFolder = tmpDirUnmanaged(join(tmpdir(), "linked-launch-link-"));
const link = join(linkFolder, "checkout");
symlinkSync(realRoot, link, "junction");

function cleanEnv(extra) {
  const env = { ...process.env };
  for (const key of Object.keys(env)) if (/^GIT_/.test(key)) delete env[key];
  return { ...env, ...extra };
}

/** Run `<base>/<rel> ...args` by real path and through the link, same args, env and cwd. */
function runBoth(rel, args) {
  const cwd = tmpDir(join(tmpdir(), "linked-launch-cwd-"));
  const home = tmpDir(join(tmpdir(), "linked-launch-home-"));
  const agentDir = tmpDir(join(tmpdir(), "linked-launch-agent-"));
  const env = cleanEnv({ HOME: home, USERPROFILE: home, PI_CODING_AGENT_DIR: agentDir });
  const real = spawnSync(process.execPath, [join(realRoot, rel), ...args], { cwd, encoding: "utf8", env });
  const linked = spawnSync(process.execPath, [join(link, rel), ...args], { cwd, encoding: "utf8", env });
  return { real, linked };
}

/** Passes when both runs exit and print the same stdout, and the real-path run printed
 *  something (stdout or stderr) — so a guard that silently skips main() on both sides cannot
 *  pass by agreeing on nothing (W4). */
function sameAndPrinted({ real, linked }) {
  return real.status === linked.status && real.stdout === linked.stdout && Boolean(real.stdout || real.stderr);
}
function detail({ real, linked }) {
  return JSON.stringify({
    real: { status: real.status, stdout: real.stdout, stderr: real.stderr },
    linked: { status: linked.status, stdout: linked.stdout, stderr: linked.stderr },
  });
}

try {
  {
    const result = runBoth("scripts/requirements-moved.mjs", ["--root", realRoot, "--base", "HEAD"]);
    // req: R-1630
    check("R-1630: requirements-moved started through a linked checkout folder exits and prints as it does by its real path", sameAndPrinted(result), detail(result));
  }

  {
    const flatDir = tmpDir(join(tmpdir(), "linked-launch-flat-"));
    writeFileSync(join(flatDir, "REQUIREMENTS.md"), "| ID | Requirement | Status | Evidence |\n|---|---|---|---|\n| R-001 | A flat ledger row. | implemented | — |\n");
    const result = runBoth("scripts/requirements-tree.mjs", ["--root", flatDir]);
    // req: R-1631
    check("R-1631: the tree checker started through a linked checkout folder refuses a flat ledger with exit 1 as it does by its real path", sameAndPrinted(result) && result.real.status === 1, detail(result));
  }

  {
    const result = runBoth("scripts/requirement-rows.mjs", []);
    // req: R-1632
    check("R-1632: requirement-rows started through a linked checkout folder refuses a run with no file and exits 1 as it does by its real path", sameAndPrinted(result) && result.real.status === 1, detail(result));
  }

  {
    const result = runBoth("scripts/product-report.mjs", ["--bogus"]);
    // req: R-1633
    check("R-1633: the product report started through a linked checkout folder refuses an unknown flag with exit 2 as it does by its real path", sameAndPrinted(result) && result.real.status === 2, detail(result));
  }

  {
    const result = runBoth("packages/nana-pack/bin/nana-roster.mjs", []);
    // req: R-1634
    check("R-1634: the roster command started through a linked checkout folder prints the roster as it does by its real path", sameAndPrinted(result) && result.real.status === 0, detail(result));
  }
} finally {
  unlinkSync(link);
  rmdirSync(linkFolder);
}

console.log(fails ? `${fails} FAILED` : "all passed");
process.exit(fails ? 1 : 0);
