/**
 * @module apps/bench/test/anatomy.test.mjs
 * @purpose Pin the nine builder anatomy contracts on synthetic private OS-temp fixtures.
 * @inputs Anatomy modules, synthetic pi entries and temporary git history.
 * @outputs Nine awaited bounded PASS/FAIL cases and counts-only synthetic CLI evidence.
 * @effects disk (OS-temp fixtures), process (bounded git commands)
 * @errors Assertion failures set a nonzero exit; no private fixture text is printed.
 */
import assert from "node:assert/strict";
import { tmpDir } from "./tmp-dir.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { runAnatomy } from "../lib/anatomy.mjs";
import { extractContexts } from "../lib/anatomy-sessions.mjs";
import { segmentPart } from "../lib/anatomy-spans.mjs";
import { pullsOf } from "../lib/anatomy-pulls.mjs";
import { reportContexts, drawSample, agreement, assembleParts } from "../lib/anatomy-measures.mjs";
import { FUNCTIONS, RULES, OVERSIZE_UNIT_CHARS, SHARE_DIGITS, STAGE_POINTER, SAMPLE_MIN_FUNCTION, KAPPA_MIN_COUNT } from "../lib/anatomy-config.mjs";
import { cohensKappa } from "../lib/catch-stats.mjs";
import { collectBuildUsage } from "../../../packages/nana-pack/lib/build-records.mjs";
import { totalTokens } from "../../../packages/nana-pack/lib/pi-usage.mjs";
import { entriesIn } from "../../../packages/nana-pack/lib/claude-transcript.mjs";

const LIMIT = 30000;
const td = tmpDir(path.join(os.tmpdir(), "anatomy-test-"));
let serial = 0, failures = 0;
const folder = (name) => { const p = path.join(td, `${++serial}-${name}`); fs.mkdirSync(p, { recursive: true }); return p; };
const put = (p, text) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const jsonl = (p, rows) => put(p, rows.map((r) => JSON.stringify(r)).join("\r\n \t\r\n") + " \t");
const git = (cwd, ...args) => { const r = spawnSync("git", ["-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd, encoding: "utf8", timeout: LIMIT }); assert.equal(r.status, 0); return r.stdout.trim(); };
const text = (s) => [{ type: "text", text: s }];
const msg = (role, content, extra = {}) => ({ type: "message", timestamp: "2026-01-01T00:01:00.000Z", message: { role, content: text(content), ...extra } });
const part = (name, raw, id = name) => ({ name, raw, spans: segmentPart(raw, name, id) });
const context = (id, buildNumber, parts, extra = {}) => ({ id, lane: "alpha", buildNumber, model: "fixture-model", verdict: "none", tokens: 0, wallMinutes: 0, landed: false, pulls: [], parts, cwd: "/tmp/project-wt/alpha", branch: "feat/alpha", ...extra });
const readRows = entriesIn;
async function cli(args) { let stdout = "", stderr = ""; const exit = await runAnatomy(args, { stdout: (s) => { stdout += s; }, stderr: (s) => { stderr += s; } }); return { exit, stdout, stderr }; }
async function test(title, fn) {
 let timer;
 try { await Promise.race([Promise.resolve().then(fn), new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("case limit")), LIMIT); })]); console.log(`PASS ${title}`); }
 catch (error) { failures++; console.log(`FAIL ${title}`); const location = error.stack?.match(/anatomy\.test\.mjs:\d+:\d+/u)?.[0]; if (location) console.log(`assertion ${location}`); }
 finally { clearTimeout(timer); }
}
function fixture(marker = "") {
 const root = folder("corpus"), repo = path.join(root, "project"), cwd = path.join(root, "project-wt", "alpha"), sessions = path.join(root, "sessions"), sd = path.join(sessions, "--project-wt-alpha--");
 fs.mkdirSync(repo); fs.mkdirSync(cwd, { recursive: true }); fs.mkdirSync(sd, { recursive: true }); git(repo, "init", "-q");
 const briefPath = "docs/reviews/unrelated-folder/build-brief-1.md";
 const brief = `Feature: FEAT-042 · Synthetic\r\n${marker}\r\n## Precedent\r\n- lib/report-table.mjs \t`;
 put(path.join(repo, briefPath), brief); git(repo, "add", briefPath); git(repo, "commit", "-qm", "fixture brief"); const tip = git(repo, "rev-parse", "HEAD");
 put(path.join(repo, briefPath), "changed after build\n"); git(repo, "add", briefPath); git(repo, "commit", "-qm", "later brief");
 const addendum = `Builder preamble ${cwd} ${marker}\r\n\r\n${brief}\r\n\r\n## Known bugs\r\nSynthetic past mistake. ${marker} \t`;
 const sections = { preamble: "Pi preamble\r\n", addendum, project_context: "Synthetic project facts.", skills: "<skills>synthetic</skills>", cwd };
 const names = ["2026-01-01T00-00-01-000Z_a.jsonl", "2026-01-01T00-00-02-000Z_b.jsonl"];
 for (const [i, name] of names.entries()) jsonl(path.join(sd, name), [
  { type: "session", cwd, timestamp: "2026-01-01T00:00:00.000Z" }, { type: "session_info", name: `pi-worker-a${i + 1}-fixture` },
  { type: "message", message: { role: "system", content: "", sections, toolsAdded: [{ name: "read", parameters: {} }] } }, msg("user", "Synthetic instruction."),
  { type: "custom_message", customType: "nana-knowledge", content: text("Synthetic fetched knowledge.") },
  { type: "context_edit", replacement: "edit" }, { type: "compaction", summary: "compact" },
  msg("assistant", i ? "VERDICT: DONE\nSynthetic report." : "Synthetic attempt.", { model: "fixture-model", usage: { totalTokens: i + 7 } }),
 ]);
 put(path.join(sd, names[0]), fs.readFileSync(path.join(sd, names[0]), "utf8") + "\n{torn");
 jsonl(path.join(sd, "review.jsonl"), [{ type: "session", cwd }, { type: "session_info", name: "pi-review-fixture" }]);
 const start = { v: 1, kind: "start", build: "fixture-build", lane: "ignored-ledger-lane", cwd, sessionDir: sd, startedAt: "2026-01-01T00:00:00.000Z", tip, brief: briefPath, model: "fixture-model" };
 jsonl(path.join(repo, ".git/nana/build-records.jsonl"), [start, { v: 1, kind: "end", build: start.build, sessions: names, attempts: 2, durationMs: 120000, endedAt: "2026-01-01T00:02:00.000Z" }]);
 jsonl(path.join(repo, ".git/nana/land-records.jsonl"), [{ v: 1, kind: "start", attempt: "land", lane: "alpha" }, { v: 1, kind: "end", attempt: "land", outcome: "landed" }]);
 return { repo, cwd, sessions, sd, start, sections, addendum, brief, tip };
}

