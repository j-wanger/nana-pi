# windows-local-suite — plan (revision 2)

Feature: FEAT-031 · Run checks reliably and without contaminating work

Lane class (`node scripts/lane-class.mjs --root . --files <planned files>`, with `packages/nana-pack/lib/test-runner-config.mjs` deliberately NOT in the list): `ordinary`. Editing `test-runner-config.mjs` would make the lane `gate`, so this lane leaves `RUN_ALONE` unchanged. If the builder finds it must edit that file, it stops and reports; it does not edit it.

Revision 2 takes every MUST in `plan-attack.md` and SHOULDs 11, 13, 14, 15, 16, 17, 18, 19 and 20. SHOULD 12 (seeding the daily cap) is kept as the fallback in O2.

## Purpose

The owner's words for this lane (relayed by the seat, 2026-11-01): "run one lane end to end up to review: windows-local-suite. It's an ordinary lane, test fixes only." The scope is the defects found by running the full suite on a Windows 11 laptop with Developer Mode on (issue #213):

1. `restore.test.mjs:152` fails on every Windows machine whose `tar` is the bundled bsdtar, because the test splits tar's CRLF listing on `\n` (line 128). Its forbidden-path guard (line 104) cannot fire on Windows, because it compares backslash paths with tar's slash names.
2. `pi-launch-limits`, `pi-registration` and `win32-launch` fail wherever Windows spells the variable `Path`. Each test builds `{ ...process.env, PATH: … }`, which then holds both `Path` and `PATH`, and hands that object to an in-process lookup (`findPi`, `stepPiRegister`, `diagnose`). `envValue` (`packages/nana-pack/lib/win-command.mjs:14-17`) takes the first case-insensitive key, `Path`, the stale original, so the fixture pi is never found. A real npm pi on PATH is then picked instead, if one exists; without one, the lookup finds nothing. Spawned children are unaffected: Node keeps one key, the lexicographically first, `PATH` (measured on the laptop). CI passes because its steps run under `shell: bash` (`.github/workflows/ci.yml:71`), and Git Bash hands Node `PATH`.
3. `profile-store` (about 320 s alone) and `review-ledger` (about 397 s alone) exceed the runner's default 300 s per-file limit on the same laptop. CI is not affected: it sets `NANA_TEST_TIMEOUT_MS=900000` (`.github/workflows/ci.yml:77`, R-2558), and the runner reads that for every file (`scripts/test.mjs:89`, R-612). Splitting beats asking every local run to set the variable. A land or a seat's `npm run test:locked` on a laptop uses the default, and `docs/known-bugs/FEAT-031.md` already records lands failing on time-outs alone. Shorter files also spread better across the four-file pool.

This is a fix. It restores R-958 (the restore archive contract), the preconditions of R-1033/R-1034 and R-2020 to R-2025 on Windows machines that spell the variable `Path`, and the FEAT-031 contract that the locked suite runs reliably on a supported machine.

Product reading: the lookup does **not** prefer the npm shim over PATH order in real use. `findPi` walks PATH in order. In real use, `env` is `process.env`, which has exactly one PATH key. The only product file that builds a PATH-spread env object is `apps/desk/server.mjs:157`, and it hands that object only to spawns (`server.mjs:475-487`, `1608-1616`; `apps.mjs:365` → `apps.mjs:235`), where Node keeps `PATH`. `envValue`'s first-match rule differs from Node's spawn rule only for an object holding two spellings of one key. No product caller hands such an object to a lookup, so the difference is one FEAT-013 known bug, not a row. `packages/nana-setup/lib/doctor.mjs:681` already documents the `Path`-outranks-`PATH` hazard for the product.

## Assumptions

- A1: CI's Windows steps hand Node `PATH` because they run under `shell: bash` (ci.yml:71). The fix removes the duplicate key on every machine whatever the spelling, so it holds either way.
- A2: the laptop timings (each file alone, nothing else running) are the reference. profile-store takes 320 s, of which check 1 is 168 s, mostly the 39-save daily-cap loop at lines 44-45. review-ledger takes 397 s: 165 `check(` calls, 169 PASS and 2 SKIP lines on Windows. Per-check timings are in `timings-before.txt` in this folder.
- A3: review-ledger's blocks share module-level state: repos A and B (line 109), the counter behind `out()`, the stub folder and the home, and **repo A's HEAD and working tree**. The `redirect` block (lines 686-709) leaves the untracked `A/redirect.log`. These blocks use A without first calling `A.at()`, so they inherit whatever HEAD and debris the previous block left: `0` (:127), `unread-rounds-left` (:398), `redirect` (:686), `shape` (:712), `13`, `14`, `15` (:1030, :1067, :1088), `17` (:1328), `20` (:1418) and `21` (:1551). A block moved to a new file starts on fresh state, so the new file must recreate the state each moved block inherited (M6).
- A4: splitting moves checks, never renames, merges or drops one. Every original check name appears exactly once across the files, on every platform.

