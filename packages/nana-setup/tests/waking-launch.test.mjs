/**
 * @module packages/nana-setup/tests/waking-launch.test.mjs
 * @purpose Pin the detached lane-tool launch failure through the real hook entry.
 * @inputs Temporary repository and Bash PreToolUse stdin.
 * @outputs PASS line or assertion failure.
 * @effects disk (temporary repo), process (hook and git)
 * @errors Assertion failures fail the test.
 */
import assert from "node:assert/strict";
import { fixture, invoke, test } from "./waking-fixture.mjs";

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
