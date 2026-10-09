/**
 * @module packages/nana-setup/tests/restore.test.mjs
 * @purpose Exercises the documented state listing and complete restore using isolated temporary homes.
 * @inputs setup CLI, state manifest, pi trust API and setup README.
 * @outputs PASS/FAIL checks and process exit status.
 * @effects disk (temporary fixture roots only), process (setup CLI and tar).
 * @errors Failed checks increment the exit status.
 */
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
import { stateRows } from "../lib/state-manifest.mjs";
import { resolveLayout } from "../lib/paths.mjs";
import { spawnNpmRoot } from "../lib/npm-root.mjs";
import { projectMemoryDir } from "../lib/project-key.mjs";

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
const root = tmpDir(path.join(os.tmpdir(), "state-restore-"));
const home = path.join(root, "source-home");
const destination = path.join(root, "destination-home");
const clone = path.join(root, "clone");
const project = path.join(clone, "product");
fs.mkdirSync(home, { recursive: true });
fs.mkdirSync(destination, { recursive: true });
fs.mkdirSync(path.join(project, ".pi"), { recursive: true });
const objective = path.join(clone, "OBJECTIVE.md");
const knowledgeRoot = path.join(clone, "knowledge");
fs.mkdirSync(knowledgeRoot);
fs.writeFileSync(objective, "shared objective bytes\n");
fs.writeFileSync(path.join(knowledgeRoot, "one.md"), "knowledge fixture\n");
fs.writeFileSync(path.join(project, ".pi", "nana-pack.json"), JSON.stringify({ objective: { path: objective } }));
const cli = path.resolve(new URL("../bin/nana-setup.mjs", import.meta.url).pathname);
const nodeModules = spawnNpmRoot().stdout.trim();
const { ProjectTrustStore } = await import(path.join(nodeModules, "@earendil-works", "pi-coding-agent", "dist", "core", "trust-manager.js"));
const run = (args, cwd = root) => spawnSync(process.execPath, [cli, ...args], { cwd, encoding: "utf8", env: { ...process.env, HOME: home, PI_CODING_AGENT_DIR: path.join(home, ".pi", "agent") } });
const readme = fs.readFileSync(new URL("../README.md", import.meta.url), "utf8");
const backup = "node packages/nana-setup/bin/nana-setup.mjs state --paths > ~/nana-state.list && tar -czf ~/nana-state.tgz -C ~ -T ~/nana-state.list";
const extraction = "tar -xzkf ~/nana-state.tgz -C ~";
// req: R-958
check("README backup and extraction commands are byte-exact", readme.includes(backup) && readme.includes(extraction));
const installed = run(["install", "--home", home]);
check("source home installs", installed.status === 0, `${installed.status} ${installed.stderr} ${installed.stdout}`);
const sourceLayout = resolveLayout({ home });
const sourceRows = stateRows(sourceLayout);
const durable = sourceRows.filter((row) => row.class === "durable");
const NON_DURABLE_FIXTURE_STORES = [
  "subagent config.json", "reviewer.md", "hook nana-objective.sh", "hook nana-adoption.sh", "hook nana-shared-memory.sh", "hook verifier-pipe.mjs",
  "rule link nana-soul.md", "rule link nana-standards.md", "rule link nana-writing.md", "skill link requirements", "skill link spec", "skill link py-lint", "skill link py-review", "skill link py-test",
  "bin link pi-review", "bin link pi-worker", "bin link nana-land", "bin link nana-setup", "desk plist", "pi-subagents package manifest", "knowledge index", "project memory shared links",
  "project trust", "review ledger lock", "review ledger reservations", "suite lock", "knowledge shown", "knowledge build lock", "desk log", "MCP cache", "handoffs", "nana journal",
  "auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json", "Claude credentials", "Claude settings", "Claude login", "pi sessions", "Claude transcripts", "pi bench agent", "desk stage keys",
];
const byStore = new Map(sourceRows.map((row) => [row.store, row]));
fs.mkdirSync(path.dirname(sourceLayout.piPackConfig), { recursive: true });
fs.writeFileSync(sourceLayout.piPackConfig, JSON.stringify({ objective: { path: objective } }));
const privateRule = byStore.get("private rule").path;
const sharedMemory = byStore.get("shared memory").path;
const memoryDir = projectMemoryDir(sourceLayout.projectsDir, project);
fs.mkdirSync(path.dirname(privateRule), { recursive: true });
fs.mkdirSync(sharedMemory, { recursive: true });
fs.mkdirSync(memoryDir, { recursive: true });
fs.writeFileSync(privateRule, "private rule bytes\n");
fs.writeFileSync(path.join(sharedMemory, "one.md"), "shared memory one\n");
fs.writeFileSync(path.join(sharedMemory, "two.md"), "shared memory two\n");
fs.writeFileSync(path.join(memoryDir, "project.md"), "project memory bytes\n");
fs.symlinkSync(sharedMemory, path.join(memoryDir, "shared"), process.platform === "win32" ? "junction" : "dir");
const transcript = path.join(sourceLayout.projectsDir, path.basename(path.dirname(memoryDir)), "session.jsonl");
fs.mkdirSync(path.dirname(transcript), { recursive: true }); fs.writeFileSync(transcript, "secret:wildcard transcript\n");
fs.mkdirSync(path.join(sourceLayout.piHome, "apps"), { recursive: true });
fs.writeFileSync(path.join(sourceLayout.piHome, "apps", "app.txt"), "app fixture\n");
fs.mkdirSync(path.join(home, ".local", "share", "nana"), { recursive: true });
fs.writeFileSync(path.join(home, ".local", "share", "nana", "state.dat"), "share bytes\n");
const ledger = sourceRows.filter((row) => ["review ledger tally", "review ledger audit", "review ledger rotated"].includes(row.store));
for (const [index, row] of ledger.entries()) {
  fs.mkdirSync(path.dirname(row.path), { recursive: true });
  fs.writeFileSync(row.path, `ledger bytes ${index}\n`);
}
for (const row of durable.filter((entry) => !["private rule", "shared memory", "project memories", ...ledger.map((r) => r.store)].includes(entry.store))) {
  if (row.path.includes("*")) continue;
  if (row.kind === "dir" || row.kind === "dir-pattern") fs.mkdirSync(row.path, { recursive: true });
  else { fs.mkdirSync(path.dirname(row.path), { recursive: true }); fs.writeFileSync(row.path, `durable ${row.store}\n`); }
}
fs.mkdirSync(path.join(sourceLayout.knowledgeHome), { recursive: true });
fs.writeFileSync(path.join(sourceLayout.knowledgeHome, "sources.json"), JSON.stringify({ roots: [knowledgeRoot] }));
fs.writeFileSync(path.join(sourceLayout.knowledgeHome, "pull.log"), "pull bytes\n");
fs.writeFileSync(sourceLayout.piPackConfig, JSON.stringify({ objective: { path: objective } }));
fs.mkdirSync(path.join(home, ".local", "share", "nana"), { recursive: true });
const secrets = sourceRows.filter((row) => row.class === "secret");
const forbiddenArchivePaths = ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json"].map((name) => path.relative(home, path.join(sourceLayout.piHome, name))).concat([path.relative(home, path.join(sourceLayout.piHome, "trust.json")), path.relative(home, path.join(sourceLayout.claudeHome, ".credentials.json")), path.relative(home, sourceLayout.claudeSettings), path.relative(home, transcript)], sourceRows.filter((row) => ["review ledger lock", "review ledger reservations", "suite lock", "knowledge shown", "knowledge build lock", "desk log", "MCP cache", "handoffs", "nana journal"].includes(row.store)).map((row) => path.relative(home, row.path)));
for (const store of ["review ledger lock", "review ledger reservations", "suite lock", "knowledge shown", "knowledge build lock", "desk log", "MCP cache", "handoffs", "nana journal"]) {
  const row = byStore.get(store);
  if (row.kind === "dir") { if (fs.existsSync(row.path) && !fs.statSync(row.path).isDirectory()) fs.unlinkSync(row.path); fs.mkdirSync(row.path, { recursive: true }); fs.writeFileSync(path.join(row.path, "disposable.txt"), `disposable:${store}`); }
  else { fs.mkdirSync(path.dirname(row.path), { recursive: true }); fs.writeFileSync(row.path, `disposable:${store}`); }
}
for (const row of secrets) {
  const secretPath = row.path.includes("*") ? transcript : row.path;
  fs.mkdirSync(path.dirname(secretPath), { recursive: true });
  if (row.kind === "dir") { fs.mkdirSync(secretPath, { recursive: true }); fs.writeFileSync(path.join(secretPath, "marker.txt"), `secret:${row.store}`); }
  else fs.writeFileSync(secretPath, row.store === "Claude transcripts" ? "secret:wildcard transcript\n" : `secret:${row.store}`);
}
const trustSrc = run(["trust", project, "--yes", "--home", home], project);
check("source project trust is recorded", trustSrc.status === 0 && new ProjectTrustStore(sourceLayout.piHome).get(project) === true, `${trustSrc.status} ${trustSrc.stderr}`);
const listingFile = path.join(root, "state.list");
const archive = path.join(root, "state.tgz");
const listedPaths = run(["state", "--paths", "--home", home]);
fs.writeFileSync(listingFile, listedPaths.stdout);
const archived = spawnSync("tar", ["-czf", archive, "-C", home, "-T", listingFile], { encoding: "utf8" });
const tarList = spawnSync("tar", ["-tzf", archive], { encoding: "utf8" });
const listedNames = listedPaths.stdout.trim().split("\n").filter(Boolean).sort();
const archiveNames = tarList.stdout.trim().split("\n").filter(Boolean).map((name) => name.replace(/\/$/, "")).sort();
const allSourceEntries = [];
const collectSourceEntries = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); allSourceEntries.push(file); if (entry.isDirectory()) collectSourceEntries(file); } };
collectSourceEntries(home);
const nonDurableFixtures = allSourceEntries.filter((candidate) => sourceRows.some((row) => {
  if (!NON_DURABLE_FIXTURE_STORES.includes(row.store)) return false;
  const pattern = path.resolve(row.path).split(path.sep).join("/");
  const candidatePath = path.resolve(candidate).split(path.sep).join("/");
  if (!pattern.includes("*")) return candidatePath === pattern || candidatePath.startsWith(`${pattern}/`);
  const expression = new RegExp(`^${pattern.split("*").map((part) => part.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join(".*")}(?:/.*)?$`);
  return expression.test(candidatePath);
}));
const expectedDurableFiles = [
  privateRule, path.join(sharedMemory, "MEMORY.md"), path.join(sharedMemory, "one.md"), path.join(sharedMemory, "two.md"),
  path.join(memoryDir, "project.md"), ...ledger.map((row) => row.path), sourceLayout.piPackConfig, sourceLayout.piObjective,
  sourceLayout.piSettings, path.join(sourceLayout.knowledgeHome, "sources.json"), path.join(sourceLayout.knowledgeHome, "pull.log"),
  path.join(sourceLayout.piHome, "apps", "app.txt"), path.join(home, ".local", "share", "nana", "state.dat"),
].filter((file) => fs.existsSync(file));
const expectedRelative = expectedDurableFiles.map((file) => path.relative(home, file).split(path.sep).join("/")).sort();
// req: R-958
check("independent durable fixtures are all listed", expectedRelative.every((name) => listedNames.includes(name)), `${expectedRelative.filter((name) => !listedNames.includes(name)).join(", ")}\n${listedPaths.stderr}\n${listedNames.join("\n")}`);
// req: R-958
check("archive excludes every independently derived non-durable fixture", listedPaths.status === 0 && archived.status === 0 && tarList.status === 0 && JSON.stringify(archiveNames) === JSON.stringify(listedNames) && !nonDurableFixtures.some((fixture) => { const relative = path.relative(home, fixture).split(path.sep).join("/"); return archiveNames.some((name) => name === relative || name.startsWith(`${relative}/`)); }) && !archiveNames.some((name) => forbiddenArchivePaths.some((forbidden) => name === forbidden || name.startsWith(`${forbidden}/`))), `${listedPaths.stderr} ${archived.stderr} ${tarList.stderr} excluded fixtures=${nonDurableFixtures.map((file) => path.relative(home, file)).join(", ")}`);
const clean = run(["state", "--home", destination]);
// req: R-958
check("clean destination reports every durable store absent", clean.status === 0 && stateRows(resolveLayout({ home: destination })).filter((row) => row.class === "durable").every((row) => clean.stdout.split("\n").some((line) => line.startsWith(`${row.store}\t`) && line.endsWith("\tabsent"))), `${clean.status} ${clean.stderr}`);
const extracted = spawnSync("tar", ["-xzkf", archive, "-C", destination], { encoding: "utf8" });
const extractedEntries = [];
const collectExtractedEntries = (dir) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); extractedEntries.push(file); const stat = fs.lstatSync(file); if (stat.isDirectory()) collectExtractedEntries(file); } };
collectExtractedEntries(destination);
// req: R-958
check("extracted archive entries contain no symlink of any target", extracted.status === 0 && extractedEntries.every((file) => !fs.lstatSync(file).isSymbolicLink()), `${extracted.status} ${extracted.stderr} ${extractedEntries.filter((file) => fs.lstatSync(file).isSymbolicLink()).join(", ")}`);
const installDst = spawnSync(process.execPath, [cli, "install", "--home", destination], { encoding: "utf8", env: { ...process.env, HOME: destination, PI_CODING_AGENT_DIR: path.join(destination, ".pi", "agent") } });
const dstLayout = resolveLayout({ home: destination });
const packageRoot = path.join(dstLayout.piHome, "npm", "node_modules", "pi-subagents");
fs.mkdirSync(packageRoot, { recursive: true });
fs.writeFileSync(path.join(packageRoot, "package.json"), JSON.stringify({ name: "pi-subagents", version: "0.75.0" }));
const doctorBefore = spawnSync(process.execPath, [cli, "doctor", "--home", destination], { cwd: project, encoding: "utf8", env: { ...process.env, HOME: destination, PI_CODING_AGENT_DIR: path.join(destination, ".pi", "agent") } });
const warningRows = doctorBefore.stdout.split("\n").filter((line) => /^\s*[!✗]/u.test(line));
// req: R-959
check("restored doctor reports project trust only", extracted.status === 0 && installDst.status === 0 && doctorBefore.status === 1 && warningRows.length === 1 && /^\s*! .*project trust/u.test(warningRows[0]), `${doctorBefore.status}\n${warningRows.join("\n")}\n${doctorBefore.stderr}`);
const trustDst = spawnSync(process.execPath, [cli, "trust", project, "--yes", "--home", destination], { cwd: project, encoding: "utf8", env: { ...process.env, HOME: destination, PI_CODING_AGENT_DIR: path.join(destination, ".pi", "agent") } });
const doctorAfter = spawnSync(process.execPath, [cli, "doctor", "--home", destination], { cwd: project, encoding: "utf8", env: { ...process.env, HOME: destination, PI_CODING_AGENT_DIR: path.join(destination, ".pi", "agent") } });
const afterBad = doctorAfter.stdout.split("\n").filter((line) => /^\s*[!✗]/u.test(line));
// req: R-959
check("trust clears the only doctor warning", trustDst.status === 0 && doctorAfter.status === 0 && afterBad.length === 0, `${trustDst.status}; ${doctorAfter.status}\n${doctorAfter.stdout}\n${doctorAfter.stderr}`);
const sourceBytes = new Map(expectedDurableFiles.map((file) => [path.relative(home, file).split(path.sep).join("/"), fs.readFileSync(file)]));
let byteEqual = true;
for (const [relative, bytes] of sourceBytes) {
  try { if (!fs.readFileSync(path.join(destination, relative)).equals(bytes)) byteEqual = false; } catch { byteEqual = false; }
}
// req: R-958
check("every independently expected durable fixture restores byte-equal", byteEqual, [...sourceBytes.keys()].filter((name) => !fs.existsSync(path.join(destination, name))).join(", "));
const walk = (dir, found = []) => { for (const entry of fs.readdirSync(dir, { withFileTypes: true })) { const file = path.join(dir, entry.name); found.push(file); if (entry.isDirectory()) walk(file, found); } return found; };
const destinationPaths = walk(destination);
const symlinkIntoSource = destinationPaths.filter((file) => { try { return fs.lstatSync(file).isSymbolicLink() && fs.realpathSync(file).startsWith(home + path.sep); } catch { return false; } });
const secretLeak = destinationPaths.filter((file) => { try { return fs.lstatSync(file).isFile() && fs.readFileSync(file, "utf8").includes("secret:"); } catch { return false; } });
const sourcePathLeak = destinationPaths.filter((file) => { try { return fs.lstatSync(file).isFile() && fs.readFileSync(file).includes(Buffer.from(home)); } catch { return false; } });
// req: R-958
check("destination has no secret markers", secretLeak.length === 0, secretLeak.join(", "));
// req: R-958
check("destination has no symlink resolving into source home", symlinkIntoSource.length === 0, symlinkIntoSource.join(", "));
// req: R-958
check("destination files contain no source-home path", sourcePathLeak.length === 0, sourcePathLeak.join(", "));
process.exit(fails ? 1 : 0);
