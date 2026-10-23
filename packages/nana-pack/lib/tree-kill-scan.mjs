/**
 * @module packages/nana-pack/lib/tree-kill-scan.mjs
 * @purpose Find mapped production code that duplicates process-tree kill spellings.
 * @inputs repository root, code-map.config.json, mapped source files, and git's tracked-file list
 * @outputs scan findings and the sealed tree-kill exception paths
 * @effects disk and process (reads mapped files and invokes git ls-files)
 * @errors scan failures return a finding; malformed files are skipped
 */
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

// chosen 2026-10-22: only the shared implementation, the different snapshot walk, its composer,
// and the frozen desk implementation may contain the scan's process-tree kill spellings.
export const TREE_KILL_EXCEPTIONS = Object.freeze({
	"packages/nana-pack/lib/process-tree.mjs": "the one shared process-group and taskkill implementation",
	"scripts/runtime-measure.mjs": "the runtime measurer walks a process snapshot before choosing safe group or pid targets",
	"scripts/test-locked.mjs": "the locked runner composes runtime-measure targets with its live child handle",
	"apps/desk/server.mjs": "the frozen desk keeps its existing child lifecycle implementation",
});

const under = (file, root) => file === root || file.startsWith(`${root}/`);
const ignoredBy = (file, pattern) => {
	if (pattern.startsWith("**/")) {
		const tail = pattern.slice(3);
		if (tail.startsWith("*.")) return file.endsWith(tail.slice(1));
		return file.split("/").includes(tail);
	}
	return under(file, pattern);
};

/** Return every mapped production line that spells a process-group kill or taskkill outside the sealed exceptions. */
export function scanTreeKillCopies(repoRoot, {
	readFile = fs.readFileSync,
	run = (command, args, options) => spawnSync(command, args, options),
} = {}) {
	try {
		const config = JSON.parse(readFile(path.join(repoRoot, "code-map.config.json"), "utf8"));
		const roots = (config.roots ?? []).filter((root) => typeof root === "string");
		const extensions = config.moduleExtensions ?? [".mjs", ".ts", ".js"];
		const testRoots = (config.roots ?? []).filter((root) => typeof root === "object" && root?.path).map((root) => root.path);
		const ignored = config.ignore ?? [];
		const findings = [];
		for (const file of Object.keys(TREE_KILL_EXCEPTIONS)) {
			if (!fs.existsSync(path.join(repoRoot, file))) findings.push({ path: file, line: 0, text: "declared exception is missing" });
		}
		const listed = run("git", ["ls-files"], { cwd: repoRoot, encoding: "utf8" });
		if (listed?.status !== 0 || listed?.error) return [...findings, { path: "git ls-files", line: 0, text: listed?.error?.message ?? listed?.stderr ?? "failed" }];
		const files = listed.stdout.split(/\r?\n/).filter(Boolean).filter((file) =>
			extensions.some((extension) => file.endsWith(extension))
			&& roots.some((root) => under(file, root))
			&& !testRoots.some((root) => under(file, root))
			&& !ignored.some((pattern) => ignoredBy(file, pattern)));
		for (const file of files) {
			if (Object.hasOwn(TREE_KILL_EXCEPTIONS, file)) continue;
			let text;
			try { text = readFile(path.join(repoRoot, file), "utf8"); } catch { continue; }
			for (const [index, line] of text.split(/\r?\n/).entries()) {
				const start = line.trimStart();
				if (start.startsWith("//") || start.startsWith("/*") || start.startsWith("*")) continue;
				if (/["'`]taskkill(?:\.exe)?\b/i.test(line) || /\bkill\(\s*-/.test(line)) findings.push({ path: file, line: index + 1, text: line.trimEnd() });
			}
		}
		return findings;
	} catch (error) {
		return [{ path: "code-map.config.json", line: 0, text: error?.message ?? String(error) }];
	}
}
