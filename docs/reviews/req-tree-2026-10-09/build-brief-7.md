# Lane req-tree — continuation 6: the placeholder bypass is still open   (2026-10-09 · feat/req-tree)

Your report 6 says each new row set to `| untested | — |` makes the proof exit 1. The seat's
re-run says it exits 0 for all five (`seat-verify-r4-output-before-fix.txt`, produced by
`seat-verify-r4.sh`). Cause, in `prove.mjs` (~lines 97–112): when a new-row line FAILS the
canonical/implemented/evidence validation, control falls through to `if (a[i] === b[i]) continue;`,
and the placeholder line equals the expected line, so it passes.

Fix exactly this: for an R-287–R-291 line, the validation decides alone — valid → `continue`;
invalid → `fail(...)` naming the row and `continue`. The equality shortcut must never be reached
for those five lines. Change nothing else.

Then run `bash docs/reviews/req-tree-2026-10-09/seat-verify-r4.sh` from the worktree root and paste
its full output VERBATIM into your report (every line must read as wanted: the five placeholder
lines exit=1, the real ledger 0). Then the proof (with `--approved` and `--amendment`) saved over
`prove-output.txt`, `npm run map:check`, `npm run test:locked`.

Same NOT, allowlist and frozen inputs. Report ≤ 25 lines, first line `VERDICT: DONE | PARTIAL |
BLOCKED`, the verbatim verify output, the suite summary line.
