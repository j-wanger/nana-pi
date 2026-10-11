// Seat acceptance for the land-rule lane (frozen; the builder runs it from the worktree root and
// writes its output to seat-verify-land-output.txt). It drives the lane's OWN `review-ledger run` and
// `nana-land merge` commands as a user would, against scratch git repositories, with HOME pointed at
// a scratch folder so nothing touches the real review ledger. Every case prints ok or MISS; the
// script exits 1 on any MISS. It reads CHANGE.md §1 and §3 as the contract.
import { spawn, spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const W = process.cwd();
const BIN = join(W, "packages/nana-pack/bin");
const BASE_COMMIT = "1836fa36aec54447b58d65976a867523d43801ae"; // main before this lane
const ROOT = mkdtempSync(join(tmpdir(), "seat-land-"));
const HOME = join(ROOT, "home");
mkdirSync(HOME);
const LEDGER = join(HOME, ".pi", "agent");
const TALLY = join(LEDGER, "review-ledger.rounds.jsonl");
const env = { ...process.env, HOME, USERPROFILE: HOME, GIT_AUTHOR_NAME: "seat", GIT_AUTHOR_EMAIL: "seat@test", GIT_COMMITTER_NAME: "seat", GIT_COMMITTER_EMAIL: "seat@test", GIT_CONFIG_NOSYSTEM: "1" };

let mismatches = 0;
const out = (label, got, want) => {
  const pass = String(got) === String(want);
  if (!pass) mismatches++;
  console.log(`${pass ? "ok  " : "MISS"} ${label}: ${got} (want ${want})`);
};

const git = (cwd, ...args) => {
  const r = spawnSync("git", args, { cwd, env, encoding: "utf8" });
  if (r.status !== 0) throw new Error(`git ${args.join(" ")} in ${cwd}: ${r.stderr}`);
  return r.stdout.trim();
};
let n = 0;
function repo() {
  const base = join(ROOT, `r${++n}`);
  const main = join(base, "main");
  mkdirSync(main, { recursive: true });
  git(main, "init", "-q", "-b", "main");
  writeFileSync(join(main, "base.txt"), "base\n");
  git(main, "add", "base.txt");
  git(main, "commit", "-qm", "base");
  const tree = join(base, "lane");
  git(main, "worktree", "add", "-q", "-b", "feat/lane", tree);
  return { main, tree, key: `git:${realpathSync(join(main, ".git"))}` };
}
function commit(dir, file, text, message) {
  writeFileSync(join(dir, file), text);
  git(dir, "add", file);
  git(dir, "commit", "-qm", message);
  return git(dir, "rev-parse", "HEAD");
}
let reviewNo = 0;
// One review through the lane's own `review-ledger run`: the child prints `text` as the review.
function review(tree, item, role, text, { overCap = null, child = null } = {}) {
  const src = join(ROOT, `review-${++reviewNo}.txt`);
  writeFileSync(src, text);
  const outFile = join(ROOT, `review-${reviewNo}.out`);
  const args = [join(BIN, "review-ledger.mjs"), "run", "--item", item, "--role", role, "--out", outFile, "--tree", tree];
  if (overCap) args.push("--over-cap", overCap);
  args.push("--", ...(child ? child(src) : ["cat", src]));
  return spawnSync("node", args, { cwd: tree, env, encoding: "utf8" });
}
function land(r, reviewed, { suite = "true", extra = [], tree = r.tree } = {}) {
  const args = [join(BIN, "nana-land.mjs"), "merge", "--tree", tree, "--main", r.main, "--suite", suite, ...extra];
  for (const pair of reviewed) args.push("--reviewed", pair);
  const p = spawnSync("node", args, { cwd: r.main, env, encoding: "utf8" });
  return { code: p.status, text: `${p.stdout}${p.stderr}` };
}
const mainAt = (r) => git(r.main, "rev-parse", "refs/heads/main");
const tallyLines = () => (existsSync(TALLY) ? readFileSync(TALLY, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)) : []);
const records = (key, item) => tallyLines().filter((x) => x.repo === key && x.item === item);
const refused = (r, before, l) => `${l.code === 0 ? "landed" : "refused"}/${mainAt(r) === before ? "main unchanged" : "main moved"}`;

