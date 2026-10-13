/**
 * @module packages/nana-setup/lib/settings.mjs
 * @purpose Migrate the exact retired context hook and merge active nana hooks while preserving foreign entries, in shell form on POSIX and exec form on win32.
 * @inputs a parsed settings object (the caller reads and writes the file); { hooksDir, repoRoot, platform };
 *  the command strings and args already in settings.hooks
 * @outputs shq() single-quoted paths; tokenize() argv or null; commandInvokes() boolean; entryInvokes() boolean;
 *  desiredHooks(); hookTargets(); knowledgeHookHealthy(); mergeRepoHooks(); validateShape(); hasHook();
 *  mergeHooks() { settings (mutated in place), added labels, changed }; removeRetiredContextHook();
 *  removeInstallerHooks(); installerTarget(); serialize() JSON text; WIN_VERIFIER_MATCHER; CLAUDE_CODE_EXEC_FLOOR
 * @effects disk (reads only)
 * @errors none thrown — validateShape returns the reason the shape cannot be extended, and any
 *  command that is unparseable or carries a shell operator reads as NOT installed
 */
import * as fs from "node:fs";
import * as path from "node:path";

// The Claude Code settings.json merge. Pure functions: the file is read and written by the
// caller, so the merge itself is trivially testable and can never half-write.
//
// Rules (they are the whole point of this file):
//   - a hook we want is identified by the INTERPRETER plus the script as a PATH COMPONENT with a
//     boundary after it — never by a loose substring, which counted `echo nana-objective.sh.disabled`
//     as installed (sol r1);
//   - present means untouched — no rewrite, no reorder, no dedupe of anyone else's entries;
//   - a missing hook is APPENDED to the first group of that event that has no `matcher`
//     (foreign matcher-scoped groups are left alone), or a new group is added;
//   - on POSIX every path we WRITE is single-quoted, so a home or clone with a space in it still
//     runs (R-319); on win32 every hook entry is written in EXEC form instead — `command: "node"`
//     plus an `args` array Claude Code spawns directly with no shell, so no path ever needs
//     quoting there and no character is refused (R-1050). POSIX and win32 read each other's forms
//     only where this file says so (R-1061 keeps the POSIX read side identical to `main`).

/** POSIX single-quoting: the only shell-safe way to embed an arbitrary path in a command. */
export function shq(p) {
	return `'${String(p).replace(/'/g, `'\\''`)}'`;
}

/**
 * Tokenize a shell command the way a shell would, enough to read its argv: single quotes are
 * literal, double quotes honour backslash escapes, a bare backslash escapes the next character.
 * Returns null when the quoting is unbalanced OR when the command contains a shell operator,
 * redirection or substitution outside quotes — those are not plain invocations, so nothing
 * matches and we add our own entry rather than assume someone else's command is ours.
 */
export function tokenize(command) {
	if (typeof command !== "string") return null;
	const out = [];
	let cur = "";
	let has = false;
	let quote = null;
	for (let i = 0; i < command.length; i++) {
		const c = command[i];
		if (quote === "'") {
			if (c === "'") quote = null;
			else cur += c;
			continue;
		}
		if (quote === '"') {
			if (c === "\\" && i + 1 < command.length && ['"', "\\", "$", "`"].includes(command[i + 1])) cur += command[++i];
			else if (c === '"') quote = null;
			else cur += c;
			continue;
		}
		if (c === "'" || c === '"') {
			quote = c;
			has = true;
			continue;
		}
		if (c === "\\" && i + 1 < command.length) {
			cur += command[++i];
			has = true;
			continue;
		}
		if (/\s/.test(c)) {
			if (has || cur) out.push(cur);
			cur = "";
			has = false;
			continue;
		}
		// An operator or redirection outside quotes means this is not a plain invocation —
		// a pipeline, a list, a redirect or a substitution. `bash x.sh &&` is not even valid
		// shell, and doctor must not report it as an installed hook (sol r3). `$` alone stays
		// allowed (plain variable expansion); `$(` does not.
		if ("&|;<>`".includes(c) || (c === "$" && command[i + 1] === "(")) return null;
		cur += c;
		has = true;
	}
	if (quote) return null;
	if (has || cur) out.push(cur);
	return out;
}

