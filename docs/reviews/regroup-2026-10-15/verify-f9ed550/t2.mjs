import { run, fxProposal, variant, verdictOf, L37, SCR } from "./fx.mjs";
import { existsSync, readFileSync, writeFileSync, linkSync, rmSync } from "node:fs";
import { join } from "node:path";
// (a) string line in a reason: what the page says for that line, and is the claim's text checked?
const a = run("strline", variant((q) => { const r = q.regroup.reasons.find((y) => y.line === L37); r.line = String(L37); r.why = "a reason the reviewer never saw"; }));
console.log("(a) exit", a.status, "| page block:", JSON.stringify(a.text.slice(a.text.indexOf(`Line ${L37} ->`), a.text.indexOf(`Line ${L37} ->`) + 60)));
// (b) crash after an earlier page: does the earlier page survive?
const page = join(SCR, "earlier-crash.md");
rmSync(page, { force: true });
const ok = run("earlier", fxProposal(), { out: page });
const crashv = run("crash-after", variant((q) => { const v = verdictOf(q, "R-003"); v.targets = v.targets[0]; }), { out: page });
console.log("(b) first exit", ok.status, "| crashing run exit", crashv.status, "| earlier page still there:", existsSync(page), "starts with head:", existsSync(page) && readFileSync(page, "utf8").startsWith("# Regroup review packet"));
// (c) case alias of the ledger on macOS (case-insensitive APFS)
const c = run("case-alias", fxProposal(), { out: (d) => join(d, "requirements.md") });
const led = readFileSync(join(c.d, "REQUIREMENTS.md"), "utf8");
console.log("(c) --out <root>/requirements.md: exit", c.status, "| ledger now starts with page head:", led.startsWith("# Regroup review packet"), "|", c.stderr.split("\n")[0].slice(0, 120));
// (d) case alias of the proposal
const d = run("case-alias-prop", fxProposal(), { out: (dd, prop) => prop.replace("proposal.json", "PROPOSAL.json") });
console.log("(d) --out PROPOSAL.json: exit", d.status, "| proposal now page:", readFileSync(d.prop, "utf8").startsWith("# Regroup"));
// (e) hard link to the proposal
const e = run("hardlink", fxProposal(), { out: (dd, prop) => { const l = join(dd, "..", "hl-prop.json"); rmSync(l, { force: true }); linkSync(prop, l); return l; } });
console.log("(e) --out hard link to proposal: exit", e.status, "| proposal now page:", readFileSync(e.prop, "utf8").startsWith("# Regroup"));
// (f) --out a directory
const f = run("outdir", fxProposal(), { out: (dd) => join(dd, "docs") });
console.log("(f) --out <root>/docs (a dir): exit", f.status, "| crash:", /^\s+at /m.test(f.stderr));
