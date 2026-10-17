import * as fs from "node:fs"; import * as path from "node:path"; import { spawnSync } from "node:child_process";
const S = path.dirname(new URL(import.meta.url).pathname);
const RG = "scripts/requirements-regroup.mjs";
const pairs = {
  "carried outcome dropped": [[RG, "  if (target?.node?.also_applies?.includes(id)) n++;\n", ""], [RG, "  if (target?.node?.also_applies?.includes(id)) return \"carried\";\n", ""]],
  "carried allowed for a move (no share-only)": [[RG, "  if (target?.node?.also_applies?.includes(id)) n++;", "  if (target?.node?.also_applies?.includes(id)) n++; /* any verdict */"]],
  "unknown-row verdict accepted": [[RG, "  for (const id of seenRow.keys()) if (!ledgerIds.has(id)) problems.push(`regroup.review.verdicts: row ${id} is not a row in this ledger`);\n", ""]],
  "lift and evidence paths dropped from --out inputs": [[RG, "  const inputPaths = [ledgerPath, proposalPath, LIFT_SCRIPT, ...evidenceInputs];", "  const inputPaths = [ledgerPath, proposalPath];"]],
  "move with two targets accepted": [[RG, "    if (v.verdict === \"move\" && targets.length > 1) problems.push(", "    if (false) problems.push("]],
  "same_family flag not required": [[RG, "    if (!(flag === true || flag === \"same-family\")) problems.push(", "    if (false) problems.push("]],
};
for (const [name, edits] of Object.entries(pairs)) {
  const dir = path.join(S, "mut2", name.replace(/\W+/g, "_")); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  spawnSync("cp", ["-R", path.join(S, "tree") + "/.", dir]);
  let ok = true;
  for (const [f, a, b] of edits) { const p = path.join(dir, f); const t = fs.readFileSync(p, "utf8"); if (t.split(a).length !== 2) { console.log(name, "ANCHOR-MISS"); ok = false; break; } fs.writeFileSync(p, t.replace(a, b)); }
  if (!ok) continue;
  const r = spawnSync(process.execPath, ["scripts/test.mjs", "requirements-regroup.test"], { cwd: dir, encoding: "utf8" });
  console.log(`${/0 FAIL/.test(r.stdout) ? "SURVIVED" : "RED"} ${name} :: ${r.stdout.split("\n").find((l) => /requirements-regroup/.test(l))?.trim()}`);
  fs.rmSync(dir, { recursive: true, force: true });
}
