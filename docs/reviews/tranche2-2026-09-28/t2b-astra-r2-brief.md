# Astra land ruling — lane T2b, round 2 (confirm the MUSTs, on the tree merged with T2a)

Your r1 (`t2b-astra-land.md`, 7/10 BLOCK) issued three MUSTs. Fix commit `371b410` (`t2b-worker-r6.md`), then the seat merged main (T2a landed as `741d567`); the merge auto-resolved with no conflict. Worktree `~/nana-pi-wt/t2b`; clean diff vs main `t2b-r6.patch`.

**MUST 1 — tracked-output protection.** Reproduced first: a symlink outside the tree pointing at tracked `f` was admitted and `f` changed from `4f524947494e414c0a` to `564552444943543a204c414e440a`. After: the link and a two-link chain are refused before admission with `TRACKED file (→ …/repo/f)`, `f` stays `4f524947494e414c0a`, and nothing is reserved or counted. A new `realOut` resolves the full path including the final link, follows a dangling link to where the write would land, and the snapshot exclusion uses the same resolution. Separately, `..notes.md` was admitted and overwritten before; now refused as tracked and left at `4e4f5445530a`, while an untracked `..draft.md` gets the in-tree warning. Paths are compared by SEGMENT (new `relUnder`), which also fixed the same `startsWith('..')` bug in the snapshot skip list.

**MUST 2 — audit bound.** Before: with the audit at 1,260,000 B, five failed over-cap launches grew it 296 B each and never rotated. After: the first rotates it. Every audit append now rotates first. The README states outright that the permanent tally grows forever and total storage is NOT bounded; only the audit is (~2 MiB).

**MUST 3 — migration recipe.** Confirmed both jev scripts pass `--retries 2` (lines 11 and 7). The recipe now says to replace `pi-review` with `pi-worker` AND delete `--retries 2`, with the reason (a retried worker repeats file mutations; under N+1 that is three mutating attempts), and states that a worker must not receive `--item` or `--worker`.

**Overstatements corrected:** "lowercased (JavaScript `toLowerCase`, not Unicode case folding)"; a failed ordinary admission "leaves no durable record"; the round rule now reads "A completed verdict earns the round — with one exception" (unverified completion); and the wrappers neither read nor enforce `--max-budget-usd`.

**Vacuous assertion:** `:306` now captures tally, audit and reservations BEFORE `check`, with a live reservation planted so "check prunes nothing" is observable. The worker notes it passes on both old and new code — expected, since `check` never mutated — and did not prove it would catch a mutating `check`.

Seat-verified on the MERGED tree: `npm test` → 71 files, 3660 checks, exit 0.

Judge only, ≤30 lines: (1) each MUST FIXED / PARTIAL / NOT FIXED with the line; (2) any NEW defect — in particular the worker's own doubt that `realOut` rethrows `ENOTDIR`/`ELOOP` from `realpathSync`, refusing admission rather than warning (right call or not?), and whether the segment comparison introduced any regression; (3) the residual it names as undocumented: the staging-independence exception for force-added ignored files; (4) your final CARRY list for the merge. End with `SCORE: n/10`, MUST (empty if none), CARRY, `VERDICT: LAND` or `VERDICT: BLOCK`.