## Open choices

- O1: review-ledger's cut. `review-ledger.test.mjs` stays the only run-alone file and keeps the load-sensitive blocks: §5 races (:757), §6 crashed reservation (:777), §8 expired reservation (:833), §18 renewal (:1349) and §19 TOCTOU (:1385), plus any block they depend on. All other blocks move into new pool files, as many as the M6 budget needs. Default: two pool files, `review-ledger-launch.test.mjs` and `review-ledger-verdicts.test.mjs`, cut at block boundaries, with the shared setup in `review-ledger-fixture.mjs`.
- O2: profile-store's cut. Default: `profile-store.test.mjs` keeps check 1 (with its daily-cap loop) and the 13 seals. Checks 2 to 5 move to `profile-store-guards.test.mjs`. That follows the existing `memory-run*.test.mjs` sibling split. Fallback, only if check 1's file misses M5's budget in the full run: seed 38 records in one commit plus the counter file at 38 (`profile-guards.mjs:38-42`), then make the real 39th and 40th saves and the refused 41st. Every assertion stays, and about 2 minutes are saved. The seat accepts the fallback only with the measured run attached.
- O3: the env helper. Default: `packages/nana-pack/tests/env-path.mjs`, exporting `withPathPrepended(env, dir, platform = process.platform)`. Setup tests import it by relative path.

## Questions for the owner

None.

## Threat model

In scope: honest variation in our tools' output and the machine. That means bsdtar's CRLF listing versus GNU tar's LF; Windows' `Path` spelling versus `PATH`; a real npm pi on PATH or none; a slower machine; four files at once. A test must pass on every such honest machine, and a guard such as the forbidden-path check must still fire there.

Out of scope: deliberate forgery, such as a crafted tar that lies about its contents or an environment built to defeat the helper.

Residuals:
- `envValue`'s first-match rule (a FEAT-013 known bug, see Purpose).
- About 25 other test files prepend to PATH with a spread. They hand the object only to spawns, where Node keeps `PATH`, so they are left unchanged.
- A machine slower than the reference laptop may still need `NANA_TEST_TIMEOUT_MS`.

## Precedent

- `packages/nana-setup/tests/restore.test.mjs` — the archive check this lane fixes. Line 128 is the split, line 104 the forbidden list, line 152 the check. Its fixture guard (lines 131-139) already normalizes with `.split(path.sep).join("/")`.
- `packages/nana-setup/lib/state-manifest.mjs` — the `secret` and disposable store rows (lines 87-91) the forbidden list is derived from instead of a hand list.
- `packages/nana-pack/tests/pi-install.mjs` — line 44 already splits command output on `/\r?\n/`; M1 uses the same expression.
- `packages/nana-pack/lib/win-command.mjs` — `envValue` and `findOnPath`, the lookup the helper must feed; unchanged.
- `packages/nana-setup/lib/doctor.mjs` — line 681 documents the `Path`-outranks-`PATH` hazard.
- `packages/nana-setup/lib/install-check.mjs` — lines 333-336 hold the product's spelling-preserving env pattern, which the helper deliberately does not copy: it writes `PATH`, because the tests read `env.PATH`.
- `packages/nana-pack/tests/memory-run.test.mjs` — with `memory-run-recovery.test.mjs`, `memory-run-seals.test.mjs` and `memory-run-fixture.mjs`, an existing split of one suite into siblings over a shared fixture. Precedent for both splits.
- `packages/nana-pack/tests/profile-fixture.mjs` — the shared fixture both profile-store files keep importing.
- `packages/nana-pack/lib/test-runner-config.mjs` — found by `npm run map:search`. `RUN_ALONE` names `review-ledger.test.mjs` for its 1000 ms reservation window. It stays unchanged; the load-sensitive blocks stay in that file.
- `scripts/test.mjs` — found by `npm run map:search`. `TIMEOUT_MS` (line 89) reads `NANA_TEST_TIMEOUT_MS` for every file.
- `docs/known-bugs/FEAT-031.md` — the lines recording time-outs at land and suggesting "splitting that [renewal] section into its own file". This lane updates or removes them.

## Outside precedent

- Node.js `child_process` (MIT): the documented Windows rule that env keys are case-insensitive and the lexicographically first duplicate wins. **Borrow**: on win32, the helper removes every spelling of PATH and writes `PATH`, so in-process lookups and spawned children read the same value.
- libarchive bsdtar (BSD-2-Clause): **skip**. No code is taken, only the fact that its Windows listing ends lines with CRLF.

