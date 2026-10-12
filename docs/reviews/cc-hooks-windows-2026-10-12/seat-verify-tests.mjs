// Seat coverage check for the cc-hooks-windows lane (frozen). Every test title that existed at the lane's
// launch (5139889) in the test files this lane edits must still exist, or be listed in
// test-title-map.json with the title that replaces it (which must exist), or — only the two R-978
// exemption tests — be retired. Exits 1 on any gap.
import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const W = process.cwd();
const LAUNCH = "5139889";
const FILES = ["packages/nana-setup/tests/settings-merge.test.mjs", "packages/nana-setup/tests/win32-degrade.test.mjs", "packages/nana-setup/tests/verifier-pipe.test.mjs", "packages/nana-setup/tests/doctor-runtime.test.mjs", "packages/nana-setup/tests/install.test.mjs", "packages/nana-pack/tests/pipe-guard.test.mjs", "packages/nana-pack/tests/templates-render.test.mjs"];
const RETIRABLE = new Set([]); // nothing may retire without a map entry and reason
const mapPath = join(W, "docs/reviews/cc-hooks-windows-2026-10-12/test-title-map.json");
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
    if (RETIRABLE.has(t) && entry?.retired) { console.log(`ok   retired (R-978): ${t}`); continue; }
    if (entry?.replacedBy && now.has(entry.replacedBy) && entry.why) { console.log(`ok   replaced: ${t} → ${entry.replacedBy}`); continue; }
    gaps++;
    console.log(`MISS ${f}: "${t}" is gone${entry ? " (map entry invalid: replacement missing, no reason, or not retirable)" : ""}`);
  }
}
console.log(`seat-verify-tests: ${gaps} gap(s)`);
process.exitCode = gaps ? 1 : 0;
