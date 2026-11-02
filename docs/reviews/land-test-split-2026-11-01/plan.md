# land-test-split — plan (revision 2)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane class (`node scripts/lane-class.mjs --root . --files packages/nana-pack/tests/land.test.mjs,packages/nana-pack/tests/land-ci-read.test.mjs,packages/nana-pack/tests/land-ci-edge.test.mjs,packages/nana-pack/tests/land-merge.test.mjs,packages/nana-pack/tests/land-checks.mjs,REQUIREMENTS.md,code-map.config.json,docs/code-map.md,docs/known-bugs/FEAT-031.md,docs/requirements-tree.md`): `ordinary`. `packages/nana-pack/lib/test-runner-config.mjs` alone classifies as `gate`, and this lane leaves it unchanged. `land.test.mjs` is not in `RUN_ALONE`, and no new file joins it.

Revision 2 takes all four MUSTs in `plan-attack.md` and SHOULDs 5 to 10. The details are under each section.

## Purpose

The seat's words for this lane (2026-11-01): "Split `packages/nana-pack/tests/land.test.mjs` so every resulting file runs well under 240 s on the laptop, inside a full PowerShell `npm run test:locked` held awake." It fixes the FEAT-031 known bug "`land.test.mjs` takes about 247 to 300 s on the owner's Windows laptop alone and times out at the 300 s per-file limit under suite load" (`docs/known-bugs/FEAT-031.md:130`).

This is a fix. It restores the FEAT-031 contract that the locked suite runs reliably on a supported machine, as the windows-local-suite lane did for `profile-store` and `review-ledger` (R-3454, R-3455). The runner's default per-file limit is 300 s (`scripts/test.mjs:89`). CI sets 900 s (R-2558), so CI is unaffected; a land or a seat's `npm run test:locked` on the laptop uses the default. The last full run on the laptop (claude-cmd-launch, 2026-11-01) failed `land.test.mjs` on the time limit alone. Run alone, the file passed every check in 297 s.

Measured grounding (`timings-before-win32.txt` in this folder, the laptop, the file alone with plain `node`, HEAD ac20e30a, total 293.6 s): each check's time is the gap between its PASS line and the previous one. The file has 66 `check(` calls: on win32 that is 65 PASS and 1 SKIP, on POSIX 66 PASS.

| Block (source lines at ac20e30a) | Checks | Alone |
|---|---|---|
| preflight, suite-time races and review authorization (62-376) | 31 | about 85 s |
| kept review texts and merge results (377-532) | 9 | about 49 s |
| CI read: R-2586, R-2587, R-2588, R-2591, R-2592, the CI seal (533-574, 647-690) | 6 | about 51 s |
| CI edge: R-2589, R-2590 (575-646) | 2 | about 68 s |
| runtime map, suite, cleanup, docs, release, options, clone, normalized checkout (692-908) | 17 + 1 SKIP on win32, 18 on POSIX | about 39 s |

## Assumptions

- A1: no check depends on state another check left. The seat and the adversary each read every check at ac20e30a.
  - Every check that touches git builds its own root through `tmpDir` (a `mkdtempSync`, `tmp-dir.mjs:20-24`) or `ciFixture`.
  - The only mutable module binding is `failures`.
  - Process-level state was checked too. Three checks call nana-land without `home` (:264, :274, :875) and fall back to `os.homedir()` (nana-land.mjs:84). R-2591 changes `process.env` and restores it in `finally` (:650-665). The in-flight checks admit under `process.pid` (:283, :294, :305). None leaks between checks. The runner gives every file a fresh HOME and TMP (`scripts/test.mjs:475-480`), so moved checks see the same kind of HOME they saw before.
- A2: a file's time in a four-job full run is about 1.15 times its time alone. That comes from one sample, the precedent's full run (`windows-local-suite-2026-11-01/suite-run-win32-powershell.txt:4`, :108). The alone time itself varies about 1.4 times on this laptop (214 to 297 s for this file). A file of about 90 s alone therefore projects to about 145 s in the worst measured case.
- A3: moving checks never renames, merges or drops one. Every original check name appears exactly once across the new files, on every platform.

