/**
 * @module packages/nana-setup/tests/waking-launch.test.mjs
 * @purpose Pin the detached lane-tool launch failure through the real hook entry.
 * @inputs Temporary repository and Bash PreToolUse stdin.
 * @outputs PASS line or assertion failure.
 * @effects disk (temporary repo), process (hook and git)
 * @errors Assertion failures fail the test.
 */
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fixture, hook, invoke, test } from "./waking-fixture.mjs";

function bash(command, extra = {}) {
 return { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command, run_in_background: true }, ...extra };
}
function abstains(root, payload) {
 for (const role of ["builder", "reviewer"]) {
  const result = spawnSync(process.execPath, [hook], { cwd: root, encoding: "utf8", timeout: 10000,
   env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, CLAUDE_PROJECT_DIR: root, NANA_ROLE: role }, input: JSON.stringify(payload) });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
 }
 const result = invoke(root, { ...payload, stop_hook_active: true });
 assert.equal(result.status, 0, result.stderr);
 assert.equal(result.stdout, "");
}

// req: R-3972
await test("R-3972: a detached lane-tool launch is denied", { timeout: 15000 }, () => {
 const result = invoke(fixture(), { hook_event_name: "PreToolUse", tool_name: "Bash", tool_input: { command: "pi-worker --lane x --brief b --out o &", run_in_background: false } });
 assert.equal(result.status, 0, result.stderr);
 const output = JSON.parse(result.stdout).hookSpecificOutput;
 assert.equal(output.hookEventName, "PreToolUse");
 assert.equal(output.permissionDecision, "deny");
 assert.match(output.permissionDecisionReason, /own background call/);
 assert.match(output.permissionDecisionReason, /exit wakes the seat/);
});

// req: R-4212
await test("R-4212: main CI waits require posting", { timeout: 15000 }, () => {
 const root = fixture();
 const command = "node packages/nana-pack/bin/nana-main-ci.mjs --wait";
 const result = invoke(root, bash(command));
 assert.equal(result.status, 0, result.stderr);
 const output = JSON.parse(result.stdout).hookSpecificOutput;
 assert.equal(output.permissionDecision, "deny");
 assert.equal(output.permissionDecisionReason, "Add --post, so a main that stays red after its one rerun posts its own issue.");
 for (const allowed of [`${command} --post`, "node packages/nana-pack/bin/nana-main-ci.mjs", `echo '${command}'`, `${command} --post > ci.log`]) {
  const result = invoke(root, bash(allowed));
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
 }
 abstains(root, bash(command));
});

// req: R-4213
await test("R-4213: launch output cannot pipe into tail or head", { timeout: 45000 }, () => {
 const root = fixture();
 for (const command of ["pi-worker --brief b", "pi-review --item x", "node claude-review.mjs --item x", "node nana-ci-wait.mjs --tip x", "node nana-main-ci.mjs --wait --post"]) {
  for (const reader of ["tail", "head"]) {
   const result = invoke(root, bash(`${command} | ${reader} -n 5`));
   assert.equal(result.status, 0, result.stderr);
   const output = JSON.parse(result.stdout).hookSpecificOutput;
   assert.equal(output.permissionDecision, "deny");
   assert.equal(output.permissionDecisionReason, "Write the output to a file instead; a pipe hides the tool's exit code.");
  }
  for (const allowed of [`${command} > ci.log 2>&1`, `${command}; tail ci.log`, `echo '${command} | tail'`]) {
   const result = invoke(root, bash(allowed));
   assert.equal(result.status, 0, result.stderr);
   assert.equal(result.stdout, "");
  }
  abstains(root, bash(`${command} | tail`));
 }
 // The existing detached-launch refusal stays first.
 const detached = invoke(root, { ...bash("pi-worker --brief b | tail"), tool_input: { command: "pi-worker --brief b | tail" } });
 assert.match(JSON.parse(detached.stdout).hookSpecificOutput.permissionDecisionReason, /own background call/);
});