// ── Coverage, options, output (R-1002, R-1003, R-1007, R-976) ──
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", "Findings: none.\nVERDICT: LAND\n");
  const l = land(r, [`${c1}=it`]);
  out("a covered tip lands", `${l.code}/${mainAt(r) === c1}`, "0/true");
  out("success output carries no HANDOFF or session-archive stub", /HANDOFF|Session archive/i.test(l.text), "false");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", "VERDICT: LAND\n");
  const c2 = commit(r.tree, "b.txt", "b\n", "an unreviewed follow-up");
  const before = mainAt(r);
  const l = land(r, [`${c1}=it`]);
  out("an unreviewed commit after the reviewed one is refused", refused(r, before, l), "refused/main unchanged");
  out("the refusal names the uncovered commit", l.text.includes(c2.slice(0, 7)), "true");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", "VERDICT: LAND\n");
  const before = mainAt(r);
  const e = land(r, [], { extra: ["--exempt", "a good reason"] });
  out("--exempt alone (no review named) is refused by name", `${refused(r, before, e)}/${/--exempt/.test(e.text)}`, "refused/main unchanged/true");
  const before2 = mainAt(r);
  const e2 = land(r, [`${c1}=it`], { extra: ["--exempt", "a good reason"] });
  out("--exempt beside a review is refused by name", `${refused(r, before2, e2)}/${/--exempt/.test(e2.text)}`, "refused/main unchanged/true");
  const before3 = mainAt(r);
  const f = land(r, [`${c1}=it`], { extra: ["--force", "x"] });
  out("any other option is refused by name", `${refused(r, before3, f)}/${/--force/.test(f.text)}`, "refused/main unchanged/true");
}

// ── Every verdict must be LAND (R-1004, R-1008, R-1011) ──
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", "VERDICT: LAND\n");
  review(r.tree, "it", "astra", "VERDICT: LAND — 9/10\n");
  const l = land(r, [`${c1}=it`]);
  out("LAND then LAND from two reviewers lands", `${l.code}/${mainAt(r) === c1}`, "0/true");
  out("both verdicts are kept as version-2 round records", records(r.key, "it").map((x) => `${x.v}:${x.verdict}`).join(","), "2:LAND,2:LAND");
}
for (const [label, first, second] of [
  ["LAND then SEND-BACK on one revision is refused", "VERDICT: LAND\n", "VERDICT: SEND-BACK\n"],
  ["SEND-BACK then LAND on one revision is refused", "VERDICT: SEND-BACK\n", "VERDICT: LAND\n"],
  ["LAND then LAND-WITH-FIXES on one revision is refused", "VERDICT: LAND\n", "VERDICT: LAND-WITH-FIXES\n"],
]) {
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", first);
  review(r.tree, "it", "astra", second);
  const before = mainAt(r);
  out(label, refused(r, before, land(r, [`${c1}=it`])), "refused/main unchanged");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "other-item", "sol", "VERDICT: SEND-BACK\n");
  review(r.tree, "it", "astra", "VERDICT: LAND\n");
  const before = mainAt(r);
  out("a SEND-BACK under another item at the same commit is refused", refused(r, before, land(r, [`${c1}=it`])), "refused/main unchanged");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  writeFileSync(join(r.tree, "untracked.txt"), "dirty\n");
  review(r.tree, "snap-item", "sol", "VERDICT: SEND-BACK\n");
  rmSync(join(r.tree, "untracked.txt"));
  review(r.tree, "it", "astra", "VERDICT: LAND\n");
  const snap = records(r.key, "snap-item")[0]?.revision ?? "";
  const before = mainAt(r);
  out("the SEND-BACK was recorded against a working-state snapshot", snap.startsWith(`${c1}+snap:`), "true");
  out("a SEND-BACK at a snapshot of the commit is refused", refused(r, before, land(r, [`${c1}=it`])), "refused/main unchanged");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", "VERDICT: LAND | FIX-FIRST | BLOCK\n");
  review(r.tree, "it", "astra", "VERDICT: LAND\n");
  const before = mainAt(r);
  out("an echoed format line records an empty verdict", records(r.key, "it").map((x) => String(x.verdict)).join(","), "null,LAND");
  out("an empty verdict beside a LAND is refused", refused(r, before, land(r, [`${c1}=it`])), "refused/main unchanged");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  mkdirSync(LEDGER, { recursive: true });
  appendFileSync(TALLY, `${JSON.stringify({ v: 1, ts: new Date().toISOString(), kind: "round", repo: r.key, item: "it", revision: c1, head: c1, role: "legacy", seat: true })}\n`);
  review(r.tree, "it", "astra", "VERDICT: LAND\n");
  const l = land(r, [`${c1}=it`]);
  out("a legacy record with no verdict field beside a version-2 LAND lands", `${l.code}/${mainAt(r) === c1}`, "0/true");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  mkdirSync(LEDGER, { recursive: true });
  appendFileSync(TALLY, `${JSON.stringify({ v: 1, ts: new Date().toISOString(), kind: "round", repo: r.key, item: "it", revision: c1, head: c1, role: "astra", verdict: "LAND", seat: true })}\n`);
  const before = mainAt(r);
  out("a version-1 LAND alone cannot authorise (the old masked case)", refused(r, before, land(r, [`${c1}=it`])), "refused/main unchanged");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  // The child edits a tracked file mid-review, so the verdict is recorded as unverified (R-717).
  review(r.tree, "it", "sol", "VERDICT: SEND-BACK\n", { child: (src) => ["sh", "-c", `printf x >> base.txt; cat '${src}'`] });
  git(r.tree, "checkout", "--", "base.txt");
  review(r.tree, "it", "astra", "VERDICT: LAND\n");
  const unverified = records(r.key, "it").some((x) => x.unverified === true && x.verdict === "SEND-BACK");
  const l = land(r, [`${c1}=it`]);
  out("an unverified SEND-BACK neither authorises nor refuses", `${unverified}/${l.code}/${mainAt(r) === c1}`, "true/0/true");
}

