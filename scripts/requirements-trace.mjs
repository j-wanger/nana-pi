#!/usr/bin/env node
/**
 * @module scripts/requirements-trace.mjs
 * @purpose Run the project template's requirements-trace rail over this repo, so every REQUIREMENTS.md row's status is measured against the `req:` markers nana-pi's suites carry.
 * @inputs REQUIREMENTS.md at the repo root and every *.test.mjs under the six test roots named here
 * @outputs the summary line plus one problem line per disagreement between a row's status or evidence and the markers
 * @effects disk (reads REQUIREMENTS.md and the test sources), process (exits non-zero when a row and the suite disagree)
 * @errors exit 1 with the problem list; a thrown Error for a malformed requirements table, a bad requirement id or a marker that sits above no test call
 */
// A shim, not a copy — the rail is ONE source, the template's
// `templates/typescript/template/tests/requirements-trace.ts`. Not a symlink: a win32
// checkout does not keep one.
//
// The two repo-specific facts live here, so the suite and the CLI read the same ones:
// where this repo keeps its tests, and that its suites declare a case with a `check(…)`
// helper as well as `test(` / `it(`.
import { realpathSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { check } from "../templates/typescript/template/tests/requirements-trace.ts";

/** This repo's root, resolved through symlinks, whatever the cwd. */
export const REPO_ROOT = resolve(
	dirname(realpathSync(fileURLToPath(import.meta.url))),
	"..",
);

/** Every directory in this repo that holds tests, as `npm test` collects them. */
export const TEST_ROOTS = [
	"packages/nana-pack/tests",
	"packages/nana-knowledge/tests",
	"packages/nana-setup/tests",
	"packages/nana-stage/tests",
	"apps/bench/test",
	"apps/desk/test",
];

/** How this repo's suites spell a test declaration. */
export const CALL_NAMES = ["test", "it", "check"];

/** The whole rail over THIS repo. */
export const checkRepo = () =>
	check(REPO_ROOT, { testRoots: TEST_ROOTS, callNames: CALL_NAMES });

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
	const { problems, line } = checkRepo();
	process.stdout.write(`${line}\n`);
	for (const p of problems) process.stdout.write(`  ${p}\n`);
	process.exit(problems.length ? 1 : 0);
}
