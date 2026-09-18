// Where everything lives. One resolver so `install` and `doctor` can never disagree, and so
// every test can point the whole installer at a temp home with `--home`.
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

/** <repo>/packages/nana-setup — the files this package ships. */
export const pkgRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
/** <repo> — the install root: what gets registered with pi and referenced from settings.json. */
export const repoRoot = path.resolve(pkgRoot, "..", "..");

export const DESK_LABEL = "com.nana.pi-desk";

/**
 * `--home H` moves every user-scope location under H (that is how the tests run). The two
 * narrower flags override one half each; anything not named falls back to the real home.
 */
export function resolveLayout(opts = {}) {
	const base = opts.home ? path.resolve(opts.home) : os.homedir();
	const claudeHome = opts.claudeHome ? path.resolve(opts.claudeHome) : path.join(base, ".claude");
	const piHome = opts.piHome ? path.resolve(opts.piHome) : path.join(base, ".pi", "agent");
	return {
		base,
		claudeHome,
		hooksDir: path.join(claudeHome, "hooks"),
		rulesDir: path.join(claudeHome, "rules"),
		projectsDir: path.join(claudeHome, "projects"),
		sharedMemoryDir: path.join(claudeHome, "nana-memory", "shared"),
		claudeSettings: path.join(claudeHome, "settings.json"),
		piHome,
		piSettings: path.join(piHome, "settings.json"),
		piPackConfig: path.join(piHome, "nana-pack.json"),
		piObjective: path.join(piHome, "nana-objective.md"),
		knowledgeHome: path.join(piHome, "nana-knowledge"),
		deskLog: path.join(piHome, "desk.log"),
		binDir: path.join(base, ".local", "bin"),
		launchAgentsDir: path.join(base, "Library", "LaunchAgents"),
		plistPath: path.join(base, "Library", "LaunchAgents", `${DESK_LABEL}.plist`),
		/** False whenever a --home/--claude-home/--pi-home override is in play: nothing that
		 *  touches the live machine (launchctl, `pi install`) may run then. */
		isRealHome: path.resolve(base) === path.resolve(os.homedir()) && !opts.claudeHome && !opts.piHome,
	};
}

/** Test seam: NANA_SETUP_PLATFORM lets the win32 branches be exercised on a Mac. */
export function platform() {
	return process.env.NANA_SETUP_PLATFORM || process.platform;
}

export function tildeify(p) {
	const h = os.homedir();
	return p === h || p.startsWith(h + path.sep) ? "~" + p.slice(h.length) : p;
}
