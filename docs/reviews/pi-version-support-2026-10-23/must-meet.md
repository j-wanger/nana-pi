# pi-version-support · must-meet of record (seat, 2026-10-23)

Feature: FEAT-013 · Install and connect harness runtimes (rows also in FEAT-015 and FEAT-019)

Written by the seat from the planner's draft (`plan-draft.md`) and one adversary pass (`plan-attack.md`), both kept in this folder. Plans get no review round. Where this file and the draft differ, this file holds.

Spend line: the owner's 2026-10-23 ask, "we should support up to I think 1.4.0 now", after a fresh pi 1.0.3 install on the owner's second machine mixed in pi's 1.4.0 packages. It serves the current priority's line that nana works on macOS and Windows for both seats, installation included.

Stakes: medium blast, reversible. Every machine's doctor gains one row; a false ✗ blocks "all good" and fails the install check's `doctor` item on every CI leg, so it shows before a land. CI moves its tested pi from 1.0.2 to 1.4.0 and adds two floor legs. No stored format changes. A revert restores main.

## Probe results (seat step 1, done)

Two probe branches ran CI with only the CI env changed (`probe-ci-2026-10-23.md` in this folder). The plan's step pushed branches, which start no CI (attack S-4); the seat added each probe branch to the workflow's push trigger instead, and deleted both branches after reading.
- pi 1.4.0 at `2026-10-23T18:35:54Z` and pi 1.0.3 at `2026-10-05T08:40:00Z`: the Windows install check passed 22 of 22 lines on both, `pi turn` and `pi powershell gate` included; macOS passed too.
- Every suite leg, Windows, macOS and Linux, on both versions: the same three files red, `ci-workflow`, `fresh-machine` and `pi-install-pin`, each a pin check red because the probe moved CI without the READMEs. On Windows no other file changed status against a green 1.0.2 run.
- So no compatibility code change is needed on Windows either (measured). The plan's riskiest assumption holds.

## Seat decisions on the attack

