/**
 * @module packages/nana-setup/lib/settings.mjs
 * @purpose Migrate the exact retired context hook and merge active nana hooks while preserving foreign entries, in shell form on POSIX and exec form on win32.
 * @inputs a parsed settings object (the caller reads and writes the file); { hooksDir, repoRoot, platform };
 *  the command strings and args already in settings.hooks
 * @outputs shq() single-quoted paths; tokenize() argv or null; commandInvokes() boolean; entryInvokes() boolean;
 *  desiredHooks(); hookTargets(); mergeRepoHooks(); validateShape(); hasHook();
 *  mergeHooks() { settings (mutated in place), added labels, changed }; removeRetiredContextHook();
 *  retiredHookCommands(); removeInstallerHooks(); installerTarget(); retiredKnowledgeHook(); isRetiredKnowledgeHook(); removeRetiredKnowledgeHook(); isRetiredVerifierHook(); removeRetiredVerifierHook(); retiredMemoryHook(); isRetiredMemoryHook(); removeRetiredMemoryHook(); removeRetiredHook(); serialize() JSON text; CLAUDE_CODE_EXEC_FLOOR
 * @effects disk (reads only)
 * @errors none thrown — validateShape returns the reason the shape cannot be extended, and any
 *  command that is unparseable or carries a shell operator reads as NOT installed
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { realPath } from "../../nana-pack/lib/real-path.mjs";
import { MEMORY_END_ENTRY, MEMORY_END_TIMEOUT_SECONDS } from './memory-end-config.mjs';

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
//   - retired verifier entries are removed only in their complete released shapes;
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
 * single-quoted. The callers that pass no platform keep
 * this POSIX output: `uninstall.mjs`, `migrateLegacyHooks`, and the tests that call it bare.
 *
 * On win32 every entry is written in EXEC form instead — `command: "node"` plus an `args` array,
 * which Claude Code spawns directly with no shell (hooks#exec-form-and-shell-form). There is
 * never a usable symlink into `~/.claude/hooks` on this platform (stepHooks skips it), so every
 * win32 script path names the CHECKOUT's own copy directly: the five hooks under
 * `<repoRoot>/packages/nana-setup/claude/hooks/`. No path is quoted or escaped — exec form passes each
 * `args` element exactly as written. The retired knowledge entry is matched separately, never written.
 * The retired verifier is matched separately and never installed.
 */
