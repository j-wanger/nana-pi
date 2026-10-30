VERDICT: BLOCKED

## Commits

None. The patch remains uncommitted on `feat/selective-ci`.
The brief forbids touching the code map, but three new modules require generated map entries.
The locked suite therefore cannot pass without permission to regenerate `docs/code-map.md`.
The local macOS install check also failed its post-edit write rehearsal.
I made no commit after a red suite and pushed no branch.

## Requirement and file changes

- **R-3183, implemented:** `packages/nana-pack/bin/nana-main-ci.mjs`, `packages/nana-pack/lib/main-ci.mjs`, `packages/nana-pack/lib/ci-records.mjs`, `packages/nana-pack/tests/main-ci.test.mjs`.
  The command reads main push runs of `ci`, chooses the newest finished run, and notes newer unfinished runs.
  It reads only that run's artifacts, reports failed paths per leg, missing records and failed jobs despite a green run.
  Posting requires an explicit flag, an identity scan, the repository owner's local gh account, and no matching open title.
  Worker and reviewer roles cannot post.
  The reader gains an optional `runId` filter and returned jobs, problems and missing-leg metadata; its default selection stays unchanged.
- **R-3184, implemented:** `packages/nana-pack/lib/frontier-summary.mjs`, `packages/nana-pack/lib/frontier-summary-config.mjs`, `packages/nana-pack/tests/frontier-summary.test.mjs`, `packages/nana-setup/claude/rules/nana-seat.md`.
  The command line sits beside issue watch in normal and omitted blocks, with no additional hook process or network call.
  The line requires an issues pointer and the workflow, and stays absent under launcher roles.
  The seat rule requires session-start and post-land checks, with posting on red.
- **R-3185, implemented:** `packages/nana-pack/lib/lane-class-config.mjs`, `packages/nana-pack/tests/lane-class.test.mjs`.
  Only the workflow, test runner and runner config gain explicit gate entries.
- **R-3178 to R-3182 and R-3186, planned:** `REQUIREMENTS.md` carries six park notes pointing at the lane's measurement script and measurement files.
- **R-597, evidence added:** `packages/nana-pack/tests/ci-workflow.test.mjs` pins main's full-suite steps, three systems, no path filters, and no issue-writing permission.
  `.github/workflows/ci.yml` already met the contract and has no final diff.
- **Documentation:** `packages/nana-pack/README.md` describes dependencies, invocation, posting guards and exit codes.
  I regenerated `docs/requirements-tree.md` after the ledger change.
- **Component status:** `docs/components/nana-pi.json` marks release-route partial, anchored to parked R-3178.
  The planned rows made its prior sound claim false; two component-audit checks caught that claim.

All three implemented rows carry backticked `file::title` evidence in `REQUIREMENTS.md`.
I added no selector, runner selection flag, code-map implementation change or `linkRepo` export.
I edited no HANDOFF, known-bug file or session archive.

## Tests changed

New declarations:

1. `main-ci.test.mjs::R-3183: main push reds include advisory legs missing records jobs and older finished runs with scanned deduplicated seat-only posting`.
   Fixtures cover PR versus push records, red Linux inside green, install-check and release failures, unfinished runs and missing records.
   Posting fixtures cover all-green, one scanned post, duplicates, an identity hit and both launcher roles.
2. `frontier-summary.test.mjs::R-3184: the bounded and omitted seat blocks name main CI beside issue watch only with its workflow and the rule requires both runs`.
   Fixtures include CRLF, trailing space/tab and no final newline.
3. `frontier-summary.test.mjs::seal R-3184: the runnable main CI command prefix`.
4. `lane-class.test.mjs::R-3185: the CI workflow runner and runner config are explicit gate files`.
5. `ci-workflow.test.mjs::main pushes run the full suite on all systems without path filters or issue-writing permissions`.

Existing declaration edited:

- `lane-class.test.mjs::seal: R-2961 class paths and launched CLIs match the reviewed path list`.
  Its expected path list gains the three new explicit gate entries; the old expectation became false.

I edited or deleted no other existing test declaration.
The new fixtures are synchronous, use injected gh, and write only under OS temporary directories.
No suite test runs the seat's new CLI.

## Wrong-code pairs

Every new test ran red before implementation. Assertions were never inverted.
Long output is in `builder-mutation-output.txt`; I normalized machine-specific paths.

| Test | Wrong code | Wrong exit | Correct exit |
|---|---|---:|---:|
| R-3183 | Stub always returns green | 1 | 0 |
| R-3183 | Choose the PR run rather than the push run | 1 | 0 |
| R-3183 | Ignore failed records when the enclosing run is green | 1 | 0 |
| R-3183 | Replace the identity scan with unconditional success | 1 | 0 |
| R-3183 | Disable the same-title duplicate guard | 1 | 0 |
| R-3184 block | Existing implementation omits the new line | 1 | 0 |
| R-3184 block | Silence workers but render reviewer blocks | 1 | 0 |
| R-3184 seal | Existing config omits the command prefix | 1 | 0 |
| R-3185 | Existing config omits all three explicit entries | 1 | 0 |
| R-597 workflow pin | Add a push paths-ignore filter | 1 | 0 |

