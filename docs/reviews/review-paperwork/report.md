# Review-paperwork builder record

VERDICT: DONE

Feature: FEAT-007 · Review a specific revision independently
Branch: `feat/review-paperwork`
Base: `0f8e9932108a8208d6f16b6a30e311abc01b299a`
Implementation: `9689fe0dd48481136391e3cb19a55b06c6f90173`
The final response identifies the metadata/evidence tip and its post-commit checks.

## Commits and files

1. Implementation: requirements, ten must-meets, review tools, shared Git runner, rule text, generated maps and proof logs.
   - `packages/nana-pack/lib/review-run.mjs` holds the former ledger run path.
   - `bin/claude-review.mjs` owns admission and calls that runner directly.
   - `bin/review-round.mjs` retains the store, locks, reservations, captured texts, verdict parser and completion recheck.
   - `bin/pi-review.mjs` drops movement but retains immutable checkouts and brief-feature known bugs.
   - `bin/nana-land.mjs` drops text authorization and notes, keeping both review checks and the locked merge.
   - `scripts/git-runner.mjs` rehomes the unchanged Git helper behavior.
   - Git helper callers: `scripts/blast-radius.mjs`, `component-audit.mjs`, `deliverables.mjs`, `product-report.mjs`.
   - `bin/pi-worker.mjs`, `bin/review-timeline.mjs`, package bins, component parts and first-look configuration drop removed behavior.
   - Shared pattern, `AGENTS.md`, both objective files, pack README, requirements skill and soul rule drop review obligations.
   - `docs/code-map.md` and `docs/requirements-tree.md` are regenerated.
2. Metadata/evidence: register the two new modules in `docs/components/nana-pi.json` after they exist at committed HEAD.
   The component audit checks HEAD, not the index. Both commits follow green touched-test runs.

All shortened `bin/`, `lib/` and `tests/` paths above are under `packages/nana-pack/`.

## Requirement diff

New rows, in must-meet order: R-3765 through R-3774. No other new IDs.

Retired, never deleted or renumbered:
R-719, R-720, R-726, R-729, R-840, R-841, R-842, R-970,
R-1460–R-1463, R-1620, R-1630, R-2447, R-2540, R-2571–R-2574,
R-2576, R-2643, R-2786, R-2797, R-2837, R-2900–R-2908,
R-2910–R-2913 and R-3455. Total: 39 rows.

A-057 is retired. Its park line leaves; the retired registry entry remains.
CAP-07 no longer delivers R-1460. Its maker/readers leave.
The R-1008 maker names claude-review instead of the removed CLI.
FEAT-028 no longer reads the ledger through the removed command.
FEAT-008 no longer claims to read A-008 through nana-land.
The timeline's text and audit readers stay.

The map's re-scopes are applied. Additional dependent re-scopes:
- R-714: reservation visibility replaces the last-slot cap claim.
- R-722 and R-730: retain storage/export contracts without cap language.
- R-1352: repository identity remains; the removed report CLI does not.
- R-1720–R-1723, R-2250, R-2254, R-2255 and R-2432: the retained shared review runner replaces the CLI.
- R-3490/R-3491: evidence points to a surviving land check; the split preserves surviving checks, not retired text checks.
- Evidence titles follow edited tests. The title rail reports `0 missing`.

## Closures and wrong-code pairs

The ten tests were written before production changes. Each async case is awaited under a case limit.
Fixtures use the OS temporary directory. Text cases include CRLF, trailing spaces/tabs and no final newline.

| Must-meet | Row | Wrong code, observed red | Correct code, observed green |
|---|---|---|---|
| M1 | R-3765 | Original intermediary process; parent PID differs | Direct runner; verified v2 LAND; child exit 7 preserved |
| M2 | R-3766 | Original movement prompt | Neither prompt has movement; only brief-feature bugs appear |
| M3 | R-3767 | Original fourth-revision refusal | Four revisions record in both launchers; retired flag refuses |
| M4 | R-3768 | Original kept-text authorization | Missing texts do not block; no LAND, non-LAND, live review and uncovered commits still block |
| M5 | R-3769 | Code rejects legacy v1 records | Legacy records and both path spellings remain readable and byte-preserved |
| M6 | R-3770 | Original files still exist | Files absent; rehomed runner and report outputs preserved |
| M7 | R-3771 | Original rule obligations | Obligations removed; shared marker equality holds |
| M8 | R-3772 | Code forces completion's stable check true | Changed HEAD exits nonzero; no verified LAND; legacy bytes unchanged; reservation gone; land refuses |
| M9 | R-3773 | Code omits the second checkRecords call | Late non-LAND and reservation each refuse before any merge |
| M10 | R-3774 | Code sets a credential-control value incorrectly | Native fixture argv/prompt/settings/cleanup pass; Windows branch uses only claude.cmd |

