/**
 * @module packages/nana-pack/lib/frontier-check.mjs
 * @purpose Check HANDOFF frontier text and expose its first Next section using one-pass heading stacks.
 * @inputs HANDOFF Markdown text and an injected YYYY-MM-DD current date.
 * @outputs Findings, word count, first Next section, summary text and date validation.
 * @effects none
 * @errors none; malformed content produces findings or empty sections.
 */
import { ARCHIVE_SECTION_NAMES, HANDOFF_WORD_BUDGET, LIVE_SECTION_NAMES, NEXT_SECTION_NAME, OPEN_SECTION_NAME, OPEN_SECTION_PREFIX, READ_WINDOW_BYTES, READ_WINDOW_LINES, isNamed } from "./frontier-config.mjs";
import { splitOpenSection } from "./handoff-asks.mjs";

export const isDate = (value) => {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
	const [year, month, day] = value.split("-").map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};
const isHeading = (line) => /^\s{0,3}#{1,6}\s+/.test(line);
const isListItem = (line) => /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(line);

export function checkFrontier(text, today) {
	const lines = text.split(/\r\n|\r|\n/);
	const outsideFence = [];
	const headings = [];
	const headingStacks = [];
	const stack = [];
	let fence = null;
	for (let index = 0; index < lines.length; index++) {
		const marker = /^\s{0,3}(`{3,}|~{3,})/.exec(lines[index]);
		outsideFence[index] = fence === null;
		if (marker && (fence === null || (marker[1][0] === fence[0] && marker[1].length >= fence[1]))) {
			fence = fence === null ? [marker[1][0], marker[1].length] : null;
		}
		const match = outsideFence[index] && /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/.exec(lines[index]);
		if (match) {
			const heading = { index, level: match[1].length, title: match[2], end: lines.length };
			while (stack.length && stack.at(-1).level >= heading.level) stack.pop().end = index;
			stack.push(heading);
			headings.push(heading);
		}
		headingStacks[index] = [...stack];
	}
	const inSection = (index, title) => headingStacks[index]?.some((heading) => isNamed(heading.title, title)) ?? false;
	const findings = [];
	const add = (line, kind, detail) => findings.push({ line, kind, detail });
	const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
	if (wordCount > HANDOFF_WORD_BUDGET) add(1, "word-budget", `words=${wordCount} budget=${HANDOFF_WORD_BUDGET}`);
	const entriesBetween = (start, end) => {
		const entries = [];
		for (let index = start; index < end; index++) {
			if (!outsideFence[index] || !isListItem(lines[index])) continue;
			const entry = { line: index + 1, text: [lines[index]] };
			for (let next = index + 1; next < end && !/^\s*$/.test(lines[next]) && !isListItem(lines[next]) && !isHeading(lines[next]); next++) entry.text.push(lines[next]);
			entries.push(entry);
		}
		return entries;
	};
	for (const heading of headings.filter((entry) => /landed/i.test(entry.title))) {
		for (const entry of entriesBetween(heading.index + 1, heading.end)) {
			if (entry.text.length > 1) add(entry.line, "landed-entry", `entry spans ${entry.text.length} lines`);
		}
	}
	const nextHeading = headings.find((heading) => isNamed(heading.title, NEXT_SECTION_NAME));
	const nextEnd = nextHeading?.end ?? lines.length;
	const nextEntries = nextHeading ? entriesBetween(nextHeading.index + 1, nextEnd) : [];
	const nextSection = nextHeading ? { heading: nextHeading, start: nextHeading.index + 1, end: nextEnd, entries: nextEntries } : null;
	const nextItems = nextEntries.flatMap((entry) => {
		const match = /^(\d+)[.)]\s+/.exec(entry.text[0]);
		return match ? [Number(match[1])] : [];
	});
	for (let index = 0; index < lines.length; index++) {
		if (!outsideFence[index]) continue;
		for (const ref of lines[index].matchAll(/\bitem\s+(\d+)\s+of\s+Next\b/gi)) {
			const number = Number(ref[1]);
			if (!nextItems.includes(number)) add(index + 1, "broken-reference", `item ${number} of Next does not resolve`);
		}
		if ((inSection(index, NEXT_SECTION_NAME) || inSection(index, OPEN_SECTION_PREFIX)) && /\bLANDED\b/i.test(lines[index])) add(index + 1, "misplaced-landed", "LANDED appears under Next or Open for the owner");
		if (inSection(index, NEXT_SECTION_NAME) || inSection(index, OPEN_SECTION_PREFIX)) {
			const dateCue = /\b(?:due|deadline|by|until|verdict\s+on|review\s+on)\b[^;().\n]*?(\d{4}-\d{2}-\d{2})(?:\s*(?:to|through|[-–—])\s*(\d{4}-\d{2}-\d{2}))?/gi;
			for (const due of lines[index].matchAll(dateCue)) {
				const date = due[2] ?? due[1];
				if (isDate(date) && date < today) add(index + 1, "overdue-date", `${date} precedes ${today}`);
			}
		}
	}
	for (const entry of splitOpenSection(text)) {
		const tag = entry.tag;
		if (!tag || !isDate(tag.since) || tag.since > today) add(entry.line, "open-tag", "Open for the owner entry needs [blocking|optional|parked, since YYYY-MM-DD] with a valid non-future date");
	}
	const bytes = Buffer.byteLength(text, "utf8");
	const hasFinalEol = /(?:\r\n|\r|\n)$/.test(text);
	const lineCount = lines.length - (hasFinalEol ? 1 : 0);
	if (bytes > READ_WINDOW_BYTES || lineCount > READ_WINDOW_LINES) add(1, "file-size", `bytes=${bytes} lines=${lineCount} window=${READ_WINDOW_BYTES} bytes, ${READ_WINDOW_LINES} lines`);
	const displayName = (name) => name === OPEN_SECTION_PREFIX ? OPEN_SECTION_NAME : name;
	const firstArchive = headings.find((heading) => ARCHIVE_SECTION_NAMES.some((name) => isNamed(heading.title, name)));
	if (firstArchive) {
		const archiveName = ARCHIVE_SECTION_NAMES.find((name) => isNamed(firstArchive.title, name));
		for (const heading of headings) {
			if (heading.index <= firstArchive.index) continue;
			const liveName = LIVE_SECTION_NAMES.find((name) => isNamed(heading.title, name));
			if (liveName) add(heading.index + 1, "section-order", `${displayName(liveName)} comes after ${archiveName} at line ${firstArchive.index + 1}`);
		}
	}
	const lineEnds = [];
	const endings = /\r\n|\r|\n/g;
	let ending;
	while ((ending = endings.exec(text))) lineEnds.push(ending.index);
	lineEnds.push(text.length);
	for (const heading of headings) {
		const liveName = LIVE_SECTION_NAMES.find((name) => isNamed(heading.title, name));
		if (!liveName) continue;
		const endIndex = heading.end < lines.length ? heading.end - 1 : lines.length - 1 - (hasFinalEol ? 1 : 0);
		const end = endIndex + 1;
		const endBytes = Buffer.byteLength(text.slice(0, lineEnds[endIndex] ?? text.length), "utf8");
		if (endBytes > READ_WINDOW_BYTES || end > READ_WINDOW_LINES) add(heading.index + 1, "read-window", `${displayName(liveName)} ends at byte ${endBytes}, line ${end}; a default read shows ${READ_WINDOW_BYTES} bytes or ${READ_WINDOW_LINES} lines`);
	}
	return { findings, wordCount, nextSection };
}

export const frontierSummaryLine = (result) => `summary words=${result.wordCount} budget=${HANDOFF_WORD_BUDGET} findings=${result.findings.length}`;
