#!/usr/bin/env node
// Seat mutation runner for lane fresh-install (frozen table; CHANGE.md §5 "Mutation pairs", its "Plan review"
// section, and three seat pairs S1-S3). Modelled on docs/reviews/cc-hooks-windows-2026-10-12/seat-mutate.mjs.
// For each pair: apply a CODE or shipped-TEXT mutation (README, ci.yml when the pair says so) in a detached
// scratch worktree of the lane tip — never a test assertion; refuse when an anchor does not occur exactly once
// (ANCHOR-MISS = runner bug); `node --check` every mutated module; run the named test files with node exactly
// as scripts/test.mjs does (package-dir cwd, fresh HOME/TMPDIR, NANA_* and PI_CODING_AGENT_DIR scrubbed,
// --experimental-strip-types); print RED / GREEN (SURVIVED). The seat acceptance script (kept-clause pairs
// 35-37) runs from the worktree root, with a scratch HOME whose .npmrc carries only the seat's npm prefix (its
// (d) case compares against the seat's global pi tree) and SEAT_PWSH when the seat's pwsh is present.
// Never touches the lane worktree or the main checkout: everything runs in a detached scratch worktree under
// the OS temp folder, removed at the end.
// Usage: SEAT_MUTATE_OUT=<file> [SEAT_MUTATE_TIP=<ref>] node seat-mutate.mjs [pair-id ...]
import { spawnSync, spawn } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

const LANE_REPO = "/Users/jwang/nana-pi-wt/fresh-install";
// The tip under test: SEAT_MUTATE_TIP, else the lane branch head (built at 454a801 for the first run).
const TIP = process.env.SEAT_MUTATE_TIP || "feat/fresh-install";
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "fi-seat-mutate-"));
const WT = path.join(SCRATCH, "wt");
const RUNS = path.join(SCRATCH, "runs");
const TIMEOUT_MS = 10 * 60 * 1000;
const ACC_TIMEOUT_MS = 45 * 60 * 1000;
const SEAT_PWSH = "/private/tmp/claude-501/-Users-jwang-nana-pi/dea1c010-278e-4392-a90f-df947a3a8b71/scratchpad/plan-fresh-install/pwsh/pwsh";

// test files
const PIN = "packages/nana-setup/tests/pi-install-pin.test.mjs"; // T1-T6 + the malformed-cutoff title
const USAGE = "apps/bench/test/usage.test.mjs"; // T7
const IC = "packages/nana-setup/tests/install-check.test.mjs"; // T8-T16, R-1070
const CIW = "packages/nana-pack/tests/ci-workflow.test.mjs"; // T17-T18, R-1091
const FM = "packages/nana-setup/tests/fresh-machine.test.mjs"; // T19
const DR = "packages/nana-setup/tests/doctor-runtime.test.mjs"; // R-1037 (+ R-1093 markers)
const ACC = "docs/reviews/fresh-install-2026-10-13/acceptance.mjs"; // seat acceptance (kept clauses 35-37)

// mutated files
const README = "README.md";
const SETUP_README = "packages/nana-setup/README.md";
const DESK_README = "apps/desk/README.md";
const BENCH_README = "apps/bench/README.md";
const CI = ".github/workflows/ci.yml";
const PIPIN = "packages/nana-setup/lib/pi-pin.mjs";
const STEPS = "packages/nana-setup/lib/steps.mjs";
const PIEXP = "apps/bench/lib/pi-exports.mjs";
const ICHK = "packages/nana-setup/lib/install-check.mjs";
const ICFG = "packages/nana-setup/lib/install-check-config.mjs";
const DOCTOR = "packages/nana-setup/lib/doctor.mjs";
const DESK_SESSION = "apps/desk/pi-session.mjs";

