# W7c must-meet design: the land and review tools treat two spellings of one folder as the same folder (gate lane)

Status: READY. I left the nana-pi tree clean at 2eb0cb8 and did all work in the scratchpad. Proposed rows are R-1350 to R-1356, all free by grep.

I tested the design on this Mac before writing it:
- **Prototype:** `gpprobe/pack/` holds the fix applied to a scratch copy of the pack.
- **Probes:** `gpprobe/probe.mjs` and `gpprobe/probe4b.mjs` run each must-meet scenario against the current code and against the prototype.
- **Mutations:** `gpprobe/mut.py` applies the 13 wrong-code reverts.
- **Results:**
  - Every must-meet scenario below fails today and passes on the prototype.
  - Each of the 13 single-site reverts turns at least one scenario red.
  - On macOS, review-ledger, immutable-review, land, review-round and worker-lane give the same check-by-check results before and after the fix: 155, 17, 51, 33 and 52 checks.
  - The land file's one failure, the README/AGENTS check, happens in both copies and comes from the scratch layout.

(`gpprobe/` = `<seat-scratch>/gpprobe/`)

## 1. The canonical-path function

**Module:** a new `packages/nana-pack/lib/real-path.mjs`, with the six-tag header (effects: disk reads). It exports `realPath(p, { mustExist = false } = {})`:
- It returns `fs.realpathSync.native(path.resolve(p))` on every platform.
- **Missing path (ENOENT or ENOTDIR):**
  - with `mustExist`, it throws, as `realpathSync` does today;
  - otherwise it canonicalizes the deepest folder that exists and appends the rest unchanged.
- **Any other native error:** it returns `fs.realpathSync(abs)`, which is today's result.
  - This keeps volumes where Windows' native resolver fails (some RAM disks and file systems; inferred) working as they do now.
  - No test can reach this branch, so it ships untested.
- **No `\\?\` strip code.** I infer that libuv already removes the prefix. A Windows-only spelling in GP1 measures this. If that check fails on Windows CI, the builder adds a one-line strip and that check becomes its pin.
- **No case folding.** Native already returns the case on disk. Folding would change every Windows ledger key once and orphan existing LAND records.

**One key builder,** exported from `review-round.mjs`:
`export const repoKeyOf = (tree, common) => \`git:${realPath(resolve(tree, common), { mustExist: true })}\`;`
The ledger key in review-round (R2), nana-land's key and common-dir check (N1/N2) and the report's key (L1) all call this function. They must move together, and now they cannot drift apart.

**Why native everywhere:**
- Git's output is already the spelling on disk:
  - the macOS probe shows this for case and for NFD names;
  - the Windows CI logs show it for the long form.
- Native realpath returns that same spelling:
  - `~/Nana-Pi` → `<repo>`;
  - an NFC-typed `Café` → the NFD name on disk, which matches git.
- JS `realpathSync` keeps the typed case, NFC form, 8.3 short name and drive-letter case.
- Prior art: `mutation-runner.mjs:168,187,377`, `adoption.mjs:67` and `nana-handoff.ts:173` already use native.

**What changes on macOS:**
- Paths that come from the cwd or from git are unchanged; `process.cwd()` and git already print the canonical form.
- An absolute path typed in the wrong case or in NFC now matches.
- `/tmp` and `/var` links resolve exactly as before.

**Persisted keys:**
- **macOS:** a key changes only where `--tree` or the cwd was typed in a non-canonical spelling. Those are exactly today's split keys.
  - This Mac has 9 keys, and the inventory found every one already equals its native form.
  - Nothing is orphaned here.
- **Windows, pi-review keys:** unchanged. pi-review admits on a linked worktree, so the key is git's absolute long path. This assumes git prints an uppercase drive letter, which is inferred.
- **Windows, review-ledger run/check keys:** keys written from a main checkout entered through an 8.3, lowercase-drive or wrongly cased cwd change once. The cost:
  - That item's split-key rounds stop counting, so it gets up to 3 rounds back, once.
  - A LAND recorded under the old key no longer authorises a land. It refuses and needs a re-review.
  - A non-LAND verdict under the old key stays invisible, exactly as today. Nothing new opens.
