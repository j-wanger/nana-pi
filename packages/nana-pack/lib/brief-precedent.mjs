/**
 * @module packages/nana-pack/lib/brief-precedent.mjs
 * @purpose Parse and check a lane brief's precedent and feature context against its worktree's injected HEAD reader.
 * @inputs Brief text or path, worktree root, an injected git runner, and tracked paths for pure predicates.
 * @outputs Parsed entries, path judgments, or the worker-compatible refusal/launch line and known-bug path.
 * @effects disk (the launch check reads the brief and regular known-bug file metadata)
 * @errors Read and git failures become fail-closed result objects; pure helpers represent malformed entries as data.
 */
import { readFileSync, statSync } from "node:fs";
import * as path from "node:path";
import { FEATURE_LINE_PREFIX, PRECEDENT_LIST_MAX_BYTES, PRECEDENT_NONE, PRECEDENT_SECTION, PRECEDENT_TRAILING_PUNCTUATION } from "./brief-config.mjs";
import { isNamed } from "./frontier-config.mjs";
import { KNOWN_BUGS_DIR } from "./known-bugs-config.mjs";
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

const refusal = (reason) => ({ ok: false, reason, line: `pi-worker: lane refused: ${reason}`, knownBugPath: null, feature: null });

/** Check one brief against one worktree HEAD through the caller's git runner. */
export function checkBriefForLaunch({ briefPath, worktreeRoot, gitRunner }) {
	let parsedBrief;
	try { parsedBrief = readBrief(readFileSync(briefPath, "utf8")); }
	catch { return refusal(`cannot read ${PRECEDENT_SECTION} section from brief`); }
	const precedent = parsedBrief.precedent;
	if (precedent === null || precedent.length === 0 || precedent.some((entry) => entry.kind === "invalid-none")) {
		return refusal(`${PRECEDENT_SECTION} section needs one entry in either form: - <path> or - ${PRECEDENT_NONE} <reason>`);
	}
	let head;
	try { head = gitRunner(["rev-parse", "--short", "HEAD"]).trim(); }
	catch { return refusal("cannot resolve HEAD for Precedent entries"); }
	const precedentPaths = precedent.filter((entry) => entry.kind === "path").map((entry) => entry.value);
	let trackedPaths = [];
	if (precedentPaths.length > 0) {
		try {
			const listed = gitRunner(["--literal-pathspecs", "ls-tree", "-z", "--name-only", "HEAD", "--", ...precedentPaths], {
				maxBuffer: PRECEDENT_LIST_MAX_BYTES,
			});
			trackedPaths = listed.split("\0").filter(Boolean);
		} catch { return refusal(`cannot list paths tracked at HEAD ${head}`); }
	}
	const precedentProblems = checkPrecedent(precedent, trackedPaths);
	if (precedentProblems.length > 0) {
		const details = precedentProblems.map((entry) => `${JSON.stringify(entry)} is not tracked at HEAD`).join("; ");
		return refusal(`Precedent entries at HEAD ${head}: ${details}; commit the file, or merge main if it landed there`);
	}
	let knownBugRelative = "none";
	let knownBugPath = null;
	if (parsedBrief.feature) {
		knownBugRelative = path.posix.join(KNOWN_BUGS_DIR, `${parsedBrief.feature}.md`);
		const candidate = path.join(worktreeRoot, ...knownBugRelative.split("/"));
		try {
			if (statSync(candidate).isFile()) knownBugPath = candidate;
			else knownBugRelative = "none";
		} catch { knownBugRelative = "none"; }
	}
	return {
		ok: true,
		line: `pi-worker: precedent: ${precedent.length} checked at HEAD ${head}; known bugs: ${knownBugRelative}`,
		knownBugPath,
		feature: parsedBrief.feature,
	};
}