// titles (exact, from CHANGE §5 and the built tests)
const T1 = "every README pi install command carries CI's PI_VERSION and an unquoted PI_BEFORE";
const T2 = "the missing-pi hint carries CI's PI_VERSION and an unquoted PI_BEFORE";
const T3 = "pi pin reads PI_VERSION and PI_BEFORE from the workflow env with LF or CRLF line ends";
const T4 = "the missing-pi hint is built from the checkout's CI workflow by pi-pin";
const T5 = "an unreadable or incomplete workflow gives a placeholder hint, never an empty cutoff";
const T6 = "pin R-1093: the CI workflow path pi-pin reads";
const TM = "a cutoff with a space, a shell metacharacter or a rollover date gives a placeholder hint";
const T7 = "…and its fix line carries CI's PI_VERSION and an unquoted PI_BEFORE";
const T8 = "install: an install that exits non-zero prints FAIL install with its exit status";
const T9 = "pi session: a get_commands response without reload-runtime prints FAIL pi session";
const T10 = "pi session: a journal without a directory_unadopted line for the fixture project prints FAIL pi session";
const T11 = "dispatch: on win32 Git Bash discovery reads the path variable under any letter case and uses the injected exists";
const T12 = "diagnostics: a run with a FAIL line prints the settings hooks block and the last pull.log record after the result lines";
const T13 = "diagnostics: missing settings and pull.log files print could-not-be-read lines with their error codes";
const T14 = "diagnostics: malformed settings print the error name and an empty pull.log prints none";
const T15 = "pin R-1096: the pull.log path under the temporary home";
const T16 = "pin R-1081: the doctor note list";
const T18 = "install check job runs in bash and checks pi's version after the pinned install and before the check";
const T19 = "checklist versions match Node, pi CI and pi-subagents sources";
const R1070 = "reporting: a run with any FAIL line exits non-zero and a run of only PASS lines exits 0";
const R1037 = "missing pi names the shared install hint";
const R1091_SEAL = "the pi resolution cutoff is sealed at the seat's install moment";

// shipped values as the lane writes them (anchors only; never used as an oracle)
const PINNED = "@earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z";
const STEP2 = `\`npm i -g --ignore-scripts ${PINNED}\`, then \`pi --version\``;
const DATE_CHECKS = "\tif (!version || !before || !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z$/.test(before)) return null;\n\tconst date = new Date(before);\n\tif (Number.isNaN(date.valueOf()) || date.toISOString().replace(\".000Z\", \"Z\") !== before) return null;\n";
const VERIFY_AND_CHECK = "      - name: Verify pi version\n        run: test \"$(pi --version)\" = \"${PI_VERSION}\"\n      - name: Install check\n        env:\n          TEMP: ${{ runner.temp }}\n          TMP: ${{ runner.temp }}\n        run: node packages/nana-setup/bin/install-check.mjs\n";
const CHECK_STEP = "      - name: Install check\n        env:\n          TEMP: ${{ runner.temp }}\n          TMP: ${{ runner.temp }}\n        run: node packages/nana-setup/bin/install-check.mjs\n";
const VERIFY_STEP = "      - name: Verify pi version\n        run: test \"$(pi --version)\" = \"${PI_VERSION}\"\n";
const UPGRADE = "Upgrade pi itself with `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z`. The version and cutoff are tested in the root CI workflow. Never run targetless `pi update`, `pi update --all` or `pi update --self`; `pi update <source>` and `pi update --extensions` update packages only.\n";

