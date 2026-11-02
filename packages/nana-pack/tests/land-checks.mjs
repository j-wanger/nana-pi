/**
 * @module packages/nana-pack/tests/land-checks.mjs
 * @purpose Share test-local land helpers across the split land test files.
 * @inputs Nana-land, review-round and land-fixture helpers.
 * @outputs Shared helper functions and test paths.
 * @effects disk (temporary test repositories and review ledgers).
 * @errors Assertions and fixture failures escape to the calling test.
 */
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, realpathSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tmpDir } from "./tmp-dir.mjs";
import { ciFixture, commit, ensureCiReview, executeCi, git, gitRunner, recordReview, repo, reviewTip, runList, tree, workflowRun } from "./land-fixtures.mjs";
import { writeFakePi } from "./fake-pi.mjs";
import * as nanaLand from "../bin/nana-land.mjs";
const { parseLandArgs, runLand: executeLand, runCleanup } = nanaLand;
import { admit, complete, ledgerPaths, reviewTextPath, withReviewLedgerLock } from "../bin/review-round.mjs";
import { realPath } from "../lib/real-path.mjs";
import * as landConfig from "../lib/land-config.mjs";
const { LAND_NOTE_PREFIX, LAND_TIP_ENV } = landConfig;
import { COMPLETION_FILE, COVERAGE_ENV } from "../lib/runtime-map-config.mjs";
import { checkoutDrift, hashFile } from "../lib/runtime-map.mjs";

export const TEST_LOCKED = fileURLToPath(new URL("../../../scripts/test-locked.mjs", import.meta.url));
export const PI_REVIEW = fileURLToPath(new URL("../bin/pi-review.mjs", import.meta.url));
export const tallyRows = (home) => readFileSync(ledgerPaths(home).tally, "utf8").trim().split(/\r?\n/).filter(Boolean).map(JSON.parse);
export const writeTallyRows = (home, rows) => writeFileSync(ledgerPaths(home).tally, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`);
export const recordTextReview = (feature, home, item, text) => {
	const admission = admit(["--item", item, "--tree", feature, "--role", "test"], { home, cwd: feature, launcher: "land.test.mjs" });
	assert.equal(admission.ok, true, admission.message);
	const completed = complete(admission.res, text, { home, text });
	assert.equal(completed.ok, true, completed.message);
	return tallyRows(home).at(-1);
};
export const runLand = (safe) => {
	if ((!safe.reviewed || safe.reviewed.length === 0) && safe.tree && safe.main) {
		const root = path.dirname(safe.tree);
		const home = safe.home ?? path.join(root, "home");
		mkdirSync(path.join(home, ".pi", "agent"), { recursive: true });
		const revision = reviewTip(safe.tree, home);
		safe.home = home;
		safe.reviewed = [`${revision}=item`];
	}
	return executeLand(safe);
};
export const assertCiRefused = (fixture, runs, expected, options = {}) => {
	const before = git(fixture.main, "rev-parse", "HEAD"); const out = executeCi(fixture, runs, options);
	assert.equal(out.code, 1, out.text); assert.match(out.text, /^refused:/); assert.match(out.text, expected); assert.equal(out.suiteRan, false); assert.equal(git(fixture.main, "rev-parse", "HEAD"), before); return out;
};

