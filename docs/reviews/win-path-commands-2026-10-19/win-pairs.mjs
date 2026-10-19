#!/usr/bin/env node
// Seat scratch helper (never merged): run wrong-code pairs in place, one at a time, on a CI checkout.
// usage: node win-pairs.mjs <table.mjs>   — the table exports PAIRS: [{ n, name, edits: [{file, anchor, replacement}], tests: [file], expectRed: [title] }]
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
process.env.SEAT_PAIRS_IMPORT = "1";
const { PAIRS } = await import(pathToFileURL(resolve(process.argv[2])).href);
const run = (file) => {
  // Run the file the way the suite job does (npm test -- --verbose <file>), so its environment (npm_execpath, the
  // console code page the runner inherits) matches the suite's; fall back to node <file> when npm's script is unknown.
  const npmCli = process.env.npm_execpath;
  const r = npmCli
    ? spawnSync(process.execPath, [npmCli, "test", "--", "--verbose", file], { encoding: "utf8", timeout: 900000 })
    : spawnSync(process.execPath, [file], { encoding: "utf8", timeout: 900000 });
  const out = `${r.stdout || ""}\n${r.stderr || ""}`;
  const lines = out.split(/\r?\n/);
  return { status: r.status, pass: new Set(lines.filter((l) => l.startsWith("PASS ")).map((l) => l.slice(5).trim())),
    fail: lines.filter((l) => l.startsWith("FAIL ")).map((l) => l.slice(5).trim()), tail: lines.filter(Boolean).slice(-6) };
};
const has = (set, title) => [...set].some((l) => l === title || l.startsWith(title + " "));
const hasFail = (fails, title) => fails.some((l) => l === title || l.startsWith(title + " "));
let bad = 0;
const tests = [...new Set(PAIRS.flatMap((p) => p.tests))];
const base = Object.fromEntries(tests.map((t) => [t, run(t)]));
for (const t of tests) console.log(`BASELINE ${base[t].status === 0 ? "ok" : "FAIL"} ${t} (exit ${base[t].status}, ${base[t].pass.size} PASS, ${base[t].fail.length} FAIL)${base[t].status ? "\n  " + base[t].fail.concat(base[t].tail).join("\n  ") : ""}`);
for (const p of PAIRS) for (const title of p.expectRed) if (!p.tests.some((t) => has(base[t].pass, title))) { console.log(`BASELINE MISSING ${p.n}: ${title}`); bad++; }
if (bad) { console.log("RESULT: baseline not green"); process.exit(2); }
let red = 0;
for (const p of PAIRS) {
  const saved = new Map();
  try {
    for (const e of p.edits) {
      const text = saved.get(e.file) ?? readFileSync(e.file, "utf8"); if (!saved.has(e.file)) saved.set(e.file, text);
      const cur = readFileSync(e.file, "utf8"); const n = cur.split(e.anchor).length - 1;
      if (n !== 1) throw new Error(`ANCHOR-MISS ${e.file} (${n} matches)`);
      writeFileSync(e.file, cur.replace(e.anchor, () => e.replacement));
    }
    const results = p.tests.map((t) => run(t));
    const fails = results.flatMap((r) => r.fail);
    const named = p.expectRed.filter((title) => hasFail(fails, title));
    const ok = named.length === p.expectRed.length;
    if (ok) red++;
    console.log(`${ok ? "RED" : named.length ? "PARTIAL" : "GREEN"} ${p.n} ${p.name} — ${named.length}/${p.expectRed.length} named: ${named.join(" | ") || "(none)"}${fails.length > named.length ? `; also FAIL: ${fails.filter((f) => !named.some((t) => f.startsWith(t))).map((f) => f.slice(0, 120)).join(" | ")}` : ""}${results.some((r) => r.status !== 0 && r.fail.length === 0) ? `; crashed: ${results.map((r) => r.tail.join(" / ")).join(" // ").slice(0, 300)}` : ""}`);
  } catch (error) { console.log(`ERROR ${p.n} ${error.message}`); }
  finally { for (const [f, t] of saved) writeFileSync(f, t); }
}
console.log(`RESULT: ${red}/${PAIRS.length} red`);
process.exit(red === PAIRS.length ? 0 : 1);
