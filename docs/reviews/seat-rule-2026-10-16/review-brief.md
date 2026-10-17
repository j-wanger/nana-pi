# Review — seat-rule, 2026-10-17 (gpt-5.6-sol and gpt-6-astra, in parallel)

Review `git diff c514964..HEAD` on `feat/seat-rule`. The owner asked, on 2026-10-16, that the seat work in parallel by
default, and chose a new lane limit of two lanes building plus one in planning. The lane rewrites the seat guide
(`packages/nana-setup/claude/rules/nana-seat.md`, ten bullets), its test, and R-1140. The plan (`CHANGE.md`) took one sol
round; its revision 3 answers that round (no split beside a full suite; a time-limit failure re-run alone; independent
work started before the turn ends; the planning slot defined). The small-lane builder copied the planned guide and test
byte for byte. Seat checks: full suite clean, macOS install check pass, the plan's pair simulation 26 of 26
(`seat-verify-e1b13d2.md`); acceptance 8 of 8. Also `HANDOFF.md` and the session entry.

Threat model: honest variation in our tools' output and users' files in scope (CRLF copies, the Windows copy of the rule,
seats in other projects); deliberate forgery out. Lane class: small. The review standard pi-review appends governs the
bar and the verdict line.

Check: (1) the guide says what the owner chose, in words a seat will follow, and nothing more; (2) R-1140 has one
"shall" and each clause is pinned; (3) nothing else that reads the guide or the row is left contradicting it; (4)
HANDOFF and the session entry are true; (5) any MUST.
