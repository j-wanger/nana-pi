Feature: FEAT-033 · Adopt explicit engineering standards
Card: fix

# Review brief 2: acceptance-win-cmd — confirmation round

Review only `git diff 456cd577..HEAD`. Lane CI failed (run 42443761512) in data-pack M6: once CI had cut releases containing the current templates, the fixture's `git commit -m next` had nothing to commit. The fix adds `--allow-empty`, and M6's assertions are unchanged. The builder's evidence shows the original failing at v0.6.51 and the fix passing at v0.6.51 and v0.6.48. Question: does M6 still prove "update from the previous release adds the pack", whichever release is latest? Bar as in round 1.
