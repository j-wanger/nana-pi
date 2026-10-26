# Review — page-detail (product cards show one line per deliverable; feature pages hold the detail), 2026-10-26 (the final reviewer)

Feature: FEAT-039 · See the product and its decisions in one report

Class: ordinary (it changes the product report script, one field the deliverable checker returns, their tests, the pack README and the requirements skill's report paragraph; no install, hook, gate, land or review tool). Threat model: honest variation in our tools' output, files and environment in scope (another project's ledger with no registry, no capabilities or no deliverables; a deliverable whose artifacts another feature registers; a feature with many cards and no deliverable; an artifact 0 days old; an undated `Parked:` line; a dead artifact ID; a `Read by:` claim missing a space; CRLF; hostile ledger text; old `#artifacts` bookmarks); deliberate forgery out (a hand-planted runtime record, a forged commit date).

Review `git diff 3010a7ef..HEAD` on `feat/page-detail`. Main is 3010a7ef (page-overview, landed). The lane's commits: 0814af12 (plan of record, build brief 1, seat title check), dcfa2c35 (build brief 2), b1ae68c5 (build brief 3), 00c171ae (build 3, which carries builds 1 and 2's uncommitted work), b15f56a6 (pairs at 00c171ae and build brief 4), fc3dcf75 (build 4), 615d91cd (pairs at fc3dcf75 and notes), d8e44854 (the lane's own keep: `tree-movement.md`), and the final commit with this brief.

The plan of record is `docs/reviews/page-detail-2026-10-25/must-meet.md`, after one adversary pass (`plan-attack.md`; 1 MUST, 4 SHOULD, 10 NOTE, all taken). Each Product deliverable is one line with its code marks, readable reader kinds, parked mark and largest artifact age or why it has none (R-2930, R-2931). Claims, artifact lines and entry cards move once to the owning feature's page (R-2932, R-2542, R-2642, R-2790, R-2799). The Artifacts view keeps its two lists with maker links (R-2801); the Overview's stale and gap artifact items link their makers (R-2923, R-2924); R-2922's text narrows to rows that cite a test file. R-2800 (flow lines) retires; R-2933 keeps its tree-checker clause. `deliverableClaims` now returns each claim's `readerKind`, and `readByCode` derives from it.

The seat's record:
- Build 1 stopped BLOCKED on a brief clause its fixture contradicts (R-2542's FEAT-052 check); build 2 stopped BLOCKED on R-2740's `ageFor` helper in runtime-land.test.mjs, which read the moved model field. Build 3 (00c171ae) changed only that helper; R-2740's assertions are unchanged.
- Build 3: locked full suite 224 of 226 files PASS, 2 SKIP; 27 hand red cases; Product view 413 to 188 lines, Artifacts 691 to 60; page 2,242,158 to 2,245,173 bytes (`build-1-checks.md`). The seat measured the page model: blocks (27 KB) and cards (57 KB) live once on feature pages, and the flow groups (12 KB) are gone; no part is copied twice.
- Six removed-escape lines in the diff each moved intact into report-fixtures.mjs or a rewritten fixture.
- Build 4 (small, fc3dcf75): R-2930's fixture gains a three-part `Read by:` claim; test file only; locked full suite 224 of 226 files PASS, 2 SKIP.
- Wrong-code pairs (`seat-mutate.mjs`, written by a pairs agent, confirmed by a checker agent): 49 of 50 red at 00c171ae, with pair 7 (the two-part reader test dropped) surviving (`seat-mutate-00c171ae.txt`); 50 of 50 red at fc3dcf75 (`seat-mutate-fc3dcf75.txt`). Pair 28 also names R-2799, which stays green by design; R-2932 turns red.
- CI at 00c171ae passed every leg on the first try, Windows included.
- The seat ran this lane's keep before this round (`tree-movement.md` in the lane folder).
- map:check, readme:check, the trace, the tree check (`21 of 21 made and read by code, 21 more parked`), the known-bugs check, the seat titles check (`0 missing`) and `nana-writing HANDOFF.md` are clean; the frontier check reads 1180 of 1200 words.

CI runs on the draft pull request at the reviewed tip, the Windows leg included. The seat reads that run and lands only on green.

Ask above all: after the move, can the owner still tell from the Product view, at most one click deep, whether each deliverable is made by code, read by someone and how old it is; does any fact vanish rather than move (an artifact another feature registers, a parked or retired entry, a constraint capability's entry); does any other code or project read the moved model fields; is the page still self-contained and safe for hostile text; and is each row no wider than its test?

Write the verdict only as the exact last line, `VERDICT: LAND` or `VERDICT: SEND-BACK`. Do not write the word VERDICT anywhere else, including your first sentence, and do not bold it.
