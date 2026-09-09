// The bench borrows pi's OWN token/cost arithmetic instead of re-deriving it.
//
// The bench already requires pi at runtime — every measured run is a `pi --mode json` child — so
// importing the same installation for `Usage` and cost adds no new dependency, only a version
// coupling. Everything below is a package ROOT export; never a deep `dist/...` path, which is not
// a supported entry point.
//
// Verified against pi 0.84.4 (2026-09-09):
//   · `@earendil-works/pi-ai` root (`dist/index.d.ts:21`, `export * from "./models.ts"`)
//       - `calculateCost(model, usage) → Usage["cost"]`   (models.d.ts:192)
//   · `@earendil-works/pi-ai` root (`dist/index.d.ts:25`, `export * from "./types.ts"`)
//       - the `Usage` interface: {input, output, cacheRead, cacheWrite, cacheWrite1h?,
//         reasoning?, totalTokens, cost{input, output, cacheRead, cacheWrite, total}}
//         (types.d.ts:265-286). The bench now carries these field names verbatim rather than
//         renaming them, so there is no translation layer left to drift.
//   · `@earendil-works/pi-coding-agent` root
//       - `ModelRuntime.create({allowModelNetwork:false})`, then `getModel(provider, id)` →
//         a Model carrying `cost`, resolved from pi's bundled/cached catalogs with no network.
//
// NOT public, and therefore still ours (say so rather than pretend):
//   · a usage-SUMMING helper. pi has no exported "add these two Usage objects"; `addUsage` in
//     lib/usage.mjs is a six-line field-wise sum over the public field names.
//   · `calculateContextTokens` exists (utils/estimate.d.ts:12) but `utils/estimate.ts` is NOT in
//     pi-ai's root export list, so it is off limits.
//   · provider-wire → `Usage` mapping (OpenAI `input_tokens`/`cached_tokens` → pi's fields) lives
//     inside pi's provider adapters and is not exported; `mapUsage` in lib/nested.mjs does that
//     one translation for the nested requests we intercept ourselves.
//
// A bench must never silently fall back to different arithmetic, so resolution failure is LOUD
// and fatal at startup. `BENCH_PI_ROOT` points at a non-standard install; when set it is the ONLY
// place looked at, so a wrong value fails loudly instead of quietly loading some other pi.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const PI_PACKAGE = "@earendil-works/pi-coding-agent";
export const PI_AI_PACKAGE = "@earendil-works/pi-ai";
/** The version these exports were verified against. Below it: warn, naming the number. */
export const PI_MIN_VERSION = "0.84.4";

/** Root exports the bench cannot work without. Missing one is fatal, not a fallback. */
export const REQUIRED_PI_AI = { calculateCost: "function" };
export const REQUIRED_PI = { ModelRuntime: "function" };

const versionParts = (v) => {
	const m = /^(\d+)\.(\d+)\.(\d+)/.exec(String(v || ""));
	return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
};

export function compareVersions(a, b) {
	const pa = versionParts(a);
	const pb = versionParts(b);
	if (!pa || !pb) return 0; // unknown on either side: no opinion
	for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] < pb[i] ? -1 : 1;
	return 0;
}

const readPackageJson = (root, name) => {
	try {
		const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
		return pkg?.name === name ? pkg : null;
	} catch {
		return null;
	}
};

/** Where the installed pi package could be, best first. Same shape as the desk's resolver. */
export function piRootCandidates(piBin = process.env.PI_BENCH_ENTRY) {
	const out = [];
	const push = (p) => {
		if (p && !out.includes(p)) out.push(p);
	};
	if (process.env.BENCH_PI_ROOT) return [path.resolve(process.env.BENCH_PI_ROOT)]; // exclusive
	if (piBin) {
		let dir = null;
		try {
			dir = path.dirname(fs.realpathSync(piBin));
		} catch {
			/* not a path we can walk */
		}
		for (let i = 0; dir && i < 6 && dir !== path.dirname(dir); i++, dir = path.dirname(dir)) push(dir);
	}
	const homes = new Set();
	for (const get of [() => os.homedir(), () => os.userInfo().homedir]) {
		try {
			homes.add(get());
		} catch {
			/* no home available */
		}
	}
	const prefixes = [];
	for (const h of homes) {
		if (!h) continue;
		prefixes.push(path.join(h, ".local", "lib", "node_modules"));
		prefixes.push(path.join(h, ".npm-global", "lib", "node_modules"));
		prefixes.push(path.join(h, "AppData", "Roaming", "npm", "node_modules"));
	}
	prefixes.push("/opt/homebrew/lib/node_modules", "/usr/local/lib/node_modules", "/usr/lib/node_modules");
	for (const p of prefixes) push(path.join(p, ...PI_PACKAGE.split("/")));
	return out;
}

/** A package's declared root entry point — never a hand-written dist path. */
const rootEntry = (root, pkg) => path.join(root, pkg.exports?.["."]?.import || pkg.main || "dist/index.js");

const missingList = (mod, required) =>
	Object.entries(required)
		.filter(([name, kind]) => typeof mod[name] !== kind)
		.map(([name, kind]) => `${name} (expected ${kind}, got ${typeof mod[name]})`);

