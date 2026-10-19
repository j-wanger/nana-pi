**clean-revision: gate lane design (READ ONLY; probes ran only in the scratchpad)**

Lane: `clean-revision`. It is a gate lane because review-round sits behind pi-review and nana-land. Stakes: every review's identity and the land gate depend on it, so the blast radius is high. The change is one function, so it is reversible. Reviewers: sol final, astra land, plus the seat's wrong-code pairs and one independent check. Corpus: `docs/reviews/clean-revision-2026-10-18/`.

**Sequencing:** build only after win-review-paths lands. That lane rewrites `workingState`'s exclusion (`realOut` + `gitPathKey`) and `treeScope`'s root. This lane replaces `workingState`'s body. Today it is the third lane, in planning.

## 0. Prototype evidence (macOS, git 2.50.1)

Prototype files are in `<seat-scratch>/gitstate/`:
- the prototype itself: `ws2.mjs`
- the old/new case table: `cases.mjs`
- a copy of the pack patched to use the prototype: `pack/`
- end-to-end flows: `mm3.sh`, `mm5.sh`, `mm6.mjs`, plus the wrong-code variant `pack-a1/`

Case table, old rule against new rule:

| Case | Old | New | git |
|---|---|---|---|
| core.fileMode=false, chmod -x | +snap | plain | clean |
| core.autocrlf CRLF checkout | +snap | plain | clean |
| core.symlinks=false, link checked out as a file | +snap | plain | clean |
| Real edit, CRLF bytes vs LF bytes | two different snaps | one snap | dirty |
| Untracked file | snap | snap | dirty |
| Submodule dirty one vs dirty two | distinct | distinct | dirty |
| `git rm --cached` | plain | plain | status dirty, R-710 |
| Ignored file, or mtime touched | no move | no move | – |

- **Land end to end** (pi-review with a stub pi and its output under `docs/reviews/`, then `runLand`): today it is refused with "no verified version-2 LAND". With the prototype it returns code 0.
- **Existing suites on the patched copy:**
  - immutable-review: 17/17 pass.
  - review-round: 33/33 pass.
  - land.test: 50/51. The one failure is a README read missing from the scratch copy, not the design.
  - review-ledger: only the three intended collapse checks fail (CRLF, chmod, clean filter). Two R-712 checks fail on the prototype's error wording only; with `gitOut`'s message format they match (inferred, not run).
- **Speed:** measured 0.59–0.68 s per derivation against 0.23 s today, on nana-pi's 2,252 files.

## 1. The fix

Definition: the revision is the tree that `git add -A` would record on top of HEAD.
- The tree equals HEAD's tree and no nested repository is dirty or new: the plain sha.
- Otherwise: `<HEAD>+snap:<sha256("tree <id>\0" + sorted sub/new records)>`.

Git applies its own rules: core.fileMode, core.autocrlf, core.symlinks, .gitattributes, clean filters and ignores.

How it is built:
- A throwaway index seeded from HEAD, so staging cannot move the revision (R-710 holds by construction).
- A throwaway object folder that borrows the repo's objects, so the repo and its index are never written.
- The probes found two traps, and the sketch avoids both:
  - An exclude pathspec that names an ignored file makes `git add` exit 1. So `--out` is reset to HEAD after the add, not excluded by pathspec.
  - An unborn nested repo makes `git add -A` exit 128. So nested repos are excluded and folded in by recursion.

```js
const SNAPSHOT_SCRATCH_PREFIX = 'nana-snapshot-'; // chosen: names the throwaway index+objects folder
export function workingState(root, exclude = []) {
  const head = headOf(root);
  if (!head) return { head: null, snapshot: null };
  // reads the REAL index, so a corrupt index still refuses (R-712 stays live)
  const nested = nulList(gitOut(root, ['ls-files', '-z', '--others', '--exclude-standard']).stdout)
    .filter((p) => p.endsWith('/')).map((p) => p.slice(0, -1));
  const skip = exclude.map((x) => relUnder(root, realOut(x))).filter(Boolean); // win-review-paths' matching
  const scratch = mkdtempSync(join(tmpdir(), SNAPSHOT_SCRATCH_PREFIX));
  try {
    mkdirSync(join(scratch, 'objects'));
    const objects = resolve(root, gitOut(root, ['rev-parse', '--git-path', 'objects']).stdout.trim());
    const env = { GIT_INDEX_FILE: join(scratch, 'index'), GIT_OBJECT_DIRECTORY: join(scratch, 'objects'),
      GIT_ALTERNATE_OBJECT_DIRECTORIES: altQuote(objects) }; // C-quote only if it holds path.delimiter or starts with "
    gitOut(root, ['read-tree', head], { env });
    gitOut(root, ['add', '-A', '--', ':/', ...nested.map((p) => `:(top,literal,exclude)${p}`)], { env });
    if (skip.length) gitOut(root, ['reset', '-q', head, '--', ...skip.map((p) => `:(top,literal)${p}`)], { env });
    const tree = gitOut(root, ['write-tree'], { env }).stdout.trim();
    const recs = [];
    // 160000 entries in the scratch index whose path holds .git → workingState(realpathSync(...)); dirty → `sub <rev>\t<p>\0`
    // each nested p → `new <head|unborn>[+snap:x]\t<p>\0` (always a change, like R-835)
    recs.sort(byteOrder);
    const clean = !recs.length && tree === gitOut(root, ['rev-parse', `${head}^{tree}`]).stdout.trim();
    return { head, snapshot: clean ? null : sha256(`tree ${tree}\0`, ...recs) };
  } finally { rmSync(scratch, { recursive: true, force: true }); }
}
```

