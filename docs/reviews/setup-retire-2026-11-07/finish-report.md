# setup-retire — parts 4 and 5

Feature: FEAT-013 · Install and connect harness runtimes
Branch: `feat/setup-retire`. This record continues `5fe728ec`; prior parts and their evidence remain in `continuation-report.md`.

## Commits and files

- Part 4: `60e74835` — retire unused subagent seeds and doctor checks.
  - `packages/nana-setup/lib/steps.mjs`: stop both seed writers; call shared exact-byte retirement under the install lock.
  - `lib/uninstall.mjs`: export `retireSeed`, reuse it for current seeds and historical seed removal after settings preflight.
  - `lib/state-manifest.mjs`: separate `retiredSeedRows` from restorable state; drop vendor-package restore responsibility.
  - `lib/doctor.mjs`: remove all three delegation-runtime rows.
  - `lib/install-check.mjs` and `lib/install-check-config.mjs`: remove vendor install, retry, error-code reader and retry tunables.
  - Move the two historical byte references from `pi/` to `pi/retired/`; nothing seeds those files now.
  - Update `retired-artifacts`, `doctor-detail`, `doctor-fix-line`, `install-check`, `install`, `restore`, `state-manifest` and `uninstall` tests.
  - Update `REQUIREMENTS.md`, the map and `seeds-*.log` evidence.
- Part 5: this commit — docs, final tagged tests, artifact retirement and setup status.
  - `AGENTS.md`, root/pack/setup READMEs, both package descriptions and `templates/_shared/working-under-nana-pi.md`: describe active runtime surfaces, ignored legacy config and explicit project checks; remove required vendor installation.
  - `packages/nana-pack/tests/setup-retire.test.mjs`: add only M2 and M7.
  - `packages/nana-pack/tests/readme-check.test.mjs`: replace removed extension names with adoption in the existing surviving-functions oracle.
  - `packages/nana-pack/tests/code-map-launch.test.mjs`: name the two lost doctor-floor edges caused by removing the vendor installation and its test.
  - `packages/nana-setup/tests/fresh-machine.test.mjs`: retain every case, adjust checklist indexes, counts and titles for seven actions and remove only the retired vendor-version assertion.
  - `packages/nana-setup/lib/doctor.mjs`: clarify the remaining exported historical version as fixture compatibility only, not a runtime dependency.
  - `REQUIREMENTS.md`, `docs/requirements-tree.md`, `docs/code-map.md`, `docs/components/nana-pi.json` and this evidence folder.

## Rows and artifacts

All nine lane rows R-3799–R-3807 are implemented. M2's tagged test proves real discovery and absence of the retired extensions; the separate real install check proves the offline session and turn on this Mac. Windows is not claimed locally verified; its same install check remains in CI.

Part 4 retires R-360, R-361, R-362, R-363, R-364, R-366, R-367, R-368, R-369, R-370, R-371, R-2480, R-2481 and R-2486. R-1072 and R-2262 retain their surviving checklist and lock obligations. Part 5 narrows the checklist wording/evidence for R-950, R-951, R-1111, R-1850 and R-1970. No row is deleted or renumbered and no new ID is allocated.

A-002 remains retired from part 2. A-065 and A-066 are now retired; their doctor/uninstall cross-feature read lines are removed. Historical files are only exact-byte retirement references, not live produced artifacts. Setup returns from `partial` to its prior `sound` status, with no gap or anchors. Other components stay unchanged.

`finish-row-diff.log` lists the complete lane requirement diff, including every earlier retired row.

## Must-meet wrong-code pairs

