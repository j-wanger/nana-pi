/**
 * @module packages/nana-pack/lib/json-text.mjs
 * @purpose Parse BOM-tolerant JSON text and turn JSON syntax errors into safe, shared config-failure details.
 * @inputs A string containing JSON text, optionally prefixed by U+FEFF; an error from JSON.parse; or a file and safe parse-failure classification.
 * @outputs The parsed value, a safe parse-failure classification without parser text, and the shared config-failure detail.
 * @effects none
 * @errors parseJsonText exposes JSON.parse's SyntaxError; jsonErrorPlace returns null when no place is reported.
 */
// Contract (R-1971, R-1972): V8 appends this place without punctuation; never expose the preceding parser message.
const JSON_ERROR_PLACE = /\(line (\d+) column (\d+)\)$/;
const BACKSLASH_JSON_ERROR = /^(?:Bad escaped character in JSON|Bad control character in string literal in JSON)\b/;
const FORWARD_SLASH_ADVICE = "Write objective.path with forward slashes because JSON reads a single backslash as an escape.";
const MANUAL_JSON_ADVICE = "Repair the JSON by hand.";
export const CONFIG_FAILURE_PREFIX = "NANA-PACK CONFIG UNPARSEABLE: ";

export function parseJsonText(text) {
	return JSON.parse(text.startsWith("\uFEFF") ? text.slice(1) : text);
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