// Frozen table. `file/anchor/replacement` is the primary edit; `more` holds further edits the same wrong
// code needs in other places. `expectRed`: substrings of FAIL/MISS titles the CHANGE says go red.
// `expectGreen`: titles the CHANGE says stay green under the mutation.
const PAIRS = [
	// ── R-1093: README commands
	{ n: "1", name: "README step 2 without --before", file: README,
		anchor: STEP2, replacement: "`npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2`, then `pi --version`",
		tests: [PIN], expectRed: [T1] },
	{ n: "2", name: "desk README line unchanged (main's unpinned @1.0.2)", file: DESK_README,
		anchor: `(\`npm i -g ${PINNED}\`; tested on 1.0.2`, replacement: "(`npm i -g @earendil-works/pi-coding-agent@1.0.2`; tested on 1.0.2",
		tests: [PIN], expectRed: [T1] },
	{ n: "3", name: "bench README :26 keeps its unversioned parenthetical", file: BENCH_README,
		anchor: `Nothing to install beyond the Dependencies above (\`npm i -g ${PINNED}\`);`,
		replacement: "Nothing to install beyond the Dependencies above (`npm i -g @earendil-works/pi-coding-agent`);",
		tests: [PIN], expectRed: [T1] },
	{ n: "4", name: "setup README keeps @<version> (main's Upgrade line)", file: SETUP_README,
		anchor: "Upgrade pi itself with `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z`. The version and cutoff are tested in the root CI workflow.",
		replacement: "Upgrade pi itself with `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@<version>`.",
		tests: [PIN], expectRed: [T1] },
	{ n: "5", name: "bench README :11 quotes the cutoff", file: BENCH_README,
		anchor: `(\`npm i -g ${PINNED}\`; tested 2026-10-05;`,
		replacement: "(`npm i -g @earendil-works/pi-coding-agent@1.0.2 --before=\"2026-10-04T06:57:57Z\"`; tested 2026-10-05;",
		tests: [PIN], expectRed: [T1] },
	{ n: "6", name: "README step 2 at @1.0.3", file: README,
		anchor: STEP2, replacement: STEP2.replace("@1.0.2", "@1.0.3"),
		tests: [PIN, FM], expectRed: [T1, T19] },
	// ── R-1093/R-1094: the missing-pi hint and pi-pin
	{ n: "7", name: "old hint literal (unpinned)", file: STEPS,
		anchor: "export const PI_INSTALL_HINT = pinPiInstall(PI_INSTALL_BASE, readPiPin(repoRoot));",
		replacement: "export const PI_INSTALL_HINT = \"npm i -g --ignore-scripts @earendil-works/pi-coding-agent\";",
		tests: [PIN, DR], expectRed: [T2, T4] },
	{ n: "8", name: "pi-pin splits on \\n only (CRLF lines never match)", file: PIPIN,
		anchor: "const lines = text.split(/\\r?\\n/);", replacement: "const lines = text.split(\"\\n\");",
		tests: [PIN], expectRed: [T3] },
	{ n: "9", name: "a literal hint with today's values", file: STEPS,
		anchor: "export const PI_INSTALL_HINT = pinPiInstall(PI_INSTALL_BASE, readPiPin(repoRoot));",
		replacement: "export const PI_INSTALL_HINT = \"npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z\";",
		tests: [PIN], expectRed: [T4], expectGreen: [T2] },
	{ n: "10", name: "CI_WORKFLOW retuned (ci.yaml)", file: PIPIN,
		anchor: "export const CI_WORKFLOW = [\".github\", \"workflows\", \"ci.yml\"];",
		replacement: "export const CI_WORKFLOW = [\".github\", \"workflows\", \"ci.yaml\"];",
		tests: [PIN], expectRed: [T6] },
	{ n: "10b", name: "CI_WORKFLOW retuned to another spelling of the same file", file: PIPIN,
		anchor: "export const CI_WORKFLOW = [\".github\", \"workflows\", \"ci.yml\"];",
		replacement: "export const CI_WORKFLOW = [\".github\", \"workflows\", \"..\", \"workflows\", \"ci.yml\"];",
		tests: [PIN], expectRed: [T6] },
	{ n: "11", name: "PI_BEFORE retuned in ci.yml only (READMEs not moved)", file: CI,
		anchor: "  PI_BEFORE: \"2026-10-04T06:57:57Z\"\n", replacement: "  PI_BEFORE: \"2026-10-05T00:00:00Z\"\n",
		tests: [PIN, CIW], expectRed: [T1, R1091_SEAL], expectGreen: [T2, T4] },
	{ n: "12", name: "pinPiInstall(null) emits an empty --before=", file: PIPIN,
		anchor: ": `${command}@<version> --before=<cutoff>`;", replacement: ": `${command}@<version> --before=`;",
		tests: [PIN], expectRed: [T5] },
	{ n: "13", name: "non-date cutoff accepted (no date validation)", file: PIPIN,
		anchor: DATE_CHECKS, replacement: "\tif (!version || !before) return null;\n",
		tests: [PIN], expectRed: [T5] },
	{ n: "14", name: "readPiPin throws ENOENT", file: PIPIN,
		anchor: "\t} catch {\n\t\treturn null;\n\t}", replacement: "\t} catch (error) {\n\t\tif (error?.code === \"ENOENT\") throw error;\n\t\treturn null;\n\t}",
		tests: [PIN], expectRed: [T5] },
	{ n: "15", name: "empty PI_VERSION accepted", file: PIPIN,
		anchor: "\tconst versionLine = lines.find((line) => /^  PI_VERSION: (\\S+)$/.test(line));",
		replacement: "\tconst versionLine = lines.find((line) => /^  PI_VERSION: (\\S*)$/.test(line));",
		more: [
			{ file: PIPIN, anchor: "\tconst version = versionLine?.match(/^  PI_VERSION: (\\S+)$/)?.[1];", replacement: "\tconst version = versionLine?.match(/^  PI_VERSION: (\\S*)$/)?.[1];" },
			{ file: PIPIN, anchor: "\tif (!version || !before || !/", replacement: "\tif (version === undefined || !before || !/" },
		],
		tests: [PIN], expectRed: [T5] },
	// ── R-1095: the bench fix line
	{ n: "16", name: "bench fix line reverted (unpinned)", file: PIEXP,
		anchor: "`Fix: ${pinPiInstall(`npm i -g ${PI_PACKAGE}`, readPiPin(path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../../..\")))}   (or set",
		replacement: "`Fix: npm i -g ${PI_PACKAGE}   (or set",
		tests: [USAGE], expectRed: [T7] },
	// ── R-1071, R-1079, R-1075: install-check verdicts
	{ n: "17", name: "install verdict ignores exit status", file: ICHK,
		anchor: "report(\"install\", install.error?.code === \"ETIMEDOUT\" ? \"timeout\" : \"exit\", okay(install) && gitRootOkay,",
		replacement: "report(\"install\", install.error?.code === \"ETIMEDOUT\" ? \"timeout\" : \"exit\", !install.error && gitRootOkay,",
		tests: [IC], expectRed: [T8] },
	{ n: "18", name: "reload-runtime condition dropped", file: ICHK,
		anchor: "const sessionOkay = okay(session) && sessionOutput.includes(\"reload-runtime\") && journalHasUnadopted(journal, project, platformName);",
		replacement: "const sessionOkay = okay(session) && journalHasUnadopted(journal, project, platformName);",
		tests: [IC], expectRed: [T9] },
	{ n: "19", name: "journalHasUnadopted dropped", file: ICHK,
		anchor: "const sessionOkay = okay(session) && sessionOutput.includes(\"reload-runtime\") && journalHasUnadopted(journal, project, platformName);",
		replacement: "const sessionOkay = okay(session) && sessionOutput.includes(\"reload-runtime\");",
		tests: [IC], expectRed: [T10] },
	{ n: "20", name: "Git Bash lookup back to childEnv.PATH", file: ICHK,
		anchor: "bash = findGitBash(String(pathKey ? childEnv[pathKey] : \"\").split(/[;]/), exists);",
		replacement: "bash = findGitBash(String(childEnv.PATH ?? \"\").split(/[;]/), exists);",
		tests: [IC], expectRed: [T11] },
	{ n: "21", name: "injected exists not passed to findGitBash", file: ICHK,
		anchor: "bash = findGitBash(String(pathKey ? childEnv[pathKey] : \"\").split(/[;]/), exists);",
		replacement: "bash = findGitBash(String(pathKey ? childEnv[pathKey] : \"\").split(/[;]/));",
		tests: [IC], expectRed: [T11] },
	// ── R-1078: the install-check job (ci.yml)
	{ n: "22", name: "install-check job shell: pwsh", file: CI,
		anchor: "    defaults:\n      run:\n        shell: bash\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm i -g --ignore-scripts",
		replacement: "    defaults:\n      run:\n        shell: pwsh\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v4\n        with:\n          node-version: 22\n      - run: npm i -g --ignore-scripts",
		tests: [CIW], expectRed: [T18] },
	{ n: "23", name: "version step after the check", file: CI,
		anchor: VERIFY_AND_CHECK, replacement: CHECK_STEP + VERIFY_STEP,
		tests: [CIW], expectRed: [T18] },
	{ n: "24", name: "version step deleted", file: CI,
		anchor: VERIFY_AND_CHECK, replacement: CHECK_STEP,
		tests: [CIW], expectRed: [T18] },
	// ── R-1096: failure diagnostics
	{ n: "25", name: "first pull.log record printed", file: ICHK,
		anchor: "emitLine(`last pull.log record: ${records.at(-1) ?? \"none\"}`);",
		replacement: "emitLine(`last pull.log record: ${records[0] ?? \"none\"}`);",
		tests: [IC], expectRed: [T12] },
	{ n: "26", name: "diagnostics before the result lines", file: ICHK,
		anchor: "  return { lines, exitCode: failed ? 1 : 0 };\n}",
		replacement: "  if (failed) { const diag = lines.splice(-2); const first = lines.findIndex((l) => /^(PASS|FAIL|XFAIL) /.test(l)); lines.splice(first, 0, ...diag); }\n  return { lines, exitCode: failed ? 1 : 0 };\n}",
		tests: [IC], expectRed: [T12] },
	{ n: "27", name: "a missing settings file throws", file: ICHK,
		anchor: "    } catch (error) {\n      emitLine(`settings hooks: could not be read",
		replacement: "    } catch (error) {\n      if (error?.code === \"ENOENT\") throw error;\n      emitLine(`settings hooks: could not be read",
		tests: [IC], expectRed: [T13] },
	{ n: "28", name: "error.code only (no error name)", file: ICHK,
		anchor: "emitLine(`settings hooks: could not be read (${error?.code ?? error?.name ?? \"Error\"})`);",
		replacement: "emitLine(`settings hooks: could not be read (${error?.code})`);",
		more: [{ file: ICHK, anchor: "emitLine(`last pull.log record: could not be read (${error?.code ?? error?.name ?? \"Error\"})`);", replacement: "emitLine(`last pull.log record: could not be read (${error?.code})`);" }],
		tests: [IC], expectRed: [T14] },
	{ n: "29", name: "empty pull.log prints nothing", file: ICHK,
		anchor: "emitLine(`last pull.log record: ${records.at(-1) ?? \"none\"}`);",
		replacement: "if (records.length) emitLine(`last pull.log record: ${records.at(-1)}`);",
		tests: [IC], expectRed: [T14] },
	{ n: "30", name: "PULL_LOG_PATH retuned", file: ICFG,
		anchor: "export const PULL_LOG_PATH = [\".pi\", \"agent\", \"nana-knowledge\", \"pull.log\"];",
		replacement: "export const PULL_LOG_PATH = [\".pi\", \"agent\", \"nana-knowledge\", \"pull.jsonl\"];",
		tests: [IC], expectRed: [T15] },
	// ── R-1081: the note list
	{ n: "31", name: "also delete \"skill spec\" from the win32 note list", file: ICFG,
		anchor: "\"Claude Code hooks floor\", \"skill spec\", \"skill py-lint\"", replacement: "\"Claude Code hooks floor\", \"skill py-lint\"",
		tests: [IC], expectRed: [T16] },
	// ── kept clauses
	{ n: "32", name: "diagnostics on a PASS-only run", file: ICHK,
		anchor: "  if (failed) {\n    const settingsPath", replacement: "  if (true) {\n    const settingsPath",
		tests: [IC], expectRed: [R1070] },
	{ n: "33", name: "the settings-hooks diagnostic prefixed FAIL", file: ICHK,
		anchor: "emitLine(`settings hooks: ${JSON.stringify(parsedSettings.hooks ?? null)}`);",
		replacement: "emitLine(`FAIL settings hooks: ${JSON.stringify(parsedSettings.hooks ?? null)}`);",
		more: [{ file: ICHK, anchor: "emitLine(`settings hooks: could not be read", replacement: "emitLine(`FAIL settings hooks: could not be read" }],
		tests: [IC], expectRed: [T9] },
	{ n: "34", name: "doctor prints its own literal hint", file: DOCTOR,
		anchor: "`pi not found or could not start — install: ${PI_INSTALL_HINT}`",
		replacement: "`pi not found or could not start — install: npm i -g --ignore-scripts @earendil-works/pi-coding-agent`",
		tests: [DR], expectRed: [R1037] },
	{ n: "35", name: "--ignore-scripts dropped from README step 2", file: README,
		anchor: STEP2, replacement: `\`npm i -g ${PINNED}\`, then \`pi --version\``,
		tests: [PIN, FM, ACC], expectRed: ["(a) README.md: its pi install commands are exactly", "(b) steps.mjs PI_INSTALL_HINT equals README step 2's command"], expectGreen: [T1, T19] },
	{ n: "36", name: "a .github/ edit (ci.yml comment)", file: CI,
		anchor: "name: ci\n", replacement: "name: ci\n# seat mutation 36\n",
		tests: [ACC], expectRed: ["(h) .github/ is unchanged"] },
	{ n: "37", name: "another apps/desk edit (desk code hint pinned; narrowed R-1093 scope)", file: DESK_SESSION,
		anchor: "\t\t\t\t`Fix: npm i -g ${PI_PACKAGE}`,", replacement: "\t\t\t\t`Fix: npm i -g ${PI_PACKAGE}@1.0.2 --before=2026-10-04T06:57:57Z`,",
		tests: [ACC], expectRed: ["(h) apps/desk changes only README.md"] },
	// ── Plan review (2026-10-13): strict cutoff format, every-line README scan
	{ n: "P1", name: "parsePiPin accepts any Date.parse value (pre-review rule)", file: PIPIN,
		anchor: DATE_CHECKS, replacement: "\tif (!version || !before || Number.isNaN(Date.parse(before))) return null;\n",
		tests: [PIN], expectRed: [TM] },
	{ n: "P2", name: "rollover date accepted (no round-trip check)", file: PIPIN,
		anchor: "\tif (Number.isNaN(date.valueOf()) || date.toISOString().replace(\".000Z\", \"Z\") !== before) return null;\n",
		replacement: "\tif (Number.isNaN(date.valueOf())) return null;\n",
		tests: [PIN], expectRed: [TM] },
	{ n: "P3", name: "shell metacharacter accepted (shape checked on the leading timestamp only)", file: PIPIN,
		anchor: DATE_CHECKS,
		replacement: "\tif (!version || !before || !/^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z/.test(before)) return null;\n\tconst date = new Date(before.slice(0, 20));\n\tif (Number.isNaN(date.valueOf()) || date.toISOString().replace(\".000Z\", \"Z\") !== before.slice(0, 20)) return null;\n",
		tests: [PIN], expectRed: [TM] },
	{ n: "P4", name: "a two-line (backslash-continued) unpinned command in a fenced block", file: SETUP_README,
		anchor: UPGRADE, replacement: UPGRADE + "\n```bash\nnpm i -g --ignore-scripts \\\n  @earendil-works/pi-coding-agent@1.0.2\n```\n",
		tests: [PIN], expectRed: [T1] },
	// ── seat pairs
	{ n: "S1", name: "an unpinned command in an indented code block (the scan must not skip it)", file: SETUP_README,
		anchor: UPGRADE, replacement: UPGRADE + "\n    npm i -g @earendil-works/pi-coding-agent@1.0.2\n",
		tests: [PIN], expectRed: [T1] },
	{ n: "S2", name: "parsePiPin accepts a cutoff with a space instead of T", file: PIPIN,
		anchor: DATE_CHECKS,
		replacement: "\tif (!version || !before || !/^\\d{4}-\\d{2}-\\d{2}[T ]\\d{2}:\\d{2}:\\d{2}Z$/.test(before)) return null;\n\tconst date = new Date(before);\n\tif (Number.isNaN(date.valueOf()) || date.toISOString().replace(\".000Z\", \"Z\") !== before.replace(\" \", \"T\")) return null;\n",
		tests: [PIN], expectRed: [TM] },
	{ n: "S3", name: "the hint drops --ignore-scripts", file: STEPS,
		anchor: "const PI_INSTALL_BASE = \"npm i -g --ignore-scripts @earendil-works/pi-coding-agent\";",
		replacement: "const PI_INSTALL_BASE = \"npm i -g @earendil-works/pi-coding-agent\";",
		tests: [PIN, DR, FM], expectRed: [T2, T4] },
];