| Must-meet | Wrong implementation and observed failure | Correct implementation and green evidence |
|---|---|---|
| M1 / R-3799 | Original active verifier install/doctor: `verifier-M1-wrong.log`, exit 1 | Retire managed wiring and owned link; doctor names install fix. Broad run and final seat checks. |
| M2 / R-3800 | Restore a discoverable `nana-notify.ts` stub: `finish-M2-M7-wrong.log`, M2 fails, exit 1 | Stub removed; real discovery loads eight active pack extensions; `finish-precommit-fixed.log`, exit 0; real `finish-install-check.log`, exit 0. |
| M3 / R-3801 | Original handoff producer obeyed retired `handoff.enabled`: `handoff-wrong.log`, exit 1 | Adoption-only extension uses user journal; canonical root/day, subdirectory, 25-hour repeat and adopted-root silence: final discovery test green. |
| M4 / R-3802 | Predicate returns null: `verifier-M4-wrong.log`, exit 1 | Restore exact predicate and existing gate suites. `finish-gate-unchanged.log` is empty, diff exit 0. |
| M5 / R-3803 | Original installer still creates seeds and checks vendor: `seeds-baseline-wrong.log`, M5 fails, exit 1 | No new seed files, exact historical seeds removed, no doctor rows or install-check retries: `seeds-green.log`, exit 0. |
| M6 / R-3804 | Original handoff config schema/returned block: `handoff-wrong.log`, exit 1 | Ignore valid/malformed legacy blocks in both scopes without notices or gate fallback: discovery suite green. |
| M7 / R-3805 | Original active docs/artifact/component claims: `finish-M2-M7-wrong.log`, M7 fails, exit 1 | Active docs, retired contracts/artifacts, sound setup, read-only contract checks: `finish-precommit-fixed.log`, exit 0. |
| M8 / R-3806 | Delete occupied old seed paths before seeding: `seeds-M8-wrong.log`, M8 loses edited config, exit 1 | Exact regular-file bytes only; edited marked, foreign, leaf links/targets and linked parents remain through dry/real install and POSIX uninstall: `seeds-green.log`, exit 0. |
| M9 / R-3807 | Skip verifier retirement helper: `verifier-M9-wrong.log`, exit 1 | Direct old-home uninstall removes unchanged historical seeds and managed wiring; install removes released shell/exec forms without changing siblings: `seeds-green.log`, exit 0. |

No assertion was inverted. No new sealed tunable was introduced. Historical source bytes keep their LF identity; edited fixtures include CRLF, trailing spaces/tabs and no final newline. Production retirement compares bytes, not parsed lines.

## Retirement inventory and surviving test edits

The report appendix `retired-cases.json` lists all 402 removed or updated declarations across this lane, with file, literal/dynamic title and original `req:` rows. Untagged declarations have an empty row list. `finish-deleted-files.log` lists every deleted path. No whole test file is deleted by parts 4–5; the earlier whole-file deletions remain authorized and recorded in the earlier reports. Earlier retained pi-predicate cases and adoption cases remain in surviving files.

Part 4 removes only these cases from mixed files:

- `doctor-detail.test.mjs`: subagent seed keys, missing/invalid/wrong-key config, read-only config, false/default async, reviewer absent/unmarked/marked/misplaced marker, vendor floor/version/absence. Rows R-361, R-362, R-364, R-366–R-371; untagged async/healthy/marked controls. MCP and all other cases remain.
- `install.test.mjs`: absent subagent seed; absent reviewer byte match; independent reviewer frontmatter; existing subagent config; existing reviewer preservation. Rows R-360/R-363. The now-unused independent frontmatter parser is removed.
- `install-check.test.mjs`: vendor checklist install (R-1072 retains its objective/PATH case); retry success/seal, per-attempt notes, timeout-no-retry (R-2480/R-2481/R-2486). The active Windows launch case drops only the removed vendor invocation and expects two remaining list/session invocations, not three.

Existing surviving cases changed only where retirement invalidates their setup/oracle:

- `doctor-fix-line`: replace missing vendor with invalid MCP config for both by-hand summary assertions; keep the same failure/remedy and warning assertions (R-1991/R-1996).
- `restore`: remove the two retired seeds and vendor manifest from non-durable fixture stores; all restore cases remain.
- `state-manifest`: remove retired seed tuples/installed targets; exclude the three historical layout-only paths from current-state coverage. All state and archive safety cases remain.
- `uninstall`: use `retiredSeedRows`/historical source for the same edited-seed, malformed-settings, write-race and lock-failure cases. All assertions remain.
- Existing M9: point old-home source fixtures at historical byte references.
- `fresh-machine`: shift objective/trust steps after removing the vendor step; counts become seven, Node/pi version pins remain.
- `readme-check`: surviving-functions oracle now names adoption instead of the removed post-edit/handoff functions.
- `code-map-launch`: explicit loss reasons for removed vendor-floor imports in runtime and test.

The complete prior test edits and deleted-case inventories remain in `notify-retirement.md`, `post-edit-retirement.md` and `continuation-report.md`. `finish-removed-text-scan.log` searches every remaining test for every deleted filename/full path and each removed documentation sentence. Remaining matches are compatibility tests, retirement absence assertions, historical references and explicit lost-edge reasons; no live reader of deleted code remains.

