/**
 * How the desk finds pi — the binary it SPAWNS and the package it IMPORTS — and the
 * rule that those two are the same install.
 *
 * The desk already requires pi at runtime (every live session is a `pi --mode rpc`
 * child), so importing the same installation for session parsing adds no new
 * dependency, only a version coupling. What we take (all from the package ROOT
 * export, `@earendil-works/pi-coding-agent` → `dist/index.js`; never a deep
 * `dist/...` path, which is not a supported entry point):
 *
 *   · `parseSessionEntries(text)`      — JSONL → entries, malformed lines skipped
 *   · `migrateSessionEntries(entries)` — v1→v2→v3 IN MEMORY (never touches the file)
 *   · `CURRENT_SESSION_VERSION`        — what the parser we imported understands
 *
 * Deliberately NOT taken: `SessionManager`. `SessionManager.open()` REWRITES the
 * file when a migration applies (0.84.4 `session-manager.js` `_setSessionFile` →
 * `_rewriteFile`). A read endpoint must never write the user's session file, so the
 * desk migrates the parsed array in memory and leaves the bytes alone.
 *
 * ── Why resolution is fussy ──────────────────────────────────────────────────────
 * Importing a DIFFERENT pi than the one we spawn is a silent-wrong-answer machine:
 * the desk would render sessions with one version's parser while a child writes them
 * with another's. `which pi` does not settle it. Under Volta the executable is a
 * manager shim, not a symlink into the package; nvm/fnm/bun/custom prefixes each put
 * the package somewhere else; and a stale copy under `~/.local` or Homebrew is
 * exactly the kind of thing a "search the usual places" fallback finds first.
 *
 * So the package must be TIED to the executable, in this order:
 *   1. `DESK_PI_ROOT` — the operator said so. Exclusive; nothing else is consulted,
 *      and nothing is spawned (an override must not shell out to the binary the desk
 *      manages on every start). It does NOT suspend the invariant: if the binary we
 *      would spawn lives inside a DIFFERENT package, the desk refuses. Naming the
 *      binary too (`DESK_PI_BIN`) is the one configuration where they may differ —
 *      then both halves are the operator's explicit choice.
 *   2. Walk up from `realpath(PI_BIN)`. A package containing the executable IS the
 *      install, by construction. This is the normal npm/pnpm case and costs nothing.
 *   3. Otherwise (a shim): ask `PI_BIN --version`, enumerate the layouts we can
 *      detect, and accept ONE candidate whose package.json version equals it.
 *      Zero matches, or two that we cannot tell apart → REFUSE and name them all.
 * Every outcome is logged with the path that won, so "which parser is this desk
 * running" is answerable from the startup line.
 */
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

export const PI_PACKAGE = "@earendil-works/pi-coding-agent";
// Hard floor, not advice: below this the exports below were never verified, and a
// desk importing exports it cannot vouch for is worse than one that refuses to start.
export const PI_MIN_VERSION = "0.84.4";

const REQUIRED = {
	parseSessionEntries: "function",
	migrateSessionEntries: "function",
	CURRENT_SESSION_VERSION: "number",
};

// Two DIFFERENT version questions, and conflating them is how a wrong build slips in:
//   · TYING binary↔package asks "is this the same build?" → exact identity.
//   · the FLOOR asks "is this at least 0.84.4?" → semver precedence, in which a
//     prerelease sorts BELOW its release (0.84.4-beta.1 < 0.84.4), because a beta of
//     the version that introduced these exports need not have them yet.
// A version we cannot parse answers neither question, and must never read as "equal".
const SEMVER_RE = /^v?(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+([0-9A-Za-z.-]+))?$/;
const normVersion = (v) => String(v ?? "").trim().replace(/^v/, "");

export function parseSemver(v) {
	const m = SEMVER_RE.exec(String(v ?? "").trim());
	if (!m) return null;
	return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]), pre: m[4] ? m[4].split(".") : [], build: m[5] || "" };
}

