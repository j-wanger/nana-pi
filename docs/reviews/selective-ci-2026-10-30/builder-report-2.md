VERDICT: PARTIAL

## Build 2 and commit scope

Build 2 finishes build 1's implementation and regenerates only `docs/code-map.md`.
The map now has 500 modules and zero header or layer problems; no header needed correction.
The code-map implementation, launch reader, config and private `linkRepo` remain unchanged.
The foreground locked full suite is green. The local install check is not green.
Both prescribed install attempts failed only `pi post-edit`, with the same write-error as build 1.
Every other install step passed on both attempts. No third attempt or unrelated install fix was made.
The final session report supplies the commit id, push result and finished new-tip CI result.
`builder-report.md` is the retained historical build 1 report, not the current verdict.

## Rows and files changed

- **R-3183, implemented:** `packages/nana-pack/bin/nana-main-ci.mjs`, `packages/nana-pack/lib/main-ci.mjs`, `packages/nana-pack/lib/ci-records.mjs`, `packages/nana-pack/tests/main-ci.test.mjs`.
  Read main's newest finished push run of `ci`, note newer unfinished runs, and read only the selected run's artifacts.
  Report failed paths per leg, red advisory records inside green runs, missing records, install-check and release failures.
  Posting is explicit, scanned, same-title deduplicated and refused under both launcher roles.
  The command uses local gh and checks the repository owner's signed-in account.
  The existing record reader gains an optional `runId` filter and returned jobs, missing legs and problems.
  Existing callers without the filter retain their selection and printed output.
- **R-3184, implemented:** `packages/nana-pack/lib/frontier-summary.mjs`, `packages/nana-pack/lib/frontier-summary-config.mjs`, `packages/nana-pack/tests/frontier-summary.test.mjs`, `packages/nana-setup/claude/rules/nana-seat.md`.
  Name the command beside issue watch in normal and omitted blocks only with the workflow and issues pointer.
  Reuse the existing launcher-role guard and block cap; add no hook network call or process.
  The seat rule requires session-start and post-land checks, then explicit posting on red.
- **R-3185, implemented:** `packages/nana-pack/lib/lane-class-config.mjs`, `packages/nana-pack/tests/lane-class.test.mjs`.
  Explicit gate entries cover only `.github/workflows/ci.yml`, `scripts/test.mjs` and `packages/nana-pack/lib/test-runner-config.mjs`.
- **R-3178, R-3179, R-3180, R-3181, R-3182 and R-3186, planned:** each row in `REQUIREMENTS.md` has its one-line park note naming the lane's `measure.mjs` and measurement files.
- **R-597, evidence only:** add the full-main-suite pin to its evidence cell and `packages/nana-pack/tests/ci-workflow.test.mjs`.
  The workflow already runs full suites on main and pull requests on all three systems without path filters; it has no final diff.
- **Documentation and metadata:** `packages/nana-pack/README.md` documents dependencies, command, scan and posting guards, exit codes and no selection.
  Regenerate `docs/requirements-tree.md` and `docs/code-map.md`.
  `docs/components/nana-pi.json` changes release-route from sound to partial, anchored to parked R-3178, because the mandated planned rows invalidate its prior claim.
- **Evidence:** retain all build 1 builder outputs and add this report, the foreground suite output, trace output and both build 2 install outputs in this folder.
  Output files replace local machine paths with `<home>`, `<lane>` and `<tmp>` and trim trailing whitespace.

All three implemented rows carry backticked `file::title` evidence.
No row outside R-597 and R-3178 through R-3186 changed.
No selector, runner selection flag, HANDOFF, known-bug file or session archive changed.

## Every new or edited test

New declarations (all written in build 1; none added in build 2):

1. `packages/nana-pack/tests/main-ci.test.mjs::R-3183: main push reds include advisory legs missing records jobs and older finished runs with scanned deduplicated seat-only posting`.
2. `packages/nana-pack/tests/frontier-summary.test.mjs::R-3184: the bounded and omitted seat blocks name main CI beside issue watch only with its workflow and the rule requires both runs`.
3. `packages/nana-pack/tests/frontier-summary.test.mjs::seal R-3184: the runnable main CI command prefix`.
4. `packages/nana-pack/tests/lane-class.test.mjs::R-3185: the CI workflow runner and runner config are explicit gate files`.
5. `packages/nana-pack/tests/ci-workflow.test.mjs::main pushes run the full suite on all systems without path filters or issue-writing permissions` (R-597).

One existing declaration changed:

- `packages/nana-pack/tests/lane-class.test.mjs::seal: R-2961 class paths and launched CLIs match the reviewed path list`.
  Add the three explicit gate paths to its expected list because the prior expectation became false.

No other existing declaration was edited or deleted.
New fixtures use injected gh and OS temporary directories, not repository writes or network calls.
The text-reader fixtures include CRLF, trailing space/tab and no-final-newline variants.
The new cases are synchronous; no async case is left unawaited.
No suite test launches the seat's new CLI.

## Wrong-code pairs and exit codes

