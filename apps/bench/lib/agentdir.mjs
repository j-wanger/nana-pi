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
// CREDENTIAL HANDLING — the bench SHARES the operator's login; it does not copy it.
//   `auth.json` in the bench dir is a SYMLINK to the operator's `~/.pi/agent/auth.json`.
//
//   Why not a copy (astra, 2026-09-09): OAuth refresh rotates the refresh token server-side. Two
//   diverging copies of `auth.json` are therefore not isolated at all — a benchmark refresh can
//   invalidate the token still sitting in the operator's untouched file, and re-copying the stale
//   source afterwards compounds it. Separate files and separate locks do not separate a
//   server-side credential. One shared file means pi refreshes ONE credential, with its own
//   locking, exactly as it would in ordinary use.
//
//   The consequences, stated rather than hidden: bench runs consume the operator's subscription
//   and can rotate the operator's token. Settings isolation is unaffected — only the credential
//   is shared. If you need a benchmark that cannot touch the operator's login, point `sourceDir`
//   at a dir holding an independently authorised credential.
//
//   Other rules: the dir is 0700; contents are never logged, never hashed into a fingerprint,
//   never written to a record; the dir lives outside the repo and is never committed.

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

/** Copied (not linked): catalogs, which pi may rewrite and which carry no credential. */
const SEED_FILES = [
	{ name: "models.json", mode: 0o600 },
	{ name: "models-store.json", mode: 0o600 },
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
	// ONE credential, shared by symlink. A copy would diverge; see the header.
	const link = path.join(dir, "auth.json");
	let credentialMode = "symlink";
	try {
		await fs.symlink(authSrc, link);
	} catch (e) {
		// win32 without the privilege, or a filesystem with no symlinks. Fall back to a copy and
		// SAY SO — the caller must be able to report which mode a study ran in.
		await fs.copyFile(authSrc, link);
		await fs.chmod(link, 0o600);
		credentialMode = `copy (symlink unavailable: ${e.code ?? e.message})`;
	}
	return { dir, seeded, credentialMode, settingsPath: path.join(dir, "settings.json") };
}

/**
 * Before each run: confirm the shared credential is still reachable. With a symlink there is
 * nothing to refresh — pi reads and rotates the operator's single file — but a source that has
 * been deleted or a link that no longer resolves must stop the study loudly rather than produce
 * a run of authentication errors that look like model failures.
 */
export async function verifyAuth({ dir = defaultBenchDir(), sourceDir = defaultSourceDir() } = {}) {
	const src = path.join(sourceDir, "auth.json");
	if (!(await exists(src))) throw new Error(`bench agent dir: ${src} disappeared mid-study — refusing to run without credentials`);
	const link = path.join(dir, "auth.json");
	if (!(await exists(link))) throw new Error(`bench agent dir: ${link} is missing or dangling — refusing to run without credentials`);
	const st = await fs.lstat(link);
	if (st.isSymbolicLink()) {
		const target = path.resolve(dir, await fs.readlink(link));
		if (target !== path.resolve(src)) throw new Error(`bench agent dir: ${link} points at ${target}, not ${src}`);
		return { mode: "symlink", target };
	}
	// Copy fallback (win32): keep it current, and accept the divergence risk documented above.
	await fs.copyFile(src, link);
	await fs.chmod(link, 0o600);
	return { mode: "copy", target: path.resolve(src) };
}

/** Effective settings, for the study fingerprint. Never includes credentials. */
export const settingsFingerprintInput = (settings = PINNED_SETTINGS) => JSON.stringify(settings);
