/**
 * @module apps/bench/lib/anatomy-runners.mjs
 * @purpose Adapt an isolated Claude subprocess to anatomy's injected model interface.
 * @inputs System prompt, stdin prompt, reply schema and optional injected spawn and Claude options.
 * @outputs Safe ok/text/usage results without printing subprocess data.
 * @effects process (bounded piped children in OS temp); network (Claude through its CLI)
 * @errors Spawn and parse failures return ok false, never raw errors.
 */
import { spawnSync } from "node:child_process";
import os from "node:os";
import { claudeCommand } from "../../../packages/nana-pack/lib/claude-launch.mjs";
import { CLAUDE_MODEL, CLAUDE_EFFORT, DOLLAR_CAP, MAX_BUFFER, TIMEOUT_MS } from "./anatomy-runner-config.mjs";

const options = (prompt, { maxBuffer = MAX_BUFFER, timeoutMs = TIMEOUT_MS } = {}) => ({ input: prompt, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], maxBuffer, timeout: timeoutMs, cwd: os.tmpdir(), windowsHide: true, env: { ...process.env, NANA_ROLE: "worker", NANA_HANDOFF: "off", CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" } });
const failed = (usage = null) => ({ ok: false, text: "", usage });

/** Run an isolated judge and validate its structured reply and model. */
export async function claudeRunner(input, { spawn, spawnSync: runSpawnSync = spawnSync, resolveLaunch = claudeCommand, platform = process.platform, model = CLAUDE_MODEL, effort = CLAUDE_EFFORT, budgetUsd = DOLLAR_CAP, timeoutMs = TIMEOUT_MS, maxBuffer = MAX_BUFFER } = {}) {
 let usage = null;
 try {
  const argv = ["-p", "--model", model, "--output-format", "json", "--json-schema", JSON.stringify(input.schema), "--tools", "", "--strict-mcp-config", "--no-session-persistence", "--setting-sources", "", "--system-prompt", input.system, "--max-budget-usd", String(budgetUsd), "--effort", effort];
  const opts = options(input.prompt, { timeoutMs, maxBuffer });
  let child;
  if (spawn) child = spawn("claude", argv, opts);
  else if (platform !== "win32") child = runSpawnSync("claude", argv, opts);
  else {
   const launch = resolveLaunch(argv, { platform, env: opts.env, cwd: opts.cwd });
   child = launch.refused
    ? { error: Object.assign(new Error(launch.refused), { code: "CLAUDE_LAUNCH_REFUSED" }), status: null, stdout: "", stderr: "" }
    : runSpawnSync(launch.command, launch.args, opts);
  }
  // Claude reports token buckets per model, unlike pi's authoritative totalTokens field.
  try {
   const parsed = JSON.parse(child.stdout);
   const buckets = Object.values(parsed.modelUsage ?? {});
   const fields = ["inputTokens", "outputTokens", "cacheReadInputTokens", "cacheCreationInputTokens"];
   if (buckets.length && buckets.every((b) => fields.every((key) => b[key] === undefined || (Number.isFinite(b[key]) && b[key] >= 0)) && fields.some((key) => b[key] !== undefined))) {
    usage = { tokens: buckets.reduce((sum, b) => sum + fields.reduce((n, key) => n + (b[key] ?? 0), 0), 0), cost: Number.isFinite(parsed.total_cost_usd) ? parsed.total_cost_usd : null };
   }
  } catch { /* Incomplete capture has unknown spend; never expose parse errors. */ }
  if (child.error || child.status !== 0) return failed(usage);
  const reply = JSON.parse(child.stdout);
  if (reply.is_error || !reply.structured_output || !Object.keys(reply.modelUsage || {}).some((m) => m.startsWith(model))) return failed(usage);
  return { ok: true, text: JSON.stringify(reply.structured_output), usage };
 } catch { return failed(usage); }
}

export function createRunner({ runner = "claude", spawn, ...overrides } = {}) {
 if (runner !== "claude") throw new Error("invalid anatomy runner");
 return (input) => claudeRunner(input, { ...overrides, ...(spawn === undefined ? {} : { spawn }) });
}