// Seat-written before rules; synthetic, verbatim from the brief.
const labelled = [
 ["The lane exists so a reviewer can see which known bugs a change touches.", "purpose"],
 ["Add a `--json` flag to the report command that prints one object per row.", "task"],
 ["Write the failing test first, then the code, then run the targeted test file.", "method"],
 ["Never write to the real home folder; every test uses a temporary home.", "constraints"],
 ["Follow `lib/report-table.mjs` for column widths and padding.", "precedent"],
 ["The map check fails when a module header lacks the six tags.", "knowledge"],
 ["A past build broke Windows by unescaping newline escapes in test strings.", "lessons"],
 ["Run `npm run map:check` to regenerate and verify the code map.", "tools"],
 ["End the report with the commit, the rows changed and each departure from the precedent.", "output contract"],
 ["The change is done when the locked suite and the map check exit 0.", "feedback"],
 ["Do not copy a private helper; import it or ask for the move.", "constraints"],
 ["The owner wants plain language in every report.", "constraints"],
 ["Builds stall when the suite runs detached; run it in the foreground.", "lessons"],
 ["`pi-worker` refuses a brief whose Precedent names an untracked file.", "knowledge"],
 ["Report a known bug the change touches as one line in the report.", "output contract"],
];

// req: R-3270
await test("R-3270: pushed parts and recorded attempts preserve committed context", async () => {
 const f = fixture(); const result = extractContexts({ repo: f.repo, sessions: f.sessions });
 assert.equal(result.contexts.length, 1); const c = result.contexts[0]; assert.equal(c.lane, "alpha"); assert.equal(c.attempts, 2); assert.equal(c.startTip, f.tip); assert.equal(c.briefBlob, `${f.tip}:${f.start.brief}`);
 for (const attempt of [0, 1]) {
  const parts = c.parts.filter((p) => p.attempt === attempt);
  assert.deepEqual(parts.map((p) => p.name), ["preamble", "preamble", "brief", "known-bugs", "project_context", "skills", "cwd", "toolsAdded", "instruction", "knowledge-pull"]);
  assert.equal(parts.filter((p) => p.section === "addendum").map((p) => p.raw).join(""), f.addendum);
  for (const [key, value] of Object.entries(f.sections)) assert.equal(parts.filter((p) => p.section === key).map((p) => p.spans.map((s) => s.text).join("")).join(""), value);
 }
 assert.equal(c.excluded.filter((x) => x.reason === "compaction" && x.chars === 7).length, 2);
 assert.equal(c.excluded.filter((x) => x.reason === "context-edit" && x.chars === 4).length, 2);
 assert.equal(result.skipped.filter((s) => s.reason === "not-builder").length, 1);
 fs.unlinkSync(path.join(f.repo, ".git/nana/build-records.jsonl"));
 const fallback = extractContexts({ repo: f.repo, sessions: f.sessions }); assert.equal(fallback.contexts.length, 2); assert(fallback.contexts.every((x) => x.parts.some((p) => p.name === "brief")));
 const name = path.join(f.sd, "2026-01-01T00-00-03-000Z_unknown.jsonl"); jsonl(name, [{ type: "session", cwd: f.cwd }, { type: "session_info", name: "pi-worker-a1-unknown" }, { type: "message", message: { role: "system", sections: { addendum: "No matching brief." } } }]);
 const unmatched = extractContexts({ repo: f.repo, sessions: f.sessions }).contexts.find((x) => x.parts.some((p) => p.reason === "brief-unmatched")); assert.equal(unmatched.parts[0].name, "addendum");
});

