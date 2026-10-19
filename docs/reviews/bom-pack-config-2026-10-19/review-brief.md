# Review — bom-pack-config (doctor, install, project setup and the adoption steps read a nana-pack.json saved with a byte-order mark), 2026-10-19 (Opus, the final reviewer)

Feature: FEAT-015 · Diagnose the active environment

Review `git diff 713d6aa..HEAD` on `feat/bom-pack-config` (main was `713d6aa` when the lane last merged it, and
`git merge-base HEAD main` is `713d6aa`). Main has since moved to `a1d07f6` (the audit-open-questions land), so the land
needs another merge of main and a confirmation round on the merged tip. The plan of record is
`docs/reviews/bom-pack-config-2026-10-19/must-meet.md`: rows R-1580 to R-1586. `plan-attack.md` holds the adversary's
AMEND. Two builds: `build-brief-1.md` (the change; it stalled under pi-worker's watchdog before it committed) and
`build-brief-1b.md` (finish build 1: 48314e9). The seat merged main 713d6aa as 208ffcd. The seat's record is
`seat-verify-208ffcd.md`: CI run 39298704191 on 208ffcd, 0 failing files on all three legs (the Windows log
`ci-windows-run-1.log` beside it), the wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-208ffcd.txt`, 8 of 8
red) and the independent check (`independent-check-208ffcd.md`, HOLDS, ten probes). The local macOS install check runs
before the land.

Tree movement: seven rows added under FEAT-015, R-1580 to R-1586, all `implemented` (CAP-04 321 to 328 rows, FEAT-015
53 to 60, leaf total 1,298 to 1,305). No existing row changed. `requirements-moved.mjs --root . --base main`:

```
tree movement 713d6aa..14e04fe: 7 rows in 1 features
FEAT-015 · Diagnose the active environment
  R-1580 new (implemented)
  R-1581 new (implemented)
  R-1582 new (implemented)
  R-1583 new (implemented)
  R-1584 new (implemented)
  R-1585 new (implemented)
  R-1586 new (implemented)
```

The code under review: the new `packages/nana-pack/lib/json-text.mjs` (`parseJsonText`), its use in `readPiPackConfig`
(`packages/nana-setup/lib/steps.mjs`), `adoptionSettings` (`packages/nana-pack/lib/adoption.mjs`) and `checkProject`'s
parse of `.pi/nana-pack.json` (`packages/nana-setup/lib/project.mjs`), and the seven checks in doctor-detail, install,
project, adoption-reader and adoption-producer. Judge whether each reader now reads a file with one leading mark exactly
as the same file without it, whether text still invalid once one mark is removed stays unparseable, and whether an
unmarked, missing or malformed file reads as on main.

Threat model: honest variation in our tools' output and the OS (a byte-order mark an editor or shell writes, LF or CRLF,
`PI_CODING_AGENT_DIR` set elsewhere, malformed text) in scope; deliberate forgery out. Lane class: install and hook
(doctor, install and project in nana-setup; `lib/adoption.mjs` behind the Claude Code `nana-adoption` hook and pi's
`nana-handoff` producer).

Check: (1) each must-meet check fails on main's readers and runs the bytes it names, its unmarked control included;
(2) a file still invalid after one mark is removed stays unparseable, and nothing writes the config back; (3) nothing
main does today stopped working on macOS, Linux or Windows; (4) the tests write only inside temp fixtures they own and
clean up; (5) HANDOFF and the session entry are true, including the removed Roster sentence and the five new residuals;
(6) any MUST.
