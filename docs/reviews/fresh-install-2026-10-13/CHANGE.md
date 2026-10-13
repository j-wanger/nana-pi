# Change declaration — fresh local installs take CI's pi cutoff; install-check residuals

*Lane `fresh-install` · branch `feat/fresh-install` · worktree `~/nana-pi-wt/fresh-install`, from `main` at `9974218` · 2026-10-13 · seat revision
2 (last section). Features: FEAT-013 (SUB-011), FEAT-015, FEAT-019, FEAT-034. New R-1093 to R-1096 (R-1097 on unused); no reworded or retired
row; no tree change, no share. SMALL by risk (docs, hints, tests, one 30-line pure module; no gate, hook or format change): one plan-review
round; builder luna (Jake's 2026-10-13 split): §5 names every test by exact title, frozen in `seat-titles.mjs` (DONE = `0 missing`). Touches
nana-setup: the seat runs the install check locally before landing (Jake 2026-10-12). Touches `apps/desk/README.md`: the desk is quiesced before
`nana-land` (setup README `:66`). Order: plan → one plan review → rows and tests (red) → code and docs → seat checks → one draft-PR push →
different-lineage build review → `nana-land`. Evidence: `research-*.md`, `factcheck-*.md`, `pwsh/` here.*

## 1. Why

**Fresh installs break today.** CI pins pi's tree since this morning (R-1090 to R-1092); no user-facing pi install command or hint carries the
cutoff. VERIFIED 2026-10-13 in scratch prefixes: step 2's `@1.0.2` install (desk and bench READMEs alike) resolves pi-codemode 1.2.0 (published
2026-10-12T23:00:01.855Z), and importing pi's main entry fails (`MCP_TYPESCRIPT_PREAMBLE`); with `--before=2026-10-04T06:57:57Z` it resolves the
seat's 146-package tree and repairs a broken prefix. Unversioned commands (bench README `:26`, `steps.mjs:810`, `pi-session.mjs:347,353`,
`pi-exports.mjs:148`) install pi 1.2.0: it imports, untested. The desk imports pi at start (`pi-session.mjs:358`), so a fresh desk will not
start (INFERRED from CI's 13 failing desk files). `pi --version` passes on the bad tree (VERIFIED); doctor's pi row too (INFERRED, `doctor.mjs:329-331`).

**Install-check residuals.** The final reviews (sol and astra, both LAND at `9974218`) left seven points, plus the note-list point (HANDOFF `:44`).

**Threat model.** In: honest variation — sibling releases inside pi's caret ranges; bash, zsh, PowerShell, cmd; CRLF checkouts; a maintainer's
retune or README edit; a missing or malformed `ci.yml`; a `Path` key. Out: forgery (a lying registry, a parser-fooling `ci.yml`, a bad package).

## 2. Requirement delta

| ID | Change | Text |
|---|---|---|
| R-1093 | added, SUB-011 after R-951 | Every `npm i` or `npm install` command for `@earendil-works/pi-coding-agent` in a README the readme check covers, and the missing-pi hint install and doctor print, shall carry the root CI workflow's `PI_VERSION` as `@earendil-works/pi-coding-agent@<PI_VERSION>` and its `PI_BEFORE` as an unquoted `--before=<PI_BEFORE>`. |
| R-1094 | added, SUB-011 | IF the root CI workflow cannot be read, or its `PI_VERSION` or `PI_BEFORE` value is missing or empty, or `PI_BEFORE` does not parse as a date, THEN the missing-pi hint shall carry `<version>` and `<cutoff>` in their places, never an empty `--before=`. |
| R-1095 | added, FEAT-034 after R-508 | IF the bench finds no installed pi package directory, THEN its fix line shall name a pi install command carrying the root CI workflow's `PI_VERSION` and `PI_BEFORE` in the form R-1093 states. |
| R-1096 | added, FEAT-015 after R-1084 | WHEN any result line is FAIL, the install check shall print, after its result lines, a `settings hooks:` line holding the temporary home's Claude Code settings `hooks` block as one-line JSON and a `last pull.log record:` line holding the last non-empty line of that home's knowledge pull log or `none`, each reading `could not be read (<error code, else error name>)` when its file cannot be read or parsed. |

Evidence gains titles: R-1071 (1), R-1075 (1), R-1079 (2); R-1078 swaps its renamed title and gains one; R-951 and R-1081 keep theirs. No
existing row changes status or text. R-1093 lives in SUB-011 with no share: doctor's use of the hint is R-1037's (FEAT-015), and a share is
Jake's tree decision. Leaf total 1,088 → **1,092** (1,088 VERIFIED with `scripts/requirements-tree.mjs` on main), then `npm run req:tree`.
**Pin, not downgrade, on purpose:** the 2026-10-13 materiality default downgrades such rows; here each clause costs one small test and stays honest.

## 3. Design

**3.1 One declaration: `ci.yml`'s workflow `env:`** — `PI_VERSION` (provenance: its `ci.yml:11` comment) and `PI_BEFORE` (R-1091). CI installs
with that cutoff on macOS and Windows; its gate checks the workflow text, not the resolved tree (HANDOFF `:45`). nana-setup reads both by name,
so a retune never changes code. Rejected: a `$GITHUB_ENV` export (an empty `--before=` installs unpinned, exit 0, VERIFIED); a mirror; a literal.

**3.2 New `packages/nana-setup/lib/pi-pin.mjs`** (six-tag header; `@effects disk` for `readPiPin` only; nothing thrown; no command text).
`CI_WORKFLOW = [".github", "workflows", "ci.yml"]` (contract value, R-1091). `parsePiPin(text)` splits on `/\r?\n/` and matches whole lines with
`/^  PI_VERSION: (\S+)$/` and `/^  PI_BEFORE: "([^"]*)"$/` (the anchors make a `\n`-only split fail on CRLF); it returns `{ version, before }`,
or `null` when either is missing or empty or `Date.parse(before)` is `NaN`. `readPiPin(root)` parses `path.join(root, ...CI_WORKFLOW)`, `null`
on any read error. `pinPiInstall(command, pin)` returns `${command}@${version} --before=${before}`, or `${command}@<version> --before=<cutoff>`
for `null`. `steps.mjs:809-810` becomes `const PI_INSTALL_BASE = "npm i -g --ignore-scripts @earendil-works/pi-coding-agent";` (old literal
and provenance) and `export const PI_INSTALL_HINT = pinPiInstall(PI_INSTALL_BASE, readPiPin(repoRoot));` (contract value, R-1093 and R-1094);
`@inputs` gains the workflow. It stays one shared constant (install `:982`, `:991`; `doctor.mjs:330`), read once at import. `ci.yml` stays.

**3.3 Each command gains the cutoff and nothing else; no flag is added or removed.** Step 2, the setup README and the hint keep
`--ignore-scripts` (the install-check job's line, which R-1078 pins and which rehearses a fresh machine). Desk, bench and the bench hint keep the
plain form (the suite job's line, which runs their tests). `README.md:121` → `npm i -g --ignore-scripts @earendil-works/pi-coding-agent@1.0.2
--before=2026-10-04T06:57:57Z`, its stale cross-reference → "the setup README's “Update nana-pi” section"; setup `:70` → "Upgrade pi itself
with `<that command>`, the version and cutoff CI tests." `apps/desk/README.md:25`, `apps/bench/README.md:11` → `npm i -g
@earendil-works/pi-coding-agent@1.0.2 --before=2026-10-04T06:57:57Z`; bench `:26` drops its unversioned parenthetical. `pi-exports.mjs:148` →
`Fix: ${pinPiInstall(`npm i -g ${PI_PACKAGE}`, readPiPin(root))}   (or set BENCH_PI_ROOT …)`, root from `import.meta.url`, read in that
error path only; its `@inputs` gains the root CI workflow.

**Quoting: unquoted.** VERIFIED 2026-10-13 on PowerShell 7.6.6 (macOS arm64 build, `pwsh/`): quoted or not, both commands reach node as the
same argv (Standard and Legacy passing); via npm 10.9.7's own `npm.ps1` (re-parse plus `Invoke-Expression`, Windows layout simulated) the
seat's command resolves pi-codemode 1.0.2, 146 packages, exit 0; bash and zsh VERIFIED. INFERRED: Windows PowerShell 5.1, cmd via `npm.cmd`'s
`%*`, Windows command-line composition. **Placeholder:** the draft's "parse error in PowerShell" was wrong: PowerShell passes `@<version>`
through and npm exits 1 with `EINVALIDTAGNAME`, installing nothing (VERIFIED); bash and zsh refuse to parse it (VERIFIED); cmd INFERRED.

**Desk freeze — seat-decided: the README line is allowed, desk code is not.** `REQUIREMENTS.md:41-42` freezes "rows or code"; a README is neither.

**3.4 Install-check residual fixes — each decided here; none is Jake's call.**
- **Setup README.** `:401` → "The check depends on Node, Git, pi and npm registry access. On any FAIL it prints the installed hooks block and
  the last knowledge-pull record, keeps the temporary home and prints its path." `:403` "dispatches installed hooks through Git Bash" → "runs
  each installed hook directly in exec form (`node` with arguments, no shell)" (`install-check.mjs:262-264`).
- **Jake's page.** `jake-windows-check.md:19` → "In PowerShell, from the checkout:". Nothing else on the page changes.
- **Diagnostics (R-1096).** About eight lines at the end of `runInstallCheck`, when `failed`, via `emitLine`, files read fresh:
  `JSON.stringify(JSON.parse(text).hooks ?? null)`; the last non-blank line, else `none`; a throw prints `could not be read (${error.code ?? error.name})`.
  `PULL_LOG_PATH = [".pi", "agent", "nana-knowledge", "pull.log"]` in `install-check-config.mjs` (contract value: `nana-knowledge/lib/paths.ts:17,25`,
  read 2026-10-13); no size cap (chosen: our own code writes both files). Headers: config `@outputs` adds the log path; `install-check.mjs`
  `@outputs` adds "failure diagnostics" and `@effects` becomes `disk, process`.
- **Git Bash lookup (`:205`).** Read the path variable under any letter case and pass the injected `exists` (production passes none).
- **Doctor note list.** Remove `"skill requirements"` and `"skill nana-standards"` from `DOCTOR_NOTES.win32`, a declared retune of R-1081's
  sealed value: doctor never prints either as a `·` note (`doctor.mjs:340-342`, `:360-366`). Provenance gains the date and reason; 17 stay.
- **Seat notes, in the reviewed change.** HANDOFF: after `:22`, "2026-10-13: Jake's builder split. Sonnet 5.5 builds larger or riskier lanes.
  luna builds small lanes, and every brief names each required test by exact title."; this lane's Landed line; drop only `:44`'s third sentence
  ("Linux runs no install check." stays true); remove queue item `:65`; `:74` gains "CI's half is green (main run 38414636460)"; §6's lines.
  Session: this lane's entry plus "Correction to the install-check entry below: CI runs it as its own blocking job on macOS and Windows,
  alongside the suite; the release waits for both." (2026-10-11 precedent). The residuals memory is deleted after the land.

**What NOT to do.** No `ci.yml` edit; no values as literals in `.mjs`; no quoted `--before`; no `--ignore-scripts` added or removed; no desk
code, study fixture or `envValue` change; no change to the pi-session verdict's stdout-plus-stderr read; no new policy sentence; no downgrades.

## 4. Scope

**In.** Code (5, one new): `packages/nana-setup/lib/pi-pin.mjs`, `steps.mjs`, `install-check.mjs`, `install-check-config.mjs`,
`apps/bench/lib/pi-exports.mjs`. Tests (6, one new): `packages/nana-setup/tests/pi-install-pin.test.mjs`, `install-check.test.mjs`,
`fresh-machine.test.mjs`, `packages/nana-pack/tests/ci-workflow.test.mjs`, `requirements-tree.test.mjs`, `apps/bench/test/usage.test.mjs`.
Docs: `README.md`, `packages/nana-setup/README.md`, `apps/desk/README.md` (`:25`), `apps/bench/README.md`, `jake-windows-check.md` (`:19`),
`docs/sessions/2026-10.md`, `HANDOFF.md`. Ledger and generated: `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`. Corpus:
`docs/reviews/fresh-install-2026-10-13/`. **NOT.** `ci.yml`; `apps/desk/**` beyond that line; `bin/install-check.mjs`; `doctor.mjs`;
`win-command.mjs`; the `pi-registration` and `doctor-runtime` tests; the study fixture; `templates/`; upstream; a pi upgrade. **Builder:** 5
code files is at the luna limit, not over it; dropping the bench hint (R-1095, `pi-exports.mjs`, `usage.test.mjs`) would leave 4.

## 5. Verification

**Tests** — exact titles; `// req:` directly above each; red before the code. Oracles read `PI_VERSION` and `PI_BEFORE` from `ci.yml` with
their own anchored regexes over `/\r?\n/` lines, never via pi-pin or literals. T1–T6: new `packages/nana-setup/tests/pi-install-pin.test.mjs`
(purpose: pin user-facing pi installs to CI's version and cutoff); T7: `apps/bench/test/usage.test.mjs` after `:300`, reusing `threw`;
T8–T16: `packages/nana-setup/tests/install-check.test.mjs`; T17–T18: `packages/nana-pack/tests/ci-workflow.test.mjs`.
- T1 · R-1093 `every README pi install command carries CI's PI_VERSION and an unquoted PI_BEFORE` — over `readme-check.config.json`'s
  `readmes`, each backtick span or fenced line matching `/\bnpm (?:i|install)\b/` and naming the package; includes step 2's (non-vacuity).
- T2 · R-1093 `the missing-pi hint carries CI's PI_VERSION and an unquoted PI_BEFORE`
- T3 · R-1093 `pi pin reads PI_VERSION and PI_BEFORE from the workflow env with LF or CRLF line ends`
- T4 · R-1093, R-1094 `the missing-pi hint is built from the checkout's CI workflow by pi-pin` (source holds §3.2's line; cf. `install-check` test `:311`)
- T5 · R-1094 `an unreadable or incomplete workflow gives a placeholder hint, never an empty cutoff` — `os.tmpdir()` fixtures: no file;
  `PI_BEFORE` absent, `""`, `"not-a-date"`; `PI_VERSION` absent, empty. · T6 · R-1093 `pin R-1093: the CI workflow path pi-pin reads`
- T7 · R-1095 `…and its fix line carries CI's PI_VERSION and an unquoted PI_BEFORE`
- T8 · R-1071 `install: an install that exits non-zero prints FAIL install with its exit status` (`… — exit: exit status 1; last stderr: failed`).
- T9 · R-1079 `pi session: a get_commands response without reload-runtime prints FAIL pi session` (neither stream has it; `assertOnlyHookFails`).
- T10 · R-1079 `pi session: a journal without a directory_unadopted line for the fixture project prints FAIL pi session` (the change
  overwrites `<options.env.HOME>/.pi/agent/nana-journal.jsonl` with `""`; the base spawn writes the good line first).
- T11 · R-1075 `dispatch: on win32 Git Bash discovery reads the path variable under any letter case and uses the injected exists` —
  `runInstallCheck` directly (`recordingRun` injects `PATH`), `env: { Path: "C:\\Git\\cmd", ComSpec }`, `exists` true only for
  `C:\Git\cmd\git.exe` and `C:\Git\bin\bash.exe`, a stub spawn; `lines[0]` is `Git Bash: C:\Git\bin\bash.exe`.
- T12 · R-1096 `diagnostics: a run with a FAIL line prints the settings hooks block and the last pull.log record after the result lines`
  (doctor returns 1; the knowledge hook's override writes two records; the last two lines are the hooks JSON and record 2).
- T13 · R-1096 `diagnostics: missing settings and pull.log files print could-not-be-read lines with their error codes` (`failInstall`; ENOENT).
- T14 · R-1096 `diagnostics: malformed settings print the error name and an empty pull.log prints none` (install override writes both).
- T15 · R-1096 `pin R-1096: the pull.log path under the temporary home` · T16 · edited `pin R-1081: the doctor note list` (17 win32 labels).
- T17 · R-1078 rename, body unchanged: `install check is a blocking macOS and Windows job before suite` →
  `install check is a blocking macOS and Windows job`.
- T18 · R-1078 `install check job runs in bash and checks pi's version after the pinned install and before the check`
  (`defaults: run: shell: bash`; install line, `pi --version` test, check run, in that order).
- T19 · `fresh-machine.test.mjs` R-951, title kept: its pi clause becomes ``entries[1]?.includes(`@earendil-works/pi-coding-agent@${ciVersion} `)``;
  drop the `PI_INSTALL_HINT` import. T20 · `requirements-tree.test.mjs` rename (`1,088` → `1,092` in the title, `:52` and `:53`):
  `R-291: every real heading's committed IDs survive expansion and leaf counts total 1,092`.

**Mutation pairs** (`seat-mutate.mjs`, N/N red; each breaks code or docs, never an assertion). R-1093: (1) step 2 without `--before`, (2) desk
line unchanged, (3) bench `:26` kept, (4) setup keeps `@<version>`, (5) bench `:11` quoted → T1; (6) step 2 at `@1.0.3` → T1, T19; (7) old hint
literal → T2, T4; (8) `\n`-only split → T3; (9) a literal hint with today's values → T4; (10) `CI_WORKFLOW` retuned → T6;
(11) `PI_BEFORE` retuned in `ci.yml` only → T1 and R-1091's seal red, T2 green (read by name). R-1094: (12) `pinPiInstall(null)` emits
`--before=` → T5; (13) non-date accepted → T5; (14) ENOENT thrown → T5; (15) empty `PI_VERSION` accepted → T5. R-1095: (16) bench fix reverted →
T7. R-1071: (17) install verdict ignores exit status → T8. R-1079: (18) `reload-runtime` condition dropped → T9; (19) `journalHasUnadopted`
dropped → T10. R-1075: (20) `:205` back to `childEnv.PATH` → T11; (21) `exists` not passed → T11. R-1078: (22) `shell: pwsh`, (23) version step
after the check, (24) version step deleted → T18. R-1096: (25) first record printed, (26) diagnostics before result lines → T12; (27) a missing
file throws → T13; (28) `error.code` only, (29) empty log prints nothing → T14; (30) `PULL_LOG_PATH` retuned → T15. R-1081: (31) also delete
`"skill spec"` → T16. Kept clauses: (32) diagnostics on a PASS-only run → R-1070's
`reporting: a run with any FAIL line exits non-zero and a run of only PASS lines exits 0`; (33) a diagnostic prefixed `FAIL ` → T9;
(34) `doctor.mjs` prints its own literal → R-1037's `missing pi names the shared install hint`; (35) `--ignore-scripts` dropped from step 2,
(36) a `.github/` edit, (37) another `apps/desk` edit → acceptance.

**Seat acceptance script** (`docs/reviews/fresh-install-2026-10-13/acceptance.mjs`, red at launch, then green): titles T1–T20 once each with
the right `// req:`, old R-1078 and tree titles gone; one "shall" per new row; R-1097 unused; evidence cites the titles; leaf total 1,092.
Diffs: `.github/` empty; `apps/desk` only `README.md`; `doctor.mjs`, `win-command.mjs`, `bin/install-check.mjs` unchanged; Jake's page one
line. README spans equal §3.3's two commands; `PI_INSTALL_HINT` (`node -e`) equals step 2's. Scratch installs of both: eight `@earendil-works`
packages at 1.0.2, same `npm ls -g --all`, entry imports; `pwsh/t3.ps1` re-run green, placeholder exit 1.
`map:impact` taken (callers: `steps.mjs` 30, `install-check.mjs` 2, `install-check-config.mjs` 3, `pi-exports.mjs` 8); install check all PASS
locally; `test:locked`, `map:check`, `readme:check` green; `req:tree`, `nana-writing --report`; the draft PR's macOS suite and install-check legs
green. **Most likely wrong:** that Windows PowerShell 5.1 and cmd behave as PowerShell 7.6 does (INFERRED).

## 6. Residuals (each becomes one HANDOFF line)

1. **Seat-decided: the desk's code hints wait for the desk to reopen** (`pi-session.mjs:347,353` unversioned; `:358-360` names no fix).
2. **The bench's import-failure message names no fix** (`pi-exports.mjs:162`); only the no-package path does.
3. **Windows shells:** PowerShell 7.6 VERIFIED on macOS through npm's own `npm.ps1`; Windows PowerShell 5.1 and cmd INFERRED.
4. **Nothing a user runs detects a mismatched pi tree.** Candidate: a doctor row importing pi's main entry; it joins HANDOFF `:45`.
5. **The pi-session verdict also accepts `reload-runtime` on stderr** (VERIFIED); pi's RPC doc reserves stdout (`docs/rpc.md:29,56`).
6. **Kept on purpose:** the bench study fixture README (`fixture/README.md:29`) keeps an unversioned line. No open question for Jake.

## Seat revision (2026-10-13)

1. Dropped the R-1079 stdout-only verdict change; R-1079 gains two negative tests only (§6.5 records the looseness).
2. Dropped Jake's step 2b (his page changes only step 2's label), the HANDOFF `:23` rewording, the bench import-failure fix line, the policy sentence.
3. Commands gain the cutoff only, unquoted (VERIFIED, PowerShell 7.6). To confirm: no flag added or removed, so step 2 keeps `--ignore-scripts` (§3.3).
4. R-1093 and R-1094 merged into one R-1093; pi-pin kept, its patterns `$`-anchored over `/\r?\n/` lines.
5. Fact-check fixes: W1, W3–W7, map:impact for the config module, the exact tree title, the R-1078 rename, two headers, the CI-run fact.
6. R-1071, R-1078 and R-1079 pinned by small tests, setting aside the materiality default on purpose (§2).
7. Kept: diagnostics (now R-1096), the `Path` lookup, the note-list retune, the Git Bash README fix, the session correction, the split line.
8. Builder luna: 5 code and 6 test files, at the limit. Rows renumbered R-1093 to R-1096; tree total 1,092.