`gitOut` gains an `env` option. Remove `blobId` and the raw-record code if nothing else uses them.

## 2. Sites

**Change:**
- `packages/nana-pack/bin/review-round.mjs`:
  - `workingState` and its comment at :177-238.
  - `gitOut` at :139, which gains `env`.
  - Constants at :68-81.
  - Imports `mkdtempSync`, `rmSync`, `tmpdir`.
  - Module header:
    - `@inputs` gains "git config and attributes".
    - `@effects` gains "disk: a scratch index and object folder under the OS temp folder, removed after each derivation".
- `packages/nana-pack/tests/review-ledger.test.mjs` §16:
  - Delete the two R-709 collapse checks (CRLF, chmod) and the unmarked clean-filter collapse check. They pin the reversed behaviour.
  - Add MM1, MM2, MM4 and MM6.
- `packages/nana-pack/tests/immutable-review.test.mjs`: add MM5.
- `packages/nana-pack/tests/land.test.mjs`: add MM3.
- `packages/nana-pack/tests/win32-launch.test.mjs:265-278`: add the missing `git update-index --chmod=+x f` before the commit, and fix the comment at :267 ("reads it from the index" is wrong). This adds no test; it makes the existing Windows check cover the exec-bit case.
- `REQUIREMENTS.md`, the pack README revision paragraph (:108-117), `docs/code-map.md` (regenerate), HANDOFF and the session entry.

**No change needed:**
- `pi-review.mjs`: `copySnapshot`'s raw copy and the reproduction check at :166 stay as they are. Both sides now derive through the same HEAD-seeded rule and share the same config and attributes, so there is no asymmetry.
- `nana-land.mjs`: still takes only a plain sha. The in-flight split at :94 still works.
- `review-ledger.mjs`.

## 3. Must-meet tests and rows (SUB-006)

Each must-meet test is cross-platform with no skip. On Windows, chmod is a no-op and NTFS stores no exec bit, so each test runs the real case there. The fix does not depend on the inferred libuv stat behaviour.

| Row | MM | Test (file::title) | Today |
|---|---|---|---|
| R-1370: WHEN core.fileMode is false and the only difference from HEAD is a committed 100755 file whose working copy lacks the execute bit, the revision shall be the plain HEAD sha. | MM1 | review-ledger::`exec bit lost under core.fileMode=false (git diff empty) → the bare HEAD sha`. Commit with `update-index --chmod=+x`, set fileMode=false, chmod 644. Precondition: ls-tree shows 100755 and `diff --quiet HEAD` returns 0. | red |
| R-1371: WHEN core.autocrlf is true and the only difference from HEAD is a text file git checked out with CRLF endings, the revision shall be the plain HEAD sha. | MM2 | review-ledger::`CRLF checkout under core.autocrlf=true (git diff empty) → the bare HEAD sha`. Commit LF, set autocrlf=true, `rm` the file, `git checkout -- t.txt`. Precondition: the bytes are `\r\n` and the diff is quiet. | red |
| R-1372: WHEN a linked worktree differs from HEAD only by a CRLF checkout under core.autocrlf and a lost execute bit under core.fileMode=false, a LAND recorded by pi-review with its output inside the tree shall let nana-land merge that HEAD. | MM3 | land.test::`a pi-review LAND on a CRLF checkout with a lost exec bit lands the tip`. Uses the fake pi and `--out docs/reviews/x/r1.md`, then `runLand` returns code 0 and main sits at the tip. | red (probed) |
| R-1373: WHERE the working tree differs from HEAD, two working copies that differ only by line endings core.autocrlf normalizes or by an execute bit core.fileMode=false ignores shall have one revision. | MM4 | review-ledger::`one edit with CRLF or LF endings, exec bit on or off under fileMode=false → one +snap revision` | red |
| R-1374: WHEN pi-review reviews a tree with a tracked edit, an untracked file and a new file staged with an execute bit, under core.autocrlf=true and core.fileMode=false, it shall record a verified verdict at `<HEAD>+snap:<64 hex>`. | MM5 | immutable-review::`a dirty tree under autocrlf and fileMode=false is reproduced exactly and recorded at HEAD+snap` | green (guard; red under pair P1, probed) |
| R-1375: Deriving the revision of a dirty tree shall leave every entry under the repository's .git folder unchanged in size, mode and mtime. | MM6 | review-ledger::`deriving a dirty revision leaves .git unchanged` (a full recursive listing before and after) | green (guard; red under P2) |

