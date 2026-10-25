# win-temp-check · must-meet of record (seat, 2026-10-24)

Feature: FEAT-006 · Launch builders with execution limits

Written by the seat from the planner's draft (`plan-draft.md`, this folder) and one adversary pass (`plan-attack.md`, this folder; 2 MUST, 4 SHOULD, 7 NOTE). The seat took the adversary's simpler fix (its item 3), which retires both MUSTs with the rows they targeted. Plans get no review round. Where this file and the draft differ, this file holds.

The owner's decision, 2026-10-24: "Both lanes", picking the Windows cleanup timing fix the seat offered after the hard-kill watcher's Windows check failed in three CI runs that day (R-2722 at 3b857ad1, R-2728 at 502767ca, R-2721 at 6ea795eb), each passing on re-run. The planner found the watcher sound and the tests too wide, so this lane changes tests, not the watcher; the seat tells the owner so.

Spend line: the current priority (since 2026-10-23) through lane reliability: each Windows first-try failure costs a CI re-run on every lane.

Stakes: low blast, reversible. Test-only; no product file changes.

Threat model: honest variation in our tools' output and environment is in scope (Windows file locks, slow or loaded runners, antivirus scans, PowerShell's own start-up files, process-kill timing); deliberate forgery is out.

## Root cause (planner and adversary, inferred, strongly supported)

The three failing tests check that the whole case temp folder is empty. That folder is also TEMP for pi-worker's Windows CPU sampler (pi-watchdog), which starts Windows PowerShell 5.1 on every poll; the tests run `--poll 0.2`. PowerShell writes `__PSScriptPolicyTest_<random>.ps1` and `.psm1` to TEMP at start and deletes them in a `finally` that a tree kill skips (Microsoft's App Control documentation names the files). Only the sampler starts PowerShell in the killed tree; no other writer puts files in the case folder. In R-2721 and R-2728 the directly launched builder had exited before removal began; R-2722's failing case ran its builder through cmd.exe, which the watcher does not wait for. No failure line named the leftover entry, so the entry is inferred.

## Seat decisions

- **Test-only fix (adversary item 3).** The killed pi-worker starts with `--poll 60`, longer than its 30-second ceiling, so pi-watchdog takes no CPU sample before the kill lands (its first timer is `min(poll, time left to the ceiling)`, and the ceiling check runs before the sample). The sites: `hardCase` on every platform (R-2720 and R-2721, one code path), both owners of the R-2722 loop, and R-2728's alpha only; R-2728's beta keeps `--poll 0.2`, because it is never killed and must keep its stall checks. R-2725 already kills a worker at `--poll 60` and has never failed. The strict whole-folder check stays, so the rows' titles stay true. The kill lands within about 13 s in `hardCase` and R-2722, and within 24 s at worst in R-2728, all before the ceiling.
- **Every judgement names what it saw (R-2803).** Each of the three checks records the sorted names left in the case folder, so a later failure shows whether a lane file, a PowerShell file or something else was left. If a `nana-lane-preamble-*` entry ever appears, the product leak is real and a product lane follows.
- **No tolerance pattern, no PowerShell probe test, no new contract value.** The draft's R-2803 and R-2805 and the adversary's MUSTs on them drop with the simpler fix.
- **Trade, named:** the tests no longer kill mid-sample, as many real Windows kills do (inferred), so a hard kill mid-sample can still leave PowerShell's two files in the user's temp folder. That stays a known bug.
- **The helper** is one small exported function in `packages/nana-pack/tests/process-tree-helper.mjs` beside the existing kill helpers (no new module, so no code map entry), replacing the private `tempEmpty`.

## Must-meet rows (FEAT-006; test file worker-claude.test.mjs)

- **R-2803.** The hard-kill temp check shall return, sorted, the name of every entry left in a case temp folder, file or folder, and report the folder empty only when it returns none. Test: `R-2803: the hard-kill temp check names every entry left in a case temp folder and calls it empty only when none is left` (every platform; a real planted folder). Red cases:
  - a folder holding a file and a subfolder returns one name, or unsorted names;
  - a folder holding only a `__PSScriptPolicyTest_lvnwlq0m.dy0.ps1` file is reported empty;
  - an empty folder returns a name or is reported non-empty;
  - a missing folder throws instead of returning empty.

The three hard-kill rows (R-2721, R-2722, R-2728) keep their text and tests. Their `--poll 60` start and their use of the helper show in the diff, with no row.

## Precedent

- `packages/nana-pack/tests/build-report.test.mjs` — R-2725's worker started at `--poll 60` and killed.
- `packages/nana-pack/tests/process-tree-helper.mjs` — the kill helpers the new function joins; its `powershell -NoProfile` start is the existing PowerShell use in tests.
- `packages/nana-pack/tests/worker-claude.test.mjs` — `tempEmpty`, `hardCase`, the R-2722 loop and the R-2728 block.
- `packages/nana-pack/bin/pi-watchdog.mjs` — the first sample at `min(poll, time left to the ceiling)`, read only.

No private helper moves to a shared module beyond `tempEmpty`'s replacement, which the three cases already share within one file.

## Class and builder

Ordinary: test files, REQUIREMENTS.md and one known-bug file; pi-worker is not on the AGENTS.md review ladder, and no product file changes. The small builder, one session. The Windows ruling binds: the seat pushes the draft pull request and reads its Windows suite leg before the final review. The seat runs wrong-code pairs before the final review.

## Known limits (the seat writes them before the final round)

- pi-watchdog's Windows CPU sampler, which pi-worker and pi-review share: a tree kill that lands mid-sample can leave PowerShell's two small policy-test files in the user's temp folder.
- The hard-kill tests no longer kill mid-sample, so they do not cover that case.
- The test's watcher wait counts 5 × 100 ms of removal retries where Node sleeps about 1.5 s per stuck entry; it did not cause the failures.
- The leftover entry in the three failures is inferred, not seen.
