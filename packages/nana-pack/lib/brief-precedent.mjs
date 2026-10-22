/**
 * @module packages/nana-pack/lib/brief-precedent.mjs
 * @purpose Parse a lane brief's feature and Precedent entries and judge normalized paths against an injected HEAD tree listing.
 * @inputs Brief text and an injected iterable of paths tracked at the lane worktree's HEAD.
 * @outputs Parsed brief metadata, normalized precedent entries, and every invalid or untracked path entry.
 * @effects none
 * @errors None; missing sections and malformed entries are represented in returned data.
 */
import { FEATURE_LINE_PREFIX, PRECEDENT_NONE, PRECEDENT_SECTION, PRECEDENT_TRAILING_PUNCTUATION } from "./brief-config.mjs";
import { isNamed } from "./frontier-config.mjs";
import { scanListSections } from "./markdown-list-sections.mjs";

const LIST_PREFIX = /^\s*(?:[-*+]\s+|\d+[.)]\s+)/;
const LINE_SUFFIX = /:\d+(?:-\d+)?$/;
const WINDOWS_ABSOLUTE = /^[A-Za-z]:\//;

function entryText(entry) {
	return entry.lines.map((line, index) => index === 0 ? line.replace(LIST_PREFIX, "") : line.trim()).join(" ").trim();
}

function normalizeEntry(entry) {
	const text = entryText(entry);
	if (text.startsWith(PRECEDENT_NONE)) {
		const reason = text.slice(PRECEDENT_NONE.length).trim();
		return { kind: reason ? "none" : "invalid-none", reason, value: PRECEDENT_NONE, line: entry.line };
	}
	let value = text.split(/\s+/, 1)[0]?.replaceAll("`", "") ?? "";
	if (value && PRECEDENT_TRAILING_PUNCTUATION.includes(value.at(-1))) value = value.slice(0, -1);
	value = value.replace(LINE_SUFFIX, "").replaceAll("\\", "/");
	if (value.startsWith("./")) value = value.slice(2);
	const segments = value.split("/");
	const unsafe = !value || value.startsWith("/") || value.startsWith("~") || WINDOWS_ABSOLUTE.test(value) || segments.includes("..");
	return { kind: unsafe ? "invalid-path" : "path", value, line: entry.line };
}

/** Parse the first Precedent section and the first Feature line from brief text. */
export function readBrief(text) {
	const source = text.startsWith("\uFEFF") ? text.slice(1) : text;
	const section = scanListSections(source, {
		headingMatches: (title) => isNamed(title, PRECEDENT_SECTION),
		label: `${PRECEDENT_SECTION}:`,
	})[0] ?? null;
	const featurePattern = new RegExp(`^${FEATURE_LINE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(FEAT-\\d{3})\\b`);
	let feature = null;
	for (const line of source.split(/\r\n|\r|\n/)) {
		const match = featurePattern.exec(line.replace(/[ \t]+$/u, ""));
		if (match) { feature = match[1]; break; }
	}
	return { precedent: section ? section.entries.map(normalizeEntry) : null, feature };
}

/** Folder-aware membership against paths returned by git ls-tree. */
export function trackedAtHead(candidatePath, trackedPaths) {
	const folder = candidatePath.endsWith("/") ? candidatePath.slice(0, -1) : candidatePath;
	const tracked = trackedPaths instanceof Set ? trackedPaths : new Set(trackedPaths);
	return tracked.has(folder) || [...tracked].some((candidate) => candidate.startsWith(`${folder}/`));
}

/** Return every entry that is invalid or absent from the injected HEAD tree listing. */
export function checkPrecedent(entries, trackedPaths) {
	const tracked = trackedPaths instanceof Set ? trackedPaths : new Set(trackedPaths);
	return entries
		.filter((entry) => entry.kind === "invalid-path" || (entry.kind === "path" && !trackedAtHead(entry.value, tracked)))
		.map((entry) => entry.value);
}
