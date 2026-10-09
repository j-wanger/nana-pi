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
  const externalTarget = path.join(targetHome, "keep");
  fs.writeFileSync(externalTarget, "external bytes");
  const externalBefore = fs.readFileSync(externalTarget);
  fs.symlinkSync(externalTarget, link);
  const snapshot = (root) => {
    const entries = [];
    const walk = (dir) => { for (const item of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, item.name); const st = fs.lstatSync(file); if (st.isDirectory() && !st.isSymbolicLink()) walk(file); else entries.push([path.relative(root, file), st.isSymbolicLink() ? `link:${fs.readlinkSync(file)}` : fs.readFileSync(file).toString("base64")]); } };
    walk(root); return entries.sort();
  };
  const beforeHome = snapshot(home);
  const refused = run(["uninstall", "--yes", "--home", home]);
  // req: R-901
  check("external inventory link aborts before changing its target or link", refused.status === 1 && /inventory links do not resolve inside/.test(refused.stdout) && fs.lstatSync(link).isSymbolicLink() && fs.readFileSync(externalTarget).equals(externalBefore) && !fs.existsSync(path.join(layout.claudeHome, "settings.json")) && JSON.stringify(beforeHome) === JSON.stringify(snapshot(home)), refused.stdout);
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
  const { desiredHooks, removeInstallerHooks, removeRetiredContextHook } = await import("../lib/settings.mjs");
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

  const exact = desiredHooks({ hooksDir: "/tmp/hooks", repoRoot: "/repo" });
  const objective = exact.find((item) => item.label === "SessionStart objective").entry;
  const verifier = exact.find((item) => item.label === "PreToolUse verifier pipe").entry;
  const misplaced = { hooks: {
    UserPromptSubmit: [{ hooks: [objective] }],
    PreToolUse: [{ matcher: "Other", hooks: [verifier] }],
  } };
  const misplacedBefore = JSON.stringify(misplaced);
  removeInstallerHooks(misplaced, { hooksDir: "/tmp/hooks", repoRoot: "/repo" });
  // req: R-905
  check("wrong-event and wrong-matcher exact hooks are preserved", JSON.stringify(misplaced) === misplacedBefore);
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
  const sibling = path.join(path.dirname(repo), "nana-pi-sibling", "packages", "nana-pack");
  const stored = [path.join(repo, "packages", "nana-pack"), "npm:@remote/package", `${repo}/packages/nana-pack/unrelated`, sibling, "github:someone/nana-pi", "ssh://git@example.test/nana-pi.git"];
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
  check("registration directs users to doctor attribution without spawning pi", !fs.existsSync(log) && fs.readFileSync(settings).equals(before) && results.filter((row) => row.label === "pi registration").length === 1 && results.some((row) => row.detail === "run `pi list` and `pi remove` the nana-pi entries (doctor's `pi packages` and `pi package source` rows name them)"));
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-independent-roots-"));
  const claudeHome = tmpDir(path.join(os.tmpdir(), "nana-uninstall-independent-claude-"));
  const piHome = tmpDir(path.join(os.tmpdir(), "nana-uninstall-independent-pi-"));
  const install = run(["install", "--home", home, "--claude-home", claudeHome, "--pi-home", piHome]);
  const remove = run(["uninstall", "--yes", "--home", home, "--claude-home", claudeHome, "--pi-home", piHome]);
  // req: R-901
  check("uninstall succeeds with independent base Claude and pi roots", install.status === 0 && remove.status === 0 && /nothing to remove|removed/.test(remove.stdout) && fs.statSync(path.join(claudeHome, "settings.json")).isFile(), `${install.status}; ${remove.status}\n${remove.stdout}\n${remove.stderr}`);
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-settings-symlink-"));
  const external = tmpDir(path.join(os.tmpdir(), "nana-uninstall-settings-target-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.claudeHome, { recursive: true });
  const target = path.join(external, "settings-data");
  fs.writeFileSync(target, JSON.stringify({ hooks: { SessionStart: [{ hooks: [{ type: "command", command: "foreign" }] }] } }) + "\n");
  const targetBefore = fs.readFileSync(target);
  fs.symlinkSync(target, layout.claudeSettings);
  const homeBefore = fs.readlinkSync(layout.claudeSettings);
  const refused = run(["uninstall", "--yes", "--home", home]);
  // req: R-901
  check("symlink settings path is refused without changing home or target", refused.status === 1 && fs.readlinkSync(layout.claudeSettings) === homeBefore && fs.readFileSync(target).equals(targetBefore), refused.stdout);
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-settings-directory-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.claudeSettings, { recursive: true });
  const result = run(["uninstall", "--yes", "--home", home]);
  // req: R-901
  check("non-regular settings path is refused before changes", result.status === 1 && fs.lstatSync(layout.claudeSettings).isDirectory(), result.stdout);
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
  const expectedLabels = ["settings hooks", "private rule", "shared memory seed", "pi pack config", "pi objective", "subagent config.json", "reviewer.md", "hook nana-objective.sh", "hook nana-adoption.sh", "hook nana-shared-memory.sh", "hook verifier-pipe.mjs", "rule link nana-soul.md", "rule link nana-standards.md", "rule link nana-writing.md", "skill link requirements", "skill link spec", "skill link py-lint", "skill link py-review", "skill link py-test", "bin link pi-review", "bin link pi-worker", "bin link nana-land", "bin link nana-setup", "desk plist", "pi registration", path.join(dryLayout.knowledgeHome, "index.db")].sort();
  const second = run(["uninstall", "--yes", "--home", dryHome]);
  const third = run(["uninstall", "--yes", "--home", dryHome]);
  // req: R-903 R-904 R-905 R-906 R-907
  check("dry-run lists manifest pieces without writes and repeated uninstall is empty", dryInstall.status === 0 && dryResult.status === 0 && sameSnapshot(postInstall, afterDry) && JSON.stringify(dryLabels) === JSON.stringify(expectedLabels) && second.status === 0 && third.status === 0 && /nothing to remove/.test(third.stdout), `install=${dryInstall.status} dry=${dryResult.status} unchanged=${sameSnapshot(postInstall, afterDry)} rows=${dryRows.length} second=${second.status} third=${third.status} empty=${/nothing to remove/.test(third.stdout)}\n${third.stdout}`);
}