/** semver precedence: -1 | 0 | 1, or NULL when either side is not a semver. */
export function compareSemver(a, b) {
	const pa = parseSemver(a);
	const pb = parseSemver(b);
	if (!pa || !pb) return null;
	for (const k of ["major", "minor", "patch"]) if (pa[k] !== pb[k]) return pa[k] < pb[k] ? -1 : 1;
	if (!pa.pre.length && !pb.pre.length) return 0;
	if (!pa.pre.length) return 1; // a release outranks any of its prereleases
	if (!pb.pre.length) return -1;
	for (let i = 0; i < Math.max(pa.pre.length, pb.pre.length); i++) {
		const x = pa.pre[i];
		const y = pb.pre[i];
		if (x === undefined) return -1; // the shorter prerelease is the lower one
		if (y === undefined) return 1;
		const nx = /^\d+$/.test(x);
		const ny = /^\d+$/.test(y);
		if (nx && ny) {
			if (Number(x) !== Number(y)) return Number(x) < Number(y) ? -1 : 1;
			continue;
		}
		if (nx !== ny) return nx ? -1 : 1; // numeric identifiers rank below alphanumeric
		if (x !== y) return x < y ? -1 : 1;
	}
	return 0;
}

/**
 * Identity, for tying a package to the binary: the SAME build, not merely the same
 * precedence — build metadata included, since two builds of one version are two
 * different parsers. Anything unparsable ties to nothing.
 */
export function sameVersion(a, b) {
	if (!parseSemver(a) || !parseSemver(b)) return false;
	return normVersion(a) === normVersion(b);
}

// Service managers (launchd/systemd) hand out a minimal PATH that misses npm
// prefixes — resolve the pi binary once at startup instead of trusting PATH.
export function resolvePiBin() {
	// DESK_PI_BIN is the other half of DESK_PI_ROOT: it lets an operator name BOTH the
	// binary and the package, which is the only way the two are allowed to disagree.
	if (process.env.DESK_PI_BIN) return path.resolve(process.env.DESK_PI_BIN);
	const exe = process.platform === "win32" ? "pi.cmd" : "pi";
	const dirs = [
		...(process.env.PATH || "").split(path.delimiter).filter(Boolean),
		path.join(os.homedir(), ".local", "bin"),
		"/opt/homebrew/bin", "/usr/local/bin",
		path.join(os.homedir(), "AppData", "Roaming", "npm"),
	];
	for (const dir of dirs) {
		const full = path.join(dir, exe);
		try {
			fs.accessSync(full, fs.constants.X_OK);
			return full;
		} catch {}
	}
	return exe; // last resort: let spawn search PATH and fail loudly
}

/** A directory is the package iff its package.json says so. */
function readPackageJson(root) {
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf-8"));
		return pkg?.name === PI_PACKAGE ? pkg : null;
	} catch {
		return null;
	}
}

const realOrSelf = (p) => {
	try {
		return fs.realpathSync(p);
	} catch {
		return p;
	}
};

/** Short-lived, never-throwing subprocess. Used only on the shim path. */
function run(cmd, args, cwd) {
	try {
		return String(execFileSync(cmd, args, { cwd, timeout: 8000, stdio: ["ignore", "pipe", "ignore"], encoding: "utf-8" })).trim();
	} catch {
		return null;
	}
}

/** The version the executable we SPAWN reports, or null if it will not say. */
export function piBinVersion(piBin) {
	if (!piBin) return null;
	const out = run(piBin, ["--version"]);
	const m = out && /(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?)/.exec(out);
	return m ? m[1] : null;
}

/** The package root that CONTAINS this executable, or null (shim / not installed). */
export function walkUpToPackage(piBin) {
	if (!piBin) return null;
	let dir;
	try {
		dir = path.dirname(fs.realpathSync(piBin));
	} catch {
		return null;
	}
	for (let i = 0; i < 6 && dir && dir !== path.dirname(dir); i++, dir = path.dirname(dir)) {
		if (readPackageJson(dir)) return dir;
	}
	return null;
}

/**
 * Every layout we can detect, each labelled with how we got there. Order is for the
 * error report only — nothing here is trusted without the version tie.
 */