## Open choices

- O1: the cut. Default: four test files, each about 90 s or less alone, cut at the block boundaries above.
  - `land.test.mjs` keeps the first block, about 85 s.
  - `land-merge.test.mjs` takes the kept-text and merge-result block and the last block, about 88 s.
  - `land-ci-read.test.mjs` takes the six CI-read checks, about 51 s.
  - `land-ci-edge.test.mjs` takes R-2589 and R-2590, about 68 s.
  - The names avoid `land-ci-suite` and `land-ci-records`, which already exist.
  - The builder may move a boundary to meet M1, and reports the move.
- O2: shared helpers and constants. A new module, `packages/nana-pack/tests/land-checks.mjs`, holds every test-local helper that two or more of the new files use: `runLand`, `recordTextReview`, `tallyRows`, `writeTallyRows` and `assertCiRefused`, as the cut needs. It imports nana-land's `runLand` as `executeLand`, exactly as `land.test.mjs:19` does today. `land-fixtures.mjs` is not edited: it already imports nana-land's own `runLand` (`land-fixtures.mjs:15`) for `executeCi`, so a second `runLand` there would clash (attack MUST 2).
  - A helper used by one file stays local to that file.
  - Each file keeps its own `check` and `failures`, as `land-records.test.mjs` does.
  - `TEST_LOCKED` and `PI_REVIEW` (:27, :29) move with the checks that read them (:707, :903).
- O3: where the new rows are tagged. Default: the first check of each of the four files gets ` R-3490 R-3491` appended to its existing `// req:` line, as the precedent did (`profile-store.test.mjs:22`, `review-ledger.test.mjs:48`).

## Questions for the owner

None.

## Threat model

In scope: honest variation in the machine and its load. That covers:
- the reference Windows laptop alone and in a four-job full run;
- macOS, and Linux CI;
- the win32-only SKIP of the runtime-map check;
- R-2589's own conditional SKIP line, printed where gh sits beside git (:611-612).

A split file must pass on every such machine, and every check must still run exactly once.

Out of scope: deliberate forgery, such as a test edited to report a name it does not run.

Residuals:
- A machine slower than the reference laptop may still need `NANA_TEST_TIMEOUT_MS`.
- R-2589 and R-2590 take 31 s and 37 s alone. Why they are slow is not examined here; this lane only moves them.
- The runner starts files in sorted order (`scripts/test.mjs:177`, :563-571). `land-ci-edge`, `land-ci-read`, `land-ci-records` and `land-ci-suite` therefore tend to share the four-slot pool. M1 measures that real condition, not an estimate.

## Precedent

- `packages/nana-pack/tests/review-ledger.test.mjs` — with `review-ledger-launch.test.mjs`, `review-ledger-verdicts.test.mjs` and `review-ledger-state.test.mjs`, the windows-local-suite split of one slow file into siblings. Method: names before and after on win32 and POSIX, equal as multisets, and a full-run file table. Rows R-3454 and R-3455 are the row form.
- `packages/nana-pack/tests/review-ledger-fixture.mjs` — the shared module that split moved setup into. `land-checks.mjs` plays the same part here.
- `packages/nana-pack/tests/land-fixtures.mjs` — the existing land fixture, imported unchanged by the new files.
- `packages/nana-pack/tests/land-records.test.mjs` — with `land-ci-records.test.mjs` and `land-ci-suite.test.mjs`, earlier land siblings that each keep their own `check` and `failures` over `land-fixtures.mjs`. The new files copy that file shape.
- `docs/reviews/windows-local-suite-2026-11-01/` — the precedent lane's plan, briefs and evidence files (`names-before-win32.txt`, `names-after-win32.txt`, `suite-run-win32-powershell.txt`).
- `code-map.config.json:67` — the exemption "Fixture command runner accepts a program parameter" names `land.test.mjs`. Its only site is line 600 in R-2589 (`docs/code-map.md:3660`). The entry moves to `land-ci-edge.test.mjs`.
- `packages/nana-pack/lib/test-runner-config.mjs` — found by `npm run map:search -- "run alone test files"`. `RUN_ALONE` does not name `land.test.mjs`; unchanged.
- `scripts/test.mjs` — `TIMEOUT_MS` (line 89), the 300 s limit, and the per-file HOME and TMP (475-480).
- `docs/known-bugs/FEAT-031.md` — line 130, the bug this lane fixes, and line 109, the CI timing note, which stays.