- **Reservations:** one in flight under a split key at upgrade time is not seen. The window is one review.
- **README contract:** `packages/nana-pack/README.md:98` changes "the realpath of the git common dir" to "the native real path (the folder's spelling on disk: case, long names) of the git common dir, so two spellings of one folder share the item".

## 2. Sites to change

| Site | Change |
|---|---|
| review-round.mjs:163 (R2) | `repo: repoKeyOf(tree, common)` |
| review-round.mjs:208 (R3; also covers P1 :70 and P8 :164) | `exclude.map((x) => relUnder(root, realOut(x)))` |
| review-round.mjs:250 realOut (R6, and every realOut caller) | `try { return realPath(p, { mustExist: true }); } catch …` (the rest of its walk is unchanged) |
| nana-land.mjs:71 + :78 (N1, N2) | `const repo = repoKeyOf(tree, treeCommon); if (repo !== repoKeyOf(main, mainCommon)) throw …`, then delete the old :78 |
| nana-land.mjs:148 (N3) | `realPath(worktree, {mustExist:true}) !== realPath(registeredPath, {mustExist:true})` |
| review-ledger.mjs:51 (L1) | `repo = repoKeyOf(resolved, git.stdout.trim())` |
| pi-review.mjs:89-91 (P3) | `canonicalPath = realPath(path)`; `relative(realPath(tmpdir()), canonicalPath)` |
| pi-review.mjs after :157 add, and :118 (P5) | `tempRootReal = realPath(tempRoot, {mustExist:true})` right after a successful add; the check becomes `.some((l) => l.startsWith('worktree ') && realPath(l.slice(9)) === (tempRootReal ?? realPath(tempRoot)))` |
| pi-review.mjs:159-161 (P7, P6) | `const outReal = realOut(outPath); const outputRelative = relative(sourceRoot, outReal);` and pass `outReal` (not `outPath`) to copySnapshot |

**Left unchanged:**
- R1 :161 and P2 :72: git's top is already canonical, so a change would be a no-op with no wrong-code pair.
- N4 :166 and P4: no harm today.
- pi-worker W1 and W2: pi-worker already uses native on win32 under R-1125, and the POSIX cwd is canonical.
- The P3/P7 `isAbsolute` gap: see the limits below.

## 3. Must-meet tests

All go in one new file, `packages/nana-pack/tests/path-spelling.test.mjs`, so they run on Windows from the start and none of the other files' hidden faults can mask them. The file:
- has the six-tag header and uses static imports only;
- on win32 uses `writeFakePi` from lane 1's `tests/fake-pi.mjs`, and on POSIX a `#!/bin/sh` stub;
- the fake prints `VERDICT: LAND` and writes the entries of its cwd to `$OBSERVE`;
- joins PATH with `path.delimiter` and uses a temp HOME/USERPROFILE;
- runs `git config core.autocrlf false` in every repo before the first commit;
- gives folders long names with letters, such as `Spelling-Tracked-Repo`.

**The spelling helper, `otherSpellings(canonical)`** (`canonical` = native realpath of a folder the test made). It builds each second spelling explicitly instead of relying on the runner's TEMP:
- **case:** flip the letter case of the last folder name; on win32 also flip the drive letter (the win32-launch.test.mjs:319-321 pattern).
  - Used only when `existsSync(flipped)`.
  - Otherwise it prints `SKIP <check> (case): this volume is case-sensitive`.
- **8.3** (win32): the FileSystemObject ShortPath (win32-launch.test.mjs:324).
  - Used only when it differs from the long path, ignoring case.
  - Otherwise it prints `SKIP <check> (8.3): this volume keeps no 8.3 short name`.
