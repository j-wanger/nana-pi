/**
 * @module packages/nana-setup/tests/uninstall.test.mjs
 * @purpose Pins uninstall's explicit confirmation, manifest-driven removal and settings preservation.
 * @inputs nana-setup CLI and settings helpers with fixtures under tmpDir.
 * @outputs PASS/FAIL lines and a nonzero exit on failure.
 * @effects disk (OS temporary homes), process (spawns the CLI only against temporary homes).
 * @errors failed checks exit nonzero; unexpected errors fail the test process.
 */
import { tmpDir } from "./tmp-dir.mjs";
import { withPiStub } from "./stub-pi.mjs";
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

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-seeds-"));
  const layout = resolveLayout({ home });
  const { stateRows } = await import("../lib/state-manifest.mjs");
  const reviewer = stateRows(layout).find((row) => row.store === "reviewer.md").path;
  const pack = stateRows(layout).find((row) => row.store === "pi pack config").path;
  const reviewerSource = path.join(pkg, "pi", "reviewer.seed.md");
  fs.mkdirSync(path.dirname(reviewer), { recursive: true });
  fs.copyFileSync(reviewerSource, reviewer);
  fs.appendFileSync(reviewer, "edited\n");
  fs.mkdirSync(path.dirname(pack), { recursive: true });
  fs.symlinkSync(path.join(home, "do-not-follow"), pack);
  const results = uninstall(layout);
  // req: R-903
  check("edited seed and symlink seed are kept", fs.readFileSync(reviewer).toString().endsWith("edited\n") && fs.lstatSync(pack).isSymbolicLink() && results.some((row) => row.label === "reviewer.md" && /edited since seeding/.test(row.detail)));
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-index-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.knowledgeHome, { recursive: true });
  for (const name of ["index.db", "index.db-wal", "sources.json", "pull.log", "build.lock"]) fs.writeFileSync(path.join(layout.knowledgeHome, name), name);
  const shmTarget = path.join(home, "outside-shm");
  fs.writeFileSync(shmTarget, "keep target");
  fs.symlinkSync(shmTarget, path.join(layout.knowledgeHome, "index.db-shm"));
  fs.mkdirSync(path.join(layout.knowledgeHome, "shown"));
  fs.writeFileSync(path.join(layout.knowledgeHome, "shown", "keep"), "shown");
  uninstall(layout);
  // req: R-904
  check("only regular knowledge index files are removed", !["index.db", "index.db-wal"].some((name) => fs.existsSync(path.join(layout.knowledgeHome, name))) && fs.lstatSync(path.join(layout.knowledgeHome, "index.db-shm")).isSymbolicLink() && fs.readFileSync(shmTarget, "utf8") === "keep target" && ["sources.json", "pull.log", "build.lock", "shown/keep"].every((name) => fs.existsSync(path.join(layout.knowledgeHome, name))));
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-desk-"));
  const layout = resolveLayout({ home });
  const plist = path.join(home, "Library", "LaunchAgents", "com.nana.pi-desk.plist");
  fs.mkdirSync(path.dirname(plist), { recursive: true });
  fs.writeFileSync(plist, `server=${(await import("../lib/steps.mjs")).DESK_SERVER}\n`);
  const originalPlist = fs.readFileSync(plist);
  const stub = tmpDir(path.join(os.tmpdir(), "nana-uninstall-launchctl-"));
  const log = path.join(stub, "calls");
  const executable = path.join(stub, "launchctl");
  fs.writeFileSync(executable, `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}'\n[ "$1" = print ] && exit 0\nexit 1\n`);
  fs.chmodSync(executable, 0o755);
  const oldPath = process.env.PATH;
  process.env.PATH = `${stub}${path.delimiter}${oldPath || ""}`;
  let liveRows;
  try { liveRows = uninstall({ ...layout, isRealHome: true, plistPath: plist }); }
  finally { process.env.PATH = oldPath; }
  // req: R-906
  check("loaded live-layout desk service is left after one print", fs.readFileSync(plist).equals(originalPlist) && fs.readFileSync(log, "utf8").trim().split("\\n").length === 1 && fs.readFileSync(log, "utf8").trim().startsWith("print ") && liveRows.some((row) => row.status === "problem" && row.detail.includes("launchctl bootout")));
  fs.writeFileSync(log, "");
  process.env.PATH = `${stub}${path.delimiter}${oldPath || ""}`;
  try { uninstall(layout); }
  finally { process.env.PATH = oldPath; }
  // req: R-906
  check("sandbox desk removal makes no launchctl calls", fs.readFileSync(log, "utf8") === "");
  fs.writeFileSync(plist, originalPlist);
  fs.writeFileSync(log, "");
  fs.writeFileSync(executable, `#!/bin/sh\nprintf '%s\\n' "$*" >> '${log}'\nexit 1\n`);
  fs.chmodSync(executable, 0o755);
  process.env.PATH = `${stub}${path.delimiter}${oldPath || ""}`;
  let unloaded;
  try { unloaded = uninstall({ ...layout, isRealHome: true, plistPath: plist }); }
  finally { process.env.PATH = oldPath; }
  // req: R-906
  check("unloaded live-layout desk plist is removed after one print", !fs.existsSync(plist) && /^print gui\/\d+\/com\.nana\.pi-desk$/u.test(fs.readFileSync(log, "utf8").trim()) && unloaded.some((row) => row.label === "desk plist" && row.status === "updated"), `${fs.existsSync(plist)} ${fs.readFileSync(log, "utf8")} ${JSON.stringify(unloaded.find((row) => row.label === "desk plist"))}`);
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-registration-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.piHome, { recursive: true });
  const settings = path.join(layout.piHome, "settings.json");
  const stored = [path.join(repo, "packages", "nana-pack"), "npm:@remote/package"];
  fs.writeFileSync(settings, JSON.stringify({ packages: stored }));
  const before = fs.readFileSync(settings);
  const stub = tmpDir(path.join(os.tmpdir(), "nana-uninstall-pi-"));
  const log = path.join(stub, "calls");
  const executable = path.join(stub, "pi");
  fs.writeFileSync(executable, `#!/bin/sh\necho called >> '${log}'\nexit 99\n`);
  fs.chmodSync(executable, 0o755);
  const oldPath = process.env.PATH;
  process.env.PATH = `${stub}${path.delimiter}${oldPath || ""}`;
  let results;
  try { results = uninstall(layout); }
  finally { process.env.PATH = oldPath; }
  // req: R-907
  check("registration reports local removal and remote retention without spawning pi", !fs.existsSync(log) && fs.readFileSync(settings).equals(before) && results.some((row) => row.detail === `run: pi remove '${stored[0]}'`) && results.some((row) => row.detail === `left (remote): ${stored[1]}`));
}

