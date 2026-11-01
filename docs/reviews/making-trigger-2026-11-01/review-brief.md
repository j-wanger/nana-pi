Feature: FEAT-040 · Make and keep memory

Lane making-trigger. Class: gate (`nana-land` is a land tool; it now starts a making run after a merge). Threat model: honest variation in our tools' output and the machines is in scope (failed, malformed or unknown-usage model calls; runs killed at shutdown; concurrent runs; two machines syncing the private store; interrupted git steps; Windows spawning and paths; CI); deliberate forgery, such as planted transcripts or a tampered store, is out.

Review `git diff origin/main...HEAD` on `feat/making-trigger`. Main is b10761b1. The plan of record is `docs/reviews/making-trigger-2026-11-01/plan.md` (revision 2, after `plan-attack.md`; the owner took both defaults). Build briefs 1 to 4 and the build reports record the builds. The seat ruled after build 1 that a land run makes its own lane and the earlier lands it remembers, and that the broad sweep runs only for commands without a lane. The 2026-11-01 entry "memory is made automatically at every land" in `docs/sessions/2026-10.md` summarises the lane.

The change: `nana-memory make`, `enable` and `status`; the per-unit watermark and sweep; caps that charge unknown usage; a sealed start instant; the project store in the private profile clone keyed by root commit; one merge step for seat saves and extracted records; the private evidence copy; and the land starter. SUB-024 under FEAT-040; R-3290 to R-3309 and R-3340 to R-3342; A-093.

The seat's record:
- Locked full suite at a998b0be: 251 files, 249 pass, 2 skip. CI run 41292106405 passed on all three systems and all four install legs.
- Ten wrong-code pairs: 10 red, 0 survived. The macOS install check from the seat's shell: exit 0.
- Independent check at 78968f59 found one MUST (a torn store file blocked seat saves and made every later run spend, then report busy); build 4 fixed it; the recheck at a998b0be passed (`independent-check-a998b0be.md`).
- Known bugs: sixteen new lines in `docs/known-bugs/FEAT-040.md`, seven carried from earlier memory reviews.

Question: does the feature work for its users, the seat and every land, and does the change cause a harm the review standard lists? Check especially that the starter can never change a land's verdict, exit code or earlier output; that no test or CI run starts a real run or spends; that no unit is marked done without a record or re-sent once done; that seat saves keep working beside a run; and that owner text never reaches output, the checkout or a non-Claude model.

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, and do not bold it.
