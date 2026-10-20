/**
 * @module packages/nana-pack/lib/json-text.mjs
 * @purpose Parse BOM-tolerant JSON text and extract a safe line-and-column place from a JSON syntax error.
 * @inputs A string containing JSON text, optionally prefixed by U+FEFF, or an error from JSON.parse.
 * @outputs The parsed value, a { line, column } place without parser message text, and the shared config-failure prefix.
 * @effects none
 * @errors parseJsonText exposes JSON.parse's SyntaxError; jsonErrorPlace returns null when no place is reported.
 */
// Contract (R-1971, R-1972): V8 appends this place without punctuation; never expose the preceding parser message.
const JSON_ERROR_PLACE = /\(line (\d+) column (\d+)\)$/;
export const CONFIG_FAILURE_PREFIX = "NANA-PACK CONFIG UNPARSEABLE: ";

export function parseJsonText(text) {
	return JSON.parse(text.startsWith("\uFEFF") ? text.slice(1) : text);
}

export function jsonErrorPlace(error) {
	const match = JSON_ERROR_PLACE.exec(String(error?.message ?? error));
	return match ? { line: Number(match[1]), column: Number(match[2]) } : null;
}