const ENV_ASSIGN = /^[A-Za-z_][A-Za-z0-9_]*=/;
const base = (p) => p.split("/").pop();

/**
 * Does argv actually invoke `script` through one of `interpreters`, with `argv[i]` the
 * interpreter, `argv[i+1]` a path ending in `/<script>`, and every later `spec.args` word
 * matching in order? `skipEnv` drops leading `VAR=value` words first (a shell reads them as
 * environment assignments; exec form has no shell to read one, so callers reading exec form
 * never set it). Returns the matched target path, or null.
 */
function targetFromArgv(argv, { interpreters, script, args = [] }, skipEnv) {
	if (!argv) return null;
	let i = 0;
	if (skipEnv) while (i < argv.length && ENV_ASSIGN.test(argv[i])) i++;
	const cmd = argv[i];
	const target = argv[i + 1];
	if (typeof cmd !== "string" || typeof target !== "string") return null;
	if (!interpreters.includes(base(cmd))) return null;
	if (!target.endsWith(`/${script}`)) return null;
	if (!args.every((a, n) => argv[i + 2 + n] === a)) return null;
	return target;
}

function installerKnowledgeTarget(command) {
	const argv = tokenize(command);
	if (!argv || argv.length !== 4 || argv[0] !== "NODE_NO_WARNINGS=1" || argv[1] !== "node" || argv[3] !== "hook") return null;
	const target = argv[2];
	if (!path.isAbsolute(target) || !target.endsWith("/packages/nana-knowledge/bin/nana-knowledge.ts")) return null;
	return command === `NODE_NO_WARNINGS=1 node ${shq(target)} hook` ? target : null;
}

/**
 * Does `command` actually EXECUTE `script` through one of `interpreters`?
 *
 * Parsed, not pattern-matched (sol r2): leading `VAR=value` assignments are dropped, then argv[0]
 * must BE the interpreter and argv[1] must be a path ending in `/<script>` — so
 * `echo bash /tmp/nana-objective.sh` is not an invocation, while
 * `NODE_NO_WARNINGS=1 node '/x y/nana-knowledge.ts' hook` is. Extra argv words must match `args`.
 * Conservative by design: a form we cannot parse reads as NOT installed, which adds a correct
 * entry instead of claiming a machine is healthy.
 */
export function commandInvokes(command, spec) {
	return targetFromArgv(tokenize(command), spec, true) !== null;
}

/**
 * Does `hook` (a settings entry OBJECT) invoke `script`, reading EITHER form a Claude Code hook
 * can take? Shell form (a `command` string) is read by commandInvokes, exactly as on POSIX, on
 * every platform. Exec form (a `command` plus an `args` array) is read only on win32 — Claude
 * Code never spawns it through a shell there, so the argv is `[command, ...args]` directly, with
 * no `VAR=value` word to skip (there is no shell to read one as an assignment): a `command` of
 * `NODE_NO_WARNINGS=1` is not `node`.
 *
 * On win32, a non-array `args` or a non-string element reads as NOT installed (the conservative
 * rule `commandInvokes` already follows). On win32 without `args`, and on every other platform,
 * this calls commandInvokes(hook.command, spec) — so POSIX reads every entry by `command` alone,
 * exactly as `main` does (R-1061); a Windows settings fragment carrying `args` never reads as
 * installed there.
 */
export function entryInvokes(hook, spec, platform) {
	if (platform === "win32" && hook && typeof hook === "object" && "args" in hook && hook.args !== undefined) {
		if (!Array.isArray(hook.args) || !hook.args.every((a) => typeof a === "string")) return false;
		return targetFromArgv([hook.command, ...hook.args], spec, false) !== null;
	}
	return commandInvokes(hook?.command, spec);
}

/** The win32 verifier-pipe matcher. Contract value: hooks#powershell and hooks#matcher-patterns,
 *  read 2026-10-12 — a hit from either the Bash tool or the PowerShell tool must fire it, and the
 *  docs name an exact-name list rather than a regular expression. One test (R-1053) pins it by name. */