// ── plumbing ────────────────────────────────────────────────────────────────────────────────
const sh = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: "utf8", ...opts });
const git = (...args) => sh("git", args);
const count = (hay, needle) => hay.split(needle).length - 1;
const SCRUB = (k) => (/^NANA_/.test(k) && !/^NANA_TEST_/.test(k)) || k === "PI_CODING_AGENT_DIR";
const BASE_ENV = (() => {
	const e = { ...process.env };
	for (const k of Object.keys(e)) if (SCRUB(k)) delete e[k];
	const c = Number.isSafeInteger(Number(e.GIT_CONFIG_COUNT)) && Number(e.GIT_CONFIG_COUNT) >= 0 ? Number(e.GIT_CONFIG_COUNT) : 0;
	e[`GIT_CONFIG_KEY_${c}`] = "gc.auto";
	e[`GIT_CONFIG_VALUE_${c}`] = "0";
	e.GIT_CONFIG_COUNT = String(c + 1);
	return e;
})();
// The seat's npm global prefix, read once with the real HOME; the acceptance's (d) compares against that tree.
const NPM_PREFIX = sh("npm", ["config", "get", "prefix"], { cwd: os.tmpdir() }).stdout.trim();
let runSeq = 0;

function addWorktree(dir, ref) {
	if (fs.existsSync(dir)) { git("-C", LANE_REPO, "worktree", "remove", "--force", dir); fs.rmSync(dir, { recursive: true, force: true }); }
	git("-C", LANE_REPO, "worktree", "prune");
	const r = git("-C", LANE_REPO, "worktree", "add", "--detach", dir, ref);
	if (r.status !== 0) throw new Error(`worktree add ${ref} failed: ${r.stderr}`);
}
function removeWorktree(dir) {
	git("-C", LANE_REPO, "worktree", "remove", "--force", dir);
	fs.rmSync(dir, { recursive: true, force: true });
	git("-C", LANE_REPO, "worktree", "prune");
}
function resetWorktree() {
	git("-C", WT, "checkout", "--", ".");
	git("-C", WT, "clean", "-fdq"); // only the scratch worktree; tests may leave untracked files
	const st = git("-C", WT, "status", "--porcelain");
	if (st.stdout.trim()) throw new Error(`scratch worktree not clean after reset:\n${st.stdout}`);
}

