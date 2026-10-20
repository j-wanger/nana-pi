/**
 * @module packages/nana-pack/lib/json-text.mjs
 * @purpose Decode marked UTF-16 or UTF-8 JSON and turn syntax errors into safe, shared config-failure details.
 * @inputs JSON bytes or text, optionally carrying one byte-order mark; a JSON.parse error; or a file and safe parse-failure classification.
 * @outputs The parsed value, a safe parse-failure classification without parser text, and the shared repair sentences in config-failure detail.
 * @effects none
 * @errors parseJsonBytes and parseJsonText expose SyntaxError; jsonErrorPlace returns null when no place is reported.
 */
// Contract (R-2230, R-2236): only these leading byte marks select UTF-16 decoding.
const UTF16_LE_MARK = Buffer.from([0xff, 0xfe]);
const UTF16_BE_MARK = Buffer.from([0xfe, 0xff]);
// Contract (R-1971, R-1972): V8 appends this place without punctuation; never expose the preceding parser message.
const JSON_ERROR_PLACE = /\(line (\d+) column (\d+)\)$/;
// Contract (R-1971, R-1972, R-2090, R-2091): V8 wording, the same on Node 22 and 24.
const BACKSLASH_JSON_ERROR = /^(?:Bad escaped character in JSON|Bad control character in string literal in JSON|Bad Unicode escape in JSON)\b/;
// Chosen: names no key; the doubling clause fixes a regex (R-2092).
export const FORWARD_SLASH_ADVICE = "Write paths in this file with forward slashes and any other backslash as two, because JSON reads a single backslash as an escape.";
// Contract value, R-1971 and R-1972.
export const MANUAL_JSON_ADVICE = "Repair the JSON by hand.";
export const CONFIG_FAILURE_PREFIX = "NANA-PACK CONFIG UNPARSEABLE: ";

export function parseJsonText(text) {
	return JSON.parse(text.startsWith("\uFEFF") ? text.slice(1) : text);
}

export function parseJsonBytes(bytes) {
	const buffer = Buffer.from(bytes);
	let text;
	if (buffer.subarray(0, 2).equals(UTF16_LE_MARK)) {
		if (buffer.length % 2 !== 0) throw new SyntaxError("UTF-16 JSON has an odd byte count");
		text = buffer.toString("utf16le");
	} else if (buffer.subarray(0, 2).equals(UTF16_BE_MARK)) {
		if (buffer.length % 2 !== 0) throw new SyntaxError("UTF-16 JSON has an odd byte count");
		text = Buffer.from(buffer).swap16().toString("utf16le");
	} else {
		text = buffer.toString("utf8");
	}
	return parseJsonText(text);
}

export function jsonErrorPlace(error) {
	const match = JSON_ERROR_PLACE.exec(String(error?.message ?? error));
	return match ? { line: Number(match[1]), column: Number(match[2]) } : null;
}

export function jsonParseFailure(error) {
	const message = String(error?.message ?? error);
	return { ...(jsonErrorPlace(error) ?? {}), repair: BACKSLASH_JSON_ERROR.test(message) ? "forward-slash" : "manual" };
}

export function configFailureDetail(file, failure) {
	const where = Number.isInteger(failure?.line) && Number.isInteger(failure?.column)
		? ` at line ${failure.line}, column ${failure.column}`
		: "";
	const advice = failure?.repair === "forward-slash" ? FORWARD_SLASH_ADVICE : MANUAL_JSON_ADVICE;
	return `${CONFIG_FAILURE_PREFIX}${file}${where}. ${advice}`;
}
