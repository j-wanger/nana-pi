/**
 * @module packages/nana-pack/lib/display.mjs
 * @purpose THE renderers for every repo-controlled string nana-pack puts into a prompt, the UI, Markdown or
 *  a file it writes.
 * @inputs any value (string or not), an optional length cap, and an optional set of extra characters to
 *  treat as unsafe
 * @outputs one bounded rendering per surface — promptPath/uiPath (one line, JSON-escaped when unsafe, ≤
 *  PATH_CAP, middle-elided), promptText/uiText/fileField (controls, breaks and bidi marks replaced by a
 *  space), codeSpan (or null when it would close the span), locator ({text, escaped}, exact and never
 *  elided)
 * @effects none
 * @errors none — every renderer is total: an unprintable value renders as `[unprintable]`, and an unsafe
 *  code span is refused with null rather than escaped
 */
/**
 * display — THE renderer for every repo-controlled string nana-pack interpolates into something a
 * model reads, a person sees, or a file we write (lane S1). Pick the renderer by the SURFACE the
 * string lands on, never by where it came from; no other module carries its own escaping rule.
 *
 *   surface                        path                text
 *   prompt / model-visible text    promptPath          promptText
 *   UI notification / status       uiPath              uiText
 *   Markdown read by the seat      codeSpan (refuses)  —
 *   a field of a file we write     —                   fileField
 *   exact locator in the prompt    locator             —
 *
 * displayPath / displayText are T2c's audited renderers, moved here from lib/objective.ts byte for
 * byte (objective re-exports them; its goldens depend on their output). The one addition is
 * `str()`: every renderer is TOTAL — undefined, a symbol, an object whose toString throws all
 * yield a string, because an extension handler must never throw.
 *
 * Plain .mjs on purpose (as lib/agent-dir.mjs): a .ts extension and a .mjs bin both import it.
 */
import * as path from "node:path";

/** Rendered length bound of one displayed path, quotes included. */
export const PATH_CAP = 320;