// req: R-3271
await test("R-3271: configured labels and fence-aware spans tile exact input", async () => {
 assert.equal(FUNCTIONS.length, 10); assert(RULES.length);
 for (const [unit, label] of labelled) { const spans = segmentPart(unit, "brief", "fixture"); assert.equal(spans.filter((s) => s.kind === "unit").length, 1); assert.equal(spans[0].label, label); }
 for (const nl of ["\n", "\r\n"]) {
  const raw = ["# Method \t", "", "Paragraph é😀", "```md", "", "# not heading", "```", "", "- parent", "  - nested \t", "", "| name | value |", "|---|---|", "| a | one |", "| b | two |"].join(nl);
  const spans = segmentPart(raw, "brief", "fixture"); assert.equal(spans.map((s) => s.text).join(""), raw); let end = 0;
  for (const s of spans) { assert.equal(s.start, end); end = s.end; assert.equal(s.text, raw.slice(s.start, s.end)); if (s.kind === "unit") assert([...FUNCTIONS, "unsorted"].includes(s.label)); }
  assert.equal(end, raw.length); assert.equal(spans.filter((s) => s.kind === "unit").length, 5); assert.equal(spans.filter((s) => s.heading).length, 1);
  assert.deepEqual(segmentPart(raw, "brief", "fixture"), spans);
 }
 assert.equal(segmentPart("<skills>\n\n<skill>a</skill>\n<skill>b</skill></skills>", "skills", "xml").length, 1);
});

