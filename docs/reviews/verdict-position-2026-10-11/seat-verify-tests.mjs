// Seat coverage check for the verdict-position lane (frozen). Every test title that existed at the lane's
// launch (fdee8c9) in the land and review-ledger test files must still exist, or be listed in
// test-title-map.json with the title that replaces it (which must exist). Nothing retires. Exits 1 on any gap.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const W = process.cwd();
const LAUNCH = "fdee8c9";
const FILES = ["packages/nana-pack/tests/land.test.mjs", "packages/nana-pack/tests/review-ledger.test.mjs"];
const RETIRABLE = new Set([]); // nothing may retire in this lane
const mapPath = join(W, "docs/reviews/verdict-position-2026-10-11/test-title-map.json");
const map = existsSync(mapPath) ? JSON.parse(readFileSync(mapPath, "utf8")) : {};
const pat = /\b(?:check|test|it)\(\s*(["'`])((?:\\.|(?!\1).)*)\1/g;
const titles = (text) => new Set([...text.matchAll(pat)].map((m) => m[2]));
let gaps = 0;
for (const f of FILES) {
  const old = spawnSync("git", ["show", `${LAUNCH}:${f}`], { cwd: W, encoding: "utf8" }).stdout;
  const now = titles(readFileSync(join(W, f), "utf8"));
  for (const t of titles(old)) {
    if (now.has(t)) continue;
    const entry = map[t];
    if (RETIRABLE.has(t) && entry?.retired) { console.log(`ok   retired: ${t}`); continue; }
    if (entry?.replacedBy && now.has(entry.replacedBy) && entry.why) { console.log(`ok   replaced: ${t} → ${entry.replacedBy}`); continue; }
    gaps++;
    console.log(`MISS ${f}: "${t}" is gone${entry ? " (map entry invalid: replacement missing, no reason, or not retirable)" : ""}`);
  }
}
console.log(`seat-verify-tests: ${gaps} gap(s)`);
process.exitCode = gaps ? 1 : 0;
