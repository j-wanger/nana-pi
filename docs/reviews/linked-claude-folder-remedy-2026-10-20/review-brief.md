# Review — linked-claude-folder-remedy (install prints no retired row for an absent file under a linked Claude folder, and doctor's ✗ skill rows name that folder to move aside), 2026-10-20 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment (R-2290 and R-2291 sit under FEAT-013 SUB-014)

Review `git diff 72abe19a..HEAD` on `feat/linked-claude-folder-remedy` (main was `72abe19a` when this brief was
written; `git merge-base HEAD main` is `72abe19a`). The plan of record is
`docs/reviews/linked-claude-folder-remedy-2026-10-20/must-meet.md`: five must-meet checks, rows R-2290 to R-2294.
`plan-attack.md` holds the adversary's AMEND (seven amendments); `build-brief-1.md` is the one build (2055067e). The
seat's record is `seat-verify-c7be9bb3.md`: CI run 39441711620 on draft pull request #136 at 2055067e, 0 failing files
on macOS, Ubuntu and Windows (`ci-windows-2055067e.log` beside it; linked-claude-folder passes 5 of 5 on native
Windows), the wrong-code pairs (`seat-mutate.mjs`; 18 of 19 red on 2055067e, survivor D4 a declared test gap, record
`seat-mutate-output-2055067e.txt`) and the independent check (`independent-check-c7be9bb3.md`: HOLDS, no MUST, 11
probes, run on 2055067e). CI has not run on c7be9bb3 or the notes commit, which change only files under `docs/reviews/`,
HANDOFF and the session entry; the land runs the locked suite on the reviewed tip, and the local macOS install check
runs before the land.

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

CAP-04 moves from 497 to 502 rows, FEAT-013 from 188 to 190, SUB-014 from 41 to 43 and FEAT-015 from 136 to 139. No
existing row changed.

The code under review: `packages/nana-setup/lib/steps.mjs` `stepRetiredArtifacts` (all three loops lstat first and
print nothing for an absent path; the whole managed-skill skip, a link or a copy-marked folder at spec, py-lint,
py-review or py-test, runs above the source guard; the context-size-check guard and its ✗ row run whenever lstat finds
anything there) and its new export `linkedSkillFolder`; `bin/stale-copies.mjs`, which uses it in place of its local
`linkedSkillParent`; and `lib/doctor.mjs` `diagnose`, whose ✗ skill rows under a linked folder read `install will not
add skills under the linked folder <code span> — move it aside, then run \`nana-setup install\``. `bin/nana-setup.mjs`
does not change. Tests: the new `packages/nana-setup/tests/linked-claude-folder.test.mjs` (R-2290 to R-2294). The setup
README's retired-artifacts row, session-start paragraph and test table change with it. The rest of the diff is the
plan, the seat's records, the generated code map and tree, HANDOFF and the session entry.

Judge whether install, through a linked Claude home or skills folder, prints no retired row for an absent path or for
its own skill links and win32 copies, while each present retired artifact is reported ✗ and left byte-for-byte
untouched; whether any write, move or unlink now comes before a guard (the seat's ruling lets an existence lstat, and
the copy-marker lstat inside the artifact, run first); whether an unlinked home's retired rows and moves are unchanged;
whether doctor's ✗ skill rows name exactly the folder the session-start line names, moving it aside and installing
turns every skill row ✓, and doctor's last line lists the rows by hand; whether ✓ rows and every row in an unlinked
home keep their text; whether the stale-copies output is unchanged; and whether the tests' child processes stay inside
the temp homes they own and clean up after themselves.

Threat model: honest variation in our tools' output and the OS is in scope (a Claude home or skills folder that is a
link or a Windows junction, as a dotfiles layout makes, made before or after an install, with or without retired
artifacts inside, on macOS, Linux and Windows); deliberate forgery is out, such as a link swapped in between install's
checks or a forged artifact.
Lane class: install, hook or gate — nana-setup install's retired-artifact step, doctor's skill rows and last line, and
the stale-copies producer the Claude Code adoption hook runs at session start.

Check: (1) the must-meet checks are not vacuous: R-2290, R-2292 and R-2293 fail on main, R-2291 and R-2294 are guards
that the pairs turn red (S7, S9, G1), and every pair but D4 turns its named check red; (2) no write, move or unlink
through a linked ancestor in the retired-artifact or skill steps, and no fail-open: each present retired artifact under
an unsafe ancestor still gets its ✗ row; (3) nothing main does today stopped working: an unlinked home's install and
doctor output, the stale-copies line, and install's writes of hooks, rules and settings through a linked home, on all
three CI legs; (4) the tests write only inside the temp homes they own; (5) HANDOFF and the session entry are true,
including the dropped doctor-fix-line line, the two stale-copies-hooks lines that gain doctor's half and the eight new
residuals; (6) any MUST.
