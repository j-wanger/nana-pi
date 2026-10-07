/**
 * @module packages/nana-pack/lib/writing-check.mjs
 * @purpose The pure checks behind the writing checker: extract Markdown-aware prose blocks and find every length, passive-candidate, banned-word, verdict and identifier finding, plus the summary line.
 * @inputs a label and its text (checkText); an array of per-input results (summaryLine); --report on/off
 * @outputs per input, {label, findings, stats}; one aggregate summary line string over every input checked
 * @effects none
 * @errors none
 */
// The writing checker's pure core (design-ruling.md, 2026-10-04, §3, amended Amendment 1 §A2
// after astra r1 MUST 3: splitting is Markdown-aware, not newline-naive). The bin does argv and
// I/O only; every decision here is a function of its input text, so it is testable with no
// filesystem and no stdin.
import { BANNED_WORDS, IDENTIFIER_CODE_SPAN, IDENTIFIER_PATH, MIN_SENTENCE_WORDS, PASSIVE, PASSIVE_EXCEPTIONS, SENTENCE_CAP, VERDICT_WORDS } from "./writing-config.mjs";

const URL_RE = /https?:\/\/\S+/g;
/** A sentence ends at ., ! or ?, optionally followed by a closing quote or bracket, then
 *  whitespace or the end (Amendment 1 §A2 rule 6). */