/** Run one test file the way scripts/test.mjs does; resolve { code, out, timedOut, secs }. */
function runTest(rel) {
	const file = path.join(WT, rel);
	const isPkgTest = /\/tests?\//.test(rel);
	const cwd = isPkgTest ? path.dirname(path.dirname(file)) : WT;
	const id = ++runSeq;
	const home = path.join(RUNS, `home-${id}`);
	const tmp = path.join(RUNS, `tmp-${id}`);
	fs.mkdirSync(home, { recursive: true });
	fs.mkdirSync(tmp, { recursive: true });
	const env = { ...BASE_ENV, HOME: home, USERPROFILE: home, TMPDIR: tmp, TEMP: tmp, TMP: tmp };
	const isAcc = rel === ACC;
	if (isAcc) {
		if (NPM_PREFIX) fs.writeFileSync(path.join(home, ".npmrc"), `prefix=${NPM_PREFIX}\n`);
		if (fs.existsSync(SEAT_PWSH)) env.SEAT_PWSH = SEAT_PWSH;
	}
	const t0 = Date.now();
	return new Promise((resolve) => {
		const child = spawn(process.execPath, ["--experimental-strip-types", file], { cwd, env, stdio: ["ignore", "pipe", "pipe"], detached: true });
		let out = "";
		child.stdout.on("data", (d) => { out += d; });
		child.stderr.on("data", (d) => { out += d; });
		let timedOut = false;
		const timer = setTimeout(() => { timedOut = true; try { process.kill(-child.pid, "SIGKILL"); } catch {} }, isAcc ? ACC_TIMEOUT_MS : TIMEOUT_MS);
		child.on("close", (code, signal) => {
			clearTimeout(timer);
			fs.rmSync(home, { recursive: true, force: true });
			fs.rmSync(tmp, { recursive: true, force: true });
			resolve({ code: code ?? (signal ? 128 : 1), out, timedOut, secs: ((Date.now() - t0) / 1000).toFixed(1) });
		});
	});
}
const failLines = (out) => out.split("\n").filter((l) => /^(FAIL|MISS) /.test(l)).map((l) => l.replace(/^(FAIL|MISS) +/, "").trim());
const passLines = (out) => out.split("\n").filter((l) => /^(PASS|ok) +/.test(l)).map((l) => l.replace(/^(PASS|ok) +/, "").trim());
const short = (s, n = 110) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

