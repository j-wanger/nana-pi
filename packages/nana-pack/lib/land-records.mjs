/**
 * @module packages/nana-pack/lib/land-records.mjs
 * @purpose Append, read, pair, summarize, and render clone-shared land-attempt records.
 * @inputs Git common folders, land records, bounded ledger files, optional read limits, and judged CI runs.
 * @outputs Ledger paths and append/read results, CI waits, paired attempt views, and shared attempt, lane, total, and closing lines.
 * @effects disk (record append and bounded ledger reads)
 * @errors Appends return named failures; bounded reads throw ERR_TOO_LARGE or filesystem errors.
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { TIP_DIGITS } from "./land-config.mjs";
import {
	LAND_CI_CREATED_FIELD,
	LAND_CI_STATES,
	LAND_CI_UPDATED_FIELD,
	LAND_LEDGER_READ_MAX_BYTES,
	LAND_OUTCOMES,
	LAND_RECORD_KINDS,
	LAND_RECORD_LINE_PREFIX,
	LAND_RECORD_SCHEMA,
	LAND_RECORDS_SUBPATH,
	LAND_STAGES,
	LAND_SUITE_SOURCES,
} from "./land-records-config.mjs";
import { appendLedgerRecord, minutes, pairRecordViews, plural, readRecordLedger } from "./record-ledger.mjs";

const KINDS = new Set(LAND_RECORD_KINDS);
const OUTCOMES = new Set(LAND_OUTCOMES);
const STAGES = new Set(LAND_STAGES);
const CI_STATES = new Set(LAND_CI_STATES);

/** The clone-shared land ledger path for a resolved git common folder. */
export function landRecordsPath(commonDir) {
	return path.join(commonDir, ...LAND_RECORDS_SUBPATH.split("/"));
}

/** Append exactly one land JSON line. This function never throws. */
export function appendLandRecord(commonDir, record, { fsApi = fs } = {}) {
	return appendLedgerRecord(landRecordsPath(commonDir), record, { fsApi });
}

/** Read current-schema land records while skipping and counting every unreadable line. */
export function readLandLedger(file, { maxBytes = LAND_LEDGER_READ_MAX_BYTES } = {}) {
	return readRecordLedger(file, { maxBytes, accepts: (record) => record && typeof record === "object" && record.v === LAND_RECORD_SCHEMA && KINDS.has(record.kind) && typeof record.attempt === "string" && record.attempt });
}

/** Return the longest judged workflow-run creation-to-update span, or null when any span is unusable. */
export function landCiWaitMs(runs) {
	if (!Array.isArray(runs)) return null;
	let longest = 0;
	for (const run of runs) {
		const created = Date.parse(run?.[LAND_CI_CREATED_FIELD]);
		const updated = Date.parse(run?.[LAND_CI_UPDATED_FIELD]);
		const span = updated - created;
		if (!Number.isFinite(created) || !Number.isFinite(updated) || !Number.isFinite(span) || span < 0) return null;
		longest = Math.max(longest, span);
	}
	return longest;
}

function landViews(records, ledgerBadLines = 0) {
	const paired = pairRecordViews(records, (record) => record.attempt, ledgerBadLines);
	for (const view of paired.views) {
		if (!view.end) {
			view.outcome = "no end";
			view.stage = null;
			view.reason = null;
			view.durationMs = null;
			view.suiteMs = null;
			view.ciWaitMs = null;
			continue;
		}
		view.outcome = OUTCOMES.has(view.end.outcome) && view.end.outcome !== "no end" ? view.end.outcome : "refused";
		view.stage = STAGES.has(view.end.stage) ? view.end.stage : null;
		view.reason = typeof view.end.reason === "string" && view.end.reason ? view.end.reason : null;
		view.durationMs = Number.isFinite(Number(view.end.durationMs)) ? Math.max(0, Number(view.end.durationMs)) : 0;
		view.suiteMs = view.end.suiteMs === null || view.end.suiteMs === undefined ? null : Math.max(0, Number(view.end.suiteMs) || 0);
		view.ciWaitMs = view.end.ciWaitMs === null || view.end.ciWaitMs === undefined ? null : Math.max(0, Number(view.end.ciWaitMs) || 0);
		view.ci = CI_STATES.has(view.end.ci) ? view.end.ci : null;
		view.suite = LAND_SUITE_SOURCES.includes(view.end.suite) ? view.end.suite : null;
	}
	return { attempts: paired.views, badLines: paired.badLines };
}

