# Independent check — checkout-spelling-converge at 29b83bf4 (2026-10-20)

VERDICT: HOLDS

Private copy: <tmp> (clone at 29b83bf4, main baseline clone at c7f582ad, temp HOMEs h1..h13, TMPDIR=$P/tmp). Probes ran on macOS APFS (case-insensitive), with a forced win32 run where noted. Below, $P is that folder. R is the on-disk spelling <tmp> A is the linked spelling $P/alias -> lane. C is the case spelling .../LANE. `ns` runs `node <root>/packages/nana-setup/bin/nana-setup.mjs <args> --home H` with HOME=H.

Tests (single files, TMPDIR under $P):
- `node packages/nana-setup/tests/checkout-converge.test.mjs`: PASS R-2200..R-2204, then `SUMMARY PASS=5 FAIL=0 SKIP=0`. HOLDS.
- Neighbouring files: settings-merge `exit=0 221 pass 0 fail`, uninstall `31/0`, retired-artifacts `47/0`, checkout-spelling `6/0`. HOLDS.
- skills-and-standards: `82 pass 6 fail` on the lane and `82 pass 6 fail` on main c7f582ad, the same 6 titles. Doctor exits 1 because `✗ pi pi-subagents not installed` in a temp home. This is the environment, not the lane.

Probes:
1. Fresh install, then a second install from R: `install1 exit=0`, `install2 exit=0`, 0 ✗ rows, `nothing to do — everything was already in place (2 skipped)`. HOLDS.
2. Home installed from R, then every link and the knowledge command rewritten to A, then installed from R:
   - Lane: `before: 20 links in alias spelling; knowledge alias=1`, then `lane install exit=0 problems=0`, then `after: alias links=0 ondisk links=20`, with 1 knowledge entry in the on-disk spelling.
   - Main, same home shape: `main after: alias links=4 knowledge alias=1`, `skill spec unchanged`, `knowledge pull unchanged already wired`.
   - The feature works, and main was red. HOLDS.
3. The same home shape with the case spelling C: `before: case links=20 knowledge case=1`, then `install exit=0 problems=0`, then `after: case links=0 ondisk=20 knowledge entries=1 case=0`. A reinstall gives `exit=0 nothing to do`. HOLDS.
4. The four newly managed links point at the other copy ($P/main skills): `exit=1`, four rows `✗ skill spec|py-lint|py-review|py-test problem foreign link at … — left untouched`, and `4 link texts byte-identical`. HOLDS.
5. `install --dry-run` on the A-spelled home: `dry exit=0`, `home byte-identical` (shasum of links and files before and after), `skill spec updated would relink (was …/alias/…)`. HOLDS.
6. The uninstall home holds a knowledge entry respelled to A, a foreign `echo foreign-hook` and a respelled copy with statusMessage "mine":
   - `uninstall --dry-run`: `settings unchanged by dry run`, `would remove: … UserPromptSubmit knowledge pull`, and one variant row, for the "mine" entry only.
   - `uninstall --yes`: `exit=0`, `removed: … UserPromptSubmit knowledge pull`. Left behind: `{"command":"echo foreign-hook"}` and the "mine" entry.
   - Main on the same shape (probe 10): `main uninstall exit=0 knowledge-left=1` plus a variant row. Main was red. HOLDS.
7. The settings hold both the exact entry and an A-respelled duplicate, then install: `install exit=0`, `knowledge pull created added`, `after entries=2 alias=0 distinct=1`. Doctor shows `✓ settings UserPromptSubmit knowledge pull`. No harm (see the first known bug).
8. Newly managed links in three shapes:
   - spec dangling to $P/gone: `exit=1`, `✗ skill spec problem foreign link … — left untouched`, text kept. HOLDS.
   - py-test as a relative link through alias: `relinked (was $P/alias/…/py-test)` to on-disk. HOLDS.
9. Forced win32 (NANA_SETUP_PLATFORM=win32): each checkout installs a home, the home is respelled to its link, and that checkout reinstalls. Both lane and main show `first exit=0 second exit=0 alias-in-settings=6`, then `win32 settings identical lane vs main` and `win32 install rows identical lane vs main`. Windows is unchanged, as the README declares. HOLDS.
10. The knowledge entry names the other copy (R-1056 path), on the lane and on main: both show `exit=0 row=[+ … knowledge pull created added] now-points-to-own=1`. Same as main. HOLDS.
11. A relative newly managed link under a canonical home (R-665 shape): `exit=0 row=[· skill py-lint unchanged] text=../../../lane/packages/nana-pack/skills/py-lint`. HOLDS.
12. Write containment:
   - The lane clone is clean after all runs: `git status --porcelain` gives 0 lines.
   - Test temp folders were removed; only a node-compile cache is left in $P/tmp.
   - The worktree is still at tip 29b83bf4. Its only untracked file is the seat's `docs/reviews/checkout-spelling-converge-2026-10-20/seat-mutate.mjs`, which I did not create.
   - HOLDS.

Findings (none MUST):
- Known bug, low. Probe 7: when the settings already hold the exact entry, the respelled duplicate is rewritten into a second identical entry, reported as `created added`. Main kept two entries that differed only in spelling, so the entry count does not grow. Uninstall removes both entries. I infer, but did not verify here, that Claude Code dedupes identical hook commands.
- Out of scope, not a finding. In probe 8, when the home is reached through a link (/var to /private/var), a relative newly managed link that resolves into this checkout is now rewritten to the absolute on-disk path. Main kept its text. Under a canonical home the text is kept (probe 11), and the plan excludes the home folder's own spelling.
- Pre-existing, not this lane. Dry-run prints `created added` for a knowledge rewrite rather than a "would" form; main c7f582ad prints the same.