- **Design as the draft**, parts 1 to 6: CI tests the ceiling 1.4.0 and the floor 1.0.3 with the install check on macOS and Windows, the suite on the ceiling only; the README installs the ceiling; doctor's new `pi packages` row reports a pi whose own packages are newer than pi; no compatibility code change.
- **M-1 adopted.** R-2711 adds "runs the one install-check step, which has no `if:`, on every leg, with no matrix `include` or `exclude`". Its test asserts exactly one step runs `install-check.mjs`, that step has no `if:` line, and the job's `matrix:` block has no `include:` or `exclude:` key. Pairs 24 and 25.
- **S-1 adopted.** R-2713's fixture holds two newer dependencies (codemode 1.4.0 and pi-ai 1.4.0) and its test asserts both are named. R-2714's fixture adds `"devDependencies": { "@earendil-works/pi-client": "^1.0.3" }` with no folder and still expects ✓ naming `3`; R-2713 and R-2714 say "listed in its `dependencies`". Pairs 26 and 27.
- **S-2 adopted.** The decoy variant puts a stub `npm` in the fixture's `bin` that prints the decoy prefix's `lib/node_modules` for `root -g`, as `packages/nana-pack/tests/pi-install.test.mjs` does, and keeps `npm_config_prefix` on the decoy. Pair 17 then turns R-2713 red with ✓ on every machine.
- **S-3 adopted.** R-2715 adds: the pi package's own version, or a read dependency's version, that is not exactly three dot-separated numbers gives `·`. Fixtures: pi `1.5.0-beta.1` with a matching dependency, and a pi package with no `version`; both `note`, never `fail`. Pair 28.
- **S-4 noted.** Done differently (above).
- **S-5 adopted.** The Precedent adds `apps/desk/pi-session.mjs` (`walkUpToPackage`, `resolvePiPackage`) and `apps/bench/lib/pi-exports.mjs`. The row copies `walkUpToPackage`'s walk, its six-level cap included, because a package may not import from `apps/` and the desk is frozen. It does not tie a shim to a package by `pi --version`, as `resolvePiPackage` does; a pnpm global then gives `·` while the desk imports that package. That gap is a known limit.
- **S-6 adopted, first option.** R-1093 is amended to accept a README command at either CI pair, ceiling or floor, each with its own cutoff; the missing-pi hint stays at the ceiling. New row R-2717: the setup README's "Upgrade pi itself" paragraph carries exactly one floor command. Pairs 30 and 31. The root README's checklists stay at the ceiling (R-950's checks already pin them to `PI_VERSION`).
- **N-1 adopted.** R-2711 and R-2712 go in FEAT-019 after R-1092. R-2713 to R-2715 go in FEAT-015 after R-1037. R-2716 and R-2717 go in SUB-011 after R-1094. The Feature line stays FEAT-013; the brief names all three.
- **N-2 adopted.** Bun gives ✓; pnpm, Volta and pi's own installer give `·`. The known limit says the row flags a mixed install even when pi's entry imports.
- **N-3 adopted.** R-2716's captures are `(\d+\.\d+\.\d+)`.
- **N-4 adopted.** The seal title holds no values; R-2711 and R-2712 state the values they seal, as R-1091 does.
- **N-5 adopted.** The dropped floor suite would cost about 32 minutes of runner time per run (measured medians), not about 54.
- **N-6 in the brief.** No `·` anywhere in the row's detail: the install check fails any doctor line holding `·` whose label is not a declared note.
- **N-7 adopted.** R-2711's test asserts the floor install line equals the ceiling install line with `PI_VERSION` and `PI_BEFORE` replaced by `PI_FLOOR_VERSION` and `PI_FLOOR_BEFORE`. Pair 29.
- **N-8 adopted.** `pi-packages.mjs` does not import `doctor.mjs`. Doctor passes `versionAtLeast` and `firstOnPath` in as arguments, so there is no import cycle and no copy (ruling 2026-10-22).
- **N-9 noted.** The probes measured both Windows shells green on both versions.
- **N-10, decided by the seat.** The desk README's install command and tested-on note change, as R-1093 forces; no desk code changes. The freeze covers desk work, and a README line that must track CI is not desk work. The seat tells the owner in the land report.
- **Class: install lane.** It changes doctor and the CI install-check job. Opus final reviewer, astra land reviewer, the seat's pairs, one independent check, the local macOS install check, CI's four install-check legs and three suite legs. Builder: the larger builder.
- **Open questions.** 1 (this Mac to 1.4.0 after the land) goes to the owner, default yes; it changes the main machine's pi under the running desk. 2 (a doctor note outside the tested range) is decided by the seat: no, the README carries the range. 3 (the second machine's pi) goes to the owner as a recommendation, 1.4.0 with the README command after the land.

## Must-meet rows