// req: R-3272
await test("R-3272: counts shares oversize duplicates sizes and zero supply", async () => {
 const a = context("a", 1, [part("preamble", "Read /tmp/project-wt/alpha/file.", "a"), part("project_context", "Read /tmp/project-wt/beta/file.", "b"), part("skills", "x".repeat(OVERSIZE_UNIT_CHARS + 1), "big")]);
 const b = context("b", 2, [part("brief", "The change is done when the locked suite and the map check exit 0.", "feedback")], { cwd: "/tmp/project-wt/beta" });
 // Duplicate normalization uses each context's own path.
 a.parts[1].raw = a.parts[1].raw.replace("beta", "alpha"); a.parts[1].spans = segmentPart(a.parts[1].raw, "project_context", "b");
 const r = reportContexts([a, b]); assert.equal(r.oversize.length, 1); assert.equal(r.oversize[0].chars, OVERSIZE_UNIT_CHARS + 1); assert.equal(r.oversize[0].part, "skills");
 assert.equal(r.overall.reduce((n, x) => n + x.units, 0), 3); assert.equal(r.overall.reduce((n, x) => n + x.chars, 0), a.parts[0].raw.length * 2 + b.parts[0].raw.length);
 for (const field of ["unitShare", "charShare"]) assert(Math.abs(r.overall.reduce((n, x) => n + x[field], 0) - 100) <= r.overall.length * 10 ** -SHARE_DIGITS);
 assert.equal(r.overall.find((x) => x.function === "unsorted").units, 2); assert.equal(r.overall.find((x) => x.function === "feedback").units, 1);
 assert.equal(r.overall.find((x) => x.function === "unsorted").unitShare, 66.67); assert.equal(r.overall.find((x) => x.function === "feedback").unitShare, 33.33);
 assert.equal(r.parts.find((x) => x.part === "preamble").counts.find((x) => x.function === "unsorted").charShare, 100);
 const glued = reportContexts([context("glued", 1, [part("brief", "# Method\r\n\r\nWrite the failing test first.\r\n\r\n")])]); assert.equal(glued.overall.find((x) => x.function === "glue").chars, 14);
 assert.equal(r.duplicates.length, 1); assert.deepEqual(r.duplicates[0], { id: "dup-1", count: 2, parts: ["preamble", "project_context"] });
 assert.equal(r.parts.find((x) => x.part === "skills").max, OVERSIZE_UNIT_CHARS + 1); assert.equal(r.parts.find((x) => x.part === "skills").p90, OVERSIZE_UNIT_CHARS + 1);
 assert.equal(r.zeroSupply.find((x) => x.function === "feedback" && x.group === "1").zeroShare, 100); assert.equal(r.zeroSupply.find((x) => x.function === "feedback" && x.group === "2+").zeroShare, 0);
 const different = context("c", 1, [part("brief", "Read /tmp/project-wt/beta/file.", "c")], { cwd: "/tmp/project-wt/beta", branch: "feat/beta" }); assert.equal(reportContexts([a, different]).duplicates[0].count, 3);
});

// req: R-3273
await test("R-3273: all writers refuse unsafe output and all printers keep text private", async () => {
 const sentinel = "SYNTHETIC_PRIVATE_SENTINEL_42";
 const f = fixture(sentinel), out = path.join(folder("private"), "segmented");
 for (const file of fs.readdirSync(f.sd).filter((n) => n.endsWith(".jsonl") && n !== "review.jsonl")) {
  const rows = readRows(path.join(f.sd, file)); const sys = rows.find((e) => e.message?.role === "system");
  for (const key of Object.keys(sys.message.sections)) if (key !== "addendum") sys.message.sections[key] = `# ${sentinel}\n\n${sentinel}\n\n${sentinel}`;
  sys.message.toolsAdded = sentinel; rows.find((e) => e.message?.role === "user").message.content = text(sentinel); rows.find((e) => e.type === "custom_message").content = text(sentinel); jsonl(path.join(f.sd, file), rows);
 }
 const seg = await cli(["segment", "--repo", f.repo, "--sessions", f.sessions, "--out", out]); assert.equal(seg.exit, 0);
 const sampleOut = path.join(folder("private"), "sample"); const sample = await cli(["sample", "--in", out, "--out", sampleOut, "--seed", "fixture"]); assert.equal(sample.exit, 0);
 const sheet = readRows(path.join(sampleOut, "sheet.jsonl")); const filled = jsonl(path.join(folder("labels"), "a.jsonl"), sheet.map((x) => ({ ...x, label: "knowledge" })));
 const agree = await cli(["agree", "--in", out, "--a", filled, "--b", filled]); const report = await cli(["report", "--in", out]); const assembled = await cli(["assemble", "--in", out, "--out", path.join(folder("private"), "assembly")]);
 for (const r of [seg, sample, agree, report, assembled]) { assert.equal(r.exit, 0); assert(!`${r.stdout}${r.stderr}`.includes(sentinel)); }
 for (const cmd of ["segment", "sample", "assemble"]) {
  const unsafe = path.join(f.repo, `unsafe-${cmd}`); const r = await cli([cmd, "--repo", f.repo, "--sessions", f.sessions, "--in", out, "--out", unsafe]); assert.equal(r.exit, 1); assert.match(r.stderr, /checkout/); assert(!fs.existsSync(unsafe));
  const link = path.join(folder("links"), "output"); fs.symlinkSync(folder("target"), link, process.platform === "win32" ? "junction" : "dir"); const symlink = await cli([cmd, "--in", out, "--out", link]); assert.equal(symlink.exit, 1); assert.match(symlink.stderr, /symlink/); assert.deepEqual(fs.readdirSync(link), []);
 }
 const alias = path.join(folder("alias"), "ancestor"); fs.symlinkSync(folder("ancestor-target"), alias, process.platform === "win32" ? "junction" : "dir"); assert.equal((await cli(["sample", "--in", out, "--out", path.join(alias, "sample"), "--seed", "s"])).exit, 0);
 assert.equal((await cli(["segment", "--repo", f.repo, "--sessions", f.sessions, "--out", out])).exit, 1);
 console.log("synthetic subcommands 5; unsafe writers 3; private-text leaks 0");
});

