- **MUST — Rename-aware driver checks are missing.** `packages/nana-pack/bin/nana-land.mjs:64–77` checks attributes only for overlapping literal paths. Reproduced: unchanged attributes select `new.txt merge=keep`; the lane renames `old.txt` to `new.txt` and edits it; main edits `old.txt`. With `merge.keep.driver=true`, land succeeds but silently drops main’s edit. Check rename destinations before invoking merge-tree and add this refusal regression test.

- **SHOULD — Generated-file overlap does not refuse.** The same helper has no generated-file guard. Separate-hunk changes to `docs/code-map.md` on both sides landed successfully in my reproduction, contrary to Q3. Add the guard and a regression test.

The ten new checks pass, including ordinary-merge comparisons, review coverage, CI races, and guidance consistency. The additional driver reproduction demonstrates content loss within the stated threat model.

VERDICT: SEND-BACK
