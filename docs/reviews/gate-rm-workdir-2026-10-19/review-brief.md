# Review — gate-rm-workdir (in pi, a plain recursive or forced rm inside the working folder runs without asking), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-010 · Guard risky commands and protected resources

Review `git diff ca27d86..HEAD` on `feat/gate-rm-workdir` (main was `ca27d86` when the lane merged it and is `ab5c3e8`
now, after bench-win landed; `git merge-base HEAD main` is `ca27d86`). The plan of record is
`docs/reviews/gate-rm-workdir-2026-10-19/must-meet.md`: seven must-meet checks, rows R-1490 to R-1496, all in
`packages/nana-pack/tests/gate-rm-inside.test.mjs`. `plan-attack.md` holds the adversary's AMEND (the two-way agent-folder
overlap on `realPath` spellings); `build-brief-1.md` and `build-brief-2.md` the two builds. The seat's record is
`seat-verify-c636e46.md`: the wrong-code pairs (`seat-mutate.mjs`, outputs beside it), CI run 39273742604 (the Windows
and macOS logs beside it) and the independent check (`independent-check-d6f0613.md`, on build 1, HOLDS).

The code under review: `packages/nana-pack/lib/gate-rm-inside.ts` (new) and four lines in
`packages/nana-pack/extensions/nana-gate.ts` (the import, the `tool` parameter of `commandHit`, the one exemption line
after the floor loop, `event.toolName` at the caller). `lib/gate-shell.ts`, `lib/gate-paths.ts` and `lib/real-path.mjs`
are unchanged. Also the pack README's new gate bullet, three retargeted test files (gate-corpus, gate-survives-mutation,
display-surfaces), the R-291 leaf total in `requirements-tree.test.mjs` (raised by 7) and the regenerated tree and map.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`, run at `c636e46`; the seat's notes change no row):

```
tree movement ca27d86..c636e46: 7 rows in 1 features
FEAT-010 · Guard risky commands and protected resources
  R-1490 new (implemented)
  R-1491 new (implemented)
  R-1492 new (implemented)
  R-1493 new (implemented)
  R-1494 new (implemented)
  R-1495 new (implemented)
  R-1496 new (implemented)
```

Judge whether a plain recursive or forced rm of literal relative targets inside the working folder now runs unasked in
pi's bash tool, and whether every other form keeps main's verdict: an absolute or outside target, the folder itself, a
dot-named part, a link or junction, a folder directly holding `.git`, any overlap with the active pi agent folder, a
home, home-ancestor, root or dot-named working folder, any extra shell text, and the powershell tool. Judge whether the
exemption can clear anything but the one "rm recursive/forced" danger: the floor, a named policy file, `extraPatterns`
and `protectedPaths` must still stop it. The retargets change `x` and `build` to `../x` and `../build`; judge that no
assertion was dropped.

Threat model: honest variation in commands, paths, letter case, links and junctions, config and the OS (macOS, Linux,
Windows, Git Bash) is in scope; deliberate forgery and a race with another process are out. Lane class: gate (a pi
extension, the nana-gate policy).

Check: (1) each must-meet check is not vacuous and fails on main's gate where the plan says it does; (2) no fail-open:
no form the plan keeps asking now runs unasked, beyond the known limits the README and HANDOFF name; (3) the exemption
never clears the floor, a policy file, an extra or a protected match; (4) nothing main does today stopped working on
macOS, Linux or Windows; (5) no test writes outside the temp folders it owns; (6) HANDOFF and the session entry are
true; (7) any MUST.