{
  const snapshot = (root) => {
    const values = new Map();
    const walk = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); const st = fs.lstatSync(file); if (st.isDirectory() && !st.isSymbolicLink()) walk(file); else values.set(path.relative(root, file), st.isSymbolicLink() ? `link:${fs.readlinkSync(file)}` : fs.readFileSync(file).toString("base64")); } };
    walk(root); return values;
  };
  const same = (a, b) => a.size === b.size && [...a].every(([key, value]) => b.get(key) === value);
  const ancestorResults = [];
  for (const target of ["hooks", "rules", "LaunchAgents"]) {
    const home = tmpDir(path.join(os.tmpdir(), `nana-uninstall-unsafe-${target}-`));
    const outside = tmpDir(path.join(os.tmpdir(), `nana-uninstall-outside-${target}-`));
    const layout = resolveLayout({ home });
    fs.mkdirSync(layout.claudeHome, { recursive: true });
    fs.writeFileSync(layout.claudeSettings, JSON.stringify({ foreign: true }));
    const dir = target === "LaunchAgents" ? path.dirname(layout.plistPath) : path.join(layout.claudeHome, target);
    fs.mkdirSync(path.dirname(dir), { recursive: true });
    fs.mkdirSync(outside, { recursive: true });
    fs.writeFileSync(path.join(outside, "keep"), "external");
    fs.symlinkSync(outside, dir);
    const before = snapshot(home);
    const outsideBefore = fs.readFileSync(path.join(outside, "keep"));
    const result = run(["uninstall", "--yes", "--home", home]);
    ancestorResults.push(result.status === 1 && /unsafe ancestor/.test(result.stdout) && same(before, snapshot(home)) && fs.readFileSync(path.join(outside, "keep")).equals(outsideBefore));
  }
  // req: R-901
  check("symlinked hooks rules and LaunchAgents ancestors refuse before any home or target change", ancestorResults.every(Boolean));
}