let logFile = null;
const log = (line) => { console.log(line); if (logFile) fs.appendFileSync(logFile, line + "\n"); };

// ── main ────────────────────────────────────────────────────────────────────────────────────
const only = process.argv.slice(2);
const pairs = only.length ? PAIRS.filter((p) => only.includes(p.n)) : PAIRS;
logFile = process.env.SEAT_MUTATE_OUT || null;
if (logFile) fs.writeFileSync(logFile, "");

fs.rmSync(RUNS, { recursive: true, force: true });
fs.mkdirSync(RUNS, { recursive: true });
const tipSha = git("-C", LANE_REPO, "rev-parse", TIP).stdout.trim();
log(`seat-mutate: lane fresh-install, tip ${tipSha}, ${pairs.length} pairs, node ${process.version}, npm prefix ${NPM_PREFIX || "(none)"}, pwsh ${fs.existsSync(SEAT_PWSH) ? "seat" : "absent"}, ${new Date().toISOString()}`);
addWorktree(WT, tipSha);

const tally = { red: 0, offTarget: 0, survived: 0, anchorMiss: 0, syntax: 0, runnable: 0 };
try {
	// Baseline: every named runnable file, unmutated, must exit 0 with no FAIL/MISS line.
	// SEAT_MUTATE_DRY=1 skips every test run: anchors and syntax only.
	const DRY = process.env.SEAT_MUTATE_DRY === "1";
	const files = DRY ? [] : [...new Set(pairs.flatMap((p) => p.tests))];
	let baselineOk = true;
	const baseTitles = new Map();
	for (const rel of files) {
		resetWorktree();
		const r = await runTest(rel);
		const fl = failLines(r.out);
		const ok = r.code === 0 && !r.timedOut && fl.length === 0;
		baseTitles.set(rel, passLines(r.out));
		log(`BASELINE ${ok ? "ok  " : "FAIL"} ${rel} (exit ${r.code}, ${passLines(r.out).length} PASS, ${fl.length} FAIL, ${r.secs}s)${ok ? "" : " — " + fl.slice(0, 3).map((t) => short(t)).join(" | ")}`);
		if (!ok) baselineOk = false;
	}
	// every title a pair names must be a PASS line of one of its files at baseline (else the table is wrong)
	for (const p of DRY ? [] : pairs) for (const s of [...p.expectRed, ...(p.expectGreen ?? [])]) {
		if (!p.tests.some((rel) => (baseTitles.get(rel) ?? []).some((t) => t.includes(s)))) { log(`BASELINE title-miss: pair ${p.n} names "${short(s, 90)}", absent from its files' PASS lines`); baselineOk = false; }
	}
	resetWorktree();
	if (!baselineOk) { log("seat-mutate: baseline not green — refusing to judge mutations"); process.exitCode = 2; }
	else {
		for (const p of pairs) {
			resetWorktree();
			const edits = [{ file: p.file, anchor: p.anchor, replacement: p.replacement }, ...(p.more ?? [])];
			let miss = null;
			for (const e of edits) {
				const abs = path.join(WT, e.file);
				const text = fs.readFileSync(abs, "utf8");
				const c = count(text, e.anchor);
				if (c !== 1) { miss = `${e.file}: anchor occurs ${c}× — ${short(JSON.stringify(e.anchor), 80)}`; break; }
				fs.writeFileSync(abs, text.replace(e.anchor, () => e.replacement));
			}
			if (miss) { tally.anchorMiss++; log(`ANCHOR-MISS ${p.n} ${p.name} — ${miss}`); continue; }
			const diff = git("-C", WT, "diff", "--stat").stdout.trim().split("\n").pop();
			let bad = null;
			for (const f of new Set(edits.map((e) => e.file))) {
				if (!/\.(mjs|js)$/.test(f)) continue;
				const chk = sh(process.execPath, ["--check", path.join(WT, f)]);
				if (chk.status !== 0) { bad = `${f}: ${chk.stderr.split("\n").slice(0, 4).join(" ")}`; break; }
			}
			if (bad) { tally.syntax++; log(`SYNTAX ${p.n} ${p.name} — ${bad}`); continue; }
			if (DRY) { log(`DRY ${p.n} applies (${diff})`); continue; }
			tally.runnable++;
			const allFails = [];
			const passTitles = [];
			const crashed = [];
			for (const rel of p.tests) {
				const r = await runTest(rel);
				const fl = failLines(r.out);
				passTitles.push(...passLines(r.out));
				allFails.push(...fl.map((t) => ({ rel, t })));
				// An uncaught throw ends the file early: checks after it never print, so a named case
				// that is absent from the output was NOT green — it was never reached.
				const thrown = r.out.split("\n").find((l) => /^[A-Za-z]*Error\b[^\n]*:/.test(l));
				if (thrown) crashed.push(`${path.basename(rel)} THREW (later checks never ran): ${short(thrown, 120)}`);
				else if ((r.code !== 0 || r.timedOut) && fl.length === 0) crashed.push(`${path.basename(rel)} exit ${r.code}${r.timedOut ? " (timeout)" : ""}: ${short(r.out.trim().split("\n").slice(-3).join(" / "), 160)}`);
			}
			const matched = allFails.filter(({ t }) => p.expectRed.some((s) => t.includes(s)));
			const failed = (s) => allFails.some(({ t }) => t.includes(s));
			const passed = (s) => passTitles.some((t) => t.includes(s));
			const missedExpect = p.expectRed.filter((s) => !failed(s) && passed(s));
			const notReached = p.expectRed.filter((s) => !failed(s) && !passed(s));
			const greenBroken = (p.expectGreen ?? []).filter((s) => failed(s) || !passed(s));
			const greenKept = (p.expectGreen ?? []).filter((s) => !failed(s) && passed(s));
			const others = allFails.filter(({ t }) => !p.expectRed.some((s) => t.includes(s)));
			const extra = `${missedExpect.length ? `; named but GREEN: ${missedExpect.map((s) => JSON.stringify(short(s, 70))).join(", ")}` : ""}${notReached.length ? `; named but NOT REACHED: ${notReached.map((s) => JSON.stringify(short(s, 70))).join(", ")}` : ""}${greenKept.length ? `; stays green as named: ${greenKept.map((s) => JSON.stringify(short(s, 50))).join(", ")}` : ""}${greenBroken.length ? `; named-green but RED or absent: ${greenBroken.map((s) => JSON.stringify(short(s, 50))).join(", ")}` : ""}; ${allFails.length} FAIL total${others.length ? ` (also: ${others.slice(0, 3).map(({ rel, t }) => `[${path.basename(rel)}] ${short(t, 70)}`).join(" | ")}${others.length > 3 ? ` +${others.length - 3}` : ""})` : ""} (${diff})${crashed.length ? `; CRASH ${crashed.join(" || ")}` : ""}`;
			if (matched.length) {
				tally.red++;
				log(`RED ${p.n} ${p.name} — ${matched.slice(0, 3).map(({ rel, t }) => `[${path.basename(rel)}] ${short(t)}`).join(" | ")}${extra}`);
			} else if (allFails.length || crashed.length) {
				tally.red++; tally.offTarget++;
				log(`RED ${p.n} ${p.name} — (no named case) ${allFails.slice(0, 3).map(({ rel, t }) => `[${path.basename(rel)}] ${short(t)}`).join(" | ")}${extra}`);
			} else {
				tally.survived++;
				log(`GREEN ${p.n} ${p.name} — SURVIVED${extra}`);
			}
		}
	}
} finally {
	try { resetWorktree(); } catch (e) { log(`reset failed at the end: ${e.message}`); }
	removeWorktree(WT);
	fs.rmSync(SCRATCH, { recursive: true, force: true });
}
log(`seat-mutate: ${tally.red}/${tally.runnable} red (${tally.offTarget} red only on an un-named case), ${tally.survived} survived${tally.anchorMiss ? `, ${tally.anchorMiss} ANCHOR-MISS` : ""}${tally.syntax ? `, ${tally.syntax} SYNTAX` : ""}`);
if (tally.anchorMiss || tally.syntax) process.exitCode = 3;
