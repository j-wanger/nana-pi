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
 * Returns null when the quoting is unbalanced (then nothing matches — we add our own entry
 * rather than assume someone else's broken command is ours).
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

/** The four hook entries the nana experience needs, in the order they are added. */
export function desiredHooks({ hooksDir, repoRoot }) {
	const sh = (name) => ({
		command: `bash ${shq(`${hooksDir}/${name}`)}`,
		spec: { interpreters: ["bash", "sh", "zsh"], script: name },
	});
	const objective = sh("nana-objective.sh");
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