- **link:** a symlink on POSIX or a junction on win32 pointing at the parent folder, plus the folder's name.
- **namespaced** (win32, GP1 only): `\\?\` + canonical.

Each check runs every available spelling and passes only if all of them pass. Its detail prints the kind and both paths.

**GP1 (R-1350).** A tracked `--out` reached through another spelling is refused.
- **Setup:** a repo with tracked `tracked.md` holding `keep\n`.
- **Runs, for each spelling S:**
  - `review-ledger run --out <S>/tracked.md -- node -e "console.log('VERDICT: LAND')"`
  - `review-ledger check --out <S>/tracked.md`
  - `pi-review --out <S>/tracked.md`
- **Pinned behaviour:**
  - each exits 1 with `/TRACKED file/`;
  - the file is byte-identical;
  - there is no tally row, an empty reservations folder and no `nana-review-` registration;
  - the fake pi never started.
- **Row:** "WHEN `--out` names a tracked file of the reviewed tree through a second spelling of a folder on its path (another letter case, an 8.3 short name, a link or a `\\?\` prefix), review-ledger run, review-ledger check and pi-review shall refuse it before the review runs, leaving the file byte-identical and nothing reserved or counted."
- **Fails without the fix:** realOut keeps the typed spelling, so relUnder says "outside".
  - Probe today: exit 1 (an unverified completion), and the file now holds `"VERDICT: LAND\n"`.
  - Mutation M8 brings this back.

**GP2 (R-1351).** An untracked in-tree `--out` reached through another spelling warns, runs and is excluded.
- **Setup:** a clean repo at HEAD H, plus an untracked `review-out.md` holding `old output\n`.
- **Runs, for each spelling S:** `pi-review --out <S>/review-out.md`, with TMPDIR/TEMP/TMP also set to the other spelling of a test temp folder; and `review-ledger run --out <S>/review-out.md`.
- **Pinned behaviour:**
  - exit 0, and stderr matches `WARNING: --out .* inside the reviewed tree`;
  - the tally revision is exactly H, with no `+snap` and not unverified;
  - the fake pi's cwd listing does not contain `review-out.md`.
- **Row:** "WHEN `--out` names an untracked, non-ignored file inside the reviewed tree through a second spelling of a folder on its path, pi-review and review-ledger run shall warn that it is in the tree, run the review and leave the file out of the review's snapshot, so a tree otherwise equal to HEAD records the bare HEAD sha, and pi-review shall leave the file out of the review checkout."
- **Fails without the fix:** probe today gives no warning, a `+snap` revision, and the checkout saw the old output.
  - M7 and M11 give pi-review exit 1, "dirty snapshot could not be reproduced".
  - M12 makes the old output visible in the checkout.
- This also gives R-725, today untested, a test.

**GP3 (R-1352).** One ledger key for both spellings.
- **Setup:** a main checkout R with commits c0 to c3, and a non-git scratch cwd.
- **Runs:**
  1. At c0, `review-ledger run` with cwd R.
  2. At c1, `review-ledger run --tree <S>` from scratch.
  3. At c2, `pi-review --tree <S>` from scratch.
  4. At c3, `review-ledger run --tree <S>` again.
- **Pinned behaviour:**
  - runs 1 to 3 produce exactly one `repo` value, equal to `git:` + native realpath of `R/.git`;
  - run 4 exits 1 with `/over the cap/`;
  - `review-ledger report --item gp3 --repo <S>` prints 3 lines.
- **Row:** "WHEN one repository is reviewed through two spellings of its folder (the launcher's cwd and `--tree`), review-ledger run and pi-review shall record one repository key, `git:` plus the canonical path of its git common dir, so the round cap counts both spellings as one item, and review-ledger report `--repo` shall print that item's rounds under either spelling."
- **Fails without the fix:** probe today shows 2 keys (`Key-Repo/.git`, `kEY-rEPO/.git`), the 4th review admitted, and the report printing 2 lines.
  - M1 and M6 turn the key and cap red; M5 makes the report print 0.

**GP4 (R-1353).** Reclaim finds a dead checkout listed under the other spelling.
- **Setup:**
  - Get a dead pid from `spawnSync(node -e "").pid`.
  - Register `git worktree add --detach <T1>/nana-review-<deadpid>-gp4` in the repo.
  - Run `pi-review` with TMPDIR (POSIX) or TEMP and TMP (win32) set to T2.
- **Both directions:** (T1, T2) = (canonical, other) and (other, canonical).
- **Pinned behaviour:** pi-review exits 0, the dead checkout's folder is gone, and no porcelain line contains `nana-review-<deadpid>-gp4`.
- **Row:** "WHEN a registered `nana-review-<pid>-` checkout and the temp folder are spelled differently (another letter case, an 8.3 short name, a link), pi-review shall reclaim that checkout at startup when its owning pid is dead."
- **Fails without the fix:** probe shows both directions left unreclaimed today, and M9 brings this back.
  - Note: on macOS, git records the typed case of a worktree path (probe: `sPELL-tEMP-tWO/...`).

**GP5 (R-1354).** The end-of-run cleanup check names a registration that remains (POSIX only).
- **Setup:**
  - TMPDIR is a symlink to a real temp folder.
  - A git shim makes `worktree remove` exit 1 and `worktree prune` exit 0 without doing anything; it passes everything else to the real git.
- **Pinned behaviour:** exit 1, and stderr matches `/worktree registration remains/`.
- **Windows:** it prints `SKIP: Node's Windows PATH search tries only .com/.exe, so an extensionless git shim cannot run`.
- **Row:** "WHEN pi-review's own review checkout registration remains after its cleanup and the temp folder is spelled through a link, pi-review shall report the remaining registration and exit 1."
- **Fails without the fix:** probe today exits 0 with the leftover still listed; the check is vacuous on every default macOS TMPDIR.
  - M10 gives exit 0.
  - M13 (no fallback for a missing folder) gives exit 1 with the wrong message, so the check must pin the message.

