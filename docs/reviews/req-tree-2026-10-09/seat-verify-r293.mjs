import { readFileSync } from "node:fs";
const W = "/Users/example/nana-pi-wt/req-tree";
const { checkTree } = await import(`${W}/scripts/requirements-tree.mjs`);
const base = readFileSync(`${W}/REQUIREMENTS.md`, "utf8");
const L = base.split("\n");
const h = L.findIndex((l) => l.startsWith("## FEAT-005 · "));
const s = L.findIndex((l, i) => i > h && l.startsWith("Status: "));
const a = [...L]; a.splice(s, 0, "| Key | Value |", "|---|---|", "| a | b |", "");
const b = [...L]; b.splice(h + 1, 0, "Some prose before the purpose.");
for (const [n, t, want] of [["real ledger", base, "0"], ["ordinary table before Status (FEAT-005)", a.join("\n"), ">0"]]) {
  const p = checkTree(t).problems; console.log(`${n}: problems=${p.length} (want ${want}) ${p[0] ?? ""}`.slice(0, 200));
}
