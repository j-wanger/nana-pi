/**
 * The ONE objective producer (lane T2a, 2026-09-28). Both runtimes print what this
 * returns, byte for byte: pi's nana-objective extension imports it, and the Claude
 * Code SessionStart hook is a thin launcher for bin/nana-objective.mjs, which calls it.
 * No other file resolves or renders the objective.
 *
 * What it prints — Jake's ruling 1 (2026-09-28): the nearest OBJECTIVE.md governs
 * approved product work; when a product file governs, the program (umbrella)
 * objective AND current priority are shown too, with the precedence stated. When the
 * umbrella itself governs, no duplicate block.
 *
 * Resolution — UNCONDITIONAL, no configuration needed (Jake's 2026-09-18
 * decentralization ruling): the nearest <dir>/OBJECTIVE.md walking UP from cwd wins;
 * else the user-scope objective.path (the umbrella). objective.projectFile (user scope
 * only) merely renames the file looked for; null/false/absent = OBJECTIVE.md. A project hit reached through a symlink is refused and the umbrella
 * governs, with the refusal printed. An unusable governing file prints an
 * "OBJECTIVE UNAVAILABLE" marker — silence is the failure that matters here.
 *
 * Pure and total: sync fs reads only, bounded (FILE_READ_MAX bytes per file, INJECT_CAP
 * chars per section, OUTPUT_CAP chars overall), never throws, never blocks on a
 * non-regular file (a FIFO would stall a hook; it reads as "unreadable").
 */
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export const INJECT_CAP = 4000;
export const OUTPUT_CAP = 12000;
const FILE_READ_MAX = 256 * 1024;
export const HEADING = "## Objective and current priority (nana)";
export const CHARGE =
	"Every session must be able to say which of these lines its spend serves. If it cannot, say so to the user before spending.";
export const MARKER_PREFIX = "OBJECTIVE UNAVAILABLE: ";

export const DEFAULT_PROJECT_FILE = "OBJECTIVE.md";

export interface ObjectiveSettings {
	path: string | null;
	/** Filename to walk up for. null / false / "" / absent = DEFAULT_PROJECT_FILE — never "off". */
	projectFile?: string | false | null;
}

export function projectFileName(o: ObjectiveSettings): string {
	return typeof o.projectFile === "string" && o.projectFile ? o.projectFile : DEFAULT_PROJECT_FILE;
}

export interface ObjectiveResult {
	/** The whole block, heading first. Exactly what both runtimes print. */
	text: string;
	unavailable: boolean;
	/** Journal entries (pi adds ts + cwd). */
	events: Record<string, unknown>[];
	/** One-line UI warnings (pi only). */
	notices: string[];
}

const agentDir = () => path.join(os.homedir(), ".pi", "agent");

/** `~/` expands; a RELATIVE path resolves against ~/.pi/agent and NEVER against cwd. */
export function objectivePath(o: ObjectiveSettings): string {
	const p = o.path ?? path.join(agentDir(), "nana-objective.md");
	if (p === "~") return os.homedir();
	if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
	return path.isAbsolute(p) ? p : path.join(agentDir(), p);
}

function isSymlink(file: string): boolean {
	try {
		return fs.lstatSync(file).isSymbolicLink();
	} catch {
		return false;
	}
}

function relInside(root: string, file: string): string | null {
	const rel = path.relative(path.resolve(root), path.resolve(file));
	return !rel || rel.startsWith("..") || path.isAbsolute(rel) ? null : rel;
}

/**
 * A file INSIDE the workspace is repo-controlled: refuse it if any component below
 * the workspace root is a symlink (a repo could link it at ~/.ssh/id_rsa). A path in
 * the user's own home is followed — linking ~/.pi/agent/nana-objective.md at a real
 * OBJECTIVE.md is the documented setup. Advisory: the lstats are not atomic with the read.
 */
function reachedThroughSymlinkInWorkspace(root: string, file: string): boolean {
	const rel = relInside(root, file);
	if (!rel) return false;
	let cur = path.resolve(root);
	for (const segment of rel.split(path.sep)) {
		cur = path.join(cur, segment);
		if (isSymlink(cur)) return true;
	}
	return false;
}

/** A WALK hit (nobody typed this path) also has its own final component checked above the workspace. */
function projectHitReachedThroughSymlink(root: string, file: string): boolean {
	return relInside(root, file) ? reachedThroughSymlinkInWorkspace(root, file) : isSymlink(path.resolve(file));
}

/** Nearest `<dir>/<name>` walking UP; an entry that EXISTS is a hit (a dangling link is refused, not skipped). */
function findProjectObjective(cwd: string, name: string): string | null {
	let dir = path.resolve(cwd);
	for (;;) {
		const candidate = path.join(dir, name);
		try {
			fs.lstatSync(candidate);
			return candidate;
		} catch {
			// keep walking
		}
		const parent = path.dirname(dir);
		if (parent === dir) return null;
		dir = parent;
	}
}

type Read = { text: string } | { cause: string };

/** Bounded read of a regular file; CRLF/CR normalised to LF; trimmed. */
function readObjective(file: string): Read {
	let fd: number | undefined;
	try {
		if (!fs.statSync(file).isFile()) return { cause: "unreadable" };
		fd = fs.openSync(file, "r");
		const buf = Buffer.alloc(FILE_READ_MAX);
		const n = fs.readSync(fd, buf, 0, FILE_READ_MAX, 0);
		const text = buf.subarray(0, n).toString("utf-8").replace(/\r\n?/g, "\n").trim();
		return text ? { text } : { cause: "empty file" };
	} catch (err) {
		const code = (err as NodeJS.ErrnoException)?.code;
		return { cause: code === "ENOENT" || code === "ENOTDIR" ? "file not found" : "unreadable" };
	} finally {
		if (fd !== undefined) try { fs.closeSync(fd); } catch { /* closed */ }
	}
}

