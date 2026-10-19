VERDICT: CONFIRMED. Both cases happen on macOS. A tree that git calls clean gets a "+snap" revision, and nana-land then refuses the LAND. The CRLF case has also happened on Windows CI: land.test check 273 recorded exactly the snapshot my macOS probe produces. The exec-bit case is reproduced on macOS only. That Node never reports an execute bit on Windows is inferred from libuv and the suite's own skip note. No Windows log shows it.

1. WHERE THE SNAPSHOT PATH READS WORKING-TREE BYTES OR MODE

review-round.mjs (`<repo>/packages/nana-pack/bin/review-round.mjs`)
- :153-164 `treeScope` runs `rev-parse --git-common-dir --show-toplevel`, then `workingState(root, exclude)`.
- :166-171 `headOf` runs `git rev-parse --verify HEAD^{commit}`.
- :187-238 `workingState`, the only dirty detection:
  - :193 `git ls-tree -r -z --full-tree HEAD` gives the HEAD mode and blob id (inHead).
  - :200 `git ls-files -z --stage` adds index paths and gitlinks. Index modes are read but never used for files.
  - :206 `git ls-files --others --exclude-standard` adds untracked paths.
  - :216 `lstatSync(full)` reads the type.
  - :219 `readlinkSync` reads a symlink target (mode 120000).
  - :222 `readFileSync(full)` reads the raw bytes, with no eol, filter or autocrlf applied.
  - :223 `mode = st.mode & 0o100 ? '100755' : '100644'` is the owner-execute bit from fs. It ignores HEAD/index mode and core.fileMode.
  - :226-228 `existsSync(full/.git)`, then a recursive `workingState` for a submodule.
  - :235-237 clean means every "mode blobId(raw bytes)" equals the ls-tree "mode id". Otherwise snapshot = sha256 of the records.
  - The header comment at :177-186 states this design: "Raw bytes: no clean/smudge filter, no EOL normalization, no core.fileMode".
- :260 `withSnap`, :263-279 `resolveRevision` build "<sha>+snap:<hex>".
- :466-487 `parseReview`, :488-491 `deriveRevision` are called by `admit` (:564), `project` (:590) and `complete` (:629). `complete` re-derives under the lock, and :630 sets `stable = now === held.revision`.
- :536-539 `revisionParts` splits on "+snap:" into the ledger's head and snapshot fields (written at :640-641).

pi-review.mjs (`<repo>/packages/nana-pack/bin/pi-review.mjs`)
- :70-71 `sourceScope = treeScope(source)` gives `sourceRevision`.
- :120-134 `copySnapshot`:
  - :126 `lstatSync`.
  - :129 `symlinkSync(readlinkSync)`.
  - :130 `copyFileSync` + `chmodSync(to, st.mode & 0o777)`. Raw bytes and fs mode go into the temp worktree.
