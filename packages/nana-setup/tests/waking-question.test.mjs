/**
 * @module packages/nana-setup/tests/waking-question.test.mjs
 * @purpose Pin the away-owner blocking-question failure through the real hook entry.
 * @inputs Temporary transcript, records and PreToolUse stdin.
 * @outputs PASS line or assertion failure.
 * @effects disk (temporary fixtures), process (hook and git)
 * @errors Assertion failures fail the test.
 */
import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { fixture, invoke, test } from "./waking-fixture.mjs";

// req: R-3971
await test("R-3971: an old owner prompt cannot freeze an open lane on a question", { timeout: 45000 }, () => {
 const root = fixture();
 const transcript = join(root, "transcript.jsonl");
 for (const ending of ["\n", " \r\n", "\t\r\n", ""]) {
  const human = { type: "user", origin: { kind: "human" }, timestamp: new Date(Date.now() - 20 * 60000).toISOString() };
  const notification = { type: "user", origin: { kind: "task-notification" }, timestamp: new Date().toISOString() };
  writeFileSync(transcript, `bad partial\n${JSON.stringify(human)}${ending || "\n"}${JSON.stringify(notification)}${ending}`);
  const result = invoke(root, { hook_event_name: "PreToolUse", tool_name: "AskUserQuestion", transcript_path: transcript });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout).hookSpecificOutput;
  assert.equal(output.hookEventName, "PreToolUse");
  assert.equal(output.permissionDecision, "deny");
  assert.match(output.permissionDecisionReason, /one-word default/);
  assert.match(output.permissionDecisionReason, /keep lanes moving/);
  assert.match(output.permissionDecisionReason, /never authorizes deleting, overwriting or acting outside the working folder/);
 }
});
