/**
 * @module packages/nana-setup/claude/hooks/nana-rm-guard.mjs
 * @purpose Deny outside-folder or unresolved Bash deletions only for Claude Code agents launched by the seat.
 * @inputs PreToolUse stdin with agent_id, tool_name, tool_input.command and cwd; OS home and shell path environment.
 * @outputs A PreToolUse deny decision or nothing; one stderr line on failure.
 * @effects disk (reads stdin and canonicalizes target paths)
 * @errors Every failure exits 0 with no decision and one stderr line.
 */
let reported = false;
function failure() {
 if (reported) return;
 reported = true;
 // Fixed text: never echo malformed payloads or filesystem errors into the transcript.
 try { process.stderr.write("nana-rm-guard: unavailable; no decision\n"); } catch {}
}
process.stdout.on("error", failure);
process.stderr.on("error", () => {});
try {
 const { readFileSync } = await import("node:fs");
 const payload = JSON.parse(readFileSync(0, "utf8"));
 if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("invalid payload");
 if (Object.hasOwn(payload, "agent_id") && payload.tool_name === "Bash") {
  if (typeof payload.cwd !== "string" || !payload.cwd || typeof payload.tool_input?.command !== "string") throw new Error("invalid input");
  // Node's built-in TS loader otherwise adds a multi-line package-type warning.
  const warningListeners = process.listeners("warning");
  process.removeAllListeners("warning");
  process.on("warning", warning => {
   if (warning?.code !== "MODULE_TYPELESS_PACKAGE_JSON") for (const listener of warningListeners) listener(warning);
  });
  const [{ rmOutsideTargets }, { splitCommand, detectionSegments }, { homedir }, { isAbsolute }] = await Promise.all([
   import("../../../nana-pack/lib/gate-rm-outside.ts"),
   import("../../../nana-pack/lib/gate-shell.ts"),
   import("node:os"), import("node:path"),
  ]);
  if (!isAbsolute(payload.cwd)) throw new Error("invalid cwd");
  const command = payload.tool_input.command;
  const { segments, segmentable } = splitCommand(command);
  const candidates = segmentable ? segments : [...segments, ...detectionSegments(command)];
  const hits = rmOutsideTargets(candidates, payload.cwd, "bash", {
   home: homedir(), tempRoots: [], segmentable, platform: process.platform, env: process.env, strict: true,
  });
  if (hits.size) {
   const target = hits.values().next().value;
   process.stdout.write(`${JSON.stringify({ hookSpecificOutput: {
    hookEventName: "PreToolUse", permissionDecision: "deny",
    permissionDecisionReason: `Deletion outside the working folder or unresolved target: ${target}. Do not delete it; leave it in place. Report the path and why deletion is needed to the seat. The seat decides and can run the delete itself.`,
   } })}\n`);
  }
 }
} catch { failure(); }
