# Independent check — gate-rm-bare-repo at cc81b85a (2026-10-20)

VERDICT: HOLDS

Setup: a private clone at cc81b85a and a main checkout at c203f485, both in a mktemp folder with a temp HOME and TMPDIR. Both were deleted at the end. The source worktree tip is still cc81b85a. Its only untracked files are the seat's mutation files (seat-mutate.mjs and seat-mutate-output-cc81b85a.txt), which I did not write.

Must-meet and adjacent files, each run as a single file:
- `node --experimental-strip-types tests/gate-rm-inside.test.mjs` printed 11 PASS and "all PASS". This covers R-2240 to R-2243 and R-1490 to R-1496. Verdict: holds.
- The same lane test file run against main's module, in the private copy, printed two FAIL lines (R-2240 and R-2241) and two PASS lines (R-2242 and R-2243), then "FAILED 2". The pins are red on main as the plan claims. Verdict: holds.
- gate-corpus printed "all PASS". gate-survives-mutation had 38 PASS and 0 FAIL. gate-status had 23 PASS and 0 FAIL. config-gate-fallback had 38 PASS and 0 FAIL. All four exited 0. Verdict: holds.
- After the runs, `ls -A $P/tmp | wc -l` printed 0. tmpDir removed git's read-only object files, and no gate-rm-inside-* roots were left in the real TMPDIR. Verdict: no writes outside temp.
- `code-map.mjs --check` reported "0 problem(s)" and `readme-check.mjs` reported "721 claims checked; 0 problem(s)". Verdict: holds.

Probes beyond the must-meet tests. Each line shows main's result, then the lane's, from rmInsideCwd (true means it runs unasked).
1. Ordinary use on fresh fixtures. All runs unasked, as before. Verdict: no regression.
   - `repo/src: rm -rf build`: main=true, lane=true
   - `plain/app: rm -rf build node_modules`: main=true, lane=true
   - `sep` (a `--separate-git-dir` checkout): `rm -rf build`: main=true, lane=true
   - `outwt` (a worktree added outside the bare repository): `rm -rf build`: main=true, lane=true
2. The real repositories on this machine, checked read-only (nothing was deleted). Verdict: no over-ask.
   - `<repo>/packages/nana-pack: rm -rf zz-none`: main=true, lane=true
   - `<worktrees>/gate-rm-bare-repo: rm -rf zz-none`: main=true, lane=true
3. A bare mirror inside a normal repository, `repo/vendor/mirror.git`. Verdict: all now ask, as intended.
   - `rm -rf vendor/mirror.git`: true, then false
   - `rm -rf vendor/mirror.git/objects`: true, then false
   - `rm -rf build vendor//mirror.git/`: true, then false
   - cwd `vendor/mirror.git/hooks`, `rm -rf tmp`: true, then false
4. Case and link spellings on macOS. Verdict: holds on a case-folding filesystem and through a cwd link.
   - `rm -rf VENDOR/MIRROR.GIT`: true, then false
   - cwd `PROJ.GIT` (exists through case folding), `rm -rf objects`: lane=false
   - cwd `projlink`, a symlink to the bare repository, `rm -rf objects`: true, then false
5. A worktree two levels deep in a bare clone (`proj.git/trees/feat`). Verdict: the worktree keeps the exemption, and the bare repository's own cwd asks.
   - cwd `trees/feat`, `rm -rf build`: true, true
   - cwd `proj.git`, `rm -rf trees/feat/build`: true, then false. This is the README's declared over-ask.
   - cwd `trees`, `rm -rf feat`: false, false. The `.git` file already made it ask.
6. Declared residuals behave as the README states. Verdict: the README is accurate.
   - `repo: rm -rf vendor` (a bare repository below the target): true, true
   - cwd `legacy` with a symlinked HEAD, `rm -rf x`: true, true
7. Through the real handler, headless and interactive:
   - `repo` `rm -rf vendor/mirror.git` gave BLOCK/0 dialogs headless and BLOCK/1 dialog interactive.
   - `projlink` `rm -rf objects` gave BLOCK/0 headless and BLOCK/1 interactive.
   - `trees/feat` `rm -rf build` gave ALLOW/0 both ways.
   - `plain/app` `rm -rf build` gave ALLOW/0 both ways.
   - Verdict: holds.
8. A sweep of 202 cases: every folder in the fixtures as cwd, against every target below it up to three levels, plus a missing target.
   - Output: `lane-allows-main-asked=0 lane-asks-main-allowed=140 of-which-not-under-a-bare-repo=0`.
   - Verdict: there is no fail-open. The new asks all sit under a bare repository. The code agrees: the change adds only `return false` paths and a `break` that leaves only the new loop.
9. A cwd under a folder set to chmod 000, `rm -rf build`: main=false, lane=false. Verdict: same verdict, and the lane does not throw.
10. Cost of 2000 calls from a cwd 30 folders deep: main took 454 ms and the lane 3422 ms, about 1.5 ms more per rm. Verdict: negligible for a gate.
11. Windows CI run 39414069623 on cc81b85a: all five jobs succeeded. The Windows suite leg log reads `PASS packages/nana-pack/tests/gate-rm-inside.test.mjs 11 pass 4.8s`, with no skip. Verdict: the plan's inferred Git for Windows shape is now confirmed.

Findings: none at MUST level, and no new known bug. Every residual I hit is already declared in the README and the must-meet plan:
- a bare repository below a target runs unasked
- a symlinked HEAD is not recognised
- a plain folder inside a bare repository over-asks
- every rm costs a walk to the filesystem root

On Windows, only CI was checked. No code in this module forces win32 paths, so no local win32 probe applied.

Files:
- <worktrees>/gate-rm-bare-repo/packages/nana-pack/lib/gate-rm-inside.ts
- <worktrees>/gate-rm-bare-repo/packages/nana-pack/tests/gate-rm-inside.test.mjs
- <worktrees>/gate-rm-bare-repo/docs/reviews/gate-rm-bare-repo-2026-10-20/must-meet.md