const SENTENCE_END = /[.!?](?=["'’”)\]]*(?:\s|$))/g;
const FENCE_RE = /^\s{0,3}(`{3,}|~{3,})/;
const HEADING_RE = /^\s{0,3}#{1,6}(?:\s|$)/;
const TABLE_ROW_RE = /^\s{0,3}\|/;
const LIST_RE = /^\s{0,3}(?:[-*+]|\d+[.)])\s+(.*)$/;
const BLANK_RE = /^\s*$/;

/** Mask every code span / URL with same-length filler so a period inside one never splits a
 *  sentence — the one simplification the design accepts. Known limit (recorded in the pack
 *  README, not fixed): "e.g." and "vs." still split early — no abbreviation engine. */
function mask(s) {
	return s.replace(IDENTIFIER_CODE_SPAN, (m) => "#".repeat(m.length)).replace(URL_RE, (m) => "#".repeat(m.length));
}

const words = (s) => s.split(/\s+/).filter(Boolean);
const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Markdown-aware block extraction (Amendment 1 §A2, rules 1-5). Returns:
 *  - proseBlocks: paragraphs and list items, soft-wrap joined within a block, each segment
 *    carrying the physical line it came from. Headings, table rows and fenced lines never
 *    become a prose block.
 *  - bannedLines: every physical line the banned-word scan reads — every line NOT inside a
 *    fence (fenced lines are skipped by every check; a heading or table row is still read).
 * A fence toggles on a line of 3+ backticks or tildes (optional up-to-3-space indent).
 */
export function extractBlocks(text) {
	const lines = text.split(/\r\n|\r|\n/);
	const proseBlocks = [];
	const bannedLines = [];
	let fenced = false;
	let current = null; // { segments: [{ line, text }] }
	const flush = () => {
		if (current && current.segments.length) proseBlocks.push(current);
		current = null;
	};
	lines.forEach((raw, i) => {
		const lineNo = i + 1;
		if (FENCE_RE.test(raw)) {
			fenced = !fenced;
			flush();
			return;
		}
		if (fenced) return; // every check skips fenced lines, banned included
		bannedLines.push({ line: lineNo, text: raw });
		if (BLANK_RE.test(raw) || HEADING_RE.test(raw) || TABLE_ROW_RE.test(raw)) {
			flush();
			return;
		}
		const list = LIST_RE.exec(raw);
		if (list) {
			flush();
			current = { segments: [{ line: lineNo, text: list[1].trim() }] };
			return;
		}
		if (!current) current = { segments: [] };
		current.segments.push({ line: lineNo, text: raw.trim() });
	});
	flush();
	return { proseBlocks, bannedLines };
}

/** One block's segments, soft-wrap joined into one string, plus a function mapping a
 *  character offset in that joined string back to the physical line it came from. */
function joinBlock(block) {
	let joined = "";
	const starts = []; // { at, line }, in order
	for (const seg of block.segments) {
		if (joined) joined += " ";
		starts.push({ at: joined.length, line: seg.line });
		joined += seg.text;
	}
	const lineAt = (offset) => {
		let line = starts[0]?.line ?? 1;
		for (const s of starts) {
			if (s.at <= offset) line = s.line;
			else break;
		}
		return line;
	};
	return { text: joined, lineAt };
}

/** Every sentence across every prose block, each with the line it STARTS on (Amendment 1
 *  §A2 rule 7). Soft-wrapped lines joined into one block give the SAME sentence (and the
 *  same word count) as the one-line form — the fixture MUST 3 asked for. */
export function splitSentences(text) {
	const { proseBlocks } = extractBlocks(text);
	const out = [];
	for (const block of proseBlocks) {
		const { text: joined, lineAt } = joinBlock(block);
		const masked = mask(joined);
		let start = 0;
		let m;
		SENTENCE_END.lastIndex = 0;
		while ((m = SENTENCE_END.exec(masked))) {
			const raw = joined.slice(start, m.index + 1);
			const piece = raw.trim();
			// astra r2 MUST 2: the line is the sentence's FIRST RETAINED character, not the
			// untrimmed slice start — a soft wrap joins two lines with one space, and that
			// space (trimmed away here) sat at the untrimmed start, which is the PRECEDING
			// line; the retained text always begins one line later.
			if (piece) out.push({ text: piece, words: words(piece).length, line: lineAt(start + (raw.length - raw.trimStart().length)) });
			start = m.index + 1;
		}
		const rawRest = joined.slice(start);
		const rest = rawRest.trim();
		if (rest) out.push({ text: rest, words: words(rest).length, line: lineAt(start + (rawRest.length - rawRest.trimStart().length)) });
	}
	return out;
}

/** The counted sentences: MIN_SENTENCE_WORDS filters out a heading or a bullet label. */
export function countedSentences(sentences) {
	return sentences.filter((s) => s.words >= MIN_SENTENCE_WORDS);
}

export function lengthFindings(sentences) {
	return countedSentences(sentences)
		.filter((s) => s.words > SENTENCE_CAP)
		.map((s) => ({ line: s.line, check: "length", detail: `${s.words} words (cap ${SENTENCE_CAP})` }));
}

/** The first passive-voice candidate in a sentence not on PASSIVE_EXCEPTIONS, or null.
 *  Astra r1 SHOULD 1: an exception matches the candidate word WHOLE, not as a prefix — the
 *  old prefix match wrongly excused real passives like "is needed". */
export function passiveCandidate(sentenceText) {
	const re = new RegExp(PASSIVE.source, "gi");
	let m;
	while ((m = re.exec(sentenceText))) {
		const word = m[1].toLowerCase();
		if (!PASSIVE_EXCEPTIONS.some((stem) => word === stem.toLowerCase())) return m[1];
	}
	return null;
}

/** "passive candidate", not "passive voice" (astra r1 SHOULD 1): the pattern is a heuristic,
 *  currently measured at 100.0% precision / 66.7% recall on the 24-sentence labelled
 *  diagnostic fixture in the test suite (astra r2 SHOULD 1: the pre-fix measurement on the
 *  same sentences was 77.8%/58.3%) — report-only, so a false positive costs one line, never a
 *  block. */
export function passiveFindings(sentences) {
	const out = [];
	for (const s of countedSentences(sentences)) {
		const word = passiveCandidate(s.text);
		if (word) out.push({ line: s.line, check: "passive", detail: `passive candidate: "${word}" in "${s.text}"` });
	}
	return out;
}

/** Every occurrence of a banned word OUTSIDE a code span (R-746, amended Amendment 1 §A3: a
 *  quoted word is a mention, not a use), case-insensitive, scanned per line — a heading or a
 *  bullet label can carry one too, so this reads every bannedLine, not just prose. */
export function bannedFindings(text) {
	const { bannedLines } = extractBlocks(text);
	const out = [];
	for (const { line, text: raw } of bannedLines) {
		const masked = raw.replace(IDENTIFIER_CODE_SPAN, (m) => "#".repeat(m.length));
		for (const word of BANNED_WORDS) {
			const re = new RegExp(escapeRegExp(word), "gi");
			let m;
			while ((m = re.exec(masked))) out.push({ line, check: "banned", detail: `"${m[0]}"` });
		}
	}
	return out;
}

/** True only when a listed uppercase verdict is the first token, allowing leading emphasis markers. */
function hasVerdictWord(text) {
	const firstToken = text.trim().replace(/^(?:[*_~]{1,2})*/, "");
	return VERDICT_WORDS.some((word) => new RegExp(`^${escapeRegExp(word)}(?=$|[\\s.,!?;:])`).test(firstToken));
}

/** null when the first prose sentence carries a verdict word/phrase (no finding); a finding
 *  otherwise — including when there IS no first prose sentence at all (empty input, or input
 *  that is only headings/tables/fences): astra r1 MUST 2 found empty input read as verdict=yes. */
export function verdictFinding(firstSentenceText) {
	const text = firstSentenceText ?? "";
	if (text && hasVerdictWord(text)) return null;
	return {
		line: 1,
		check: "verdict",
		detail: text ? `first sentence "${text}" carries no verdict word` : "no prose sentence carries a verdict word (empty input)",
	};
}

/** Every backtick span, plus every slash-path token NOT already inside a backtick span (so a
 *  backticked path is counted once, as the span) — scanned over PROSE segments only (Amendment
 *  1 §A2: a fence, heading or table row never produces an identifier finding). */
export function identifierFindings(text) {
	const { proseBlocks } = extractBlocks(text);
	const out = [];
	for (const block of proseBlocks) {
		for (const { line, text: raw } of block.segments) {
			let m;
			const spanRe = new RegExp(IDENTIFIER_CODE_SPAN.source, "g");
			while ((m = spanRe.exec(raw))) out.push({ line, check: "identifier", detail: m[0] });
			const withoutSpans = raw.replace(IDENTIFIER_CODE_SPAN, (s) => "#".repeat(s.length));
			const pathRe = new RegExp(IDENTIFIER_PATH.source, "g");
			while ((m = pathRe.exec(withoutSpans))) out.push({ line, check: "identifier", detail: raw.slice(m.index, m.index + m[0].length) });
		}
	}
	return out;
}

/**
 * Check one input (a file's text, or stdin's). The four always-on checks (length, passive,
 * banned, and the summary line this feeds) run unconditionally; verdict and identifier run
 * only `{report: true}` (R-747, R-748). Findings are sorted by line. `stats.verdict` is a
 * boolean pass/fail in report mode, null otherwise (summaryLine turns it into a k/n share).
 */
export function checkText(label, text, { report = false } = {}) {
	const sentences = splitSentences(text);
	const counted = countedSentences(sentences);
	const findings = [...lengthFindings(sentences), ...passiveFindings(sentences), ...bannedFindings(text)];
	let verdict = null; // boolean (report mode) | null (not checked, --report not given)
	if (report) {
		const first = sentences[0]?.text ?? null;
		const finding = verdictFinding(first);
		verdict = !finding;
		if (finding) findings.push(finding);
		findings.push(...identifierFindings(text));
	}
	findings.sort((a, b) => a.line - b.line);
	return {
		label,
		findings,
		stats: {
			sentences: counted.length,
			words: counted.reduce((n, s) => n + s.words, 0),
			over: findings.filter((f) => f.check === "length").length,
			passive: findings.filter((f) => f.check === "passive").length,
			banned: findings.filter((f) => f.check === "banned").length,
			identifiers: findings.filter((f) => f.check === "identifier").length,
			verdict,
		},
	};
}

/** The one closing summary line over every input checked (R-749). In report mode `verdict`
 *  is the cross-file SHARE `<passes>/<inputs checked>` (Amendment 1 §A4, SHOULD 2 fix — the
 *  old build kept only the first non-null reading, so one pass + one fail read as "yes"); it
 *  is `n/a` outside report mode. */
export function summaryLine(results) {
	const agg = { sentences: 0, words: 0, over: 0, passive: 0, banned: 0, identifiers: 0 };
	let checked = 0;
	let passed = 0;
	for (const r of results) {
		agg.sentences += r.stats.sentences;
		agg.words += r.stats.words;
		agg.over += r.stats.over;
		agg.passive += r.stats.passive;
		agg.banned += r.stats.banned;
		agg.identifiers += r.stats.identifiers;
		if (r.stats.verdict !== null) {
			checked++;
			if (r.stats.verdict) passed++;
		}
	}
	const verdict = checked > 0 ? `${passed}/${checked}` : "n/a";
	return `summary sentences=${agg.sentences} words=${agg.words} over=${agg.over} passive=${agg.passive} banned=${agg.banned} verdict=${verdict} identifiers=${agg.identifiers}`;
}
