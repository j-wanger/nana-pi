/**
 * @module packages/nana-pack/extensions/nana-writing.ts
 * @purpose Append the "Writing for Jake" rule to every session's system prompt, read fresh at
 *  every session_start so a reload picks up an edit — the seventh pack extension.
 * @inputs pi `session_start` (every reason) and `before_agent_start` events; an injectable rule
 *  path (opts.rulePath, defaulting to the shipped packages/nana-pack/rules/nana-writing.md); ctx (cwd)
 * @outputs the rule block appended under "## Writing for Jake (nana)"; one journal line
 *  (writing_rule_unavailable) when the file is missing, not a regular file, unreadable or not
 *  valid UTF-8
 * @effects disk (stats and bounded-reads the rule file; appends the journal)
 * @errors none — the handler swallows everything; an unusable rule injects nothing rather than
 *  throwing, hanging or exhausting memory
 */
/**
 * nana-writing — the companion to nana-objective (design-ruling.md Amendment 1, 2026-10-04,
 * §A1, after astra r1 MUST 1): delivery moved from an agent-dir AGENTS.md link to a pack
 * extension, because pi selects the first usable file of five names per directory
 * (AGENTS.override.md, AGENTS.md, AGENTS.MD, CLAUDE.md, CLAUDE.MD) and a link in that race can
 * both hide a user's own file AND be hidden by one. An append replaces nothing: no context
 * file, project prompt or override can remove it.
 *
 * Uses the exact call nana-objective.ts uses: read at `session_start` for every reason
 * (R-754 — a reload must pick up an edit to the rule), append
 * `${event.systemPrompt}\n\n${block}` at `before_agent_start`. Verified against the installed
 * pi 1.0.2 (`dist/core/extensions/runner.js` emitBeforeAgentStart): `event.systemPrompt` is a
 * live getter over a SHARED options object, and a handler's `{systemPrompt}` return sets that
 * object's `forceSystemPrompt` — so a later-registered extension's `event.systemPrompt` sees
 * the EARLIER one's already-appended text, and composition holds (both blocks reach the
 * model, each once, in registration order). See writing-injection.test.mjs's pi-1.0.2 harness.
 *
 * astra r2 MUST 1: the read must never crash or hang pi, regardless of what sits at the rule
 * path. `buildBlock` therefore (a) `statSync`s first and refuses anything that is not a
 * regular file — a FIFO with no writer blocks forever on `read()`, and this is the ONLY
 * defense against that, since no read-side timeout exists in Node's sync fs API — and (b)
 * never allocates or decodes more than WRITING_INJECT_CAP + READ_MARGIN bytes, however large
 * the file is, so a 64 MiB (or larger) file cannot exhaust the heap. The margin exists so a
 * multi-byte UTF-8 character split exactly at the read boundary can be detected and trimmed
 * rather than misread as a genuinely invalid file.
 *
 * astra r2 MUST 4: the rule path is an optional second constructor argument, defaulting to the
 * shipped file — pi's own call site (`ext(pi)`, one argument) is unaffected, so tests can point
 * this at a disposable fixture instead of ever touching the real, installed rule file.
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { appendJournal, loadConfig } from "../lib/config.ts";
import { WRITING_INJECT_CAP } from "../lib/writing-config.mjs";

/** The shipped rule file — the default when no path is injected. */
export const RULE_PATH = fileURLToPath(new URL("../rules/nana-writing.md", import.meta.url));

export const HEADING = "## Writing for Jake (nana)";

/** chosen: the longest a UTF-8 sequence can be, so a read cut at exactly READ_MARGIN past the
 *  cap can still have its possibly-split trailing character trimmed and decoded cleanly. */
const READ_MARGIN = 4;

export interface BuildResult {
	block: string | null;
	cause: string | null;
}

/** A human description of what occupies `path`, for a refusal message — never throws. */
function describeKind(st: fs.Stats): string {
	if (st.isDirectory()) return "a directory";
	if (st.isFIFO()) return "a FIFO";
	if (st.isSocket()) return "a socket";
	if (st.isBlockDevice() || st.isCharacterDevice()) return "a device";
	return "not a regular file";
}

