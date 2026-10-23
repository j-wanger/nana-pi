# Review — session-start-frontier, confirmation round 2, 2026-10-22 (the final reviewer)

Feature: FEAT-002 · Resume decisions and next actions

Class: hook. Threat model as round 1 (`review-brief.md`): honest variation in HANDOFF files and session folders, launcher children and a long objective; deliberate forgery out.

This is a confirmation round. Review only the change since round 1's revision, 8d87c948, which both reviewers accepted with LAND (`r1-opus-78cf7bdf.md`, `r1-land-e975795a.md`). No product code changed in this lane since then. The lane's own commits:
- 5b219268 — CI finding F2 and `build-brief-2.md`. Draft PR CI at 8d87c948 failed R-2611 on the Windows suite leg, its only failure there: the check expected the HANDOFF path built from `os.tmpdir()`, the 8.3 short form `C:\Users\RUNNER~1\…`, while the producer prints the real path through `canonicalCwd` (`fs.realpathSync.native`). macOS passed by chance, as `/var/…` is a substring of `/private/var/…`.
- c03059b9 — build 2: R-2611's expected path is built from `fs.realpathSync.native(root)`. Test only.
- 35d6dbb3 — round 1's texts kept, and round 1's two notes added to `docs/known-bugs/FEAT-002.md`.
- 0767073c — a merge of current main, ca4018ed: project-drift-notice landed. Its stale-copy producer runs under the adoption hook, beside this lane's frontier producer under the objective hook. Conflicts were HANDOFF's Landed lines (both kept, main's first) and the session archive (both kept). The seat regenerated the code map and tree outline and updated HANDOFF's lanes line and Windows first-try count. The rest of the merge diff is the landed lane, already reviewed there; review only its interaction with this lane, above all the two SessionStart hooks' combined output.
- the final commit adds the seat's pairs and install check at the merge and this round's two briefs.

The seat's record at 0767073c: the seat's wrong-code pairs, all 18 red, each by exactly its named title (`seat-mutate-output-0767073c.txt`). The macOS install check passes every item, both hooks included (`install-check-0767073c.txt`). frontier-summary, frontier-golden, frontier, frontier-hook, hook-deadlines, hooks-closed-output and project-stale tests pass. map:check, readme:check and the trace are green. Build 2's locked full suite: `209 PASS, 0 FAIL, 2 SKIP`. No removed escape lines in build 2.

CI runs on the draft PR at the reviewed tip, the Windows leg included. The seat lands only on green.
