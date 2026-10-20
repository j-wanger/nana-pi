# Independent check — realpath-strict-fallback at 9c16aca1 (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at 9c16aca1 and a base clone at aa5f25cd, in <tmp> Every probe used a temp HOME. The real files in ~/.claude, ~/.pi/agent and ~/.local/bin kept their mtimes. The worktree is still at 9c16aca1. Its only untracked files are the seat's two mutation files, which I did not write.

Must-meet tests
1. `node packages/nana-pack/tests/real-path.test.mjs` on the lane: `PASS R-2180`, `PASS R-2181`, `SUMMARY PASS=2 FAIL=0`. HOLDS.
2. `node packages/nana-setup/tests/realpath-fallback.test.mjs` on the lane: `PASS R-2182`, `PASS R-2183`, `PASS R-2184`, `SUMMARY PASS=3 FAIL=0`, 2.9 s. HOLDS.
3. The same two files on base: R-2180 fails (`injected EISDIR`) and R-2181 passes, as the plan says it should. R-2182 fails (`POSIX: doctor rows differ`). R-2183 fails (`[nana:install] INSTALL STALE: hook nana-objective.mjs, ...`). R-2184 fails (`failure uninstall exited 1`). The tests are red before the change. HOLDS.

Existing tests near the change, on the lane, run with `node --experimental-strip-types <file>`:
4. gate-rm-inside.test.mjs reports `all PASS`. land.test.mjs exits 0 with no FAIL lines. checkout-spelling.test.mjs gives `PASS=6 FAIL=0`. review-standard.test.mjs reports `all passed`. HOLDS.
5. `node scripts/code-map.mjs --check` reports `0 problem(s)`. `node scripts/readme-check.mjs` reports `721 claims checked; 0 problem(s)`. `requirements-moved --base aa5f25cd` lists R-2180 to R-2184 as new and implemented. HOLDS.

Probes beyond the must-meet tests
P1. Base against lane realPath on 13 ordinary macOS paths, each loose and strict, with the native lookup working (`node p2.mjs`). The paths: /tmp, a /VAR/Folders case variant, a link to a folder, a dangling link, a link to itself, a file used as a folder, a missing leaf, an NFD name, a chmod 000 parent, an exec-only parent, and <repo, upper case>.
   Output: `diffs=0`. The strict calls still throw `ENOENT`, `ELOOP`, `ENOTDIR` and `EACCES` where base throws. Nothing main does today changed. HOLDS.
P2. The gate's loose realPath under injected EISDIR, EIO, EPERM, EACCES and UNKNOWN, base against lane (`node p9.mjs`).
   Output: `25 cases, 0 differences`. The gate is unchanged. HOLDS.
P3. review-round `repoKeyOf` and nana-land's worktree compare, with native failing everywhere under the temp root (`node p4.mjs base|lane`).
   Base: `key(main) => THROW EISDIR`. Lane: `key(main)`, `key(wt)` and `key(MAIN case-variant)` all give `<P>/repo/.git`.
   Lane: `land wt compare case-variant => false`, so nana-land refuses a worktree spelled another way. Fail-closed is kept. HOLDS.
P4. nana-land `runLand` under the same failure, with seeded ledger records (`node p5.mjs`).
   Base: `code=1 refused: inj`.
   Lane with a LAND record plus a NO-GO record on the tip: `code=1 refused: non-LAND verdict record(s) for 628a1185...`.
   Lane with the LAND record only: `code=1 suite failed (exit 1)`, which is the `false` suite I supplied.
   The non-LAND check still blocks. No fail-open. HOLDS.
P5. Install under injected EISDIR in a home holding a legacy `context-size-check.sh` link.
   Base: `install exit=1 Error: injected native failure`, for both a link into the repo and a link outside it.
   Lane, link into the repo: `exit=0 ... unlinked repository-managed link`.
   Lane, link outside the repo: `exit=0`, and the link is still present.
   This also fixes the install throw that the plan's known limits name. HOLDS.
P6. A real `uninstall --yes` under injected EISDIR against a control run, each with a foreign rule link pointing outside the checkout.
   Both runs: `exit=0 unlinked=20 symlinks-left=1 foreign=kept`.
   The outputs are identical apart from the home folder name. Nothing extra was deleted. HOLDS.
P7. Install through the canonical spelling, then doctor and the stale-copy producer through a `/private/VAR/Folders` spelling, with the native lookup failing.
   Base: `✗ rows native-ok=1 failure/same=22 failure/second-spelling=22`.
   Lane: `native-ok=1 failure/same=1 failure/second-spelling=22`.
   The producer prints `INSTALL STALE` through the second spelling on both base and lane.
   The one ✗ in the native-ok column is the uninstalled `pi-subagents` package in the temp home. It is unrelated to this lane.
   This is the plan's documented residual. It is no worse than main. HOLDS.

Findings
- None at MUST level. No data was lost, no probe wrote outside its temp folder, install and the hooks still work, the gate and land tools still fail closed, and no main behaviour regressed.
- Known bug, already documented: with the native lookup failing, a second spelling of the checkout reads as another checkout. Doctor shows 22 ✗ rows and the stale-copy producer reports stale (P7). Main fails the same way.
- Known bug, unprobed: pi-review's out-path check in `realOut` compares git's `--show-toplevel` spelling with the typed `--out` spelling. On a volume where the native lookup fails, a case-variant `--out` inside the tree could read as outside it and skip the redirect into the temp checkout. Main refuses there today. This is inferred from the code at packages/nana-pack/bin/pi-review.mjs lines 74 and 171 to 175. I did not run it.
