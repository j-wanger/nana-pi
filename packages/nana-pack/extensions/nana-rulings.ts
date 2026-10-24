/**
 * @module packages/nana-pack/extensions/nana-rulings.ts
 * @purpose Append nana's standing rulings plus stale-install and adopted-project file-row guidance to every session's system prompt.
 * @inputs pi `session_start` and `before_agent_start` events; session cwd; an injectable agent dir; rulings, bounded-read and stale-copy helpers.
 * @outputs rulings text or its unavailable marker in RULINGS_SECTION, plus independent stale-install and project-stale sections when applicable.
 * @effects disk (bounded-reads installed rulings and project text, inspects project file rows, and compares shipped sources)
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
import { fileURLToPath } from "node:url";
import { readBounded, readFailureCause } from "../lib/bounded-read.mjs";
import { piAgentDir } from "../lib/agent-dir.mjs";
import { RULINGS_FILE, RULINGS_HEADING, RULINGS_READ_CAP, RULINGS_SECTION, RULINGS_UNAVAILABLE } from "../lib/rulings-config.mjs";
import { PROJECT_STALE_SECTION, STALE_SECTION } from "../../nana-setup/lib/stale-copies-config.mjs";
import { linkOk, projectStaleLine, staleNotice } from "../../nana-setup/lib/stale-copies.mjs";

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
		return marker(readFailureCause(err, RULINGS_READ_CAP), filePath);
	}
	if (bytes.length === 0) return marker("empty", filePath);
	try {
		const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
		return `${RULINGS_HEADING}\n\n${text}`;
	} catch {
		return marker("not valid UTF-8", filePath);
	}
}

export default function (pi: ExtensionAPI, opts: { agentDir?: string } = {}) {
	let block: string | null = null;
	let stale = false;
	let projectStale = "";

	pi.on("session_start", async (_event, ctx) => {
		// every reason, deliberately: a reload must re-read the file from disk (R-1410)
		try {
			const agentDir = opts.agentDir ?? piAgentDir();
			block = buildBlock(agentDir);
			stale = block.startsWith(`${RULINGS_HEADING}\n\n`) && !linkOk(path.join(agentDir, RULINGS_FILE), fileURLToPath(new URL("../rules/nana-rulings.md", import.meta.url)));
		} catch {
			block = null;
			stale = false; // never throw out of a handler
		}
		try {
			projectStale = projectStaleLine(ctx?.cwd);
		} catch {
			projectStale = "";
		}
	});

	pi.on("before_agent_start", async (event, _ctx) => {
		try {
			if (block) (event as any).systemPromptOptions.sections[RULINGS_SECTION] = block;
			if (stale) (event as any).systemPromptOptions.sections[STALE_SECTION] = staleNotice([`pi ${RULINGS_FILE}`]);
			if (projectStale) (event as any).systemPromptOptions.sections[PROJECT_STALE_SECTION] = projectStale;
		} catch {
			// A malformed event must not throw out of an extension handler.
		}
		// Deliberately no orderNanaSections call and no edit to prompt-sections.mjs (must-meet.md
		// "Subtraction"): orderNanaSections leaves a non-nana key exactly where it already sits,
		// and no test pins a new canonical position for this section.
		return undefined;
	});
}
