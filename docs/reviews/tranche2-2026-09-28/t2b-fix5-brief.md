# Worker brief — T2b fix round 5 (Opus 5.5). Astra land MUSTs; astra re-rules next.

Worktree `~/nana-pi-wt/t2b`, branch `lane/t2b-review-ledger` (HEAD `dd285b2` — the seat merged main and handled the HANDOFF preservation part of MUST 3). Read `t2b-astra-land.md`.

## MUST 1 — tracked-output protection has a symlink hole and a prefix bug
`bin/review-round.mjs:407-414`:
- It resolves only the PARENT directory, not a final symlink. An `--out` that is itself a symlink pointing at a tracked file passes the check and overwrites that file before completion-drift rejection ever runs. Resolve the full final path (`realpath` semantics on the leaf, handling a not-yet-existing leaf by resolving its parent and then checking the link itself if one exists).
- `rel.startsWith('..')` misclassifies legitimate tracked names such as `..notes.md` as "outside the tree". Compare path SEGMENTS, not string prefixes.
Pin both: an `--out` symlink aimed at a tracked file is refused BEFORE the review launches and the target file is left byte-identical; a tracked file literally named `..notes.md` is correctly treated as in-tree and refused.

## MUST 2 — the audit file is not bounded on every path
`review-round.mjs:454` appends override records, but rotation only runs through successful completion at `:515`. Repeated FAILED over-cap launches therefore grow the audit indefinitely. Rotate on every append path. Then correct the README: the permanent tally grows separately and is NOT bounded — say so explicitly rather than implying total bounded storage.

## MUST 3 — the published worker migration recipe is dangerous as written
Both named `~/jev-research` worker scripts already pass `--retries 2`. My documented recipe says "arguments otherwise unchanged", which under the new N+1 semantics means **three mutation attempts** instead of `pi-worker`'s safe single attempt. Correct the recipe to drop `--retries` for worker launches unless deliberately justified, and say why in one line (a retried worker repeats file mutations). Also confirm in the README that workers must not receive `--item` or `--worker`.

## Also — correct three overstatements astra named
- "casefold" in the identity docs is actually lowercase normalization; say lowercase.
- "every admitted review … recorded": an ordinary FAILED admission leaves no durable audit once its reservation is removed. Qualify it.
- "only completed verdicts count": the documented unverified-completion case is an exception. Qualify it.
- The README should also state plainly that these wrappers do NOT enforce `--max-budget-usd`; budget control is external.

## Also — one vacuous assertion
`tests/review-ledger.test.mjs:306` captures its "before" tally AFTER calling `check`, so the equality assertion cannot fail. Capture before, or assert something that can.

## NOT
No new mechanisms. Do not restore `--worker` on the review command. Do not touch `HANDOFF.md` (the seat owns it this round). `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; a symlinked `--out` at a tracked file is refused with the target untouched; `..notes.md` is handled as in-tree; repeated failed over-cap launches do not grow the audit without bound; the README no longer overstates.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push. Reproduce the symlink overwrite before fixing it.

## Report (≤20 lines)
Commit · the symlink case before/after with the target's bytes · the `..notes.md` case · the audit growth before/after · the corrected migration recipe (quote it) · the three qualifications · the fixed assertion · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
