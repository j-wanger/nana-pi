// The Claude Code settings.json merge. Pure functions: the file is read and written by the
// caller, so the merge itself is trivially testable and can never half-write.
//
// Rules (they are the whole point of this file):
//   - a hook we want is identified by a SUBSTRING of its command, never by deep equality, so
//     a hand-edited command (a `~` path, an extra env var) still counts as present;
//   - present means untouched — no rewrite, no reorder, no dedupe of anyone else's entries;
//   - a missing hook is APPENDED to the first group of that event that has no `matcher`
//     (foreign matcher-scoped groups are left alone), or a new group is added.

/** The four hook entries the nana experience needs, in the order they are added. */
export function desiredHooks({ hooksDir, repoRoot }) {
	const bash = (name) => `bash ${hooksDir}/${name}`;
	return [
		{
			event: "SessionStart",
			match: "nana-objective.sh",
			entry: { type: "command", command: bash("nana-objective.sh"), timeout: 5, statusMessage: "nana: objective + current priority" },
			label: "SessionStart objective",
		},
		{
			event: "SessionStart",
			match: "nana-shared-memory.sh",
			entry: { type: "command", command: bash("nana-shared-memory.sh"), timeout: 5, statusMessage: "nana: shared memory index" },
			label: "SessionStart shared-memory",
		},
		{
			event: "UserPromptSubmit",
			match: "context-size-check.sh",
			entry: { type: "command", command: bash("context-size-check.sh") },
			label: "UserPromptSubmit context-size",
		},
		{
			event: "UserPromptSubmit",
			match: "nana-knowledge.ts hook",
			entry: {
				type: "command",
				command: `NODE_NO_WARNINGS=1 node ${repoRoot}/packages/nana-knowledge/bin/nana-knowledge.ts hook`,
				timeout: 5,
				statusMessage: "nana: knowledge pull",
			},
			label: "UserPromptSubmit knowledge pull",
		},
	];
}

export function hasHook(settings, event, match) {
	const groups = settings?.hooks?.[event];
	if (!Array.isArray(groups)) return false;
	return groups.some((g) => Array.isArray(g?.hooks) && g.hooks.some((h) => typeof h?.command === "string" && h.command.includes(match)));
}

/**
 * Add exactly the missing entries. Returns { settings, added: [label], changed }.
 * `settings` is mutated in place (the caller owns a freshly parsed object).
 */
export function mergeHooks(settings, wanted) {
	const added = [];
	for (const w of wanted) {
		if (hasHook(settings, w.event, w.match)) continue;
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