{
  const snapshot = (root) => {
    const found = new Map();
    const visit = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const target = path.join(dir, entry.name);
        const stat = fs.lstatSync(target);
        if (stat.isDirectory() && !stat.isSymbolicLink()) visit(target);
        else found.set(path.relative(root, target).split(path.sep).join("/"), stat.isSymbolicLink() ? `link:${fs.readlinkSync(target)}` : `file:${fs.readFileSync(target).toString("base64")}`);
      }
    };
    visit(root);
    return found;
  };
  const sameSnapshot = (left, right) => left.size === right.size && [...left].every(([name, value]) => right.get(name) === value);
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-roundtrip-"));
  const settings = path.join(home, ".claude", "settings.json");
  const layout = resolveLayout({ home });
  fs.mkdirSync(path.dirname(settings), { recursive: true });
  fs.mkdirSync(layout.knowledgeHome, { recursive: true });
  fs.writeFileSync(path.join(layout.knowledgeHome, "sources.json"), JSON.stringify({ roots: [] }));
  fs.writeFileSync(settings, JSON.stringify({ foreignTop: { keep: true }, hooks: { SessionStart: [{ hooks: [{ type: "command", command: "foreign hook" }] }, { hooks: [] }] } }, null, 2) + "\n");
  const initial = snapshot(home);
  const installed = run(["install", "--desk", "--home", home]);
  const removed = run(["uninstall", "--yes", "--home", home]);
  // req: R-903 R-905
  check("install --desk then uninstall restores the independent home snapshot", installed.status === 0 && removed.status === 0 && sameSnapshot(initial, snapshot(home)), `${installed.status}; ${removed.status}\n${removed.stdout}\n${removed.stderr}`);

  const updateHome = tmpDir(path.join(os.tmpdir(), "nana-uninstall-update-"));
  const updateLayout = resolveLayout({ home: updateHome });
  fs.mkdirSync(updateLayout.knowledgeHome, { recursive: true });
  fs.writeFileSync(path.join(updateLayout.knowledgeHome, "sources.json"), JSON.stringify({ roots: [] }));
  const updateSettings = path.join(updateLayout.claudeHome, "settings.json");
  fs.mkdirSync(path.dirname(updateSettings), { recursive: true });
  fs.writeFileSync(updateSettings, JSON.stringify({ hooks: { UserPromptSubmit: [{ hooks: [{ type: "command", command: `bash '${updateLayout.hooksDir}/context-size-check.sh'` }] }] } }, null, 2) + "\n");
  fs.mkdirSync(updateLayout.hooksDir, { recursive: true });
  const contextLink = path.join(updateLayout.hooksDir, "context-size-check.sh");
  fs.symlinkSync(path.join(repo, "packages", "nana-setup", "claude", "hooks", "context-size-check.sh"), contextLink);
  const preUpdate = snapshot(updateHome);
  const updateInstall = run(["install", "--home", updateHome]);
  const afterUpdate = snapshot(updateHome);
  const updateRemove = run(["uninstall", "--yes", "--home", updateHome]);
  const afterRemove = snapshot(updateHome);
  const expectedUpdate = new Map(preUpdate);
  const settingsKey = path.relative(updateHome, updateSettings).split(path.sep).join("/");
  expectedUpdate.set(settingsKey, afterRemove.get(settingsKey));
  expectedUpdate.delete(path.relative(updateHome, contextLink).split(path.sep).join("/"));
  const finalSettings = JSON.parse(fs.readFileSync(updateSettings, "utf8"));
  // req: R-660
  check("released context entry is retired by install and its link is removed on uninstall", updateInstall.status === 0 && updateRemove.status === 0 && !sameSnapshot(preUpdate, afterUpdate) && !fs.existsSync(contextLink) && !JSON.stringify(JSON.parse(fs.readFileSync(updateSettings, "utf8"))).includes("context-size-check.sh") && sameSnapshot(expectedUpdate, afterRemove) && !JSON.stringify(finalSettings).includes("context-size-check.sh"), `${updateInstall.status}; ${updateRemove.status}\n${updateRemove.stdout}\n${updateRemove.stderr}`);

  const dryHome = tmpDir(path.join(os.tmpdir(), "nana-uninstall-dry-roundtrip-"));
  const dryLayout = resolveLayout({ home: dryHome });
  fs.mkdirSync(dryLayout.knowledgeHome, { recursive: true });
  fs.writeFileSync(path.join(dryLayout.knowledgeHome, "sources.json"), JSON.stringify({ roots: [] }));
  const dryInstall = run(["install", "--home", dryHome]);
  const postInstall = snapshot(dryHome);
  const dryResult = run(["uninstall", "--dry-run", "--home", dryHome]);
  const afterDry = snapshot(dryHome);
  const dryRows = dryResult.stdout.split("\n").filter((line) => /^  [ +–✗·]/u.test(line));
  const dryLabels = dryRows.map((line) => line.slice(4).split(/\s{2,}/u)[0]).sort();
  const expectedLabels = ["settings hooks", "private rule", "shared memory seed", "pi pack config", "pi objective", "subagent config.json", "reviewer.md", "hook nana-objective.sh", "hook nana-adoption.sh", "hook nana-shared-memory.sh", "hook verifier-pipe.mjs", "rule link nana-soul.md", "rule link nana-standards.md", "rule link nana-writing.md", "skill link requirements", "skill link spec", "skill link py-lint", "skill link py-review", "skill link py-test", "bin link pi-review", "bin link pi-worker", "bin link nana-land", "bin link nana-setup", "desk plist", path.join(dryLayout.knowledgeHome, "index.db")].sort();
  const second = run(["uninstall", "--yes", "--home", dryHome]);
  const third = run(["uninstall", "--yes", "--home", dryHome]);
  // req: R-903 R-904 R-905 R-906 R-907
  check("dry-run lists manifest pieces without writes and repeated uninstall is empty", dryInstall.status === 0 && dryResult.status === 0 && sameSnapshot(postInstall, afterDry) && JSON.stringify(dryLabels) === JSON.stringify(expectedLabels) && second.status === 0 && third.status === 0 && /nothing to remove/.test(third.stdout), `install=${dryInstall.status} dry=${dryResult.status} unchanged=${sameSnapshot(postInstall, afterDry)} rows=${dryRows.length} second=${second.status} third=${third.status} empty=${/nothing to remove/.test(third.stdout)}\n${third.stdout}`);
}

process.exitCode = failures ? 1 : 0;
