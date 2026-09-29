# Worker brief — T2c fix round (Opus 5.5). The seat's predicate was wrong; you surfaced it.

Worktree `~/nana-pi-wt/t2c`, branch `lane/t2c-provenance-label` (HEAD `3bec2d0`). Your r1 report stands; one defect, and it is mine.

## The defect
You flagged it yourself: "Differs from `isNanaTrusted`: it also requires pi's `isProjectTrusted()` to be true, and the command-line path can't see that. So I copied only the 'trust was decided' part. A folder with a pi resource that you declined therefore counts as decided and goes unlabelled."

Seat probe on your branch confirms it, and the consequence is worse than that sentence suggests — the resource check short-circuits the store, so a recorded **decline** is also ignored:

```
folder has .pi/settings.json, trust.json EMPTY            → NOT labelled
folder has .pi/settings.json, trust.json records FALSE    → NOT labelled
```

The second line is the serious one: the owner explicitly said no, and the block presents that repo's objective without the label.

**Why my brief was wrong.** I told you trust counts when "pi would have asked … OR the owner recorded it". That disjunction is right for L1's config loading, where it is ANDed with pi's live `isProjectTrusted()` — the owner's actual answer in that session. Used alone, without that conjunct, the first disjunct means "pi would have asked", which is not "the owner vouched". For a label whose entire job is to say whether the owner vouched, only an affirmative answer counts.

## Required predicate
The label is cleared **only** by a recorded affirmative in `~/.pi/agent/trust.json` for the folder or its nearest recorded ancestor. Specifically:
- nearest recorded entry is `true` → not labelled;
- nearest recorded entry is `false` → **labelled** (a decline must win over any resource);
- no recorded entry → **labelled**, whatever `.pi/` resources exist, because a resource means pi would ask, not that the answer was yes;
- store unreadable, malformed, not a regular file, oversized, foreign-owned, or a FIFO → **labelled** (fail closed; keep everything you built here);
- the umbrella is still never labelled.
Delete the trust-requiring-resource branch from `ownerDecidedTrust` entirely — it cannot clear the label. Keep the rest of the implementation, including the non-blocking open and the size/owner checks.

**Consequence to state in the README:** more folders are labelled than before — any repo trusted only in-session, without `/trust` saving the decision, now carries the label until the owner runs `/trust`. That is the intended direction (the label means "I could not confirm you vouched") and the label already names the one action that clears it.

## Tests
Fix the corpus to match: the two probe cases above must be LABELLED; keep the affirmative cases (folder recorded, parent recorded, `null` falling through to a parent `true`, BOM, symlinked store) unlabelled; keep every fail-closed case labelled. Keep the comparison against pi's own trust module, but retarget it: it now checks only the recorded-decision part, so state plainly in the test that nana's label predicate is deliberately STRICTER than pi's trust and does not track the resource list. That also removes the drift risk you named as your most-doubted claim — nothing now depends on pi's resource list.

## NOT
No trust gating (the file still governs). No other behaviour changes. `--max-budget-usd 12`.

## doneWhen
`npm test` exits 0; both seat probe cases are labelled; no code path consults a `.pi/` resource list to decide the label.

## Rules
Foreground only; never end your turn with a command running. Commit on the branch, no push.

## Report (≤20 lines)
Commit · the two probe cases before/after · the predicate as it now reads · what you deleted · the README consequence sentence · the retargeted pi comparison · `npm test` summary · residuals · the one claim most likely wrong · `VERDICT: DONE`.
