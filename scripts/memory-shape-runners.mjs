/**
 * @module scripts/memory-shape-runners.mjs
 * @purpose Adapt isolated Claude and pi subprocesses to the memory shaper's injected runner interface.
 * @inputs System prompt, stdin prompt, reply schema and optional injected spawn and runner choice.
 * @outputs Safe ok/text/usage results without printing subprocess data.
 * @effects process (bounded piped children in OS temp); network (the chosen model through its CLI)
 * @errors Spawn, parse and incomplete-stream failures return ok false, never raw errors.
 */
import { spawnSync } from "node:child_process";
import os from "node:os";
import { callJudge } from "../apps/bench/lib/catch-judge.mjs";
import { parseStream } from "../apps/bench/lib/usage.mjs";
import { piLaunch } from "../packages/nana-pack/bin/pi-watchdog.mjs";
import { claudeCommand } from "../packages/nana-pack/lib/claude-launch.mjs";
import { CLAUDE_MODEL, CLAUDE_EFFORT, DOLLAR_CAP, MAX_BUFFER, PI_MODEL, PI_THINKING, RUNNER, TIMEOUT_MS } from "../packages/nana-pack/lib/memory-shaping-config.mjs";

const options = (prompt, { maxBuffer = MAX_BUFFER, timeoutMs = TIMEOUT_MS } = {}) => ({ input: prompt, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], maxBuffer, timeout: timeoutMs, cwd: os.tmpdir(), windowsHide: true, env: { ...process.env, NANA_ROLE: "worker", NANA_HANDOFF: "off", CLAUDE_CODE_DISABLE_AUTO_MEMORY: "1" } });
const failed = (usage = null) => ({ ok: false, text: "", usage });

/** Reuse catch-judge's structured reply and model validation, strengthening its spawn boundary. */
export async function claudeRunner(input, { spawn, spawnSync: runSpawnSync = spawnSync, resolveLaunch = claudeCommand, platform = process.platform, model = CLAUDE_MODEL, effort = CLAUDE_EFFORT, budgetUsd = DOLLAR_CAP, timeoutMs = TIMEOUT_MS, maxBuffer = MAX_BUFFER } = {}) {
 let usage = null;
 try {
  const result = callJudge({ ...input, model, budgetUsd, spawn: (_bin, args) => {
   const argv = [...args, "--effort", effort];
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
   return child;
  } });
  return { ok: true, text: JSON.stringify(result.out), usage };
 } catch { return failed(usage); }
}

/** Full stream completeness, not process exit or agent_settled alone, decides success. */
export async function piRunner(input, { spawn = spawnSync } = {}) {
 try {
  const opts = options(input.prompt);
  const launch = piLaunch(["--mode", "json", "--no-session", "--no-tools", "--no-extensions", "--no-skills", "--no-prompt-templates", "--no-context-files", "--system-prompt", input.system, "--model", PI_MODEL, "--thinking", PI_THINKING], { cwd: opts.cwd, env: opts.env });
  if (launch.refused) return failed();
  const child = spawn(launch.command, launch.args, opts);
  const parsed = parseStream(child.stdout);
  if (!parsed.complete) return failed();
  const usage = parsed.usageMessages > 0 ? { tokens: parsed.tokens.totalTokens, cost: parsed.tokens.cost.total } : null;
  if (child.error || child.status !== 0) return failed(usage);
  return { ok: true, text: parsed.finalText, usage };
 } catch { return failed(); }
}

export function createRunner({ runner = RUNNER, spawn, ...overrides } = {}) {
 if (!["claude", "pi"].includes(runner)) throw new Error("invalid memory runner");
 if (runner === "pi" && ["model", "effort", "budgetUsd", "timeoutMs", "maxBuffer"].some(key => key in overrides)) throw new Error("Claude options require Claude runner");
 return (input) => runner === "claude"
  ? claudeRunner(input, { ...overrides, ...(spawn === undefined ? {} : { spawn }) })
  : piRunner(input, { spawn, ...overrides });
}
