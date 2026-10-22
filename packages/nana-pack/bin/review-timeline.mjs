#!/usr/bin/env node
/**
 * @module packages/nana-pack/bin/review-timeline.mjs
 * @purpose Print one lane's recorded review rounds, in ledger order, with the MUST findings a
 *  sent-back review's kept text or legacy recorded file states.
 * @inputs argv (--item <slug> [--repo <path>]), the user-scope review ledger (tally, kept-text store
 *  and audit log through readRounds/ledgerPaths), and legacy review files the audit log recorded
 * @outputs markdown on stdout; one stderr message and exit 1 on bad input or nothing to print
 * @effects disk (reads the ledger and recorded review files only)
 * @errors exit 1 with one message, no stack, on a missing or blank --item, a non-git --repo, a
 *  malformed tally, or no recorded review for the selected item and repository
 */
import { existsSync, readFileSync } from "node:fs";
import { basename, isAbsolute, resolve } from "node:path";
import { canonicalItem, ledgerPaths, readReviewText, readRounds, repoKeyOf, reviewTextPath } from "./review-round.mjs";
import { readBounded } from "../lib/bounded-read.mjs";
import { mustTitlesOf, verdictWordOf } from "../lib/review-findings.mjs";
import {
	MARK_NO_VERDICT,
	MARK_UNVERIFIED,
	MISSING_FIELD,
	REVIEW_TIMELINE_STATEMENTS,
	SHORT_REVISION_CHARS,
	WORD_MUST,
	WORD_SEND_BACK,
} from "../lib/review-timeline-config.mjs";

function optValue(argv, name) {
	const i = argv.indexOf(name);
	return i >= 0 ? argv[i + 1] : undefined;
}

const collapse = (s) => String(s ?? "").replace(/\s+/g, " ").trim();

