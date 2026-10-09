/**
 * @module packages/nana-setup/claude/hooks/nana-shared-memory.mjs
 * @purpose Print the shared-memory index and self-heal the current Claude project memory link.
 * @inputs Claude Code environment, bounded hook JSON stdin, and the shared MEMORY.md file.
 * @outputs the shared-memory header, optional note, and index entries on stdout.
 * @effects disk, process (reads stdin, creates directories and a link, writes stdout).
 * @errors all failures are swallowed so this SessionStart hook exits successfully.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { projectKey } from "../../lib/project-key.mjs";
import { readHookInput } from "../../lib/shared-memory-input.mjs";

const HEADER = (idx) => `[nana:shared-memory] ${idx} — general feedback/user/reference memories are written HERE (symlinked as shared/ in this project's memory dir); project facts go in the project's own memory dir.`;

function hasSymlinkedComponent(root, target) {
	const relative = path.relative(root, target);
	if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) return true;
	let current = root;
	for (const component of ["", ...relative.split(path.sep).filter(Boolean)]) {
		if (component) current = path.join(current, component);
		try { if (fs.lstatSync(current).isSymbolicLink()) return true; }
		catch (error) { if (error?.code === "ENOENT") break; return true; }
	}
	return false;
}

let text;
let idx;
try {
	const claudeHome = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude");
	const shared = process.env.NANA_SHARED_MEMORY_DIR || path.join(claudeHome, "nana-memory", "shared");
	idx = path.join(shared, "MEMORY.md");
	text = fs.readFileSync(idx, "utf8");
	let note = "";
	try {
		let input = {};
		if (!process.stdin.isTTY) {
			try { input = JSON.parse(await readHookInput(process.stdin)); } catch { input = {}; }
		}
		const projects = path.resolve(claudeHome, "projects");
		const transcript = typeof input?.transcript_path === "string" ? input.transcript_path : "";
		let dir = null;
		if (transcript) {
			const candidate = path.dirname(transcript);
			if (path.resolve(path.dirname(candidate)) === projects) dir = candidate;
		}
		if (!dir) {
			let project;
			try {
				project = process.env.CLAUDE_PROJECT_DIR || process.cwd();
				if (!process.env.CLAUDE_PROJECT_DIR && !fs.statSync(project).isDirectory()) project = "";
			} catch { project = ""; }
			if (project) dir = path.join(projects, projectKey(project));
			else note = "self-heal skipped: no project directory can be read";
		}
		if (dir) {
			const memory = path.join(dir, "memory");
			if (hasSymlinkedComponent(claudeHome, memory)) {
				note = "self-heal skipped: symlinked path component";
			} else {
				fs.mkdirSync(memory, { recursive: true });
				const link = path.join(memory, "shared");
				if (hasSymlinkedComponent(claudeHome, memory)) {
					note = "self-heal skipped: symlinked path component";
				} else {
					let absent = false;
					try { fs.lstatSync(link); }
					catch (error) {
						if (error?.code !== "ENOENT") throw error;
						absent = true;
					}
					if (absent && !hasSymlinkedComponent(claudeHome, memory)) {
						try { fs.lstatSync(link); }
						catch (error) {
							if (error?.code !== "ENOENT") throw error;
							fs.symlinkSync(shared, link, "junction");
						}
					}
				}
			}
		}
	} catch {
		// Self-heal is best effort; reading the index remains independent.
	}
	process.stdout.write(`${HEADER(idx)}\n`);
	if (note) process.stdout.write(`[nana:shared-memory] ${note}\n`);
	for (const line of text.split(/\r?\n/)) if (/^- \[/.test(line)) process.stdout.write(`${line}\n`);
} catch {
	// An unreadable shared index means print nothing and create nothing.
}
