/**
 * @module packages/nana-setup/lib/paths.mjs
 * @purpose The single resolver for every path the installer touches, so `install`, `doctor` and
 *  `project` can never disagree about where a piece lives.
 * @inputs opts.home / opts.claudeHome / opts.piHome; os.homedir(); nana-pack's agent-dir resolver
 *  (PI_CODING_AGENT_DIR, else ~/.pi/agent) and its cwd-relative probe; process.cwd();
 *  NANA_SETUP_PLATFORM; import.meta.url (for pkgRoot / repoRoot)
 * @outputs pkgRoot, repoRoot, DESK_LABEL ("com.nana.pi-desk"); a layout object of absolute paths —
 *  base, claudeHome, hooksDir, rulesDir, skillsDir, projectsDir, sharedMemoryDir, claudeSettings,
 *  piHome + piHomeSource + piHomeCwdRelative, piSettings, piPackConfig, piObjective, knowledgeHome
 *  (always under the layout BASE unless --pi-home/--home named it), subagentConfig, reviewerAgent,
 *  piSubagentsPackage, mcpConfig, deskLog, binDir, launchAgentsDir, plistPath, isRealHome;
 *  platform(); tildeify()
 * @effects none (pure path arithmetic plus env and homedir reads; nothing on disk is read or written)
 * @errors none — it never throws; an unreadable cwd degrades to a descriptive placeholder string
 */
// Where everything lives. One resolver so `install` and `doctor` can never disagree, and so
// every test can point the whole installer at a temp home with `--home`.
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { piAgentDir, piAgentDirIsCwdRelative } from "../../nana-pack/lib/agent-dir.mjs";

/** <repo>/packages/nana-setup — the files this package ships. */
export const pkgRoot = path.resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
/** <repo> — the install root: what gets registered with pi and referenced from settings.json. */
export const repoRoot = path.resolve(pkgRoot, "..", "..");

export const DESK_LABEL = "com.nana.pi-desk";

/**
 * `--home H` moves every user-scope location under H (that is how the tests run). The two
 * narrower flags override one half each; anything not named falls back to the real home.
 * piHome precedence: `--pi-home` → `--home`-derived `<home>/.pi/agent` (hermetic: an ambient
 * PI_CODING_AGENT_DIR is NOT read) → pi's ACTIVE agent dir (PI_CODING_AGENT_DIR, else
 * ~/.pi/agent — nana-pack's own resolver, so setup writes the file the pack reads).
 */
export function resolveLayout(opts = {}) {
	const base = opts.home ? path.resolve(opts.home) : os.homedir();
	const claudeHome = opts.claudeHome ? path.resolve(opts.claudeHome) : path.join(base, ".claude");
	const piHome = opts.piHome ? path.resolve(opts.piHome) : opts.home ? path.join(base, ".pi", "agent") : piAgentDir();
	return {
		base,
		claudeHome,
		hooksDir: path.join(claudeHome, "hooks"),
		rulesDir: path.join(claudeHome, "rules"),
		skillsDir: path.join(claudeHome, "skills"),
		projectsDir: path.join(claudeHome, "projects"),
		sharedMemoryDir: path.join(claudeHome, "nana-memory", "shared"),
		claudeSettings: path.join(claudeHome, "settings.json"),
		piHome,
		piHomeSource: opts.piHome ? "--pi-home" : opts.home ? "--home" : piHome === path.join(base, ".pi", "agent") ? "default" : "PI_CODING_AGENT_DIR",
		/** The AMBIENT override is relative: piHome is specific to THIS process's cwd, and pi started
		 *  elsewhere reads a different dir. `install` refuses it, `doctor` warns (explicit flags never set it). */
		piHomeCwdRelative: !opts.piHome && !opts.home && piAgentDirIsCwdRelative() ? safeCwd() : null,
		piSettings: path.join(piHome, "settings.json"),
		piPackConfig: path.join(piHome, "nana-pack.json"),
		piObjective: path.join(piHome, "nana-objective.md"),
		// pi-subagents' own config file (a third-party vendor extension nana-pi only consumes —
		// architecture-ruling.md 2026-10-04 §2): seed-once, doctor-verifies, never clobber a hand
		// edit, the exact policy nana-pack.json already follows.
		subagentConfig: path.join(piHome, "extensions", "subagent", "config.json"),
		// Shadows pi-subagents' builtin `reviewer` agent by name (pi's own precedence rule).
		reviewerAgent: path.join(piHome, "agents", "reviewer.md"),
		// Read-only: nana-setup never installs or upgrades this package (architecture-ruling.md
		// §2 — that is a network fetch the installer does not do); doctor only reads its version.
		piSubagentsPackage: path.join(piHome, "npm", "node_modules", "pi-subagents", "package.json"),
		// Read-only: pi's own MCP config; nana-setup never writes it (the seat edits it by hand
		// per the ruling §3), doctor only reads it.
		mcpConfig: path.join(piHome, "mcp.json"),
		// NOT piHome when piHome came from the ambient PI_CODING_AGENT_DIR: the nana-knowledge
		// runtime (packages/nana-knowledge/lib/paths.ts) reads NANA_KNOWLEDGE_HOME or the fixed
		// <home>/.pi/agent/nana-knowledge and never that variable, so following it here built an
		// index the hooks and `nana-knowledge build` never read. Moving knowledge storage needs a
		// deliberate cross-runtime contract; until then it follows the layout's BASE. The explicit
		// --pi-home / --home flags still place it (they are how tests and hermetic installs run).
		knowledgeHome: path.join(opts.piHome || opts.home ? piHome : path.join(base, ".pi", "agent"), "nana-knowledge"),
		deskLog: path.join(piHome, "desk.log"),
		binDir: path.join(base, ".local", "bin"),
		launchAgentsDir: path.join(base, "Library", "LaunchAgents"),
		plistPath: path.join(base, "Library", "LaunchAgents", `${DESK_LABEL}.plist`),
		/** False whenever a --home/--claude-home/--pi-home override is in play: nothing that
		 *  touches the live machine (launchctl, `pi install`) may run then. */
		isRealHome: path.resolve(base) === path.resolve(os.homedir()) && !opts.home && !opts.claudeHome && !opts.piHome,
	};
}

function safeCwd() {
	try {
		return process.cwd();
	} catch {
		return "(the current folder, which no longer exists)";
	}
}

/** Test seam: NANA_SETUP_PLATFORM lets the win32 branches be exercised on a Mac. */
export function platform() {
	return process.env.NANA_SETUP_PLATFORM || process.platform;
}

export function tildeify(p) {
	const h = os.homedir();
	return p === h || p.startsWith(h + path.sep) ? "~" + p.slice(h.length) : p;
}
