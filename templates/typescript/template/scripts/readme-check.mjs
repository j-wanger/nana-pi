/**
 * @module scripts/readme-check.mjs
 * @purpose Check that every command, path, flag and script name a README states exists and runs as written, and that a reader can install, run and test from it alone (G-012).
 * @inputs README.md (plus any README named in readme-check.config.json), package.json, the files under scripts/, and the project root
 * @outputs a claim list, a problem list and a summary line on stdout; the exported functions return plain data
 * @effects disk (reads the READMEs, the files they name and the package metadata), process (exits non-zero from the CLI when a claim does not hold)
 * @errors a problem list naming each README line whose claim fails; bad CLI arguments print usage to stderr and return status 2; a thrown Error for a bad config
 */
// The README is read before the code, so a README claim is a requirement with the README
// as its row. This checks the five things that make one honest: its commands exist, its
// paths exist, it says how to install / run / test and what the project is for, the flags
// it shows exist in the script it shows them for, and every script the project ships is
// mentioned.
//
// Dependency-free on purpose, so it runs from the post-edit gate before `pnpm install`.
// Everything except loadConfig, checkProject and main is pure over text, so the claim
// readers are testable on fixture strings.

import {
	existsSync,
	readdirSync,
	readFileSync,
	realpathSync,
	statSync,
} from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const CONFIG_PATH = "readme-check.config.json";
export const MAP_CONFIG_PATH = "code-map.config.json";

/** Fence info strings whose body is shell: a `json` or `ts` block is not a command. */
const SHELL_LANGS = new Set([
	"",
	"bash",
	"sh",
	"shell",
	"zsh",
	"console",
	"shell-session",
	"text",
]);

/** Extensions that make a bare token (no slash) a path claim. */
const KNOWN_EXT = new Set([
	".md",
	".py",
	".ts",
	".tsx",
	".mjs",
	".cjs",
	".js",
	".jsx",
	".json",
	".toml",
	".yaml",
	".yml",
	".lock",
	".txt",
	".cfg",
	".ini",
	".sh",
	".typed",
	".html",
	".css",
]);

/** Package-manager subcommands that are the tool's own, not a project script. */
const PM_BUILTINS = new Set([
	"add",
	"audit",
	"bin",
	"cache",
	"ci",
	"config",
	"create",
	"dedupe",
	"deploy",
	"dlx",
	"doctor",
	"env",
	"exec",
	"fund",
	"i",
	"import",
	"info",
	"init",
	"install",
	"licenses",
	"link",
	"list",
	"login",
	"logout",
	"ls",
	"outdated",
	"pack",
	"patch",
	"ping",
	"prune",
	"publish",
	"rebuild",
	"remove",
	"rm",
	"root",
	"run",
	"setup",
	"store",
	"uninstall",
	"unlink",
	"up",
	"update",
	"upgrade",
	"version",
	"view",
	"whoami",
	"why",
	"x",
]);

/**
 * Command heads that make an inline code span a command the README names: `npm test` in
 * prose is as much a claim as the same line inside a fence (G-012).
 */
const COMMAND_HEADS = new Set([
	"npm",
	"pnpm",
	"yarn",
	"bun",
	"npx",
	"uv",
	"uvx",
	"python",
	"python3",
	"node",
	"make",
	"just",
]);

/** The three things a reader must be able to do from the README alone. */
const SECTIONS = [
	["install", ["install", "setup", "getting started"]],
	["run", ["run", "usage", "start"]],
	["test", ["test", "verify", "check"]],
];

