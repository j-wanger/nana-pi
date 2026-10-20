# review-records-pin — plan attack (one adversary)

Verdict: AMEND

AMEND, with one real gap and four small fixes. All probes ran on a temp copy of main (now cb1a5b57, since adopt-structure-markers landed), with a temp HOME, on macOS and Node 22.22.2.

1. The R-725 check does not test the claim that the output stays out of the snapshot at admission. With the plan's check, the --out file does not exist when the review is admitted. Wrong code W9b drops the exclusion at admission only, and the plan's check stays GREEN under it (probed). The plan's assertion that the revision equals HEAD is never the only thing that catches a bug.
   - Fix: write the --out file before the run, holding exactly the text the review prints. That is a leftover from an earlier run of the same review. GP2 (R-1351) already does this for the second-spelling case.
   - With the seed, W9b reds (probed). W9 also reds, and only through the revision assertion: the run exits 0, is not unverified, and records HEAD+snap, so a re-review of the same commit spends a new round (probed).
2. R-852's check title keeps "(<3s)" after the bound moves to AT_ONCE_MS. The title is the evidence key, so retuning the bound would leave a stale literal in it. Retitle the check without "(<3s)".
3. Two wrong-code descriptions were off (probed):
   - W5 with O_NOFOLLOW kept gives a raw ELOOP on the tally symlink ("symbolic links", no "symlink"). It is not admitted, as the plan said. It still reds.
   - W8 retries until the 15 s lock wait (about 23 s per run), not until the 30 s spawn timeout.
   - Added W1b, which always reports line 1. It reds R-843 and R-855, which shows that planting a valid line first earns its place.
4. The Done section now gives the expected Windows counts: 162 PASS and 1 SKIP. Main shows 161 pass and 2 skip on the latest Windows CI log. The Windows log also shows each symlink case at about 0.35 s, so a 3 s AT_ONCE_MS has a wide margin there.
5. New residual, out of scope, for the seat to record: when ~/.pi/agent itself is a symlink to a folder (a dotfiles setup), ensureDir refuses every review with "is not a directory — refused" (probed). Whether that is wanted is a product question for the owner. It is not pinned here.

Kept as planned:
- The lane class is ordinary: the change is tests and rows only.
- The two retirements are sound. R-723 is false for the reservation folder, and R-844's "a symlink" has no subject.
- The icacls arm cannot pass without testing, because the write probe makes it FAIL.
- IDs are R-1840 to R-1842, unused on main and on every feat branch.
- No in-flight branch touches review-ledger.test.mjs, review-round.mjs, review-ledger.mjs, pi-review.mjs, fake-pi or tmp-dir.

Probe results:
- Baseline main: 165/0/0 (132 s).
- The amended file: 165/0/0 on unchanged code.
- Trace exit 0, ears 0.
- req:tree regenerated, and the requirements-tree test passed 93 with 0 FAIL.
- After the @effects edit, map:check is clean. Only this test's effects line changes in the code map.
- Every W reds exactly the checks listed. W5a stays green.
