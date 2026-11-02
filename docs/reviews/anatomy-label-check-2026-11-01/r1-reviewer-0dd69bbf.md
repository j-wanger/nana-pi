**Review: anatomy-label-check (`fe749bb0`, diff from `origin/main` `57585563`)**

The readers work for the seat's decision and the change causes no harm the review standard lists. Every finding below is a SHOULD or a NOTE. Most concern what `labeller-counts.md` leaves out, not what it says.

## What I checked

- **Tests.** I ran both anatomy test files on the tip: `anatomy-labels.test.mjs` passed 30 of 30 and `anatomy.test.mjs` passed 9 of 9. The merge base is `origin/main`'s tip, and the diff outside the review folder lists only this lane's 12 files.
- **Matching a unit to its label by normalized key.** `distinctUnits` (`apps/bench/lib/anatomy-measures.mjs:134`) builds the same keys, the same first-occurrence ids and the same blind text as Part 1's copy, in the same order. So the manifest counts and the stored rows of a real Part 1 store still match it. `byId` sends every unit occurrence to its key, so sheet rows that differ by cwd, branch, list marker or emphasis get their key's label. The R-3399 test covers both cases.
- **Each key counted once.** Weighted agreement, disputed weight and the left-out weight use `uniqueRows`, where the lowest sheet id stands for its key. Unweighted κ stays per row, as plan A6 says. The R-3400 test checks that a repeated heavy key counts once.
- **Pooling (T8).** The first pair's row stands for a shared key, the overlap prints, and every function prints. The R-3406 test checks 8 + 25 − 1 = 32 keys and overlap 1, and that pooled κ equals `cohensKappa` over the deduplicated rows. It also shows the first pair's label wins on the shared key.
- **Read-only.** `readLabels` uses only `lstat`, `readFileSync` and `readJsonl` with `repair: false`, which never writes. It never calls `chmod`, and it compares parsed rows with non-empty lines. It refuses every case in plan A7 with the fixed reasons. The R-3405 test checks bytes, mode, mtime and the folder listing on every run, including each refusal.
- **Privacy.** Output holds only counts, κ, weights and the provenance block (model, prompt hash, labels digest). Error messages are fixed strings. Nothing in the diff carries a 64-character hex string except the sealed prompt hash.
- **Old behaviour.** Commands without the new flags print the same output as before; tests R-3399 and R-3402 compare against it and `anatomy.test.mjs` passes. The new flag checks refuse every wrong pairing of flag and command.
- **R-3397 retune.** It is pinned by the two seal tests, the requirement row, the config comment and the README. The changed R-3395 test proves that a label store made with Sonnet refuses `--resume` under Opus.
- **The owner's rulings.** `labeller-counts.md` matches both rulings and the session entry. The four findings each meet consensus ≥ 0.6, model:b ≥ 0.7 and a pooled count ≥ 30. The other six functions fail model:b or have a count under 30.

## Findings

**SHOULD 1. The bar recheck after the model change reused sheet 2, and the counts file does not say so** (`labeller-counts.md:11-18`).
- Plan step 4 says any recheck after a prompt or model change uses a fresh seeded sheet, and sheet 2 stays the first labels' result.
- The owner chose Opus after Sonnet failed on sheet 2. The Opus "pass" on the overall bar comes from that same sheet.
- The heavy and rare sheets were drawn fresh, but neither is a random sheet for the overall bar.
- Fix: add one line stating this departure, so the owner knows the overall pass was rechecked on the sheet the model was chosen from.

**SHOULD 2. The counts file leaves out several things plan step 7 and Part 1's carries require** (`labeller-counts.md:44-57`). Missing:
- the per-part share tables;
- the denominators, including that the per-occurrence unit % counts glue spans in the denominator;
- the context-dependent lines (keys spanning parts, short occurrences) and the empty-normalized count;
- tokens, and whether the cost is notional under subscription;
- Part 1 carry 1, the build-1 tip correction;
- Part 1 carry 2, committing the κ and count fields of sheet 2's agree output as `builder-anatomy-agree.json`, plus this lane's agree outputs.

Without carry 2, nobody can recheck the four findings from the repository. The step 0 store check is also unrecorded: the heavy sheet has 278 keys against Part 1's 283. The likely cause is that Part 1's figure included oversize keys, but the file should say so.

**SHOULD 3. The pooled per-function count is the union of three labellers** (`anatomy-measures.mjs:215`). It counts a key when the model, labeller A or labeller B gave it the function. That is larger than the pair count behind either κ:
- the model:b κ rests on keys where the model or B said the function;
- the model:consensus κ rests only on keys where A and B agree.

It meets T8's wording and the README states it. But a function near 30 can be marked "reliable" while a κ rests on fewer keys; precedent at 37 and feedback at 35 are the closest. Printing a count per κ would remove the doubt.

**SHOULD 4. Precedent passes model:b at "0.70" against a bar of 0.7, shown to two decimals** (`labeller-counts.md:34`). A true value from 0.695 up to 0.6999 would print as 0.70 and fail. Give three decimals at a borderline value.

**SHOULD 5. A new known-bug line compares the wrong kind of numbers** (`docs/known-bugs/FEAT-042.md:16`). It says the 0.85 weighted bar "cannot be met as defined" because labellers A and B agree at κ 0.74.
- The bar is a weighted proportion of agreement; κ is corrected for chance, so the two numbers are not comparable.
- model:consensus weighted agreement is computed only over keys where A and B agree, so their disagreement does not cap it.
- A and B's own occurrence-weighted agreement can be computed from `consensusLeftOut`.

A future lane could lower or drop the bar on this reasoning.

**NOTE 1. `report --labels` drops occurrences that normalize to empty text from every table, not only the per-distinct view** (`anatomy-measures.mtml:170`). That covers per-occurrence, parts, builds and zero supply, while T4 said to count "every non-oversize occurrence". The README states it and `emptyNormalized` prints the count. But the denominator text "non-oversize occurrences including glue" does not mention the exclusion.

**NOTE 2. Small wording gaps.** The session entry leaves out the aborted first Opus start that the counts file mentions. `HANDOFF.md:11` will still say the labeller "waits on merges" after this land.

VERDICT: LAND