const FENCE = /^\s*```+\s*([A-Za-z0-9_-]*)\s*$/;
const PROMPT = /^\s*[$>]\s+/;
const PM = /^(npm|pnpm|yarn|bun)\s+(?:run\s+)?([A-Za-z0-9:_.-]+)/;
const RUNNER = /^(make|just)\s+([A-Za-z0-9:_.-]+)/;
const BACKTICK = /`([^`]+)`/g;
const FLAG = /--[A-Za-z][\w-]*/g;
const SCRIPT = /(?<![\w/.-])(scripts\/[\w./-]+\.(?:py|mjs|cjs|js|ts|sh))/g;
const HEADING = /^#{1,6}\s+(.*?)\s*$/;
/** `./scripts/x.mjs` or `scripts/x.py` as the head of a span: an invocation, not a mention. */
const SCRIPT_HEAD = /^\.?\/?scripts\/[\w./-]+\.(?:py|mjs|cjs|js|ts|sh)$/;
/** What separates two commands inside one span: `a && b`, `a; b`, `a | b`. */
const CHAIN = /&&|\|\||;|\|/;

/**
 * @typedef {object} Claim
 * @property {string} kind command | path | flag
 * @property {number} line 1-based
 * @property {string} text
 */

// -------------------------------------------------------------------- config

function readJson(file) {
	try {
		return JSON.parse(readFileSync(file, "utf8"));
	} catch {
		return null;
	}
}

/** The code-map roots, so a README beside one of them is checked too. */
function mapRoots(root) {
	const raw = existsSync(join(root, MAP_CONFIG_PATH))
		? readJson(join(root, MAP_CONFIG_PATH))
		: null;
	if (!Array.isArray(raw?.roots)) return [];
	return raw.roots
		.map((e) =>
			typeof e === "string" ? e : typeof e?.path === "string" ? e.path : null,
		)
		.filter((p) => typeof p === "string" && p);
}

/** `README.md` plus every `<code-map root>/README.md` that exists. */
export function defaultReadmes(root) {
	const found = ["README.md"];
	for (const r of mapRoots(root).sort()) {
		if (existsSync(join(root, r, "README.md"))) found.push(`${r}/README.md`);
	}
	return [...new Set(found)];
}

/** Validate the optional config. `readmes` defaults; `undocumented` needs a reason each. */
/**
 * `externalPaths`: tokens a README names that live OUTSIDE this project — a file in a
 * consumer project, a path inside an installed dependency — each with the reason. An
 * entry ending in `/` covers everything under it. Declaring one is a statement, not a
 * silencer: the reason says where the thing actually is.
 */
function parseExternalPaths(raw, where) {
	if (raw === undefined) return [];
	if (!Array.isArray(raw))
		throw new Error(
			`${where}: 'externalPaths' must be an array of objects with a 'path' and a 'reason'`,
		);
	return raw.map((entry, i) => {
		if (typeof entry?.path !== "string" || !entry.path)
			throw new Error(
				`${where}: externalPaths[${i}] must be an object with a non-empty 'path'`,
			);
		return {
			path: entry.path,
			reason: typeof entry.reason === "string" ? entry.reason.trim() : "",
		};
	});
}

/** True when a path claim is declared to live outside this project. */
export function isExternalPath(config, text) {
	return (config.externalPaths ?? []).some(
		(e) => text === e.path || (e.path.endsWith("/") && text.startsWith(e.path)),
	);
}

export function parseConfig(text, root, where = CONFIG_PATH) {
	let raw;
	try {
		raw = JSON.parse(text);
	} catch (err) {
		throw new Error(`${where}: not valid JSON (${err.message})`);
	}
	if (typeof raw !== "object" || raw === null || Array.isArray(raw))
		throw new Error(`${where}: the top level must be an object`);
	if (
		raw.readmes !== undefined &&
		(!Array.isArray(raw.readmes) ||
			raw.readmes.some((r) => typeof r !== "string" || !r))
	)
		throw new Error(`${where}: 'readmes' must be an array of paths`);
	const undocumented = new Map();
	const entries = raw.undocumented ?? [];
	if (!Array.isArray(entries))
		throw new Error(
			`${where}: 'undocumented' must be an array of objects with a 'name' and a 'reason'`,
		);
	for (const [i, entry] of entries.entries()) {
		if (typeof entry?.name !== "string" || !entry.name)
			throw new Error(
				`${where}: undocumented[${i}] must be an object with a non-empty 'name'`,
			);
		undocumented.set(
			entry.name,
			typeof entry.reason === "string" ? entry.reason.trim() : "",
		);
	}
	return {
		readmes: raw.readmes?.length ? raw.readmes : defaultReadmes(root),
		undocumented,
		externalPaths: parseExternalPaths(raw.externalPaths, where),
	};
}

export function loadConfig(root) {
	const file = join(root, CONFIG_PATH);
	if (!existsSync(file))
		return {
			readmes: defaultReadmes(root),
			undocumented: new Map(),
			externalPaths: [],
		};
	return parseConfig(readFileSync(file, "utf8"), root);
}

// -------------------------------------------------------------------- claims

/** Every shell line inside a fenced block, as `[line, command]` (1-based). */
export function shellLines(text) {
	const out = [];
	let lang = null;
	for (const [i, line] of text.split("\n").entries()) {
		const fence = FENCE.exec(line);
		if (fence) {
			lang = lang === null ? fence[1].toLowerCase() : null;
			continue;
		}
		if (lang === null || !SHELL_LANGS.has(lang)) continue;
		const command = line.replace(PROMPT, "").trim();
		if (command && !command.startsWith("#")) out.push([i + 1, command]);
	}
	return out;
}

/**
 * The path a token names IN THIS PROJECT, or null when it is not a path claim.
 * What a project-relative path is NOT: a machine path (`~/.ssh`, `/etc/hosts`), a
 * package specifier (`@scope/name`), a URL or any scheme (`git:`, `http:`), or a
 * `file:line` citation into another package's docs (`docs/rpc.md:864`) — those name
 * something outside the project, so there is nothing here to check them against.
 */
export function looksLikePath(token) {
	let tok = token.trim().replace(/[.,;:)]+$/, "");
	// a trailing slash makes a directory claim: `src/` is a path
	const slashed = tok.includes("/");
	tok = tok.replace(/\/+$/, "");
	if (!tok || /\s/.test(tok) || tok.startsWith("-") || tok.startsWith("/"))
		return null;
	if (tok.startsWith("~") || tok.startsWith("@") || tok.includes(":"))
		return null;
	// a path is spelled in path characters: a placeholder (`<file...>`), a regex, a code
	// fragment or a symbol is prose, whatever slashes it happens to contain
	if (!/^[A-Za-z0-9._/+-]+$/.test(tok)) return null;
	if (slashed || KNOWN_EXT.has(extname(tok))) return tok;
	return null;
}

/** Line numbers (1-based) inside a fenced block, the fence lines themselves included. */
function fencedLines(text) {
	const out = new Set();
	let open = false;
	for (const [i, line] of text.split("\n").entries()) {
		if (FENCE.test(line)) {
			open = !open;
			out.add(i + 1);
			continue;
		}
		if (open) out.add(i + 1);
	}
	return out;
}

/** The command a span states, or null when the span is prose, a path or a symbol. */
export function commandSpan(span) {
	const command = span.trim();
	const head = command.split(/\s+/)[0] ?? "";
	return COMMAND_HEADS.has(head) || SCRIPT_HEAD.test(head) ? command : null;
}

/**
 * Commands shown inline in backticks — `npm test` in a sentence names a command just as a
 * fenced block does, and a README that names a script it does not have is wrong either way.
 * Only spans outside fences: a fenced line is already a command claim.
 */
export function inlineCommandClaims(text) {
	const out = [];
	const fenced = fencedLines(text);
	for (const [i, line] of text.split("\n").entries()) {
		if (fenced.has(i + 1)) continue;
		for (const span of line.matchAll(BACKTICK)) {
			for (const part of span[1].split(CHAIN)) {
				const command = commandSpan(part);
				if (command) out.push({ kind: "command", line: i + 1, text: command });
			}
		}
	}
	return out;
}

export function commandClaims(text) {
	return [
		...shellLines(text).map(([line, command]) => ({
			kind: "command",
			line,
			text: command,
		})),
		...inlineCommandClaims(text),
	];
}

/** The path claims one line's backticked spans make. */
function backtickedPaths(line, n) {
	const out = [];
	for (const span of line.matchAll(BACKTICK)) {
		for (const token of span[1].split(/\s+/)) {
			const path = looksLikePath(token);
			if (path) out.push({ kind: "path", line: n, text: path });
		}
	}
	return out;
}

export function pathClaims(text) {
	const out = [];
	for (const [i, line] of text.split("\n").entries())
		out.push(...backtickedPaths(line, i + 1));
	for (const [line, command] of shellLines(text)) {
		for (const token of command.split(/\s+/)) {
			const path = looksLikePath(token);
			if (path?.includes("/")) out.push({ kind: "path", line, text: path });
		}
	}
	return out;
}

export function flagClaims(text) {
	const out = [];
	for (const [i, line] of text.split("\n").entries()) {
		const scripts = [...line.matchAll(SCRIPT)].map((m) => m[1]);
		if (!scripts.length) continue;
		for (const flag of new Set(line.match(FLAG) ?? [])) {
			out.push({ kind: "flag", line: i + 1, text: `${scripts[0]} ${flag}` });
		}
	}
	return out;
}

export function headings(text) {
	return text
		.split("\n")
		.map((line) => HEADING.exec(line))
		.filter(Boolean)
		.map((m) => m[1].toLowerCase());
}

/** The prose before the first `##`, with the title line dropped. */
export function firstParagraph(text) {
	const out = [];
	for (const line of text.split("\n")) {
		if (line.startsWith("## ")) break;
		if (line.startsWith("# ") || FENCE.test(line)) continue;
		if (line.trim()) out.push(line.trim());
	}
	return out.join(" ");
}

/** Every claim one README makes, in line order. */
export function claims(text) {
	return [
		...commandClaims(text),
		...pathClaims(text),
		...flagClaims(text),
	].sort(
		(a, b) =>
			a.line - b.line ||
			a.kind.localeCompare(b.kind) ||
			a.text.localeCompare(b.text),
	);
}

// ------------------------------------------------------------------ problems

function packageScripts(root) {
	const raw = existsSync(join(root, "package.json"))
		? readJson(join(root, "package.json"))
		: null;
	const scripts = raw?.scripts;
	return typeof scripts === "object" && scripts !== null
		? Object.keys(scripts)
		: [];
}

function scriptFiles(root) {
	const base = join(root, "scripts");
	if (!existsSync(base) || !statSync(base).isDirectory()) return [];
	return readdirSync(base, { withFileTypes: true })
		.filter((e) => e.isFile() && !e.name.startsWith("."))
		.map((e) => e.name)
		.sort();
}

export function commandProblems(root, where, claim, scripts) {
	const problems = [];
	const pm = PM.exec(claim.text);
	if (pm && !scripts.includes(pm[2]) && !PM_BUILTINS.has(pm[2]))
		problems.push(
			`${where}:${claim.line}: '${pm[1]} ${pm[2]}' is not a script in package.json`,
		);
	const runner = RUNNER.exec(claim.text);
	if (
		runner &&
		!["Makefile", "makefile", "justfile", "Justfile"].some((n) =>
			existsSync(join(root, n)),
		)
	)
		problems.push(
			`${where}:${claim.line}: '${runner[1]}' is not this project's runner (no such file)`,
		);
	return problems;
}

/**
 * A path a README names is read relative to the README: `bin/pi-review.mjs` in
 * `packages/nana-pack/README.md` is that package's own file. Both bases count, so a
 * root-relative path in a nested README still resolves.
 */
export function pathProblems(root, where, claim) {
	const bases = [root, join(root, dirname(where))];
	return bases.some((base) => existsSync(join(base, claim.text)))
		? []
		: [`${where}:${claim.line}: '${claim.text}' does not exist`];
}

export function flagProblems(root, where, claim) {
	const [script, flag] = claim.text.split(" ");
	const file = join(root, script);
	if (!existsSync(file)) return []; // the missing file is already a path problem
	return readFileSync(file, "utf8").includes(flag)
		? []
		: [`${where}:${claim.line}: '${script}' has no '${flag}' flag`];
}

/** A README a reader cannot install, run and test from is incomplete. */
export function sectionProblems(where, text) {
	const problems = [];
	if (!firstParagraph(text))
		problems.push(
			`${where}:1: no first paragraph saying what this project is for`,
		);
	const found = headings(text);
	for (const [name, words] of SECTIONS) {
		if (!found.some((h) => words.some((w) => h.includes(w))))
			problems.push(
				`${where}:1: no heading for how to ${name} it (${words.join(" | ")})`,
			);
	}
	return problems;
}

/** A declared exemption has to say why, or it is a way to hide a stale claim. */
export function externalPathProblems(config) {
	return (config.externalPaths ?? [])
		.filter((e) => !e.reason)
		.map((e) => `${CONFIG_PATH}:1: externalPaths '${e.path}' has no reason`);
}

/** Every script this project ships is named somewhere, or declared undocumented with a reason. */
export function documentedProblems(root, config, texts) {
	const body = [...texts.values()].join("\n");
	const names = [...new Set([...packageScripts(root), ...scriptFiles(root)])];
	const problems = [];
	for (const name of names) {
		if (config.undocumented.has(name)) {
			if (!config.undocumented.get(name))
				problems.push(`${CONFIG_PATH}:1: undocumented '${name}' has no reason`);
			continue;
		}
		if (!body.includes(name))
			problems.push(
				`${config.readmes[0]}:1: script '${name}' is not documented in any README`,
			);
	}
	return problems;
}

/** One README's claims and the problems they raise. */
export function checkReadme(root, where, text, scripts, config = {}) {
	const found = claims(text);
	const problems = sectionProblems(where, text);
	for (const claim of found) {
		if (claim.kind === "command")
			problems.push(...commandProblems(root, where, claim, scripts));
		else if (claim.kind === "path") {
			if (!isExternalPath(config, claim.text))
				problems.push(...pathProblems(root, where, claim));
		} else problems.push(...flagProblems(root, where, claim));
	}
	return { claims: found, problems };
}

/** Every configured README, checked. */
export function checkProject(root) {
	const config = loadConfig(root);
	const scripts = packageScripts(root);
	const texts = new Map();
	const found = [];
	const problems = [];
	for (const rel of config.readmes) {
		const file = join(root, rel);
		if (!existsSync(file)) {
			problems.push(
				`${rel}:1: does not exist, but readme-check is configured to check it`,
			);
			continue;
		}
		texts.set(rel, readFileSync(file, "utf8"));
		const one = checkReadme(root, rel, texts.get(rel), scripts, config);
		found.push(...one.claims);
		problems.push(...one.problems);
	}
	problems.push(...externalPathProblems(config));
	problems.push(...documentedProblems(root, config, texts));
	return {
		claims: found,
		problems,
		line: `readme: ${found.length} claims checked; ${problems.length} problem(s)`,
	};
}

// ----------------------------------------------------------------------- CLI

export const PROJECT_ROOT = resolve(
	dirname(realpathSync(fileURLToPath(import.meta.url))),
	"..",
);

/**
 * The CLI, over any project root — a repo that vendors this checker as a shim passes
 * its own root, so there is one implementation of the command.
 */
export function main(argv, root = PROJECT_ROOT) {
	const mode = argv[0] ?? "--check";
	if (argv.length > 1 || (mode !== "--check" && mode !== "--list")) {
		process.stderr.write("Usage: readme-check.mjs [--check | --list]\n");
		return 2;
	}
	const { claims: found, problems, line } = checkProject(root);
	if (mode === "--list")
		for (const c of found) process.stdout.write(`${c.kind}: ${c.text}\n`);
	process.stdout.write(`${line}\n`);
	for (const p of problems) process.stdout.write(`  ${p}\n`);
	return problems.length ? 1 : 0;
}

const invokedDirectly =
	process.argv[1] &&
	existsSync(process.argv[1]) &&
	realpathSync(process.argv[1]) ===
		realpathSync(fileURLToPath(import.meta.url));
if (invokedDirectly) process.exit(main(process.argv.slice(2)));