const minuteText = (value, noun) => value === null ? `${noun} -` : `${noun} ${minutes(value)} min`;

/** Render one land attempt line. */
export function renderLandAttemptLine(view) {
	const duration = view.durationMs === null ? "total -" : `${minutes(view.durationMs)} min total`;
	const tip = typeof view.start.tip === "string" && view.start.tip ? view.start.tip.slice(0, TIP_DIGITS) : "-";
	return `land ${view.start.startedAt} | lane ${view.start.lane ?? "-"} | ${view.outcome} | stage ${view.stage ?? "-"} | reason ${view.reason ?? "-"} | ${duration} | ${view.suite === "ci" ? "suite ci" : minuteText(view.suiteMs, "suite")} | ${minuteText(view.ciWaitMs, "CI wait")} | tip ${tip}`;
}

function landLaneSummary(attempts, lane) {
	const selected = attempts.filter((view) => view.start.lane === lane);
	const outcomes = new Map(LAND_OUTCOMES.map((outcome) => [outcome, 0]));
	let durationMs = 0;
	let suiteMs = 0;
	for (const view of selected) {
		outcomes.set(view.outcome, (outcomes.get(view.outcome) ?? 0) + 1);
		durationMs += Number(view.durationMs) || 0;
		suiteMs += Number(view.suiteMs) || 0;
	}
	const lastLanded = [...selected].reverse().find((view) => view.outcome === "landed");
	return { lane, attempts: selected.length, outcomes, durationMs, suiteMs, lastLandedCiWaitMs: lastLanded?.ciWaitMs ?? null };
}

/** Render the canonical land lane line from raw records or already-paired views. */
export function renderLandLaneLine(recordsOrViews, lane) {
	const views = recordsOrViews.length && recordsOrViews[0]?.start ? recordsOrViews : landViews(recordsOrViews).attempts;
	const summary = landLaneSummary(views, lane);
	const breakdown = LAND_OUTCOMES.map((outcome) => [outcome, summary.outcomes.get(outcome) ?? 0]).filter(([, count]) => count).map(([outcome, count]) => `${count} ${outcome}`).join(", ") || "none";
	const wait = summary.lastLandedCiWaitMs === null ? "-" : `${minutes(summary.lastLandedCiWaitMs)} min`;
	return `land lane ${lane} | ${plural(summary.attempts, "attempt")} | ${breakdown} | ${minutes(summary.durationMs)} min total | ${minutes(summary.suiteMs)} min suite | last landed CI wait ${wait}`;
}

/** Pair records and return all selected land report lines and totals. */
export function landReportLines(records, { badLines = 0, lane = null } = {}) {
	const paired = landViews(records, badLines);
	const attempts = lane === null ? paired.attempts : paired.attempts.filter((view) => view.start.lane === lane);
	const lanes = [...new Set(attempts.map((view) => view.start.lane).filter((name) => name !== null && name !== undefined))];
	const lines = attempts.map(renderLandAttemptLine);
	for (const name of lanes) lines.push(renderLandLaneLine(attempts, name));
	const repeated = lanes.filter((name) => attempts.filter((view) => view.start.lane === name).length >= 2).length;
	const stageCounts = new Map(LAND_STAGES.map((stage) => [stage, 0]));
	for (const view of attempts) if (view.outcome === "refused" && view.stage) stageCounts.set(view.stage, (stageCounts.get(view.stage) ?? 0) + 1);
	const refusals = LAND_STAGES.map((stage) => [stage, stageCounts.get(stage) ?? 0]).filter(([, count]) => count).map(([stage, count]) => `${count} ${stage}`).join(", ") || "none";
	lines.push(`land total | ${plural(attempts.length, "attempt")} | ${plural(lanes.length, "lane")} | ${plural(repeated, "lane")} with 2+ attempts | refusals: ${refusals} | ${plural(paired.badLines, "unreadable line")}`);
	return { lines, attempts, lanes, badLines: paired.badLines };
}

/** Render nana-land's one closing record line after an end append. */
export function renderLandRecordLine(end, laneLine) {
	const stage = end.stage ?? "-";
	const suite = end.suite === "ci" ? "suite ci" : `${end.suiteMs === null ? "-" : `${minutes(end.suiteMs)} min`} suite`;
	const wait = end.ciWaitMs === null ? "-" : `${minutes(end.ciWaitMs)} min`;
	return `${LAND_RECORD_LINE_PREFIX} ${end.outcome}, stage ${stage}, ${minutes(end.durationMs)} min total, ${suite}, ${wait} CI wait; ${laneLine}`;
}