// ── Timing: during the suite, in flight (R-1005, R-1006) ──
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", "VERDICT: LAND\n");
  const src = join(ROOT, "suite-sendback.txt");
  writeFileSync(src, "VERDICT: SEND-BACK\n");
  const suite = `node '${join(BIN, "review-ledger.mjs")}' run --item late-item --role astra --out '${join(ROOT, "suite-review.out")}' --tree '${r.tree}' -- cat '${src}'`;
  const before = mainAt(r);
  out("a SEND-BACK recorded while the suite runs is refused", refused(r, before, land(r, [`${c1}=it`], { suite })), "refused/main unchanged");
}
async function inFlight(label, dirty) {
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", "VERDICT: LAND\n");
  if (dirty) writeFileSync(join(r.tree, "untracked.txt"), "dirty\n");
  const src = join(ROOT, `slow-${label.length}.txt`);
  writeFileSync(src, "VERDICT: LAND\n");
  const child = spawn("node", [join(BIN, "review-ledger.mjs"), "run", "--item", "slow-item", "--role", "astra", "--out", join(ROOT, `slow-${label.length}.out`), "--tree", r.tree, "--", "sh", "-c", `sleep 30; cat '${src}'`], { cwd: r.tree, env, stdio: "ignore", detached: true });
  const resDir = join(LEDGER, "review-ledger.reservations");
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline && !(existsSync(resDir) && readdirSync(resDir).length)) await new Promise((res) => setTimeout(res, 200));
  const before = mainAt(r);
  const l = land(r, [`${c1}=it`]);
  try { process.kill(-child.pid, "SIGKILL"); } catch {}
  await new Promise((res) => setTimeout(res, 500));
  if (dirty) rmSync(join(r.tree, "untracked.txt"), { force: true });
  out(label, refused(r, before, l), "refused/main unchanged");
}
await inFlight("a review of the commit still in flight is refused", false);
await inFlight("a review of a snapshot of the commit still in flight is refused", true);

// ── One repository, canonical names (R-1009, R-976) ──
{
  const r = repo();
  const clone = join(ROOT, `clone-${n}`);
  git(ROOT, "clone", "-q", r.main, clone);
  git(clone, "checkout", "-q", "-b", "feat/clone");
  const c1 = commit(clone, "a.txt", "a\n", "a");
  review(clone, "it", "sol", "VERDICT: LAND\n");
  git(r.main, "fetch", "-q", clone, "feat/clone"); // the tip's objects reach main's repository, as a bypass would arrange
  const before = mainAt(r);
  const l = land(r, [`${c1}=it`], { tree: clone });
  out("a separate clone as --tree is refused", `${refused(r, before, l)}/${/repositor|common/i.test(l.text)}`, "refused/main unchanged/true");
}
{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "Mixed Case Item", "sol", "VERDICT: LAND\n");
  const l = land(r, [`${c1.toUpperCase()}=MIXED  case ITEM`]);
  out("an uppercase SHA and a differently cased item land", `${l.code}/${mainAt(r) === c1}`, "0/true");
}

{
  const r = repo();
  const c1 = commit(r.tree, "a.txt", "a\n", "a");
  review(r.tree, "it", "sol", "VERDICT: LAND\n");
  git(r.tree, "tag", "-a", "reviewed-tag", "-m", "a tag object", c1);
  const tagObject = git(r.tree, "rev-parse", "reviewed-tag");
  const before = mainAt(r);
  const l = land(r, [`${tagObject}=it`]);
  out("an annotated tag object named as the reviewed revision is refused (plain commits only)", `${tagObject !== c1}/${refused(r, before, l)}`, "true/refused/main unchanged");
}