## Must-meet

Requirement rows R-3450 to R-3455 are added to the FEAT-031 table in `REQUIREMENTS.md` before the tests, each tagged `// req: R-nnnn` on its check. Every existing `// req:` tag moves with its check. Every `REQUIREMENTS.md` evidence cell that cites a moved check's `file::title` is updated to its new file, and so is `packages/nana-pack/README.md:689`.

- **M1 · R-3450** — WHEN the restore test reads tar's archive listing or the state listing, it shall split lines on CRLF or LF. Proves: the archive check compares names, not line endings. Pins:
  - A new check, "tar listings split on CRLF and LF", asserting the shared listing parser maps `"a\r\nb/\r\n"` and `"a\nb/\n"` both to `["a", "b"]`.
  - `restore.test.mjs` passing with **17 checks**, 0 failed, on the reference win32 laptop whose `tar` is the System32 bsdtar. Local run output goes in the lane folder.
- **M2 · R-3451** — The restore test's forbidden-archive guard shall compare slash-separated relative paths drawn from the state manifest's secret and disposable rows, so a forbidden path inside the archive fails the check on every platform. Proves: the guard can fire on Windows. Pins:
  - Line 152 and a new check, "a forbidden path in the archive listing is caught in slash form", call **one named function**. The new check feeds it the literal listing `".pi/agent/auth.json\r\n"`, parsed by M1's parser, and expects that name reported.
  - A mutated run on the reference win32 laptop, with the slash normalization removed, makes the new check FAIL. Its output is recorded in the lane folder.
- **M3 · R-3452** — WHEN a test hands an environment object with a prepended PATH folder to an in-process lookup (`findPi`, `findOnPath`, `stepPiRegister`, `diagnose`), it shall build it through `withPathPrepended`. On win32 the helper removes every letter-case spelling of PATH and writes the single key `PATH`; elsewhere it replaces only `PATH`. Proves: in-process lookups and spawned children see the same PATH. Pins, in a new `env-path.test.mjs`:
  - `withPathPrepended({ Path: "A", other: "x" }, "B", "win32")` returns keys whose PATH spellings are exactly `["PATH"]`, with value `B;A`, keeps `other`, and leaves the input unchanged.
  - The `"linux"` form keeps a distinct `Path` key untouched.
  - A source scan finds no `...process.env` spread with a `PATH:` key in `pi-launch-limits.test.mjs`, `pi-registration.test.mjs` or `win32-launch.test.mjs`. The scan runs on every OS.
- **M4 · R-3453** — WHERE the platform is win32 and the environment variable is spelled `Path`, `pi-launch-limits`, `pi-registration` and `win32-launch` shall select their own fixture pi. Proves: the #213 lookup failures are fixed at their cause. Pins:
  - The three files pass on the reference laptop (variable spelled `Path`, `%APPDATA%\npm\pi.cmd` present), with local run output in the lane folder.
  - An R-2021 doctor row reading the real pi's version is the failure this pins against.
- **M5 · R-3454** — profile-store's checks shall be split across files so that each file reports at most 240 s in one full `npm run test:locked` run on the reference Windows laptop, with every original check name run exactly once. Pins:
  - Before and after check-name lists, equal as multisets, recorded from the laptop **and** from one POSIX run (macOS seat or CI log).
  - The full run's file table is recorded in the lane folder.
  - Alone times are recorded as a secondary figure.
- **M6 · R-3455** — review-ledger's checks shall be split so that the run-alone `review-ledger.test.mjs` keeps every load-sensitive block named in O1, and every file reports at most 240 s in the same full run, with every original check name run exactly once. Pins:
  - Equal check-name multisets before and after, on the laptop and on one POSIX run. The POSIX run covers the §7 signal block (:806-831), which skips on win32.
  - For each moved block that inherited repo A's state (A3), A's `git rev-parse HEAD` and `git status --porcelain` at the block's entry, recorded before and after the split, are equal.
  - `RUN_ALONE` is unchanged.

Expected changes (a forecast, not a limit):
- tests: `restore.test.mjs`, `pi-launch-limits.test.mjs`, `pi-registration.test.mjs`, `win32-launch.test.mjs`, the new `env-path.mjs` and `env-path.test.mjs`, `profile-store.test.mjs` and the new `profile-store-guards.test.mjs`, `review-ledger.test.mjs` and the new fixture and pool files;
- `REQUIREMENTS.md` rows and evidence cells, `packages/nana-pack/README.md`, the code map if new test files need entries, `docs/known-bugs/FEAT-031.md` and `docs/known-bugs/FEAT-013.md`.
