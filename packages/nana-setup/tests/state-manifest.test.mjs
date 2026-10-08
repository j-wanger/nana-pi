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
check("each manifest row has one allowed class and complete ownership metadata", rows.length > 0 && rows.every((r) => Object.values(STATE_CLASSES).includes(r.class) && r.owner && r.kind && r.source && r.restore && path.isAbsolute(r.path)));
const containers = ["base", "claudeHome", "piHome", "hooksDir", "rulesDir", "skillsDir", "projectsDir", "binDir", "launchAgentsDir"];
const pathEntries = Object.entries(layout).filter(([key, value]) => typeof value === "string" && path.isAbsolute(value) && !containers.includes(key));
// req: R-955
check("every resolved layout path except declared containers is inventoried", pathEntries.every(([, value]) => byPath.has(path.resolve(value))), pathEntries.filter(([, value]) => !byPath.has(path.resolve(value))).map(([key]) => key).join(", "));
const ledger = ledgerPaths(layout.base);
// req: R-955
check("manifest ledger paths equal ledgerPaths(home)", ["tally", "audit", "rotated", "lock", "resDir"].every((key) => rows.some((r) => path.resolve(r.path) === path.resolve(ledger[key]))));
const secretNames = ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json", ".credentials.json", "settings.json", "stage-keys", "sessions", "bench-agent"];
// req: R-954
check("secret-capable stores are classified as secret", secretNames.every((name) => rows.some((r) => path.basename(r.path) === name && r.class === "secret")), secretNames.filter((name) => !rows.some((r) => path.basename(r.path) === name && r.class === "secret")).join(", "));
const home = tmpDir(path.join(os.tmpdir(), "state-readonly-"));
const cli = path.resolve(new URL("../bin/nana-setup.mjs", import.meta.url).pathname);
const agent = path.join(home, ".pi", "agent");
fs.mkdirSync(agent, { recursive: true });
for (const name of ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json", "trust.json"]) fs.writeFileSync(path.join(agent, name), "secret-marker");
for (const name of ["auth.json", "mcp-auth.json", "models.json", "models-store.json", "mcp.json"]) fs.chmodSync(path.join(agent, name), 0);
const before = fs.readdirSync(home, { recursive: true }).sort().join("\n");
const state = spawnSync(process.execPath, [cli, "state", "--home", home], { encoding: "utf8" });
const paths = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home], { encoding: "utf8" });
// req: R-956
check("state is read-only and succeeds with inaccessible secret stores", state.status === 0 && state.stdout.includes("secret") && fs.readdirSync(home, { recursive: true }).sort().join("\n") === before, `${state.status} ${state.stderr}`);
// req: R-957
check("state --paths is read-only with inaccessible secret stores", paths.status === 0 && fs.readdirSync(home, { recursive: true }).sort().join("\n") === before, `${paths.status} ${paths.stderr}`);
const outside = path.join(os.tmpdir(), "state-outside-agent");
const escaped = spawnSync(process.execPath, [cli, "state", "--paths", "--home", home, "--pi-home", outside], { encoding: "utf8" });
// req: R-957
check("state --paths rejects an external durable store and names it", escaped.status === 2 && /outside home: pi pack config/.test(escaped.stderr), `${escaped.status} ${escaped.stderr}`);
process.exit(fails);
