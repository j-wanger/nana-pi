#!/usr/bin/env node
// Seat acceptance for lane seat-rule (2026-10-16). Run from anywhere inside the checkout. Checks, by bytes and by the
// rail's own reading, that the build put the planned guide, test and row in place, and nothing else moved:
// (g) the guide equals nana-seat.proposed.md byte for byte; (t) the test equals proposed-seat-rule.test.mjs byte for byte;
// (r) R-1140's requirement cell equals r1140.txt, reads implemented, and its evidence cites each R-1140 title of the test;
// (s) the pair simulation still prints RESULT 26/26; (f) the merge-base diff lists only the planned paths.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const root = spawnSync("git", ["rev-parse", "--show-toplevel"], { cwd: HERE, encoding: "utf8" }).stdout.trim();
const rel = (p) => path.join(root, p);
const read = (p) => { try { return fs.readFileSync(p); } catch { return null; } };
let n = 0, miss = 0;
const out = (label, got, want) => { n++; const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) miss++; console.log(`${ok ? "ok  " : "MISS"} ${label}${ok ? "" : ` → ${JSON.stringify(got)} (want ${JSON.stringify(want)})`}`); };

const GUIDE = "packages/nana-setup/claude/rules/nana-seat.md", TEST = "packages/nana-setup/tests/seat-rule.test.mjs";
const g = read(rel(GUIDE)), gp = read(path.join(HERE, "nana-seat.proposed.md"));
out("(g) the seat guide equals nana-seat.proposed.md byte for byte", g !== null && gp !== null && g.equals(gp), true);
const t = read(rel(TEST)), tp = read(path.join(HERE, "proposed-seat-rule.test.mjs"));
out("(t) the seat-rule test equals proposed-seat-rule.test.mjs byte for byte", t !== null && tp !== null && t.equals(tp), true);

const req = (read(rel("REQUIREMENTS.md")) ?? Buffer.from("")).toString("utf8").split("\n");
const row = req.find((l) => /^\|\s*R-1140\s*\|/.test(l));
const cells = row ? row.split(/(?<!\\)\|/).map((s) => s.trim()) : [];
const want = (read(path.join(HERE, "r1140.txt")) ?? Buffer.from("")).toString("utf8").trim();
out("(r) R-1140's requirement cell equals r1140.txt", cells[2] ?? null, want);
out("(r) R-1140 reads implemented", cells[3] ?? null, "implemented");
const titles = [...(tp ?? Buffer.from("")).toString("utf8").matchAll(/\/\/ req: ([^\n]*)\n\s*check\("([^"]+)"/g)].filter((m) => m[1].includes("R-1140")).map((m) => m[2]);
const cites = [...(cells[4] ?? "").matchAll(/`([^`]+)`/g)].map((m) => m[1]);
out("(r) R-1140's evidence cites every R-1140 title of the test", titles.length > 0 ? titles.filter((x) => !cites.includes(`${TEST}::${x}`)) : "no R-1140 titles found", []);

const sim = spawnSync(process.execPath, [path.join(HERE, "sim-pairs.mjs")], { cwd: HERE, encoding: "utf8", timeout: 240_000 });
out("(s) the pair simulation prints RESULT 26/26 as declared", (sim.stdout.match(/RESULT [^\n]*/g) ?? []).at(-1) ?? `exit ${sim.status}`, "RESULT 26/26 as declared");

const base = spawnSync("git", ["merge-base", "main", "HEAD"], { cwd: root, encoding: "utf8" }).stdout.trim();
const changed = spawnSync("git", ["diff", "--name-only", `${base}..HEAD`], { cwd: root, encoding: "utf8" }).stdout.split("\n").filter(Boolean);
const IN = [GUIDE, TEST, "REQUIREMENTS.md", "docs/code-map.md", "docs/requirements-tree.md", "HANDOFF.md", "docs/sessions/2026-10.md"];
out("(f) the merge-base diff lists only the planned paths and this review folder", changed.filter((p) => !IN.includes(p) && !p.startsWith("docs/reviews/seat-rule-2026-10-16/")), []);
out("(f) HANDOFF.md and the session entry are in the diff (the seat writes them before the final round)", ["HANDOFF.md", "docs/sessions/2026-10.md"].filter((p) => !changed.includes(p)), []);
console.log(`seat-rule acceptance: ${miss} mismatch(es) of ${n}`);
process.exit(miss ? 1 : 0);
