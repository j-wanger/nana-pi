# Independent check — pi-settings-bom at cb1e0ba (2026-10-19)

VERDICT: HOLDS

Private clone: <tmp>/pi-settings-bom-check.EYnrLb/lane at cb1e0ba2, and main at 22ccd849 in .../main beside it. Every probe used a temp HOME or `--home`.

Must-meet tests (temp HOME, single files):
- `node packages/nana-setup/tests/doctor-package-source.test.mjs` returned rc=0 with 10 PASS and 0 FAIL. R-1810 and R-1812 PASS.
- `node packages/nana-setup/tests/pi-registration.test.mjs` returned rc=0 with 65 PASS. R-1811 PASS.
- `ls -laT ~/.pi/agent` showed no diff before and after both files (verdict: no write outside temp). An earlier md5 change on a run without the diff matched another session's activity. The re-run with the diff was clean.

Probe 1. Real CLI `nana-setup doctor --home H` with mark+CRLF settings that register the checkout by a relative path. Main and lane compared:
- main plain: `✓ pi packages … registered as ../../../main` and `✓ pi package source`
- main marked: `· pi packages  packages/nana-pack/extensions, packages/nana-knowledge/extensions not covered …`, with no source row
- lane marked: `✓ pi packages … registered as ../../../lane` and `✓ pi package source … the tree supplying hooks and rules`, the same as lane plain
- Verdict: HOLDS. The fix works for the user.

Probe 2. Real `nana-setup install` with HOME set to a temp folder (so it counts as the real home), mark+CRLF settings, and a logging `pi` stub first on PATH:
- main: `+ pi packages created added per-package entries …`. Stub log: `pi --version`, `pi install …/nana-pack`, `pi install …/nana-knowledge`.
- lane: `· pi packages unchanged all extension directories registered as ../../../lane`. Stub log empty. Re-run rc=0 with "nothing to do", 0 problems. The settings file still starts with efbbbf.
- Verdict: HOLDS. pi does not start, and the file is untouched.

Probe 3. Win32 forced: `stepPiRegister(..., { platform: () => "win32", exists: () => true, spawn: recorder })` with mark+CRLF, the shape PowerShell 5.1 writes.
- lane: `unchanged spawns=0`. main: `created spawns=3`.
- Verdict: HOLDS.

Probe 4. Entry shapes, plain against mark and mark+CRLF (`packageCoverage` and `packageSourceState`):
- object-form: `cov.present=false entries=0 src=ok`, same for marks: true
- absolute: `cov.present=true entries=1 src=ok`, same: true
- remote+object: `cov.present=true entries=1 src=fail`, same: true
- npm-only: `cov.present=false entries=1 src=null`, same: true
- Verdict: HOLDS. Object-form counting as not covered is older behaviour and the same on main.

Probe 5. Edge texts, lane against main:
- UTF-16LE, whitespace then mark, mark only, empty file, and mark then `[]`: both give `cov.present=false entries=0 src=null`. No throw.
- Mark then CRLF and spaces before the object: lane gives `present=true src=ok`. Main gives `present=false`.
- Verdict: HOLDS. The lane matches pi, which strips one leading U+FEFF only.

Probe 6. The live check from plan probe A3. A temp HOME holds a marked `.pi/agent/settings.json` and a `nana-pi` link to the clone.
- main: `SyntaxError: Unexpected token '﻿', "﻿{` (the test file crashes)
- lane: `PASS the live settings.json registers ~/nana-pi (by whatever spelling)`
- Verdict: HOLDS.

Probe 7. Installed pi 1.0.2:
- `dist/utils/text.js` holds `content.startsWith("\uFEFF") ? … content.slice(1)`.
- `settings-manager.js:245` holds `JSON.parse(stripBom(content))`.
- The lane's `parseJsonText` is the same one-mark rule.
- Verdict: HOLDS. The contract matches pi.

Probe 8. Wrong code: the steps site switched back to `JSON.parse` in the clone, then restored.
- `FAIL install reports a pi settings.json saved with a byte-order mark …`
- `FAIL doctor prints the pi packages and pi package source rows … byte-order m…`
- Verdict: HOLDS. The tests catch it.

Probe 9. Other checks on the lane clone:
- `scripts/code-map.mjs --check`: 0 problems
- `scripts/readme-check.mjs`: 709 claims, 0 problems
- `requirements-moved.mjs --base 22ccd849`: FEAT-015, with R-1810, R-1811 and R-1812 new (implemented)
- doctor-runtime.test.mjs: rc=0, 21 PASS
- Clone `git status` is clean after the runs, and its worktree list holds only itself.
- Verdict: HOLDS.

Probe 10. A file holding a mark then `null` (`"\uFEFFnull"`):
- main: doctor prints `· pi packages … not covered`, and `install --dry-run` prints `+ pi packages created would add …`.
- lane: both crash with `TypeError: Cannot read properties of null (reading 'packages')`.
- Unmarked `null` crashes the same way on main and lane, at `packageCoverage`'s `settings.packages` (steps.mjs).
- Verdict: known bug, below.

Findings:
1. Known bug, not MUST. A pi settings file holding a mark then `null` worked on main and now crashes doctor and `install --dry-run`. The lane does not add this bug. It extends plan known limit 3 (unmarked `null` already crashes) to the marked spelling. The input is not realistic: pi always writes an object, and an editor saving bare `null` is outside honest variation. One fix covers both: `settings?.packages` in `packageCoverage`. Record it as an addition to known limit 3's residual.

Not a finding: the lane worktree <worktrees>/pi-settings-bom has two untracked files, `seat-mutate.mjs` and `seat-mutate-output-cb1e0ba2.txt`, under docs/reviews/pi-settings-bom-2026-10-19/. They are the seat's mutation run, not this check's; its HEAD is still cb1e0ba2. The seat must commit or remove them before the final round, because the review must cover the exact tip that lands.