function cap(s: string, n: number): { body: string; truncated: boolean } {
	return s.length > n ? { body: `${s.slice(0, n)}\n\n(truncated at ${n} chars)`, truncated: true } : { body: s, truncated: false };
}

/** The paragraph starting at the first line that begins with `prefix` (up to a blank line, heading or next bold lead). */
function paragraph(lines: string[], prefix: string): string | null {
	const i = lines.findIndex((l) => l.startsWith(prefix));
	if (i < 0) return null;
	let j = i + 1;
	while (j < lines.length && lines[j].trim() !== "" && !lines[j].startsWith("**") && !lines[j].startsWith("#")) j++;
	return lines.slice(i, j).join("\n").trimEnd();
}

function lines(text: string): { objective: string | null; priority: string | null } {
	const ls = text.split("\n");
	return { objective: paragraph(ls, "**Objective"), priority: paragraph(ls, "**Current priority") };
}

/** The governing file's section: its objective + current priority, or the file as written when it has no **Objective line. */
function governingBody(text: string): { body: string; truncated: boolean } {
	const { objective, priority } = lines(text);
	if (!objective) {
		const c = cap(text, INJECT_CAP);
		return { body: `(no **Objective line in this file — shown as written)\n${c.body}`, truncated: c.truncated };
	}
	return cap(`${objective}\n\n${priority ?? "(no **Current priority line in this file)"}`, INJECT_CAP);
}

function sameFile(a: string, b: string): boolean {
	const real = (p: string) => {
		try {
			return fs.realpathSync(p);
		} catch {
			return path.resolve(p);
		}
	};
	return real(a) === real(b);
}

function produce(cwd: string, o: ObjectiveSettings): ObjectiveResult {
	const events: Record<string, unknown>[] = [];
	const notices: string[] = [];
	const umbrella = objectivePath(o);
	const pre: string[] = [];

	let governing = umbrella;
	let found: Read | null = null;
	let source: "project" | "user" = "user";
	const hit = findProjectObjective(cwd, projectFileName(o));
	if (hit) {
		const r: Read = projectHitReachedThroughSymlink(cwd, hit) ? { cause: "reached through a symlink" } : readObjective(hit);
		if ("text" in r) {
			governing = hit;
			found = r;
			source = "project";
		} else {
			events.push({ event: "objective_project_refused", path: hit, cause: r.cause });
			notices.push(`objective: ignoring ${hit} (${r.cause}) — using ${umbrella}`);
			pre.push(`(ignored ${hit}: ${r.cause} — the program file governs)`);
		}
	}
	if (!found) {
		found = reachedThroughSymlinkInWorkspace(cwd, umbrella)
			? { cause: "reached through a symlink inside the workspace" }
			: readObjective(umbrella);
	}

	if (!("text" in found)) {
		events.push({ event: "objective_unavailable", path: umbrella, cause: found.cause });
		notices.push(`objective unavailable: ${found.cause} (${umbrella})`);
		const text = [HEADING, ...pre, `${MARKER_PREFIX}${found.cause} (${umbrella}). Tell the user before spending.`].join("\n\n");
		return { text, unavailable: true, events, notices };
	}

	const { body, truncated } = governingBody(found.text);
	const parts = [HEADING, ...pre, `governing: ${governing}\n${body}`];
	if (source === "project" && !sameFile(governing, umbrella)) {
		const u: Read = reachedThroughSymlinkInWorkspace(cwd, umbrella)
			? { cause: "reached through a symlink inside the workspace" }
			: readObjective(umbrella);
		let program: string;
		if ("text" in u) {
			const { objective, priority } = lines(u.text);
			program = cap(
				`program objective: ${objective ?? "(no **Objective line)"}\nprogram current priority: ${priority ?? "(no **Current priority line)"}`,
				INJECT_CAP,
			).body;
		} else {
			program = `program objective: unavailable (${u.cause}: ${umbrella})`;
		}
		parts.push(
			program,
			`Precedence: the lines from ${governing} govern this session's work; the program lines (${umbrella}) say what the toolkit is for.`,
		);
	}
	parts.push(CHARGE);
	const out = parts.join("\n\n");
	const text = out.length > OUTPUT_CAP ? `${out.slice(0, OUTPUT_CAP)}\n\n(output truncated at ${OUTPUT_CAP} chars)` : out;
	events.push({ event: "objective_pickup", source, path: governing, chars: text.length, truncated });
	return { text, unavailable: false, events, notices };
}

/** Never throws: an internal failure is itself a named marker. */
export function produceObjective(cwd: string, o: ObjectiveSettings): ObjectiveResult {
	try {
		return produce(cwd, o);
	} catch (err) {
		const cause = `internal error (${String(err).slice(0, 120)})`;
		return {
			text: `${HEADING}\n\n${MARKER_PREFIX}${cause}. Tell the user before spending.`,
			unavailable: true,
			events: [{ event: "objective_unavailable", cause }],
			notices: [`objective unavailable: ${cause}`],
		};
	}
}
