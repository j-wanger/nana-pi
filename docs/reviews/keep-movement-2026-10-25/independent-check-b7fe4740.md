MATERIAL: none

# Independent check: keep-movement at b7fe4740

Checker: one independent check, did not build the lane. Worktree ~/nana-pi-wt/keep-movement at b7fe4740 (clean except the seat's untracked seat-mutate.mjs, present before this check). Nothing was edited, committed or pushed there or in ~/nana-pi.

Scratch: <scratch>/km-indep/
Every run: HOME=USERPROFILE=km-indep/home, PI_CODING_AGENT_DIR=km-indep/pi-agent, GIT_* unset. Binary: the worktree's packages/nana-pack/bin/review-ledger.mjs (except the broken-copy runs). Env and helpers: km-indep/env.sh. Comparison script: km-indep/compare.mjs (imports reviewMovementSection and notComputedReason from the given pack's lib/review-movement.mjs; runs that pack's scripts/requirements-moved.mjs with stdout to a file, wraps it as claude-review.test.mjs:324/331 do; compares the kept file byte for byte with both).

Real ledger untouched: ~/.pi/agent/review-ledger.rounds.jsonl mtime/size 1792961298/560927 before and after; zero km-indep lines in either real ledger file. The scratch ledger landed under km-indep/home/.pi/agent.

## 1. Rounds recorded

`node $RL run --item <item> --role reviewer --out out/<item>-reviewer.md -- node -e 'process.stdout.write("Review text\nVERDICT: LAND\n")'` from inside each repo.
- clone (git clone --no-hardlinks ~/nana-pi, branch feat/x at 36af3dda): km-a, exit 0, round 1, kept text sha256 1372e4b2..., 26 bytes.
- plain repo (one committed a.txt, untracked REQUIREMENTS.md copy): km-p, exit 0.
- nomain clone (branch lane, local main deleted, origin/main remains): km-n, exit 0.

## 2. Clone with a ledger (R-2910, R-2913 case 1)

| run | HEAD | exit | stdout | stderr lines | file | eq helper | eq wrapped report |
|---|---|---|---|---|---|---|---|
| keep km-a, cwd outside, --repo clone, --into new folder | 36af3dd (= main) | 0 | `kept 1 review text(s) and tree-movement.md for km-a in ...` | 0 | 97 B, `tree movement: none` | yes | yes |
| keep km-none (no round) | 36af3dd | 0 | `kept 0 review text(s) and tree-movement.md for km-none in ...` | 0 | 97 B, only file in folder | yes | yes |
| commit R-2576 implemented->violated + new R-2914; keep km-a | 116e734 | 0 | `kept 1 ... and tree-movement.md ...` | 0 | 240 B, first report line `tree movement 36af3dd..116e734: 2 rows in 1 features`, one `## Tree movement` | yes | yes |
| keep km-none again | 116e734 | 0 | `kept 0 ... and tree-movement.md ...` | 0 | 240 B | yes | yes |
| uncommitted R-2915 added to working ledger; keep km-a | 116e734 | 0 | same | 0 | 240 B, 0 occurrences of R-2915 | yes | yes |
| 3,000 added rows committed (feat/big); keep km-a | 0cd8d08 | 0 | same | 0 | 72,243 B, `3002 rows in 1 features`, one heading | yes | yes |
| back on feat/x; keep km-a | 116e734 | 0 | same | 0 | 240 B (shrunk; no tail left from the 72 KB copy) | yes | yes |

The review text r1-reviewer-1372e4b2.md stayed byte-identical (sha256 matches the store and the --out file) across every re-keep. No CR byte, no trailing newline in any movement file. `--into` folders that did not exist were created (mkdirSync recursive runs even with zero review texts). Also: keep with no --repo and cwd inside the clone, and keep with relative `--repo clone --into rel-into` from the scratch root, both exit 0 and write a file equal to helper and wrapped report.

## 3. Plain repository, no committed ledger, untracked REQUIREMENTS.md (R-2911, R-2913 case 2)

- keep km-p: exit 0; stdout `kept 1 review text(s) for km-p in ...` (no movement name); stderr empty; folder holds only r1-reviewer-1372e4b2.md.
- keep km-none: exit 1; stderr one line `review-ledger: item km-none in this repository has no kept text`; --into folder not created.

## 4. Clone with no local main (R-2912 case 1, R-2913 case 2)

- keep km-n into a folder holding an older tree-movement.md ("OLD"): exit 0; stdout `kept 1 review text(s) for km-n in ...`; stderr exactly one line `review-ledger: WARNING: tree-movement.md not written: could not find a merge base for 'main' and HEAD: fatal: Not a valid object name main`. The review text was kept. The old file stays as "OLD" (the plan's known limit).
- keep km-n into a fresh folder: same exit, stdout and one warning; no movement file. compare.mjs: helper's notComputedReason equals the script's first stderr line; helper equals the wrapped report.
- keep km-none: exit 1; stderr two lines, the warning then `... has no kept text`; folder not created. R-2913 case 2 only requires `/no kept text/`, which holds.

## 5. Broken pack copy (R-2912, crash reason, no leak)

Copied the worktree (no .git) to km-indep/pack-copy and prepended `throw new Error("independent-check crash at import");` to its scripts/requirements-moved.mjs. A second copy of packages/ and scripts/ was placed under the scratch home at `home/pack copy/` (with a space), so the crash line names a home path.
- pack-copy keep km-a in the clone: exit 0; stdout `kept 1 review text(s) for km-a ...`; one warning naming `file:///.../km-indep/pack-copy/scripts/requirements-moved.mjs:2`; folder holds only the review text.
- home copy keep km-a: exit 0; one warning naming `file:///.../km-indep/home/pack%20copy/scripts/requirements-moved.mjs:2`; no movement file. The path with a space resolved and ran (the crash came from that copy).
- home copy keep km-none: exit 1; the warning plus `no kept text`; no folder.
- home copy keep into a folder already holding a good 240 B movement: exit 0, one warning, earlier file kept unchanged (known limit).
The crash text reaches stderr only, never a file.

## 6. Write failures (R-2912 case 2) and refusals (R-2574)

- Empty directory at tree-movement.md: exit 0, review text kept, one warning `not a regular file`, directory still empty.
- Symlink at tree-movement.md to an outside file: exit 0, one warning, link target unchanged ("target").
- Dangling symlink at the name: exit 0, one warning, nothing created at the link's target.
- Differing bytes under r1-reviewer-1372e4b2.md: exit 1, one line `... holds different bytes; wrote nothing`; folder still holds one file; differing file unchanged; no movement file.
- --into is a regular file: exit 1, `is not a regular directory`.
- --repo naming a subfolder (clone/packages): exit 0, review text kept, no movement file and no message (the plan's inferred known limit, now observed).

## 7. Leak grep over every file keep wrote

`grep -rlF` over km-indep/into-* and rel-into for: the scratch home path, the clone path, the nomain path, the plain path, the pack-copy path, `~`, the scratch root, `pack%20copy`, `file://`. Result: no matches. Files keep wrote: review texts (26 B each) and tree-movement.md copies (97, 240 or 72,243 B). The planted directory, symlinks, "OLD", "different" and into-file are fixtures, not keep output.

## 8. Lane tests in the scratch env

`node packages/nana-pack/tests/keep-movement.test.mjs`: 6 PASS (R-2910, R-2911, R-2912, R-2913, R-2574, seal), 6.3 s. `review-movement.test.mjs`: R-2905 and seal PASS. The worktree's status was unchanged after the runs.

## 9. Windows by reading

- Paths: keep uses `resolve(intoArg)` and `join(into, KEEP_MOVEMENT_FILE_NAME)`; the helper runs `process.execPath` with argv, no shell, and `fileURLToPath(MOVEMENT_SCRIPT_URL)`. Spaces resolve (shown on macOS with "pack copy"). No string-built path separators.
- CRLF: the section joins with `\n`; the report's trailing `[\r\n]+` is stripped; Node's console.log writes `\n` on win32; the ledger comes from `git show`, so a CRLF checkout does not reach the report. The stderr reason splits on `\r?\n`. `.gitattributes` holds `* text=auto eol=lf`.
- Missing --into: lstat ENOENT is tolerated, then `mkdirSync(into, { recursive: true })` runs before both writes, including the zero-text case (shown on macOS).
- A locked file on Windows (EBUSY or EPERM on the movement write) lands in the catch and warns with the error code; it does not call die. Not run on Windows.

## Findings

- NOTE 1: a not-computed movement prints its warning before keep's refusals and its no-text exit, so those stderr outputs carry two lines (sections 4 and 5). Exits and writes are right; R-2913 case 2 matches only `/no kept text/`.
- NOTE 2: tree-movement.md is written with the default mode (0644 here) while review texts use 0600. It holds no secret and gets committed, so this is harmless.
- NOTE 3: the --repo subfolder case keeps review texts but writes no movement and says nothing. It is already a plan known limit; it is now observed, no longer only inferred.
- NOTE 4: the large case reached 72 KB, not the plan's 81 KB. maxBuffer is 16 MiB, so the gap is immaterial.

No MATERIAL finding. Every R-2910 to R-2913 exit, stderr line count and count-line form held. Every written movement file equals both the helper's section and the wrapped file-written report for its HEAD. No keep was refused over the movement, and no written file leaked a path.
