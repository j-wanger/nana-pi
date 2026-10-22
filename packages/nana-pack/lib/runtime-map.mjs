/**
 * @module packages/nana-pack/lib/runtime-map.mjs
 * @purpose Read runtime-map data and format impact freshness plus per-test execution and staleness.
 * @inputs The schema 1 data file, current tracked content, clock and main relation, plus an optional data-file override.
 * @outputs The data path, file hashes, parsed data or a reason, checkout drift, freshness lines, and measured test blocks.
 * @effects disk (reads a file to hash it or to load the runtime data), process (spawns git for the common directory; every effect is injectable for tests)
 * @errors never throws from loadRuntime, hashFile or checkoutDrift; dataPath throws when git itself fails
 */
// must-meet.md (docs/reviews/runtime-map-2026-10-17/) R-1272 to R-1278. This module is the
// read-only half shared by scripts/code-map.mjs's --impact block and, for the data path and
// hashing, scripts/runtime-measure.mjs's write half — one rule for where the data lives and what
// "changed since the measurement" means, read by both sides.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

import { TIP_DIGITS } from "./land-config.mjs";
import {
	DATA_FILE_ENV,
	DATA_SUBPATH,
	NOT_COUNTED,
	NOTE_PREFIX,
	RUNTIME_SCHEMA,
	SECONDS_DIGITS,
	STALE_MARK,
} from "./runtime-map-config.mjs";

/**
 * The runtime data file's absolute path: the override when set, else
 * `nana/runtime-map.json` under the git common directory, resolved against the folder git ran
 * in (R-1278) — the same file from the main checkout, a subfolder or a linked worktree.
 */
export function dataPath(dir, { env = process.env, git } = {}) {
	const override = env[DATA_FILE_ENV];
	if (override) return override;
	const run = git ?? ((args, opts) => spawnSync("git", args, { encoding: "utf8", ...opts }));
	const r = run(["rev-parse", "--git-common-dir"], { cwd: dir });
	if (r.status !== 0) throw new Error(`git rev-parse --git-common-dir failed in ${dir}: ${(r.stderr ?? "").trim()}`);
	const commonDir = path.resolve(dir, r.stdout.trim());
	return path.join(commonDir, DATA_SUBPATH);
}

/**
 * sha256 of a file's raw bytes, or null when it cannot be read (R-1274: an unstaged deletion of
 * a tracked file leaves it in `git ls-files` with nothing on disk; null never equals a recorded
 * hash, so that file reads as changed rather than crashing the caller).
 */
export function hashFile(absPath, { readBytes = (f) => readFileSync(f) } = {}) {
	let bytes;
	try {
		bytes = readBytes(absPath);
	} catch {
		return null;
	}
	return createHash("sha256").update(bytes).digest("hex");
}

/**
 * Parse the runtime data file. Never throws: a missing file, unreadable JSON or a schema
 * mismatch all come back as `{ ok: false, reason }` (R-1273, R-1276).
 */
export function loadRuntime(file, { readText = (f) => readFileSync(f, "utf8") } = {}) {
	let text;
	try {
		text = readText(file);
	} catch {
		return { ok: false, reason: "no runtime data" };
	}
	let data;
	try {
		data = JSON.parse(text);
	} catch {
		return { ok: false, reason: "unreadable runtime data" };
	}
	if (data?.schema !== RUNTIME_SCHEMA) return { ok: false, reason: "runtime data is another schema version" };
	return { ok: true, data };
}

/**
 * Whether the checkout has moved since the measurement (R-1274): a file git tracks now that the
 * data's hash map does not hold (added), a hash-map entry for a file git no longer tracks
 * (removed), or a tracked file whose current hash differs from its recorded one (changed). Any
 * one of the three marks the whole runtime section stale, a section with no measured test
 * included.
 */
