# Review — win-skill-occupied (Windows install refuses a requirements skill folder it did not make), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-013 · Install and connect harness runtimes

Review `git diff b8ace0b..HEAD` on `feat/win-skill-occupied` (main was `0f2e0ca` when this brief was written; `git
merge-base HEAD main` is `b8ace0b`, merged at fc674a4). The lane's own commits: `git log --oneline --first-parent
b3f6ec2..HEAD`. The plan of record is `docs/reviews/win-skill-occupied-2026-10-19/must-meet.md` (R-1420 to R-1426);
`plan-attack.md` holds the adversary's amendments, `build-brief-1.md` the build and `build-brief-3.md` the history
recompute after the main merge. The seat's record is `seat-verify-6974bce.md`: CI on all three legs (the Windows log
beside it), the wrong-code pairs (`seat-mutate.mjs`, output beside it, 10 of 12 red, M5 and M8 declared) and the
independent check (`independent-check-6974bce.md`, HOLDS, run on 04c14e8).

Tree movement (the lane's own report, `node scripts/requirements-moved.mjs --root . --base b8ace0b`):

```
tree movement b8ace0b..6974bce: 7 rows in 1 features
FEAT-013 · Install and connect harness runtimes
  R-1420 new (implemented)
  R-1421 new (implemented)
  R-1422 new (implemented)
  R-1423 new (implemented)
  R-1424 new (implemented)
  R-1425 new (implemented)
  R-1426 new (implemented)
```

The code under review: `ownSkillCopy`, `SKILL_COPY_MARKER` and the win32 branch of `linkSkill` in
`packages/nana-setup/lib/steps.mjs`, the win32 branch of `skillLinkState` in `lib/doctor.mjs`, and the frozen list
`lib/skill-copy-history.json`. Judge whether, on Windows, install and `--dry-run` refuse a folder nana-setup did not make
before any write and leave it byte-identical, whether doctor marks it ✗ with the move fix, and whether every copy
nana-setup made (marked, byte-equal to the pack, or an older shipped SKILL.md in LF or CRLF) keeps refreshing.

Threat model: honest variation in our tools' output and the OS is in scope — copies from today's or an older nana-setup,
LF or CRLF, `.bak-` files, files an owner added, an owner's own skill folder; deliberate forgery (a planted marker, a
byte-copied SKILL.md in a foreign folder) is out. Lane class: install (nana-setup install and doctor).

Check: (1) R-1420 to R-1426 and their tests are not vacuous, and each red-today check fails on main's code; (2) no write
reaches a folder nana-setup did not make, dry run included; (3) a copy nana-setup made never gets refused, and the
history list covers every shipped SKILL.md; (4) nothing main does today stopped working on macOS or Windows; (5) HANDOFF
and the session entry are true; (6) any MUST.
