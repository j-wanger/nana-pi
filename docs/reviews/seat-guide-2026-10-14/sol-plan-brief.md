# Plan review — the seat guide, 2026-10-14 (gpt-5.6-sol, one round: small lane)

Review the change declaration `docs/reviews/seat-guide-2026-10-14/CHANGE.md` on `feat/seat-guide` (based on main
`484329c`, roster landed; read its final "Base update" section). Nothing is built yet. The guide's exact text is
`nana-seat.proposed.md`; the shared-section pointer is `pointer.proposed.txt`.

Jake's request, 2026-10-13, verbatim: "We also need to add instructions on how to be a good seat, the opus seat on
windows is checking the work done by the worker every turn". His standing rulings the plan keeps: long background
runs get passive monitors (2026-07-24, 2026-08-06); any change that touches code with tests goes through the worker
and reviewer pattern (2026-10-13). Threat model: honest variation in our tools' output in scope (an edit that drops,
duplicates or adds a guide bullet or drops the rule from a list; CRLF; a stale Windows copy); deliberate forgery and a
seat that ignores the rule out. Lane class: small (one rule file, two list entries, one shared-section line). The
review standard pi-review appends governs the bar and the verdict line.

Evidence in the folder: `research-rules-install.md`, `research-seat-practice.md`, `factcheck-repo.md` and
`factcheck-external.md` (both written against the first draft; §"Seat revision" lists what changed),
`sim-guide-v2.mjs` (the guide checks' simulation).

Check: (1) the guide says what Jake asked and nothing that contradicts his standing rulings; each bullet traces to a
named source; (2) the install wiring reaches a Claude Code seat on macOS (symlink) and Windows (copy) and uninstall
removes it; doctor shows it; (3) the pointer is safe in every project's AGENTS.md, including builder and reviewer
children that load it; (4) rows R-1140–R-1142 and the R-301 reword are each pinned by a named test, and every
"wrong code first" mutation reds the title it names; (5) scope is the smallest that does the job; (6) any MUST under
the standard.
