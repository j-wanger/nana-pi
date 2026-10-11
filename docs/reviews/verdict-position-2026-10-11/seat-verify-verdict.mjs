// Seat acceptance for lane verdict-position (frozen). Drives the REAL admit() + complete() of
// packages/nana-pack/bin/review-round.mjs under a scratch HOME and a scratch git repo, and reads the
// recorded verdict from the tally. Run from the repo root:
//   node docs/reviews/verdict-position-2026-10-11/seat-verify-verdict.mjs [~/yokai-world/docs/reviews]
// Part 2 (corpus) compares the real parser with seat-proto.mjs on every corpus file.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { verdict as proto } from "./seat-proto.mjs";

const repoRoot = process.cwd();
const mod = await import(path.join(repoRoot, "packages/nana-pack/bin/review-round.mjs"));
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "seat-verdict-"));
const home = path.join(tmp, "home"); fs.mkdirSync(home);
const repo = path.join(tmp, "repo"); fs.mkdirSync(repo);
const git = (...a) => spawnSync("git", ["-c", "user.name=s", "-c", "user.email=s@s", ...a], { cwd: repo, encoding: "utf8" });
git("init", "-q"); fs.writeFileSync(path.join(repo, "a"), "a"); git("add", "a"); git("commit", "-qm", "a");
const tally = path.join(home, ".pi", "agent", "review-ledger.rounds.jsonl");
let n = 0;
// SEAT_SELFTEST=1 runs every expectation against the prototype instead (checks the script itself).
const real = (textOrPath) => {
  if (process.env.SEAT_SELFTEST) return proto(fs.existsSync(textOrPath) ? fs.readFileSync(textOrPath, "utf8") : textOrPath).w;
  const item = `seat-${n++}`;
  const a = mod.admit(["--item", item, "--role", "sol"], { home, cwd: repo, launcher: "seat", model: "m" });
  if (!a.ok) return `ADMIT-FAILED ${a.message}`;
  const c = mod.complete(a.res, textOrPath, { home });
  if (!c.ok) return `COMPLETE-FAILED ${c.message}`;
  const last = fs.readFileSync(tally, "utf8").trim().split("\n").map((l) => JSON.parse(l)).filter((r) => r.item === item).at(-1);
  return last ? last.verdict : "NO-RECORD";
};