// req: R-3274
await test("R-3274: assembly uses spans and preserves whole cut and staged text", async () => {
 const raw = "# Method\r\n\r\nWrite the failing test first. \t\r\n\r\n# Facts\r\n\r\nThe map check fails when tags are absent.";
 const c = context("a", 1, [part("brief", raw)]); assert.equal(assembleParts(c).parts[0].text, raw);
 const altered = structuredClone(c); altered.parts[0].spans.find((s) => s.kind === "unit").text = "Changed span."; assert(assembleParts(altered).parts[0].text.includes("Changed span."));
 const units = c.parts[0].spans.filter((s) => s.kind === "unit" && s.label === "method"); assert.equal(units.length, 1);
 const cut = assembleParts(c, { drop: "method" }); assert.equal(cut.removedUnits, 1); assert.equal(cut.removedChars, units[0].text.length); assert(!cut.parts[0].text.includes("# Method")); assert(cut.parts[0].text.includes("# Facts"));
 const staged = assembleParts(c, { stage: "method" }); assert.equal(staged.staged, units.map((s) => s.text).join("")); assert.equal(staged.parts[0].text, raw.replace(units[0].text, STAGE_POINTER));
 const two = context("two", 1, [part("brief", "# Method\n\nWrite the failing test first.\n\nWrite the failing test first.")]); const runs = assembleParts(two, { stage: "method" }); assert.equal(runs.parts[0].text.split(STAGE_POINTER).length - 1, 1);
});

// req: R-3275
await test("R-3275: wrapped and dedicated pulls count exact calls chars and functions", async () => {
 const entries = [], add = (name, args, result, isError = false) => { const id = `t${entries.length}`; entries.push(msg("assistant", "", { content: [{ type: "toolCall", id, name, arguments: args }] }), msg("toolResult", result, { toolCallId: id, isError })); };
 add("grep", { path: "lib/report-table.mjs", pattern: "columns" }, "123"); add("bash", { command: "cd X && sed -n '1,4p' docs/known-bugs/FEAT-042.md" }, "12345"); add("bash", { command: "bash -lc 'cat tests/example.test.mjs'" }, "1234567"); add("bash", { command: "git show main:lib/report-table.mjs" }, "12345678901"); add("read", { path: "README.md" }, "error text", true); add("bash", { command: "npm test" }, "1234567890123");
 const pulls = pullsOf(entries, { cwd: "/tmp/project", precedent: ["lib/report-table.mjs"] }); assert.equal(pulls.length, 6); assert.deepEqual(pulls.map((p) => [p.class, p.chars]), [["precedent", 3], ["known-bugs", 5], ["tests", 7], ["precedent", 11], ["docs", 0], ["unclassified-bash", 13]]);
 const r = reportContexts([context("a", 1, [], { pulls })]); assert.equal(r.pulls.byFunction.find((x) => x.function === "precedent").chars, 14); assert.equal(r.pulls.byFunction.find((x) => x.function === "lessons").chars, 5);
 const shell = []; for (const command of ["head a; tail b | nl", "git diff; git log -p", "awk '{print $1}' file"]) shell.push(msg("assistant", "", { content: [{ type: "toolCall", id: command, name: "bash", arguments: { command } }] }), msg("toolResult", "abc", { toolCallId: command })); assert.equal(pullsOf(shell).length, 6); assert.equal(pullsOf(shell).reduce((n, p) => n + p.chars, 0), 9);
});

