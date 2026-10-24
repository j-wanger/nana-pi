/**
 * @module packages/nana-pack/lib/land-ci-records.mjs
 * @purpose Read, retain, and judge one landed tip's CI suite records without changing the land verdict.
 * @inputs A main checkout, landed tip, injected gh runner and clock, and named budget, retention, and slow-share values.
 * @outputs Reader lines, kept-record count, slow-file land notes, and one aggregate failure note when needed.
 * @effects disk (CI-record store and temporary downloads), process and network (through the injected gh runner).
 * @errors Read, store, budget, and unexpected failures become land-note lines and never escape.
 */
import { readCiRecords } from "./ci-records.mjs";
import { CI_READ_TIMEOUT_MS, CI_RECORDS_BUDGET_MS, LAND_NOTE_PREFIX } from "./land-config.mjs";
import {
	CI_RECORD_LINE_PREFIX,
	CI_RECORDS_KEEP,
	CI_SLOW_SHARE,
	CI_STORE_SUBPATH,
} from "./suite-records-config.mjs";
import { numberText, slowFiles, storeSuiteRecord } from "./suite-records.mjs";

const reasonOf = (error) => error?.message ?? "unknown error";
const withoutRecordPrefix = (line) => String(line ?? "").replace(new RegExp(`^${CI_RECORD_LINE_PREFIX.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`), "").trim();
const timeoutResult = (budgetMs) => ({
	status: null,
	signal: "SIGTERM",
	stdout: "",
	stderr: `CI-record read stopped at the ${numberText(budgetMs / 1000)} s budget`,
	error: Object.assign(new Error(`CI-record read stopped at the ${numberText(budgetMs / 1000)} s budget`), { code: "ETIMEDOUT" }),
	nanaTimeoutMs: budgetMs,
});

/** Read, store, and judge CI records under one total gh-call budget. */
export function keepLandCiRecords({
	main,
	tip,
	runGh,
	now = () => performance.now(),
	budgetMs = CI_RECORDS_BUDGET_MS,
	keep = CI_RECORDS_KEEP,
	share = CI_SLOW_SHARE,
	readRecords = readCiRecords,
	storeRecord = storeSuiteRecord,
} = {}) {
	const lines = [];
	const notes = [];
	let startedAt = null;
	let budgetStopped = false;
	try {
		const budgetedGh = (cwd, args, options = {}) => {
			const moment = Number(now());
			if (startedAt === null) startedAt = moment;
			const remaining = budgetMs - (moment - startedAt);
			if (!(remaining >= 1)) { budgetStopped = true; return timeoutResult(budgetMs); }
			const timeoutMs = Math.min(CI_READ_TIMEOUT_MS, Math.ceil(remaining));
			return runGh(cwd, args, { ...options, timeoutMs });
		};
		const result = readRecords([tip], { cwd: main, runGh: budgetedGh, writeLine: (line) => lines.push(line) });
		if (!result || !Number.isInteger(result.code) || !Number.isInteger(result.records) || !Array.isArray(result.parsed)) throw new Error("CI-record reader returned a malformed result");

		let kept = 0;
		const storeProblems = [];
		for (const item of result.parsed) {
			try {
				const recordedAt = item.artifact?.created_at;
				const created = new Date(recordedAt);
				if (Number.isNaN(created.getTime())) throw new Error("CI artifact creation time is invalid");
				const stored = {
					...item.record,
					tip,
					recordedAt,
					ci: { run: item.run.id, attempt: item.attempt, leg: item.leg, event: item.run.event, artifact: item.artifact },
				};
				storeRecord(stored, { root: main, subpath: CI_STORE_SUBPATH, now: () => created, pid: `${item.run.id}-${item.leg}-${item.attempt}`, keep });
				kept++;
			} catch (error) { storeProblems.push(reasonOf(error)); }
			const limitSeconds = Number(item.record?.fileTimeoutMs) / 1000;
			for (const file of slowFiles(item.record, share)) {
				const percent = Number(file.seconds) / limitSeconds * 100;
				notes.push(`${LAND_NOTE_PREFIX} note: slow CI file: ${file.path} took ${numberText(Number(file.seconds))}s on ${item.record.platform} ${item.leg} run ${item.run.id} attempt ${item.attempt}, ${numberText(percent)}% of its ${numberText(limitSeconds)}s limit`);
			}
		}
		if (result.parsed.length) lines.push(`${CI_RECORD_LINE_PREFIX} kept ${kept} of ${result.parsed.length} records`);

		const failures = [];
		if (budgetStopped) failures.push(`not read: stopped at the ${numberText(budgetMs / 1000)} s budget`);
		else if (result.code !== 0 || result.records === 0) failures.push(`not read: ${withoutRecordPrefix(lines.at(-1)) || "no readable record"}`);
		if (storeProblems.length) failures.push(`not kept: ${storeProblems.length} of ${result.parsed.length}: ${storeProblems[0]}`);
		if (failures.length) notes.push(`${LAND_NOTE_PREFIX} note: CI records ${failures.join("; ")}`);
		return { lines, notes, records: result.parsed.length, kept, budgetStopped };
	} catch (error) {
		return { lines, notes: [`${LAND_NOTE_PREFIX} note: CI records failed: ${reasonOf(error)}`], records: 0, kept: 0, budgetStopped };
	}
}
