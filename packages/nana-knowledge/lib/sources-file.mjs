/**
 * @module packages/nana-knowledge/lib/sources-file.mjs
 * @purpose Read sources.json into a parsed value or a safe problem, and word that problem.
 * @inputs a sources.json file path and its bytes
 * @outputs absent, parsed file value, safe source problem, status marker text and frozen-index notice
 * @effects disk (reads sources.json)
 * @errors returns absent, parsed, or safe problem states; never throws
 */
import * as fs from "node:fs";
import { FORWARD_SLASH_ADVICE, jsonParseFailure, MANUAL_JSON_ADVICE, parseJsonBytes } from "../../nana-pack/lib/json-text.mjs";

// Contract markers, R-2372 and R-2375; moved unchanged from sources.ts.
export const UNPARSEABLE_MARKER = "UNPARSEABLE";
export const UNREADABLE_MARKER = "UNREADABLE";

// Contract (R-2860 and R-2862), sealed; the seat's wording, 2026-10-25.
export const SOURCES_FROZEN_CLAUSE = "The knowledge index is frozen until the user repairs sources.json; the next build after the repair rescans it.";

/** Read sources.json without seeding it; only ENOENT means absent. */
export function readSourcesFile(file) {
	let bytes;
	try {
		bytes = fs.readFileSync(file);
	} catch (error) {
		if (error?.code === "ENOENT") return { status: "absent" };
		return { status: "problem", problem: { kind: "unreadable" } };
	}
	try {
		return { status: "parsed", value: parseJsonBytes(bytes) };
	} catch (error) {
		return { status: "problem", problem: { kind: "unparseable", ...jsonParseFailure(error) } };
	}
}

/** Safe CLI marker for a sources.json problem; never includes parser or file text. */
export function formatSourcesProblem(problem) {
	if (problem.kind === "unreadable") return `${UNREADABLE_MARKER} (no roots read, rows kept).`;
	const place = Number.isInteger(problem.line) && Number.isInteger(problem.column)
		? ` at line ${problem.line}, column ${problem.column}`
		: "";
	const advice = problem.repair === "forward-slash" ? FORWARD_SLASH_ADVICE : MANUAL_JSON_ADVICE;
	return `${UNPARSEABLE_MARKER}${place} (no roots read, rows kept). ${advice}`;
}

/** Join the exact status marker and the sealed frozen-index direction. */
export function frozenNotice(problem) {
	return `${formatSourcesProblem(problem)} ${SOURCES_FROZEN_CLAUSE}`;
}
