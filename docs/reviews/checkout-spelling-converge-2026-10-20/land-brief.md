# Review — checkout-spelling-converge (on macOS and Linux, install converges every link and the knowledge hook an earlier install wrote through another spelling of the checkout, and uninstall removes that entry), 2026-10-20 (Fable, the land reviewer)

Feature: FEAT-013 · Install and connect harness runtimes (the uninstall rows R-2203 and R-2204 under FEAT-018)

Review `git diff c7f582ad..HEAD` on `feat/checkout-spelling-converge`. The lane branched from main `07f8f6f9`; the seat
merged main `c7f582ad` into it at `29b83bf4`, so `git merge-base HEAD main` is `c7f582ad`. Main has since moved to
`c203f485` (three lands that touch no nana-setup file). The plan of record is
`docs/reviews/checkout-spelling-converge-2026-10-20/must-meet.md`: rows R-2200 to R-2204 (block R-2200 to R-2209).
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (8d6af832). The seat's record is
`seat-verify-29b83bf4.md`: CI run 39409313594 at 29b83bf4, 0 failing files on macOS, Ubuntu and Windows, with Ubuntu
passing all five checks through the linked spelling and Windows skipping the file with its declared reason
(`ci-windows-29b83bf4.log` beside it); the macOS wrong-code pairs through both spellings (`seat-mutate.mjs`; 12 of 14
red on 29b83bf4, P5 and P10 survived, both declared); and the independent check (`independent-check-29b83bf4.md`:
HOLDS, no MUST, 12 probes). The final reviewer's brief is `review-brief.md`. The local macOS install check runs before
the land.

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

The code under review: `linkSkill` in `packages/nana-setup/lib/steps.mjs` now relinks one of the four newly managed
skill links (spec, py-lint, py-review, py-test) when its text differs from the source but both resolve to one real
path; a dangling link or another real path stays a foreign-link problem. In `packages/nana-setup/lib/settings.mjs`, a
new predicate owns a knowledge hook entry whose command differs from install's but names the same file under the
native lookup, with every other key equal; `removeInstallerHooks` removes such an entry and `mergeRepoHooks` rewrites
it. `packages/nana-setup/lib/uninstall.mjs` reports variants from the settings after removal. `scripts/test.mjs` skips
the new test file on win32. `nana-setup install` and uninstall run these over the owner's real home and Claude Code
settings.

Judge whether the lane fails open: install taking a link to another copy, or a dangling link, for this checkout's, so
it rewrites the owner's link text; install rewriting, or uninstall removing, a knowledge entry that
is not install's own (another copy's, one with a changed key, one whose target is missing); or the runner's skip hiding
the file on a macOS or Linux leg. Judge whether it leaves a harm the review standard lists: data lost or corrupted in
the home (link texts rewritten, settings entries rewritten or removed); a broken install or hook (a knowledge hook that
no longer starts, an install that rewrites its own healthy entry every run); or a test writing outside the temp folders
it owns. Judge whether anything main does today stopped working: install, doctor and uninstall on a home installed
with no change of spelling, forced-win32 output, and the existing nana-setup test files, on any of the three CI legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a respelled
duplicate beside the exact knowledge entry becomes a second identical entry, reported `created added` (main kept two
entries differing only in spelling; uninstall removes both); under a home reached through a link, or through the
owner's own link, a relative newly managed link is rewritten to the absolute on-disk path (the plan puts the home's own
spelling out of scope); the knowledge rewrite reads as added, dry run included (as main); Windows is unchanged; a
checkout moved with no link left still fails install with four foreign rows (as main); the dry runs are untested for
these homes; a failed strict lookup reads a case spelling as another copy; the new test repeats the older test's
helpers; and the survivors P5 (a dangling link) and P10 (a missing target), which no check plants, though the seat's
probe shows the lane's code right on both.

Threat model: honest variation in our tools' output and the OS is in scope (macOS, Linux and Windows; a letter-case
spelling on a case-insensitive volume; a link to the checkout left at a moved checkout's old path; what an earlier
install wrote under either spelling; a second copy of the repository on the same machine); deliberate forgery is out
(a forged link, a hand-edited entry naming a look-alike path). The home folder's own spelling is out of scope. Lane
class: install, hook or gate — it changes nana-setup install's skill links and knowledge hook merge and uninstall.

Chain: realpath-strict-fallback lands before this lane. It adds a setup README bullet right after the one this lane
rewrites. The seat merges main once that lane has landed, re-runs the pairs on the merged tip, and adds a chain note
below naming the merge commit and the new merge base. Review this lane's own change against that base, and the merge
with `git show --remerge-diff` on the merge commit.

Check: (1) no fail-open; (2) no listed harm, the duplicate-entry known bug judged against the standard; (3) nothing
main does today stopped working, on any of the three CI legs; (4) HANDOFF and the session entry are true; (5) any MUST.

## Chain note (the seat, after this brief was written)

Since `b6140eff`, the seat merged `0305bc8d`, the post-edit-values-named lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `0305bc8d` becomes main before this lane lands. Review this lane's own change as `git diff 0305bc8d...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 9de2f6e9` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 0305bc8d`):

```
tree movement 0305bc8..9de2f6e: 5 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-2200 new (implemented)
  R-2201 new (implemented)
  R-2202 new (implemented)
FEAT-018 · Update or remove managed components safely
  R-2203 new (implemented)
  R-2204 new (implemented)
```
