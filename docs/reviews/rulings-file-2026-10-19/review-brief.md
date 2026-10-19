# Review — rulings-file (every new session starts with nana's standing rulings), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-001 · Keep goals and priorities in view

Review `git diff b8ace0b..HEAD` on `feat/rulings-file` (the lane last merged main at `b8ace0b`, in `9c993df`; `git
merge-base HEAD main` is `b8ace0b`, and main has since moved on). The plan of record is
`docs/reviews/rulings-file-2026-10-19/must-meet.md`: R-1410 to R-1418 and the seal on RULINGS_READ_CAP, with the
adversary's amendments inside; `plan-attack.md` holds its reasons. `build-brief-1.md` and `build-brief-2.md` are the two
builds. The seat's record is `seat-verify-6d6a82a.md`: CI run 2 (the Windows log beside it), the wrong-code pairs
(`seat-mutate.mjs`, outputs for 743c568 and 9c993df beside it) and the independent check
(`independent-check-6d6a82a.md`, run on 743c568; its MUST was fixed in build 2).

Tree movement (the lane's own report, `node scripts/requirements-moved.mjs --root . --base b8ace0b`):

```
tree movement b8ace0b..6d6a82a: 9 rows in 1 features
FEAT-001 · Keep goals and priorities in view
  R-1410 new (implemented)
  R-1411 new (implemented)
  R-1412 new (implemented)
  R-1413 new (implemented)
  R-1414 new (implemented)
  R-1415 new (implemented)
  R-1416 new (implemented)
  R-1417 new (implemented)
  R-1418 new (implemented)
```

The code under review: `packages/nana-pack/extensions/nana-rulings.ts`, `lib/rulings-config.mjs` and
`rules/nana-rulings.md` (new); `packages/nana-setup/lib/steps.mjs`, `paths.mjs`, `doctor.mjs` and `state-manifest.mjs`;
the shared runtime table (`templates/_shared/working-under-nana-pi.md`, mirrored in `AGENTS.md`). Tests:
`packages/nana-pack/tests/rulings.test.mjs` and `packages/nana-setup/tests/rulings-install.test.mjs` (new); edited
state-manifest, uninstall, restore, requirements-tree, templates-render and `skill-claims.mjs` (one exemption).

Judge whether, after `nana-setup install`, every new Claude Code or pi session (seat, builder or reviewer) gets the
rulings from the one file; whether a pi session whose installed copy is unusable gets the one-line marker and never a
throw, a hang or partial text; whether install, doctor, the state manifest and uninstall treat the two new files like the
existing rule links; and whether anything main does today stopped working.

Threat model: honest variation in our tools' output and the OS is in scope (POSIX links versus Windows copies,
`PI_CODING_AGENT_DIR` elsewhere, a pull with no install re-run, a stale or hand-edited copy, every `session_start`
reason, ordinary growth of the file); deliberate forgery is out (a hostile rulings file is the owner's own text).
Lane class: install + hook (nana-setup install, doctor and state manifest; a new pi extension; the Claude rules link).

Check: (1) R-1410 to R-1418 and the seal are not vacuous: each fails with its feature removed; (2) the extension never
throws, hangs or injects partial text on an unusable copy, and re-reads on every reason; (3) install and uninstall never
lose an owner's own file, and doctor marks a POSIX copy or a stale Windows copy ✗; (4) the three Windows SKIPs in
rulings-install and the `skill-claims.mjs` exemption hide no check that could run; (5) the rulings file names no owner,
no work project and no model, and its scope sentence stands between heading and first bullet; (6) nothing main does today
stopped working, including the other rule links and the objective and writing sections; (7) HANDOFF and the session entry
are true; (8) any MUST.
