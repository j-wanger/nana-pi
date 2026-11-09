# Memory-sort CI fixes

## Scope and result

This fix serves roadmap step 3: unblock the lane that trims helper context.
Only `packages/nana-setup/tests/seat-rule.test.mjs` changed among tests.
The guide and profile implementation are unchanged.

The stale seat tests reproduced both reported failures. The exact profile-store
file passed alone; it also passed in the four-job module selection. The reported
CI profile failure did not reproduce, so this fix changes nothing in profile-store.

## Requirements and precedent

Requirement edits preceded test edits. No new IDs or tunables were allocated.
R-1140 and R-3900 retire the obsolete closed inventory and paragraph-order constraints.
R-1141, R-3026, R-3067, R-3140, R-3141, R-3161, R-3162, R-3163,
R-3536, R-3894 and R-3902 become untested: their guidance remains, but wording
checks no longer prove behavior. R-3898, R-3901 and R-3904 retain their checklist tests.
The new canonical-input check uses R-3021/R-3023; existing rulings tests exercise
actual guide injection, role exclusion and unusable-input handling.

Precedent: the existing seat-rule test supplied its check reporter and checklist.
Departure: replace its closed line inventory with a nonempty, strict UTF-8,
byte-cap check. Import `SEAT_GUIDE_READ_CAP` from its existing public configuration
module rather than duplicating the cap. No functions changed returns or callers.
The generated code map records that new import.

## Removed wording pins

The 23 removed checks pinned:

- The exact scope sentence and its position.
- The closed bullet inventory.
- Background launch and foreground pi wording.
- No partial-work reading wording.
- Completion/monitor wording.
- Verify-once wording (one of the reproduced failures).
- One-reviewer-plus-CI wording.
- Absence of the retired mutation-runner phrase.
- First-look commands and wording.
- Visual-reader wording and position.
- UI-brief wording and position.
- Linked UI-template reference wording and library URL.
- UI-template gate wording.
- Outside-reader wording.
- Findings-in-next-brief wording.
- Lane-count wording.
- Independent-work wording.
- Full-suite wording.
- Preamble/review-standard wording.
- Parallel-build wording and position, plus exact shared loader prose.
- Red-main wording and adjacency.
- Plan-question wording and associated planner/retired-row text.
- Role-launch commands, scheduling prose and dated ruling.

The seven-lesson checklist, named known-bug removal authority and mandatory trace
check remain. No test file was added or removed. The runner self-tests still ran.
`ci-fixes-removed-grep.log` records searches across tests for 63 removed literals.

## Wrong-code proof

P1: temporarily set the production `SEAT_GUIDE_READ_CAP` to 1. The new canonical
input check failed with exit 1. Restore 8192: the check passes with exit 0.
No assertion was inverted. The temporary production mutation is absent from the commit.
No other new test or sealed tunable was introduced.

## Evidence and limits

`ci-fixes-validation.log` holds the commands, exit codes and sanitized output.
The profile-store exact run and parallel module-selection output both appear there.
The initial module run hit the tool's 200-second limit; the complete rerun is the
reported module result, not that interrupted attempt.

CI covers the full suite under AGENTS.md, so no local full-suite fallback ran.
No push, CI read, model session, GitHub issue operation or credential access occurred.
No install check ran: this fix changes only tests, requirements and generated/evidence docs;
the live install check would launch a model session, which the brief forbids.
No known-bug line changed or was fixed; the complete FEAT-013 known-bug file was read.
Median lane hours and net main-line reduction remain unmeasured in this fix.
