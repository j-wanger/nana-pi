/**
 * @module packages/nana-pack/lib/record-ledger.mjs
 * @purpose Append, bounded-read, pair, format, and render errors for clone-shared record ledgers.
 * @inputs Ledger paths, JSON records, schema predicates, pairing keys, durations, counts, and errors.
 * @outputs Best-effort append results, parsed records with unreadable counts, paired views, minute values, plural text, and error text.
 * @effects disk (record append and bounded ledger reads)
 * @errors Appends return named failures; bounded reads throw filesystem errors or ERR_TOO_LARGE with file and cap fields.
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { readBounded } from "./bounded-read.mjs";
import { REPORT_MILLISECONDS_PER_MINUTE } from "./build-records-config.mjs";

/** Append exactly one JSON line, creating the parent folder when absent. This function never throws. */
export function appendLedgerRecord(file, record, { fsApi = fs } = {}) {
	try {
		if (!fsApi.existsSync(path.dirname(file))) fsApi.mkdirSync(path.dirname(file), { recursive: true });
		fsApi.appendFileSync(file, `${JSON.stringify(record)}\n`);
		return { ok: true, file };
	} catch (error) {
		return { ok: false, file, error };
	}
}

/** Read accepted JSON lines within a byte cap, treating an absent ledger as empty. */
export function readRecordLedger(file, { maxBytes, accepts } = {}) {
	let bytes;
	try { bytes = readBounded(file, maxBytes); }
	catch (error) {
		if (error?.code === "ENOENT") return { records: [], badLines: 0, file };
		if (error?.code === "ERR_TOO_LARGE") {
			const bounded = new Error(`ledger over ${maxBytes} bytes: ${file}`);
			bounded.code = "ERR_TOO_LARGE";
			bounded.file = file;
			bounded.cap = maxBytes;
			throw bounded;
		}
		throw error;
	}
	const records = [];
	let badLines = 0;
	for (const raw of bytes.toString("utf8").split(/\r\n|\r|\n/)) {
		const line = raw.trim();
		if (!line) continue;
		let record;
		try { record = JSON.parse(line); } catch { badLines++; continue; }
		if (!accepts(record)) { badLines++; continue; }
		records.push(record);
	}
	return { records, badLines, file };
}

/** Pair start/end records in start order, counting duplicate starts and orphan or duplicate ends. */
export function pairRecordViews(records, keyOf, ledgerBadLines = 0) {
	const starts = [];
	const byKey = new Map();
	let badLines = ledgerBadLines;
	for (const record of records) {
		const key = keyOf(record);
		if (record.kind === "start") {
			if (byKey.has(key)) { badLines++; continue; }
			const view = { start: record, end: null };
			starts.push(view);
			byKey.set(key, view);
		} else {
			const view = byKey.get(key);
			if (!view || view.end) { badLines++; continue; }
			view.end = record;
		}
	}
	return { views: starts, badLines };
}

/** Whole elapsed minutes rounded down, or null for an absent duration. */
export const minutes = (durationMs) => durationMs === null || durationMs === undefined ? null : Math.floor(Math.max(0, Number(durationMs) || 0) / REPORT_MILLISECONDS_PER_MINUTE);

/** A count and singular or plural noun. */
export const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

/** Render error code and message text consistently for ledger diagnostics. */
export function errorText(error) { return `${error?.code ? `${error.code}: ` : ''}${error?.message ?? String(error)}`; }
