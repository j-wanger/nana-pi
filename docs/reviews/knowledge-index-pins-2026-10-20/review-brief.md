# Review — knowledge-index-pins (tests pin eight existing knowledge build promises, the Windows junction included), 2026-10-20 (Opus, the lane's one final reviewer)

Feature: FEAT-003 · Index and connect existing knowledge sources

Review `git diff 385c633f..HEAD` on `feat/knowledge-index-pins` (main was `385c633f` when this brief was written; `git
merge-base HEAD main` is `385c633f`). The plan of record is `docs/reviews/knowledge-index-pins-2026-10-20/must-meet.md`:
a pin lane over eight existing untested rows, R-235, R-203, R-236, R-204, R-882, R-211, R-884 and R-232, with no new
row and no product code (the R-2030 to R-2039 block stays unused). `plan-attack.md` holds the adversary's AMEND, which
dropped the two planned build-level checks in ledger-parse; `build-brief-1.md` is the one build (9c509e25), merged
with main 385c633f at b8d414a9; `builder-mutations.md` is the builder's wrong-code table. The seat's record is
`seat-verify-b8d414a9.md`: CI run 39384899535 on draft pull request #110 at b8d414a9, 0 failing files on all three
legs, with the Windows suite log `ci-windows-b8d414a9.log` beside it. No seat pairs and no independent check: an
ordinary lane.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, against the merge base 385c633f; the seat's
notes commit changes no row): eight rows re-statused, none added, retired or reworded.

```
tree movement 385c633..b8d414a: 8 rows in 1 features
FEAT-003 · Index and connect existing knowledge sources
  R-203 untested -> implemented
  R-204 untested -> implemented
  R-211 untested -> implemented
  R-232 untested -> implemented
  R-235 untested -> implemented
  R-236 untested -> implemented
  R-882 untested -> implemented
  R-884 untested -> implemented
```

The change under review: three new checks at the end of `packages/nana-knowledge/tests/incremental-build.test.mjs`,
each block with its own temp `NANA_KNOWLEDGE_HOME` and root and a `sources.json` written before each build (R-235:
`.git` and a nested `raw` folder skipped; R-203: a linked folder, a junction on win32, skipped; R-236: same-length new
bytes at the same whole-second mtime stay unindexed); `// req:` markers on existing checks in `incremental-build`,
`ledger-parse`, `discovery` and `hook` tests (R-204, R-882, R-211, R-884, R-232); the eight Evidence cells in
REQUIREMENTS.md. No `lib/`, hook, extension or code map change.

Judge whether each of the eight rows now has a check that fails when the code breaks the row, and whether each row is
no wider than its checks. Judge whether the walker block really proves R-235 and R-203 on every platform: the link's
target sits outside the walked root, `keep.md` must be indexed for either check to pass, and the Windows run made a
junction, not a symlink. Judge whether the fast-path check can tell a skipped read from a re-index that happened to
find the same text. Judge whether the new blocks can reach the real home folder or leave `NANA_KNOWLEDGE_HOME`
pointing elsewhere for later checks.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and native Windows; mtime
precision; how each OS lists a link or junction; CI temp roots). Deliberate forgery of files, links or lock contents is
out. Lane class: ordinary — tests and REQUIREMENTS.md only; no install, uninstall or doctor code, no Claude Code hook,
no pi extension, no gate policy, no land or review tool. Had a new check been red on main, the fix would have gone in
`lib/` and the lane would have become a hook lane; CI's three legs read 0 failing, so it did not.

Check: (1) the must-meet checks are not vacuous: each new check reds on the wrong code the plan names, and each marked
check reds on its named wrong code (the builder's table has no try for "[uses: not required" against "bullet without
[uses:] is not a row"; the plan adversary's probe reported it red); (2) the new checks run on every leg without a skip,
and the Windows leg's PASS for the junction check is real; (3) the tests write only inside the temp folders they own,
never seed from the real home folder, and restore `NANA_KNOWLEDGE_HOME`; (4) nothing else changed: existing checks
gained only markers, REQUIREMENTS.md changed only the eight rows, and no product file or code map line moved; (5) the
plan's known limits and dropped rows are recorded as HANDOFF residuals or in the seat's record, and none hides a bug
that stops the feature; (6) HANDOFF and the session entry are true, including the dropped knowledge-pull-fail-open-pin
residual and the edited builder-briefs line; (7) any MUST.
