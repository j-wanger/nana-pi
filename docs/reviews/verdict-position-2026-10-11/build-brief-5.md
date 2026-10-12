# Lane verdict-position — build brief 5: one finding, both reviewers (2026-10-11)

sol r2 and astra r2 (`sol-r2.md`, `astra-r2.md`; both SEND-BACK 8/10) found the same and only issue:
`if (first !== final && carries(first))` in `verdictWord` compares line TEXT, so identical first and
final lines (`# VERDICT: LAND` … `# VERDICT: LAND`, or quoted, indented, bold) skip the plain
first-line check and record LAND. Everything else is closed.

- [ ] Decide "a different line" by position: `nonblank.length > 1`. Regressions through the real
  launch path: identical `#`-marked, quoted, indented and bold first and final verdict lines each
  record empty; identical PLAIN first and final `VERDICT: LAND` still records LAND; a single marked
  final verdict line still records LAND. Wrong code first.

The seat's acceptance script (frozen) has five new cases; four fail today. Then
`python3 docs/reviews/verdict-position-2026-10-11/seat-mutate.py > docs/reviews/verdict-position-2026-10-11/seat-mutate-output.txt 2>&1`
(17/17 red, worktree clean), `npm run test:locked`, the acceptance script (pass
`~/yokai-world/docs/reviews` as its argument) and the title check into their output files; commit
with explicit paths. Report ≤ 8 lines, first line `VERDICT: …`, the last two lines of each output
file verbatim.
