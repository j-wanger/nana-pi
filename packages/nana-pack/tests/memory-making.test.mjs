/**
 * @module packages/nana-pack/tests/memory-making.test.mjs
 * @purpose Pin the synthetic memory maker, evidence, privacy, scope, scorer and sealed settings.
 * @inputs Synthetic fixture bytes and temporary project/review roots.
 * @outputs Awaited PASS/FAIL lines under a per-case deadline.
 * @effects disk (OS temporary fixtures only)
 * @errors Failed assertions set exit code 1.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { tmpDir } from "./tmp-dir.mjs";
import { projectKey } from "../../nana-setup/lib/project-key.mjs";
import { mustTitlesOf } from "../lib/review-findings.mjs";
import { displayText } from "../lib/display.mjs";
import * as C from "../lib/memory-making-config.mjs";
import { DAY_TIMEZONE } from "../lib/claude-transcript.mjs";
import { defaultMemoryRepo, extractMemory, resolveEvidence, runMake } from "../lib/memory-making.mjs";
import { runScore } from "../lib/memory-score.mjs";

async function check(title, fn) {
 const abort = new AbortController();
 try {
  await Promise.race([Promise.resolve().then(fn), delay(15000, null, { signal: abort.signal }).then(() => { throw new Error("case deadline"); })]);
  console.log("PASS", title);
 } catch { console.log("FAIL", title); process.exitCode = 1; }
 finally { abort.abort(); }
}
const fixtureBytes = fs.readFileSync(new URL("fixtures/memory-making/session.jsonl", import.meta.url), "utf8");
const base = fixtureBytes.trim().split("\n").map(JSON.parse);
const sentence = "I will keep the temporary output in the sample checkout.";
const quote = base.at(-1).message.content[0].text;
const entry = (type, uuid, content, extra = {}) => ({ type, uuid, sessionId: "synthetic", isSidechain: false, timestamp: "2026-10-02T03:59:00Z", message: { role: type, content }, ...extra });
const form = (pattern, quote, context) => pattern.replace("<quote>", quote).replace("<context>", context);
async function fixture(run) {
 const root = fs.realpathSync.native(tmpDir(path.join(os.tmpdir(), "memory-making-")));
 const repoRoot = path.join(root, "repo"), projectsRoot = path.join(root, "projects"), reviewsRoot = path.join(root, "reviews");
 fs.mkdirSync(path.join(repoRoot, ".git"), { recursive: true });
 fs.mkdirSync(projectsRoot); fs.mkdirSync(reviewsRoot);
 const roots = { repoRoot, projectsRoot, reviewsRoot };
 const add = (entries = base, project = projectKey(repoRoot), name = "synthetic", ending = "\n") => {
  const dir = path.join(projectsRoot, project); fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${name}.jsonl`), entries.map((e) => JSON.stringify({ ...e, sessionId: name })).join(ending) + ending);
 };
 try { await run({ root, roots, add }); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
const reviewText = "VERDICT: SEND-BACK\n## MUST — Preserve the sample boundary\n\n## MUST — Await synthetic work\n";
function addReviews(roots) {
 const dir = path.join(roots.reviewsRoot, "demo-2026-10-01"); fs.mkdirSync(dir);
 for (const [name, body] of [["r1.md", reviewText], ["r2.md", "VERDICT: LAND\n## MUST — Preserve the sample boundary\n"], ...["plan.md", "plan-attack.md", "sol-plan-r1.md", "build-notes.md"].map((name) => [name, `VERDICT: SEND-BACK\n## MUST — Synthetic excluded finding from ${name}\n`])]) fs.writeFileSync(path.join(dir, name), body);
 return dir;
}
const decisions = () => [entry("assistant", "question", "The synthetic options are ready. Which sample colour should we use?"), entry("user", "n1", "No, task finished.", { origin: { kind: "task-notification" } }), entry("assistant", "s1", "Still running."), entry("user", "n2", "No, another task finished.", { origin: { kind: "task-notification" } }), entry("assistant", "s2", "Checking."), entry("user", "answer", "Blue", { origin: { kind: "human" } }), entry("user", "no-question", "Blue", { origin: { kind: "human" } }), entry("assistant", "ask", [{ type: "tool_use", id: "call", name: "AskUserQuestion", input: { questions: [{ question: "Which synthetic size?", options: [{ label: "Small" }] }] } }]), entry("user", "result", [{ type: "tool_result", tool_use_id: "call", content: 'User has answered your questions: "Which synthetic size?"="Small". You can now continue.' }], { toolUseResult: { answers: { "Which synthetic size?": "Small" } } })];

// req: R-3188
await check("an owner correction becomes a shaped user candidate with what it corrects", () => fixture(async ({ roots, add }) => {
 for (const eol of ["\n", "\r\n", ""]) {
  add(base, undefined, "synthetic", eol || "\n");
  const file = path.join(roots.projectsRoot, projectKey(roots.repoRoot), "synthetic.jsonl");
  fs.writeFileSync(file, base.map(JSON.stringify).join(eol || "\n") + (eol ? ` \t${eol}` : ""));
  const { records } = await extractMemory({ ...roots, from: "2026-10-01", to: "2026-10-01" });
  assert.equal(records.length, 1);
  const r = records[0]; assert.deepEqual(Object.keys(r), C.CANDIDATE_FIELDS);
  assert.deepEqual({ ...r, id: "stable" }, { id: "stable", type: "user", kind: "correction", claim: form(C.CORRECTION_FORM, quote, sentence), quote, context: sentence, evidence: "claude-code:synthetic#owner+seat", date: "2026-10-01", ...C.STARTING_STATE, roles: C.ROLES.user, validFrom: "2026-10-01", invalidAt: null, supersedes: [] });
  assert.equal((await extractMemory({ ...roots })).records[0].id, r.id);
 }
 add([entry("assistant", "seat", base[0].message.content), entry("user", "plain", "A synthetic statement without a cue.")]);
 assert.equal((await extractMemory(roots)).records.length, 0);
}));
// req: R-3189
await check("noise yields nothing", () => fixture(async ({ roots, add }) => {
 const noise = [entry("user", "tool", [{ type: "tool_result", tool_use_id: "other", content: quote }]), ...["isMeta", "isSidechain", "isCompactSummary"].map((flag) => entry("user", flag, quote, { [flag]: true })), ...C.WRAPPER_TAGS.map((tag, i) => entry("user", `wrap${i}`, `${tag} Again, this synthetic wrapper is not an owner.`)), entry("user", "notification", quote, { origin: { kind: "task-notification" } })];
 add([base[0], ...noise]);
 fs.appendFileSync(path.join(roots.projectsRoot, projectKey(roots.repoRoot), "synthetic.jsonl"), '{"type":"user","message":');
 assert.equal((await extractMemory(roots)).records.length, 0);
}));
// req: R-3190
await check("decisions carry their question across notification traffic", () => fixture(async ({ roots, add }) => {
 add(decisions()); const { records } = await extractMemory(roots);
 assert.equal(records.length, 2); assert.deepEqual(records.map((r) => r.kind), ["decision", "decision"]);
 assert.equal(records[0].claim, form(C.DECISION_FORM, "Blue", "Which sample colour should we use?"));
 assert.equal(records[0].evidence, "claude-code:synthetic#answer+question");
 assert.equal(records[1].claim, form(C.DECISION_FORM, "Small", "Which synthetic size?"));
 assert.equal(records[1].evidence, "claude-code:synthetic#result+ask");
 const fallback = decisions(); delete fallback.at(-1).toolUseResult; add(fallback);
 assert.equal((await extractMemory(roots)).records[1].claim, records[1].claim);
 add([entry("assistant", "your-call", "YOUR CALL — Choose a synthetic size.\nSmall or large."), entry("user", "reply", "Small")]);
 assert.equal((await extractMemory(roots)).records[0].context, displayText("YOUR CALL — Choose a synthetic size.\nSmall or large.", C.CLAIM_CAP));
 add([decisions()[0], entry("user", "long", Array(C.SHORT_ANSWER_WORD_CAP + 1).fill("sample").join(" "))]);
 assert.equal((await extractMemory(roots)).records.length, 0);
}));
// req: R-3191
await check("review MUSTs become worker candidates from reviewer output only", () => fixture(async ({ roots }) => {
 const dir = addReviews(roots);
 for (const eol of ["\n", "\r\n", ""]) {
  fs.writeFileSync(path.join(dir, "r1.md"), reviewText.trimEnd().replaceAll("\n", eol || "\n") + (eol ? ` \t${eol}` : ""));
  const { records } = await extractMemory(roots); assert.equal(records.length, 2);
  assert.deepEqual(records.map((r) => r.claim), mustTitlesOf(reviewText));
  for (const r of records) { assert.equal(r.type, "worker"); assert.equal(r.kind, "lesson"); assert.equal(r.quote, r.claim); assert.equal(r.context, ""); assert.deepEqual(r.roles, C.ROLES.worker); assert.equal(r.date, "2026-10-01"); assert.equal(r.trust, C.STARTING_STATE.trust); }
 }
}));
// req: R-3192
await check("every evidence pointer resolves", () => fixture(async ({ roots, add }) => {
 add(); add(decisions(), undefined, "choices"); const dir = addReviews(roots);
 const { records } = await extractMemory(roots);
 for (const r of records) {
  const result = await resolveEvidence(r.evidence, roots); assert.equal(result.status, "resolved");
  assert.equal(result.texts.length, r.type === "user" ? 2 : 1);
  if (r.kind === "lesson") assert.equal(result.texts[0], r.quote);
  else { assert.ok(result.texts[0].includes(r.quote)); assert.ok(result.texts[1].includes(r.context)); }
 }
 fs.writeFileSync(path.join(dir, "r1.md"), "VERDICT: LAND");
 assert.equal((await resolveEvidence(records.find((r) => r.kind === "lesson").evidence, roots)).status, "stale");
 assert.equal((await resolveEvidence("claude-code:absent#a+b", roots)).status, "missing");
 assert.equal((await resolveEvidence("review:absent.md#0", roots)).status, "missing");
}));
// req: R-3192
await check("seat evidence resolves to its own quote", async () => {
 const record = { evidence: "seat:pi:session-key:2026-10-31", quote: "The owner's exact words." };
 assert.deepEqual(await resolveEvidence(record.evidence, {}, record), { status: "resolved", texts: [record.quote] });
});
// req: R-3193
await check("real output stays private", () => fixture(async ({ root, roots, add }) => {
 add(); let stdout = "", stderr = "";
 const io = { stdout: (s) => { stdout += s; }, stderr: (s) => { stderr += s; } };
 const args = (out) => ["--repo", roots.repoRoot, "--root", roots.projectsRoot, "--reviews", roots.reviewsRoot, "--out", out];
 const bad = path.join(roots.repoRoot, "private");
 assert.notEqual(await runMake(args(bad), io), 0); assert.equal(stderr.trim(), C.PRIVATE_REFUSAL); assert.equal(fs.existsSync(bad), false);
 const target = path.join(root, "target"); fs.mkdirSync(target);
 const link = path.join(root, "linked-final"); fs.symlinkSync(target, link, process.platform === "win32" ? "junction" : "dir");
 stderr = ""; assert.notEqual(await runMake(args(link), io), 0); assert.ok(stderr.includes("linked-final")); assert.deepEqual(fs.readdirSync(target), []);
 const alias = path.join(root, "checkout-alias"); fs.symlinkSync(roots.repoRoot, alias, process.platform === "win32" ? "junction" : "dir");
 stderr = ""; assert.notEqual(await runMake(args(path.join(alias, "nested", "out")), io), 0); assert.equal(stderr.trim(), C.PRIVATE_REFUSAL);
 const out = path.join(os.tmpdir(), path.relative(fs.realpathSync(os.tmpdir()), root), "output"); stdout = ""; stderr = "";
 assert.equal(await runMake(args(out), io), 0);
 assert.equal(stdout, "user correction 1\nuser decision 0\nworker lesson 0\ncapped claims 0\n");
 const file = path.join(out, C.CANDIDATES_FILE); assert.equal(fs.readFileSync(file, "utf8").trim().split("\n").length, 1);
 if (process.platform !== "win32") { assert.equal(fs.statSync(out).mode & 0o777, 0o700); assert.equal(fs.statSync(file).mode & 0o777, 0o600); }
 assert.notEqual(await runMake(args(out), io), 0);
 for (const secret of [quote, sentence, form(C.CORRECTION_FORM, quote, sentence)]) { assert.equal(stdout.includes(secret), false); assert.equal(stderr.includes(secret), false); }
 add([...base.slice(0, -1), entry("user", "capped", `No, ${"synthetic ".repeat(C.CLAIM_CAP)}`)]);
 stdout = ""; assert.equal(await runMake(args(path.join(root, "capped")), io), 0); assert.ok(stdout.includes("capped claims 1"));
 const capped = JSON.parse(fs.readFileSync(path.join(root, "capped", C.CANDIDATES_FILE), "utf8")); assert.ok(capped.claim.length <= C.CLAIM_CAP);
}));
// req: R-3194
await check("default scope is this repo only", () => fixture(async ({ root, roots, add }) => {
 const git = (...args) => spawnSync("git", ["-c", "user.name=Synthetic", "-c", "user.email=synthetic@example.invalid", "-c", "commit.gpgsign=false", ...args], { cwd: roots.repoRoot, encoding: "utf8", timeout: 10000 });
 assert.equal(git("init", "-q").status, 0);
 assert.equal(git("commit", "--allow-empty", "-qm", "synthetic fixture").status, 0);
 const worktree = path.join(root, "repo-wt", "lane");
 assert.equal(git("worktree", "add", "-qb", "synthetic-lane", worktree).status, 0);
 assert.equal(defaultMemoryRepo(worktree), roots.repoRoot);
 const alias = path.join(root, "repository-alias");
 fs.symlinkSync(roots.repoRoot, alias, process.platform === "win32" ? "junction" : "dir");
 assert.equal(defaultMemoryRepo(worktree, { runGit: () => ({ status: 0, stdout: path.join(alias, ".git") }) }), roots.repoRoot);
 add(); add(base, `${projectKey(`${roots.repoRoot}-wt`)}-lane`, "worktree"); add(base, "unrelated", "elsewhere");
 assert.deepEqual((await extractMemory(roots)).records.map((r) => r.evidence).sort(), ["claude-code:synthetic#owner+seat", "claude-code:worktree#owner+seat"]);
 assert.deepEqual((await extractMemory({ ...roots, project: "unrelated" })).records.map((r) => r.evidence), ["claude-code:elsewhere#owner+seat"]);
}));
// req: R-3195
await check("scoring prints exact counts over all candidates", () => fixture(async ({ root }) => {
 const candidates = [{ evidence: "a", kind: "correction", claim: "synthetic claim" }, { evidence: "b", kind: "decision" }, { evidence: "c", kind: "decision" }, { evidence: "d", kind: "correction" }, { evidence: "x", kind: "decision" }];
 const labels = [{ evidence: "a", kind: "correction", text: "synthetic label" }, { evidence: "b", kind: "decision" }, { evidence: "c", kind: "correction" }, { evidence: "d", kind: "none" }, { evidence: "e", kind: "decision" }];
 const cf = path.join(root, "candidates"), lf = path.join(root, "labels");
 for (const eol of ["\n", "\r\n", ""]) {
  fs.writeFileSync(cf, candidates.map(JSON.stringify).join(eol || "\n") + (eol ? ` \t${eol}` : "")); fs.writeFileSync(lf, labels.map(JSON.stringify).join(eol || "\n") + eol);
  let stdout = "", stderr = ""; const io = { stdout: (s) => { stdout += s; }, stderr: (s) => { stderr += s; } };
  assert.equal(await runScore(["--candidates", cf, "--labels", lf], io), 0);
  assert.equal(stdout, "correction: recall 1/2\ndecision: recall 1/2\nlesson: recall 0/0\nprecision 2/5\nfalse per owner turn 2/5\nunlabelled 1\nunscored: unlabelled candidates\n");
  assert.equal(stdout.includes("synthetic"), false);
  fs.writeFileSync(lf, "synthetic invalid label"); assert.notEqual(await runScore(["--candidates", cf, "--labels", lf], io), 0); assert.equal(stderr.includes("synthetic"), false);
 }
}));

// req: R-3196
await check("seal: correction cues", () => assert.equal(C.CORRECTION_CUES.source, "(?:^\\s*no\\b|\\bi thought\\b|\\bagain\\b|\\bwhy did you\\b|\\bdon['’]t\\b|\\bstop\\b|\\?{2,})"));
// req: R-3197
await check("seal: decision question pattern", () => assert.equal(C.QUESTION_PATTERN.source, "(?:[^.!?\\n]+\\?|YOUR CALL\\b[^\\n]*(?:\\n(?!\\s*\\n)[^\\n]*)*)"));
// req: R-3198
await check("seal: short answer words", () => assert.equal(C.SHORT_ANSWER_WORD_CAP, 40));
// req: R-3199
await check("seal: correction context words", () => assert.equal(C.CONTEXT_MIN_WORDS, 20));
// req: R-3200
await check("seal: text character cap", () => assert.equal(C.CLAIM_CAP, 1200));
// req: R-3201
await check("seal: correction form", () => assert.equal(C.CORRECTION_FORM, "<quote> — correcting: <context>"));
// req: R-3202
await check("seal: decision form", () => assert.equal(C.DECISION_FORM, "<quote> — answering: <context>"));
// req: R-3203
await check("seal: roles by source", () => assert.deepEqual(C.ROLES, { user: ["seat"], worker: ["planner", "builder", "reviewer"] }));
// req: R-3204
await check("seal: starting trust and source", () => assert.deepEqual(C.STARTING_STATE, { trust: "low", source: "extracted" }));
// req: R-3205
await check("seal: wrapper tags", () => assert.deepEqual(C.WRAPPER_TAGS, ["<command", "<local-command", "<system-reminder", "<task-notification", "[Request interrupted"]));
// req: R-3206
await check("seal: review exclusions", () => assert.equal(C.REVIEW_EXCLUDE.source, "(?:^plan|[-]plan[-]|^sol-plan-|^must-meet|brief|report|^factcheck-|^tree-movement\\.md$|^CHANGE\\.md$|build[-_]?(?:notes?|[0-9]))"));
// req: R-3207
await check("seal: transcript day timezone", () => assert.equal(DAY_TIMEZONE, "America/New_York"));
// req: R-3208
await check("seal: candidates filename", () => assert.equal(C.CANDIDATES_FILE, "candidates.jsonl"));
// req: R-3209
await check("seal: private checkout refusal", () => assert.equal(C.PRIVATE_REFUSAL, "memory: output must be outside git checkouts"));
// req: R-3250
await check("seal: shared candidate fields", () => assert.deepEqual(C.CANDIDATE_FIELDS, ["id", "type", "kind", "claim", "quote", "context", "evidence", "date", "trust", "source", "roles", "validFrom", "invalidAt", "supersedes"]));