## Outside precedent

- Node.js test runner sharding (`node --test --test-shard`, MIT): **skip**. The suite runs each file as one process under `scripts/test.mjs`, so the split is by file, as in the precedent.

## Must-meet

Requirement rows R-3490 and R-3491 go in the FEAT-031 table in `REQUIREMENTS.md` first, tagged as O3 says. Every existing `// req:` tag moves with its check. Every `REQUIREMENTS.md` evidence cell that cites a moved check's `file::title` is updated to its new file. The FEAT-031 line 130 known bug is removed only when M1's measured run holds. M3 to M5 are lane-folder evidence with no rows of their own (attack SHOULD 8).

- **M1 · R-3490** — `land.test.mjs`'s checks shall be split across files so that each file reports at most 180 s in one full `npm run test:locked` run from PowerShell on the reference Windows laptop. Proves: the land tests no longer hit the 300 s limit there, with headroom. Pins: the full run's output, recorded in the lane folder. The record states:
  - each land file's time;
  - that the run used the default four jobs;
  - how the machine was kept awake (an ES_DISPLAY_REQUIRED request held for the whole run);
  - the known unrelated failures (`post-edit-utf8`: no Python; `template-acceptance`: no uv).
- **M2 · R-3491** — Every check name that `land.test.mjs` ran before the split shall run exactly once across the new files. Pins: before and after name lists, equal as multisets, from the laptop and from one POSIX run. The seat records the POSIX lists on macOS; they cover the runtime-map check, which skips on win32.
  - A name is the text after the leading `PASS `, `FAIL ` or `SKIP `. For the runtime-map SKIP line it stops before ` — R-2526`. R-2589's conditional SKIP line is kept whole in both lists.
  - The lists are sorted, written as UTF-8 by node, and never through PowerShell redirection.
  - The runs go through `node scripts/test.mjs <files> --verbose`, so HOME, TMP and env match the suite.
  - If main changes `land.test.mjs` before the land, the before list is taken again at the merged tip.
- **M3 (evidence)** — No moved check shall change. Pins: a lane-folder comparison script and its output.
  - A block is the run of `// req:` lines before a `check(` call, through the first following line that is exactly `});`. The runtime-map block is lines 693-717 whole: the `if`, the SKIP line, the `else`, its req line and its check.
  - Each block at the base and at the tip is byte-identical. The one allowed difference is O3's ` R-3490 R-3491` added to a req line, and the script lists each one.
  - The same holds for each helper (`check`, `runLand`, `recordTextReview`, `tallyRows`, `writeTallyRows`, `assertCiRefused`) and for `TEST_LOCKED` and `PI_REVIEW`. The one allowed difference is a leading `export `.
- **M4 (evidence)** — Each new file shall pass alone on the laptop through `node scripts/test.mjs <file>`. Pins: each file's alone run with its PASS, FAIL and SKIP counts and time, recorded in the lane folder. The counts sum to 65 PASS and 1 SKIP on win32.
- **M5 (evidence)** — The suite's view of the land tests shall follow the move. Pins:
  - `node scripts/requirements-trace.mjs` is green, and no evidence cell cites `land.test.mjs::` for a check that moved;
  - `npm run map:check` is green, the code-map exemption names `land-ci-edge.test.mjs`, and `land.test.mjs` no longer carries it;
  - `test-runner-config.mjs` and `land-fixtures.mjs` are unchanged at the tip.

Expected changes (a forecast, not a limit):
- `land.test.mjs`, the new `land-merge.test.mjs`, `land-ci-read.test.mjs`, `land-ci-edge.test.mjs` and `land-checks.mjs`;
- `REQUIREMENTS.md` rows and evidence cells, `code-map.config.json`, `docs/code-map.md`, `docs/requirements-tree.md`, and `docs/known-bugs/FEAT-031.md`.
