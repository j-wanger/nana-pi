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
 * Does `command` invoke `script` (a basename) through one of `interpreters`?
 * The script must appear as a path component — `/<basename>` — and end at a boundary, so
 * `.../nana-objective.sh.disabled` and a bare `echo nana-objective.sh…` do not match, while both
 * `bash ~/.claude/hooks/nana-objective.sh` and `bash '/Users/Jane Doe/.claude/hooks/nana-objective.sh'`
 * do.
 */
export function commandInvokes(command, { interpreters, script, args = [] }) {
	if (typeof command !== "string") return false;
	const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const interp = new RegExp(`(^|[\\s;&|(/])(${interpreters.map(esc).join("|")})(\\s|$)`);
	if (!interp.test(command)) return false;
	const tail = args.length ? `['"]?\\s+${args.map(esc).join("\\s+")}(\\s|$)` : `['"\\s]|$`;
	return new RegExp(`/${esc(script)}(${tail})`).test(command);
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
