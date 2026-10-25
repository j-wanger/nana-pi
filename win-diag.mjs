#!/usr/bin/env node
// Seat scratch diagnostic (never merged): apply win-table.mjs's pair edits, run its test files directly with node,
// and print each R-2907 PASS/FAIL line with its detail (cut to 2,000 characters), so the reason for the red can be
// read from the log; then restore every edited file.
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
const { PAIRS } = await import(pathToFileURL(resolve(process.argv[2])).href);
for (const p of PAIRS) {
  const saved = new Map();
  try {
    for (const e of p.edits) {
      const cur = readFileSync(e.file, "utf8"); if (!saved.has(e.file)) saved.set(e.file, cur);
      if (cur.split(e.anchor).length !== 2) throw new Error(`ANCHOR-MISS ${e.file}`);
      writeFileSync(e.file, cur.replace(e.anchor, () => e.replacement));
    }
    for (const t of p.tests) {
      const r = spawnSync(process.execPath, [t], { encoding: "utf8", timeout: 900000, maxBuffer: 64 * 1024 * 1024 });
      const lines = `${r.stdout || ""}\n${r.stderr || ""}`.split(/\r?\n/).filter((l) => /^(PASS|FAIL) R-29(01|07):/.test(l));
      console.log(`DIAG ${p.n} ${t} exit ${r.status}`);
      for (const l of lines) console.log(`DIAG ${l.slice(0, 2000)}`);
    }
  } catch (error) { console.log(`DIAG ERROR ${p.n} ${error.message}`); }
  finally { for (const [f, t] of saved) writeFileSync(f, t); }
}