export function piRootCandidates(piBin) {
	const out = [];
	const push = (root, via) => {
		if (root && !out.some((c) => c.root === root)) out.push({ root, via });
	};
	const inNodeModules = (prefixLibDir, via) => push(path.join(prefixLibDir, ...PI_PACKAGE.split("/")), via);

	// npm's own answer, which follows .npmrc prefix, corepack and per-user configs
	const npmRoot = run("npm", ["root", "-g"]);
	if (npmRoot) inNodeModules(npmRoot, "npm root -g");
	if (process.env.npm_config_prefix) inNodeModules(path.join(process.env.npm_config_prefix, "lib", "node_modules"), "npm_config_prefix");

	// Volta: the `pi` on PATH is a manager shim, so ask Volta where the real one is,
	// and also check its package image layout.
	const voltaHome = process.env.VOLTA_HOME || path.join(os.homedir(), ".volta");
	if (fs.existsSync(voltaHome)) {
		const real = run("volta", ["which", "pi"]);
		if (real) {
			const root = walkUpToPackage(real.split("\n").pop().trim());
			if (root) push(root, "volta which pi");
		}
		inNodeModules(path.join(voltaHome, "tools", "image", "packages", PI_PACKAGE, "lib", "node_modules"), "volta package image");
	}

	// nvm / fnm / any node whose prefix carries its own global node_modules
	inNodeModules(path.join(path.dirname(realOrSelf(process.execPath)), "..", "lib", "node_modules"), "node prefix (nvm/fnm)");
	if (process.env.BUN_INSTALL) inNodeModules(path.join(process.env.BUN_INSTALL, "install", "global", "node_modules"), "bun");
	inNodeModules(path.join(os.homedir(), ".bun", "install", "global", "node_modules"), "bun");

	// plain prefixes. Both os.homedir() AND the passwd home: a service manager can
	// hand us a different $HOME while the install sits in the real user's prefix.
	const homes = new Set();
	try {
		homes.add(os.homedir());
	} catch {}
	try {
		homes.add(os.userInfo().homedir);
	} catch {}
	for (const h of homes) {
		if (!h) continue;
		inNodeModules(path.join(h, ".local", "lib", "node_modules"), "~/.local prefix");
		inNodeModules(path.join(h, ".npm-global", "lib", "node_modules"), "~/.npm-global prefix");
		inNodeModules(path.join(h, "AppData", "Roaming", "npm", "node_modules"), "%APPDATA%\\npm");
	}
	inNodeModules("/opt/homebrew/lib/node_modules", "homebrew prefix");
	inNodeModules("/usr/local/lib/node_modules", "/usr/local prefix");
	inNodeModules("/usr/lib/node_modules", "/usr prefix");
	return out;
}

const table = (rows) => rows.map((r) => `  ${r.root}\n      via ${r.via}${r.version ? `, version ${r.version}` : ", no package.json for " + PI_PACKAGE}`).join("\n");
const FIX = `Set DESK_PI_ROOT to the directory of the ${PI_PACKAGE} that this machine's \`pi\` runs from (it is used exclusively when set).`;

/**
 * Resolve the package that belongs to `piBin`. Returns {root, pkg, version, via,
 * warnings}; throws an Error naming every path considered when it cannot be tied.
 * Never imports anything — cheap enough for a test harness to call.
 */
export function resolvePiPackage(piBin) {
	const warnings = [];
	if (process.env.DESK_PI_ROOT) {
		const root = path.resolve(process.env.DESK_PI_ROOT);
		const pkg = readPackageJson(root);
		if (!pkg) throw new Error(`DESK_PI_ROOT=${root} is not a ${PI_PACKAGE} package directory (no package.json with that name).\n${FIX}`);
		// The override does not suspend this module's one invariant: parse with the
		// install you spawn. When the tie is knowable for FREE — the executable lives
		// inside some OTHER package — a disagreement is a REFUSAL, not a warning: a
		// stale DESK_PI_ROOT in a service file would otherwise import one build and
		// spawn another for as long as nobody read the log. The operator can still say
		// "I mean both of these" by naming the binary too (DESK_PI_BIN), which is the
		// only configuration where the two halves are allowed to differ.
		// No `--version` probe here: an override must not make the desk shell out to
		// the binary it manages on every start.
		const contained = walkUpToPackage(piBin);
		if (contained && realOrSelf(contained) !== realOrSelf(root)) {
			const detail =
				`DESK_PI_ROOT=${root} is ${PI_PACKAGE} ${pkg.version}, but the pi the desk spawns (${piBin}) lives in ` +
				`${contained} (${readPackageJson(contained)?.version ?? "unknown"}).`;
			if (!process.env.DESK_PI_BIN)
				throw new Error(
					`${detail}\nThe desk would parse sessions with one install and spawn the other.\n` +
						`Fix: point DESK_PI_ROOT at ${contained}, or unset it (the binary's own package is found automatically).\n` +
						`If you really mean two different installs, set DESK_PI_BIN to the binary that goes with DESK_PI_ROOT.`,
				);
			warnings.push(`${detail} Both were named explicitly (DESK_PI_BIN + DESK_PI_ROOT), so the desk is parsing with one install and spawning another`);
		}
		return { root, pkg, version: pkg.version, via: "DESK_PI_ROOT", warnings };
	}

	// 2. the package that CONTAINS the executable: tied by construction.
	const walked = walkUpToPackage(piBin);
	if (walked) {
		const pkg = readPackageJson(walked);
		return { root: walked, pkg, version: pkg.version, via: "PI_BIN walk-up", warnings };
	}

	// 3. a shim (or no pi at all): the reported version is the only tie left.
	const candidates = piRootCandidates(piBin).map((c) => ({ ...c, version: readPackageJson(c.root)?.version ?? null }));
	const present = candidates.filter((c) => c.version);
	const binVersion = piBinVersion(piBin);
	if (!binVersion) {
		throw new Error(
			`cannot tie a ${PI_PACKAGE} installation to the pi the desk spawns.\n` +
				`  executable: ${piBin || "(none resolved)"}\n` +
				`  it is not inside a ${PI_PACKAGE} package (a manager shim?) and \`--version\` did not answer,\n` +
				`  so none of the installations found can be shown to be the same one.\n` +
				(present.length ? `Found:\n${table(present)}\n` : `No ${PI_PACKAGE} installation was found. Looked in:\n${table(candidates)}\n`) +
				FIX,
		);
	}
	const matched = [];
	for (const c of present) {
		if (!sameVersion(c.version, binVersion)) continue;
		const real = realOrSelf(c.root);
		if (!matched.some((m) => realOrSelf(m.root) === real)) matched.push(c);
	}
	if (matched.length === 0)
		throw new Error(
			`no installed ${PI_PACKAGE} matches the pi the desk spawns.\n` +
				`  executable: ${piBin} reports version ${binVersion}\n` +
				(present.length ? `Found instead:\n${table(present)}\n` : `No ${PI_PACKAGE} installation was found. Looked in:\n${table(candidates)}\n`) +
				FIX,
		);
	if (matched.length > 1)
		throw new Error(
			`more than one ${PI_PACKAGE} ${binVersion} installation could be the one behind ${piBin}, and they are different directories:\n${table(matched)}\n` +
				`Refusing to guess — importing the wrong one parses sessions with a different build than the one writing them.\n${FIX}`,
		);
	return { root: matched[0].root, pkg: readPackageJson(matched[0].root), version: matched[0].version, via: matched[0].via, warnings };
}

