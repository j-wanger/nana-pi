// A PREPARED pi config directory, outside the repo, used for every bench run.
//
// Why: `--no-*` flags stop discovery of context files, skills, prompt templates and
// extensions, but they do NOT neutralise `~/.pi/agent/settings.json` — and pi's defaults there
// include agent-level auto-retry (settings.md:143-144, `retry.enabled: true`, `maxRetries: 3`)
// and auto-compaction (settings.md:118). Both silently change what a run costs, so a study that
// reads the operator's settings is measuring this machine, not the profile.
//
// PI_CODING_AGENT_DIR (environment-variables.md:81) relocates the whole config dir. The cost is
// that a fresh dir has no credentials (providers.md:111, `auth.json`), so we copy them in.
//
// CREDENTIAL HANDLING — the rules this file keeps:
//   * the dir is created 0700 and auth.json 0600;
//   * auth.json is copied FRESH from ~/.pi/agent at the start of EVERY run, so upstream OAuth
//     refreshes propagate immediately;
//   * nothing is ever copied BACK: a token pi refreshes inside the bench dir is discarded;
//   * contents are never logged, never hashed into a fingerprint, never written to a record;
//   * the dir lives outside the repo and is never committed.

import { constants as C } from "node:fs";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export const defaultSourceDir = () => path.join(os.homedir(), ".pi", "agent");
export const defaultBenchDir = () => path.join(os.homedir(), ".pi", "bench-agent");

// Pinned settings. Every key verified in the installed docs/settings.md — see citations.
export const PINNED_SETTINGS = {
	retry: {
		enabled: false, // settings.md:143 — default true; agent-level auto-retry hides transient cost
		maxRetries: 0, // settings.md:144 — default 3
		provider: { maxRetries: 0 }, // settings.md:147 — already 0 by default; pinned so it stays 0
	},
	compaction: { enabled: false }, // settings.md:118 — default true; compaction spends extra tokens
	// No `defaultTools` key at all (settings.md:226-228): --tools is the strict allowlist and
	// must be the only thing deciding the tool set.
	defaultProjectTrust: "never", // usage.md:126-128 — non-interactive fallback; never trust a fixture
};

/** Files copied from the operator's agent dir. `auth.json` is refreshed every run. */
const SEED_FILES = [
	{ name: "auth.json", required: true, mode: 0o600, everyRun: true },
	{ name: "models.json", required: false, mode: 0o600, everyRun: false },
	{ name: "models-store.json", required: false, mode: 0o600, everyRun: false },
];

const exists = (p) =>
	fs
		.access(p, C.F_OK)
		.then(() => true)
		.catch(() => false);

/**
 * Create (or re-create) the bench agent dir. Called once per study start.
 * Throws LOUDLY if the source auth.json is missing — a bench dir without credentials would
 * fail every run one API error at a time instead of failing before any spend.
 */
export async function prepareAgentDir({ dir = defaultBenchDir(), sourceDir = defaultSourceDir(), settings = PINNED_SETTINGS } = {}) {
	const authSrc = path.join(sourceDir, "auth.json");
	if (!(await exists(authSrc))) {
		throw new Error(
			`bench agent dir: no credentials at ${authSrc}. The study cannot run isolated without them.\n` +
				`Log in with pi first, or point study.agentDir.sourceDir at a dir that has auth.json.`,
		);
	}
	await fs.rm(dir, { recursive: true, force: true });
	await fs.mkdir(dir, { recursive: true, mode: 0o700 });
	await fs.chmod(dir, 0o700);
	await fs.writeFile(path.join(dir, "settings.json"), `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
	const seeded = [];
	for (const f of SEED_FILES) {
		const src = path.join(sourceDir, f.name);
		if (!(await exists(src))) continue;
		await fs.copyFile(src, path.join(dir, f.name));
		await fs.chmod(path.join(dir, f.name), f.mode);
		seeded.push(f.name);
	}
	return { dir, seeded, settingsPath: path.join(dir, "settings.json") };
}

/**
 * Re-copy the credential file before a single run so an upstream OAuth refresh propagates.
 * LIMITATION, stated in DESIGN.md: a token that pi refreshes INSIDE the bench dir is discarded,
 * because copying it back would write to the operator's credentials from a benchmark.
 */
export async function refreshAuth({ dir = defaultBenchDir(), sourceDir = defaultSourceDir() } = {}) {
	const src = path.join(sourceDir, "auth.json");
	if (!(await exists(src))) throw new Error(`bench agent dir: ${src} disappeared mid-study — refusing to run without credentials`);
	await fs.copyFile(src, path.join(dir, "auth.json"));
	await fs.chmod(path.join(dir, "auth.json"), 0o600);
}

/** Effective settings, for the study fingerprint. Never includes credentials. */
export const settingsFingerprintInput = (settings = PINNED_SETTINGS) => JSON.stringify(settings);