## 4. Wrong-code pairs (`runMutations`, one table; anchors against the builder's tip)

| Pair | Mutation | Expect red |
|---|---|---|
| P1 | Seed the scratch index by copying the real index, not `read-tree HEAD` | MM5 (probed: "could not be reproduced exactly") |
| P2 | Drop `GIT_OBJECT_DIRECTORY` and the alternates from `env` | MM6 |
| P3 | Keep today's raw-record hash as the dirty value; git decides only clean or dirty | MM4 |
| P4 | `add` → `-c core.autocrlf=false add` | MM2, MM3 |
| P5 | `add` → `-c core.fileMode=true add` | MM1, MM3, MM4 |
| P6 | `add -A` → `add -u` | existing R-835 untracked check |
| P7 | Drop the `--out` reset | existing "--out file … excluded from its snapshot" and "..draft.md … verdict verified" |
| P8 | `recs` always empty | existing "two different dirty submodule contents → distinct" |
| P9 | List nested repos through the scratch index env | existing R-712 "corrupt index → refused" |

**Independent check:** a Windows CI run on the exact tip, read by the seat. It must show:
- land.test "an in-flight review of the reviewed tip refuses without merging" now passes (no `+snap:dabb3236…`).
- win32-launch "recorded revision is a plain sha" passes with the chmod step added.
- MM1, MM3 and MM5 pass on NTFS.

## 5. Records, contracts, limits

**Rows and README:**
- **R-708:** reword "the working tree's content differs from HEAD" to "the working tree differs from HEAD as `git add -A` would record it". Its tests are unchanged.
- **R-709:** narrow it to "never renders a diff, so diff or colour config cannot change the revision", keeping only the split test as evidence. Add a dated note that the EOL, clean-filter and core.fileMode clause is reversed by R-1370, R-1371 and R-1373. I chose narrowing over retiring because the skill says to narrow a row wider than its tests.
- **Pack README :108-117:** replace "file mode as on disk … raw bytes … EOL normalization, clean filters and core.fileMode cannot merge two states" with the new definition. Say that clean filters run during derivation, and that nothing is written to the repo.

**Ledger records:** existing tally lines are untouched, and plain-sha LANDs stay valid. One-time effects of the switch:
- A dirty state reviewed before the switch gets a new `+snap` value, which costs a new round. R-711 does not carry across the change.
- A Windows tree that was raw-dirty but git-clean moves from `+snap` to plain, which is also a new round.
- A reservation that is in flight across the upgrade completes as unverified. The README limit "deploy with no review running" already covers this.

**Known limits:**
1. The revision ignores whatever git ignores: EOL, a fileMode=false exec bit, clean-filter output, core.symlinks=false. The reviewer reads raw bytes, but the commit is what lands.
2. Index-only changes do not move the revision (R-710): a staged mode under fileMode=false, or `rm --cached`. nana-land's tracked check still refuses such a tree.
3. A non-deterministic filter makes pi-review refuse at reproduction. A missing required filter or a `core.safecrlf=true` failure refuses admission with git's error.
4. pi-review's top-level `treeScope` at :70 still throws with a stack trace. This is pre-existing, but more git errors now reach it.
5. LFS runs filter-process on every file (inferred to be slow and to write `.git/lfs`; MM6 would flag that). nana-pi has no LFS.
6. Partial clones may lazy-fetch (inferred).
7. Sparse checkouts read as dirty, unchanged from today.
8. The slowdown is about 0.4 s per derivation, about four per pi-review run.
9. Out of scope: the Windows `--out` short/long name split, which win-review-paths fixes.

**Claim most likely wrong:** the alternates path handling on Windows. Quoting is needed for a `:` in the path (probed on macOS: unquoted fails, C-quoted works). If verbatim Windows paths or `;` quoting misbehave, every Windows derivation fails closed and every Windows review is refused. Only the independent Windows run can confirm it.