export const WIN_VERIFIER_MATCHER = "Bash|PowerShell";
/** The Claude Code version that added hook `args` (exec form), so a win32 hook entry without a
 *  shell works at all. Contract value: the 2.1.139 changelog entry, read 2026-10-12. Doctor's
 *  floor note (R-1060) and the Support lines' canonical sentence (R-684) read it by name — one
 *  test naming R-1060 pins it. */
export const CLAUDE_CODE_EXEC_FLOOR = "2.1.139";

/**
 * The five active hook entries the nana experience needs, in the order they are added.
 *
 * When `platform` is absent or not "win32", the output is byte-identical to `main`: every hook
 * runs in shell form from `hooksDir` (the live symlinks under `~/.claude/hooks`), paths are
 * single-quoted, and the verifier matcher is plain `Bash`. The callers that pass no platform keep
 * this POSIX output: `uninstall.mjs`, `migrateLegacyHooks`, and the tests that call it bare.
 *
 * On win32 every entry is written in EXEC form instead — `command: "node"` plus an `args` array,
 * which Claude Code spawns directly with no shell (hooks#exec-form-and-shell-form). There is
 * never a usable symlink into `~/.claude/hooks` on this platform (stepHooks skips it), so every
 * win32 script path names the CHECKOUT's own copy directly: the four hooks under
 * `<repoRoot>/packages/nana-setup/claude/hooks/`, the knowledge pull under
 * `<repoRoot>/packages/nana-knowledge/bin/`. No path is quoted or escaped — exec form passes each
 * `args` element exactly as written — and the knowledge entry's `args` carries its `hook`
 * subcommand as a second element rather than a trailing shell word. The verifier matcher on win32
 * is WIN_VERIFIER_MATCHER ("Bash|PowerShell"), because Windows may route shell commands through
 * either the Bash tool or the PowerShell tool.
 */
export function desiredHooks({ hooksDir, repoRoot, platform }) {
	const win32 = platform === "win32";
	const hookTarget = (name) => (win32 ? `${repoRoot}/packages/nana-setup/claude/hooks/${name}` : `${hooksDir}/${name}`);
	const nodeHook = (name, statusMessage) => {
		const target = hookTarget(name);
		return {
			spec: { interpreters: ["node"], script: name },
			entry: win32
				? { type: "command", command: "node", args: [target], timeout: 5, statusMessage }
				: { type: "command", command: `node ${shq(target)}`, timeout: 5, statusMessage },
		};
	};
	const objective = nodeHook("nana-objective.mjs", "nana: objective + current priority");
	const adoption = nodeHook("nana-adoption.mjs", "nana: unadopted repositories");
	const shared = nodeHook("nana-shared-memory.mjs", "nana: shared memory index");
	const verifierPipeTarget = hookTarget("verifier-pipe.mjs");
	const verifierPipeSpec = { interpreters: ["node"], script: "verifier-pipe.mjs" };
	const verifierPipeEntry = win32
		? { type: "command", command: "node", args: [verifierPipeTarget], timeout: 5, statusMessage: "nana: verifier pipe" }
		: { type: "command", command: `node ${shq(verifierPipeTarget)}`, timeout: 5, statusMessage: "nana: verifier pipe" };
	const knowledgeCli = `${repoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts`;
	const knowledgeSpec = { interpreters: ["node"], script: "nana-knowledge.ts", args: ["hook"] };
	const knowledgeEntry = win32
		? { type: "command", command: "node", args: [knowledgeCli, "hook"], timeout: 5, statusMessage: "nana: knowledge pull" }
		: { type: "command", command: `NODE_NO_WARNINGS=1 node ${shq(knowledgeCli)} hook`, timeout: 5, statusMessage: "nana: knowledge pull" };
	return [
		{ event: "SessionStart", label: "SessionStart objective", marker: "nana-objective.mjs", spec: objective.spec, entry: objective.entry },
		{ event: "SessionStart", label: "SessionStart adoption", marker: "nana-adoption.mjs", spec: adoption.spec, entry: adoption.entry },
		{ event: "SessionStart", label: "SessionStart shared-memory", marker: "nana-shared-memory.mjs", spec: shared.spec, entry: shared.entry },
		{
			event: "PreToolUse",
			matcher: win32 ? WIN_VERIFIER_MATCHER : "Bash",
			label: "PreToolUse verifier pipe",
			marker: "verifier-pipe.mjs",
			spec: verifierPipeSpec,
			entry: verifierPipeEntry,
		},
		{ event: "UserPromptSubmit", label: "UserPromptSubmit knowledge pull", marker: "nana-knowledge.ts hook", spec: knowledgeSpec, entry: knowledgeEntry },
	];
}

