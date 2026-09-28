You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Never end your turn while a command you started is still running.

# Worker brief — L3 fix round (Opus 5.5), after sol r1 BLOCK

Worktree `~/nana-pi-wt/l3`, branch `lane/l3-handoff` (HEAD `6b23473`). Read `~/nana-pi/docs/reviews/tranche1-2026-09-28/l3-sol-r1.md` (the review) and your `l3-worker-r1.md`. The contract is `l3-brief.md`.

## Fix these
1. **HIGH — the stale pointer loses the path it promises.** `nana-handoff.ts:138-143` truncates at 300 chars; with a long HOME the path is cut off, so the summary is NOT "one read away". Use a COMPACT path representation (`~/.pi/agent/handoffs/<hash>.md`, i.e. home replaced by `~`; for a custom path outside home keep the tail with a leading `…/` and always keep the basename intact). The cap stays 300 chars; path + age + writer must all survive it. Add coverage: a very long HOME (≈290 chars) and a long custom `handoff.path`, asserting the emitted path is present, readable after `~` expansion, and the whole pointer ≤300.
2. **HIGH — nana-pi's own `AGENTS.md` still tells agents to maintain `.pi/handoff.md`** (`AGENTS.md:102-105`: compaction writes it, update it in place, only humans delete it). Under this lane that file is never injected, so the instruction sends agents to edit a dead artifact. **Declared allowlist expansion: you may edit `~/nana-pi/AGENTS.md`** (that section only) to describe the user-scope store, the pointer for a repo file, and where the artifact now lives. Keep it to the minimum.
3. **MEDIUM — provenance failure is journaled as a clean write.** `:283-287,294` writes `Writer: unknown` when `getSessionFile()` throws but journals only `handoff_written`. Journal an explicit degradation (e.g. `handoff_provenance_unavailable`) alongside the write so invariant (c)'s missing provenance is visible. Do not decline the write.
4. **LOW — corrupt UTF-8 is injected as U+FFFD and journaled as a normal pickup** (`:193-195`). Decode fatally: on invalid bytes, inject nothing and journal `handoff_pickup_failed` with the reason.
5. **LOW — SUBTRACT the default-store symlink refusal** (`:188,278`, test `handoff-store.test.mjs:127-134`). sol ruled it fails the subtraction test: the brief required symlink refusal for CUSTOM paths only, invariants (a)–(g) hold without it, and it rejects an owner's deliberately symlinked store. Remove the policy and its test; keep the custom-path symlink refusal in `handoff-symlink.test.mjs`. **Keep** the `Cwd:` mismatch check — sol ruled it earns its cost.
6. **LOW — document the marker's inheritance.** `NANA_HANDOFF=off` in `pi-review.mjs:102` is inherited by any process the review child spawns, silently disabling handoff there; only exact lowercase `off` is honored. State both in the pack README Handoff bullets.

## Seat ruling — do NOT change invariant (g) behavior (sol's MEDIUM #3 is overridden)
sol ruled that a cwd with neither its own nor an ancestor handoff should still get an explicit "No handoff for this directory" line, because the contract's wording says so. The seat rules the opposite and amends the wording instead: the invariant exists to prevent SILENT BORROWING, and where no ancestor entry exists there is nothing to borrow. Every fresh session in every repo without a handoff (the overwhelmingly common case) would otherwise carry a line that buys no safety — context noise is the thing this tranche is trying to remove. **Keep the current behavior** (marker only when an ancestor entry exists) and instead correct the wording in `l3-brief.md` invariant (g) and the pack README so text and code agree. Say in your report that this was a seat ruling, so the land reviewer judges it.

## NOT
No gate edits (L2 is landing in parallel). No new mechanisms. No desk behavior change. No assertion weakening beyond the symlink-refusal removal named above.

## doneWhen
`npm test` exits 0 from the worktree root; the long-HOME and long-custom-path pointer cases pass; `handoff-trust.test.mjs` still passes.

## Rules
Foreground commands only; never end your turn with a command still running. Kill only your PIDs. Commit on the branch, no push. `--max-budget-usd 15`.

## Report (≤30 lines)
Commits · the worst-case pointer you could construct (length + content) · the AGENTS.md edit · each fix with its test · what you removed for #5 · `npm test` summary · `git diff --stat` vs main · residuals · the one claim most likely wrong · `VERDICT: DONE`.
