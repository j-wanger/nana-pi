# lane-guard-temp-root — plan attack (one adversary)

Verdict: AMEND

AMEND. The design holds, and its core tests are red today. I fixed row conflicts, one row wider than its test, and one gap in the TMP test. Probes ran on main 72abe19a in a throwaway clone with a temp home, one run per case. I removed the clone afterwards, and nothing leaked into the real home or the filesystem root.

What I confirmed by probe (macOS):
- The plan's gate change plus its tests give 16 pass and 1 skip through the runner. R-2273 adds a second skip off Windows.
- With main's gate, R-2270 and R-2271 FAIL. R-2272 passes, which is expected.
- Wrong-code pairs:
  - P1 (drop the home clause): R-2271 red.
  - P2 (drop the root clause): green on macOS, as declared.
  - P3 (home test both directions): R-2272 and R-1431 red.
  - P3b (inverted): R-2271, R-2272 and R-1431 red.
  - P4 (equality only): R-2271 red.
  - P5 (unresolved strings): R-2271 red.
  - P8 (worktree-ancestor clause): R-962 "temporary output remains allowed" and R-1431 red.
- map:check stays green, so the code map is untouched.
- Empty HOME is not a new gap. Main's gate already blocks every gated tool when HOME is empty, because the agent folder cannot be resolved.

Amendments:
1. **R-2270 and R-2273 contradicted each other.** R-2270 said to refuse everything under the root outside the lane and /tmp. R-2273's own case (TEMP set to the drive root, TMP set to a folder B) requires the B file to be allowed. R-2270 and R-2271 now read "unless the lane folder or another temporary root the gate counts holds it".
2. **R-2270 to R-2272 were wider than their tests.** Each claimed the TMP folder alone, but each test sets TEMP and TMP to the same value. They now say only "the OS temp folder". R-2273 carries the TMP clause.
3. **R-2273's test never checked TMP set to the home folder.** I added that sub-case. I ran a macOS simulation, with a patched gate reading TMP and TMPDIR standing in for TEMP:
   - main: 3 sub-cases red
   - P6 (never read TMP): 2 red
   - P7 (TMP without the rule): 2 red, including the new home case
   - the planned design: all green
4. **R-1430 contradicted R-2273.** It refuses the Windows \tmp folder when it lies "outside the lane folder and the OS temp folder", but a TMP pointing there would count. Its text is narrowed; its test is unchanged.
5. **R-2272's "only check that catches P3" claim was too strong.** With home set to homeFixture, R-1431 also catches P3 on macOS (probed), and on Windows by inference. R-2272 is still the only catch on Linux, where R-1431 skips. Kept.
6. Known limits gain the firmlink case (inferred, not probed). The empty-HOME case is not listed, since main already blocks there.

Conflicts and land order:
- **rm-outside-asks** also edits packages/nana-pack/extensions/nana-gate.ts.
  - This lane changes only laneWriteHit, about lines 203–215. The rm path is at line 132 and in lib/gate-rm-inside.ts, which has no temp-root logic (checked).
  - In the pack README, this lane changes the lane-launch paragraph at line 260. The rm text sits near lines 630–660. The rm rows sit at REQUIREMENTS.md lines 703+, in another feature.
  - I expect a clean text merge. That is inferred: I have not seen its plan.
  - If rm-outside-asks exempts temp folders, it should reuse this lane's rule, so land this lane first.
- **win-pi-launch-orphan** and **review-ledger-run-win-launch** share only the generated docs/requirements-tree.md, plus possible FEAT-006 row adjacency in REQUIREMENTS.md. Fix either by merging main and running npm run req:tree, never by hand-merging.
- **Other slate lanes:** no shared files.
- **Land order:** review-ledger-run-win-launch, then this lane, then rm-outside-asks.
- **Install check:** not required. The install check never sets NANA_WORKTREE_ROOT, so it cannot reach laneWriteHit.

Claim most likely wrong: that the rm-outside-asks lane neither touches laneWriteHit nor treats temp folders as safe for rm. It is inferred from the slate summary. If it does either, it must take this lane's rule. Second candidate: that fs.realpathSync.native returns a Windows drive root as "D:\\" with its backslash, and that the Windows runner has a D: drive. The record says CI's checkout and temp folder sit on different drives. A wrong guess would make R-2270 fail loudly on the Windows leg, not pass silently.
