#!/usr/bin/env python3
"""Seat mutation runner for lane product-report (frozen). Each mutation breaks the CODE (CHANGE §6's
pairs plus the page rounds), runs the named test file, and expects at least one FAIL line in it (or a
non-zero exit); the file is restored with `git checkout` after each. Run from the repo root."""
import subprocess, sys
PR = "scripts/product-report.mjs"
T = "packages/nana-pack/tests/product-report.test.mjs"
M = [
  ("parse the stamped ledger without normalising (R-1022)", PR, "const normalizedLedger = normalise(ledger);", "const normalizedLedger = ledger;", T),
  ("drop shares from the staleness check (R-1021)", PR, "    const sharedRows = feature.alsoApplies.map((id) => rows.find((row) => row.id === id)).filter(Boolean);\n    const allRows", "    const sharedRows = [];\n    const allRows", T),
  ("skip the digit check (R-1023)", PR, "else if (/[0-9]/.test(value)) problem(", "else if (false) problem(", T),
  ("trust the stored stamp instead of rebuilding it (R-1026)", PR, "const expected = expectedStamp.rows;", "const expected = stamp.rows;", T),
  ("read the checked-out ledger instead of git show (R-1026)", PR, 'ledger = git(gitRunner, root, ["show", `${stamp.commit}:REQUIREMENTS.md`]);', 'ledger = readFileSync(path.join(root, "REQUIREMENTS.md"), "utf8");', T),
  ("allow a second assessment for one feature (R-1027)", PR, "else if (seenFeatures.has(assessment.id)) problem(", "else if (false) problem(", T),
  ("allow a repeated stamp row (R-1027)", PR, "else if (seenRows.has(row.id)) problem(", "else if (false) problem(", T),
  ("drop planned from the solid check (R-1024)", PR, '["planned", "untested", "violated"].includes(row?.status)', '["untested", "violated"].includes(row?.status)', T),
  ("ignore the own-or-shared mark (R-1021)", PR, "return old && (old.mark !== value.mark || old.sha256 !== fingerprint(value.row));", "return old && (old.sha256 !== fingerprint(value.row));", T),
  ("drop the ask body (R-1018)", PR, "body: title.body", 'body: ""', T),
  ("skip a malformed ask instead of refusing (R-1030)", PR, "      throw new Error(`HANDOFF.md line ${ask.line}: malformed Open for Owner entry`);", "      continue;", T),
  ("leave < unescaped in the data script (R-1019)", PR, 'JSON.stringify(model).replaceAll("<", "\\\\u003c")', "JSON.stringify(model)", T),
  ("drop the own-property route guard (R-1019)", PR, "const view = Object.prototype.hasOwnProperty.call(views, hash) ? views[hash] :", "const view = views[hash] ? views[hash] :", T),
  ("hardcode the clean flag (R-1013)", PR, "clean: !dirty,", "clean: true,", T),
  ("refuse nothing on tree problems (R-1025)", PR, "  if (problems.length) throw new Error(`requirements tree checker problems:\\n${problems.join(\"\\n\")}`);", "", T),
  ("unassessed reads as current (R-1028)", PR, '!assessment ? "unassessed"', '!assessment ? "current"', T),
  ("packets for current features too (R-1029)", PR, 'model.features.filter((feature) => feature.assessmentState !== "current")', "model.features.filter(() => true)", T),
  ("packets into a non-empty directory (R-1029)", PR, "  if (initialEntries.length) throw new Error(`packet directory is not empty: ${target}`);", "", T),
  ("packets on a dirty ledger (round 6)", PR, 'if (normalise(workingLedgerText) !== normalise(headLedgerText)) throw new Error(', 'if (false) throw new Error(', T),
  ("packet without its ready stamp (R-1029)", PR, "stamp: featureStamp(parsed, headFeature, commit),", "stamp: null,", T),
  ("spans rendered as literal text (R-1019)", PR, 'const node = document.createElement(bold ? "b" : "code");', 'const node = document.createElement("span");', T),
]
red = 0
for name, f, a, b, t in M:
    src = open(f, encoding="utf-8").read()
    if src.count(a) != 1:
        print(f"ANCHOR {name}: found {src.count(a)} times"); continue
    open(f, "w", encoding="utf-8").write(src.replace(a, b))
    r = subprocess.run(["node", t], capture_output=True, text=True, timeout=600)
    fails = [l for l in r.stdout.splitlines() if l.startswith("FAIL")]
    hit = bool(fails) or r.returncode != 0
    red += hit
    print(f"{'red ' if hit else 'GREEN'} {name}: {fails[0][:90] if fails else ('exit ' + str(r.returncode))}")
    subprocess.run(["git", "checkout", "--", f])
st = subprocess.run(["git", "status", "--short", PR], capture_output=True, text=True).stdout.strip()
print("worktree clean" if not st else f"WORKTREE DIRTY: {st}")
print(f"mutations: {red}/{len(M)} red")
sys.exit(0 if red == len(M) and not st else 1)