Build 1 ran every new test against wrong code before implementation.
These are its recorded pairs, retained in `builder-mutation-output.txt` and `builder-report.md`.
Build 2 changed no test or implementation beyond the generated map and therefore added no pair.
Each correct side passed again in build 2's full suite.

| Test | Wrong implementation | Wrong exit | Correct exit |
|---|---|---:|---:|
| R-3183 | Always-green stub | 1 | 0 |
| R-3183 | Read PR records instead of push records | 1 | 0 |
| R-3183 | Hide failed records inside a green run | 1 | 0 |
| R-3183 | Bypass the identity scan | 1 | 0 |
| R-3183 | Disable same-title deduplication | 1 | 0 |
| R-3184 block | Omit the main-check line | 1 | 0 |
| R-3184 block | Allow reviewer-role output | 1 | 0 |
| R-3184 seal | Omit the command prefix from config | 1 | 0 |
| R-3185 | Omit the three explicit gate entries | 1 | 0 |
| R-597 workflow pin | Add a push paths-ignore filter | 1 | 0 |

The direct pair commands were `node packages/nana-pack/tests/<file>.test.mjs` for the named files.
The mutations broke implementation or workflow, never inverted assertions.

## Build 2 commands and exits

| Command | Exit | Result |
|---|---:|---|
| `node scripts/code-map.mjs --write` | 0 | Generated map: 500 modules |
| `npm run map:check` | 0 | 500 modules; zero unusable headers; zero problems |
| `npm run test:locked` | 0 | Plain foreground command, machine lock, four jobs; complete output in `builder-suite-build-2.txt` |
| `npm run readme:check` | 0 | 904 claims; zero problems |
| `node packages/nana-pack/tests/requirements-trace.test.mjs` | 0 | 61 checks; output in `builder-trace-check.txt` |
| `node scripts/requirements-tree.mjs` | 0 | 2210 rows, 39 features, zero problems |
| `node scripts/known-bugs.mjs --root .` | 0 | `summary names=0 sizes=0` |
| `node scripts/identity-scan.mjs` | 0 | Zero findings; repeated after staging new files |
| `node packages/nana-setup/bin/install-check.mjs` | 1 | `FAIL pi post-edit — write-error: write tool result is marked as an error`; all other steps pass; `builder-install-check-build-2.txt` |
| Same install command, one prescribed retry | 1 | Same post-edit failure; all other steps pass; `builder-install-check-build-2-retry.txt` |
| `git diff --check` | 0 | No whitespace errors |

Full-suite summary:

```text
241 files: 239 PASS, 0 FAIL, 2 SKIP, 0 WARN · checks: 8745 pass, 0 fail, 44 skip · 584.0s
```

Build 1's touched-test run also passed: 11 files, 160 checks, exit 0.
Its full-suite failures were the stale generated map and the component status; both now pass.
The final session report supplies post-commit checks and CI, without a second evidence-only commit changing the checked tip.

## Precedent and departures

- Read every brief precedent file: issue-watch CLI and library, ci-records, suite-records, gh-runner, frontier-summary and lane-class-config.
- Follow the issue-watch bin/lib split and injected gh boundary.
  **Intentional difference:** production uses `ghDefault`, not the command override seam, so posting uses local gh.
- Import `readCiRecords` and `finalFiles`; do not duplicate record parsing or final-file interpretation.
  Extend the existing reader with optional run filtering and returned metadata, retaining its default behavior.
- Import public `watchCommand` for shell quoting and replace its command prefix and cwd flag.
  Do not copy or export its private quoting helper.
- Follow the existing frontier render and omitted-block paths, `existsSync` check and role guard.
  Put the sole new tunable in existing frontier config and pin it with one seal test, rather than inventing a new config module.
- Follow explicit gate-list entries and their existing test pattern.
- **Scope-driven metadata difference:** the component status changes because the brief requires six planned rows and the existing component audit rejects the old sound status.
- **Brief overrides plan:** enter the six deferred rows as planned even though revision 3 suggested not entering them.
- **Build 2 clarification:** regenerate the generated map; do not edit any code-map code or export `linkRepo`.

No private helper was copied, moved or exported.
No other departure from the brief's Precedent was introduced.
The report writing check may flag exact technical identifiers and the required verdict prefix; worker technical records are outside the owner-writing prose rule.

## Known-bug context and not done

No listed known bug was fixed.
The command consumes existing CI artifacts and exposes missing records, so missing-upload, runner-crash, expiration, paging and timing limits remain.
The existing default CI record selection stays unchanged; only the new caller supplies a run id.
The session-start addition reminds the seat to run a command; it does not read the last local suite record.
No Windows skip-list, suite lock, timeout or mutation-runner behavior changed.

- Local install acceptance remains unmet after the two prescribed attempts; the seat needs to resolve or judge the repeated post-edit rehearsal failure.
- Independent review, land review and the seat's acceptance campaign remain seat work; this builder starts no model sessions.
- The real `nana-main-ci` command was not run because the plan reserves it for the seat.
- No title-check script was named; no `0 missing` claim is made.
- Selection and its audit/measurement acceptance remain parked by the brief.
- No GitHub issue was created, edited, commented on or closed.
