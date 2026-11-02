# Machine lane limits — builder evidence

## Scope and choices

FEAT-006: R-3520, R-3521, R-3522, R-3524, R-3525 and reworded R-1123/R-1140.
FEAT-023: R-3523 (notice), as the plan directs. No existing requirement changed feature.

The implementation follows revision 2. `resolveLaneLimit` runs on the already-parsed top-level member; it never reads another file. `formatRosterLines` takes the optional third argument `lanes`, and `setRosterSlot` returns its resolved `base.lanes` for the CLI. This avoids both a second resolver read and a copied helper. The sealed default is `LANE_LIMIT_DEFAULT`. The roster slots and JSON output remain unchanged.

All brief and plan Precedent files were read, including both notice adapters and the rulings injection files. No private helper moved or was copied. The existing `writePackConfigMember` preserves lanes without a change. No adapter or launcher needed a change.

## Requirement-first and wrong-code evidence

Rows were written as planned before tests. Each new test and the changed exact seat-guide pin ran against the original implementation before production edits. Every file exited 1 with named FAIL lines, not load or syntax failures. The `red-*.log` files retain those runs. `green-*.log` retains the succeeding runs. Each new sealed value has its own direct pin.

Must-meets 1–3: nana-roster tests; 4: roster-notice tests; 5: nana-roster-set tests; 6: rulings tests; 7: the existing R-1140 exact-line check. The new ruling check also reads CRLF, trailing spaces/tabs and no-final-newline variants. All new cases are synchronous; the new roster-command calls have a five-second process limit. Every fixture lives under the OS temporary directory; the real user config was untouched.

## Existing test edits

- `nana-roster.test.mjs`: the R-1123 exact default and file stdout expectations gain the lanes line before source. The title stays unchanged. Expectations read the sealed default by name.
- `seat-rule.test.mjs`: RULE_7, its provenance comment and its exact-pin title change to the machine roster instruction. R-1140's evidence title changes with it. The sixteen-rule check is unchanged.
- Other test changes only add the named must-meets, seal pins and their imports. No test was deleted.

The literal audit searched tests and checkers before edits. It identified the forecast pins and unrelated date literals. R-1192's exact JSON keys and R-1400's stdout equality remain unchanged and green. The audit and map-impact output are retained beside this file.

## Checks before the implementation commit

- All five touched test files: `node --experimental-strip-types <file>` → 0 each.
- Existing requirements-trace, roster-notice-hook and rulings-install test files → 0 each.
- `npm run map` → 0; `npm run map:check` → 0.
- `npm run readme:check` → 0.
- `node --experimental-strip-types scripts/requirements-trace.mjs` → 0; 2163 implemented and traced, zero off-form rows.
- `npm run req:tree` → 0, then `node scripts/requirements-tree.mjs --root .` → 0.
- `node scripts/known-bugs.mjs --root .` → 0.
- `node packages/nana-pack/bin/nana-writing.mjs <temporary session-entry file>` → 0; zero writing findings.
- `node packages/nana-setup/bin/install-check.mjs` → 1 under inherited builder environment: pi post-edit write failed; all other checks passed.
- The same install check with NANA_WORKTREE_ROOT, NANA_ROLE, NANA_HANDOFF and PI_SESSION_ID removed from its environment → 0, all checks passed. The fixture must not inherit this builder's lane boundary.

Logs replace identifying home/checkout prefixes with `<HOME>` and `<LANE>`; assertions and PASS/FAIL output are unchanged.

## Mutation proof

`SEAT_MUTATE_OUT=<lane folder>/seat-mutate.log node <lane folder>/seat-mutate.mjs` → 0 on implementation commit `3a904a9ca9ab6d395af7da185f77debf84c72ef9`.

RESULT: 12/12 red (12 exactly their named titles, 0 with a named title green, 0 with an unnamed red), 0 survived, across 5 shards.

Pairs 1–7 break the absent-file limit, written limit, numeric validation, notice segment, member preservation, ruling and seat guide respectively. The other pairs break set's printed limit, the warning and each of the three new seals. All five touched test files passed the runner's isolated baseline. The runner uses the shared mutation module; no test imports, copies or launches this seat script. The first run also had 12/12 red; pair 1 was then made a wrong value rather than a missing property, avoiding an incidental CLI TypeError and declaring its exact-stdout collateral failure.

The identity scan initially found identifying home paths in four captured logs. Those prefixes were redacted without changing results; the repeated scan exited 0. `git diff --check` also exited 0.

## Known bugs touched and departures

Closed: FEAT-040's ruling-order bug. The replaced October 31 ruling is gone; the new ruling is the final dated bullet. Only the explicitly requested line was removed.

FEAT-006 context read in full. The advisory seat-guide limitation still applies: text cannot make a seat obey its limit. The pi notice remains a widget rather than model context; the seat guide points to the command. Existing roster-set locking, backup and default-materialization limits are unchanged. No other known bug was fixed.

Departures from the plan's documentation list: no residuals were added to FEAT-006, because the builder's general scope forbids editing known-bug files except the specifically requested FEAT-040 removal. Residuals and carry are recorded here instead. The requested newest-first session entry is the only archive edit. The isolated install-check rerun is an environment adjustment, not a code fix.

## Not done / seat carry

No locked full suite: AGENTS assigns it to CI. No model builder/reviewer sessions or subagents were launched. No CI run was read. No GitHub issue was created, edited or commented on.

The laptop still defaults to four until the seat carries the plan's setup: pull main, install updated rule copies, inspect logical cores and memory, choose its limit (about two), back up its active agent config, add top-level lanes, run the roster command with clean stderr, and confirm the next session notice. That remains the seat's next-item issue, not a builder issue.

The count is advisory and has no upper cap. A malformed JSON document still refuses the whole file. Windows CI and the laptop setup are not local evidence.
