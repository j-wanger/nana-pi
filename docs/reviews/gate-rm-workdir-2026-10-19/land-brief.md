# Review — gate-rm-workdir (in pi, a plain recursive or forced rm inside the working folder runs without asking), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff ca27d86..HEAD` on `feat/gate-rm-workdir` (main was `ca27d86` when the lane merged it and is `ab5c3e8`
now, after bench-win landed; `git merge-base HEAD main` is `ca27d86`). The plan of record is
`docs/reviews/gate-rm-workdir-2026-10-19/must-meet.md`: seven must-meet checks, rows R-1490 to R-1496, all in
`packages/nana-pack/tests/gate-rm-inside.test.mjs`. `plan-attack.md` holds the adversary's AMEND; `build-brief-1.md`
and `build-brief-2.md` the two builds. The seat's record is `seat-verify-c636e46.md`: the wrong-code pairs
(`seat-mutate.mjs`; 32 of 34 red on build 1, 34 of 34 on build 2, outputs beside it), CI run 39273742604 (Windows and
macOS logs beside it) and the independent check (`independent-check-d6f0613.md`, on build 1, HOLDS, its three known
bugs settled in the record). Tree movement: 7 new rows in FEAT-010, R-1490 to R-1496, each `implemented`.

The code under review: `packages/nana-pack/lib/gate-rm-inside.ts` (new) and four lines in
`packages/nana-pack/extensions/nana-gate.ts`, the one exemption line after the floor loop among them. Judge whether
the gate now fails open: whether any rm form main asked for now runs unasked beyond the known limits the pack README
and HANDOFF name, whether the exemption can ever clear the floor, a named policy file, an `extraPatterns` or a
`protectedPaths` match, and whether an error inside the new module can turn into an allow. Judge whether the lane
leaves a harm the review standard lists, such as data lost outside the working folder or a test writing outside the
temp folders it owns. Judge whether anything main does today stopped working on macOS, Linux or Windows: the
retargeted gate-corpus, gate-survives-mutation and display-surfaces checks must keep their titles, counts and meaning.

Threat model: honest variation in commands, paths, letter case, links and junctions, config and the OS (macOS, Linux,
Windows, Git Bash) is in scope; deliberate forgery and a race with another process are out. Lane class: gate (a pi
extension, the nana-gate policy).

Check: (1) each must-meet check runs the cases it names and fails on main's gate where the plan says it does; (2) no
fail-open; (3) no harm the review standard lists; (4) no regression on macOS, Linux or Windows; (5) HANDOFF and the
session entry are true; (6) any MUST.
