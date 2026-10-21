/**
 * @module packages/nana-pack/lib/gate-rm-outside.ts
 * @purpose Find readable non-recursive rm targets outside the working and accepted temp folders.
 * @inputs shell segments, cwd, tool name, home, accepted temp roots, injected platform and environment, and the command's segmentable verdict
 * @outputs a map from each rm segment with an outside target to that target's full path; gitBashPath and the Git Bash temp and drive constants
 * @effects disk (canonicalizes the cwd, temp roots, cd folders, and target parents)
 * @errors never throws; an internal failure marks the segment text as outside
 */
import * as path from "node:path";
import { within } from "./gate-temp-roots.ts";
import { base, commandIndex, PS_REMOVE, type Segment, tokens } from "./gate-shell.ts";
import { realPath } from "./real-path.mjs";

// contract: R-2335 — shell and PowerShell words that move the folder used for later relative targets.
const CD_WORDS = new Set(["cd", "pushd"]);
const PS_CD_WORDS = new Set(["cd", "pushd", "chdir", "sl", "set-location", "push-location"]);
const POP_WORDS = new Set(["popd", "pop-location"]);

// contract: R-2336 — Remove-Item path parameters and parameters whose following value is not a target.
const PS_PATH_PARAMETERS = ["path", "literalpath"] as const;
const PS_VALUE_PARAMETERS = ["filter", "include", "exclude"] as const;

// contract: R-2331, R-2336, R-2337 — the only leading home-variable spellings this reader resolves.
const HOME_SPELLINGS = ["$HOME", "${HOME}"] as const;
const PS_HOME_SPELLINGS = ["$env:USERPROFILE", "$env:HOME"] as const;

// contract (R-2490): Git for Windows' fstab mounts usertemp at /tmp (git-extra.install.in:116-118, checked 2026-10-21).
export const GIT_BASH_TEMP = "/tmp";
// contract (R-2490): GetTempPathW checks TMP then TEMP; omitting later fallbacks makes unset environments fail closed.
export const GIT_BASH_TEMP_VARIABLES = ["TMP", "TEMP"] as const;
// contract (R-2492): Git for Windows' cygdrive mount accepts one drive letter followed by / or end (mount.cc:895-917).
export const GIT_BASH_DRIVE = /^\/([A-Za-z])(?=\/|$)/;

/** Read Git Bash's default temp and cygdrive spellings as Windows paths by textual substitution.
 * `normalizeWindowsShellPath` in `lib/agent-dir.mjs` reads pi's tool paths with other rules (`/mnt/c`, `/cygdrive/c`). We keep the two apart on purpose because Git Bash's mount table maps neither prefix.
 */
export function gitBashPath(spelling: string, { platform, env }: { platform?: NodeJS.Platform; env?: NodeJS.ProcessEnv }): string {
	if (platform !== "win32" || env === undefined || spelling.startsWith("//") || spelling.includes("\\")) return spelling;
	const normalized = path.posix.normalize(spelling);
	if (normalized === GIT_BASH_TEMP || normalized.startsWith(`${GIT_BASH_TEMP}/`)) {
		const temp = GIT_BASH_TEMP_VARIABLES.map((name) => env[name]).find((value) => value !== undefined && value !== "");
		if (temp === undefined) return spelling;
		return `${temp}${normalized.slice(GIT_BASH_TEMP.length)}`;
	}
	const drive = GIT_BASH_DRIVE.exec(normalized);
	if (drive) return `${drive[1].toUpperCase()}:${normalized.slice(drive[0].length) || "/"}`;
	return spelling;
}

