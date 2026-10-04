/**
 * @module packages/nana-pack/lib/writing-check.mjs
 * @purpose The pure checks behind the writing checker: split text into sentences and find every length, passive-voice, banned-word, verdict and identifier finding, plus the summary line.
 * @inputs a label and its text (checkText); an array of per-input results (summaryLine); --report on/off
 * @outputs per input, {label, findings, stats}; one aggregate summary line string over every input checked
 * @effects none
 * @errors none
 */
// The writing checker's pure core (design-ruling.md, 2026-10-04, §3). The bin does argv and
// I/O only; every decision here is a function of its input text, so it is testable with no
// filesystem and no stdin.
import { BANNED_WORDS, IDENTIFIER_CODE_SPAN, IDENTIFIER_PATH, MIN_SENTENCE_WORDS, PASSIVE, PASSIVE_EXCEPTIONS, SENTENCE_CAP, VERDICT_WORDS } from "./writing-config.mjs";

const URL_RE = /https?:\/\/\S+/g;
const SENTENCE_END = /[.!?](?=\s|$)/g;

/** Mask every code span / URL with same-length filler so a period inside one never splits a
 *  sentence — the one simplification the design accepts. Known limit (recorded in the pack
 *  README, not fixed): "e.g." and "vs." still split early — no abbreviation engine. */
function mask(line) {
	return line.replace(IDENTIFIER_CODE_SPAN, (m) => "#".repeat(m.length)).replace(URL_RE, (m) => "#".repeat(m.length));
}

const words = (s) => s.split(/\s+/).filter(Boolean);

/** Every sentence-shaped chunk of ONE physical line, in order, each with its own word count —
 *  UNFILTERED by MIN_SENTENCE_WORDS (a caller filters for counting; the verdict check does
 *  not, because a verdict word is itself expected to be a one-word sentence, e.g. "LANDED."). */
export function splitLine(line) {
	const masked = mask(line);
	const chunks = [];
	let start = 0;
	let m;
	SENTENCE_END.lastIndex = 0;
	while ((m = SENTENCE_END.exec(masked))) {
		const piece = line.slice(start, m.index + 1).trim();
		if (piece) chunks.push(piece);
		start = m.index + 1;
	}
	const rest = line.slice(start).trim();
	if (rest) chunks.push(rest);
	return chunks.map((text) => ({ text, words: words(text).length }));
}

/** Every sentence in a whole text, each carrying its 1-based line number, in order. A line
 *  break always ends a sentence — no sentence spans two physical lines. */
export function splitSentences(text) {
	const out = [];
	text.split(/\r\n|\r|\n/).forEach((line, i) => {
		for (const s of splitLine(line)) out.push({ ...s, line: i + 1 });
	});
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

/** The first passive-voice candidate in a sentence not on PASSIVE_EXCEPTIONS, or null. */
export function passiveCandidate(sentenceText) {
	const re = new RegExp(PASSIVE.source, "gi");
	let m;
	while ((m = re.exec(sentenceText))) {
		const word = m[1].toLowerCase();
		if (!PASSIVE_EXCEPTIONS.some((stem) => word.startsWith(stem.toLowerCase()))) return m[1];
	}
	return null;
}

export function passiveFindings(sentences) {
	const out = [];
	for (const s of countedSentences(sentences)) {
		const word = passiveCandidate(s.text);
		if (word) out.push({ line: s.line, check: "passive", detail: `"${word}" in "${s.text}"` });
	}
	return out;
}

/** Every occurrence of a banned word, scanned per line (not sentence-scoped: a heading or a
 *  bullet label can carry one too). */
export function bannedFindings(text) {
	const out = [];
	text.split(/\r\n|\r|\n/).forEach((line, i) => {
		for (const word of BANNED_WORDS) {
			const re = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
			let m;
			while ((m = re.exec(line))) out.push({ line: i + 1, check: "banned", detail: `"${m[0]}"` });
		}
	});
	return out;
}

/** null when the text carries a verdict word (no finding); a finding otherwise. "Carries"
 *  means contains, not starts with — "LANDED." and "The work is LANDED now." both pass. */
export function verdictFinding(firstSentenceText) {
	if (firstSentenceText == null) return null;
	const upper = firstSentenceText.toUpperCase();
	if (VERDICT_WORDS.some((w) => upper.includes(w))) return null;
	return { line: 1, check: "verdict", detail: `first sentence "${firstSentenceText}" carries no verdict word` };
}

/** Every backtick span, plus every slash-path token NOT already inside a backtick span
 *  (so a backticked path is counted once, as the span). */
export function identifierFindings(text) {
	const out = [];
	text.split(/\r\n|\r|\n/).forEach((line, i) => {
		let m;
		const spanRe = new RegExp(IDENTIFIER_CODE_SPAN.source, "g");
		while ((m = spanRe.exec(line))) out.push({ line: i + 1, check: "identifier", detail: m[0] });
		const withoutSpans = line.replace(IDENTIFIER_CODE_SPAN, (s) => "#".repeat(s.length));
		const pathRe = new RegExp(IDENTIFIER_PATH.source, "g");
		while ((m = pathRe.exec(withoutSpans))) out.push({ line: i + 1, check: "identifier", detail: line.slice(m.index, m.index + m[0].length) });
	});
	return out;
}

/**
 * Check one input (a file's text, or stdin's). The four always-on checks (length, passive,
 * banned, and the summary line this feeds) run unconditionally; verdict and identifier run
 * only `{report: true}` (R-747, R-748). Findings are sorted by line.
 */
export function checkText(label, text, { report = false } = {}) {
	const sentences = splitSentences(text);
	const counted = countedSentences(sentences);
	const findings = [...lengthFindings(sentences), ...passiveFindings(sentences), ...bannedFindings(text)];
	let verdict = null; // "yes" | "no" | null (null = not checked, --report not given)
	if (report) {
		const first = sentences[0]?.text ?? null;
		const finding = verdictFinding(first);
		verdict = finding ? "no" : "yes";
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

/** The one closing summary line over every input checked (R-749): aggregate counts, and the
 *  first non-null verdict reading (there is one "first sentence" per run in the ordinary,
 *  single-input case this checker is built for). */
export function summaryLine(results) {
	const agg = { sentences: 0, words: 0, over: 0, passive: 0, banned: 0, identifiers: 0 };
	let verdict = null;
	for (const r of results) {
		agg.sentences += r.stats.sentences;
		agg.words += r.stats.words;
		agg.over += r.stats.over;
		agg.passive += r.stats.passive;
		agg.banned += r.stats.banned;
		agg.identifiers += r.stats.identifiers;
		if (verdict === null && r.stats.verdict !== null) verdict = r.stats.verdict;
	}
	return `summary sentences=${agg.sentences} words=${agg.words} over=${agg.over} passive=${agg.passive} banned=${agg.banned} verdict=${verdict ?? "n/a"} identifiers=${agg.identifiers}`;
}