function formatDuration(ms) {
	if (!Number.isFinite(ms)) return null;
	const totalSec = Math.max(0, Math.round(ms / 1000));
	const h = Math.floor(totalSec / 3600);
	const m = Math.floor((totalSec % 3600) / 60);
	const s = totalSec % 60;
	return h >= 1 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m ${String(s).padStart(2, "0")}s`;
}

/** Every verdict / verdict-unverified audit record from the current log and its one rotated
 *  generation, skipping a line that does not parse. Read-only. */
function readAuditRecords(home) {
	const p = ledgerPaths(home);
	const out = [];
	for (const file of [p.rotated, p.audit]) {
		if (!existsSync(file)) continue;
		for (const line of readFileSync(file, "utf8").split("\n")) {
			if (!line.trim()) continue;
			let rec;
			try {
				rec = JSON.parse(line);
			} catch {
				continue;
			}
			if (rec && (rec.kind === "verdict" || rec.kind === "verdict-unverified")) out.push(rec);
		}
	}
	return out;
}

const auditKey = (r) => [r.repo, r.item, r.revision, r.role, r.endedAt].join("\u0000");

/** The absolute recorded output path for a tally row, or null when none is recorded (no joining
 *  audit record, or its `out` is not absolute). */
function recordedFileOf(row, auditByKey) {
	const out = auditByKey.get(auditKey(row))?.out;
	return out && isAbsolute(out) ? out : null;
}

/** The lines describing a sent-back review's own findings, or the single R-1562 line stating why
 *  none could be read. A modern tally line never falls back to its audit path. */
function findingsLines(row, auditByKey, home) {
	let file;
	let name;
	let text;
	let kept = false;
	if (Object.hasOwn(row, "text")) {
		kept = true;
		file = reviewTextPath(home, row.text);
		name = file ? basename(file) : "kept review text";
		try {
			const stored = readReviewText(home, row.text);
			if (!stored) return [`  - review file: ${name} (${REVIEW_TIMELINE_STATEMENTS.keptTextGone})`];
			text = stored.text;
		} catch {
			return [`  - review file: ${name} (${REVIEW_TIMELINE_STATEMENTS.keptTextGone})`];
		}
	} else {
		file = recordedFileOf(row, auditByKey);
		if (!file) return [`  - ${REVIEW_TIMELINE_STATEMENTS.noFileRecorded}`];
		name = basename(file);
		if (!existsSync(file)) return [`  - review file: ${name} (${REVIEW_TIMELINE_STATEMENTS.fileGone})`];
		try {
			text = readBounded(file).toString("utf8");
		} catch {
			return [`  - review file: ${name} (${REVIEW_TIMELINE_STATEMENTS.fileGone})`];
		}
	}
	if (verdictWordOf(text) !== WORD_SEND_BACK) {
		const statement = kept ? REVIEW_TIMELINE_STATEMENTS.keptVerdictDisagrees : REVIEW_TIMELINE_STATEMENTS.verdictDisagrees;
		return [`  - review file: ${name} (${statement})`];
	}
	const titles = mustTitlesOf(text);
	if (titles.length === 0) return [`  - review file: ${name} (${REVIEW_TIMELINE_STATEMENTS.noMustReadable})`];
	return [`  - review file: ${name}`, ...titles.map((t) => `    - ${WORD_MUST} — ${t}`)];
}

function reviewLine(row) {
	const model = collapse(row.model) || MISSING_FIELD;
	const verdict = row.verdict ? collapse(row.verdict) : MARK_NO_VERDICT;
	const duration = formatDuration(row.durationMs);
	const marks = [];
	if (row.unverified) marks.push(MARK_UNVERIFIED);
	if (row.overCap) marks.push(`over cap: ${collapse(row.overCap)}`);
	const markText = marks.length ? ` (${marks.join("; ")})` : "";
	return `- role: ${collapse(row.role) || MISSING_FIELD} · model: ${model} · verdict: ${verdict} · duration: ${duration ?? MISSING_FIELD}${markText}`;
}

/** Group rows into rounds numbered by each revision's first appearance, tally order preserved
 *  inside a round, then render the markdown timeline. Pure given its inputs. */
function render(item, rows, auditByKey, home) {
	const roundOf = new Map();
	const buckets = new Map();
	for (const row of rows) {
		if (!roundOf.has(row.revision)) roundOf.set(row.revision, roundOf.size + 1);
		const n = roundOf.get(row.revision);
		if (!buckets.has(n)) buckets.set(n, []);
		buckets.get(n).push(row);
	}
	const lines = [`# Review timeline — ${item}`, ""];
	for (const n of [...buckets.keys()].sort((a, b) => a - b)) {
		const bucket = buckets.get(n);
		lines.push(`## Round ${n} — ${String(bucket[0].revision).slice(0, SHORT_REVISION_CHARS)}`, "");
		for (const row of bucket) {
			lines.push(reviewLine(row));
			if (row.verdict === WORD_SEND_BACK) lines.push(...findingsLines(row, auditByKey, home));
		}
		lines.push("");
	}
	return lines.join("\n").replace(/\n+$/, "\n");
}

function main() {
	const argv = process.argv.slice(2);
	const rawItem = optValue(argv, "--item");
	const repoOpt = optValue(argv, "--repo");
	if (!rawItem || !rawItem.trim()) throw new Error("--item <slug> is required");
	const item = canonicalItem(rawItem);
	let repo;
	try {
		repo = repoKeyOf(resolve(repoOpt ?? process.cwd()));
	} catch (e) {
		throw new Error(repoOpt ? `--repo is not a git repository: ${repoOpt}` : e.message);
	}
	const home = process.env.HOME ?? process.env.USERPROFILE;
	const rows = readRounds(home, { repo, item });
	if (rows.length === 0) throw new Error(`no review recorded for item ${JSON.stringify(rawItem)} in this repository`);
	const auditByKey = new Map();
	for (const rec of readAuditRecords(home)) auditByKey.set(auditKey(rec), rec);
	process.stdout.write(render(item, rows, auditByKey, home));
}

try {
	main();
} catch (e) {
	process.stderr.write(`review-timeline: ${e.message}\n`);
	process.exit(1);
}