/**
 * Shape validation. Valid JSON is not enough: `{"hooks":"disabled"}` parses, and the merge would
 * then throw AFTER hooks and rules had already been installed (sol r1). Returns an error string,
 * or null when the shape is one the merge can safely extend.
 */
export function validateShape(settings) {
	if (settings === null || typeof settings !== "object" || Array.isArray(settings)) return "top level is not an object";
	const hooks = settings.hooks;
	if (hooks === undefined) return null;
	if (hooks === null || typeof hooks !== "object" || Array.isArray(hooks)) return "`hooks` is not an object";
	for (const [event, groups] of Object.entries(hooks)) {
		if (!Array.isArray(groups)) return `hooks.${event} is not an array`;
		for (const [i, g] of groups.entries()) {
			if (g === null || typeof g !== "object" || Array.isArray(g)) return `hooks.${event}[${i}] is not an object`;
			if (g.hooks !== undefined && !Array.isArray(g.hooks)) return `hooks.${event}[${i}].hooks is not an array`;
		}
	}
	return null;
}

export function hasHook(settings, event, spec, matcher, platform) {
	const groups = settings?.hooks?.[event];
	if (!Array.isArray(groups)) return false;
	return groups.some((g) => g?.matcher === matcher && Array.isArray(g?.hooks) && g.hooks.some((h) => entryInvokes(h, spec, platform)));
}

/**
 * Every absolute script path an entry under `event` invokes, in ANY group (matcher ignored —
 * this is a health signal across the whole event, the way knowledgeHookHealthy has always read
 * it). Exec form is read only on win32, exactly like entryInvokes; everywhere else, and for a
 * win32 entry carrying no `args`, the shell-form `command` is tokenized exactly as commandInvokes
 * reads it.
 */
export function hookTargets(settings, event, spec, platform) {
	const groups = settings?.hooks?.[event];
	const out = [];
	if (!Array.isArray(groups)) return out;
	for (const group of groups) {
		if (!Array.isArray(group?.hooks)) continue;
		for (const hook of group.hooks) {
			let target = null;
			if (platform === "win32" && hook && typeof hook === "object" && "args" in hook && hook.args !== undefined) {
				if (Array.isArray(hook.args) && hook.args.every((a) => typeof a === "string")) {
					target = targetFromArgv([hook.command, ...hook.args], spec, false);
				}
			} else {
				target = targetFromArgv(tokenize(hook?.command), spec, true);
			}
			if (target) out.push(target);
		}
	}
	return out;
}

/** Remove only the exact installer-owned context hook object. */
export function removeRetiredContextHook(settings, { hooksDir } = {}) {
	const groups = settings?.hooks?.UserPromptSubmit;
	if (!Array.isArray(groups)) return false;
	let changed = false;
	for (const group of groups) {
		if (!Array.isArray(group?.hooks)) continue;
		const kept = group.hooks.filter((hook) => {
			const exact = hook && Object.keys(hook).length === 2 && hook.type === "command";
			const isRetired = exact && (hook.command === "bash ~/.claude/hooks/context-size-check.sh" ||
				(hooksDir && hook.command === `bash '${hooksDir}/context-size-check.sh'`));
			if (isRetired) changed = true;
			return !isRetired;
		});
		group.hooks = kept;
	}
	return changed;
}

function canonical(value) {
	if (Array.isArray(value)) return value.map(canonical);
	if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
	return value;
}

/** Remove only objects exactly equal to a desired hook entry, preserving all unrelated structure.
 *  `platform` only forwards to desiredHooks: uninstall itself refuses on win32 before this ever
 *  runs there (uninstall.mjs), so this pure case exists for a function that is already tested. */
