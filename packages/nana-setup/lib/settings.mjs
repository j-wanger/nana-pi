/**
 * @module packages/nana-setup/lib/settings.mjs
 * @purpose Merge the nana hook entries into Claude Code settings while preserving foreign hooks and repairing recognized stale knowledge targets.
 * @inputs a parsed settings object (the caller reads and writes the file); { hooksDir, repoRoot };
 *  the command strings already in settings.hooks
 * @outputs shq() single-quoted paths; tokenize() argv or null; commandInvokes() boolean;
 *  desiredHooks(); knowledgeHookHealthy(); mergeKnowledgeHook(); validateShape(); hasHook();
 *  mergeHooks() { settings (mutated in place), added labels, changed }; serialize() JSON text
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
//   - every path we WRITE is single-quoted, so a home or clone with a space in it still runs.

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
 * Does `command` actually EXECUTE `script` through one of `interpreters`?
 *
 * Parsed, not pattern-matched (sol r2): leading `VAR=value` assignments are dropped, then argv[0]
 * must BE the interpreter and argv[1] must be a path ending in `/<script>` — so
 * `echo bash /tmp/nana-objective.sh` is not an invocation, while
 * `NODE_NO_WARNINGS=1 node '/x y/nana-knowledge.ts' hook` is. Extra argv words must match `args`.
 * Conservative by design: a form we cannot parse reads as NOT installed, which adds a correct
 * entry instead of claiming a machine is healthy.
 */
export function commandInvokes(command, { interpreters, script, args = [] }) {
	const argv = tokenize(command);
	if (!argv) return false;
	let i = 0;
	while (i < argv.length && ENV_ASSIGN.test(argv[i])) i++;
	const cmd = argv[i];
	const target = argv[i + 1];
	if (!cmd || !target) return false;
	if (!interpreters.includes(base(cmd))) return false;
	if (!target.endsWith(`/${script}`)) return false;
	return args.every((a, n) => argv[i + 2 + n] === a);
}

/** The five hook entries the nana experience needs, in the order they are added. */
export function desiredHooks({ hooksDir, repoRoot }) {
	const sh = (name) => ({
		command: `bash ${shq(`${hooksDir}/${name}`)}`,
		spec: { interpreters: ["bash", "sh", "zsh"], script: name },
	});
	const objective = sh("nana-objective.sh");
	const adoption = sh("nana-adoption.sh");
	const shared = sh("nana-shared-memory.sh");
	const context = sh("context-size-check.sh");
	const knowledgeCli = `${repoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts`;
	return [
		{
			event: "SessionStart",
			label: "SessionStart objective",
			marker: "nana-objective.sh",
			spec: objective.spec,
			entry: { type: "command", command: objective.command, timeout: 5, statusMessage: "nana: objective + current priority" },
		},
		{
			// L5: prints nothing unless a session ran in a git repository nobody has adopted.
			// Placed after the objective so the seat reads "what governs here" before "what has no owner".
			event: "SessionStart",
			label: "SessionStart adoption",
			marker: "nana-adoption.sh",
			spec: adoption.spec,
			entry: { type: "command", command: adoption.command, timeout: 5, statusMessage: "nana: unadopted repositories" },
		},
		{
			event: "SessionStart",
			label: "SessionStart shared-memory",
			marker: "nana-shared-memory.sh",
			spec: shared.spec,
			entry: { type: "command", command: shared.command, timeout: 5, statusMessage: "nana: shared memory index" },
		},
		{
			event: "UserPromptSubmit",
			label: "UserPromptSubmit context-size",
			marker: "context-size-check.sh",
			spec: context.spec,
			entry: { type: "command", command: context.command },
		},
		{
			event: "UserPromptSubmit",
			label: "UserPromptSubmit knowledge pull",
			marker: "nana-knowledge.ts hook",
			spec: { interpreters: ["node"], script: "nana-knowledge.ts", args: ["hook"] },
			entry: {
				type: "command",
				command: `NODE_NO_WARNINGS=1 node ${shq(knowledgeCli)} hook`,
				timeout: 5,
				statusMessage: "nana: knowledge pull",
			},
		},
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

export function hasHook(settings, event, spec) {
	const groups = settings?.hooks?.[event];
	if (!Array.isArray(groups)) return false;
	return groups.some((g) => Array.isArray(g?.hooks) && g.hooks.some((h) => commandInvokes(h?.command, spec)));
}

/**
 * Add exactly the missing entries. Returns { settings, added: [label], changed }.
 * `settings` is mutated in place (the caller owns a freshly parsed object).
 */
export function mergeKnowledgeHook(settings, { repoRoot, desiredCommand }) {
	const groups = settings?.hooks?.UserPromptSubmit;
	const found = [];
	if (Array.isArray(groups)) {
		for (const group of groups) {
			if (!Array.isArray(group?.hooks)) continue;
			for (let i = 0; i < group.hooks.length; i++) {
				const hook = group.hooks[i];
				if (hook?.timeout !== 5 || hook?.statusMessage !== "nana: knowledge pull" ||
					!commandInvokes(hook?.command, { interpreters: ["node"], script: "nana-knowledge.ts", args: ["hook"] })) continue;
				const argv = tokenize(hook.command);
				let offset = 0;
				while (argv[offset] && ENV_ASSIGN.test(argv[offset])) offset++;
				const target = argv[offset + 1];
				let healthy = false;
				try {
					const real = fs.realpathSync(target);
					const root = fs.realpathSync(repoRoot);
					healthy = path.isAbsolute(target) && (real === root || real.startsWith(root + path.sep));
				} catch { /* missing target */ }
				found.push({ group, index: i, hook, healthy });
			}
		}
	}
	const stale = found.filter((item) => !item.healthy);
	if (stale.length) {
		for (const item of stale) item.group.hooks[item.index] = { ...item.hook, command: desiredCommand };
		return { added: false, replaced: true, staleValid: false };
	}
	if (found.length) return { added: false, replaced: false, staleValid: true };
	return { added: true, replaced: false, staleValid: false };
}

export function knowledgeHookHealthy(settings, repoRoot) {
	const groups = settings?.hooks?.UserPromptSubmit;
	if (!Array.isArray(groups)) return false;
	let found = false;
	for (const group of groups) {
		if (!Array.isArray(group?.hooks)) continue;
		for (const hook of group.hooks) {
			if (!commandInvokes(hook?.command, { interpreters: ["node"], script: "nana-knowledge.ts", args: ["hook"] })) continue;
			found = true;
			const argv = tokenize(hook.command);
			let offset = 0;
			while (argv[offset] && ENV_ASSIGN.test(argv[offset])) offset++;
			const target = argv[offset + 1];
			try {
				const real = fs.realpathSync(target);
				const root = fs.realpathSync(repoRoot);
				if (!path.isAbsolute(target) || !(real === root || real.startsWith(root + path.sep))) return false;
			} catch { return false; }
		}
	}
	return found;
}

export function mergeHooks(settings, wanted) {
	const added = [];
	for (const w of wanted) {
		if (hasHook(settings, w.event, w.spec)) continue;
		settings.hooks ??= {};
		settings.hooks[w.event] ??= [];
		const groups = settings.hooks[w.event];
		let group = groups.find((g) => g && typeof g === "object" && !("matcher" in g) && Array.isArray(g.hooks));
		if (!group) {
			group = { hooks: [] };
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
