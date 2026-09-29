# Worker brief — T2c fix round 3 (Opus 5.5), after sol r2 BLOCK. One sol round remains; this should be the last fix.

Worktree `~/nana-pi-wt/t2c`, branch `lane/t2c-provenance-label` (HEAD `98fb137`). Read `t2c-sol-r2.md`.

All three r1 findings are confirmed fixed, and sol verified the positive cases: ordinary `/trust`, "trust parent folder", a symlinked start path, and a `projectFile`-selected governing file all clear the label correctly.

## MUST — the remediation is still false for the fail-closed cases
The label fires for malformed, wrong-shape, unreadable, foreign-owned, directory, FIFO and oversized stores, but line 2 says unconditionally that `/trust` clears it. sol reproduced that **pi's own `/trust` throws on a malformed store**: `interactive-mode.js:4298-4301` calls `trustStore.getEntry(cwd)` before showing its selector, and `setMany` cannot repair the file either. So in exactly the cases where the owner most needs a working instruction, following it produces an error and the label persists. Foreign-owned or unwritable stores fail the same way, and an over-1-MiB store can still be rejected after pi rewrites it.

**Required:** make line 2 depend on WHY the label fired. You already compute the reason in the fail-closed branches — carry it through to the text:
- **No affirmative record, store usable** → today's text: start pi in `<folder>` itself (not a subfolder), run `/trust` there, then restart.
- **Store unusable** (any fail-closed branch) → name the store path via `displayPath()`, name the reason in a few words (malformed, unreadable, not a regular file, too large, owned by another user), and say to repair or remove it first — `/trust` cannot fix it and will error on a malformed file — then run `/trust` in `<folder>` and restart.
Keep it to two lines in both cases. Pin each branch: for a malformed store, a FIFO, an oversized store and a foreign-owned store, assert the emitted text names the store path and the repair step and does NOT tell the owner that `/trust` alone will clear it.

## Also (LOW, sol #11)
`templates/_shared/working-under-nana-pi.md:33` and `templates/_shared/OBJECTIVE.md:8` say the label stays "until the owner vouches", which is false when the owner did vouch but the store cannot be read; `packages/nana-setup/lib/project.mjs:309` overpromises `/trust` the same way. Make all three say what the label actually means — no usable affirmative record could be confirmed — and point at the label itself for the remedy rather than restating it.

## NOT
No predicate change. No `nana-setup trust <dir>` — sol ruled it a follow-up, not a blocker. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; every fail-closed branch emits a remediation naming the store and the repair; no surface promises `/trust` alone in those cases.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce the malformed-store `/trust` failure before fixing the text, so the report records it.

## Report (≤20 lines)
Commit · the malformed-store reproduction · both remediation variants quoted in full · each fail-closed branch with its emitted text · the three surface edits · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