{
  const snapshot = (root) => {
    const values = new Map();
    const walk = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); const st = fs.lstatSync(file); if (st.isDirectory() && !st.isSymbolicLink()) walk(file); else values.set(path.relative(root, file), st.isSymbolicLink() ? `link:${fs.readlinkSync(file)}` : fs.readFileSync(file).toString("base64")); } };
    walk(root); return values;
  };
  const same = (a, b) => a.size === b.size && [...a].every(([key, value]) => b.get(key) === value);
  const cases = [];
  {
    const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-nested-pi-home-"));
    const external = tmpDir(path.join(os.tmpdir(), "nana-uninstall-nested-pi-external-"));
    const layout = resolveLayout({ home });
    fs.mkdirSync(path.join(external, "agent", "nana-knowledge"), { recursive: true });
    fs.writeFileSync(path.join(external, "agent", "nana-knowledge", "index.db"), "external database");
    fs.symlinkSync(external, path.join(home, ".pi"));
    const beforeHome = snapshot(home);
    const beforeExternal = snapshot(external);
    const result = run(["uninstall", "--yes", "--home", home]);
    cases.push(result.status === 1 && /✗.*unsafe ancestor/u.test(result.stdout) && same(beforeHome, snapshot(home)) && same(beforeExternal, snapshot(external)));
  }
  {
    const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-nested-claude-home-"));
    const external = tmpDir(path.join(os.tmpdir(), "nana-uninstall-nested-claude-external-"));
    const layout = resolveLayout({ home });
    const externalClaude = path.join(external, "claude");
    fs.mkdirSync(path.join(externalClaude, "hooks"), { recursive: true });
    fs.mkdirSync(path.join(externalClaude, "rules"), { recursive: true });
    fs.writeFileSync(path.join(externalClaude, "settings.json"), JSON.stringify({ hooks: {} }));
    fs.symlinkSync(path.join(repo, "packages", "nana-setup", "claude", "hooks", "nana-objective.sh"), path.join(externalClaude, "hooks", "nana-objective.sh"));
    const { stateRows } = await import("../lib/state-manifest.mjs");
    const privateSeed = stateRows(layout).find((row) => row.store === "private rule");
    fs.copyFileSync(privateSeed.source, path.join(externalClaude, "rules", "nana-personal.md"));
    fs.symlinkSync(externalClaude, layout.claudeHome);
    const beforeHome = snapshot(home);
    const beforeExternal = snapshot(external);
    const result = run(["uninstall", "--yes", "--home", home]);
    cases.push(result.status === 1 && /✗.*unsafe ancestor/u.test(result.stdout) && same(beforeHome, snapshot(home)) && same(beforeExternal, snapshot(external)));
  }
  // req: R-901
  check("nested selected roots refuse symlink ancestors without changing home or external targets", cases.length === 2 && cases.every(Boolean));
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-settings-failure-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.claudeHome, { recursive: true });
  fs.writeFileSync(layout.claudeSettings, "{broken");
  const link = path.join(layout.hooksDir, "nana-objective.sh");
  fs.mkdirSync(layout.hooksDir, { recursive: true });
  fs.symlinkSync(path.join(repo, "packages/nana-setup/claude/hooks/nana-objective.sh"), link);
  const { stateRows } = await import("../lib/state-manifest.mjs");
  const seed = stateRows(layout).find((row) => row.store === "reviewer.md");
  fs.mkdirSync(path.dirname(seed.path), { recursive: true });
  fs.copyFileSync(seed.source, seed.path);
  const beforeLink = fs.readlinkSync(link);
  const result = run(["uninstall", "--yes", "--home", home]);
  // req: R-901 R-905
  check("malformed settings report an operational failure before unlinking", result.status === 1 && /✗.*settings|✗.*uninstall/.test(result.stdout) && fs.readlinkSync(link) === beforeLink && fs.readFileSync(seed.path).equals(fs.readFileSync(seed.source)), result.stdout);
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-hook-variants-"));
  const layout = resolveLayout({ home });
  const settings = { hooks: { SessionStart: [{ hooks: [
    { type: "command", command: "bash ~/.claude/hooks/nana-objective.sh", timeout: 5, statusMessage: "nana: objective + current priority" },
    { type: "command", command: `EXTRA=1 bash '${layout.hooksDir}/nana-adoption.sh'`, timeout: 5, statusMessage: "nana: unadopted repositories" },
    { type: "command", command: `bash '${layout.hooksDir}/nana-shared-memory.sh'`, timeout: 5 },
  ] }], UserPromptSubmit: [{ hooks: [
    { type: "command", command: `NODE_NO_WARNINGS=1 node '/stale/packages/nana-knowledge/bin/nana-knowledge.ts' hook`, timeout: 5, statusMessage: "nana: knowledge pull" },
  ] }] } };
  fs.mkdirSync(layout.claudeHome, { recursive: true });
  fs.writeFileSync(layout.claudeSettings, JSON.stringify(settings));
  const result = run(["uninstall", "--yes", "--home", home]);
  // req: R-905
  check("each near-match hook variant gets one left row naming its command", result.status === 0 && (result.stdout.match(/left —/g) ?? []).length === 4 && ["~/.claude/hooks/nana-objective.sh", "EXTRA=1", "nana-shared-memory.sh", "stale/packages/nana-knowledge"].every((part) => result.stdout.includes(part)), result.stdout);
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-modes-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.claudeHome, { recursive: true });
  fs.writeFileSync(layout.claudeSettings, "{}\n");
  const initial = fs.readFileSync(layout.claudeSettings);
  const both = run(["uninstall", "--dry-run", "--yes", "--home", home]);
  const win = run(["uninstall", "--yes", "--home", home], { NANA_SETUP_PLATFORM: "win32" });
  const relative = run(["uninstall", "--yes"], { HOME: home, PI_CODING_AGENT_DIR: "relative-agent-dir" });
  // req: R-900
  check("both modes win32 and relative ambient pi home refuse without home changes", both.status === 2 && win.status === 2 && /uninstall is POSIX-only/.test(win.stderr) && relative.status === 2 && fs.readFileSync(layout.claudeSettings).equals(initial), `${both.status} ${win.status} ${relative.status}`);
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-mixed-links-"));
  const outside = tmpDir(path.join(os.tmpdir(), "nana-uninstall-decoy-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.hooksDir, { recursive: true });
  fs.mkdirSync(layout.claudeHome, { recursive: true });
  fs.writeFileSync(layout.claudeSettings, "{}\n");
  const owned = path.join(layout.hooksDir, "nana-objective.sh");
  const decoy = path.join(outside, "keep");
  fs.writeFileSync(decoy, "unchanged");
  fs.symlinkSync(path.join(repo, "packages/nana-setup/claude/hooks/nana-objective.sh"), owned);
  fs.symlinkSync(decoy, path.join(layout.hooksDir, "nana-adoption.sh"));
  const regular = path.join(layout.hooksDir, "nana-shared-memory.sh");
  fs.writeFileSync(regular, "owner file");
  const directory = path.join(layout.hooksDir, "verifier-pipe.mjs");
  fs.mkdirSync(directory);
  const result = run(["uninstall", "--yes", "--home", home]);
  // req: R-902
  check("mixed inventory leaves external and regular link-path entries while removing owned link", result.status === 0 && !fs.existsSync(owned) && fs.readFileSync(decoy, "utf8") === "unchanged" && fs.lstatSync(path.join(layout.hooksDir, "nana-adoption.sh")).isSymbolicLink() && fs.readFileSync(regular, "utf8") === "owner file" && fs.lstatSync(directory).isDirectory(), result.stdout);
  const danglingHome = tmpDir(path.join(os.tmpdir(), "nana-uninstall-dangling-link-"));
  const danglingLayout = resolveLayout({ home: danglingHome });
  fs.mkdirSync(danglingLayout.hooksDir, { recursive: true });
  fs.mkdirSync(danglingLayout.claudeHome, { recursive: true });
  fs.writeFileSync(danglingLayout.claudeSettings, "{}\n");
  const live = path.join(danglingLayout.hooksDir, "nana-objective.sh");
  const dangling = path.join(danglingLayout.hooksDir, "nana-adoption.sh");
  fs.symlinkSync(path.join(repo, "packages/nana-setup/claude/hooks/nana-objective.sh"), live);
  fs.symlinkSync(path.join(danglingHome, "missing-target"), dangling);
  const danglingResult = run(["uninstall", "--yes", "--home", danglingHome]);
  // req: R-902
  check("dangling hook link is reported left while owned link is removed", danglingResult.status === 0 && !fs.existsSync(live) && fs.lstatSync(dangling).isSymbolicLink() && /dangling symlink/.test(danglingResult.stdout), danglingResult.stdout);
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-desk-types-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(path.dirname(layout.plistPath), { recursive: true });
  const external = path.join(home, "outside-plist");
  fs.writeFileSync(external, "foreign");
  fs.symlinkSync(external, layout.plistPath);
  const result = uninstall(layout);
  // req: R-906
  check("foreign symlink plist is left without following it", fs.lstatSync(layout.plistPath).isSymbolicLink() && fs.readFileSync(external, "utf8") === "foreign" && result.some((row) => row.label === "desk plist" && row.status === "skipped"));
  fs.unlinkSync(layout.plistPath);
  fs.mkdirSync(layout.plistPath);
  const directoryResult = uninstall(layout);
  // req: R-906
  check("directory at plist path is left", fs.lstatSync(layout.plistPath).isDirectory() && directoryResult.some((row) => row.label === "desk plist" && row.status === "skipped"));
  fs.rmdirSync(layout.plistPath);
  fs.writeFileSync(layout.plistPath, "foreign checkout server");
  const foreignResult = uninstall(layout);
  // req: R-906
  check("foreign regular plist is left", fs.readFileSync(layout.plistPath, "utf8") === "foreign checkout server" && foreignResult.some((row) => row.label === "desk plist" && row.status === "skipped"));
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-write-race-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.claudeHome, { recursive: true });
  const { desiredHooks, serialize } = await import("../lib/settings.mjs");
  const target = desiredHooks({ hooksDir: layout.hooksDir, repoRoot: repo }).find((item) => item.label === "SessionStart objective").entry;
  fs.writeFileSync(layout.claudeSettings, serialize({ hooks: { SessionStart: [{ hooks: [target] }] } }));
  fs.mkdirSync(layout.hooksDir, { recursive: true });
  const link = path.join(layout.hooksDir, "nana-objective.sh");
  fs.symlinkSync(path.join(repo, "packages/nana-setup/claude/hooks/nana-objective.sh"), link);
  const { stateRows } = await import("../lib/state-manifest.mjs");
  const seed = stateRows(layout).find((row) => row.store === "reviewer.md");
  fs.mkdirSync(path.dirname(seed.path), { recursive: true });
  fs.copyFileSync(seed.source, seed.path);
  let failed = false;
  try { uninstall(layout, { afterTempWrite: () => fs.writeFileSync(layout.claudeSettings, "{}\n") }); } catch (error) { failed = /changed on disk/.test(error.message); }
  // req: R-905
  check("settings write race fails before links are removed", failed && fs.lstatSync(link).isSymbolicLink() && fs.readFileSync(seed.path).equals(fs.readFileSync(seed.source)));
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-lock-failure-"));
  const layout = resolveLayout({ home });
  fs.mkdirSync(layout.claudeHome, { recursive: true });
  const { desiredHooks, serialize } = await import("../lib/settings.mjs");
  const target = desiredHooks({ hooksDir: layout.hooksDir, repoRoot: repo }).find((item) => item.label === "SessionStart objective").entry;
  fs.writeFileSync(layout.claudeSettings, serialize({ hooks: { SessionStart: [{ hooks: [target] }] } }));
  const lock = path.join(layout.claudeHome, ".settings.json.nana-setup.lock");
  fs.writeFileSync(lock, "occupied");
  fs.mkdirSync(layout.hooksDir, { recursive: true });
  const link = path.join(layout.hooksDir, "nana-objective.sh");
  fs.symlinkSync(path.join(repo, "packages/nana-setup/claude/hooks/nana-objective.sh"), link);
  const { stateRows } = await import("../lib/state-manifest.mjs");
  const seed = stateRows(layout).find((row) => row.store === "reviewer.md");
  fs.mkdirSync(path.dirname(seed.path), { recursive: true });
  fs.copyFileSync(seed.source, seed.path);
  const result = run(["uninstall", "--yes", "--home", home]);
  // req: R-905
  check("settings lock failure is operational and preserves links", result.status === 1 && /✗/.test(result.stdout) && fs.lstatSync(link).isSymbolicLink() && fs.readFileSync(seed.path).equals(fs.readFileSync(seed.source)));
}

{
  const home = tmpDir(path.join(os.tmpdir(), "nana-uninstall-noop-parent-"));
  const layout = resolveLayout({ home });
  const result = run(["uninstall", "--yes", "--home", home]);
  // req: R-905
  check("no-op uninstall does not create the settings parent or lock", result.status === 0 && !fs.existsSync(layout.claudeHome) && /nothing to remove/.test(result.stdout));
}

process.exitCode = failures ? 1 : 0;
