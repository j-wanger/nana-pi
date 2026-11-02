/**
 * @module packages/nana-setup/claude/hooks/nana-shared-memory.mjs
 * @purpose Deliver the bounded seat memory push beside the shared index and self-heal its project link.
 * @inputs Claude Code environment, bounded hook JSON stdin, shared MEMORY.md and optional private memory store.
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
import { SHARED_MEMORY_OUTPUT_BUDGET } from "../../lib/shared-memory-config.mjs";
import { HOOK_DEADLINE_MS } from "../../lib/hook-producer.mjs";
import { HEADER, seatMemoryLayout } from '../../../nana-pack/lib/memory-render.mjs';

// R-1942: Ignore every stdout error so a closed hook reader cannot fail the hook.
process.stdout.on("error", () => {});

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
	const options = { header: fixed, entries, indexPath: idx, budget: SHARED_MEMORY_OUTPUT_BUDGET };
	// Prepare fallback before any private-store or git work. The deadline is Node's
	// process clock, not time since this point (including stdin and imports).
	const baseline = seatMemoryLayout(options);
	let layout = baseline;
	let push = { reason: 'unavailable', unparseable: 0 };
	try {
		const { seatPush } = await import('../../../nana-pack/lib/memory-push.mjs');
		push = seatPush({ cwd: typeof input.cwd === 'string' ? input.cwd : process.env.CLAUDE_PROJECT_DIR || process.cwd(), deadline: HOOK_DEADLINE_MS });
		if (push.bundle) {
			layout = seatMemoryLayout({ ...options, bundle: push.bundle });
			if (layout.bundleDelivered === false) push = { reason: 'budget', unparseable: push.unparseable };
			if (performance.now() >= HOOK_DEADLINE_MS) { layout = baseline; push = { reason: 'deadline', unparseable: push.unparseable }; }
		}
		else if (push.reason === 'store-error') {
			const { PUSH_WORDS } = await import('../../../nana-pack/lib/memory-bundle-config.mjs');
			layout = seatMemoryLayout({ ...options, budget: SHARED_MEMORY_OUTPUT_BUDGET - PUSH_WORDS.storeError.length });
			layout.output += PUSH_WORDS.storeError;
		}
	} catch { /* Prepared index remains independent of the optional push. */ }
	const { output, full, whole, shortenedEntries, omitted } = layout;
	process.stdout.write(output);
	try {
		const { appendContextLoad } = await import('../../../nana-pack/lib/context-load-log.mjs');
		// A malformed pointer has no filename: count it with null, never log its prose.
		const files = list => list.map(line => line.match(/^- \[[^\]]*\]\(([^)]*)\)/)?.[1] ?? null);
		appendContextLoad({ launcher: 'nana-shared-memory', role: 'seat', runtime: 'claude-code', sessionId: typeof input.session_id === 'string' ? input.session_id : null,
			cwd: typeof input.cwd === 'string' ? input.cwd : process.env.CLAUDE_PROJECT_DIR || process.cwd(),
			source: idx, fullChars: full.length, printedChars: output.length, whole: files(whole), shortened: files(shortenedEntries), omitted: files(omitted),
			push: { reason: push.reason, unparseable: push.unparseable, chars: push.bundle?.chars ?? 0, delivered: push.bundle?.delivered ?? [], omitted: push.bundle?.omitted ?? [] } });
	} catch (error) {
		try { process.stderr.write(`nana context load skipped: ${String(error?.code ?? 'module unavailable').replace(/[\r\n]/g, ' ')}\n`); } catch {}
	}
} catch {
	// An unreadable shared index means print nothing and create nothing.
}
