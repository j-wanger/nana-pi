# Independent check — clean-revision at a099700 (2026-10-19)

VERDICT: FINDINGS

The eight must-meet tests pass on macOS, and the feature works there. One narrow regression qualifies as MUST. Windows is unverified: no CI run exists for 57e542b, and the remote branch is at 4e98ee1.

Setup: a private clone at 57e542b in <tmp>/clean-revision-check.jkIWbf, with a temp HOME and GIT_CONFIG_NOSYSTEM=1. git 2.50.1, node 22.22.2. The probe script `ws.mjs <old|new> <root> [exclude]` calls workingState. "old" is the version at 1103da1 and "new" is the version at 57e542b.

## Probes

P0 `node packages/nana-pack/tests/{review-ledger,immutable-review,land,win32-launch}.test.mjs`
→ review-ledger 158 pass / 0 fail; immutable-review 18 / 0; land 52 / 0; win32-launch 5 pass, 6 skip (Windows only). All eight must-meet titles print PASS. HOLDS.

P1 nana-pi clone (2280 files), `core.fileMode=false`, `chmod -x` on 50 files committed 100755; then `echo edit >> README.md`
→ `status: []`; `old: snapshot=577ab6593bae`; `new: snapshot=null`. After the edit: `new: snapshot=ec73de820d29`. HOLDS (feature a).

P2 `git clone -c core.symlinks=false` of a repo with a committed symlink
→ `link is Regular File, status []`; `old: snapshot=74795e40c01b`; `new: snapshot=null`. HOLDS.

P3 submodules
→ Uninitialized (empty folder): `old null / new null`.
→ Folder removed (`git status: [ D sub]`): `new snapshot=167ef7aa0a5e`.
→ Initialized and clean: `new null`. Initialized and dirty: `new snapshot=ab9d0699140b`. HOLDS.

P4 staging invariance and `--out` exclusion (canonical root)
→ Unstaged and staged edits both give `10167307e6a5`.
→ `--out` absent and present both give `57a7dc385d53`; without the exclude, the result is `a22c374f4c4c`.
→ A tracked `sub/r1.md` with the same basename as `--out`, when edited, is still counted: `5e51cd521adc`. HOLDS.

P5 `git add -f build/out.js`, an ignored file staged but not committed
→ `old: snapshot=ca49925e9fd6`; `new: snapshot=null`.
→ `git diff --quiet HEAD` exits 1, so nana-land's tracked-change check still refuses the land. HOLDS: the behaviour changed, but the land stays guarded.

P6 `core.autocrlf=true` + `core.safecrlf=true`, clean checkout, with a tracked file that has LF endings on disk
→ `status: []`; `old: head=7e2dd985 snapshot=null`.
→ `new: THROW git add -A -- :/ failed … fatal: LF would be replaced by CRLF in a — admission refused`.
→ The same derivation with `GIT_CONFIG_*` setting `core.safecrlf=false` gives `snapshot=null`. FINDING F1.

P7 `core.splitIndex=true`, four distinct dirty derivations
→ `diff` of a stat listing of `.git` before and after: `> ./sharedindex.41efaca7… 248 …`. The `sharedindex` count goes 1 → 5. `git status` still works.
→ With `core.splitIndex=false` pinned through `GIT_CONFIG_*`, the count stays 5/5. FINDING F2.

P8 a `.git/hooks/post-index-change` hook that appends a line to a log
→ `old hook lines: 0`; `new hook lines: 3`.
→ Each line reads `hook ran idx=$TMP/nana-snapshot-aJYC2x/index`. FINDING F3.

P9 200 MB untracked file; `kill -9` on the deriving node process after 0.6 s
→ `leftover scratch dirs: 1` (`nana-snapshot-e31qoD`). A following normal run took 5316 ms and did not remove it: `after a normal run: 1`. Known bug F4.

P10 repo path containing `a;b\nc`
→ `old: snapshot=null`; `new: THROW … holds a newline — the scratch alternates file cannot en[code it]`. 0 leftovers. Refusing here is a limit the plan declares. HOLDS.

P11 Git LFS repo (`git lfs track '*.bin'`), fresh clone
→ `old: snapshot=163871c1f9b5`; `new: snapshot=null`. The `.git/lfs` file count stays 1.
→ With git-lfs off PATH, `new` throws. `git status` fails the same way, so this matches git. HOLDS.

P12 CRLF blob committed, then `*.txt text eol=lf`, fresh clone
→ `status: [ M win.txt]`; `old: null`; `new: snapshot=c41cd1e9d95d`.
→ `git diff --quiet HEAD` exits 1, so main's nana-land already refuses this tree. HOLDS: no land regression.

P13 timing on the clean nana-pi clone, three runs each
→ old 309 / 316 / 322 ms; new 712 / 660 / 656 ms. About 0.34 s more, as the plan declares. HOLDS.

P14 scratch cleanup after a git failure (P6, P10)
→ `ls $TMPDIR | grep -c nana-snapshot-` prints `0`. HOLDS.

P15 `gh run list --branch feat/clean-revision` → `[]`; `ls-remote` → `4e98ee15… refs/heads/feat/clean-revision`
→ No CI run exists for 57e542b. The Windows alternates drive-path claim, which the plan names as most likely wrong, is still unpinned. NOT VERIFIED.

## Findings

**F1 — MUST (narrow; a main use that no longer works; fail-closed).**
- **Where:** packages/nana-pack/bin/review-round.mjs, `workingState`, the scratch `git add -A`.
- **Trigger:** `core.autocrlf=true` (or `text=auto` with a CRLF eol) plus `core.safecrlf=true`, and a text file on disk whose endings would not survive a round trip.
- **Effect:** pi-review and review-ledger refuse admission, even on a checkout `git status` calls clean. Main reviews that tree at plain HEAD.
- **Cause:** the scratch index has no stat data, so git re-converts every file. git's own add never re-converts a file whose stat matches.
- **Fix:** pin `-c core.safecrlf=false` on the scratch commands. That setting only gates the check, not the stored blob; P6 confirms the result is `null`.

**F2 — known bug.**
- **Effect:** under `core.splitIndex=true`, each derivation of a distinct dirty state leaves a `sharedindex.<sha>` file in the real `.git`.
- **Rules broken:** the README line "Derivation never writes the repository or its real index", and R-1375 (no filter is involved).
- **Harm:** none. git expires the files after its default two weeks.
- **Fix:** pin `-c core.splitIndex=false`.

**F3 — known bug.**
- **Effect:** derivation now runs the repo's `post-index-change` hook three times per call. Main ran no hooks.
- **Fix:** for example, pin `core.hooksPath` to an empty folder for the scratch commands.

**F4 — known bug.**
- **Effect:** a SIGKILL during derivation leaves a `nana-snapshot-*` folder in the OS temp folder. Nothing reclaims it, unlike pi-review's `nana-review-*` worktrees.
- **Scope:** the leftover stays inside the temp folder, so no harm the standard lists.

**F5 — known bug (inferred, unprobed).**
- **Where:** the `finally rmSync(scratch, {recursive, force})` call.
- **Risk:** on Windows it can throw EBUSY or EPERM when antivirus holds a newly written object. The throw would replace a successful result with a refusal.
- **Status:** a guess from known Windows behaviour. The Windows CI leg would show it.

**Status:** macOS evidence only. The plan's Windows CI run on 57e542b is still required and does not exist yet.