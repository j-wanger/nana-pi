# Seat checks — review-records-pin builds 1 and 2 and a merge of main, tip c2b2b4e0 (2026-10-19)

- Lane class: ordinary. `git diff --name-only 4656f646..HEAD` names one test file (`review-ledger.test.mjs`),
  REQUIREMENTS.md, the generated tree and code map, and this folder's plan and briefs. `git diff --quiet
  4656f646..HEAD -- packages/nana-pack/bin packages/nana-pack/lib packages/nana-pack/extensions packages/nana-setup
  scripts` exits 0: `review-round.mjs`, `review-ledger.mjs` and `pi-review.mjs` are byte-unchanged, so this is not a
  land-and-review-tools lane, and no nana-setup file changed, so no install check is due.
- Build 1's CI run 39345850466 (d023b052, build 1 `40319606` plus a merge of main): macOS `167 files: 165 PASS, 0 FAIL,
  2 SKIP` (7,666 checks pass); Ubuntu `167 files: 165 PASS, 0 FAIL, 2 SKIP` (7,611); Windows `167 files: 149 PASS, 1
  FAIL, 17 SKIP` (6,606 pass, 1 fail; `ci-windows-d023b052-build1.log`). The one failure is this lane's:
  `review-ledger.test.mjs 163 pass, 1 fail, 1 skip`, with `FAIL an unwritable ledger directory is refused at once before
  the review, saying it must be writable, no stack the folder stayed writable; review-ledger: item "ro" … admitted as
  round 1/3`. The fixture's deny for the Everyone SID (`*S-1-1-0:(WD)`) did not hold on the hosted runner, so the probe
  write succeeded and the check failed on its own fixture, as the plan's known limits said it would. Brief 2 sent it back.
- Build 2 (`9dae968c`) changes only the Windows arm of that check: `icacls /inheritance:r`, a read grant and a
  `(OI)(CI)(W,AD,WD)` deny on the current user's own SID from `whoami /user` (Everyone only if no SID parses), `icacls
  /reset` in `finally`, and a named SKIP only when the probe write still succeeds. The POSIX arm is unchanged.
- CI run 39349939721 on the final tip c2b2b4e0 (build 2 plus a merge of main `4656f646`): macOS `168 files: 166 PASS,
  0 FAIL, 2 SKIP` (7,704 checks pass, 0 fail, 26 skip); Ubuntu `168 files: 166 PASS, 0 FAIL, 2 SKIP` (7,649 pass, 0
  fail, 44 skip); Windows `168 files: 151 PASS, 0 FAIL, 17 SKIP` (6,644 pass, 0 fail, 78 skip;
  `ci-windows-c2b2b4e0.log`). The file skips are main's declared ones: hooks-win32-exec and study-tasks off Windows,
  the 16 desk files and study-tasks on it. install-check passes on macOS and Windows. None of main's known failures
  showed (Ubuntu GP1/GP2, the PR merge-commit R-291 total).
- `review-ledger.test.mjs` on the final tip: macOS 165 pass, Ubuntu 165 pass, Windows 163 pass and 2 skip. The Windows
  skips are main's watchdog-signals check and R-1842's. Main reads 163 pass, 2 skip there on recent main-based runs; the
  lane nets zero checks (+R-855, +R-1840, three symlink checks become one) and swaps R-844's old Windows SKIP for
  R-1842's conditional one.
- The Windows leg prints each lane check by title. PASS: `a corrupted round line refuses admission with file:line`
  (R-843), `a record missing repo/revision is malformed too` (R-853), `an incomplete round line refuses admission naming
  file:line` (R-855), `every ledger file as a symlink is refused at once before the review, target untouched, no stack`
  (R-1841, the lock included), `every ledger data file that is a directory is refused before the review, naming the
  path, no stack` (R-1840), `lock path is a directory: refused at once with a message, no stack` (R-852), `an untracked
  in-tree --out warns, the review still runs, and the output stays out of its snapshot` (R-725), `an ignored in-tree
  --out is silent` and `an --out outside the tree is silent` (R-845), and the existing `an untracked ..draft.md is
  in-tree: warns, and is excluded from the snapshot (verdict verified)`. SKIP: `an unwritable ledger directory is
  refused at once before the review, saying it must be writable, no stack — the hosted runner's account still writes
  through a per-user deny after /inheritance:r`. So R-1842's refusal is proven on macOS and Linux only; on the hosted
  Windows runner the account writes through even a per-user deny with inheritance removed (cause not measured). R-1841's
  lock case, which brief 1 called unverified until Windows CI, passes there.
- The builder's wrong-code tries (a Claude Sonnet 5 subagent, build 1, macOS, Node 22; its saved run outputs, read by
  the seat, not re-run). Unchanged code: 165 PASS, 0 FAIL, 0 SKIP.

  | Pin | Wrong code (must-meet.md) | Builder showed it red |
  |---|---|---|
  | R-843 | W1 drop `:${i + 1}`; W1b always `:1:` | yes: W1 and W1b each red R-843 and R-855 (163/2) |
  | R-855 | W1, W1b; W2 an incomplete record throws without file:line | yes: W2 reds R-855 only (164/1) |
  | R-852 | W3 drop the lock `!st.isFile()` refusal | yes: W3 reds R-852 and R-1841 (the lock symlink at 5,221 ms) (163/2) |
  | R-1840 | W4 drop decide()'s audit refusal; W5 drop openChecked's guards | yes: W4 and W5 each red R-1840 and R-1841 (163/2) |
  | R-1841 | W3, W4, W5 | yes, as above |
  | R-1842 | W7 empty failMessage's code list; W8 retry the lock on EACCES/EPERM | yes on macOS: each reds R-1842 only (164/1); not on Windows, where the check skips |
  | R-725 | W9 drop the --out exclusion; W9b drop it at admission only; W10 omit the WARNING | yes: W9b reds R-725 only (164/1); W10 R-725 and the ..draft.md check (163/2); W9 R-725, the ..draft.md check and `a review whose --out lands inside the reviewed tree is stable (its own output is excluded)` (162/3) |
  | R-845 | W11 warn on an outside --out; W12 skip check-ignore | yes: W11 reds the outside check, W12 the ignored check (164/1 each) |

  The control W5a (drop only refuseNonRegular) stays green, 165/0. Two small slips in the record, neither a defect:
  the plan says W9 and W10 also red the ..draft.md check but omits the third existing check W9 reds; the build 1 commit
  says "all 12 named wrong-code probes" and lists 13.
- The seat on c2b2b4e0: `node scripts/requirements-trace.mjs` reads 1,438 rows (1,158 implemented, 1 planned, 31
  retired, 243 untested, 5 violated), `ears: 0 rows off form`; `npm run map:check` reads 325 modules, 0 problems. R-843,
  R-855, R-852, R-1840, R-1841, R-1842, R-725 and R-845 read `implemented`; R-723 and R-844 read `retired`. R-1842 reads
  implemented although Windows skips its check; the rail cannot see a skip inside a test file (HANDOFF's tranche 6
  residual), so the Windows gap is a HANDOFF residual.
- No wrong-code pairs from the seat and no independent check: an ordinary lane, so no findings to settle. The plan's
  known limits, its cut rows and the Windows skip go to HANDOFF as carried lines.
- Main is still `4656f646`, the merge base; no further merge is due before the final review.
- Tree movement (`node scripts/requirements-moved.mjs --root . --base main` on c2b2b4e0):

  ```
  tree movement 4656f64..c2b2b4e: 10 rows in 1 features
  FEAT-007 · Review a specific revision independently
    R-723 untested -> retired
    R-725 untested -> implemented
    R-843 untested -> implemented
    R-844 untested -> retired
    R-845 untested -> implemented
    R-852 untested -> implemented
    R-855 untested -> implemented
    R-1840 new (implemented)
    R-1841 new (implemented)
    R-1842 new (implemented)
  ```
