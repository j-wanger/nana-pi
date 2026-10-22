/**
 * @module packages/nana-pack/lib/build-records.mjs
 * @purpose Append and read clone-shared build records, match pi sessions, sum Usage, and render build-report lines.
 * @inputs Git common folders, build records, session folders, bounded files, and optional read-limit injections.
 * @outputs Best-effort append results, ledger reads, session usage, paired build views, and shared report lines.
 * @effects disk (record append and bounded ledger/session reads)
 * @errors Append operations return named failures; bounded ledger reads throw ERR_TOO_LARGE or filesystem errors.
 */
import * as fs from "node:fs";
import * as path from "node:path";

import { piAgentDir, piNormalizePath } from "./agent-dir.mjs";
import { readBounded } from "./bounded-read.mjs";
import { addUsage, costTotal, emptyUsage, totalTokens } from "./pi-usage.mjs";
import {
	BUILD_LEDGER_READ_MAX_BYTES,
	BUILD_OUTCOMES,
	BUILD_RECORD_KINDS,
	BUILD_RECORD_SCHEMA,
	BUILD_RECORDS_SUBPATH,
	BUILD_SESSION_FILE_SUFFIX,
	BUILD_SESSION_HEAD_BYTES,
	BUILD_SESSION_READ_MAX_BYTES,
	BUILD_SESSION_STAMP_PATTERN,
	BUILD_USAGE_ENTRY_TYPES,
	BUILD_USAGE_MESSAGE_ROLES,
	REPORT_COST_DIGITS,
	REPORT_MILLISECONDS_PER_MINUTE,
	WORKER_ATTEMPT_INFIX,
	WORKER_TAG,
} from "./build-records-config.mjs";

const MESSAGE_ROLES = new Set(BUILD_USAGE_MESSAGE_ROLES);
const ENTRY_TYPES = new Set(BUILD_USAGE_ENTRY_TYPES);
const OUTCOMES = new Set(BUILD_OUTCOMES);
const KINDS = new Set(BUILD_RECORD_KINDS);

/** The clone-shared ledger path for a resolved git common folder. */
export function buildRecordsPath(commonDir) {
	return path.join(commonDir, ...BUILD_RECORDS_SUBPATH.split("/"));
}

/** pi 1.0.2's default or environment-selected session folder for a raw cwd. */
export function buildSessionDir(cwd = process.cwd(), envValue = process.env.PI_CODING_AGENT_SESSION_DIR) {
	if (envValue) return path.resolve(cwd, piNormalizePath(envValue));
	const resolved = path.resolve(cwd);
	const safe = `--${resolved.replace(/^[/\\]/, "").replace(/[/\\:]/g, "-")}--`;
	return path.join(piAgentDir(), "sessions", safe);
}

/** A worktree-relative slash path when inside root, otherwise the real absolute path. */
export function buildBriefPath(briefPath, worktreeRoot) {
	const absolute = realOrResolved(briefPath);
	const root = realOrResolved(worktreeRoot);
	const relative = path.relative(root, absolute);
	if (relative && !path.isAbsolute(relative) && relative.split(path.sep)[0] !== "..") return relative.split(path.sep).join("/");
	return absolute;
}

/** Append exactly one JSON line. This function never throws. */
export function appendBuildRecord(commonDir, record, { fsApi = fs } = {}) {
	const file = buildRecordsPath(commonDir);
	try {
		if (!fsApi.existsSync(path.dirname(file))) fsApi.mkdirSync(path.dirname(file), { recursive: true });
		fsApi.appendFileSync(file, `${JSON.stringify(record)}\n`);
		return { ok: true, file };
	} catch (error) {
		return { ok: false, file, error };
	}
}

/** Read current-schema start/end records while skipping and counting every unreadable line. */
export function readBuildLedger(file, { maxBytes = BUILD_LEDGER_READ_MAX_BYTES } = {}) {
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
		if (!record || typeof record !== "object" || record.v !== BUILD_RECORD_SCHEMA || !KINDS.has(record.kind) || typeof record.build !== "string" || !record.build) {
			badLines++;
			continue;
		}
		records.push(record);
	}
	return { records, badLines, file };
}

function stampTime(name) {
	const match = BUILD_SESSION_STAMP_PATTERN.exec(name);
	if (!match) return null;
	const [, year, month, day, hour, minute, second, millis] = match;
	const value = Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second), Number(millis));
	return Number.isFinite(value) ? value : null;
}