## Precedent and departures

All four brief-named precedent files were read completely before implementation. The hook retirement follows `seat-pull-off.test.mjs`; seed creation is removed from the existing sequencer. Exact-byte edited-seed preservation comes from `uninstall.mjs`: its existing logic is now public `retireSeed`, used by uninstall and imported by install, never copied. Adoption extension and pi gate code remain unchanged in these two parts.

Departures:

- Retain historical seed bytes under `pi/retired/` rather than deleting the only comparison source. Direct uninstall after updating must safely recognize old unchanged seeds without a missing-source exception; a marker or parsed JSON equality would delete owner edits. These files are not discoverable agent definitions and are never seeded.
- Keep the historical `PI_SUBAGENTS_FLOOR` export solely for unchanged existing test-home fixtures. No production checker or install uses it. Removing it would force unrelated fixture rewrites with no runtime benefit.
- Keep the setup README's detailed predicate description explicitly pi-only so the surviving R-2354/R-2356 documentation checks remain unchanged.

## Checks and failures corrected

- `seeds-green.log`: npm touched tests, 12 files, zero failures. `seeds-runner.log`: test-runner checks, exit 0.
- `finish-broad-first.log`: 99 files; 95 passed, three failed, one platform skip; 3337 checks passed, four failed. Corrected failures were two missing map-loss reasons, the obsolete surviving-extension list, and setup's missing pi-only predicate description. The last two were fixed before `finish-precommit-tests.log`; the remaining map edge before `finish-precommit-fixed.log`.
- `finish-broad-green.log`: completed 99-file run, 98 PASS, zero failures, one platform skip; 3341 passing checks and 20 skips, exit 0.
- `finish-green.log`: final precommit seven-file run passes every case, exit 0.
- `finish-precommit-tests.log`: six of seven files passed; the sole remaining map edge was then named. `finish-precommit-fixed.log`: both code-map-launch and all five must-meet wrapper cases pass.
- `finish-checks.log`: map generation/check, requirement tree, README check and component audit, all exit 0.
- `finish-title-check.log`: requirement rail succeeds; `title check: 0 missing`.
- `finish-runner.log`: `node scripts/test.mjs test-runner`, exit 0.
- `finish-install-check.log`: real macOS install check, exit 0; 15 PASS lines, including pi session, pi turn, doctor, offline review/build and README rehearsal. No vendor installation/retry line remains.
- An initial broad setup test command hit the outer 300-second shell limit; the later 900-second broad run completed. A direct-node restore run reproduced the documented npm-prefix failure; running through npm passed all 17 cases. No production fix outside the plan was made.
- The first one-off title/inventory import used stdin's `-` argv and hit the shim's realpath guard. Re-running with that argv unset succeeded; no repository code was changed.

All named checks are repeated on the final commit and their exact results/tip are returned in the final report. The complete local full suite is delegated to CI by `AGENTS.md`; no full-suite run or lock is claimed. No lint/type script exists at the root; README/map/trace checks and the touched tests are the repository's applicable checks here.

## Known bugs touched and limits

Read all of `docs/known-bugs/FEAT-013.md` (216 lines) before this assessment; the file stays untouched.

- Retiring the managed Claude verifier wiring removes the verifier-specific carried-form/move/deduplication behavior discussed in the Windows hook-settings known-bug lines. Foreign/customized entries remain intentionally preserved; active SessionStart shape limits are not fixed.
- Removing vendor installation and doctor rows retires setup's pi-subagents version coupling and its install-check proof line. It does not validate third-party completion wakes or bridge behavior, and does not alter any already installed vendor package.
- Direct-node restore's npm-prefix failure was reproduced and left unchanged; npm runs pass.
- Retired-hook identity still uses the existing shared real-path machinery; the unproven alternate-spelling mutation coverage remains unproven. No new checkout-spelling claim is made.
- Hook deadlines, knowledge churn, UTC backup dating, Windows skill-copy limits and all other known bugs remain outside this plan and unchanged.

Not done: native Windows/Linux execution, push, CI read/wait, full local suite, any live model call, subagent launch or GitHub issue operation. The install check uses only its existing offline fixture model. No stored credential was read or used. No session archive, HANDOFF or known-bug file was edited. No unresolved scope question remains.
