/**
 * @module packages/nana-setup/lib/retired.mjs
 * @purpose Describe only legacy artifacts whose nana provenance permits safe retirement.
 * @inputs home path and filesystem entries inspected with lstat.
 * @outputs a list of relative paths, expected kinds, and provenance predicates.
 * @effects disk (reads artifact contents; callers perform moves).
 * @errors unreadable or mismatched artifacts are returned as unrecognized, never followed.
 */
import * as fs from "node:fs";
import * as path from "node:path";

const kitSkill = (st, p) => {
	if (!st.isDirectory() || st.isSymbolicLink()) return false;
	const files = [];
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const file = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(file);
			else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(file);
		}
	};
	try {
		walk(p);
		return files.some((file) => /nana-dev-kit|5-layer harness|5-layer dev harness/i.test(fs.readFileSync(file, "utf8")));
	} catch { return false; }
};
const codexImport = (st, p) => {
	if (!st.isDirectory() || st.isSymbolicLink()) return false;
	const files = [];
	const walk = (dir) => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const file = path.join(dir, entry.name);
			if (entry.isDirectory()) walk(file);
			else if (entry.isFile() && entry.name.toLowerCase().endsWith(".md")) files.push(file);
		}
	};
	try {
		walk(p);
		return files.some((file) => /\.Codex(?:\/|\\)|~\/.Codex/i.test(fs.readFileSync(file, "utf8")));
	} catch { return false; }
};
const legacySkills = ["py-init", "ts-init", "nana-init", "nana", "spec", "py-lint", "py-review", "py-test"];
const agentImports = ["dev-check", "dev-debrief", "dev-init", "dev-plan", "dev-scan", "dev-wiki", "knowledge-wiki", "memory-consolidate", "nana", "nana-init", "py-init", "ts-init", "wiki-absorb", "wiki-add", "wiki-bootstrap", "wiki-consolidate", "wiki-health", "wiki-index", "wiki-init", "wiki-query", "wiki-registry", "wiki-reorg"];

/** Return manifest entries rooted under the supplied home, without resolving their paths. */
export function retiredArtifacts(home) {
	const entries = [
		...legacySkills.map((name) => ({ relative: `.claude/skills/${name}`, kind: "directory", provenance: kitSkill })),
		...agentImports.map((name) => ({ relative: `.agents/skills/${name}`, kind: "directory", provenance: codexImport })),
		...[
			{ relative: ".claude/enforce", kind: "file", provenance: (st, p) => st.isFile() && !st.isSymbolicLink() && fs.statSync(p).size === 0 },
			{ relative: ".claude/enforce-memory", kind: "file", provenance: (st, p) => st.isFile() && !st.isSymbolicLink() && fs.statSync(p).size === 0 },
		],
	];
	const hooks = path.join(home, ".claude", "hooks");
	try {
		for (const name of fs.readdirSync(hooks)) {
			if (/\.bak-20260918$/.test(name)) entries.push({ relative: `.claude/hooks/${name}`, kind: "file", provenance: (st, file) => st.isFile() && !st.isSymbolicLink() && /nana/i.test(fs.readFileSync(file, "utf8")) });
		}
	} catch { /* no hook backup entries */ }
	return entries;
}

/** Check kind and provenance on the lstat'd path, without following a link. */
export function matchesRetiredArtifact(entry, stat, absolutePath) {
	if (!stat || stat.isSymbolicLink()) return false;
	const kindMatches = entry.kind === "directory" ? stat.isDirectory() : stat.isFile();
	if (!kindMatches) return false;
	try { return entry.provenance(stat, absolutePath); } catch { return false; }
}
