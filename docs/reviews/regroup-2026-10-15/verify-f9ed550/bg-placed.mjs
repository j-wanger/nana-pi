import * as fs from "node:fs"; import * as path from "node:path"; import { spawnSync } from "node:child_process";
import { ledgerRows, REGROUP } from "./mech.mjs";
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), "packet", "basketball-geek-HEAD-real-paths");
const real = path.join(process.env.HOME, "basketball-geek");
const prop = path.join(dir, "docs/regroup/proposal.json");
const p = JSON.parse(fs.readFileSync(prop, "utf8"));
const buf = fs.readFileSync(path.join(dir, "REQUIREMENTS.md"));
const railPaths = (cell) => (cell.includes("`") ? [...cell.matchAll(/`([^`]+)`/g)].map((m) => m[1]) : cell.split(",")).map((s) => s.trim()).filter((s) => s && s !== "—").map((s) => s.split("::")[0]);
let made = 0;
for (const r of ledgerRows(buf)) for (const q of railPaths(r.evidence)) { if (q.startsWith("..") || path.isAbsolute(q)) continue; if (fs.existsSync(path.join(real, q)) && fs.statSync(path.join(real, q)).isFile()) { fs.mkdirSync(path.dirname(path.join(dir, q)), { recursive: true }); fs.writeFileSync(path.join(dir, q), ""); made++; } }
const truly = ledgerRows(buf).filter((r) => !railPaths(r.evidence).some((q) => fs.existsSync(path.join(dir, q)))).map((r) => r.id);
console.log("placeholders", made, "| rows with no existing path by the rail's form:", truly.length, "of", ledgerRows(buf).length);
p.regroup.placed = Object.fromEntries(truly.map((id) => [id, "placed by its text"]));
const prop2 = path.join(dir, "docs/regroup/proposal-railform.json");
fs.writeFileSync(prop2, JSON.stringify(p, null, 2) + "\n");
const r = spawnSync(process.execPath, [REGROUP, "--root", dir, "--proposal", prop2, "--out", path.join(dir, "..", "bg-railform.md")], { encoding: "utf8" });
const err = r.stderr.split("\n").filter(Boolean);
console.log("exit", r.status, "problem lines", err.length); console.log(err.slice(0, 2).join("\n")); console.log(err.slice(-1).join("\n"));
