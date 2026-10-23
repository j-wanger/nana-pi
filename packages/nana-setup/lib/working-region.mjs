/**
 * @module packages/nana-setup/lib/working-region.mjs
 * @purpose Read and compare the canonical marker-owned AGENTS.md working section without loading the project command.
 * @inputs AGENTS.md text, the shared working-section file, SHARED_DIR and Node filesystem APIs.
 * @outputs WORKING_BEGIN, WORKING_END, WORKING_FILE, markerLines(), readSharedWorking() and regionVerdict().
 * @effects disk (reads the shared working-section file).
 * @errors readSharedWorking propagates filesystem errors; markerLines and regionVerdict are pure and total for strings.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { SHARED_DIR } from "./paths.mjs";

export const WORKING_BEGIN = "<!-- nana:working-under-nana-pi begin -->";
export const WORKING_END = "<!-- nana:working-under-nana-pi end -->";
/** contract: R-859 — the canonical shared working-section filename. */
export const WORKING_FILE = "working-under-nana-pi.md";

export function markerLines(text) {
	const lines = [];
	let fence = null;
	let offset = 0;
	for (const line of text.matchAll(/[^\n]*(?:\n|$)/g)) {
		if (!line[0] && offset >= text.length) break;
		const raw = line[0];
		const body = raw.replace(/\r?\n$/, "");
		const opening = /^\s*(`{3,}|~{3,})/.exec(body);
		const closing = /^\s*(`{3,}|~{3,})\s*$/.exec(body);
		if (fence === null && opening) fence = { char: opening[1][0], length: opening[1].length };
		else if (fence !== null && closing && closing[1][0] === fence.char && closing[1].length >= fence.length) fence = null;
		else if (fence === null && (body === WORKING_BEGIN || body === WORKING_END)) {
			lines.push({ marker: body, start: offset, end: offset + raw.length });
		}
		offset += raw.length;
	}
	return lines;
}

export function readSharedWorking() {
	return fs.readFileSync(path.join(SHARED_DIR, WORKING_FILE), "utf8");
}

export function regionVerdict(text, shared) {
	const markers = markerLines(text);
	const begins = markers.filter((marker) => marker.marker === WORKING_BEGIN);
	const ends = markers.filter((marker) => marker.marker === WORKING_END);
	if (begins.length !== 1 || ends.length !== 1 || begins[0].start >= ends[0].start) return "malformed";
	const actual = text.slice(begins[0].end, ends[0].start).replace(/\r\n/g, "\n");
	const expected = shared.replace(/\r\n/g, "\n");
	return actual === expected ? "match" : "differs";
}
