/**
 * @module packages/nana-setup/tests/waking-stop.test.mjs
 * @purpose Pin the unarmed open-lane Stop failure through the real hook entry.
 * @inputs Temporary build records and Stop stdin.
 * @outputs PASS line or assertion failure.
 * @effects disk (temporary repo), process (hook and git)
 * @errors Assertion failures fail the test.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fixture, hook, invoke, test } from "./waking-fixture.mjs";
import { wakingDecision } from "../../nana-pack/lib/waking-guards.mjs";

const report = "Two runs are going. Main CI is checking part 1 of the pack test diet, and part 2's build has been running for 12 minutes with its first commit made.";
function noLane() {
 const root = fixture();
 const result = spawnSync("git", ["checkout", "main"], { cwd: root, encoding: "utf8", timeout: 10000 });
 assert.equal(result.status, 0, result.stderr);
 return root;
}
function block(result) {
 assert.equal(result.status, 0, result.stderr);
 assert.equal(result.stdout.trim().split("\n").length, 1);
 const output = JSON.parse(result.stdout);
 assert.equal(output.decision, "block");
 return output.reason;
}

// req: R-3970
await test("R-3970: an open lane without a recurring wake blocks turn end", { timeout: 45000 }, () => {
 for (const ending of ["\n", " \r\n", "\t\r\n", ""]) {
  const result = invoke(fixture(ending), { hook_event_name: "Stop", session_crons: [] });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.decision, "block");
  assert.match(output.reason, /wake-test/);
  assert.match(output.reason, /CronCreate/);
  assert.match(output.reason, /recurring wake/);
 }
});

// req: R-4140
await test("R-4140: a final report blocks once with bounded writing findings", { timeout: 45000 }, () => {
 const root = noLane();
 for (const ending of ["\n", " \r\n", "\t\r\n", ""]) {
  const reason = block(invoke(root, { hook_event_name: "Stop", session_crons: [], last_assistant_message: report + ending }));
  assert.match(reason, /verdict.*no verdict word/);
  assert.match(reason, /length.*words/);
  assert.match(reason, /Fix each finding.*why it stays.*end the turn/);
 }
 assert.match(block(invoke(root, { hook_event_name: "Stop", last_assistant_message: "DONE: inspect `one` and `two`." })), /identifier/);
 const bounded = block(invoke(root, { hook_event_name: "Stop", last_assistant_message: `DONE: ${"dogfood ".repeat(400)}.` }));
 assert.ok(bounded.length < 1800);
 assert.ok((bounded.match(/banned \(line/g) ?? []).length <= 12);
});

// req: R-4141
await test("R-4141: active Stop, set roles and absent or clean messages abstain", { timeout: 45000 }, () => {
 const root = noLane();
 for (const text of [undefined, "", "  ", "DONE: the lane landed. Main CI passed.", "Which branch?"]) {
  const result = invoke(root, { hook_event_name: "Stop", session_crons: [], last_assistant_message: text });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
 }
 const active = invoke(root, { hook_event_name: "Stop", stop_hook_active: true, session_crons: [], last_assistant_message: report });
 assert.equal(active.status, 0);
 assert.equal(active.stdout, "");
 for (const role of ["builder", "reviewer", "worker", "", "other"]) {
  const result = spawnSync(process.execPath, [hook], { cwd: root, encoding: "utf8", timeout: 10000,
   env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, CLAUDE_PROJECT_DIR: root, NANA_ROLE: role },
   input: JSON.stringify({ hook_event_name: "Stop", session_crons: [], last_assistant_message: report }) });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  const unread = () => { throw new Error("reader must not run"); };
  assert.equal(wakingDecision({ hook_event_name: "Stop", session_crons: [], last_assistant_message: "Nothing waits on you." }, { role, lanes: unread, readIssues: unread }), null);
 }
 let reads = 0;
 assert.equal(wakingDecision({ hook_event_name: "Stop", stop_hook_active: true, session_crons: [], last_assistant_message: "Nothing waits on you." }, { lanes: () => { reads++; }, readIssues: () => { reads++; } }), null);
 assert.equal(reads, 0);
});

// req: R-4142
await test("R-4142: short nonreports count only length passive and banned", { timeout: 45000 }, () => {
 const root = noLane();
 for (const text of ["Thanks.", "Which branch?", "See `path/file.mjs`."]) {
  const result = invoke(root, { hook_event_name: "Stop", last_assistant_message: text });
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
 }
 for (const [text, check] of [[report.split(". ")[1], "length"], ["The file was edited.", "passive"], ["Try dogfood.", "banned"]]) {
  const reason = block(invoke(root, { hook_event_name: "Stop", last_assistant_message: text }));
  assert.match(reason, new RegExp(check));
  assert.doesNotMatch(reason, /verdict|identifier/);
 }
});

// req: R-4143
await test("R-4143: nothing-waits claims check blocking asks and reader failures preserve other parts", { timeout: 45000 }, () => {
 let reads = 0;
 const readers = { lanes: () => ["wake-test"], readIssues: () => { reads++; return { items: [
  { kind: "blocking", title: "Choose a branch" }, { kind: "optional", title: "Optional choice" }, { kind: "blocking", title: "Approve the plan" },
 ] }; } };
 for (const text of ["Nothing is waiting on you.", "Nothing waits on you.", "No open asks for you."]) {
  const output = wakingDecision({ hook_event_name: "Stop", last_assistant_message: text }, readers);
  assert.match(output.reason, /open asks: 2.*Choose a branch.*Approve the plan/);
  assert.doesNotMatch(output.reason, /Optional choice/);
 }
 assert.equal(reads, 3);
 for (const text of ['"nothing is waiting on you"', "`nothing waits on you`", "‘no open asks for you’", "'nothing waits on you'", "“nothing waits on you”", "Nothing is waiting on CI.", "```\nnothing waits on you\n```"]) {
  wakingDecision({ hook_event_name: "Stop", last_assistant_message: text }, readers);
 }
 assert.equal(reads, 3);
 const payload = { hook_event_name: "Stop", session_crons: [], last_assistant_message: `${report} Nothing waits on you.` };
 for (const readIssues of [() => { throw new Error("timeout"); }, () => ({ failure: "unavailable" })]) {
  const output = wakingDecision(payload, { ...readers, readIssues });
  assert.match(output.reason, /CronCreate/);
  assert.match(output.reason, /verdict/);
  assert.match(output.reason, /length/);
  assert.doesNotMatch(output.reason, /open asks:/);
 }
 const bounded = wakingDecision({ hook_event_name: "Stop", last_assistant_message: "Nothing waits on you." }, { readIssues: () => ({ items: Array.from({ length: 30 }, () => ({ kind: "blocking", title: "x".repeat(500) })) }) });
 assert.match(bounded.reason, /30 blocking/);
 assert.ok(bounded.reason.length < 1800);
});

// req: R-4144
await test("R-4144: wake and writing share one block with the wake first", { timeout: 45000 }, () => {
 const reason = block(invoke(fixture(), { hook_event_name: "Stop", session_crons: [], last_assistant_message: report }));
 assert.match(reason, /^Open lanes: wake-test/);
 assert.match(reason, /CronCreate[\s\S]*Writing findings:[\s\S]*verdict/);
 assert.match(reason, /length/);
});
