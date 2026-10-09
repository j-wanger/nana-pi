/**
 * @module packages/nana-setup/tests/state-manifest.test.mjs
 * @purpose Pins the state inventory, layout coverage, ledger parity, and secret classification.
 * @inputs state manifest and setup layout APIs.
 * @outputs PASS/FAIL checks and process exit status.
 * @effects disk (temporary fixture for read-only CLI proof).
 * @errors Failed checks increment the exit status.
 */
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
import { STATE_CLASSES, stateRows } from "../lib/state-manifest.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { ledgerPaths } from "../../nana-pack/bin/review-round.mjs";

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
const layout = resolveLayout({ home: path.join(os.tmpdir(), "manifest-sample") });
const rows = stateRows(layout);
const byPath = new Map(rows.map((row) => [path.resolve(row.path), row]));
// req: R-954
check("each manifest row has one allowed class and complete ownership metadata", rows.length > 0 && JSON.stringify(Object.values(STATE_CLASSES).sort()) === JSON.stringify(["durable", "rebuildable", "re-ratified", "disposable", "secret"].sort()) && rows.every((r) => Object.values(STATE_CLASSES).includes(r.class) && r.owner && r.kind && r.source && r.restore && path.isAbsolute(r.path)));
const tuple = (store) => { const { class: cls, owner, kind, source, restore } = rows.find((row) => row.store === store) ?? {}; return [cls, owner, kind, source, restore]; };
// req: R-954
check("shared settings and seed rows pin ownership and removal semantics", JSON.stringify(tuple("Claude settings")) === JSON.stringify(["secret", "nana-setup", "settings-entry", "packages/nana-setup/lib/steps.mjs", "sign in again or carry by hand; never archive"]) && JSON.stringify(tuple("pi settings")) === JSON.stringify(["durable", "nana-setup", "settings-entry", "packages/nana-setup/lib/steps.mjs", "restore from the private state archive"]) && JSON.stringify(tuple("shared memory seed")) === JSON.stringify(["durable", "nana-setup", "seed", "packages/nana-setup/lib/steps.mjs; remove only while byte-equal to seed source", "restore from the private state archive"]) && JSON.stringify(tuple("shared memory")) === JSON.stringify(["durable", "user", "dir", "user-created store", "restore archive; SessionStart recreates project shared links"]), JSON.stringify(rows.filter((row) => ["Claude settings", "pi settings", "shared memory seed", "shared memory"].includes(row.store))));
const installTupleNames = ["private rule", "pi pack config", "pi objective", "subagent config.json", "reviewer.md", "knowledge index", "desk plist"];
const expectedInstallTuples = [["durable", "nana-setup", "seed", "packages/nana-setup/lib/steps.mjs; remove only while byte-equal to seed source", "restore from the private state archive"],["durable", "nana-setup", "seed", "packages/nana-setup/lib/steps.mjs; remove only while byte-equal to seed source", "restore from the private state archive"],["durable", "nana-setup", "seed", "packages/nana-setup/lib/steps.mjs; remove only while byte-equal to seed source", "restore from the private state archive"],["rebuildable", "nana-setup", "seed", "packages/nana-setup/lib/steps.mjs; remove only while byte-equal to seed source", "re-run nana-setup install"],["rebuildable", "nana-setup", "seed", "packages/nana-setup/lib/steps.mjs; remove only while byte-equal to seed source", "re-run nana-setup install"],["rebuildable", "nana-knowledge", "generated", "packages/nana-knowledge/lib/paths.ts", "run nana-knowledge build"],["rebuildable", "nana-setup", "plist", "packages/nana-setup/lib/steps.mjs", "re-run nana-setup install"]];
// req: R-954
check("install seeds and generated stores pin exact owner and kind tuples", installTupleNames.every((name, index) => JSON.stringify(tuple(name)) === JSON.stringify(expectedInstallTuples[index])) && !rows.some((row) => row.store === "LaunchAgents directory"), JSON.stringify(installTupleNames.filter((name, index) => JSON.stringify(tuple(name)) !== JSON.stringify(expectedInstallTuples[index]))));
// knowledgeHome is a layout container only; only sources.json and pull.log are durable rows.
const containers = ["base", "claudeHome", "piHome", "knowledgeHome", "hooksDir", "rulesDir", "skillsDir", "projectsDir", "binDir", "launchAgentsDir"];
const pathEntries = Object.entries(layout).filter(([key, value]) => typeof value === "string" && path.isAbsolute(value) && !containers.includes(key));
// req: R-955
check("every resolved layout path except declared containers is inventoried", pathEntries.every(([, value]) => byPath.has(path.resolve(value))), pathEntries.filter(([, value]) => !byPath.has(path.resolve(value))).map(([key]) => key).join(", "));
const ledger = ledgerPaths(layout.base);
// req: R-955
check("manifest ledger paths equal ledgerPaths(home)", JSON.stringify(rows.filter((row) => row.store.startsWith("review ledger ")).map((row) => path.resolve(row.path)).sort()) === JSON.stringify(["tally", "audit", "rotated", "lock", "resDir"].map((key) => path.resolve(ledger[key])).sort()));
const secretNames = ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json", ".credentials.json", "settings.json", "stage-keys", "sessions", "bench-agent"];
// req: R-954
check("secret-capable stores are classified as secret", secretNames.every((name) => rows.some((r) => path.basename(r.path) === name && r.class === "secret")) && ["Claude login", "Claude transcripts"].every((store) => rows.some((row) => row.store === store && row.class === "secret")), secretNames.filter((name) => !rows.some((r) => path.basename(r.path) === name && r.class === "secret")).join(", "));
// req: R-954
check("disposable cache and log tuples name their real owners and sources", JSON.stringify([tuple("MCP cache"), tuple("desk log")]) === JSON.stringify([["disposable", "pi", "file", "pi / pi-subagents owner", "recreated as needed"],["disposable", "desk", "file", "apps/desk/lib/stage-keys.mjs", "recreated as needed"]]));
const installHome = tmpDir(path.join(os.tmpdir(), "state-owner-install-"));
const install = spawnSync(process.execPath, [path.resolve(new URL("../bin/nana-setup.mjs", import.meta.url).pathname), "install", "--home", installHome], { encoding: "utf8", env: { ...process.env, HOME: installHome, PI_CODING_AGENT_DIR: path.join(installHome, ".pi", "agent") } });
const ownerLayout = resolveLayout({ home: installHome });
const installedRows = stateRows(ownerLayout);
const installTargets = [
  ownerLayout.claudeSettings, path.join(ownerLayout.sharedMemoryDir, "MEMORY.md"),
  path.join(ownerLayout.rulesDir, "nana-personal.md"), ownerLayout.piPackConfig, ownerLayout.piObjective,
  ownerLayout.subagentConfig, ownerLayout.reviewerAgent,
  ...["nana-objective.sh", "nana-adoption.sh", "nana-shared-memory.sh", "verifier-pipe.mjs"].map((name) => path.join(ownerLayout.hooksDir, name)),
  ...["nana-soul.md", "nana-standards.md", "nana-writing.md"].map((name) => path.join(ownerLayout.rulesDir, name)),
  ...["requirements", "spec", "py-lint", "py-review", "py-test"].map((name) => path.join(ownerLayout.skillsDir, name)),
  ...["pi-review", "pi-worker", "nana-land", "nana-setup"].map((name) => path.join(ownerLayout.binDir, name)),
];
const installKinds = ["settings-entry", "seed", "seed", "seed", "seed", "seed", "seed", ...Array(16).fill("link")];
const uncoveredInstallTargets = installTargets.filter((target, index) => !installedRows.some((row) => row.owner === "nana-setup" && row.kind === installKinds[index] && row.source.startsWith("packages/nana-setup/lib/steps.mjs") && path.resolve(row.path) === path.resolve(target)));
const missingInstallTargets = installTargets.filter((target) => { try { fs.lstatSync(target); return false; } catch { return true; } });
// req: R-954
check("every path created by install maps to a nana-setup-owned manifest row", install.status === 0 && uncoveredInstallTargets.length === 0 && missingInstallTargets.length === 0, `${install.status} ${install.stderr} unmapped=${uncoveredInstallTargets.join(", ")} absent=${missingInstallTargets.join(", ")}`);
const home = tmpDir(path.join(os.tmpdir(), "state-readonly-"));
const cli = path.resolve(new URL("../bin/nana-setup.mjs", import.meta.url).pathname);
const agent = path.join(home, ".pi", "agent");
fs.mkdirSync(agent, { recursive: true });
for (const name of ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json", "trust.json"]) fs.writeFileSync(path.join(agent, name), "secret-marker");
for (const name of ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json"]) fs.chmodSync(path.join(agent, name), 0);
const snapshot = (root) => {
  const out = [];
  const visit = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); const stat = fs.lstatSync(file); let bytes = ""; if (stat.isFile()) { try { bytes = fs.readFileSync(file).toString("base64"); } catch (err) { if (err.code !== "EACCES") throw err; bytes = "unreadable"; } } out.push([path.relative(root, file), stat.mode, stat.mtimeMs, bytes].join("\0")); if (stat.isDirectory()) visit(file); } };
  visit(root); return out.sort().join("\n");
};
const before = snapshot(home);
const state = spawnSync(process.execPath, [cli, "state", "--home", home], { encoding: "utf8" });
const paths = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home], { encoding: "utf8" });
const expectedState = stateRows(resolveLayout({ home })).map((row) => `${row.store}\t${row.class}\t${row.owner}\t${row.path}\t${fs.existsSync(row.path) ? "present" : "absent"}`).sort();
// req: R-956
check("state prints exact row parity and preserves bytes, modes and mtimes", state.status === 0 && JSON.stringify(state.stdout.trim().split("\n").sort()) === JSON.stringify(expectedState) && snapshot(home) === before, `${state.status} ${state.stderr}`);
// req: R-956
check("state --paths succeeds with mode-zero secrets and preserves bytes, modes and mtimes", paths.status === 0 && snapshot(home) === before, `${paths.status} ${paths.stderr}`);
const agentAlias = path.join(home, ".pi", "agent");
fs.mkdirSync(agentAlias, { recursive: true });
const defaultLayout = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home], { encoding: "utf8" });
// req: R-957
check("default disjoint home roots still produce a paths listing", defaultLayout.status === 0, `${defaultLayout.status} ${defaultLayout.stderr}`);
const reversedLink = path.join(home, "claude-link");
fs.symlinkSync(agentAlias, reversedLink, process.platform === "win32" ? "junction" : "dir");
const reversedAlias = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home, "--claude-home", reversedLink, "--pi-home", agentAlias], { encoding: "utf8" });
// req: R-957
check("refuses reversed symlink alias between Claude and pi home roots", reversedAlias.status === 2 && /overlapping roots: Claude home and pi home/.test(reversedAlias.stderr), `${reversedAlias.status} ${reversedAlias.stderr}`);
const nestedPiHome = path.join(home, ".local", "share", "nana", "agent");
fs.mkdirSync(nestedPiHome, { recursive: true });
const nestedPi = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home, "--pi-home", nestedPiHome], { encoding: "utf8" });
// req: R-957
check("refuses pi home nested beneath durable nana share", nestedPi.status === 2 && /overlapping roots: pi home and nana share/.test(nestedPi.stderr), `${nestedPi.status} ${nestedPi.stderr}`);
const nestedClaude = path.join(home, ".pi", "agent", "apps", "custom", ".claude");
const deeperClaude = path.join(home, ".pi", "agent", "apps", "nested", "one", ".claude");
for (const claudeHome of [nestedClaude, deeperClaude]) {
  fs.mkdirSync(claudeHome, { recursive: true });
  fs.writeFileSync(path.join(claudeHome, ".credentials.json"), "credential marker");
  fs.writeFileSync(path.join(claudeHome, "settings.json"), "private settings marker");
}
const nestedSecrets = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home, "--pi-home", path.join(home, ".pi", "agent"), "--claude-home", nestedClaude], { encoding: "utf8" });
const deeperSecrets = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home, "--pi-home", path.join(home, ".pi", "agent"), "--claude-home", deeperClaude], { encoding: "utf8" });
// req: R-957
check("refuses Claude home nested beneath pi home at two depths", nestedSecrets.status === 2 && deeperSecrets.status === 2 && /overlapping roots: Claude home and pi home/.test(nestedSecrets.stderr) && /overlapping roots: Claude home and pi home/.test(deeperSecrets.stderr), `${nestedSecrets.status} ${nestedSecrets.stderr}\n${deeperSecrets.status} ${deeperSecrets.stderr}`);
for (const claudeHome of [nestedClaude, deeperClaude]) { fs.unlinkSync(path.join(claudeHome, ".credentials.json")); fs.unlinkSync(path.join(claudeHome, "settings.json")); }
const external = path.join(home, "outside-projects");
fs.mkdirSync(path.join(external, "memory"), { recursive: true });
fs.writeFileSync(path.join(external, "memory", "foreign.md"), "foreign");
const projects = path.join(home, ".claude", "projects");
fs.mkdirSync(projects, { recursive: true });
fs.symlinkSync(external, path.join(projects, "linked"), process.platform === "win32" ? "junction" : "dir");
const symlinkPaths = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home], { encoding: "utf8" });
// req: R-957
check("wildcard parent symlink outside home is silently skipped", symlinkPaths.status === 0 && !symlinkPaths.stdout.includes("foreign.md") && !symlinkPaths.stderr.includes("linked"), `${symlinkPaths.stdout}\n${symlinkPaths.stderr}`);
for (const name of ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json"]) fs.chmodSync(path.join(agent, name), 0o600);
const control = path.join(home, ".claude", "nana-memory", "shared", "bad\nname.md");
fs.mkdirSync(path.dirname(control), { recursive: true }); fs.writeFileSync(control, "bad");
const controlPaths = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home], { encoding: "utf8" });
// req: R-957
check("control-character durable names exit 2 and name the store", controlPaths.status === 2 && /control character in durable store shared memory/.test(controlPaths.stderr), controlPaths.stderr);
fs.unlinkSync(control);
const durableFile = path.join(home, ".claude", "rules", "nana-personal.md");
fs.mkdirSync(path.dirname(durableFile), { recursive: true }); fs.writeFileSync(durableFile, "durable fixture");
fs.writeFileSync(path.join(agent, "desk.log"), "disposable fixture"); fs.writeFileSync(path.join(agent, "auth.json"), "secret fixture"); fs.writeFileSync(path.join(agent, "trust.json"), "ratified fixture");
fs.writeFileSync(path.join(agent, "nana-objective.md"), "durable fixture");
fs.writeFileSync(path.join(agent, "settings.json"), "durable fixture");
const classPaths = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home], { encoding: "utf8" });
// req: R-957
check("paths output is home-relative regular-file durable-only output", classPaths.status === 0 && JSON.stringify(classPaths.stdout.trim().split("\n").sort()) === JSON.stringify([".claude/rules/nana-personal.md", ".pi/agent/nana-objective.md", ".pi/agent/settings.json"].sort()) && classPaths.stdout.split("\n").filter(Boolean).every((name) => !path.isAbsolute(name) && !name.startsWith("-") && fs.lstatSync(path.join(home, name)).isFile()), classPaths.stdout);
const outside = path.join(os.tmpdir(), "state-outside-agent");
const escaped = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home, "--pi-home", outside], { encoding: "utf8" });
// req: R-957
check("state --paths rejects an external durable store and names it", escaped.status === 2 && /outside home: pi pack config/.test(escaped.stderr), `${escaped.status} ${escaped.stderr}`);
const dashHome = path.join(home, "-custom-claude");
const dashRule = path.join(dashHome, "rules", "nana-personal.md");
fs.mkdirSync(path.dirname(dashRule), { recursive: true }); fs.writeFileSync(dashRule, "durable rule");
const leadingDash = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home, "--claude-home", dashHome, "--pi-home", agent], { encoding: "utf8" });
// req: R-957
check("state --paths rejects leading-dash paths in custom homes", leadingDash.status === 2 && /leading dash in durable store private rule/.test(leadingDash.stderr), `${leadingDash.status} ${leadingDash.stdout}\n${leadingDash.stderr}`);
process.exit(fails);