The direct test-file commands were `node packages/nana-pack/tests/<file>.test.mjs`.
Each relevant correct test also passed in the touched-test run and the locked full suite.
The reviewer-role mutation also reddened the existing R-2610 check.

## Verification commands and exits

| Command | Exit | Result |
|---|---:|---|
| `npm run map:impact -- <four affected library paths>` | 0 | Inspected callers and callees before implementation |
| `npm run req:tree` | 0 | Generated outline; 2210 rows, 39 features |
| `npm test -- main-ci.test.mjs frontier-summary.test.mjs lane-class.test.mjs ci-workflow.test.mjs ci-records.test.mjs handoff-issues.test.mjs issue-watch.test.mjs frontier-golden.test.mjs frontier-hook.test.mjs requirements-trace.test.mjs` | 0 | 11 files, 160 passing checks |
| `npm run test:locked` | 1 | Plain foreground full run, output on screen; summary below |
| `node packages/nana-pack/tests/component-audit.test.mjs` | 0 | 11 checks after correcting release-route status; output in `builder-component-check.txt` |
| `npm run map:check` | 1 | Three new modules lack generated entries; generated map is stale |
| `npm run readme:check` | 0 | 904 claims, zero problems |
| `node packages/nana-pack/tests/requirements-trace.test.mjs` | 0 | 61 checks in the touched and full runs; zero off-form rows |
| `node scripts/requirements-tree.mjs` | 0 | Zero problems; outline current |
| `node scripts/known-bugs.mjs --root .` | 0 | `summary names=0 sizes=0` |
| `node scripts/identity-scan.mjs` | 0 | 4753 tracked files, zero findings |
| `node scripts/identity-scan.mjs --stdin --root .` for each new code/output file | 0 each | New untracked files also scanned |
| `node packages/nana-setup/bin/install-check.mjs` | 1 | macOS post-edit write-error; output in `builder-install-check.txt` |
| `node scripts/lane-class.mjs --root . --files <the three gate paths plus frontier-summary>` | 0 | Gate line below |
| `git diff --check` | 0 | No whitespace errors |

Earlier corrective runs: requirements trace exited 1 for a two-shall R-3184 sentence, then passed after the wording fix.
An initial known-bugs invocation used unsupported `--check` and exited 2; the documented root invocation passed.

Full-suite summary, before the component status correction:

```text
241 files: 237 PASS, 2 FAIL, 2 SKIP, 0 WARN · checks: 8740 pass, 5 fail, 44 skip · 583.4s
```

The generated-map checks accounted for three failures; component status checks accounted for the other two.
The full suite has not been rerun after that metadata correction because the map blocker remains.
No failure was a timeout.

```text
gate: .github/workflows/ci.yml — CI verdict nana-land reads
```

## Precedent and departures

- Read all seven brief precedent files before implementation, plus the plan, attack, affected tests, workflow, seat rule and identity scanner.
- The command follows the issue-watch bin/lib split with injected gh.
  Production uses `ghDefault`, not the environment command override, to keep posting on local gh.
- The new command reuses `readCiRecords` and `finalFiles`; it does not copy their record interpretation.
  The optional run filter and returned metadata keep artifact parsing and missing-leg detection inside their existing library.
- `mainCiCommand` reuses public `watchCommand` and replaces its prefix and cwd flag.
  This avoids copying its private quoting helper.
- The sole new tunable lives in the existing frontier config, with one seal test.
  The implementation needs no separate main-ci config module; it imports existing CI bounds and protocol constants.
- The frontier uses `existsSync`, the existing role guard, `renderBlock` and its existing omitted path.
- Gate entries follow the explicit existing list and carry the required reason.
- Additional release-route metadata changed because mandatory planned rows invalidate a sound claim under the existing checker.
- The brief overrides revision 3's suggestion not to enter unused rows: I entered all six deferred rows with planned status.
- The code map remains untouched, as directed. Regenerating its output needs clarification before this patch can pass the required gate.

I copied, exported or moved no private helper.
The writing check flags technical identifiers and the exact verdict prefix; the brief requires both, and the owner-writing rule excludes worker reports.

## Known-bug context

I fixed no listed known bug.
The main command consumes CI artifacts, so existing missing-upload, runner-crash and artifact-expiration limits still apply.
It surfaces missing records rather than changing record creation or retention.
The default ci-records reader still reads every run at a SHA; only the new caller requests the push run's id.
The session-start addition is a command reminder, not a reader of the last local suite record.
No timeout or Windows skip-list behavior changed.

## Not done and open questions

- The lane needs permission to regenerate only `docs/code-map.md`; the code-map implementation would remain unchanged.
- The seat needs to resolve the local install rehearsal's post-edit write-error; this lane did not change that machinery.
- No green full suite, commit, push or new-tip CI run exists.
- I ran no Windows leg and observed or reran no Windows R-3104 timeout.
- I launched no independent model check or land reviewer, as builder sessions cannot start model sessions.
- The brief supplied no seat acceptance script or title check; I claim no `0 missing` result.
- The real main-CI command was not run: the brief reserves that command for the seat, not builders.
- I created, edited, commented on or closed no GitHub issue.
- Selection and its measurements remain parked; I attempted no selector-specific audit or real documents-only push.