/**
 * Resolve and import pi's public arithmetic. Throws an Error naming every path tried (missing
 * install) or every export that was absent (version mismatch) — the two failures a maintainer has
 * to tell apart, and neither is guessable from "cannot find module".
 * `piBin` is the CLI path the runner already resolved, so we borrow the same installation.
 */
export async function loadPiExports({ piBin = process.env.PI_BENCH_ENTRY, importer = (href) => import(href) } = {}) {
	const tried = piRootCandidates(piBin);
	let root = null;
	let pkg = null;
	for (const cand of tried) {
		const found = readPackageJson(cand, PI_PACKAGE);
		if (found) {
			root = cand;
			pkg = found;
			break;
		}
	}
	if (!root) {
		throw new Error(
			`the bench needs the installed ${PI_PACKAGE} (>= ${PI_MIN_VERSION}) for token and cost arithmetic, ` +
				`and no directory with its package.json was found.\nTried:\n  ${tried.join("\n  ")}\n` +
				`Fix: npm i -g ${PI_PACKAGE}   (or set BENCH_PI_ROOT to the package directory — it is exclusive when set)`,
		);
	}

	const aiRoot = path.join(root, "node_modules", ...PI_AI_PACKAGE.split("/"));
	const aiPkg = readPackageJson(aiRoot, PI_AI_PACKAGE);
	if (!aiPkg) {
		throw new Error(`${PI_PACKAGE} at ${root} does not carry its bundled ${PI_AI_PACKAGE}; the bench imports Usage/calculateCost from it.\nLooked in: ${aiRoot}`);
	}

	const load = async (entry, label) => {
		try {
			return await importer(pathToFileURL(entry).href);
		} catch (e) {
			throw new Error(`${label} was found but its entry point ${entry} would not import: ${e.message}`);
		}
	};
	const ai = await load(rootEntry(aiRoot, aiPkg), PI_AI_PACKAGE);
	const ca = await load(rootEntry(root, pkg), PI_PACKAGE);

	const missing = [...missingList(ai, REQUIRED_PI_AI).map((m) => `${PI_AI_PACKAGE}: ${m}`), ...missingList(ca, REQUIRED_PI).map((m) => `${PI_PACKAGE}: ${m}`)];
	if (missing.length) {
		throw new Error(
			`the installed pi does not export what the bench's token/cost arithmetic needs:\n  ${missing.join("\n  ")}\n` +
				`These are root exports of ${PI_MIN_VERSION} (pi-ai dist/index.d.ts → models.ts/types.ts; pi-coding-agent dist/index.d.ts). ` +
				`Upgrade pi, or pin the bench to a pi that has them. The bench will NOT substitute its own arithmetic.`,
		);
	}

	const warnings = [];
	if (compareVersions(pkg.version, PI_MIN_VERSION) < 0) {
		warnings.push(`installed ${PI_PACKAGE} is ${pkg.version}, below the ${PI_MIN_VERSION} the bench was verified against — token/cost arithmetic may differ from what pi itself does`);
	}
	return { calculateCost: ai.calculateCost, ModelRuntime: ca.ModelRuntime, root, aiRoot, version: pkg.version || null, aiVersion: aiPkg.version || null, warnings };
}

/**
 * A pricer for usage pi did NOT price for us: the nested LLM calls the sidecar intercepts, whose
 * model can differ from the run's own (observed: a `web_search` billed against `gpt-5.6-terra`
 * while the run used `gpt-5.6-sol`).
 *
 * Offline by construction: `allowModelNetwork:false`, and the catalog comes from pi's bundled
 * defaults plus the cached `models-store.json` in the agent dir. A model the offline catalog does
 * not know is priced `null` WITH a reason — never guessed, and never silently zero.
 */
export async function createPricer(piExports, { provider, agentDir = process.env.PI_CODING_AGENT_DIR } = {}) {
	// Point the runtime at the PREPARED agent dir explicitly rather than letting it consult
	// whatever config dir this process happens to inherit: the catalog that prices a run must be
	// the same one the measured children resolved their model from.
	const opts = { allowModelNetwork: false };
	if (agentDir) {
		opts.configDir = agentDir;
		opts.modelsPath = path.join(agentDir, "models.json");
		opts.modelsStorePath = path.join(agentDir, "models-store.json");
	}
	const runtime = await piExports.ModelRuntime.create(opts);
	return function priceUsage(usage, { model, provider: prov = provider } = {}) {
		if (!usage || !model) return { cost: null, reason: "no-model-id" };
		for (const p of [prov, "openai-codex", "openai", "anthropic", "google"].filter(Boolean)) {
			let m = null;
			try {
				m = runtime.getModel(p, model);
			} catch {
				m = null;
			}
			if (m?.cost) {
				try {
					return { cost: piExports.calculateCost(m, usage), reason: null, provider: p };
				} catch (e) {
					return { cost: null, reason: `calculateCost threw: ${e.message}` };
				}
			}
		}
		return { cost: null, reason: `model ${model} is not in pi's offline catalog` };
	};
}