Wrong-code evidence: `wrong-baseline.log`, `wrong-M5.log`, `wrong-M8.log`, `wrong-M9.log`, `wrong-M10.log`.
All wrong runs exit 1. Assertions were never inverted.
The four mutation runs used isolated copies under `$TMPDIR`, not the worktree.
The Windows-specific command route awaits the Windows CI leg; this Mac exercised native launch and sealing.

An initial, discarded baseline fixture lacked its POSIX fake pi executable.
Two launcher cases resolved installed pi and exited nonzero. Their output was not accepted as mutation proof.
The recorded baseline was rerun after installing the POSIX synthetic executable in each fixture's PATH.
No credential or session archive was inspected to investigate that invalid run.

## Existing test edits

No unrelated test was deleted. Only three movement-only files were deleted:
`requirements-moved.test.mjs`, `review-movement.test.mjs`, `keep-movement.test.mjs`.
One test file was added: `review-paperwork.test.mjs`, containing exactly M1–M10.
`review-run-harness.mjs` is a helper, not a new suite test.

Edits made where removal changed an existing assertion, fixture dependency or documentation pin:

| Existing test/helper | Edit |
|---|---|
| `claude-review.test.mjs` | Remove movement and override cases; update launcher outcome diagnostics/title |
| `immutable-review.test.mjs` | Remove movement-only cases/imports; metadata evidence now uses R-1008 |
| `land-merge.test.mjs` | Remove retired text authorization/report/note checks; move split markers to a surviving check |
| `review-round.test.mjs` | Remove cap constant/verdict assertions; preserve slug, revision and compatibility-export checks |
| `review-ledger.test.mjs` | Concurrent fourth reviews both record; live reservations remain visible; uncapped notes |
| `review-ledger-launch.test.mjs` | Fourth/later revisions record; preserve verdict corpus, stalls, worker isolation and repeated-revision checks |
| `review-ledger-state.test.mjs` | Update cap-dependent identity/rotation/snapshot assertions; remove override/report blocks; preserve storage refusals and snapshots |
| `review-ledger-verdicts.test.mjs` | Remove keep/report blocks; unread guidance no longer counts remaining rounds; retain verdict corpus, text storage, rename retry, redirect and shape checks |
| `review-ledger-fixture.mjs` | Replace removed CLI with temporary process harness importing the public runner; remove keep helper |
| `review-launch.test.mjs` | Same resolver/start-failure cases through the retained public runner; new diagnostic prefix |
| `path-spelling.test.mjs` | Public runner harness; fourth review admitted; direct readRounds/repoKeyOf replace report CLI |
| `win32-launch.test.mjs` | Public runner harness replaces removed CLI; preserve npm pi resolution cases |
| `review-timeline.test.mjs` | Public runner harness; ignore old override marks while preserving legacy-row readability |
| `credential-strip.test.mjs` | Remove deleted direct-CLI entry points; retain both shipped reviewer routes and all six hostile fixture routes |
| `context-anatomy.test.mjs` | Changed-ledger reviewer case now expects brief-only bugs and no movement prompt |
| `ledger-repo.mjs` | Remove unused movement fixtures/report runner; preserve ledgerRepo used by one-reviewer tests |
| `linked-launch.test.mjs` | Remove deleted command's linked-path case only |
| `requirements-tree.test.mjs`, `requirements-regroup.test.mjs` | Copy git-runner dependency instead of deleted command |
| `product-report.test.mjs` | Import the rehomed buffer constant |
| `first-look.test.mjs` | Page-shaping helper path follows the rehome |
| `templates-render.test.mjs` | Stop requiring a review corpus path and three-round wording |
| `worker-claude.test.mjs` | Remove the retired override from the worker's review-option list |
| `code-map-launch.test.mjs` | Name explicit historical edge-loss reasons for the removed commands, movement tests and fixtures |
| `review-standard.test.mjs`, `blast-radius.test.mjs`, `brief-check.test.mjs` | Refresh removed dependency comments or example precedent paths |

The existing review-ledger suite filenames and RUN_ALONE entry stay because their retained store cases still run.
The removed-row tags leave; surviving assertions retain their live requirement tags.

## Precedent and removal-map verification

Read all four precedent modules before implementation, including review-round's full file.
The moved runner keeps admission, reviewLaunch resolution, credential sealing, heartbeat, captured stdout and locked completion.
Both nana-land checks remain in place, including the final lock held through merge.
No private helper was imported or copied into another production module.

