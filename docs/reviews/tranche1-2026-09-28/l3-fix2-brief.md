# Worker brief — L3 fix round 2 (Opus 5.5), after sol r2 BLOCK. Last fix round before the astra land ruling.

Worktree `~/nana-pi-wt/l3`, branch `lane/l3-handoff` (HEAD `a5c05ca`). Read `l3-sol-r2.md` whole.

## SEAT RULING — a locator that does not resolve is worse than a long line. Correctness beats the 300-char cap.
sol proved three ways the compact path can emit something unusable: `…/<tail>` resolves as `<cwd>/…/<tail>` (HIGH), a legal 255-char basename is still truncated so "basename always intact" is false (HIGH), and an in-project literal `~/handoff.md` is emitted unchanged so pi expands it to `$HOME/handoff.md` (MED).

**New rule, in this order:**
1. The emitted path must ALWAYS resolve to the actual file when passed to pi's read tool. Only two abbreviations are legal, because pi's resolver handles both: `~/…` for a path under the real home, and a cwd-relative path for a path under the session's cwd. Everything else is emitted **absolute and in full**.
2. Delete the `…/<tail>` form entirely.
3. A path whose real directory name contains a literal `~` is emitted absolute, never abbreviated, so it cannot be mistaken for a home expansion.
4. The 300-char cap trims, in order: the writer, then the age. **If the path alone exceeds the cap, the pointer exceeds the cap** — a long true path beats a short false one. Say so in the README.
5. Pin each of these: the `…/` form is gone, a 255-char basename resolves, a literal-`~` directory resolves, an out-of-home custom path resolves, and each emitted path is verified by actually reading the file through the same resolution pi uses (`resolveToCwd` semantics: tilde expansion, cwd-relative, absolute).

## Also fix — the L5 seam (sol r2)
`nana-handoff.ts:250` uses `raw == null` for both "no store entry" and "read/decode failed". Lane L5 will report unadopted directories from this signal, and a read failure is not an unadopted directory. Return a discriminated result (e.g. `{kind:"missing"}` / `{kind:"error", reason}` / `{kind:"ok", text}`) and journal them distinctly, so L5 cannot mistake a broken store for an empty one. Keep the in-session behavior identical.

## NOT
No other changes. No new mechanisms. No gate edits. Do not weaken an assertion.

## doneWhen
`npm test` exits 0; every emitted stale-pointer path in the new tests actually resolves and reads back the intended file.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. `--max-budget-usd 12`.

## Report (≤25 lines)
Commit · the resolution rule as implemented · each of the five pinned cases with its measured pointer length (flagging any that legitimately exceed 300) · the discriminated result shape · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
