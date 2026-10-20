# Independent check — setup-checkout-spelling at 6bf3c850 (2026-10-20)

VERDICT: HOLDS

I checked tip 6bf3c850 in a private clone at <tmp>. Every home was a temp home. Here `x` is a git clone that switches between main 6bc2f727 and the lane. `X` is the same folder with the case swapped, reached on case-insensitive APFS. I edited no repository. The worktree's only untracked file is the seat's seat-mutate.mjs, which I did not create.

Must-meet tests
- `TMPDIR=$P/tmp HOME=$P/home node packages/nana-setup/tests/checkout-spelling.test.mjs`
  - Output: case spelling found; R-1980 through R-1985 PASS; `SUMMARY PASS=6 FAIL=0 SKIP=0`. Nothing was written to the parent HOME (0 entries).
  - Verdict: holds.

Probes
1. Upgrade from main to the lane with no change of spelling. Main ran install and doctor, then the lane ran install.
   - Output: `lane install exit 0`, `HOME BYTE-IDENTICAL (45 entries)`, `doctor labels+status identical main vs lane`.
   - The only ✗ in either run was `pi pi-subagents not installed`, which is a temp-home artifact.
   - An earlier run showed the knowledge index's `-shm`/`-wal` files appearing. Doctor opening the index creates them, not the lane.
   - Verdict: holds.
2. Main installed through `/X`, then the lane ran doctor, the stale-copy producer and install through `/x`.
   - Output: `lane doctor ✗rows=1` (pi-subagents only), stale producer silent with exit 0, `lane install exit 0`.
   - Install relinked the hook links (`updated relinked (was .../X/...)`) and rewrote the knowledge hook command to `/x`.
   - `second install byte-identical`.
   - Skill links keep their `/X` target, which matches the design.
   - Verdict: holds.
3. The same setup forced to win32 (`NANA_SETUP_PLATFORM=win32`).
   - Output: doctor showed `✗=5` before install: the four disclosed `PATH pi-review/pi-worker/nana-land/nana-setup missing or stale` rows plus pi-subagents.
   - `lane win32 install exit 0; updated rows=4; backups=8`, then `second win32 install byte-identical`, then `after converge ✗=1`.
   - Verdict: holds, as disclosed.
4. The stale-copy producer, forced win32, on a home main wrote through `/X`, before install catches up.
   - Output: the lane printed nothing (`exit 0`).
   - Main printed `[nana:install] INSTALL STALE: settings SessionStart objective, ... adoption, ... shared-memory, ...`.
   - Verdict: holds, and fixes a false alarm on main.
5. The rulings extension's stale check (`linkOk`), with the module imported through `/X`.
   - Output: `pkgRoot= .../x/packages/nana-setup` and `linkOk(canonical link, /X source)= true`.
   - Verdict: holds.
6. `install --dry-run` through `/X` on a home installed through `/x`.
   - Output: `exit 0; would-rows=0` and `home unchanged`.
   - Verdict: holds.
7. A real `uninstall --yes` on a home installed with no change of spelling, main against the lane.
   - Output: both runs `exit 0 links=0 files=2`, with identical residue trees.
   - The output differed only in the temp-home path on one line.
   - Verdict: holds, no regression.
8. A checkout folder named `café`: installed through the NFC spelling, doctor run through the NFD spelling.
   - Output: main gave `NFC ✗=1 NFD ✗=22 differing rows=22`. The lane gave `NFC ✗=1 NFD ✗=1 differing rows=0`.
   - Verdict: holds, and it also fixes the Unicode-form variant.
9. A checkout reached through a symlink (`ln -s x lnk`).
   - Output: `via link ✗=1 differing=0`, `install via link exit 0`, `home unchanged by install via link`.
   - Verdict: holds.
10. A git clone whose pi `packages` entries are spelled through `/X`, checked with doctor through `/x`.
    - Output: main gave `✓ pi packages` and `✗ pi package source`. The lane gave `✓ pi packages` and `✓ pi package source`.
    - Verdict: holds.

Findings
1. Known bug, disclosed, not a MUST. Uninstall no longer removes a knowledge hook entry that an earlier install wrote through another spelling.
   - Command: main install through `/X`, then `git checkout 6bf3c850`, then `nana-setup uninstall --yes` through `/X`.
   - Main's result: `knowledge entries left: 0`.
   - The lane's result: `– settings hook variant skipped left — NODE_NO_WARNINGS=1 node '.../X/packages/nana-knowledge/bin/nana-knowledge.ts' hook` and `knowledge entries left: 1`.
   - Impact: the Claude Code UserPromptSubmit hook keeps firing after uninstall. Uninstall names it, and no data is lost.
   - It only happens after an install through a non-on-disk spelling followed by uninstall with no install in between. Uninstall refuses on Windows, so it is POSIX only.
   - The plan's Known limits and the README already list it as a "small regression". It belongs in HANDOFF residuals.

Not verified here
- The Windows-only cases are untested on this machine: a lowercase drive letter, 8.3 short names, and subst or mapped drives. On a mapped drive the native realpath may return a UNC path; that is inferred, not observed. The plan defers these to the Windows CI leg.
- I did not run install-check.mjs. The seat runs it before nana-land.