**GP6 (R-1355).** nana-land merge and cleanup accept the other spelling. This uses the API, because the CLI never gets two spellings for cleanup.
- **Checks:**
  - **(i)** Main checkout M; linked F on feat/gp5 with one commit; LAND recorded for F's tip. Then `runLand({tree: F, main: <S of M>})` returns code 0 and main's ref equals the tip.
  - **(ii)** The original checkout O is on feat/gp5b, and a linked worktree holds main. A LAND is recorded via `--tree O`. Then `runLand({tree: <S of O>, main: <linked>})` returns code 0.
  - **(iii)** `runCleanup("gp5c", {main: M3, worktree: <S of W>})` returns code 0, and W and its branch are gone.
- **Row:** "WHEN `--tree`, `--main` or a cleanup worktree is named through a second spelling of its folder, the land merge command shall treat both checkouts as sharing one git common dir and find the LAND rounds recorded for that repository, and the cleanup command shall match the worktree to its registration."
- **Fails without the fix:** probe today refuses all three ("must share one git repository" twice; "worktree path does not match registered branch").
  - M2 turns (i) red, M3 turns (ii) red (the N1 tree side and N2), M4 turns (iii) red, and M1 turns (i) and (ii) red.

**GP7 (R-1356).** nana-land refuses on a non-LAND verdict recorded under the other spelling. This was fail-open today.
- **Setup:**
  - M is detached at F's tip.
  - Record `admit/complete` for item `gp6-other` with `--tree <S of M>` and `VERDICT: SEND-BACK`.
  - M goes back to main.
  - Record a LAND for gp6 via F.
- **Run:** `runLand({tree: F, main: M})`.
- **Pinned behaviour:** code 1, the text matches `/non-LAND verdict record/`, and main's ref is unchanged.
- **Row:** "IF a non-LAND verdict for a named reviewed revision was recorded through a second spelling of the repository's folder, THEN the land merge command shall refuse without merging."
- **Fails without the fix:** the probe today returned land code 0 and main moved. This is a live fail-open. M1 and M6 bring it back.

**GP8 (no new row; evidence).**
- **macOS:**
  - Capture the per-file PASS/FAIL/SKIP counts with `npm run test:locked` at lane 1's landed tip, before the build.
  - After the build, every existing file's counts are identical.
  - The new file shows no FAIL and no SKIP; the APFS default is case-insensitive.
