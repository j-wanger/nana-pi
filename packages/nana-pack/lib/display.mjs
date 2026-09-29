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
 */
export function displayPath(p) {
	const raw = str(p).toWellFormed();
	const unsafe = PATH_UNSAFE.test(raw);
	const tok = (c) =>
		PATH_UNSAFE.test(c) ? `\\u${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0")}` : unsafe && (c === "\\" || c === '"') ? `\\${c}` : c;
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
export function codeSpanSafe(s) {
	return typeof s === "string" && !PATH_UNSAFE.test(s) && !s.includes("`");
}
/** `s` as a Markdown code span, or null when codeSpanSafe(s) is false. Nothing is escaped. */
export const codeSpan = (s) => (codeSpanSafe(s) ? `\`${s}\`` : null);

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
