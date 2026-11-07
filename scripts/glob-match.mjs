/**
 * @module scripts/glob-match.mjs
 * @purpose Match report artifact paths against minimal dependency-free globs.
 * @inputs A glob pattern and a slash-separated path.
 * @outputs Boolean match result from globMatch.
 * @effects none
 * @errors None.
 */
/** Minimal glob: `*` within a segment, `**` across segments. No dependency, no surprises. */
export function globMatch(pattern, p) {
	const rx = new RegExp(
		`^${String(pattern)
			.split("**")
			.map((seg) => seg.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*").replace(/\?/g, "[^/]"))
			.join(".*")}$`,
	);
	return rx.test(p);
}