const cases = [
  // final-line branch, unchanged shapes
  ["VERDICT: LAND", "LAND"], ["# VERDICT: LAND", "LAND"], ["**VERDICT:** LAND", "LAND"], ["VERDICT: LAND.", "LAND"],
  ["VERDICT: LAND (9/10)", "LAND"], ["VERDICT: LAND — 9/10", "LAND"], ["**VERDICT: LAND — 9/10.**", "LAND"],
  ["VERDICT: LAND-WITH-FIXES", "LAND-WITH-FIXES"], ["VERDICT: LAND\r\n", "LAND"], ["VERDICT: LAND\n \t\n", "LAND"],
  ["> - **VERDICT:** LAND", "LAND"], ["body\n**VERDICT: LAND** (9/10)", "LAND"],
  ["Example:\n    VERDICT: LAND\nMore.\nVERDICT: SEND-BACK\n", "SEND-BACK"],
  // bare score now accepted on the final line too
  ["body\nVERDICT: LAND 9/10", "LAND"], ["body\nVERDICT: LAND 9.5/10", null],
  // first-line branch: yokai shapes
  ["VERDICT: LAND 9/10\n\n## Notes\nfine", "LAND"], ["VERDICT: LAND (9/10)\nnotes", "LAND"], ["VERDICT: LAND — 9/10\nnotes", "LAND"],
  ["VERDICT: LAND 9/10.\nnotes", "LAND"], ["VERDICT: SEND-BACK 4/10\nnotes", "SEND-BACK"], ["VERDICT: LAND-WITH-FIXES 8/10\nnotes", "LAND-WITH-FIXES"],
  ["VERDICT: LAND 9/10\r\nnotes\r\n", "LAND"], ["VERDICT: LAND\t\nnotes", "LAND"], ["\n\n  \nVERDICT: LAND\nnotes", "LAND"],
  ["﻿VERDICT: LAND 9/10\nnotes", "LAND"], ["VERDICT: LAND 9/10\nnotes without a final newline", "LAND"],
  // first-line branch: refused shapes
  ["`VERDICT: LAND`\nnotes", null], ["**VERDICT: LAND**\nnotes", null], [" VERDICT: LAND\nnotes", null], ["VERDICT:  LAND\nnotes", null],
  ["VERDICT: LAND 9.5/10\nnotes", null], ["VERDICT: PARTIAL — R-218, R-014\nnotes", null], ["VERDICT: LAND - 9/10\nnotes", null],
  ["VERDICT: LAND\nThe verdict holds.", null], ["VERDICT: LAND\nCorrection: the VERDICT is SEND-BACK", null],
  ["VERDICT: LAND\nV​ERDICT: SEND-BACK", null], ["VERDICT: LAND\nV͏ERDICT: SEND-BACK", null],
  ["VERDICT: LAND\nV️ERDICT: SEND-BACK", null], ["VERDICT: LAND\nVΕRDICT: SEND-BACK", null],
  ["VERDICT: LAND\nVЕRDICT: SEND-BACK", null], ["VERDICT: LAND\nＶＥＲＤＩＣＴ SEND-BACK", null],
  ["VERDICT: LAND\nXVERDICT: SEND-BACK", null],
  // the plan's corrected look-alike case: Greek capital Epsilon THEN "ERDICT" folds to "eerdict" — not the word
  ["VERDICT: LAND\nΕERDICT: SEND-BACK", "LAND"],
  // final-line branch with a first line carrying the label
  ["VERDICT: LAND (9/10)\nbody\nVERDICT: LAND", "LAND"], ["VERDICT: LAND 9/10\nbody\n**VERDICT:** LAND", "LAND"],
  ["VERDICT: SEND-BACK 4/10 — blockers remain\nbody\nVERDICT: LAND", null], ["VERDICT: SEND-BACK\nbody\nVERDICT: LAND", null],
  ["V​ERDICT: SEND-BACK\nFindings follow.\nVERDICT: LAND", null], ["V⁠ERDICT: SEND-BACK\nbody\nVERDICT: LAND", null],
  ["VΕRDICT: SEND-BACK\nbody\nVERDICT: LAND", null], ["VЕRDICT: SEND-BACK\nbody\nVERDICT: LAND", null],
  ["ＶＥＲＤＩＣＴ: SEND-BACK\nbody\nVERDICT: LAND", null], ["verdict: send-back\nbody\nVERDICT: LAND", null],
  ["VERDICT: LAND | FIX-FIRST | BLOCK\r\nVERDICT: SEND-BACK\r\n", null],
  ["The verdict-format change is safe.\nbody\nVERDICT: LAND", "LAND"],
  // sol build r1: a non-plain first line carrying the label, above an agreeing final LAND → empty
  ["`VERDICT: LAND`\nbody\nVERDICT: LAND", null], ["# VERDICT: LAND\nbody\nVERDICT: LAND", null],
  ["  VERDICT: LAND\nbody\nVERDICT: LAND", null], ["**VERDICT: LAND**\nbody\nVERDICT: LAND", null],
  // malformed final lines stay empty
  ["VERDICT: LAND (fixes pending)", null], ["VERDICT: LAND — Fixes: none.", null], ["VERDICT: LAND!", null], ["→ VERDICT: LAND", null],
  ["VERDICT: LAND\nCorrection: VERDICT: SEND-BACK", null], ["VERDICT: SEND-BACK\n```\nVERDICT: LAND\n```", null],
  ["VERDICT: LAND\nprose after verdict", null], ["", null], ["no verdict at all\nnone", null],
];
let bad = 0;
for (const [text, want] of cases) {
  const got = real(text);
  const ok = got === want;
  if (!ok) bad++;
  console.log(`${ok ? "ok  " : "MISS"} ${JSON.stringify(text).slice(0, 90)} → ${got} (want ${want})`);
}
console.log(`cases: ${cases.length - bad}/${cases.length}`);

// Part 2: corpus — real parser vs the seat prototype on every corpus file.
const corpus = JSON.parse(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), "corpus-2026-10-11.json"), "utf8"));
const yk = process.argv[2];
const files = Object.values(corpus).flat();
if (yk) {
  const tok = /(?<![A-Za-z0-9_])VERDICT:/;
  const walk = (d) => { for (const e of fs.readdirSync(d)) { const p = path.join(d, e); if (fs.statSync(p).isDirectory()) walk(p); else if (e.endsWith(".md")) { const L = fs.readFileSync(p, "utf8").split(/\r?\n/).filter((x) => x.trim()); if (L.length && tok.test(L[0]) && !tok.test(L.at(-1))) files.push(p); } } };
  walk(yk);
}
let cbad = 0; const counts = {};
for (const f of files) {
  const abs = path.resolve(repoRoot, f);
  const want = proto(fs.readFileSync(abs, "utf8")).w;
  const got = real(abs);
  const k = got === null ? "empty" : "word"; counts[k] = (counts[k] ?? 0) + 1;
  if (got !== want) { cbad++; console.log(`CORPUS MISS ${f} → ${got} (prototype ${want})`); }
}
console.log(`corpus: ${files.length} files, ${JSON.stringify(counts)}, ${cbad} mismatch(es) with the prototype`);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`seat-verify-verdict: ${bad + cbad} mismatch(es)`);
process.exit(bad + cbad ? 1 : 0);