| ID | Requirement (EARS) | Test file::title | Where |
|---|---|---|---|
| R-2711 | The root CI workflow shall run the install-check job on every pair of `macos-latest` or `windows-latest` and the ceiling pi `PI_VERSION` (`1.4.0`) or the floor pi `PI_FLOOR_VERSION` (`1.0.3`), with no matrix `include` or `exclude`, each leg installing only its own version with the ceiling install's flags at its own cutoff, checking that `pi --version` prints that version, and then running the one install-check step, which has no `if:`. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2711: the install check runs on macOS and Windows at the ceiling and the floor pi, every leg installing and checking only its own version, then running the one ungated check step` | FEAT-019, after R-1092 |
| R-2712 | The root CI workflow shall declare the floor pi exactly once, as `PI_FLOOR_VERSION` and the double-quoted `PI_FLOOR_BEFORE` value `2026-10-05T08:40:00Z` (a valid UTC instant in the form `YYYY-MM-DDTHH:MM:SSZ`), in its workflow-level `env:` directly after `PI_BEFORE`. | `packages/nana-pack/tests/ci-workflow.test.mjs::R-2712: the floor pi and its cutoff are declared once, the cutoff quoted in UTC ISO form, directly after PI_BEFORE` | FEAT-019, after R-2711 |
| R-2713 | IF a dependency in pi's own package scope, listed in the `dependencies` of the pi package that the `pi` on PATH runs from, is installed for that package at a version newer than the package's own version, THEN doctor shall print a ✗ `pi packages` row naming every such dependency with its installed version, the package's version and the pi install hint. | `packages/nana-setup/tests/doctor-pi-packages.test.mjs::R-2713: a pi package with its own packages installed newer than itself prints a ✗ pi packages row naming each of them, both versions and the install hint` | FEAT-015, after R-1037 |
| R-2714 | WHEN doctor reads every dependency in pi's own package scope listed in the `dependencies` of the pi package that the `pi` on PATH runs from, and none is newer than that package's own version, doctor shall print a ✓ `pi packages` row naming that version and the number of packages read. | `packages/nana-setup/tests/doctor-pi-packages.test.mjs::R-2714: a pi package whose own packages are at or below its version, nested or hoisted, prints a ✓ pi packages row naming its version and count` | FEAT-015, after R-2713 |
| R-2715 | IF doctor finds no pi package for the `pi` on PATH, or that package's own version is not exactly three dot-separated numbers, or, with no listed dependency read as newer, a listed dependency is missing or its version is not exactly three dot-separated numbers, THEN doctor shall print a `·` `pi packages` row naming what it could not read, never ✗. | `packages/nana-setup/tests/doctor-pi-packages.test.mjs::R-2715: a pi outside any package, a pre-release or missing version, a missing dependency or an unreadable version prints a · pi packages row, never ✗` | FEAT-015, after R-2714 |
| R-2716 | The root README shall state the supported pi range as `supports pi <PI_FLOOR_VERSION> through <PI_VERSION>`, both values read from the root CI workflow. | `packages/nana-setup/tests/pi-install-pin.test.mjs::R-2716: the root README names CI's floor and ceiling as the supported pi range` | FEAT-013 SUB-011, after R-1094 |
| R-2717 | `packages/nana-setup/README.md` shall carry exactly one pi install command at the root CI workflow's `PI_FLOOR_VERSION` with an unquoted `--before=<PI_FLOOR_BEFORE>` and the ceiling command's other flags. | `packages/nana-setup/tests/pi-install-pin.test.mjs::R-2717: the setup README carries one floor pi install command at CI's floor version and cutoff` | FEAT-013 SUB-011, after R-2716 |

Seal test, one for the new sealed values: `packages/nana-pack/tests/ci-workflow.test.mjs::pin R-2711 and R-2712: CI tests the sealed ceiling and floor pi at the sealed floor cutoff`, its `// req:` naming R-2711 and R-2712. It matches `^  PI_VERSION: 1\.4\.0$`, `^  PI_FLOOR_VERSION: 1\.0\.3$` and `^  PI_FLOOR_BEFORE: "2026-10-05T08:40:00Z"$`, each once.

Each new row goes in `untested` first, then `implemented` with its backticked `file::title` when its check passes. Add no heading. R-2718 and R-2719 stay free.

Existing rows the lane amends, requirement first, then the test:
- **R-1090**, as the draft: each pi install passes the cutoff declared with the version it installs, `PI_BEFORE` with `PI_VERSION` and `PI_FLOOR_BEFORE` with `PI_FLOOR_VERSION`; the suite and release jobs still install the ceiling. Title stays.
- **R-1091**: the sealed value becomes `2026-10-23T18:35:54Z`, in the row text and its seal check. Both titles stay.
- **R-597**: row text stays; its check drops the literal `PI_VERSION: 1\.0\.2` (the new seal pins the version).
- **R-1093** (S-6): "Every `npm i` or `npm install` command for `@earendil-works/pi-coding-agent` in a README the readme check covers shall carry either the root CI workflow's `PI_VERSION` with an unquoted `--before=<PI_BEFORE>` or its `PI_FLOOR_VERSION` with an unquoted `--before=<PI_FLOOR_BEFORE>`, and the missing-pi hint install and doctor print shall carry `PI_VERSION` and `PI_BEFORE`." The README-command check's title becomes `every README pi install command carries CI's ceiling or floor version with that version's unquoted cutoff`; update the row's evidence. The hint check and its title stay.
- **R-1078 and R-950**: unchanged; their checks pass unedited. If the builder cannot keep R-1078's checks unedited, the build stops and reports.

