# Review — mutate-runner (one shared mutation runner), 2026-10-17 (gpt-5.6-sol, the lane's one final reviewer)

Review `git diff 61c5748..HEAD` on `feat/mutate-runner` (main is `61c5748`). The lane promotes the seat's split mutation
runner, until now copied into each lane's review folder, into one module a lane's pair table imports
(`packages/nana-pack/lib/mutation-runner.mjs`, its config in `mutation-runner-config.mjs`), with rows R-1230 to R-1244,
26 checks in `packages/nana-pack/tests/mutation-runner.test.mjs` and a pack README section. It is a seat tool: no
suite, land, install or hook path imports it.

**The bar for this round (the owner's 2026-10-17 feature-first ruling).** Send back only for (a) a bug that stops the
feature working for its user — a seat running a lane's pair table to learn which wrong-code pairs its tests catch, and
acting on the verdicts — or (b) a harm-list item: data lost, a write outside the scratch worktrees, the temp folder or
the record file, a broken install or hook, or a regression of what main does today. Every other finding is a SHOULD or
NOTE that the seat records as a known bug; do not send back for edge cases, wording, or tests that miss a clause. This
narrows the appended review standard; its verdict line still governs. Threat model: honest variation in our tools'
output in scope; deliberate forgery out. Lane class: ordinary (one final reviewer).

Records in `docs/reviews/mutate-runner-2026-10-17/`: the plan `CHANGE.md` (one sol plan round, answered in seat
revision 5), the build brief, the title check, the equivalence port (`seat-mutate-port.mjs`, the landed roster-notice
lane's 71 pairs through the shared runner: the builder's records at one and five shards, and the seat's run again at
five, each with the same verdict on every pair as `docs/reviews/roster-notice-2026-10-16/seat-mutate-output-f5c2d3c.txt`),
and the seat's check record `seat-verify-d594894.md`. The seat's own 43-pair table is committed and applies cleanly, but
the owner's ruling skipped its run; do not run it. Also `HANDOFF.md` and the session entry.

Check: (1) a pair table that imports the runner gets correct RED / GREEN (SURVIVED) verdicts, at one shard and at five;
(2) no honest run writes into the lane's checkout, the main checkout or the home folder, or leaves a running process or
worktree behind after it ends normally or by Ctrl-C; (3) HANDOFF and the session entry are true; (4) any send-back item
under the bar above.