- :158 `git worktree add --detach <tmp> <head>` (checkout uses the repo's autocrlf), then :163 `copySnapshot` overwrites every file.
- :164-166 `checkoutScope = treeScope(tempRoot)`. It refuses when `checkoutRevision !== sourceRevision`.
- :172-174 child `--revision` = `sourceScope.head`. :188 `admit` with `--tree tempRoot`. :218 `complete` re-derives in tempRoot.

R-708 and R-709 tests (`<repo>/packages/nana-pack/tests/review-ledger.test.mjs`)
- :781 "clean tree → the bare HEAD sha" (R-708). Its fixture is node-written and never checked out by git, so it cannot see either case.
- :797 "collapse: CRLF vs LF under text=auto (git diff empty) → distinct" (R-709) pins the raw-byte behaviour that causes case (b).
- :800-806 "chmod +x under core.fileMode=false … → distinct" (R-709, skipped on win32) pins the fs-mode behaviour that causes case (a).
- Any fix conflicts with R-709 as written. The row says "EOL normalization … and core.fileMode cannot merge two distinct states".

2. macOS PROBES (scratchpad `<seat-scratch>/snapprobe`)

`rev.mjs` prints `resolveRevision(undefined, treeScope(d), root)`.

(a) Exec bit lost under core.fileMode=false
```
git init; run.sh chmod 755; a.txt; git add .; git commit
git ls-files -s  -> 100644 … a.txt | 100755 … run.sh
node rev.mjs     -> revision: e14cd58b77b111cf4739f402da94b54e8125b35b   (= HEAD)
git config core.fileMode false; chmod 644 run.sh
git status --porcelain -> 0 lines
git diff --quiet HEAD -- -> exit=0
node rev.mjs     -> revision: e14cd58b…b35b+snap:aca4babf61786710b4f8cfaabb254fa9b6f665b8ab5d0643994fac40fa1ac5b8
chmod 755 run.sh; node rev.mjs -> e14cd58b…b35b   (plain again)
```

(b) CRLF checkout: core.autocrlf=true, no .gitattributes. This is land.test's fixture: main repo base.txt "base\n", `git worktree add -b integration`, commit next.txt "next\\n".
```
base.txt bytes in feature: "base\r\n"
git status --porcelain: ""      git diff --quiet HEAD exit: 0
admit: … admitted as round 1/3 (probe @ b76ac628bc01+snap:dabb3236339eeeca7bbc45702fea08e9dfddac81e018b23d38b53bf4d90b8d37)
```
The snapshot hash is the same as the Windows CI value. Computing the records directly also gives "base\r\n" → dabb3236…8d37 and "base\n" → 0effddcd…8832.

End to end with `admit` + `complete`, then `runLand({reviewed:[tip=item]})`, temp HOME:
```
mode: tally revision 37cf07c4…35bd+snap:e42c282c… LAND
      nana-land: 1 refused: no verified version-2 LAND review for item item at revision 37cf07c4c2f22ef66aa1e6a97cb4f153f92235bd
crlf: tally revision b76ac628…7ec3+snap:dabb3236… LAND
      nana-land: 1 refused: no verified version-2 LAND review for item item at revision b76ac628bc012f297d843dc64d5627bb8f917ec3
```

pi-review end to end with a stub pi (HOME=temp, PATH=stubs): both cases pass the reproduction check, exit 0, and record +snap.
```
mode: admitted … (reviewer @ 37cf07c4c2f2+snap:e42c282c…) SUCCESS; tally 37cf07c4…+snap:e42c282c… LAND
crlf: admitted … (reviewer @ b76ac628bc01+snap:dabb3236…) SUCCESS; tally b76ac628…+snap:dabb3236… LAND
```
`copySnapshot` copies the same bytes and mode into the temp worktree, so the check at :166 never catches this.

(c) nana-pi itself: a no-hardlinks clone with `-c core.autocrlf=true -c core.fileMode=false`
```
baseline: revision 4df86da0483bcfd03aa06124b47b31baf4ac9eea   (eol=lf attribute keeps LF, so immune to case b)
chmod a-x on the 10 committed 100755 files
git status lines: 0   git diff --quiet HEAD exit=0
revision: 4df86da0…eea+snap:5d3be60314cd6d3066ec41051b3fe4e8ddedc13a97202d0fe386dd858a53d7e1
```

The 10 committed 100755 files:
- `docs/reviews/lift-2026-10-14/verify-9eadde0/run.sh`
- `docs/reviews/req-tree-2026-10-09/seat-verify-b.sh`
- `packages/nana-knowledge/bin/nana-knowledge.ts`
- `packages/nana-pack/bin/{nana-land,pi-review,pi-worker,review-ledger}.mjs`
- `packages/nana-setup/bin/nana-setup.mjs`
- `packages/nana-setup/claude/hooks/context-size-check.sh`
- `packages/nana-setup/tests/fixtures/retired/hook-backup`

nana-pi has no 120000 or 160000 entries.

(d) eol=lf control: `* text=auto eol=lf` plus autocrlf=true checks base.txt out as LF, and the revision is the plain sha.

Scope:
- Case (b) cannot happen in nana-pi: `.gitattributes` has `* text=auto eol=lf` (added by 7e5cfbd).
- Case (b) does hit any repo without eol attributes on Git for Windows' default autocrlf. That includes every project the templates render, since `templates/` ships no .gitattributes.
- Case (a) hits nana-pi from any Windows seat. That rests on the inferred Windows stat behaviour.
- Inferred, not probed: core.symlinks=false on Windows checks a symlink out as a plain file, so :219 vs :223 gives 100644 against HEAD 120000 and another +snap.

Design note for the fix: `git cat-file --filters HEAD:base.txt` returns "base\r\n" under autocrlf=true and "base\n" under autocrlf=false. It reproduces checkout bytes, so it is one way to define clean as "what git would check out".

3. WINDOWS CI LOGS (`docs/reviews/*/ci-windows-run-*.log`)

The plan's claim is confirmed. Every log that ran land.test has "FAIL an in-flight review of the reviewed tip refuses without merging", with:
```
+ '<tip>+snap:dabb3236339eeeca7bbc45702fea08e9dfddac81e018b23d38b53bf4d90b8d37'
- '<tip>'
```
- It appears in all 31 logs except win-claude-hooks r1/r2, win-line-endings r1 and win-session-start r1/r2. The snapshot is identical in every run, for example win-template-tests r3 :2359 and win-install-shape r3 :2353.
- The cause is case (b): base.txt checked out CRLF in the linked worktree. The hash matches the macOS probe exactly.
- The "unverified" hit in those logs is the test title "an unverified SEND-BACK beside LAND…". It fails on the separate "--tree and --main must share one git repository" path-form bug, which masks most land.test checks on Windows.
- win-review-tests r1-r3 and win-template-tests r3 have 17 more +snap lines, in immutable-review.test and review-ledger.test --out checks. Their details print "compared: short=…RUNNER~1… long=…runneradmin…". Inferred cause: the --out exclusion short/long path split, not mode or EOL.
- No log shows the exec-bit case. `win32-launch.test.mjs:278` "Windows: pi-review's recorded revision is a plain sha" PASSES in every run, but it covers neither case:
  - Its tree commits `f` with a plain `git add`. The plan's `git update-index --chmod=+x` step (roster `CHANGE.md:130`) is absent.
  - The file is node-written LF, never checked out by git.
  - Its comment at :267 says review-round "reads it from the index". That is wrong: :223 reads fs mode.
- On Windows, review-ledger.test logs "SKIP collapse: chmod +x … — NTFS stores no exec bit". "clean tree → the bare HEAD sha", "CRLF vs LF under text=auto → distinct" and "…chmod back → the clean sha" all PASS.

4. DOWNSTREAM READERS A FIX MUST KEEP CONSISTENT

- review-round `decide` (:449-470): rounds are keyed by exact revision string (`revs.includes(revision)`). A changed derivation changes revision ids for already-dirty states, which affects R-711 "revert → already counted" across the change.
- review-round `complete` (:629-630): re-derives and requires equality with the admitted revision. Admission and completion must use the same rule, or every verdict goes unverified.
- review-round `revisionParts` (:536-539) writes head and snapshot into the tally and audit lines (:640-641). R-708 requires snapshot null on a clean tree.
- pi-review:
  - :70-71 source derivation.
  - :163 `copySnapshot` writes raw bytes and `st.mode & 0o777`. `chmodSync` is effectively a no-op for exec bits on Windows (inferred).
  - :164-166 requires checkout == source. The temp worktree shares the repo config (core.fileMode, autocrlf), so a config-keyed or platform-keyed rule stays symmetric. A rule that reads the index must read the temp worktree's index, which is fresh from HEAD.
  - :173 passes `--revision sourceScope.head`. `resolveRevision` :263-271 then re-applies `withSnap` from the temp tree's own state.
- nana-land:
  - :84 rejects any `--reviewed` value that is not a plain 40-64 hex commit.
  - :91 needs a tally row with `r.revision === sha` (plain), verdict LAND, not unverified.
  - :92 blocks a non-LAND row where `r.revision === sha || r.head === sha`.
  - :94 treats in-flight reservations as matching when `revision.split("+snap:")[0] === sha`.
  - :25-28 `assertCleanTracked` uses `git diff --quiet HEAD --`, which follows autocrlf and core.fileMode. nana-land's "clean" is git's view and review-round's is raw bytes and fs mode; that mismatch is the bug.
- review-ledger.mjs:
  - `report` :52 prints `revision.slice(0, 12)`, so a +snap round looks the same as a plain one there.
  - `check` → `project`, and `run` → `admit`/`complete`, go through the same derivation.
- Requirement rows a fix touches:
  - R-708: clean means bare sha.
  - R-709: raw bytes and fs mode. Its CRLF and chmod tests pin the current behaviour, so the row needs an amendment.
  - R-710 / R-711 / R-835: staging, revert, untracked.
  - R-1006: in-flight handling in nana-land.

Probe files are in `<seat-scratch>/snapprobe/` (`rev.mjs`, `land-flow.mjs`, the clone `np/`). The nana-pi working tree is unchanged (`git status` clean), and the real ledger under `~/.pi/agent` holds no probe rows.