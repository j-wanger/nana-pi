// Probe the lane's verdictWord through its module source (it is not exported): copy its body.
import { readFileSync } from "node:fs";
const src = readFileSync("./packages/nana-pack/bin/review-round.mjs", "utf8");
const body = src.slice(src.indexOf("function verdictWord(out)"), src.indexOf("const sameItem"));
const verdictWord = new Function("existsSync", "readFileSync", `${body}; return verdictWord;`)(() => false, () => "");
const cases = [
  ["VERDICT: LAND", "LAND"], ["**VERDICT:** LAND", "LAND"], ["VERDICT: **LAND**", "LAND"], ["VERDICT: LAND.", "LAND"],
  ["> - VERDICT: LAND — 9/10.", "LAND"], ["# VERDICT: LAND (9/10)", "LAND"], ["VERDICT:\tLAND", "LAND"], ["VERDICT: LAND —9/10", "LAND"],
  ["VERDICT: LAND.**", "LAND"], ["VERDICT: LAND (9/10).**", "LAND"], ["VERDICT: **LAND.**", "LAND"], ["VERDICT: **LAND**.", "LAND"],
  ["VERDICT:\u00a0LAND", "LAND"], ["VERDICT: LAND\u00a0(9/10)", "LAND"], ["VERDICT: LAND —\u00a09/10", "LAND"], ["VERDICT:** LAND", "LAND"],
  ["VERDICT: LAND **(9/10)**", "LAND"], ["VERDICT: LAND.\u00a0\u00a0", "LAND"], ["VERDICT: LAND .", null], ["VERDICT: LAND.,", null],
  ["VERDICT: #LAND#", null], ["VERDICT: >LAND>", null], ["VERDICT: -LAND-", null], ["VERDICT:LAND", null], ["VERDICT: LAND(9/10)", null],
  ["VERDICT: L_A_N_D", null], ["VERDICT: LAND - 9/10", null], ["VERDICT: LAND (9.5/10)", null], ["Note: VERDICT: LAND", null],
];
let bad = 0;
for (const [line, want] of cases) { const got = verdictWord(`x\n${line}\n`); if (got !== want) bad++; console.log(`${got === want ? "ok  " : "MISS"} ${JSON.stringify(line)} → ${got} (want ${want})`); }
console.log(`probe: ${bad} mismatch(es)`);
