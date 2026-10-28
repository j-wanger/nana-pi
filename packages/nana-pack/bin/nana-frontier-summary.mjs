#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/nana-frontier-summary.mjs
 * @purpose Print the bounded HANDOFF frontier block for a Claude Code session-start hook.
 * @inputs argv (`--cwd <dir>`, `--max <characters>`, `--limit-ms <ms>`), environment role and HANDOFF state.
 * @outputs `[nana:frontier]` plus the frontier block, nothing when inapplicable, or one fail-open line.
 * @effects disk (HANDOFF.md), process and network (bounded gh for opted-in projects).
 * @errors none; every failure is rendered as one line and the process always exits 0.
 */
const TAG_FALLBACK = "[nana:frontier]";
const UNAVAILABLE_FALLBACK = "FRONTIER UNAVAILABLE:";
const oneLine = (error) => String(error?.code ?? error?.message ?? "failed").replace(/[^\w .:-]/g, "").slice(0, 60);

try {
	const { frontierSummary } = await import("../lib/frontier-summary.mjs");
	const { FRONTIER_TAG, FRONTIER_UNAVAILABLE } = await import("../lib/frontier-summary-config.mjs");
	const args = process.argv.slice(2);
	const value = (name) => {
		const at = args.indexOf(name);
		if (at >= 0 && args[at + 1] !== undefined) return args[at + 1];
		const prefix = `${name}=`;
		return args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length);
	};
	const cwd = value("--cwd") ?? process.cwd();
	const maxArg = value("--max");
	const max = maxArg === undefined ? undefined : Number(maxArg);
	if (maxArg !== undefined && !Number.isFinite(max)) throw new Error("invalid --max");
	const limitArg = value("--limit-ms");
	const limitMs = limitArg === undefined ? undefined : Number(limitArg);
	if (limitArg !== undefined && (!Number.isFinite(limitMs) || limitMs < 0)) throw new Error("invalid --limit-ms");
	const block = frontierSummary({ cwd, env: process.env, max, limitMs });
	if (block !== null) process.stdout.write(`${FRONTIER_TAG}\n${block}`);
} catch (error) {
	let tag = TAG_FALLBACK;
	let unavailable = UNAVAILABLE_FALLBACK;
	try {
		const config = await import("../lib/frontier-summary-config.mjs");
		tag = config.FRONTIER_TAG;
		unavailable = config.FRONTIER_UNAVAILABLE;
	} catch {}
	process.stdout.write(`${tag}\n${unavailable} producer failed (${oneLine(error)}).\n`);
}
process.exitCode = 0;