## What each test does

As the draft's "What each test does", with: R-2711's ungated single check step, no `include` or `exclude`, and the floor line equal to the ceiling line with the names swapped (M-1, N-7); R-2713's second newer dependency and the stub `npm` in the decoy variant (S-1, S-2); R-2714's uninstalled devDependency (S-1); R-2715's pre-release and version-less pi fixtures (S-3); R-2716's numeric captures (N-3). R-2717 reads `packages/nana-setup/README.md` and `ci.yml`: exactly one pi install command there names `@<PI_FLOOR_VERSION>`, and it equals the root README's ceiling command with the floor pair in place of the ceiling pair. Every new check is red on main.

## Tunables

As the draft's table: `PI_VERSION` `1.4.0`, `PI_BEFORE` `"2026-10-23T18:35:54Z"`, `PI_FLOOR_VERSION` `1.0.3`, `PI_FLOOR_BEFORE` `"2026-10-05T08:40:00Z"`, each with its provenance comment in `ci.yml`. The row adds no code tunable.

## Wrong-code pairs (each must turn its test red every run)

The draft's pairs 1 to 23, with pair 17's fixture as S-2 says, plus:
- 24. The install-check step gated `if: matrix.pi == 'ceiling'` → R-2711.
- 25. A matrix `exclude` of `{ os: windows-latest, pi: floor }` → R-2711.
- 26. The ✗ detail names only the first newer dependency → R-2713.
- 27. The row also reads `devDependencies` → R-2714 (`·` instead of ✓).
- 28. "Newer" read as `!versionAtLeast(pi, dep)` → R-2715 (the pre-release fixture gives ✗).
- 29. The floor install drops `--ignore-scripts` → R-2711.
- 30. The setup README's floor command carries the ceiling cutoff → R-1093.
- 31. The setup README's floor command removed → R-2717.
None is Windows-only: the CI checks read text, and the doctor row's win32 cases run through injected readers on every system. Only CI's Windows legs prove the real Windows layout, through the install check's `doctor` item.

The seat's real-run checks on macOS (scratch prefixes, no repo edits; not mutation-runner pairs): R1, doctor with the fresh 1.0.3 prefix first on PATH gives ✗ naming six packages at 1.4.0, `1.0.3` and the hint; R2, the pinned 1.0.3 and pinned 1.4.0 prefixes give ✓; R3, the install check with each pinned prefix first on PATH passes every line but the scratch-folder `hook adoption` line the draft explains.

## Known limits (the seat writes them to the named files before the final round)

The draft's list, with: bun ✓ and pnpm, Volta and pi's installer `·` (N-2); the row flags a mixed install even when pi's entry imports (N-2); a pnpm global gives `·` while the desk imports that package (S-5); a pre-release or checkout-built pi gives `·` (S-3). FEAT-015's known-bug file takes the doctor row's lines; FEAT-013's takes the rest.

## Docs that change

As the draft's list, with: the setup README's "Upgrade pi itself" paragraph carrying the floor command (S-6, R-2717); the desk and bench tested-on notes naming what ran on 1.4.0 (unit tests only for the desk); and HANDOFF dropping "[optional, since 2026-10-21] The pi upgrade".

## Seat steps

1. Probes: done (above).
2. Cut `feat/pi-version-support` from main. Commit this file, the draft, the attack, the probe record, seat titles and build brief 1; run brief-check.
3. Build with the roster's larger builder.
4. Seat checks: `ci-workflow`, `doctor-pi-packages`, `pi-install-pin`, `fresh-machine`, `doctor-runtime` and `doctor-package-source` each alone; `npm run test:locked`, map, readme, trace, tree; `requirements-moved --base main`; the removed-escape diff check.
5. The local macOS install check on this Mac's pi, then R1 to R3.
6. Pairs 1 to 31 through the mutation runner.
7. Draft PR CI: four install-check legs and three suite legs green; keep the Windows logs in this folder.
8. The independent check.
9. Notes before the final round, with lane-temp-cleanup's late notes.
10. Opus and astra on the exact tip.
