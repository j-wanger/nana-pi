/**
 * @module packages/nana-pack/extensions/nana-writing.ts
 * @purpose Append the "Writing for Jake" rule to every session's system prompt, read fresh at
 *  every session_start so a reload picks up an edit — the seventh pack extension.
 * @inputs pi `session_start` (every reason) and `before_agent_start` events; an injectable rule
 *  path (opts.rulePath, defaulting to the shipped packages/nana-pack/rules/nana-writing.md); ctx (cwd)
 * @outputs the rule block appended under "## Writing for Jake (nana)"; one journal line
 *  (writing_rule_unavailable) when the file is missing, not a regular file, unreadable, or when
 *  the bytes actually read are not valid UTF-8 — a bounded read never speaks to an unread
 *  remainder, so that is the full extent of the claim, not whole-file validation
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
 * Reads at `session_start` for every reason (R-754 — a reload must pick up an edit to the rule)
 * and sets its named section in `systemPromptOptions.sections` at `before_agent_start`, preserving
 * Pi's structured prompt and transcript delta.
 *
 * astra r2 MUST 1: the read must never crash or hang pi, regardless of what sits at the rule
 * path. `buildBlock` therefore (a) `statSync`s first and refuses anything that is not a
 * regular file — a FIFO with no writer blocks forever on `read()`, and this is the ONLY
 * defense against that, since no read-side timeout exists in Node's sync fs API — and (b)
 * never allocates or decodes more than WRITING_INJECT_CAP + READ_MARGIN bytes (R-755), however
 * large the file is, so a 64 MiB (or larger) file cannot exhaust the heap. The margin exists so
 * a multi-byte UTF-8 character split exactly at the read boundary can be detected and trimmed
 * rather than misread as a genuinely invalid file.
 *
 * astra r3 MUST 1: this validates only the BYTES IT READS — a bounded read cannot establish
 * that an unread remainder is valid UTF-8, so the claim is narrowed to that window, never the
 * whole file. Within that window, `trimIncompleteTail` strips ONLY a trailing sequence whose
 * OWN lead byte announces more bytes than are present (a genuine read-boundary split); it never
 * strips a byte that is simply invalid — astra r2's first cut of the loop tried up to four
 * trailing byte-counts in sequence and accepted the first one that happened to decode, which
 * silently swallowed a real invalid byte (`0xff`) sitting at the tail. The decode after that is
 * always fatal: any invalid byte left in the window is refused, never guessed past.
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
import { orderNanaSections } from "../lib/prompt-sections.mjs";

/** The shipped rule file — the default when no path is injected. */
export const RULE_PATH = fileURLToPath(new URL("../rules/nana-writing.md", import.meta.url));

export const HEADING = "## Writing for Jake (nana)";

/** chosen: the longest a UTF-8 sequence can be, so a read cut at exactly READ_MARGIN past the
 *  cap can still have its possibly-split trailing character trimmed and decoded cleanly. */
export const READ_MARGIN = 4;

/** The exact byte ceiling a read may request for a file of `fileSize` bytes: never more than
 *  WRITING_INJECT_CAP + READ_MARGIN, whatever the file's real size (R-755). Exported so the
 *  ceiling is pinned directly, by name, rather than inferred from a heap-pressure probe. */
export function readBudget(fileSize: number): number {
	return Math.min(fileSize, WRITING_INJECT_CAP + READ_MARGIN);
}

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

/** The UTF-8 sequence length a lead byte announces (1-4), or 0 when `b` is a continuation byte
 *  (0x80-0xBF) or not a valid lead at all (0xF8-0xFF) — either way, not a sizeable lead here. */
function leadByteLength(b: number): number {
	if (b <= 0x7f) return 1;
	if (b >= 0xc0 && b <= 0xdf) return 2;
	if (b >= 0xe0 && b <= 0xef) return 3;
	if (b >= 0xf0 && b <= 0xf7) return 4;
	return 0;
}

/**
 * astra r3 MUST 1: the byte length to decode from `bytes`, trimming ONLY a trailing sequence
 * that is INCOMPLETE because our own read boundary cut it short — never a byte that is simply
 * invalid. Looks at the last 1-3 bytes for the most recent lead byte (a continuation byte is
 * skipped backward over, since it cannot itself announce a length). Once found, `back` bytes
 * from the end: if that lead's announced length exceeds `back`, the sequence is short by
 * construction (truncated at our boundary) and we cut before it; otherwise the tail is already
 * complete (or malformed for a reason that is NOT truncation) and nothing is trimmed — the
 * fatal decode that follows is what refuses a genuinely invalid byte.
 */
export function trimIncompleteTail(bytes: Buffer): number {
	const n = bytes.length;
	for (let back = 1; back <= 3 && back <= n; back++) {
		const len = leadByteLength(bytes[n - back]);
		if (len === 0) continue; // a continuation byte: the lead is further back
		return len > back ? n - back : n;
	}
	return n; // no lead byte in the last 3 bytes — decode as-is; fatal mode is the backstop
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
 * missing, not a regular file, unreadable, or when the BYTES ACTUALLY READ are not valid
 * UTF-8 (R-752) — a bounded read cannot speak to an unread remainder, so that is the full
 * extent of the claim. Otherwise the block is capped at WRITING_INJECT_CAP chars with the cut
 * announced inside the text (R-753), and the read itself never exceeds readBudget(fileSize)
 * bytes, whatever the file's actual size, so neither a FIFO nor an oversized file can crash or
 * hang the caller (R-755, astra r2 MUST 1).
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
	const want = readBudget(st.size);
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
	// Only when our OWN boundary might have cut the file short is a trailing partial sequence
	// even a candidate for trimming; a file that ends exactly within `want` bytes gets no such
	// benefit — its own trailing bytes are either complete or genuinely malformed.
	const useLen = sourceMayExceedWant ? trimIncompleteTail(bytes) : bytes.length;
	try {
		const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, useLen));
		return capBlock(`${HEADING}\n\n${text}`, sourceMayExceedWant);
	} catch {
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
		(event as any).systemPromptOptions.sections["nana-writing"] = block;
		orderNanaSections(event as any);
		return undefined;
	});
}
