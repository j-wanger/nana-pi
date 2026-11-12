/**
 * @module packages/nana-setup/tests/rm-guard.test.mjs
 * @purpose Pin recorded agent deletion input, seat identity and unresolved-target safety through the real hook.
 * @inputs Recorded-shape PreToolUse stdin and OS-temporary lane folders.
 * @outputs PASS lines or assertion failures.
 * @effects disk (temporary fixtures), process (bounded hook children)
 * @errors Assertion failures fail the test.
 */
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { tmpDir } from "./tmp-dir.mjs";
import { test } from "./waking-fixture.mjs";

const hook = fileURLToPath(new URL("../claude/hooks/nana-rm-guard.mjs", import.meta.url));
const root = tmpDir(join(tmpdir(), "nana-rm-guard-"));
const cwd = join(root, "lane");
mkdirSync(cwd);
writeFileSync(join(root, "outside"), "pre-existing\n");
const payload = command => ({ session_id: "recorded-workflow", transcript_path: join(root, "transcript.jsonl"),
 cwd, permission_mode: "bypassPermissions", hook_event_name: "PreToolUse", agent_id: "builder-1",
 tool_name: "Bash", tool_input: { command }, tool_use_id: "toolu_recorded" });
const invoke = input => spawnSync(process.execPath, [hook], { cwd, input, encoding: "utf8", timeout: 5000 });
function run(value) {
 const result = invoke(JSON.stringify(value));
 assert.equal(result.status, 0, result.stderr);
 assert.equal(result.stderr, "");
 return result.stdout;
}
function denied(command) {
 const output = JSON.parse(run(payload(command))).hookSpecificOutput;
 assert.equal(output.hookEventName, "PreToolUse");
 assert.equal(output.permissionDecision, "deny");
 assert.match(output.permissionDecisionReason, /do not delete/i);
 assert.match(output.permissionDecisionReason, /report.*path.*why.*seat/i);
 assert.match(output.permissionDecisionReason, /seat.*decides/i);
 return output.permissionDecisionReason;
}

// req: R-4260 R-4262
await test("recorded agent outside deletion denies while seat and inside deletions stay silent", { timeout: 45000 }, () => {
 assert.match(denied("rm -rf /tmp/x"), /x/);
 for (const ending of ["\r\n", " \r\n", "\t\r\n", ""]) {
  const result = invoke(JSON.stringify(payload("rm -rf /tmp/x")) + ending);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).hookSpecificOutput.permissionDecision, "deny");
 }
 const seat = payload("rm -rf /tmp/x");
 delete seat.agent_id;
 assert.equal(run(seat), "");
 for (const command of ["rm -rf build", "rm -rf ./build", `rm -rf '${join(cwd, "build")}'`]) {
  assert.equal(run(payload(command)), "", command);
 }
 for (const command of ["git status", "git log clean", "echo rm", "printf 'rm -rf /tmp/x'", "ls ./build"]) {
  assert.equal(run(payload(command)), "", command);
 }
 assert.equal(run({ ...payload("rm -rf /tmp/x"), tool_name: "Read" }), "");
 for (const input of ["{", "null", JSON.stringify({ ...payload("rm x"), cwd: 7 }), JSON.stringify({ ...payload("rm x"), cwd: "relative" })]) {
  const result = invoke(input);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr.trim().split(/\r?\n/).length, 1);
  assert.match(result.stderr, /^nana-rm-guard:/);
 }
});

// req: R-4261
await test("unresolved deletion targets deny for seat review", { timeout: 45000 }, () => {
 for (const command of ['rm -rf "$TARGET"', 'rm -rf build/*', 'rm -rf "$(printf /tmp/x)"',
  'find /tmp/x -delete', 'find -H /tmp/x -delete', 'find -files0-from list -delete',
  'find ./build -follow -delete', 'printf /tmp/x | xargs rm', 'bash -c "rm -rf /tmp/x"',
  `rmdir '${join(root, "outside")}'`, `unlink '${join(root, "outside")}'`,
  `git -C '${root}' clean -fd`, 'cd "$TARGET"; rm x', 'xargs -a list rm',
  'bash -o pipefail -c "rm /tmp/x"', 'cd build/..; rm x']) denied(command);
 for (const command of ["rmdir build", "unlink ./build", "find build -delete", "git clean -fd -- build"]) {
  assert.equal(run(payload(command)), "", command);
 }
});
