/**
 * @module apps/bench/lib/catch-judge.mjs
 * @purpose Invoke the isolated structured-output judge shared by memory shaping and anatomy.
 * @inputs Model, system prompt, prompt, schema, optional budget and injected spawn; CATCH_JUDGE_BIN.
 * @outputs callJudge returns structured out and cost.
 * @effects process (bounded judge CLI in OS temp), network (the judge call)
 * @errors Throws Error on unavailable judge, failed exit, bad JSON, missing output or wrong model.
 */
import { spawnSync } from "node:child_process";
import os from "node:os";

/** One judge call. Throws on ANY failure: no mock, no fallback. */
export function callJudge({ model, system, prompt, schema, budgetUsd = 2, spawn = spawnSync }) {
	const bin = process.env.CATCH_JUDGE_BIN || "claude";
	const args = ["-p", "--model", model, "--output-format", "json", "--json-schema", JSON.stringify(schema), "--tools", "", "--strict-mcp-config", "--no-session-persistence", "--setting-sources", "", "--system-prompt", system, "--max-budget-usd", String(budgetUsd)];
	const r = spawn(bin, args, { input: prompt, encoding: "utf8", maxBuffer: 64 << 20, timeout: 15 * 60 * 1000, cwd: os.tmpdir() });
	if (r.error) throw new Error(`judge unavailable: ${r.error.code || r.error.message}`);
	if (r.status !== 0) throw new Error(`judge exited ${r.status}: ${(r.stderr || r.stdout || "").slice(0, 300)}`);
	let j;
	try {
		j = JSON.parse(r.stdout);
	} catch {
		throw new Error(`judge returned non-JSON: ${r.stdout.slice(0, 200)}`);
	}
	if (j.is_error || !j.structured_output) throw new Error(`judge error/no structured output: ${String(j.result).slice(0, 200)}`);
	const used = Object.keys(j.modelUsage || {});
	if (!used.some((m) => m.startsWith(model))) throw new Error(`judge used ${used.join(",")}, expected ${model}`);
	return { out: j.structured_output, cost: j.total_cost_usd ?? null };
}