export function removeInstallerHooks(settings, { hooksDir, repoRoot, platform } = {}) {
	const wanted = desiredHooks({ hooksDir, repoRoot, platform });
	const desired = wanted.map((item) => canonical(item.entry));
	const removed = [];
	const hooks = settings?.hooks;
	if (!hooks || typeof hooks !== "object" || Array.isArray(hooks)) return removed;
	for (const [event, groups] of Object.entries(hooks)) {
		if (!Array.isArray(groups)) continue;
		let emptiedByRemoval = false;
		for (let gi = groups.length - 1; gi >= 0; gi--) {
			const group = groups[gi];
			if (!Array.isArray(group?.hooks) || group.hooks.length === 0) continue;
			const matching = wanted.filter((item) => item.event === event && (item.matcher === undefined ? group.matcher === undefined : group.matcher === item.matcher));
			if (!matching.length) continue;
			const oldLength = group.hooks.length;
			group.hooks = group.hooks.filter((entry) => {
				const index = matching.findIndex((item) => JSON.stringify(canonical(item.entry)) === JSON.stringify(canonical(entry)));
				if (index < 0) return true;
				removed.push(matching[index].label);
				return false;
			});
			if (oldLength > 0 && group.hooks.length === 0) {
				groups.splice(gi, 1);
				emptiedByRemoval = true;
			}
		}
		if (groups.length === 0 && emptiedByRemoval) delete hooks[event];
	}
	if (Object.keys(hooks).length === 0 && removed.length > 0) delete settings.hooks;
	return removed;
}

/**
 * Does `hook` (a settings entry object) look like an installer-written entry for `wanted` (one
 * desiredHooks() item), apart from the checkout path it names? Returns { target, form } or null.
 *
 * Accepted forms:
 *  - "posix" — the POSIX knowledge form, read identically on every platform (R-1061): today's
 *    `NODE_NO_WARNINGS=1 node '<path>' hook`. On win32 this is accepted only when the entry
 *    carries no `args` — an entry with `args` is read as exec form everywhere else, so the
 *    repair must agree (without this, an entry carrying `args` would be shell form to the repair
 *    but exec form to `entryInvokes` and to Claude Code).
 *  - "win32-legacy" — win32 only, the knowledge form today's code actually writes there:
 *    `node '<path>' hook`, no `args`.
 *  - "win32-exec" — win32 only, the R-1050 exec form: `command` exactly `node`, `args` exactly
 *    the installer's length, `args[0]` absolute and ending in the entry's own REPOSITORY suffix
 *    (`/packages/nana-setup/claude/hooks/<name>` or `/packages/nana-knowledge/bin/nana-knowledge.ts`,
 *    compared across `/` and `\`) — not merely the script's basename, which a customized target
 *    outside the checkout (`C:/custom/nana-objective.mjs`) also satisfies (final review r1 astra
 *    MUST 3) — any later element equal to the installer's.
 * Every other shape — a hand-edited variant, an extra `args` element, a missing or different
 * status message, a relative path — is rejected (R-1061, R-653, R-923).
 */
