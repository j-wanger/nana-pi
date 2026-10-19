# pi-settings-bom — plan attack (one adversary)

Verdict: AMEND

The plan holds. I amended four details. I probed in a fresh clone of main 22ccd849 under a temporary HOME, and the repo stayed untouched.

Verified from the plan:
- The residual exists: HANDOFF says doctor and install still read pi's settings without removing a leading mark. The lane is not done.
- pi 1.0.2's settings reader is `JSON.parse(stripBom(content))`. `stripBom` removes exactly one leading U+FEFF, which matches `parseJsonText`.
- I ran `pi list` in a temporary agent dir. With one mark and CRLF it listed the package. With two marks it warned "not valid JSON".
- On main, R-1810 is red (the marked file gives `note|pi packages … not covered` and no source row) and R-1811 is red (`created`, with spawn calls `--version` plus two `install` calls). R-1812 is green by design.
- With the three-line fix, the doctor-package-source file passes 10/10 and the pi-registration file passes. Trace reports 0 off-form. map:check reports 0 problems after `npm run map`, which changes 2 lines. req:tree changes 4 lines. readme reports 0 problems. requirements-moved lists R-1810 to R-1812 as new in FEAT-015.
- The wrong codes behave as the plan says. The doctor site alone turns R-1810 and R-1811 red. The steps site alone turns R-1810 red. `trim()`, removing every mark and `/^﻿+/` each turn R-1812 red.
- I trial-merged against all six in-flight branches. Only docs/code-map.md and docs/requirements-tree.md conflict. After stacking win-path-commands and stale-copies-hooks on the probe and regenerating those two files, both test files ran with 0 FAIL and map:check reported 0.

Amendments:
1. R-1811 now injects `spawn` instead of putting a recording pi on PATH. This follows the R-1036 pattern in the same file. No program can start, even when the fixture is broken, and the pi.cmd branch for win32 goes away. Probed: red on main with `created` and 3 calls, green with the fix. The doctor-site-only wrong code still turns it red.
2. A new step covers the live-machine check in pi-registration.test.mjs, which reads the owner's real pi settings with plain `JSON.parse`. I probed a temporary HOME holding a marked settings file and a `nana-pi` link. The whole test file crashed with a SyntaxError even with the fix applied. The lane's own Done ("pi-registration passes whole") would fail on exactly the machine the lane targets. The fix is one import line plus one token. With it, the file passed and the live check read PASS. No new test is added.
3. The plan's brief and must-meet contained literal U+FEFF characters, as `"﻿"` and `/^﻿+/`. Those are invisible and easily stripped. Every mark in source and in the docs is now the escape `﻿`.
4. The brief now names the builder, a Claude Sonnet subagent, because this is a simple lane. Known limit 3 now says `null` settings crash install too (probed: `install --dry-run` throws a TypeError on main). A new known limit says pi drops the mark on its next settings write.

Lane class: install, hook or gate is correct, because doctor and install change behaviour. The lane also touches packages/nana-setup, so the macOS install check runs before nana-land.

Files the build touches:
- REQUIREMENTS.md
- docs/requirements-tree.md
- docs/code-map.md
- packages/nana-setup/lib/doctor.mjs
- packages/nana-setup/lib/steps.mjs
- packages/nana-setup/tests/doctor-package-source.test.mjs
- packages/nana-setup/tests/pi-registration.test.mjs

All are under <repo>, built in the lane worktree.

Conflicts:
- win-path-commands and stale-copies-hooks conflict only in the two generated files. The later lander regenerates them.
- pwsh-lexer-oracle conflicts only in code-map.md, and adopt-structure-markers only in requirements-tree.md.
- mutation-runner-win-prune and review-ledger-run-reviewer merge clean.
- Neither in-flight lane edits the two test files.
- trust-finds-pi is unknown. pi's trust-manager also strips one mark, so that lane may touch doctor.mjs. This lane's doctor hunks are only the new import line and the parse line in `packageSourceState`.
- No wait is needed.

The claim most likely wrong is how often this happens in practice. pi writes settings back with `JSON.stringify` and no mark on any settings save, including a /model change or the first run of a new version. A marked file therefore lasts only until pi's next settings write. Nobody has seen the owner's file. The fix is verified, but the user-facing benefit may be small. The Windows leg was not run.
