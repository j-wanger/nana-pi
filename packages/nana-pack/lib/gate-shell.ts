/**
 * gate-shell — command segmentation and destructive-form rules for nana-gate (L2).
 *
 * NOT a shell parser. Two views of a command:
 *  - exec segments: a quote-aware split on `;` `&&` `||` `|` `&` newlines. Allow patterns
 *    exempt one exec segment at a time, never a compound.
 *  - when the command holds a construct the scanner cannot segment reliably (`$(…)`,
 *    backticks, `<(…)`, heredocs, subshell parens, `{ …; }`, `eval`, `sh -c`-style nesting,
 *    `xargs`, `source`, a line continuation, an unbalanced quote) it is `segmentable: false`:
 *    NO allow pattern applies anywhere in it, and detection also runs over a quote-UNAWARE
 *    split of the dequoted text so nested commands are still seen.
 * Every function here is total: it returns, it never throws.
 */

export interface Segment {
	text: string;
	/** true when this segment receives a pipe (`a | b` → b) */
	piped: boolean;
}

export interface Danger {
	reason: string;
	/** floor = no allow pattern can exempt it (interactive "Allow once" still can) */
	floor: boolean;
}

/** Remove quotes; resolve backslash escapes outside single quotes (`r''m` → rm, `\rm` → rm). */
export function dequote(s: string, escapes = true): string {
	let out = "";
	let q: string | null = null;
	for (let i = 0; i < s.length; i++) {
		const c = s[i];
		if (q) {
			if (c === q) q = null;
			else if (escapes && c === "\\" && q === '"' && i + 1 < s.length) out += s[++i];
			else out += c;
		} else if (c === "'" || c === '"') q = c;
		else if (escapes && c === "\\" && i + 1 < s.length) out += s[++i];
		else out += c;
	}
	return out;
}