export function checkoutDrift(data, { tracked, hashOf }) {
	const dataFiles = new Set(Object.keys(data?.hashes ?? {}));
	const trackedSet = new Set(tracked);
	const added = tracked.filter((f) => !dataFiles.has(f)).sort();
	const removed = [...dataFiles].filter((f) => !trackedSet.has(f)).sort();
	const changed = tracked.filter((f) => dataFiles.has(f) && hashOf(f) !== data.hashes[f]).sort();
	return { added, removed, changed, stale: added.length > 0 || removed.length > 0 || changed.length > 0 };
}

/** Whether one measured test entry or any tracked file it ran differs from the measurement (R-1513, R-2534). */
export function runtimeEntryChanged(data, testPath, { hashOf }) {
	const entry = data.tests?.[testPath];
	if (!entry) return false;
	const covered = [testPath, ...(Array.isArray(entry.ran) ? entry.ran : [])];
	return covered.some((candidate) => hashOf(candidate) !== data.hashes?.[candidate]);
}

/** Every measured test entry that ran `targetPath`, longest first and ties by path. */
function testsFor(data, targetPath, { hashOf }) {
	return Object.entries(data.tests ?? {})
		.filter(([, t]) => (t.ran ?? []).includes(targetPath))
		.map(([testPath, t]) => ({
			testPath,
			seconds: t.seconds,
			label: t.label,
			changed: runtimeEntryChanged(data, testPath, { hashOf }),
		}))
		.sort((a, b) => b.seconds - a.seconds || (a.testPath < b.testPath ? -1 : 1));
}

/** Freshness lines for runtime data that carries the land or hand measurement metadata (R-2528, R-2529). */
export function formatFreshness(data, { drift, mainRelation, now = () => new Date() }) {
	if (typeof data?.tip !== "string" || !data.tip || typeof data?.measuredAt !== "string") return "";
	const measured = new Date(data.measuredAt);
	const current = new Date(now());
	if (!Number.isFinite(measured.getTime()) || !Number.isFinite(current.getTime())) return "";
	const ageHours = Math.max(0, Math.floor((current.getTime() - measured.getTime()) / (60 * 60 * 1000)));
	const differences = drift.added.length + drift.removed.length + drift.changed.length;
	const ageWord = ageHours === 1 ? "hour" : "hours";
	const fileWord = differences === 1 ? "file differs" : "files differ";
	const out = [`${NOTE_PREFIX} measured tip ${data.tip.slice(0, TIP_DIGITS)} at ${measured.toISOString()} is ${ageHours} ${ageWord} old; ${differences} tracked ${fileWord} from this checkout`];
	if (mainRelation?.kind === "past") out.push(`${NOTE_PREFIX} main is ${mainRelation.commits} commits past the measured tip; the next land measures it`);
	else if (mainRelation?.kind === "not-on-main") out.push(`${NOTE_PREFIX} the measured tip is not on main; the next land measures it`);
	return out.join("\n");
}

/**
 * The --impact runtime block (R-1272, R-2534): one "measured tests for <path> (<n>):" block per
 * named path, longest-first lines with seconds and a non-PASS label, a zero line for a file no
 * measured test ran, a stale mark only on entries whose measured files changed, and a closing
 * line naming what is not counted.
 */
export function formatRuntime(data, paths, { hashOf }) {
	const out = [];
	for (const p of paths) {
		const entries = testsFor(data, p, { hashOf });
		out.push(`measured tests for ${p} (${entries.length}):${entries.length ? "" : " —"}`);
		for (const e of entries) {
			const labelTag = e.label === "PASS" ? "" : ` [${e.label}]`;
			const staleTag = e.changed ? ` ${STALE_MARK}` : "";
			out.push(`  ${e.seconds.toFixed(SECONDS_DIGITS)}s  ${e.testPath}${labelTag}${staleTag}`);
		}
	}
	out.push(`${NOTE_PREFIX} ${NOT_COUNTED}`);
	return out.join("\n");
}
