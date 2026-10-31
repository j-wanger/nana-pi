/**
 * @module packages/nana-setup/claude/hooks/nana-shared-memory.mjs
 * @purpose Print the shared-memory index and self-heal the current Claude project memory link.
 * @inputs Claude Code environment, bounded hook JSON stdin, and the shared MEMORY.md file.
 * @outputs a bounded shared-memory header, optional note, index entries, and a fold line when entries are shortened or omitted.
 * @effects disk, process (reads stdin, creates directories and a link, writes stdout).
 * @errors all failures, including a stdout error such as a reader that closed it, are ignored and the hook exits 0.
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { claudeConfigHome } from "../../lib/claude-config-home.mjs";
import { projectKey } from "../../lib/project-key.mjs";
import { readHookInput } from "../../lib/shared-memory-input.mjs";
import { SHARED_MEMORY_OUTPUT_BUDGET, SHARED_MEMORY_TRIM_MARK } from "../../lib/shared-memory-config.mjs";

// R-1942: Ignore every stdout error so a closed hook reader cannot fail the hook.
process.stdout.on("error", () => {});

const HEADER = (idx) => `[nana:shared-memory] ${idx} — general feedback/user/reference memories are written HERE (symlinked as shared/ in this project's memory dir); project facts go in the project's own memory dir.`;
const FOLD_LINE = (shortened, total, leftOut, idx) => `[nana:shared-memory] index shortened to fit the hook output cap: ${shortened} of ${total} entries shortened, ${leftOut} left out; full index: ${idx}`;

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
	const claudeHome = claudeConfigHome(os.homedir());
	const shared = process.env.NANA_SHARED_MEMORY_DIR || path.join(claudeHome, "nana-memory", "shared");
	idx = path.join(shared, "MEMORY.md");
	text = fs.readFileSync(idx, "utf8");
	let note = "";
	let input = {};
	try {
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
	const fixed = `${HEADER(idx)}\n${note ? `[nana:shared-memory] ${note}\n` : ""}`;
	const entries = text.split(/\r?\n/).filter((line) => /^- \[/.test(line));
	const full = fixed + entries.map((line) => `${line}\n`).join("");
	let output = full;
	let whole = entries;
	let shortenedEntries = [];
	let omitted = [];
	if (full.length <= SHARED_MEMORY_OUTPUT_BUDGET) {
		// Full entries retain their original text and order.
	} else {
		const parts = entries.map((line) => {
			const head = line.match(/^- \[[^\]]*\]\([^)]*\)/)?.[0] ?? line;
			return { head, description: line.slice(head.length) };
		});
		const total = parts.length;
		const reservedFold = `${FOLD_LINE(total, total, total, idx)}\n`;
		const shorten = ({ head, description }, limit) => {
			if (description.length <= limit) return `${head}${description}`;
			let end = limit;
			if (end > 0 && /[\uD800-\uDBFF]/.test(description[end - 1])) end--;
			return `${head}${description.slice(0, end)}${SHARED_MEMORY_TRIM_MARK}`;
		};
		const render = (selected, limit) => selected.map((part) => `${shorten(part, limit)}\n`).join("");
		let limit = 0;
		let selected = parts;
		if ((fixed + render(parts, 0) + reservedFold).length <= SHARED_MEMORY_OUTPUT_BUDGET) {
			let low = 0;
			let high = Math.max(0, ...parts.map(({ description }) => description.length));
			while (low < high) {
				const mid = Math.ceil((low + high) / 2);
				if ((fixed + render(parts, mid) + reservedFold).length <= SHARED_MEMORY_OUTPUT_BUDGET) low = mid;
				else high = mid - 1;
			}
			limit = low;
		} else {
			let kept = 0;
			let renderedLength = 0;
			for (const part of parts) {
				const lineLength = shorten(part, 0).length + 1;
				if (fixed.length + renderedLength + lineLength + reservedFold.length > SHARED_MEMORY_OUTPUT_BUDGET) break;
				renderedLength += lineLength;
				kept++;
			}
			selected = parts.slice(0, kept);
		}
		const shortened = selected.filter(({ description }) => description.length > limit).length;
		const leftOut = total - selected.length;
		output = fixed + render(selected, limit) + `${FOLD_LINE(shortened, total, leftOut, idx)}\n`;
		whole = selected.filter(({ description }) => description.length <= limit).map(({ head }) => head);
		shortenedEntries = selected.filter(({ description }) => description.length > limit).map(({ head }) => head);
		omitted = parts.slice(selected.length).map(({ head }) => head);
	}
	process.stdout.write(output);
	try {
		const { appendContextLoad } = await import('../../../nana-pack/lib/context-load-log.mjs');
		// A malformed pointer has no filename: count it with null, never log its prose.
		const files = list => list.map(line => line.match(/^- \[[^\]]*\]\(([^)]*)\)/)?.[1] ?? null);
		appendContextLoad({ launcher: 'nana-shared-memory', role: 'seat', runtime: 'claude-code', sessionId: typeof input.session_id === 'string' ? input.session_id : null,
			cwd: typeof input.cwd === 'string' ? input.cwd : process.env.CLAUDE_PROJECT_DIR || process.cwd(),
			source: idx, fullChars: full.length, printedChars: output.length, whole: files(whole), shortened: files(shortenedEntries), omitted: files(omitted) });
	} catch (error) {
		try { process.stderr.write(`nana context load skipped: ${String(error?.code ?? 'module unavailable').replace(/[\r\n]/g, ' ')}\n`); } catch {}
	}
} catch {
	// An unreadable shared index means print nothing and create nothing.
}
