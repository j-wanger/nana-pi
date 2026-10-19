# pi-settings-bom — build brief 1

Feature: FEAT-015 · Diagnose the active environment
Builder: a Claude Sonnet subagent, following packages/nana-pack/prompts/builder-preamble.md.
Worktree: ~/nana-pi-wt/pi-settings-bom, branch feat/pi-settings-bom, from main 22ccd849.
Read the must-meet first: docs/reviews/pi-settings-bom-2026-10-19/must-meet.md.

## What to change, in order
1. REQUIREMENTS.md
   - Add R-1810, R-1811 and R-1812, copying the text from the must-meet word for word.
   - Put them directly after R-1586 in FEAT-015's table, with status `implemented` and the test citations.
   - Then run `npm run req:tree`.
2. Tests. Each `// req:` marker goes directly above a one-line `check("title", …`. Write every mark as the escape `"﻿"`, never as a literal character.
   - packages/nana-setup/tests/doctor-package-source.test.mjs:
     - Import `packageCoverage` beside `gitCommonDir`.
     - Add the R-1810 and R-1812 checks inside the try, before `if (fails)`.
     - Build JSON with `JSON.stringify(obj, null, 2) + "\n"`. Make CRLF with `.replace(/\n/g, "\r\n")`.
   - packages/nana-setup/tests/pi-registration.test.mjs:
     - Add one block for R-1811 before the worktree section, using `piHomeWith`.
     - Call `stepPiRegister({ ...resolveLayout({ home }), isRealHome: true }, {}, { spawn })`. The injected `spawn` records its args and returns `{ status: 0, stdout: "1.0.2", stderr: "" }`.
     - Use no PATH recorder and no pi.cmd branch.
   - Run both files. R-1810 and R-1811 must fail before step 3.
3. Code. Change two call sites from `JSON.parse(` to `parseJsonText(`, and keep each catch and fallback as it is:
   - `packageCoverage` in packages/nana-setup/lib/steps.mjs, which already imports it;
   - `packageSourceState` in packages/nana-setup/lib/doctor.mjs. Add `import { parseJsonText } from "../../nana-pack/lib/json-text.mjs";` on the line directly under `import * as fs from "node:fs";`.
4. In pi-registration.test.mjs, change the live-machine check from `JSON.parse(fs.readFileSync(live, "utf8"))` to `parseJsonText(…)`. Import it on the line under the `findPi` import.
5. Run `npm run map`. Commit docs/code-map.md and docs/requirements-tree.md with the change.

## Do not
- Do not edit install.test.mjs, a README, the desk, HANDOFF.md or docs/sessions/.
- Do not change any of doctor.mjs's existing import lines.
- Do not add a helper, a module or a tunable.
- Do not fix the `null` settings crash.

## Wrong code to try (each must turn a must-meet test red; report which)
- parseJsonText at the doctor site only; then at the steps site only.
- `.trim()` before JSON.parse; removing every `﻿`; `/^﻿+/`.
- `packageCoverage` reporting `present` when the file does not parse.

## Done
- R-1810, R-1811 and R-1812 pass, and R-1810 and R-1811 failed before step 3.
- These files pass whole, each run as a single file: doctor-package-source, pi-registration, doctor-detail and install.
- `node scripts/requirements-trace.mjs` exits 0. `npm run map:check` and `npm run readme:check` report 0 problems.
- `node scripts/requirements-moved.mjs --root . --base main` lists R-1810 to R-1812 as new in FEAT-015.

## Report (10 lines or fewer)
1. Tip SHA and changed files.
2. Each row: test title, then red before and green after.
3. Each wrong code and the row it turned red.
4. Single-file results; trace, map and readme results.
5. Anything that did not match the must-meet.