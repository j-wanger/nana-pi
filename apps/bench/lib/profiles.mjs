import { existsSync } from "node:fs";
import path from "node:path";

// A PROFILE is one pi tool/prompt configuration under test. It renders to an exact argv
// plus the env that isolates the run. Every flag below is verified against pi 0.84.4
// docs/usage.md (line numbers cited) — never from memory.

const BUILTIN_TOOLS = ["read", "bash", "powershell", "edit", "write", "grep", "find", "ls"]; // usage.md:217
const THINKING = ["off", "minimal", "low", "medium", "high", "xhigh", "max"]; // usage.md:192

// Applied to EVERY run so the measurement sees only what the profile declares.
// usage.md:205 (--no-session), 226/228/230 (--no-skills/--no-prompt-templates/--no-extensions),
// usage.md:231 (--no-context-files), usage.md:249 (-na / --no-approve: ignore project-local files).
export const ISOLATION_FLAGS = ["--no-session", "--no-skills", "--no-context-files", "--no-prompt-templates", "--no-extensions", "--no-approve"];

export function validateProfile(p) {
	const bad = (m) => {
		throw new Error(`profile ${p?.name ?? "(unnamed)"}: ${m}`);
	};
	if (!p || typeof p !== "object") bad("not an object");
	if (typeof p.name !== "string" || !p.name) bad("name must be a non-empty string");
	if (!Array.isArray(p.tools) || p.tools.length === 0) bad("tools must be a non-empty array");
	for (const t of p.tools) if (typeof t !== "string" || !t) bad(`bad tool entry ${JSON.stringify(t)}`);
	if (new Set(p.tools).size !== p.tools.length) bad("duplicate tool names");
	for (const k of ["extensions", "extraArgs", "requiresEnv", "families"]) {
		if (p[k] !== undefined && !Array.isArray(p[k])) bad(`${k} must be an array`);
	}
	if (p.appendSystemPrompt !== undefined && typeof p.appendSystemPrompt !== "string") bad("appendSystemPrompt must be a string");
	if (p.thinking !== undefined && !THINKING.includes(p.thinking)) bad(`thinking must be one of ${THINKING.join(", ")}`);
	if (p.model !== undefined && (typeof p.model !== "object" || !p.model)) bad("model must be an object");
	// A strict allowlist over ALL tools (usage.md:212) — an extension whose tools are not
	// named here contributes nothing, which is a silent-degradation trap. Catch it here.
	for (const ext of p.extensions ?? []) {
		if (typeof ext !== "object" || typeof ext.path !== "string") bad("each extension needs {path, tools[]}");
		if (!Array.isArray(ext.tools) || ext.tools.length === 0) bad(`extension ${ext.path}: tools[] must list its tool names`);
		for (const t of ext.tools) if (!p.tools.includes(t)) bad(`extension tool "${t}" is missing from the --tools allowlist`);
	}
	for (const t of p.tools) {
		const fromExt = (p.extensions ?? []).some((e) => e.tools.includes(t));
		if (!fromExt && !BUILTIN_TOOLS.includes(t)) bad(`"${t}" is neither a built-in nor declared by an extension`);
	}
	return p;
}

/** Placeholder entries let a study ship before a parallel source review names the real path. */
export const isPlaceholder = (s) => typeof s === "string" && /^<.*>$/.test(s.trim());

/**
 * Render the exact argv + env for one run.
 * ctx: { prompt, sessionDir, studyDir, agentDir?, extraEnv? }
 * Returns { argv, env, blocked } — `blocked` is a non-null reason when the run MUST be
 * recorded as an error instead of executed (missing extension path or missing API key).
 */
export function renderRun(profile, study, ctx) {
	validateProfile(profile);
	const model = { ...(study.model ?? {}), ...(profile.model ?? {}) };
	if (!model.provider || !model.id) throw new Error("study.model needs {provider, id}");
	const thinking = profile.thinking ?? model.thinking ?? study.model?.thinking;

	// Extension paths resolve against the STUDY dir (the child runs in a throwaway fixture cwd,
	// so a relative path passed raw to -e would resolve against the wrong root).
	const extPath = (ext) => (path.isAbsolute(ext.path) ? ext.path : path.resolve(ctx.studyDir ?? process.cwd(), ext.path));
	let blocked = null;
	for (const ext of profile.extensions ?? []) {
		if (isPlaceholder(ext.path)) blocked = blocked ?? `needs-entry: ${profile.name} extension path is still the placeholder ${ext.path}`;
		else if (!existsSync(extPath(ext))) blocked = blocked ?? `needs-entry: ${profile.name} extension path does not exist: ${extPath(ext)}`;
	}
	// Only declare needs-key when the profile says a key is required. pi-web-access 0.28.0
	// needs none (search routes through the Codex subscription), so C leaves requiresEnv empty
	// and a key problem can only surface as an error TEXT — classified in run.mjs, never guessed.
	for (const key of profile.requiresEnv ?? []) {
		if (!process.env[key]) blocked = blocked ?? `needs-key: ${key} is not set`;
	}

	// The bench sidecar (ext/bench-nested-usage.ts) rides along on any profile that loads an
	// extension: it registers NO tools and contributes NO prompt text, so it cannot shift the
	// comparison, but it makes that extension's nested LLM spend appear as tool-result `usage`
	// (docs/extensions.md:851, 2013). Without it, profile C's internal search calls are free.
	const sidecar = (profile.extensions ?? []).length && study.sidecarExtension ? [{ path: path.resolve(ctx.studyDir ?? process.cwd(), study.sidecarExtension), tools: [] }] : [];
	for (const s2 of sidecar) if (!existsSync(s2.path)) blocked = blocked ?? `needs-entry: bench sidecar missing at ${s2.path}`;

	const argv = ["--mode", "json"]; // usage.md:175
	argv.push("--provider", model.provider, "--model", model.id); // usage.md:189-190
	if (thinking) argv.push("--thinking", thinking); // usage.md:192
	argv.push("--tools", profile.tools.join(",")); // usage.md:212 — strict allowlist over ALL tools
	argv.push(...ISOLATION_FLAGS);
	for (const ext of profile.extensions ?? []) argv.push("-e", extPath(ext)); // usage.md:223; --no-extensions first, per usage.md:233-236
	for (const s2 of sidecar) argv.push("-e", s2.path);
	if (profile.appendSystemPrompt) argv.push("--append-system-prompt", profile.appendSystemPrompt); // usage.md:244
	argv.push(...(profile.extraArgs ?? []));
	argv.push("--", ctx.prompt); // usage.md:250 — stop option parsing, prompt is positional

	const env = {
		...process.env,
		// environment-variables.md:82 — redirect session storage away from ~/.pi/agent/sessions.
		// Belt and braces with --no-session; settings.md:256 gives the precedence order.
		PI_CODING_AGENT_SESSION_DIR: ctx.sessionDir,
		PI_SKIP_VERSION_CHECK: "1", // environment-variables.md:85
		PI_TELEMETRY: "0", // environment-variables.md:86
		...(study.env ?? {}),
		...(ctx.extraEnv ?? {}),
	};
	// environment-variables.md:81 — full config-dir isolation. The dir is PREPARED by
	// lib/agentdir.mjs (pinned settings + copied credentials) because a bare fresh dir has no
	// auth.json (providers.md:111). Without this, the operator's own settings.json still decides
	// retry (settings.md:143) and compaction (settings.md:118) for every run.
	if (ctx.agentDir) env.PI_CODING_AGENT_DIR = ctx.agentDir;

	return { argv, env, blocked };
}