/**
 * Resolve + import pi's session parser. Throws with everything a maintainer needs to
 * tell the three failures apart: no install / cannot be tied to the binary / the
 * install is too old or does not export what we need.
 */
export async function loadPiSession(piBin) {
	const { root, pkg, version, via, warnings } = resolvePiPackage(piBin);
	const floor = compareSemver(version, PI_MIN_VERSION);
	if (floor === null)
		throw new Error(
			`${PI_PACKAGE} at ${root} declares version ${JSON.stringify(version ?? null)}, which is not a semantic version.\n` +
				`The desk cannot tell whether that is at or above ${PI_MIN_VERSION}, and will not parse sessions with a build it cannot identify.\n` +
				`Fix: install a released ${PI_PACKAGE} (npm i -g ${PI_PACKAGE}), or set DESK_PI_ROOT to one.`,
		);
	if (floor < 0)
		throw new Error(
			`${PI_PACKAGE} at ${root} is ${version}; the desk's session reader requires >= ${PI_MIN_VERSION}.\n` +
				`Its session exports were only verified against ${PI_MIN_VERSION}, and parsing sessions with an unverified build is worse than refusing.\n` +
				`Fix: npm i -g ${PI_PACKAGE}`,
		);
	const entryPoint = path.join(root, pkg.exports?.["."]?.import || pkg.main || "dist/index.js");
	let mod;
	try {
		mod = await import(pathToFileURL(entryPoint).href);
	} catch (e) {
		throw new Error(`${PI_PACKAGE} was found at ${root} but its entry point ${entryPoint} would not import: ${e.message}`);
	}
	const missing = Object.entries(REQUIRED)
		.filter(([name, kind]) => typeof mod[name] !== kind)
		.map(([name, kind]) => `${name} (expected ${kind}, got ${typeof mod[name]})`);
	if (missing.length)
		throw new Error(
			`${PI_PACKAGE} ${version} at ${root} does not export what the desk's session reader needs:\n  ${missing.join("\n  ")}\n` +
				`These are root exports of ${PI_MIN_VERSION} (dist/index.d.ts). Upgrade pi, or pin the desk to a pi that has them.`,
		);
	return {
		parseSessionEntries: mod.parseSessionEntries,
		migrateSessionEntries: mod.migrateSessionEntries,
		CURRENT_SESSION_VERSION: mod.CURRENT_SESSION_VERSION,
		version, root, entryPoint, via, warnings,
	};
}