export function installerTarget(hook, wanted, platform) {
	if (!hook || typeof hook !== "object" || typeof hook.command !== "string") return null;
	// An entry is the installer's own only when its statusMessage EQUALS the wanted row's,
	// exactly as main's own gate reads it: `mergeKnowledgeHook` skips any entry whose
	// statusMessage is not "nana: knowledge pull", and the legacy path requires the exact key
	// set `command,statusMessage,timeout,type`. A missing statusMessage is not silence on the
	// question — it is a different value, same as any other mismatch — because every entry the
	// installer has ever written carries its own statusMessage (R-1061, R-653, R-923).
	if (hook.statusMessage !== wanted.entry.statusMessage) return null;
	const win32 = platform === "win32";
	const hasArgs = "args" in hook && hook.args !== undefined;
	const isKnowledge = wanted.marker === "nana-knowledge.ts hook";

	if (isKnowledge && !(win32 && hasArgs)) {
		const target = installerKnowledgeTarget(hook.command);
		if (target) return { target, form: "posix" };
	}
	if (!win32) return null;

	// A win32-shaped target is checked for absoluteness with win32.isAbsolute, not the
	// platform-dependent path.isAbsolute: a Windows path such as `C:\…` is what this form
	// actually carries, and that stays absolute even when the repair is exercised, forced, on a
	// POSIX host (CHANGE.md §5: POSIX path.isAbsolute rejects a `C:\` form).
	if (isKnowledge && !hasArgs) {
		const argv = tokenize(hook.command);
		if (argv && argv.length === 3 && argv[0] === "node" && argv[2] === "hook") {
			const target = argv[1];
			if (path.win32.isAbsolute(target) && target.endsWith("/packages/nana-knowledge/bin/nana-knowledge.ts") && hook.command === `node ${shq(target)} hook`) {
				return { target, form: "win32-legacy" };
			}
		}
		return null;
	}

	if (!hasArgs || hook.command !== "node" || !Array.isArray(hook.args) || !hook.args.every((a) => typeof a === "string")) return null;
	const expectedExtra = wanted.spec.args ?? [];
	if (hook.args.length !== 1 + expectedExtra.length) return null;
	const target = targetFromArgv([hook.command, ...hook.args], wanted.spec, false);
	if (!target || !path.win32.isAbsolute(target)) return null;
	// Ownership by the COMPLETE repository suffix, not merely the script's basename —
	// targetFromArgv only requires `endsWith('/' + script)`, which a customized target outside
	// the checkout (`C:/custom/nana-objective.mjs`) also satisfies, and the repair must not claim
	// that entry as its own (final review r1 astra MUST 3, CHANGE §3). Compared with both
	// separators normalised to `/`, since a hand-written entry may use backslashes throughout.
	const repoSuffix = isKnowledge ? "/packages/nana-knowledge/bin/nana-knowledge.ts" : `/packages/nana-setup/claude/hooks/${wanted.spec.script}`;
	return target.replace(/\\/g, "/").endsWith(repoSuffix) ? { target, form: "win32-exec" } : null;
}

/**
 * Replace every stale or (on win32) wrongly-shaped repo-anchored entry in place, returning
 * { [label]: { found, replaced } } for each one R-1056 names: the knowledge pull on every
 * platform, and all five entries on win32.
 *
 * It scans entries under that entry's event; where the entry has a matcher, it scans only groups
 * with that matcher, otherwise every group (as the knowledge scan always has). The timeout gate
 * stays (an entry must carry `timeout: 5` to be read as ours at all) — a hand-written entry that
 * happens to share a script name but carries its own timeout is never touched. A match is
 * replaced when its target is missing or outside the checkout (R-1056); on win32 it is ALSO
 * replaced when it resolves fine but its form is not exec form (R-1059), because a form upgrade
 * is still owed even to an entry that already works. A POSIX replacement changes `command` only,
 * so the replaced object stays byte-identical in shape to today's; a win32 replacement sets
 * `command: "node"` and `args`. Every other key the entry carried is kept, exactly as today.
 */
