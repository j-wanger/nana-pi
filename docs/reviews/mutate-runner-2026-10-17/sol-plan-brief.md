# Plan review — mutate-runner, 2026-10-17 (gpt-5.6-sol; small lane: one round)

Review `CHANGE.md` in this folder on `feat/mutate-runner` (main `61c5748`). The owner asked on 2026-10-16 that the seat
work in parallel by default after lanes ran slow, and ordered three lanes: the seat rule (landed), this shared split
mutation runner, then the runtime map. The seat's per-lane mutation runner ran one pair at a time (32 to 98 minutes a run);
the roster-notice lane's runner added a built-in five-way split (about 8 minutes for 70 pairs). This lane moves that
runner's plumbing into one shared module so each lane's runner becomes a pair table. The plan was cut down by
subtraction from a 40-row draft (`CHANGE-draft3.md`); the slim fact-check and critique are here.

Threat model: honest variation in our tools' output and users' files in scope (typed pair ids, hung tests, Windows
paths and process trees, dirty worktrees, two runs at once); deliberate forgery out. Lane class: small. The review
standard pi-review appends governs the bar and the verdict line.

Check: (1) the shared runner can never lose, double-count or misjudge a pair, or leave a stray worktree, for honest input
on macOS and Windows; (2) each row has one "shall" and a pinning check; (3) old lane records stay valid; (4) the slim
cut keeps everything this first lane needs and nothing more; (5) any MUST.
