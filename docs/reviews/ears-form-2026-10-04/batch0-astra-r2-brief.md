# Review brief — EARS batch 0, ROUND 2 (reviewer: gpt-6-astra)

The worktree and branch are unchanged (`~/nana-pi-wt/ears`, `feat/ears-form`). Your round 1 was BLOCK, 6/10 (`batch0-astra-r1.md`). The fix commit is `0704531`.
1. Re-derive closure of every round-1 item from the artifact. Re-run your probes: the double-backtick span; "WRONG REPORT" and first-row-only in all three places; split placement against the ruling's §2; the `shallé` parity case across TypeScript and Python; the count-falls-below-allowance case (now R-757).
2. Attack the new word boundary: JS `(?<![\p{L}\p{N}_])shall(?![\p{L}\p{N}_])` against Python `(?<!\w)shall(?!\w)`. Find any input where they disagree: combining marks, digits in other scripts, letterlike symbols, superscripts, the Unicode letter categories Lm and Lo, a ZWJ. Python `\w` follows str.isalnum plus underscore. If you find a disagreement, report it with the exact codepoint.
3. Review `git diff 6f21ea9..0704531` as new code.
4. Rule on R-757 (stale headroom fails in nana-pi) as a deviation from the ruling's `count > allowance`. Should it stand?
5. Re-audit the batch's rows. State any residuals to RECORD.
Verdict format as before.
