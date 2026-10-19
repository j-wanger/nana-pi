/**
 * @module packages/nana-pack/extensions/nana-rulings.ts
 * @purpose Append nana's standing rulings to every session's system prompt, read fresh at every
 *  session_start so an edited or a repaired copy is picked up at the next reason — the ninth
 *  pack extension.
 * @inputs pi `session_start` (every reason) and `before_agent_start` events; an injectable agent
 *  dir (opts.agentDir, defaulting to piAgentDir()); lib/rulings-config.mjs; lib/bounded-read.mjs
 * @outputs the rulings file's whole text under RULINGS_HEADING in the RULINGS_SECTION
 *  system-prompt section, or — when the installed file is missing, empty, not a regular file,
 *  over RULINGS_READ_CAP bytes or not valid UTF-8 — a one-line RULINGS_UNAVAILABLE marker naming
 *  the cause and the file, addressed to the user (an agent reading it tells the user; it never
 *  runs `nana-setup install` itself)
 * @effects disk (bounded-reads nana-rulings.md in pi's active agent dir)
 * @errors none — the handler swallows everything; an unusable file injects the marker rather
 *  than throwing, hanging, or exhausting memory
 */
/**
 * nana-rulings (rulings-file lane, 2026-10-19, must-meet.md / plan-attack.md): nana's standing
 * rulings, installed once into pi's active agent dir (`nana-setup install`, R-1412) and read
 * from there — never from the shipped pack file directly, unlike nana-writing, per the owner's
 * ruling to install rulings at user level `.pi`. Reading the shipped file directly was
 * considered and rejected (must-meet.md "Rejected"): it would drop R-1412 and R-1414, and the
 * stale-Windows-copy limit doctor exists to catch.
 *
 * The read goes through lib/bounded-read.mjs's `readBounded`, which itself refuses a directory,
 * a FIFO or any other non-regular file (ERR_NOT_REGULAR / EISDIR) and a file over the cap
 * (ERR_TOO_LARGE) without ever reading past the cap — so a FIFO with no writer or an oversized
 * file can neither hang nor exhaust memory here. An empty file (0 bytes) passes that read
 * untouched and is refused separately, below, because an empty rulings file carries no rulings
 * to inject.
 *
 * Unlike nana-writing, this never truncates: a file at or under the cap injects whole, and a
 * file over the cap is refused outright (it never silently drops the owner's newest ruling).
 */
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import * as path from "node:path";
import { readBounded } from "../lib/bounded-read.mjs";
import { piAgentDir } from "../lib/agent-dir.mjs";
import { RULINGS_FILE, RULINGS_HEADING, RULINGS_READ_CAP, RULINGS_SECTION, RULINGS_UNAVAILABLE } from "../lib/rulings-config.mjs";

/** A short, user-facing cause for the marker, from readBounded's thrown error code (or "empty",
 *  decided by the caller since readBounded itself does not refuse a zero-byte file) — never
 *  throws itself. */
function causeFor(err: unknown, isEmpty: boolean): string {
	if (isEmpty) return "empty";
	const code = (err as { code?: string } | null)?.code;
	switch (code) {
		case "ENOENT":
			return "missing";
		case "EISDIR":
			return "a directory";
		case "ERR_NOT_REGULAR":
			return "not a regular file";
		case "ERR_TOO_LARGE":
			return `larger than ${RULINGS_READ_CAP} bytes`;
		default: {
			const message = (err as { message?: string } | null)?.message;
			return message ? `unreadable (${message})` : "unreadable";
		}
	}
}

/** One line, addressed to the USER — an agent that reads this tells the user, and never runs
 *  `nana-setup install` on its own (R-1411). Never contains a newline. */
export function marker(cause: string, displayPath: string): string {
	return `${RULINGS_UNAVAILABLE} ${cause} at ${displayPath}. Tell the user; they restore it with \`nana-setup install\`.`;
}

/** Read `<agentDir>/nana-rulings.md` and build the block to inject: the whole file under
 *  RULINGS_HEADING, or the one-line marker. Never throws. */
export function buildBlock(agentDir: string = piAgentDir()): string {
	const filePath = path.join(agentDir, RULINGS_FILE);
	let bytes: Buffer;
	try {
		bytes = readBounded(filePath, RULINGS_READ_CAP);
	} catch (err) {
		return marker(causeFor(err, false), filePath);
	}
	if (bytes.length === 0) return marker(causeFor(null, true), filePath);
	try {
		const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		return `${RULINGS_HEADING}\n\n${text}`;
	} catch {
		return marker("not valid UTF-8", filePath);
	}
}

export default function (pi: ExtensionAPI, opts: { agentDir?: string } = {}) {
	let block: string | null = null;

	pi.on("session_start", async (_event, _ctx) => {
		// every reason, deliberately: a reload must re-read the file from disk (R-1410)
		try {
			block = buildBlock(opts.agentDir);
		} catch {
			block = null; // never throw out of a handler
		}
	});

	pi.on("before_agent_start", async (event, _ctx) => {
		if (!block) return undefined;
		(event as any).systemPromptOptions.sections[RULINGS_SECTION] = block;
		// Deliberately no orderNanaSections call and no edit to prompt-sections.mjs (must-meet.md
		// "Subtraction"): orderNanaSections leaves a non-nana key exactly where it already sits,
		// and no test pins a new canonical position for this section.
		return undefined;
	});
}