const NESTING =
	/^(\.|source)\s|(^|[\s;&|(!])(eval|xargs|source|parallel|watch)(\s|$)|(^|[\s;&|(/\\!])(sh|bash|zsh|dash|ksh|fish|su|cmd|pwsh|powershell)(\.exe)?\s(.*\s)?[-/](\w*c|command|encodedcommand|k)(\s|$)/i;

/** Quote-aware split. Never throws. */
export function splitCommand(cmd: string): { segments: Segment[]; segmentable: boolean } {
	const segments: Segment[] = [];
	let ok = true;
	let cur = "";
	let piped = false;
	let q: string | null = null;
	const push = (nextPiped: boolean) => {
		if (cur.trim()) {
			segments.push({ text: cur.trim(), piped });
			piped = nextPiped;
		} else piped = piped || nextPiped; // `a |\n sh` is still a pipe into sh
		cur = "";
	};
	for (let i = 0; i < cmd.length; i++) {
		const c = cmd[i];
		const n = cmd[i + 1];
		if (q) {
			cur += c;
			if (c === q) q = null;
			else if (q === '"' && (c === "`" || (c === "$" && n === "("))) ok = false;
			else if (q === '"' && c === "\\" && n !== undefined) cur += cmd[++i];
			continue;
		}
		if (c === "\\") {
			if (n === "\n" || n === undefined) ok = false;
			cur += c + (n ?? "");
			i++;
			continue;
		}
		if (c === "'" || c === '"') {
			q = c;
			cur += c;
			continue;
		}
		if (c === "`" || c === "(" || c === ")" || (c === "<" && n === "<")) ok = false;
		if (c === ";" || c === "\n") push(false);
		else if ((c === "&" && n === "&") || (c === "|" && n === "|")) {
			push(false);
			i++;
		} else if (c === "|") {
			push(true);
			if (n === "&") i++;
		} else if (c === "&" && cmd[i - 1] !== ">" && cmd[i - 1] !== "<" && n !== ">") push(false);
		else cur += c;
	}
	if (q) ok = false;
	push(false);
	if (ok) {
		for (const s of segments) {
			if (/(^|\s)[{}](\s|$)/.test(s.text) || NESTING.test(dequote(s.text))) ok = false; // `{ …; }` group
		}
	}
	return { segments, segmentable: ok };
}

/** Quote-UNAWARE split of the dequoted text, on every separator incl. `(` `)` `` ` `` `{` `}`. */
export function detectionSegments(cmd: string): Segment[] {
	const d = dequote(cmd.replace(/\$\{HOME\}/g, "$HOME"));
	const parts = d.split(/(\|\||&&|\|&?|[;&\n()`{}])/);
	const out: Segment[] = [];
	let piped = false;
	for (let i = 0; i < parts.length; i++) {
		if (i % 2 === 1) {
			piped = piped || parts[i] === "|" || parts[i] === "|&";
			continue;
		}
		const text = parts[i].trim();
		if (!text) continue;
		out.push({ text, piped });
		piped = false;
	}
	return out;
}

export function tokens(text: string): string[] {
	return dequote(text.replace(/\$\{HOME\}/g, "$HOME"))
		.split(/[\s(){};|&`<>]+/)
		.filter(Boolean);
}

const base = (tok: string) =>
	(tok.split(/[/\\]/).pop() ?? "").toLowerCase().replace(/\.exe$/, "");

const WRAPPERS = new Set(
	"command builtin exec nohup time env nice ionice timeout stdbuf xargs then do else elif if while until ! sh bash zsh dash ksh fish eval cmd pwsh powershell watch caffeinate noglob nocorrect".split(
		" ",
	),
);

/** Index of the command word: skips `A=b` assignments, wrappers and their flags/numbers. */
function commandIndex(t: string[]): number {
	let i = 0;
	let afterWrapper = false;
	while (i < t.length) {
		if (/^[A-Za-z_][A-Za-z0-9_]*=/.test(t[i])) i++;
		else if (WRAPPERS.has(base(t[i]))) {
			afterWrapper = true;
			i++;
		} else if (afterWrapper && (/^-./.test(t[i]) || /^\/[a-z]$/i.test(t[i]) || /^\d+(\.\d+)?[smhd]?$/.test(t[i]))) i++;
		else break;
	}
	return i;
}

const SHELLS = new Set(
	"sh bash zsh dash ksh fish python python2 python3 perl ruby node php pwsh powershell iex invoke-expression".split(" "),
);
const INTERPRETERS = /^(python[\d.]*|node|perl|ruby|deno|bun|php)$/;
const INTERP_DELETE =
	/\b(rmtree|rmSync|rmdirSync|unlinkSync|removedirs|os\.remove|unlink|rimraf|rm_rf|rm_r|remove_tree|fs\.rm|fs\.promises\.rm)\b/i;
const ROOT_TARGET = /^(\/|\/\*|~|~\/|~\/\*|\$HOME|\$HOME\/|\$HOME\/\*|[a-z]:[\\/]?\*?)$/i;
// `git rm -r`, `docker rm -f`, `npm rm` are those tools' own subcommands, not /bin/rm.
const SUBCOMMAND_HOSTS = new Set("git docker podman npm pnpm yarn bun cargo kubectl helm conda pip brew".split(" "));
const PIPE_PREFIX = new Set("sudo doas env command exec nohup time nice stdbuf".split(" "));
const PS_REMOVE = new Set(["remove-item", "ri", "rm", "del", "erase", "rd", "rmdir"]);
const PS_REMOVE_FLAG = /^-(r|re|rec|recu|recur|recurs|recurse|fo|for|forc|force)$/i;

function rmDanger(after: string[]): Danger | null {
	const end = after.indexOf("--");
	const flags = (end < 0 ? after : after.slice(0, end)).filter((a) => a.startsWith("-") && a.length > 1);
	const targets = after.filter((a, i) => (end >= 0 && i > end) || !a.startsWith("-"));
	const recursive = flags.some((f) => /^-[^-]*r/i.test(f) || f === "--recursive");
	const long = flags.some((f) => f === "--force" || f === "--no-preserve-root");
	if (recursive && (targets.some((t) => ROOT_TARGET.test(t)) || flags.includes("--no-preserve-root")))
		return { reason: "rm recursive on / or ~ (floor)", floor: true };
	return recursive || long ? { reason: "rm recursive/forced", floor: false } : null;
}

function gitDanger(args: string[]): string | null {
	let j = 0;
	while (j < args.length && args[j].startsWith("-")) j += /^(-C|-c|--git-dir|--work-tree|--namespace)$/.test(args[j]) ? 2 : 1;
	const sub = args[j];
	const rest = args.slice(j + 1);
	const has = (re: RegExp) => rest.some((a) => re.test(a));
	switch (sub) {
		case "push":
			return has(/^--force|^--mirror$|^\+|^-[a-zA-Z]*f/) ? "git push --force / +refspec" : null;
		case "reset":
			return rest.includes("--hard") ? "git reset --hard" : null;
		case "clean":
			return has(/^--force$|^-[a-zA-Z]*f/) ? "git clean --force" : null;
		case "checkout":
			return has(/^(\.|:\/|\*|--force|-f)$/) ? "git checkout discarding the worktree" : null;
		case "restore":
			return has(/^(\.|:\/|\*)$/) && !(has(/^(--staged|-S)$/) && !has(/^(--worktree|-W)$/)) ? "git restore ." : null;
		case "branch":
			return has(/^-[a-zA-Z]*D/) || (rest.includes("--delete") && rest.includes("--force")) ? "git branch -D" : null;
		case "stash":
			return rest[0] === "drop" || rest[0] === "clear" ? `git stash ${rest[0]}` : null;
		case "filter-branch":
		case "filter-repo":
			return `git ${sub}`;
		default:
			return null;
	}
}

/** Built-in destructive forms for ONE segment. Never throws. */
export function segmentDanger(seg: Segment): Danger | null {
	try {
		const t = tokens(seg.text);
		if (!t.length) return null;
		// rm is matched anywhere in the segment (xargs rm, find -exec rm, perl -e "…rm -rf…"):
		// a string argument that reads as `rm -rf` is gated too (see the corpus: grep "rm -rf").
		for (let i = 0; i < t.length; i++) {
			if (base(t[i]) === "rm" && !(i > 0 && SUBCOMMAND_HOSTS.has(base(t[i - 1])))) {
				const d = rmDanger(t.slice(i + 1));
				if (d) return d;
			}
		}
		const ci = commandIndex(t);
		const cmd = base(t[ci] ?? "");
		const args = t.slice(ci + 1);
		const hit = (reason: string, floor = false): Danger => ({ reason, floor });
		if (seg.piped) {
			// the first word that is not an assignment / sudo / env-style prefix or a flag
			let i = 0;
			while (i < t.length && (/^[A-Za-z_][A-Za-z0-9_]*=|^-/.test(t[i]) || PIPE_PREFIX.has(base(t[i])))) i++;
			const sh = base(t[i] ?? "");
			if (SHELLS.has(sh) && t.slice(i + 1).every((a) => a.startsWith("-"))) return hit(`pipe to ${sh} (floor)`, true);
		}
		// `x=rm; $x -rf ~`: the variable's value is invisible; a root target with -r is enough.
		if (cmd.startsWith("$") && rmDanger(args)?.floor) return hit(`${cmd} -r on / or ~ (floor)`, true);
		if (["sudo", "doas", "su", "pkexec", "runas"].includes(cmd)) return hit(cmd);
		if (["shutdown", "reboot", "halt", "poweroff", "stop-computer", "restart-computer"].includes(cmd)) return hit(cmd);
		if (cmd.startsWith("mkfs")) return hit("mkfs (floor)", true);
		if (cmd === "dd" && args.some((a) => /^of=\/dev\//i.test(a))) return hit("dd of=/dev/ (floor)", true);
		if (cmd === "diskutil" && /^(erase|zero|secureerase|partitiondisk|reformat)/i.test(args[0] ?? ""))
			return hit("diskutil erase (floor)", true);
		if (["format-volume", "clear-disk", "initialize-disk"].includes(cmd)) return hit(`${cmd} (floor)`, true);
		if (cmd === "format" && /^[a-z]:$/i.test(args[0] ?? "")) return hit("format <drive>:");
		if (cmd === "iex" || cmd === "invoke-expression") return hit(cmd);
		if (cmd === "git") {
			const g = gitDanger(args);
			if (g) return hit(g);
		}
		if (cmd === "find") {
			if (args.includes("-delete")) return hit("find -delete");
			if (args.some((a, i) => /^-(exec|execdir|ok|okdir)$/.test(a) && ["rm", "shred", "unlink", "rmdir"].includes(base(args[i + 1] ?? ""))))
				return hit("find -exec rm");
		}
		if (cmd === "rsync" && args.some((a) => /^--(delete|remove-source-files)/.test(a))) return hit("rsync --delete");
		if (["truncate", "shred", "rimraf", "clear-content", "clc", "wipefs"].includes(cmd)) return hit(cmd);
		if ((cmd === "chmod" || cmd === "chown") && args.some((a) => /^0?777$|^(a|ugo)\+rwx$/i.test(a))) return hit(`${cmd} 777`);
		if (PS_REMOVE.has(cmd) && (args.some((a) => PS_REMOVE_FLAG.test(a)) || seg.piped)) return hit(`${cmd} -Recurse/-Force`);
		if ((cmd === "rd" || cmd === "rmdir") && args.some((a) => /^\/s$/i.test(a))) return hit(`${cmd} /s`);
		if ((cmd === "del" || cmd === "erase") && args.some((a) => /^\/[fsq]$/i.test(a))) return hit(`${cmd} /f /s /q`);
		if (cmd === "mv" && args.at(-1) === "/dev/null") return hit("mv to /dev/null");
		if (INTERPRETERS.test(cmd) && INTERP_DELETE.test(dequote(seg.text))) return hit(`${cmd} deleting files`);
		return null;
	} catch {
		return { reason: "unparseable segment", floor: false };
	}
}
