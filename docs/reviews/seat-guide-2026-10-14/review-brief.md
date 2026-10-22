# Review — the seat guide, 2026-10-14 (gpt-5.6-sol build review and gpt-6-astra land review, in parallel)

Review `git diff 484329c..HEAD` on `feat/seat-guide` (main `484329c`). The owner's request, 2026-10-13: "We also need to add
instructions on how to be a good seat, the opus seat on windows is checking the work done by the worker every turn".
Threat model: honest variation in our tools' output in scope (an edit that drops, duplicates or adds a guide bullet or
drops the rule from a list; CRLF; a stale Windows copy); deliberate forgery and a seat that ignores the rule out. Lane
class: small (one rule file, two list entries, one shared-section line). The review standard pi-review appends governs
the bar and the verdict line.

Records in `docs/reviews/seat-guide-2026-10-14/`: the plan `CHANGE.md` (planning workflow, two fact-checks, a seat
revision, a base update for roster's land; sol plan r1 LAND with two notes the plan keeps — see "Plan review r1"), the
proposed guide and pointer, the two build briefs for Claude Sonnet 5 (brief 2 made R-1140's bullet check count
sub-bullets and `*`/`+` markers), the seat's acceptance (52/52 at the tip; read
`acceptance-output.txt` rather than re-running unless you want to), the title check (0 missing) and the seat's mutation
runner (`seat-mutate.mjs`; read `seat-mutate-output.txt`, do not run it). Draft PR #9's CI run 38603676640 (at `cac50d7`; later commits change one test line and records; the seat's
`npm run test:locked` at `2b54997`: 0 failures, and the mutation runner re-run there): macOS suite
and both install-check jobs green; on the non-blocking Windows leg `seat-rule.test.mjs` passes 10/10 and the R-350 title
passes, while `templates-render.test.mjs` stops at a known line-ending fault before the R-1142 checks, as on main. The
seat's local install check passed 12/12. Also `HANDOFF.md` and the session entry.

Check: (1) the guide says what the owner asked and nothing that contradicts his standing rulings (passive monitors stay;
any change that touches code with tests goes through the pattern); (2) a Claude Code seat on macOS (link) and Windows
(copy) gets the rule from one install, doctor shows it, and uninstall removes it; (3) the pointer is third person and
safe in every project's AGENTS.md, including builder and reviewer children; (4) R-1140–R-1142 and the R-301 reword are
each pinned by their cited tests; (5) HANDOFF and the session entry are true; (6) any MUST under the standard.
