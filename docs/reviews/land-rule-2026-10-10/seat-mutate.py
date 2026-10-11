# Seat mutation pairs for the land-rule lane (frozen). Run from the worktree root: each mutation is applied,
# its named test must FAIL by title, and the file is restored with git checkout. Prints N/16 red.
import subprocess, sys
import os
W=os.getcwd()
LAND='packages/nana-pack/bin/nana-land.mjs'; RR='packages/nana-pack/bin/review-round.mjs'
LT='packages/nana-pack/tests/land.test.mjs'; RT='packages/nana-pack/tests/review-ledger.test.mjs'
M = [
 ("print-and-land restored (R-1002)", LAND, "if (unreviewed.length) {", "if (false && unreviewed.length) {", LT, "uncovered integration commits are refused and named"),
 ("--exempt back in the parser (R-1003)", LAND, '["--tree", "--main", "--suite", "--reviewed"]', '["--tree", "--main", "--suite", "--reviewed", "--exempt"]', LT, "unknown land options"),
 ("complete() first-only (R-1008)", RR, "      appendChecked(p.tally, { v: 2,", "      if (existingOrdinal < 0) appendChecked(p.tally, { v: 2,", RT, "complete appends every verdict at v2"),
 ("second reading dropped (R-1005)", LAND, "checkRecords(rounds.filter((r) => r.repo === repo), reservations.filter((r) => r.repo === repo));", "void 0;", LT, "a verified SEND-BACK written by the suite refuses before merge"),
 ("second reading outside the injected lock (R-1005)", LAND, "\t\tlockReviews(home, ({ rounds, reservations }) => {\n\t\t\tcheckRecords(", "\t\twithReviewLedgerLock(home, ({ rounds, reservations }) => {\n\t\t\tcheckRecords(", LT, "final review reading, rechecks and ff-only merge run inside one ledger lock"),
 ("first VERDICT line taken (R-969)", RR, "text.split(/\\r?\\n/).reverse().find(", "text.split(/\\r?\\n/).find(", RT, "complete records the LAND corpus forms and final SEND-BACK"),
 ("extra words accepted (R-1010)", RR, "[.,;:]?${marks}\\\\s*$`", "[.,;:]?${marks}.*$`", RT, "complete records an empty verdict for malformed verdict suffixes"),
 ("common-directory check dropped (R-1009)", LAND, 'throw new Error("--tree and --main must share one git repository");', 'void 0;', LT, "a separate clone is refused"),
 ("reviewed SHA resolved before the common-directory check (R-1009)", LAND, "\t\tconst treeCommon = git(runGit, tree, \"rev-parse\", \"--git-common-dir\");", "\t\tfor (const p of reviewedPairs(reviewed)) { try { git(runGit, tree, \"cat-file\", \"-t\", p.sha); } catch {} }\n\t\tconst treeCommon = git(runGit, tree, \"rev-parse\", \"--git-common-dir\");", LT, "a separate clone is refused"),
 ("version-1 LAND authorises (R-1011)", LAND, "r.v === 2 && r.revision === sha", "r.revision === sha", LT, "a version-1 LAND alone refuses"),
 ("empty verdict treated as absent (R-1004)", LAND, 'Object.hasOwn(r, "verdict") && r.verdict !== "LAND"', 'r.verdict != null && r.verdict !== "LAND"', LT, "an explicit empty verdict beside LAND refuses land"),
 ("parenthesised score rejected (R-969)", RR, "(?:\\\\(\\\\d+(?:\\\\.\\\\d+)?/\\\\d+\\\\)|", "(?:", RT, "complete records the LAND corpus forms"),
 ("snapshot head ignored (R-1004)", LAND, "(r.revision === sha || r.head === sha)", "(r.revision === sha)", LT, "a verified SEND-BACK at a working-state snapshot refuses land"),
 ("other items ignored (R-1004)", LAND, "rounds.filter((r) => r.unverified !== true && (r.revision", "rounds.filter((r) => r.item === item && r.unverified !== true && (r.revision", LT, "a verified SEND-BACK for another item at the commit refuses land"),
 ("only line-leading VERDICT lines considered (R-969, sol build r2)", RR, "find((x) => /(?<![\\p{L}\\p{N}_])VERDICT:/u.test(x))", "find((x) => /^[^\\w\\r\\n]*VERDICT:/.test(x))", RT, "complete records an empty verdict for malformed verdict suffixes"),
 ("snapshot reservations ignored (R-1006)", LAND, 'String(r.revision).split("+snap:")[0] === sha', 'false', LT, "an in-flight snapshot review of the reviewed tip refuses"),
]
fails=0
for label, f, old, new, test, title in M:
    p=f"{W}/{f}"; t=open(p).read()
    if t.count(old)!=1:
        print(f"SKIP {label}: anchor found {t.count(old)} times"); fails+=1; continue
    open(p,'w').write(t.replace(old,new))
    try:
        r=subprocess.run(['node', test], cwd=W, capture_output=True, text=True, timeout=600)
        outp=r.stdout+r.stderr
        red = r.returncode!=0 and any(l.startswith('FAIL') and title in l for l in outp.splitlines())
    finally:
        subprocess.run(['git','checkout','--',f], cwd=W)
    print(f"{'red ' if red else 'MISS'} {label} → {test.split('/')[-1]} :: {title} (exit {r.returncode})")
    if not red: fails+=1
st=subprocess.run(['git','status','--short'],cwd=W,capture_output=True,text=True).stdout.strip()
print('worktree clean' if not st else 'WORKTREE DIRTY:\n'+st)
print(f"mutations: {len(M)-fails}/{len(M)} red")