const REDIRECTION = /(?:\d+)?(?:&>|>&|>>?|<<?)\s*(?:&?\d+|"(?:\\.|[^"])*"|'[^']*'|[^\s;&|]+)/g;
const DYNAMIC = /[*?\[\]{}$`]/;

function shellWords(text: string): string[] {
	const protectedBraces = withoutRedirections(text).replace(/\{[^{}\s]+\}/g, (word) => word.replaceAll("{", "\uE000").replaceAll("}", "\uE001"));
	return tokens(protectedBraces, true).map((word) => word.replaceAll("\uE000", "{").replaceAll("\uE001", "}"));
}

function withoutRedirections(text: string): string {
	return text.replace(REDIRECTION, "");
}

function strictWithin(parent: string, child: string): boolean {
	return child !== parent && within(parent, child);
}

function parameter(word: string): "path" | "value" | null {
	if (!word.startsWith("-") || word === "-") return null;
	const typed = word.slice(1).toLowerCase();
	const choices = [
		...PS_PATH_PARAMETERS.map((name) => ({ name, kind: "path" as const })),
		...PS_VALUE_PARAMETERS.map((name) => ({ name, kind: "value" as const })),
	].filter(({ name }) => name.startsWith(typed));
	return choices.length === 1 ? choices[0].kind : null;
}

function powershellTargets(args: string[]): string[] {
	const out: string[] = [];
	for (let i = 0; i < args.length; i++) {
		const kind = parameter(args[i]);
		if (kind) {
			const value = args[++i];
			if (kind === "path" && value !== undefined) out.push(...value.split(",").filter(Boolean));
			continue;
		}
		if (args[i].startsWith("-")) continue;
		out.push(...args[i].split(",").filter(Boolean));
	}
	return out;
}

function bashTargets(args: string[]): string[] {
	const marker = args.indexOf("--");
	return args.filter((word, index) => (marker >= 0 && index > marker) || (index !== marker && !word.startsWith("-")));
}

function homeExpanded(target: string, home: string, powershell: boolean): string | null {
	if (target === "~") return home;
	if (/^~[/\\]/.test(target)) return path.join(home, target.slice(2));
	if (target.startsWith("~")) return null;
	for (const spelling of HOME_SPELLINGS) {
		if (target === spelling) return home;
		if (target.startsWith(`${spelling}/`) || target.startsWith(`${spelling}\\`)) return path.join(home, target.slice(spelling.length + 1));
	}
	if (powershell) {
		const lower = target.toLowerCase();
		for (const spelling of PS_HOME_SPELLINGS) {
			const key = spelling.toLowerCase();
			if (lower === key) return home;
			if (lower.startsWith(`${key}/`) || lower.startsWith(`${key}\\`)) return path.join(home, target.slice(spelling.length + 1));
		}
	}
	if (target.startsWith("$") || target.startsWith("`") || target.includes("$(")) return null;
	return target;
}

type Folder = { typed: string; real: string };
type Placed = { full: string; compared: string };

/** Canonicalize the target's parent but not its last part, so a final link is judged where it sits. */
function placedTarget(target: string, folder: Folder, home: string, powershell: boolean, platform?: NodeJS.Platform, env?: NodeJS.ProcessEnv): Placed | null {
	const translated = powershell || platform === undefined || env === undefined ? target : gitBashPath(target, { platform, env });
	const expanded = homeExpanded(translated, home, powershell);
	if (expanded === null) return null;
	const spelling = powershell ? expanded.replaceAll("\\", path.sep) : expanded;
	const full = path.resolve(folder.typed, spelling);
	const parsed = path.parse(full);
	const relativeParts = full.slice(parsed.root.length).split(path.sep).filter(Boolean);
	const dynamicAt = relativeParts.findIndex((part) => DYNAMIC.test(part));
	if (dynamicAt >= 0) {
		const literal = path.join(parsed.root, ...relativeParts.slice(0, dynamicAt));
		return { full, compared: path.resolve(realPath(literal), ...relativeParts.slice(dynamicAt)) };
	}
	return { full, compared: path.join(realPath(path.dirname(full)), path.basename(full)) };
}

function cdFolder(args: string[], home: string): string | null {
	if (args.includes("-") && !args.some((word) => !word.startsWith("-"))) return null;
	return args.find((word) => !word.startsWith("-")) ?? home;
}

/**
 * Return each segment whose first readable rm target lies outside both the canonical cwd and every
 * canonical accepted temp root. Segment processing is ordered so a preceding cd can move the base.
 */
export function rmOutsideTargets(
	segments: Segment[],
	cwd: string,
	tool: string,
	{ home, tempRoots, segmentable, platform, env }: { home: string; tempRoots: string[]; segmentable: boolean; platform?: NodeJS.Platform; env?: NodeJS.ProcessEnv },
): Map<Segment, string> {
	const hits = new Map<Segment, string>();
	try {
		const powershell = tool === "powershell";
		const cwdReal = realPath(cwd);
		const roots = [cwdReal, ...tempRoots.map((root) => realPath(root))];
		let folders: Folder[] = [{ typed: path.resolve(cwd), real: cwdReal }];

		for (const segment of segments) {
			try {
				const words = shellWords(segment.text);
				const index = commandIndex(words, true);
				const command = base(words[index] ?? "");
				const args = words.slice(index + 1);
				const cdWords = powershell ? PS_CD_WORDS : CD_WORDS;

				if (POP_WORDS.has(command)) {
					folders = [];
					continue;
				}
				if (cdWords.has(command)) {
					const rawTyped = cdFolder(args, home);
					const typed = rawTyped !== null && !powershell && platform !== undefined && env !== undefined ? gitBashPath(rawTyped, { platform, env }) : rawTyped;
					if (typed === null || typed.startsWith("$") || typed.startsWith("`") || /^~[^/\\]/.test(typed)) {
						folders = [];
						continue;
					}
					const next: Folder[] = [];
					const sourceFolders = path.isAbsolute(typed) || typed.startsWith("~") ? [{ typed: path.resolve(cwd), real: cwdReal }] : folders;
					for (const folder of sourceFolders) {
						const expanded = homeExpanded(typed, home, powershell);
						if (expanded !== null) {
							const nextTyped = path.resolve(folder.typed, powershell ? expanded.replaceAll("\\", path.sep) : expanded);
							next.push({ typed: nextTyped, real: realPath(nextTyped) });
						}
					}
					folders = segmentable ? next : [...folders, ...next].filter((folder, i, all) => all.findIndex((other) => other.real === folder.real) === i);
					continue;
				}

				if ((powershell && !PS_REMOVE.has(command)) || (!powershell && command !== "rm")) continue;
				const targets = powershell ? powershellTargets(args) : bashTargets(args);
				for (const target of targets) {
					const absoluteLike = path.isAbsolute(powershell ? target.replaceAll("\\", path.sep) : target) || target.startsWith("~") || target.startsWith("$HOME") || target.startsWith("${HOME}") || (powershell && target.toLowerCase().startsWith("$env:"));
					const bases = absoluteLike ? [{ typed: path.resolve(cwd), real: cwdReal }] : folders;
					for (const folder of bases) {
						const placed = placedTarget(target, folder, home, powershell, platform, env);
						if (placed !== null && roots.every((root) => !strictWithin(root, placed.compared))) {
							hits.set(segment, placed.full);
							break;
						}
					}
					if (hits.has(segment)) break;
				}
			} catch {
				hits.set(segment, path.resolve(cwd, segment.text));
			}
		}
	} catch {
		for (const segment of segments) hits.set(segment, path.resolve(cwd || ".", segment.text));
	}
	return hits;
}