/**
 * Read at most `want` bytes of `fd`, looping on short reads (a regular file read can return
 * fewer bytes than requested). Bounded: this never allocates more than `want` bytes regardless
 * of the underlying file's size.
 */
function readBounded(fd: number, want: number): Buffer {
	const buf = Buffer.allocUnsafe(want);
	let total = 0;
	while (total < want) {
		const n = fs.readSync(fd, buf, total, want - total, total);
		if (n === 0) break; // EOF
		total += n;
	}
	return buf.subarray(0, total);
}

/** `full`, capped at WRITING_INJECT_CAP chars with the cut announced; `forceCut` is set when
 *  the SOURCE may hold more bytes than were read, so completeness can never be claimed. */
function capBlock(full: string, forceCut: boolean): BuildResult {
	if (!forceCut && full.length <= WRITING_INJECT_CAP) return { block: full, cause: null };
	const notice = `\n\n…(cut at ${WRITING_INJECT_CAP} chars)`;
	const keep = Math.max(0, WRITING_INJECT_CAP - notice.length);
	return { block: `${full.slice(0, keep)}${notice}`, cause: null };
}

/**
 * Read the rule file and build the injected block. `{ block: null, cause }` when the path is
 * missing, not a regular file, unreadable or not valid UTF-8 (R-752). Otherwise the block is
 * capped at WRITING_INJECT_CAP chars with the cut announced inside the text (R-753) — and the
 * read itself never exceeds WRITING_INJECT_CAP + READ_MARGIN bytes, whatever the file's actual
 * size, so neither a FIFO nor an oversized file can crash or hang the caller (astra r2 MUST 1).
 */
export function buildBlock(rulePath: string = RULE_PATH): BuildResult {
	let st: fs.Stats;
	try {
		st = fs.statSync(rulePath); // follows a symlink; a dangling one throws ENOENT, same as missing
	} catch (err) {
		return { block: null, cause: `unreadable (${(err as Error).message})` };
	}
	if (!st.isFile()) {
		return { block: null, cause: `not a regular file (${describeKind(st)})` };
	}
	const want = Math.min(st.size, WRITING_INJECT_CAP + READ_MARGIN);
	const sourceMayExceedWant = st.size > want;
	let fd: number;
	try {
		fd = fs.openSync(rulePath, "r");
	} catch (err) {
		return { block: null, cause: `unreadable (${(err as Error).message})` };
	}
	let bytes: Buffer;
	try {
		bytes = readBounded(fd, want);
	} catch (err) {
		return { block: null, cause: `unreadable (${(err as Error).message})` };
	} finally {
		fs.closeSync(fd);
	}
	try {
		const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		return capBlock(`${HEADING}\n\n${text}`, sourceMayExceedWant);
	} catch {
		if (sourceMayExceedWant) {
			// our OWN read boundary, not the file, may have split a multi-byte character —
			// trim back up to READ_MARGIN bytes and retry once before calling the file invalid
			for (let back = 1; back <= READ_MARGIN && bytes.length - back > 0; back++) {
				try {
					const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, bytes.length - back));
					return capBlock(`${HEADING}\n\n${text}`, true);
				} catch {
					continue;
				}
			}
		}
		return { block: null, cause: "not valid UTF-8" };
	}
}

export default function (pi: ExtensionAPI, opts: { rulePath?: string } = {}) {
	const rulePath = opts.rulePath ?? RULE_PATH;
	let block: string | null = null;

	pi.on("session_start", async (_event, ctx) => {
		// every reason, deliberately — R-754: a reload must re-read the file from disk
		block = null;
		try {
			const { block: b, cause } = buildBlock(rulePath);
			block = b;
			if (cause) {
				const cfg = loadConfig(ctx);
				appendJournal(cfg, { ts: new Date().toISOString(), cwd: ctx.cwd, event: "writing_rule_unavailable", cause });
			}
		} catch {
			// never throw out of a handler
		}
	});

	pi.on("before_agent_start", async (event, _ctx) => {
		if (!block) return undefined;
		return { systemPrompt: `${(event as any).systemPrompt}\n\n${block}` };
	});
}
