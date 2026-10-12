#!/usr/bin/env python3
"""Seat mutation runner for lane verdict-position (frozen; anchors updated by the seat after build 3,
which moved the canonical form to fold before and after NFKC, and after build 5, which decides "a
different line" by position). Each mutation breaks the CODE in
packages/nana-pack/bin/review-round.mjs, runs review-ledger.test.mjs, and expects the named check to
FAIL; the file is restored with `git checkout` after each. Run from the repo root."""
import subprocess, sys
F = "packages/nana-pack/bin/review-round.mjs"
T = "packages/nana-pack/tests/review-ledger.test.mjs"
EXTRACT = "complete extracts plain first-line verdicts, supported scores, BOM and line endings"
REFUSE = "complete refuses marks, corrections, conflicting verdicts, invisible characters and bounded-token lookalikes"
CORPUS = "complete records the LAND corpus forms and final SEND-BACK"
MALFORMED = "complete records an empty verdict for malformed verdict suffixes"
M = [
  ("final-only: no first-line branch", "const selected = firstGrammar.exec(first)?.[1] ?? null;", "const selected = null;", EXTRACT),
  ("drop the other-line guard", "if (!selected || nonblank.slice(1).some((line) => canon(line).includes('verdict'))) return null;", "if (!selected) return null;", REFUSE),
  ("drop the look-alike fold", ".map((char) => VERDICT_LOOKALIKE_FOLD[char] ?? char)", ".map((char) => char)", REFUSE),
  ("drop default-ignorable removal (both places)", ".replace(/\\p{Default_Ignorable_Code_Point}/gu, '')", "", REFUSE, 2),
  ("remove only category Cf (both places)", "\\p{Default_Ignorable_Code_Point}", "\\p{Cf}", REFUSE, 2),
  ("drop NFKC", "\n    .normalize('NFKC').replace(", "\n    .replace(", REFUSE),
  ("fold only after NFKC (astra land r1)", "fold(fold(line.replace(", "fold((line.replace(", REFUSE),
  ("fold only before NFKC", "const canon = (line) => fold(fold(", "const canon = (line) => (fold(", REFUSE),
  ("final-line grammar for the first line (sol build r1)", "const firstWord = firstGrammar.exec(first)?.[1] ?? null;", "const firstWord = finalGrammar.exec(first)?.[1] ?? null;", REFUSE),
  ("raw first-line detection in the final branch", "if (nonblank.length > 1 && carries(first)) {", "if (nonblank.length > 1 && /VERDICT:/.test(first)) {", REFUSE),
  ("drop the first/final agreement", "if (firstWord !== selected) return null;", "", REFUSE),
  ("allow marks on the first line", "const firstGrammar = /^VERDICT: ", "const firstGrammar = /^[\\s#>*_`-]*VERDICT: ", REFUSE),
  ("reject the bare score on the first line", "| — \\d+\\/\\d+| \\d+\\/\\d+)?", "| — \\d+\\/\\d+)?", EXTRACT),
  ("keep the byte-order mark", "if (text.startsWith('\\uFEFF')) text = text.slice(1);", "", EXTRACT),
  ("final grammar without the bare score", "|—\\\\s*\\\\d+/\\\\d+|\\\\d+/\\\\d+)", "|—\\\\s*\\\\d+/\\\\d+)", EXTRACT),
  ("final line read first-line style (marks refused)", "if (carries(final)) {", "if (false) {", CORPUS),
  ("malformed final accepted by falling through", "if (!selected) return null;\n    if (nonblank.length > 1", "if (!selected) return firstGrammar.exec(first)?.[1] ?? null;\n    if (nonblank.length > 1", MALFORMED),
]
src = open(F, encoding="utf-8").read()
red = 0
for entry in M:
    name, a, b, title = entry[:4]
    want = entry[4] if len(entry) > 4 else 1
    if src.count(a) != want:
        print(f"ANCHOR {name}: found {src.count(a)} times, want {want}"); continue
    open(F, "w", encoding="utf-8").write(src.replace(a, b))
    r = subprocess.run(["node", T], capture_output=True, text=True, timeout=600)
    failed = any(l.startswith("FAIL") and title in l for l in r.stdout.splitlines())
    red += failed
    print(f"{'red ' if failed else 'GREEN'} {name} → {'FAIL' if failed else 'still passes'}: {title[:60]}")
    subprocess.run(["git", "checkout", "--", F])
st = subprocess.run(["git", "status", "--short", F], capture_output=True, text=True).stdout.strip()
print("worktree clean" if not st else f"WORKTREE DIRTY: {st}")
print(f"mutations: {red}/{len(M)} red")
sys.exit(0 if red == len(M) and not st else 1)
