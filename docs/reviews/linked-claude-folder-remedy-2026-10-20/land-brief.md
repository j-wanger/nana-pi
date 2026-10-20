# Review — linked-claude-folder-remedy (install prints no retired row for an absent file under a linked Claude folder, and doctor's ✗ skill rows name that folder to move aside), 2026-10-20 (pi gpt-6-astra, the land reviewer)

Feature: FEAT-015 · Diagnose the active environment (R-2290 and R-2291 sit under FEAT-013 SUB-014)

Review `git diff 72abe19a..HEAD` on `feat/linked-claude-folder-remedy` (main was `72abe19a` when this brief was
written; `git merge-base HEAD main` is `72abe19a`). The plan of record is
`docs/reviews/linked-claude-folder-remedy-2026-10-20/must-meet.md`: five must-meet checks, rows R-2290 to R-2294.
`plan-attack.md` holds the adversary's AMEND; `build-brief-1.md` is the one build (2055067e). The seat's record is
`seat-verify-c7be9bb3.md`: CI run 39441711620 at 2055067e, 0 failing files on macOS, Ubuntu and Windows
(`ci-windows-2055067e.log` beside it; linked-claude-folder passes 5 of 5 on native Windows), the wrong-code pairs
(`seat-mutate.mjs`; 18 of 19 red on 2055067e, survivor D4 a declared test gap) and the independent check
(`independent-check-c7be9bb3.md`: HOLDS, no MUST, 11 probes, run on 2055067e). The final reviewer's brief is
`review-brief.md`. CI has not run on c7be9bb3 or the notes commit, which change no code; the land runs the locked suite
on the reviewed tip, and the local macOS install check runs before the land.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, which reads from the merge base):

```
tree movement 72abe19..c7be9bb: 5 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-2290 new (implemented)
  R-2291 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2292 new (implemented)
  R-2293 new (implemented)
  R-2294 new (implemented)
```

The code under review: `packages/nana-setup/lib/steps.mjs` `stepRetiredArtifacts`, whose three loops now lstat before
the ancestor guard and print nothing for an absent path, with the managed-skill skip above the source guard and the
context-size-check guard run whenever anything is there; its new export `linkedSkillFolder`, which
`bin/stale-copies.mjs` (the Claude Code adoption hook's stale line) now uses; and `lib/doctor.mjs` `diagnose`, whose ✗
skill rows under a linked Claude home or skills folder name that folder to move aside.

Judge whether the lane fails open: a present retired artifact under a linked ancestor that now gets no ✗ row, or is
moved or unlinked; a write, move or unlink that now runs before a guard; a doctor skill row that reads ✓ when it should
not, or names a folder other than the one the session-start line names; a check that passes with the change removed
(R-2291 and R-2294 pass on main by design as guards; the seat's pairs S7, S9 and G1 turn them red). Judge whether it
leaves a harm the review standard lists, such as data lost in the owner's linked folder, a broken install or hook, or a
test writing outside its temp home. Judge whether anything main does today stopped working: an unlinked home's retired
moves and doctor rows, the stale-copies line, install's writes of hooks, rules and settings through a linked home, and
both CI install-check legs.

Known gaps the seat records as residuals; judge whether each is a harm the standard lists or a known bug: a dangling
linked `.claude` makes install crash on an ENOENT mkdir, as on main, and doctor's last line still says to run install
for the other rows; under `--claude-home`, doctor's new row omits the flag, as the text it replaced did; when the
code-span helper refuses the folder, doctor and the stale line fall back differently; no check reads a ✓ skill row's
text in a linked home (pairs survivor D4); a home linked after an install with right skill links reads all good in
doctor while install exits 1, as on main; install's own ✗ skill rows name the Claude home even for a linked skills
folder; doctor's legacy-flag and scaffolder rows still say to run install; a regular file at the Claude home or skills
folder still gets "run install"; moving the folder aside leaves the owner's settings and memory in it; whether install
should write through a linked Claude folder at all is the owner's call. The pairs and the independent check ran on
macOS only, with win32 copies forced where noted, so CI is the only Linux and native Windows run.

Threat model: honest variation in our tools' output and the OS is in scope (a Claude home or skills folder that is a
link or a Windows junction, as a dotfiles layout makes, made before or after an install, with or without retired
artifacts inside, on macOS, Linux and Windows); deliberate forgery is out, such as a link swapped in between install's
checks or a forged artifact.
Lane class: install, hook or gate — nana-setup install's retired-artifact step, doctor's skill rows and last line, and
the stale-copies producer the Claude Code adoption hook runs at session start.

Check: (1) no fail-open; (2) no listed harm; (3) nothing main does today stopped working, on any of the three CI legs;
(4) HANDOFF and the session entry are true; (5) any MUST.

## Chain note (the seat, after this brief was written)

Since `c2ba4da8`, the seat merged `5ef07f7f`, the objective-path-shapes lane's reviewed tip. Lanes land in order; each land is a fast-forward of main, so `5ef07f7f` becomes main before this lane lands. Review this lane's own change as `git diff 5ef07f7f...HEAD` (three dots: against the merge base) and the merge itself as `git show --remerge-diff 7e141a86` (the merge commit) if your git supports it; the generated tree, code map and R-291 leaf total were regenerated by the seat's merge helper. Tree movement now (`node scripts/requirements-moved.mjs --root . --base 5ef07f7f`):

```
tree movement 5ef07f7..7e141a8: 5 rows in 2 features
FEAT-013 · Install and connect harness runtimes
  R-2290 new (implemented)
  R-2291 new (implemented)
FEAT-015 · Diagnose the active environment
  R-2292 new (implemented)
  R-2293 new (implemented)
  R-2294 new (implemented)
```
