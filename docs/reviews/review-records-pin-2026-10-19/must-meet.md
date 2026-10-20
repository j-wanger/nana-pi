# review-records-pin: must-meet

Feature: FEAT-007 · Review a specific revision independently
Home: SUB-010 · Protect and inspect review records.

The feature in one sentence: before any review runs, the review ledger refuses admission with a message and no stack in four cases: a tally line is malformed or incomplete (naming file and line), a ledger file is a symlink or a directory, or the ledger folder is unwritable. An untracked in-tree --out warns, yet records a verified round on the bare HEAD sha even when the file was already there. An outside or ignored --out stays silent.

Why: nana-land trusts the round count. These refusals stop a broken ledger from granting a free review or dying with a stack. No marker pins them today (the 2026-10-04 gap audit).

Class: ordinary. The lane changes tests, rows and the tree only. review-round.mjs, review-ledger.mjs and pi-review.mjs stay unchanged. If a check reds because of ledger code, the builder stops and reports. That fix would be a review-tools lane.

Threat model: honest variation is in scope: macOS, Linux and Windows on Node 22; a cut-off or hand-trimmed tally line; a ledger file replaced by a symlink or a folder; a ledger folder its user cannot write (POSIX mode bits, a Windows deny entry); an --out inside, outside or ignored by the tree, including a leftover output from an earlier run. Deliberate forgery is out (a crafted record that parses as valid, a race on the lock).

## Design
- Pin, not change. Five rows get markers. Two wide rows retire, replaced by three new ones.
- R-723 "Every ledger path shall be a regular file" is false as written. The reservation folder must be a directory. Retired, superseded by R-1840.
- R-844's "a symlink" has no subject, and its unwritable half had a Windows SKIP. Retired, superseded by R-1841 (four ledger files, lock included) and R-1842.
- R-1842 drops the Windows SKIP, because the case exists there as a deny entry.
  - POSIX: chmod 0o555.
  - win32: `icacls <folder> /deny *S-1-1-0:(WD)`, undone by `/remove:d *S-1-1-0` in finally.
  - A plain write into the folder must throw first. Otherwise the check FAILs with "the folder stayed writable".
- "At once" means under AT_ONCE_MS = 3000, one named test constant. Provenance: chosen, a fifth of the ledger's 15 s lock wait; the 5 s orphan takeover lands past it. Windows CI runs each case in about 0.35 s. R-852's 3000 literal and "(<3s)" title move to that name.
- "Before the review runs" means no "admitted" note on stderr.
- Looped cases become one check with a plain title. The detail names each failing case.
- R-855 plants a valid line first, so the diagnostic must read `:2:`.
- R-725's --out is written before the run with the exact text the review prints, as GP2 does for R-1351. The round must be verified and carry the bare HEAD sha. Only this tests exclusion at admission, and only the revision assertion catches W9.

## Must-meet (file: packages/nana-pack/tests/review-ledger.test.mjs)
| Row | Test title | Kind | Wrong code that reds it (probed) |
|---|---|---|---|
| R-843 | a corrupted round line refuses admission with file:line | marker | W1, W1b |
| R-855 | an incomplete round line refuses admission naming file:line | new, on R-853's run | W1, W1b, W2 |
| R-852 | lock path is a directory: refused at once with a message, no stack | marker, retitled, + not admitted | W3 |
| R-1840 | every ledger data file that is a directory is refused before the review, naming the path, no stack | new | W4, W5 |
| R-1841 | every ledger file as a symlink is refused at once before the review, target untouched, no stack | replaces 3 checks; + lock, + time | W3, W4, W5 |
| R-1842 | an unwritable ledger directory is refused at once before the review, saying it must be writable, no stack | replaces check + SKIP | W7, W8 |
| R-725 | an untracked in-tree --out warns, the review still runs, and the output stays out of its snapshot | retitled, seeded, + verified, + bare HEAD | W9, W9b, W10 |
| R-845 | an ignored in-tree --out is silent · an --out outside the tree is silent | two markers | W11, W12 |

Retired: R-723 (superseded by R-1840) and R-844 (superseded by R-1841 and R-1842).

Wrong code (all probed; each reds exactly its listed checks):
- W1: drop `:${i + 1}`. W1b: always report `:1:`.
- W2: an incomplete record throws without file:line.
- W3: drop the lock `!st.isFile()` refusal. The folder hangs to the 30 s spawn timeout; the lock symlink is taken over at 5.2 s and admitted.
- W4: drop decide()'s audit and previous-audit refusal. Admitted, refused only after the review.
- W5: drop openChecked's three guards. The tally folder gives a raw EISDIR; the tally symlink gives a raw ELOOP with no "symlink" in it.
- W7: empty failMessage's code list.
- W8: retry the lock open on EACCES/EPERM until the 15 s wait.
- W9: drop the --out exclusion. Exits 0 and records HEAD+snap; only the revision assertion reds it.
- W9b: drop the exclusion at admission only. Green on an unseeded check, red here.
- W10: omit the WARNING line. W11: warn on an outside --out. W12: skip check-ignore.
- W9 and W10 also red the existing ..draft.md check.
- Control: W5a (drop only openChecked's refuseNonRegular) stays green, because the fstat guard still names the path.

## Red today
- Nothing is red, because the behaviour works. This is a pin lane.
- Probe: temp copy of main, temp HOME, macOS, Node 22.22.2.
- The drafted file gives 165 PASS, 0 FAIL, 0 SKIP, the same as main: +1 R-855, +1 R-1840, -2 because three symlink checks become one.
- Trace exit 0, ears 0. req:tree regenerates SUB-010. The requirements-tree test passes. map:check is clean after the header edit.
- Windows is not run. Expected: 162 PASS, 1 SKIP (main: 161 pass, 2 skip). R-1842's win32 arm and R-1841's lock case are inferred green.

## Known limits
- R-1842 on Windows rests on source reads, not runs:
  - libuv opens with backup semantics, but the runner's token does not enable backup privileges.
  - libuv maps ERROR_ACCESS_DENIED to EPERM.
  - If the deny does not take, the check FAILs. It never passes without testing.
- Every case drives review-ledger run. pi-review and review-ledger check share admit() and project() but are not driven here.
- A run as root defeats chmod. The write probe then FAILs and says so.
- AT_ONCE_MS can false-red on a very slow runner.
- If a run is killed between the deny and the finally, a deny entry stays on a temp folder (CI only).
- Not pinned, a residual for the seat: a symlinked ~/.pi/agent folder is refused for every review with "is not a directory" (probed). Whether that is wanted is a product question.

## Cut
- R-249 (SUB-009) goes to its own lane with R-718, R-838 and R-839, which needs a new pi-review stub mode.
- R-731 and R-625 are a declared non-bound and a declared limitation. There is nothing to pin.