// req: R-3276
await test("R-3276: blinded seeded sample and three-pair agreement reject unequal ids", async () => {
 const c = context("a", 1, labelled.map(([t], i) => part("brief", t, `s${i}`))); const s = drawSample([c], { seed: "fixed", n: 100 }); assert.deepEqual(s, drawSample([c], { seed: "fixed", n: 100 })); assert(s.every((u) => Object.keys(u).sort().join() === "id,text"));
 for (const f of FUNCTIONS) assert(s.filter((u) => labelled.find(([t, l]) => t === u.text.trim() && l === f)).length >= Math.min(SAMPLE_MIN_FUNCTION, labelled.filter(([, l]) => l === f).length));
 const units = [part("brief", "Add a flag.", "u1"), part("brief", "Never " + "long ".repeat(50), "u2"), part("brief", "Run a command.", "u3")]; const contexts = [context("sample", 1, units)];
 const ids = units.flatMap((p) => p.spans).filter((u) => u.kind === "unit").map((u) => u.id); const a = ids.map((id, i) => ({ id, label: ["task", "constraints", "tools"][i] })), b = ids.map((id, i) => ({ id, label: ["task", "task", "tools"][i] }));
 const result = agreement(contexts, a, b); assert.equal(result.pairs.length, 3); const ab = result.pairs.find((p) => p.pair === "a:b"); assert.equal(ab.kappa.kappa, cohensKappa(a.map((x) => x.label), b.map((x) => x.label)).kappa); assert.notEqual(ab.charAgreement, ab.kappa.po); assert.equal(result.consensus, 2); assert.equal(ab.confusions[0].count, 1);
 const many = Array.from({ length: KAPPA_MIN_COUNT }, (_, i) => part("brief", "Add a flag.", `many${i}`)); const cm = [context("many", 1, many)]; const labels = many.flatMap((p) => p.spans).map((u) => ({ id: u.id, label: "task" })); assert.equal(agreement(cm, labels, labels).pairs[0].perFunction.find((x) => x.function === "task").kappa.kappa, 1);
 assert.throws(() => agreement(contexts, a, b.slice(1)), /ids differ: 1/);
 const input = folder("input"); jsonl(path.join(input, "contexts.jsonl"), contexts); const af = jsonl(path.join(folder("labels"), "a"), a), bf = jsonl(path.join(folder("labels"), "b"), b.slice(1)); const mismatch = await cli(["agree", "--in", input, "--a", af, "--b", bf]); assert.equal(mismatch.exit, 1); assert.match(mismatch.stderr, /ids differ: 1/);
});

// req: R-3277
await test("R-3277: one complete count row per build sums attempt usage", async () => {
 const f = fixture(); const result = extractContexts({ repo: f.repo, sessions: f.sessions }); const c = result.contexts[0]; const r = reportContexts(result.contexts); assert.equal(r.builds.length, 1);
 const expectedFunctions = Object.fromEntries([...FUNCTIONS, "unsorted", "glue"].map((label) => [label, { units: c.parts.flatMap((p) => p.spans).filter((s) => s.label === label && s.kind === "unit").length, chars: c.parts.flatMap((p) => p.spans).filter((s) => (s.kind === "glue" ? "glue" : s.label) === label).reduce((n, s) => n + s.text.length, 0) }]));
 assert.deepEqual(r.builds[0], { id: "fixture-build", lane: "alpha", buildNumber: 1, attempts: 2, model: "fixture-model", verdict: "DONE", functions: expectedFunctions, pulledChars: 0, tokens: totalTokens(collectBuildUsage(f.start).usage), wallMinutes: 2, landed: true }); assert.equal(r.builds[0].tokens, 15);
 for (const name of fs.readdirSync(f.sd).filter((n) => n.includes("_b"))) { const rows = readRows(path.join(f.sd, name)); rows.filter((e) => e.message?.role === "assistant").at(-1).message.content = text("No verdict."); jsonl(path.join(f.sd, name), rows); }
 assert.equal(extractContexts({ repo: f.repo, sessions: f.sessions }).contexts[0].verdict, "none");
});

// req: R-3278
await test("R-3278: seal oversize threshold is 3000 UTF-16 chars", async () => { assert.equal(OVERSIZE_UNIT_CHARS, 3000); });
fs.rmSync(td, { recursive: true, force: true });
console.log(`anatomy: ${9 - failures}/9 checks passed`);
process.exitCode = failures ? 1 : 0;
