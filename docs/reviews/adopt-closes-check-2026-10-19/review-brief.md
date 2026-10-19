# Review — adopt-closes-check (each adopt skill ends on the project check), 2026-10-19 (Opus, the lane's one final reviewer)

Feature: FEAT-014 · Create or adopt a project workspace (the row is homed in SUB-021 · Check readiness and ratify the
objective)

Review `git diff 713d6aa..HEAD` on `feat/adopt-closes-check` (main was `713d6aa` when this brief was written; `git
merge-base HEAD main` is `713d6aa`). The plan of record is `docs/reviews/adopt-closes-check-2026-10-19/must-meet.md`:
one row, R-1670, from the lane's block R-1670 to R-1679 (R-1671 to R-1679 unused). `plan-attack.md` holds the
adversary's AMEND, which split the tree checker's unsorted-heading line out to its own FEAT-028 lane; `build-brief-1.md`
is the one build, and e4c1ba2 merges main 713d6aa. The seat's record `seat-verify-e4c1ba2.md` holds CI run
39297417557 (0 failing files on macOS, Ubuntu and Windows), the Windows log beside it.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`): one row added, R-1670 new (implemented)
under FEAT-014; no row changed or moved (CAP-04 321 to 322 rows, FEAT-014 87 to 88, SUB-021 6 to 7, leaf total 1,298
to 1,299).

The change under review: step 10 of `packages/nana-pack/skills/adopt-py/SKILL.md` and `adopt-ts/SKILL.md`, step 8 of
`adopt-structure/SKILL.md`, the pack README's two adopt rows, and the R-1670 check with its `lastStep` helper in
`packages/nana-setup/tests/entry-guidance.test.mjs`. Judge whether each skill's last numbered step runs `nana-setup
project <dir> --check` or its `node` form, calls the adoption ready only on exit 0, reports every ✗ and ! line with the
repair the check names, and runs a repair only with the owner's yes. Judge whether adopt-py and adopt-ts close after
their commit step, and whether adopt-structure keeps its old report list word for word. Judge whether the step's claims
are true of the real check: it writes nothing, a fresh adoption reads ✗ for the month log and ! for trust, and the
repairs it names are the ones the check prints. The project check itself does not change.

Threat model: honest variation in our tools' output and the OS in scope: Python, TypeScript and structure-only
adoptions, fresh and re-run adoptions, CRLF skill text, macOS, Linux and Windows shells, and Windows, where install
does not put `nana-setup` on PATH. Deliberate forgery out. The step is advisory skill text; the check pins its wording,
not an agent's behaviour (a plan known limit). Lane class: ordinary — three pack skills' text, a README table and one
test file; no install, hook, extension, gate, land or review tool.

Check: (1) the R-1670 check is not vacuous: it fails on main's skills and on each wrong-code shape the brief lists,
and its step finder reads the last numbered step of the Steps section, CRLF included; (2) the node form names a file
that exists, and the step text matches what the project check prints; (3) nothing else changed: the "First two steps"
lists, adopt-structure's report list and the project check are untouched, and the R-291 total, tree and code map match
a fresh run; (4) the test writes only inside temp folders it owns; (5) HANDOFF and the session entry are true; (6) any
MUST.
