/**
 * @module packages/nana-setup/tests/restore.test.mjs
 * @purpose Exercises the documented state listing and restore contract using isolated temporary homes.
 * @inputs setup CLI, state manifest and setup README.
 * @outputs PASS/FAIL checks and process exit status.
 * @effects disk (temporary fixture roots only).
 * @errors Failed checks increment the exit status.
 */
import * as os from "node:os";
import * as path from "node:path";
import * as fs from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
import { stateRows } from "../lib/state-manifest.mjs";
import { resolveLayout } from "../lib/paths.mjs";

let fails = 0;
const check = (name, ok, detail = "") => { console.log(ok ? "PASS" : "FAIL", name, ok ? "" : detail); if (!ok) fails++; };
const readme = fs.readFileSync(new URL("../README.md", import.meta.url), "utf8");
check("README backup and extraction commands are byte-exact", readme.includes("node packages/nana-setup/bin/nana-setup.mjs state --paths > ~/nana-state.list && tar -czf ~/nana-state.tgz -C ~ -T ~/nana-state.list") && readme.includes("tar -xzkf ~/nana-state.tgz -C ~"));
const root = tmpDir(path.join(os.tmpdir(), "state-restore-"));
const home = path.join(root, "home");
const destination = path.join(root, "destination");
const shared = path.join(root, "shared-source");
fs.mkdirSync(home);
fs.mkdirSync(destination);
fs.mkdirSync(shared);
const layout = resolveLayout({ home });
const rows = stateRows(layout);
const durable = rows.filter((row) => row.class === "durable");
const secret = rows.filter((row) => row.class === "secret");
const cli = path.resolve(new URL("../bin/nana-setup.mjs", import.meta.url).pathname);
const result = spawnSync(process.execPath, [cli, "state", "--home", home], { encoding: "utf8" });
// req: R-956
check("state inventory lists one presence result for every store", result.status === 0 && rows.every((row) => result.stdout.includes(row.store) && result.stdout.includes(row.class)), `${result.status} ${result.stderr}`);
check("fresh restore target has every durable store absent", result.status === 0 && durable.every((row) => !fs.existsSync(row.path)), `${result.status} ${result.stderr}`);
check("secret stores are excluded from durable archive paths", !durable.some((row) => secret.includes(row)));
const privateRule = path.join(layout.rulesDir, "nana-personal.md");
const memoryFile = path.join(layout.sharedMemoryDir, "memory.md");
const ledgerFile = durable.find((row) => row.store === "review ledger tally")?.path;
fs.mkdirSync(path.dirname(privateRule), { recursive: true });
fs.mkdirSync(path.dirname(memoryFile), { recursive: true });
fs.mkdirSync(path.dirname(ledgerFile), { recursive: true });
fs.writeFileSync(privateRule, "private durable bytes\n");
fs.writeFileSync(memoryFile, "shared durable bytes\n");
fs.writeFileSync(ledgerFile, "ledger durable bytes\n");
fs.symlinkSync(shared, path.join(layout.sharedMemoryDir, "external-link"));
const listing = path.join(root, "state.list");
const archive = path.join(root, "state.tgz");
const emitted = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home], { encoding: "utf8" });
fs.writeFileSync(listing, emitted.stdout);
const archived = spawnSync("tar", ["-czf", archive, "-C", home, "-T", listing], { encoding: "utf8" });
const listed = spawnSync("tar", ["-tzf", archive], { encoding: "utf8" });
const extracted = spawnSync("tar", ["-xzkf", archive, "-C", destination], { encoding: "utf8" });
// req: R-957
check("documented archive restores durable bytes and excludes symlinks", emitted.status === 0 && archived.status === 0 && listed.status === 0 && extracted.status === 0 && fs.readFileSync(path.join(destination, path.relative(home, privateRule)), "utf8") === "private durable bytes\n" && fs.readFileSync(path.join(destination, path.relative(home, memoryFile)), "utf8") === "shared durable bytes\n" && fs.readFileSync(path.join(destination, path.relative(home, ledgerFile)), "utf8") === "ledger durable bytes\n" && !listed.stdout.includes("external-link"), `${emitted.stderr} ${archived.stderr} ${listed.stderr} ${extracted.stderr}`);
check("trust is re-ratified and excluded from the durable archive", rows.some((row) => row.store === "project trust" && row.class === "re-ratified") && !durable.some((row) => row.store === "project trust"), "project trust row missing or archived");
check("restore instructions require trust before doctor and reinstall network-owned extension", ["nana-setup trust <dir>", "pi install npm:pi-subagents@0.75.0", "doctor"].every((s) => readme.includes(s)));
process.exit(fails);
