# Independent check — post-edit-values-named at 493717df (2026-10-20)

VERDICT: HOLDS

The private copy is at <tmp> It has two checkouts: lane at 493717df and main at c7f582ad. Every probe ran under a temp HOME and TMPDIR. Nothing was written to the worktree, <repo>, ~/.pi or ~/.claude.

PROBES
1. Must-meet file on macOS: `HOME=$P/home TMPDIR=$P/tmp node --experimental-strip-types packages/nana-pack/tests/post-edit-values-named.test.mjs`
   - Output: 6 PASS (R-2210 to R-2215), exit 0, 0.5 s. `ls $P/tmp` was empty afterwards, so the temp folders were cleaned up.
   - Verdict: holds.
2. Main and lane give the same model-visible text: `node probe.mjs $P/lane` and `node probe.mjs $P/main`, then `diff out-main.jsonl out-lane.jsonl`
   - Setup: the real extension, loaded through the installed pi 1.0.2's own jiti loader and pi's real file queue, with the real values.
   - Output: `IDENTICAL model-visible text` across six cases:
     - 7909-char output with emoji and newlines: `exited 2 (output truncated: last 2000 of 7909 chars shown)`
     - 678-char command: `(command truncated: first 400 of 678 chars shown) exited 3`
     - 1.6 MiB output: `could not run (output truncated: last 2000 of 1048576 chars shown)`
     - real EACCES lock refusal on a long path: `did not run — could not lock …`, status `post-edit – skipped (lock)`
     - SIGTERM-ignoring checker: `did not complete (timed out)`
     - passing check: no feedback, status `post-edit ✓ 1 check`
   - Verdict: holds; no behaviour change at the sealed values.
3. Kill grace in real use: a SIGTERM-ignoring checker with `timeoutMs: 500`.
   - Output: `term-case settled in 2506ms` on main and `term-case settled in 2505ms` on the lane (500 ms deadline plus 2000 ms grace).
   - Verdict: holds.
4. Forced win32 run: `comspec=/bin/sh TEMP=$P/tmp node --import force-win32.mjs … post-edit-values-named.test.mjs`
   - Setup: process.platform set to win32 and taskkill absent, so the code takes the win32 kill path.
   - Output: 5 PASS, including R-2210, whose timers were [300, 1234] on the win32 kill path. 1 FAIL on R-2213: `could not run` instead of `exited 1`.
   - Cause of the FAIL: `cmdCouldNotRun` splits PATH on `;` and cannot find `node` on a macOS PATH. A direct call shows this:
     - with node.EXE on a Windows-style PATH: `cmdCouldNotRun(...) → false`
     - with node absent: `→ true`
   - Verdict: holds. The R-2213 FAIL comes from the simulation, not the lane.
5. Real pi load: `printf '{"type":"get_state"}' | HOME=$P/home2 pi --mode rpc -ne -e $P/lane/packages/nana-pack/extensions/nana-post-edit.ts`
   - Output: `"command":"get_state","success":true`, stderr 0 bytes.
   - Negative control: a copy with the config import renamed exits 1 with `Failed to load extension … Cannot find module '../lib/post-edit-config-MISSING.mjs'`.
   - Verdict: holds; the extension loads in pi 1.0.2.
6. Neighbouring post-edit test files, run one at a time on the lane:

   | File | PASS | SKIP | Exit |
   |---|---|---|---|
   | post-edit-file-queue (pi's real loader) | 5 | 0 | 0 |
   | post-edit-hardening | 22 | 1 | 0 |
   | display-surfaces | 181 | 0 | 0 |
   | post-edit-status | 32 | 1 | 0 |
   | post-edit-default-timeout | 2 | 0 | 0 |
   | post-edit-utf8 | 4 | 0 | 0 |

   - Verdict: holds; matches the plan's counts.
7. Retuning the kill grace (private clone only): `POST_EDIT_KILL_GRACE_MS = 3000`, then hardening and the must-meet file.
   - Hardening: 22 PASS, with settle times 3314, 3310, 3003 and 3306 ms, so the new value is actually used.
   - Must-meet file: 5 PASS and 1 FAIL, `seal: … {"grace":3000,…}` (R-2215).
   - Verdict: holds; retuning needs no other code change and the seal names the row.
8. Retuning the failure cap (private clone only): `POST_EDIT_FAILURE_CAP = 1500`, then display-surfaces.
   - Output: 180 PASS and 1 FAIL, `post-edit: a truncated failure says so, and keeps the TAIL` (req R-087).
   - Verdict: holds; the contract value stays pinned.
9. Repo checks:
   - `node scripts/code-map.mjs --check`: 345 modules, 0 problems.
   - `node scripts/readme-check.mjs`: 720 claims, 0 problems.
   - `requirements-moved.mjs --base c7f582ad`: R-2210 to R-2215 new (implemented).
   - A search for the old names (MAX_OUTPUT, KILL_GRACE_MS, FAILURE_CAP, CMD_CAP) finds only the frozen bench fixture and the unrelated `KILL_GRACE_MS` in scripts/test.mjs. Nothing else reads the removed constants.
   - Verdict: holds.

FINDINGS
No MUST findings. The change causes no data loss and writes nothing outside temp folders. It does not break install, hook or gate, opens no fail-open, and breaks nothing main does today.

Known limits (not findings):
- K1, status: the R-2210 check expects exactly [300, grace] timers. Real Windows proof comes only from CI. Lane CI run 39409212100 was `in_progress` at check time; the forced-win32 probe passed R-2210.
- K2, test fragility: during the timeout case, R-2210 records every `setTimeout` in the process. A future Node or pi that arms a timer inside spawn or the dynamic import would turn it red without a product change. It passes today on macOS and on the forced win32 path.
