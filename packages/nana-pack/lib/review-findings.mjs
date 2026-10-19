/**
 * @module packages/nana-pack/lib/review-findings.mjs
 * @purpose Read a review file's own verdict word and its MUST finding titles, by text alone.
 * @inputs the review file's text
 * @outputs verdictWordOf(text), mustTitlesOf(text)
 * @effects none
 * @errors none
 */
import { FINDING_MAX_CHARS, WORD_MUST } from "./review-timeline-config.mjs";

const HEADING_RE = /^(#{1,6})\s+(.*)$/;
const NUMBERED_RE = /^(\s*)\d+[.)]\s+(.*)$/;
const BULLET_RE = /^(\s*)[-*+]\s+(.*)$/;
const BOLD_LEAD_RE = /^(\s*)\*\*([^*]+)\*\*/;
// Rule 1 and rule 3 both look for the word, an em dash, then the title text.
const MUST_DASH_RE = new RegExp(`^${WORD_MUST}\\s+—\\s+(.+)$`);
// A bare MUST heading, or a bare **MUST** line, opens a rule-2 section.
const BARE_MUST_BOLD_RE = new RegExp(`^\\s*\\*\\*${WORD_MUST}\\*\\*\\s*$`);
// Rule 3: an optional list marker, then optional emphasis/code marks, stripped before the MUST — test.
const RULE3_PREFIX_RE = /^\s*(?:\d+[.)]\s*|[-*+]\s*)?[*_`]*/;
const VERDICT_RE = /VERDICT:\s*[*_`#\s]*([A-Z][A-Z-]*)/;

const isLabel = (boldText) => /:\s*$/.test(boldText.trim());

/** Drop a leading list marker and every emphasis/code mark, collapse whitespace runs to one
 *  space, then cut at the first sentence end or FINDING_MAX_CHARS, whichever comes first. */
function cleanTitle(raw) {
	let t = String(raw ?? "");
	t = t.replace(/^\s*(?:\d+[.)]|[-*+])\s+/, "");
	t = t.replace(/[*_`]+/g, "");
	t = t.replace(/\s+/g, " ").trim();
	const cut = new RegExp(`^(.{1,${FINDING_MAX_CHARS}}?[.!?])(?=\\s|$)`);
	const m = cut.exec(t);
	return m ? m[1] : t.slice(0, FINDING_MAX_CHARS);
}

/** The verdict word on the text's LAST line (by position) carrying the literal `VERDICT:` label —
 *  not necessarily the file's last line, so a verdict stated only on the first line is still read
 *  when nothing later repeats the label. Split on \r?\n. Returns null when no line carries it. */
export function verdictWordOf(text) {
	const lines = String(text ?? "").split(/\r?\n/);
	for (let i = lines.length - 1; i >= 0; i--) {
		const m = VERDICT_RE.exec(lines[i]);
		if (m) return m[1];
	}
	return null;
}

/**
 * Every MUST finding title the text states, in document order, by three rules:
 *  1. a heading reading `MUST — <title>` is one finding, atomic;
 *  2. a bare `MUST` heading, or a bare `**MUST**` line, opens a section whose findings are every
 *     sibling of the FIRST item form seen in it — a deeper heading, a numbered item, a bullet, or
 *     a bold-led paragraph whose bold text is not a label ending in `:` — ending at a heading of
 *     the same or a higher level;
 *  3. a line that, after an optional list marker and emphasis marks, starts with `MUST —` is one
 *     finding.
 * A line counts once, toward whichever rule reaches it first. Split on \r?\n.
 */
export function mustTitlesOf(text) {
	const lines = String(text ?? "").split(/\r?\n/);
	const counted = new Set();
	const findings = [];

	// Rule 1: a heading reading MUST — <title> is its own, atomic finding.
	for (let i = 0; i < lines.length; i++) {
		const h = HEADING_RE.exec(lines[i]);
		if (!h) continue;
		const m = MUST_DASH_RE.exec(h[2].trim());
		if (m) {
			findings.push({ i, title: cleanTitle(m[1]) });
			counted.add(i);
		}
	}

	// Rule 2: a MUST section (heading or bare **MUST** line) collects every sibling of its first
	// item's own form.
	for (let i = 0; i < lines.length; i++) {
		if (counted.has(i)) continue;
		const h = HEADING_RE.exec(lines[i]);
		let openerLevel = null;
		if (h && h[2].trim() === WORD_MUST) openerLevel = h[1].length;
		else if (BARE_MUST_BOLD_RE.test(lines[i])) openerLevel = Infinity;
		if (openerLevel === null) continue;

		let end = lines.length;
		for (let j = i + 1; j < lines.length; j++) {
			const hh = HEADING_RE.exec(lines[j]);
			if (hh && hh[1].length <= openerLevel) {
				end = j;
				break;
			}
		}

		let form = null;
		let indent = null;
		for (let j = i + 1; j < end; j++) {
			const line = lines[j];
			if (!line.trim()) continue;
			const hh = HEADING_RE.exec(line);
			if (hh) {
				form = "heading";
				indent = hh[1].length;
				break;
			}
			const nn = NUMBERED_RE.exec(line);
			if (nn) {
				form = "numbered";
				indent = nn[1].length;
				break;
			}
			const bb = BULLET_RE.exec(line);
			if (bb) {
				form = "bullet";
				indent = bb[1].length;
				break;
			}
			const boldM = BOLD_LEAD_RE.exec(line);
			if (boldM && !isLabel(boldM[2])) {
				form = "bold";
				indent = boldM[1].length;
				break;
			}
			break; // the first non-blank line in the section matches no item form: no findings here
		}
		if (!form) continue;

		for (let j = i + 1; j < end; j++) {
			if (counted.has(j)) continue;
			const line = lines[j];
			if (!line.trim()) continue;
			let title = null;
			if (form === "heading") {
				const hh = HEADING_RE.exec(line);
				if (hh && hh[1].length === indent) title = cleanTitle(hh[2]);
			} else if (form === "numbered") {
				const nn = NUMBERED_RE.exec(line);
				if (nn && nn[1].length === indent) title = cleanTitle(nn[2]);
			} else if (form === "bullet") {
				const bb = BULLET_RE.exec(line);
				if (bb && bb[1].length === indent) title = cleanTitle(bb[2]);
			} else if (form === "bold") {
				const boldM = BOLD_LEAD_RE.exec(line);
				if (boldM && boldM[1].length === indent && !isLabel(boldM[2])) title = cleanTitle(boldM[2]);
			}
			if (title !== null) {
				findings.push({ i: j, title });
				counted.add(j);
			}
		}
	}

	// Rule 3: a standalone line starting with MUST — (after an optional marker and marks).
	for (let i = 0; i < lines.length; i++) {
		if (counted.has(i)) continue;
		const stripped = lines[i].replace(RULE3_PREFIX_RE, "");
		const m = MUST_DASH_RE.exec(stripped);
		if (m) {
			findings.push({ i, title: cleanTitle(m[1]) });
			counted.add(i);
		}
	}

	findings.sort((a, b) => a.i - b.i);
	return findings.map((f) => f.title);
}
