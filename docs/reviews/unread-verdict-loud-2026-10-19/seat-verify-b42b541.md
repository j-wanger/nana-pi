# Seat checks — unread-verdict-loud build 1b, tip b42b541 (2026-10-19)

- Builds, by a pi gpt-5.6-sol builder through `pi-worker --lane-size larger`: build 1 (`build-brief-1.md`) stalled
  under pi-worker's 75-second watchdog before it committed; build 1b (`build-brief-1b.md`) judged the uncommitted
  changes against the plan and finished them at 52e90a0. b42b541 is the seat's merge of main 713d6aa: it resolved a
  conflict in `docs/requirements-tree.md` and set the R-291 leaf total to 1,302 (main's 1,298 plus R-1620 to R-1623).
  e4cc2b8 adds only the seat's pair table and record; no code or test changed after b42b541.
- Per the builder's report, not re-run by the seat: R-1620 to R-1623 implemented, each red on the code before the
  change; R-1390 narrowed to review-shaped output whose recorded verdict is not empty; the six retargets the plan lists
  (LAND corpus, malformed suffixes, refused positions, scratch `--tree`, selected child directory, handoff-disabled
  child environment); wrong code W1 to W15 each turned its named check red.
- CI run 39301089336 on draft pull request #59 (b42b541; GitHub's merge onto 713d6aa, merge commit 36c1225):
  - macOS `157 files: 155 PASS, 0 FAIL, 2 SKIP` · 7,557 checks pass, 0 fail; review-ledger `163 pass`.
  - Ubuntu `157 files: 155 PASS, 0 FAIL, 2 SKIP` · 7,502 checks pass, 0 fail; review-ledger `163 pass`.
  - Windows `157 files: 140 PASS, 0 FAIL, 17 SKIP, 0 WARN · checks: 6484 pass, 0 fail, 83 skip`
    (`ci-windows-run-1.log`); review-ledger `161 pass, 2 skip`, and all four must-meet checks print PASS on win32:
    ```
    PASS review-ledger run exits 1 when the recorded verdict is empty and 0 when it is a word
    PASS pi-review exits 1 without its success line when the recorded verdict is empty
    PASS an empty verdict prints one stderr line naming the selected line, its condition and the conflicting line
    PASS the empty-verdict line says nana-land refuses the revision and counts the rounds left
    ```
  - install-check: macOS and Windows success. None of main's known failures showed.
- The seat's wrong-code pairs (`seat-mutate.mjs`, `seat-mutate-output-b42b541.txt`): 20 of 20 red, 0 survived, one
  shard, macOS. 18 turn exactly their named titles red; C1 (complete returns the round instead of recording) and C5 (a
  readable verdict also gets the note) also turn unnamed checks red, the expected spread. Declared, no pair: every pair
  runs on macOS only; the condition texts in `lib/verdict-config.mjs`; the empty-output condition, reachable only by a
  direct `complete()` call; the note's opening (item, short revision, round).
  - Correction to the record's declaration (e): only three of the six retargets show as named reds, under L1 and C1
    (the LAND corpus, malformed suffixes and refused positions). Tree-scope and the selected child directory show only
    as unnamed reds under C5. The R-139 retarget lives in handoff-writer-role, which the pair runner does not run.
- Independent check (`independent-check-b42b541.md`, run on b42b541): HOLDS, no MUST. review-ledger 163 pass; the
  old and new readers agree on 240,416 generated outputs; nana-land refuses a revision after an unread round, as the
  note says; the readable-verdict path's stderr matches main's byte for byte. Findings and how each was settled:
  1. Known bug, low: `JSON.stringify` escapes only C0 controls, so C1 controls such as U+009B and U+2028/U+2029 reach
     stderr raw. The sentence it calls too strong is in `must-meet.md`'s known limits, not the pack README, which says
     only "one escaped diagnostic line". Not fixed; recorded as a HANDOFF carried residual.
  2. Known bug, low, outside the threat model (needs tampering): `complete()` now calls `decide()` after the append
     for every verdict, so a throw there turns a recorded LAND into exit 1. Not fixed; recorded as a HANDOFF carried
     residual, with the narrower fix it names (count only when the verdict is null).
  3. Observation, same as main: after an unread round, a readable re-review of the same revision prints "verdict
     recorded" and exits 0, while nana-land still refuses. Recorded as a HANDOFF carried residual.
- Rows: R-1620 to R-1623 read `implemented` in REQUIREMENTS.md. `node scripts/requirements-trace.mjs` reads `1302 total
  (1016 implemented · 1 planned · 18 retired · 262 untested · 5 violated)` and `ears: 0 rows off form`; `npm run
  map:check` reads 299 modules, 0 problems.
- Tree movement (`requirements-moved --root . --base main`, merge-base 713d6aa): 5 rows in FEAT-007 — R-1390 text
  changed; R-1620 to R-1623 new (implemented).
- The plan's known limits stay open, and HANDOFF carries each as an unread-verdict residual: an agreeing bold first
  line still empties the round; exit 1 no longer always means no round spent; a mid-review tree change prints only the
  old message; a dirty-tree note names the snapshot revision; a re-review shows an unchanged count; the empty-output
  text is unpinned; the line has no length cap; review-timeline's own verdict reader is untouched.
- Main moved after the cut: audit-open-questions, review-timeline and win-leg-flip landed, and main is 8482c2e. The
  lane has not merged it. A merge meets HANDOFF's Landed tail and residuals, the session file's top, the tree outline
  and the R-291 leaf total; that tip needs its own accepted review coverage before nana-land.