// ── The verdict word (R-969, R-1010) ──
{
  const r = repo();
  commit(r.tree, "a.txt", "a\n", "a");
  const cases = [
    ["VERDICT: LAND", "LAND"], ["# VERDICT: LAND", "LAND"], ["**VERDICT:** LAND", "LAND"], ["VERDICT: LAND.", "LAND"],
    ["VERDICT: LAND (9/10)", "LAND"], ["VERDICT: LAND — 9/10", "LAND"], ["**VERDICT: LAND — 9/10.**", "LAND"], ["VERDICT: LAND  ", "LAND"],
    ["VERDICT: LAND-WITH-FIXES", "LAND-WITH-FIXES"], ["VERDICT: SEND-BACK", "SEND-BACK"],
    ["VERDICT: LAND | FIX-FIRST | BLOCK", "null"], ["VERDICT: LAND (fixes pending)", "null"], ["VERDICT: LAND — Fixes: none.", "null"],
    ["VERDICT: LAND, with fixes", "null"], ["VERDICT: L_A_N_D", "null"], ["VERDICT: L*A*N*D", "null"], ["VERDICT: LA`N`D", "null"],
    ["VERDICT: LAND!", "null"], ["VERDICT: LAND...", "null"],
  ];
  cases.forEach(([line, want], i) => {
    review(r.tree, `parse-${i}`, "sol", `Findings.\n${line}\n`);
    out(`verdict word of ${JSON.stringify(line)}`, String(records(r.key, `parse-${i}`)[0]?.verdict), want);
  });
  review(r.tree, "parse-crlf", "sol", "Findings.\r\nVERDICT: LAND\r\n");
  out("verdict word of a CRLF review", String(records(r.key, "parse-crlf")[0]?.verdict), "LAND");
  review(r.tree, "parse-echo", "sol", "Format: VERDICT: LAND | FIX-FIRST | BLOCK\nVERDICT: LAND | FIX-FIRST | BLOCK\nFindings.\nVERDICT: SEND-BACK\n");
  out("an echoed format line before a final SEND-BACK records SEND-BACK", String(records(r.key, "parse-echo")[0]?.verdict), "SEND-BACK");
  // sol build r2: a later prose-prefixed verdict line must not let an earlier clean LAND stand.
  review(r.tree, "parse-correction", "sol", "Findings.\nVERDICT: LAND\nCorrection: VERDICT: SEND-BACK\n");
  out("a later prose-prefixed VERDICT line records an empty verdict, never the earlier LAND", String(records(r.key, "parse-correction")[0]?.verdict), "null");
  review(r.tree, "parse-quoted", "sol", "Example from the review:\n    VERDICT: LAND\n    Correction: VERDICT: SEND-BACK\nMore findings.\nVERDICT: SEND-BACK\n");
  out("quoted verdict lines before a final SEND-BACK record SEND-BACK", String(records(r.key, "parse-quoted")[0]?.verdict), "SEND-BACK");
  // sol build r3: only the final non-blank line counts, and only markdown marks may precede the label.
  const finals = [
    ["a fenced example after the final SEND-BACK", "VERDICT: SEND-BACK\n\n```text\nVERDICT: LAND\n```\n", "null"],
    ["a look-alike label (Greek E) on the final line after a LAND", "VERDICT: LAND\nV\u0395RDICT: SEND-BACK\n", "null"],
    ["trailing blank and whitespace-only lines after the verdict", "Findings.\nVERDICT: LAND\n\n   \n\t\n", "LAND"],
    ["a CJK prose prefix", "\u62d2\u5426: VERDICT: LAND\n", "null"],
    ["an arrow prefix", "\u2192 VERDICT: LAND\n", "null"],
    ["a blockquote and list prefix", "> - **VERDICT:** LAND\n", "LAND"],
    ["prose after the final verdict line", "VERDICT: LAND\nThanks for the clean build.\n", "null"],
  ];
  finals.forEach(([label, text, want], i) => {
    review(r.tree, `parse-final-${i}`, "sol", text);
    out(`verdict word: ${label}`, String(records(r.key, `parse-final-${i}`)[0]?.verdict), want);
  });
}

// ── Version 2 and the old code (R-1008, R-1011) ──
out("every record the new code wrote is version 2", tallyLines().filter((x) => !x.seat).every((x) => x.v === 2), "true");
{
  const old = join(ROOT, "old");
  mkdirSync(old);
  for (const f of ["review-round.mjs", "review-shape.mjs"]) writeFileSync(join(old, f), git(W, "show", `${BASE_COMMIT}:packages/nana-pack/bin/${f}`));
  const mod = await import(pathToFileURL(join(old, "review-round.mjs")).href);
  let verdict = "read";
  try { mod.readRounds(HOME, {}); } catch { verdict = "refused"; }
  out("the pre-change ledger code refuses a tally holding version-2 records", verdict, "refused");
}

console.log(`seat-verify-land: ${mismatches} mismatch(es)`);
rmSync(ROOT, { recursive: true, force: true });
process.exitCode = mismatches ? 1 : 0;