export function desiredHooks({ hooksDir, repoRoot, platform }) {
	const win32 = platform === "win32";
	const hookTarget = (name) => (win32 ? `${repoRoot}/packages/nana-setup/claude/hooks/${name}` : `${hooksDir}/${name}`);
	const nodeHook = (name, statusMessage, timeout = 5) => {
		const target = hookTarget(name);
		return {
			spec: { interpreters: ["node"], script: name },
			entry: win32
				? { type: "command", command: "node", args: [target], timeout, statusMessage }
				: { type: "command", command: `node ${shq(target)}`, timeout, statusMessage },
		};
	};
	const objective = nodeHook("nana-objective.mjs", "nana: objective + current priority");
	const adoption = nodeHook("nana-adoption.mjs", "nana: unadopted repositories");
	const shared = nodeHook("nana-shared-memory.mjs", "nana: shared memory index");
	const rosterNotice = nodeHook("nana-roster-notice.mjs", "nana: roster notice");
	return [
		{ event: "SessionStart", label: "SessionStart objective", marker: "nana-objective.mjs", spec: objective.spec, entry: objective.entry },
		{ event: "SessionStart", label: "SessionStart adoption", marker: "nana-adoption.mjs", spec: adoption.spec, entry: adoption.entry },
		{ event: "SessionStart", label: "SessionStart shared-memory", marker: "nana-shared-memory.mjs", spec: shared.spec, entry: shared.entry },
		{ event: "SessionStart", label: "SessionStart roster notice", marker: "nana-roster-notice.mjs", spec: rosterNotice.spec, entry: rosterNotice.entry },
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
 * this is a health signal across the whole event). Exec form is read only on win32, exactly
 * like entryInvokes; everywhere else, and for a
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

/** Historical entry descriptor, retained for ownership matching and uninstall, never installation. */
export function retiredKnowledgeHook({ repoRoot = "", platform } = {}) {
	const target = `${repoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts`;
	return {
		event: "UserPromptSubmit", label: "UserPromptSubmit knowledge pull", marker: "nana-knowledge.ts hook",
		spec: { interpreters: ["node"], script: "nana-knowledge.ts", args: ["hook"] },
		entry: { type: "command", ...(platform === "win32" ? { command: "node", args: [target, "hook"] } : { command: `NODE_NO_WARNINGS=1 node ${shq(target)} hook` }), timeout: 5, statusMessage: "nana: knowledge pull" },
	};
}

/** Match only complete installer-shaped entries; customized objects remain foreign. */
export function isRetiredKnowledgeHook(hook) {
	if (!hook || typeof hook !== "object" || hook.type !== "command" || hook.timeout !== 5) return false;
	const keys = Object.keys(hook).sort().join(",");
	if (keys !== "command,statusMessage,timeout,type" && keys !== "args,command,statusMessage,timeout,type") return false;
	const wanted = retiredKnowledgeHook();
	// An args key belongs only to the released exec form. Never reinterpret a customized
	// shell-with-args entry through the POSIX reader, which intentionally ignores args.
	if (Object.hasOwn(hook, "args")) return hook.command === "node" && Boolean(installerTarget(hook, wanted, "win32"));
	// Read released shell forms on either host, without touching a customized command.
	return Boolean(installerTarget(hook, wanted, "win32") || installerTarget(hook, wanted));
}

/** Match complete released verifier entries; owner variants are never removed. */
export function isRetiredVerifierHook(hook) {
	if (!hook || typeof hook !== "object" || hook.type !== "command" || hook.timeout !== 5 || hook.statusMessage !== "nana: verifier pipe") return false;
	const keys = Object.keys(hook).sort().join(",");
	if (keys === "args,command,statusMessage,timeout,type") {
		const wanted = { marker: "verifier-pipe.mjs", spec: { interpreters: ["node"], script: "verifier-pipe.mjs" }, entry: { statusMessage: "nana: verifier pipe" } };
		return Boolean(installerTarget(hook, wanted, "win32"));
	}
	if (keys !== "command,statusMessage,timeout,type") return false;
	const argv = tokenize(hook.command);
	const target = argv?.[1];
	return argv?.length === 2 && argv[0] === "node" && typeof target === "string" && (path.isAbsolute(target) || path.win32.isAbsolute(target)) && target.endsWith("/hooks/verifier-pipe.mjs") && hook.command === `node ${shq(target)}`;
}

export function removeRetiredVerifierHook(settings) {
	return removeRetiredHook(settings, "PreToolUse", isRetiredVerifierHook);
}

/** Remove retired knowledge commands in place and only the groups this removal empties. */
export function removeRetiredKnowledgeHook(settings) {
	return removeRetiredHook(settings, "UserPromptSubmit", isRetiredKnowledgeHook);
}

export function removeRetiredHook(settings, event, matches) {
	const groups = settings?.hooks?.[event];
	if (!Array.isArray(groups)) return false;
	let changed = false;
	for (let i = groups.length - 1; i >= 0; i--) {
		const group = groups[i];
		if (!Array.isArray(group?.hooks)) continue;
		const kept = group.hooks.filter(hook => !matches(hook));
		if (kept.length === group.hooks.length) continue;
		changed = true;
		group.hooks = kept;
		if (!kept.length) groups.splice(i, 1);
	}
	if (changed && !groups.length) delete settings.hooks[event];
	return changed;
}

/** Historical memory dispatch descriptor: ownership only, never installation. */
export function retiredMemoryHook({ hooksDir = '', repoRoot = '', platform } = {}) {
 const target = platform === 'win32' ? `${repoRoot}/packages/nana-setup/claude/hooks/${MEMORY_END_ENTRY.file}` : `${hooksDir}/${MEMORY_END_ENTRY.file}`;
 return { event: MEMORY_END_ENTRY.event, label: 'SessionEnd memory making', marker: MEMORY_END_ENTRY.file,
  spec: { interpreters: ['node'], script: MEMORY_END_ENTRY.file },
  entry: { type: 'command', ...(platform === 'win32' ? { command: 'node', args: [target] } : { command: `node ${shq(target)}` }), timeout: MEMORY_END_TIMEOUT_SECONDS, statusMessage: MEMORY_END_ENTRY.statusMessage } };
}

/** Recognize released shell and exec shapes across checkout and home spellings. */
export function isRetiredMemoryHook(hook, { hooksDir } = {}) {
 const wanted = retiredMemoryHook();
 if (!hook || hook.type !== 'command' || hook.timeout !== wanted.entry.timeout || hook.statusMessage !== wanted.entry.statusMessage) return false;
 const keys = Object.keys(hook).sort().join(',');
 if (keys === 'args,command,statusMessage,timeout,type') return Boolean(installerTarget(hook, wanted, 'win32'));
 if (keys !== 'command,statusMessage,timeout,type') return false;
 const argv = tokenize(hook.command);
 return argv?.length === 2 && argv[0] === 'node' && path.win32.isAbsolute(argv[1]) &&
  (argv[1] === `${hooksDir}/${MEMORY_END_ENTRY.file}` || argv[1].endsWith(`/.claude/hooks/${MEMORY_END_ENTRY.file}`) || argv[1].endsWith(`/packages/nana-setup/claude/hooks/${MEMORY_END_ENTRY.file}`)) && hook.command === `node ${shq(argv[1])}`;
}
export const removeRetiredMemoryHook = (settings, options = {}) => removeRetiredHook(settings, MEMORY_END_ENTRY.event, hook => isRetiredMemoryHook(hook, options));

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

/** Remove exact desired hook entries, preserving all unrelated structure.
 *  `platform` only forwards to desiredHooks: uninstall itself refuses on win32 before this ever
 *  runs there (uninstall.mjs), so this pure case exists for a function that is already tested. */
export function removeInstallerHooks(settings, { hooksDir, repoRoot, platform } = {}) {
	const wanted = [...desiredHooks({ hooksDir, repoRoot, platform }), retiredKnowledgeHook({ repoRoot, platform })];
	const removed = removeRetiredVerifierHook(settings) ? ["PreToolUse verifier pipe (retired)"] : [];
	if (removeRetiredMemoryHook(settings, { hooksDir })) removed.push('SessionEnd memory making');
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
 *  - "posix-shell" — win32 only, the five POSIX Node hooks under the POSIX installer's default
 *    hooks folder, with its exact single-quoted command and no `args`.
 *  - "posix-unquoted" — win32 only, the first installer's exact unquoted knowledge form.
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
// Contract value: the POSIX installer's default hooks folder (design §1, R-1880).
const POSIX_INSTALLER_HOOKS_SUFFIX = "/.claude/hooks/";

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

	if (win32 && !hasArgs && !isKnowledge) {
		const argv = tokenize(hook.command);
		if (argv?.length === 2 && argv[0] === "node") {
			const target = argv[1];
			if (path.win32.isAbsolute(target) && target.endsWith(`${POSIX_INSTALLER_HOOKS_SUFFIX}${wanted.spec.script}`) && hook.command === `node ${shq(target)}`) {
				return { target, form: "posix-shell" };
			}
		}
	}

	if (win32 && !hasArgs && isKnowledge) {
		const argv = tokenize(hook.command);
		if (argv?.length === 4 && argv[0] === "NODE_NO_WARNINGS=1" && argv[1] === "node" && argv[3] === "hook") {
			const target = argv[2];
			if (path.win32.isAbsolute(target) && target.endsWith("/packages/nana-knowledge/bin/nana-knowledge.ts") && hook.command === `NODE_NO_WARNINGS=1 node ${target} hook`) {
				return { target, form: "posix-unquoted" };
			}
		}
	}

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
 * On win32, replace stale or wrongly-shaped repo-anchored entries in place, returning
 * { [label]: { found, replaced } } for all active entries (R-1056); POSIX returns an empty result.
 *
 * It scans entries under that entry's event; where the entry has a matcher, it scans only groups
 * with that matcher, otherwise every group. The timeout gate
 * stays (an entry must carry `timeout: 5` to be read as ours at all) — a hand-written entry that
 * happens to share a script name but carries its own timeout is never touched. A match is
 * replaced when its target is missing or outside the checkout (R-1056), or when its form is
 * not exec form (R-1059). A replacement sets `command: "node"` and `args`, keeping every other key.
 */
export function mergeRepoHooks(settings, { repoRoot, wanted, platform }) {
	const win32 = platform === "win32";
	const repoAnchored = win32 ? wanted : [];
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
					if (hook?.timeout !== w.entry.timeout) continue;
					const match = installerTarget(hook, w, platform);
					if (!match) continue;
					// installerTarget already guarantees match.target is absolute, by the
					// form-appropriate rule (win32.isAbsolute for the two win32-only forms) —
					// nothing left to re-check here but whether it resolves into the checkout.
					let healthy = false;
					try {
						// The JS lookup keeps a typed letter case, drive letter and 8.3 name, so a win32
						// exec entry written through another spelling reads unhealthy and gets its one-time
						// rewrite.
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
			if (item.healthy && item.form === "win32-exec") continue;
			const current = item.group.hooks[item.index];
			item.group.hooks[item.index] = { ...current, command: w.entry.command, args: w.entry.args };
			replaced = true;
		}
		result[w.label] = { found: found.length > 0, replaced };
	}
	return result;
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

/** Find retired bash invocations for install and doctor without changing settings. */
export function retiredHookCommands(settings) {
	const names = ["nana-objective.sh", "nana-adoption.sh", "nana-shared-memory.sh"];
	const findings = [];
	for (const [event, groups] of Object.entries(settings?.hooks ?? {})) {
		if (!Array.isArray(groups)) continue;
		for (const group of groups) {
			if (!Array.isArray(group?.hooks)) continue;
			for (const hook of group.hooks) {
				for (const script of names) {
					if (commandInvokes(hook?.command, { interpreters: ["bash", "sh", "zsh"], script })) {
						findings.push({ event, command: hook.command });
						break;
					}
				}
			}
		}
	}
	return findings;
}

export function serialize(settings) {
	return JSON.stringify(settings, null, 2) + "\n";
}
