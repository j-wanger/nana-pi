/**
 * @module packages/nana-pack/lib/json-text.mjs
 * @purpose Parse JSON text after removing exactly one leading UTF-8 byte-order mark.
 * @inputs A string containing JSON text, optionally prefixed by U+FEFF.
 * @outputs The value returned by JSON.parse.
 * @effects none
 * @errors JSON.parse's SyntaxError.
 */
export function parseJsonText(text) {
	return JSON.parse(text.startsWith("\uFEFF") ? text.slice(1) : text);
}
