# Review — the tree for every project, 2026-10-14 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff 99a4103..HEAD` on `feat/tree` (main `99a4103`, with the roster and seat-guide lanes, is merged in).
The owner's words: 2026-10-13, "why does the default behavior today create requirements in row by row ears format instead
of tree based design which we adopted?"; 2026-10-14, "Lift is the tool that enables better regroup, but this is a core
feature for nana, understanding existing repo and turn into feature trees, then development really becomes feature
oriented". This lane is the first of the four lanes that ruling queues; the lift, the regroup and feature-oriented
development are later lanes. Threat model: honest variation in our tools' output and our users' files in scope (CRLF, a
BOM, a UTF-16 file from Windows PowerShell 5.1, a formatter's padded tables, a hand-typed heading, PowerShell or Bash,
an old project running `copier update`); deliberate forgery out. Lane class: format. The review standard pi-review
appends governs the bar and the verdict line.

Records in `docs/reviews/tree-2026-10-14/`: the plan `CHANGE.md` (three research reads, two fact-checks, a seat
revision with the owner's sorting ruling; sol plan r1 and r2 SEND-BACK, r3 LAND — its appended sections add R-1160 and
R-1161), the two build briefs for Claude Sonnet 5 (brief 2 merged main and closed six gaps the seat's mutation runner
and an independent check found: row counting the way the rail does, R-1157's and R-1151's missing pins, a SUB-only
ledger, wider near-miss headings, T13's "once"), the seat's acceptance (read `acceptance-output.txt`; the three
`(f, seat item)` cases are the seat's HANDOFF and session notes, now written), the title check (0 missing) and the
seat's mutation runner (`seat-mutate.mjs`; read `seat-mutate-output.txt`, do not run it). Draft PR #10's CI run
38634408165: macOS suite and both install-check jobs green; on the non-blocking Windows leg the checker titles T8–T11,
T15 and brief 2's three pass, while `product-report.test.mjs` stops early there on a known fault before T13 and T14.
Also `HANDOFF.md` (which also corrects two wording points the seat-guide reviewers raised) and the session entry.

Check: (1) a new project in either language and mode starts with a tree the checker accepts, the general engineering
rows unchanged in one feature under reserved IDs; (2) the checker's `--root`, CRLF, UTF-16, no-row, flat-ledger and
near-miss behaviour, in the checker and through the report, never prints "0 problems" for a ledger it could not read
and counts rows the way the rail does; (3) the skills tell both seats where a row goes in a tree ledger and in a flat
one, promising no command that does not exist; (4) rows R-1150–R-1161 are each pinned by their cited tests; (5)
nothing on the plan's do-not-touch list changed; (6) HANDOFF and the session entry are true; (7) any MUST under the
standard.