Choices/departures:
- Use `lib/review-run.mjs` and `scripts/git-runner.mjs`, both homes permitted by the plan.
- Port store suites in place instead of deleting their filenames. This preserves load-sensitive RUN_ALONE scheduling and existing proofs.
- Keep the uncapped `project` library API for retained read-only store cases; no shipped check/report/keep command remains.
- Resolve Claude output paths against the launcher folder, matching pi-review and avoiding the old relative audit-path ambiguity.
- Two commits are needed for the component audit's tracked-at-HEAD rule.

Map corrections on this branch:
- Its shorthand `tests/...` paths mean `packages/nana-pack/tests/...`; line numbers also predate one-reviewer.
- `scripts/lane-class.mjs` and the group-1 machinery are already absent. No edit to those parallel cuts was needed.
- `review-launch.test.mjs` also starts the removed CLI; the map omitted that process harness. It is ported without deleting its resolver cases.
- The stated RUN_ALONE edit is conditional on deleting the suite file; porting in place needs no edit.
- Both tree-report copy fixtures need the rehomed dependency, not just removal of the old filename.
- The seat guide already has no group-2 obligation on this branch, so it remains unchanged.
- The memory factory checks for missing review folders and returns no review units. Its optional historical reads and timeline exclusion stay unchanged.

All group-2 production importers and live text pins were checked.
`removed-pin-scan.log` contains only negative absence assertions and named historical code-map edge losses.
A runtime-path grep across `bin/`, `lib/` and `scripts/` found no removed production path (grep exit 1 means no match).

## Checks and evidence

Each command below exits 0 on the completed implementation unless explicitly noted.

| Command | Result | Evidence |
|---|---|---|
| `npm run map` | green | `map.log` |
| `npm run map:check` | green | `map-check.log` |
| `npm run req:tree` | 0 tree problems; 2583 rows; 43 features | `tree.log` |
| `npm run readme:check` | 0 problems | `readme.log` |
| `node scripts/component-audit.mjs` | green; existing stale/unclaimed notices remain report-only | `components.log` |
| `node scripts/requirements-trace.mjs` / title rail | 0 missing; 0 EARS off-form rows | `titles.log` |
| `node scripts/test.mjs --jobs=4 <touched and review/report dependency filters>` | 44 files, 1027 passed checks, 14 skipped checks, no failures | `touched-tests.log` |
| `node scripts/test.mjs test-runner review-paperwork.test.mjs` | 3 files, 74 passed checks, no failures | `test-runner.log` |
| `node scripts/test.mjs component-audit.test.mjs review-paperwork.test.mjs` | 2 files, 21 passed checks | `component-registration.log` |
| `node packages/nana-setup/bin/install-check.mjs` | 18 PASS items on this Mac | `install-check.log` |
| Original-helper versus rehomed-helper report comparison | four identical repo outputs/models; issue reader injected, no gh call | `helper-parity.log` |
| Removed-pin grep / runtime-path grep | only negative/history pins / no runtime matches | `removed-pin-scan.log` |
| `git diff --check` | green | command result |

The 44-filter invocation is the set printed in `touched-tests.log`; it includes every changed test and retained review/report dependency tests.
Post-tip seat checks rerun the same 44 filters, runner checks, generators, title rail, component audit, README check and Mac install rehearsal.
Their temporary output files use `$TMPDIR/review-paperwork-final-*`; the final response records their exit codes and final SHA.
The committed logs above contain the long output from the same implementation before the final metadata commit.

The helper comparison imports the original helper exports from the base command's source, then compares:
`collectChangedPaths`, `buildAudit`, `deliverableReport` and `buildReport` with unchanged resources.
The product-report issue reader is injected as `async () => null`, so comparison never needs a credential.

## Known-bug context and scope boundaries

Read `docs/known-bugs/FEAT-007.md` whole, not only the brief's digest.
No known-bug file was edited. Removed-machinery entries remain historical context.
The change touches the movement and keep-movement entries, rounds-left/cap accounting entries,
kept-text land authorization and earlier-text notes, and the Claude intermediary-process entries.
It does not fix the remaining live-tree, watchdog/retry, verdict grammar, model alias/provider,
read-only enforcement, PID helper, hard-kill cleanup, or review-cost limitations.
The timeline's additional A-056 input issue remains outside this cut.

Unchanged: HANDOFF, session archives, ask issues, the HANDOFF-and-session-notes sentence,
parallel hive/bench/desk/setup removals, store names, dirty-tree identity and local-suite fallback.
No GitHub issue or API was used. No push or CI read was done.
The full suite is deferred to CI as this repository's AGENTS.md directs.
Native Windows execution is not available on this Mac; the Windows test branch remains for CI.
No open owner question was needed.
