// Seat acceptance for the product-report lane (frozen; the builder runs it from the worktree root and
// writes its output to seat-verify-report-output.txt). It drives the lane's OWN report command,
// `node scripts/product-report.mjs --root <repo> --out <file>`, against scratch git repositories, and
// reads the page and the exit status like a user would. Every case prints ok or MISS; exit 1 on any
// MISS. CHANGE.md is the contract. Round 2 scope: the page, refusals, determinism, the commit stamp
// and hostile text; stamps, schema and packets are added in later rounds.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const W = process.cwd();
const SCRIPT = join(W, "scripts/product-report.mjs");
const ROOT = mkdtempSync(join(tmpdir(), "seat-report-"));
const env = { ...process.env, GIT_AUTHOR_NAME: "seat", GIT_AUTHOR_EMAIL: "seat@test", GIT_COMMITTER_NAME: "seat", GIT_COMMITTER_EMAIL: "seat@test", GIT_AUTHOR_DATE: "2026-10-11T09:00:00+00:00", GIT_COMMITTER_DATE: "2026-10-11T09:00:00+00:00" };

let mismatches = 0;
const out = (label, got, want) => {
  const pass = String(got) === String(want);
  if (!pass) mismatches++;
  console.log(`${pass ? "ok  " : "MISS"} ${label}: ${got} (want ${want})`);
};
const git = (cwd, ...args) => {
  const r = spawnSync("git", args, { cwd, env, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")}: ${r.stderr}`);
  return r.stdout.trim();
};

const HEAD = "| ID | Requirement | Status | Evidence |\n|---|---|---|---|";
const LEDGER = [
  "# Requirements — fixture", "",
  "# CAP-01 · Zebra capability", "Purpose: Zebracap purpose words.", "Outcome: Zebracap outcome words.", "",
  "## FEAT-001 · Quokka feature", "Purpose: Quokkafeat purpose words.", "Status: active", "",
  HEAD,
  "| R-001 | The tool shall quokka one. | implemented | `tests/a.test.mjs::one` |",
  "| R-002 | The tool shall quokka two. | violated | Violatedrow evidence words. |",
  "| R-1000 | The tool shall quokka four digits. | untested | — |", "",
  "## FEAT-002 · Wombat feature", "Purpose: Wombatfeat purpose words.", "Status: active", "Also applies: R-001", "",
  HEAD,
  "| R-003 | The tool shall wombat three. | planned | — |", "",
].join("\n");
const HANDOFF = [
  "# Handoff — fixture", "",
  "## Open for Jake (each ask: blocking, optional or parked, and since when)", "",
  "- **[optional, since 2026-10-10] Narwhal title.** Narwhalbody words that hold the decision.",
  "- **[blocking, since 2026-10-09] Ocelot title.** Ocelotbody words.", "",
].join("\n");

let n = 0;
function repo(files) {
  const dir = join(ROOT, `r${++n}`);
  mkdirSync(dir, { recursive: true });
  git(dir, "init", "-q", "-b", "main");
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  git(dir, "add", ".");
  git(dir, "commit", "-qm", "fixture");
  return dir;
}
function report(root, outFile = join(ROOT, `page-${++n}.html`)) {
  const p = spawnSync("node", [SCRIPT, "--root", root, "--out", outFile], { cwd: W, env, encoding: "utf8" });
  return { code: p.status, text: `${p.stdout}${p.stderr}`, page: existsSync(outFile) ? readFileSync(outFile, "utf8") : null, outFile };
}

// ── The page shows the ledger and HANDOFF (R-1014–R-1018) ──
{
  const r = repo({ "REQUIREMENTS.md": LEDGER, "HANDOFF.md": HANDOFF });
  const a = report(r);
  out("the report runs on a valid fixture", `${a.code}/${a.page !== null}`, "0/true");
  const page = a.page ?? "";
  for (const [label, token] of [
    ["capability purpose", "Zebracap purpose words"], ["capability outcome", "Zebracap outcome words"],
    ["feature purpose", "Quokkafeat purpose words"], ["a second feature", "Wombatfeat purpose words"],
    ["a row's text", "The tool shall quokka one."], ["a four-digit row", "R-1000"], ["a row's evidence", "Violatedrow evidence words"],
    ["an ask's title", "Narwhal title"], ["an ask's body", "Narwhalbody words that hold the decision"], ["a second ask's body", "Ocelotbody words"],
  ]) out(`page shows ${label}`, page.includes(token), "true");
  const head = git(r, "rev-parse", "HEAD");
  const date = git(r, "log", "-1", "--format=%cI");
  out("page states the full commit hash", page.includes(head), "true");
  out("page states the commit date", page.includes(date), "true");
  const b = report(r);
  out("two runs at one commit are byte-identical", a.page !== null && a.page === b.page, "true");
}

// ── The clean flag (R-1013) ──
{
  const r = repo({ "REQUIREMENTS.md": LEDGER, "HANDOFF.md": HANDOFF });
  const clean = report(r).page ?? "";
  writeFileSync(join(r, "HANDOFF.md"), `${HANDOFF}\n`);
  const tracked = report(r).page ?? "";
  git(r, "checkout", "--", "HANDOFF.md");
  writeFileSync(join(r, "untracked.txt"), "x\n");
  const untracked = report(r).page ?? "";
  out("a clean tree and a tracked change give different pages", clean !== tracked && clean.length > 0, "true");
  out("an untracked file also marks the tree not clean", clean !== untracked && untracked.length > 0, "true");
}

// ── Refusals write no page (R-1026, R-1030) ──
{
  const bad = LEDGER.replace("# CAP-01 · Zebra capability", "| R-099 | The tool shall stray. | untested | — |\n\n# CAP-01 · Zebra capability");
  const r = repo({ "REQUIREMENTS.md": bad, "HANDOFF.md": HANDOFF });
  const a = report(r);
  out("a row outside any feature: refused, no page, problem named", `${a.code !== 0}/${a.page === null}/${/R-099/.test(a.text)}`, "true/true/true");
}
{
  const badAsk = HANDOFF.replace("- **[blocking, since 2026-10-09] Ocelot title.** Ocelotbody words.", "- an ask with no tag and no title");
  const r = repo({ "REQUIREMENTS.md": LEDGER, "HANDOFF.md": badAsk });
  const a = report(r);
  const line = badAsk.split("\n").findIndex((l) => l.startsWith("- an ask with no tag")) + 1;
  out("a malformed ask: refused, no page, its line named", `${a.code !== 0}/${a.page === null}/${a.text.includes(String(line))}`, "true/true/true");
}

// ── Hostile text stays text (R-1019, the data half) ──
{
  const hostile = LEDGER.replace("The tool shall quokka one.", "The tool shall quokka </script><img src=x onerror=alert(1)> one.");
  const r = repo({ "REQUIREMENTS.md": hostile, "HANDOFF.md": HANDOFF });
  const a = report(r);
  const page = a.page ?? "";
  out("hostile ledger text: the report runs", a.code, "0");
  out("the raw `</script><img` sequence never appears in the page", page.includes("</script><img"), "false");
  out("the hostile text is still carried (escaped)", /onerror=alert\(1\)/.test(page), "true");
}

// ── CRLF and trailing whitespace in the ledger still read (normalised before parsing) ──
{
  const crlf = LEDGER.split("\n").map((l) => `${l}  `).join("\r\n");
  const r = repo({ "REQUIREMENTS.md": crlf, "HANDOFF.md": HANDOFF });
  const a = report(r);
  out("a CRLF ledger with trailing spaces: the report runs and shows its rows", `${a.code}/${(a.page ?? "").includes("The tool shall wombat three.")}`, "0/true");
}

console.log(`seat-verify-report: ${mismatches} mismatch(es)`);
rmSync(ROOT, { recursive: true, force: true });
process.exitCode = mismatches ? 1 : 0;
