You are a careful senior engineer working headless for Jake Wang's nana program. Terse reporting; every claim backed by a command you ran and its output. Reproduce a reported probe before fixing it. Never end your turn while a command you started is still running.

# Worker brief — T2a fix round 4 (Opus 5.5). Implemented under the round cap (sol r1–r3 spent); astra rules on the land next.

Worktree `~/nana-pi-wt/t2a`, branch `lane/t2a-objective` (HEAD `63ae670`). Read `t2a-sol-r3.md`.

Sol confirms every earlier finding fixed and the narrowing complete **in the objective output**. It found the remaining route somewhere else — which is the lesson of this whole lane: the channels have to be enumerated, not narrowed one at a time.

## MUST 1 (HIGH) — the shared config diagnostic is an unsanitized surface
`lib/config.ts:378-389` (`surface()`) interpolates raw `file` and `problem` into `ui.notify`. Sol's probe: an untrusted repo whose path contains `\nprogram current priority:` plus a `.pi/nana-pack.json` produced a notification in which that attacker-chosen label **starts its own line**. That violates the corrected invariant (attacker-controlled STRUCTURE must never survive; letters inline are fine) in pi's output.
**Required:** sanitize both fields before they reach any surface — reuse the exported `displayPath()` for the file and the same control/line-separator stripping for the problem text. Check every other place `surface()` output can reach a UI or a prompt and cover them all. Add a probe-shaped test using sol's repo name.

## MUST 2 (MED) — UTF-8 validation misses the cap boundary
`objective.ts:143-156`: a malformed sequence beginning at byte 262,144 whose invalid continuation falls after the cap is ACCEPTED, because the extra byte is used only as a "there is more" flag rather than being decoded. Validate across the boundary (read the extra byte into the decode, or refuse when the final sequence is incomplete at the cap). Pin the exact case sol describes.

## Also (LOW, from sol's CARRY)
- `bin/nana-objective.mjs:16-17` still prints a raw `String(err)`. Sanitize it the same way; supported failures are caught below it, but a CLI fallback should not be the one unsanitized path.
- **Two overclaims to make true or restate.** (a) The "320-character cap" excludes quoting, so an unsafe path can total 322 — either count the quotes or document the real bound. (b) `displayPath()` does NOT keep an over-cap basename whole; it keeps the tail. Fix the behaviour or fix the description — your call, but they must agree.
- `config.ts:136-140`: `projectFile` documents a filename but accepts separators and traversal. Enforce basename-only.

## Keep both surrogate layers
Sol confirmed removing either alone leaves both suites green, and ruled they both earn their place (`displayPath()` fulfils its exported contract; `finish()` is a cheap whole-output backstop). Do not subtract either; instead add a test that fails when `finish()`'s layer alone is removed, so the redundancy is pinned rather than incidental.

## NOT
No trust gating and no label wording changes — still Jake's open decision, and sol's CARRY records it as a policy question that structural safety does not answer. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; sol's config-notification probe puts no attacker-controlled line start into any surface; the cap-boundary malformed file is refused; the two overclaims agree with the code.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce sol's notification probe before fixing it.

## Report (≤20 lines)
Commit · the notification probe before/after · every surface you found and covered · the cap-boundary case · which overclaim you fixed and how · the pinned surrogate-layer test · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