function parsedLines(buffer) {
	const values = [];
	let badLines = 0;
	for (const raw of buffer.toString("utf8").split(/\r\n|\r|\n/)) {
		const line = raw.trim();
		if (!line) continue;
		try {
			const value = JSON.parse(line);
			if (value && typeof value === "object") values.push(value);
			else badLines++;
		} catch { badLines++; }
	}
	return { values, badLines };
}

function realOrResolved(value) {
	try { return process.platform === "win32" ? fs.realpathSync.native(value) : fs.realpathSync(value); }
	catch { return path.resolve(value); }
}

function sameCwd(left, right) {
	let a, b;
	try { a = process.platform === "win32" ? fs.realpathSync.native(left) : fs.realpathSync(left); } catch { a = path.resolve(left); }
	try { b = process.platform === "win32" ? fs.realpathSync.native(right) : fs.realpathSync(right); } catch { b = path.resolve(right); }
	return process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

function headFacts(bytes) {
	const parsed = parsedLines(bytes);
	const header = parsed.values.find((entry) => entry.type === "session");
	const info = parsed.values.find((entry) => entry.type === "session_info");
	return { cwd: header?.cwd, name: info?.name };
}

/** Sum matching builder sessions for one start record and optional exclusive end of its window. */
export function collectBuildUsage(start, {
	before = null,
	sessionReadMaxBytes = BUILD_SESSION_READ_MAX_BYTES,
	sessionHeadBytes = BUILD_SESSION_HEAD_BYTES,
	fsApi = fs,
} = {}) {
	const folder = start.sessionDir;
	const noMatch = () => ({ usage: emptyUsage(), cost: null, costReason: `no matching session in ${folder}`, sessions: [], sessionBadLines: 0, durationMs: null, lastAt: null });
	let names;
	try { names = fsApi.readdirSync(folder); }
	catch (error) {
		if (error?.code === "ENOENT") return noMatch();
		return { ...noMatch(), costReason: `cannot read session folder ${folder}: ${error.code ?? error.message}` };
	}
	const started = Date.parse(start.startedAt);
	const ended = before ? Date.parse(before) : Infinity;
	const matches = [];
	for (const name of names.sort()) {
		if (!name.endsWith(BUILD_SESSION_FILE_SUFFIX)) continue;
		const stamp = stampTime(name);
		if (stamp === null || stamp < started || stamp >= ended) continue;
		const file = path.join(folder, name);
		let head;
		try { head = readBounded(file, Number.MAX_SAFE_INTEGER, sessionHeadBytes); }
		catch (error) {
			return { ...noMatch(), costReason: `cannot read session in ${folder}: ${error.code ?? error.message}` };
		}
		const facts = headFacts(head);
		if (typeof facts.cwd !== "string" || !sameCwd(facts.cwd, start.cwd)) continue;
		if (typeof facts.name !== "string" || !facts.name.startsWith(`${WORKER_TAG}${WORKER_ATTEMPT_INFIX}`)) continue;
		matches.push({ name, file });
	}
	if (!matches.length) return noMatch();
	const sum = emptyUsage();
	let badLines = 0;
	let last = started;
	for (const match of matches) {
		let bytes;
		try { bytes = readBounded(match.file, sessionReadMaxBytes); }
		catch (error) {
			return { ...noMatch(), costReason: `cannot read session in ${folder}: ${error.code ?? error.message}` };
		}
		const parsed = parsedLines(bytes);
		badLines += parsed.badLines;
		for (const entry of parsed.values) {
			const timestamp = Date.parse(entry.timestamp ?? "");
			if (Number.isFinite(timestamp) && timestamp >= started && timestamp < ended) last = Math.max(last, timestamp);
			if (entry.type === "message" && MESSAGE_ROLES.has(entry.message?.role)) addUsage(sum, entry.message?.usage);
			else if (ENTRY_TYPES.has(entry.type)) addUsage(sum, entry.usage);
		}
	}
	return {
		usage: sum,
		cost: costTotal(sum),
		costReason: null,
		sessions: matches.map((entry) => entry.name),
		sessionBadLines: badLines,
		durationMs: Math.max(0, last - started),
		lastAt: new Date(last).toISOString(),
	};
}

function buildViews(records, ledgerBadLines = 0) {
	const starts = [];
	const byBuild = new Map();
	let badLines = ledgerBadLines;
	for (const record of records) {
		if (record.kind === "start") {
			if (byBuild.has(record.build)) { badLines++; continue; }
			const view = { start: record, end: null };
			starts.push(view); byBuild.set(record.build, view);
		} else {
			const view = byBuild.get(record.build);
			if (!view || view.end) { badLines++; continue; }
			view.end = record;
		}
	}
	for (let index = 0; index < starts.length; index++) {
		const view = starts[index];
		if (view.end) {
			view.outcome = OUTCOMES.has(view.end.outcome) ? view.end.outcome : "failed";
			view.exit = view.end.exit;
			view.durationMs = Number(view.end.durationMs) || 0;
			view.usage = view.end.usage ?? emptyUsage();
			view.cost = typeof view.end.cost === "number" ? view.end.cost : null;
			view.costReason = view.end.costReason ?? "not priced";
			continue;
		}
		const next = starts.slice(index + 1).find((candidate) => candidate.start.sessionDir === view.start.sessionDir);
		const found = collectBuildUsage(view.start, { before: next?.start.startedAt ?? null });
		view.outcome = "no end";
		view.exit = null;
		view.durationMs = found.sessions.length ? found.durationMs : null;
		view.usage = found.usage;
		view.cost = found.cost;
		view.costReason = found.costReason;
		view.sessions = found.sessions;
	}
	return { builds: starts, badLines };
}

const minutes = (durationMs) => durationMs === null || durationMs === undefined ? null : Math.floor(Math.max(0, Number(durationMs) || 0) / REPORT_MILLISECONDS_PER_MINUTE);
const money = (value) => `$${Number(value).toFixed(REPORT_COST_DIGITS)}`;
const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;
const usageTokens = (view) => totalTokens(view.usage);

/** Render one build line. */
export function renderBuildLine(view) {
	const time = minutes(view.durationMs);
	const cost = view.cost === null ? `cost unknown: ${view.costReason}` : money(view.cost);
	return `build ${view.start.build} | lane ${view.start.lane} | ${view.outcome} | exit ${view.exit ?? "-"} | ${time === null ? "untimed" : `${time} min`} | ${usageTokens(view)} tokens | ${cost}`;
}

function laneSummary(builds, lane) {
	const selected = builds.filter((view) => view.start.lane === lane);
	const outcomes = new Map(BUILD_OUTCOMES.map((outcome) => [outcome, 0]));
	let durationMs = 0, tokens = 0, cost = 0, unpriced = 0;
	for (const view of selected) {
		outcomes.set(view.outcome, (outcomes.get(view.outcome) ?? 0) + 1);
		durationMs += Number(view.durationMs) || 0;
		tokens += usageTokens(view);
		if (view.cost === null) unpriced++; else cost += view.cost;
	}
	return { lane, builds: selected.length, outcomes, durationMs, tokens, cost, unpriced };
}

/** Render the canonical lane line from raw records or already-paired views. */
export function renderLaneLine(recordsOrViews, lane) {
	const views = recordsOrViews.length && recordsOrViews[0]?.start ? recordsOrViews : buildViews(recordsOrViews).builds;
	const summary = laneSummary(views, lane);
	const breakdown = BUILD_OUTCOMES.map((outcome) => [outcome, summary.outcomes.get(outcome) ?? 0]).filter(([, count]) => count).map(([outcome, count]) => `${count} ${outcome}`).join(", ") || "none";
	return `lane ${lane} | ${plural(summary.builds, "build")} | ${breakdown} | ${minutes(summary.durationMs)} min | ${summary.tokens} tokens | ${money(summary.cost)} | ${summary.unpriced} unpriced`;
}

/** Pair records, resolve unpaired session usage, and return all report lines and totals. */
export function buildReportLines(records, { badLines = 0, lane = null } = {}) {
	const paired = buildViews(records, badLines);
	const builds = lane === null ? paired.builds : paired.builds.filter((view) => view.start.lane === lane);
	const lanes = [...new Set(builds.map((view) => view.start.lane))];
	const lines = builds.map(renderBuildLine);
	for (const name of lanes) lines.push(renderLaneLine(builds, name));
	let durationMs = 0, tokens = 0, cost = 0, unpriced = 0;
	for (const view of builds) {
		durationMs += Number(view.durationMs) || 0;
		tokens += usageTokens(view);
		if (view.cost === null) unpriced++; else cost += view.cost;
	}
	const repeated = lanes.filter((name) => builds.filter((view) => view.start.lane === name).length >= 2).length;
	lines.push(`total | ${plural(builds.length, "build")} | ${plural(lanes.length, "lane")} | ${plural(repeated, "lane")} with 2+ builds | ${minutes(durationMs)} min | ${tokens} tokens | ${money(cost)} | ${unpriced} unpriced | ${plural(paired.badLines, "unreadable line")}`);
	return { lines, builds, lanes, badLines: paired.badLines };
}