/** C0 (TAB included), DEL, C1, and the bidi marks/embeddings/overrides/isolates. U+001B (ESC, the ANSI introducer) is C0. */
export const CONTROL = /[\u0000-\u001f\u007f-\u009f\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/g;

/** Anything the hook's stdout and pi's prompt would render differently or that could break a line. */
export const PATH_UNSAFE = /[\u0000-\u001f\u007f-\u009f\u2028\u2029\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/;

/** Any value as a string, never throwing: a string as-is; anything else through String(), "[unprintable]" if that throws. */
export function str(x) {
	if (typeof x === "string") return x;
	try {
		const s = String(x);
		return typeof s === "string" ? s : "[unprintable]";
	} catch {
		return "[unprintable]";
	}
}

/** First n UTF-16 units, never ending on half a surrogate pair (a lone surrogate prints differently per runtime). */
export function head(s, n) {
	const c = s.charCodeAt(n - 1);
	return s.slice(0, c >= 0xd800 && c <= 0xdbff ? n - 1 : n);
}

/**
 * A path as prompt DISPLAY text — the one renderer for every interpolated path (governing
 * line, refusal, markers, precedence, notices). A clean path prints as-is. A path holding a
 * control char, line separator or bidi control is shown as a JSON string literal: `\` and `"`
 * escaped, every unsafe char as `\uXXXX` — so it is always ONE line and no control byte
 * reaches the prompt. The result, quotes included, is at most PATH_CAP chars: over it the
 * middle is elided ("…"), keeping the basename WHOLE when its rendering fits in half the cap,
 * else only the basename's TAIL. Lone surrogates are made well-formed first (runtime parity).
 *
 * `extra` (optional) names ADDITIONAL characters to treat as unsafe, for a caller whose own
 * surface has a character it cannot allow through — a field delimiter, say. Adding one only ever
 * escapes MORE, never less, and a caller that passes nothing gets exactly today's output, which
 * the objective goldens pin (S2: this replaced a stand-in-character trick in nana-knowledge).
 */
export function displayPath(p, extra = null) {
	const raw = str(p).toWellFormed();
	const isUnsafe = (c) => PATH_UNSAFE.test(c) || (extra !== null && extra.includes(c));
	const unsafe = Array.from(raw).some(isUnsafe);
	// An unsafe token may be an ASTRAL character, which Array.from yields as ONE string of TWO
	// UTF-16 units: escape both, or the low surrogate is dropped and the path no longer decodes
	// (sol S2 r3 — reachable only through `extra`, since PATH_UNSAFE holds no astral character).
	const esc = (c) =>
		Array.from({ length: c.length }, (_, i) => `\\u${c.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0")}`).join("");
	const tok = (c) => (isUnsafe(c) ? esc(c) : unsafe && (c === "\\" || c === '"') ? `\\${c}` : c);
	let toks = Array.from(raw, tok);
	const len = (t) => t.reduce((a, s) => a + s.length, 0);
	const cap = unsafe ? PATH_CAP - 2 : PATH_CAP; // the two quotes count
	if (len(toks) > cap) {
		const baseToks = Array.from(path.basename(raw), tok);
		// the basename (with its separator) is kept whole when it fits in half the cap; otherwise its tail is kept
		const tailBudget = len(baseToks) + 1 <= cap / 2 ? len(baseToks) + 1 : Math.floor(cap / 2);
		const tail = [];
		for (let i = toks.length - 1, used = 0; i >= 0 && used + toks[i].length <= tailBudget; i--) { tail.unshift(toks[i]); used += toks[i].length; }
		const front = [];
		for (let i = 0, used = 0; used + toks[i].length <= cap - 1 - len(tail); i++) { front.push(toks[i]); used += toks[i].length; }
		toks = [...front, "…", ...tail];
	}
	const s = toks.join("");
	return unsafe ? `"${s}"` : s;
}

/**
 * Arbitrary text (an error message, a config problem) as ONE line of display text: lone
 * surrogates made well-formed, every control, line break and bidi control replaced by a
 * space, then bounded to `cap` UTF-16 units (never ending on half a pair). Letters survive;
 * structure — a line an attacker could start — never does.
 */
export function displayText(s, cap = 400) {
	return head(str(s).toWellFormed().replace(CONTROL, " ").replace(/[\u2028\u2029]/g, " "), cap);
}

// ------------------------------------------------------------------ the surfaces

/** Prompt / model-visible text: a path is ONE line, escaped when unsafe, ≤ PATH_CAP. */
export const promptPath = displayPath;
/** Prompt / model-visible text: any text is ONE line, no control/bidi/separator, ≤ cap. */
export const promptText = displayText;
/**
 * UI notification and status: the SAME rule as the prompt. The control class already covers
 * U+001B (the ANSI escape introducer) and C1 (incl. U+009B CSI), so no terminal escape sequence
 * and no line break reaches the TUI through these. Do not re-derive a UI-specific rule.
 */
export const uiPath = displayPath;
/** UI notification and status text: see uiPath. */
export const uiText = displayText;
/**
 * A field of a file we write (`Key: value`): one line, bounded, no control character — the text
 * rule, so a value can never start a second field. A value that renders differently from its
 * input no longer equals it; a reader comparing the two must treat that as a mismatch.
 */
export const fileField = displayText;

/**
 * Markdown read by the seat (lane L5's rule): a string prints inside a code span ONLY when it
 * cannot close it or break its line — no backtick, no PATH_UNSAFE character (C0/DEL/C1, U+2028/9,
 * bidi controls). A backslash does not escape a backtick in a code span, so escaping is not an
 * option: an unsafe string is REFUSED (codeSpan returns null) and the caller counts or omits it.
 */
export const CODE_SPAN_CAP = 512;
export function codeSpanSafe(s, cap = CODE_SPAN_CAP) {
	return typeof s === "string" && s.length <= cap && !PATH_UNSAFE.test(s) && !s.includes("`");
}
/**
 * `s` as a Markdown code span, or null when codeSpanSafe(s) is false. Nothing is escaped.
 * Over-long is refused like any other unsafe value (sol r1 #3): a 4 KB span is unreadable to the
 * person it is written for, and every caller already has a "refused" branch. A caller with its own
 * tighter bound passes it as `cap`.
 */
export const codeSpan = (s, cap = CODE_SPAN_CAP) => (codeSpanSafe(s, cap) ? `\`${s}\`` : null);

/** Lone surrogates: escaped (never replaced) so a locator decodes to the exact path. */
const LONE = /^[\ud800-\udfff]$/;
/**
 * An EXACT locator in the prompt — a path the model must be able to reproduce byte for byte, so
 * it is never elided or capped (a long true path beats a short false one). Clean → as-is,
 * `escaped: false`. When it holds a PATH_UNSAFE char, a lone surrogate, or a char of `extra` (a
 * caller's class of chars its consumer would rewrite), the whole path is a JSON string literal:
 * `\` and `"` escaped, every such char as `\uXXXX` — JSON.parse returns the exact path.
 */
export function locator(p, extra = null) {
	const raw = str(p);
	const bad = (c) => PATH_UNSAFE.test(c) || LONE.test(c) || (extra != null && extra.test(c));
	const chars = Array.from(raw);
	if (!chars.some(bad)) return { text: raw, escaped: false };
	const esc = chars.map((c) => (bad(c) ? `\\u${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}` : c === "\\" || c === '"' ? `\\${c}` : c));
	return { text: `"${esc.join("")}"`, escaped: true };
}
