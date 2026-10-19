# pi-settings-bom — must-meet (R-1810 to R-1812)

Feature: FEAT-015 · Diagnose the active environment

**Feature.** When pi's user-scope settings.json starts with one UTF-8 byte-order mark, doctor and install read it as pi 1.0.2 does: they remove one mark, then parse the same JSON. A registered pack then shows ✓ in doctor's pi packages and pi package source rows, and install starts no pi.

**Class.** Install, hook or gate, because doctor and install change behaviour. The lane gets the land reviewer, the seat's wrong-code pairs, one independent check, the mutation runner, and the macOS install check before nana-land. Builder: a Claude Sonnet subagent, since the code change is three lines.

**Threat model.**
- In scope is honest variation. That covers pi's settings file re-saved by an editor or shell that writes a UTF-8 mark (Windows PowerShell 5.1 `Set-Content -Encoding UTF8`, documented but not run here).
- It also covers LF or CRLF line endings; relative, absolute, remote and object-form entries; and malformed text.
- Out of scope: a forged file.

**Design.**
- Two call sites change from `JSON.parse` to the landed `parseJsonText` (packages/nana-pack/lib/json-text.mjs). Each keeps its catch and fallback.
  - `packageCoverage` in steps.mjs feeds install's pi packages step and, through `registrationState`, doctor's pi packages row. Its fallback stays `{}`.
  - `packageSourceState` in doctor.mjs feeds doctor's pi package source row. Its fallback stays `null`. It gains one import line directly under `import * as fs from "node:fs";`, which keeps it clear of the import hunks of two in-flight lanes.
- The live-machine check in pi-registration.test.mjs reads the real pi settings with plain `JSON.parse`. It switches to `parseJsonText`. Without that, a machine whose file carries the mark crashes that test file even after the fix (probe A3).
- No new module, helper or tunable. The README is unchanged.
- The rows go in FEAT-015's table directly after R-1586, not at the table's end, where stale-copies-hooks appends its rows.

**Must-meet tests.** DPS = packages/nana-setup/tests/doctor-package-source.test.mjs. PR = packages/nana-setup/tests/pi-registration.test.mjs.

| Row | Requirement | Test (file::title) | Red today |
|---|---|---|---|
| R-1810 | WHEN pi's user-scope settings.json holds one leading byte-order mark followed by a JSON object, doctor shall print its pi packages and pi package source rows exactly as for the same file without the mark. | DPS::doctor prints the pi packages and pi package source rows for a pi settings.json saved with a byte-order mark as for the same file without one | A1 red |
| R-1811 | WHEN pi's user-scope settings.json holds one leading byte-order mark and its package entries cover every extension directory the root manifest declares, the installer shall report the pi packages step unchanged without starting pi. | PR::install reports a pi settings.json saved with a byte-order mark as registered and starts no pi | A1 red |
| R-1812 | IF pi's user-scope settings.json is not valid JSON once exactly one leading byte-order mark is removed, THEN doctor and the installer shall find no package entries in it. | DPS::two leading marks, a mark inside the object or malformed text after one mark leave pi's settings with no package entries for doctor and install | Green by design; A4 |

**Fixtures.**
- R-1810 uses two settings objects:
  - the checkout registered by `path.relative(piHome, repoRoot)`, with baseline ✓ pi packages and ✓ pi package source;
  - the remote spelling DPS already uses plus that path, with baseline ✓ pi packages and ✗ pi package source.
  - For each object, the test takes `diagnose` rows for the unmarked text, then for mark+LF and mark+CRLF. It anchors the baseline statuses, then requires identical status, label and detail. It runs inside DPS's try, with DPS's pi stub on PATH.
- R-1811 writes mark+CRLF settings that register the checkout by a path relative to the pi home. It calls `stepPiRegister({ ...layout, isRealHome: true }, {}, { spawn })` with an injected recording spawn, the pattern R-1036 uses, so no program ever starts. It requires one row with status `unchanged` and zero spawn calls.
- R-1812 uses three texts:
  - two marks, then valid JSON registering the checkout;
  - a mark, `{`, a second mark, then the rest;
  - a mark, then JSON missing its last brace.
  - For each text, `packageSourceState` is null, and `packageCoverage` is not present and has no entries.
- Every mark in the test source is the escape `"﻿"`, never a literal character.

**Probes.** Run on main 22ccd849 in a fresh clone under a temporary HOME. The repo stayed untouched.
- A1, red today:
  - R-1810 FAIL. The marked rows read `note|pi packages … not covered`, with no source row.
  - R-1811 FAIL. The status is `created`, and the spawn calls were `--version`, `install …/packages/nana-pack` and `install …/packages/nana-knowledge`.
  - R-1812 PASS, by design.
- A2, with the fix:
  - DPS passed 10/10, and PR passed in full.
  - Trace reported 0 rows off-form.
  - map:check reported 0 problems after `npm run map`, which changed 2 lines. req:tree changed 4 lines. readme reported 0 problems.
  - requirements-moved lists R-1810 to R-1812 as new in FEAT-015.
- A3, the live check:
  - The temporary HOME held a marked `.pi/agent/settings.json` and a `nana-pi` link.
  - PR crashed with a SyntaxError on the fixed code.
  - With the live check's reader switched, PR passed and the live check read PASS.
- A4, wrong codes. Each one turned a must-meet test red:
  - the doctor site alone (R-1810, R-1811);
  - the steps site alone (R-1810);
  - `trim()`, removing every mark, or `/^﻿+/` (R-1812).
- A5, pi 1.0.2 itself:
  - Its settings reader is `JSON.parse(stripBom(content))`, and `stripBom` removes one leading U+FEFF.
  - `pi list` in a temporary agent dir listed the package with mark+CRLF. With two marks it warned `not valid JSON`.
  - pi saves settings with `JSON.stringify` and writes no mark.
- A6, trial merges with every in-flight branch:
  - Only docs/code-map.md and docs/requirements-tree.md conflict.
  - Stacking win-path-commands and stale-copies-hooks on the probe and regenerating gave DPS and PR 0 FAIL, and map:check reported 0.

**Platforms.** All three tests run on every platform with no skip, because the mark is file bytes. They were not run on Windows here. Inferred, not run: on Windows CI the temp home and the checkout can sit on different drives, so R-1810's "relative" entry is absolute there. R-998 already passes on the Windows leg with that same construction.

**Known limits.**
1. The frozen desk reads pi's settings.json with plain `JSON.parse`, so a marked file reads as absent there. This is inferred from its code, not run.
2. A UTF-16 settings file stays unreadable, pi included.
3. A settings file holding `null` crashes doctor and `install --dry-run` with a TypeError in `packageCoverage` (probed on main). This is an older bug, recorded as a residual and not fixed here.
4. R-1811 is install behaviour homed in FEAT-015 beside R-1581, following the bom-pack-config precedent. Adding a share is the owner's call, and it joins HANDOFF's open byte-order-mark question.
5. pi drops the mark on its next settings write, so in practice the bug shows only for a short window.
6. The seat removes HANDOFF's residual "doctor and install still read pi's own settings file without removing a leading mark".