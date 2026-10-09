/**
 * @module packages/nana-setup/tests/uninstall.test.mjs
 * @purpose Pins uninstall's explicit confirmation, manifest-driven removal and settings preservation.
 * @inputs nana-setup CLI and settings helpers with fixtures under tmpDir.
 * @outputs PASS/FAIL lines and a nonzero exit on failure.
 * @effects disk (OS temporary homes), process (spawns the CLI only against temporary homes).
 * @errors failed checks exit nonzero; unexpected errors fail the test process.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const pkg = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const cli = path.join(pkg, "bin", "nana-setup.mjs");
const repo = path.resolve(pkg, "..", "..");
const { uninstall } = await import("../lib/uninstall.mjs");
const { resolveLayout } = await import("../lib/paths.mjs");
let failures = 0;
const check = (title, ok, detail = "") => {
  console.log(ok ? "PASS" : "FAIL", title, ok ? "" : detail);
  if (!ok) failures++;
};
const run = (args, env = {}) => spawnSync(process.execPath, [cli, ...args], { encoding: "utf8", env: { ...process.env, ...env } });

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-confirm-"));
  const settings = path.join(home, ".claude", "settings.json");
  fs.mkdirSync(path.dirname(settings), { recursive: true });
  fs.writeFileSync(settings, JSON.stringify({ foreign: { keep: true } }) + "\n");
  const before = fs.readFileSync(settings);
  const result = run(["uninstall", "--home", home]);
  // req: R-900
  check("uninstall requires exactly one confirmation mode and changes nothing", result.status === 2 && fs.readFileSync(settings).equals(before), result.stderr);
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-anchor-"));
  const targetHome = tmpDir(path.join(os.tmpdir(), "nana-uninstall-other-checkout-"));
  const layout = resolveLayout({ home });
  const link = path.join(layout.hooksDir, "nana-objective.sh");
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(path.join(targetHome, "not-this-repo"), link);
  let refused = false;
  try { uninstall(layout, { dryRun: true }); } catch (error) { refused = /inventory links do not resolve inside/.test(error.message); }
  // req: R-901
  check("external inventory link aborts before changing its target or link", refused && fs.lstatSync(link).isSymbolicLink() && fs.existsSync(targetHome) && !fs.existsSync(path.join(layout.claudeHome, "settings.json")));
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-owned-link-"));
  const layout = resolveLayout({ home });
  const link = path.join(layout.hooksDir, "nana-objective.sh");
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(path.join(repo, "packages", "nana-setup", "claude", "hooks", "nana-objective.sh"), link);
  const results = uninstall(layout, { dryRun: false });
  // req: R-902
  check("repository-targeting inventory symlink is unlinked", !fs.existsSync(link) && results.some((row) => row.label === "hook nana-objective.sh" && row.status === "updated"));
}

{
  const { removeInstallerHooks, removeRetiredContextHook } = await import("../lib/settings.mjs");
  const context = { hooks: { UserPromptSubmit: [{ hooks: [
    { type: "command", command: "bash '/tmp/hooks/context-size-check.sh'" },
    { type: "command", command: "bash '/tmp/hooks/context-size-check.sh'", owner: "variant" },
    { type: "command", command: "bash /tmp/hooks/context-size-check.sh" },
  ] }] } };
  removeRetiredContextHook(context, { hooksDir: "/tmp/hooks" });
  // req: R-660
  check("released quoted context hook is removed while variants stay", context.hooks.UserPromptSubmit[0].hooks.length === 2 && context.hooks.UserPromptSubmit[0].hooks[0].owner === "variant" && context.hooks.UserPromptSubmit[0].hooks[1].command === "bash /tmp/hooks/context-size-check.sh");
  const settings = { unrelated: true, hooks: { SessionStart: [{ hooks: [{ type: "command", command: "foreign" }, { type: "command", command: "bash '/tmp/hooks/nana-objective.sh'", timeout: 5, statusMessage: "nana: objective + current priority" }] }, { hooks: [] }], PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "foreign" }] }] } };
  const before = JSON.stringify(settings);
  removeInstallerHooks(settings, { hooksDir: "/tmp/hooks", repoRoot: "/repo" });
  // req: R-905
  check("settings pruning preserves foreign hooks, empty groups and unrelated keys", settings.hooks.SessionStart.length === 2 && settings.hooks.SessionStart[0].hooks.length === 1 && settings.hooks.SessionStart[1].hooks.length === 0 && settings.unrelated && JSON.stringify(settings) !== before);
}

process.exitCode = failures ? 1 : 0;
