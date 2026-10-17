/**
 * @module packages/nana-pack/lib/runtime-map.mjs
 * @purpose Read the runtime-map data file and say which measured test files executed given files, marking a drifted checkout stale.
 * @inputs the runtime data file (schema 1 JSON), the current tracked-file list and content, and an optional NANA_RUNTIME_MAP_FILE override
 * @outputs the resolved data-file path, a file's sha256 hash, the parsed data or a reason it could not be read, the checkout drift, and the formatted --impact runtime block
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

/** Every measured test entry that ran `targetPath`, longest first and ties by path. */
function testsFor(data, targetPath) {
	return Object.entries(data.tests ?? {})
		.filter(([, t]) => (t.ran ?? []).includes(targetPath))
		.map(([testPath, t]) => ({ testPath, seconds: t.seconds, label: t.label }))
		.sort((a, b) => b.seconds - a.seconds || (a.testPath < b.testPath ? -1 : 1));
}

/**
 * The --impact runtime block (R-1272, R-1274): one "measured tests for <path> (<n>):" block per
 * named path, longest-first lines with seconds and a non-PASS label, a zero line for a file no
 * measured test ran, every block carrying the stale mark when the checkout has drifted, and a
 * closing line naming what is not counted.
 */
export function formatRuntime(data, paths, { drift }) {
	const out = [];
	for (const p of paths) {
		const entries = testsFor(data, p);
		const staleTag = drift.stale ? ` ${STALE_MARK}` : "";
		out.push(`measured tests for ${p} (${entries.length}):${entries.length ? "" : " —"}${staleTag}`);
		for (const e of entries) {
			const labelTag = e.label === "PASS" ? "" : ` [${e.label}]`;
			out.push(`  ${e.seconds.toFixed(SECONDS_DIGITS)}s  ${e.testPath}${labelTag}`);
		}
	}
	out.push(`${NOTE_PREFIX} ${NOT_COUNTED}`);
	return out.join("\n");
}
