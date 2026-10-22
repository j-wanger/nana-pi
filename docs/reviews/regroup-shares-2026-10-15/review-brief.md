# Review — share support in the lift, 2026-10-16 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff e451c90..HEAD` on `feat/regroup-shares` (main `e451c90`, the lift landed). The owner's ruling, 2026-10-10:
"we should allow multiple features pointing to the same requirements". The lift today refuses every `Also applies:`
line; this lane lets it carry, add and drop shares under proof, for the regroup lane (on its own branch) and any owner's
grouping. Threat model: honest variation in our tools' output and our users' files in scope (share lines in field
blocks, fenced, head and tail, CRLF, ranges, a share to a moved row, merged features sharing a row, a declared drop
hiding an undeclared one); deliberate forgery out. Lane class: gate. The review standard pi-review appends governs the
bar and the verdict line.

Records in `docs/reviews/regroup-shares-2026-10-15/`: the plan `CHANGE.md` (draft, two fact-checks, seat revision; sol
plan r1 LAND; a seat amendment rewording R-1181 to one "shall", meaning unchanged), two build briefs for Claude Sonnet 5,
the seat's checks of build 1 (`seat-verify-28d53c7.md`: no share lost, duplicated, retargeted or invented with exit 0 in
34 hand probes and fuzzing; five test-weakness survivors that build 2 closed), the seat's acceptance (read
`acceptance-output.txt`), the title check (0 missing), and the seat's mutation runner at `f6bb0bd` (36 of 36 caught;
`seat-mutate-output.txt`; do not run it). CI on draft PR #12 at `f6bb0bd`: green on the blocking jobs. The cross-lane
step that adds two keys to the regroup checker belongs to whichever of this lane and the regroup lane lands second; the
regroup lane is not on main, so this lane leaves it. Also `HANDOFF.md` (which also closes the owner's Windows check, passed
2026-10-16) and the session entry.

Check: (1) a share can never be lost, duplicated, retargeted or invented with `--write` or `--verify` exiting 0; (2) one
reader decides what a share line is, and every other `Also applies:` line is refused as R-1167 says; (3) every guarantee
the lift already pinned still holds; (4) R-1181–R-1183 and the R-1167 rewording are each pinned by their cited tests; (5)
HANDOFF and the session entry are true; (6) any MUST under the standard.