- **Windows CI**, with RUNNER~1 kept:
  - land.test passes 51/51. Its test-only fixes move here, per attack SHOULD 3: autocrlf false in `repo()`, double-quoted `node -e`, `true` → `node -e "process.exit(0)"`, and the :499 path.
  - Every check lane 1 left FAIL as path-bound in immutable-review and review-ledger now passes.
  - The new file passes; any SKIP prints its reason.
- **Linux CI:** case SKIPs with its reason; the link spelling runs.
- **Status:** R-705, R-724, R-967, R-979 and R-1009 return to implemented on Windows.
- **R-708:** marked violated on Windows, with the autocrlf and exec-bit residual (attack MUST 2), because land.test's autocrlf=false hides it.

## 4. Wrong-code pairs (one revert per site; checks red, all confirmed by the macOS probe)

| Pair | Revert | Must turn red |
|---|---|---|
| M1 | `repoKeyOf` body → `realpathSync(resolve(tree, common))` | GP3 key/cap, GP6(i)(ii), GP7 |
| M2 | nana-land main side → `` `git:${realpathSync(path.resolve(main, mainCommon))}` `` | GP6(i) |
| M3 | nana-land tree side → the same JS form | GP6(ii) |
| M4 | nana-land :148 → `realpathSync` on both sides | GP6(iii) |
| M5 | review-ledger report key → JS form | GP3 report count |
| M6 | treeScope repo → JS form | GP3, GP7 |
| M7 | workingState skip → `relUnder(root, x)` | GP2 (pi-review half) |
| M8 | realOut first line → `realpathSync(p)` | GP1, GP2 (warning, revision) |
| M9 | reclaim → JS realpath of the porcelain path and `tmpdir()` | GP4 |
| M10 | cleanup check → `includes(\`worktree ${tempRoot}\`)` | GP5 |
| M11 | `relative(sourceRoot, outPath)` | GP2 (pi-review exit) |
| M12 | copySnapshot excluded → `outPath` | GP2 (checkout listing) |
| M13 | realPath without the missing-folder fallback | GP5 (message) |

On Windows, the 8.3 spelling is what turns M7, M8, M9 and M11 red (inferred), because path.win32.relative ignores case. The case-and-drive flip turns M1 to M6, M10 and M12 red there.

## 5. Known limits and residuals

- **One claim I expect could be wrong:** that Windows git prints an uppercase drive letter that native realpath reproduces. If it is wrong, every Windows pi-review key changes once.
- **Network drives:** on a mapped drive, native returns `\\server\share\…` while git may print `Z:/…`. N1 would refuse (fail-closed) and main-checkout keys would split. Inferred.
- **subst drives:** whether git and native realpath agree on a subst drive is unverified.
- **The `\\?\` strip:** inferred; the namespaced spelling in GP1 measures it on Windows CI.
- **Upgrade cost on Windows:** an item in flight on a Windows seat, whose split key came from review-ledger run/check, restarts its round count once. A LAND under the old key needs a re-review.
- **Reclaim on Windows:** reclaim now matches there. While an orphaned detached pi holds a dead checkout, reclaim throws "cannot reclaim stale review worktree", and every pi-review on that repo refuses until the orphan exits (attack SHOULD 2). This failure is newly reachable after the fix.
- **Case-sensitive volumes:** a case-sensitive macOS volume or Linux has no case spelling; there, the link spelling is the only evidence.
- **Unicode normalization:** typing a name in NFC while the disk holds NFD is fixed by the same native call. The probe showed native matching git. No check pins it.
- **The `isAbsolute` gap:** P3 and P7 still lack the check. After realPath, only a different drive produces an absolute relative path. That is beneficial for P3 (a dead review checkout on another drive is reclaimed) and harmless for P7.
- **R1 and P2:** these sites stay JS realpath and rely on git printing the canonical top.
- **The native-error fallback:** it ships with no test.
- **Out of this lane:** `review-ledger report` reads `HOME ?? USERPROFILE` while the other tools use `os.homedir()`. With Git Bash on Windows it can read a different ledger. This is not a spelling problem.
- **Cosmetic:** cleanup prints the typed worktree spelling in its "removed …" line.
- **KB1 and KB2:** autocrlf and the exec bit stay with the separate gate lane.