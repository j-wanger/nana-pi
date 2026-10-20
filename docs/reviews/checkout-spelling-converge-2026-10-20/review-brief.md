# Review — checkout-spelling-converge (on macOS and Linux, install converges every link and the knowledge hook an earlier install wrote through another spelling of the checkout, and uninstall removes that entry), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (the uninstall rows R-2203 and R-2204 under FEAT-018)

Review `git diff c7f582ad..HEAD` on `feat/checkout-spelling-converge`. The lane branched from main `07f8f6f9`; the seat
merged main `c7f582ad` (the pi-launch-followups land tip) into it at `29b83bf4`, so `git merge-base HEAD main` is
`c7f582ad`, main's tip at that merge, and that diff is the lane's own change. Main has since moved to `c203f485`
(notify-lifecycle-pins, mutation-runner-takeover-race and handoff-cap-surrogate landed; none touches a nana-setup file
or `scripts/test.mjs`).

The plan of record is `docs/reviews/checkout-spelling-converge-2026-10-20/must-meet.md`: five must-meet checks, rows
R-2200 to R-2204 (block R-2200 to R-2209), the design and the known limits. `plan-attack.md` holds the adversary's
AMEND. `build-brief-1.md` is the one build (8d6af832). The seat's record is `seat-verify-29b83bf4.md`: CI run
39409313594 on draft pull request #125 at 29b83bf4, 0 failing files on all three legs, the Windows leg skipping the new
file with its declared reason (`ci-windows-29b83bf4.log` beside it) and the Ubuntu leg passing all five checks through
the linked spelling; the wrong-code pairs (`seat-mutate.mjs`; `seat-mutate-output-29b83bf4.txt`: 12 of 14 red, P5 and
P10 survived, both declared); and the independent check (`independent-check-29b83bf4.md`: HOLDS, no MUST, 12 probes;
its known bug and out-of-scope note recorded as residuals). The local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement c7f582a..d7bc8a4: 5 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-2200 new (implemented)
  R-2201 new (implemented)
  R-2202 new (implemented)
FEAT-018 · Update or remove managed components safely
  R-2203 new (implemented)
  R-2204 new (implemented)
```

CAP-04 moves from 474 to 479 rows, FEAT-013 from 180 to 183 (SUB-012 39 to 41, SUB-013 45 to 46) and FEAT-018 from 22
to 24. No existing row changed.

The code under review: `linkSkill` in `packages/nana-setup/lib/steps.mjs` (the foreign-link branch now runs only when
the link's resolved text differs from the source, and a real-path match falls through to the relink);
`respelledKnowledgeEntry`, `removeInstallerHooks` and `mergeRepoHooks`' same-file replacement in
`packages/nana-setup/lib/settings.mjs`, with the comment beside the healthy check's `fs.realpathSync`;
`settingsVariants` reading the settings after removal in `packages/nana-setup/lib/uninstall.mjs`; the win32 entry in
`scripts/test.mjs`'s skip map; the setup README's earlier-spelling bullet, uninstall sentence and tests-table row. The
checks sit in the new `packages/nana-setup/tests/checkout-converge.test.mjs`.

Judge whether, on macOS and Linux, install through the checkout's on-disk spelling converges every link and the
knowledge entry an earlier install wrote through a letter-case or a linked spelling, exiting 0 with no problem row;
whether a link or an entry naming another copy of the repository stays foreign or a variant, as on main; whether
uninstall removes a knowledge entry that differs only in that spelling, with no variant row, and leaves one that names
another copy or changes another key; and whether a home installed with no change of spelling, and forced win32, behave
exactly as on main. Judge the ownership line the predicate draws: an entry is install's own only when every key but
the command equals install's entry and both targets are one file under the native lookup. Judge too whether each check
would fail with its behaviour removed: the pairs ran on macOS through both spellings; Linux has CI's native pass
through the linked spelling; Windows skips the file.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; a letter-case
spelling on a case-insensitive volume; a link to the checkout left at a moved checkout's old path; what an earlier
install wrote under either spelling; a second copy of the repository on the same machine); deliberate forgery is out
(a forged link, a hand-edited entry naming a look-alike path). The home folder's own spelling is out of scope, as the
plan says. Lane class: install, hook or gate — it changes nana-setup install's skill links and knowledge hook merge
(`steps.mjs`, `settings.mjs`) and uninstall (`uninstall.mjs`).

Chain: realpath-strict-fallback lands before this lane. It adds a setup README bullet right after the one this lane
rewrites, and both lanes regenerate REQUIREMENTS.md, the tree and the code map. The planner asked for this lane to
merge main once that lane has landed, before the final review. The seat makes that merge, re-runs the pairs on the
merged tip, and adds a chain note below naming the merge commit and the new merge base. Review this lane's own change
against that base, and the merge with `git show --remerge-diff` on the merge commit.

Check: (1) the must-meet checks are not vacuous: each named pair turns its check red, the earlier-home fixture fails
when it rewrites no link or no knowledge entry, and the guards R-2201 and R-2204 fail on code that owns too much (P2,
P3, P7, P8); (2) no fail-open: no link or entry naming another copy, a dangling target or a changed key is relinked,
rewritten or removed, judging the declared survivors P5 and P10 against that; (3) a home installed through the on-disk
spelling does not change on upgrade, and an earlier-spelling home converges once with nothing lost, judging the
duplicate-entry known bug; (4) nothing main does today stopped working: POSIX and forced-win32 install, doctor and
uninstall, and the existing nana-setup test files, on all three CI legs; (5) the runner's skip hides the file only on
win32; (6) the tests write only inside the temp folders they own and clean up; (7) HANDOFF and the session entry are
true, including the three removed setup-checkout-spelling residuals and the nine new ones; (8) any MUST.
