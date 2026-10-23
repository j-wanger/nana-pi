# Review — ci-timing-records (each CI suite leg keeps its suite record; a command reads them back), 2026-10-23 (the final reviewer)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Class: ordinary (the CI workflow's suite steps and one upload step, a new pack lib behind a script, two shared helpers moved within suite-records, tests, docs and rows; nothing on the install, hook or gate list). Threat model: as `must-meet.md` states it — honest variation in our tools' output and GitHub's (failed, timed-out, cancelled, running or crashed legs; re-runs of failed or all jobs; two runs for one commit; expired or foreign artifacts; another workflow at the same commit; gh missing, signed out, rate-limited, offline or printing a JSON error body; a short sha, branch name or HEAD; Windows temp paths; an artifact with no JSON file or two; another schema; EBUSY cleanup). Deliberate forgery out (a hand-uploaded artifact, a forged record, a tampered gh).

Review `git diff df910cd3..HEAD` on `feat/ci-timing-records`. Main is df910cd3 (session-start-frontier). The lane branched from 3bbb0662 and merged main twice (68e90ab3 for build-records, bc562d58 for the frontier); both conflicts were the generated code map, which the seat regenerated with the tree outline. The lane's own commits:
- 15653335 — plan of record.
- 56def663 — build 1 (larger), the feature.
- 524b60bc, 39b4167b — seat finding F1 (R-2634 passed an empty branch name in a detached checkout, as the pair runner's and GitHub's are) and build 2 (small), which uses `HEAD`.
- 36fc3413, 8c72ab36 — seat finding F2 from a run of the command against this branch's CI: every download failed, because `gh run download` was given the artifact id where gh reads a run id, and the fake gh accepted it (`seat-demo-56def663.txt`). Build 3 (small) downloads by run id with `--repo`, and the fake refuses the old call.
- 50308bf0, 4e434217 — pairs 15 of 16 (p13 survived: R-2637 never checked that a copied leg in a re-run is not reported as "left no record") and seat finding F4 (the fake compared a literal repository slug). Build 4 (small) pinned both. It ended PARTIAL only because its brief left out the regenerated code map, so its suite failed map:check; the seat committed the builder's diff unchanged with the regenerated map.
- a838dd9c — pairs 16 of 16.
- the final commit — notes (13 FEAT-031 known-bug lines; HANDOFF lanes line, Windows count and the Landed line; the five 2026-10-22 Landed lines moved verbatim to the session archive; the session entry), the seat's demo outputs at 68e90ab3, and this brief.

The plan of record is `docs/reviews/ci-timing-records-2026-10-22/must-meet.md`; `plan-draft.md` and `plan-attack.md` are its inputs.

The seat's record:
- Wrong-code pairs (`seat-mutate.mjs`): 16 of 16 red at 4e434217 (`seat-mutate-output-4e434217.txt`); p16 is F2's wrong call.
- The seat's per-build diff check finds no removed line holding an escaped `\\n`, `\\r` or `\\t` (build 3 kept one such line, moved to a new key).
- The command against this lane's own CI run at 68e90ab3 printed three records, one per leg; after a re-run of only the Linux leg it printed four, both Linux attempts, and named no copied leg missing (`seat-demo-68e90ab3-first.txt`, `seat-demo-68e90ab3-linux-rerun.txt`).
- Draft PR CI at 68e90ab3: every leg green. CI runs again on the reviewed tip.
- Session titles: 0 missing. Build 3's locked full suite: `208 PASS, 0 FAIL, 2 SKIP`. After the last merge, map:check, req:tree, readme:check and the trace are green; ci-records, ci-workflow, frontier, frontier-summary, frontier-golden and handoff-artifact tests pass; `nana-writing HANDOFF.md` finds no long sentence; HANDOFF is 161 words over its 1,200 budget.

Tree movement (`node scripts/requirements-moved.mjs --root . --base main`):

```
tree movement df910cd..bc562d5: 8 rows in 1 features, 1 capability change(s)
FEAT-031 · Run checks reliably and without contaminating work
  R-616 Made by/Read by lines changed
  R-2631 new (implemented)
  R-2632 new (implemented)
  R-2633 new (implemented)
  R-2634 new (implemented)
  R-2635 new (implemented)
  R-2637 new (implemented)
  R-2638 new (implemented)
capabilities:
  CAP-07 · Keep code and promises checkable: Deliverables R-291, R-1460, R-1014, R-1272, R-616, R-1239, R-2547 → R-291, R-1460, R-1014, R-1272, R-616, R-1239, R-2547, R-2632
```

The seat lands only on green CI at the reviewed tip, the Windows leg included.
