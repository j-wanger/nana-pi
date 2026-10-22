/**
 * @module packages/nana-pack/lib/markdown-list-sections.mjs
 * @purpose Scan Markdown outside fences for named heading or label sections and their list entries.
 * @inputs Markdown text, a heading-name predicate, and an optional exact label.
 * @outputs Ordered sections with source lines and list entries whose continuation lines stay grouped.
 * @effects none
 * @errors None; absent sections produce an empty array.
 */
const HEADING = /^ {0,3}(#{1,6})\s+(.+?)\s*#*\s*$/;
const LIST_ITEM = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/;

const isHeading = (line) => /^ {0,3}#{1,6}\s+/.test(line);
const isListItem = (line) => LIST_ITEM.test(line);

/** Return matching list sections in document order. */
export function scanListSections(text, { headingMatches, label = null }) {
	const lines = text.split(/\r\n|\r|\n/);
	const outsideFence = [];
	const headings = [];
	let fence = null;
	for (let index = 0; index < lines.length; index++) {
		const marker = /^ {0,3}(`{3,}|~{3,})/.exec(lines[index]);
		outsideFence[index] = fence === null;
		if (marker && (fence === null || (marker[1][0] === fence[0] && marker[1].length >= fence[1]))) {
			fence = fence === null ? [marker[1][0], marker[1].length] : null;
		}
		if (outsideFence[index]) {
			const heading = HEADING.exec(lines[index]);
			if (heading) headings.push({ index, level: heading[1].length, title: heading[2] });
		}
	}

	const candidates = [];
	for (const heading of headings.filter((entry) => headingMatches(entry.title))) {
		const end = headings.find((entry) => entry.index > heading.index && entry.level <= heading.level)?.index ?? lines.length;
		candidates.push({ index: heading.index, line: heading.index + 1, kind: "heading", end });
	}
	if (label !== null) {
		for (let index = 0; index < lines.length; index++) {
			if (outsideFence[index] && lines[index].trim() === label) candidates.push({ index, line: index + 1, kind: "label", end: lines.length });
		}
	}
	candidates.sort((left, right) => left.index - right.index);

	return candidates.map((section) => {
		const entries = [];
		for (let index = section.index + 1; index < section.end; index++) {
			if (!outsideFence[index]) continue;
			if (/^\s*$/.test(lines[index])) {
				if (section.kind === "label" && entries.length > 0) break;
				continue;
			}
			if (!isListItem(lines[index])) {
				if (section.kind === "label") break;
				continue;
			}
			const entryLines = [lines[index]];
			let next = index + 1;
			while (next < section.end && !/^\s*$/.test(lines[next]) && !isListItem(lines[next]) && !isHeading(lines[next])) {
				entryLines.push(lines[next]);
				next++;
			}
			entries.push({ line: index + 1, lines: entryLines });
			index = next - 1;
		}
		return { line: section.line, kind: section.kind, entries };
	});
}
