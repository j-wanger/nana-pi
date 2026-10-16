# Review — the regroup check, 2026-10-16 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff 2dbc817..HEAD` on `feat/regroup` (main `2dbc817` is merged in: share support landed first). The owner's
2026-10-14 ruling made turning an existing repo into a feature tree a core nana feature; this lane adds the check that
stands between an agent's regroup proposal and the owner's yes: `scripts/requirements-regroup.mjs`, its page, and a
line-keyed move report in the lift. Threat model: honest variation in our tools' output and users' files in scope (wrong
JSON shapes, typos, odd but legal paths, CRLF and BOM, case-insensitive file systems, links, real ledgers' quirks, an
agent declaring shares the way the lift requires, merges and demotions of features that share rows); deliberate forgery
out. Lane class: format. The review standard pi-review appends governs the bar and the verdict line.

Records in `docs/reviews/regroup-2026-10-15/`: the plan `CHANGE.md` with three seat amendments at its end (a trace-rail
helper exported unchanged; shares in the review record, R-1187; a share a merge moves is reviewed too) and the seat's
recorded answer to sol's plan round 3, which was declined, not adopted. Five build briefs for Claude Sonnet 5. The seat's
checks of each build (`seat-verify-*.md`): after each build, an independent check by five or six checkers with every
finding re-run by another, the full suite, and the seat's mutation runner. After build 4 the seat stopped by its
proportional-stopping rule: build brief 5 was a closed list, and `seat-verify-8c7ed24.md` lists every other finding as a
residual (none a safety, permission or fail-open defect; HANDOFF sums them up). Do not run the mutation runner; read
`seat-mutate-output-<tip>.txt`. CI on draft PR #13: macOS suite and both install checks green; the Linux and Windows suite
legs fail exactly the 69 files main's own run fails. Also `HANDOFF.md` and the session entry, which also correct three
notes the shares land left wrong (a Windows overclaim, a refused-after-a-table claim, a stale rehearsal line).

Check: (1) nothing the lift will write reaches the ledger unreviewed or off the owner's page — every row's placement,
every share added, dropped or moved by a merge, every purpose, outcome and reason; (2) no honest proposal is refused or
crashes, and a failing run removes only an earlier review page; (3) each row R-1170 to R-1180, R-1184 and R-1187 is
pinned by its cited tests; (4) the merge kept every lift and shares guarantee; (5) HANDOFF and the session entry are true;
(6) any MUST under the standard.