export function mergeRepoHooks(settings, { repoRoot, wanted, platform }) {
	const win32 = platform === "win32";
	const repoAnchored = wanted.filter((w) => win32 || w.marker === "nana-knowledge.ts hook");
	const result = {};
	for (const w of repoAnchored) {
		const groups = settings?.hooks?.[w.event];
		const found = [];
		if (Array.isArray(groups)) {
			for (const group of groups) {
				// A row with no required matcher scans EVERY group — main's own knowledge scan
				// always has (CHANGE §3 "otherwise every group") — not only matcher-less ones; the
				// ternary this replaced skipped matcher-scoped groups entirely, so an
				// installer-shaped stale entry living under one (e.g. a foreign `matcher: "*"`
				// group) was never found and got a duplicate appended beside it (final review r1
				// sol MUST 2, astra MUST 2).
				const matcherOk = w.matcher === undefined || group?.matcher === w.matcher;
				if (!matcherOk || !Array.isArray(group?.hooks)) continue;
				for (let i = 0; i < group.hooks.length; i++) {
					const hook = group.hooks[i];
					if (hook?.timeout !== 5) continue;
					const match = installerTarget(hook, w, platform);
					if (!match) continue;
					// installerTarget already guarantees match.target is absolute, by the
					// form-appropriate rule (win32.isAbsolute for the two win32-only forms) —
					// nothing left to re-check here but whether it resolves into the checkout.
					let healthy = false;
					try {
						const real = fs.realpathSync(match.target);
						const root = fs.realpathSync(repoRoot);
						healthy = real === root || real.startsWith(root + path.sep);
					} catch { /* missing target */ }
					found.push({ group, index: i, healthy, form: match.form });
				}
			}
		}
		let replaced = false;
		for (const item of found) {
			if (item.healthy && (!win32 || item.form === "win32-exec")) continue;
			const current = item.group.hooks[item.index];
			item.group.hooks[item.index] = win32
				? { ...current, command: w.entry.command, args: w.entry.args }
				: { ...current, command: w.entry.command };
			replaced = true;
		}
		result[w.label] = { found: found.length > 0, replaced };
	}
	return result;
}

export function knowledgeHookHealthy(settings, repoRoot, platform) {
	const targets = hookTargets(settings, "UserPromptSubmit", { interpreters: ["node"], script: "nana-knowledge.ts", args: ["hook"] }, platform);
	if (!targets.length) return false;
	const isAbsolute = platform === "win32" ? path.win32.isAbsolute : path.isAbsolute;
	return targets.every((target) => {
		try {
			const real = fs.realpathSync(target);
			const root = fs.realpathSync(repoRoot);
			return isAbsolute(target) && (real === root || real.startsWith(root + path.sep));
		} catch {
			return false;
		}
	});
}

const LEGACY_HOOKS = [
	{ old: "nana-objective.sh", next: "nana-objective.mjs", message: "nana: objective + current priority" },
	{ old: "nana-shared-memory.sh", next: "nana-shared-memory.mjs", message: "nana: shared memory index" },
	{ old: "nana-adoption.sh", next: "nana-adoption.mjs", message: "nana: unadopted repositories" },
];

/** Replace only exact installer-owned legacy SessionStart commands, retaining array positions. */
export function migrateLegacyHooks(settings, { hooksDir, claudeHome }) {
	let changed = false;
	const homeBase = path.basename(claudeHome) === ".claude" ? path.dirname(claudeHome) : null;
	for (const group of settings?.hooks?.SessionStart ?? []) {
		if (!Array.isArray(group?.hooks)) continue;
		for (const hook of group.hooks) {
			if (!hook || Object.keys(hook).sort().join(",") !== "command,statusMessage,timeout,type" || hook.type !== "command" || hook.timeout !== 5) continue;
			const legacy = LEGACY_HOOKS.find((item) => hook.statusMessage === item.message);
			if (!legacy) continue;
			const direct = `bash ${shq(`${hooksDir}/${legacy.old}`)}`;
			const tilde = homeBase ? `bash ~/.claude/hooks/${legacy.old}` : null;
			if (hook.command !== direct && hook.command !== tilde) continue;
			const wanted = desiredHooks({ hooksDir, repoRoot: "" }).find((entry) => entry.marker === legacy.next);
			if (!wanted) continue;
			hook.command = wanted.entry.command;
			changed = true;
		}
	}
	return changed;
}

export function mergeHooks(settings, wanted, platform) {
	const added = [];
	for (const w of wanted) {
		if (hasHook(settings, w.event, w.spec, w.matcher, platform)) continue;
		settings.hooks ??= {};
		settings.hooks[w.event] ??= [];
		const groups = settings.hooks[w.event];
		let group = groups.find((g) => g && typeof g === "object" && g.matcher === w.matcher && Array.isArray(g.hooks));
		if (!group) {
			group = { ...(w.matcher ? { matcher: w.matcher } : {}), hooks: [] };
			groups.push(group);
		}
		group.hooks.push(w.entry);
		added.push(w.label);
	}
	return { settings, added, changed: added.length > 0 };
}

export function serialize(settings) {
	return JSON.stringify(settings, null, 2) + "\n";
}
