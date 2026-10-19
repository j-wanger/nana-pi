# Review — rulings-file (every new session starts with nana's standing rulings), 2026-10-19 (Fable, the land reviewer)

Feature: FEAT-001 · Keep goals and priorities in view

Review `git diff b8ace0b..HEAD` on `feat/rulings-file` (the lane last merged main at `b8ace0b`, in `9c993df`; `git
merge-base HEAD main` is `b8ace0b`, and main has since moved on). The plan of record is
`docs/reviews/rulings-file-2026-10-19/must-meet.md`: R-1410 to R-1418 and the seal on RULINGS_READ_CAP, with the
adversary's amendments inside; `plan-attack.md` holds its reasons, and `build-brief-1.md` and `build-brief-2.md` the two
builds. The seat's record is `seat-verify-6d6a82a.md`: CI run 2 (`ci-windows-run-2.log` beside it), the wrong-code
pairs (`seat-mutate.mjs`, 29 of 29 red on 9c993df) and the independent check (`independent-check-6d6a82a.md`, run on
743c568; its MUST, a red runtime-table check, was fixed in build 2). The final reviewer's brief is `review-brief.md`.

The code under review: `packages/nana-pack/extensions/nana-rulings.ts`, `lib/rulings-config.mjs` and
`rules/nana-rulings.md` (new), and the install, doctor, path and state-manifest steps in `packages/nana-setup/lib/`.
Judge whether the lane fails open: a pi session that silently injects nothing, stale text or part of a file where the
marker belongs; doctor reading ✓ for a wrong shape; install writing through a link into the checkout or replacing an
owner's file without a backup; uninstall removing a file nana did not place. Judge whether the lane leaves a harm the
review standard lists, and whether anything main does today stopped working: install, doctor and uninstall on macOS,
the four existing Claude rule links, the objective and writing prompt sections, and the install check.

Threat model: honest variation in our tools' output and the OS is in scope; deliberate forgery is out (a hostile rulings
file is the owner's own text). Lane class: install + hook (nana-setup install, doctor and state manifest; a new pi
extension; the Claude rules link).

Check: (1) each must-meet test fails with its feature removed; (2) no fail-open; (3) no loss of an owner's file and no
macOS regression in install, doctor or uninstall; (4) HANDOFF and the session entry are true; (5) any MUST.
