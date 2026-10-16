# Plan review — share support in the lift, 2026-10-15 (gpt-5.6-sol; gate lane: up to two rounds)

Review the change declaration `docs/reviews/regroup-shares-2026-10-15/CHANGE.md` on `feat/regroup-shares` (based on main
`e451c90`, the lift landed). Nothing is built yet. Read its "Seat revision (2026-10-15)" section: it folds in two
fact-checks (`factcheck-repo.md`, `factcheck-proof.md`).

Jake's ruling, 2026-10-10, approving nana-pi's tree: "we should allow multiple features pointing to the same
requirements". The lift today refuses every `Also applies:` line; this lane lets it carry, add and drop shares under
proof. The regroup lane (`feat/regroup`, plan frozen at `1066464`) consumes it; whichever lane lands second adds the two
new grouping keys to the regroup checker's key list.

Threat model: honest variation in our tools' output and our users' files in scope (share lines in field blocks, fenced
blocks, head and tail, CRLF, ranges, a share to a moved row, merged features sharing the same row); deliberate forgery
out. Lane class: gate (it changes what the lift may write into another project's contract file). The review standard
pi-review appends governs the bar and the verdict line.

Check: (1) a share can never be lost, duplicated, retargeted or invented with `--write` or `--verify` exiting 0; (2) one
reader decides what a share line is, and every other `Also applies:` line is refused as R-1167 says; (3) every guarantee
the lift already pins still holds; (4) rows R-1181–R-1183 and the R-1167 rewording are each pinned by named tests and the
wrong-code-first pairs red what they name; (5) the cross-lane key handoff is unambiguous; (6) any MUST under the standard.
